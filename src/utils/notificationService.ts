import type { Subscription } from '../types/subscription';

export interface NotificationSettings {
  enabled: boolean;
  daysBeforeRenewal: number[];
  quiet: boolean;
  quietStart: string;
  quietEnd: string;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  daysBeforeRenewal: [7, 3, 1],
  quiet: false,
  quietStart: '22:00',
  quietEnd: '08:00',
};

class NotificationService {
  private permission: NotificationPermission = 'default';
  private settings: NotificationSettings = DEFAULT_NOTIFICATION_SETTINGS;
  private intervalId: number | null = null;

  constructor() {
    this.loadSettings();
    this.checkPermission();
    
    // Listen for settings changes from the Settings page
    window.addEventListener('notification-settings-changed', () => {
      this.loadSettings();
      console.log('Notification settings reloaded:', this.settings);
      
      // Restart monitoring if settings changed
      if (this.intervalId) {
        this.stopMonitoring();
        if (this.settings.enabled) {
          this.startMonitoring();
        }
      }
    });
  }

  private loadSettings(): void {
    const stored = localStorage.getItem('subtrack-notification-settings');
    if (stored) {
      this.settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(stored) };
    }
  }

  private saveSettings(): void {
    localStorage.setItem('subtrack-notification-settings', JSON.stringify(this.settings));
  }

  private async checkPermission(): Promise<void> {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();

    if (this.settings.enabled) {
      this.startMonitoring();
    } else {
      this.stopMonitoring();
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  private isQuietTime(): boolean {
    if (!this.settings.quiet) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [quietStartHour, quietStartMin] = this.settings.quietStart.split(':').map(Number);
    const [quietEndHour, quietEndMin] = this.settings.quietEnd.split(':').map(Number);
    
    const quietStart = quietStartHour * 60 + quietStartMin;
    const quietEnd = quietEndHour * 60 + quietEndMin;

    if (quietStart > quietEnd) {
      // Quiet time spans midnight
      return currentTime >= quietStart || currentTime <= quietEnd;
    } else {
      return currentTime >= quietStart && currentTime <= quietEnd;
    }
  }

  private getDaysUntilRenewal(renewalDate: Date): number {
    const now = new Date();
    const renewal = new Date(renewalDate);
    const diffTime = renewal.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getNotificationKey(subscriptionId: string, daysUntil: number): string {
    const today = new Date().toISOString().split('T')[0];
    return `notification-${subscriptionId}-${daysUntil}-${today}`;
  }

  private hasNotificationBeenSent(subscriptionId: string, daysUntil: number): boolean {
    const key = this.getNotificationKey(subscriptionId, daysUntil);
    return localStorage.getItem(key) !== null;
  }

  private markNotificationSent(subscriptionId: string, daysUntil: number): void {
    const key = this.getNotificationKey(subscriptionId, daysUntil);
    localStorage.setItem(key, 'sent');
  }

  private showNotification(subscription: Subscription, daysUntil: number): void {
    if (this.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }
    
    if (this.isQuietTime()) {
      console.log('Skipping notification during quiet hours');
      return;
    }

    console.log(`Showing notification for ${subscription.name}, ${daysUntil} days until renewal`);

    const title = daysUntil === 0 
      ? `${subscription.name} renews today!`
      : daysUntil === 1
      ? `${subscription.name} renews tomorrow`
      : `${subscription.name} renews in ${daysUntil} days`;

    const body = `Payment of ${this.formatCurrency(subscription.price, subscription.currency)} will be charged`;

    const notification = new Notification(title, {
      body,
      icon: '/icon-192x192.png', // You'll need to add this icon
      badge: '/icon-192x192.png',
      tag: `subscription-${subscription.id}-${daysUntil}`,
      requireInteraction: daysUntil <= 1
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = '/subscriptions';
      notification.close();
    };

    // Auto-close after 10 seconds for non-critical notifications
    if (daysUntil > 1) {
      setTimeout(() => notification.close(), 10000);
    }
  }

  checkSubscriptions(subscriptions: Subscription[]): void {
    if (!this.settings.enabled || this.permission !== 'granted') {
      return;
    }

    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');

    for (const subscription of activeSubscriptions) {
      const daysUntil = this.getDaysUntilRenewal(subscription.renewalDate);
      
      if (this.settings.daysBeforeRenewal.includes(daysUntil)) {
        if (!this.hasNotificationBeenSent(subscription.id, daysUntil)) {
          this.showNotification(subscription, daysUntil);
          this.markNotificationSent(subscription.id, daysUntil);
        }
      }
    }
  }

  startMonitoring(): void {
    this.loadSettings(); // Ensure we have latest settings
    this.stopMonitoring();
    
    if (!this.settings.enabled) {
      console.log('Notifications disabled, not starting monitoring');
      return;
    }
    
    console.log('Starting notification monitoring with settings:', this.settings);
    
    // Check every hour
    this.intervalId = window.setInterval(() => {
      // This will be called from the component that has access to subscriptions
      window.dispatchEvent(new CustomEvent('check-notifications'));
    }, 60 * 60 * 1000);

    // Check immediately
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('check-notifications'));
    }, 1000);
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  // Clean up old notification markers (call this periodically)
  cleanupOldNotifications(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('notification-'));
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    keys.forEach(key => {
      const parts = key.split('-');
      const dateStr = parts[parts.length - 1];
      if (dateStr < yesterdayStr) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const notificationService = new NotificationService();
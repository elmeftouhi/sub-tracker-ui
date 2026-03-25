import type { Subscription } from '../types/subscription';

class CancelReminderService {
  private checkInterval: number | null = null;

  startMonitoring() {
    // Check for cancellation reminders every hour
    this.checkInterval = window.setInterval(() => {
      this.checkCancelReminders();
    }, 60 * 60 * 1000); // 1 hour

    // Also check immediately on start
    this.checkCancelReminders();
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkCancelReminders() {
    try {
      const { db } = await import('./database');
      const subscriptions = await db.subscriptions
        .where('status')
        .equals('active')
        .toArray();

      for (const subscription of subscriptions) {
        if (this.shouldShowCancelReminder(subscription)) {
          this.showCancelReminder(subscription);
        }
      }
    } catch (error) {
      console.error('Error checking cancel reminders:', error);
    }
  }

  private shouldShowCancelReminder(subscription: Subscription): boolean {
    if (!subscription.cancelReminder?.enabled) return false;

    const renewalDate = new Date(subscription.renewalDate);
    const today = new Date();
    const daysPastDue = Math.floor((today.getTime() - renewalDate.getTime()) / (1000 * 60 * 60 * 24));

    // Show reminder exactly on the specified day after due date
    return daysPastDue === subscription.cancelReminder.daysAfterDue;
  }

  private showCancelReminder(subscription: Subscription) {
    const title = '🔔 Cancellation Reminder';
    const message = `Consider canceling "${subscription.name}" - it's been ${subscription.cancelReminder?.daysAfterDue} days since renewal.`;
    
    // Use browser notification API directly since we need custom options
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        tag: `cancel-reminder-${subscription.id}`,
        icon: '/notification-icon.png',
        requireInteraction: true
      });
    }

    // Also log to console for debugging
    console.log(`🔔 Cancel reminder for ${subscription.name}: ${message}`);
  }

  // Get active cancel reminders for dashboard display
  async getActiveCancelReminders(): Promise<Array<Subscription & { reminderMessage: string }>> {
    try {
      const { db } = await import('./database');
      const subscriptions = await db.subscriptions
        .where('status')
        .equals('active')
        .toArray();

      const activeReminders = subscriptions
        .filter(sub => {
          if (!sub.cancelReminder?.enabled) return false;
          
          const renewalDate = new Date(sub.renewalDate);
          const today = new Date();
          const daysPastDue = Math.floor((today.getTime() - renewalDate.getTime()) / (1000 * 60 * 60 * 24));
          
          return daysPastDue >= sub.cancelReminder.daysAfterDue;
        })
        .map(sub => {
          const renewalDate = new Date(sub.renewalDate);
          const today = new Date();
          const daysPastDue = Math.floor((today.getTime() - renewalDate.getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            ...sub,
            reminderMessage: `${daysPastDue} days past due - consider canceling`
          };
        });

      return activeReminders;
    } catch (error) {
      console.error('Error getting active cancel reminders:', error);
      return [];
    }
  }

  // Get upcoming cancel reminders (within next 7 days)
  async getUpcomingCancelReminders(): Promise<Array<Subscription & { daysUntilReminder: number }>> {
    try {
      const { db } = await import('./database');
      const subscriptions = await db.subscriptions
        .where('status')
        .equals('active')
        .toArray();

      const upcomingReminders = subscriptions
        .filter(sub => {
          if (!sub.cancelReminder?.enabled) return false;
          
          const renewalDate = new Date(sub.renewalDate);
          const today = new Date();
          const daysPastDue = Math.floor((today.getTime() - renewalDate.getTime()) / (1000 * 60 * 60 * 24));
          const daysUntilReminder = sub.cancelReminder.daysAfterDue - daysPastDue;
          
          return daysUntilReminder > 0 && daysUntilReminder <= 7;
        })
        .map(sub => {
          const renewalDate = new Date(sub.renewalDate);
          const today = new Date();
          const daysPastDue = Math.floor((today.getTime() - renewalDate.getTime()) / (1000 * 60 * 60 * 24));
          const daysUntilReminder = sub.cancelReminder!.daysAfterDue - daysPastDue;
          
          return {
            ...sub,
            daysUntilReminder
          };
        });

      return upcomingReminders;
    } catch (error) {
      console.error('Error getting upcoming cancel reminders:', error);
      return [];
    }
  }
}

export const cancelReminderService = new CancelReminderService();
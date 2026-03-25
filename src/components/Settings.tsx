import { useState, useEffect } from 'react';
import { CreditCard, Bell, Tag, DollarSign, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

// Notification hooks with proper state management
const useNotificationSettings = () => {
  const [settings, setSettings] = useState(() => {
    const stored = localStorage.getItem('subtrack-notification-settings');
    return stored ? JSON.parse(stored) : {
      enabled: true,
      daysBeforeRenewal: [7, 1],
      quiet: false,
      quietStart: '22:00',
      quietEnd: '08:00'
    };
  });

  const updateSettings = (newSettings: any) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('subtrack-notification-settings', JSON.stringify(updatedSettings));
    // Trigger notification settings changed event
    window.dispatchEvent(new Event('notification-settings-changed'));
  };

  return [settings, updateSettings] as const;
};

const useNotificationPermission = (): [NotificationPermission, boolean, () => Promise<boolean>] => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const requestPermission = async (): Promise<boolean> => {
    if (typeof Notification === 'undefined') return false;
    
    setIsRequestingPermission(true);
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      return permission === 'granted';
    } finally {
      setIsRequestingPermission(false);
    }
  };

  return [permissionStatus, isRequestingPermission, requestPermission];
};

// Types for settings
interface CreditCard {
  id: string;
  name: string;
  lastFour: string;
  type: 'visa' | 'mastercard' | 'amex' | 'discover';
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

interface Bank {
  id: string;
  name: string;
  accountName: string;
  accountLastFour: string;
  isDefault: boolean;
}

interface SettingsData {
  creditCards: CreditCard[];
  banks: Bank[];
  categories: string[];
  currencies: string[];
  defaultCurrency: string;
}

const CARD_TYPES = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'amex', label: 'American Express' },
  { value: 'discover', label: 'Discover' }
];

const DEFAULT_CATEGORIES = [
  'Streaming',
  'Software',
  'Gaming',
  'Music',
  'Productivity',
  'Cloud Storage',
  'VPN',
  'News',
  'Education',
  'Health & Fitness',
  'Other'
];

const DEFAULT_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK'];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [settings, setSettings] = useState<SettingsData>({
    creditCards: [],
    banks: [],
    categories: DEFAULT_CATEGORIES,
    currencies: DEFAULT_CURRENCIES,
    defaultCurrency: 'USD'
  });
  
  // Notification settings
  const [notificationSettings, updateNotificationSettings] = useNotificationSettings();
  const [permissionStatus, isRequestingPermission, requestPermission] = useNotificationPermission();
  
  // Edit states
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [newCard, setNewCard] = useState<Partial<CreditCard>>({});
  const [newBank, setNewBank] = useState<Partial<Bank>>({});
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editingBank, setEditingBank] = useState<string | null>(null);
  const [editCardData, setEditCardData] = useState<Partial<CreditCard>>({});
  const [editBankData, setEditBankData] = useState<Partial<Bank>>({});
  
  // Confirmation dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('subtrack-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(prev => ({ ...prev, ...parsed }));
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: SettingsData) => {
    localStorage.setItem('subtrack-settings', JSON.stringify(newSettings));
    setSettings(newSettings);
  };

  // Credit Card Management
  const addCreditCard = () => {
    if (!newCard.name || !newCard.lastFour || !newCard.type || !newCard.expiryMonth || !newCard.expiryYear) {
      return;
    }

    const card: CreditCard = {
      id: Date.now().toString(),
      name: newCard.name,
      lastFour: newCard.lastFour,
      type: newCard.type as CreditCard['type'],
      expiryMonth: newCard.expiryMonth,
      expiryYear: newCard.expiryYear,
      isDefault: settings.creditCards.length === 0
    };

    const newSettings = {
      ...settings,
      creditCards: [...settings.creditCards, card]
    };
    saveSettings(newSettings);
    setNewCard({});
    setIsAddingCard(false);
  };

  const deleteCreditCard = (id: string) => {
    const card = settings.creditCards.find(c => c.id === id);
    if (!card) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Credit Card',
      message: `Are you sure you want to delete the credit card "${card.name}" ending in ${card.lastFour}?`,
      onConfirm: () => {
        const newSettings = {
          ...settings,
          creditCards: settings.creditCards.filter(card => card.id !== id)
        };
        saveSettings(newSettings);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      onCancel: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
    });
  };

  const startEditCard = (card: CreditCard) => {
    setEditingCard(card.id);
    setEditCardData({ ...card });
  };

  const saveEditCard = () => {
    if (!editingCard || !editCardData.name || !editCardData.lastFour || !editCardData.type || !editCardData.expiryMonth || !editCardData.expiryYear) {
      return;
    }

    const newSettings = {
      ...settings,
      creditCards: settings.creditCards.map(card => 
        card.id === editingCard 
          ? { ...card, ...editCardData }
          : card
      )
    };
    saveSettings(newSettings);
    setEditingCard(null);
    setEditCardData({});
  };

  const cancelEditCard = () => {
    setEditingCard(null);
    setEditCardData({});
  };

  const setDefaultCard = (id: string) => {
    const newSettings = {
      ...settings,
      creditCards: settings.creditCards.map(card => ({
        ...card,
        isDefault: card.id === id
      }))
    };
    saveSettings(newSettings);
  };

  // Bank Management
  const addBank = () => {
    if (!newBank.name || !newBank.accountName || !newBank.accountLastFour) {
      return;
    }

    const bank: Bank = {
      id: Date.now().toString(),
      name: newBank.name,
      accountName: newBank.accountName,
      accountLastFour: newBank.accountLastFour,
      isDefault: settings.banks.length === 0
    };

    const newSettings = {
      ...settings,
      banks: [...settings.banks, bank]
    };
    saveSettings(newSettings);
    setNewBank({});
    setIsAddingBank(false);
  };

  const deleteBank = (id: string) => {
    const bank = settings.banks.find(b => b.id === id);
    if (!bank) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Bank Account',
      message: `Are you sure you want to delete the bank account "${bank.name} - ${bank.accountName}"?`,
      onConfirm: () => {
        const newSettings = {
          ...settings,
          banks: settings.banks.filter(bank => bank.id !== id)
        };
        saveSettings(newSettings);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      onCancel: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
    });
  };

  const startEditBank = (bank: Bank) => {
    setEditingBank(bank.id);
    setEditBankData({ ...bank });
  };

  const saveEditBank = () => {
    if (!editingBank || !editBankData.name || !editBankData.accountName || !editBankData.accountLastFour) {
      return;
    }

    const newSettings = {
      ...settings,
      banks: settings.banks.map(bank => 
        bank.id === editingBank 
          ? { ...bank, ...editBankData }
          : bank
      )
    };
    saveSettings(newSettings);
    setEditingBank(null);
    setEditBankData({});
  };

  const cancelEditBank = () => {
    setEditingBank(null);
    setEditBankData({});
  };

  const setDefaultBank = (id: string) => {
    const newSettings = {
      ...settings,
      banks: settings.banks.map(bank => ({
        ...bank,
        isDefault: bank.id === id
      }))
    };
    saveSettings(newSettings);
  };

  // Category Management
  const addCategory = () => {
    if (!newCategory.trim() || settings.categories.includes(newCategory.trim())) {
      return;
    }

    const newSettings = {
      ...settings,
      categories: [...settings.categories, newCategory.trim()]
    };
    saveSettings(newSettings);
    setNewCategory('');
    setIsAddingCategory(false);
  };

  const deleteCategory = (category: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete the category "${category}"? This action cannot be undone.`,
      onConfirm: () => {
        const newSettings = {
          ...settings,
          categories: settings.categories.filter(cat => cat !== category)
        };
        saveSettings(newSettings);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      onCancel: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
    });
  };

  const updateCategory = (oldCategory: string, newCategoryName: string) => {
    if (!newCategoryName.trim() || settings.categories.includes(newCategoryName.trim())) {
      setEditingCategory(null);
      return;
    }

    const newSettings = {
      ...settings,
      categories: settings.categories.map(cat => 
        cat === oldCategory ? newCategoryName.trim() : cat
      )
    };
    saveSettings(newSettings);
    setEditingCategory(null);
  };

  // Currency Management
  const addCurrency = (currency: string) => {
    if (!settings.currencies.includes(currency)) {
      const newSettings = {
        ...settings,
        currencies: [...settings.currencies, currency].sort()
      };
      saveSettings(newSettings);
    }
  };

  const removeCurrency = (currency: string) => {
    if (currency === settings.defaultCurrency) return;
    
    const newSettings = {
      ...settings,
      currencies: settings.currencies.filter(c => c !== currency)
    };
    saveSettings(newSettings);
  };

  const setDefaultCurrency = (currency: string) => {
    const newSettings = {
      ...settings,
      defaultCurrency: currency
    };
    saveSettings(newSettings);
  };

  // Notification handlers
  const handlePermissionRequest = async () => {
    const granted = await requestPermission();
    if (!granted) {
      alert('Please enable notifications in your browser settings to receive subscription reminders.');
    }
  };

  const handleSettingsChange = (changes: Partial<typeof notificationSettings>) => {
    updateNotificationSettings(changes);
  };

  const handleDaysChange = (day: number, checked: boolean) => {
    const currentDays = notificationSettings.daysBeforeRenewal;
    const newDays = checked
      ? [...currentDays, day].sort((a, b) => b - a)
      : currentDays.filter((d: number) => d !== day);
    
    updateNotificationSettings({ daysBeforeRenewal: newDays });
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'cards', label: 'Credit Cards', icon: CreditCard },
    { id: 'banks', label: 'Banks', icon: DollarSign },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'currencies', label: 'Currencies', icon: DollarSign }
  ];

  return (
    <>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your subscription tracking preferences</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-2 sm:space-x-8 px-4 sm:px-6 overflow-x-auto scrollbar-hide" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 flex-shrink-0`}
                  >
                    <Icon size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline sm:inline">{tab.label}</span>
                    <span className="xs:hidden sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2>
                
                {/* Browser Permission Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        permissionStatus === 'granted' ? 'bg-green-400' : 
                        permissionStatus === 'denied' ? 'bg-red-400' : 'bg-yellow-400'
                      }`} />
                      <span className="text-sm text-gray-600">
                        {permissionStatus === 'granted' && 'Notifications enabled'}
                        {permissionStatus === 'denied' && 'Notifications blocked'}
                        {permissionStatus === 'default' && 'Permission not requested'}
                      </span>
                    </div>
                    
                    {permissionStatus !== 'granted' && (
                      <button
                        onClick={handlePermissionRequest}
                        disabled={isRequestingPermission || permissionStatus === 'denied'}
                        className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                      >
                        {permissionStatus === 'denied' ? 'Enable in browser settings' : 'Enable'}
                      </button>
                    )}
                  </div>
                  
                  {permissionStatus === 'denied' && (
                    <p className="text-xs text-gray-500 mt-2">
                      Notifications have been blocked. Enable them in your browser settings for this site.
                    </p>
                  )}
                </div>

                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                  <label htmlFor="notifications-enabled" className="text-sm font-medium text-gray-900">
                    Enable Notifications
                  </label>
                  <input
                    type="checkbox"
                    id="notifications-enabled"
                    checked={notificationSettings.enabled}
                    onChange={(e) => handleSettingsChange({ enabled: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {/* Days Before Renewal */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Notify me before renewal</h3>
                  <div className="space-y-2">
                    {[7, 3, 1, 0].map(day => (
                      <label key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notificationSettings.daysBeforeRenewal.includes(day)}
                          onChange={(e) => handleDaysChange(day, e.target.checked)}
                          disabled={!notificationSettings.enabled}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          {day === 0 ? 'On the day of renewal' : 
                           day === 1 ? '1 day before' : 
                           `${day} days before`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Quiet Hours */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="quiet-hours" className="text-sm font-medium text-gray-900">
                      Quiet Hours
                    </label>
                    <input
                      type="checkbox"
                      id="quiet-hours"
                      checked={notificationSettings.quiet}
                      onChange={(e) => handleSettingsChange({ quiet: e.target.checked })}
                      disabled={!notificationSettings.enabled}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  
                  {notificationSettings.quiet && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">From</label>
                        <input
                          type="time"
                          value={notificationSettings.quietStart}
                          onChange={(e) => handleSettingsChange({ quietStart: e.target.value })}
                          disabled={!notificationSettings.enabled || !notificationSettings.quiet}
                          className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">To</label>
                        <input
                          type="time"
                          value={notificationSettings.quietEnd}
                          onChange={(e) => handleSettingsChange({ quietEnd: e.target.value })}
                          disabled={!notificationSettings.enabled || !notificationSettings.quiet}
                          className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Test Notification */}
                {notificationSettings.enabled && permissionStatus === 'granted' && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Test Notifications</h3>
                    <button
                      onClick={() => {
                        new Notification('SubTracker Test', {
                          body: 'Your notification settings are working correctly!',
                          icon: '/favicon.ico'
                        });
                      }}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Send Test Notification
                    </button>
                  </div>
                )}
                
                {/* Permission Info */}
                {notificationSettings.enabled && permissionStatus !== 'granted' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-amber-800 mb-1">Browser Permission Required</h3>
                    <p className="text-sm text-amber-700">
                      You can configure notification settings above, but you'll need to grant browser permission for actual notifications to work.
                      {permissionStatus === 'denied' && ' You previously denied permission - enable it in your browser settings.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cards' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Credit Cards</h2>
                  <button
                    onClick={() => setIsAddingCard(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Card
                  </button>
                </div>

                {/* Add Card Form */}
                {isAddingCard && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Add New Payment Method</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Card nickname (e.g., Main Visa)"
                        value={newCard.name || ''}
                        onChange={(e) => setNewCard({...newCard, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Last 4 digits"
                        maxLength={4}
                        value={newCard.lastFour || ''}
                        onChange={(e) => setNewCard({...newCard, lastFour: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <select
                        value={newCard.type || ''}
                        onChange={(e) => setNewCard({...newCard, type: e.target.value as CreditCard['type']})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select card type</option>
                        {CARD_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      <div className="flex space-x-2">
                        <select
                          value={newCard.expiryMonth || ''}
                          onChange={(e) => setNewCard({...newCard, expiryMonth: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">MM</option>
                          {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                            <option key={month} value={month.toString().padStart(2, '0')}>
                              {month.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                        <select
                          value={newCard.expiryYear || ''}
                          onChange={(e) => setNewCard({...newCard, expiryYear: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">YYYY</option>
                          {Array.from({length: 10}, (_, i) => new Date().getFullYear() + i).map(year => (
                            <option key={year} value={year.toString()}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                      <button
                        onClick={() => {setIsAddingCard(false); setNewCard({});}}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addCreditCard}
                        className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Add Card
                      </button>
                    </div>
                  </div>
                )}

                {/* Cards List */}
                <div className="space-y-3">
                  {settings.creditCards.map(card => (
                    <div key={card.id} className="border border-gray-200 rounded-lg p-4">
                      {editingCard === card.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="Card nickname"
                              value={editCardData.name || ''}
                              onChange={(e) => setEditCardData({...editCardData, name: e.target.value})}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="Last 4 digits"
                              maxLength={4}
                              value={editCardData.lastFour || ''}
                              onChange={(e) => setEditCardData({...editCardData, lastFour: e.target.value})}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <select
                              value={editCardData.type || ''}
                              onChange={(e) => setEditCardData({...editCardData, type: e.target.value as CreditCard['type']})}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select card type</option>
                              {CARD_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                              ))}
                            </select>
                            <div className="flex space-x-2">
                              <select
                                value={editCardData.expiryMonth || ''}
                                onChange={(e) => setEditCardData({...editCardData, expiryMonth: e.target.value})}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">MM</option>
                                {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                                  <option key={month} value={month.toString().padStart(2, '0')}>
                                    {month.toString().padStart(2, '0')}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={editCardData.expiryYear || ''}
                                onChange={(e) => setEditCardData({...editCardData, expiryYear: e.target.value})}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">YYYY</option>
                                {Array.from({length: 10}, (_, i) => new Date().getFullYear() + i).map(year => (
                                  <option key={year} value={year.toString()}>{year}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={cancelEditCard}
                              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveEditCard}
                              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center text-xs font-bold text-white">
                              {card.type.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{card.name}</div>
                              <div className="text-sm text-gray-500">
                                **** **** **** {card.lastFour} • {card.expiryMonth}/{card.expiryYear}
                              </div>
                              {card.isDefault && (
                                <span className="text-xs text-blue-600 font-medium">Default</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!card.isDefault && (
                              <button
                                onClick={() => setDefaultCard(card.id)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => startEditCard(card)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteCreditCard(card.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}  
                  {settings.creditCards.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No payment methods added yet
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'banks' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Bank Accounts</h2>
                  <button
                    onClick={() => setIsAddingBank(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Bank
                  </button>
                </div>

                {/* Add Bank Form */}
                {isAddingBank && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Add New Bank Account</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Bank name (e.g., Chase Bank)"
                        value={newBank.name || ''}
                        onChange={(e) => setNewBank({...newBank, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Account name (e.g., Main Checking)"
                        value={newBank.accountName || ''}
                        onChange={(e) => setNewBank({...newBank, accountName: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Last 4 digits of account"
                        maxLength={4}
                        value={newBank.accountLastFour || ''}
                        onChange={(e) => setNewBank({...newBank, accountLastFour: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                      <button
                        onClick={() => {setIsAddingBank(false); setNewBank({});}}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addBank}
                        className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Add Bank
                      </button>
                    </div>
                  </div>
                )}

                {/* Banks List */}
                <div className="space-y-3">
                  {settings.banks.map(bank => (
                    <div key={bank.id} className="border border-gray-200 rounded-lg p-4">
                      {editingBank === bank.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="Bank name"
                              value={editBankData.name || ''}
                              onChange={(e) => setEditBankData({...editBankData, name: e.target.value})}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="Account name"
                              value={editBankData.accountName || ''}
                              onChange={(e) => setEditBankData({...editBankData, accountName: e.target.value})}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="Last 4 digits"
                              maxLength={4}
                              value={editBankData.accountLastFour || ''}
                              onChange={(e) => setEditBankData({...editBankData, accountLastFour: e.target.value})}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={cancelEditBank}
                              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveEditBank}
                              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-6 bg-gradient-to-r from-green-600 to-blue-600 rounded flex items-center justify-center text-xs font-bold text-white">
                              B
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{bank.name}</div>
                              <div className="text-sm text-gray-500">
                                {bank.accountName} • ****{bank.accountLastFour}
                              </div>
                              {bank.isDefault && (
                                <span className="text-xs text-blue-600 font-medium">Default</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!bank.isDefault && (
                              <button
                                onClick={() => setDefaultBank(bank.id)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => startEditBank(bank)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteBank(bank.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {settings.banks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No bank accounts added yet
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Subscription Categories</h2>
                  <button
                    onClick={() => setIsAddingCategory(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Category
                  </button>
                </div>

                {/* Add Category Form */}
                {isAddingCategory && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        placeholder="New category name"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={addCategory}
                        className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => {setIsAddingCategory(false); setNewCategory('');}}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Categories List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {settings.categories.map(category => (
                    <div key={category} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                      {editingCategory === category ? (
                        <input
                          type="text"
                          defaultValue={category}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateCategory(category, e.currentTarget.value);
                            }
                          }}
                          onBlur={(e) => updateCategory(category, e.target.value)}
                          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{category}</span>
                      )}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingCategory(editingCategory === category ? null : category)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 size={14} />
                        </button>
                        {!DEFAULT_CATEGORIES.includes(category) && (
                          <button
                            onClick={() => deleteCategory(category)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'currencies' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900">Currency Settings</h2>
                
                {/* Default Currency */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Default Currency</label>
                  <select
                    value={settings.defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {settings.currencies.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>

                {/* Available Currencies */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Available Currencies</label>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {settings.currencies.map(currency => (
                      <div key={currency} className="border border-gray-200 rounded-lg p-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{currency}</span>
                        {currency !== settings.defaultCurrency && (
                          <button
                            onClick={() => removeCurrency(currency)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Common Currencies */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Add Common Currencies</label>
                  <div className="flex flex-wrap gap-2">
                    {['CNY', 'INR', 'BRL', 'RUB', 'KRW', 'SGD', 'HKD', 'MXN', 'ZAR', 'NZD'].filter(c => !settings.currencies.includes(c)).map(currency => (
                      <button
                        key={currency}
                        onClick={() => addCurrency(currency)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        + {currency}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Confirmation Dialog */}
    {confirmDialog.isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-gray-600 mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={confirmDialog.onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
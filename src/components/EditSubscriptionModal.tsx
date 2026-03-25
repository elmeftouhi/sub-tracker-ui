import React, { useState, useEffect } from 'react';
import type { Subscription } from '../types/subscription';

interface EditSubscriptionModalProps {
  subscription: Subscription | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Subscription>) => Promise<void>;
}

const CATEGORIES = [
  'Streaming',
  'Software', 
  'Cloud Storage',
  'Productivity',
  'Entertainment',
  'News & Media',
  'Health & Fitness',
  'Education',
  'Business',
  'Other'
];

const EditSubscriptionModal: React.FC<EditSubscriptionModalProps> = ({
  subscription,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Subscription>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState({ creditCards: [], banks: [] });
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isAddingBank, setIsAddingBank] = useState(false);

  useEffect(() => {
    // Load saved settings
    const savedSettings = localStorage.getItem('subtrack-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
    }
  }, []);

  useEffect(() => {
    if (subscription) {
      setFormData({
        name: subscription.name,
        category: subscription.category,
        price: subscription.price,
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        customInterval: subscription.customInterval,
        renewalDate: subscription.renewalDate,
        paymentMethod: subscription.paymentMethod || 'cash',
        creditCardId: subscription.creditCardId || '',
        bankId: subscription.bankId || '',
        notes: subscription.notes || '',
        status: subscription.status,
        paid: subscription.paid ?? true, // Default to paid if not set
        cancelReminder: subscription.cancelReminder || {
          enabled: false,
          daysAfterDue: 7
        }
      });
    }
  }, [subscription]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Service name is required';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.billingCycle === 'custom' && (!formData.customInterval || formData.customInterval <= 0)) {
      newErrors.customInterval = 'Custom interval must be greater than 0';
    }

    if (!formData.renewalDate) {
      newErrors.renewalDate = 'Renewal date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscription || isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSave(subscription.id, formData);
      onClose();
    } catch (error) {
      console.error('Failed to update subscription:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'customInterval' ? Number(value) : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen || !subscription) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Edit Subscription</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Service Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                step="0.01"
                min="0"
                value={formData.price || ''}
                onChange={handleInputChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency || 'USD'}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>

            <div>
              <label htmlFor="billingCycle" className="block text-sm font-medium text-gray-700 mb-1">
                Billing Cycle
              </label>
              <select
                id="billingCycle"
                name="billingCycle"
                value={formData.billingCycle || 'monthly'}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {formData.billingCycle === 'custom' && (
              <div>
                <label htmlFor="customInterval" className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Interval (days) *
                </label>
                <input
                  type="number"
                  id="customInterval"
                  name="customInterval"
                  min="1"
                  value={formData.customInterval || ''}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.customInterval ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.customInterval && <p className="text-red-500 text-xs mt-1">{errors.customInterval}</p>}
              </div>
            )}

            <div>
              <label htmlFor="renewalDate" className="block text-sm font-medium text-gray-700 mb-1">
                Next Renewal Date *
              </label>
              <input
                type="date"
                id="renewalDate"
                name="renewalDate"
                value={formData.renewalDate ? new Date(formData.renewalDate).toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    renewalDate: new Date(e.target.value)
                  }));
                }}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.renewalDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.renewalDate && <p className="text-red-500 text-xs mt-1">{errors.renewalDate}</p>}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status || 'active'}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod || 'cash'}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cash">Cash</option>
              <option value="credit-card">Credit Card</option>
              <option value="bank-transfer">Bank Transfer</option>
            </select>
          </div>

          {/* Credit Card Selection */}
          {formData.paymentMethod === 'credit-card' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="creditCardId" className="block text-sm font-medium text-gray-700">
                  Credit Card
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCard(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add New Card
                </button>
              </div>
              <select
                id="creditCardId"
                name="creditCardId"
                value={formData.creditCardId || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a credit card</option>
                {settings.creditCards.map((card: any) => (
                  <option key={card.id} value={card.id}>
                    {card.name} - ****{card.lastFour}
                  </option>
                ))}
              </select>
              {settings.creditCards.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No credit cards added yet. Go to Settings to add one.
                </p>
              )}
            </div>
          )}

          {/* Bank Selection */}
          {formData.paymentMethod === 'bank-transfer' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="bankId" className="block text-sm font-medium text-gray-700">
                  Bank Account
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingBank(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add New Bank
                </button>
              </div>
              <select
                id="bankId"
                name="bankId"
                value={formData.bankId || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a bank account</option>
                {settings.banks.map((bank: any) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name} - {bank.accountName} (****{bank.accountLastFour})
                  </option>
                ))}
              </select>
              {settings.banks.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No bank accounts added yet. Go to Settings to add one.
                </p>
              )}
            </div>
          )}

          {/* Payment Status Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Payment Status
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <span className={`text-sm ${formData.paid ? 'text-gray-500' : 'text-gray-900'}`}>Unpaid</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.paid ?? true}
                  onChange={(e) => setFormData(prev => ({ ...prev, paid: e.target.checked }))}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out relative ${
                  formData.paid ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  <div className={`absolute w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    formData.paid ? 'translate-x-5' : 'translate-x-0'
                  } mt-0.5 ml-0.5`}></div>
                </div>
              </div>
              <span className={`text-sm ${formData.paid ? 'text-gray-900' : 'text-gray-500'}`}>Paid</span>
            </label>
          </div>

          {/* Cancellation Reminder */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Cancellation Reminder
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <span className={`text-sm ${formData.cancelReminder?.enabled ? 'text-gray-500' : 'text-gray-900'}`}>Off</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.cancelReminder?.enabled || false}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      cancelReminder: {
                        ...prev.cancelReminder,
                        enabled: e.target.checked,
                        daysAfterDue: prev.cancelReminder?.daysAfterDue || 7
                      }
                    }))}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out relative ${
                    formData.cancelReminder?.enabled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      formData.cancelReminder?.enabled ? 'translate-x-5' : 'translate-x-0'
                    } top-0.5 left-0.5`}></div>
                  </div>
                </div>
                <span className={`text-sm ${formData.cancelReminder?.enabled ? 'text-gray-900' : 'text-gray-500'}`}>On</span>
              </label>
            </div>
            
            {formData.cancelReminder?.enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remind me to cancel after
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    value={formData.cancelReminder?.daysAfterDue || 7}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      cancelReminder: {
                        ...prev.cancelReminder,
                        enabled: prev.cancelReminder?.enabled || false,
                        daysAfterDue: parseInt(e.target.value)
                      }
                    }))}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1 day</option>
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                  </select>
                  <span className="text-sm text-gray-500">after due date</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  You'll be reminded to consider canceling this subscription
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes || ''}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Quick Add Card Modal */}
      {isAddingCard && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Add Credit Card</h3>
            <p className="text-sm text-gray-600 mb-4">
              For full credit card management, go to Settings. This is just a quick add.
            </p>
            <div className="text-center">
              <button
                onClick={() => setIsAddingCard(false)}
                className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsAddingCard(false);
                  window.open('/settings', '_blank');
                }}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Go to Settings
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Add Bank Modal */}
      {isAddingBank && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Add Bank Account</h3>
            <p className="text-sm text-gray-600 mb-4">
              For full bank account management, go to Settings. This is just a quick add.
            </p>
            <div className="text-center">
              <button
                onClick={() => setIsAddingBank(false)}
                className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsAddingBank(false);
                  window.open('/settings', '_blank');
                }}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Go to Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditSubscriptionModal;
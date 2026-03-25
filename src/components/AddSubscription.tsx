import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptions } from '../hooks/useSubscriptions';
import type { NewSubscription } from '../types/subscription';

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

const AddSubscription: React.FC = () => {
  const navigate = useNavigate();
  const { addSubscription } = useSubscriptions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState({ creditCards: [], banks: [] });
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [formData, setFormData] = useState<NewSubscription>({
    name: '',
    category: 'Streaming',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    renewalDate: new Date(),
    status: 'active',
    paid: true,
    cancelReminder: {
      enabled: false,
      daysAfterDue: 7
    },
    paymentMethod: 'cash',
    notes: ''
  });

  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('subtrack-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
    }
  }, []);

  // Quick add functions for cards and banks
  const quickAddCard = () => {
    setIsAddingCard(true);
  };

  const quickAddBank = () => {
    setIsAddingBank(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.billingCycle === 'custom' && (!formData.customInterval || formData.customInterval <= 0)) {
      newErrors.customInterval = 'Custom interval must be greater than 0';
    }

    const renewalDate = new Date(formData.renewalDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (renewalDate < today) {
      newErrors.renewalDate = 'Renewal date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    try {
      await addSubscription({
        ...formData,
        price: Number(formData.price)
      });
      navigate('/subscriptions');
    } catch (error) {
      console.error('Failed to add subscription:', error);
      // You could add a toast notification here
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
      [name]: name === 'renewalDate' ? new Date(value) : value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-medium text-gray-900">Add New Subscription</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Service Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="Netflix, Spotify, etc."
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Price *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.price ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="9.99"
              />
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
              </select>
            </div>

            <div>
              <label htmlFor="billingCycle" className="block text-sm font-medium text-gray-700">
                Billing Cycle
              </label>
              <select
                id="billingCycle"
                name="billingCycle"
                value={formData.billingCycle}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {formData.billingCycle === 'custom' && (
              <div>
                <label htmlFor="customInterval" className="block text-sm font-medium text-gray-700">
                  Custom Interval (days)
                </label>
                <input
                  type="number"
                  id="customInterval"
                  name="customInterval"
                  min="1"
                  value={formData.customInterval || ''}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.customInterval ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="30"
                />
              </div>
            )}

            <div>
              <label htmlFor="renewalDate" className="block text-sm font-medium text-gray-700">
                Next Renewal Date *
              </label>
              <input
                type="date"
                id="renewalDate"
                name="renewalDate"
                required
                value={formData.renewalDate.toISOString().split('T')[0]}
                onChange={handleInputChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.renewalDate ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
              />
            </div>

            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="credit-card">Credit Card</option>
                <option value="bank-transfer">Bank Transfer</option>
              </select>
            </div>

            {/* Credit Card Selection */}
            {formData.paymentMethod === 'credit-card' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="creditCardId" className="block text-sm font-medium text-gray-700">
                    Credit Card
                  </label>
                  <button
                    type="button"
                    onClick={quickAddCard}
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    No credit cards added yet. Go to Settings to add one or use the quick add button above.
                  </p>
                )}
              </div>
            )}

            {/* Bank Selection */}
            {formData.paymentMethod === 'bank-transfer' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="bankId" className="block text-sm font-medium text-gray-700">
                    Bank Account
                  </label>
                  <button
                    type="button"
                    onClick={quickAddBank}
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    No bank accounts added yet. Go to Settings to add one or use the quick add button above.
                  </p>
                )}
              </div>
            )}
          </div>

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
                  checked={formData.paid}
                  onChange={(e) => setFormData(prev => ({ ...prev, paid: e.target.checked }))}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out relative ${
                  formData.paid ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  <div className={`absolute w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    formData.paid ? 'translate-x-5' : 'translate-x-0'
                  } top-0.5 left-0.5`}></div>
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
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/subscriptions')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Quick Add Card Modal */}
      {isAddingCard && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
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

export default AddSubscription;
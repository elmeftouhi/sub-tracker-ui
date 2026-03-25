import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Subscription } from '../types/subscription';
import { formatCurrency, formatDate } from '../utils/helpers';
import { isCurrentPeriodPaid } from '../utils/paymentUtils';
import { Check, Bell, ChevronDown, ChevronUp } from 'lucide-react';

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Subscription['status']) => void;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Subscription['status'] | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleStatusChange = (newStatus: Subscription['status']) => {
    if (newStatus !== subscription.status) {
      setPendingStatus(newStatus);
      setShowStatusConfirm(true);
    }
  };

  const confirmStatusChange = () => {
    if (pendingStatus) {
      onStatusChange(subscription.id, pendingStatus);
      setPendingStatus(null);
      setShowStatusConfirm(false);
    }
  };

  const cancelStatusChange = () => {
    setPendingStatus(null);
    setShowStatusConfirm(false);
  };  const [settings, setSettings] = useState({ creditCards: [], banks: [] });

  useEffect(() => {
    const savedSettings = localStorage.getItem('subtrack-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const getPaymentMethodDisplay = () => {
    if (subscription.paymentMethod === 'cash') {
      return 'Cash';
    } else if (subscription.paymentMethod === 'credit-card' && subscription.creditCardId) {
      const card = settings.creditCards.find((c: any) => c.id === subscription.creditCardId);
      return card ? `${(card as any).name} - ****${(card as any).lastFour}` : 'Credit Card';
    } else if (subscription.paymentMethod === 'bank-transfer' && subscription.bankId) {
      const bank = settings.banks.find((b: any) => b.id === subscription.bankId);
      return bank ? `${(bank as any).name} - ${(bank as any).accountName}` : 'Bank Transfer';
    } else {
      return subscription.paymentMethod || 'Not specified';
    }
  };
  const getStatusColor = (status: Subscription['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isRenewingSoon = () => {
    const renewalDate = new Date(subscription.renewalDate);
    const today = new Date();
    const diffTime = renewalDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const getCardBackgroundColor = () => {
    // Check if subscription is paid - very light green background
    if (isCurrentPeriodPaid(subscription)) {
      return 'bg-green-100 border-green-100';
    }
    // Check if almost due - light orange background
    if (isRenewingSoon() && subscription.status === 'active') {
      return 'bg-orange-50 border-orange-200';
    }
    // Default background
    return 'bg-white border-gray-200';
  };

  const isCancelReminderActive = () => {
    if (!subscription.cancelReminder?.enabled || subscription.status !== 'active') return false;
    
    const renewalDate = new Date(subscription.renewalDate);
    const today = new Date();
    const daysPastDue = Math.floor((today.getTime() - renewalDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysPastDue >= subscription.cancelReminder.daysAfterDue;
  };

  const getCancelReminderMessage = () => {
    if (!subscription.cancelReminder?.enabled) return null;
    
    const renewalDate = new Date(subscription.renewalDate);
    const today = new Date();
    const daysPastDue = Math.floor((today.getTime() - renewalDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilReminder = subscription.cancelReminder.daysAfterDue - daysPastDue;
    
    if (daysPastDue >= subscription.cancelReminder.daysAfterDue) {
      return 'Consider canceling this subscription';
    } else if (daysUntilReminder <= 3 && daysUntilReminder > 0) {
      return `Cancellation reminder in ${daysUntilReminder} day${daysUntilReminder === 1 ? '' : 's'}`;
    }
    
    return null;
  };

  return (
    <div className={`rounded-lg border p-6 hover:shadow-md transition-shadow ${getCardBackgroundColor()}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{subscription.name}</h3>
            {isCurrentPeriodPaid(subscription) && (
              <div className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            {subscription.cancelReminder?.enabled && (
              <div className={`flex items-center justify-center w-5 h-5 rounded-full ${
                isCancelReminderActive() ? 'bg-red-500' : 'bg-blue-500'
              }`} title="Cancellation reminder set">
                <Bell className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500">{subscription.category}</p>
        </div>
        
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <Link
                to={`/subscription/${subscription.id}`}
                onClick={() => setIsMenuOpen(false)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                View Details
              </Link>
              <button
                onClick={() => {
                  onEdit(subscription);
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete(subscription.id);
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* Always visible: Price and Status */}
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(subscription.price, subscription.currency)}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
            {subscription.status}
          </span>
        </div>

        {/* Always visible: Next renewal */}
        <div className={`text-sm ${isRenewingSoon() ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
          Next renewal: {formatDate(new Date(subscription.renewalDate))}
          {isRenewingSoon() && <span className="ml-1">⚠️</span>}
        </div>

        {/* Expanded details with smooth transition */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="space-y-3 pt-2">
            {/* Billing details */}
            <div className="text-sm text-gray-600">
              <p>Billing: <span className="font-medium capitalize">{subscription.billingCycle}</span></p>
              {subscription.billingCycle === 'custom' && subscription.customInterval && (
                <p>Every {subscription.customInterval} days</p>
              )}
            </div>

            {/* Payment method */}
            {subscription.paymentMethod && (
              <p className="text-sm text-gray-500">
                Payment: {getPaymentMethodDisplay()}
              </p>
            )}

            {/* Payment status */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Payment Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                subscription.paid 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {subscription.paid ? 'Paid' : 'Unpaid'}
              </span>
            </div>

            {/* Cancellation Reminder */}
            {subscription.cancelReminder?.enabled && (
              <div className={`text-sm p-2 rounded border-l-4 ${
                isCancelReminderActive() 
                  ? 'bg-red-50 border-red-400 text-red-800' 
                  : 'bg-blue-50 border-blue-400 text-blue-800'
              }`}>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span className="font-medium">
                    {getCancelReminderMessage() || 
                     `Reminder set: ${subscription.cancelReminder.daysAfterDue} days after due`}
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            {subscription.notes && (
              <p className="text-sm text-gray-600 italic">
                {subscription.notes}
              </p>
            )}

            {/* Status selector */}
            <div className="pt-2">
              <select
                value={subscription.status}
                onChange={(e) => handleStatusChange(e.target.value as Subscription['status'])}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expand/Collapse button at bottom center */}
        <div className="flex justify-center pt-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 p-1 transition-colors rounded-full hover:bg-gray-100"
            title={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Status Change Confirmation Dialog */}
      {showStatusConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Status Change</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to change the status of "{subscription.name}" to {pendingStatus}?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelStatusChange}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionCard;
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { formatCurrency, formatDate } from '../utils/helpers';
import { isCurrentPeriodPaid } from '../utils/paymentUtils';
import { Check, Bell, Calendar, DollarSign, TrendingUp, Clock, ArrowLeft, Edit, Trash2 } from 'lucide-react';

interface PaymentHistory {
  id: string;
  date: Date;
  amount: number;
  status: 'paid' | 'failed' | 'pending';
  method?: string;
}

interface StatusChange {
  id: string;
  date: Date;
  fromStatus: string;
  toStatus: string;
  reason?: string;
}

const SubscriptionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { subscriptions, deleteSubscription, markAsPaid, markAsUnpaid } = useSubscriptions();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'analytics'>('overview');
  
  // Confirmation dialog state
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

  const subscription = subscriptions.find(sub => sub.id === id);

  if (!subscription) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription Not Found</h2>
        <p className="text-gray-600 mb-6">The subscription you're looking for doesn't exist.</p>
        <Link
          to="/subscriptions"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Subscriptions
        </Link>
      </div>
    );
  }

  // Mock payment history - in a real app, this would come from a database
  const paymentHistory: PaymentHistory[] = [
    {
      id: '1',
      date: new Date('2026-01-04'),
      amount: subscription.price,
      status: 'paid',
      method: 'Credit Card'
    },
    {
      id: '2',
      date: new Date('2025-12-04'),
      amount: subscription.price,
      status: 'paid',
      method: 'Credit Card'
    },
    {
      id: '3',
      date: new Date('2025-11-04'),
      amount: subscription.price,
      status: 'paid',
      method: 'Credit Card'
    },
  ];

  // Mock status history
  const statusHistory: StatusChange[] = [
    {
      id: '1',
      date: new Date('2026-01-15'),
      fromStatus: 'active',
      toStatus: 'active',
      reason: 'Payment processed'
    },
    {
      id: '2',
      date: new Date('2025-12-01'),
      fromStatus: 'paused',
      toStatus: 'active',
      reason: 'Subscription resumed'
    },
  ];

  const handleDelete = async () => {
    if (!subscription) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Subscription',
      message: `Are you sure you want to delete "${subscription.name}"? This action cannot be undone and will permanently remove all subscription data including payment history and analytics.`,
      onConfirm: async () => {
        try {
          await deleteSubscription(subscription.id);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          navigate('/subscriptions');
        } catch (error) {
          console.error('Failed to delete subscription:', error);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
      onCancel: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
    });
  };

  const togglePaymentStatus = async () => {
    try {
      const isPaid = isCurrentPeriodPaid(subscription);
      if (isPaid) {
        await markAsUnpaid(subscription.id);
      } else {
        await markAsPaid(subscription.id);
      }
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  };

  const calculateMonthlySpend = () => {
    let monthly = subscription.price;
    if (subscription.billingCycle === 'yearly') {
      monthly = subscription.price / 12;
    } else if (subscription.billingCycle === 'custom' && subscription.customInterval) {
      monthly = (subscription.price * 30) / subscription.customInterval;
    }
    return monthly;
  };

  const totalPaid = paymentHistory
    .filter(payment => payment.status === 'paid')
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/subscriptions')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{subscription.name}</h1>
            <p className="text-gray-600">{subscription.category}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link
            to={`/edit/${subscription.id}`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Calendar },
            { id: 'history', label: 'History', icon: Clock },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Price</label>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(subscription.price, subscription.currency)}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">{subscription.billingCycle}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Next Renewal</label>
                  <p className="text-lg font-medium text-gray-900">
                    {formatDate(new Date(subscription.renewalDate))}
                  </p>
                  <p className="text-sm text-gray-500">
                    {Math.ceil((new Date(subscription.renewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                    subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                    subscription.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {subscription.status}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Status</label>
                  <div className="flex items-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      isCurrentPeriodPaid(subscription) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isCurrentPeriodPaid(subscription) ? 'Paid' : 'Unpaid'}
                    </span>
                    <button
                      onClick={togglePaymentStatus}
                      className="ml-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Toggle
                    </button>
                  </div>
                </div>
              </div>
              
              {subscription.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-gray-900">{subscription.notes}</p>
                </div>
              )}
            </div>

            {/* Cancellation Reminder */}
            {subscription.cancelReminder?.enabled && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Bell className="w-5 h-5 text-orange-600 mr-2" />
                  <h4 className="text-sm font-medium text-orange-800">Cancellation Reminder</h4>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  Reminder set for {subscription.cancelReminder.daysAfterDue} days after due date
                </p>
              </div>
            )}
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-blue-700">Monthly Cost</h4>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(calculateMonthlySpend(), subscription.currency)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-green-700">Total Paid</h4>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(totalPaid, subscription.currency)}
              </p>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-900">Started</p>
                    <p className="text-gray-500">{formatDate(new Date(subscription.createdAt))}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-900">Next Renewal</p>
                    <p className="text-gray-500">{formatDate(new Date(subscription.renewalDate))}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment History */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{formatDate(payment.date)}</p>
                    <p className="text-sm text-gray-500">{payment.method}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(payment.amount, subscription.currency)}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                      payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Changes */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Status Changes</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {statusHistory.map((change) => (
                <div key={change.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{formatDate(change.date)}</p>
                      <p className="text-sm text-gray-600">
                        {change.fromStatus} → {change.toStatus}
                      </p>
                      {change.reason && (
                        <p className="text-sm text-gray-500">{change.reason}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Analytics Stats */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-500">Average Monthly</h4>
                  <DollarSign className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(calculateMonthlySpend(), subscription.currency)}
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-500">Total Payments</h4>
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{paymentHistory.length}</p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-500">Success Rate</h4>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((paymentHistory.filter(p => p.status === 'paid').length / paymentHistory.length) * 100)}%
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-500">Days Active</h4>
                  <Calendar className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.floor((new Date().getTime() - new Date(subscription.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                </p>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Analysis</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Annual Cost</span>
                  <span className="font-medium">
                    {formatCurrency(calculateMonthlySpend() * 12, subscription.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cost per Day</span>
                  <span className="font-medium">
                    {formatCurrency(calculateMonthlySpend() / 30, subscription.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Spent</span>
                  <span className="font-medium text-lg">
                    {formatCurrency(totalPaid, subscription.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
};

export default SubscriptionDetails;
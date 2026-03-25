import React, { useState } from 'react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import type { Subscription } from '../types/subscription';
import SubscriptionCard from './SubscriptionCard';
import EditSubscriptionModal from './EditSubscriptionModal';

const SubscriptionList: React.FC = () => {
  const { subscriptions, loading, updateSubscription, deleteSubscription } = useSubscriptions();
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'canceled'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'renewalDate'>('renewalDate');
  
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

  const filteredAndSortedSubscriptions = subscriptions
    .filter(sub => {
      const matchesFilter = filter === 'all' || sub.status === filter;
      const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sub.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return b.price - a.price;
        case 'renewalDate':
          return new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime();
        default:
          return 0;
      }
    });

  const handleStatusChange = async (id: string, status: Subscription['status']) => {
    try {
      await updateSubscription(id, { status });
    } catch (error) {
      console.error('Failed to update subscription status:', error);
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
  };

  const handleDelete = async (id: string) => {
    const subscription = subscriptions.find(s => s.id === id);
    if (!subscription) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Subscription',
      message: `Are you sure you want to delete "${subscription.name}"? This action cannot be undone and will permanently remove all subscription data.`,
      onConfirm: async () => {
        try {
          await deleteSubscription(id);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error('Failed to delete subscription:', error);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
      onCancel: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
    });
  };

  const handleSaveEdit = async (id: string, updates: Partial<Subscription>) => {
    await updateSubscription(id, updates);
    setEditingSubscription(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Subscriptions</h1>
          <p className="text-gray-600">Manage your recurring subscriptions</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="renewalDate">Renewal Date</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
          </select>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active
            <span className="ml-1 text-xs">
              ({subscriptions.filter(s => s.status === 'active').length})
            </span>
          </button>
          
          <div className="relative">
            <button
              onClick={() => {
                const otherStatuses = ['all', 'paused', 'canceled'] as const;
                const nextFilter = otherStatuses.find(status => status !== filter) || 'all';
                setFilter(nextFilter);
              }}
              className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center"
            >
              Other
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {filter !== 'active' && (
            <div className="flex space-x-2">
              {(['all', 'paused', 'canceled'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                  {status !== 'all' && (
                    <span className="ml-1 text-xs">
                      ({subscriptions.filter(s => s.status === status).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-md border border-blue-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-700">Total Subscriptions</p>
            <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-700 mb-1">{subscriptions.length}</p>
          <p className="text-xs text-blue-600">All services</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md border border-green-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-green-700">Active</p>
            <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-700 mb-1">
            {subscriptions.filter(s => s.status === 'active').length}
          </p>
          <p className="text-xs text-green-600">Running</p>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-md border border-yellow-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-yellow-700">Paused</p>
            <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-yellow-700 mb-1">
            {subscriptions.filter(s => s.status === 'paused').length}
          </p>
          <p className="text-xs text-yellow-600">On hold</p>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-md border border-red-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-red-700">Canceled</p>
            <div className="w-8 h-8 bg-red-200 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-red-700 mb-1">
            {subscriptions.filter(s => s.status === 'canceled').length}
          </p>
          <p className="text-xs text-red-600">Ended</p>
        </div>
      </div>

      {/* Subscription Cards */}
      {filteredAndSortedSubscriptions.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' && !searchTerm 
                ? 'Get started by adding your first subscription.'
                : 'Try adjusting your filters or search term.'
              }
            </p>
            {filter === 'all' && !searchTerm && (
              <div className="mt-6">
                <a
                  href="/add"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Subscription
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedSubscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <EditSubscriptionModal
        subscription={editingSubscription}
        isOpen={!!editingSubscription}
        onClose={() => setEditingSubscription(null)}
        onSave={handleSaveEdit}
      />
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

export default SubscriptionList;
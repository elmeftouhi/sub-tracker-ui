import { useState, useEffect } from 'react';
import { db } from '../utils/database';
import type { Subscription, NewSubscription } from '../types/subscription';
import { 
  isCurrentPeriodPaid, 
  addPaymentForCurrentPeriod, 
  removePaymentForCurrentPeriod 
} from '../utils/paymentUtils';
import { v4 as uuidv4 } from 'uuid';

export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptions = async () => {
    try {
      setError(null);
      const subs = await db.subscriptions.orderBy('createdAt').reverse().toArray();
      // Add default paymentHistory for existing subscriptions that don't have it
      const subsWithPaymentHistory = subs.map(sub => ({
        ...sub,
        paymentHistory: sub.paymentHistory || []
      }));
      setSubscriptions(subsWithPaymentHistory);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      setError('Failed to load subscriptions. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const addSubscription = async (newSub: NewSubscription): Promise<string> => {
    const subscription: Subscription = {
      ...newSub,
      id: uuidv4(),
      paymentHistory: newSub.paymentHistory || [], // Default to empty payment history
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      setError(null);
      await db.subscriptions.add(subscription);
      await loadSubscriptions();
      return subscription.id;
    } catch (error) {
      console.error('Failed to add subscription:', error);
      setError('Failed to add subscription. Please try again.');
      throw error;
    }
  };

  const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
    try {
      setError(null);
      await db.subscriptions.update(id, {
        ...updates,
        updatedAt: new Date(),
      });
      await loadSubscriptions();
    } catch (error) {
      console.error('Failed to update subscription:', error);
      setError('Failed to update subscription. Please try again.');
      throw error;
    }
  };

  const deleteSubscription = async (id: string) => {
    try {
      setError(null);
      await db.subscriptions.delete(id);
      await loadSubscriptions();
    } catch (error) {
      console.error('Failed to delete subscription:', error);
      setError('Failed to delete subscription. Please try again.');
      throw error;
    }
  };

  const duplicateSubscription = async (id: string) => {
    try {
      const original = await db.subscriptions.get(id);
      if (!original) throw new Error('Subscription not found');

      const duplicate: NewSubscription = {
        name: `${original.name} (Copy)`,
        category: original.category,
        price: original.price,
        currency: original.currency,
        billingCycle: original.billingCycle,
        customInterval: original.customInterval,
        renewalDate: new Date(original.renewalDate),
        paymentMethod: original.paymentMethod,
        notes: original.notes,
        status: 'active', // Reset status for new subscription
      };

      return await addSubscription(duplicate);
    } catch (error) {
      console.error('Failed to duplicate subscription:', error);
      setError('Failed to duplicate subscription. Please try again.');
      throw error;
    }
  };

  const bulkUpdateStatus = async (ids: string[], status: Subscription['status']) => {
    try {
      setError(null);
      await Promise.all(ids.map(id => 
        db.subscriptions.update(id, { 
          status, 
          updatedAt: new Date() 
        })
      ));
      await loadSubscriptions();
    } catch (error) {
      console.error('Failed to bulk update subscriptions:', error);
      setError('Failed to update subscriptions. Please try again.');
      throw error;
    }
  };

  const exportData = () => {
    try {
      const dataStr = JSON.stringify(subscriptions, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `subtrack-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Failed to export data:', error);
      setError('Failed to export data. Please try again.');
    }
  };

  const importData = async (jsonData: string) => {
    try {
      setError(null);
      const imported = JSON.parse(jsonData) as Subscription[];
      
      if (!Array.isArray(imported)) {
        throw new Error('Invalid data format');
      }

      // Validate data structure
      const validatedData = imported.map(sub => ({
        ...sub,
        id: uuidv4(), // Generate new IDs to avoid conflicts
        createdAt: new Date(),
        updatedAt: new Date(),
        renewalDate: new Date(sub.renewalDate), // Ensure dates are properly formatted
      }));

      await db.subscriptions.bulkAdd(validatedData);
      await loadSubscriptions();
      
      return validatedData.length;
    } catch (error) {
      console.error('Failed to import data:', error);
      setError('Failed to import data. Please check the file format.');
      throw error;
    }
  };

  const markAsPaid = async (id: string, paidDate: Date = new Date()) => {
    try {
      setError(null);
      const subscription = subscriptions.find(sub => sub.id === id);
      if (!subscription) throw new Error('Subscription not found');

      if (isCurrentPeriodPaid(subscription)) {
        throw new Error('Subscription is already paid for the current period');
      }

      const newPayment = addPaymentForCurrentPeriod(subscription, paidDate);
      const updatedPaymentHistory = [...subscription.paymentHistory, newPayment];

      await db.subscriptions.update(id, {
        paymentHistory: updatedPaymentHistory,
        updatedAt: new Date()
      });
      
      await loadSubscriptions();
    } catch (error) {
      console.error('Failed to mark subscription as paid:', error);
      setError(error instanceof Error ? error.message : 'Failed to mark subscription as paid');
      throw error;
    }
  };

  const markAsUnpaid = async (id: string) => {
    try {
      setError(null);
      const subscription = subscriptions.find(sub => sub.id === id);
      if (!subscription) throw new Error('Subscription not found');

      const updatedPaymentHistory = removePaymentForCurrentPeriod(subscription);

      await db.subscriptions.update(id, {
        paymentHistory: updatedPaymentHistory,
        updatedAt: new Date()
      });
      
      await loadSubscriptions();
    } catch (error) {
      console.error('Failed to mark subscription as unpaid:', error);
      setError('Failed to mark subscription as unpaid');
      throw error;
    }
  };

  const clearError = () => setError(null);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  return {
    subscriptions,
    loading,
    error,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    duplicateSubscription,
    bulkUpdateStatus,
    exportData,
    importData,
    markAsPaid,
    markAsUnpaid,
    refreshSubscriptions: loadSubscriptions,
    clearError,
  };
};
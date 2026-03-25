import type { Subscription, PaymentRecord } from '../types/subscription';

/**
 * Calculate the current billing period for a subscription based on today's date
 */
export const getCurrentBillingPeriod = (subscription: Subscription): { start: Date; end: Date } => {
  const today = new Date();
  const renewalDate = new Date(subscription.renewalDate);
  
  if (subscription.billingCycle === 'monthly') {
    // Find the most recent renewal date that's <= today
    const currentPeriodEnd = new Date(renewalDate);
    while (currentPeriodEnd > today) {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() - 1);
    }
    
    const currentPeriodStart = new Date(currentPeriodEnd);
    currentPeriodStart.setMonth(currentPeriodStart.getMonth() - 1);
    currentPeriodStart.setDate(currentPeriodStart.getDate() + 1);
    
    return { start: currentPeriodStart, end: currentPeriodEnd };
  }
  
  if (subscription.billingCycle === 'yearly') {
    // Find the most recent renewal date that's <= today
    const currentPeriodEnd = new Date(renewalDate);
    while (currentPeriodEnd > today) {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() - 1);
    }
    
    const currentPeriodStart = new Date(currentPeriodEnd);
    currentPeriodStart.setFullYear(currentPeriodStart.getFullYear() - 1);
    currentPeriodStart.setDate(currentPeriodStart.getDate() + 1);
    
    return { start: currentPeriodStart, end: currentPeriodEnd };
  }
  
  if (subscription.billingCycle === 'custom' && subscription.customInterval) {
    // Find the most recent renewal date that's <= today
    const currentPeriodEnd = new Date(renewalDate);
    while (currentPeriodEnd > today) {
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() - subscription.customInterval);
    }
    
    const currentPeriodStart = new Date(currentPeriodEnd);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - subscription.customInterval + 1);
    
    return { start: currentPeriodStart, end: currentPeriodEnd };
  }
  
  // Fallback: return current month
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start, end };
};

/**
 * Check if a subscription is paid for the current billing period
 */
export const isCurrentPeriodPaid = (subscription: Subscription): boolean => {
  if (!subscription.paymentHistory || subscription.paymentHistory.length === 0) {
    return false;
  }
  
  const currentPeriod = getCurrentBillingPeriod(subscription);
  
  return subscription.paymentHistory.some(payment => {
    const paymentDate = new Date(payment.paidDate);
    const periodStart = new Date(payment.billingPeriodStart);
    const periodEnd = new Date(payment.billingPeriodEnd);
    
    // Check if this payment record covers the current period
    return (
      periodStart <= currentPeriod.start &&
      periodEnd >= currentPeriod.end &&
      paymentDate >= periodStart &&
      paymentDate <= periodEnd
    );
  });
};

/**
 * Add a payment record for the current billing period
 */
export const addPaymentForCurrentPeriod = (subscription: Subscription, paidDate: Date = new Date()): PaymentRecord => {
  const currentPeriod = getCurrentBillingPeriod(subscription);
  
  return {
    paidDate,
    billingPeriodStart: currentPeriod.start,
    billingPeriodEnd: currentPeriod.end
  };
};

/**
 * Remove payment record for the current billing period
 */
export const removePaymentForCurrentPeriod = (subscription: Subscription): PaymentRecord[] => {
  if (!subscription.paymentHistory || subscription.paymentHistory.length === 0) {
    return [];
  }
  
  const currentPeriod = getCurrentBillingPeriod(subscription);
  
  return subscription.paymentHistory.filter(payment => {
    const periodStart = new Date(payment.billingPeriodStart);
    const periodEnd = new Date(payment.billingPeriodEnd);
    
    // Keep payments that don't cover the current period
    return !(
      periodStart <= currentPeriod.start &&
      periodEnd >= currentPeriod.end
    );
  });
};

/**
 * Get the next billing period start and end dates
 */
export const getNextBillingPeriod = (subscription: Subscription): { start: Date; end: Date } => {
  const renewalDate = new Date(subscription.renewalDate);
  
  if (subscription.billingCycle === 'monthly') {
    const nextPeriodStart = new Date(renewalDate);
    nextPeriodStart.setDate(nextPeriodStart.getDate() + 1);
    
    const nextPeriodEnd = new Date(renewalDate);
    nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
    
    return { start: nextPeriodStart, end: nextPeriodEnd };
  }
  
  if (subscription.billingCycle === 'yearly') {
    const nextPeriodStart = new Date(renewalDate);
    nextPeriodStart.setDate(nextPeriodStart.getDate() + 1);
    
    const nextPeriodEnd = new Date(renewalDate);
    nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1);
    
    return { start: nextPeriodStart, end: nextPeriodEnd };
  }
  
  if (subscription.billingCycle === 'custom' && subscription.customInterval) {
    const nextPeriodStart = new Date(renewalDate);
    nextPeriodStart.setDate(nextPeriodStart.getDate() + 1);
    
    const nextPeriodEnd = new Date(renewalDate);
    nextPeriodEnd.setDate(nextPeriodEnd.getDate() + subscription.customInterval);
    
    return { start: nextPeriodStart, end: nextPeriodEnd };
  }
  
  // Fallback: next month
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  return { start, end };
};
import { format, addMonths, addYears, addDays, isBefore, startOfDay } from 'date-fns';

export const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (date: Date) => {
  return format(date, 'MMM dd, yyyy');
};

export const calculateNextRenewal = (
  lastRenewal: Date, 
  billingCycle: 'monthly' | 'yearly' | 'custom',
  customInterval?: number
): Date => {
  switch (billingCycle) {
    case 'monthly':
      return addMonths(lastRenewal, 1);
    case 'yearly':
      return addYears(lastRenewal, 1);
    case 'custom':
      return addDays(lastRenewal, customInterval || 30);
    default:
      return addMonths(lastRenewal, 1);
  }
};

export const isRenewalSoon = (renewalDate: Date, daysThreshold: number = 7): boolean => {
  const today = startOfDay(new Date());
  const threshold = addDays(today, daysThreshold);
  return isBefore(renewalDate, threshold) && !isBefore(renewalDate, today);
};

export const calculateMonthlyEquivalent = (
  price: number, 
  billingCycle: 'monthly' | 'yearly' | 'custom',
  customInterval?: number
): number => {
  switch (billingCycle) {
    case 'monthly':
      return price;
    case 'yearly':
      return price / 12;
    case 'custom':
      return (price * 30) / (customInterval || 30);
    default:
      return price;
  }
};
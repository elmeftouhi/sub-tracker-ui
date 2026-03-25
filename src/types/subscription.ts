export interface PaymentRecord {
  paidDate: Date;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
}

export interface Subscription {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly' | 'custom';
  customInterval?: number; // for custom cycles (days)
  renewalDate: Date;
  paymentMethod: 'cash' | 'credit-card' | 'bank-transfer';
  creditCardId?: string; // for credit card payments
  bankId?: string; // for bank transfer payments
  notes?: string;
  status: 'active' | 'paused' | 'canceled';
  paymentHistory: PaymentRecord[]; // track payment dates for each billing period
  cancelReminder?: {
    enabled: boolean;
    daysAfterDue: number; // days after renewal date to remind for cancellation
  };
  createdAt: Date;
  updatedAt: Date;
}

export type NewSubscription = Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>;
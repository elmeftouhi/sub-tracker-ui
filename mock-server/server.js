import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Utility functions for payment calculations
const getCurrentBillingPeriod = (subscription) => {
  const today = new Date();
  const renewalDate = new Date(subscription.renewalDate);
  
  if (subscription.billingCycle === 'monthly') {
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
    const currentPeriodEnd = new Date(renewalDate);
    while (currentPeriodEnd > today) {
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() - subscription.customInterval);
    }
    const currentPeriodStart = new Date(currentPeriodEnd);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - subscription.customInterval + 1);
    return { start: currentPeriodStart, end: currentPeriodEnd };
  }
  
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start, end };
};

const isCurrentPeriodPaid = (subscription) => {
  if (!subscription.paymentHistory || subscription.paymentHistory.length === 0) {
    return false;
  }
  
  const currentPeriod = getCurrentBillingPeriod(subscription);
  
  return subscription.paymentHistory.some(payment => {
    const periodStart = new Date(payment.billingPeriodStart);
    const periodEnd = new Date(payment.billingPeriodEnd);
    
    return (
      periodStart <= currentPeriod.start &&
      periodEnd >= currentPeriod.end
    );
  });
};

// Mock data storage (in-memory)
let subscriptions = [
  {
    id: '1',
    name: 'Netflix',
    category: 'Entertainment',
    price: 15.99,
    currency: 'USD',
    billingCycle: 'monthly',
    renewalDate: new Date('2026-02-15'),
    paymentMethod: 'credit-card',
    creditCardId: 'card_1',
    notes: 'Premium subscription',
    status: 'active',
    paymentHistory: [
      {
        paidDate: new Date('2026-01-16'),
        billingPeriodStart: new Date('2026-01-16'),
        billingPeriodEnd: new Date('2026-02-15')
      }
    ],
    cancelReminder: {
      enabled: true,
      daysAfterDue: 3
    },
    createdAt: new Date('2025-12-15'),
    updatedAt: new Date('2025-12-15')
  },
  {
    id: '2',
    name: 'Spotify',
    category: 'Music',
    price: 9.99,
    currency: 'USD',
    billingCycle: 'monthly',
    renewalDate: new Date('2026-02-20'),
    paymentMethod: 'credit-card',
    creditCardId: 'card_1',
    status: 'active',
    paymentHistory: [
      {
        paidDate: new Date('2026-01-21'),
        billingPeriodStart: new Date('2026-01-21'),
        billingPeriodEnd: new Date('2026-02-20')
      }
    ],
    cancelReminder: {
      enabled: false,
      daysAfterDue: 0
    },
    createdAt: new Date('2025-11-20'),
    updatedAt: new Date('2025-11-20')
  },
  {
    id: '3',
    name: 'Adobe Creative Suite',
    category: 'Software',
    price: 59.99,
    currency: 'USD',
    billingCycle: 'monthly',
    renewalDate: new Date('2026-02-28'),
    paymentMethod: 'bank-transfer',
    bankId: 'bank_1',
    status: 'active',
    paymentHistory: [], // Not paid for current period
    cancelReminder: {
      enabled: true,
      daysAfterDue: 5
    },
    createdAt: new Date('2025-10-28'),
    updatedAt: new Date('2026-01-28')
  },
  {
    id: '4',
    name: 'GitHub Pro',
    category: 'Development',
    price: 48.00,
    currency: 'USD',
    billingCycle: 'yearly',
    renewalDate: new Date('2026-03-15'),
    paymentMethod: 'credit-card',
    creditCardId: 'card_2',
    status: 'active',
    paymentHistory: [
      {
        paidDate: new Date('2025-03-16'),
        billingPeriodStart: new Date('2025-03-16'),
        billingPeriodEnd: new Date('2026-03-15')
      }
    ],
    cancelReminder: {
      enabled: false,
      daysAfterDue: 0
    },
    createdAt: new Date('2025-03-15'),
    updatedAt: new Date('2025-03-15')
  },
  {
    id: '5',
    name: 'Gym Membership',
    category: 'Health',
    price: 45.00,
    currency: 'USD',
    billingCycle: 'monthly',
    renewalDate: new Date('2026-03-01'),
    paymentMethod: 'cash',
    status: 'paused',
    paymentHistory: [
      {
        paidDate: new Date('2026-02-01'),
        billingPeriodStart: new Date('2026-02-01'),
        billingPeriodEnd: new Date('2026-03-01')
      }
    ],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2026-01-15')
  }
];

let settings = {
  categories: ['Entertainment', 'Music', 'Software', 'Development', 'Health', 'Education', 'Gaming', 'News', 'Productivity', 'Finance'],
  currencies: ['USD', 'EUR', 'GBP', 'CAD', 'JPY'],
  defaultCurrency: 'USD'
};

let paymentMethods = [
  {
    id: 'card_1',
    type: 'credit-card',
    name: 'Main Credit Card',
    last4: '4242',
    brand: 'visa',
    expiryMonth: 12,
    expiryYear: 2028
  },
  {
    id: 'card_2',
    type: 'credit-card',
    name: 'Business Card',
    last4: '1234',
    brand: 'mastercard',
    expiryMonth: 6,
    expiryYear: 2027
  },
  {
    id: 'bank_1',
    type: 'bank-transfer',
    name: 'Chase Checking',
    last4: '5678',
    bankName: 'Chase Bank'
  }
];

// Utility function to convert date strings back to Date objects
const parseSubscription = (sub) => ({
  ...sub,
  renewalDate: new Date(sub.renewalDate),
  createdAt: new Date(sub.createdAt),
  updatedAt: new Date(sub.updatedAt)
});

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all subscriptions
app.get('/api/subscriptions', (req, res) => {
  const { status, category, search } = req.query;
  
  let filteredSubs = [...subscriptions];
  
  if (status) {
    filteredSubs = filteredSubs.filter(sub => sub.status === status);
  }
  
  if (category) {
    filteredSubs = filteredSubs.filter(sub => sub.category === category);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredSubs = filteredSubs.filter(sub => 
      sub.name.toLowerCase().includes(searchLower) ||
      sub.category.toLowerCase().includes(searchLower) ||
      sub.notes?.toLowerCase().includes(searchLower)
    );
  }
  
  res.json(filteredSubs);
});

// Get subscription by ID
app.get('/api/subscriptions/:id', (req, res) => {
  const { id } = req.params;
  const subscription = subscriptions.find(sub => sub.id === id);
  
  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  
  res.json(subscription);
});

// Create new subscription
app.post('/api/subscriptions', (req, res) => {
  const newSubscription = {
    ...req.body,
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
    paymentHistory: req.body.paymentHistory || [] // Default to empty payment history
  };
  
  subscriptions.push(newSubscription);
  res.status(201).json(newSubscription);
});

// Update subscription
app.put('/api/subscriptions/:id', (req, res) => {
  const { id } = req.params;
  const index = subscriptions.findIndex(sub => sub.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  
  subscriptions[index] = {
    ...subscriptions[index],
    ...req.body,
    id, // Ensure ID doesn't change
    updatedAt: new Date()
  };
  
  res.json(subscriptions[index]);
});

// Delete subscription
app.delete('/api/subscriptions/:id', (req, res) => {
  const { id } = req.params;
  const index = subscriptions.findIndex(sub => sub.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  
  subscriptions.splice(index, 1);
  res.status(204).send();
});

// Update subscription status (pause/resume/cancel)
app.patch('/api/subscriptions/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const index = subscriptions.findIndex(sub => sub.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  
  if (!['active', 'paused', 'canceled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  subscriptions[index].status = status;
  subscriptions[index].updatedAt = new Date();
  
  res.json(subscriptions[index]);
});

// Update subscription payment status
app.patch('/api/subscriptions/:id/payment', (req, res) => {
  const { id } = req.params;
  const { markAsPaid } = req.body; // true to mark as paid, false to mark as unpaid
  
  const index = subscriptions.findIndex(sub => sub.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  
  const subscription = subscriptions[index];
  const currentPeriod = getCurrentBillingPeriod(subscription);
  
  if (markAsPaid) {
    // Check if already paid for current period
    if (isCurrentPeriodPaid(subscription)) {
      return res.status(400).json({ error: 'Subscription is already paid for the current period' });
    }
    
    // Add payment record for current period
    subscription.paymentHistory.push({
      paidDate: new Date(),
      billingPeriodStart: currentPeriod.start,
      billingPeriodEnd: currentPeriod.end
    });
  } else {
    // Remove payment record for current period
    subscription.paymentHistory = subscription.paymentHistory.filter(payment => {
      const periodStart = new Date(payment.billingPeriodStart);
      const periodEnd = new Date(payment.billingPeriodEnd);
      
      // Keep payments that don't cover the current period
      return !(
        periodStart <= currentPeriod.start &&
        periodEnd >= currentPeriod.end
      );
    });
  }
  
  subscription.updatedAt = new Date();
  res.json(subscription);
});

// Get analytics data
app.get('/api/analytics', (req, res) => {
  const { year } = req.query;
  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  
  const yearSubs = subscriptions.filter(sub => 
    new Date(sub.createdAt).getFullYear() === targetYear
  );
  
  const activeSubs = yearSubs.filter(sub => sub.status === 'active');
  
  // Calculate monthly total
  const monthlyTotal = activeSubs.reduce((sum, sub) => {
    let monthlyAmount = sub.price;
    if (sub.billingCycle === 'yearly') {
      monthlyAmount = sub.price / 12;
    } else if (sub.billingCycle === 'custom' && sub.customInterval) {
      monthlyAmount = (sub.price * 30) / sub.customInterval;
    }
    return sum + monthlyAmount;
  }, 0);
  
  // Category breakdown
  const categoryTotals = activeSubs.reduce((acc, sub) => {
    let monthlyAmount = sub.price;
    if (sub.billingCycle === 'yearly') {
      monthlyAmount = sub.price / 12;
    } else if (sub.billingCycle === 'custom' && sub.customInterval) {
      monthlyAmount = (sub.price * 30) / sub.customInterval;
    }
    
    acc[sub.category] = (acc[sub.category] || 0) + monthlyAmount;
    return acc;
  }, {});
  
  // Upcoming renewals (next 30 days)
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingRenewals = subscriptions.filter(sub => {
    const renewalDate = new Date(sub.renewalDate);
    return sub.status === 'active' && renewalDate >= now && renewalDate <= thirtyDaysLater;
  });
  
  res.json({
    monthlyTotal,
    yearlyTotal: monthlyTotal * 12,
    activeCount: activeSubs.length,
    totalCount: subscriptions.length,
    categoryTotals,
    upcomingRenewals,
    unpaidCount: subscriptions.filter(sub => sub.status === 'active' && !isCurrentPeriodPaid(sub)).length
  });
});

// Get upcoming renewals
app.get('/api/renewals/upcoming', (req, res) => {
  const { days = 30 } = req.query;
  const now = new Date();
  const futureDate = new Date(now.getTime() + parseInt(days) * 24 * 60 * 60 * 1000);
  
  const upcoming = subscriptions.filter(sub => {
    const renewalDate = new Date(sub.renewalDate);
    return sub.status === 'active' && renewalDate >= now && renewalDate <= futureDate;
  });
  
  res.json(upcoming);
});

// Get overdue subscriptions
app.get('/api/renewals/overdue', (req, res) => {
  const now = new Date();
  
  const overdue = subscriptions.filter(sub => {
    const renewalDate = new Date(sub.renewalDate);
    return sub.status === 'active' && renewalDate < now && !isCurrentPeriodPaid(sub);
  });
  
  res.json(overdue);
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  settings = { ...settings, ...req.body };
  res.json(settings);
});

// Payment methods endpoints
app.get('/api/payment-methods', (req, res) => {
  res.json(paymentMethods);
});

app.post('/api/payment-methods', (req, res) => {
  const newPaymentMethod = {
    ...req.body,
    id: uuidv4()
  };
  
  paymentMethods.push(newPaymentMethod);
  res.status(201).json(newPaymentMethod);
});

app.put('/api/payment-methods/:id', (req, res) => {
  const { id } = req.params;
  const index = paymentMethods.findIndex(pm => pm.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Payment method not found' });
  }
  
  paymentMethods[index] = { ...paymentMethods[index], ...req.body, id };
  res.json(paymentMethods[index]);
});

app.delete('/api/payment-methods/:id', (req, res) => {
  const { id } = req.params;
  const index = paymentMethods.findIndex(pm => pm.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Payment method not found' });
  }
  
  // Check if payment method is being used
  const isInUse = subscriptions.some(sub => 
    sub.creditCardId === id || sub.bankId === id
  );
  
  if (isInUse) {
    return res.status(400).json({ 
      error: 'Payment method is in use by one or more subscriptions' 
    });
  }
  
  paymentMethods.splice(index, 1);
  res.status(204).send();
});

// Notification/reminder endpoints
app.get('/api/reminders', (req, res) => {
  const now = new Date();
  
  const reminders = subscriptions.filter(sub => {
    if (!sub.cancelReminder?.enabled || sub.status !== 'active') {
      return false;
    }
    
    const renewalDate = new Date(sub.renewalDate);
    const reminderDate = new Date(renewalDate.getTime() + sub.cancelReminder.daysAfterDue * 24 * 60 * 60 * 1000);
    
    return now >= reminderDate;
  });
  
  res.json(reminders);
});

// Reset data endpoint (for testing)
app.post('/api/reset', (req, res) => {
  subscriptions = [
    {
      id: '1',
      name: 'Netflix',
      category: 'Entertainment',
      price: 15.99,
      currency: 'USD',
      billingCycle: 'monthly',
      renewalDate: new Date('2026-02-15'),
      paymentMethod: 'credit-card',
      creditCardId: 'card_1',
      notes: 'Premium subscription',
      status: 'active',
      paymentHistory: [
        {
          paidDate: new Date('2026-01-16'),
          billingPeriodStart: new Date('2026-01-16'),
          billingPeriodEnd: new Date('2026-02-15')
        }
      ],
      cancelReminder: {
        enabled: true,
        daysAfterDue: 3
      },
      createdAt: new Date('2025-12-15'),
      updatedAt: new Date('2025-12-15')
    }
  ];
  
  res.json({ message: 'Data reset successfully' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Mock Subscription Tracker API server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET    /health');
  console.log('  GET    /api/subscriptions');
  console.log('  GET    /api/subscriptions/:id');
  console.log('  POST   /api/subscriptions');
  console.log('  PUT    /api/subscriptions/:id');
  console.log('  DELETE /api/subscriptions/:id');
  console.log('  PATCH  /api/subscriptions/:id/status');
  console.log('  PATCH  /api/subscriptions/:id/payment');
  console.log('  GET    /api/analytics');
  console.log('  GET    /api/renewals/upcoming');
  console.log('  GET    /api/renewals/overdue');
  console.log('  GET    /api/settings');
  console.log('  PUT    /api/settings');
  console.log('  GET    /api/payment-methods');
  console.log('  POST   /api/payment-methods');
  console.log('  PUT    /api/payment-methods/:id');
  console.log('  DELETE /api/payment-methods/:id');
  console.log('  GET    /api/reminders');
  console.log('  POST   /api/reset');
});
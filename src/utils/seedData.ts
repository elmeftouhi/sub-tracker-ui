import { db } from './database';
import type { Subscription } from '../types/subscription';
import { v4 as uuidv4 } from 'uuid';

// Sample subscription data for different years
const sampleSubscriptions = [
  // 2023 subscriptions
  {
    name: 'Netflix',
    category: 'Streaming',
    price: 15.99,
    currency: 'USD',
    billingCycle: 'monthly' as const,
    paymentMethod: 'credit-card' as const,
    status: 'active' as const,
    paid: true,
    createdAt: new Date('2023-01-15'),
    renewalDate: new Date('2026-03-15'),
    notes: 'Family plan'
  },
  {
    name: 'Spotify Premium',
    category: 'Music',
    price: 9.99,
    currency: 'USD',
    billingCycle: 'monthly' as const,
    paymentMethod: 'credit-card' as const,
    status: 'active' as const,
    paid: true,
    createdAt: new Date('2023-02-01'),
    renewalDate: new Date('2026-02-20'),
    notes: 'Student discount'
  },
  {
    name: 'Adobe Creative Suite',
    category: 'Software',
    price: 239.88,
    currency: 'USD',
    billingCycle: 'yearly' as const,
    paymentMethod: 'credit-card' as const,
    status: 'active' as const,
    paid: true,
    createdAt: new Date('2023-03-10'),
    renewalDate: new Date('2026-03-10'),
    notes: 'Photography plan'
  },
  
  // 2024 subscriptions
  {
    name: 'Microsoft Office 365',
    category: 'Productivity',
    price: 99.99,
    currency: 'USD',
    billingCycle: 'yearly' as const,
    paymentMethod: 'bank-transfer' as const,
    status: 'active' as const,
    paid: true,
    createdAt: new Date('2024-01-05'),
    renewalDate: new Date('2026-01-05'),
    notes: 'Personal use'
  },
  {
    name: 'Amazon Prime',
    category: 'Other',
    price: 139.00,
    currency: 'USD',
    billingCycle: 'yearly' as const,
    paymentMethod: 'credit-card' as const,
    status: 'active' as const,
    paid: true,
    createdAt: new Date('2024-02-14'),
    renewalDate: new Date('2026-02-14'),
    notes: 'Prime membership'
  },
  {
    name: 'Disney+',
    category: 'Streaming',
    price: 7.99,
    currency: 'USD',
    billingCycle: 'monthly' as const,
    paymentMethod: 'credit-card' as const,
    status: 'active' as const,
    paid: true,
    createdAt: new Date('2024-04-20'),
    renewalDate: new Date('2026-03-05'),
    notes: 'Annual promotion'
  },
  {
    name: 'GitHub Pro',
    category: 'Software',
    price: 48.00,
    currency: 'USD',
    billingCycle: 'yearly' as const,
    paymentMethod: 'credit-card' as const,
    status: 'active' as const,
    paid: true,
    createdAt: new Date('2024-06-01'),
    renewalDate: new Date('2026-06-01'),
    notes: 'Developer tools'
  },
  
  // 2025 subscriptions
  {
    name: 'Notion Pro',
    category: 'Productivity',
    price: 96.00,
    currency: 'USD',
    billingCycle: 'yearly' as const,
    paymentMethod: 'credit-card' as const,
    status: 'active' as const,
    paid: true,
    createdAt: new Date('2025-01-10'),
    renewalDate: new Date('2026-01-10'),
    notes: 'Team workspace'
  },
  {
    name: 'HBO Max',
    category: 'Streaming',
    price: 14.99,
    currency: 'USD',
    billingCycle: 'monthly' as const,
    paymentMethod: 'credit-card' as const,
    status: 'paused' as const,
    paid: true,
    createdAt: new Date('2025-03-15'),
    renewalDate: new Date('2026-04-15'),
    notes: 'Paused during summer'
  },
  {
    name: 'Figma Professional',
    category: 'Software',
    price: 144.00,
    currency: 'USD',
    billingCycle: 'yearly' as const,
    paymentMethod: 'credit-card' as const,
    status: 'active' as const,
    paid: true,
    createdAt: new Date('2025-05-20'),
    renewalDate: new Date('2026-05-20'),
    notes: 'Design tools'
  },
  {
    name: 'ChatGPT Plus',
    category: 'Software',
    price: 20.00,
    currency: 'USD',
    billingCycle: 'monthly' as const,
    paymentMethod: 'credit-card' as const,
    status: 'active' as const,
    paid: true,
    createdAt: new Date('2025-07-01'),
    renewalDate: new Date('2026-02-28'),
    notes: 'AI assistant'
  },
  {
    name: 'Apple iCloud+',
    category: 'Cloud Storage',
    price: 2.99,
    currency: 'USD',
    billingCycle: 'monthly' as const,
    paymentMethod: 'credit-card' as const,
    status: 'active' as const,
    paid: true,
    createdAt: new Date('2025-08-15'),
    renewalDate: new Date('2026-02-15'),
    notes: '200GB storage'
  },
  
  // 2026 subscriptions (this year)
  {
    name: 'Canva Pro',
    category: 'Software',
    price: 119.99,
    currency: 'USD',
    billingCycle: 'yearly' as const,
    paymentMethod: 'credit-card' as const,
    status: 'active' as const,
    paid: true,
    createdAt: new Date('2026-01-01'),
    renewalDate: new Date('2027-01-01'),
    notes: 'Design platform'
  },
  {
    name: 'YouTube Premium',
    category: 'Streaming',
    price: 11.99,
    currency: 'USD',
    billingCycle: 'monthly' as const,
    paymentMethod: 'credit-card' as const,
    status: 'active' as const,
    paid: false, // Triggers overdue notification
    createdAt: new Date('2026-01-15'),
    renewalDate: new Date('2026-02-01'), // Past due
    notes: 'Ad-free videos',
    cancelReminder: {
      enabled: true,
      daysAfterDue: 2 // Will trigger cancel reminder since it's been 3 days
    }
  },
  {
    name: 'Dropbox Plus',
    category: 'Cloud Storage',
    price: 119.88,
    currency: 'USD',
    billingCycle: 'yearly' as const,
    paymentMethod: 'bank-transfer' as const,
    status: 'active' as const,
    paid: true,
    createdAt: new Date('2026-02-01'),
    renewalDate: new Date('2026-02-04'), // Today! Triggers renewal today notification
    notes: '2TB storage'
  },
  {
    name: 'Slack Pro',
    category: 'Productivity',
    price: 8.75,
    currency: 'USD',
    billingCycle: 'monthly' as const,
    paymentMethod: 'credit-card' as const,
    status: 'active' as const,
    paid: true,
    createdAt: new Date('2026-01-05'),
    renewalDate: new Date('2026-02-05'), // Tomorrow - upcoming renewal
    notes: 'Team communication'
  },
  {
    name: 'Grammarly Premium',
    category: 'Productivity',
    price: 144.00,
    currency: 'USD',
    billingCycle: 'yearly' as const,
    paymentMethod: 'credit-card' as const,
    status: 'active' as const,
    paid: false, // Overdue
    createdAt: new Date('2026-01-15'),
    renewalDate: new Date('2026-01-30'), // 5 days overdue
    notes: 'Writing assistant'
  },
  {
    name: 'Zoom Pro',
    category: 'Productivity',
    price: 14.99,
    currency: 'USD',
    billingCycle: 'monthly' as const,
    paymentMethod: 'credit-card' as const,
    status: 'active' as const,
    paid: true,
    createdAt: new Date('2026-01-07'),
    renewalDate: new Date('2026-02-07'), // 3 days from now - upcoming renewal
    notes: 'Video conferencing'
  },
  
  // Some canceled subscriptions to show variety
  {
    name: 'Hulu',
    category: 'Streaming',
    price: 12.99,
    currency: 'USD',
    billingCycle: 'monthly' as const,
    paymentMethod: 'credit-card' as const,
    status: 'canceled' as const,
    createdAt: new Date('2024-05-01'),
    renewalDate: new Date('2024-08-01'),
    notes: 'Canceled due to price increase'
  },
  {
    name: 'New York Times',
    category: 'News',
    price: 17.00,
    currency: 'USD',
    billingCycle: 'monthly' as const,
    paymentMethod: 'credit-card' as const,
    status: 'canceled' as const,
    createdAt: new Date('2023-09-01'),
    renewalDate: new Date('2024-02-01'),
    notes: 'Digital subscription'
  },
  // 2026 (Current year) - Active subscriptions
  {
    id: '16',
    name: 'GitHub Pro',
    price: 4.00,
    billingCycle: 'monthly' as const,
    category: 'Development',
    nextBilling: '2026-02-15',
    renewalDate: '2026-02-15',
    status: 'active' as const,
    createdAt: '2026-01-01',
      paymentMethod: 'credit_card',
      creditCardId: 'card1',
      notes: 'Professional development tools and private repositories'
    },
    {
      id: '17', 
      name: 'ChatGPT Plus',
      price: 20.00,
      billingCycle: 'monthly' as const,
      category: 'AI & Tools',
      nextBilling: '2026-02-10',
      renewalDate: '2026-02-10', 
      status: 'active' as const,
      createdAt: '2026-01-10',
      paymentMethod: 'credit_card',
      creditCardId: 'card1',
      notes: 'AI assistant for productivity and development'
    },
    {
      id: '18',
      name: 'Figma Professional',
      price: 144.00,
      billingCycle: 'yearly' as const,
      category: 'Design',
      nextBilling: '2027-01-15',
      renewalDate: '2027-01-15',
      status: 'active' as const,
      createdAt: '2026-01-15',
      paymentMethod: 'bank_transfer',
      bankAccountId: 'bank1',
      notes: 'Professional design and prototyping tool'
    },
    {
      id: '19',
      name: 'Discord Nitro',
      price: 9.99,
      billingCycle: 'monthly' as const,
      category: 'Gaming',
      nextBilling: '2026-02-20',
      renewalDate: '2026-02-20',
      status: 'active' as const,
      createdAt: '2026-01-20',
      paymentMethod: 'credit_card',
      creditCardId: 'card2',
      notes: 'Enhanced Discord experience with better video quality'
    }];

export const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    // Clear existing data
    await db.subscriptions.clear();
    console.log('Cleared existing subscriptions');

    // Add sample subscriptions
    const subscriptionsToAdd = sampleSubscriptions.map(sub => ({
      ...sub,
      id: uuidv4(),
      currency: sub.currency || 'USD',
      paymentHistory: Math.random() > 0.2 ? [{
        paidDate: new Date(),
        billingPeriodStart: new Date(sub.createdAt || Date.now()),
        billingPeriodEnd: new Date(sub.renewalDate || Date.now())
      }] : [], // Randomly assign payment status
      updatedAt: new Date(),
      createdAt: new Date(sub.createdAt),
      renewalDate: new Date(sub.renewalDate || sub.nextBilling || sub.createdAt),
      paymentMethod: (sub.paymentMethod || 'cash') as 'cash' | 'credit-card' | 'bank-transfer'
    })) as Subscription[];

    await db.subscriptions.bulkAdd(subscriptionsToAdd);
    console.log(`Added ${subscriptionsToAdd.length} sample subscriptions`);

    // Add sample settings data
    const sampleSettings = {
      creditCards: [
        {
          id: '1',
          name: 'Main Visa',
          lastFour: '1234',
          type: 'visa',
          expiryMonth: '12',
          expiryYear: '2027',
          isDefault: true
        },
        {
          id: '2',
          name: 'Backup Mastercard',
          lastFour: '5678',
          type: 'mastercard',
          expiryMonth: '08',
          expiryYear: '2028',
          isDefault: false
        }
      ],
      banks: [
        {
          id: '1',
          name: 'Chase Bank',
          accountName: 'Main Checking',
          accountLastFour: '9876',
          isDefault: true
        },
        {
          id: '2',
          name: 'Wells Fargo',
          accountName: 'Savings Account',
          accountLastFour: '5432',
          isDefault: false
        }
      ],
      categories: [
        'Streaming',
        'Software',
        'Gaming',
        'Music',
        'Productivity',
        'Cloud Storage',
        'VPN',
        'News',
        'Education',
        'Health & Fitness',
        'Other'
      ],
      currencies: ['USD', 'EUR', 'GBP', 'CAD'],
      defaultCurrency: 'USD'
    };

    localStorage.setItem('subtrack-settings', JSON.stringify(sampleSettings));
    console.log('Added sample settings');

    // Add notification settings
    const notificationSettings = {
      enabled: true,
      daysBeforeRenewal: [7, 1],
      quiet: false,
      quietStart: '22:00',
      quietEnd: '08:00'
    };

    localStorage.setItem('subtrack-notification-settings', JSON.stringify(notificationSettings));
    console.log('Added sample notification settings');

    console.log('Database seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
};

// Function to check if database is already seeded
export const isDatabaseSeeded = async () => {
  try {
    const count = await db.subscriptions.count();
    return count > 0;
  } catch (error) {
    console.error('Error checking database:', error);
    return false;
  }
};

// Auto-seed on first load
export const autoSeedIfEmpty = async () => {
  const isSeeded = await isDatabaseSeeded();
  if (!isSeeded) {
    console.log('🌱 Database is empty, auto-seeding with sample data...');
    await seedDatabase();
    console.log('📊 Sample data includes subscriptions from 2023-2026 for analytics testing');
    console.log('🔍 Try the Analytics page to see year navigation in action!');
  }
};

// Utility to add more current year subscriptions for better testing
export const addCurrentYearTestData = async (): Promise<void> => {
  try {
    const currentYear = new Date().getFullYear();
    const currentYearSubs = sampleSubscriptions.filter(sub => 
      new Date(sub.createdAt).getFullYear() === currentYear
    );
    
    // Check if current year subscriptions already exist
    const existingCount = await db.subscriptions
      .where('createdAt')
      .between(`${currentYear}-01-01`, `${currentYear}-12-31`)
      .count();
    
    if (existingCount === 0 && currentYearSubs.length > 0) {
      const subsWithIds = currentYearSubs.map(sub => ({
        ...sub,
        id: uuidv4(),
        currency: sub.currency || 'USD',
        paymentHistory: Math.random() > 0.2 ? [{
          paidDate: new Date(),
          billingPeriodStart: new Date(sub.createdAt || Date.now()),
          billingPeriodEnd: new Date(sub.renewalDate || Date.now())
        }] : [], // Randomly assign payment status
        updatedAt: new Date(),
        createdAt: new Date(sub.createdAt),
        renewalDate: new Date(sub.renewalDate || sub.nextBilling || sub.createdAt),
        paymentMethod: (sub.paymentMethod || 'cash') as 'cash' | 'credit-card' | 'bank-transfer'
      })) as Subscription[];
      await db.subscriptions.bulkAdd(subsWithIds);
      console.log(`✅ Added ${currentYearSubs.length} test subscriptions for ${currentYear}`);
    }
  } catch (error) {
    console.error('❌ Error adding current year test data:', error);
  }
};
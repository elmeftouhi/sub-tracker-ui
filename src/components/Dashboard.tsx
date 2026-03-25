import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { formatCurrency, calculateMonthlyEquivalent, isRenewalSoon } from '../utils/helpers';
import { isCurrentPeriodPaid } from '../utils/paymentUtils';

const Dashboard: React.FC = () => {
  const { subscriptions, loading } = useSubscriptions();

  const stats = useMemo(() => {
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    
    const monthlyTotal = activeSubscriptions.reduce((total, sub) => {
      return total + calculateMonthlyEquivalent(sub.price, sub.billingCycle, sub.customInterval);
    }, 0);

    const yearlyTotal = monthlyTotal * 12;

    const upcomingRenewals = activeSubscriptions.filter(sub => 
      isRenewalSoon(new Date(sub.renewalDate)) && !isCurrentPeriodPaid(sub) // Only unpaid subscriptions
    ).sort((a, b) => 
      new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()
    );

    // Get renewals for different time periods
    const today = new Date();
    const renewalsToday = activeSubscriptions.filter(sub => {
      const renewalDate = new Date(sub.renewalDate);
      return renewalDate.toDateString() === today.toDateString();
    });

    const renewalsTomorrow = activeSubscriptions.filter(sub => {
      const renewalDate = new Date(sub.renewalDate);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return renewalDate.toDateString() === tomorrow.toDateString();
    });

    const renewalsThisWeek = activeSubscriptions.filter(sub => {
      const renewalDate = new Date(sub.renewalDate);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return renewalDate >= today && renewalDate <= weekFromNow;
    });

    // Calculate cancellation reminders
    const cancelReminders = activeSubscriptions.filter(sub => {
      if (!sub.cancelReminder?.enabled) return false;
      
      const renewalDate = new Date(sub.renewalDate);
      const daysPastDue = Math.floor((today.getTime() - renewalDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysPastDue >= sub.cancelReminder.daysAfterDue;
    });

    const upcomingCancelReminders = activeSubscriptions.filter(sub => {
      if (!sub.cancelReminder?.enabled) return false;
      
      const renewalDate = new Date(sub.renewalDate);
      const daysPastDue = Math.floor((today.getTime() - renewalDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilReminder = sub.cancelReminder.daysAfterDue - daysPastDue;
      
      return daysUntilReminder > 0 && daysUntilReminder <= 3;
    });

    return {
      totalSubscriptions: activeSubscriptions.length,
      monthlyTotal,
      yearlyTotal,
      upcomingRenewals,
      renewalsToday,
      renewalsTomorrow,
      renewalsThisWeek,
      cancelReminders,
      upcomingCancelReminders
    };
  }, [subscriptions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        {stats.renewalsToday.length > 0 && (
          <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">
              {stats.renewalsToday.length} renewal{stats.renewalsToday.length > 1 ? 's' : ''} today
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Active</h3>
            <div className="w-8 h-8 bg-blue-100 rounded-lg hidden sm:flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalSubscriptions}</p>
          <p className="text-xs text-gray-500">Active services</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md border border-green-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-700">Monthly Total</h3>
            <div className="w-8 h-8 bg-green-200 rounded-lg hidden sm:flex items-center justify-center">
              <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-700 mb-1">{formatCurrency(stats.monthlyTotal)}</p>
          <p className="text-xs text-green-600">Per month</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-md border border-blue-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-700">Yearly Projection</h3>
            <div className="w-8 h-8 bg-blue-200 rounded-lg hidden sm:flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-700 mb-1">{formatCurrency(stats.yearlyTotal)}</p>
          <p className="text-xs text-blue-600">Annual cost</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-md border border-orange-200 hover:shadow-lg transition-shadow relative">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-orange-700">This Week</h3>
            <div className="w-8 h-8 bg-orange-200 rounded-lg hidden sm:flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-700 mb-1">{stats.renewalsThisWeek.length}</p>
          <p className="text-xs text-orange-600">Coming up</p>
          {stats.renewalsThisWeek.length > 0 && (
            <div className="absolute top-3 right-3 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Analytics CTA */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Get Deep Insights</h3>
            <p className="text-blue-100 mb-4">
              Analyze your spending patterns, discover savings opportunities, and make informed decisions about your subscriptions.
            </p>
            <Link
              to="/analytics"
              className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors"
            >
              View Analytics
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          <div className="hidden md:block">
            <svg className="w-16 h-16 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Upcoming Renewals */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Unpaid Upcoming Renewals</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.upcomingRenewals.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No unpaid renewals in the next 7 days
            </div>
          ) : (
            stats.upcomingRenewals.map((subscription) => {
              const daysUntil = Math.ceil((new Date(subscription.renewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={subscription.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">{subscription.name}</h3>
                    <p className="text-sm text-gray-500">{subscription.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(subscription.price, subscription.currency)}
                    </p>
                    <p className={`text-sm ${daysUntil <= 1 ? 'text-red-600 font-medium' : daysUntil <= 3 ? 'text-orange-600' : 'text-gray-600'}`}>
                      {daysUntil === 0 ? 'Today' : 
                       daysUntil === 1 ? 'Tomorrow' :
                       `In ${daysUntil} days`}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {subscriptions.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Welcome to SubTrack!</h3>
          <p className="text-blue-700 mb-4">
            Start by adding your first subscription to track your expenses and get notified about renewals.
          </p>
          <a
            href="/add"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Your First Subscription
          </a>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SubscriptionList from './components/SubscriptionList';
import AddSubscription from './components/AddSubscription';
import Settings from './components/Settings';
import Analytics from './components/Analytics';
import SubscriptionDetails from './components/SubscriptionDetails';
import { useSubscriptions } from './hooks/useSubscriptions';
import { notificationService } from './utils/notificationService';
import { cancelReminderService } from './utils/cancelReminderService';
import { checkAndMigrate } from './utils/paymentMigration';
import { autoSeedIfEmpty } from './utils/seedData';
import './utils/resetDatabase'; // Import for global access

function App() {
  const { subscriptions } = useSubscriptions();

  useEffect(() => {
    // Auto-seed database with sample data if empty
    autoSeedIfEmpty();
    
    // Run payment method migration if needed
    checkAndMigrate();
    
    // Start notification monitoring
    notificationService.startMonitoring();

    // Start cancel reminder monitoring
    cancelReminderService.startMonitoring();

    // Listen for notification check events
    const handleNotificationCheck = () => {
      notificationService.checkSubscriptions(subscriptions);
    };

    window.addEventListener('check-notifications', handleNotificationCheck);

    // Check notifications immediately when subscriptions change
    if (subscriptions.length > 0) {
      notificationService.checkSubscriptions(subscriptions);
    }

    // Cleanup old notification markers daily
    const cleanup = () => notificationService.cleanupOldNotifications();
    const cleanupInterval = setInterval(cleanup, 24 * 60 * 60 * 1000); // Daily

    return () => {
      window.removeEventListener('check-notifications', handleNotificationCheck);
      notificationService.stopMonitoring();
      cancelReminderService.stopMonitoring();
      clearInterval(cleanupInterval);
    };
  }, [subscriptions]);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/subscriptions" element={<SubscriptionList />} />
          <Route path="/subscription/:id" element={<SubscriptionDetails />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/add" element={<AddSubscription />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Bell, Plus } from 'lucide-react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import type { Subscription } from '../types/subscription';
import { isCurrentPeriodPaid } from '../utils/paymentUtils';

interface LayoutProps {
  children: React.ReactNode;
}

interface Notification {
  id: string;
  type: 'overdue' | 'renewal' | 'cancel';
  title: string;
  message: string;
  subscription: Subscription;
  priority: 'high' | 'medium' | 'low';
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { subscriptions } = useSubscriptions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/subscriptions', label: 'Subscriptions' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/settings', label: 'Settings' },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Calculate notifications
  const getNotifications = (): Notification[] => {
    const today = new Date();
    const notifications: Notification[] = [];

    subscriptions.forEach(sub => {
      if (sub.status !== 'active') return;

      const renewalDate = new Date(sub.renewalDate);
      const daysDiff = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Overdue subscriptions (past renewal date and not paid)
      if (daysDiff < 0 && !isCurrentPeriodPaid(sub)) {
        notifications.push({
          id: `overdue-${sub.id}`,
          type: 'overdue',
          title: `${sub.name} is overdue`,
          message: `Payment was due ${Math.abs(daysDiff)} days ago`,
          subscription: sub,
          priority: 'high'
        });
      }
      
      // Renewals today
      else if (daysDiff === 0) {
        notifications.push({
          id: `today-${sub.id}`,
          type: 'renewal',
          title: `${sub.name} renews today`,
          message: `Don't forget to review your subscription`,
          subscription: sub,
          priority: 'high'
        });
      }
      
      // Renewals within 3 days
      else if (daysDiff > 0 && daysDiff <= 3) {
        notifications.push({
          id: `upcoming-${sub.id}`,
          type: 'renewal',
          title: `${sub.name} renews soon`,
          message: `Renewal in ${daysDiff} day${daysDiff === 1 ? '' : 's'}`,
          subscription: sub,
          priority: 'medium'
        });
      }

      // Active cancellation reminders
      if (sub.cancelReminder?.enabled) {
        const daysPastDue = Math.floor((today.getTime() - renewalDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysPastDue >= sub.cancelReminder.daysAfterDue) {
          notifications.push({
            id: `cancel-${sub.id}`,
            type: 'cancel',
            title: `Consider canceling ${sub.name}`,
            message: `Cancellation reminder is active`,
            subscription: sub,
            priority: 'medium'
          });
        }
      }
    });

    return notifications.sort((a, b) => {
      const priorityOrder: Record<'high' | 'medium' | 'low', number> = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const notifications = getNotifications();
  const notificationCount = notifications.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">
                SubTrack
              </Link>
            </div>
            
            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path) 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Notifications {notificationCount > 0 && `(${notificationCount})`}
                      </h3>
                      
                      {notifications.length === 0 ? (
                        <div className="text-center py-4">
                          <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No notifications</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-3 rounded-md border-l-4 ${
                                notification.priority === 'high'
                                  ? 'bg-red-50 border-red-400'
                                  : notification.priority === 'medium'
                                  ? 'bg-yellow-50 border-yellow-400'
                                  : 'bg-blue-50 border-blue-400'
                              }`}
                            >
                              <div className="flex items-start">
                                <div className="flex-1">
                                  <p className={`text-sm font-medium ${
                                    notification.priority === 'high'
                                      ? 'text-red-800'
                                      : notification.priority === 'medium'
                                      ? 'text-yellow-800'
                                      : 'text-blue-800'
                                  }`}>
                                    {notification.title}
                                  </p>
                                  <p className={`text-xs ${
                                    notification.priority === 'high'
                                      ? 'text-red-600'
                                      : notification.priority === 'medium'
                                      ? 'text-yellow-600'
                                      : 'text-blue-600'
                                  }`}>
                                    {notification.message}
                                  </p>
                                </div>
                                <Link
                                to={`/subscription/${notification.subscription?.id || 'unknown'}`}
                                onClick={() => {
                                  console.log('Notification:', notification);
                                  console.log('Subscription ID:', notification.subscription?.id);
                                  setIsNotificationOpen(false);
                                }}
                                  className={`text-xs px-2 py-1 rounded ${
                                    notification.priority === 'high'
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                      : notification.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  } transition-colors`}
                                >
                                  View
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <Link
                to="/add"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Add Subscription
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Add Subscription Button */}
              <Link
                to="/add"
                className="bg-blue-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </Link>
              
              {/* Mobile Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>

                {/* Desktop Notification Dropdown */}
                {isNotificationOpen && (
                  <div className="hidden md:block absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Notifications {notificationCount > 0 && `(${notificationCount})`}
                      </h3>
                      
                      {notifications.length === 0 ? (
                        <div className="text-center py-4">
                          <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No notifications</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-3 rounded-md border-l-4 ${
                                notification.priority === 'high'
                                  ? 'bg-red-50 border-red-400'
                                  : notification.priority === 'medium'
                                  ? 'bg-yellow-50 border-yellow-400'
                                  : 'bg-blue-50 border-blue-400'
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-start">
                                <div className="flex-1">
                                  <p className={`text-sm font-medium ${
                                    notification.priority === 'high'
                                      ? 'text-red-800'
                                      : notification.priority === 'medium'
                                      ? 'text-yellow-800'
                                      : 'text-blue-800'
                                  }`}>
                                    {notification.title}
                                  </p>
                                  <p className={`text-xs ${
                                    notification.priority === 'high'
                                      ? 'text-red-600'
                                      : notification.priority === 'medium'
                                      ? 'text-yellow-600'
                                      : 'text-blue-600'
                                  }`}>
                                    {notification.message}
                                  </p>
                                </div>
                                <Link
                                  to="/subscriptions"
                                  onClick={() => setIsNotificationOpen(false)}
                                  className={`text-xs px-2 py-1 rounded ${
                                    notification.priority === 'high'
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                      : notification.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  } transition-colors`}
                                >
                                  View
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-3 space-y-3">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.path) 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              <div className="pt-3 border-t border-gray-200">
                <Link
                  to="/add"
                  onClick={closeMobileMenu}
                  className="block w-full bg-blue-600 text-white px-4 py-3 rounded-md text-base font-medium hover:bg-blue-700 transition-colors text-center"
                >
                  Add Subscription
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Notification Overlay */}
        {isNotificationOpen && (
          <div 
            className="hidden md:block fixed inset-0 z-40" 
            onClick={() => setIsNotificationOpen(false)}
          />
        )}

        {/* Mobile Notification Modal */}
        {isNotificationOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsNotificationOpen(false)}
          >
            <div 
              className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Notifications {notificationCount > 0 && `(${notificationCount})`}
                </h3>
                <button
                  onClick={() => setIsNotificationOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto max-h-96">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No notifications</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-md border-l-4 ${
                          notification.priority === 'high'
                            ? 'bg-red-50 border-red-400'
                            : notification.priority === 'medium'
                            ? 'bg-yellow-50 border-yellow-400'
                            : 'bg-blue-50 border-blue-400'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-start">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              notification.priority === 'high'
                                ? 'text-red-800'
                                : notification.priority === 'medium'
                                ? 'text-yellow-800'
                                : 'text-blue-800'
                            }`}>
                              {notification.title}
                            </p>
                            <p className={`text-xs mt-1 ${
                              notification.priority === 'high'
                                ? 'text-red-600'
                                : notification.priority === 'medium'
                                ? 'text-yellow-600'
                                : 'text-blue-600'
                            }`}>
                              {notification.message}
                            </p>
                          </div>
                          <Link
                            to={`/subscription/${notification.subscription?.id || 'unknown'}`}
                            onClick={() => {
                              console.log('Mobile Notification:', notification);
                              console.log('Mobile Subscription ID:', notification.subscription?.id);
                              setIsNotificationOpen(false);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`text-xs px-3 py-2 rounded ${
                              notification.priority === 'high'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : notification.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            } transition-colors`}
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
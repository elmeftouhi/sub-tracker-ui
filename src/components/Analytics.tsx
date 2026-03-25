import React, { useState, useEffect } from 'react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import type { Subscription } from '../types/subscription';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { TrendingUp, DollarSign, Calendar, AlertTriangle, PieChart, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Analytics: React.FC = () => {
  const { subscriptions } = useSubscriptions();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [settings, setSettings] = useState({ categories: [], currencies: [], defaultCurrency: 'USD' });

  const availableYears = [
    ...new Set(subscriptions.map(sub => new Date(sub.createdAt).getFullYear()))
  ].sort((a, b) => b - a); // Sort newest first

  useEffect(() => {
    const savedSettings = localStorage.getItem('subtrack-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Filter data by selected year
  const yearFilteredSubscriptions = subscriptions.filter(sub => {
    const subYear = new Date(sub.createdAt).getFullYear();
    return subYear === selectedYear;
  });

  // Calculate key metrics for selected year
  const calculateMetrics = () => {
    const activeSubscriptions = yearFilteredSubscriptions.filter(sub => sub.status === 'active');
    
    const monthlyTotal = activeSubscriptions.reduce((sum, sub) => {
      let monthlyAmount = sub.price;
      if (sub.billingCycle === 'yearly') {
        monthlyAmount = sub.price / 12;
      } else if (sub.billingCycle === 'custom' && sub.customInterval) {
        monthlyAmount = (sub.price * 30) / sub.customInterval;
      }
      return sum + monthlyAmount;
    }, 0);

    const yearlyTotal = monthlyTotal * 12;

    // Upcoming renewals (next 30 days from current date, regardless of year filter)
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const allActiveSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    const upcomingRenewals = allActiveSubscriptions.filter(sub => {
      const renewalDate = new Date(sub.renewalDate);
      return renewalDate >= now && renewalDate <= thirtyDaysLater;
    });

    // Most expensive subscription in selected year
    const mostExpensive = activeSubscriptions.reduce((max, sub) => 
      sub.price > (max?.price || 0) ? sub : max, null as Subscription | null);

    // Category breakdown for selected year
    const categoryTotals = activeSubscriptions.reduce((acc, sub) => {
      let monthlyAmount = sub.price;
      if (sub.billingCycle === 'yearly') {
        monthlyAmount = sub.price / 12;
      } else if (sub.billingCycle === 'custom' && sub.customInterval) {
        monthlyAmount = (sub.price * 30) / sub.customInterval;
      }
      
      acc[sub.category] = (acc[sub.category] || 0) + monthlyAmount;
      return acc;
    }, {} as Record<string, number>);

    return {
      monthlyTotal,
      yearlyTotal,
      activeCount: activeSubscriptions.length,
      upcomingRenewals,
      mostExpensive,
      categoryTotals
    };
  };

  const metrics = calculateMetrics();

  // Generate monthly data for the selected year
  const generateYearlyData = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const data = months.map((_, monthIndex) => {
      const monthSubs = yearFilteredSubscriptions.filter(sub => {
        const subDate = new Date(sub.createdAt);
        return subDate.getMonth() === monthIndex && sub.status === 'active';
      });
      
      return monthSubs.reduce((sum, sub) => {
        let monthlyAmount = sub.price;
        if (sub.billingCycle === 'yearly') {
          monthlyAmount = sub.price / 12;
        } else if (sub.billingCycle === 'custom' && sub.customInterval) {
          monthlyAmount = (sub.price * 30) / sub.customInterval;
        }
        return sum + monthlyAmount;
      }, 0);
    });

    return { months, data };
  };

  const yearlyData = generateYearlyData();

  // Generate insights for the selected year
  const generateInsights = () => {
    const insights = [];
    
    // Year comparison
    if (availableYears.length > 1) {
      const previousYear = selectedYear - 1;
      if (availableYears.includes(previousYear)) {
        const previousYearSubs = subscriptions.filter(sub => {
          const subYear = new Date(sub.createdAt).getFullYear();
          return subYear === previousYear && sub.status === 'active';
        });
        
        const previousYearSpending = previousYearSubs.reduce((sum, sub) => {
          let monthlyAmount = sub.price;
          if (sub.billingCycle === 'yearly') monthlyAmount = sub.price / 12;
          return sum + monthlyAmount * 12;
        }, 0);
        
        const currentYearSpending = metrics.yearlyTotal;
        const change = ((currentYearSpending - previousYearSpending) / previousYearSpending * 100);
        
        if (Math.abs(change) > 5) {
          insights.push({
            type: change > 0 ? 'warning' : 'success',
            title: `${change > 0 ? 'Increased' : 'Decreased'} Spending`,
            message: `Your ${selectedYear} spending is ${Math.abs(change).toFixed(1)}% ${change > 0 ? 'higher' : 'lower'} than ${previousYear}`
          });
        }
      }
    }
    
    // High category spending
    const topCategory = Object.entries(metrics.categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];
    if (topCategory && topCategory[1] > metrics.monthlyTotal * 0.4) {
      insights.push({
        type: 'info',
        title: 'Category Dominance',
        message: `${topCategory[0]} accounts for ${Math.round(topCategory[1] / metrics.monthlyTotal * 100)}% of your monthly spending`
      });
    }
    
    // Subscription count insight
    if (metrics.activeCount > 10) {
      insights.push({
        type: 'warning',
        title: 'Many Active Subscriptions',
        message: `You have ${metrics.activeCount} active subscriptions. Consider reviewing for unused services.`
      });
    }
    
    return insights;
  };

  const insights = generateInsights();

  // Chart configurations
  const spendingTrendData = {
    labels: yearlyData.months,
    datasets: [
      {
        label: `Monthly Spending (${selectedYear})`,
        data: yearlyData.data,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const categoryBreakdownData = {
    labels: Object.keys(metrics.categoryTotals),
    datasets: [
      {
        label: `Category Spending (${selectedYear})`,
        data: Object.values(metrics.categoryTotals),
        backgroundColor: [
          '#3B82F6',
          '#EF4444',
          '#10B981',
          '#F59E0B',
          '#8B5CF6',
          '#EC4899',
          '#6B7280',
          '#84CC16',
          '#F97316',
          '#06B6D4',
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings.defaultCurrency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header with Year Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Insights into your subscription spending</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white border border-gray-300 rounded-lg">
            <button
              onClick={() => setSelectedYear(selectedYear - 1)}
              disabled={!availableYears.includes(selectedYear - 1)}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 font-semibold text-gray-900">{selectedYear}</span>
            <button
              onClick={() => setSelectedYear(selectedYear + 1)}
              disabled={!availableYears.includes(selectedYear + 1)}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {availableYears.length > 1 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-md border border-blue-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-700">Monthly Spending</p>
            <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-700 mb-1">{formatCurrency(metrics.monthlyTotal)}</p>
          <p className="text-xs text-blue-600">Current month</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md border border-green-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-green-700">Yearly Projection</p>
            <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-700 mb-1">{formatCurrency(metrics.yearlyTotal)}</p>
          <p className="text-xs text-green-600">Annual total</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-md border border-purple-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-purple-700">Active Subscriptions</p>
            <div className="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-purple-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-700 mb-1">{metrics.activeCount}</p>
          <p className="text-xs text-purple-600">Running services</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-md border border-orange-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-orange-700">Upcoming Renewals</p>
            <div className="w-8 h-8 bg-orange-200 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-orange-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-700 mb-1">{metrics.upcomingRenewals.length}</p>
          <p className="text-xs text-orange-600">Next 30 days</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Spending Trend</h3>
          <div className="h-64">
            <Line data={spendingTrendData} options={chartOptions} />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Spending by Category</h3>
          <div className="h-64">
            <Doughnut data={categoryBreakdownData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart Insights */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Smart Insights ({selectedYear})</h3>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`p-1 rounded ${
                  insight.type === 'warning' ? 'bg-yellow-100' :
                  insight.type === 'success' ? 'bg-green-100' :
                  insight.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  <AlertTriangle className={`w-4 h-4 ${
                    insight.type === 'warning' ? 'text-yellow-600' :
                    insight.type === 'success' ? 'text-green-600' :
                    insight.type === 'error' ? 'text-red-600' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{insight.title}</p>
                  <p className="text-sm text-gray-600">{insight.message}</p>
                </div>
              </div>
            ))}

            {metrics.mostExpensive && (
              <div className="flex items-start space-x-3">
                <div className="p-1 bg-red-100 rounded">
                  <DollarSign className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Most Expensive</p>
                  <p className="text-sm text-gray-600">
                    {metrics.mostExpensive.name} - {formatCurrency(metrics.mostExpensive.price)}/{metrics.mostExpensive.billingCycle}
                  </p>
                </div>
              </div>
            )}

            {Object.keys(metrics.categoryTotals).length > 0 && (
              <div className="flex items-start space-x-3">
                <div className="p-1 bg-blue-100 rounded">
                  <PieChart className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Top Category</p>
                  <p className="text-sm text-gray-600">
                    {Object.entries(metrics.categoryTotals)
                      .sort(([,a], [,b]) => b - a)[0]?.[0]} - {
                      formatCurrency(Object.entries(metrics.categoryTotals)
                        .sort(([,a], [,b]) => b - a)[0]?.[1] || 0)}/month
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <div className="p-1 bg-green-100 rounded">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Potential Savings</p>
                <p className="text-sm text-gray-600">
                  Consider annual billing to save up to {formatCurrency(metrics.monthlyTotal * 2)} per year
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Renewals */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Renewals</h3>
          <div className="space-y-3">
            {metrics.upcomingRenewals.length === 0 ? (
              <p className="text-gray-500 text-sm">No renewals in the next 30 days</p>
            ) : (
              metrics.upcomingRenewals.slice(0, 5).map((sub) => {
                const daysUntil = Math.ceil(
                  (new Date(sub.renewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={sub.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{sub.name}</p>
                      <p className="text-sm text-gray-500">
                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(sub.price)}</p>
                      <p className="text-sm text-gray-500">{sub.billingCycle}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
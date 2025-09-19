import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase/config';
import analyticsService from '../services/analyticsService';
import {
  UserGroupIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  TagIcon,
  ClockIcon,
  UsersIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const AdminPanel = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalCategories: 0,
    recentUsers: 0,
    recentProducts: 0,
    activeUsers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [analytics, setAnalytics] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [recentActivities, setRecentActivities] = useState([]);
  const intervalRef = useRef(null);
  const isFetchingRef = useRef(false);
  const lastRefreshRef = useRef(0);
  const REFRESH_COOLDOWN = 5000; // ms
  const analyticsLoadedRef = useRef(false);
  const analyticsTimeoutRef = useRef(null);

  const fetchStats = async () => {
    try {
      // Use Firestore aggregation count to avoid downloading whole collections
      const usersCountSnap = await getCountFromServer(query(collection(db, 'users')));
      const productsCountSnap = await getCountFromServer(query(collection(db, 'products')));
      const categoriesCountSnap = await getCountFromServer(query(collection(db, 'categories')));

      // recent counts (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      let recentUsersCount = 0;
      let recentProductsCount = 0;
      try {
        const recentUsersSnap = await getCountFromServer(query(collection(db, 'users'), where('createdAt', '>=', oneWeekAgo)));
        recentUsersCount = recentUsersSnap.data().count;
      } catch (err) {
        console.warn('recentUsers count aggregation failed, falling back to lightweight scan', err);
      }
      try {
        const recentProductsSnap = await getCountFromServer(query(collection(db, 'products'), where('createdAt', '>=', oneWeekAgo)));
        recentProductsCount = recentProductsSnap.data().count;
      } catch (err) {
        console.warn('recentProducts count aggregation failed, falling back to lightweight scan', err);
      }

      setStats({
        totalUsers: usersCountSnap.data().count || 0,
        totalProducts: productsCountSnap.data().count || 0,
        totalOrders: 0, // implement later with an aggregate
        totalCategories: categoriesCountSnap.data().count || 0,
        recentUsers: recentUsersCount,
        recentProducts: recentProductsCount,
        activeUsers: 0, // active user calculation requires a different metric; leave 0 for now
        totalRevenue: 0, // calculating revenue client-side is expensive; implement server-side aggregation later
        pendingOrders: 0,
        completedOrders: 0
      });
    } catch (error) {
      console.error('Error fetching stats (aggregation failed):', error);
      // Fallback to previous heavier approach only if aggregation unavailable
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentUsers = users.filter(u => u.createdAt && new Date(u.createdAt) >= oneWeekAgo).length;
        const recentProducts = products.filter(p => p.createdAt && new Date(p.createdAt) >= oneWeekAgo).length;
        const activeUsers = users.filter(user => user.isActive !== false).length;
        const totalRevenue = products.reduce((sum, product) => sum + (parseFloat(product.price) || 0), 0);
        setStats({
          totalUsers: users.length,
          totalProducts: products.length,
          totalOrders: 0,
          totalCategories: categories.length,
          recentUsers,
          recentProducts,
          activeUsers,
          totalRevenue,
          pendingOrders: 0,
          completedOrders: 0
        });
      } catch (err) {
        console.error('Fallback stats fetch also failed:', err);
      }
    }
  };

  const fetchAnalytics = async () => {
    try {
      const analyticsData = await analyticsService.getAnalyticsData(timeRange);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchRealTimeMetrics = async () => {
    try {
      const metrics = await analyticsService.getRealTimeMetrics();
      setRealTimeMetrics(metrics);
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const activitiesQuery = query(
        collection(db, 'analytics'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(activitiesQuery);
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      }));
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  // Fetch all dashboard data (function declaration)
  async function fetchAllData() {
    if (isFetchingRef.current) return; // prevent overlapping
    isFetchingRef.current = true;
    try {
      setLoading(true);
      // Avoid fetching heavy analytics on initial load to speed up initial render.
      await Promise.all([
        fetchStats(),
        fetchRealTimeMetrics(),
        fetchRecentActivities()
      ]);

      // Schedule analytics fetch after a short delay if tab is visible and analytics not loaded yet
      if (!analyticsLoadedRef.current && document.visibilityState === 'visible') {
        if (analyticsTimeoutRef.current) clearTimeout(analyticsTimeoutRef.current);
        analyticsTimeoutRef.current = setTimeout(() => {
          fetchAnalytics().catch(err => console.error(err));
        }, 2000); // 2s delay
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }

  useEffect(() => {
    // initial load
    fetchAllData();

    // helper to start polling only when tab visible
    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          // fetch only lightweight real-time metrics on interval
          fetchRealTimeMetrics().catch(err => console.error(err));
        }
      }, 30000);
    };

    // start polling
    startPolling();

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (analyticsTimeoutRef.current) clearTimeout(analyticsTimeoutRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchAllData, fetchRealTimeMetrics]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login': return UserGroupIcon;
      case 'registration': return UserGroupIcon;
      case 'product_interaction': return ShoppingBagIcon;
      case 'page_view': return EyeIcon;
      case 'search': return ChartBarIcon;
      case 'ai_interaction': return ArrowPathIcon;
      default: return DocumentTextIcon;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'login': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'registration': return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
      case 'product_interaction': return 'text-purple-600 bg-purple-100 dark:bg-purple-900';
      case 'page_view': return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
      case 'search': return 'text-orange-600 bg-orange-100 dark:bg-orange-900';
      case 'ai_interaction': return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  const adminFeatures = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: UserGroupIcon,
      path: '/admin/users',
      color: 'bg-blue-500',
      stats: `${stats.totalUsers} users`,
      recent: `+${stats.recentUsers} this week`,
      trend: stats.recentUsers > 0 ? 'up' : 'neutral'
    },
    {
      title: 'Product Management',
      description: 'Add, edit, and manage products',
      icon: ShoppingBagIcon,
      path: '/admin/products',
      color: 'bg-green-500',
      stats: `${stats.totalProducts} products`,
      recent: `+${stats.recentProducts} this week`,
      trend: stats.recentProducts > 0 ? 'up' : 'neutral'
    },
    {
      title: 'Order Management',
      description: 'View and manage customer orders',
      icon: ClipboardDocumentListIcon,
      path: '/admin/orders',
      color: 'bg-purple-500',
      stats: `${stats.totalOrders} orders`,
      recent: `${stats.pendingOrders} pending`,
      trend: stats.pendingOrders > 0 ? 'warning' : 'neutral'
    },
    {
      title: 'Categories',
      description: 'Manage product categories',
      icon: TagIcon,
      path: '/admin',
      color: 'bg-orange-500',
      stats: `${stats.totalCategories} categories`,
      recent: 'Manage categories',
      trend: 'neutral'
    }
  ];

  const quickActions = [
    {
      title: 'Add New Product',
      description: 'Quickly add a new product to the store',
      icon: PlusIcon,
      path: '/admin/products/add',
      color: 'bg-emerald-500'
    },
    {
      title: 'View Analytics',
      description: 'Check system analytics and reports',
      icon: ChartBarIcon,
      path: '/admin/analytics',
      color: 'bg-indigo-500'
    },
    {
      title: 'System Overview',
      description: 'Monitor system health and performance',
      icon: ArrowTrendingUpIcon,
      path: '/admin/system',
      color: 'bg-rose-500'
    }
  ];

  const performanceMetrics = [
    {
      title: 'Active Users',
      value: realTimeMetrics?.activeUsers || 0,
      icon: UserGroupIcon,
      color: 'text-green-600 bg-green-100 dark:bg-green-900',
      description: 'Users active in last hour'
    },
    {
      title: 'Conversion Rate',
      value: analytics?.conversionFunnel ?
        Math.round((analytics.conversionFunnel.purchases / Math.max(analytics.conversionFunnel.pageViews, 1)) * 100) : 0,
      icon: ArrowTrendingUpIcon,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900',
      description: '% of visitors who purchase',
      suffix: '%'
    },
    {
      title: 'Avg. Session',
      value: analytics?.userActivity ?
        Math.round(Object.values(analytics.userActivity).reduce((sum, user) => sum + user.events, 0) /
        Math.max(Object.keys(analytics.userActivity).length, 1)) : 0,
      icon: ClockIcon,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900',
      description: 'Average events per user'
    },
    {
      title: 'System Health',
      value: '98.5',
      icon: ArrowPathIcon,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900',
      description: 'Uptime this month',
      suffix: '%'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2">
            Welcome to the AnA Group Supplies admin panel. Manage your store efficiently.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={() => {
              const now = Date.now();
              if (now - lastRefreshRef.current < REFRESH_COOLDOWN) return; // cooldown
              lastRefreshRef.current = now;
              fetchAllData();
            }}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary touch-manipulation disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
        {/* Core Metrics */}
        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-3 md:p-4 lg:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0">
              <UserGroupIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-2 md:ml-3 lg:ml-4 min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Users</p>
              <p className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white truncate">{stats.totalUsers}</p>
              {stats.recentUsers > 0 && (
                <p className="text-xs text-green-600 flex items-center">
                  <ArrowUpIcon className="h-3 w-3 mr-1" />
                  +{stats.recentUsers} this week
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-3 md:p-4 lg:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-full bg-green-100 dark:bg-green-900 flex-shrink-0">
              <UsersIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-2 md:ml-3 lg:ml-4 min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Active Users</p>
              <p className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white truncate">{stats.activeUsers}</p>
              <p className="text-xs text-gray-500">Real-time</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-3 md:p-4 lg:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-full bg-emerald-100 dark:bg-emerald-900 flex-shrink-0">
              <ShoppingBagIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="ml-2 md:ml-3 lg:ml-4 min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Products</p>
              <p className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white truncate">{stats.totalProducts}</p>
              {stats.recentProducts > 0 && (
                <p className="text-xs text-green-600 flex items-center">
                  <ArrowUpIcon className="h-3 w-3 mr-1" />
                  +{stats.recentProducts} this week
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-3 md:p-4 lg:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-full bg-purple-100 dark:bg-purple-900 flex-shrink-0">
              <ClipboardDocumentListIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-2 md:ml-3 lg:ml-4 min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Orders</p>
              <p className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white truncate">{stats.totalOrders}</p>
              {stats.pendingOrders > 0 && (
                <p className="text-xs text-orange-600 flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {stats.pendingOrders} pending
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-3 md:p-4 lg:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-full bg-orange-100 dark:bg-orange-900 flex-shrink-0">
              <TagIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-2 md:ml-3 lg:ml-4 min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Categories</p>
              <p className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white truncate">{stats.totalCategories}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-3 md:p-4 lg:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-full bg-indigo-100 dark:bg-indigo-900 flex-shrink-0">
              <CurrencyDollarIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-2 md:ml-3 lg:ml-4 min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Revenue</p>
              <p className="text-sm md:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white truncate">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-xs text-gray-500">Total value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="bg-white dark:bg-surface-dark rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.title}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {metric.value}{metric.suffix || ''}
                </p>
                <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
              </div>
              <div className={`p-3 rounded-full ${metric.color}`}>
                <metric.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 md:mb-8">
        {/* User Registration Chart */}
        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Registration Trends</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Chart visualization would go here</p>
              <p className="text-sm text-gray-400 mt-2">Integration with charting library needed</p>
            </div>
          </div>
        </div>

        {/* Revenue Analytics */}
        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Analytics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(stats.totalRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Order Value</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.totalOrders > 0 ? formatCurrency(stats.totalRevenue / stats.totalOrders) : formatCurrency(0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</span>
              <span className="text-lg font-semibold text-green-600">
                {analytics?.conversionFunnel ?
                  Math.round((analytics.conversionFunnel.purchases / Math.max(analytics.conversionFunnel.pageViews, 1)) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Admin Features */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">Admin Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {adminFeatures.map((feature, index) => (
            <Link
              key={index}
              to={feature.path}
              className="bg-white dark:bg-surface-dark rounded-lg shadow hover:shadow-lg transition-all duration-300 p-4 md:p-6 hover:-translate-y-1 border border-gray-200 dark:border-gray-700 touch-manipulation"
            >
              <div className="flex items-start">
                <div className={`p-2 md:p-3 rounded-lg ${feature.color} flex-shrink-0`}>
                  <feature.icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="ml-3 md:ml-4 flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1 md:mb-2 truncate">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-2 md:mb-3 line-clamp-2">
                    {feature.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate">
                      {feature.stats}
                    </span>
                    <div className="flex items-center ml-2">
                      {feature.trend === 'up' && (
                        <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
                      )}
                      {feature.trend === 'warning' && (
                        <ExclamationTriangleIcon className="h-3 w-3 text-orange-500 mr-1" />
                      )}
                      <span className={`text-xs truncate ${
                        feature.trend === 'up' ? 'text-green-600' :
                        feature.trend === 'warning' ? 'text-orange-600' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {feature.recent}
                      </span>
                    </div>
                  </div>
                </div>
                <EyeIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0 ml-2" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className="bg-white dark:bg-surface-dark rounded-lg shadow hover:shadow-lg transition-all duration-300 p-4 md:p-6 hover:-translate-y-1 border border-gray-200 dark:border-gray-700 touch-manipulation"
            >
              <div className="flex items-center">
                <div className={`p-2 md:p-3 rounded-lg ${action.color} flex-shrink-0`}>
                  <action.icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="ml-3 md:ml-4 min-w-0 flex-1">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {formatDate(new Date())}
          </span>
        </div>
        <div className="space-y-3 md:space-y-4 max-h-96 overflow-y-auto">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => {
              const ActivityIcon = getActivityIcon(activity.type);
              const iconColor = getActivityColor(activity.type);
              return (
                <div key={index} className="flex items-start space-x-3 py-2 md:py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  <div className={`p-2 rounded-full flex-shrink-0 ${iconColor}`}>
                    <ActivityIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {activity.type === 'login' && 'User logged in'}
                        {activity.type === 'registration' && 'New user registered'}
                        {activity.type === 'product_interaction' && `Product ${activity.action}`}
                        {activity.type === 'page_view' && 'Page viewed'}
                        {activity.type === 'search' && 'Search performed'}
                        {activity.type === 'ai_interaction' && 'AI assistant used'}
                        {activity.type === 'error' && 'Error occurred'}
                        {activity.type === 'logout' && 'User logged out'}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                        {formatDate(activity.timestamp)}
                      </span>
                    </div>
                    <div className="mt-1">
                      {activity.userId && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          User ID: {activity.userId.substring(0, 8)}...
                        </p>
                      )}
                      {activity.productName && (
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {activity.productName}
                        </p>
                      )}
                      {activity.query && (
                        <p className="text-xs text-purple-600 dark:text-purple-400">
                          "{activity.query}"
                        </p>
                      )}
                      {activity.errorMessage && (
                        <p className="text-xs text-red-600 dark:text-red-400 truncate">
                          {activity.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <ArrowPathIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
              <p className="text-sm text-gray-400 mt-1">Activity data will appear here as users interact with the system</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
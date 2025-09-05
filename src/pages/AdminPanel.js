import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  UserGroupIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const AdminPanel = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalCategories: 0,
    recentUsers: 0,
    recentProducts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch categories
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate recent stats (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentUsers = users.filter(user =>
        user.createdAt && new Date(user.createdAt) >= oneWeekAgo
      ).length;
      
      const recentProducts = products.filter(product =>
        product.createdAt && new Date(product.createdAt) >= oneWeekAgo
      ).length;

      setStats({
        totalUsers: users.length,
        totalProducts: products.length,
        totalOrders: 0, // You can implement order counting if needed
        totalCategories: categories.length,
        recentUsers,
        recentProducts
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
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
      recent: `+${stats.recentUsers} this week`
    },
    {
      title: 'Product Management',
      description: 'Add, edit, and manage products',
      icon: ShoppingBagIcon,
      path: '/admin/products',
      color: 'bg-green-500',
      stats: `${stats.totalProducts} products`,
      recent: `+${stats.recentProducts} this week`
    },
    {
      title: 'Order Management',
      description: 'View and manage customer orders',
      icon: ClipboardDocumentListIcon,
      path: '/admin/orders',
      color: 'bg-purple-500',
      stats: `${stats.totalOrders} orders`,
      recent: 'View all orders'
    },
    {
      title: 'Categories',
      description: 'Manage product categories',
      icon: TagIcon,
      path: '/admin',
      color: 'bg-orange-500',
      stats: `${stats.totalCategories} categories`,
      recent: 'Manage categories'
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
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2">
          Welcome to the AnA Group Supplies admin panel. Manage your store efficiently.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4 md:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0">
              <UserGroupIcon className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3 md:ml-4 min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Users</p>
              <p className="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white truncate">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4 md:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-full bg-green-100 dark:bg-green-900 flex-shrink-0">
              <ShoppingBagIcon className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3 md:ml-4 min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Products</p>
              <p className="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white truncate">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4 md:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-full bg-purple-100 dark:bg-purple-900 flex-shrink-0">
              <ClipboardDocumentListIcon className="h-5 w-5 md:h-6 md:w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3 md:ml-4 min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Orders</p>
              <p className="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white truncate">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4 md:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-full bg-orange-100 dark:bg-orange-900 flex-shrink-0">
              <TagIcon className="h-5 w-5 md:h-6 md:w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3 md:ml-4 min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Categories</p>
              <p className="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white truncate">{stats.totalCategories}</p>
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
                    <span className="text-xs text-green-600 dark:text-green-400 truncate ml-2">
                      {feature.recent}
                    </span>
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

      {/* Recent Activity */}
      <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">Recent Activity</h2>
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between py-2 md:py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center min-w-0 flex-1">
              <div className="p-1.5 md:p-2 bg-green-100 dark:bg-green-900 rounded-full flex-shrink-0">
                <UserGroupIcon className="h-3 w-3 md:h-4 md:w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-2 md:ml-3 min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate">
                  {stats.recentUsers} new users registered this week
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">User Management</p>
              </div>
            </div>
            <Link
              to="/admin/users"
              className="text-primary hover:text-secondary text-xs md:text-sm font-medium ml-2 flex-shrink-0 touch-manipulation"
            >
              View →
            </Link>
          </div>

          <div className="flex items-center justify-between py-2 md:py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center min-w-0 flex-1">
              <div className="p-1.5 md:p-2 bg-blue-100 dark:bg-blue-900 rounded-full flex-shrink-0">
                <ShoppingBagIcon className="h-3 w-3 md:h-4 md:w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-2 md:ml-3 min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate">
                  {stats.recentProducts} new products added this week
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Product Management</p>
              </div>
            </div>
            <Link
              to="/admin/products"
              className="text-primary hover:text-secondary text-xs md:text-sm font-medium ml-2 flex-shrink-0 touch-manipulation"
            >
              View →
            </Link>
          </div>

          <div className="flex items-center justify-between py-2 md:py-3">
            <div className="flex items-center min-w-0 flex-1">
              <div className="p-1.5 md:p-2 bg-purple-100 dark:bg-purple-900 rounded-full flex-shrink-0">
                <ChartBarIcon className="h-3 w-3 md:h-4 md:w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-2 md:ml-3 min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate">
                  System running smoothly
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">System Status</p>
              </div>
            </div>
            <span className="text-green-600 dark:text-green-400 text-xs md:text-sm font-medium ml-2 flex-shrink-0">
              ✓ Healthy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
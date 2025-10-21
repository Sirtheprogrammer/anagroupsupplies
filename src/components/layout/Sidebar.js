import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingBagIcon,
  HeartIcon,
  UserIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  Square3Stack3DIcon,
  Cog6ToothIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  PlusIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const mainMenuItems = [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'Products', path: '/products', icon: ShoppingBagIcon },
    { name: 'Categories', path: '/categories', icon: Square3Stack3DIcon },
  ];

  const userMenuItems = user ? [
    { name: 'Cart', path: '/cart', icon: ShoppingCartIcon },
    { name: 'Wishlist', path: '/wishlist', icon: HeartIcon },
    { name: 'Orders', path: '/orders', icon: ClipboardDocumentListIcon },
    { name: 'Profile', path: '/profile', icon: UserIcon },
  ] : [];

  const adminMenuItems = user?.isAdmin ? [
    { name: 'Admin Dashboard', path: '/admin', icon: Cog6ToothIcon },
    { name: 'Manage Users', path: '/admin/users', icon: UserGroupIcon },
    { name: 'Manage Categories', path: '/admin/categories', icon: TagIcon },
    { name: 'Manage Products', path: '/admin/products', icon: ShoppingBagIcon },
    { name: 'Add Product', path: '/admin/products/add', icon: PlusIcon },
    { name: 'Admin Orders', path: '/admin/orders', icon: ClipboardDocumentListIcon },
    { name: 'Settings', path: '/admin/settings', icon: WrenchScrewdriverIcon },
  ] : [];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-surface-dark shadow-2xl z-50 transform transition-all duration-300 ease-out flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/20 dark:border-border-dark/20 bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-lg font-bold text-white">A</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary dark:text-text-dark-primary">AnA Group</h2>
              <p className="text-xs text-text-tertiary dark:text-text-dark-tertiary">Premium Supplies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-background-secondary dark:hover:bg-background-dark-secondary transition-colors duration-200"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-5 w-5 text-text-secondary dark:text-text-dark-secondary" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="sidebar-scroll">
          
          {/* Main Navigation */}
          <nav className="px-6">
            <div className="space-y-2">
              {mainMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive(item.path)
                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                        : 'text-text-secondary dark:text-text-dark-secondary hover:bg-background-secondary dark:hover:bg-background-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary'
                    }`}
                    onClick={onClose}
                  >
                    <Icon className={`h-5 w-5 mr-3 transition-colors duration-200 ${
                      isActive(item.path)
                        ? 'text-white'
                        : 'text-text-tertiary dark:text-text-dark-tertiary group-hover:text-primary'
                    }`} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Section */}
          {user && userMenuItems.length > 0 && (
            <div className="mt-6 px-6">
              <h3 className="text-xs font-semibold text-text-tertiary dark:text-text-dark-tertiary uppercase tracking-wider mb-3 px-4">
                My Account
              </h3>
              <div className="space-y-1">
                {userMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive(item.path)
                          ? 'bg-primary text-white shadow-lg shadow-primary/25'
                          : 'text-text-secondary dark:text-text-dark-secondary hover:bg-background-secondary dark:hover:bg-background-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary'
                      }`}
                      onClick={onClose}
                    >
                      <Icon className={`h-5 w-5 mr-3 transition-colors duration-200 ${
                        isActive(item.path)
                          ? 'text-white'
                          : 'text-text-tertiary dark:text-text-dark-tertiary group-hover:text-primary'
                      }`} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Admin Section */}
          {user?.isAdmin && adminMenuItems.length > 0 && (
            <div className="mt-6 px-6">
              <h3 className="text-xs font-semibold text-text-tertiary dark:text-text-dark-tertiary uppercase tracking-wider mb-3 px-4">
                Administration
              </h3>
              <div className="space-y-1">
                {adminMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive(item.path)
                          ? 'bg-accent text-white shadow-lg shadow-accent/25'
                          : 'text-text-secondary dark:text-text-dark-secondary hover:bg-accent/10 dark:hover:bg-accent/20 hover:text-accent'
                      }`}
                      onClick={onClose}
                    >
                      <Icon className={`h-5 w-5 mr-3 transition-colors duration-200 ${
                        isActive(item.path)
                          ? 'text-white'
                          : 'text-text-tertiary dark:text-text-dark-tertiary group-hover:text-accent'
                      }`} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Auth Section */}
          {!user ? (
            <div className="mt-8 px-6">
              <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl">
                <h3 className="font-semibold text-text-primary dark:text-text-dark-primary mb-2">Welcome!</h3>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-4">
                  Sign in to access your account and enjoy personalized features.
                </p>
                <div className="space-y-2">
                  <Link
                    to="/login"
                    className="block w-full text-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 font-medium"
                    onClick={onClose}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full text-center px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors duration-200 font-medium"
                    onClick={onClose}
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 px-6">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 rounded-xl text-error hover:bg-error/10 transition-all duration-200 group"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-error" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/20 dark:border-border-dark/20 bg-background-secondary/30 dark:bg-background-dark-secondary/30">
          <p className="text-xs text-text-tertiary dark:text-text-dark-tertiary text-center">
            © 2024 AnA Group Supplies
          </p>
          <p className="text-xs text-text-tertiary dark:text-text-dark-tertiary text-center mt-1">
            Premium Quality Products
          </p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

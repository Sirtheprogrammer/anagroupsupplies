import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { collection, getDocs, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Profile from '../Profile';
import {
  ShoppingCartIcon,
  Bars3Icon,
  XMarkIcon,
  HeartIcon,
  UserIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [cartCount, setCartCount] = useState(0);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    const fetchCartCount = async () => {
      if (!user) return;
      
      try {
        const cartRef = doc(db, 'carts', user.uid);
        const itemsRef = collection(cartRef, 'items');
        const itemsSnapshot = await getDocs(itemsRef);
        setCartCount(itemsSnapshot.size);
      } catch (error) {
        console.error('Error fetching cart count:', error);
      }
    };

    fetchCartCount();
  }, [user]);

  return (
    <>
      <nav className="bg-surface dark:bg-surface-dark shadow-lg dark:shadow-gray-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Mobile menu button and Logo */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-primary dark:text-primary-light hover:bg-blue-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary mr-2"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>

              <button
                onClick={onMenuClick}
                className="hidden md:inline-flex items-center justify-center p-2 rounded-md text-primary dark:text-primary-light hover:bg-blue-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary mr-2"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>

              <Link to="/" className="flex items-center space-x-2 md:space-x-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-lg md:text-xl font-bold text-white">A</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg md:text-xl font-bold text-primary dark:text-primary-light leading-tight">
                    AnA Group
                  </span>
                  <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-tight">
                    Supplies
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:text-text-dark"
                />
              </div>
            </div>

            {/* Mobile Search Button */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>

            {/* User Actions */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <SunIcon className="h-5 w-5 md:h-6 md:w-6" />
                ) : (
                  <MoonIcon className="h-5 w-5 md:h-6 md:w-6" />
                )}
              </button>
              
              {user ? (
                <>
                  {user.isAdmin && (
                    <div className="relative">
                      <button
                        onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                        className="hidden md:flex items-center px-3 py-2 text-sm font-medium text-primary dark:text-primary-light hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full"
                      >
                        <Cog6ToothIcon className="h-5 w-5 mr-1" />
                        Admin
                        <ChevronDownIcon className="h-4 w-4 ml-1" />
                      </button>
                      
                      {/* Admin Dropdown Menu */}
                      {showAdminDropdown && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-surface-dark rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                          <div className="py-1">
                            <Link
                              to="/admin"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => setShowAdminDropdown(false)}
                            >
                              <Cog6ToothIcon className="h-4 w-4 mr-3" />
                              Dashboard
                            </Link>
                            <Link
                              to="/admin/users"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => setShowAdminDropdown(false)}
                            >
                              <UserGroupIcon className="h-4 w-4 mr-3" />
                              User Management
                            </Link>
                            <Link
                              to="/admin/products"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => setShowAdminDropdown(false)}
                            >
                              <ShoppingBagIcon className="h-4 w-4 mr-3" />
                              Products
                            </Link>
                            <Link
                              to="/admin/products/add"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => setShowAdminDropdown(false)}
                            >
                              <PlusIcon className="h-4 w-4 mr-3" />
                              Add Product
                            </Link>
                            <Link
                              to="/admin/orders"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => setShowAdminDropdown(false)}
                            >
                              <ClipboardDocumentListIcon className="h-4 w-4 mr-3" />
                              Orders
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <Link
                    to="/wishlist"
                    className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light p-2"
                  >
                    <HeartIcon className="h-6 w-6" />
                  </Link>
                  <Link
                    to="/cart"
                    className="relative text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light p-2"
                  >
                    <ShoppingCartIcon className="h-6 w-6" />
                    {cartCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-primary dark:bg-primary-light rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  <Profile />
                </>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-primary hover:bg-primary-dark dark:hover:bg-primary-light transition-colors duration-300"
                >
                  <UserIcon className="h-5 w-5 mr-2" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showMobileSearch && (
          <div className="md:hidden px-4 pb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:text-text-dark"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                <Link
                  to="/"
                  className="block px-3 py-2 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/products"
                  className="block px-3 py-2 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Products
                </Link>
                <Link
                  to="/categories"
                  className="block px-3 py-2 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Categories
                </Link>
                <Link
                  to="/cart"
                  className="block px-3 py-2 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Cart
                </Link>
                <Link
                  to="/wishlist"
                  className="block px-3 py-2 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Wishlist
                </Link>
                <Link
                  to="/orders"
                  className="block px-3 py-2 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Orders
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
              </div>

              {/* Mobile Admin Links */}
              {user?.isAdmin && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Admin</p>
                  <div className="space-y-2">
                    <Link
                      to="/admin"
                      className="block px-3 py-2 text-base font-medium text-primary hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/users"
                      className="block px-3 py-2 text-base font-medium text-primary hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      User Management
                    </Link>
                    <Link
                      to="/admin/products"
                      className="block px-3 py-2 text-base font-medium text-primary hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Products
                    </Link>
                    <Link
                      to="/admin/products/add"
                      className="block px-3 py-2 text-base font-medium text-primary hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Add Product
                    </Link>
                    <Link
                      to="/admin/orders"
                      className="block px-3 py-2 text-base font-medium text-primary hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Orders
                    </Link>
                  </div>
                </div>
              )}

              {/* Mobile Auth Links */}
              {!user && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <Link
                    to="/login"
                    className="block w-full text-center px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-dark"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Overlay to close dropdown when clicking outside */}
      {(showAdminDropdown || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => {
            setShowAdminDropdown(false);
            setIsMobileMenuOpen(false);
            setShowMobileSearch(false);
          }}
        ></div>
      )}

      {/* Desktop Admin Dropdown Overlay */}
      {showAdminDropdown && (
        <div
          className="hidden md:block fixed inset-0 z-30"
          onClick={() => setShowAdminDropdown(false)}
        ></div>
      )}
    </>
  );
};

export default Navbar;
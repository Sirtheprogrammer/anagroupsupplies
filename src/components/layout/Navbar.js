import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { collection, getDocs, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Profile from '../Profile';
import SearchBar from '../SearchBar';
import {
  ShoppingCartIcon,
  Bars3Icon,
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
  MagnifyingGlassIcon,
  TagIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [cartCount, setCartCount] = useState(0);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
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
      {/* Fixed Header Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-border/20 dark:border-border-dark/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Left Section: Menu Button & Logo */}
            <div className="flex items-center space-x-4">
              {/* Menu Toggle Button */}
              <button
                onClick={onMenuClick}
                className="btn btn-ghost p-2 rounded-xl hover:bg-primary/10 transition-colors duration-200"
                aria-label="Toggle navigation menu"
              >
                <Bars3Icon className="h-6 w-6 text-text-primary dark:text-text-dark-primary" />
              </button>

              {/* Logo */}
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <img
                      src="https://i.ibb.co/gFVc9yYP/Black-White-Modern-Letter-A-Logo-Design.png"
                      alt="AnA Group Logo"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary-600 hidden items-center justify-center">
                      <span className="text-lg md:text-xl font-bold text-white">A</span>
                    </div>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"></div>
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent leading-tight">
                    AnA Group
                  </span>
                  <span className="text-xs md:text-sm text-text-tertiary dark:text-text-dark-tertiary font-medium leading-tight">
                    Premium Supplies
                  </span>
                </div>
              </Link>
            </div>

            {/* Center Section: Search Bar (Desktop) */}
            <div className="hidden md:block flex-1 max-w-2xl mx-8">
              <SearchBar className="w-full" />
            </div>

            {/* Right Section: Actions & User Menu */}
            <div className="flex items-center space-x-2">
              {/* Mobile Search Button */}
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="md:hidden btn btn-ghost p-2 rounded-xl"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="btn btn-ghost p-2 rounded-xl group"
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <SunIcon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                ) : (
                  <MoonIcon className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-12" />
                )}
              </button>

              {user ? (
                <>
                  {/* Admin Dropdown (Desktop) */}
                  {user.isAdmin && (
                    <div className="relative hidden md:block">
                      <button
                        onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                        className="flex items-center px-3 py-2 text-sm font-semibold rounded-xl hover:bg-primary/10 transition-colors duration-200"
                      >
                        <Cog6ToothIcon className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                        <span className="hidden lg:inline">Admin</span>
                        <ChevronDownIcon className="h-4 w-4 ml-1 group-hover:rotate-180 transition-transform duration-300" />
                      </button>
                      
                      {/* Admin Dropdown Menu */}
                      {showAdminDropdown && (
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-border/20 dark:border-border-dark/20 z-50 animate-slideDown">
                          <div className="py-2">
                            <Link
                              to="/admin"
                              className="flex items-center px-4 py-3 text-sm font-medium hover:bg-background-secondary dark:hover:bg-background-dark-secondary transition-colors duration-200"
                              onClick={() => setShowAdminDropdown(false)}
                            >
                              <Cog6ToothIcon className="h-5 w-5 mr-3 text-primary" />
                              Dashboard
                            </Link>
                            <Link
                              to="/admin/users"
                              className="flex items-center px-4 py-3 text-sm font-medium hover:bg-background-secondary dark:hover:bg-background-dark-secondary transition-colors duration-200"
                              onClick={() => setShowAdminDropdown(false)}
                            >
                              <UserGroupIcon className="h-5 w-5 mr-3 text-primary" />
                              User Management
                            </Link>
                            <Link
                              to="/admin/categories"
                              className="flex items-center px-4 py-3 text-sm font-medium hover:bg-background-secondary dark:hover:bg-background-dark-secondary transition-colors duration-200"
                              onClick={() => setShowAdminDropdown(false)}
                            >
                              <TagIcon className="h-5 w-5 mr-3 text-primary" />
                              Categories
                            </Link>
                            <Link
                              to="/admin/products"
                              className="flex items-center px-4 py-3 text-sm font-medium hover:bg-background-secondary dark:hover:bg-background-dark-secondary transition-colors duration-200"
                              onClick={() => setShowAdminDropdown(false)}
                            >
                              <ShoppingBagIcon className="h-5 w-5 mr-3 text-primary" />
                              Products
                            </Link>
                            <Link
                              to="/admin/products/add"
                              className="flex items-center px-4 py-3 text-sm font-medium hover:bg-background-secondary dark:hover:bg-background-dark-secondary transition-colors duration-200"
                              onClick={() => setShowAdminDropdown(false)}
                            >
                              <PlusIcon className="h-5 w-5 mr-3 text-primary" />
                              Add Product
                            </Link>
                            <Link
                              to="/admin/orders"
                              className="flex items-center px-4 py-3 text-sm font-medium hover:bg-background-secondary dark:hover:bg-background-dark-secondary transition-colors duration-200"
                              onClick={() => setShowAdminDropdown(false)}
                            >
                              <ClipboardDocumentListIcon className="h-5 w-5 mr-3 text-primary" />
                              Orders
                            </Link>
                            <Link
                              to="/admin/settings"
                              className="flex items-center px-4 py-3 text-sm font-medium hover:bg-background-secondary dark:hover:bg-background-dark-secondary transition-colors duration-200"
                              onClick={() => setShowAdminDropdown(false)}
                            >
                              <WrenchScrewdriverIcon className="h-5 w-5 mr-3 text-primary" />
                              Settings
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Wishlist */}
                  <Link
                    to="/wishlist"
                    className="btn btn-ghost p-2 rounded-xl group relative"
                    title="Wishlist"
                  >
                    <HeartIcon className="h-5 w-5 group-hover:text-error transition-colors duration-300" />
                  </Link>

                  {/* Cart */}
                  <Link
                    to="/cart"
                    className="btn btn-ghost p-2 rounded-xl group relative"
                    title="Shopping Cart"
                  >
                    <ShoppingCartIcon className="h-5 w-5 group-hover:text-primary transition-colors duration-300" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary rounded-full animate-pulse">
                        {cartCount}
                      </span>
                    )}
                  </Link>

                  {/* User Profile */}
                  <Profile />
                </>
              ) : (
                <Link
                  to="/login"
                  className="btn btn-primary px-4 py-2 text-sm font-semibold"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showMobileSearch && (
          <div className="md:hidden px-4 pb-4 border-t border-border/20 dark:border-border-dark/20 animate-slideDown">
            <div className="mt-4">
              <SearchBar autoFocus={true} onClose={() => setShowMobileSearch(false)} />
            </div>
          </div>
        )}
      </nav>

      {/* Overlay for dropdowns */}
      {(showAdminDropdown || showMobileSearch) && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => {
            setShowAdminDropdown(false);
            setShowMobileSearch(false);
          }}
        ></div>
      )}
    </>
  );
};

export default Navbar;
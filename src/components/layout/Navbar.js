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
  HeartIcon,
  UserIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [cartCount, setCartCount] = useState(0);

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
    <nav className="bg-surface dark:bg-surface-dark shadow-lg dark:shadow-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo and Menu Button */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="inline-flex items-center justify-center p-2 rounded-md text-primary dark:text-primary-light hover:bg-blue-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <Link to="/" className="flex items-center ml-3 space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-white">A</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-primary dark:text-primary-light">AnA Group</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Supplies</span>
              </div>
            </Link>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Search Bar - Desktop */}
            <div className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-64 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:text-text-dark"
                />
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <SunIcon className="h-6 w-6" />
                ) : (
                  <MoonIcon className="h-6 w-6" />
                )}
              </button>
              
              {user ? (
                <>
                  {user.isAdmin && (
                    <Link
                      to="/admin"
                      className="hidden md:flex items-center px-3 py-2 text-sm font-medium text-primary dark:text-primary-light hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full"
                    >
                      <Cog6ToothIcon className="h-5 w-5 mr-1" />
                      Admin Panel
                    </Link>
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
      </div>
    </nav>
  );
};

export default Navbar;
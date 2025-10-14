import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { collection, getDocs, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
   HomeIcon as House,
   MagnifyingGlassIcon as Search,
   ShoppingCartIcon as ShoppingCart,
   HeartIcon as Heart,
   UserIcon as User,
   Square3Stack3DIcon as Grid3X3,
   ArrowRightIcon
 } from '@heroicons/react/24/outline';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  // Fetch cart count for authenticated users
  useEffect(() => {
    const fetchCartCount = async () => {
      if (!user) {
        setCartCount(0);
        return;
      }

      try {
        const cartRef = doc(db, 'carts', user.uid);
        const itemsRef = collection(cartRef, 'items');
        const itemsSnapshot = await getDocs(itemsRef);
        setCartCount(itemsSnapshot.size);
      } catch (error) {
        console.error('Error fetching cart count:', error);
        setCartCount(0);
      }
    };

    fetchCartCount();
  }, [user]);

  // Don't show bottom navigation on auth pages and admin pages
  const hideOnPaths = ['/login', '/register'];
  const isAdminPath = location.pathname.startsWith('/admin');

  if (hideOnPaths.includes(location.pathname) || isAdminPath) {
    return null;
  }

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { name: 'Home', path: '/', icon: House, active: isActive('/') },
    { name: 'Products', path: '/products', icon: Search, active: isActive('/products') },
    ...(location.pathname !== '/categories' ? [{ name: 'Categories', path: '/categories', icon: Grid3X3, active: isActive('/categories') }] : []),
  ];

  const userNavItems = user ? [
    ...(location.pathname === '/cart' ? [] : [{ name: 'Cart', path: '/cart', icon: ShoppingCart, active: isActive('/cart') }]),
    ...(location.pathname !== '/wishlist' ? [{ name: 'Wishlist', path: '/wishlist', icon: Heart, active: isActive('/wishlist') }] : []),
    { name: 'Profile', path: '/profile', icon: User, active: isActive('/profile') },
  ] : [];

  return (
    <>
      {/* Main Bottom Navigation - Always visible on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-border/20 dark:border-border-dark/20 md:hidden z-40 shadow-lg safe-area-pb">
        <div className="flex items-center justify-around h-16 px-2">
          {/* All Navigation Items */}
          {[...navItems, ...userNavItems].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center transition-all duration-200 touch-manipulation relative min-w-0 flex-1 ${
                  item.active
                    ? 'text-primary'
                    : 'text-text-tertiary dark:text-text-dark-tertiary hover:text-primary'
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 mb-1 transition-colors duration-200 ${
                    item.active ? 'text-primary' : ''
                  }`} />
                  {/* Cart count badge */}
                  {item.path === '/cart' && cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-primary rounded-full">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium truncate ${
                  item.active ? 'text-primary' : ''
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Contextual Bottom Bar - Shows on specific pages */}
      {location.pathname === '/cart' && user && (
        <div className="fixed bottom-16 left-0 right-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-border/20 dark:border-border-dark/20 md:hidden z-30 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 p-3">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <div>
                <span className="text-sm font-medium text-text-primary dark:text-text-dark-primary">
                  Cart ({cartCount} items)
                </span>
                <div className="text-xs text-text-tertiary dark:text-text-dark-tertiary">
                  Ready for checkout
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-1 max-w-xs">
              <Link
                to="/products"
                className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-primary text-primary rounded-lg bg-white/90 dark:bg-surface-dark/90 hover:bg-primary hover:text-white transition-all duration-200 text-sm font-medium"
              >
                Continue
              </Link>
              <button
                onClick={() => navigate('/checkout')}
                className="flex-1 inline-flex items-center justify-center bg-primary text-white px-3 py-2 rounded-lg shadow-lg hover:bg-primary-600 transition-all duration-200 text-sm font-medium"
              >
                Checkout
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for mobile bottom navigation */}
      <div className={`h-16 md:hidden ${location.pathname === '/cart' && user ? 'mt-16' : ''}`}></div>
    </>
  );
};

export default BottomNavigation;
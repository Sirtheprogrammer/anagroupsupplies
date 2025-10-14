import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
    { name: 'Categories', path: '/categories', icon: Grid3X3, active: isActive('/categories') },
  ];

  const userNavItems = user ? [
    ...(location.pathname === '/cart' ? [] : [{ name: 'Cart', path: '/cart', icon: ShoppingCart, active: isActive('/cart') }]),
    { name: 'Wishlist', path: '/wishlist', icon: Heart, active: isActive('/wishlist') },
    { name: 'Profile', path: '/profile', icon: User, active: isActive('/profile') },
  ] : [];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-border/20 dark:border-border-dark/20 md:hidden z-40 shadow-lg safe-area-pb">
        <div className="grid grid-cols-5 h-16">
          {/* Main Navigation Items */}
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center transition-all duration-200 touch-manipulation ${
                  item.active
                    ? 'text-primary'
                    : 'text-text-tertiary dark:text-text-dark-tertiary hover:text-primary'
                }`}
              >
                <Icon className={`h-5 w-5 mb-1 transition-colors duration-200 ${
                  item.active ? 'text-primary' : ''
                }`} />
                <span className={`text-xs font-medium ${
                  item.active ? 'text-primary' : ''
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* User Navigation Items - Show only if user is logged in */}
          {userNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center transition-all duration-200 touch-manipulation ${
                  item.active
                    ? 'text-primary'
                    : 'text-text-tertiary dark:text-text-dark-tertiary hover:text-primary'
                }`}
              >
                <Icon className={`h-5 w-5 mb-1 transition-colors duration-200 ${
                  item.active ? 'text-primary' : ''
                }`} />
                <span className={`text-xs font-medium ${
                  item.active ? 'text-primary' : ''
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for mobile bottom navigation */}
      <div className="h-16 md:hidden"></div>

      {/* Cart-specific bottom bar */}
      {location.pathname === '/cart' && (
        <div className="fixed bottom-16 left-0 right-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-border/20 dark:border-border-dark/20 md:hidden z-30 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 p-3">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-text-primary dark:text-text-dark-primary">
                Cart Summary
              </span>
            </div>

            <div className="flex gap-2 flex-1">
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
    </>
  );
};

export default BottomNavigation;
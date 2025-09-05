import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShoppingBagIcon,
  HeartIcon,
  UserIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  Square3Stack3DIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'Products', path: '/products', icon: ShoppingBagIcon },
    { name: 'Categories', path: '/categories', icon: Square3Stack3DIcon },
    { name: 'Cart', path: '/cart', icon: ShoppingCartIcon },
    { name: 'Wishlist', path: '/wishlist', icon: HeartIcon },
    { name: 'Orders', path: '/orders', icon: ClipboardDocumentListIcon },
    { name: 'Profile', path: '/profile', icon: UserIcon },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-surface dark:bg-surface-dark shadow-lg dark:shadow-gray-900 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:h-auto`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-primary dark:text-primary-light">AnA Group Supplies</h2>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                      isActive(item.path)
                        ? 'bg-primary dark:bg-primary-light text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={onClose}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;

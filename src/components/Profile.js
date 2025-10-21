import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../firebase/index';
import { toast } from 'react-toastify';
import {
  UserIcon,
  ShoppingBagIcon,
  HeartIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success('Logged out successfully');
      navigate('/');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 focus:outline-none hover:bg-primary/10 rounded-full p-1 transition-colors duration-200"
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-sm">
            {user?.email?.[0].toUpperCase()}
          </div>
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-border/20 dark:border-border-dark/20 py-2 z-50 animate-slideDown"
          >
            <div className="px-4 py-2 border-b border-border/20 dark:border-border-dark/20">
              <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                navigate('/profile');
                setIsOpen(false);
              }}
              className="flex items-center w-full text-left px-4 py-2 text-sm text-text-secondary dark:text-text-dark-secondary hover:bg-background-secondary dark:hover:bg-background-dark-secondary transition-colors duration-200"
            >
              <UserIcon className="h-5 w-5 mr-2" />
              My Profile
            </button>
            <button
              onClick={() => {
                navigate('/orders');
                setIsOpen(false);
              }}
              className="flex items-center w-full text-left px-4 py-2 text-sm text-text-secondary dark:text-text-dark-secondary hover:bg-background-secondary dark:hover:bg-background-dark-secondary transition-colors duration-200"
            >
              <ShoppingBagIcon className="h-5 w-5 mr-2" />
              My Orders
            </button>
            <button
              onClick={() => {
                navigate('/wishlist');
                setIsOpen(false);
              }}
              className="flex items-center w-full text-left px-4 py-2 text-sm text-text-secondary dark:text-text-dark-secondary hover:bg-background-secondary dark:hover:bg-background-dark-secondary transition-colors duration-200"
            >
              <HeartIcon className="h-5 w-5 mr-2" />
              Wishlist
            </button>
            {user?.isAdmin && (
              <button
                onClick={() => {
                  navigate('/admin');
                  setIsOpen(false);
                }}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-accent hover:bg-accent/10 transition-colors duration-200"
              >
                <Cog6ToothIcon className="h-5 w-5 mr-2" />
                Admin Panel
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Profile;
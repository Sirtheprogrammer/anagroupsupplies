import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../firebase/index';
import { toast } from 'react-toastify';
import { 
  UserIcon, 
  ShoppingBagIcon, 
  HeartIcon, 
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
          {user?.email?.[0].toUpperCase()}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b">
            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              navigate('/profile');
              setIsOpen(false);
            }}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <UserIcon className="h-5 w-5 mr-2" />
            My Profile
          </button>
          <button
            onClick={() => {
              navigate('/orders');
              setIsOpen(false);
            }}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <ShoppingBagIcon className="h-5 w-5 mr-2" />
            My Orders
          </button>
          <button
            onClick={() => {
              navigate('/wishlist');
              setIsOpen(false);
            }}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
              className="flex items-center w-full text-left px-4 py-2 text-sm text-primary hover:bg-gray-100"
            >
              <Cog6ToothIcon className="h-5 w-5 mr-2" />
              Admin Panel
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile; 
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const fetchProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setProfile({
          displayName: userDoc.data().displayName || '',
          email: userDoc.data().email || '',
          phone: userDoc.data().phone || '',
          address: userDoc.data().address || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: profile.displayName,
        phone: profile.phone,
        address: profile.address,
        updatedAt: new Date().toISOString()
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-text dark:text-text-dark">My Profile</h1>
      <div className="max-w-2xl mx-auto">
        <div className="bg-surface dark:bg-surface-dark rounded-xl shadow p-5 md:p-6">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
            <img
              src={user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'User')}
              alt={user.displayName}
              className="w-20 h-20 rounded-full"
            />
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold text-text dark:text-text-dark">{user.displayName}</h2>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text dark:text-text-dark mb-2">Display Name</label>
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:text-text-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text dark:text-text-dark mb-2">Phone</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:text-text-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text dark:text-text-dark mb-2">Address</label>
              <textarea
                value={profile.address}
                onChange={(e) => setProfile({...profile, address: e.target.value})}
                rows="3"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:text-text-dark"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-white py-2.5 px-4 rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors duration-300"
            >
              Update Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
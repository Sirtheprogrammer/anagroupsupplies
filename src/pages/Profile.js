import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, Timestamp, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ShoppingBagIcon,
  ClockIcon,
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

// Utility function to safely convert Firestore timestamp to Date
const convertTimestamp = (timestamp) => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') return new Date(timestamp);
  return new Date();
};

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    phone: '',
    address: '',
    preferences: {
      theme: 'light',
      notifications: true,
      newsletter: false
    }
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Cache TTL for profile and recent lists to reduce repeated reads
  const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const cacheKey = `profile_cache_${user.uid}`;

    // Try to serve from local cache to make the page feel instant
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (Date.now() - parsed.ts) < CACHE_TTL_MS) {
          if (parsed.profile) setProfile(parsed.profile);
          if (Array.isArray(parsed.recentOrders)) setRecentOrders(parsed.recentOrders);
          if (Array.isArray(parsed.recentActivity)) setRecentActivity(parsed.recentActivity);
          setLoading(false);
          // Refresh in background to update stale data without blocking UI
          (async () => {
            try {
              await fetchProfileNetwork();
            } catch (e) {
              /* background refresh failed - ignore */
            }
          })();
          return;
        }
      }
    } catch (err) {
      // ignore JSON/localStorage errors
      console.warn('profile cache read failed', err);
    }

    // Network fetch implementation (separated so background call can reuse it)
    async function fetchProfileNetwork() {
      // Build queries that only fetch latest 5 items and avoid scanning entire collection
      const userDocPromise = getDoc(doc(db, 'users', user.uid));
      // Avoid orderBy on a different field to prevent needing composite indexes.
      // We'll fetch a limited set and sort client-side by timestamp.
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        limit(10) // fetch a few and trim/sort client-side
      );
      const activityQuery = query(
        collection(db, 'analytics'),
        where('userId', '==', user.uid),
        limit(10)
      );

      // Run requests in parallel and handle each result
      const [userDocRes, ordersSnap, activitySnap] = await Promise.all([
        userDocPromise,
        getDocs(ordersQuery),
        getDocs(activityQuery)
      ]);

      let fetchedProfile = null;
      if (userDocRes && userDocRes.exists()) {
        const ud = userDocRes.data();
        fetchedProfile = {
          displayName: ud.displayName || '',
          email: ud.email || '',
          phone: ud.phone || '',
          address: ud.address || '',
          preferences: ud.preferences || { theme: 'light', notifications: true, newsletter: false }
        };
      }

      const fetchedOrders = (ordersSnap?.docs || []).map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: convertTimestamp(d.data().createdAt)
      }));

      const fetchedActivity = (activitySnap?.docs || []).map(d => ({
        id: d.id,
        ...d.data(),
        timestamp: convertTimestamp(d.data().timestamp)
      }));

      // Sort client-side (descending) and limit to 5 so we don't rely on Firestore composite indexes
      fetchedOrders.sort((a, b) => (b.createdAt?.getTime ? b.createdAt.getTime() : 0) - (a.createdAt?.getTime ? a.createdAt.getTime() : 0));
      fetchedActivity.sort((a, b) => (b.timestamp?.getTime ? b.timestamp.getTime() : 0) - (a.timestamp?.getTime ? a.timestamp.getTime() : 0));

      const limitedOrders = fetchedOrders.slice(0, 5);
      const limitedActivity = fetchedActivity.slice(0, 5);

      // Update state with merged results (preserve existing fields if missing)
      if (fetchedProfile) setProfile(prev => ({ ...prev, ...fetchedProfile }));
      setRecentOrders(limitedOrders);
      setRecentActivity(limitedActivity);

      // Cache the fetched results
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), profile: fetchedProfile, recentOrders: limitedOrders, recentActivity: limitedActivity }));
      } catch (err) {
        // ignore storage errors
        console.warn('profile cache write failed', err);
      }
    }

    try {
      await fetchProfileNetwork();
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  }, [user, CACHE_TTL_MS]);

  useEffect(() => {
    // Only fetch profile data on initial mount or when user changes
    fetchProfile();
  }, [user?.uid, fetchProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setUpdating(true);
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: profile.displayName.trim(),
        phone: profile.phone.trim(),
        address: profile.address.trim(),
        preferences: profile.preferences,
        updatedAt: new Date().toISOString()
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Please Login</h2>
          <p className="text-gray-600 dark:text-gray-400">You need to be logged in to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserCircleIcon },
    { id: 'orders', name: 'Orders', icon: ShoppingBagIcon },
    { id: 'preferences', name: 'Preferences', icon: CogIcon },
    { id: 'activity', name: 'Activity', icon: ClockIcon }
  ];

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <img
              src={user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.displayName || 'User')}
              alt={profile.displayName}
              className="w-16 h-16 rounded-full mr-4"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.displayName || 'User Profile'}</h1>
              <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('preferences')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <CogIcon className="h-5 w-5 mr-2" />
              Settings
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mt-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  ${activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
                  }
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                `}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Panels */}
        <div className="mt-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserCircleIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={profile.displayName}
                        onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                        className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 cursor-not-allowed sm:text-sm dark:text-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                        <MapPinIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <textarea
                        rows="3"
                        value={profile.address}
                        onChange={(e) => setProfile({...profile, address: e.target.value})}
                        className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={updating}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                      updating ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {updating ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Orders</h3>
              </div>
              {recentOrders.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-primary">{order.id}</div>
                        <div className={`px-2 py-1 text-xs rounded-full ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Total: {new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(order.total)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-5 sm:px-6 text-center text-gray-500 dark:text-gray-400">
                  No orders found
                </div>
              )}
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="max-w-2xl">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account Preferences</h3>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <BellIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications about orders and updates</p>
                          </div>
                        </div>
                        <div>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={profile.preferences.notifications}
                              onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                              className="sr-only"
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors ${
                              profile.preferences.notifications ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                            }`}>
                              <div className={`rounded-full w-5 h-5 bg-white transition-transform ${
                                profile.preferences.notifications ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Newsletter</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Receive our newsletter with updates and offers</p>
                          </div>
                        </div>
                        <div>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={profile.preferences.newsletter}
                              onChange={(e) => handlePreferenceChange('newsletter', e.target.checked)}
                              className="sr-only"
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors ${
                              profile.preferences.newsletter ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                            }`}>
                              <div className={`rounded-full w-5 h-5 bg-white transition-transform ${
                                profile.preferences.newsletter ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
              </div>
              {recentActivity.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center">
                        <div className={`rounded-full p-2 mr-3 ${
                          activity.type === 'login' ? 'bg-green-100' :
                          activity.type === 'order' ? 'bg-blue-100' :
                          activity.type === 'product_interaction' ? 'bg-purple-100' :
                          'bg-gray-100'
                        }`}>
                          {activity.type === 'login' && <ShieldCheckIcon className="h-5 w-5 text-green-600" />}
                          {activity.type === 'order' && <ShoppingBagIcon className="h-5 w-5 text-blue-600" />}
                          {activity.type === 'product_interaction' && <EyeIcon className="h-5 w-5 text-purple-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.type === 'login' && 'Logged in'}
                            {activity.type === 'order' && 'Placed an order'}
                            {activity.type === 'product_interaction' && 'Viewed product'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-5 sm:px-6 text-center text-gray-500 dark:text-gray-400">
                  No recent activity found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, setDoc, getCountFromServer, where, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import { 
  UserGroupIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  UserPlusIcon,
  CalendarIcon,
  CogIcon
} from '@heroicons/react/24/outline';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    admins: 0,
    newThisMonth: 0
  });

  const PAGE_SIZE = 50; // page size for users
  const lastVisibleRef = useRef(null);

  const filterAndSortUsers = useCallback(() => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    switch (filterBy) {
      case 'active':
        filtered = filtered.filter(user => user.isActive);
        break;
      case 'inactive':
        filtered = filtered.filter(user => !user.isActive);
        break;
      case 'admin':
        filtered = filtered.filter(user => user.role === 'admin');
        break;
      case 'recent':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(user => new Date(user.createdAt) >= oneWeekAgo);
        break;
      default:
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'createdAt' || sortBy === 'lastLogin') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterBy, sortBy, sortOrder]);

  // server-side aggregation for stats (cheap counts)
  async function fetchStats() {
    try {
      const now = new Date();
      const thisMonthIso = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const totalSnap = await getCountFromServer(query(collection(db, 'users')));
      const activeSnap = await getCountFromServer(query(collection(db, 'users'), where('isActive', '==', true)));
      const adminSnap = await getCountFromServer(query(collection(db, 'users'), where('role', '==', 'admin')));
      const newThisMonthSnap = await getCountFromServer(query(collection(db, 'users'), where('createdAt', '>=', thisMonthIso)));

      setUserStats({
        total: totalSnap.data().count,
        active: activeSnap.data().count,
        admins: adminSnap.data().count,
        newThisMonth: newThisMonthSnap.data().count
      });
    } catch (err) {
      console.warn('Error fetching stats (aggregation failed):', err);
      // keep existing stats on failure
    }
  }

  // paginated users fetch
  const fetchUsers = useCallback(async (reset = true) => {
    try {
      setLoading(true);
      if (reset) {
        lastVisibleRef.current = null;
      }

      const clauses = [orderBy('createdAt', 'desc'), limit(PAGE_SIZE)];
      if (lastVisibleRef.current) clauses.splice(1, 0, startAfter(lastVisibleRef.current));

      const usersQuery = query(collection(db, 'users'), ...clauses);
      const usersSnapshot = await getDocs(usersQuery);

      const usersList = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      if (reset) {
        setUsers(usersList);
      } else {
        setUsers(prev => [...prev, ...usersList]);
      }

      if (usersSnapshot.docs.length > 0) {
        lastVisibleRef.current = usersSnapshot.docs[usersSnapshot.docs.length - 1];
      }

      // fetch lightweight stats on initial load
      if (reset) await fetchStats();
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(`Failed to fetch users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies since it doesn't rely on external state

  // Run initial load
  useEffect(() => {
    fetchUsers(true);
  }, []); // Empty dependency array to run only once on mount

  // Re-run filtering when input/state values change
  useEffect(() => {
    filterAndSortUsers();
  }, [filterAndSortUsers, users, searchTerm, filterBy, sortBy, sortOrder]);

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      // Update user document with role and updatedAt
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });

      // If making user an admin, add to admins collection
      // If removing admin role, remove from admins collection
      if (newRole === 'admin') {
        await setDoc(doc(db, 'admins', userId), {
          role: 'admin',
          updatedAt: new Date().toISOString()
        });
      } else {
        await deleteDoc(doc(db, 'admins', userId));
      }

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await updateDoc(doc(db, 'users', userId), { isActive: newStatus });
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isActive: newStatus } : user
      ));
      toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Email', 'Name', 'Role', 'Status', 'Created At', 'Last Login'],
      ...filteredUsers.map(user => [
        user.email || '',
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.displayName || '',
        user.role || 'user',
        user.isActive ? 'Active' : 'Inactive',
        new Date(user.createdAt).toLocaleDateString(),
        user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Manage and monitor all registered users</p>
        </div>
        <button
          onClick={exportUsers}
          className="inline-flex items-center px-3 md:px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary touch-manipulation"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Export Users
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4 md:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <UserGroupIcon className="h-6 w-6 md:h-8 md:w-8 text-blue-500 flex-shrink-0" />
            <div className="ml-3 md:ml-4 min-w-0 flex-1">
              <p className="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white truncate">{userStats.total}</p>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4 md:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <UserPlusIcon className="h-6 w-6 md:h-8 md:w-8 text-green-500 flex-shrink-0" />
            <div className="ml-3 md:ml-4 min-w-0 flex-1">
              <p className="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white truncate">{userStats.active}</p>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">Active Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4 md:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <CogIcon className="h-6 w-6 md:h-8 md:w-8 text-purple-500 flex-shrink-0" />
            <div className="ml-3 md:ml-4 min-w-0 flex-1">
              <p className="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white truncate">{userStats.admins}</p>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">Administrators</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4 md:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <CalendarIcon className="h-6 w-6 md:h-8 md:w-8 text-orange-500 flex-shrink-0" />
            <div className="ml-3 md:ml-4 min-w-0 flex-1">
              <p className="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white truncate">{userStats.newThisMonth}</p>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">New This Month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-surface-dark rounded-lg shadow mb-4 md:mb-6">
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="w-full">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm md:text-base"
                />
              </div>
            </div>

            {/* Filter and Sort */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <div className="flex items-center space-x-2 flex-1">
                <FunnelIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0" />
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm flex-1"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="admin">Admins Only</option>
                  <option value="recent">Recent (7 days)</option>
                </select>
              </div>

              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm flex-1 sm:flex-initial"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="email-asc">Email A-Z</option>
                <option value="email-desc">Email Z-A</option>
                <option value="lastLogin-desc">Last Login</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table - Mobile Responsive */}
        <div className="overflow-x-auto scrollbar-hide">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800 hidden md:table-header-group">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role & Status
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-surface-dark divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 md:table-row block md:block">
                  {/* Mobile Card Layout */}
                  <td className="px-4 py-4 md:px-6 md:py-4 block md:table-cell">
                    <div className="flex items-center md:block">
                      <div className="flex-shrink-0 h-10 w-10 md:h-10 md:w-10">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {(user.firstName?.[0] || user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3 md:ml-4 flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.displayName || 'Unknown User'
                          }
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </div>
                        {/* Mobile-only status badges */}
                        <div className="flex flex-wrap gap-1 mt-1 md:hidden">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role || 'user'}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Desktop-only columns */}
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role || 'user'}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden md:table-cell">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden md:table-cell">
                    {formatDate(user.lastLogin)}
                  </td>

                  {/* Actions - Mobile and Desktop */}
                  <td className="px-4 md:px-6 py-4 text-right md:text-right block md:table-cell">
                    <div className="flex items-center justify-end md:justify-end space-x-1 md:space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-2 md:p-1 touch-manipulation"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 md:px-2 md:py-1 touch-manipulation"
                        title="Change Role"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                        className={`p-2 md:p-1 touch-manipulation ${
                          user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                        }`}
                        title={user.isActive ? 'Deactivate User' : 'Activate User'}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 p-2 md:p-1 touch-manipulation"
                        title="Delete User"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No users found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Load More Button */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => fetchUsers(false)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary touch-manipulation"
          disabled={loading}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
          ) : (
            'Load More'
          )}
        </button>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 md:p-4 z-50">
          <div className="bg-white dark:bg-surface-dark rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg md:text-xl font-medium text-gray-900 dark:text-white">User Details</h3>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <p className="text-sm md:text-base text-gray-900 dark:text-white break-all">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <p className="text-sm md:text-base text-gray-900 dark:text-white">
                    {selectedUser.firstName && selectedUser.lastName
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : selectedUser.displayName || 'Not provided'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                  <p className="text-sm md:text-base text-gray-900 dark:text-white">{selectedUser.role || 'user'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <p className="text-sm md:text-base text-gray-900 dark:text-white">
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Joined</label>
                  <p className="text-sm md:text-base text-gray-900 dark:text-white">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Login</label>
                  <p className="text-sm md:text-base text-gray-900 dark:text-white">{formatDate(selectedUser.lastLogin)}</p>
                </div>
              </div>
            </div>
            <div className="p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 touch-manipulation"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
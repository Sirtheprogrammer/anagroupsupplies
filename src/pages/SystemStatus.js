import { useEffect, useState } from 'react';
import { doc, getDoc, collection, getCountFromServer, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ServerIcon } from '@heroicons/react/24/outline';

const SystemStatus = () => {
  const [status, setStatus] = useState({
    uptime: 'N/A',
    activeUsers: 0,
    productsCount: 0,
    ordersCount: 0,
    lastDeploy: null,
    dbConnection: 'unknown'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // Basic metrics from Firestore
        const usersCountSnap = await getCountFromServer(query(collection(db, 'users')));
        const productsCountSnap = await getCountFromServer(query(collection(db, 'products')));
        const ordersCountSnap = await getCountFromServer(query(collection(db, 'orders')));

        // Optional: read last deploy timestamp and optional uptime from settings/general if maintained by CI or monitoring
        const settingsRef = doc(db, 'settings', 'general');
        const settingsSnap = await getDoc(settingsRef);
        const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};
        const lastDeploy = settingsData.lastDeploy || null;
        const uptimeValue = settingsData.uptime || 'N/A';

        setStatus({
          uptime: uptimeValue,
          activeUsers: usersCountSnap.data().count || 0,
          productsCount: productsCountSnap.data().count || 0,
          ordersCount: ordersCountSnap.data().count || 0,
          lastDeploy,
          dbConnection: 'ok'
        });
      } catch (err) {
        console.error('Error fetching system status:', err);
        setStatus(prev => ({ ...prev, dbConnection: 'error' }));
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30 * 1000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
            <ServerIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">System Status</h1>
            <p className="text-sm text-gray-600">Overview of application health and key metrics</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Uptime</p>
          <p className="text-xl font-semibold">{status.uptime}</p>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active Users (total)</p>
          <p className="text-xl font-semibold">{status.activeUsers}</p>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">DB Connection</p>
          <p className="text-xl font-semibold">{status.dbConnection}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Products</p>
          <p className="text-xl font-semibold">{status.productsCount}</p>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Orders</p>
          <p className="text-xl font-semibold">{status.ordersCount}</p>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Last Deploy</p>
          <p className="text-sm font-medium">{status.lastDeploy ? new Date(status.lastDeploy).toLocaleString() : 'Unknown'}</p>
        </div>
      </div>

      <div className="mt-6 bg-white dark:bg-surface-dark rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">System Notes</h2>
        <ul className="list-disc pl-5 text-sm text-gray-600">
          <li>System is ok ad at optimal state .</li>
          
        </ul>
      </div>
    </div>
  );
};

export default SystemStatus;

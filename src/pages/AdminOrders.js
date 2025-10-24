import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowPathIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const ordersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setOrders(ordersList);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter and search orders
  useEffect(() => {
    let filtered = [...orders];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingDetails?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingDetails?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, filterStatus]);

  const updateOrderStatus = async (orderId, newStatus) => {
    if (updatingStatus) return;

    try {
      setUpdatingStatus(true);
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } : order
      ));

      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return ClockIcon;
      case 'processing':
        return ShoppingBagIcon;
      case 'shipped':
        return TruckIcon;
      case 'delivered':
        return CheckCircleIcon;
      case 'cancelled':
        return XCircleIcon;
      default:
        return ClockIcon;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return `TZS ${parseFloat(price).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track all customer orders</p>
        </div>
        <button
          onClick={fetchOrders}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh Orders
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-surface-dark rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order ID, customer name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-surface-dark rounded-lg shadow">
              <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">No orders found</p>
              <p className="text-gray-500 dark:text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              return (
                <div
                  key={order.id}
                  className={`bg-white dark:bg-surface-dark rounded-lg shadow hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden ${
                    selectedOrder?.id === order.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Order #{order.id.slice(-8)}
                        </h2>
                        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📅 {formatDate(order.createdAt)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        👤 {order.shippingDetails?.fullName || 'Unknown Customer'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📍 {order.shippingDetails?.city || 'Unknown City'}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {formatPrice(order.total)}
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    {order.items && order.items.length > 0 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                        {order.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBagIcon className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                              +{order.items.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Order Details */}
        {selectedOrder && (
          <div className="bg-white dark:bg-surface-dark rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Order #{selectedOrder.id.slice(-8)}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  📅 Placed on {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              <select
                value={selectedOrder.status}
                onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                disabled={updatingStatus}
                className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:text-white disabled:opacity-50"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-6">
              {/* Order Items */}
              <div>
                <h3 className="font-medium mb-4 text-gray-900 dark:text-white flex items-center">
                  <ShoppingBagIcon className="h-5 w-5 mr-2" />
                  Order Items ({selectedOrder.items?.length || 0})
                </h3>
                <div className="space-y-4">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBagIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">{item.name}</h4>

                        {/* Size Information */}
                        {item.selectedSize && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {item.sizingType === 'numeric' ? 'EU Size' : 'Size'}: {item.selectedSize}
                          </p>
                        )}

                        {/* Quantity and Price */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Quantity: {item.quantity}
                          </span>
                          <span className="font-medium text-primary">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Total */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                    <span>Total Amount</span>
                    <span className="text-primary">{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="font-medium mb-4 text-gray-900 dark:text-white flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  Customer Information
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedOrder.shippingDetails?.fullName || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        {selectedOrder.shippingDetails?.phone || 'N/A'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-1" />
                        {selectedOrder.shippingDetails?.email || 'N/A'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">User ID:</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 font-mono text-xs">
                        {selectedOrder.userId || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Quote Information */}
              {selectedOrder.shippingQuote && (
                <div>
                  <h3 className="font-medium mb-4 text-gray-900 dark:text-white flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                    Shipping Quote
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Provider:</span>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedOrder.shippingQuote.provider || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Cost:</span>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{formatPrice(selectedOrder.shippingQuote.cost || 0)}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Estimated Delivery:</span>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {selectedOrder.shippingQuote.estimatedDays
                            ? `${selectedOrder.shippingQuote.estimatedDays} days`
                            : 'N/A'
                          }
                        </p>
                      </div>
                      {selectedOrder.shippingQuote.trackingNumber && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Tracking Number:</span>
                          <p className="text-gray-600 dark:text-gray-400 mt-1 font-mono">
                            {selectedOrder.shippingQuote.trackingNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Details */}
              <div>
                <h3 className="font-medium mb-4 text-gray-900 dark:text-white flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  Shipping Address
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>{selectedOrder.shippingDetails?.streetAddress || 'N/A'}</p>
                  <p>{selectedOrder.shippingDetails?.city || 'N/A'}, {selectedOrder.shippingDetails?.state || ''} {selectedOrder.shippingDetails?.postalCode || ''}</p>
                  <p>{selectedOrder.shippingDetails?.country || 'N/A'}</p>
                </div>
              </div>

              {/* Order Timeline */}
              <div>
                <h3 className="font-medium mb-4 text-gray-900 dark:text-white flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Order Timeline
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>📅 Created: {formatDate(selectedOrder.createdAt)}</p>
                  {selectedOrder.updatedAt && (
                    <p>🔄 Last Updated: {formatDate(selectedOrder.updatedAt)}</p>
                  )}
                </div>
              </div>

              {/* Additional Notes */}
              {(selectedOrder.notes || selectedOrder.specialInstructions) && (
                <div>
                  <h3 className="font-medium mb-4 text-gray-900 dark:text-white flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Additional Information
                  </h3>
                  <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4">
                    {selectedOrder.notes && (
                      <div className="mb-3">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Order Notes:</span>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedOrder.notes}</p>
                      </div>
                    )}
                    {selectedOrder.specialInstructions && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Special Instructions:</span>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedOrder.specialInstructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Order Notes</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders; 
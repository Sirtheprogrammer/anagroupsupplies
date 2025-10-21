import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
  ArrowLeftIcon,
  ShoppingBagIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const Orders = () => {
  const { user } = useAuth();
  const { orderId } = useParams(); // Get order ID from URL params
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'

  // Fetch all orders for the current user
  const fetchOrders = useCallback(async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const ordersList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date(),
        };
      });

      setOrders(ordersList);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    }
  }, [user]);

  // Fetch specific order by ID
  const fetchOrderById = useCallback(async (id) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const orderRef = doc(db, 'orders', id);
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists() && orderSnap.data().userId === user.uid) {
        const orderData = {
          id: orderSnap.id,
          ...orderSnap.data(),
          createdAt: orderSnap.data().createdAt?.toDate?.() || new Date(orderSnap.data().createdAt) || new Date(),
        };
        setCurrentOrder(orderData);
        setViewMode('detail');
      } else {
        toast.error('Order not found or access denied');
        setViewMode('list');
        setCurrentOrder(null);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to fetch order details');
      setViewMode('list');
      setCurrentOrder(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        if (orderId) {
          // If orderId is provided in URL, fetch specific order
          await fetchOrderById(orderId);
        } else {
          // Otherwise, fetch all orders
          await fetchOrders();
          setViewMode('list');
          setCurrentOrder(null);
        }
      } catch (error) {
        console.error('Error loading orders data:', error);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, orderId]); // Only depend on user and orderId, not functions

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

  const getStatusDescription = (status) => {
    switch (status) {
      case 'pending':
        return 'Your order is being confirmed by our team.';
      case 'processing':
        return 'Your order is being prepared for shipment.';
      case 'shipped':
        return 'Your order is on the way to you.';
      case 'delivered':
        return 'Your order has been delivered successfully.';
      case 'cancelled':
        return 'This order has been cancelled.';
      default:
        return 'Order status is being updated.';
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

  // Individual Order Detail View
  if (viewMode === 'detail' && currentOrder) {
    const StatusIcon = getStatusIcon(currentOrder.status);

    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header with back button */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => {
                setViewMode('list');
                setCurrentOrder(null);
                window.history.pushState({}, '', '/orders');
              }}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-text dark:text-text-dark">Order Details</h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
                Track your order status and details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Status & Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Status Card */}
              <div className="bg-surface dark:bg-surface-dark rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-text dark:text-text-dark">
                    Order #{currentOrder.id.slice(-8)}
                  </h2>
                  <div className={`flex items-center px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(currentOrder.status)}`}>
                    <StatusIcon className="h-4 w-4 mr-2" />
                    {currentOrder.status.charAt(0).toUpperCase() + currentOrder.status.slice(1)}
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {getStatusDescription(currentOrder.status)}
                </p>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>📅 Order Date: {formatDate(currentOrder.createdAt)}</p>
                  {currentOrder.updatedAt && (
                    <p>🔄 Last Updated: {formatDate(currentOrder.updatedAt)}</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-surface dark:bg-surface-dark rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold mb-4 text-text dark:text-text-dark flex items-center">
                  <ShoppingBagIcon className="h-5 w-5 mr-2" />
                  Order Items ({currentOrder.items.length})
                </h3>

                <div className="space-y-4">
                  {currentOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-background dark:bg-background-dark rounded-lg">
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
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
                        <h4 className="font-medium text-text dark:text-text-dark truncate">{item.name}</h4>

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
                  <div className="flex justify-between text-lg font-bold text-text dark:text-text-dark">
                    <span>Total Amount</span>
                    <span className="text-primary">{formatPrice(currentOrder.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Shipping & Contact Info */}
            <div className="space-y-6">
              {/* Shipping Information */}
              <div className="bg-surface dark:bg-surface-dark rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold mb-4 text-text dark:text-text-dark flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  Delivery Information
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <span className="font-medium text-text dark:text-text-dark min-w-[80px]">Name:</span>
                    <span className="text-gray-600 dark:text-gray-400">{currentOrder.shippingDetails.fullName}</span>
                  </div>

                  <div className="flex items-start">
                    <PhoneIcon className="h-4 w-4 mt-0.5 mr-2 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">{currentOrder.shippingDetails.phone}</span>
                  </div>

                  <div className="flex items-start">
                    <EnvelopeIcon className="h-4 w-4 mt-0.5 mr-2 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">{currentOrder.shippingDetails.email}</span>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="font-medium text-text dark:text-text-dark mb-1">Delivery Address:</p>
                    <div className="text-gray-600 dark:text-gray-400">
                      <p>{currentOrder.shippingDetails.streetAddress}</p>
                      <p>{currentOrder.shippingDetails.city}, {currentOrder.shippingDetails.state}</p>
                      <p>{currentOrder.shippingDetails.postalCode}</p>
                      <p>{currentOrder.shippingDetails.country}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Actions */}
              <div className="bg-surface dark:bg-surface-dark rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold mb-4 text-text dark:text-text-dark">Need Help?</h3>

                <div className="space-y-3">
                  <Link
                    to="/contact"
                    className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors duration-300 text-center block"
                  >
                    Contact Support
                  </Link>

                  <Link
                    to="/orders"
                    className="w-full border border-primary text-primary py-3 px-4 rounded-lg hover:bg-primary hover:text-white transition-colors duration-300 text-center block"
                  >
                    View All Orders
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Order List View
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text dark:text-text-dark">My Orders</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Track and manage your order history
          </p>
        </div>

        <Link
          to="/products"
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors duration-300"
        >
          Continue Shopping
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-surface dark:bg-surface-dark rounded-lg shadow">
          <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">You haven't placed any orders yet</p>
          <p className="text-gray-500 dark:text-gray-500 mb-6">Start shopping to see your orders here</p>
          <Link
            to="/products"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors duration-300"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const StatusIcon = getStatusIcon(order.status);
            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="bg-surface dark:bg-surface-dark rounded-xl shadow hover:shadow-lg transition-all duration-300 p-5 md:p-6 block"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-text dark:text-text-dark">
                        Order #{order.id.slice(-8)}
                      </h2>
                      <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      Placed on {formatDate(order.createdAt)}
                    </p>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {formatPrice(order.total)}
                    </p>

                    {/* Order Items Preview */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
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
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-primary mb-1">
                      {formatPrice(order.total)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      View Details →
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

const Cart = () => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCartItems = useCallback(async () => {
    if (!user) return;
    
    try {
      const cartRef = doc(db, 'carts', user.uid);
      const itemsRef = collection(cartRef, 'items');
      const itemsSnapshot = await getDocs(itemsRef);
      
      const items = itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCartItems(items);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to fetch cart items');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCartItems();
    }
  }, [user, fetchCartItems]);

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      await updateDoc(doc(db, 'carts', user.uid, 'items', itemId), {
        quantity: newQuantity
      });
      fetchCartItems();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'carts', user.uid, 'items', itemId));
      toast.success('Item removed from cart');
      fetchCartItems();
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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
    <div className="container mx-auto px-4 py-6 pb-40">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-text dark:text-text-dark">Shopping Cart</h1>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-12 bg-surface dark:bg-surface-dark rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Your cart is empty</p>
          <Link
            to="/products"
            className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors duration-300"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cart Items - compact cards for mobile */}
          <div className="flex-1">
            <div className="bg-surface dark:bg-surface-dark rounded-xl shadow overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-3 md:p-4">
                    <div className="flex items-center gap-3">
                      {/* Product Image */}
                      <Link to={`/product/${item.id}`} className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${item.id}`} className="block">
                          <h2 className="text-sm font-semibold text-text dark:text-text-dark truncate">{item.name}</h2>
                        </Link>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-sm text-gray-600 dark:text-gray-400">{formatPrice(item.price)}</div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Subtotal: {formatPrice(item.price * item.quantity)}</div>
                        </div>
                      </div>

                      {/* Quantity Controls - compact */}
                      <div className="flex items-center space-x-2 ml-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                          aria-label={`Decrease quantity for ${item.name}`}
                        >
                          <MinusIcon className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                        </button>
                        <span className="text-sm w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                          aria-label={`Increase quantity for ${item.name}`}
                        >
                          <PlusIcon className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-red-600 hover:text-red-800 dark:hover:text-red-500 ml-2"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary - desktop */}
          <div className="hidden lg:block lg:w-96">
            <div className="bg-surface dark:bg-surface-dark rounded-xl shadow p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4 text-text dark:text-text-dark">Order Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between font-semibold text-lg text-text dark:text-text-dark">
                    <span>Total</span>
                    <span>{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors duration-300"
                >
                  Proceed to Checkout
                </button>
                <Link
                  to="/products"
                  className="block text-center text-primary hover:text-primary-dark dark:hover:text-primary-light"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile Bottom Bar - responsive full-width CTAs with safe-area padding */}
          <div
            className="fixed lg:hidden bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t dark:border-gray-700 p-3 z-50"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
          >
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="w-full sm:w-auto flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Subtotal</div>
                  <div className="text-lg font-semibold">{formatPrice(calculateTotal())}</div>
                </div>
              </div>

              <div className="w-full sm:w-auto flex gap-2">
                <Link
                  to="/products"
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-primary text-primary rounded-md bg-white dark:bg-surface-dark"
                >
                  Continue
                </Link>
                <button
                  onClick={() => navigate('/checkout')}
                  className="flex-1 inline-flex items-center justify-center bg-primary text-white px-4 py-2 rounded-md shadow"
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
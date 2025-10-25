import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { TrashIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

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

      const items = itemsSnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
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
    if (user) fetchCartItems();
  }, [user, fetchCartItems]);

  const updateQuantity = async (itemId, newQuantity) => {
    if (!user) return;
    if (newQuantity < 1) return;

    try {
      await updateDoc(doc(db, 'carts', user.uid, 'items', itemId), {
        quantity: newQuantity,
      });
      await fetchCartItems();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const removeFromCart = async (itemId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'carts', user.uid, 'items', itemId));
      toast.success('Item removed from cart');
      await fetchCartItems();
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const qty = Number(item.quantity) || 0;
      return total + price * qty;
    }, 0);
  };

  const formatPrice = (price) => {
    const numPrice = Number(price) || 0;
    return `TZS ${numPrice.toLocaleString()}`;
  };

  const addToCartWithSize = async (productId, productData, selectedSize) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    if (productData.sizes && productData.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    try {
      const cartRef = doc(db, 'carts', user.uid);
      const itemsRef = collection(cartRef, 'items');

      const existingItemsSnapshot = await getDocs(itemsRef);
      const existingDoc = existingItemsSnapshot.docs.find((d) => {
        const data = d.data();
        return data.productId === productId && data.selectedSize === selectedSize;
      });

      if (existingDoc) {
        const currentQty = Number(existingDoc.data().quantity) || 0;
        await updateDoc(existingDoc.ref, { quantity: currentQty + 1 });
        toast.success('Item quantity updated in cart');
      } else {
        const newItem = {
          productId,
          name: productData.name,
          price: parseFloat(productData.price) || 0,
          image: productData.image || '',
          selectedSize: selectedSize || null,
          sizingType: productData.sizingType || 'none',
          quantity: 1,
          addedAt: new Date().toISOString(),
        };

        await addDoc(itemsRef, newItem);
        toast.success('Item added to cart');
      }

      await fetchCartItems();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-32 lg:pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-text dark:text-text-dark">Shopping Cart</h1>
        {cartItems.length > 0 && (
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            <div className="text-xl font-bold text-primary">{formatPrice(calculateTotal())}</div>
          </div>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-12 bg-surface dark:bg-surface-dark rounded-lg shadow">
          <ShoppingCartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">Your cart is empty</p>
          <p className="text-gray-500 dark:text-gray-500 mb-6">Add some products to get started</p>
          <Link to="/products" className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors duration-300">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mobile Cart Summary */}
          <div className="lg:hidden bg-surface dark:bg-surface-dark rounded-xl shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-text dark:text-text-dark">Cart Summary</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{formatPrice(calculateTotal())}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                <div className="flex justify-between font-semibold text-lg text-text dark:text-text-dark">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(calculateTotal())}</span>
                </div>
              </div>
            </div>

            <Link to="/products" className="block text-center text-primary hover:text-primary-dark dark:hover:text-primary-light mt-4">
              Continue Shopping
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Cart Items - compact cards for mobile */}
            <div className="flex-1">
              <div className="bg-surface dark:bg-surface-dark rounded-xl shadow overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-3 md:p-4">
                      <div className="flex items-center gap-3">
                        {/* Product Image */}
                        <Link to={`/product/${item.productId}`} className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </Link>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <Link to={`/product/${item.productId}`} className="block">
                            <h2 className="text-sm font-semibold text-text dark:text-text-dark truncate">{item.name}</h2>
                            {item.selectedSize && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.sizingType === 'numeric' ? 'EU Size' : 'Size'}: {item.selectedSize}</p>
                            )}
                          </Link>

                          <div className="flex items-center justify-between mt-1">
                            <div className="text-sm text-gray-600 dark:text-gray-400">{formatPrice(item.price)} each</div>
                            <div className="text-sm font-semibold text-primary">{formatPrice((item.price || 0) * (item.quantity || 0))}</div>
                          </div>
                        </div>

                        {/* Quantity Controls - compact */}
                        <div className="flex items-center space-x-2 ml-2">
                          <button onClick={() => updateQuantity(item.id, (Number(item.quantity) || 0) - 1)} className="p-1 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600" aria-label={`Decrease quantity for ${item.name}`}>
                            <MinusIcon className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                          </button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, (Number(item.quantity) || 0) + 1)} className="p-1 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600" aria-label={`Increase quantity for ${item.name}`}>
                            <PlusIcon className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                          </button>
                        </div>

                        {/* Remove */}
                        <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-600 hover:text-red-800 dark:hover:text-red-500 ml-2" aria-label={`Remove ${item.name} from cart`}>
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
              <div className="bg-surface dark:bg-surface-dark rounded-xl shadow-lg p-6 sticky top-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-text dark:text-text-dark flex items-center">
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    Order Summary
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</span>
                    <span>{formatPrice(calculateTotal())}</span>
                  </div>

                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Shipping</span>
                    <span className="font-medium">Free</span>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between font-bold text-xl text-text dark:text-text-dark">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>

                  <button onClick={() => navigate('/checkout')} className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors duration-300 font-semibold">Proceed to Checkout</button>

                  <Link to="/products" className="block text-center text-primary hover:text-primary-dark dark:hover:text-primary-light transition-colors">Continue Shopping</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
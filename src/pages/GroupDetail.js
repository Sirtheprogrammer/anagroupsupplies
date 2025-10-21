import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, query, where, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline';

const GroupDetail = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const fetchGroup = useCallback(async () => {
    setLoading(true);
    try {
      const groupRef = doc(db, 'productGroups', groupId);
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) {
        toast.error('Group not found');
        navigate('/');
        return;
      }
      setGroup({ id: groupSnap.id, ...groupSnap.data() });

      // fetch variants that reference this group
      const q = query(collection(db, 'products'), where('groupId', '==', groupId));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // sort by createdAt if available
      items.sort((a,b) => (a.createdAt && b.createdAt) ? (a.createdAt > b.createdAt ? 1 : -1) : 0);
      setVariants(items);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Error fetching group:', err);
      toast.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  }, [groupId, navigate]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!group) return null;

  const selected = variants[selectedIndex] || null;

  // Check if size selection is required
  const requiresSizeSelection = (product) => {
    return product && product.sizes && product.sizes.length > 0;
  };

  const getSizeTypeLabel = (product) => {
    if (!product || !product.sizingType || product.sizingType === 'none') return '';
    return product.sizingType === 'standard' ? 'Size' :
           product.sizingType === 'numeric' ? 'EU Size' : 'Size';
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (!selected) {
      toast.error('Please select a variant');
      return;
    }

    // Check if size selection is required but not selected
    if (requiresSizeSelection(selected) && !selectedSize) {
      toast.error(`Please select ${getSizeTypeLabel(selected).toLowerCase()} first`);
      setShowSizeSelector(true);
      return;
    }

    try {
      const cartRef = doc(db, 'carts', user.uid);
      const cartItemRef = doc(db, `carts/${user.uid}/items`, selected.id);

      await setDoc(cartItemRef, {
        productId: selected.id,
        groupId: selected.groupId || null,
        name: selected.name,
        price: selected.price,
        image: selected.image,
        selectedSize: selectedSize || null,
        sizingType: selected.sizingType || 'none',
        quantity: quantity,
        addedAt: new Date().toISOString()
      }, { merge: true });

      toast.success('Added to cart successfully');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.error('Please login to add items to wishlist');
      navigate('/login');
      return;
    }

    if (!selected) {
      toast.error('Please select a variant');
      return;
    }

    // Check if size selection is required but not selected
    if (requiresSizeSelection(selected) && !selectedSize) {
      toast.error(`Please select ${getSizeTypeLabel(selected).toLowerCase()} first`);
      setShowSizeSelector(true);
      return;
    }

    try {
      const wishlistItemRef = doc(db, `wishlists/${user.uid}/items`, selected.id);

      await setDoc(wishlistItemRef, {
        productId: selected.id,
        groupId: selected.groupId || null,
        name: selected.name,
        price: selected.price,
        image: selected.image,
        selectedSize: selectedSize || null,
        sizingType: selected.sizingType || 'none',
        addedAt: new Date().toISOString()
      }, { merge: true });

      toast.success('Added to wishlist successfully');
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image & Variant Selection */}
          <div className="space-y-4">
            <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-md overflow-hidden">
              {selected ? (
                <img
                  src={selected.image}
                  alt={selected.name}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gray-100 dark:bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-500">No variant selected</p>
                </div>
              )}
            </div>

            {/* Variant Selection */}
            {variants.length > 1 && (
              <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold mb-3 text-text-primary dark:text-text-dark-primary">
                  Select Variant ({variants.length} available)
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {variants.map((variant, idx) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedIndex(idx)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        idx === selectedIndex
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <img
                        src={variant.image}
                        alt={variant.name}
                        className="w-full h-20 object-cover"
                      />
                      {idx === selectedIndex && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-2">
                  Selected: {selected?.name || 'None'}
                </p>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-text-primary dark:text-text-dark-primary mb-2">
              {group.name}
            </h1>
            <p className="text-text-secondary dark:text-text-dark-secondary mb-4">
              {group.description}
            </p>

            {selected && (
              <>
                <div className="mb-4">
                  <span className="text-sm text-text-tertiary dark:text-text-dark-tertiary">Variant:</span>
                  <span className="ml-2 font-medium text-text-primary dark:text-text-dark-primary">
                    {selected.name}
                  </span>
                </div>

                <div className="text-2xl font-semibold text-primary mb-4">
                  TZS {parseFloat(selected.price).toLocaleString()}
                </div>

                <p className="text-text-secondary dark:text-text-dark-secondary mb-6">
                  {selected.description || 'No description available for this variant.'}
                </p>

                {/* Size Selection */}
                {requiresSizeSelection(selected) && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-2">
                      {getSizeTypeLabel(selected)} *
                    </label>
                    <div className="relative">
                      <button
                        onClick={() => setShowSizeSelector(!showSizeSelector)}
                        className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <span className={selectedSize ? 'text-text-primary dark:text-text-dark-primary' : 'text-text-tertiary dark:text-text-dark-tertiary'}>
                          {selectedSize || `Select ${getSizeTypeLabel(selected).toLowerCase()}`}
                        </span>
                        <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showSizeSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showSizeSelector && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg shadow-lg z-10">
                          <div className={`grid gap-2 p-3 ${
                            selected.sizingType === 'numeric'
                              ? 'grid-cols-5 sm:grid-cols-8'
                              : 'grid-cols-4 sm:grid-cols-6'
                          }`}>
                            {selected.sizes.map((size) => (
                              <button
                                key={size}
                                onClick={() => {
                                  setSelectedSize(size);
                                  setShowSizeSelector(false);
                                }}
                                className={`px-3 py-2 text-sm font-medium rounded border-2 transition-all duration-200 ${
                                  selectedSize === size
                                    ? 'bg-primary text-white border-primary shadow-lg'
                                    : 'bg-surface dark:bg-surface-dark text-text-secondary dark:text-text-dark-secondary border-border dark:border-border-dark hover:border-primary hover:bg-primary/5'
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      -
                    </button>
                    <span className="w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-1 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={requiresSizeSelection(selected) && !selectedSize}
                    className={`flex-1 py-3 px-6 rounded-md transition-colors duration-300 flex items-center justify-center ${
                      requiresSizeSelection(selected) && !selectedSize
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-primary text-white hover:bg-primary-dark'
                    }`}
                  >
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    {requiresSizeSelection(selected) && !selectedSize
                      ? `Select ${getSizeTypeLabel(selected)}`
                      : 'Add to Cart'}
                  </button>
                  <button
                    onClick={handleAddToWishlist}
                    disabled={requiresSizeSelection(selected) && !selectedSize}
                    className={`flex-1 py-3 px-6 rounded-md transition-colors duration-300 flex items-center justify-center ${
                      requiresSizeSelection(selected) && !selectedSize
                        ? 'border-gray-400 text-gray-400 cursor-not-allowed'
                        : 'border-primary text-primary hover:bg-primary hover:text-white'
                    }`}
                  >
                    <HeartIcon className="h-5 w-5 mr-2" />
                    {requiresSizeSelection(selected) && !selectedSize
                      ? `Select ${getSizeTypeLabel(selected)}`
                      : 'Add to Wishlist'}
                  </button>
                </div>
              </>
            )}

            {!selected && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Please select a variant to continue</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;

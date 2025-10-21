import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import ProductReviews from '../components/ProductReviews';
import { ShoppingCartIcon, HeartIcon, PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [variants, setVariants] = useState([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [categories, setCategories] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [selectedSize, setSelectedSize] = useState('');
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const sizeSelectorRef = useRef(null);

  const fetchCategories = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoriesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesList);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    }
  }, []);

  const fetchProduct = useCallback(async () => {
    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const productData = { id: docSnap.id, ...docSnap.data() };
        setProduct(productData);
        setEditedProduct(productData);

        // If this product belongs to a group, fetch sibling variants
        if (productData.groupId) {
          try {
            const q = collection(db, 'products');
            const snapshot = await getDocs(q);
            const siblingVariants = snapshot.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(p => p.groupId === productData.groupId)
              .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));

            setVariants(siblingVariants);

            // Set selected index to the current product within variants
            const idx = siblingVariants.findIndex(v => v.id === productData.id);
            if (idx >= 0) setSelectedVariantIndex(idx);
          } catch (err) {
            console.error('Error fetching sibling variants:', err);
          }
        } else {
          setVariants([productData]);
          setSelectedVariantIndex(0);
        }
      } else {
        toast.error('Product not found');
        navigate('/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to fetch product details');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [fetchProduct, fetchCategories]);

  // Close size selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sizeSelectorRef.current && !sizeSelectorRef.current.contains(event.target)) {
        setShowSizeSelector(false);
      }
    };

    if (showSizeSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showSizeSelector]);

  // Size handling functions
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

    // Check if size selection is required but not selected
    const currentProduct = variants && variants.length > 0 ? variants[selectedVariantIndex] : product;
    if (requiresSizeSelection(currentProduct) && !selectedSize) {
      toast.error(`Please select ${getSizeTypeLabel(currentProduct).toLowerCase()} first`);
      setShowSizeSelector(true);
      return;
    }

    try {
      const selected = currentProduct;
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

    // Check if size selection is required but not selected
    const currentProduct = variants && variants.length > 0 ? variants[selectedVariantIndex] : product;
    if (requiresSizeSelection(currentProduct) && !selectedSize) {
      toast.error(`Please select ${getSizeTypeLabel(currentProduct).toLowerCase()} first`);
      setShowSizeSelector(true);
      return;
    }

    try {
      const selected = currentProduct;
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.REACT_APP_IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        const imageUrl = data.data.url;
        setEditedProduct(prev => ({ ...prev, image: imageUrl }));
        setImagePreview(imageUrl);
        toast.success('Image uploaded successfully');
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!editedProduct.name.trim()) {
      errors.name = 'Product name is required';
    }
    
    if (!editedProduct.price || editedProduct.price <= 0) {
      errors.price = 'Price must be greater than 0';
    }
    
    if (!editedProduct.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!editedProduct.category) {
      errors.category = 'Category is required';
    }
    
    if (!editedProduct.image) {
      errors.image = 'Product image is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    try {
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, {
        name: editedProduct.name.trim(),
        price: parseFloat(editedProduct.price),
        description: editedProduct.description.trim(),
        category: editedProduct.category,
        image: editedProduct.image,
        updatedAt: new Date().toISOString()
      });

      setProduct(editedProduct);
      setIsEditing(false);
      setValidationErrors({});
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleCancelEdit = () => {
    setEditedProduct(product);
    setIsEditing(false);
    setImagePreview('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-md overflow-hidden">
          {isEditing ? (
            <div className="p-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploadingImage}
              />
              <label
                htmlFor="image-upload"
                className={`block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-primary ${
                  uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                } ${validationErrors.image ? 'border-red-500' : ''}`}
              >
                {uploadingImage ? 'Uploading...' : 'Click to change image'}
              </label>
              {validationErrors.image && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.image}</p>
              )}
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <img
                src={(variants && variants.length > 0 ? variants[selectedVariantIndex].image : product.image)}
                alt={product.name}
                className="w-full h-96 object-cover"
              />

              {/* Thumbnails & navigation */}
              {variants && variants.length > 1 && (
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedVariantIndex(Math.max(0, selectedVariantIndex - 1))}
                    className="p-2 rounded-md hover:bg-gray-100"
                    aria-label="Previous variant"
                  >
                    ‹
                  </button>

                  <div className="flex gap-2 overflow-x-auto flex-1 px-4">
                    {variants.map((v, idx) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariantIndex(idx)}
                        className={`w-20 h-20 rounded-md overflow-hidden border ${idx === selectedVariantIndex ? 'border-primary ring-2 ring-primary' : 'border-gray-200'} focus:outline-none`}
                        aria-label={`Select variant ${idx + 1}`}
                      >
                        <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setSelectedVariantIndex(Math.min(variants.length - 1, selectedVariantIndex + 1))}
                    className="p-2 rounded-md hover:bg-gray-100"
                    aria-label="Next variant"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-md p-6">
          {isEditing ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={editedProduct.name}
                  onChange={(e) => setEditedProduct({...editedProduct, name: e.target.value})}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary ${
                    validationErrors.name ? 'border-red-500' : ''
                  }`}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-2">
                  Price (TZS)
                </label>
                <input
                  type="number"
                  value={editedProduct.price}
                  onChange={(e) => setEditedProduct({...editedProduct, price: e.target.value})}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary ${
                    validationErrors.price ? 'border-red-500' : ''
                  }`}
                />
                {validationErrors.price && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.price}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-2">
                  Category
                </label>
                <select
                  value={editedProduct.category}
                  onChange={(e) => setEditedProduct({...editedProduct, category: e.target.value})}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary ${
                    validationErrors.category ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {validationErrors.category && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.category}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-2">
                  Description
                </label>
                <textarea
                  value={editedProduct.description}
                  onChange={(e) => setEditedProduct({...editedProduct, description: e.target.value})}
                  rows="4"
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary ${
                    validationErrors.description ? 'border-red-500' : ''
                  }`}
                />
                {validationErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                )}
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors duration-300 flex items-center justify-center"
                >
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors duration-300 flex items-center justify-center"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-text-primary dark:text-text-dark-primary">{product.name}</h1>
                {user?.isAdmin && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-primary hover:text-primary-dark"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Size requirement indicator */}
              {(() => {
                const currentProduct = variants && variants.length > 0 ? variants[selectedVariantIndex] : product;
                return requiresSizeSelection(currentProduct) && !selectedSize ? (
                  <div className="mb-4 p-3 bg-warning/10 dark:bg-warning/20 border border-warning/30 dark:border-warning/40 rounded-lg">
                    <p className="text-sm text-warning dark:text-warning-100 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Please select {getSizeTypeLabel(currentProduct).toLowerCase()} to continue
                    </p>
                  </div>
                ) : null;
              })()}

              <p className="text-2xl font-semibold text-primary mb-4">
                TZS {parseFloat((variants && variants.length > 0 ? variants[selectedVariantIndex].price : product.price)).toLocaleString()}
              </p>
              <p className="text-text-secondary dark:text-text-dark-secondary mb-6">{(variants && variants.length > 0 ? variants[selectedVariantIndex].description || product.description : product.description)}</p>

              {/* Size Selection */}
              {(() => {
                const currentProduct = variants && variants.length > 0 ? variants[selectedVariantIndex] : product;
                return requiresSizeSelection(currentProduct) ? (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-2">
                      {getSizeTypeLabel(currentProduct)} *
                    </label>

                    <div className="relative">
                      <button
                        onClick={() => setShowSizeSelector(!showSizeSelector)}
                        className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <span className={selectedSize ? 'text-text-primary dark:text-text-dark-primary' : 'text-text-tertiary dark:text-text-dark-tertiary'}>
                          {selectedSize || `Select ${getSizeTypeLabel(currentProduct).toLowerCase()}`}
                        </span>
                        <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showSizeSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showSizeSelector && (
                        <div ref={sizeSelectorRef} className="absolute top-full left-0 right-0 mt-1 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg shadow-lg z-10">
                          <div className={`grid gap-2 p-3 ${
                            currentProduct.sizingType === 'numeric'
                              ? 'grid-cols-5 sm:grid-cols-8'
                              : 'grid-cols-4 sm:grid-cols-6'
                          }`}>
                            {currentProduct.sizes.map((size) => (
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
                          <div className="p-3 border-t border-border dark:border-border-dark bg-background-secondary dark:bg-background-dark-secondary rounded-b-lg">
                            <p className="text-xs text-text-tertiary dark:text-text-dark-tertiary text-center">
                              {currentProduct.sizes.length} sizes available
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 border rounded-md hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 border rounded-md hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={(() => {
                    const currentProduct = variants && variants.length > 0 ? variants[selectedVariantIndex] : product;
                    return requiresSizeSelection(currentProduct) && !selectedSize;
                  })()}
                  className={`flex-1 py-3 px-6 rounded-md transition-colors duration-300 flex items-center justify-center ${
                    (() => {
                      const currentProduct = variants && variants.length > 0 ? variants[selectedVariantIndex] : product;
                      return requiresSizeSelection(currentProduct) && !selectedSize
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-primary text-white hover:bg-primary-dark';
                    })()
                  }`}
                >
                  <ShoppingCartIcon className="h-5 w-5 mr-2" />
                  {(() => {
                    const currentProduct = variants && variants.length > 0 ? variants[selectedVariantIndex] : product;
                    return requiresSizeSelection(currentProduct) && !selectedSize
                      ? `Select ${getSizeTypeLabel(currentProduct)}`
                      : 'Add to Cart';
                  })()}
                </button>
                <button
                  onClick={handleAddToWishlist}
                  disabled={(() => {
                    const currentProduct = variants && variants.length > 0 ? variants[selectedVariantIndex] : product;
                    return requiresSizeSelection(currentProduct) && !selectedSize;
                  })()}
                  className={`flex-1 py-3 px-6 rounded-md transition-colors duration-300 flex items-center justify-center ${
                    (() => {
                      const currentProduct = variants && variants.length > 0 ? variants[selectedVariantIndex] : product;
                      return requiresSizeSelection(currentProduct) && !selectedSize
                        ? 'border-gray-400 text-gray-400 cursor-not-allowed'
                        : 'border-primary text-primary hover:bg-primary hover:text-white';
                    })()
                  }`}
                >
                  <HeartIcon className="h-5 w-5 mr-2" />
                  {(() => {
                    const currentProduct = variants && variants.length > 0 ? variants[selectedVariantIndex] : product;
                    return requiresSizeSelection(currentProduct) && !selectedSize
                      ? `Select ${getSizeTypeLabel(currentProduct)}`
                      : 'Add to Wishlist';
                  })()}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <ProductReviews productId={id} />
      </div>
    </div>
  );
};

export default ProductDetail; 
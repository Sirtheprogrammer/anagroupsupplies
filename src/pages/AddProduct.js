import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addProduct, addProductGroup } from '../firebase/index';
import { uploadImage } from '../services/imageUpload';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import { ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: null,
    sizingType: 'none', // 'none', 'standard', 'numeric', 'custom'
    sizes: [], // Available sizes for the product
    customSizes: '' // For custom size input
  });
  // Group mode: when true we collect shared fields once and allow multiple variants
  const [groupMode, setGroupMode] = useState(false);
  const [variants, setVariants] = useState([]);
  // variant image preview handled inline per-variant state

  // Size management functions
  const standardSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const numericSizes = Array.from({length: 16}, (_, i) => (36 + i).toString()); // 36-51

  const getAvailableSizes = () => {
    switch (formData.sizingType) {
      case 'standard':
        return standardSizes;
      case 'numeric':
        return numericSizes;
      case 'custom':
        return formData.customSizes.split(',').map(s => s.trim()).filter(s => s.length > 0);
      default:
        return [];
    }
  };

  const handleSizeToggle = (size) => {
    if (formData.sizingType === 'none') return;

    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleCustomSizesChange = (value) => {
    setFormData(prev => ({
      ...prev,
      customSizes: value,
      sizes: value.split(',').map(s => s.trim()).filter(s => s.length > 0)
    }));
  };

  const handleAddVariant = () => {
    setVariants(prev => ([...prev, { id: `v-${Date.now()}`, price: '', sku: '', attributes: { color: '' }, image: null }]));
  };

  const handleVariantChange = (index, field, value) => {
    setVariants(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleVariantAttributeChange = (index, attr, value) => {
    setVariants(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], attributes: { ...copy[index].attributes, [attr]: value } };
      return copy;
    });
  };

  const handleVariantImageUpload = async (index, file) => {
    if (!file) return;
    try {
      // show small progress indicator
      setLoading(true);
      const imageUrl = await uploadImage(file);
      setVariants(prev => {
        const copy = [...prev];
        copy[index] = { ...copy[index], image: imageUrl };
        return copy;
      });
    } catch (err) {
      console.error('Error uploading variant image', err);
      toast.error('Failed to upload variant image');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVariant = (index) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categoriesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesList);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    if (files && files[0]) {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setValidationErrors(prev => ({
          ...prev,
          image: 'Please select a valid image file'
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors(prev => ({
          ...prev,
          image: 'Image size should be less than 5MB'
        }));
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    } else if (formData.name.length < 3) {
      errors.name = 'Product name must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      errors.description = 'Product description is required';
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    if (!formData.price) {
      errors.price = 'Price is required';
    } else if (parseFloat(formData.price) <= 0) {
      errors.price = 'Price must be greater than 0';
    }

    if (!formData.category) {
      errors.category = 'Please select a category';
    }

    // Validate sizing
    if (formData.sizingType !== 'none' && formData.sizes.length === 0) {
      errors.sizing = 'Please select at least one size or choose "No sizing required"';
    }

    // If not in group mode, main product image is required. If in group mode,
    // at least one variant with an image must exist (we validate below).
    if (!groupMode && !formData.image) {
      errors.image = 'Product image is required';
    }

    if (groupMode) {
      if (!variants || variants.length === 0) {
        errors.variants = 'Please add at least one variant';
      } else {
        // validate each variant has price and image
        variants.forEach((v, idx) => {
          if (!v.price || parseFloat(v.price) <= 0) {
            errors[`variant_price_${idx}`] = 'Variant price must be greater than 0';
          }
          if (!v.image) {
            errors[`variant_image_${idx}`] = 'Variant image is required';
          }
        });
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting || loading) return;

    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress for image upload
      setUploadProgress(20);
      
      // Upload image to ImgBB
      const imageUrl = await uploadImage(formData.image);
      setUploadProgress(60);

      // If groupMode is enabled, create a group and upload variants
      if (groupMode) {
        // Build group data (shared fields)
        const groupData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          sizingType: formData.sizingType,
          sizes: formData.sizes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Ensure we have at least one variant
        if (variants.length === 0) {
          // If no explicit variants, treat the current image/form as a single variant
          variants.push({
            price: parseFloat(formData.price),
            image: imageUrl,
            sku: formData.sku || null,
            attributes: formData.attributes || {}
          });
        }

        setUploadProgress(80);
        await addProductGroup(groupData, variants);
      } else {
        // Add product to Firestore
        const productData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: parseFloat(formData.price),
          category: formData.category,
          sizingType: formData.sizingType,
          sizes: formData.sizes,
          image: imageUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setUploadProgress(80);
        await addProduct(productData);
      }
      setUploadProgress(100);

      toast.success('Product added successfully!', {
        position: "top-center",
        autoClose: 2000,
      });

      // Small delay to show success state
      setTimeout(() => {
        navigate('/admin/products');
      }, 1500);

    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(error.message || 'Failed to add product');
      setIsSubmitting(false);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
      <div className="flex items-center mb-4 md:mb-6">
        <button
          onClick={() => navigate('/admin/products')}
          className="mr-3 md:mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
          disabled={isSubmitting}
        >
          <ArrowLeftIcon className="h-4 w-4 md:h-5 md:w-5" />
        </button>
        <div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Add New Product</h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Fill in the details below to add a new product</p>
        </div>
      </div>

      {/* Upload Progress */}
      {loading && (
        <div className="mb-4 md:mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 md:p-6">
          <div className="flex items-center mb-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-3"></div>
            <span className="text-sm md:text-base font-medium text-blue-800 dark:text-blue-200">Uploading Product...</span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="text-xs md:text-sm text-blue-600 dark:text-blue-300 mt-2 font-medium">{uploadProgress}% complete</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* Group Mode Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Enable Group Mode</label>
            <p className="text-xs text-gray-500">Create a product group and upload multiple variants (colors, sizes) sharing the same base product data.</p>
          </div>
          <div>
            <label className="inline-flex items-center">
              <input type="checkbox" checked={groupMode} onChange={(e) => setGroupMode(e.target.checked)} className="form-checkbox h-5 w-5 text-primary" />
            </label>
          </div>
        </div>

        {/* Variant Editor (shown when groupMode enabled) */}
        {groupMode && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold">Variants</h3>
              <button type="button" onClick={handleAddVariant} className="text-sm bg-primary text-white px-3 py-1 rounded-md">Add Variant</button>
            </div>

            {variants.length === 0 && (
              <p className="text-xs text-gray-500">No variants added yet — click "Add Variant" to create one.</p>
            )}

            {variants.map((v, idx) => (
              <div key={v.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center border rounded-md p-2 bg-white dark:bg-surface-dark">
                <div className="md:col-span-3 flex items-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
                    {v.image ? (
                      <img src={v.image} alt={`variant-${idx}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-xs text-gray-500 p-2">No image</div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-7 grid grid-cols-1 gap-2">
                  <input type="text" placeholder="SKU (optional)" value={v.sku} onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)} className="block w-full rounded-md border-gray-300 p-2" />
                  <input type="number" placeholder="Price" value={v.price} onChange={(e) => handleVariantChange(idx, 'price', e.target.value)} className="block w-full rounded-md border-gray-300 p-2" />
                  <input type="text" placeholder="Color" value={v.attributes.color} onChange={(e) => handleVariantAttributeChange(idx, 'color', e.target.value)} className="block w-full rounded-md border-gray-300 p-2" />
                </div>
                <div className="md:col-span-2 flex flex-col items-end gap-2">
                  <label className="block">
                    <input type="file" accept="image/*" onChange={(e) => handleVariantImageUpload(idx, e.target.files[0])} className="hidden" id={`variant-image-${idx}`} />
                    <label htmlFor={`variant-image-${idx}`} className="text-sm bg-gray-200 px-2 py-1 rounded-md cursor-pointer">Upload Image</label>
                  </label>
                  <button type="button" onClick={() => handleRemoveVariant(idx)} className="text-sm text-red-600">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={isSubmitting}
            className={`block w-full border rounded-md shadow-sm py-3 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors ${
              validationErrors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter product name"
          />
          {validationErrors.name && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              {validationErrors.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={isSubmitting}
            rows="4"
            className={`block w-full border rounded-md shadow-sm py-3 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors resize-vertical ${
              validationErrors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter detailed product description"
          />
          {validationErrors.description && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              {validationErrors.description}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price (TZS) *</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            disabled={isSubmitting}
            min="0"
            step="0.01"
            inputMode="decimal"
            className={`block w-full border rounded-md shadow-sm py-3 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors ${
              validationErrors.price ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
          />
          {validationErrors.price && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              {validationErrors.price}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={isSubmitting}
            className={`block w-full border rounded-md shadow-sm py-3 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors ${
              validationErrors.category ? 'border-red-500' : 'border-gray-300'
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
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              {validationErrors.category}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Sizing</label>
          <select
            name="sizingType"
            value={formData.sizingType}
            onChange={handleChange}
            disabled={isSubmitting}
            className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors mb-3"
          >
            <option value="none">No sizing required</option>
            <option value="standard">Standard sizes (XS, S, M, L, XL, etc.)</option>
            <option value="numeric">Numeric sizes (36, 37, 38, etc.)</option>
            <option value="custom">Custom sizes (enter your own)</option>
          </select>

          {(formData.sizingType === 'standard' || formData.sizingType === 'numeric') && (
            <>
              <p className="text-xs text-gray-500 mb-3">Select all sizes that will be available for this product</p>
              <div className={`grid gap-2 ${
                formData.sizingType === 'standard'
                  ? 'grid-cols-4 sm:grid-cols-7'
                  : 'grid-cols-5 sm:grid-cols-8'
              }`}>
                {getAvailableSizes().map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSizeToggle(size)}
                    disabled={isSubmitting}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 touch-manipulation ${
                      formData.sizes.includes(size)
                        ? 'bg-primary text-white border-primary shadow-lg'
                        : 'bg-white dark:bg-surface-dark text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </>
          )}

          {formData.sizingType === 'custom' && (
            <>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Custom Sizes</label>
              <p className="text-xs text-gray-500 mb-3">Enter sizes separated by commas (e.g., "Small, Medium, Large, 36, 38")</p>
              <input
                type="text"
                value={formData.customSizes}
                onChange={(e) => handleCustomSizesChange(e.target.value)}
                disabled={isSubmitting}
                placeholder="Small, Medium, Large, 36, 38"
                className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              />
            </>
          )}

          {formData.sizes.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Selected sizes: {formData.sizes.join(', ')}
            </p>
          )}

          {validationErrors.sizing && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              {validationErrors.sizing}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Image *</label>
          <input
            type="file"
            name="image"
            onChange={handleChange}
            disabled={isSubmitting}
            accept="image/*"
            className="block w-full text-sm text-gray-500 file:mr-3 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
          />
          {validationErrors.image && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              {validationErrors.image}
            </p>
          )}

          {/* Image Preview */}
          {imagePreview && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-3">Image Preview:</p>
              <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto md:mx-0">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-full h-full object-cover rounded-lg border-2 border-gray-300 shadow-sm"
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || isSubmitting}
          className={`w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white transition-all duration-200 touch-manipulation min-h-[48px] ${
            loading || isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary active:scale-95'
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
              Adding Product...
            </>
          ) : isSubmitting ? (
            <>
              <CheckCircleIcon className="h-5 w-5 mr-3" />
              Product Added Successfully!
            </>
          ) : (
            'Add Product'
          )}
        </button>
      </form>
    </div>
  );
};

export default AddProduct; 
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProductById } from '../firebase/index';
import { ShoppingBagIcon, HeartIcon } from '@heroicons/react/24/outline';

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        setProduct(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-2 text-text dark:text-text-dark">Loading product details...</p>
      </div>
    </div>
  );
  if (error) return <div className="text-center py-12 text-red-600">Error: {error}</div>;
  if (!product) return <div className="text-center py-12 text-text dark:text-text-dark">Product not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {product.image && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-64 md:h-96 object-contain rounded-lg"
            />
          </div>
        )}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-text dark:text-text-dark">{product.name}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{product.description}</p>
          <p className="text-2xl font-bold mb-6 text-primary">TZS {parseFloat(product.price).toLocaleString()}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors duration-200 flex items-center justify-center space-x-2">
              <ShoppingBagIcon className="h-5 w-5" />
              <span>Add to Cart</span>
            </button>
            <button className="flex-1 bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-gray-300 dark:border-gray-600 py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center space-x-2">
              <HeartIcon className="h-5 w-5" />
              <span>Add to Wishlist</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
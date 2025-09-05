import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useState, useEffect, useRef } from 'react';
import {
  ShoppingBagIcon,
  TagIcon,
  GiftIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const iconMap = {
  Jerseys: ShoppingBagIcon,
  Trousers: TagIcon,
  'T-Shirts': ShoppingBagIcon,
  Sandals: GiftIcon,
  Shoes: GiftIcon,
  Others: SparklesIcon,
};

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showHero, setShowHero] = useState(true);
  const heroTimeoutRef = useRef(null);

  // Add window resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hide hero section after 5 seconds
  useEffect(() => {
    heroTimeoutRef.current = setTimeout(() => {
      setShowHero(false);
    }, 5000);

    return () => {
      if (heroTimeoutRef.current) {
        clearTimeout(heroTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        let q = collection(db, 'products');

        if (selectedCategory) {
          q = query(q, where('category', '==', selectedCategory));
        }

        const querySnapshot = await getDocs(q);
        const productsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort products by creation date on the client side
        productsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setProducts(productsList);
        setError('');
      } catch (error) {
        console.error('Error fetching products:', error);
        setError(error.message);
        toast.error('Failed to load products. Please try again later.');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categoriesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesList);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  if (loadingProducts || loadingCategories) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative h-12 w-12 mx-auto">
            <div className="absolute animate-ping h-full w-full rounded-full bg-primary opacity-20"></div>
            <div className="animate-spin rounded-full h-full w-full border-2 border-t-primary border-r-secondary border-b-accent border-l-transparent"></div>
          </div>
          <p className="mt-4 text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <h2 className="text-2xl font-bold mb-2">Error Loading Data</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Animated Hero Section */}
      {showHero && (
        <section className="w-full bg-gradient-to-r from-primary to-secondary text-white py-8 md:py-16 relative overflow-hidden flex items-center min-h-[35vh] md:min-h-[50vh] animate-fadeIn -mx-4">
          <div className="absolute inset-0 bg-black/10">
            <div className="absolute inset-0 bg-primary mix-blend-multiply opacity-10 animate-pulse"></div>
            <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
          </div>
          <div className="w-full max-w-6xl mx-auto px-4 md:px-8 relative">
            <div className="text-center max-w-4xl mx-auto">
              <div className="mb-2 md:mb-4">
                <span className="text-sm md:text-lg font-medium tracking-wide animate-bounce">Welcome to</span>
              </div>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-6 drop-shadow-lg animate-pulse">
                AnA Group Supplies
              </h1>
              <p className="text-sm md:text-base lg:text-lg mb-4 md:mb-6 text-white/95 mx-auto font-medium animate-fadeIn max-w-2xl">
                Your One-Stop Shop for Quality Products
              </p>
              <Link
                to="/products"
                className="inline-block bg-white text-primary hover:bg-gray-100 px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-medium rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
              >
                Explore Our Products
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section className="py-6 md:py-12">
        <div className="w-full text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-text dark:text-text-dark px-2">Shop by Category</h2>
          <div className="flex space-x-2 md:space-x-3 overflow-x-auto pb-4 px-2 scrollbar-hide snap-x snap-mandatory">
            <button
              onClick={() => handleCategoryClick(null)}
              className={`snap-center flex items-center px-3 md:px-4 py-2 rounded-full shadow-sm transition-all duration-300 flex-shrink-0 hover:scale-105 text-xs md:text-sm whitespace-nowrap
                ${selectedCategory === null ? 'bg-primary text-white' : 'bg-surface dark:bg-surface-dark text-text dark:text-text-dark shadow'}
              `}
            >
              <ShoppingBagIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span>All Products</span>
            </button>

            {categories.map((category) => {
              const IconComponent = iconMap[category.name] || ShoppingBagIcon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`snap-center flex items-center px-3 md:px-4 py-2 rounded-full shadow-sm transition-all duration-300 flex-shrink-0 hover:scale-105 text-xs md:text-sm whitespace-nowrap
                    ${selectedCategory === category.id
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-surface dark:bg-surface-dark text-text dark:text-text-dark shadow'}
                  `}
                >
                  <IconComponent className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-4 md:py-12 products-section">
        <div className="w-full">
          <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6 text-text dark:text-text-dark text-center px-2">
            Explore by Category
          </h2>

          {/* For each category show a single horizontal row of products and a See All link */}
          {categories.map((category) => {
            const catProducts = products.filter(p => p.category === category.id);
            if (!catProducts || catProducts.length === 0) return null;

            return (
              <div key={category.id} className="mb-6 md:mb-8">
                <div className="flex items-center justify-between mb-3 md:mb-4 px-2">
                  <h3 className="text-base md:text-lg font-semibold text-text dark:text-text-dark">{category.name}</h3>
                  <Link
                    to={`/products?category=${category.id}`}
                    className="text-xs md:text-sm text-primary hover:underline flex-shrink-0"
                  >
                    See all
                  </Link>
                </div>

                <div className="overflow-x-auto -mx-2 px-2 scrollbar-hide">
                  <div className="flex space-x-3 md:space-x-4 snap-x snap-mandatory" style={{ width: 'max-content' }}>
                    {catProducts.slice(0, isMobile ? 3 : 5).map(product => (
                      <div
                        key={product.id}
                        className="snap-start w-[140px] sm:w-[160px] md:w-[200px] lg:w-[220px] bg-surface dark:bg-surface-dark rounded-lg md:rounded-xl shadow hover:shadow-lg transition-all duration-300 overflow-hidden flex-shrink-0 hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
                      >
                        <Link to={`/product/${product.id}`} className="block h-full">
                          <div className="w-full bg-gray-100 dark:bg-gray-800 overflow-hidden aspect-square">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="object-contain w-full h-full transition-transform duration-500 hover:scale-110 p-1 md:p-2"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-2 md:p-3">
                            <h4 className="text-xs md:text-sm font-medium text-text dark:text-text-dark line-clamp-2 mb-1 md:mb-2 min-h-[2rem] md:min-h-[2.5rem]">{product.name}</h4>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-primary font-bold text-xs md:text-sm truncate">TZS {parseFloat(product.price).toLocaleString()}</span>
                              <button
                                onClick={(e) => { e.preventDefault(); /* add to cart */ }}
                                className="inline-flex items-center justify-center p-1.5 md:p-2 bg-primary text-white rounded-md md:rounded-lg hover:bg-primary-dark transition-colors duration-200 shadow-sm hover:shadow-md flex-shrink-0"
                                aria-label={`Add ${product.name} to cart`}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* If no products at all, show fallback */}
          {products.length === 0 && (
            <div className="text-center text-gray-600 dark:text-gray-400 py-6 md:py-8 px-2">
              No products available yet.
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
};

export default Home;
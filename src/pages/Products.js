import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('category');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const itemsPerPage = isMobile ? 6 : 12; // 6 items for mobile, 12 for desktop

  // Add window resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, 'products');
      
      let q;
      if (categoryId) {
        q = query(productsRef, where('category', '==', categoryId));
      } else {
        q = query(productsRef);
      }
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No products found in the database');
        setProducts([]);
        return;
      }
      
      const productsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unnamed Product',
          price: data.price || 0,
          image: data.image || '',
          createdAt: data.createdAt || new Date().toISOString(),
          ...data
        };
      }).filter(product => product.name && product.price); // Only include products with required fields
      
      // Sort products by creation date
      productsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log(`Found ${productsList.length} products`);
      setProducts(productsList);
      setCurrentPage(1); // Reset to first page when category changes
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  // Calculate pagination values
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    // First scroll to top immediately
    window.scrollTo(0, 0);
    
    // Then update the page
    setCurrentPage(page);
    
    // Finally, scroll to the products section with smooth behavior
    setTimeout(() => {
      const productsSection = document.querySelector('.products-section');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Test function to verify direct product access
  useEffect(() => {
    const testProductAccess = async () => {
      try {
        const productsRef = collection(db, 'products');
        const testQuery = query(productsRef, limit(1));
        const testSnapshot = await getDocs(testQuery);
        
        console.log('Test query results:');
        console.log('Documents found:', testSnapshot.size);
        testSnapshot.forEach(doc => {
          console.log('Sample product:', { id: doc.id, ...doc.data() });
        });
      } catch (error) {
        console.error('Test query error:', error);
      }
    };

    testProductAccess();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="w-16 h-16 rounded-full border-4 border-primary border-opacity-20"></div>
          </div>
          <div className="absolute top-0 left-0 w-full h-full animate-spin">
            <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-primary"></div>
          </div>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400 animate-pulse">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8">
        <div className="flex-1 w-full md:w-auto">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text dark:text-text-dark mb-2">
            {categoryId ? `${getCategoryName(categoryId)} Products` : 'All Products'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Discover our curated collection of high-quality products
          </p>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4 w-full md:w-auto justify-end mt-4 md:mt-0">
          <Link
            to="/products"
            className={`inline-flex items-center px-4 py-2 rounded-lg bg-surface dark:bg-surface-dark border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 text-sm ${!categoryId ? 'hidden' : ''}`}
          >
            <span className="mr-2">View All Products</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg">
            {categoryId ? 'No products found in this category.' : 'No products available.'}
          </p>
        </div>
      ) : (
        <div className="products-section">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {currentProducts.map((product) => (
              <div key={product.id} className="group bg-surface dark:bg-surface-dark rounded-xl overflow-hidden shadow hover:shadow-lg transition-all duration-300 p-3 md:p-4">
                <Link
                  to={`/product/${product.id}`}
                  className="block"
                >
                  <div className="relative aspect-[4/5] mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="object-cover w-full h-full transition-all duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                  </div>
                  <div className="space-y-2">
                    <div className="min-h-[2.5rem]">
                      <h2 className="text-sm md:text-base font-medium text-text dark:text-text-dark line-clamp-2 group-hover:text-primary transition-colors duration-300">
                        {product.name}
                      </h2>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="block text-primary font-bold text-base md:text-lg">
                        TZS {parseFloat(product.price).toLocaleString()}
                      </span>
                      {product.oldPrice && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                          TZS {parseFloat(product.oldPrice).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // Add to cart logic here
                  }}
                  className="w-full mt-3 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-dark active:bg-primary transition-all duration-300 text-sm font-medium flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Add to Cart</span>
                </button>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-1 mt-8">
              {isMobile ? (
                // Mobile pagination - Simple Next/Previous
                <div className="flex items-center justify-between w-full max-w-xs px-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center px-3 py-2 rounded-md text-sm ${
                      currentPage === 1
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Prev
                  </button>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center px-3 py-2 rounded-md text-sm ${
                      currentPage === totalPages
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </button>
                </div>
              ) : (
                // Desktop pagination - Full controls
                <>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${
                      currentPage === 1
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-4 py-2 rounded-md mx-1 ${
                        currentPage === index + 1
                          ? 'bg-primary text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${
                      currentPage === totalPages
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Products;
import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Search,
  House,
  Cart,
  Person,
  Heart,
  ChevronRight,
  ChevronLeft
} from 'react-bootstrap-icons';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRefs = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesData);

        // Always fetch ALL products (don't filter by category in the query)
        const productsQuery = collection(db, 'products');
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);
        setError('');
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Remove selectedCategory dependency since we fetch all products

  // Filter products by search query and selected category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Smooth scroll function for horizontal scrolling
  const scrollContainer = (categoryId, direction) => {
    const container = scrollRefs.current[categoryId];
    if (!container) return;

    const scrollAmount = 320; // Width of one product card + gap
    const currentScroll = container.scrollLeft;
    const targetScroll = direction === 'left'
      ? currentScroll - scrollAmount
      : currentScroll + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  };

  // Touch/swipe handling for mobile
  const handleTouchStart = (e, categoryId) => {
    const touch = e.touches[0];
    scrollRefs.current[`${categoryId}_startX`] = touch.clientX;
    scrollRefs.current[`${categoryId}_startScrollLeft`] = scrollRefs.current[categoryId]?.scrollLeft || 0;
  };

  const handleTouchMove = (e, categoryId) => {
    if (!scrollRefs.current[`${categoryId}_startX`]) return;
    
    const touch = e.touches[0];
    const diff = scrollRefs.current[`${categoryId}_startX`] - touch.clientX;
    const container = scrollRefs.current[categoryId];
    
    if (container) {
      container.scrollLeft = scrollRefs.current[`${categoryId}_startScrollLeft`] + diff;
    }
  };

  const handleTouchEnd = (categoryId) => {
    scrollRefs.current[`${categoryId}_startX`] = null;
    scrollRefs.current[`${categoryId}_startScrollLeft`] = null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dark">
        <div className="text-center animate-fadeIn">
          <div className="spinner w-16 h-16 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-text-primary dark:text-text-dark-primary mb-2">
            Loading Premium Products
          </h2>
          <p className="text-text-tertiary dark:text-text-dark-tertiary">
            Discovering amazing deals for you...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dark">
        <div className="text-center animate-fadeIn">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-error" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary mb-4">
            Something went wrong
          </h2>
          <p className="text-text-secondary dark:text-text-dark-secondary mb-6">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
}

return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 dark:from-primary/10 dark:via-background-dark dark:to-accent/10">
        <div className="absolute inset-0 bg-grid-pattern dark:bg-grid-pattern-dark opacity-30"></div>
        <div className="relative container-fluid py-12 sm:py-16 lg:py-20">
          <div className="text-center animate-fadeIn">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary dark:text-text-dark-primary mb-4">
              Premium <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Supplies</span>
            </h1>
            <p className="text-lg text-text-secondary dark:text-text-dark-secondary mb-8 max-w-2xl mx-auto">
              Discover high-quality products for your business and personal needs
            </p>
            
            {/* Enhanced Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-tertiary dark:text-text-dark-tertiary group-focus-within:text-primary transition-colors duration-300" />
                <input
                  type="search"
                  placeholder="Search for premium products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-3 text-base bg-white/90 dark:bg-surface-dark/90 backdrop-blur-sm border border-border/30 dark:border-border-dark/30 rounded-xl shadow-lg focus:shadow-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 placeholder-text-tertiary dark:placeholder-text-dark-tertiary"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  selectedCategory === null
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-white/80 dark:bg-surface-dark/80 text-text-secondary dark:text-text-dark-secondary hover:bg-primary/10 border border-border/20 dark:border-border-dark/20'
                }`}
              >
                All Categories
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    selectedCategory === category.id
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-white/80 dark:bg-surface-dark/80 text-text-secondary dark:text-text-dark-secondary hover:bg-primary/10 border border-border/20 dark:border-border-dark/20'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <main className="container-fluid py-8 pb-24">
        {categories.map(category => {
          const categoryProducts = filteredProducts.filter(p => p.category === category.id);
          if (categoryProducts.length === 0) return null;

          return (
            <section key={category.id} className="mb-12 animate-fadeIn">
              {/* Section Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-text-dark-primary mb-1">
                    {category.name}
                  </h2>
                  <p className="text-text-tertiary dark:text-text-dark-tertiary text-sm">
                    {categoryProducts.length} premium products available
                  </p>
                </div>
                <Link
                  to={`/products?category=${category.id}`}
                  className="flex items-center px-4 py-2 bg-primary/10 hover:bg-primary hover:text-white text-primary rounded-lg transition-all duration-300 text-sm font-medium group"
                >
                  View All
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>

              {/* Horizontal Scrollable Product Container */}
              <div className="relative group/section">
                {/* Left Arrow Button */}
                <button
                  onClick={() => scrollContainer(category.id, 'left')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-all duration-300 hover:scale-110 hover:shadow-xl border border-border/20 dark:border-border-dark/20"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-4 w-4 text-text-primary dark:text-text-dark-primary" />
                </button>

                {/* Right Arrow Button */}
                <button
                  onClick={() => scrollContainer(category.id, 'right')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-all duration-300 hover:scale-110 hover:shadow-xl border border-border/20 dark:border-border-dark/20"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-4 w-4 text-text-primary dark:text-text-dark-primary" />
                </button>

                {/* Scrollable Products Container */}
                <div
                  ref={el => scrollRefs.current[category.id] = el}
                  className="flex overflow-x-auto scrollbar-hide gap-4 pb-4 scroll-smooth px-1"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                  onTouchStart={(e) => handleTouchStart(e, category.id)}
                  onTouchMove={(e) => handleTouchMove(e, category.id)}
                  onTouchEnd={() => handleTouchEnd(category.id)}
                >
                  {/* Product Cards */}
                  {categoryProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex-none w-72 bg-white dark:bg-surface-dark rounded-2xl shadow-sm hover:shadow-xl border border-border/10 dark:border-border-dark/10 overflow-hidden group transition-all duration-300 hover:-translate-y-2 animate-slideUp"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <Link to={`/product/${product.id}`} className="block">
                        <div className="relative overflow-hidden">
                          <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center" style={{ display: product.image ? 'none' : 'flex' }}>
                              <div className="text-center">
                                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                  <Cart className="h-8 w-8 text-primary" />
                                </div>
                                <p className="text-sm text-text-secondary dark:text-text-dark-secondary font-medium">
                                  Product Image
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {product.stock <= 0 && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                              <span className="px-3 py-1 bg-error text-white text-sm font-medium rounded-full">Out of Stock</span>
                            </div>
                          )}
                          
                          <div className="absolute top-3 right-3">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toast.success('Added to wishlist!');
                              }}
                              className="w-8 h-8 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg"
                            >
                              <Heart className="h-4 w-4 text-error" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <h3 className="text-base font-semibold text-text-primary dark:text-text-dark-primary mb-2 line-clamp-2 min-h-[2.5rem]">
                            {product.name}
                          </h3>
                          <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-3 line-clamp-2 min-h-[2.5rem]">
                            {product.description || 'Premium quality product crafted with care and attention to detail.'}
                          </p>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="text-xl font-bold text-primary">
                                TZS {parseFloat(product.price || 0).toLocaleString()}
                              </span>
                              {product.originalPrice && (
                                <span className="text-sm text-text-tertiary dark:text-text-dark-tertiary line-through ml-2">
                                  TZS {parseFloat(product.originalPrice).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                      
                      <div className="px-4 pb-4">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toast.success('Added to cart!');
                          }}
                          disabled={product.stock <= 0}
                          className="w-full bg-primary hover:bg-primary-600 text-white py-2.5 rounded-xl font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          <Cart className="h-4 w-4" />
                          <span>{product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* View All Card */}
                  <div className="flex-none w-72 bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 rounded-2xl border-2 border-dashed border-primary/30 dark:border-primary/40 overflow-hidden group transition-all duration-300 hover:-translate-y-2">
                    <Link
                      to={`/products?category=${category.id}`}
                      className="flex flex-col items-center justify-center h-full min-h-[320px] text-center p-6"
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <ChevronRight className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold text-text-primary dark:text-text-dark-primary mb-2">
                        View All {category.name}
                      </h3>
                      <p className="text-text-secondary dark:text-text-dark-secondary mb-4 text-sm">
                        Discover {categoryProducts.length} more products in this category
                      </p>
                      <div className="px-4 py-2 bg-primary/10 hover:bg-primary hover:text-white text-primary rounded-lg transition-all duration-300 text-sm font-medium group-hover:shadow-lg">
                        Browse Collection
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="text-center py-16 animate-fadeIn">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-background-secondary dark:bg-background-dark-secondary flex items-center justify-center">
              <Search className="h-10 w-10 text-text-tertiary dark:text-text-dark-tertiary" />
            </div>
            <h3 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary mb-4">
              No products found
            </h3>
            <p className="text-text-secondary dark:text-text-dark-secondary mb-6">
              Try adjusting your search or browse our categories
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
              className="btn btn-primary"
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-border/20 dark:border-border-dark/20 md:hidden z-40 shadow-lg">
        <div className="grid grid-cols-5 h-16">
          <Link to="/" className="flex flex-col items-center justify-center text-primary">
            <House className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link to="/products" className="flex flex-col items-center justify-center text-text-tertiary dark:text-text-dark-tertiary hover:text-primary transition-colors duration-200">
            <Search className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Products</span>
          </Link>
          <Link to="/cart" className="flex flex-col items-center justify-center text-text-tertiary dark:text-text-dark-tertiary hover:text-primary transition-colors duration-200">
            <Cart className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Cart</span>
          </Link>
          <Link to="/wishlist" className="flex flex-col items-center justify-center text-text-tertiary dark:text-text-dark-tertiary hover:text-primary transition-colors duration-200">
            <Heart className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Wishlist</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center justify-center text-text-tertiary dark:text-text-dark-tertiary hover:text-primary transition-colors duration-200">
            <Person className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Home;

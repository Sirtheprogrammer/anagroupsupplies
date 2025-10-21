import { useState, useEffect, useRef, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  Search
} from 'react-bootstrap-icons';

const Home = () => {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState({});
  const scrollRefs = useRef({});
  const ITEMS_PER_CATEGORY = 8; // limit items rendered per category to improve performance

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

        // Fetch all products
        const productsQuery = collection(db, 'products');
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsData);

  // we rely on products to derive groupings; no separate groups fetch required
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

  // Filter products by search query and selected category (memoized)
  // Grouped products: for products with a groupId, show a single representative (sample)
  const groupedProducts = useMemo(() => {
    const seenGroups = new Set();
    const list = [];

    for (const p of products) {
      if (p.groupId) {
        if (seenGroups.has(p.groupId)) continue;

        // collect all variants for this group
        const variants = products.filter(x => x.groupId === p.groupId);
        const rep = p; // first encountered as representative
        const prices = variants.map(v => parseFloat(v.price || 0)).filter(n => !Number.isNaN(n));
        const minPrice = prices.length > 0 ? Math.min(...prices) : parseFloat(rep.price || 0);

        list.push({
          id: rep.id,
          groupId: p.groupId,
          name: rep.name,
          image: rep.image,
          category: rep.category,
          description: rep.description,
          price: rep.price,
          groupMinPrice: minPrice,
          variantCount: variants.length
        });

        seenGroups.add(p.groupId);
      } else {
        list.push(p);
      }
    }

    return list;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = String(searchQuery ?? '').trim().toLowerCase();
    return groupedProducts.filter(product => {
      const name = product && product.name != null ? String(product.name) : '';
      const matchesSearch = q === '' ? true : name.toLowerCase().includes(q);
      const categoryVal = product && product.category != null ? String(product.category) : '';
      const matchesCategory = selectedCategory ? categoryVal === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [groupedProducts, searchQuery, selectedCategory]);

  // If categories from Firestore are empty, derive categories from products so sections won't disappear (memoized)
  const displayCategories = useMemo(() => {
    if (categories && categories.length > 0) return categories;
    const map = new Map();
    for (const p of products) {
      const id = p.category || 'uncategorized';
      if (!map.has(id)) map.set(id, { id, name: p.category || 'Uncategorized' });
    }
    return Array.from(map.values());
  }, [categories, products]);

  // Simplified smooth scrolling for better mobile performance
  const scrollToItem = (direction, categoryId) => {
    const container = scrollRefs.current[categoryId];
    if (!container) return;

    const itemWidth = 220; // Card width + gap
    const scrollAmount = direction === 'left' ? -itemWidth : itemWidth;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Check if product requires size selection
  const requiresSizeSelection = (product) => {
    return product.sizes && product.sizes.length > 0;
  };

  // Add item to cart with size selection
  const addToCartWithSize = async (product) => {
    if (requiresSizeSelection(product)) {
      // Redirect to product detail page for size selection
      navigate(`/product/${product.id}`);
      return;
    }

    try {
       // Use the existing cart functionality from Cart component
       const cartRef = doc(db, 'carts', user?.uid || 'guest');
      const itemsRef = collection(cartRef, 'items');

      // For products without size requirements, check if item exists
      const existingItemsSnapshot = await getDocs(itemsRef);
      const existingItem = existingItemsSnapshot.docs.find(doc => {
        const data = doc.data();
        return data.productId === product.id;
      });

      if (existingItem) {
        // Update quantity if item exists
        await updateDoc(existingItem.ref, {
          quantity: existingItem.data().quantity + 1
        });
        toast.success('Item quantity updated in cart');
      } else {
        // Add new item (products without size requirements go directly to cart)
        const { addDoc } = await import('firebase/firestore');
        const newItem = {
          productId: product.id,
          name: product.name,
          price: parseFloat(product.price),
          image: product.image,
          quantity: 1,
          addedAt: new Date().toISOString()
        };

        await addDoc(itemsRef, newItem);
        toast.success('Item added to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
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
              {displayCategories.map(category => (
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
        {displayCategories.map((category) => {
          const categoryProductsAll = filteredProducts.filter(p => p.category === category.id);
          if (categoryProductsAll.length === 0) return null;

          // Split products into grouped variants and standalone products
          const groupedMap = {};
          const standalone = [];
          for (const p of categoryProductsAll) {
            if (p.groupId) {
              if (!groupedMap[p.groupId]) groupedMap[p.groupId] = [];
              groupedMap[p.groupId].push(p);
            } else {
              standalone.push(p);
            }
          }

          const groupItems = Object.keys(groupedMap).map((gid) => {
            const variants = groupedMap[gid];
            const rep = variants[0];
            const minPrice = Math.min(...variants.map(v => parseFloat(v.price || 0)));
            return {
              id: gid,
              isGroup: true,
              image: rep.image,
              name: rep.name,
              price: minPrice,
              variantCount: variants.length
            };
          });

          const categoryProducts = [...groupItems, ...standalone];

          return (
            <section key={category.id} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-text-primary dark:text-text-dark-primary">{category.name}</h2>
                <Link to={`/products?category=${category.id}`} className="text-sm text-primary hover:underline">View All</Link>
              </div>

              <div
                ref={(el) => (scrollRefs.current[category.id] = el)}
                className="flex gap-4 overflow-x-auto pb-4 -mx-3 px-3 scroll-smooth snap-x snap-mandatory scrollbar-hide product-showcase-container"
              >
                {categoryProducts.slice(0, ITEMS_PER_CATEGORY).map((item) => (
                  <div key={item.id} className="w-[200px] md:w-[220px] flex-shrink-0 snap-start group bg-surface dark:bg-surface-dark rounded-xl overflow-hidden shadow hover:shadow-lg transition-all duration-300 product-card-horizontal">
                    {item.isGroup ? (
                      <Link to={`/group/${item.id}`} className="block">
                        <div className="relative aspect-[4/5] mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img src={item.image} alt={item.name} className="object-cover w-full h-full transition-all duration-500 group-hover:scale-110" loading="lazy" />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                          {/* Variant count indicator */}
                          <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-medium">
                            {item.variantCount} options
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="min-h-[2.5rem]">
                            <h3 className="text-sm md:text-base font-medium text-text dark:text-text-dark line-clamp-2 group-hover:text-primary transition-colors duration-300">
                              {item.name}
                            </h3>
                          </div>
                          <div className="flex items-end justify-between">
                            <span className="block text-primary font-bold text-base md:text-lg">From TZS {parseFloat(item.price).toLocaleString()}</span>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <Link to={`/product/${item.id}`} className="block">
                        <div className="relative aspect-[4/5] mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img src={item.image} alt={item.name} className="object-cover w-full h-full transition-all duration-500 group-hover:scale-110" loading="lazy" />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                        </div>

                        <div className="space-y-2">
                          <div className="min-h-[2.5rem]">
                            <h3 className="text-sm md:text-base font-medium text-text dark:text-text-dark line-clamp-2 group-hover:text-primary transition-colors duration-300">
                              {item.name}
                            </h3>
                          </div>
                          <div className="flex items-end justify-between">
                            <span className="block text-primary font-bold text-base md:text-lg">TZS {parseFloat(item.price).toLocaleString()}</span>
                            {item.oldPrice && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 line-through">TZS {parseFloat(item.oldPrice).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )}

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(item.isGroup ? `/group/${item.id}` : `/product/${item.id}`);
                        }}
                        className="flex-1 bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary-dark active:bg-primary transition-all duration-300 text-sm font-medium flex items-center justify-center space-x-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12h.01M12 12h.01M9 12h.01" />
                        </svg>
                        <span>{item.isGroup ? 'View Group' : 'View Product'}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (requiresSizeSelection(item)) {
                            // Redirect to product detail page for size selection
                            navigate(item.isGroup ? `/group/${item.id}` : `/product/${item.id}`);
                          } else {
                            // Add directly to cart for products without size requirements
                            addToCartWithSize(item);
                          }
                        }}
                        className="flex-1 bg-accent hover:bg-accent/80 text-white px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium flex items-center justify-center space-x-1 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                ))}

                {categoryProducts.length > ITEMS_PER_CATEGORY && (
                   <div className="w-[200px] md:w-[220px] flex-shrink-0 flex items-center justify-center rounded-xl border-2 border-dashed border-border/40 bg-white/60 dark:bg-surface-dark p-4 product-card-horizontal">
                     <Link to={`/products?category=${category.id}`} className="text-sm font-semibold text-primary">View All</Link>
                   </div>
                 )}
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

    </div>
  );
};

export default Home;

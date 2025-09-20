import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Wishlist = () => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    if (!user) return;
    
    try {
      const wishlistRef = doc(db, 'wishlists', user.uid);
      const itemsRef = collection(wishlistRef, 'items');
      const itemsSnapshot = await getDocs(itemsRef);
      
      const wishlistItems = itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setWishlist(wishlistItems);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user, fetchWishlist]);

  const removeFromWishlist = async (productId) => {
    try {
      await deleteDoc(doc(db, 'wishlists', user.uid, 'items', productId));
      toast.success('Item removed from wishlist');
      fetchWishlist();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove item from wishlist');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-32">
      <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Your wishlist is empty</p>
          <Link
            to="/products"
            className="mt-4 inline-block bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors duration-300"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop: grid cards; Mobile: compact stacked list */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <div key={item.id} className="bg-white dark:bg-surface-dark rounded-lg shadow-md overflow-hidden">
                <Link to={`/product/${item.id}`}>
                  <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                </Link>
                <div className="p-4">
                  <Link to={`/product/${item.id}`}>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white truncate">{item.name}</h2>
                  </Link>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">TZS {parseFloat(item.price).toLocaleString()}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                    <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors duration-300">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile friendly list */}
          <div className="md:hidden space-y-3">
            {wishlist.map((item) => (
              <div key={item.id} className="flex items-center bg-white dark:bg-surface-dark rounded-lg shadow p-3">
                <Link to={`/product/${item.id}`} className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </Link>

                <div className="flex-1 min-w-0 ml-3">
                  <Link to={`/product/${item.id}`} className="block">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-white truncate">{item.name}</h2>
                  </Link>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">TZS {parseFloat(item.price).toLocaleString()}</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        aria-label={`Remove ${item.name} from wishlist`}
                      >
                        Remove
                      </button>
                      <button
                        className="bg-primary text-white text-sm px-3 py-1.5 rounded-md"
                        aria-label={`Add ${item.name} to cart`}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Wishlist;
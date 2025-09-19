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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <Link to={`/product/${item.id}`}>
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
              </Link>
              <div className="p-4">
                <Link to={`/product/${item.id}`}>
                  <h2 className="text-xl font-semibold text-gray-800">{item.name}</h2>
                </Link>
                <p className="text-gray-600 mt-2">TZS {parseFloat(item.price).toLocaleString()}</p>
                <div className="mt-4 flex justify-between">
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
      )}
    </div>
  );
};

export default Wishlist; 
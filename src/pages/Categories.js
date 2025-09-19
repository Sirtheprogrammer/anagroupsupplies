import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ShoppingBagIcon, 
  TagIcon, 
  GiftIcon, 
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const iconMap = {
  Jerseys: ShoppingBagIcon,
  Trousers: TagIcon,
  'T-Shirts': ShoppingBagIcon,
  Sandals: GiftIcon,
  Shoes: GiftIcon,
  Others: SparklesIcon,
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

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
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
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
      <h1 className="text-3xl font-bold mb-8 text-center">Shop by Category</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const IconComponent = iconMap[category.name] || ShoppingBagIcon;
          return (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary bg-opacity-10 rounded-lg">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="ml-3 text-xl font-semibold text-gray-900">{category.name}</h2>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                </div>
                {category.description && (
                  <p className="text-gray-600">{category.description}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No categories available at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default Categories; 
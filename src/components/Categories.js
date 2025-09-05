import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';
import { 
  ShoppingBagIcon, 
  TagIcon, 
  GiftIcon, 
  SparklesIcon
} from '@heroicons/react/24/outline';

const iconMap = {
  Jerseys: ShoppingBagIcon,
  Trousers: TagIcon,
  Sandals: GiftIcon,
  Shoes: GiftIcon,
  Others: SparklesIcon,
  // Add more mappings for other categories as needed
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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
        // Optionally show a toast error here
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        {/* Loading spinner or placeholder */}
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null; // Don't render if no categories
  }

  return (
    <div className="bg-gray-100 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
        <div className="flex space-x-4">
          {categories.map((category) => {
            const IconComponent = iconMap[category.name] || ShoppingBagIcon; // Default icon if not mapped
            return (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="flex items-center px-4 py-2 bg-white rounded-full shadow-sm text-gray-700 hover:bg-gray-200 transition-colors duration-200 flex-shrink-0"
              >
                <IconComponent className="h-5 w-5 mr-2" />
                <span>{category.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Categories; 
import { collection, query, getDocs, orderBy, limit, startAt, endAt } from 'firebase/firestore';
import { db } from '../firebase/config';
import Fuse from 'fuse.js';

// Cache for search results to improve performance
let searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fuse.js options for fuzzy search
const fuseOptions = {
  keys: ['name', 'description', 'category'],
  threshold: 0.3,
  distance: 100,
  minMatchCharLength: 2,
};

/**
 * Clean and normalize search text
 */
const normalizeSearchText = (text) => {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Get search suggestions based on partial input
 */
export const getSearchSuggestions = async (searchText, maxSuggestions = 5) => {
  const normalized = normalizeSearchText(searchText);
  
  if (normalized.length < 2) return [];
  
  // Check cache first
  const cacheKey = `suggestions_${normalized}`;
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return cached.data;
  }

  try {
    // Query products that start with the search text
    const productsRef = collection(db, 'products');
    const searchQuery = query(
      productsRef,
      orderBy('name'),
      startAt(normalized),
      endAt(normalized + '\uf8ff'),
      limit(maxSuggestions)
    );

    const snapshot = await getDocs(searchQuery);
    const suggestions = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      suggestions.push({
        id: doc.id,
        name: data.name,
        category: data.category
      });
    });

    // Store in cache
    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      data: suggestions
    });

    return suggestions;
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return [];
  }
};

/**
 * Perform a full text search across products
 */
export const searchProducts = async (searchText) => {
  const normalized = normalizeSearchText(searchText);
  
  // Check cache first
  const cacheKey = `search_${normalized}`;
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return cached.data;
  }

  try {
    // Get all products (you might want to limit this in production)
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    
    const products = [];
    snapshot.forEach(doc => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Use Fuse.js for fuzzy searching
    const fuse = new Fuse(products, fuseOptions);
    const results = fuse.search(normalized);

    // Extract just the items from the Fuse.js results
    const searchResults = results.map(result => result.item);

    // Store in cache
    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      data: searchResults
    });

    return searchResults;
  } catch (error) {
    console.error('Error performing search:', error);
    return [];
  }
};

/**
 * Clear expired items from cache
 */
export const cleanupSearchCache = () => {
  const now = Date.now();
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      searchCache.delete(key);
    }
  }
};

// Run cache cleanup every 5 minutes
setInterval(cleanupSearchCache, CACHE_DURATION);

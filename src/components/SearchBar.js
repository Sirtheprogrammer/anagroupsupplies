import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSearchSuggestions, searchProducts } from '../services/searchService';
import { debounce } from 'lodash';
import { MagnifyingGlassIcon as SearchIcon } from '@heroicons/react/24/outline';

const SearchBar = ({ 
  className = '', 
  size = 'md',
  autoFocus = false,
  placeholder = "Search products...",
  onClose = null,
  value = '',
  onChange = null
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions (stable via useCallback)
  const fetchSuggestions = useCallback(async (searchText) => {
    if (searchText.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await getSearchSuggestions(searchText);
      setSuggestions(results);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setSuggestions, setIsLoading]);

  // Debounced function to fetch suggestions (memoized)
  const debouncedFetchSuggestions = useMemo(() => debounce(fetchSuggestions, 300), [fetchSuggestions]);

  // Cancel pending debounced calls on unmount
  useEffect(() => {
    return () => debouncedFetchSuggestions.cancel && debouncedFetchSuggestions.cancel();
  }, [debouncedFetchSuggestions]);

  // Handle input changes
  const handleInputChange = (e) => {
    const value = e.target.value;
    if (!onChange) {
      setQuery(value);
    }
    setShowSuggestions(true);
    debouncedFetchSuggestions(value);
    if (onChange) {
      onChange(value);
    }
  };

  // Handle search submission
  const handleSearch = async (searchText = query) => {
    if (!searchText.trim()) return;

    setIsLoading(true);
    try {
      const results = await searchProducts(searchText);
      // Navigate to search results page with the results
      navigate('/search', { 
        state: { 
          results,
          query: searchText
        }
      });
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setIsLoading(false);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.name);
    handleSearch(suggestion.name);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  // Calculate input padding and icon sizes based on size prop
  const sizeClasses = {
    sm: {
      input: 'py-2 pl-9 pr-3 text-sm',
      icon: 'h-4 w-4',
      suggestion: 'px-3 py-2 text-sm'
    },
    md: {
      input: 'py-2.5 pl-10 pr-4 text-base',
      icon: 'h-5 w-5',
      suggestion: 'px-4 py-2.5'
    },
    lg: {
      input: 'py-3 pl-11 pr-5 text-lg',
      icon: 'h-6 w-6',
      suggestion: 'px-4 py-3'
    }
  }[size];

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative group">
        <input
          type="text"
          value={onChange ? value : query}
          onChange={onChange || handleInputChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full rounded-xl border border-gray-300 dark:border-gray-600 
                   focus:ring-2 focus:ring-primary/20 focus:border-primary
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   placeholder-gray-500 dark:placeholder-gray-400
                   transition-all duration-300
                   ${sizeClasses.input}`}
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className={`${sizeClasses.icon} ${isLoading ? 'text-primary animate-pulse' : 'text-gray-400 group-focus-within:text-primary transition-colors duration-200'}`} />
        </div>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg 
                      border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto
                      animate-slideDown">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => {
                handleSuggestionClick(suggestion);
                onClose && onClose();
              }}
              className={`w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700
                       text-gray-900 dark:text-white flex items-center justify-between
                       ${sizeClasses.suggestion} transition-colors duration-200`}
            >
              <span>{suggestion.name}</span>
              {suggestion.category && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-600 rounded-full">
                  {suggestion.category}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

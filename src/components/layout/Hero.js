import React from 'react';
import SearchBar from '../SearchBar';

const Hero = ({ searchQuery = '', onSearch }) => {
  return (
    <div className="relative bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Find Your Perfect
            <span className="text-primary"> Premium Products</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Discover high-quality products from trusted suppliers at competitive prices
          </p>
          
          {/* Search Section */}
          <div className="max-w-2xl mx-auto">
            <SearchBar 
              value={searchQuery}
              onChange={onSearch}
              className="w-full shadow-lg" 
              size="lg"
              placeholder="Search for premium products..."
            />
          </div>
          
          {/* Popular Categories or Tags */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Popular:</span>
            {['Electronics', 'Office Supplies', 'Furniture', 'Stationery'].map((category) => (
              <button
                key={category}
                className="text-sm text-primary hover:text-primary-dark transition-colors duration-200"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-accent/5 to-primary/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default Hero;

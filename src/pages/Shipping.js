import React from 'react';
import { Link } from 'react-router-dom';

const Shipping = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Shipping Information</h1>
      <p className="mb-6 text-gray-700 dark:text-gray-300">We offer free shipping within Tanzania for orders over TZS 50,000. Delivery times vary depending on location.</p>

      <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Delivery Times</h2>
        <p className="text-gray-600 dark:text-gray-400">2-5 business days within major cities.</p>

        <h2 className="text-lg font-semibold mt-4 mb-2">Shipping Rates</h2>
        <p className="text-gray-600 dark:text-gray-400">Local delivery rates may apply for remote areas.</p>

        <div className="mt-6">
          <Link to="/" className="text-primary hover:underline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Shipping;

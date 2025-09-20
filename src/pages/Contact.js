import React from 'react';
import { Link } from 'react-router-dom';

const Contact = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Contact Us</h1>
      <p className="mb-6 text-gray-700 dark:text-gray-300">If you have any questions or need assistance, reach out to our support team.</p>

      <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Email</h2>
        <p className="text-gray-600 dark:text-gray-400">support@anagroupsupplies.co.tz</p>

        <h2 className="text-lg font-semibold mt-4 mb-2">Phone</h2>
        <p className="text-gray-600 dark:text-gray-400">+255 6XX XXX XXX</p>

        <h2 className="text-lg font-semibold mt-4 mb-2">Address</h2>
        <p className="text-gray-600 dark:text-gray-400">Dar es Salaam, Tanzania</p>

        <div className="mt-6">
          <Link to="/" className="text-primary hover:underline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Contact;

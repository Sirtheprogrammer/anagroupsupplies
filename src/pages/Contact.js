import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';

const Contact = () => {
  const [settings, setSettings] = useState({
    businessEmail: 'support@anagroupsupplies.co.tz',
    supportPhone: '255683568254',
    address: 'Dar es Salaam, Tanzania',
    businessName: 'AnA Group Supplies'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'general');
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          setSettings(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (error) {
        console.error('Error fetching contact settings:', error);
        toast.error('Failed to load contact information');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const toArray = (val) => {
    if (!val && val !== 0) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  const formatPhone = (num) => {
    if (!num) return '';
    return num.startsWith('+') ? num : `+${num}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const phones = toArray(settings.supportPhone);
  const emails = toArray(settings.businessEmail);
  const address = settings.address || settings.businessAddress || '';

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Contact Us</h1>
      <p className="mb-6 text-gray-700 dark:text-gray-300">If you have any questions or need assistance, reach out to our support team.</p>

      <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Email</h2>
        {emails.length > 0 ? (
          emails.map((e, idx) => (
            <p key={idx} className="text-gray-600 dark:text-gray-400">
              <a href={`mailto:${e}`} className="text-primary hover:underline">{e}</a>
            </p>
          ))
        ) : (
          <p className="text-gray-600 dark:text-gray-400">support@anagroupsupplies.co.tz</p>
        )}

        <h2 className="text-lg font-semibold mt-4 mb-2">Phone</h2>
        {phones.length > 0 ? (
          phones.map((p, idx) => (
            <p key={idx} className="text-gray-600 dark:text-gray-400">
              <a href={`tel:${formatPhone(p)}`}>{formatPhone(p)}</a>
            </p>
          ))
        ) : (
          <p className="text-gray-600 dark:text-gray-400">+255 6XX XXX XXX</p>
        )}

        <h2 className="text-lg font-semibold mt-4 mb-2">Address</h2>
        {address ? (
          // allow address to be either string or array
          Array.isArray(address) ? (
            address.map((line, idx) => (
              <p key={idx} className="text-gray-600 dark:text-gray-400">{line}</p>
            ))
          ) : (
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{address}</p>
          )
        ) : (
          <p className="text-gray-600 dark:text-gray-400">Dar es Salaam, Tanzania</p>
        )}

        <div className="mt-6">
          <Link to="/" className="text-primary hover:underline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Contact;

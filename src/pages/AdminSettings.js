import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import { ArrowLeftIcon, CheckIcon, PhoneIcon } from '@heroicons/react/24/outline';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    whatsappNumber: '255683568254',
    businessName: 'AnA Group Supplies',
    businessEmail: 'info@anagroupsupplies.co.tz',
    supportPhone: '255683568254'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'general');
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
          setSettings(prev => ({
            ...prev,
            ...settingsSnap.data()
          }));
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const settingsRef = doc(db, 'settings', 'general');

      // Check if settings document exists
      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        // Update existing document
        await updateDoc(settingsRef, {
          ...settings,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new document
        await setDoc(settingsRef, {
          ...settings,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => window.history.back()}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Manage your store settings and contact information
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* WhatsApp Number - Primary Feature */}
          <div className="border-l-4 border-primary pl-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <PhoneIcon className="h-5 w-5 mr-2 text-primary" />
              WhatsApp Order Configuration
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This number will be used for receiving customer orders via WhatsApp
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                WhatsApp Number *
              </label>
              <input
                type="tel"
                value={settings.whatsappNumber}
                onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                placeholder="255XXXXXXXXX"
                className="w-full md:w-96 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-surface-dark dark:text-text-dark"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter number with country code (e.g., 255683568254 for Tanzania)
              </p>
            </div>
          </div>

          {/* Business Information */}
          <div className="border-l-4 border-gray-300 pl-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Business Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={settings.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-surface-dark dark:text-text-dark"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Email
                </label>
                <input
                  type="email"
                  value={settings.businessEmail}
                  onChange={(e) => handleChange('businessEmail', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-surface-dark dark:text-text-dark"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Support Phone Number
                </label>
                <input
                  type="tel"
                  value={settings.supportPhone}
                  onChange={(e) => handleChange('supportPhone', e.target.value)}
                  placeholder="255XXXXXXXXX"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-surface-dark dark:text-text-dark"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors duration-300 flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* WhatsApp Message Preview */}
      <div className="mt-6 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center">
          <PhoneIcon className="h-4 w-4 mr-2" />
          WhatsApp Integration Preview
        </h3>

        <div className="bg-white dark:bg-surface-dark rounded-lg p-3 mb-3 border border-green-200 dark:border-green-800">
          <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-2">Sample Order Message:</p>
          <div className="text-xs text-gray-700 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded">
            *New Order*

*Order Items:*
Sample Product x 2 @ TZS 50,000 = TZS 100,000

*Total: TZS 100,000*

*Shipping Information:*
Name: John Doe
Phone: +255123456789
...
          </div>
        </div>

        <p className="text-sm text-green-700 dark:text-green-300">
          📱 Orders will be sent to: <strong>+{settings.whatsappNumber}</strong>
        </p>
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          This number receives all customer orders via WhatsApp when they complete checkout
        </p>
      </div>
    </div>
  );
};

export default AdminSettings;
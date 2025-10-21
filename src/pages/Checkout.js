import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, doc, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('255683568254'); // Default fallback
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Fetch WhatsApp number from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Try general settings first
        const generalSettingsRef = doc(db, 'settings', 'general');
        const generalSettingsSnap = await getDoc(generalSettingsRef);

        if (generalSettingsSnap.exists()) {
          const settings = generalSettingsSnap.data();
          setWhatsappNumber(settings.whatsappNumber || '255683568254');
          return;
        }

        // Fallback to whatsapp-specific settings
        const whatsappSettingsRef = doc(db, 'settings', 'whatsapp');
        const whatsappSettingsSnap = await getDoc(whatsappSettingsRef);

        if (whatsappSettingsSnap.exists()) {
          const settings = whatsappSettingsSnap.data();
          setWhatsappNumber(settings.number || '255683568254');
        }
      } catch (error) {
        console.error('Error fetching WhatsApp settings:', error);
        // Show user-friendly error message if it's a permissions issue
        if (error.code === 'permission-denied') {
          console.warn('Settings collection not accessible. Using default WhatsApp number.');
        }
        // Keep default number as fallback
      } finally {
        setSettingsLoading(false);
      }
    };

    fetchSettings();
  }, []);
  const [shippingDetails, setShippingDetails] = useState({
    fullName: '',
    email: '',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Tanzania'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatPrice = (price) => {
    return `TZS ${parseFloat(price).toLocaleString()}`;
  };

  const generateWhatsAppMessage = async () => {
    const itemsRef = collection(db, 'carts', user.uid, 'items');
    const itemsSnapshot = await getDocs(itemsRef);
    const cartItems = itemsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderDetails = cartItems.map(item =>
      `${item.name} x ${item.quantity} @ ${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}`
    ).join('\n');

    const message = `*New Order*\n\n` +
      `*Order Items:*\n${orderDetails}\n\n` +
      `*Total: ${formatPrice(total)}*\n\n` +
      `*Shipping Information:*\n` +
      `Name: ${shippingDetails.fullName}\n` +
      `Phone: ${shippingDetails.phone}\n` +
      `Email: ${shippingDetails.email}\n` +
      `Address: ${shippingDetails.streetAddress}\n` +
      `City: ${shippingDetails.city}\n` +
      `Region: ${shippingDetails.state}\n` +
      `Postal Code: ${shippingDetails.postalCode}\n` +
      `Country: ${shippingDetails.country}`;

    return { message, cartItems };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (settingsLoading) {
      toast.info('Loading settings... Please wait a moment.');
      return;
    }

    setLoading(true);

    try {
      const { message, cartItems } = await generateWhatsAppMessage();
      
      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // Create order in database
      const orderData = {
        userId: user.uid,
        items: cartItems,
        total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        shippingDetails,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Clear cart
      for (const item of cartItems) {
        await deleteDoc(doc(db, 'carts', user.uid, 'items', item.id));
      }

      // Open WhatsApp with the generated message
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      toast.success('Order placed successfully! Redirecting to WhatsApp...');
      navigate(`/orders/${orderRef.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-text dark:text-text-dark">Checkout</h1>
      
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5 bg-surface dark:bg-surface-dark p-5 rounded-xl shadow">
          <div>
            <label className="block text-sm font-medium text-text dark:text-text-dark mb-2">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={shippingDetails.fullName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:text-text-dark"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text dark:text-text-dark mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={shippingDetails.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:text-text-dark"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text dark:text-text-dark mb-2">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={shippingDetails.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:text-text-dark"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text dark:text-text-dark mb-2">Street Address</label>
            <input
              type="text"
              name="streetAddress"
              value={shippingDetails.streetAddress}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:text-text-dark"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text dark:text-text-dark mb-2">City</label>
              <input
                type="text"
                name="city"
                value={shippingDetails.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:text-text-dark"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text dark:text-text-dark mb-2">State/Region</label>
              <input
                type="text"
                name="state"
                value={shippingDetails.state}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:text-text-dark"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text dark:text-text-dark mb-2">Postal Code</label>
            <input
              type="text"
              name="postalCode"
              value={shippingDetails.postalCode}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:text-text-dark"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text dark:text-text-dark mb-2">Country</label>
            <input
              type="text"
              name="country"
              value={shippingDetails.country}
              onChange={handleChange}
              required
              disabled
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary bg-gray-100 dark:bg-gray-700 dark:text-text-dark"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors duration-300"
          >
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;

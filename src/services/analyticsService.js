import { collection, addDoc, getDocs, query, where, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

class AnalyticsService {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.startTime = Date.now();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUser(userId) {
    this.userId = userId;
  }

  // Track user login
  async trackLogin(userId, loginMethod = 'email') {
    try {
      await addDoc(collection(db, 'analytics'), {
        type: 'login',
        userId,
        sessionId: this.sessionId,
        loginMethod,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: this.getPlatform()
      });

      // Update user's last login
      await updateDoc(doc(db, 'users', userId), {
        lastLogin: new Date().toISOString(),
        isActive: true
      });

      this.setUser(userId);
    } catch (error) {
      console.error('Error tracking login:', error);
    }
  }

  // Track user logout
  async trackLogout(userId) {
    try {
      const sessionDuration = Date.now() - this.startTime;
      
      await addDoc(collection(db, 'analytics'), {
        type: 'logout',
        userId,
        sessionId: this.sessionId,
        sessionDuration,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking logout:', error);
    }
  }

  // Track page views
  async trackPageView(userId, pagePath, pageTitle) {
    try {
      await addDoc(collection(db, 'analytics'), {
        type: 'page_view',
        userId,
        sessionId: this.sessionId,
        pagePath,
        pageTitle,
        timestamp: new Date().toISOString(),
        referrer: document.referrer
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  // Track product interactions
  async trackProductInteraction(userId, action, productId, productName, additionalData = {}) {
    try {
      await addDoc(collection(db, 'analytics'), {
        type: 'product_interaction',
        userId,
        sessionId: this.sessionId,
        action, // 'view', 'add_to_cart', 'remove_from_cart', 'purchase', 'wishlist_add', etc.
        productId,
        productName,
        timestamp: new Date().toISOString(),
        ...additionalData
      });
    } catch (error) {
      console.error('Error tracking product interaction:', error);
    }
  }

  // Track search queries
  async trackSearch(userId, searchQuery, resultsCount, filters = {}) {
    try {
      await addDoc(collection(db, 'analytics'), {
        type: 'search',
        userId,
        sessionId: this.sessionId,
        searchQuery,
        resultsCount,
        filters,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }

  // Track AI assistant interactions
  async trackAIInteraction(userId, userMessage, aiResponse, responseTime) {
    try {
      await addDoc(collection(db, 'analytics'), {
        type: 'ai_interaction',
        userId,
        sessionId: this.sessionId,
        userMessage,
        aiResponse: aiResponse.substring(0, 500), // Limit response length
        responseTime,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking AI interaction:', error);
    }
  }

  // Track errors
  async trackError(userId, errorType, errorMessage, stackTrace, context = {}) {
    try {
      await addDoc(collection(db, 'analytics'), {
        type: 'error',
        userId,
        sessionId: this.sessionId,
        errorType,
        errorMessage,
        stackTrace,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error tracking error:', error);
    }
  }

  // Get user activity analytics
  async getUserAnalytics(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, 'analytics'),
        where('userId', '==', userId),
        where('timestamp', '>=', startDate.toISOString()),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return this.processUserAnalytics(activities);
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      return null;
    }
  }

  // Get system-wide analytics
  async getSystemAnalytics(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, 'analytics'),
        where('timestamp', '>=', startDate.toISOString()),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return this.processSystemAnalytics(activities);
    } catch (error) {
      console.error('Error fetching system analytics:', error);
      return null;
    }
  }

  // Process user analytics data
  processUserAnalytics(activities) {
    const stats = {
      totalSessions: new Set(activities.map(a => a.sessionId)).size,
      totalPageViews: activities.filter(a => a.type === 'page_view').length,
      totalProductViews: activities.filter(a => a.type === 'product_interaction' && a.action === 'view').length,
      totalSearches: activities.filter(a => a.type === 'search').length,
      totalAIInteractions: activities.filter(a => a.type === 'ai_interaction').length,
      averageSessionDuration: 0,
      topPages: {},
      topProducts: {},
      searchQueries: [],
      dailyActivity: {}
    };

    // Calculate daily activity
    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toDateString();
      if (!stats.dailyActivity[date]) {
        stats.dailyActivity[date] = 0;
      }
      stats.dailyActivity[date]++;
    });

    // Top pages
    activities.filter(a => a.type === 'page_view').forEach(activity => {
      const page = activity.pagePath || 'Unknown';
      stats.topPages[page] = (stats.topPages[page] || 0) + 1;
    });

    // Top products
    activities.filter(a => a.type === 'product_interaction').forEach(activity => {
      const product = activity.productName || 'Unknown';
      stats.topProducts[product] = (stats.topProducts[product] || 0) + 1;
    });

    // Search queries
    stats.searchQueries = activities
      .filter(a => a.type === 'search')
      .map(a => a.searchQuery)
      .slice(0, 10);

    return stats;
  }

  // Process system analytics data
  processSystemAnalytics(activities) {
    const stats = {
      totalUsers: new Set(activities.map(a => a.userId).filter(Boolean)).size,
      totalSessions: new Set(activities.map(a => a.sessionId)).size,
      totalPageViews: activities.filter(a => a.type === 'page_view').length,
      totalLogins: activities.filter(a => a.type === 'login').length,
      totalProductInteractions: activities.filter(a => a.type === 'product_interaction').length,
      totalSearches: activities.filter(a => a.type === 'search').length,
      totalAIInteractions: activities.filter(a => a.type === 'ai_interaction').length,
      totalErrors: activities.filter(a => a.type === 'error').length,
      dailyStats: {},
      topPages: {},
      topProducts: {},
      topSearches: {},
      errorTypes: {},
      platformStats: {}
    };

    // Daily statistics
    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toDateString();
      if (!stats.dailyStats[date]) {
        stats.dailyStats[date] = {
          users: new Set(),
          sessions: new Set(),
          pageViews: 0,
          logins: 0,
          errors: 0
        };
      }

      if (activity.userId) stats.dailyStats[date].users.add(activity.userId);
      stats.dailyStats[date].sessions.add(activity.sessionId);
      
      if (activity.type === 'page_view') stats.dailyStats[date].pageViews++;
      if (activity.type === 'login') stats.dailyStats[date].logins++;
      if (activity.type === 'error') stats.dailyStats[date].errors++;
    });

    // Convert sets to counts
    Object.keys(stats.dailyStats).forEach(date => {
      stats.dailyStats[date].users = stats.dailyStats[date].users.size;
      stats.dailyStats[date].sessions = stats.dailyStats[date].sessions.size;
    });

    // Top pages
    activities.filter(a => a.type === 'page_view').forEach(activity => {
      const page = activity.pagePath || 'Unknown';
      stats.topPages[page] = (stats.topPages[page] || 0) + 1;
    });

    // Top products
    activities.filter(a => a.type === 'product_interaction').forEach(activity => {
      const product = activity.productName || 'Unknown';
      stats.topProducts[product] = (stats.topProducts[product] || 0) + 1;
    });

    // Top searches
    activities.filter(a => a.type === 'search').forEach(activity => {
      const query = activity.searchQuery || 'Unknown';
      stats.topSearches[query] = (stats.topSearches[query] || 0) + 1;
    });

    // Error types
    activities.filter(a => a.type === 'error').forEach(activity => {
      const errorType = activity.errorType || 'Unknown';
      stats.errorTypes[errorType] = (stats.errorTypes[errorType] || 0) + 1;
    });

    // Platform statistics
    activities.forEach(activity => {
      if (activity.platform) {
        stats.platformStats[activity.platform] = (stats.platformStats[activity.platform] || 0) + 1;
      }
    });

    return stats;
  }

  // Get platform information
  getPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mobile')) return 'mobile';
    if (userAgent.includes('tablet')) return 'tablet';
    return 'desktop';
  }

  // Track user registration
  async trackRegistration(userId, registrationMethod = 'email') {
    try {
      await addDoc(collection(db, 'analytics'), {
        type: 'registration',
        userId,
        sessionId: this.sessionId,
        registrationMethod,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: this.getPlatform()
      });
    } catch (error) {
      console.error('Error tracking registration:', error);
    }
  }

  // Get popular products
  async getPopularProducts(days = 30, limit = 10) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, 'analytics'),
        where('type', '==', 'product_interaction'),
        where('timestamp', '>=', startDate.toISOString()),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const interactions = snapshot.docs.map(doc => doc.data());

      const productCounts = {};
      interactions.forEach(interaction => {
        const productId = interaction.productId;
        if (!productCounts[productId]) {
          productCounts[productId] = {
            productId,
            productName: interaction.productName,
            views: 0,
            addToCarts: 0,
            purchases: 0
          };
        }

        switch (interaction.action) {
          case 'view':
            productCounts[productId].views++;
            break;
          case 'add_to_cart':
            productCounts[productId].addToCarts++;
            break;
          case 'purchase':
            productCounts[productId].purchases++;
            break;
        }
      });

      return Object.values(productCounts)
        .sort((a, b) => (b.views + b.addToCarts * 2 + b.purchases * 3) - (a.views + a.addToCarts * 2 + a.purchases * 3))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching popular products:', error);
      return [];
    }
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;
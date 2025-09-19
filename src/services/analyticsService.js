import { collection, addDoc, getDocs, query, where, orderBy, limit, Timestamp, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase/config';

class AnalyticsService {
  constructor() {
    this.currentUserId = null;
    this.sessionStart = Date.now();
  }

  setUser(userId) {
    this.currentUserId = userId;
  }

  // Track user registration
  async trackRegistration(userId, method = 'email') {
    try {
      await addDoc(collection(db, 'analytics'), {
        type: 'registration',
        userId,
        method,
        timestamp: Timestamp.now(),
        metadata: {
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          url: window.location.href
        }
      });
    } catch (error) {
      console.error('Error tracking registration:', error);
    }
  }

  // Track user login
  async trackLogin(userId, method = 'email') {
    try {
      await addDoc(collection(db, 'analytics'), {
        type: 'login',
        userId,
        method,
        timestamp: Timestamp.now(),
        metadata: {
          sessionDuration: Date.now() - this.sessionStart
        }
      });
    } catch (error) {
      console.error('Error tracking login:', error);
    }
  }

  // Track user logout
  async trackLogout(userId) {
    try {
      await addDoc(collection(db, 'analytics'), {
        type: 'logout',
        userId,
        timestamp: Timestamp.now(),
        metadata: {
          sessionDuration: Date.now() - this.sessionStart
        }
      });
      this.sessionStart = Date.now(); // Reset for next session
    } catch (error) {
      console.error('Error tracking logout:', error);
    }
  }

  // Track page views
  async trackPageView(userId, path, title) {
    try {
      await addDoc(collection(db, 'analytics'), {
        type: 'page_view',
        userId,
        path,
        title,
        timestamp: Timestamp.now(),
        metadata: {
          referrer: document.referrer
        }
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
        action, // 'view', 'add_to_cart', 'purchase', 'wishlist', etc.
        productId,
        productName,
        timestamp: Timestamp.now(),
        metadata: additionalData
      });
    } catch (error) {
      console.error('Error tracking product interaction:', error);
    }
  }

  // Track search queries
  async trackSearch(userId, query, resultsCount, filters = {}) {
    try {
      await addDoc(collection(db, 'analytics'), {
        type: 'search',
        userId,
        query,
        resultsCount,
        filters,
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }

  // Track AI interactions
  async trackAIInteraction(userId, userMessage, aiResponse, responseTime) {
    try {
      await addDoc(collection(db, 'analytics'), {
        type: 'ai_interaction',
        userId,
        userMessage,
        aiResponse,
        responseTime,
        timestamp: Timestamp.now()
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
        errorType,
        errorMessage,
        stackTrace,
        context,
        timestamp: Timestamp.now(),
        metadata: {
          url: window.location.href,
          userAgent: navigator.userAgent
        }
      });
    } catch (error) {
      console.error('Error tracking error:', error);
    }
  }

  // Get analytics data for dashboard
  async getAnalyticsData(timeRange = '30d') {
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Use aggregation to get the total count (cheap) and then fetch a bounded sample for charts
      let totalEvents = 0;
      try {
        const countSnap = await getCountFromServer(query(
          collection(db, 'analytics'),
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          where('timestamp', '<=', Timestamp.fromDate(endDate))
        ));
        totalEvents = countSnap.data().count || 0;
      } catch (err) {
        console.warn('getCountFromServer failed, will fall back to limited query', err);
      }

      // Fetch only a sample of events (limit to avoid large downloads). This keeps charts representative without full data transfer.
      const SAMPLE_LIMIT = 500;
      const analyticsQuery = query(
        collection(db, 'analytics'),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate)),
        orderBy('timestamp', 'desc'),
        limit(SAMPLE_LIMIT)
      );

      const snapshot = await getDocs(analyticsQuery);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      }));

      const processed = this.processAnalyticsData(events);
      // attach totalEvents (accurate if aggregation succeeded, otherwise approximate equals sampled length)
      processed.totalEvents = totalEvents || events.length;
      processed.sampled = events.length < (totalEvents || Infinity);
      return processed;
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      return this.getEmptyAnalyticsData();
    }
  }

  processAnalyticsData(events) {
    const data = {
      totalEvents: events.length,
      userActivity: {},
      productInteractions: {},
      searchQueries: [],
      aiInteractions: [],
      errors: [],
      dailyStats: {},
      topPages: {},
      conversionFunnel: {
        pageViews: 0,
        productViews: 0,
        cartAdditions: 0,
        purchases: 0
      }
    };

    events.forEach(event => {
      const date = event.timestamp.toISOString().split('T')[0];

      // Initialize daily stats
      if (!data.dailyStats[date]) {
        data.dailyStats[date] = {
          pageViews: 0,
          logins: 0,
          registrations: 0,
          productInteractions: 0
        };
      }

      // Process different event types
      switch (event.type) {
        case 'page_view':
          data.dailyStats[date].pageViews++;
          data.conversionFunnel.pageViews++;
          data.topPages[event.path] = (data.topPages[event.path] || 0) + 1;
          break;

        case 'login':
          data.dailyStats[date].logins++;
          break;

        case 'registration':
          data.dailyStats[date].registrations++;
          break;

        case 'product_interaction':
          data.dailyStats[date].productInteractions++;
          if (event.action === 'view') data.conversionFunnel.productViews++;
          if (event.action === 'add_to_cart') data.conversionFunnel.cartAdditions++;
          if (event.action === 'purchase') data.conversionFunnel.purchases++;
          break;

        case 'search':
          data.searchQueries.push(event);
          break;

        case 'ai_interaction':
          data.aiInteractions.push(event);
          break;

        case 'error':
          data.errors.push(event);
          break;

        default:
          // Handle any unrecognized event types
          console.warn('Unhandled event type:', event.type);
          break;
      }

      // Track user activity
      if (event.userId) {
        if (!data.userActivity[event.userId]) {
          data.userActivity[event.userId] = {
            events: 0,
            lastActivity: event.timestamp
          };
        }
        data.userActivity[event.userId].events++;
        if (event.timestamp > data.userActivity[event.userId].lastActivity) {
          data.userActivity[event.userId].lastActivity = event.timestamp;
        }
      }
    });

    return data;
  }

  getEmptyAnalyticsData() {
    return {
      totalEvents: 0,
      userActivity: {},
      productInteractions: {},
      searchQueries: [],
      aiInteractions: [],
      errors: [],
      dailyStats: {},
      topPages: {},
      conversionFunnel: {
        pageViews: 0,
        productViews: 0,
        cartAdditions: 0,
        purchases: 0
      }
    };
  }

  // Get real-time metrics
  async getRealTimeMetrics() {
    try {
      const lastHour = new Date();
      lastHour.setHours(lastHour.getHours() - 1);

      // Cap the real-time scan to avoid huge reads when the analytics collection is large
      const RECENT_LIMIT = 1000;
      const recentQuery = query(
        collection(db, 'analytics'),
        where('timestamp', '>=', Timestamp.fromDate(lastHour)),
        orderBy('timestamp', 'desc'),
        limit(RECENT_LIMIT)
      );

      const snapshot = await getDocs(recentQuery);
      const recentEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return {
        activeUsers: new Set(recentEvents.map(e => e.userId).filter(Boolean)).size,
        recentEvents: recentEvents.length,
        lastUpdated: new Date(),
        truncated: recentEvents.length >= RECENT_LIMIT
      };
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      return {
        activeUsers: 0,
        recentEvents: 0,
        lastUpdated: new Date()
      };
    }
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;
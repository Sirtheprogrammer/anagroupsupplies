import { createContext, useContext, useState, useEffect } from 'react';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import analyticsService from '../services/analyticsService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  // Check if user is admin
  const checkAdminStatus = async (uid) => {
    try {
      const adminDoc = await getDoc(doc(db, 'admins', uid));
      return adminDoc.exists();
    } catch (error) {
      console.error('Error checking admin status:', error);
      await analyticsService.trackError(uid, 'admin_check', error.message, error.stack);
      return false;
    }
  };

  // Get or create user profile
  const getOrCreateUserProfile = async (firebaseUser) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let userData;
      let isNewUser = false;

      if (userDoc.exists()) {
        userData = userDoc.data();
      } else {
        isNewUser = true;
        userData = {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          isActive: true,
          role: 'user',
          preferences: {
            theme: 'light',
            notifications: true,
            marketing: false
          }
        };
        
        await setDoc(userDocRef, userData);
        
        // Track registration for new users
        await analyticsService.trackRegistration(
          firebaseUser.uid,
          firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email'
        );
      }

      // Update last login
      if (!isNewUser) {
        await setDoc(userDocRef, {
          lastLogin: new Date().toISOString(),
          isActive: true
        }, { merge: true });
      }

      return userData;
    } catch (error) {
      console.error('Error managing user profile:', error);
      await analyticsService.trackError(
        firebaseUser.uid,
        'user_profile_management',
        error.message,
        error.stack
      );
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Get or create user profile
      const userData = await getOrCreateUserProfile(result.user);
      
      // Check if user is admin
      const isAdmin = await checkAdminStatus(result.user.uid);
      
      // Enhanced user object
      const enhancedUser = {
        ...result.user,
        ...userData,
        isAdmin
      };

      setUser(enhancedUser);
      setUserProfile(userData);

      // Set user in analytics service and track login
      analyticsService.setUser(result.user.uid);
      await analyticsService.trackLogin(result.user.uid, 'google');

      return result;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      await analyticsService.trackError(null, 'google_signin', error.message, error.stack);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      if (user) {
        await analyticsService.trackLogout(user.uid);
      }
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      analyticsService.setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      await analyticsService.trackError(user?.uid, 'logout', error.message, error.stack);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user profile
          const userData = await getOrCreateUserProfile(firebaseUser);
          
          // Check if user is admin
          const isAdmin = await checkAdminStatus(firebaseUser.uid);
          
          // Enhanced user object
          const enhancedUser = {
            ...firebaseUser,
            ...userData,
            isAdmin
          };

          setUser(enhancedUser);
          setUserProfile(userData);

          // Set user in analytics service
          analyticsService.setUser(firebaseUser.uid);

          // Track login only if not initial load
          if (!loading) {
            await analyticsService.trackLogin(
              firebaseUser.uid,
              firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email'
            );
          }
        } catch (error) {
          console.error('Error setting up user:', error);
          // Fallback to basic user object
          setUser({
            ...firebaseUser,
            isAdmin: false
          });
        }
      } else {
        // User logged out
        if (user && !loading) {
          await analyticsService.trackLogout(user.uid);
        }
        setUser(null);
        setUserProfile(null);
        analyticsService.setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth, loading, user]);

  // Track page views
  useEffect(() => {
    if (user && !loading) {
      const trackPageView = () => {
        analyticsService.trackPageView(
          user.uid,
          window.location.pathname,
          document.title
        );
      };

      // Track initial page view
      trackPageView();

      // Track navigation changes
      const handleLocationChange = () => {
        setTimeout(trackPageView, 100);
      };

      window.addEventListener('popstate', handleLocationChange);
      
      // Override history methods for SPA navigation tracking
      const originalPushState = window.history.pushState;
      const originalReplaceState = window.history.replaceState;

      window.history.pushState = function(...args) {
        originalPushState.apply(window.history, args);
        handleLocationChange();
      };

      window.history.replaceState = function(...args) {
        originalReplaceState.apply(window.history, args);
        handleLocationChange();
      };

      return () => {
        window.removeEventListener('popstate', handleLocationChange);
        window.history.pushState = originalPushState;
        window.history.replaceState = originalReplaceState;
      };
    }
  }, [user, loading]);

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await setDoc(userDocRef, updatedData, { merge: true });
      
      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);
      setUserProfile({ ...userProfile, ...updatedData });

      return updatedUser;
    } catch (error) {
      console.error('Error updating user profile:', error);
      await analyticsService.trackError(
        user.uid,
        'profile_update',
        error.message,
        error.stack,
        { updates }
      );
      throw error;
    }
  };

  // Analytics tracking methods
  const trackProductInteraction = async (action, productId, productName, additionalData = {}) => {
    if (user) {
      await analyticsService.trackProductInteraction(
        user.uid,
        action,
        productId,
        productName,
        additionalData
      );
    }
  };

  const trackSearch = async (searchQuery, resultsCount, filters = {}) => {
    if (user) {
      await analyticsService.trackSearch(user.uid, searchQuery, resultsCount, filters);
    }
  };

  const trackAIInteraction = async (userMessage, aiResponse, responseTime) => {
    if (user) {
      await analyticsService.trackAIInteraction(user.uid, userMessage, aiResponse, responseTime);
    }
  };

  const trackError = async (errorType, errorMessage, stackTrace, context = {}) => {
    await analyticsService.trackError(
      user?.uid,
      errorType,
      errorMessage,
      stackTrace,
      context
    );
  };

  const value = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    logout,
    updateUserProfile,
    trackProductInteraction,
    trackSearch,
    trackAIInteraction,
    trackError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 
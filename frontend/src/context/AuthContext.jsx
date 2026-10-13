import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, isRealApiKey } from '../config/firebase';
import {
  loginUser,
  registerUser,
  logoutUser,
  resetPassword,
  getUserProfile
} from '../services/authService';
import { authApi } from '../api/apiClient';
import { normalizeRole, getPortalForRole } from '../utils/roleUtils';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  // UI Modal State for customer quick authentication
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register' | 'forgot'

  // Restore authenticated session from localStorage on initial load
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const storedToken = localStorage.getItem('fabricare_token') || sessionStorage.getItem('fabricare_token');
        const storedUser = localStorage.getItem('fabricare_user') || sessionStorage.getItem('fabricare_user');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (isMounted) {
            setCurrentUser(parsedUser);
            setUserProfile(parsedUser);
          }

          // Verify token validity against backend API
          try {
            const meRes = await authApi.getMe();
            if (meRes?.data && isMounted) {
              const liveUser = meRes.data;
              const normalized = normalizeRole(liveUser.role);
              const updatedProfile = {
                uid: String(liveUser.id),
                id: liveUser.id,
                email: liveUser.email,
                displayName: liveUser.full_name || liveUser.username || parsedUser.displayName,
                username: liveUser.username,
                phoneNumber: liveUser.phone || '',
                role: normalized,
                rawRole: liveUser.role,
                isStaff: liveUser.is_staff || false,
                avatar: (liveUser.full_name || liveUser.username || 'CU').substring(0, 2).toUpperCase(),
                provider: 'backend'
              };
              setCurrentUser(updatedProfile);
              setUserProfile(updatedProfile);
              localStorage.setItem('fabricare_user', JSON.stringify(updatedProfile));
            }
          } catch (err) {
            // If token is invalid (401), clear invalid session
            if (err?.response?.status === 401) {
              console.warn('Stored token is expired or invalid, clearing session.');
              localStorage.removeItem('fabricare_token');
              localStorage.removeItem('fabricare_user');
              sessionStorage.removeItem('fabricare_token');
              sessionStorage.removeItem('fabricare_user');
              if (isMounted) {
                setCurrentUser(null);
                setUserProfile(null);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Error restoring session from storage:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    // Firebase Auth listener (active only when a valid real Firebase key is provided)
    let unsubscribeFirebase = () => {};
    if (isRealApiKey && auth) {
      try {
        unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const profile = await getUserProfile(firebaseUser.uid);
              const normalized = normalizeRole(profile?.role || 'customer');
              const fullProfile = {
                uid: firebaseUser.uid,
                id: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: profile?.displayName || firebaseUser.displayName || 'Customer',
                phoneNumber: profile?.phoneNumber || firebaseUser.phoneNumber || '',
                role: normalized,
                rawRole: profile?.role || 'customer',
                avatar: (profile?.displayName || firebaseUser.displayName || 'CU').substring(0, 2).toUpperCase(),
                provider: 'firebase'
              };
              if (isMounted) {
                setCurrentUser(fullProfile);
                setUserProfile(fullProfile);
                localStorage.setItem('fabricare_user', JSON.stringify(fullProfile));
              }
            } catch (err) {
              console.warn('Failed to load Firestore profile:', err);
            }
          }
        });
      } catch (fbErr) {
        console.warn('Firebase onAuthStateChanged not active:', fbErr.message);
      }
    }

    return () => {
      isMounted = false;
      unsubscribeFirebase();
    };
  }, []);

  const clearError = () => setAuthError(null);

  /**
   * Unified real authentication supporting backend API and Firebase
   */
  const login = async (emailOrUsername, password, rememberMe = true) => {
    setLoading(true);
    setAuthError(null);
    const identifier = (emailOrUsername || '').trim();
    const storage = rememberMe ? localStorage : sessionStorage;

    let backendSuccess = false;
    let authResult = null;

    // 1. Attempt Backend API Login first (authenticates real PostgreSQL/SQLite DB records)
    try {
      const res = await authApi.login(identifier, password);
      if (res?.data && res.data.tokens) {
        const { user, tokens } = res.data;
        const normalized = normalizeRole(user.role);

        // Store active JWT access token for all portal apiClient requests
        storage.setItem('fabricare_token', tokens.access);
        if (tokens.refresh) {
          storage.setItem('fabricare_refresh_token', tokens.refresh);
        }

        const profileData = {
          uid: String(user.id),
          id: user.id,
          email: user.email,
          displayName: user.full_name || user.username,
          username: user.username,
          phoneNumber: user.phone || '',
          role: normalized,
          rawRole: user.role,
          isStaff: user.is_staff || false,
          avatar: (user.full_name || user.username || 'CU').substring(0, 2).toUpperCase(),
          provider: 'backend'
        };

        storage.setItem('fabricare_user', JSON.stringify(profileData));
        setCurrentUser(profileData);
        setUserProfile(profileData);
        setIsAuthModalOpen(false);
        backendSuccess = true;
        authResult = {
          user: profileData,
          profile: profileData,
          role: normalized,
          portal: getPortalForRole(normalized)
        };
        return authResult;
      }
    } catch (backendErr) {
      console.warn('Backend login attempt notice:', backendErr.message || backendErr);
      // If backend returned explicit 401/400 credentials error or disabled
      const isBadCredentials = backendErr?.response?.status === 401 || backendErr?.response?.status === 400;
      const isForbidden = backendErr?.response?.status === 403;

      // 2. If backend was unreachable or if user used email, attempt Firebase as fallback
      if (identifier.includes('@') && !isForbidden && isRealApiKey && auth) {
        try {
          const { user: fbUser, profile: fbProfile } = await loginUser(identifier, password);
          const normalized = normalizeRole(fbProfile?.role || 'customer');
          const profileData = {
            uid: fbUser.uid,
            id: fbUser.uid,
            email: fbUser.email,
            displayName: fbProfile?.displayName || fbUser.displayName || 'Customer',
            phoneNumber: fbProfile?.phoneNumber || '',
            role: normalized,
            rawRole: fbProfile?.role || 'customer',
            avatar: (fbProfile?.displayName || fbUser.displayName || 'CU').substring(0, 2).toUpperCase(),
            provider: 'firebase'
          };

          storage.setItem('fabricare_user', JSON.stringify(profileData));
          setCurrentUser(profileData);
          setUserProfile(profileData);
          setIsAuthModalOpen(false);
          return {
            user: profileData,
            profile: profileData,
            role: normalized,
            portal: getPortalForRole(normalized)
          };
        } catch (fbErr) {
          console.warn('Firebase login attempt notice:', fbErr.message);
        }
      }

      const errMsg = backendErr?.response?.data?.detail || 
                     backendErr?.response?.data?.error || 
                     (isBadCredentials ? 'Invalid email/username or password. Please check your credentials and try again.' : null) ||
                     (backendErr.message === 'Failed to fetch' ? 'Unable to connect to backend server. Please make sure the backend is running at http://127.0.0.1:8000.' : backendErr.message) || 
                     'Unable to sign in. Please verify your credentials and network connection.';

      setAuthError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Google Sign-In via Firebase (if configured in environment)
   */
  const loginWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    if (!isRealApiKey || !auth) {
      const msg = 'Google Sign-In is unavailable until a valid Firebase API Key is configured in .env.';
      setAuthError(msg);
      setLoading(false);
      throw new Error(msg);
    }
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const profile = await getUserProfile(user.uid);
      const normalized = normalizeRole(profile?.role || 'customer');
      const profileData = {
        uid: user.uid,
        id: user.uid,
        email: user.email,
        displayName: profile?.displayName || user.displayName || 'Customer',
        phoneNumber: profile?.phoneNumber || user.phoneNumber || '',
        role: normalized,
        rawRole: profile?.role || 'customer',
        avatar: (user.displayName || 'CU').substring(0, 2).toUpperCase(),
        provider: 'firebase_google'
      };

      localStorage.setItem('fabricare_user', JSON.stringify(profileData));
      setCurrentUser(profileData);
      setUserProfile(profileData);
      return {
        user: profileData,
        profile: profileData,
        role: normalized,
        portal: getPortalForRole(normalized)
      };
    } catch (err) {
      console.warn('Google sign-in error:', err);
      const msg = err.code === 'auth/popup-closed-by-user' 
        ? 'Google sign-in window was closed.'
        : 'Google sign-in is not configured or failed. Please use email/username and password.';
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setAuthError(null);
    try {
      // 1. Try Backend API registration
      try {
        const username = userData.username || userData.email.split('@')[0];
        const res = await authApi.register({
          username,
          email: userData.email,
          password: userData.password,
          first_name: userData.fullName ? userData.fullName.split(' ')[0] : '',
          last_name: userData.fullName ? userData.fullName.split(' ').slice(1).join(' ') : '',
          phone: userData.phone || ''
        });

        if (res?.data && res.data.tokens) {
          const { user, tokens } = res.data;
          const normalized = normalizeRole(user.role);
          localStorage.setItem('fabricare_token', tokens.access);
          if (tokens.refresh) localStorage.setItem('fabricare_refresh_token', tokens.refresh);

          const profileData = {
            uid: String(user.id),
            id: user.id,
            email: user.email,
            displayName: user.full_name || user.username,
            username: user.username,
            phoneNumber: user.phone || '',
            role: normalized,
            rawRole: user.role,
            avatar: (user.full_name || user.username || 'CU').substring(0, 2).toUpperCase(),
            provider: 'backend'
          };
          localStorage.setItem('fabricare_user', JSON.stringify(profileData));
          setCurrentUser(profileData);
          setUserProfile(profileData);
          setIsAuthModalOpen(false);
          return { user: profileData, profile: profileData, role: normalized };
        }
      } catch (backendErr) {
        console.warn('Backend register failed, trying Firebase:', backendErr.message);
      }

      // 2. Fallback to Firebase Registration (if valid Firebase configuration is active)
      if (isRealApiKey && auth) {
        const { user, profile } = await registerUser(userData);
        const normalized = normalizeRole(profile.role);
        const profileData = {
          uid: user.uid,
          id: user.uid,
          email: user.email,
          displayName: profile.displayName,
          phoneNumber: profile.phoneNumber || '',
          role: normalized,
          rawRole: profile.role,
          avatar: profile.avatar || 'CU',
          provider: 'firebase'
        };
        localStorage.setItem('fabricare_user', JSON.stringify(profileData));
        setCurrentUser(profileData);
        setUserProfile(profileData);
        setIsAuthModalOpen(false);
        return { user: profileData, profile: profileData, role: normalized };
      }

      throw new Error('Registration failed. Unable to connect to the backend server.');
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      // Clear all stored tokens and sessions
      localStorage.removeItem('fabricare_token');
      localStorage.removeItem('fabricare_refresh_token');
      localStorage.removeItem('fabricare_user');
      sessionStorage.removeItem('fabricare_token');
      sessionStorage.removeItem('fabricare_refresh_token');
      sessionStorage.removeItem('fabricare_user');

      // Firebase signOut attempt
      if (isRealApiKey && auth) {
        try {
          await logoutUser();
        } catch (fbErr) {
          // Ignored if not firebase
        }
      }

      setCurrentUser(null);
      setUserProfile(null);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email) => {
    setLoading(true);
    setAuthError(null);
    try {
      await resetPassword(email);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthError(null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthError(null);
  };

  const rawRole = userProfile?.role || currentUser?.role || 'customer';
  const userRole = normalizeRole(rawRole);
  const isAdmin = userRole === 'admin';
  const isDeliveryAgent = userRole === 'delivery_agent';
  const isLaundryStaff = userRole === 'laundry_staff';
  const isCustomer = userRole === 'customer';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        userRole,
        rawRole,
        isAdmin,
        isDeliveryAgent,
        isLaundryStaff,
        isCustomer,
        isAuthenticated: !!currentUser,
        loading,
        authError,
        clearError,
        login,
        loginWithGoogle,
        register,
        logout,
        sendPasswordReset,
        isAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


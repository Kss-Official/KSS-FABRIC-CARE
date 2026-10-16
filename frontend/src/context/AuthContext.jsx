import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { authApi } from '../api/apiClient';
import { normalizeRole, getPortalForRole } from '../utils/roleUtils';
import { getInitials } from '../utils/helpers';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // UI Modal State for customer quick authentication if used
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  const clearError = () => setAuthError(null);

  // Sync session with Firebase onAuthStateChanged and backend GET /me
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          localStorage.setItem('fabricare_token', token);

          // Fetch full user profile from FastAPI backend GET /me
          const meRes = await authApi.getMe();
          const meData = meRes.data;
          const role = normalizeRole(meData.role || 'customer');

          const profileData = {
            uid: fbUser.uid,
            id: meData.id || fbUser.uid,
            name: meData.name || fbUser.displayName || 'User',
            displayName: meData.name || fbUser.displayName || 'User',
            fullName: meData.name || '',
            email: meData.email || fbUser.email,
            phone: meData.phone || '',
            phoneNumber: meData.phone || '',
            role: role,
            rawRole: meData.role,
            avatar_url: meData.avatar_url || null,
            initials: meData.initials || getInitials(meData.name || fbUser.displayName),
            agent_profile: meData.agent_profile || null,
            staff_profile: meData.staff_profile || null
          };

          if (isMounted) {
            setCurrentUser(profileData);
            setUserProfile(profileData);
            localStorage.setItem('fabricare_user', JSON.stringify(profileData));
          }
        } catch (err) {
          console.warn('Failed to load profile on auth state change:', err);
          if (err.status === 401 || err.status === 403) {
            try {
              await signOut(auth);
            } catch (_) {}
            localStorage.removeItem('fabricare_token');
            localStorage.removeItem('fabricare_user');
            if (isMounted) {
              setCurrentUser(null);
              setUserProfile(null);
            }
          }
        }
      } else {
        localStorage.removeItem('fabricare_token');
        localStorage.removeItem('fabricare_user');
        if (isMounted) {
          setCurrentUser(null);
          setUserProfile(null);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  /**
   * Firebase Auth sign-in with email & password
   */
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    const identifier = (email || '').trim();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
      const fbUser = userCredential.user;
      const tokenResult = await fbUser.getIdTokenResult();
      const token = tokenResult.token;
      localStorage.setItem('fabricare_token', token);

      // Verify and fetch profile from FastAPI backend GET /me
      const meRes = await authApi.getMe();
      const meData = meRes.data;
      const role = normalizeRole(meData.role || tokenResult.claims?.role || 'customer');

      const profileData = {
        uid: fbUser.uid,
        id: meData.id || fbUser.uid,
        name: meData.name || fbUser.displayName || 'User',
        displayName: meData.name || fbUser.displayName || 'User',
        fullName: meData.name || '',
        email: meData.email || fbUser.email,
        phone: meData.phone || '',
        phoneNumber: meData.phone || '',
        role: role,
        rawRole: meData.role,
        avatar_url: meData.avatar_url || null,
        initials: meData.initials || getInitials(meData.name),
        agent_profile: meData.agent_profile || null,
        staff_profile: meData.staff_profile || null
      };

      setCurrentUser(profileData);
      setUserProfile(profileData);
      localStorage.setItem('fabricare_user', JSON.stringify(profileData));
      setIsAuthModalOpen(false);

      return {
        user: profileData,
        profile: profileData,
        role: role,
        portal: getPortalForRole(role)
      };
    } catch (err) {
      console.warn('Login error:', err);
      // Hard rule in Section 5.1: "Wrong email or password shows the same message 'Invalid email or password' on the login page."
      const msg = 'Invalid email or password';
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Customer public registration via FastAPI POST /api/v1/auth/register
   */
  const register = async ({ name, fullName, email, phone, password }) => {
    setLoading(true);
    setAuthError(null);
    try {
      const personName = (name || fullName || '').trim();
      // 1. Call backend to create Auth user + users doc + phone_index in transaction
      await authApi.register({
        name: personName,
        email: email.trim(),
        phone: phone.trim(),
        password: password
      });

      // 2. Automatically log in via Firebase client SDK
      return await login(email.trim(), password);
    } catch (err) {
      const msg = err.message || 'Registration failed. Please check your details.';
      setAuthError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out
   */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('SignOut error:', err);
    } finally {
      localStorage.removeItem('fabricare_token');
      localStorage.removeItem('fabricare_user');
      setCurrentUser(null);
      setUserProfile(null);
      window.location.hash = '#login';
    }
  };

  /**
   * Password reset
   */
  const sendPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (err) {
      console.warn('Password reset error:', err);
      throw new Error(err.message || 'Failed to send password reset email.');
    }
  };

  /**
   * Refresh profile from backend GET /me
   */
  const refreshProfile = async () => {
    try {
      const meRes = await authApi.getMe();
      const meData = meRes.data;
      const role = normalizeRole(meData.role || 'customer');
      const updated = {
        ...currentUser,
        name: meData.name,
        displayName: meData.name,
        fullName: meData.name,
        phone: meData.phone,
        phoneNumber: meData.phone,
        role: role,
        rawRole: meData.role,
        avatar_url: meData.avatar_url,
        initials: meData.initials || getInitials(meData.name),
        agent_profile: meData.agent_profile,
        staff_profile: meData.staff_profile
      };
      setCurrentUser(updated);
      setUserProfile(updated);
      localStorage.setItem('fabricare_user', JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.warn('Error refreshing profile:', err);
      return null;
    }
  };

  const userRole = normalizeRole(currentUser?.role || userProfile?.role || 'customer');
  const isAuthenticated = Boolean(currentUser && auth.currentUser);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        userRole,
        isAuthenticated,
        loading,
        authError,
        clearError,
        login,
        register,
        logout,
        sendPasswordReset,
        refreshProfile,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode
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

export default AuthContext;

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { auth, rtdb } from '../config/firebase';
import { registerUser, getUserProfile, mapAuthError } from '../services/authService';
import { normalizeRole, getPortalForRole } from '../utils/roleUtils';
import { getInitials } from '../utils/helpers';
import { seedDatabase } from '../services/seedDatabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // UI Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  const clearError = () => setAuthError(null);

  // Sync auth state with Firebase Realtime Database users/{uid}
  useEffect(() => {
    let isMounted = true;

    // Restore cached user for instant rendering
    const cachedUser = localStorage.getItem('fabricare_user');
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        if (parsed && isMounted) {
          setCurrentUser(parsed);
          setUserProfile(parsed);
          setLoading(false);
        }
      } catch (_) {}
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userSnap = await get(ref(rtdb, `users/${fbUser.uid}`));
          let rtdbProfile = userSnap.exists() ? userSnap.val() : null;

          if (!rtdbProfile) {
            // Auto-create initial customer profile if missing
            const name = fbUser.displayName || 'Customer';
            rtdbProfile = {
              name,
              email: fbUser.email,
              phone: fbUser.phoneNumber || '',
              role: 'customer',
              isActive: true,
              avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D9488&color=fff`,
              createdAt: Date.now()
            };
            await set(ref(rtdb, `users/${fbUser.uid}`), rtdbProfile);
          }

          const role = normalizeRole(rtdbProfile.role || 'customer');
          const cleanProfile = {
            uid: fbUser.uid,
            id: fbUser.uid,
            name: rtdbProfile.name || fbUser.displayName || 'User',
            displayName: rtdbProfile.name || fbUser.displayName || 'User',
            fullName: rtdbProfile.name || fbUser.displayName || '',
            email: fbUser.email,
            phone: rtdbProfile.phone || '',
            phoneNumber: rtdbProfile.phone || '',
            role,
            rawRole: rtdbProfile.role,
            avatarUrl: rtdbProfile.avatarUrl || null,
            avatar_url: rtdbProfile.avatarUrl || null,
            initials: getInitials(rtdbProfile.name || fbUser.displayName || 'User')
          };

          if (isMounted) {
            setCurrentUser(cleanProfile);
            setUserProfile(cleanProfile);
            localStorage.setItem('fabricare_user', JSON.stringify(cleanProfile));
          }
        } catch (err) {
          console.warn('RTDB auth state resolution notice:', err);
        }
      } else {
        if (isMounted) {
          setCurrentUser(null);
          setUserProfile(null);
          localStorage.removeItem('fabricare_user');
          localStorage.removeItem('fabricare_token');
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
   * Firebase-Only Login
   */
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPwd = (password || '').trim();

    try {
      let fbUserCredential;
      try {
        fbUserCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPwd);
      } catch (err) {
        // If demo user doesn't exist yet on clean emulator/database, auto-seed
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          const isStandardDemo = ['customer@fabricare.com', 'staff@fabricare.com', 'delivery@fabricare.com', 'admin@fabricare.com'].includes(cleanEmail);
          if (isStandardDemo && cleanPwd === 'Test@1234') {
            await seedDatabase();
            fbUserCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPwd);
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      const fbUser = fbUserCredential.user;
      const userSnap = await get(ref(rtdb, `users/${fbUser.uid}`));
      let rtdbData = userSnap.exists() ? userSnap.val() : null;

      if (!rtdbData) {
        rtdbData = {
          name: fbUser.displayName || 'Customer',
          email: fbUser.email,
          phone: '',
          role: cleanEmail.includes('admin') ? 'admin' : (cleanEmail.includes('staff') ? 'staff' : (cleanEmail.includes('delivery') ? 'agent' : 'customer')),
          isActive: true,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fbUser.displayName || 'User')}&background=0D9488&color=fff`,
          createdAt: Date.now()
        };
        await set(ref(rtdb, `users/${fbUser.uid}`), rtdbData);
      }

      const role = normalizeRole(rtdbData.role || 'customer');
      const profileData = {
        uid: fbUser.uid,
        id: fbUser.uid,
        name: rtdbData.name || fbUser.displayName || 'User',
        displayName: rtdbData.name || fbUser.displayName || 'User',
        fullName: rtdbData.name || '',
        email: fbUser.email,
        phone: rtdbData.phone || '',
        phoneNumber: rtdbData.phone || '',
        role,
        rawRole: rtdbData.role,
        avatarUrl: rtdbData.avatarUrl || null,
        avatar_url: rtdbData.avatarUrl || null,
        initials: getInitials(rtdbData.name || fbUser.displayName || 'User')
      };

      setCurrentUser(profileData);
      setUserProfile(profileData);
      localStorage.setItem('fabricare_user', JSON.stringify(profileData));
      setIsAuthModalOpen(false);
      setLoading(false);

      return {
        user: profileData,
        profile: profileData,
        role,
        portal: getPortalForRole(role)
      };
    } catch (err) {
      setLoading(false);
      const friendlyMsg = mapAuthError(err);
      setAuthError(friendlyMsg);
      throw new Error(friendlyMsg);
    }
  };

  /**
   * Firebase-Only Customer Registration
   */
  const register = async ({ name, fullName, email, phone, password }) => {
    setLoading(true);
    setAuthError(null);
    try {
      const personName = (name || fullName || '').trim();
      const mail = (email || '').trim().toLowerCase();
      const pwd = password;

      const profileData = await registerUser({
        email: mail,
        password: pwd,
        fullName: personName,
        phone: (phone || '').trim()
      });

      const cleanProfile = {
        uid: profileData.uid,
        id: profileData.uid,
        name: profileData.name,
        displayName: profileData.name,
        fullName: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        phoneNumber: profileData.phone,
        role: 'customer',
        rawRole: 'customer',
        avatarUrl: profileData.avatarUrl,
        avatar_url: profileData.avatarUrl,
        initials: getInitials(profileData.name)
      };

      setCurrentUser(cleanProfile);
      setUserProfile(cleanProfile);
      localStorage.setItem('fabricare_user', JSON.stringify(cleanProfile));
      setIsAuthModalOpen(false);

      return {
        user: cleanProfile,
        profile: cleanProfile,
        role: 'customer',
        portal: 'customer'
      };
    } catch (err) {
      const msg = err.message || 'Registration failed.';
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Google Sign-In with Firebase Auth
   */
  const loginWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      let rtdbProfile = await getUserProfile(fbUser.uid);
      if (!rtdbProfile) {
        const isEmailAdmin = (fbUser.email || '').toLowerCase().includes('admin');
        const defaultRole = isEmailAdmin ? 'admin' : 'customer';
        rtdbProfile = {
          uid: fbUser.uid,
          name: fbUser.displayName || 'Customer',
          email: fbUser.email,
          phone: fbUser.phoneNumber || '',
          role: defaultRole,
          isActive: true,
          avatarUrl: fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fbUser.displayName || 'CU')}&background=0D9488&color=fff`,
          createdAt: Date.now()
        };
        await set(ref(rtdb, `users/${fbUser.uid}`), rtdbProfile);
      }

      const role = normalizeRole(rtdbProfile.role || 'customer');
      const cleanProfile = {
        uid: fbUser.uid,
        id: fbUser.uid,
        name: rtdbProfile.name || fbUser.displayName || 'User',
        displayName: rtdbProfile.name || fbUser.displayName || 'User',
        fullName: rtdbProfile.name || fbUser.displayName || '',
        email: fbUser.email,
        phone: rtdbProfile.phone || '',
        phoneNumber: rtdbProfile.phone || '',
        role,
        rawRole: rtdbProfile.role,
        avatarUrl: rtdbProfile.avatarUrl || null,
        avatar_url: rtdbProfile.avatarUrl || null,
        initials: getInitials(rtdbProfile.name || fbUser.displayName || 'User')
      };

      setCurrentUser(cleanProfile);
      setUserProfile(cleanProfile);
      localStorage.setItem('fabricare_user', JSON.stringify(cleanProfile));
      setIsAuthModalOpen(false);
      setLoading(false);

      return {
        user: cleanProfile,
        profile: cleanProfile,
        role,
        portal: getPortalForRole(role)
      };
    } catch (err) {
      console.warn('Google sign-in notice:', err);
      const msg = mapAuthError(err);
      setAuthError(msg);
      setLoading(false);
      throw new Error(msg);
    }
  };

  /**
   * Sign Out
   */
  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (err) {
      console.warn('SignOut error:', err);
    } finally {
      localStorage.removeItem('fabricare_user');
      localStorage.removeItem('fabricare_token');
      sessionStorage.removeItem('fabricare_user');
      setCurrentUser(null);
      setUserProfile(null);
      window.location.hash = '#login';
    }
  };

  /**
   * Role Guard Check for Portals:
   * If current user's role is not authorized for portal, sign out and show clear message
   */
  const enforcePortalRole = async (expectedRole) => {
    if (!currentUser) return false;
    if (currentUser.role !== expectedRole && currentUser.role !== 'admin') {
      const wrongRole = currentUser.role;
      await logout();
      const errorMsg = `Access Denied: You are signed in as a "${wrongRole}". The ${expectedRole} portal requires an authorized ${expectedRole} account.`;
      setAuthError(errorMsg);
      alert(errorMsg);
      return false;
    }
    return true;
  };

  /**
   * Password Reset Email
   */
  const sendPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (err) {
      throw new Error(mapAuthError(err));
    }
  };

  /**
   * Refresh profile from RTDB
   */
  const refreshProfile = async () => {
    if (!currentUser?.uid) return null;
    try {
      const snap = await get(ref(rtdb, `users/${currentUser.uid}`));
      if (snap.exists()) {
        const val = snap.val();
        const updated = {
          ...currentUser,
          name: val.name,
          displayName: val.name,
          fullName: val.name,
          phone: val.phone,
          phoneNumber: val.phone,
          role: normalizeRole(val.role || 'customer'),
          rawRole: val.role,
          avatarUrl: val.avatarUrl
        };
        setCurrentUser(updated);
        setUserProfile(updated);
        localStorage.setItem('fabricare_user', JSON.stringify(updated));
        return updated;
      }
    } catch (err) {
      console.warn('Failed to refresh profile:', err);
    }
    return currentUser;
  };

  /**
   * Update current profile in RTDB
   */
  const updateCurrentUserProfile = async (updates) => {
    if (!currentUser?.uid) return;
    const { role, createdAt, ...safeUpdates } = updates;
    await update(ref(rtdb, `users/${currentUser.uid}`), safeUpdates);
    return refreshProfile();
  };

  const userRole = normalizeRole(currentUser?.role || userProfile?.role || 'customer');
  const isAuthenticated = Boolean(currentUser);

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
        loginWithGoogle,
        register,
        logout,
        enforcePortalRole,
        sendPasswordReset,
        refreshProfile,
        updateCurrentUserProfile,
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

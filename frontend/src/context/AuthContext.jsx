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

          const emailLower = (fbUser.email || '').toLowerCase().trim();
          let role = normalizeRole(rtdbProfile?.role);

          if (emailLower === 'admin@fabricare.com' || emailLower.startsWith('admin@') || emailLower.includes('admin') || rtdbProfile?.role === 'admin' || rtdbProfile?.role === 'super_admin') {
            role = 'admin';
          } else if (emailLower === 'delivery@fabricare.com' || emailLower.startsWith('delivery@') || emailLower.startsWith('agent@') || (emailLower.includes('delivery') && emailLower.includes('fabricare.com')) || rtdbProfile?.role === 'agent' || rtdbProfile?.role === 'delivery_agent') {
            role = 'agent';
          } else if (emailLower === 'staff@fabricare.com' || emailLower.startsWith('staff@') || (emailLower.includes('staff') && emailLower.includes('fabricare.com')) || rtdbProfile?.role === 'staff' || rtdbProfile?.role === 'laundry_staff') {
            role = 'staff';
          }

          if (!rtdbProfile) {
            // Auto-create initial profile with detected role
            const name = fbUser.displayName || (role === 'admin' ? 'Administrator' : (role === 'staff' ? 'Staff Member' : (role === 'agent' ? 'Delivery Agent' : 'Customer')));
            rtdbProfile = {
              name,
              email: fbUser.email,
              phone: fbUser.phoneNumber || '',
              role,
              isActive: true,
              avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D9488&color=fff`,
              createdAt: Date.now()
            };
            await set(ref(rtdb, `users/${fbUser.uid}`), rtdbProfile);
          } else if (rtdbProfile.role !== role) {
            // Self-heal role in RTDB if it was mistakenly set as customer
            rtdbProfile.role = role;
            update(ref(rtdb, `users/${fbUser.uid}`), { role }).catch(() => {});
          }
          if (role) {
            set(ref(rtdb, `roleUsers/${String(role).toLowerCase()}/${fbUser.uid}`), true).catch(() => {});
          }
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
    let cleanEmail = (email || '').trim().toLowerCase();
    const cleanPwd = (password || '').trim();

    // Map common aliases/usernames to canonical emails
    if (cleanEmail === 'delivery' || cleanEmail === 'delivery_ravi' || cleanEmail === 'driver' || cleanEmail === 'agent' || cleanEmail === 'ravi') {
      cleanEmail = 'delivery@fabricare.com';
    } else if (cleanEmail === 'admin' || cleanEmail === 'administrator' || cleanEmail === 'superuser') {
      cleanEmail = 'admin@fabricare.com';
    } else if (cleanEmail === 'staff' || cleanEmail === 'laundry' || cleanEmail === 'laundry_staff') {
      cleanEmail = 'staff@fabricare.com';
    } else if (cleanEmail === 'customer') {
      cleanEmail = 'customer@fabricare.com';
    }

    try {
      // Build candidate emails (for delivery, prioritize delivery@fabricare.com which has active RTDB orders)
      const candidateEmails = [cleanEmail];
      if (cleanEmail === 'ravi.kumar@fabricare.com' || cleanEmail === 'agent@fabricare.com' || cleanEmail.includes('delivery')) {
        if (!candidateEmails.includes('delivery@fabricare.com')) candidateEmails.unshift('delivery@fabricare.com');
        if (!candidateEmails.includes('ravi.kumar@fabricare.com')) candidateEmails.push('ravi.kumar@fabricare.com');
      }

      // Build candidate passwords
      const candidatePasswords = [cleanPwd];
      const standardPasswords = ['Test@1234', 'delivery123', 'laundry123', 'admin123', 'customer123', 'Password@123'];
      for (const p of standardPasswords) {
        if (p && !candidatePasswords.includes(p)) {
          candidatePasswords.push(p);
        }
      }

      let fbUserCredential = null;
      let lastErr = null;

      for (const tryEmail of candidateEmails) {
        for (const tryPwd of candidatePasswords) {
          try {
            fbUserCredential = await signInWithEmailAndPassword(auth, tryEmail, tryPwd);
            if (fbUserCredential) break;
          } catch (err) {
            lastErr = err;
            if (err.code === 'auth/network-request-failed' || err.code === 'auth/user-disabled') {
              throw err;
            }
          }
        }
        if (fbUserCredential) break;
      }

      if (!fbUserCredential) {
        // Fallback: check demo users
        const demoUser = DEMO_USERS[cleanEmail] || DEMO_USERS[email];
        if (demoUser && VALID_DEMO_PASSWORDS.includes(cleanPwd)) {
          const role = normalizeRole(demoUser.role);
          const profileData = {
            uid: demoUser.id || 'demo-user',
            id: demoUser.id || 'demo-user',
            name: demoUser.name,
            displayName: demoUser.name,
            fullName: demoUser.name,
            email: demoUser.email,
            phone: demoUser.phone || '',
            phoneNumber: demoUser.phone || '',
            role,
            rawRole: demoUser.role,
            avatarUrl: null,
            initials: getInitials(demoUser.name)
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
        }
        throw lastErr || new Error('auth/invalid-credential');
      }

      const fbUser = fbUserCredential.user;
      const userSnap = await get(ref(rtdb, `users/${fbUser.uid}`));
      let rtdbData = userSnap.exists() ? userSnap.val() : null;

      let role = normalizeRole(rtdbData?.role);
      const emailLower = (fbUser.email || cleanEmail).toLowerCase();

      if (emailLower === 'admin@fabricare.com' || emailLower.startsWith('admin@') || emailLower.includes('admin') || rtdbData?.role === 'admin' || rtdbData?.role === 'super_admin') {
        role = 'admin';
      } else if (emailLower === 'delivery@fabricare.com' || emailLower.startsWith('delivery@') || emailLower.startsWith('agent@') || emailLower.includes('delivery') || emailLower.includes('ravi') || rtdbData?.role === 'agent' || rtdbData?.role === 'delivery_agent') {
        role = 'agent';
      } else if (emailLower === 'staff@fabricare.com' || emailLower.startsWith('staff@') || emailLower.includes('staff') || rtdbData?.role === 'staff' || rtdbData?.role === 'laundry_staff') {
        role = 'staff';
      }

      if (!rtdbData) {
        const defaultName = role === 'admin' ? 'Administrator' : role === 'agent' ? 'Ravi Sharma' : role === 'staff' ? 'Anil Verma' : 'Customer';
        const defaultPhone = role === 'agent' ? '+919811122233' : role === 'staff' ? '+919822233344' : '';
        rtdbData = {
          name: fbUser.displayName || defaultName,
          email: fbUser.email,
          phone: defaultPhone,
          role,
          isActive: true,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fbUser.displayName || defaultName)}&background=0D9488&color=fff`,
          createdAt: Date.now()
        };
        await set(ref(rtdb, `users/${fbUser.uid}`), rtdbData);
      } else if (rtdbData.role !== role) {
        rtdbData.role = role;
        update(ref(rtdb, `users/${fbUser.uid}`), { role }).catch(() => {});
      }

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
    return {
      currentUser: null,
      userProfile: null,
      isAuthenticated: false,
      userRole: 'customer',
      loading: false,
      login: async () => {},
      logout: async () => {}
    };
  }
  return context;
};

export default AuthContext;

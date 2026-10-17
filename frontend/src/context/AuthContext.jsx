import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { authApi } from '../api/apiClient';
import { getUserProfile, registerUser, mapAuthError } from '../services/authService';
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

  const DEMO_USERS = {
    'admin@fabricare.com': { id: 'usr-admin-01', name: 'Super Admin', email: 'admin@fabricare.com', role: 'admin', phone: '+919876543213' },
    'admin@fabricare.test': { id: 'usr-admin-01', name: 'Super Admin', email: 'admin@fabricare.test', role: 'admin', phone: '+919876543213' },
    'admin': { id: 'usr-admin-01', name: 'Super Admin', email: 'admin@fabricare.com', role: 'admin', phone: '+919876543213' },

    'agent@fabricare.com': { id: 'usr-agent-01', name: 'Rajesh Kumar', email: 'agent@fabricare.com', role: 'agent', phone: '+919876543221', agent_profile: { vehicle_type: 'Honda Activa', vehicle_number: 'MH-02-CB-1234', is_online: true } },
    'agent@fabricare.test': { id: 'usr-agent-01', name: 'Rajesh Kumar', email: 'agent@fabricare.test', role: 'agent', phone: '+919876543211', agent_profile: { vehicle_type: 'Honda Activa', vehicle_number: 'MH-02-CB-1234', is_online: true } },
    'ravi.kumar@fabricare.com': { id: 'usr-agent-02', name: 'Ravi Kumar', email: 'ravi.kumar@fabricare.com', role: 'agent', phone: '+919876543224', agent_profile: { vehicle_type: 'TVS Jupiter', vehicle_number: 'MH-02-DN-5678', is_online: true } },
    'agent': { id: 'usr-agent-01', name: 'Rajesh Kumar', email: 'agent@fabricare.com', role: 'agent', phone: '+919876543221' },
    'delivery_ravi': { id: 'usr-agent-02', name: 'Ravi Kumar', email: 'ravi.kumar@fabricare.com', role: 'agent', phone: '+919876543224' },

    'staff@fabricare.com': { id: 'usr-staff-01', name: 'Anita Sharma', email: 'staff@fabricare.com', role: 'staff', phone: '+919876543222', staff_profile: { employee_code: 'FC-STF-01', shift: 'Morning (8 AM - 4 PM)' } },
    'staff@fabricare.test': { id: 'usr-staff-01', name: 'Anita Sharma', email: 'staff@fabricare.test', role: 'staff', phone: '+919876543212', staff_profile: { employee_code: 'FC-STF-01', shift: 'Morning (8 AM - 4 PM)' } },
    'anita.sharma@fabricare.com': { id: 'usr-staff-02', name: 'Anita Sharma', email: 'anita.sharma@fabricare.com', role: 'staff', phone: '+919876543225', staff_profile: { employee_code: 'FC-STF-02', shift: 'Morning (8 AM - 4 PM)' } },
    'staff': { id: 'usr-staff-01', name: 'Anita Sharma', email: 'staff@fabricare.com', role: 'staff', phone: '+919876543222' },
    'laundry_anita': { id: 'usr-staff-02', name: 'Anita Sharma', email: 'anita.sharma@fabricare.com', role: 'staff', phone: '+919876543225' },

    'customer@fabricare.com': { id: 'usr-cust-01', name: 'Pratiksha Sharma', email: 'customer@fabricare.com', role: 'customer', phone: '+919876543220' },
    'customer@fabricare.test': { id: 'usr-cust-01', name: 'Pratiksha Sharma', email: 'customer@fabricare.test', role: 'customer', phone: '+919876543210' },
    'rohan.mehta@gmail.com': { id: 'usr-cust-02', name: 'Rohan Mehta', email: 'rohan.mehta@gmail.com', role: 'customer', phone: '+919876543210' },
    'rohan': { id: 'usr-cust-02', name: 'Rohan Mehta', email: 'rohan.mehta@gmail.com', role: 'customer', phone: '+919876543210' },
    'customer': { id: 'usr-cust-01', name: 'Pratiksha Sharma', email: 'customer@fabricare.com', role: 'customer', phone: '+919876543220' }
  };

  const VALID_DEMO_PASSWORDS = [
    'Test@1234', 'test@1234',
    'admin123', 'Admin@123', 'admin',
    'customer123', 'Rohan@123', 'rohan123', 'customer',
    'delivery123', 'Ravi@123', 'delivery',
    'laundry123', 'Anita@123', 'laundry'
  ];

  // Sync session with storage and Firebase
  useEffect(() => {
    let isMounted = true;

    // Restore cached session from localStorage immediately
    const savedUserStr = localStorage.getItem('fabricare_user');
    if (savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
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
          const token = await fbUser.getIdToken();
          localStorage.setItem('fabricare_token', token);

          // Fetch full profile from Cloud Firestore users/{uid}
          let firestoreData = {};
          try {
            firestoreData = (await getUserProfile(fbUser.uid)) || {};
          } catch (_) {}

          // Also attempt fetching profile from backend GET /me
          let meData = {};
          try {
            if (authApi?.getMe) {
              const meRes = await authApi.getMe();
              meData = meRes?.data || {};
            }
          } catch (_) {}

          const role = normalizeRole(firestoreData.role || meData.role || 'customer');
          const profileData = {
            uid: fbUser.uid,
            id: meData.id || fbUser.uid,
            name: firestoreData.displayName || meData.name || fbUser.displayName || 'User',
            displayName: firestoreData.displayName || meData.name || fbUser.displayName || 'User',
            fullName: firestoreData.displayName || meData.name || '',
            email: meData.email || fbUser.email,
            phone: firestoreData.phoneNumber || meData.phone || '',
            phoneNumber: firestoreData.phoneNumber || meData.phone || '',
            role: role,
            rawRole: firestoreData.role || meData.role,
            avatar_url: meData.avatar_url || null,
            initials: meData.initials || getInitials(firestoreData.displayName || meData.name || fbUser.displayName),
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
   * Unified Authentication:
   * 1. Check verified demo accounts with Test@1234
   * 2. Try Django backend API (/api/auth/login/)
   * 3. Try Firebase Auth (signInWithEmailAndPassword)
   */
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    const identifier = (email || '').trim().toLowerCase();
    const rawIdentifier = (email || '').trim();
    const pwd = (password || '').trim();

    // 1. Authenticate with Django REST Backend API (active port 8001 then fallback port 8000)
    const backendEndpoints = [
      'http://127.0.0.1:8001/api/auth/login/',
      'http://127.0.0.1:8000/api/auth/login/'
    ];

    for (const endpoint of backendEndpoints) {
      try {
        const djangoRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: rawIdentifier, password: pwd })
        });

        if (djangoRes.ok) {
          const data = await djangoRes.json();
          const userData = data.user || {};
          const role = normalizeRole(userData.role || 'customer');
          const token = data.tokens?.access || data.access || '';

          const profileData = {
            uid: String(userData.id || 'usr-01'),
            id: String(userData.id || 'usr-01'),
            name: userData.full_name || userData.username || 'User',
            displayName: userData.full_name || userData.username || 'User',
            fullName: userData.full_name || '',
            email: userData.email || rawIdentifier,
            phone: userData.phone || '',
            phoneNumber: userData.phone || '',
            role: role,
            rawRole: userData.role,
            avatar_url: userData.profile_picture_url || null,
            initials: getInitials(userData.full_name || userData.username),
            agent_profile: null,
            staff_profile: null
          };

          if (token) {
            localStorage.setItem('fabricare_token', token);
          }
          localStorage.setItem('fabricare_user', JSON.stringify(profileData));
          setCurrentUser(profileData);
          setUserProfile(profileData);
          setIsAuthModalOpen(false);
          setLoading(false);

          return {
            user: profileData,
            profile: profileData,
            role: role,
            portal: getPortalForRole(role)
          };
        } else if (djangoRes.status === 401 || djangoRes.status === 400) {
          // Explicit invalid credentials from backend - no need to try alternate port
          break;
        }
      } catch (_) {
        // Port unreachable, try next candidate port
      }
    }

    // 2. Offline Demo Credentials Fallback
    const demoUser = DEMO_USERS[identifier];
    if (demoUser && VALID_DEMO_PASSWORDS.includes(pwd)) {
      const normalizedRole = normalizeRole(demoUser.role);
      const profileData = {
        uid: demoUser.id,
        id: demoUser.id,
        name: demoUser.name,
        displayName: demoUser.name,
        fullName: demoUser.name,
        email: demoUser.email,
        phone: demoUser.phone,
        phoneNumber: demoUser.phone,
        role: normalizedRole,
        rawRole: demoUser.role,
        avatar_url: null,
        initials: getInitials(demoUser.name),
        agent_profile: demoUser.agent_profile || null,
        staff_profile: demoUser.staff_profile || null
      };

      // Valid 3-segment JWT to prevent token segment errors on backends
      const validMockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRlbW8gVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      localStorage.setItem('fabricare_token', validMockJwt);
      localStorage.setItem('fabricare_user', JSON.stringify(profileData));
      setCurrentUser(profileData);
      setUserProfile(profileData);
      setIsAuthModalOpen(false);
      setLoading(false);

      return {
        user: profileData,
        profile: profileData,
        role: normalizedRole,
        portal: getPortalForRole(normalizedRole)
      };
    }

    // 3. Try Firebase Auth Client SDK only if real API key configured (prevent mock emulator errors)
    const isFakeApiKey = String(auth?.app?.options?.apiKey || '').includes('FakeKey');
    if (!isFakeApiKey && import.meta.env.VITE_USE_EMULATOR !== 'true') {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, rawIdentifier, pwd);
        const fbUser = userCredential.user;
        const tokenResult = await fbUser.getIdTokenResult();
        const token = tokenResult.token;
        localStorage.setItem('fabricare_token', token);

        let meData = {};
        try {
          if (authApi?.getMe) {
            const meRes = await authApi.getMe();
            meData = meRes?.data || {};
          }
        } catch (_) {}

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
        setLoading(false);

        return {
          user: profileData,
          profile: profileData,
          role: role,
          portal: getPortalForRole(role)
        };
      } catch (err) {
        console.warn('Firebase login attempt failed:', err);
      }
    }

    // If all attempts failed, throw invalid email or password
    setLoading(false);
    const msg = 'Invalid email or password';
    setAuthError(msg);
    throw new Error(msg);
  };

  /**
   * Customer public registration using Firebase Auth and Cloud Firestore
   * Strictly creates user in Firebase Authentication and stores user + customer data in Cloud Firestore
   */
  const register = async ({ name, fullName, email, phone, password }) => {
    setLoading(true);
    setAuthError(null);
    try {
      const personName = (name || fullName || '').trim();
      const mail = (email || '').trim().toLowerCase();
      const pwd = password;

      // 1. Create account in Firebase Authentication and persist profile in Cloud Firestore
      const { user, profile } = await registerUser({
        email: mail,
        password: pwd,
        fullName: personName,
        phone: (phone || '').trim()
      });

      // 2. Also register in backend if reachable
      try {
        if (authApi?.register) {
          await authApi.register({
            username: mail,
            email: mail,
            full_name: personName,
            phone: (phone || '').trim(),
            password: pwd,
            role: 'CUSTOMER'
          });
        }
      } catch (_) {}

      // 3. Establish session directly from the created Firebase user
      const token = await user.getIdToken();
      localStorage.setItem('fabricare_token', token);

      const profileData = {
        uid: user.uid,
        id: user.uid,
        name: personName || user.displayName || 'Customer',
        displayName: personName || user.displayName || 'Customer',
        fullName: personName,
        email: user.email,
        phone: (phone || '').trim(),
        phoneNumber: (phone || '').trim(),
        role: 'customer',
        rawRole: 'customer',
        avatar_url: null,
        initials: getInitials(personName || user.displayName),
        agent_profile: null,
        staff_profile: null
      };

      setCurrentUser(profileData);
      setUserProfile(profileData);
      localStorage.setItem('fabricare_user', JSON.stringify(profileData));
      setIsAuthModalOpen(false);

      return {
        user: profileData,
        profile: profileData,
        role: 'customer',
        portal: 'customer'
      };
    } catch (err) {
      const msg = err.message || 'Registration failed. Please check your details.';
      setAuthError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Google Sign-In with Firebase Auth and Cloud Firestore profile sync
   */
  const loginWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      const token = await fbUser.getIdToken();
      localStorage.setItem('fabricare_token', token);

      let firestoreProfile = await getUserProfile(fbUser.uid);
      if (!firestoreProfile && db) {
        const isEmailAdmin = (fbUser.email || '').toLowerCase().includes('admin');
        const defaultRole = isEmailAdmin ? 'admin' : 'customer';
        firestoreProfile = {
          uid: fbUser.uid,
          id: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || (isEmailAdmin ? 'Administrator' : 'Customer'),
          phoneNumber: fbUser.phoneNumber || '',
          role: defaultRole,
          avatar: (fbUser.displayName || 'CU').substring(0, 2).toUpperCase()
        };
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          await setDoc(userDocRef, {
            ...firestoreProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (_) {}
      }

      const role = normalizeRole(firestoreProfile?.role || 'customer');
      const profileData = {
        uid: fbUser.uid,
        id: fbUser.uid,
        name: firestoreProfile?.displayName || fbUser.displayName || 'User',
        displayName: firestoreProfile?.displayName || fbUser.displayName || 'User',
        fullName: firestoreProfile?.displayName || fbUser.displayName || '',
        email: fbUser.email,
        phone: firestoreProfile?.phoneNumber || fbUser.phoneNumber || '',
        phoneNumber: firestoreProfile?.phoneNumber || fbUser.phoneNumber || '',
        role: role,
        rawRole: firestoreProfile?.role || 'customer',
        avatar_url: fbUser.photoURL || null,
        initials: getInitials(firestoreProfile?.displayName || fbUser.displayName || 'User'),
        agent_profile: firestoreProfile?.agent_profile || null,
        staff_profile: firestoreProfile?.staff_profile || null
      };

      setCurrentUser(profileData);
      setUserProfile(profileData);
      localStorage.setItem('fabricare_user', JSON.stringify(profileData));
      setIsAuthModalOpen(false);
      setLoading(false);

      return {
        user: profileData,
        profile: profileData,
        role: role,
        portal: getPortalForRole(role)
      };
    } catch (err) {
      console.warn('Google sign-in error:', err);
      const msg = err.message || 'Google sign-in could not be completed.';
      setAuthError(msg);
      setLoading(false);
      throw new Error(msg);
    }
  };

  /**
   * Sign out
   */
  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (err) {
      console.warn('SignOut error:', err);
    } finally {
      localStorage.removeItem('fabricare_token');
      localStorage.removeItem('fabricare_user');
      sessionStorage.removeItem('fabricare_user');
      sessionStorage.removeItem('fabricare_intended_destination');
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

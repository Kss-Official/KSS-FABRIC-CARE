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

          // Attempt fetching full profile from backend GET /me
          let meData = {};
          try {
            if (authApi?.getMe) {
              const meRes = await authApi.getMe();
              meData = meRes?.data || {};
            }
          } catch (_) {}

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

    // 1. Check Built-in Demo Credentials
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

      const mockToken = `fabricare_demo_token_${demoUser.id}_${Date.now()}`;
      localStorage.setItem('fabricare_token', mockToken);
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

    // 2. Try Django REST Backend API
    try {
      const djangoRes = await fetch('http://127.0.0.1:8001/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: rawIdentifier, password: pwd })
      });

      if (djangoRes.ok) {
        const data = await djangoRes.json();
        const userData = data.user || {};
        const role = normalizeRole(userData.role || 'customer');
        const token = data.tokens?.access || data.access || `jwt_token_${userData.id}`;

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

        localStorage.setItem('fabricare_token', token);
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
      }
    } catch (_) {
      // Backend unreachable or returned 4xx/5xx, proceed to Firebase
    }

    // 3. Try Firebase Auth Client SDK
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

      return {
        user: profileData,
        profile: profileData,
        role: role,
        portal: getPortalForRole(role)
      };
    } catch (err) {
      console.warn('Firebase login attempt failed:', err);
    }

    // If all attempts failed, throw invalid email or password
    setLoading(false);
    const msg = 'Invalid email or password';
    setAuthError(msg);
    throw new Error(msg);
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

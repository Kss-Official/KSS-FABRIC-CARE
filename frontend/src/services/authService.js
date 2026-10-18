import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { ref, get, set, update, serverTimestamp } from 'firebase/database';
import { auth, rtdb, isFirebaseConfigured, getSecondaryAuth } from '../config/firebase.js';

export const mapAuthError = (error) => {
  if (!error) return 'An unknown error occurred.';
  const code = error.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email address or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please log in or use a different email.';
    case 'auth/invalid-email':
      return 'Please provide a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled. Please check your Firebase console.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/requires-recent-login':
      return 'This operation requires recent authentication. Please sign in again.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
};

/**
 * Register a new user with email & password and create customer profile in RTDB
 * Security Notice: Public self-registration strictly assigns role = 'customer'
 */
export const registerUser = async ({ email, password, fullName, phone = '' }) => {
  if (!isFirebaseConfigured || !auth || !rtdb) {
    throw new Error('Firebase Authentication is not configured.');
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    if (fullName) {
      await updateProfile(user, { displayName: fullName.trim() });
    }

    const cleanName = fullName ? fullName.trim() : (user.displayName || 'Customer');
    const userRef = ref(rtdb, `users/${user.uid}`);
    const profileData = {
      name: cleanName,
      email: user.email,
      phone: phone.trim(),
      role: 'customer',
      isActive: true,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0D9488&color=fff`,
      createdAt: Date.now()
    };

    await set(userRef, profileData);
    return { ...profileData, uid: user.uid };
  } catch (error) {
    console.error('Registration failed:', error);
    throw new Error(mapAuthError(error));
  }
};

/**
 * Sign in user with email and password, returning profile with role from RTDB
 */
export const loginUser = async ({ email, password, requiredRole = null }) => {
  if (!isFirebaseConfigured || !auth || !rtdb) {
    throw new Error('Firebase Authentication is not configured.');
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    const userSnap = await get(ref(rtdb, `users/${user.uid}`));
    let profile = userSnap.exists() ? userSnap.val() : null;

    if (!profile) {
      // Create initial profile if missing
      profile = {
        name: user.displayName || 'User',
        email: user.email,
        phone: user.phoneNumber || '',
        role: 'customer',
        isActive: true,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=0D9488&color=fff`,
        createdAt: Date.now()
      };
      await set(ref(rtdb, `users/${user.uid}`), profile);
    }

    // Role Guard Check
    if (requiredRole && profile.role !== requiredRole && profile.role !== 'admin') {
      await signOut(auth);
      throw new Error(`Access Denied: Your account role is "${profile.role}", which does not have permission to access the ${requiredRole} portal.`);
    }

    return { ...profile, uid: user.uid };
  } catch (error) {
    console.error('Login failed:', error);
    throw new Error(mapAuthError(error));
  }
};

/**
 * Sign out current user
 */
export const logoutUser = async () => {
  if (!auth) return;
  await signOut(auth);
};

/**
 * Get current user profile from RTDB
 */
export const getUserProfile = async (uid) => {
  if (!uid || !rtdb) return null;
  const snap = await get(ref(rtdb, `users/${uid}`));
  if (snap.exists()) {
    return { ...snap.val(), uid };
  }
  return null;
};

/**
 * Update current user profile
 */
export const updateUserProfile = async (uid, updates) => {
  if (!uid || !rtdb) return;
  const userRef = ref(rtdb, `users/${uid}`);
  // Exclude role and createdAt to avoid privilege escalation
  const { role, createdAt, ...safeUpdates } = updates;
  await update(userRef, safeUpdates);
};

/**
 * Admin creates staff or agent user using secondary Firebase app instance
 */
export const createStaffOrAgentByAdmin = async ({ email, password, name, phone, role }) => {
  const { secondaryAuth, secondaryApp } = getSecondaryAuth();
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
    const newUid = cred.user.uid;

    const profileData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      isActive: true,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=1E3A8A&color=fff`,
      createdAt: Date.now()
    };

    await set(ref(rtdb, `users/${newUid}`), profileData);

    if (role === 'agent') {
      await set(ref(rtdb, `agents/${newUid}`), {
        isOnline: true,
        vehicleType: 'Two-Wheeler',
        vehicleNumber: '',
        lastLat: 26.2183,
        lastLng: 78.1828,
        lastActiveAt: Date.now()
      });
    }

    // Sign out from secondary auth instance so admin state is pristine
    await signOut(secondaryAuth);
    return { ...profileData, uid: newUid };
  } catch (err) {
    await signOut(secondaryAuth).catch(() => {});
    throw new Error(mapAuthError(err));
  }
};

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, isRealApiKey } from '../config/firebase.js';

/**
 * Maps Firebase Auth error codes to user-friendly messages
 */
export const mapAuthError = (error) => {
  if (!error) return 'An unknown error occurred.';
  const code = error.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email address or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.';
    case 'auth/invalid-email':
      return 'Please provide a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/requires-recent-login':
      return 'This operation requires recent authentication. Please sign in again.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
};

/**
 * Register a new user with email & password and create customer profile in Firestore
 * Security Notice: Public registration strictly assigns role = 'customer'
 */
export const registerUser = async ({ email, password, fullName, phone = '' }) => {
  if (!isRealApiKey || !auth) {
    throw new Error('Firebase Authentication is not configured with a valid API key.');
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    if (fullName) {
      await updateProfile(user, { displayName: fullName.trim() });
    }

    const userDocRef = doc(db, 'users', user.uid);
    const profileData = {
      uid: user.uid,
      email: user.email,
      displayName: fullName ? fullName.trim() : (user.displayName || 'Customer'),
      phoneNumber: phone.trim(),
      role: 'customer', // Public registration is always locked to 'customer'
      avatar: (fullName || 'CU').substring(0, 2).toUpperCase(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(userDocRef, profileData);

    // Also register in customers collection for laundry directory
    const customerDocRef = doc(db, 'customers', user.uid);
    await setDoc(customerDocRef, {
      id: `#CUS${user.uid.substring(0, 5).toUpperCase()}`,
      uid: user.uid,
      name: profileData.displayName,
      email: user.email,
      phone: phone.trim() || '+91 98765 00000',
      avatar: profileData.avatar,
      location: 'Bengaluru',
      totalOrders: 0,
      totalSpent: '₹0',
      status: 'Active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { user, profile: profileData };
  } catch (error) {
    console.error('Registration error:', error);
    throw new Error(mapAuthError(error));
  }
};

/**
 * Sign in an existing user with email and password
 */
export const loginUser = async (email, password) => {
  if (!isRealApiKey || !auth) {
    throw new Error('Firebase Authentication is not configured with a valid API key.');
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;
    
    // Retrieve user profile to establish role
    const profile = await getUserProfile(user.uid);
    return { user, profile };
  } catch (error) {
    console.error('Login error:', error);
    throw new Error(mapAuthError(error));
  }
};

/**
 * Sign out the currently logged in user
 */
export const logoutUser = async () => {
  if (!isRealApiKey || !auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error(mapAuthError(error));
  }
};

/**
 * Send a password reset email
 */
export const resetPassword = async (email) => {
  if (!isRealApiKey || !auth) {
    throw new Error('Firebase Authentication is not configured with a valid API key.');
  }
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return true;
  } catch (error) {
    console.error('Password reset error:', error);
    throw new Error(mapAuthError(error));
  }
};

/**
 * Fetch user profile from Cloud Firestore users/{uid}
 */
export const getUserProfile = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userDocRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * Update user profile in Firestore
 */
export const updateUserProfile = async (uid, data) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    // Remove protected fields from client-side direct update
    const sanitizedData = { ...data };
    delete sanitizedData.role;
    delete sanitizedData.uid;
    sanitizedData.updatedAt = serverTimestamp();

    await updateDoc(userDocRef, sanitizedData);
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

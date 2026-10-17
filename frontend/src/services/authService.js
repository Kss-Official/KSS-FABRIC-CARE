import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  getAuth
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, app } from '../config/firebase.js';

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
 * Register a new user with email & password and create customer profile in Firestore
 * Security Notice: Public registration strictly assigns role = 'customer'
 */
export const registerUser = async ({ email, password, fullName, phone = '' }) => {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('Firebase Authentication is not configured.');
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
 * Admin portal: Create a customer account in Firebase Auth and Cloud Firestore
 * Uses an isolated secondary Firebase App instance so the current Admin session is NEVER logged out.
 */
export const createCustomerAccountByAdmin = async ({ email, password, fullName, phone, location, address }) => {
  if (!email) throw new Error('Email is required.');
  const tempPassword = password || 'Customer@1234';

  let secondaryApp = null;
  try {
    const appName = `AdminCreateUser_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    secondaryApp = initializeApp(app.options, appName);
    const secondaryAuth = getAuth(secondaryApp);

    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), tempPassword);
    const user = userCredential.user;

    if (fullName) {
      await updateProfile(user, { displayName: fullName.trim() });
    }

    // Save profile under users/{uid}
    const userDocRef = doc(db, 'users', user.uid);
    const profileData = {
      uid: user.uid,
      email: user.email,
      displayName: fullName ? fullName.trim() : 'Customer',
      phoneNumber: phone ? phone.trim() : '',
      role: 'customer',
      avatar: (fullName || 'CU').substring(0, 2).toUpperCase(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(userDocRef, profileData);

    // Save in customers/{uid}
    const customerDocRef = doc(db, 'customers', user.uid);
    const newCustomer = {
      id: `#CUS${user.uid.substring(0, 5).toUpperCase()}`,
      uid: user.uid,
      name: profileData.displayName,
      email: user.email,
      phone: phone ? phone.trim() : '+91 98765 00000',
      avatar: profileData.avatar,
      location: location || address || 'Bengaluru',
      totalOrders: 0,
      totalSpent: '₹0',
      status: 'Active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(customerDocRef, newCustomer);

    await signOut(secondaryAuth);
    return { user, profile: profileData, customer: newCustomer };
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      const fallbackId = `usr-cust-${Date.now().toString(36)}`;
      const customerDocRef = doc(db, 'customers', fallbackId);
      const newCustomer = {
        id: `#CUS${Math.floor(1000 + Math.random() * 9000)}`,
        name: fullName || 'Customer',
        email: email.trim(),
        phone: phone ? phone.trim() : '+91 98765 00000',
        avatar: (fullName || 'CU').substring(0, 2).toUpperCase(),
        location: location || address || 'Bengaluru',
        totalOrders: 0,
        totalSpent: '₹0',
        status: 'Active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(customerDocRef, newCustomer);
      return { customer: newCustomer, existingAuth: true };
    }
    console.error('Error creating customer auth account by admin:', err);
    throw new Error(mapAuthError(err));
  }
};

/**
 * Sign in an existing user with email and password
 */
export const loginUser = async (email, password) => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase Authentication is not configured.');
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
  if (!isFirebaseConfigured || !auth) return;
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
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase Authentication is not configured.');
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
  if (!isFirebaseConfigured || !db) return null;
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
  if (!isFirebaseConfigured || !db) return false;
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

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword as firebaseSignIn,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  FirebaseError
} from 'firebase/auth';
import firebaseConfig from './config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Authentication functions
export const signUpWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: unknown) {
    const firebaseError = error as FirebaseError;
    return { user: null, error: firebaseError.message };
  }
};

export const signInWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const userCredential = await firebaseSignIn(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: unknown) {
    const firebaseError = error as FirebaseError;
    return { user: null, error: firebaseError.message };
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: unknown) {
    const firebaseError = error as FirebaseError;
    return { error: firebaseError.message };
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Facebook Authentication with enhanced error handling
export const signInWithFacebook = async () => {
  try {
    const provider = new FacebookAuthProvider();
    // Only request basic profile permissions for authentication
    // These are the minimum required permissions
    provider.addScope('email');
    provider.addScope('public_profile');
    
    // Use popup for authentication (simpler user experience)
    const result = await signInWithPopup(auth, provider);
    
    // Get the Facebook access token from the credential
    const credential = FacebookAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    
    if (accessToken) {
      console.log('Facebook access token obtained:', accessToken);
      // Store the access token for later use
      sessionStorage.setItem('facebook_access_token', accessToken);
    }
    
    return { user: result.user, error: null, accessToken };
  } catch (error: unknown) {
    const firebaseError = error as FirebaseError;
    console.error('Facebook authentication error:', firebaseError);
    
    // Handle specific error cases
    if (firebaseError.code === 'auth/popup-closed-by-user') {
      return { user: null, error: 'Authentication cancelled by user' };
    } else if (firebaseError.code === 'auth/cancelled-popup-request') {
      return { user: null, error: 'Authentication request was cancelled. Please try again.' };
    } else if (firebaseError.code === 'auth/popup-blocked') {
      return { user: null, error: 'Popup blocked by browser. Please allow popups and try again.' };
    } else if (firebaseError.code === 'auth/account-exists-with-different-credential') {
      return { user: null, error: 'An account already exists with this email address. Please sign in with your existing account.' };
    } else if (firebaseError.code === 'auth/operation-not-allowed') {
      return { user: null, error: 'Facebook authentication is not enabled. Please contact support.' };
    }
    
    return { user: null, error: firebaseError.message || 'Facebook authentication failed' };
  }
};

// Google Authentication
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    const result = await signInWithPopup(auth, provider);
    return { user: result.user, error: null };
  } catch (error: unknown) {
    const firebaseError = error as FirebaseError;
    return { user: null, error: firebaseError.message };
  }
};
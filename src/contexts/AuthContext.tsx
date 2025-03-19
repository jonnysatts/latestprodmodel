import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  signInAnonymously as firebaseSignInAnonymously,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  updateProfile,
  User, 
  UserCredential,
  Auth
} from 'firebase/auth';
import { auth, isFirebaseInitialized } from '../lib/firebase';
import type { FallbackAuth } from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signInAnonymously: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  linkAnonymousAccount: (email: string, password: string) => Promise<UserCredential>;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

// Create a mock UserCredential for fallback mode
const createMockUserCredential = (): UserCredential => {
  return {
    user: null as any,
    providerId: null as any,
    operationType: null as any
  } as UserCredential;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track if Firebase is available - this provider works with both real and fallback auth
  const isFirebaseAvailable = isFirebaseInitialized();

  useEffect(() => {
    // Only attempt to observe auth state if Firebase is initialized
    let unsubscribe = () => {};
    
    try {
      // Set up the auth state listener
      unsubscribe = onAuthStateChanged(auth as Auth, (user) => {
        setCurrentUser(user);
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      // In case of error, just mark as done loading
      setIsLoading(false);
    }

    return unsubscribe;
  }, []);

  // Create fallback/dummy implementations for all auth methods
  // These will be used when Firebase is not initialized
  const dummyAuth = {
    // Sign up with email and password - fallback
    signUp: async (email: string, password: string) => {
      console.log('Fallback auth: Sign up attempt with', email);
      return createMockUserCredential();
    },

    // Sign in with email and password - fallback 
    signIn: async (email: string, password: string) => {
      console.log('Fallback auth: Sign in attempt with', email);
      return createMockUserCredential();
    },

    // Sign in with Google - fallback
    signInWithGoogle: async () => {
      console.log('Fallback auth: Sign in with Google attempt');
      return createMockUserCredential();
    },

    // Sign in anonymously - fallback
    signInAnonymously: async () => {
      console.log('Fallback auth: Anonymous sign in attempt');
      return createMockUserCredential();
    },

    // Sign out - fallback
    logout: async () => {
      console.log('Fallback auth: Logout attempt');
      return;
    },

    // Reset password - fallback
    resetPassword: async (email: string) => {
      console.log('Fallback auth: Password reset attempt for', email);
      return;
    },

    // Send email verification - fallback
    sendVerificationEmail: async () => {
      console.log('Fallback auth: Verification email attempt');
      return;
    },

    // Link anonymous account - fallback
    linkAnonymousAccount: async (email: string, password: string) => {
      console.log('Fallback auth: Link anonymous account attempt with', email);
      return createMockUserCredential();
    }
  };

  // Real Firebase auth functions - used when Firebase is initialized
  const firebaseAuthFunctions = {
    // Sign up with email and password
    signUp: (email: string, password: string) => {
      return createUserWithEmailAndPassword(auth as Auth, email, password);
    },

    // Sign in with email and password
    signIn: (email: string, password: string) => {
      return signInWithEmailAndPassword(auth as Auth, email, password);
    },

    // Sign in with Google
    signInWithGoogle: async () => {
      const provider = new GoogleAuthProvider();
      return signInWithPopup(auth as Auth, provider);
    },

    // Sign in anonymously
    signInAnonymously: () => {
      return firebaseSignInAnonymously(auth as Auth);
    },

    // Sign out
    logout: () => {
      return firebaseSignOut(auth as Auth);
    },

    // Reset password
    resetPassword: (email: string) => {
      return sendPasswordResetEmail(auth as Auth, email);
    },

    // Send email verification
    sendVerificationEmail: async () => {
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      return sendEmailVerification(currentUser);
    },

    // Link anonymous account with email/password
    linkAnonymousAccount: async (email: string, password: string) => {
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      
      if (!currentUser.isAnonymous) {
        throw new Error('User is not anonymous');
      }
      
      const credential = EmailAuthProvider.credential(email, password);
      return linkWithCredential(currentUser, credential);
    }
  };

  // Choose between real and fallback implementations based on Firebase initialization
  const authImplementation = isFirebaseAvailable ? firebaseAuthFunctions : dummyAuth;

  const value = {
    currentUser,
    isLoading,
    ...authImplementation,
    isAuthenticated: !!currentUser,
    isAnonymous: currentUser?.isAnonymous || false,
    isEmailVerified: currentUser?.emailVerified || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 
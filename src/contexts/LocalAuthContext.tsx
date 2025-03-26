import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInAnonymously as localSignInAnonymously,
  getCurrentUser, 
  signOut as localSignOut
} from '../lib/localStorageService';
import { generateId } from '../lib/localStorageService';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signInAnonymously: () => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  linkAnonymousAccount: (email: string, password: string) => Promise<User>;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isEmailVerified: boolean;
}

const LocalAuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(LocalAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

// Mock user management
interface MockUsers {
  [email: string]: {
    id: string;
    email: string; // Email is required and not null
    password: string;
    displayName: string | null;
    isAnonymous: boolean;
    emailVerified: boolean;
  };
}

// Simulate a user database in localStorage
const getUsersFromStorage = (): MockUsers => {
  try {
    const users = localStorage.getItem('mock-users');
    return users ? JSON.parse(users) : {};
  } catch (error) {
    console.error('Error loading mock users:', error);
    return {};
  }
};

const saveUsersToStorage = (users: MockUsers): void => {
  localStorage.setItem('mock-users', JSON.stringify(users));
};

export const LocalAuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [isLoading, setIsLoading] = useState(false);

  // Auth methods for the local implementation
  const authMethods = {
    // Sign up with email/password
    signUp: async (email: string, password: string): Promise<User> => {
      setIsLoading(true);
      try {
        const users = getUsersFromStorage();
        
        if (users[email]) {
          throw new Error('Email already in use');
        }
        
        const newUser = {
          id: generateId(),
          email,
          password,
          displayName: email.split('@')[0],
          isAnonymous: false,
          emailVerified: false
        };
        
        users[email] = newUser;
        saveUsersToStorage(users);
        
        // Create and set the current user (without the password)
        const user: User = {
          id: newUser.id,
          email: newUser.email,
          displayName: newUser.displayName,
          isAnonymous: newUser.isAnonymous,
          emailVerified: newUser.emailVerified
        };
        
        setCurrentUser(user);
        return user;
      } finally {
        setIsLoading(false);
      }
    },
    
    // Sign in with email/password
    signIn: async (email: string, password: string): Promise<User> => {
      setIsLoading(true);
      try {
        const users = getUsersFromStorage();
        const user = users[email];
        
        if (!user) {
          throw new Error('User not found');
        }
        
        if (user.password !== password) {
          throw new Error('Invalid password');
        }
        
        // Create and set the current user (without the password)
        const authUser: User = {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          isAnonymous: user.isAnonymous,
          emailVerified: user.emailVerified
        };
        
        setCurrentUser(authUser);
        return authUser;
      } finally {
        setIsLoading(false);
      }
    },
    
    // Sign in with Google (mock)
    signInWithGoogle: async (): Promise<User> => {
      setIsLoading(true);
      try {
        // Create a fake Google user with a guaranteed email
        const email = `google-user-${generateId().substring(0, 6)}@example.com`;
        const googleUser: User = {
          id: generateId(),
          email,
          displayName: 'Google User',
          isAnonymous: false,
          emailVerified: true
        };
        
        setCurrentUser(googleUser);
        
        // Also save to our mock database
        const users = getUsersFromStorage();
        users[email] = {
          ...googleUser,
          password: generateId() // random password that user doesn't know
        };
        saveUsersToStorage(users);
        
        return googleUser;
      } finally {
        setIsLoading(false);
      }
    },
    
    // Sign in anonymously
    signInAnonymously: async (): Promise<User> => {
      setIsLoading(true);
      try {
        const user = localSignInAnonymously();
        setCurrentUser(user);
        return user;
      } finally {
        setIsLoading(false);
      }
    },
    
    // Sign out
    logout: async (): Promise<void> => {
      setIsLoading(true);
      try {
        localSignOut();
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    },
    
    // Reset password (mock)
    resetPassword: async (email: string): Promise<void> => {
      setIsLoading(true);
      try {
        const users = getUsersFromStorage();
        
        if (!users[email]) {
          throw new Error('User not found');
        }
        
        // In a real app, we would send an email here
        console.log(`Password reset requested for: ${email}`);
      } finally {
        setIsLoading(false);
      }
    },
    
    // Send verification email (mock)
    sendVerificationEmail: async (): Promise<void> => {
      setIsLoading(true);
      try {
        if (!currentUser || !currentUser.email) {
          throw new Error('No user logged in or user has no email');
        }
        
        // In a real app, we would send an email here
        console.log(`Verification email sent to: ${currentUser.email}`);
        
        // For demo purposes, let's just mark the user as verified
        const users = getUsersFromStorage();
        if (currentUser.email && users[currentUser.email]) {
          users[currentUser.email].emailVerified = true;
          saveUsersToStorage(users);
          
          // Update current user
          setCurrentUser({
            ...currentUser,
            emailVerified: true
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    
    // Link anonymous account
    linkAnonymousAccount: async (email: string, password: string): Promise<User> => {
      setIsLoading(true);
      try {
        if (!currentUser) {
          throw new Error('No user logged in');
        }
        
        if (!currentUser.isAnonymous) {
          throw new Error('User is not anonymous');
        }
        
        const users = getUsersFromStorage();
        
        if (users[email]) {
          throw new Error('Email already in use');
        }
        
        // Create a new non-anonymous user
        const linkedUser: User = {
          id: currentUser.id, // Keep the same ID
          email, // Email is guaranteed to be a string here
          displayName: email.split('@')[0],
          isAnonymous: false,
          emailVerified: false
        };
        
        // Save to our mock database
        users[email] = {
          ...linkedUser,
          password
        };
        saveUsersToStorage(users);
        
        // Update current user
        setCurrentUser(linkedUser);
        return linkedUser;
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Auto sign in anonymously on load if no user is present
  useEffect(() => {
    if (!currentUser) {
      authMethods.signInAnonymously();
    }
  }, []);

  const value = {
    currentUser,
    isLoading,
    ...authMethods,
    isAuthenticated: !!currentUser,
    isAnonymous: currentUser?.isAnonymous || false,
    isEmailVerified: currentUser?.emailVerified || false
  };

  return (
    <LocalAuthContext.Provider value={value}>
      {children}
    </LocalAuthContext.Provider>
  );
};

export default LocalAuthContext; 
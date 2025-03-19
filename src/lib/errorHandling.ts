import { FirebaseError } from 'firebase/app';
import { useNotifications } from '../contexts/NotificationContext';
import { Firestore } from 'firebase/firestore';

/**
 * Error handling utility for Firebase and other errors
 */

// Map Firebase error codes to user-friendly messages
const firebaseErrorMessages: Record<string, string> = {
  // Auth errors
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'Account not found. Please check your credentials or sign up.',
  'auth/wrong-password': 'Incorrect password. Please try again or reset your password.',
  'auth/email-already-in-use': 'This email is already in use. Please use a different email or sign in.',
  'auth/invalid-email': 'Invalid email address. Please check your email and try again.',
  'auth/weak-password': 'Password is too weak. Please use a stronger password.',
  'auth/requires-recent-login': 'This action requires you to sign in again for security reasons.',
  'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials.',
  
  // Firestore errors
  'permission-denied': 'You do not have permission to perform this operation.',
  'unavailable': 'The service is currently unavailable. Please try again later.',
  'not-found': 'The requested document was not found.',
  'already-exists': 'The document already exists.',
  'resource-exhausted': 'You have exceeded your quota. Please try again later.',
  'failed-precondition': 'The operation was rejected because the system is not in a state required for the operation.',
  'aborted': 'The operation was aborted, typically due to a concurrency issue.',
  'cancelled': 'The operation was cancelled.',
  
  // Generic fallbacks by error category
  'auth/': 'Authentication error. Please try again or contact support.',
  'firestore/': 'Database error. Please try again or contact support.',
  'storage/': 'Storage error. Please try again or contact support.',
  'functions/': 'Server function error. Please try again or contact support.',
};

// Parse Firebase errors and return user-friendly message
export function getFirebaseErrorMessage(error: FirebaseError): string {
  // Check for exact error code match
  if (error.code && firebaseErrorMessages[error.code]) {
    return firebaseErrorMessages[error.code];
  }
  
  // Check for error category match
  for (const errorPrefix in firebaseErrorMessages) {
    if (error.code && error.code.startsWith(errorPrefix) && 
        errorPrefix.endsWith('/')) {
      return firebaseErrorMessages[errorPrefix];
    }
  }
  
  // Fallback error message
  return error.message || 'An unexpected error occurred. Please try again.';
}

// Get error message from any type of error
export function getErrorMessage(error: unknown): string {
  // Handle Firebase errors
  if (error && typeof error === 'object' && 'code' in error) {
    return getFirebaseErrorMessage(error as FirebaseError);
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Fallback
  return 'An unexpected error occurred. Please try again.';
}

// Network error messages based on status code
export function getNetworkErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Bad request. Please check your input and try again.';
    case 401:
      return 'You are not authorized. Please sign in again.';
    case 403:
      return 'You do not have permission to access this resource.';
    case 404:
      return 'The requested resource was not found.';
    case 408:
      return 'Request timeout. Please check your connection and try again.';
    case 409:
      return 'Conflict with the current state of the resource.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later or contact support.';
    case 502:
      return 'Bad gateway. Please try again later.';
    case 503:
      return 'Service unavailable. Please try again later.';
    case 504:
      return 'Gateway timeout. Please try again later.';
    default:
      return status >= 500
        ? 'Server error. Please try again later or contact support.'
        : 'An error occurred. Please try again.';
  }
}

// Create a safe async function wrapper that catches errors
export function createSafeAsyncFunction<T extends (...args: unknown[]) => Promise<any>>(
  fn: T,
  errorHandler?: (error: unknown) => void
): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error);
      } else {
        console.error('Error in async operation:', error);
      }
      return null;
    }
  };
}

// Custom error types
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AppFirebaseError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'AppFirebaseError';
    this.code = code;
  }
}

export class ValidationError extends Error {
  field?: string;
  
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// Offline operation types
export interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId: string;
  data?: Record<string, any>;
  timestamp: number;
  retryCount: number;
}

// Function to queue operations for offline processing
export function queueOfflineOperation(
  type: OfflineOperation['type'],
  collection: string,
  docId: string,
  data?: Record<string, any>
): string {
  const operation: OfflineOperation = {
    id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    collection,
    docId,
    data,
    timestamp: Date.now(),
    retryCount: 0
  };
  
  // Get existing operations
  const existingOperations = getOfflineOperations();
  
  // Add new operation
  const updatedOperations = [...existingOperations, operation];
  
  // Save to localStorage
  localStorage.setItem('offlineOperations', JSON.stringify(updatedOperations));
  
  return operation.id;
}

// Function to get all pending offline operations
export function getOfflineOperations(): OfflineOperation[] {
  try {
    const operations = localStorage.getItem('offlineOperations');
    return operations ? JSON.parse(operations) : [];
  } catch (error) {
    console.error('Error retrieving offline operations:', error);
    return [];
  }
}

// Function to remove an operation from the queue
export function removeOfflineOperation(id: string): boolean {
  const operations = getOfflineOperations();
  const updatedOperations = operations.filter(op => op.id !== id);
  
  if (updatedOperations.length < operations.length) {
    localStorage.setItem('offlineOperations', JSON.stringify(updatedOperations));
    return true;
  }
  
  return false;
}

// Function to clear all offline operations
export function clearOfflineOperations(): void {
  localStorage.removeItem('offlineOperations');
}

// Helper function to determine if an error is a Firebase Auth error
export function isFirebaseAuthError(error: any): error is FirebaseError {
  return error && 
         typeof error === 'object' && 
         error.name === 'FirebaseError' && 
         error.code && 
         typeof error.code === 'string' && 
         error.code.startsWith('auth/');
}

// Helper function to determine if an error is a Firestore error
export function isFirestoreError(error: any): error is FirebaseError {
  return error && 
         typeof error === 'object' && 
         error.name === 'FirebaseError' && 
         error.code && 
         typeof error.code === 'string' && 
         (error.code.startsWith('firestore/') || error.code.includes('permission-denied'));
}

// Helper function to handle errors consistently
export function handleError(error: any, fallbackMessage: string = 'An error occurred') {
  console.error(error);
  
  if (error instanceof NetworkError) {
    return {
      message: error.message || 'Network connection error',
      type: 'error' as const,
      retry: true
    };
  }
  
  if (isFirebaseAuthError(error)) {
    return {
      message: getFirebaseAuthErrorMessage(error.code),
      type: 'error' as const,
      retry: false
    };
  }
  
  if (isFirestoreError(error)) {
    return {
      message: getFirestoreErrorMessage(error.code),
      type: 'error' as const,
      retry: error.code === 'firestore/unavailable' || error.code === 'firestore/network-request-failed'
    };
  }
  
  if (error instanceof ValidationError) {
    return {
      message: error.message,
      type: 'warning' as const,
      field: error.field,
      retry: false
    };
  }
  
  if (error instanceof AppFirebaseError) {
    return {
      message: error.message,
      type: 'error' as const,
      retry: false
    };
  }
  
  return {
    message: error.message || fallbackMessage,
    type: 'error' as const,
    retry: false
  };
}

// User-friendly Firebase Auth error messages
function getFirebaseAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/requires-recent-login':
      return 'Please log in again to complete this action.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return 'Authentication error. Please try again.';
  }
}

// User-friendly Firestore error messages
function getFirestoreErrorMessage(code: string): string {
  switch (code) {
    case 'firestore/cancelled':
      return 'The operation was cancelled.';
    case 'firestore/invalid-argument':
      return 'Invalid argument provided.';
    case 'firestore/deadline-exceeded':
      return 'Operation timed out.';
    case 'firestore/not-found':
      return 'The requested document was not found.';
    case 'firestore/permission-denied':
      return 'You don\'t have permission to perform this action.';
    case 'firestore/unauthenticated':
      return 'You must be logged in to perform this action.';
    case 'firestore/unavailable':
      return 'The service is currently unavailable. Please try again later.';
    case 'firestore/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'Database error. Please try again.';
  }
}

// Hook for error handling with notifications
export function useErrorHandler() {
  const { addNotification } = useNotifications();
  
  return (error: unknown, fallbackMessage: string = 'An error occurred') => {
    const { message, type } = handleError(error, fallbackMessage);
    
    addNotification({
      type: type,
      message: message
    });
    
    return message;
  };
}

// Check if the error is due to being offline
export function isOfflineError(error: any): boolean {
  if (error instanceof NetworkError) return true;
  
  if (isFirestoreError(error)) {
    return error.code === 'firestore/unavailable' || 
           error.code === 'firestore/network-request-failed';
  }
  
  return typeof error === 'object' && 
         (error.message?.includes('network') || 
          error.message?.includes('offline') || 
          error.message?.includes('internet') ||
          error.message?.includes('connection'));
}

// Function to safely execute a Firebase operation with offline fallback
export async function safeFirebaseOperation<T>(
  operation: () => Promise<T>,
  offlineCallback: () => void,
  fallbackValue?: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isOfflineError(error)) {
      offlineCallback();
      if (fallbackValue !== undefined) {
        return fallbackValue;
      }
    }
    throw error;
  }
} 
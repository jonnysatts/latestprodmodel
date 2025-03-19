import { useState, useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { getErrorMessage } from '../lib/errorHandling';
import { useNetworkStatus } from '../contexts/NetworkStatusContext';

interface UseFirebaseErrorHandlerOptions {
  showNotificationOnError?: boolean;
  notificationType?: 'error' | 'warning';
  notificationTitle?: string;
}

interface ErrorHandlerResult {
  error: Error | null;
  isLoading: boolean;
  clearError: () => void;
  handleError: (error: unknown, customMessage?: string) => void;
  withErrorHandling: <T>(asyncFn: () => Promise<T>) => Promise<T | null>;
}

/**
 * Hook for handling Firebase errors with integration to the notification system
 */
export function useFirebaseErrorHandler(
  options: UseFirebaseErrorHandlerOptions = {}
): ErrorHandlerResult {
  const { 
    showNotificationOnError = true,
    notificationType = 'error',
    notificationTitle = 'Error'
  } = options;
  
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { addNotification } = useNotifications();
  const { isOnline, isFirestoreConnected } = useNetworkStatus();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: unknown, customMessage?: string) => {
    const errorMessage = customMessage || getErrorMessage(error);
    
    // Set the error state
    if (error instanceof Error) {
      setError(error);
    } else {
      setError(new Error(errorMessage));
    }
    
    // Show notification if enabled
    if (showNotificationOnError) {
      // Check if it's a network-related error
      if (!isOnline) {
        addNotification({
          type: 'warning',
          title: 'Network Error',
          message: 'You are offline. Your changes will be saved locally and synced when you reconnect.',
        });
      } else if (!isFirestoreConnected) {
        addNotification({
          type: 'warning',
          title: 'Connection Error',
          message: 'Cannot connect to the database. Your changes will be saved locally and synced when the connection is restored.',
        });
      } else {
        addNotification({
          type: notificationType,
          title: notificationTitle,
          message: errorMessage,
        });
      }
    }

    // Log the error
    console.error('Firebase operation error:', error);
  }, [
    addNotification, 
    showNotificationOnError, 
    notificationType, 
    notificationTitle, 
    isOnline, 
    isFirestoreConnected
  ]);

  /**
   * Wrap an async function with error handling
   */
  const withErrorHandling = useCallback(
    async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
      setIsLoading(true);
      clearError();
      
      try {
        const result = await asyncFn();
        setIsLoading(false);
        return result;
      } catch (error) {
        handleError(error);
        setIsLoading(false);
        return null;
      }
    },
    [handleError, clearError]
  );

  return {
    error,
    isLoading,
    clearError,
    handleError,
    withErrorHandling,
  };
}

export default useFirebaseErrorHandler; 
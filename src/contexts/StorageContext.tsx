import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNotifications } from './NotificationContext';

// Storage mode key for localStorage
const STORAGE_MODE_KEY = 'storageMode';

// Define the storage modes
export type StorageMode = 'cloud' | 'local';

// Define the context shape
interface StorageContextType {
  storageMode: StorageMode;
  setStorageMode: (mode: StorageMode) => Promise<boolean>;
  isCloudAvailable: boolean;
  isInitializing: boolean;
  error: string | null;
}

// Create the context with a default value
const StorageContext = createContext<StorageContextType>({
  storageMode: 'local',
  setStorageMode: async () => false,
  isCloudAvailable: false,
  isInitializing: false,
  error: null
});

// Hook to use the storage context
export const useStorage = () => useContext(StorageContext);

// Provider component
interface StorageProviderProps {
  children: ReactNode;
}

export function StorageProvider({ children }: StorageProviderProps): JSX.Element {
  const [storageMode, setStorageModeState] = useState<StorageMode>('local');
  const [isCloudAvailable, setIsCloudAvailable] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  // Initialize storage settings
  useEffect(() => {
    const initializeStorage = async () => {
      setIsInitializing(true);
      setError(null);
      
      try {
        // Force local storage mode and don't try to check Firebase
        setIsCloudAvailable(false);
        setStorageModeState('local');
        localStorage.setItem(STORAGE_MODE_KEY, 'local');
      } catch (err) {
        console.error('Error initializing storage:', err);
        setError('Failed to initialize storage. Using local storage.');
        addNotification({
          type: 'error',
          message: 'Failed to initialize storage. Using local storage.'
        });
        setStorageModeState('local');
        localStorage.setItem(STORAGE_MODE_KEY, 'local');
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeStorage();
  }, [addNotification]);
  
  // Function to set storage mode
  const setStorageMode = async (mode: StorageMode): Promise<boolean> => {
    // Only allow local storage mode
    if (mode !== 'local') {
      setError('Only local storage mode is supported in this version.');
      addNotification({
        type: 'warning',
        message: 'Only local storage mode is supported in this version.'
      });
      return false;
    }
    
    // Update the storage mode
    setStorageModeState('local');
    localStorage.setItem(STORAGE_MODE_KEY, 'local');
    return true;
  };
  
  const value = {
    storageMode,
    setStorageMode,
    isCloudAvailable,
    isInitializing,
    error
  };
  
  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
} 
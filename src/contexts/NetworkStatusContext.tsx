import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, Firestore } from 'firebase/firestore';
import { getDb, isFirebaseInitialized } from '../lib/firebase';

// Define the NetworkStatus type
interface NetworkStatus {
  isOnline: boolean;
  connectionType: string | null;
  isConnectionPending: boolean;
}

// Define the context with default values
const NetworkStatusContext = createContext<NetworkStatus & {
  checkConnection: () => void;
}>({
  isOnline: true,
  connectionType: null,
  isConnectionPending: false,
  checkConnection: () => {}
});

// Hook to access the network status context
export const useNetworkStatus = () => useContext(NetworkStatusContext);

// Provider component for network status
export const NetworkStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for overall network status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  // State for connection type (e.g., 4g, wifi, etc.)
  const [connectionType, setConnectionType] = useState<string | null>(null);
  // State to track if we're still determining connection status
  const [isConnectionPending, setIsConnectionPending] = useState<boolean>(true);

  // Update connection type when available
  useEffect(() => {
    const updateConnectionType = () => {
      if ('connection' in navigator && navigator.connection) {
        // @ts-expect-error - Navigator connection API not fully typed
        const { effectiveType } = navigator.connection;
        setConnectionType(effectiveType);
      }
    };

    // Get initial connection type
    updateConnectionType();

    // Listen for connection changes
    // @ts-expect-error - Navigator connection API not fully typed
    if ('connection' in navigator && navigator.connection?.addEventListener) {
      // @ts-expect-error - Navigator connection API not fully typed
      navigator.connection.addEventListener('change', updateConnectionType);
      return () => {
        // @ts-expect-error - Navigator connection API not fully typed
        navigator.connection.removeEventListener('change', updateConnectionType);
      };
    }
  }, []);

  // Monitor navigator.onLine status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // When we reconnect, we should re-check if Firestore is available
      checkFirestoreConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsConnectionPending(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Function to check Firestore connection
  const checkFirestoreConnection = () => {
    setIsConnectionPending(true);
    
    // Only check Firestore if it's initialized
    if (!isFirebaseInitialized()) {
      setIsConnectionPending(false);
      return;
    }
    
    try {
      // Attempt to connect to Firestore's special .info/connected document
      // This will tell us if we can reach Firebase's servers
      const db = getDb() as unknown as Firestore;
      
      const unsubscribe = onSnapshot(
        doc(db, '.info/connected'),
        (snapshot) => {
          const connected = snapshot.exists() && snapshot.data()?.connected === true;
          
          if (connected) {
            setIsConnectionPending(false);
          } else {
            // If not connected after a timeout, consider it failed
            setTimeout(() => {
              setIsConnectionPending(false);
            }, 5000);
          }
        },
        (error) => {
          console.error('Firestore connection error:', error);
          setIsConnectionPending(false);
        }
      );

      // Clean up the listener after a timeout
      setTimeout(() => {
        unsubscribe();
      }, 10000);
    } catch (error) {
      console.error('Error checking Firestore connection:', error);
      setIsConnectionPending(false);
    }
  };

  // Initial check
  useEffect(() => {
    if (isOnline) {
      checkFirestoreConnection();
    }
  }, []);

  // Function to manually check connection
  const checkConnection = () => {
    if (navigator.onLine) {
      checkFirestoreConnection();
    } else {
      setIsOnline(false);
      setIsConnectionPending(false);
    }
  };

  return (
    <NetworkStatusContext.Provider 
      value={{ 
        isOnline, 
        connectionType, 
        isConnectionPending, 
        checkConnection 
      }}
    >
      {children}
    </NetworkStatusContext.Provider>
  );
};

export default NetworkStatusProvider; 
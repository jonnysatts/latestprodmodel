import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the network status context shape
interface NetworkStatusContextType {
  isOnline: boolean;
  connectionType: string; // 'wifi', 'cellular', 'unknown', etc.
  lastOnlineAt: Date | null;
  checkConnection: () => Promise<boolean>;
}

// Create the context with default values
const NetworkStatusContext = createContext<NetworkStatusContextType>({
  isOnline: true,
  connectionType: 'unknown',
  lastOnlineAt: null,
  checkConnection: async () => true,
});

// Hook to use the network status context
export const useNetworkStatus = () => useContext(NetworkStatusContext);

// Provider component
interface NetworkStatusProviderProps {
  children: ReactNode;
}

export function NetworkStatusProvider({ children }: NetworkStatusProviderProps): JSX.Element {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(new Date());

  // Function to check the current connection status
  const checkConnection = async (): Promise<boolean> => {
    // Simple check using navigator.onLine as a baseline
    const online = navigator.onLine;
    setIsOnline(online);
    
    if (online && lastOnlineAt === null) {
      setLastOnlineAt(new Date());
    }
    
    return online;
  };

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineAt(new Date());
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    // Detect connection type changes using the Network Information API (if available)
    const detectConnectionType = () => {
      // @ts-expect-error Connection property not in standard Navigator type
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        setConnectionType(connection.effectiveType || connection.type || 'unknown');
        
        // Listen for connection changes
        connection.addEventListener('change', detectConnectionType);
      }
    };
    
    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial detection
    detectConnectionType();
    checkConnection();
    
    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // @ts-expect-error Connection property not in standard Navigator type
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        connection.removeEventListener('change', detectConnectionType);
      }
    };
  }, [lastOnlineAt]);

  // Context value
  const value = {
    isOnline,
    connectionType,
    lastOnlineAt,
    checkConnection,
  };

  return (
    <NetworkStatusContext.Provider value={value}>
      {children}
    </NetworkStatusContext.Provider>
  );
} 
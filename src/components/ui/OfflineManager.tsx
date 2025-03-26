import React, { useEffect, useState } from 'react';
import { useNetworkStatus } from '../../contexts/NetworkStatusContext';
import { AlertTriangle, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';

export function OfflineManager() {
  const { isOnline } = useNetworkStatus();
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);
  
  useEffect(() => {
    // Only show the offline warning if the user is actually offline
    setShowOfflineWarning(!isOnline);
    
    // Auto-hide the warning after 5 seconds when coming back online
    if (isOnline && showOfflineWarning) {
      const timer = setTimeout(() => {
        setShowOfflineWarning(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOfflineWarning]);
  
  if (!showOfflineWarning) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert variant="destructive" className="flex items-center">
        <WifiOff className="h-4 w-4 mr-2" />
        <div>
          <AlertTitle className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Offline Mode
          </AlertTitle>
          <AlertDescription>
            You are currently offline. Your changes will be saved locally and synchronized when you reconnect.
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
} 
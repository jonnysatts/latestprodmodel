import { useState, useEffect } from 'react';
import { useHybridStore } from './useHybridStore';
import { StorageMode } from '../types/custom-types';

/**
 * Hook for syncing data between local storage and Firebase
 */
export const useStorageSync = () => {
  const { 
    storageMode, 
    setStorageMode, 
    isFirebaseAvailable 
  } = useHybridStore();
  
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Toggle storage mode
  const toggleStorageMode = () => {
    const newMode: StorageMode = storageMode === 'local' ? 'firebase' : 'local';
    setStorageMode(newMode);
  };
  
  // Sync data manually
  const syncData = async () => {
    try {
      setSyncStatus('syncing');
      
      // Wait a moment to simulate network activity
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would actually sync data
      setSyncStatus('success');
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error syncing data:', error);
      setSyncStatus('error');
    }
  };
  
  // Sync automatically when switching to Firebase mode
  useEffect(() => {
    if (storageMode === 'firebase' && isFirebaseAvailable) {
      syncData();
    }
  }, [storageMode, isFirebaseAvailable]);
  
  return {
    storageMode,
    toggleStorageMode,
    syncData,
    syncStatus,
    lastSyncTime,
    isFirebaseAvailable
  };
};

// Also export as default for backward compatibility
export default useStorageSync; 
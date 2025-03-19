import React, { useState, useEffect } from 'react';
import { useNetworkStatus } from '../../contexts/NetworkStatusContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { doc, updateDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from './button';

interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId: string;
  data?: Record<string, any>;
  timestamp: number;
}

interface OfflineManagerProps {
  autoSync?: boolean;
}

const OfflineManager: React.FC<OfflineManagerProps> = ({ autoSync = true }) => {
  const { isOnline } = useNetworkStatus();
  const { addNotification } = useNotifications();
  
  const [pendingOperations, setPendingOperations] = useState<OfflineOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  // Load pending operations from localStorage
  useEffect(() => {
    const storedOperations = localStorage.getItem('offlineOperations');
    if (storedOperations) {
      try {
        setPendingOperations(JSON.parse(storedOperations));
      } catch (error) {
        console.error('Failed to parse stored operations:', error);
        localStorage.removeItem('offlineOperations');
      }
    }
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && autoSync && pendingOperations.length > 0 && !isSyncing) {
      syncOfflineOperations();
    }
  }, [isOnline, pendingOperations.length, autoSync]);

  // Function to sync offline operations with Firestore
  const syncOfflineOperations = async () => {
    if (!isOnline || pendingOperations.length === 0 || isSyncing) {
      return;
    }

    setIsSyncing(true);
    setSyncProgress(0);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < pendingOperations.length; i++) {
      const operation = pendingOperations[i];
      
      try {
        if (operation.type === 'update' && operation.data) {
          // Update document in Firestore
          await updateDoc(
            doc(db as Firestore, operation.collection, operation.docId), 
            operation.data
          );
        } else if (operation.type === 'delete') {
          // Delete document from Firestore
          await deleteDoc(doc(db as Firestore, operation.collection, operation.docId));
        }
        // Note: 'create' would use addDoc, but we'll implement that when needed
        
        successCount++;
      } catch (error) {
        console.error(`Failed to sync operation: ${operation.id}`, error);
        failCount++;
      }
      
      // Update progress
      setSyncProgress(Math.round(((i + 1) / pendingOperations.length) * 100));
    }
    
    // Remove synchronized operations
    if (successCount > 0) {
      setPendingOperations([]);
      localStorage.removeItem('offlineOperations');
      
      addNotification({
        type: 'success',
        message: `Successfully synchronized ${successCount} offline ${successCount === 1 ? 'operation' : 'operations'}`
      });
    }
    
    if (failCount > 0) {
      addNotification({
        type: 'error',
        message: `Failed to synchronize ${failCount} offline ${failCount === 1 ? 'operation' : 'operations'}`
      });
    }
    
    setIsSyncing(false);
    setSyncProgress(0);
  };

  if (pendingOperations.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-md max-w-xs">
      <h3 className="font-medium text-yellow-800 mb-2">Offline Changes Pending</h3>
      <p className="text-sm text-yellow-700 mb-3">
        {pendingOperations.length} {pendingOperations.length === 1 ? 'change is' : 'changes are'} waiting to be synchronized
      </p>
      
      {isSyncing ? (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-yellow-600 h-2.5 rounded-full" 
              style={{ width: `${syncProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-yellow-700">Synchronizing... {syncProgress}%</p>
        </div>
      ) : (
        <Button 
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white" 
          disabled={!isOnline || isSyncing}
          onClick={syncOfflineOperations}
        >
          {isOnline ? 'Sync Now' : 'Waiting for Connection...'}
        </Button>
      )}
    </div>
  );
};

export default OfflineManager; 
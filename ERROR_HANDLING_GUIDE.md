# Error Handling & Network Status Monitoring Guide

This guide explains the comprehensive error handling and network status monitoring system implemented in the application.

## Overview

The system provides:

1. **Network Status Monitoring** - Track online/offline status and Firebase connection state
2. **User Notifications** - Display errors, warnings, and information messages
3. **Offline Operation Support** - Queue operations when offline and sync when reconnected
4. **Firebase Error Handling** - Centralized error handling for Firebase operations
5. **Error Boundary** - Catch and display React component errors

## Components

### 1. Network Status Context (`NetworkStatusContext.tsx`)

This context provides real-time information about the network and Firebase connection state.

```tsx
// Example usage
import { useNetworkStatus } from '../contexts/NetworkStatusContext';

function MyComponent() {
  const { isOnline, isFirestoreConnected, connectionState } = useNetworkStatus();
  
  if (!isOnline) {
    return <p>You are offline. Your changes will be saved locally.</p>;
  }
  
  return <p>You are online!</p>;
}
```

#### States

- `isOnline` - Browser's online/offline status
- `isFirestoreConnected` - Firebase Firestore connection status
- `connectionState` - Combined connection state ('online', 'offline', 'reconnecting', 'firebase-disconnected')
- `lastOnlineAt` - Timestamp of when the user was last online

### 2. Notification Context (`NotificationContext.tsx`)

This context manages application notifications for errors, warnings, and information messages.

```tsx
// Example usage
import { useNotifications } from '../contexts/NotificationContext';

function MyComponent() {
  const { addNotification, removeNotification, clearNotifications } = useNotifications();
  
  const handleError = () => {
    addNotification({
      type: 'error',
      title: 'Operation Failed',
      message: 'Unable to save changes. Please try again.',
    });
  };
  
  return <button onClick={handleError}>Test Error</button>;
}
```

#### Notification Types

- `info` - General information (blue)
- `success` - Success messages (green)
- `warning` - Warning messages (yellow)
- `error` - Error messages (red)

### 3. Error Handling Utilities (`errorHandling.ts`)

This file contains utilities for handling different types of errors, including Firebase-specific errors.

```tsx
// Example usage
import { getErrorMessage, createSafeAsyncFunction } from '../lib/errorHandling';

// Get user-friendly error message
const errorMessage = getErrorMessage(error);

// Create a safe function that catches errors
const safeFunction = createSafeAsyncFunction(
  async () => await firebase.saveData(),
  (error) => console.error('Failed to save:', error)
);

// Queue offline operations
const saveOffline = () => {
  queueOfflineOperation('update', 'products/123', { name: 'Updated Product' });
};
```

### 4. Firebase Error Handler Hook (`useFirebaseErrorHandler.ts`)

This hook simplifies error handling for Firebase operations.

```tsx
// Example usage
import { useFirebaseErrorHandler } from '../hooks/useFirebaseErrorHandler';

function ProductEditor() {
  const { 
    error, 
    isLoading, 
    withErrorHandling 
  } = useFirebaseErrorHandler({
    showNotificationOnError: true,
    notificationTitle: 'Product Error'
  });
  
  const saveProduct = async (data) => {
    return withErrorHandling(async () => {
      await firebase.saveProduct(data);
      return true;
    });
  };
  
  return (
    <div>
      {error && <p className="text-red-500">{error.message}</p>}
      <button 
        onClick={() => saveProduct({ name: 'New Product' })}
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Save Product'}
      </button>
    </div>
  );
}
```

### 5. UI Components

#### NetworkStatusIndicator

Displays the current network status in the UI.

```tsx
// Example usage
import NetworkStatusIndicator from '../components/ui/NetworkStatusIndicator';

<NetworkStatusIndicator showText={true} />
```

#### Notifications

Displays notification messages from the notification context.

```tsx
// Placed in the App component to show notifications globally
import Notifications from '../components/ui/Notifications';

<Notifications />
```

#### OfflineManager

Manages and synchronizes offline operations when reconnected.

```tsx
// Placed in the App component to handle offline operations globally
import OfflineManager from '../components/ui/OfflineManager';

<OfflineManager autoSync={true} />
```

#### ErrorBoundary

Catches and displays React component errors.

```tsx
// Wrap components that might throw errors
import ErrorBoundary from '../components/ui/error-boundary';

<ErrorBoundary>
  <RiskyComponent />
</ErrorBoundary>
```

## Integration with Firebase

### Error Handling for Database Operations

```tsx
// Example of a component handling Firebase errors properly
function ProductList() {
  const { withErrorHandling, isLoading } = useFirebaseErrorHandler();
  const { isOnline } = useNetworkStatus();
  const [products, setProducts] = useState([]);
  
  // Load products with error handling
  const loadProducts = async () => {
    await withErrorHandling(async () => {
      // If offline, load from localStorage
      if (!isOnline) {
        const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
        setProducts(localProducts);
        return;
      }
      
      // Otherwise load from Firebase
      const snapshot = await firebase.collection('products').get();
      const productsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Cache the result in localStorage for offline access
      localStorage.setItem('products', JSON.stringify(productsList));
      
      setProducts(productsList);
    });
  };
  
  useEffect(() => {
    loadProducts();
  }, []);
  
  if (isLoading) {
    return <p>Loading products...</p>;
  }
  
  return (
    <div>
      <h2>Products</h2>
      <ul>
        {products.map(product => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
      {!isOnline && <p className="text-yellow-600">You are viewing cached data (offline mode)</p>}
    </div>
  );
}
```

### Offline Data Modifications

```tsx
// Example of handling data changes while offline
function ProductEditor({ productId }) {
  const { withErrorHandling, isLoading } = useFirebaseErrorHandler();
  const { isOnline } = useNetworkStatus();
  const { addNotification } = useNotifications();
  const [product, setProduct] = useState(null);
  
  // Save changes with offline support
  const saveChanges = async (data) => {
    // If online, save directly to Firebase
    if (isOnline) {
      return withErrorHandling(async () => {
        await firebase.doc(`products/${productId}`).update(data);
        setProduct(prev => ({ ...prev, ...data }));
        
        addNotification({
          type: 'success',
          message: 'Product updated successfully',
        });
      });
    } 
    
    // If offline, queue the operation and update local state
    try {
      // Queue for later sync
      queueOfflineOperation('update', `products/${productId}`, data);
      
      // Update local state
      setProduct(prev => ({ ...prev, ...data }));
      
      // Notify user
      addNotification({
        type: 'warning',
        title: 'Offline Mode',
        message: 'Changes saved locally and will sync when you reconnect',
      });
      
      return true;
    } catch (error) {
      console.error('Failed to save offline:', error);
      addNotification({
        type: 'error',
        message: 'Failed to save changes offline',
      });
      return false;
    }
  };
  
  return (
    <div>
      {!isOnline && <p className="text-yellow-600">Offline Mode - Changes will sync later</p>}
      <button 
        onClick={() => saveChanges({ name: 'Updated Name' })}
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Update Product'}
      </button>
    </div>
  );
}
```

## Best Practices

### 1. Always Check Network Status

Before performing Firebase operations, check if the user is online:

```tsx
const { isOnline, isFirestoreConnected } = useNetworkStatus();

if (!isOnline || !isFirestoreConnected) {
  // Use offline fallback
} else {
  // Proceed with Firebase operation
}
```

### 2. Use the Error Handler Hook

Wrap Firebase operations with the error handler hook:

```tsx
const { withErrorHandling } = useFirebaseErrorHandler();

const result = await withErrorHandling(async () => {
  // Firebase operation here
  return await firebase.saveData();
});

if (result) {
  // Operation succeeded
}
```

### 3. Cache Data for Offline Access

Store critical data in localStorage for offline access:

```tsx
// After fetching data
const data = await fetchDataFromFirebase();
localStorage.setItem('cachedData', JSON.stringify(data));

// When accessing data
const getData = () => {
  if (!isOnline) {
    return JSON.parse(localStorage.getItem('cachedData') || '[]');
  }
  return fetchDataFromFirebase();
};
```

### 4. Queue Offline Changes

When offline, queue changes for later synchronization:

```tsx
if (!isOnline) {
  queueOfflineOperation('update', 'products/123', updatedData);
} else {
  await firebase.updateProduct('123', updatedData);
}
```

### 5. Provide Clear User Feedback

Always inform users about the network status and operation results:

```tsx
// Network status indicator in important forms
{!isOnline && (
  <div className="bg-yellow-50 p-2 rounded border border-yellow-200 text-yellow-700 mb-4">
    You are currently offline. Changes will be saved locally and synchronized when you reconnect.
  </div>
)}

// Operation result feedback
const saveData = async () => {
  const success = await withErrorHandling(async () => {
    await firebase.saveData();
    return true;
  });
  
  if (success) {
    addNotification({
      type: 'success',
      message: 'Data saved successfully'
    });
  }
};
```

## Troubleshooting

### Common Issues

1. **Stale Offline Data**: If users complain about outdated data when offline, ensure you're properly caching the latest data after each fetch.

2. **Failed Sync After Reconnection**: Check that the OfflineManager component is properly mounted and that offline operations are correctly queued.

3. **Inconsistent Network Status**: The NetworkStatusContext monitors both browser online status and Firebase connection status. Make sure both are checked for critical operations.

4. **Missing Error Messages**: Ensure errors are properly caught and passed to the notification system. Use the withErrorHandling wrapper to simplify this.

5. **Error Notifications Not Showing**: Verify that the NotificationProvider is mounted near the root of your application and that Notifications component is present in the DOM.

### Debugging

Enable verbose logging for network and error issues:

```tsx
// In development environment, add this to your main index file
if (process.env.NODE_ENV === 'development') {
  localStorage.setItem('debug', 'app:network,app:error');
}

// Then use in your code
const debug = (area, ...args) => {
  if (localStorage.getItem('debug')?.includes(area)) {
    console.log(`[${area}]`, ...args);
  }
};

debug('app:network', 'Connection status changed:', isOnline);
```

---

By following these guidelines, your application will provide a robust user experience with proper error handling and offline support. 
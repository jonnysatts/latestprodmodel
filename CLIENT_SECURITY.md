# Client-Side Security Implementation

This guide explains how to adapt your application code to work with the Firebase security rules and handle security-related errors properly.

## Working with Authentication

### Ensuring Authentication Before Database Operations

Always check that the user is authenticated before attempting database operations:

```typescript
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, Firestore } from 'firebase/firestore';

function ProductList() {
  const auth = useAuth();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch data if authenticated
    if (!auth.isAuthenticated) {
      return;
    }

    const fetchProducts = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db as Firestore, 'products'));
        const productsList = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsList);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
      }
    };

    fetchProducts();
  }, [auth.isAuthenticated]);

  // Render UI with products or error message
}
```

## Error Handling for Permission Denials

When security rules reject an operation, Firebase returns a specific error. Handle these errors gracefully:

```typescript
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, Firestore } from 'firebase/firestore';

function updateProduct(productId, updates) {
  const auth = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  
  const handleUpdate = async () => {
    if (!auth.isAuthenticated) {
      setError('You must be logged in to update products');
      return;
    }
    
    setIsUpdating(true);
    setError(null);
    
    try {
      await updateDoc(doc(db as Firestore, 'products', productId), updates);
      // Success handling
    } catch (err) {
      console.error('Error updating product:', err);
      
      // Check for permission-denied error
      if (err.code === 'permission-denied') {
        setError('You do not have permission to update this product');
      } else {
        setError('Failed to update the product. Please try again.');
      }
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Return the function and state
  return { handleUpdate, isUpdating, error };
}
```

## Data Validation Matching Security Rules

Implement client-side validation that matches your security rules to provide immediate feedback:

```typescript
function validateProduct(product) {
  const errors = {};
  
  // Check product info exists
  if (!product.info) {
    errors.info = 'Product information is required';
  } else {
    // Check product name
    if (!product.info.name) {
      errors.name = 'Product name is required';
    } else if (typeof product.info.name !== 'string') {
      errors.name = 'Product name must be text';
    }
    
    // Check product type
    if (!product.info.type) {
      errors.type = 'Product type is required';
    } else if (typeof product.info.type !== 'string') {
      errors.type = 'Product type must be text';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
```

## Handling User-Specific Data

When working with user-specific data, always include the user ID in the path:

```typescript
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';

function useUserPreferences() {
  const auth = useAuth();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch if user is authenticated
    if (!auth.isAuthenticated || !auth.currentUser) {
      setLoading(false);
      return;
    }

    const userId = auth.currentUser.uid;
    
    const fetchPreferences = async () => {
      try {
        const prefsDoc = await getDoc(doc(db as Firestore, 'users', userId, 'preferences', 'default'));
        
        if (prefsDoc.exists()) {
          setPreferences(prefsDoc.data());
        } else {
          // Initialize default preferences
          const defaultPrefs = {
            theme: 'light',
            notifications: true,
            // other defaults
          };
          
          await setDoc(doc(db as Firestore, 'users', userId, 'preferences', 'default'), defaultPrefs);
          setPreferences(defaultPrefs);
        }
      } catch (err) {
        console.error('Error fetching user preferences:', err);
        setError('Failed to load your preferences');
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [auth.currentUser, auth.isAuthenticated]);

  // Function to update preferences
  const updatePreferences = async (newPrefs) => {
    if (!auth.isAuthenticated || !auth.currentUser) {
      setError('You must be logged in to update preferences');
      return;
    }

    const userId = auth.currentUser.uid;
    
    try {
      await setDoc(
        doc(db as Firestore, 'users', userId, 'preferences', 'default'), 
        { ...preferences, ...newPrefs },
        { merge: true }
      );
      
      setPreferences(prev => ({ ...prev, ...newPrefs }));
      return true;
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('Failed to update your preferences');
      return false;
    }
  };

  return { preferences, loading, error, updatePreferences };
}
```

## Tracking Migration Status

For features like data migration, ensure you're tracking per-user:

```typescript
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';

async function checkMigrationStatus() {
  const auth = useAuth();
  
  if (!auth.isAuthenticated || !auth.currentUser) {
    return { migrated: false, error: 'Authentication required' };
  }
  
  const userId = auth.currentUser.uid;
  
  try {
    const migrationDoc = await getDoc(doc(db as Firestore, 'migrations', userId));
    
    return {
      migrated: migrationDoc.exists() && migrationDoc.data().completed === true,
      migrationData: migrationDoc.exists() ? migrationDoc.data() : null
    };
  } catch (err) {
    console.error('Error checking migration status:', err);
    return { 
      migrated: false, 
      error: 'Failed to check migration status'
    };
  }
}

async function updateMigrationStatus(status) {
  const auth = useAuth();
  
  if (!auth.isAuthenticated || !auth.currentUser) {
    return { success: false, error: 'Authentication required' };
  }
  
  const userId = auth.currentUser.uid;
  
  try {
    await setDoc(
      doc(db as Firestore, 'migrations', userId),
      status,
      { merge: true }
    );
    
    return { success: true };
  } catch (err) {
    console.error('Error updating migration status:', err);
    return { 
      success: false, 
      error: 'Failed to update migration status'
    };
  }
}
```

## Best Practices for Security

1. **Never Trust Client-Side Validation Alone**
   - Client-side validation is for user experience
   - Always depend on server-side rules for actual security

2. **Handle Errors Gracefully**
   - Provide user-friendly error messages
   - Don't expose sensitive details in error messages

3. **Use Role-Based UI**
   - Only show UI elements for actions the user can perform
   - This reduces unnecessary permission-denied errors

4. **Monitor Auth State**
   - React to auth state changes
   - Redirect to login when authentication is lost

5. **Logging Out**
   - Clear sensitive data from state when logging out
   - Ensure that navigation to protected routes is blocked

```typescript
function handleLogout() {
  auth.logout().then(() => {
    // Clear any sensitive application state
    clearProductData();
    clearUserData();
    
    // Navigate to login page
    navigate('/auth');
  });
}
```

## Testing Security

Test your application's behavior when security rules deny access:

1. Try accessing data with an unauthenticated user
2. Try accessing another user's data
3. Try manipulating data in ways that should be prevented by validation rules

This helps ensure your error handling works correctly and your UI handles permission errors appropriately.

---

By following these patterns, your client application will work harmoniously with the Firebase security rules, providing good user experience while maintaining security. 
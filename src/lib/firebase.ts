// Simplified Firebase stub for local-only usage
// This provides mock implementations that don't depend on actual Firebase

// Create mock implementations of Firebase interfaces
export interface FallbackFirestore {
  collection: (path: string) => any;
  doc: (path: string) => any;
  type: 'firestore';
}

export interface FallbackAuth {
  currentUser: null;
  onAuthStateChanged: (callback: (user: null) => void) => void;
  signInAnonymously: () => Promise<{user: {uid: string}}>;
  signOut: () => Promise<void>;
  type: 'auth';
}

// Create a simple local-only implementation of Firestore
const createFallbackFirestore = (): FallbackFirestore => ({
  collection: () => ({
    add: (data: any) => Promise.resolve({ id: 'local-' + Date.now() }),
    doc: (id: string) => ({
      get: () => Promise.resolve({ exists: false, data: () => ({}) }),
      set: (data: any) => Promise.resolve(),
      update: (data: any) => Promise.resolve(),
      delete: () => Promise.resolve()
    }),
    get: () => Promise.resolve({ docs: [] })
  }),
  doc: (path: string) => ({
    get: () => Promise.resolve({ exists: false, data: () => ({}) }),
    set: (data: any) => Promise.resolve(),
    update: (data: any) => Promise.resolve(),
    delete: () => Promise.resolve()
  }),
  type: 'firestore'
});

// Create a simple local-only implementation of Auth
const createFallbackAuth = (): FallbackAuth => ({
  currentUser: null,
  onAuthStateChanged: (callback) => {
    callback(null);
    return () => {};
  },
  signInAnonymously: () => Promise.resolve({ user: { uid: 'anonymous-' + Date.now() } }),
  signOut: () => Promise.resolve(),
  type: 'auth'
});

// Create and export the fallback instances
export const db = createFallbackFirestore();
export const auth = createFallbackAuth();
export const analytics = null;

// Stubbed functions to maintain API compatibility
export const isFirebaseInitialized = () => false;
export const isFirebaseConfigAvailable = () => false;
export const initializeFirebase = async () => false;
export const resetFirebase = () => {};
export const getDb = () => db;
export const getFirebaseAuth = () => auth; 
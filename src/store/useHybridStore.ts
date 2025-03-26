import { create } from 'zustand';

// Define a type for the store state
interface LocalStoreState {
  data: Record<string, unknown>;
  isLoaded: boolean;
  initialize: () => Promise<void>;
  saveData: (newData: Record<string, unknown>) => void;
  generateId: () => string;
}

/**
 * A local storage-based store hook
 * 
 * This provides persistent storage for application data using localStorage.
 */
const useLocalStore = create<LocalStoreState>((set) => ({
  data: {},
  isLoaded: false,
  
  // Initialize data from localStorage
  initialize: async () => {
    try {
      const savedData = localStorage.getItem('local-store');
      if (savedData) {
        set({ data: JSON.parse(savedData), isLoaded: true });
      } else {
        set({ data: {}, isLoaded: true });
      }
    } catch (error) {
      console.error('Error initializing local store:', error);
      set({ data: {}, isLoaded: true });
    }
  },
  
  // Save data to localStorage
  saveData: (newData: Record<string, unknown>) => {
    set((state: LocalStoreState) => {
      const updatedData = { ...state.data, ...newData };
      try {
        localStorage.setItem('local-store', JSON.stringify(updatedData));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      return { data: updatedData };
    });
  },
  
  // Generate unique ID (to replace Firebase IDs)
  generateId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}));

export default useLocalStore; 
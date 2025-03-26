import { v4 as uuidv4 } from 'uuid';
import type { 
  Product, 
  ScenarioModel,
  WeeklyActuals,
  MarketingChannelItem
} from '../types';

// Storage keys
export const PRODUCTS_KEY = 'fortress-products';
export const SCENARIOS_KEY = 'fortress-scenarios';
export const ACTUALS_KEY = 'fortress-actuals';
export const MARKETING_CHANNELS_KEY = 'fortress-marketing-channels';
export const CURRENT_PRODUCT_KEY = 'currentProductId';
export const RECENTLY_VIEWED_KEY = 'recentlyViewed';
export const USER_SETTINGS_KEY = 'userSettings';

// Event system for data changes
type StorageEventType = 'products' | 'scenarios' | 'actuals' | 'marketingChannels' | 'settings';
type StorageEventCallback = (data: any) => void;
const eventListeners: Record<StorageEventType, StorageEventCallback[]> = {
  products: [],
  scenarios: [],
  actuals: [],
  marketingChannels: [],
  settings: []
};

// Helper function to emit events
const emitEvent = (eventType: StorageEventType, data: any) => {
  eventListeners[eventType].forEach(listener => listener(data));
};

// Add event listener
export const addStorageEventListener = (eventType: StorageEventType, callback: StorageEventCallback) => {
  eventListeners[eventType].push(callback);
  return () => {
    const index = eventListeners[eventType].indexOf(callback);
    if (index > -1) {
      eventListeners[eventType].splice(index, 1);
    }
  };
};

// Product functions
export const getProducts = (): Product[] => {
  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    if (!data) return [];
    
    const products = JSON.parse(data);
    if (!Array.isArray(products)) {
      console.warn('Products data is not an array, returning empty array');
      return [];
    }
    
    // Ensure all products have the required fields
    return products.map((product: Product) => {
      if (!product.actuals) product.actuals = [];
      return product;
    });
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
};

export const saveProduct = (product: Product): void => {
  try {
    const products = getProducts();
    const index = products.findIndex(p => p.info.id === product.info.id);
    
    if (index >= 0) {
      // Update existing product
      products[index] = product;
    } else {
      // Add new product
      products.push(product);
    }
    
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    emitEvent('products', products);
  } catch (error) {
    console.error('Error saving product:', error);
  }
};

export const deleteProduct = (productId: string): void => {
  try {
    const products = getProducts();
    const updatedProducts = products.filter(p => p.info.id !== productId);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));
    emitEvent('products', updatedProducts);
  } catch (error) {
    console.error('Error deleting product:', error);
  }
};

// Scenario functions
export const getScenarios = (): ScenarioModel[] => {
  try {
    const data = localStorage.getItem(SCENARIOS_KEY);
    if (!data) return [];
    
    const scenarios = JSON.parse(data);
    if (!Array.isArray(scenarios)) {
      console.warn('Scenarios data is not an array, returning empty array');
      return [];
    }
    
    return scenarios;
  } catch (error) {
    console.error('Error loading scenarios:', error);
    return [];
  }
};

export const saveScenario = (scenario: ScenarioModel): void => {
  try {
    const scenarios = getScenarios();
    const index = scenarios.findIndex(s => s.id === scenario.id);
    
    if (index >= 0) {
      // Update existing scenario
      scenarios[index] = scenario;
    } else {
      // Add new scenario
      scenarios.push(scenario);
    }
    
    localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
    emitEvent('scenarios', scenarios);
  } catch (error) {
    console.error('Error saving scenario:', error);
  }
};

export const deleteScenario = (scenarioId: string): void => {
  try {
    const scenarios = getScenarios();
    const updatedScenarios = scenarios.filter(s => s.id !== scenarioId);
    localStorage.setItem(SCENARIOS_KEY, JSON.stringify(updatedScenarios));
    emitEvent('scenarios', updatedScenarios);
  } catch (error) {
    console.error('Error deleting scenario:', error);
  }
};

// User settings
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  dateFormat: string;
  notifications: boolean;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'system',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  notifications: true
};

export const getUserSettings = (): UserSettings => {
  try {
    const data = localStorage.getItem(USER_SETTINGS_KEY);
    if (!data) return DEFAULT_USER_SETTINGS;
    
    return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(data) };
  } catch (error) {
    console.error('Error loading user settings:', error);
    return DEFAULT_USER_SETTINGS;
  }
};

export const saveUserSettings = (settings: Partial<UserSettings>): void => {
  try {
    const currentSettings = getUserSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(updatedSettings));
    emitEvent('settings', updatedSettings);
  } catch (error) {
    console.error('Error saving user settings:', error);
  }
};

// Current product ID
export const getCurrentProductId = (): string | null => {
  return localStorage.getItem(CURRENT_PRODUCT_KEY);
};

export const setCurrentProductId = (productId: string | null): void => {
  if (productId) {
    localStorage.setItem(CURRENT_PRODUCT_KEY, productId);
  } else {
    localStorage.removeItem(CURRENT_PRODUCT_KEY);
  }
};

// Recently viewed
export const getRecentlyViewed = (): string[] => {
  try {
    const data = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!data) return [];
    
    const recentlyViewed = JSON.parse(data);
    if (!Array.isArray(recentlyViewed)) {
      return [];
    }
    
    return recentlyViewed;
  } catch (error) {
    console.error('Error loading recently viewed:', error);
    return [];
  }
};

export const addToRecentlyViewed = (productId: string): void => {
  try {
    const recentlyViewed = getRecentlyViewed();
    // Remove the product if it exists already to avoid duplicates
    const filtered = recentlyViewed.filter(id => id !== productId);
    // Add to the beginning of the array
    filtered.unshift(productId);
    // Limit to 10 items
    const limited = filtered.slice(0, 10);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error('Error updating recently viewed:', error);
  }
};

// Authentication simulation
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
}

let currentUser: User | null = null;

export const getCurrentUser = (): User | null => {
  return currentUser;
};

export const signInAnonymously = (): User => {
  const user: User = {
    id: uuidv4(),
    email: `anonymous-${uuidv4().substring(0, 8)}@example.com`,
    displayName: 'Guest User',
    isAnonymous: true,
    emailVerified: false
  };
  currentUser = user;
  return user;
};

export const signOut = (): void => {
  currentUser = null;
};

// Generate unique IDs (to replace Firebase IDs)
export const generateId = (): string => {
  return uuidv4();
};

// Data export & import functionality
export const exportAllData = (): string => {
  const data = {
    products: getProducts(),
    scenarios: getScenarios(),
    settings: getUserSettings()
  };
  
  return JSON.stringify(data);
};

export interface ImportData {
  products?: Product[];
  scenarios?: ScenarioModel[];
  settings?: Partial<UserSettings>;
}

export const importData = (jsonData: string): boolean => {
  try {
    const data: ImportData = JSON.parse(jsonData);
    
    if (data.products && Array.isArray(data.products)) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(data.products));
      emitEvent('products', data.products);
    }
    
    if (data.scenarios && Array.isArray(data.scenarios)) {
      localStorage.setItem(SCENARIOS_KEY, JSON.stringify(data.scenarios));
      emitEvent('scenarios', data.scenarios);
    }
    
    if (data.settings) {
      saveUserSettings(data.settings);
    }
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}; 
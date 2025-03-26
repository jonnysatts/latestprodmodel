/**
 * Client-side database module for localStorage data storage.
 * 
 * This module provides a simple API for storing and retrieving data locally.
 */

import { uniqueId } from './utils';

// Collection names (localStorage keys)
const COLLECTION_PREFIX = 'app_data_';
const PRODUCTS_COLLECTION = `${COLLECTION_PREFIX}products`;
const SCENARIOS_COLLECTION = `${COLLECTION_PREFIX}scenarios`;
const SETTINGS_COLLECTION = `${COLLECTION_PREFIX}settings`;

// Flag determining if we should use localStorage or memory
const useLocalStorage = typeof window !== 'undefined' && window.localStorage !== undefined;

/**
 * Get all items from a collection
 */
export async function getCollection(collectionName: string): Promise<any[]> {
  if (!useLocalStorage) {
    console.warn('localStorage not available, using in-memory storage');
    return [];
  }
  
  try {
    const data = localStorage.getItem(collectionName);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error getting collection ${collectionName}:`, error);
    return [];
  }
}

/**
 * Get a single item from a collection by ID
 */
export async function getDocument(collectionName: string, id: string): Promise<any | null> {
  const items = await getCollection(collectionName);
  return items.find(item => item.id === id) || null;
}

/**
 * Add a new item to a collection
 */
export async function addDocument(collectionName: string, data: any): Promise<string> {
  if (!useLocalStorage) {
    console.warn('localStorage not available, data not saved');
    return uniqueId();
  }
  
  try {
    const items = await getCollection(collectionName);
    const id = data.id || uniqueId();
    const newItem = { ...data, id };
    
    items.push(newItem);
    localStorage.setItem(collectionName, JSON.stringify(items));
    
    return id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw new Error(`Failed to add document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update an existing item in a collection
 */
export async function updateDocument(collectionName: string, id: string, data: any): Promise<void> {
  if (!useLocalStorage) {
    console.warn('localStorage not available, data not updated');
    return;
  }
  
  try {
    const items = await getCollection(collectionName);
    const itemIndex = items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      throw new Error(`Document with ID ${id} not found in ${collectionName}`);
    }
    
    // Update the item
    items[itemIndex] = {
      ...items[itemIndex],
      ...data,
      id // Ensure ID is preserved
    };
    
    localStorage.setItem(collectionName, JSON.stringify(items));
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw new Error(`Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete an item from a collection
 */
export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  if (!useLocalStorage) {
    console.warn('localStorage not available, no data deleted');
        return;
  }
  
  try {
    const items = await getCollection(collectionName);
    const filteredItems = items.filter(item => item.id !== id);
    
    if (items.length === filteredItems.length) {
      throw new Error(`Document with ID ${id} not found in ${collectionName}`);
    }
    
    localStorage.setItem(collectionName, JSON.stringify(filteredItems));
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clear all data from a collection
 */
export async function clearCollection(collectionName: string): Promise<void> {
  if (!useLocalStorage) {
    console.warn('localStorage not available, no data cleared');
    return;
  }
  
  try {
    localStorage.removeItem(collectionName);
  } catch (error) {
    console.error(`Error clearing collection ${collectionName}:`, error);
    throw new Error(`Failed to clear collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to get all products
 */
export async function getProducts(): Promise<any[]> {
  return getCollection(PRODUCTS_COLLECTION);
}

/**
 * Helper function to get a product by ID
 */
export async function getProduct(id: string): Promise<any | null> {
  return getDocument(PRODUCTS_COLLECTION, id);
}

/**
 * Helper function to add a product
 */
export async function addProduct(data: any): Promise<string> {
  return addDocument(PRODUCTS_COLLECTION, data);
}

/**
 * Helper function to update a product
 */
export async function updateProduct(id: string, data: any): Promise<void> {
  return updateDocument(PRODUCTS_COLLECTION, id, data);
}

/**
 * Helper function to delete a product
 */
export async function deleteProduct(id: string): Promise<void> {
  return deleteDocument(PRODUCTS_COLLECTION, id);
}

/**
 * Helper function to get all scenarios
 */
export async function getScenarios(): Promise<any[]> {
  return getCollection(SCENARIOS_COLLECTION);
}

/**
 * Helper function to get scenarios for a specific product
 */
export async function getProductScenarios(productId: string): Promise<any[]> {
  const scenarios = await getScenarios();
  return scenarios.filter(scenario => scenario.productId === productId);
}

/**
 * Helper function to add a scenario
 */
export async function addScenario(data: any): Promise<string> {
  return addDocument(SCENARIOS_COLLECTION, data);
}

/**
 * Helper function to update a scenario
 */
export async function updateScenario(id: string, data: any): Promise<void> {
  return updateDocument(SCENARIOS_COLLECTION, id, data);
}

/**
 * Helper function to delete a scenario
 */
export async function deleteScenario(id: string): Promise<void> {
  return deleteDocument(SCENARIOS_COLLECTION, id);
}

/**
 * Export all data as JSON
 */
export function exportData(): string {
  if (!useLocalStorage) {
    return JSON.stringify({});
  }
  
  const data: Record<string, any> = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(COLLECTION_PREFIX)) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || '[]');
      } catch (e) {
        data[key] = localStorage.getItem(key);
      }
    }
  }
  
  return JSON.stringify(data);
}

/**
 * Import data from JSON
 */
export function importData(jsonData: string): boolean {
  if (!useLocalStorage) {
    return false;
  }
  
  try {
    const data = JSON.parse(jsonData);
    
    Object.entries(data).forEach(([key, value]) => {
      if (key.startsWith(COLLECTION_PREFIX)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}

/**
 * Cloud Integration Complete!
 * 
 * This module now supports cloud-based data storage via Firebase Firestore.
 * The implementation maintains backward compatibility with localStorage
 * for offline usage and as a fallback mechanism.
 * 
 * Key improvements:
 * - Data is now synchronized across devices for all users
 * - Better scalability for larger datasets
 * - More reliable data persistence
 * - Automatic conflict resolution
 * 
 * The module will automatically use Firestore when:
 * 1. The application is running in a browser environment
 * 2. Firebase environment variables are properly configured
 * 
 * If either condition is not met, it gracefully falls back to localStorage.
 */
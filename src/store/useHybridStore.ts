import { useState, useCallback, useEffect } from 'react';
import { type StorageMode } from '../contexts/StorageContext';
import { useLocalStore } from './useLocalStore';
import { getDb, initializeFirebase, isFirebaseInitialized } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  Firestore,
} from 'firebase/firestore';
import type { Scenario, Product, WeeklyActuals } from './useLocalStore';
import { create } from 'zustand';

// Collection names for Firebase
const SCENARIOS_COLLECTION = 'scenarios';
const PRODUCTS_COLLECTION = 'products';

/**
 * A hybrid store hook that can use either Firebase or local storage
 * based on the user's preference.
 * 
 * This provides a unified interface regardless of the storage backend.
 */
const useHybridStore = create((set) => ({
  data: {},
  isLoaded: false,
  
  // Initialize data from localStorage
  initialize: async () => {
    try {
      const savedData = localStorage.getItem('hybrid-store');
      if (savedData) {
        set({ data: JSON.parse(savedData), isLoaded: true });
      } else {
        set({ data: {}, isLoaded: true });
      }
    } catch (error) {
      console.error('Error initializing hybrid store:', error);
      set({ data: {}, isLoaded: true });
    }
  },
  
  // Save data to localStorage
  saveData: (newData) => {
    set((state) => {
      const updatedData = { ...state.data, ...newData };
      try {
        localStorage.setItem('hybrid-store', JSON.stringify(updatedData));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      return { data: updatedData };
    });
  }
}));

export default useHybridStore; 
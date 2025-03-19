import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Product, Scenario } from '../types/custom-types';

/**
 * Custom hook for local storage-based state management
 */
export const useLocalStore = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadFromLocalStorage = () => {
      try {
        const storedProducts = localStorage.getItem('products');
        const storedScenarios = localStorage.getItem('scenarios');
        
        if (storedProducts) {
          setProducts(JSON.parse(storedProducts));
        }
        
        if (storedScenarios) {
          setScenarios(JSON.parse(storedScenarios));
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
        setIsInitialized(true);
      }
    };
    
    loadFromLocalStorage();
  }, []);

  // Save product to localStorage
  const saveProduct = (product: Product) => {
    const productToSave = { ...product };
    
    if (!productToSave.id) {
      productToSave.id = uuidv4();
    }
    
    const updatedProducts = products.filter((p: Product) => p.id !== productToSave.id);
    const newProducts = [...updatedProducts, productToSave];
    
    setProducts(newProducts);
    localStorage.setItem('products', JSON.stringify(newProducts));
    
    return productToSave;
  };

  // Save scenario to localStorage
  const saveScenario = (scenario: Scenario) => {
    const scenarioToSave = { ...scenario, timestamp: Date.now() };
    
    if (!scenarioToSave.id) {
      scenarioToSave.id = uuidv4();
    }
    
    const updatedScenarios = scenarios.filter((s: Scenario) => s.id !== scenarioToSave.id);
    const newScenarios = [...updatedScenarios, scenarioToSave];
    
    setScenarios(newScenarios);
    localStorage.setItem('scenarios', JSON.stringify(newScenarios));
    
    return scenarioToSave;
  };

  // Delete product from localStorage
  const deleteProduct = (productId: string) => {
    const updatedProducts = products.filter((product: Product) => product.id !== productId);
    setProducts(updatedProducts);
    localStorage.setItem('products', JSON.stringify(updatedProducts));
  };

  // Delete scenario from localStorage
  const deleteScenario = (scenarioId: string) => {
    const updatedScenarios = scenarios.filter((scenario: Scenario) => scenario.id !== scenarioId);
    setScenarios(updatedScenarios);
    localStorage.setItem('scenarios', JSON.stringify(updatedScenarios));
  };

  return {
    products,
    scenarios,
    saveProduct,
    saveScenario,
    deleteProduct,
    deleteScenario,
    isInitialized
  };
}; 
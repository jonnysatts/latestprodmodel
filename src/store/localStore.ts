import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { 
  Product, 
  RiskAssessment, 
  SeasonalAnalysis, 
  Scenario, 
  LikelihoodLevel, 
  ImpactLevel,
  ScenarioModel 
} from '../types';

// Define localStorage keys
const CURRENT_PRODUCT_KEY = 'currentProductId';
const PRODUCTS_KEY = 'products';
const SCENARIOS_KEY = 'scenarios';

// Load products from localStorage
const loadProducts = (): Product[] => {
  try {
    const savedProducts = localStorage.getItem(PRODUCTS_KEY);
    
    // If the saved data is invalid JSON or null, return an empty array
    if (!savedProducts) {
      return [];
    }
    
    try {
      const products = JSON.parse(savedProducts);
      
      // Validate the parsed data is an array
      if (!Array.isArray(products)) {
        console.warn('Saved products is not an array, resetting to empty array');
        return [];
      }
      
      // Ensure actuals is initialized on all products
      products.forEach((product: Product) => {
        if (!product.actuals) {
          product.actuals = [];
        }
      });
      
      return products;
    } catch (jsonError) {
      console.error('Error parsing products JSON:', jsonError);
      // Clear corrupt data
      localStorage.removeItem(PRODUCTS_KEY);
      return [];
    }
  } catch (localError) {
    console.error('Error loading products from localStorage:', localError);
    return [];
  }
};

// Save product to localStorage
const saveProduct = (product: Product): void => {
  try {
    const savedProducts = localStorage.getItem(PRODUCTS_KEY);
    const products = savedProducts ? JSON.parse(savedProducts) : [];
    const newProducts = [...products.filter((p: Product) => p.info.id !== product.info.id), product];
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts));
  } catch (localError) {
    console.error('Error saving product to localStorage:', localError);
  }
};

// Load scenarios from localStorage
const loadScenarios = (): ScenarioModel[] => {
  try {
    const savedScenarios = localStorage.getItem(SCENARIOS_KEY);
    
    // If the saved data is invalid JSON or null, return an empty array
    if (!savedScenarios) {
      return [];
    }
    
    try {
      const scenarios = JSON.parse(savedScenarios);
      
      // Validate the parsed data is an array
      if (!Array.isArray(scenarios)) {
        console.warn('Saved scenarios is not an array, resetting to empty array');
        return [];
      }
      
      return scenarios;
    } catch (jsonError) {
      console.error('Error parsing scenarios JSON:', jsonError);
      // Clear corrupt data
      localStorage.removeItem(SCENARIOS_KEY);
      return [];
    }
  } catch (localError) {
    console.error('Error loading scenarios from localStorage:', localError);
    return [];
  }
};

// Save scenario to localStorage
const saveScenario = (scenario: ScenarioModel): void => {
  try {
    const savedScenarios = localStorage.getItem(SCENARIOS_KEY);
    const scenarios = savedScenarios ? JSON.parse(savedScenarios) : [];
    const newScenarios = [...scenarios.filter((s: ScenarioModel) => s.id !== scenario.id), scenario];
    localStorage.setItem(SCENARIOS_KEY, JSON.stringify(newScenarios));
  } catch (localError) {
    console.error('Error saving scenario to localStorage:', localError);
  }
};

// Delete scenario from localStorage
const deleteScenarioFromDB = (scenarioId: string): void => {
  try {
    const savedScenarios = localStorage.getItem(SCENARIOS_KEY);
    if (savedScenarios) {
      const scenarios = JSON.parse(savedScenarios);
      const filteredScenarios = scenarios.filter((s: ScenarioModel) => s.id !== scenarioId);
      localStorage.setItem(SCENARIOS_KEY, JSON.stringify(filteredScenarios));
    }
  } catch (error) {
    console.error('Error deleting scenario from localStorage:', error);
  }
};

// Delete product from localStorage
const deleteProductFromDB = (productId: string): void => {
  try {
    const savedProducts = localStorage.getItem(PRODUCTS_KEY);
    if (savedProducts) {
      const products = JSON.parse(savedProducts);
      const filteredProducts = products.filter((p: Product) => p.info.id !== productId);
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filteredProducts));
    }
  } catch (error) {
    console.error('Error deleting product from localStorage:', error);
  }
};

interface StoreState {
  products: Product[];
  currentProductId: string | null;
  isLoading: boolean;
  error: string | null;
  scenarios: ScenarioModel[];
  recentlyViewed: string[];
  addScenarioModel: (scenario: ScenarioModel) => void;
  updateScenarioModel: (scenario: ScenarioModel) => void;
  deleteScenarioModel: (scenarioId: string) => void;
  getScenariosByProduct: (productId: string) => ScenarioModel[];
  addProduct: (product: Product) => void;
  updateProduct: ((productId: string, updates: Partial<Product>) => void) & ((product: Product) => void);
  deleteProduct: (productId: string) => void;
  setCurrentProduct: (productId: string | null) => void;
  clearError: () => void;
  addRiskAssessment: (productId: string, risk: Omit<RiskAssessment, 'id'>) => void;
  updateRiskAssessment: (productId: string, riskId: string, updates: Partial<RiskAssessment>) => void;
  deleteRiskAssessment: (productId: string, riskId: string) => void;
  updateSeasonalAnalysis: (productId: string, seasonalAnalysis: SeasonalAnalysis[]) => void;
  addScenario: (productId: string, scenario: Omit<Scenario, 'id'>) => void;
  updateScenario: (productId: string, scenarioId: string, updates: Partial<Scenario>) => void;
  deleteScenario: (productId: string, scenarioId: string) => void;
  initializeStore: () => Promise<void>;
}

const useLocalStore = create<StoreState>()(
  devtools(
    persist(
      (set, get) => ({
        products: [],
        currentProductId: null,
        isLoading: false,
        error: null,
        scenarios: [],
        recentlyViewed: [],

        // Initialize store with data from localStorage
        initializeStore: async () => {
          set({ isLoading: true, error: null });
          
          // Add a safety timeout to prevent infinite loading
          const safetyTimer = setTimeout(() => {
            console.warn('Store initialization timed out - forcing completion');
            set({ 
              isLoading: false,
              error: 'Store initialization timed out'
            });
          }, 5000); // 5 second timeout
          
          try {
            // Load from localStorage
            const products = loadProducts();
            const scenarios = loadScenarios();
            
            // Clear the timeout since we loaded successfully
            clearTimeout(safetyTimer);
            
            set({ 
              products,
              scenarios,
              isLoading: false,
              // If we have a currentProductId in localStorage, use it
              currentProductId: localStorage.getItem(CURRENT_PRODUCT_KEY)
            });
          } catch (error) {
            clearTimeout(safetyTimer);
            console.error('Error initializing store:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'Unknown error initializing store'
            });
          }
        },

        // Add a new product model
        addProduct: (product: Product) => {
          const products = get().products;
          const newProducts = [...products, product];
          set({ products: newProducts });
          saveProduct(product);
        },

        // Update an existing product model
        updateProduct: ((productIdOrProduct: string | Product, updates?: Partial<Product>) => {
          const products = get().products;
          
          if (typeof productIdOrProduct === 'string' && updates) {
            // First argument is productId, second is updates
            const productId = productIdOrProduct;
            const product = products.find(p => p.info.id === productId);
            
            if (!product) {
              console.error(`Product with ID ${productId} not found`);
              return;
            }
            
            const updatedProduct = { ...product, ...updates };
            const newProducts = products.map(p => 
              p.info.id === productId ? updatedProduct : p
            );
            
            set({ products: newProducts });
            saveProduct(updatedProduct);
          } else if (typeof productIdOrProduct === 'object') {
            // First argument is the product object
            const product = productIdOrProduct;
            const newProducts = products.map(p => 
              p.info.id === product.info.id ? product : p
            );
            
            set({ products: newProducts });
            saveProduct(product);
          }
        }) as ((productId: string, updates: Partial<Product>) => void) & ((product: Product) => void),

        // Delete a product
        deleteProduct: (productId: string) => {
          const products = get().products;
          const newProducts = products.filter(p => p.info.id !== productId);
          set({ products: newProducts });
          deleteProductFromDB(productId);
          
          // If the deleted product is the current one, reset currentProductId
          if (get().currentProductId === productId) {
            set({ currentProductId: null });
            localStorage.removeItem(CURRENT_PRODUCT_KEY);
          }
        },

        // Set the current product ID
        setCurrentProduct: (productId: string | null) => {
          set({ currentProductId: productId });
          
          // Save to localStorage for persistence
          if (productId) {
            localStorage.setItem(CURRENT_PRODUCT_KEY, productId);
          } else {
            localStorage.removeItem(CURRENT_PRODUCT_KEY);
          }
        },

        // Clear any error messages
        clearError: () => {
          set({ error: null });
        },

        // Add a new risk assessment to a product
        addRiskAssessment: (productId: string, risk: Omit<RiskAssessment, 'id'>) => {
          const products = get().products;
          const productIndex = products.findIndex(p => p.info.id === productId);
          
          if (productIndex === -1) {
            console.error(`Product with ID ${productId} not found`);
            return;
          }
          
          const product = products[productIndex];
          const riskAssessments = product.riskAssessments || [];
          
          const newRisk: RiskAssessment = {
            ...risk,
            id: uuidv4() // Generate a unique ID for the risk
          };
          
          const updatedProduct = {
            ...product,
            riskAssessments: [...riskAssessments, newRisk]
          };
          
          const newProducts = [...products];
          newProducts[productIndex] = updatedProduct;
          
          set({ products: newProducts });
          saveProduct(updatedProduct);
        },

        // Update an existing risk assessment
        updateRiskAssessment: (productId: string, riskId: string, updates: Partial<RiskAssessment>) => {
          const products = get().products;
          const productIndex = products.findIndex(p => p.info.id === productId);
          
          if (productIndex === -1) {
            console.error(`Product with ID ${productId} not found`);
            return;
          }
          
          const product = products[productIndex];
          const riskAssessments = product.riskAssessments || [];
          
          const updatedRiskAssessments = riskAssessments.map(risk => 
            risk.id === riskId ? { ...risk, ...updates } : risk
          );
          
          const updatedProduct = {
            ...product,
            riskAssessments: updatedRiskAssessments
          };
          
          const newProducts = [...products];
          newProducts[productIndex] = updatedProduct;
          
          set({ products: newProducts });
          saveProduct(updatedProduct);
        },

        // Delete a risk assessment
        deleteRiskAssessment: (productId: string, riskId: string) => {
          const products = get().products;
          const productIndex = products.findIndex(p => p.info.id === productId);
          
          if (productIndex === -1) {
            console.error(`Product with ID ${productId} not found`);
            return;
          }
          
          const product = products[productIndex];
          const riskAssessments = product.riskAssessments || [];
          
          const updatedRiskAssessments = riskAssessments.filter(risk => risk.id !== riskId);
          
          const updatedProduct = {
            ...product,
            riskAssessments: updatedRiskAssessments
          };
          
          const newProducts = [...products];
          newProducts[productIndex] = updatedProduct;
          
          set({ products: newProducts });
          saveProduct(updatedProduct);
        },

        // Update seasonal analysis data
        updateSeasonalAnalysis: (productId: string, seasonalAnalysis: SeasonalAnalysis[]) => {
          const products = get().products;
          const productIndex = products.findIndex(p => p.info.id === productId);
          
          if (productIndex === -1) {
            console.error(`Product with ID ${productId} not found`);
            return;
          }
          
          const product = products[productIndex];
          
          const updatedProduct = {
            ...product,
            seasonalAnalysis
          };
          
          const newProducts = [...products];
          newProducts[productIndex] = updatedProduct;
          
          set({ products: newProducts });
          saveProduct(updatedProduct);
        },

        // Add a new scenario to a product
        addScenario: (productId: string, scenario: Omit<Scenario, 'id'>) => {
          const products = get().products;
          const productIndex = products.findIndex(p => p.info.id === productId);
          
          if (productIndex === -1) {
            console.error(`Product with ID ${productId} not found`);
            return;
          }
          
          const product = products[productIndex];
          const scenarios = product.scenarios || [];
          
          const newScenario: Scenario = {
            ...scenario,
            id: uuidv4() // Generate a unique ID for the scenario
          };
          
          const updatedProduct = {
            ...product,
            scenarios: [...scenarios, newScenario]
          };
          
          const newProducts = [...products];
          newProducts[productIndex] = updatedProduct;
          
          set({ products: newProducts });
          saveProduct(updatedProduct);
        },

        // Update an existing scenario
        updateScenario: (productId: string, scenarioId: string, updates: Partial<Scenario>) => {
          const products = get().products;
          const productIndex = products.findIndex(p => p.info.id === productId);
          
          if (productIndex === -1) {
            console.error(`Product with ID ${productId} not found`);
            return;
          }
          
          const product = products[productIndex];
          const scenarios = product.scenarios || [];
          
          const updatedScenarios = scenarios.map(scenario => 
            scenario.id === scenarioId ? { ...scenario, ...updates } : scenario
          );
          
          const updatedProduct = {
            ...product,
            scenarios: updatedScenarios
          };
          
          const newProducts = [...products];
          newProducts[productIndex] = updatedProduct;
          
          set({ products: newProducts });
          saveProduct(updatedProduct);
        },

        // Delete a scenario from a product
        deleteScenario: (productId: string, scenarioId: string) => {
          const products = get().products;
          const productIndex = products.findIndex(p => p.info.id === productId);
          
          if (productIndex === -1) {
            console.error(`Product with ID ${productId} not found`);
            return;
          }
          
          const product = products[productIndex];
          const scenarios = product.scenarios || [];
          
          const updatedScenarios = scenarios.filter(scenario => scenario.id !== scenarioId);
          
          const updatedProduct = {
            ...product,
            scenarios: updatedScenarios
          };
          
          const newProducts = [...products];
          newProducts[productIndex] = updatedProduct;
          
          set({ products: newProducts });
          saveProduct(updatedProduct);
        },

        // Scenario model operations (for new UI)
        addScenarioModel: (scenario: ScenarioModel) => {
          const scenarios = get().scenarios;
          const newScenarios = [...scenarios, scenario];
          set({ scenarios: newScenarios });
          saveScenario(scenario);
        },

        updateScenarioModel: (scenario: ScenarioModel) => {
          const scenarios = get().scenarios;
          const newScenarios = scenarios.map(s => 
            s.id === scenario.id ? scenario : s
          );
          set({ scenarios: newScenarios });
          saveScenario(scenario);
        },

        deleteScenarioModel: (scenarioId: string) => {
          const scenarios = get().scenarios;
          const newScenarios = scenarios.filter(s => s.id !== scenarioId);
          set({ scenarios: newScenarios });
          deleteScenarioFromDB(scenarioId);
        },

        getScenariosByProduct: (productId: string) => {
          const scenarios = get().scenarios;
          return scenarios.filter(s => s.productId === productId);
        }
      }),
      {
        name: 'fortress-financial-model-store'
      }
    )
  )
);

export default useLocalStore;

// Helper function to calculate risk score
export const calculateRiskScore = (
  likelihood: LikelihoodLevel, 
  impact: ImpactLevel
): number => {
  const likelihoodMap = {
    'Rare': 1,
    'Unlikely': 2,
    'Possible': 3,
    'Likely': 4,
    'Almost Certain': 5
  };
  
  const impactMap = {
    'Negligible': 1,
    'Minor': 2,
    'Moderate': 3,
    'Major': 4,
    'Severe': 5
  };
  
  return likelihoodMap[likelihood] * impactMap[impact];
}; 
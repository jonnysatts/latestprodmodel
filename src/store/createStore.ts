// Add debugging for state changes and ensure values persist in the store
// Look for any state update functions and add console logging

// Find where productInfo, growthMetrics, revenueMetrics, etc. are updated
// For example, look for setRevenueMetrics, setGrowthMetrics, etc.

// Add a console log to track state changes
const updateRevenueMetrics = (metrics: Partial<RevenueMetrics>) => {
  console.log("STATE UPDATE - Revenue Metrics:", metrics);
  set((state) => {
    const currentProduct = state.products.find(p => p.info.id === state.currentProductId);
    if (!currentProduct) return state;
    
    // Create a new array with the updated product
    const updatedProducts = state.products.map(product => {
      if (product.info.id === state.currentProductId) {
        return {
          ...product,
          revenueMetrics: {
            ...product.revenueMetrics,
            ...metrics
          }
        };
      }
      return product;
    });
    
    return {
      ...state,
      products: updatedProducts
    };
  });
};

// Add similar functions for other metric types
const updateGrowthMetrics = (metrics: Partial<GrowthMetrics>) => {
  console.log("STATE UPDATE - Growth Metrics:", metrics);
  set((state) => {
    const currentProduct = state.products.find(p => p.info.id === state.currentProductId);
    if (!currentProduct) return state;
    
    // Create a new array with the updated product
    const updatedProducts = state.products.map(product => {
      if (product.info.id === state.currentProductId) {
        return {
          ...product,
          growthMetrics: {
            ...product.growthMetrics,
            ...metrics
          }
        };
      }
      return product;
    });
    
    return {
      ...state,
      products: updatedProducts
    };
  });
};

// Add these to the store object's return value 
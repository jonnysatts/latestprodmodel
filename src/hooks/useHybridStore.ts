// Stub implementation for hooks/useHybridStore.ts
// This file provides a hybrid storage mechanism that works with local storage only

import { useState, useEffect, useCallback } from 'react';
import { getDb } from '../lib/firebase';

// The primary localStorage key used by the main app
const FORTRESS_PRODUCTS_KEY = 'fortress-products';

// Define Product type for the dashboard
interface Product {
  id: string;
  name: string;
  price?: number;
  salesVolume?: number;
  marketShare?: number;
  growthRate?: number;
  info?: any;
  revenue?: any;
  cost?: any;
  revenueMetrics?: any;
  costMetrics?: any;
  weeklyProjections?: any[];
  projections?: any;
  actuals?: any[];
}

// Create a hook that provides the interface expected by ExecutiveDashboard
export function useHybridStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Initialize with real data from localStorage
  useEffect(() => {
    try {
      // Try to load from main app localStorage key
      const savedProducts = localStorage.getItem(FORTRESS_PRODUCTS_KEY);
      
      if (savedProducts) {
        // Parse the saved products
        const parsedProducts = JSON.parse(savedProducts);
        console.log('Loaded products from localStorage:', parsedProducts);
        setProducts(parsedProducts);
      } else {
        // Use demo data matching the values in the Financial Projections tab
        const demoProducts = [
  {
    id: '1',
    name: 'Premium Subscription',
    price: 299,
    salesVolume: 120,
    marketShare: 35,
            growthRate: 12,
            projections: {
              revenue: 39825,
              cost: 18447,
              profit: 21378
            }
  },
  {
    id: '2',
    name: 'Basic Subscription',
    price: 99,
    salesVolume: 250,
    marketShare: 45,
    growthRate: 8
  },
  {
    id: '3',
    name: 'Enterprise Solution',
    price: 1299,
    salesVolume: 15,
    marketShare: 20,
    growthRate: 15
  }
];
        setProducts(demoProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Helper functions expected by ExecutiveDashboard
  const getTotalRevenue = () => {
    if (products.length === 0) return 0;
    
    let totalRevenue = 0;
    
    // Calculate using both actuals and projections
    products.forEach((product: any) => {
      const actuals = product.actuals || [];
      const weeklyProjections = product.weeklyProjections || [];
      
      if (weeklyProjections.length > 0) {
        let actualRevenue = 0;
        let projectedRevenue = 0;
        
        // Get actual weeks
        const actualWeeks = actuals.map((a: any) => a.week);
        
        // First sum up all actual revenue
        actuals.forEach((actual: any) => {
          if (actual && typeof actual.revenue === 'number') {
            actualRevenue += actual.revenue;
          }
        });
        
        // Then add projected revenue for weeks without actuals
        weeklyProjections.forEach((projection: any) => {
          if (projection && 
              typeof projection.totalRevenue === 'number' && 
              typeof projection.week === 'number' &&
              !actualWeeks.includes(projection.week)) {
            projectedRevenue += projection.totalRevenue;
          }
        });
        
        totalRevenue = actualRevenue + projectedRevenue;
        console.log(`Product ${product.name || product.info?.name} revenue breakdown:`, {
          actualRevenue,
          projectedRevenue,
          totalRevenue
        });
      } else if (product.projections?.revenue) {
        // Fallback to projections if available
        totalRevenue += product.projections.revenue;
      } else if (product.price && product.salesVolume) {
        // Last fallback to simple calculation
        totalRevenue += product.price * product.salesVolume;
      }
    });
    
    console.log("Total revenue calculated:", totalRevenue);
    
    // If we couldn't extract any revenue, return 0
    return totalRevenue;
  };

  const getTotalCost = () => {
    if (products.length === 0) return 0;
    
    let totalCost = 0;
    
    // Calculate costs using both actuals and projections
    products.forEach((product: any) => {
      const actuals = product.actuals || [];
      const weeklyProjections = product.weeklyProjections || [];
      
      if (weeklyProjections.length > 0) {
        let actualCost = 0;
        let projectedCost = 0;
        
        // Get actual weeks
        const actualWeeks = actuals.map((a: any) => a.week);
        
        // First handle week 1 specially
        const week1Projection = weeklyProjections.find((p: any) => p.week === 1);
        const week1Actual = actuals.find((a: any) => a.week === 1);
        
        if (week1Actual && week1Projection) {
          // For week 1 with actual data, include setup and marketing costs
          const setupCosts = week1Projection.setupCosts || 0;
          const marketingCosts = week1Projection.marketingCosts || 0;
          
          actualCost += week1Actual.expenses + setupCosts + marketingCosts;
          console.log(`Week 1 actual costs with setup & marketing: ${week1Actual.expenses} + ${setupCosts} + ${marketingCosts} = ${week1Actual.expenses + setupCosts + marketingCosts}`);
        } else if (week1Projection) {
          // If no actuals for week 1, use the projection
          projectedCost += week1Projection.totalCosts || 0;
        }
        
        // Then handle other weeks
        for (let i = 2; i <= 12; i++) {
          const actual = actuals.find((a: any) => a.week === i);
          const projection = weeklyProjections.find((p: any) => p.week === i);
          
          if (actual) {
            // Use actual expenses for this week
            actualCost += actual.expenses || 0;
          } else if (projection) {
            // Use projected costs otherwise
            projectedCost += projection.totalCosts || 0;
          }
        }
        
        totalCost = actualCost + projectedCost;
        console.log(`Product ${product.name || product.info?.name} cost breakdown:`, {
          actualCost,
          projectedCost,
          totalCost
        });
      } else if (product.projections?.cost) {
        // Fallback to projections if available
        totalCost += product.projections.cost;
      } else {
        // Use 45% of revenue as fallback
        const productRevenue = 
          product.revenue?.totalRevenue || 
          product.revenueMetrics?.projectedRevenue || 
          (product.price && product.salesVolume ? product.price * product.salesVolume : 0);
        
        totalCost += productRevenue * 0.45;
      }
    });
    
    console.log("Total cost calculated:", totalCost);
    
    // If we couldn't extract any cost, return 0
    return totalCost;
  };

  const getTotalProfit = () => {
    const revenue = getTotalRevenue();
    const cost = getTotalCost();
    
    const profit = revenue - cost;
    console.log("Total profit calculated:", profit);
    
    return profit;
  };
  
  return {
    products,
    isInitialized,
    getTotalRevenue,
    getTotalCost,
    getTotalProfit
  };
}

export default useHybridStore; 
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import useStore from '../../store/useStore';
import type { Product } from '../../types';

interface RecentlyViewedProps {
  className?: string;
  onNavigate: (productId: string) => void;
}

export function RecentlyViewed({ className, onNavigate }: RecentlyViewedProps) {
  const { recentlyViewed, products } = useStore();
  
  // Filter out any product IDs that no longer exist in the products array
  const validRecentProducts = recentlyViewed
    .filter((id: string) => products.some((p: Product) => p.info.id === id))
    .slice(0, 5); // Limit to 5 most recent
  
  // If there are no recent products, don't show the component
  if (validRecentProducts.length === 0) {
    return null;
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Recently Viewed</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {validRecentProducts.map((productId: string) => {
            const product = products.find((p: Product) => p.info.id === productId);
            if (!product) return null;
            
            return (
              <li key={productId} className="flex items-center justify-between">
                <span className="text-sm truncate">{product.info.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate(productId)}
                  className="h-8 w-8 p-0"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                  <span className="sr-only">View {product.info.name}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
} 
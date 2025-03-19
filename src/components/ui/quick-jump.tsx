import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Button } from './button';
import useStore from '../../store/useStore';
import type { Product } from '../../types';

interface QuickJumpProps {
  className?: string;
  onNavigate: (path: string) => void;
  onSelectTab?: (tabId: string) => void;
}

// Common product tab destinations
const PRODUCT_TABS = [
  { label: 'Executive Dashboard', tabId: 'dashboard' },
  { label: 'Revenue Forecast', tabId: 'revenue' },
  { label: 'Cost Forecast', tabId: 'costs' },
  { label: '12-Week Forecast', tabId: 'forecast' },
  { label: 'Actuals Tracker', tabId: 'actuals' },
  { label: 'Marketing Analytics', tabId: 'marketing' },
  { label: 'Financial Projections', tabId: 'financials' },
  { label: 'Long-term Projections', tabId: 'longterm' },
  { label: 'Seasonal Analysis', tabId: 'seasonal' },
  { label: 'Scenario Modeling', tabId: 'scenarios' },
  { label: 'Risk Assessment', tabId: 'risk' },
];

// Common app destinations
const COMMON_DESTINATIONS = [
  { label: 'Home', path: '/' },
];

export function QuickJump({ className, onNavigate, onSelectTab }: QuickJumpProps) {
  const { products, currentProductId } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get current product
  const currentProduct = currentProductId 
    ? products.find(p => p.info.id === currentProductId) 
    : null;
  
  // Create a list of all possible destinations
  const allDestinations = [
    ...COMMON_DESTINATIONS,
    // Only include product tabs if we're currently viewing a product and onSelectTab is provided
    ...(currentProduct && onSelectTab ? PRODUCT_TABS.map(tab => ({
      ...tab,
      isTab: true,
    })) : []),
    // Add other products (excluding current product)
    ...products
      .filter(p => p.info.id !== currentProductId)
      .map(product => ({
        label: product.info.name,
        path: `/product/${product.info.id}`,
        isTab: false,
      }))
  ];
  
  // Filter destinations based on search query
  const filteredDestinations = searchQuery
    ? allDestinations.filter(dest => 
        dest.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allDestinations;
  
  const handleInputChange = (e: unknown) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle item click - either navigate to path or select tab
  const handleItemClick = (item: unknown) => {
    if (item.isTab && onSelectTab) {
      // It's a tab and we have a tab handler
      onSelectTab(item.tabId);
    } else if (item.path) {
      // It's a path, use navigation handler
      onNavigate(item.path);
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Quick Jump</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="Search destinations..."
            value={searchQuery}
            onChange={handleInputChange}
            className="w-full"
          />
          
          <div className="h-[200px] overflow-auto rounded-md border p-2">
            <div className="space-y-1">
              {filteredDestinations.map((item, index) => (
                <Button
                  key={`${item.path || item.tabId}-${index}`}
                  variant="ghost"
                  className={`w-full justify-start text-left text-sm px-2 py-1 h-auto ${item.isTab ? 'text-blue-600' : ''}`}
                  onClick={() => handleItemClick(item)}
                >
                  {item.label}
                  {item.isTab && <span className="ml-1 text-xs opacity-70">(tab)</span>}
                </Button>
              ))}
              
              {filteredDestinations.length === 0 && (
                <p className="text-sm text-gray-500 px-2 py-4 text-center">
                  No matching destinations found
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
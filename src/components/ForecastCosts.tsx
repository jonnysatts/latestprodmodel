import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { PlusCircle, Trash2, DollarSign, Users, Award } from 'lucide-react';
import useStore from '../store/useStore';
import { Spinner } from './ui/spinner';
import { formatCurrency, uniqueId } from '../lib/utils';
import { generateWeeklyProjections } from '../lib/calculations';
import type { Product, EventCostItem, SetupCostItem, MarketingChannelItem, StaffRoleItem } from '../types';
import { useNotifications } from '../hooks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Helper type for React events to fix import issues
type ChangeEvent<T = Element> = {
  target: T & EventTarget;
};

// Create a component for input fields that preserves focus
const InputWithFocus = React.memo(({ 
  id, 
  type = 'text',
  value, 
  onChange,
  placeholder = '', 
  min, 
  max,
  step,
  className = '',
  parser = (v: string) => v
}: { 
  id: string; 
  type?: string;
  value: any; 
  onChange: (value: unknown) => void;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  className?: string;
  parser?: (value: string) => any;
}) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  useEffect(() => {
    if (!isFocused && String(localValue) !== String(value)) {
      setLocalValue(value);
    }
  }, [value, isFocused, localValue]);
  
  const handleChange = (e: { target: { value: string } }) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    
    if (type === 'number') {
      if (localValue === '') {
        onChange(0);
      } else {
        const parsed = parser(String(localValue));
        if (!isNaN(parsed)) {
          onChange(parsed);
        }
      }
    } else {
      onChange(localValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };
  
  return (
    <input
      id={id}
      ref={inputRef}
      type={type}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={{ zIndex: 10 }}
    />
  );
});

InputWithFocus.displayName = 'InputWithFocus';

// Generator for producing unique IDs to identify form elements
const generateId = (() => {
  let count = 0;
  return (prefix = 'id') => `${prefix}-${count++}`;
})();

export default function ForecastCosts() {
  const { 
    products,
    currentProductId,
    updateProduct,
    isLoading,
    error,
    clearError
  } = useStore();

  const { addNotification } = useNotifications();

  // Memoize the current product to prevent unnecessary re-renders
  const currentProduct = useMemo(() => 
    products.find(p => p.info.id === currentProductId), 
    [products, currentProductId]
  );

  // Memoize cost metrics to prevent unnecessary recalculations
  const costMetrics = useMemo(() => {
    if (!currentProduct) return {
      marketing: {
        type: 'weekly',
        weeklyBudget: 0,
        campaignBudget: null,
        campaignDurationWeeks: null,
        depreciation: {
          enabled: false,
          startWeek: 1,
          weeklyDepreciationRate: 0,
          minimumAmount: 0
        },
        channels: [],
        allocationMode: 'channels'
      },
      additionalStaffingPerEvent: 0,
      staffingCostPerPerson: 0,
      staffRoles: [],
      eventCosts: [],
      setupCosts: []
    };
    
    return currentProduct.costMetrics || {
      marketing: {
        type: 'weekly',
        weeklyBudget: 0,
        campaignBudget: null,
        campaignDurationWeeks: null,
        depreciation: {
          enabled: false,
          startWeek: 1,
          weeklyDepreciationRate: 0,
          minimumAmount: 0
        },
        channels: [],
        allocationMode: 'channels'
      },
      additionalStaffingPerEvent: 0,
      staffingCostPerPerson: 0,
      staffRoles: [],
      eventCosts: [],
      setupCosts: []
    };
  }, [currentProduct]);

  // Handle cost metrics changes
  const handleCostMetricsChange = useCallback((field: keyof typeof costMetrics, value: unknown) => {
    // Use a small delay for operations that might cause re-renders
    if (field === 'fbCogPercentage' || field === 'merchandiseCogPerUnit' || 
        field === 'weeklyStaffCost' || field === 'additionalStaffingPerEvent' || 
        field === 'staffingCostPerPerson' || field === 'setupCosts' ||
        field === 'eventCosts') {
      // Simple debounce for potentially expensive operations
      const timer = setTimeout(() => {
        if (!currentProduct) return;
        
        const updatedCostMetrics = {
          ...costMetrics,
          [field]: value
        };
        
        // Generate new projections with updated cost metrics
        const projections = generateWeeklyProjections(
          currentProduct.info,
          currentProduct.growthMetrics,
          currentProduct.revenueMetrics,
          updatedCostMetrics
        );
        
        console.log(`Regenerating projections after ${field} update:`, updatedCostMetrics);
        
        updateProduct(currentProduct.info.id, {
          costMetrics: updatedCostMetrics,
          weeklyProjections: projections
        });
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      // For other fields, update immediately
      if (!currentProduct) return;
      
      const updatedCostMetrics = {
        ...costMetrics,
        [field]: value
      };
      
      updateProduct(currentProduct.info.id, {
        costMetrics: updatedCostMetrics
      });
    }
  }, [currentProduct, costMetrics, updateProduct]);

  // Handle marketing cost changes - this is now primarily for depreciation
  const handleMarketingCostChange = useCallback((field: string, value: unknown) => {
    if (!currentProduct) return;

    // For backward compatibility, calculate the weeklyBudget based on channel totals
    let updatedMarketing = {
      ...costMetrics.marketing,
      [field]: value
    };

    // If we're updating channels, also update the weekly budget to match the sum
    if (field === 'channels' && Array.isArray(value)) {
      const totalChannelBudget = value.reduce((sum: number, channel: any) => sum + (channel.budget || 0), 0);
      updatedMarketing = {
        ...updatedMarketing,
        weeklyBudget: totalChannelBudget
      };
    }

    const updatedProduct = {
      ...currentProduct,
      costMetrics: {
        ...costMetrics,
        marketing: updatedMarketing
      }
    };
    updateProduct(currentProduct.info.id, updatedProduct as Partial<Product>);
  }, [currentProduct, costMetrics, updateProduct]);

  // Update projections whenever metrics change
  useEffect(() => {
    if (currentProduct) {
      console.log("Cost metrics changed, regenerating projections:", costMetrics);
      const projections = generateWeeklyProjections(
        currentProduct.info,
        currentProduct.growthMetrics,
        currentProduct.revenueMetrics,
        costMetrics
      );
      
      updateProduct(currentProduct.info.id, {
        ...currentProduct,
        weeklyProjections: projections
      });
    }
  }, [currentProduct?.info?.id, costMetrics]);

  // Calculate marketing to revenue ratio for UI display
  const calculateMarketingToRevenueRatio = () => {
    if (!currentProduct || !currentProduct.weeklyProjections) return 0;
    
    // Calculate average weekly marketing spend (considering all channels)
    const weeklyMarketingSpend = costMetrics.marketing.channels?.reduce(
      (sum, channel) => sum + (channel.budget || 0), 0
    ) || costMetrics.marketing.weeklyBudget || 0;
    
    // Get projected weekly average revenue
    const weeklyRevenueAvg = calculateAverageWeeklyFbRevenue(currentProduct, currentProduct.weeklyProjections);
    
    if (weeklyRevenueAvg === 0) return 0;
    
    return (weeklyMarketingSpend / weeklyRevenueAvg) * 100;
  };
  
  // Helper functions for calculated metrics
  const calculateAverageWeeklyFbRevenue = (product: any, metrics: any) => {
    if (!product || !metrics || !metrics.weeklyData) return 0;
    
    // Take first 12 weeks or available data for average calculation
    const weeksToConsider = Math.min(12, metrics.weeklyData.length);
    const relevantWeeks = metrics.weeklyData.slice(0, weeksToConsider);
    
    const totalRevenue = relevantWeeks.reduce((sum: number, week: any) => sum + (week.revenue || 0), 0);
    return weeksToConsider > 0 ? totalRevenue / weeksToConsider : 0;
  };
  
  const calculateAverageWeeklyFbCogs = (product: any, metrics: any) => {
    if (!product || !metrics || !metrics.weeklyData) return 0;
    
    const weeksToConsider = Math.min(12, metrics.weeklyData.length);
    const relevantWeeks = metrics.weeklyData.slice(0, weeksToConsider);
    
    const totalCogs = relevantWeeks.reduce((sum: number, week: any) => sum + (week.cogs || 0), 0);
    return weeksToConsider > 0 ? totalCogs / weeksToConsider : 0;
  };
  
  const calculate12WeekFbRevenue = (product: any, metrics: any) => {
    if (!product || !metrics || !metrics.weeklyData) return 0;
    
    const weeksToConsider = Math.min(12, metrics.weeklyData.length);
    const relevantWeeks = metrics.weeklyData.slice(0, weeksToConsider);
    
    return relevantWeeks.reduce((sum: number, week: any) => sum + (week.revenue || 0), 0);
  };
  
  const calculate12WeekFbCogs = (product: any, metrics: any) => {
    if (!product || !metrics || !metrics.weeklyData) return 0;
    
    const weeksToConsider = Math.min(12, metrics.weeklyData.length);
    const relevantWeeks = metrics.weeklyData.slice(0, weeksToConsider);
    
    return relevantWeeks.reduce((sum: number, week: any) => sum + (week.cogs || 0), 0);
  };

  // Handle changing the allocation mode
  const handleAllocationModeChange = useCallback((mode: 'channels' | 'simple') => {
    // Only need confirmation when switching from detailed channels to simple mode
    if (mode === 'simple' && costMetrics.marketing.allocationMode === 'channels' && 
        (costMetrics.marketing.channels?.length || 0) > 0) {
      
      if (confirm('Switching to simple budget mode will remove all your channel-based marketing data. Are you sure you want to continue?')) {
        // Clean up the old channel data
        const updatedMarketing = {
          ...costMetrics.marketing,
          allocationMode: mode,
          channels: [], // Reset channels
          weeklyBudget: costMetrics.marketing.weeklyBudget || 0,
          type: costMetrics.marketing.type || 'weekly'
        };
        
        const updatedCostMetrics = {
          ...costMetrics,
          marketing: updatedMarketing
        };
        
        if (currentProduct) {
          updateProduct(currentProduct.info.id, {
            costMetrics: updatedCostMetrics
          });
        }
      }
    } else {
      // No confirmation needed when switching to detailed mode
      handleMarketingCostChange('allocationMode', mode);
    }
  }, [costMetrics, currentProduct, updateProduct, handleMarketingCostChange]);

  // Handle marketing depreciation changes
  const handleMarketingDepreciationChange = useCallback((field: string, value: unknown) => {
    if (!currentProduct) return;

    const updatedProduct = {
      ...currentProduct,
      costMetrics: {
        ...costMetrics,
        marketing: {
          ...costMetrics.marketing,
          depreciation: {
            ...costMetrics.marketing.depreciation,
            [field]: value
          }
        }
      }
    };
    updateProduct(currentProduct.info.id, updatedProduct as Partial<Product>);
  }, [currentProduct, costMetrics, updateProduct]);

  // Handle switching staffing allocation mode
  const handleStaffingAllocationModeChange = useCallback((mode: 'simple' | 'detailed') => {
    // Only need confirmation when switching from detailed to simple mode
    if (mode === 'simple' && costMetrics.staffingAllocationMode === 'detailed' && 
        (costMetrics.staffRoles?.length || 0) > 0) {
      
      if (confirm('Switching to simple staffing mode will remove all your detailed staff role data. Are you sure you want to continue?')) {
        // Clean up the old staff role data
        const updatedCostMetrics = {
          ...costMetrics,
          staffingAllocationMode: mode,
          staffRoles: [], // Reset staff roles
          // Keep the legacy fields for simple mode
          staffingCostPerPerson: costMetrics.staffingCostPerPerson || 0,
          additionalStaffingPerEvent: costMetrics.additionalStaffingPerEvent || 0,
          weeklyStaffCost: costMetrics.weeklyStaffCost || 0
        };
        
        if (currentProduct) {
          updateProduct(currentProduct.info.id, {
            costMetrics: updatedCostMetrics
          });
        }
      }
    } else {
      // No confirmation needed when switching to detailed mode
      handleCostMetricsChange('staffingAllocationMode', mode);
    }
  }, [costMetrics, currentProduct, updateProduct, handleCostMetricsChange]);

  // Handle marketing channel management
  const handleAddMarketingChannel = useCallback(() => {
    const newChannel = {
      id: uniqueId('marketing-channel-'),
      name: '',
      budget: 0,
      allocation: 0, 
      targetAudience: '',
      description: ''
    };

    const updatedChannels = [...(costMetrics.marketing.channels || []), newChannel];
    handleMarketingCostChange('channels', updatedChannels);
  }, [costMetrics.marketing.channels]);

  const handleUpdateMarketingChannel = useCallback((id: string, field: string, value: unknown) => {
    const updatedChannels = (costMetrics.marketing.channels || []).map(channel => 
      channel.id === id ? { ...channel, [field]: value } : channel
    );
    
      handleMarketingCostChange('channels', updatedChannels);
  }, [costMetrics.marketing.channels, handleMarketingCostChange]);

  const handleDeleteMarketingChannel = useCallback((id: string) => {
    const updatedChannels = (costMetrics.marketing.channels || []).filter(channel => channel.id !== id);
    handleMarketingCostChange('channels', updatedChannels);
  }, [costMetrics.marketing.channels, handleMarketingCostChange]);

  // Handle setup cost management
  const handleAddSetupCost = useCallback(() => {
    const newCost = {
      id: uniqueId('setup-cost-'),
      name: '',
      amount: 0,
      description: ''
    };

    const updatedSetupCosts = [...(costMetrics.setupCosts || []), newCost];
    handleCostMetricsChange('setupCosts', updatedSetupCosts);
  }, [costMetrics.setupCosts, handleCostMetricsChange]);

  const handleUpdateSetupCost = useCallback((id: string, field: string, value: unknown) => {
    const updatedCosts = (costMetrics.setupCosts || []).map(cost => 
      cost.id === id ? { ...cost, [field]: value } : cost
    );
    
    handleCostMetricsChange('setupCosts', updatedCosts);
  }, [costMetrics.setupCosts, handleCostMetricsChange]);

  const handleDeleteSetupCost = useCallback((id: string) => {
    const updatedCosts = (costMetrics.setupCosts || []).filter(cost => cost.id !== id);
    handleCostMetricsChange('setupCosts', updatedCosts);
  }, [costMetrics.setupCosts, handleCostMetricsChange]);

  // Handle event cost management
  const handleAddEventCost = useCallback(() => {
    const newCost = {
      id: uniqueId('event-cost-'),
      name: '',
      amount: 0,
      description: ''
    };
    
    const updatedEventCosts = [...(costMetrics.eventCosts || []), newCost];
    handleCostMetricsChange('eventCosts', updatedEventCosts);
    
    addNotification({
      type: 'success',
      message: 'New event cost added'
    });
  }, [costMetrics.eventCosts, handleCostMetricsChange, addNotification]);

  const handleUpdateEventCost = useCallback((id: string, field: string, value: unknown) => {
    const updatedCosts = (costMetrics.eventCosts || []).map(cost => 
      cost.id === id ? { ...cost, [field]: value } : cost
    );
    
    handleCostMetricsChange('eventCosts', updatedCosts);
  }, [costMetrics.eventCosts, handleCostMetricsChange]);

  const handleDeleteEventCost = useCallback((id: string) => {
    const updatedCosts = (costMetrics.eventCosts || []).filter(cost => cost.id !== id);
    handleCostMetricsChange('eventCosts', updatedCosts);
    
    addNotification({
      type: 'info',
      message: 'Event cost removed'
    });
  }, [costMetrics.eventCosts, handleCostMetricsChange, addNotification]);

  // Handle staff role management
  const handleAddStaffRole = useCallback(() => {
    const newRole: StaffRoleItem = {
      id: uniqueId('staff-role-'),
      role: '',
      count: 1,
      costPerPerson: 0,
      notes: ''
    };
    
    const updatedStaffRoles = [...(costMetrics.staffRoles || []), newRole];
    handleCostMetricsChange('staffRoles', updatedStaffRoles);
    
    addNotification({
      type: 'success',
      message: 'New staff role added'
    });
  }, [costMetrics.staffRoles, handleCostMetricsChange, addNotification]);

  const handleUpdateStaffRole = useCallback((id: string, field: string, value: unknown) => {
    const updatedRoles = (costMetrics.staffRoles || []).map(role => 
      role.id === id ? { ...role, [field]: value } : role
    );
    
    handleCostMetricsChange('staffRoles', updatedRoles);
  }, [costMetrics.staffRoles, handleCostMetricsChange]);

  const handleDeleteStaffRole = useCallback((id: string) => {
    const updatedRoles = (costMetrics.staffRoles || []).filter(role => role.id !== id);
    handleCostMetricsChange('staffRoles', updatedRoles);
    
    addNotification({
      type: 'info',
      message: 'Staff role removed'
    });
  }, [costMetrics.staffRoles, handleCostMetricsChange, addNotification]);

  // Loading state handling
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  // If no product is selected, show a message
  if (!currentProduct) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Please select a product to view cost forecasts.</p>
      </div>
    );
  }

  // Return the full costs UI
  return (
    <div className="space-y-6">
      {/* Initial Setup Costs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Initial Setup Costs</CardTitle>
            <Button onClick={handleAddSetupCost}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Setup Cost
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(costMetrics.setupCosts || []).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No setup costs added yet. Click "Add Setup Cost" to get started.
              </p>
            ) : (
              (costMetrics.setupCosts || []).map((cost) => (
                <div key={cost.id} className="flex gap-4 items-start border-b pb-4">
                  <div className="flex-grow">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Cost Name</Label>
                        <InputWithFocus
                          id={`setup-name-${cost.id}`}
                          type="text"
                          value={cost.name || ''}
                          onChange={(value) => handleUpdateSetupCost(cost.id, 'name', value)}
                          placeholder="e.g., Equipment Purchase"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cost Amount ($)</Label>
                        <InputWithFocus
                          id={`setup-amount-${cost.id}`}
                          type="number"
                          min={0}
                          step={0.01}
                          value={cost.amount || 0}
                          onChange={(value) => handleUpdateSetupCost(cost.id, 'amount', value)}
                          parser={(v) => parseFloat(v)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-2">
                      <Switch
                        checked={cost.amortize || false}
                        onCheckedChange={(checked) => handleUpdateSetupCost(cost.id, 'amortize', checked)}
                        id={`amortize-${cost.id}`}
                      />
                      <Label htmlFor={`amortize-${cost.id}`}>Amortize over forecast period</Label>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSetupCost(cost.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* COGS (Cost of Goods Sold) Settings */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Cost of Goods Sold (COGS) Settings</CardTitle>
          <CardDescription>
            Configure COGS settings based on your product type. These costs are directly tied to each unit sold.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* F&B COGS */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="fbCogPercentage">F&B COGS Percentage</Label>
              <span className="text-xs text-gray-500">Default: 30%</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <InputWithFocus
                  id="fbCogPercentage"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={costMetrics.fbCogPercentage === undefined ? '' : costMetrics.fbCogPercentage}
                  onChange={(value) => handleCostMetricsChange('fbCogPercentage', value)}
                  parser={(v) => parseFloat(v)}
                />
                <p className="text-xs text-gray-500">
                  Percentage of F&B revenue allocated to cost of goods
                </p>
              </div>
            </div>
          </div>

          {/* Merchandise COGS */}
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between items-center">
              <Label htmlFor="merchandiseCogPerUnit">Merchandise COGS Per Unit</Label>
              <span className="text-xs text-gray-500">$ per unit</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <InputWithFocus
                  id="merchandiseCogPerUnit"
                  type="number"
                  min={0}
                  step={0.01}
                  value={costMetrics.merchandiseCogPerUnit === undefined ? '' : costMetrics.merchandiseCogPerUnit}
                  onChange={(value) => handleCostMetricsChange('merchandiseCogPerUnit', value)}
                  parser={(v) => parseFloat(v)}
                />
                <p className="text-xs text-gray-500">
                  Cost to produce each unit of merchandise
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marketing Budget */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Marketing Budget</CardTitle>
          <CardDescription>
            Configure your marketing budget and channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Marketing allocation mode selection */}
          <div className="space-y-2 mb-6">
            <Label>Marketing Budget Allocation Method</Label>
            <div className="flex gap-2">
              <Button 
                variant={costMetrics.marketing.allocationMode === 'simple' ? "default" : "outline"}
                className="flex-1 justify-start" 
                onClick={() => handleAllocationModeChange('simple')}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Simple Budget
                <span className="ml-2 text-xs opacity-70">
                  (Single Budget)
                </span>
              </Button>
              <Button 
                variant={costMetrics.marketing.allocationMode === 'channels' ? "default" : "outline"}
                className="flex-1 justify-start" 
                onClick={() => handleAllocationModeChange('channels')}
              >
                <Award className="h-4 w-4 mr-2" />
                Channels
                <span className="ml-2 text-xs opacity-70">
                  (Detailed)
                </span>
              </Button>
            </div>
          </div>

          {/* Simple Marketing Budget */}
          {costMetrics.marketing.allocationMode === 'simple' && (
            <div className="space-y-4">
              {/* Budget Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="budget-type">Budget Type</Label>
                <Select
                  value={costMetrics.marketing.type || 'weekly'}
                  onValueChange={(value) => handleMarketingCostChange('type', value)}
                >
                  <SelectTrigger id="budget-type">
                    <SelectValue placeholder="Select budget type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly Budget</SelectItem>
                    <SelectItem value="campaign">Campaign Budget</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Weekly Budget Input */}
              {costMetrics.marketing.type === 'weekly' && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="weekly-budget">Weekly Marketing Budget ($)</Label>
                  <InputWithFocus
                    id="weekly-budget"
                    type="number"
                    min={0}
                    step={0.01}
                    value={costMetrics.marketing.weeklyBudget || 0}
                    onChange={(value) => handleMarketingCostChange('weeklyBudget', value)}
                    parser={(v) => parseFloat(v)}
                  />
                </div>
              )}

              {/* Campaign Budget Inputs */}
              {costMetrics.marketing.type === 'campaign' && (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-budget">Campaign Budget ($)</Label>
                    <InputWithFocus
                      id="campaign-budget"
                      type="number"
                      min={0}
                      step={0.01}
                      value={costMetrics.marketing.campaignBudget || 0}
                      onChange={(value) => handleMarketingCostChange('campaignBudget', value)}
                      parser={(v) => parseFloat(v)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campaign-duration">Campaign Duration (Weeks)</Label>
                    <InputWithFocus
                      id="campaign-duration"
                      type="number"
                      min={1}
                      max={52}
                      value={costMetrics.marketing.campaignDurationWeeks || 12}
                      onChange={(value) => handleMarketingCostChange('campaignDurationWeeks', value)}
                      parser={(v) => parseInt(v)}
                    />
                  </div>
                </div>
              )}

              {/* Only show depreciation for weekly budget */}
              {costMetrics.marketing.type === 'weekly' && (
                <div className="mt-8 pt-6 border-t">
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      id="marketingDepreciation"
                      checked={costMetrics.marketing.depreciation?.enabled || false}
                      onCheckedChange={(checked: boolean) => handleMarketingDepreciationChange('enabled', checked)}
                    />
                    <Label htmlFor="marketingDepreciation">Enable Marketing Cost Depreciation</Label>
                  </div>

                  {costMetrics.marketing.depreciation?.enabled && (
                    <div className="grid gap-6 md:grid-cols-3 mt-4">
                      <div className="space-y-3">
                        <Label htmlFor="depreciationStart">Start Week</Label>
                        <Input
                          id="depreciationStart"
                          type="number"
                          min="1"
                          value={costMetrics.marketing.depreciation?.startWeek || 1}
                          onChange={(e) => handleMarketingDepreciationChange('startWeek', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="depreciationRate">Weekly Depreciation Rate (%)</Label>
                        <Input
                          id="depreciationRate"
                          type="number"
                          step="0.1"
                          value={costMetrics.marketing.depreciation?.weeklyDepreciationRate || 0}
                          onChange={(e) => handleMarketingDepreciationChange('weeklyDepreciationRate', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="minimumAmount">Minimum Amount ($)</Label>
                        <Input
                          id="minimumAmount"
                          type="number"
                          step="0.01"
                          value={costMetrics.marketing.depreciation?.minimumAmount || 0}
                          onChange={(e) => handleMarketingDepreciationChange('minimumAmount', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Channel-based Marketing Budget */}
          {costMetrics.marketing.allocationMode === 'channels' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-medium">Marketing Channels</h3>
                <Button onClick={handleAddMarketingChannel} variant="outline">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Marketing Channel
                </Button>
              </div>
              
              {/* Marketing Budget Summary */}
              {costMetrics.marketing.channels && costMetrics.marketing.channels.length > 0 ? (
                <div className="bg-secondary/20 p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Total Marketing Budget</h4>
                      <p className="text-2xl font-bold">
                        ${costMetrics.marketing.channels.reduce((sum: number, channel: any) => sum + (channel.budget || 0), 0).toLocaleString()} / week
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Marketing-to-Revenue Ratio</h4>
                      <p className="text-2xl font-bold">
                        {calculateMarketingToRevenueRatio().toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {calculateMarketingToRevenueRatio() > 20 ? 
                          "Higher than recommended (15-20%)" : 
                          calculateMarketingToRevenueRatio() < 10 ?
                          "Lower than recommended (10-15%)" :
                          "Within recommended range (10-20%)"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Marketing Budget Allocation */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-3">Budget Allocation</h4>
                    <div className="h-8 w-full bg-gray-200 rounded-lg overflow-hidden flex">
                      {costMetrics.marketing.channels.map((channel: any, index: number) => {
                        // Generate a color based on index
                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                        const color = colors[index % colors.length];
                        
                        return (
                          <div 
                            key={channel.id}
                            className={`${color} h-full`}
                            style={{ 
                              width: `${channel.allocation || 0}%`,
                              minWidth: channel.allocation && channel.allocation > 0 ? '20px' : '0'
                            }}
                            title={`${channel.name}: ${channel.allocation || 0}%`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {costMetrics.marketing.channels.map((channel: any, index: number) => {
                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                        const color = colors[index % colors.length];
                        
                        return (
                          <div key={channel.id} className="flex items-center text-sm">
                            <div className={`w-3 h-3 ${color} rounded-sm mr-1`}></div>
                            <span>{channel.name}: {channel.allocation || 0}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-500 mb-2">No marketing channels defined</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Start by adding your marketing channels and allocating budget
                  </p>
                </div>
              )}

              {/* Marketing Channel Entries */}
              <div className="space-y-4 mt-6">
                {(costMetrics.marketing.channels || []).map((channel: any) => (
                  <div key={channel.id} className="flex gap-4 items-center border-b pb-4">
                    <div className="flex-grow grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor={`channel-name-${channel.id}`}>Channel Name</Label>
                        <InputWithFocus
                          id={`channel-name-${channel.id}`}
                          value={channel.name || ''}
                          onChange={(value) => handleUpdateMarketingChannel(channel.id, 'name', value)}
                          placeholder="e.g., Social Media Ads"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`channel-budget-${channel.id}`}>Weekly Budget ($)</Label>
                        <InputWithFocus
                          id={`channel-budget-${channel.id}`}
                          type="number"
                          min={0}
                          step={0.01}
                          value={channel.budget || 0}
                          onChange={(value) => handleUpdateMarketingChannel(channel.id, 'budget', value)}
                          parser={(v) => parseFloat(v)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`channel-target-${channel.id}`}>Target Audience</Label>
                        <InputWithFocus
                          id={`channel-target-${channel.id}`}
                          value={channel.targetAudience || ''}
                          onChange={(value) => handleUpdateMarketingChannel(channel.id, 'targetAudience', value)}
                          placeholder="e.g., Ages 25-34"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <Label htmlFor={`channel-description-${channel.id}`}>Description</Label>
                        <InputWithFocus
                          id={`channel-description-${channel.id}`}
                          value={channel.description || ''}
                          onChange={(value) => handleUpdateMarketingChannel(channel.id, 'description', value)}
                          placeholder="Details about this marketing channel"
                        />
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteMarketingChannel(channel.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Marketing Cost Depreciation for channels */}
              <div className="space-y-4 border-t pt-6 mt-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="channelMarketingDepreciation"
                    checked={costMetrics.marketing.depreciation?.enabled || false}
                    onCheckedChange={(checked: boolean) => handleMarketingDepreciationChange('enabled', checked)}
                  />
                  <Label htmlFor="channelMarketingDepreciation">Enable Marketing Cost Depreciation</Label>
                </div>

                {costMetrics.marketing.depreciation?.enabled && (
                  <div className="grid gap-6 md:grid-cols-3 mt-4">
                    <div className="space-y-3">
                      <Label htmlFor="channelDepreciationStart">Start Week</Label>
                      <Input
                        id="channelDepreciationStart"
                        type="number"
                        min="1"
                        value={costMetrics.marketing.depreciation?.startWeek || 1}
                        onChange={(e) => handleMarketingDepreciationChange('startWeek', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="channelDepreciationRate">Weekly Depreciation Rate (%)</Label>
                      <Input
                        id="channelDepreciationRate"
                        type="number"
                        step="0.1"
                        value={costMetrics.marketing.depreciation?.weeklyDepreciationRate || 0}
                        onChange={(e) => handleMarketingDepreciationChange('weeklyDepreciationRate', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="channelMinimumAmount">Minimum Amount ($)</Label>
                      <Input
                        id="channelMinimumAmount"
                        type="number"
                        step="0.01"
                        value={costMetrics.marketing.depreciation?.minimumAmount || 0}
                        onChange={(e) => handleMarketingDepreciationChange('minimumAmount', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staffing Costs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Staffing Costs</CardTitle>
            {costMetrics.staffingAllocationMode === 'detailed' && (
              <Button 
                variant="outline" 
                className="w-full flex items-center" 
                onClick={handleAddStaffRole}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Staff Role ($ per week)
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Staffing allocation method selection */}
            <div className="space-y-2">
              <Label>Staffing Allocation Method</Label>
              <div className="flex gap-2">
                <Button 
                  variant={costMetrics.staffingAllocationMode === 'simple' ? "default" : "outline"}
                  className="flex-1 justify-start" 
                  onClick={() => handleStaffingAllocationModeChange('simple')}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Simple
                  <span className="ml-2 text-xs opacity-70">
                    (Weekly Staff Cost)
                  </span>
                </Button>
                <Button 
                  variant={costMetrics.staffingAllocationMode === 'detailed' ? "default" : "outline"}
                  className="flex-1 justify-start" 
                  onClick={() => handleStaffingAllocationModeChange('detailed')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Detailed
                  <span className="ml-2 text-xs opacity-70">
                    (Individual Staff)
                  </span>
                </Button>
              </div>
            </div>

            {/* Simple staffing allocation */}
            {costMetrics.staffingAllocationMode === 'simple' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="weeklyStaffCost">Weekly Staff Cost ($)</Label>
                    <InputWithFocus
                      id="weeklyStaffCost"
                      type="number"
                      min={0}
                      step={0.01}
                      value={costMetrics.weeklyStaffCost || 0}
                      onChange={(value) => handleCostMetricsChange('weeklyStaffCost', value)}
                      parser={(v) => parseFloat(v)}
                    />
                  </div>
                  {currentProduct?.info.forecastType === 'per-event' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="additionalStaffing">Additional Staff per Event</Label>
                        <InputWithFocus
                          id="additionalStaffing"
                          type="number"
                          min={0}
                          value={costMetrics.additionalStaffingPerEvent || 0}
                          onChange={(value) => handleCostMetricsChange('additionalStaffingPerEvent', value)}
                          parser={(v) => parseInt(v)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="staffingCostPerson">Cost per Staff Member per Event ($)</Label>
                        <InputWithFocus
                          id="staffingCostPerson"
                          type="number"
                          step={0.01}
                          value={costMetrics.staffingCostPerPerson || 0}
                          onChange={(value) => handleCostMetricsChange('staffingCostPerPerson', value)}
                          parser={(v) => parseFloat(v)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Detailed staff role management */}
            {costMetrics.staffingAllocationMode === 'detailed' && (
              <>
                {/* Staff Roles */}
                <div className="space-y-4">
                  {(costMetrics.staffRoles || []).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No staff roles added yet. Click "Add Staff Role" to define your team structure.
                    </p>
                  ) : (
                    (costMetrics.staffRoles || []).map((role: any) => (
                      <div key={role.id} className="flex gap-4 items-start border-b pb-4">
                        <div className="flex-grow">
                          <div className="grid gap-4 md:grid-cols-4">
                            <div className="space-y-2">
                              <Label>Role Title</Label>
                              <Input
                                value={role.role}
                                onChange={(e) => handleUpdateStaffRole(role.id, 'role', e.target.value)}
                                placeholder="e.g., Event Manager, Staff, Security"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Number Needed</Label>
                              <Input
                                type="number"
                                min="1"
                                value={role.count}
                                onChange={(e) => handleUpdateStaffRole(role.id, 'count', parseInt(e.target.value))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Cost per Person ($ per week)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={role.costPerPerson}
                                onChange={(e) => handleUpdateStaffRole(role.id, 'costPerPerson', parseFloat(e.target.value))}
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <Label>Notes</Label>
                            <Input
                              value={role.notes}
                              onChange={(e) => handleUpdateStaffRole(role.id, 'notes', e.target.value)}
                              placeholder="Additional details about this role"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStaffRole(role.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Costs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Event Costs</CardTitle>
            <Button onClick={handleAddEventCost}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Event Cost
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(costMetrics.eventCosts || []).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No event costs added yet. Click "Add Event Cost" to get started.
              </p>
            ) : (
              (costMetrics.eventCosts || []).map((cost: any) => (
                <div key={cost.id} className="flex gap-4 items-center border-b pb-4">
                  <div className="flex-grow grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`cost-name-${cost.id}`}>Cost Name</Label>
                      <InputWithFocus
                        id={`cost-name-${cost.id}`}
                        type="text"
                        value={cost.name || ''}
                        onChange={(value) => handleUpdateEventCost(cost.id, 'name', value)}
                        placeholder="e.g., Venue Rental"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`cost-amount-${cost.id}`}>Weekly Amount ($)</Label>
                      <InputWithFocus
                        id={`cost-amount-${cost.id}`}
                        type="number"
                        min={0}
                        step={0.01}
                        value={cost.amount || 0}
                        onChange={(value) => handleUpdateEventCost(cost.id, 'amount', value)}
                        placeholder="0.00"
                        parser={(v) => parseFloat(v)}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEventCost(cost.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
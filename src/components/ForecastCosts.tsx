import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { PlusCircle, Trash2, DollarSign, Users, Award } from 'lucide-react';
import useStore from '../store/useStore';
import { generateWeeklyProjections } from '../lib/calculations';
import { Spinner } from './ui/spinner';
import { uniqueId, formatCurrency } from '../lib/utils';
import type { 
  EventCostItem, 
  SetupCostItem, 
  MarketingChannelItem, 
  StaffRoleItem,
  Product
} from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useNotifications } from '../contexts/NotificationContext';

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
  // Local state to handle the input value
  const [localValue, setLocalValue] = useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // Update local value when prop value changes (avoid during active typing)
  useEffect(() => {
    // Only sync when not actively typing and the values are very different
    if (!isFocused && String(localValue) !== String(value)) {
      setLocalValue(value);
    }
  }, [value, isFocused, localValue]);
  
  // Handle input changes locally without losing focus
  const handleChange = (e: { target: { value: string } }) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
  };
  
  // Handle blur event to notify parent component of value change
  const handleBlur = () => {
    setIsFocused(false);
    
    // For number inputs, parse before sending to parent
    if (type === 'number') {
      // Allow empty value
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

  // Handle focus event
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

  // Update projections whenever metrics change
  useEffect(() => {
    if (currentProduct) {
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
  }, [currentProduct?.costMetrics]);

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
      const totalChannelBudget = value.reduce((sum, channel) => sum + (channel.budget || 0), 0);
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

  // Handle marketing channel management
  const handleAddMarketingChannel = useCallback(() => {
    const newChannel: MarketingChannelItem = {
      id: uniqueId('marketing-channel-'),
      name: '',
      budget: 0,
      allocation: 0, // Percentage allocation of total budget
      targetAudience: '',  // New field for target audience
      description: ''  // Replacing notes with more descriptive field name
    };

    const updatedChannels = [...(costMetrics.marketing.channels || []), newChannel];
    handleMarketingCostChange('channels', updatedChannels);
  }, [costMetrics.marketing.channels, handleMarketingCostChange]);

  const handleUpdateMarketingChannel = useCallback((id: string, field: keyof MarketingChannelItem, value: unknown) => {
    const updatedChannels = (costMetrics.marketing.channels || []).map((channel: MarketingChannelItem) => 
      channel.id === id ? { ...channel, [field]: value } : channel
    );
    
    // Only recalculate allocations when budget changes AND it's not during typing
    // This prevents focus loss during input
    if (field === 'budget' && typeof value === 'number') {
      // Delay allocation updates to avoid input focus issues
      setTimeout(() => {
        const totalBudget = updatedChannels.reduce((sum: number, ch: MarketingChannelItem) => sum + (ch.budget || 0), 0);
        
        if (totalBudget > 0) {
          const channelsWithAllocations = updatedChannels.map((ch: MarketingChannelItem) => ({
            ...ch,
            allocation: Math.round(((ch.budget || 0) / totalBudget) * 100)
          }));
          
          handleMarketingCostChange('channels', channelsWithAllocations);
        }
      }, 300);
      
      // Just update the current value immediately to maintain responsiveness
      handleMarketingCostChange('channels', updatedChannels);
    } else {
      // For non-budget field updates, no need for special handling
      handleMarketingCostChange('channels', updatedChannels);
    }
  }, [costMetrics.marketing.channels, handleMarketingCostChange]);

  const handleDeleteMarketingChannel = useCallback((id: string) => {
    const updatedChannels = (costMetrics.marketing.channels || []).filter((channel: MarketingChannelItem) => channel.id !== id);
    handleMarketingCostChange('channels', updatedChannels);
  }, [costMetrics.marketing.channels, handleMarketingCostChange]);

  // Handle cost metrics changes - MOVED THIS UP before it's used
  const handleCostMetricsChange = useCallback((field: keyof typeof costMetrics, value: unknown) => {
    // Use a small delay for operations that might cause re-renders
    if (field === 'fbCogPercentage' || field === 'merchandiseCogPerUnit' || 
        field === 'weeklyStaffCost' || field === 'additionalStaffingPerEvent' || 
        field === 'staffingCostPerPerson') {
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

  // Handle staff role management
  const handleAddStaffRole = useCallback(() => {
    const newRole: StaffRoleItem = {
      id: uniqueId('staff-role-'),
      role: '',
      count: 1,
      costPerPerson: 0,
      notes: ''
    };

    const updatedRoles = [...(costMetrics.staffRoles || []), newRole];
    handleCostMetricsChange('staffRoles', updatedRoles);
  }, [costMetrics.staffRoles, handleCostMetricsChange]);

  const handleUpdateStaffRole = useCallback((id: string, field: keyof StaffRoleItem, value: unknown) => {
    const updatedRoles = (costMetrics.staffRoles || []).map((role: StaffRoleItem) => 
      role.id === id ? { ...role, [field]: value } : role
    );
    handleCostMetricsChange('staffRoles', updatedRoles);
  }, [costMetrics.staffRoles, handleCostMetricsChange]);

  const handleDeleteStaffRole = useCallback((id: string) => {
    const updatedRoles = (costMetrics.staffRoles || []).filter((role: StaffRoleItem) => role.id !== id);
    handleCostMetricsChange('staffRoles', updatedRoles);
  }, [costMetrics.staffRoles, handleCostMetricsChange]);

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

  // Handle event cost changes
  const handleAddEventCost = useCallback(() => {
    const newCost: EventCostItem = {
      id: uniqueId('event-cost-'),
      name: '',
      amount: 0
    };

    handleCostMetricsChange('eventCosts', [...(costMetrics.eventCosts || []), newCost]);
  }, [costMetrics.eventCosts, handleCostMetricsChange]);

  const handleUpdateEventCost = useCallback((id: string, field: keyof EventCostItem, value: unknown) => {
    const updatedCosts = (costMetrics.eventCosts || []).map(cost => 
      cost.id === id ? { ...cost, [field]: value } : cost
    );
    handleCostMetricsChange('eventCosts', updatedCosts);
  }, [costMetrics.eventCosts, handleCostMetricsChange]);

  const handleDeleteEventCost = useCallback((id: string) => {
    const updatedCosts = (costMetrics.eventCosts || []).filter(cost => cost.id !== id);
    handleCostMetricsChange('eventCosts', updatedCosts);
  }, [costMetrics.eventCosts, handleCostMetricsChange]);

  // Handle setup cost changes
  const handleAddSetupCost = useCallback(() => {
    const newCost: SetupCostItem = {
      id: uniqueId('setup-cost-'),
      name: '',
      amount: 0,
      amortize: false
    };

    handleCostMetricsChange('setupCosts', [...(costMetrics.setupCosts || []), newCost]);
  }, [costMetrics.setupCosts, handleCostMetricsChange]);

  const handleUpdateSetupCost = useCallback((id: string, field: keyof SetupCostItem, value: unknown) => {
    const updatedCosts = (costMetrics.setupCosts || []).map(cost => 
      cost.id === id ? { ...cost, [field]: value } : cost
    );
    handleCostMetricsChange('setupCosts', updatedCosts);
  }, [costMetrics.setupCosts, handleCostMetricsChange]);

  const handleDeleteSetupCost = useCallback((id: string) => {
    const updatedCosts = (costMetrics.setupCosts || []).filter(cost => cost.id !== id);
    handleCostMetricsChange('setupCosts', updatedCosts);
  }, [costMetrics.setupCosts, handleCostMetricsChange]);

  // Create memoized common handler for input changes to avoid creating new functions on each render
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, field: string, callback: (field: string, value: unknown) => void, parser: (value: string) => unknown = (v) => v) => {
    callback(field, parser(e.target.value));
  }, []);

  const handleSelectChange = useCallback((value: string, field: string, callback: (field: string, value: unknown) => void) => {
    callback(field, value);
  }, []);

  const handleSwitchChange = useCallback((checked: boolean, field: string, callback: (field: string, value: unknown) => void) => {
    callback(field, checked);
  }, []);

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

  // Calculate marketing as percentage of projected revenue
  const calculateMarketingToRevenueRatio = () => {
    if (!currentProduct?.weeklyProjections) return 0;
    
    const totalProjectedRevenue = currentProduct.weeklyProjections.reduce(
      (sum, week) => sum + (week.totalRevenue || 0),
      0
    );
    
    const totalMarketingBudget = (costMetrics.marketing.channels || []).reduce(
      (sum, channel) => sum + (channel.budget || 0) * (currentProduct.info.forecastPeriod || 12),
      0
    );
    
    return totalProjectedRevenue > 0 
      ? (totalMarketingBudget / totalProjectedRevenue) * 100 
      : 0;
  };

  // Add F&B calculation helper functions
  const calculateAverageWeeklyFbRevenue = (product: unknown, metrics: unknown) => {
    if (!product) return 0;
    
    const fbSpend = product?.revenueMetrics?.fbSpend || 0;
    const fbConversionRate = product?.revenueMetrics?.fbConversionRate || 0;
    const weeklyVisitors = product?.growthMetrics?.weeklyVisitors || 0;
    const weeklyGrowthRate = (product?.growthMetrics?.weeklyGrowthRate || 0) / 100;
    
    let growthSum = 0;
    for (let i = 0; i < 12; i++) {
      growthSum += Math.pow(1 + weeklyGrowthRate, i);
    }
    
    return fbSpend * fbConversionRate * weeklyVisitors * (growthSum / 12);
  };
  
  const calculateAverageWeeklyFbCogs = (product: unknown, metrics: unknown) => {
    const revenue = calculateAverageWeeklyFbRevenue(product, metrics);
    const cogsPercentage = (metrics.fbCogPercentage || 30) / 100;
    return revenue * cogsPercentage;
  };
  
  const calculate12WeekFbRevenue = (product: unknown, metrics: unknown) => {
    if (!product) return 0;
    
    const fbSpend = product?.revenueMetrics?.fbSpend || 0;
    const fbConversionRate = product?.revenueMetrics?.fbConversionRate || 0;
    const weeklyVisitors = product?.growthMetrics?.weeklyVisitors || 0;
    const weeklyGrowthRate = (product?.growthMetrics?.weeklyGrowthRate || 0) / 100;
    
    let growthSum = 0;
    for (let i = 0; i < 12; i++) {
      growthSum += Math.pow(1 + weeklyGrowthRate, i);
    }
    
    return fbSpend * fbConversionRate * weeklyVisitors * growthSum;
  };
  
  const calculate12WeekFbCogs = (product: unknown, metrics: unknown) => {
    const revenue = calculate12WeekFbRevenue(product, metrics);
    const cogsPercentage = (metrics.fbCogPercentage || 30) / 100;
    return revenue * cogsPercentage;
  };

  // If loading, show spinner
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
        <span className="ml-2">Loading cost metrics...</span>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error.message}</span>
        <button 
          className="absolute top-0 right-0 px-4 py-3"
          onClick={() => clearError()}
        >
          <span className="sr-only">Dismiss</span>
          <span className="text-2xl">&times;</span>
        </button>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="text-center py-8 text-gray-500">
        No product selected or product not found.
      </div>
    );
  }

  // Memoized Components for Performance
  const MarketingChannelEntry = React.memo(({ 
    channel, 
    onUpdate, 
    onDelete 
  }: { 
    channel: MarketingChannelItem; 
    onUpdate: (id: string, field: keyof MarketingChannelItem, value: unknown) => void; 
    onDelete: (id: string) => void; 
  }) => {
    // Local state to handle input values before committing changes
    const [localBudget, setLocalBudget] = React.useState<string>(
      channel.budget !== undefined ? channel.budget.toString() : ''
    );
    
    const [localTargetAudience, setLocalTargetAudience] = React.useState<string>(
      channel.targetAudience || ''
    );
    
    const [localDescription, setLocalDescription] = React.useState<string>(
      channel.description || ''
    );
    
    // Update local state when props change (except during active editing)
    React.useEffect(() => {
      setLocalBudget(channel.budget !== undefined ? channel.budget.toString() : '');
      setLocalTargetAudience(channel.targetAudience || '');
      setLocalDescription(channel.description || '');
    }, [channel.budget, channel.targetAudience, channel.description]);
    
    // Handle budget input changes without losing focus
    const handleBudgetChange = (e: { target: { value: string } }) => {
      const inputValue = e.target.value;
      setLocalBudget(inputValue);
    };
    
    // Only update the actual budget on blur
    const handleBudgetBlur = () => {
      const value = localBudget === '' ? 0 : parseFloat(localBudget);
      onUpdate(channel.id, 'budget', isNaN(value) ? 0 : value);
    };
    
    // Handle input changes for target audience
    const handleTargetAudienceChange = (e: { target: { value: string } }) => {
      const value = e.target.value;
      setLocalTargetAudience(value);
    };
    
    // Only update on blur for target audience
    const handleTargetAudienceBlur = () => {
      onUpdate(channel.id, 'targetAudience', localTargetAudience);
    };
    
    // Handle input changes for description
    const handleDescriptionChange = (e: { target: { value: string } }) => {
      const value = e.target.value;
      setLocalDescription(value);
    };
    
    // Only update on blur for description
    const handleDescriptionBlur = () => {
      onUpdate(channel.id, 'description', localDescription);
    };
    
    return (
      <div className="flex gap-4 items-start border border-gray-200 rounded-md p-5 hover:bg-gray-50">
        <div className="flex-grow">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3">
              <Label>Channel Name</Label>
              <div className="relative">
                <Select
                  value={channel.name || ""}
                  onValueChange={(value) => onUpdate(channel.id, 'name', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent 
                    className="bg-white shadow-lg" 
                    position="popper" 
                    sideOffset={10}
                    align="start"
                    avoidCollisions={true}
                    style={{ zIndex: 9999999 }}
                  >
                    <div className="min-w-[200px] py-1">
                      <SelectItem value="Social Media Advertising" className="py-2.5">Social Media Advertising</SelectItem>
                      <SelectItem value="Google/Search Ads" className="py-2.5">Google/Search Ads</SelectItem>
                      <SelectItem value="Print Media" className="py-2.5">Print Media</SelectItem>
                      <SelectItem value="Event Marketing" className="py-2.5">Event Marketing</SelectItem>
                      <SelectItem value="Influencer Partnerships" className="py-2.5">Influencer Partnerships</SelectItem>
                      <SelectItem value="Email Marketing" className="py-2.5">Email Marketing</SelectItem>
                      <SelectItem value="Content Marketing" className="py-2.5">Content Marketing</SelectItem>
                      <SelectItem value="Referral Programs" className="py-2.5">Referral Programs</SelectItem>
                      <SelectItem value="Other" className="py-2.5">Other (Custom)</SelectItem>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3">
              <Label>Weekly Budget ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={localBudget}
                onChange={handleBudgetChange}
                onBlur={handleBudgetBlur}
              />
            </div>
            <div className="space-y-3">
              <Label>Budget Allocation</Label>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${channel.allocation || 0}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm font-medium">{channel.allocation || 0}%</span>
              </div>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 mt-4">
            <div className="space-y-3">
              <Label>Target Audience</Label>
              <Input
                value={localTargetAudience}
                onChange={handleTargetAudienceChange}
                onBlur={handleTargetAudienceBlur}
                placeholder="Who this channel targets"
                style={{ zIndex: 10 }}
              />
            </div>
            <div className="space-y-3">
              <Label>Description</Label>
              <Input
                value={localDescription}
                onChange={handleDescriptionChange}
                onBlur={handleDescriptionBlur}
                placeholder="Description of this marketing channel"
                style={{ zIndex: 10 }}
              />
            </div>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(channel.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  });
  
  MarketingChannelEntry.displayName = 'MarketingChannelEntry';
  
  const EventCostEntry = React.memo(({ 
    cost, 
    onUpdate, 
    onDelete 
  }: { 
    cost: EventCostItem; 
    onUpdate: (id: string, field: keyof EventCostItem, value: unknown) => void; 
    onDelete: (id: string) => void; 
  }) => {
    // Generate unique IDs for these inputs based on the cost ID
    const nameInputId = `cost-name-${cost.id}`;
    const amountInputId = `cost-amount-${cost.id}`;
    
    // Use refs to set initial values and attach event listeners after render
    const containerRef = React.useRef<HTMLDivElement>(null);
    
    // Set up the vanilla inputs once after mounting
    React.useLayoutEffect(() => {
      // Set initial values directly in the DOM after render
      if (containerRef.current) {
        const nameInput = document.getElementById(nameInputId) as HTMLInputElement;
        const amountInput = document.getElementById(amountInputId) as HTMLInputElement;
        
        if (nameInput) {
          // Set initial value
          nameInput.value = cost.name;
          
          // Set up vanilla event listener bypassing React entirely
          nameInput.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            onUpdate(cost.id, 'name', target.value);
          });
        }
        
        if (amountInput) {
          // Set initial value (display empty for zero)
          amountInput.value = cost.amount === 0 ? '' : String(cost.amount);
          
          // Set up vanilla event listener bypassing React entirely
          amountInput.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            const value = target.value === '' ? 0 : parseFloat(target.value);
            if (!isNaN(value)) {
              onUpdate(cost.id, 'amount', value);
            }
          });
        }
      }
      
      // Cleanup event listeners
      return () => {
        const nameInput = document.getElementById(nameInputId);
        const amountInput = document.getElementById(amountInputId);
        
        if (nameInput) {
          nameInput.removeEventListener('input', () => {});
        }
        
        if (amountInput) {
          amountInput.removeEventListener('input', () => {});
        }
      };
    // Only run this effect on mount and unmount, not on re-renders
    }, []); 
    
    // This is where we render the container with uncontrolled inputs
    return (
      <div ref={containerRef} className="flex gap-4 items-center border-b pb-4">
        <div className="flex-grow grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Cost Name</Label>
            {/* Uncontrolled input with ID for vanilla JS to grab */}
            <input
              id={nameInputId}
              type="text"
              placeholder="e.g., Venue Rental"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              // Don't use value or onChange props - let vanilla JS handle it
            />
          </div>
          <div className="space-y-2">
            <Label>Weekly Amount ($)</Label>
            {/* Uncontrolled input with ID for vanilla JS to grab */}
            <input
              id={amountInputId}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              // Don't use value or onChange props - let vanilla JS handle it
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(cost.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  });
  
  EventCostEntry.displayName = 'EventCostEntry';

  // Create a separate SetupCostEntry component to fix hooks issue
  const SetupCostEntry = React.memo(({ 
    cost, 
    onUpdate, 
    onDelete 
  }: { 
    cost: SetupCostItem; 
    onUpdate: (id: string, field: keyof SetupCostItem, value: unknown) => void; 
    onDelete: (id: string) => void; 
  }) => {
    // Generate unique IDs for these inputs based on the cost ID
    const setupNameInputId = `setup-name-${cost.id}`;
    const setupAmountInputId = `setup-amount-${cost.id}`;
    
    // Local state to handle input values before committing changes
    const [localName, setLocalName] = React.useState<string>(cost.name || '');
    const [localAmount, setLocalAmount] = React.useState<string>(
      cost.amount !== undefined ? cost.amount.toString() : '0'
    );
    
    // Update local state when props change (except during active editing)
    const setupItemRef = React.useRef<HTMLDivElement>(null);
    
    // Sync local state with props when they change
    React.useEffect(() => {
      setLocalName(cost.name || '');
      setLocalAmount(cost.amount !== undefined ? cost.amount.toString() : '0');
    }, [cost.name, cost.amount]);
    
    // Handle input changes for name
    const handleNameChange = (e: { target: { value: string } }) => {
      setLocalName(e.target.value);
    };
    
    // Update on blur for name
    const handleNameBlur = () => {
      onUpdate(cost.id, 'name', localName);
    };
    
    // Handle input changes for amount
    const handleAmountChange = (e: { target: { value: string } }) => {
      setLocalAmount(e.target.value);
    };
    
    // Update on blur for amount
    const handleAmountBlur = () => {
      const value = localAmount === '' ? 0 : parseFloat(localAmount);
      onUpdate(cost.id, 'amount', isNaN(value) ? 0 : value);
    };

    return (
      <div key={cost.id} ref={setupItemRef} className="flex gap-4 items-start border-b pb-4">
        <div className="flex-grow">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Cost Name</Label>
              <input
                id={setupNameInputId}
                type="text"
                value={localName}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                placeholder="e.g., Equipment Purchase"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ zIndex: 10 }}
              />
            </div>
            <div className="space-y-2">
              <Label>Cost Amount ($)</Label>
              <input
                id={setupAmountInputId}
                type="number"
                min="0"
                step="0.01"
                value={localAmount}
                onChange={handleAmountChange}
                onBlur={handleAmountBlur}
                placeholder="0.00"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ zIndex: 10 }}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <Switch
              checked={cost.amortize}
              onCheckedChange={(checked) => onUpdate(cost.id, 'amortize', checked)}
              id={`amortize-${cost.id}`}
            />
            <Label htmlFor={`amortize-${cost.id}`}>Amortize over forecast period</Label>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(cost.id)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-2"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  });

  SetupCostEntry.displayName = 'SetupCostEntry';

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
                <SetupCostEntry
                  key={cost.id}
                  cost={cost}
                  onUpdate={handleUpdateSetupCost}
                  onDelete={handleDeleteSetupCost}
                />
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
                  placeholder="30"
                />
                <p className="text-xs text-gray-500">
                  Percentage of F&B revenue that goes to direct costs (ingredients, preparation, etc.)
                </p>
              </div>
              <div className="flex flex-col space-y-2">
                <div className="bg-orange-50 p-3 rounded-md border border-orange-200">
                  <h4 className="text-sm font-medium text-orange-700 mb-1">F&B COGS Impact</h4>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Average Weekly F&B Revenue:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          calculateAverageWeeklyFbRevenue(currentProduct, costMetrics)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Weekly F&B COGS:</span>
                      <span className="font-medium text-orange-700">
                        {formatCurrency(
                          calculateAverageWeeklyFbCogs(currentProduct, costMetrics)
                        )}
                      </span>
                    </div>
                    <div className="border-t border-orange-200 my-1 pt-1"></div>
                    <div className="flex justify-between">
                      <span>12-Week F&B Revenue:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          calculate12WeekFbRevenue(currentProduct, costMetrics)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>12-Week F&B COGS:</span>
                      <span className="font-medium text-orange-700">
                        {formatCurrency(
                          calculate12WeekFbCogs(currentProduct, costMetrics)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    // Update projections directly
                    if (currentProduct) {
                      console.log("Updating projections with current cost metrics");
                      
                      // Generate new projections with current cost metrics
                      const updatedProjections = generateWeeklyProjections(
                        currentProduct.info,
                        currentProduct.growthMetrics,
                        currentProduct.revenueMetrics,
                        currentProduct.costMetrics
                      );
                      
                      // Update only the projections
                      updateProduct(currentProduct.info.id, {
                        weeklyProjections: updatedProjections
                      });
                      
                      addNotification({
                        type: 'success',
                        message: "Weekly projections have been recalculated with updated COGS settings."
                      });
                    }
                  }}
                >
                  Update Projections
                </Button>
              </div>
            </div>
          </div>

          {/* Merchandise COGS (show only for merchandise products) */}
          {currentProduct?.info.type === 'Merchandise Drops' && (
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <Label htmlFor="merchandiseCogPerUnit">Merchandise COGS Per Unit</Label>
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
                    Cost per unit for merchandise items (manufacturing, materials, packaging, etc.)
                  </p>
                </div>
                {/* Similar impact panel for merchandise if needed */}
                <div className="flex flex-col space-y-2">
                  <div className="bg-pink-50 p-3 rounded-md border border-pink-200">
                    <h4 className="text-sm font-medium text-pink-700 mb-1">Merchandise COGS Impact</h4>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Merch Revenue:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            (currentProduct?.revenueMetrics?.merchandiseSpend || 0) * 
                            (currentProduct?.revenueMetrics?.merchandiseConversionRate || 0) * 
                            (currentProduct?.growthMetrics?.weeklyVisitors || 0) * 4
                          )} /month
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Merch COGS:</span>
                        <span className="font-medium text-pink-700">
                          {formatCurrency(
                            ((currentProduct?.revenueMetrics?.merchandiseSpend || 0) * 
                            (currentProduct?.growthMetrics?.weeklyVisitors || 0) * 4) / 
                            (currentProduct?.revenueMetrics?.merchandiseSpend || 1) * 
                            (costMetrics.merchandiseCogPerUnit || 0) || 0
                          )} /month
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-pink-200 mt-1">
                        <span>COGS per unit:</span>
                        <span className="font-medium">${costMetrics.merchandiseCogPerUnit || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marketing Costs */}
      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Marketing Costs</CardTitle>
          <CardDescription>
            Define your marketing budget and strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Budget Allocation Method - Moved to top and styled differently */}
            <div className="mb-6 border-b pb-6">
              <Label className="mb-3 block text-base font-medium">Budget Allocation Method</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant={costMetrics.marketing.allocationMode === 'simple' ? "default" : "outline"}
                  className="w-full justify-start h-auto py-3" 
                  onClick={() => handleAllocationModeChange('simple')}
                >
                  <DollarSign className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <div>Simple Budget</div>
                    <div className="text-xs opacity-70 mt-1">Weekly or Campaign based budget</div>
                  </div>
                </Button>
                <Button 
                  variant={costMetrics.marketing.allocationMode === 'channels' ? "default" : "outline"}
                  className="w-full justify-start h-auto py-3" 
                  onClick={() => handleAllocationModeChange('channels')}
                >
                  <Award className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <div>Channel-Based</div>
                    <div className="text-xs opacity-70 mt-1">Detailed breakdown by marketing channel</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Simple Budget Allocation */}
            {costMetrics.marketing.allocationMode === 'simple' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="marketingType" className="text-base">Budget Type</Label>
                  <div className="relative">
                    <Select
                      value={costMetrics.marketing.type}
                      onValueChange={(value) => handleMarketingCostChange('type', value)}
                    >
                      <SelectTrigger id="marketingType" className="w-full">
                        <SelectValue placeholder="Select budget type" />
                      </SelectTrigger>
                      <SelectContent 
                        className="bg-white shadow-lg" 
                        position="popper" 
                        sideOffset={10}
                        align="start"
                        avoidCollisions={true}
                        style={{ zIndex: 9999999 }}
                      >
                        <div className="min-w-[180px] py-1">
                          <SelectItem value="weekly" className="py-2.5">Weekly Budget</SelectItem>
                          <SelectItem value="campaign" className="py-2.5">Campaign Budget</SelectItem>
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {costMetrics.marketing.type === 'weekly' ? (
                  <div className="space-y-3 mt-6">
                    <Label htmlFor="weeklyBudget">Weekly Marketing Budget ($)</Label>
                    <Input
                      id="weeklyBudget"
                      type="number"
                      min="0"
                      step="0.01"
                      value={costMetrics.marketing.weeklyBudget}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMarketingCostChange('weeklyBudget', parseFloat(e.target.value))}
                    />
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 mt-6">
                    <div className="space-y-3">
                      <Label htmlFor="campaignBudget">Campaign Budget ($)</Label>
                      <Input
                        id="campaignBudget"
                        type="number"
                        min="0"
                        step="0.01"
                        value={costMetrics.marketing.campaignBudget || 0}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMarketingCostChange('campaignBudget', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="campaignDuration">Campaign Duration (Weeks)</Label>
                      <Input
                        id="campaignDuration"
                        type="number"
                        min="1"
                        value={costMetrics.marketing.campaignDurationWeeks || 1}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMarketingCostChange('campaignDurationWeeks', parseInt(e.target.value))}
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
                          ${costMetrics.marketing.channels.reduce((sum, channel) => sum + (channel.budget || 0), 0).toLocaleString()} / week
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
                        {costMetrics.marketing.channels.map((channel, index) => {
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
                        {costMetrics.marketing.channels.map((channel, index) => {
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
                  {(costMetrics.marketing.channels || []).map((channel) => (
                    <MarketingChannelEntry
                      key={channel.id}
                      channel={channel}
                      onUpdate={handleUpdateMarketingChannel}
                      onDelete={handleDeleteMarketingChannel}
                    />
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
          </div>
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
                    (costMetrics.staffRoles || []).map((role) => (
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
              (costMetrics.eventCosts || []).map((cost) => (
                <EventCostEntry
                  key={cost.id}
                  cost={cost}
                  onUpdate={handleUpdateEventCost}
                  onDelete={handleDeleteEventCost}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
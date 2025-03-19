import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Progress } from './progress';
import useStore from '../../store/useStore';
import type { Product, RevenueMetrics } from '../../types';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface SetupWizardProps {
  className?: string;
  onNavigate: (path: string) => void;
  onSelectTab?: (tabId: string) => void;
}

// Define a type for the step
interface SetupStep {
  title: string;
  description: string;
  tabId?: string;
  path?: string;
  isComplete: boolean;
}

export function SetupWizard({ className, onNavigate, onSelectTab }: SetupWizardProps) {
  const { products, currentProductId } = useStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Find current product
  const currentProduct = currentProductId 
    ? products.find(p => p.info.id === currentProductId) 
    : null;
  
  // Function to check if at least one revenue field has a value
  const hasAnyRevenueField = (revenueMetrics?: Partial<RevenueMetrics> | null): boolean => {
    if (!revenueMetrics) return false;
    
    // Check if any of the revenue fields have a non-zero value
    return (
      (revenueMetrics.ticketPrice !== undefined && revenueMetrics.ticketPrice > 0) ||
      (revenueMetrics.fbSpend !== undefined && revenueMetrics.fbSpend > 0) ||
      (revenueMetrics.merchandiseSpend !== undefined && revenueMetrics.merchandiseSpend > 0) ||
      (revenueMetrics.digitalPrice !== undefined && revenueMetrics.digitalPrice > 0)
    );
  };
  
  // Setup wizard steps with validation
  const setupSteps = [
    {
      title: 'Product Info',
      description: 'Set up your product details',
      tabId: 'dashboard',
      isComplete: Boolean(currentProduct?.info?.name && currentProduct?.info?.description),
    },
    {
      title: 'Revenue Forecasting',
      description: 'Set up your revenue model',
      tabId: 'revenue',
      isComplete: hasAnyRevenueField(currentProduct?.revenueMetrics),
    },
    {
      title: 'Cost Setup',
      description: 'Configure your costs',
      tabId: 'costs',
      isComplete: Boolean(
        currentProduct?.costMetrics?.eventCosts?.length || 
        currentProduct?.costMetrics?.staffRoles?.length
      ),
    },
    {
      title: 'Risk Assessment',
      description: 'Identify potential risks',
      tabId: 'risk',
      isComplete: Boolean(currentProduct?.risks?.length),
    },
  ];
  
  // Calculate overall setup completion percentage
  const completedSteps = setupSteps.filter(step => step.isComplete).length;
  const completionPercentage = (completedSteps / setupSteps.length) * 100;
  
  if (!currentProduct) {
    return null;
  }
  
  // Enhanced step click handler with improved error handling and feedback
  const handleStepClick = (step: SetupStep) => {
    console.log('Step clicked:', step);
    
    // Don't automatically change tabs - only navigate if explicitly requested by the user
    if (step.path && onNavigate) {
      onNavigate(step.path);
    }
    
    // We're disabling automatic tab selection to prevent unwanted tab switching
    // If we need this functionality later, we can re-enable it
  };
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">Setup Wizard</CardTitle>
          <CardDescription>
            {completedSteps === setupSteps.length
              ? 'All setup steps completed!'
              : `${completedSteps} of ${setupSteps.length} steps completed`}
          </CardDescription>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleCollapse}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </CardHeader>
      
      {!isCollapsed && (
        <>
          <CardContent className="space-y-4 pt-2">
            <Progress value={completionPercentage} className="h-2" />
            
            <div className="space-y-2">
              {setupSteps.map((step, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between border rounded-md p-3"
                >
                  <div>
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {step.isComplete ? (
                      <div className="h-4 w-4 rounded-full bg-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-gray-200" />
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStepClick(step)}
                      className="hover:bg-blue-50 active:bg-blue-100 transition-colors font-medium"
                    >
                      {step.isComplete ? 'Edit' : 'Setup'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <p className="text-sm text-gray-500">
              {completionPercentage >= 100 
                ? 'Product fully configured!' 
                : 'Complete all steps to fully configure your product'}
            </p>
          </CardFooter>
        </>
      )}
    </Card>
  );
} 
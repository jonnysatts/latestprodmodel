import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import useStore from '../store/useStore';
import { CostMetrics } from '../types';
import IsolatedInput from './IsolatedInput';

export default function CostBreakdown() {
  const { products, currentProductId, updateProduct, updateWeeklyProjections } = useStore();
  const currentProduct = products.find(p => p.info.id === currentProductId);
  
  const [costMetrics, setCostMetrics] = useState<Partial<CostMetrics>>({});

  // Initialize state from product
  useEffect(() => {
    if (currentProduct) {
      setCostMetrics(currentProduct.costMetrics || {});
    }
  }, [currentProduct?.info.id]);

  const handleCostMetricChange = (field: keyof CostMetrics, value: number | string) => {
    // Add console logging to debug
    console.log(`Cost metric changing: ${field} = ${value}`);
    
    // Convert empty string to 0 and preserve other values
    const numericValue = value === '' ? 0 : typeof value === 'string' ? parseFloat(value) : value;
    
    const newCostMetrics = { ...costMetrics, [field]: numericValue };
    setCostMetrics(newCostMetrics);
    
    // Force update projections after state change
    if (updateWeeklyProjections) {
      updateWeeklyProjections();
    }
    
    if (currentProduct) {
      updateProduct(currentProduct.info.id, {
        costMetrics: newCostMetrics
      });
    }
  };

  console.log('Current F&B Costs:', costMetrics.fnbCosts);
  console.log('Total Costs Calculation:', {
    fixedCosts: costMetrics.fixedCosts,
    setupCosts: costMetrics.setupCosts,
    costPerCustomer: costMetrics.costPerCustomer,
    weeklyStaffCosts: costMetrics.weeklyStaffCosts,
    staffCostPerEvent: costMetrics.staffCostPerEvent,
    marketingMonthly: costMetrics.marketing?.monthly,
    costPerAcquisition: costMetrics.marketing?.costPerAcquisition,
    fnbCosts: costMetrics.fnbCosts,
  });

  if (!currentProduct) {
    return (
      <div className="text-center py-8 text-gray-500">
        No product selected or product not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Fixed Costs */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Fixed Costs</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fixedCosts">Monthly Fixed Costs ($)</Label>
                  <Input
                    id="fixedCosts"
                    type="number"
                    min={0}
                    step={0.01}
                    value={costMetrics.fixedCosts || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      handleCostMetricChange('fixedCosts' as keyof CostMetrics, value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setupCosts">Initial Setup Costs ($)</Label>
                  <Input
                    id="setupCosts"
                    type="number"
                    min={0}
                    step={0.01}
                    value={costMetrics.setupCosts || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      handleCostMetricChange('setupCosts' as keyof CostMetrics, value);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Variable Costs */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Variable Costs</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="costPerCustomer">Cost per Customer ($)</Label>
                  <Input
                    id="costPerCustomer"
                    type="number"
                    min={0}
                    step={0.01}
                    value={costMetrics.costPerCustomer || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      handleCostMetricChange('costPerCustomer' as keyof CostMetrics, value);
                    }}
                  />
                </div>
                {currentProduct?.info.forecastType === 'weekly' ? (
                  <div className="space-y-2">
                    <Label htmlFor="weeklyStaffCosts">Weekly Staff Costs ($)</Label>
                    <IsolatedInput
                      id="weeklyStaffCosts"
                      label="Weekly Staff Costs ($)"
                      type="number"
                      min={0}
                      step={0.01}
                      value={costMetrics.weeklyStaffCosts === 0 ? '' : costMetrics.weeklyStaffCosts}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCostMetricChange('weeklyStaffCosts' as keyof CostMetrics, parseFloat(e.target.value))}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="staffCostPerEvent">Staff Cost per Event ($)</Label>
                    <IsolatedInput
                      id="staffCostPerEvent"
                      label="Staff Cost per Event ($)"
                      type="number"
                      min={0}
                      step={0.01}
                      value={costMetrics.staffCostPerEvent === 0 ? '' : costMetrics.staffCostPerEvent}
                      onChange={(e) => handleCostMetricChange('staffCostPerEvent' as keyof CostMetrics, e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Marketing Costs */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Marketing Costs</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="marketingMonthly">Monthly Marketing Budget ($)</Label>
                  <IsolatedInput
                    id="marketingMonthly"
                    label="Monthly Marketing Budget ($)"
                    type="number"
                    min={0}
                    step={0.01}
                    value={costMetrics.marketing?.monthly === 0 ? '' : costMetrics.marketing?.monthly}
                    onChange={(e) => {
                      const newMarketing = { 
                        ...costMetrics.marketing,
                        monthly: e.target.value === '' ? 0 : parseFloat(e.target.value)
                      };
                      handleCostMetricChange('marketing' as keyof CostMetrics, newMarketing as any);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPerAcquisition">Cost per Customer Acquisition ($)</Label>
                  <IsolatedInput
                    id="costPerAcquisition"
                    label="Cost per Customer Acquisition ($)"
                    type="number"
                    min={0}
                    step={0.01}
                    value={costMetrics.marketing?.costPerAcquisition === 0 ? '' : costMetrics.marketing?.costPerAcquisition}
                    onChange={(e) => {
                      const newMarketing = { 
                        ...costMetrics.marketing,
                        costPerAcquisition: e.target.value === '' ? 0 : parseFloat(e.target.value)
                      };
                      handleCostMetricChange('marketing' as keyof CostMetrics, newMarketing as any);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fnbCosts">F&B Costs ($)</Label>
              <Input
                id="fnbCosts"
                type="number"
                min={0}
                step={0.01}
                value={costMetrics.fnbCosts || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  handleCostMetricChange('fnbCosts' as keyof CostMetrics, value);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
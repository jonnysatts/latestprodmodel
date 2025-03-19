import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import useStore from '../store/useStore';
import { generateWeeklyProjections } from '../lib/calculations';
import type { GrowthMetrics, RevenueMetrics } from '../types';

export default function ForecastRevenue() {
  const { products, currentProductId, updateProduct } = useStore();
  const currentProduct = products.find(p => p.info.id === currentProductId);
  
  const [growthMetrics, setGrowthMetrics] = useState<Partial<GrowthMetrics>>({});
  const [revenueMetrics, setRevenueMetrics] = useState<Partial<RevenueMetrics>>({});

  // Initialize state from product
  useEffect(() => {
    if (currentProduct) {
      setGrowthMetrics(currentProduct.growthMetrics || {});
      setRevenueMetrics(currentProduct.revenueMetrics || {});
    }
  }, [currentProduct?.info.id]);

  const updateProjections = useCallback((
    newGrowthMetrics: Partial<GrowthMetrics>,
    newRevenueMetrics: Partial<RevenueMetrics>
  ) => {
    if (!currentProduct) return;

    const fullGrowthMetrics: GrowthMetrics = {
      totalVisitors: 0,
      weeklyVisitors: 0,
      visitorsPerEvent: 0,
      growthModel: 'Exponential',
      weeklyGrowthRate: 0,
      peakDayAttendance: 0,
      lowDayAttendance: 0,
      returnVisitRate: 0,
      wordOfMouthRate: 0,
      socialMediaConversion: 0,
      ...newGrowthMetrics
    };

    const fullRevenueMetrics: RevenueMetrics = {
      ticketPrice: 0,
      ticketSalesRate: 1,
      fbSpend: 0,
      fbConversionRate: 1,
      merchandiseSpend: 0,
      merchandiseConversionRate: 1,
      digitalPrice: 0,
      digitalConversionRate: 1,
      ...newRevenueMetrics
    };

    const projections = generateWeeklyProjections(
      currentProduct.info,
      fullGrowthMetrics,
      fullRevenueMetrics,
      currentProduct.costMetrics
    );

    updateProduct(currentProduct.info.id, {
      growthMetrics: fullGrowthMetrics,
      revenueMetrics: fullRevenueMetrics,
      weeklyProjections: projections
    });
  }, [currentProduct, updateProduct]);

  const handleGrowthMetricChange = useCallback((field: keyof GrowthMetrics, value: number) => {
    const newMetrics = { ...growthMetrics, [field]: value };
    setGrowthMetrics(newMetrics);
    updateProjections(newMetrics, revenueMetrics);
  }, [growthMetrics, revenueMetrics, updateProjections]);

  const handleRevenueMetricChange = (field: keyof RevenueMetrics, value: number | string) => {
    console.log(`Revenue metric changing: ${field} = ${value}`);
    
    // Convert empty string to 0 and preserve other values
    const numericValue = value === '' ? 0 : typeof value === 'string' ? parseFloat(value) : value;
    
    const newRevenueMetrics = { ...revenueMetrics, [field]: numericValue };
    setRevenueMetrics(newRevenueMetrics);
    
    // Force immediate update
    updateProjections(growthMetrics, newRevenueMetrics);
  };

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
          <CardTitle>Growth & Revenue Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Growth Metrics */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Growth Metrics</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {currentProduct.info.forecastType === 'weekly' ? (
                  <div className="space-y-2">
                    <Label htmlFor="weeklyVisitors">Expected Weekly Visitors</Label>
                    <Input
                      id="weeklyVisitors"
                      type="number"
                      min={0}
                      step={1}
                      value={growthMetrics.weeklyVisitors || 0}
                      onValueChange={(value) => 
                        handleGrowthMetricChange('weeklyVisitors', Number(value))
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="visitorsPerEvent">Expected Visitors per Event</Label>
                    <Input
                      id="visitorsPerEvent"
                      type="number"
                      min={0}
                      step={1}
                      value={growthMetrics.visitorsPerEvent || 0}
                      onValueChange={(value) => 
                        handleGrowthMetricChange('visitorsPerEvent', Number(value))
                      }
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="weeklyGrowthRate">Weekly Growth Rate (%)</Label>
                  <Input
                    id="weeklyGrowthRate"
                    type="number"
                    min={0}
                    step={0.1}
                    value={growthMetrics.weeklyGrowthRate || 0}
                    onValueChange={(value) => 
                      handleGrowthMetricChange('weeklyGrowthRate', Number(value))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Revenue Metrics */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Revenue Streams</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ticketPrice">Ticket Price ($)</Label>
                  <Input
                    id="ticketPrice"
                    type="number"
                    min={0}
                    step={0.01}
                    value={revenueMetrics.ticketPrice || ''}
                    onChange={(e) => {
                      // For empty input, set value as 0
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      handleRevenueMetricChange('ticketPrice', value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fbSpend">F&B Spend per Customer ($)</Label>
                  <Input
                    id="fbSpend"
                    type="number"
                    min={0}
                    step={0.01}
                    value={revenueMetrics.fbSpend || ''}
                    onChange={(e) => {
                      // For empty input, set value as 0
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      handleRevenueMetricChange('fbSpend', value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="merchandiseSpend">Merchandise Spend ($)</Label>
                  <Input
                    id="merchandiseSpend"
                    type="number"
                    min={0}
                    step={0.01}
                    value={revenueMetrics.merchandiseSpend || ''}
                    onChange={(e) => {
                      // For empty input, set value as 0
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      handleRevenueMetricChange('merchandiseSpend', value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="digitalPrice">Digital Product Price ($)</Label>
                  <Input
                    id="digitalPrice"
                    type="number"
                    min={0}
                    step={0.01}
                    value={revenueMetrics.digitalPrice || ''}
                    onChange={(e) => {
                      // For empty input, set value as 0
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      handleRevenueMetricChange('digitalPrice', value);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
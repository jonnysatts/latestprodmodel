import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import useStore from '../store/useStore';
import { generateWeeklyProjections } from '../lib/calculations';
import IsolatedInput from './IsolatedInput';
import IsolatedSelect from './IsolatedSelect';

export default function ForecastInputs() {
  const { 
    productInfo, 
    setProductInfo,
    growthMetrics,
    setGrowthMetrics,
    revenueMetrics,
    setRevenueMetrics,
    costMetrics,
    setCostMetrics,
    customerMetrics,
    setCustomerMetrics,
    updateWeeklyProjections
  } = useStore();

  // Update projections whenever metrics change
  useEffect(() => {
    if (productInfo && growthMetrics && revenueMetrics && costMetrics) {
      const projections = generateWeeklyProjections(
        productInfo,
        growthMetrics,
        revenueMetrics,
        costMetrics
      );
      updateWeeklyProjections(projections);
    }
  }, [productInfo, growthMetrics, revenueMetrics, costMetrics, updateWeeklyProjections]);

  // Handle product info changes
  const handleProductInfoChange = (field: keyof typeof productInfo, value: unknown) => {
    setProductInfo({
      ...productInfo,
      [field]: value
    });
  };

  // Handle growth metrics changes
  const handleGrowthMetricsChange = (field: keyof typeof growthMetrics, value: unknown) => {
    // Add console logging to debug
    console.log(`Growth metrics changing: ${field} = ${value}`);
    
    const newGrowthMetrics = { ...growthMetrics, [field]: value };
    setGrowthMetrics(newGrowthMetrics);
    
    // Force update projections immediately
    updateWeeklyProjections(productInfo, newGrowthMetrics, revenueMetrics, costMetrics, customerMetrics);
  };

  // Handle revenue metrics changes
  const handleRevenueMetricsChange = (field: keyof typeof revenueMetrics, value: unknown) => {
    // Add console logging to debug
    console.log(`Revenue metrics changing: ${field} = ${value}`);
    
    const newRevenueMetrics = { ...revenueMetrics, [field]: value };
    setRevenueMetrics(newRevenueMetrics);
    
    // Force update projections immediately
    updateWeeklyProjections(productInfo, growthMetrics, newRevenueMetrics, costMetrics, customerMetrics);
  };

  // Handle cost metrics changes
  const handleCostMetricsChange = (field: keyof typeof costMetrics, value: unknown) => {
    setCostMetrics({
      ...costMetrics,
      [field]: value
    });
  };

  // Handle marketing cost changes
  const handleMarketingCostChange = (field: keyof typeof costMetrics.marketing, value: unknown) => {
    setCostMetrics({
      ...costMetrics,
      marketing: {
        ...costMetrics.marketing,
        [field]: value
      }
    });
  };

  // Handle customer metrics changes
  const handleCustomerMetricsChange = (field: keyof typeof customerMetrics, value: unknown) => {
    setCustomerMetrics({
      ...customerMetrics,
      [field]: value
    });
  };

  // Determine if some fields should be shown based on product type
  const isEventBasedProduct = productInfo.type === 'Experiential Events' || productInfo.type === 'Venue-Based Activations';
  const isPhysicalProduct = productInfo.type === 'Food & Beverage Products' || productInfo.type === 'Merchandise Drops';
  const isDigitalProduct = productInfo.type === 'Digital Products';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="productType">Product Type</Label>
              <Select
                value={productInfo.type}
                onValueChange={(value) => handleProductInfoChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Experiential Events">Experiential Events</SelectItem>
                  <SelectItem value="Venue-Based Activations">Venue-Based Activations</SelectItem>
                  <SelectItem value="Food & Beverage Products">Food & Beverage Products</SelectItem>
                  <SelectItem value="Merchandise Drops">Merchandise Drops</SelectItem>
                  <SelectItem value="Digital Products">Digital Products</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                value={productInfo.targetAudience}
                onChange={(e) => handleProductInfoChange('targetAudience', e.target.value)}
                placeholder="Who is this product targeting?"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="forecastPeriod">Forecast Period (weeks)</Label>
              <Input
                id="forecastPeriod"
                type="number"
                min="1"
                max="104"
                value={productInfo.forecastPeriod}
                onChange={(e) => handleProductInfoChange('forecastPeriod', parseInt(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="forecastType">Forecast Type</Label>
              <Select
                value={productInfo.forecastType}
                onValueChange={(value) => handleProductInfoChange('forecastType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select forecast type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="per-event">Per Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isEventBasedProduct && productInfo.forecastType === 'weekly' && (
              <div>
                <Label htmlFor="eventsPerWeek">Events Per Week</Label>
                <Input
                  id="eventsPerWeek"
                  type="number"
                  min="1"
                  max="30"
                  value={productInfo.eventsPerWeek || 1}
                  onChange={(e) => handleProductInfoChange('eventsPerWeek', parseInt(e.target.value))}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Growth & Audience Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="growthModel">Growth Model</Label>
              <IsolatedSelect
                id="growthModel"
                label="Growth Model"
                options={[
                  { value: 'Linear', label: 'Linear' },
                  { value: 'Exponential', label: 'Exponential' },
                  { value: 'Decay', label: 'Decay' }
                ]}
                value={growthMetrics.growthModel}
                onChange={(e) => handleGrowthMetricsChange('growthModel', e.target.value)}
                placeholder="Select growth model"
              />
            </div>

            <div>
              <IsolatedInput
                id="weeklyGrowthRate"
                type="number"
                min={-50}
                max={100}
                value={growthMetrics.weeklyGrowthRate || 0}
                onChange={(e) => handleGrowthMetricsChange('weeklyGrowthRate', parseFloat(e.target.value))}
                label={growthMetrics.growthModel === 'Decay' ? 'Weekly Decay Rate (%)' : 'Weekly Growth Rate (%)'}
              />
            </div>
          </div>

          {isEventBasedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="totalVisitors">Total Expected Audience</Label>
                <Input
                  id="totalVisitors"
                  type="number"
                  min="0"
                  value={growthMetrics.totalVisitors}
                  onChange={(e) => handleGrowthMetricsChange('totalVisitors', parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="expectedVisitors">Expected Weekly Visitors</Label>
                <Input
                  id="expectedVisitors"
                  type="number"
                  min={0}
                  value={growthMetrics.expectedVisitors || ''}
                  onChange={(e) => {
                    // For empty input, set value as 0
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    handleGrowthMetricsChange('expectedVisitors', value);
                  }}
                />
              </div>

              <div>
                <Label htmlFor="visitorsPerEvent">Visitors Per Event</Label>
                <Input
                  id="visitorsPerEvent"
                  type="number"
                  min="0"
                  value={growthMetrics.visitorsPerEvent}
                  onChange={(e) => handleGrowthMetricsChange('visitorsPerEvent', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}

          {isDigitalProduct && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="totalVisitors">Total Expected Users</Label>
                <Input
                  id="totalVisitors"
                  type="number"
                  min="0"
                  value={growthMetrics.totalVisitors}
                  onChange={(e) => handleGrowthMetricsChange('totalVisitors', parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="weeklyVisitors">Weekly Users (Initial)</Label>
                <Input
                  id="weeklyVisitors"
                  type="number"
                  min="0"
                  value={growthMetrics.weeklyVisitors}
                  onChange={(e) => handleGrowthMetricsChange('weeklyVisitors', parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="socialMediaConversion">Social Media Conversion (%)</Label>
                <Input
                  id="socialMediaConversion"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={growthMetrics.socialMediaConversion * 100}
                  onChange={(e) => handleGrowthMetricsChange('socialMediaConversion', parseFloat(e.target.value) / 100)}
                />
              </div>
            </div>
          )}

          {isPhysicalProduct && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="totalVisitors">Total Expected Customers</Label>
                <Input
                  id="totalVisitors"
                  type="number"
                  min="0"
                  value={growthMetrics.totalVisitors}
                  onChange={(e) => handleGrowthMetricsChange('totalVisitors', parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="weeklyVisitors">Weekly Customers (Initial)</Label>
                <Input
                  id="weeklyVisitors"
                  type="number"
                  min="0"
                  value={growthMetrics.weeklyVisitors}
                  onChange={(e) => handleGrowthMetricsChange('weeklyVisitors', parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="returnVisitRate">Repeat Purchase Rate (%)</Label>
                <Input
                  id="returnVisitRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={growthMetrics.returnVisitRate * 100}
                  onChange={(e) => handleGrowthMetricsChange('returnVisitRate', parseFloat(e.target.value) / 100)}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="returnVisitRate">Return Visit Rate (%)</Label>
              <Input
                id="returnVisitRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={growthMetrics.returnVisitRate * 100}
                onChange={(e) => handleGrowthMetricsChange('returnVisitRate', parseFloat(e.target.value) / 100)}
              />
            </div>

            <div>
              <Label htmlFor="wordOfMouthRate">Word of Mouth Rate (%)</Label>
              <Input
                id="wordOfMouthRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={growthMetrics.wordOfMouthRate * 100}
                onChange={(e) => handleGrowthMetricsChange('wordOfMouthRate', parseFloat(e.target.value) / 100)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rest of the component remains the same */}
      
      {/* Add more product-type specific inputs for revenue metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEventBasedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ticketPrice">Ticket Price ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={revenueMetrics.ticketPrice}
                  onChange={(e) => handleRevenueMetricsChange('ticketPrice', parseFloat(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="ticketSalesRate">Ticket Sales Rate (%)</Label>
                <Input
                  id="ticketSalesRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={revenueMetrics.ticketSalesRate * 100}
                  onChange={(e) => handleRevenueMetricsChange('ticketSalesRate', parseFloat(e.target.value) / 100)}
                />
              </div>
            </div>
          )}

          {/* F&B, Merchandise, and Digital Product specific fields */}
          {(isEventBasedProduct || isPhysicalProduct) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fbSpend">F&B Average Spend ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={revenueMetrics.fbSpend}
                  onChange={(e) => handleRevenueMetricsChange('fbSpend', parseFloat(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="fbConversionRate">F&B Conversion Rate (%)</Label>
                <Input
                  id="fbConversionRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={revenueMetrics.fbConversionRate * 100}
                  onChange={(e) => handleRevenueMetricsChange('fbConversionRate', parseFloat(e.target.value) / 100)}
                />
              </div>
            </div>
          )}

          {(isEventBasedProduct || isPhysicalProduct) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="merchandiseSpend">Merchandise Average Spend ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={revenueMetrics.merchandiseSpend}
                  onChange={(e) => handleRevenueMetricsChange('merchandiseSpend', parseFloat(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="merchandiseConversionRate">Merchandise Conversion Rate (%)</Label>
                <Input
                  id="merchandiseConversionRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={revenueMetrics.merchandiseConversionRate * 100}
                  onChange={(e) => handleRevenueMetricsChange('merchandiseConversionRate', parseFloat(e.target.value) / 100)}
                />
              </div>
            </div>
          )}

          {(isEventBasedProduct || isDigitalProduct) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="digitalPrice">Digital Product Price ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={revenueMetrics.digitalPrice}
                  onChange={(e) => handleRevenueMetricsChange('digitalPrice', parseFloat(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="digitalConversionRate">Digital Conversion Rate (%)</Label>
                <Input
                  id="digitalConversionRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={revenueMetrics.digitalConversionRate * 100}
                  onChange={(e) => handleRevenueMetricsChange('digitalConversionRate', parseFloat(e.target.value) / 100)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isEventBasedProduct && (
              <div>
                <Label htmlFor="visitDuration">Average Visit Duration (minutes)</Label>
                <Input
                  id="visitDuration"
                  type="number"
                  min="0"
                  value={customerMetrics.visitDuration}
                  onChange={(e) => handleCustomerMetricsChange('visitDuration', parseInt(e.target.value))}
                />
              </div>
            )}

            <div>
              <Label htmlFor="satisfactionScore">Satisfaction Score (1-10)</Label>
              <Input
                id="satisfactionScore"
                type="number"
                min="1"
                max="10"
                step="0.1"
                value={customerMetrics.satisfactionScore}
                onChange={(e) => handleCustomerMetricsChange('satisfactionScore', parseFloat(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="nps">Net Promoter Score (-100 to 100)</Label>
              <Input
                id="nps"
                type="number"
                min="-100"
                max="100"
                value={customerMetrics.nps}
                onChange={(e) => handleCustomerMetricsChange('nps', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="returnIntent">Return Intent (%)</Label>
              <Input
                id="returnIntent"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={customerMetrics.returnIntent * 100}
                onChange={(e) => handleCustomerMetricsChange('returnIntent', parseFloat(e.target.value) / 100)}
              />
            </div>

            <div>
              <Label htmlFor="communityEngagement">Community Engagement (%)</Label>
              <Input
                id="communityEngagement"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={customerMetrics.communityEngagement * 100}
                onChange={(e) => handleCustomerMetricsChange('communityEngagement', parseFloat(e.target.value) / 100)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
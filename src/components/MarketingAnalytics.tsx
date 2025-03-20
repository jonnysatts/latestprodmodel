import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, Info, ExternalLink, PieChart as PieChartIcon, 
  ChevronDown, ChevronUp, Users, ArrowUpDown, DollarSign, BarChart as BarChartIcon
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../lib/utils';
import useStore from '../store/useStore';

// Import our custom types
import type { Product, MarketingChannelItem, WeeklyActuals } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function MarketingAnalytics() {
  const { products, currentProductId } = useStore();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get current product
  const currentProduct = products.find(p => p.info?.id === currentProductId);
  
  // Extract and process marketing data from the product
  const marketingData = useMemo(() => {
    if (!currentProduct || !currentProduct.costMetrics) return {
      channels: [],
      totalBudget: 0,
      hasChannels: false
    };
    
    // Get marketing channels from costMetrics
    const channels = currentProduct.costMetrics.marketing?.channels || [];
    
    // Calculate total budget based on the allocation mode
    let totalBudget = 0;
    
    // First try to get budget from channels if they exist
    if (channels.length > 0) {
      totalBudget = channels.reduce((sum, channel) => sum + (channel.budget || 0), 0);
    } 
    // If no channels or budget is still 0, try weekly or campaign budget
    else if (currentProduct.costMetrics.marketing) {
      if (currentProduct.costMetrics.marketing.type === 'weekly') {
        totalBudget = currentProduct.costMetrics.marketing.weeklyBudget || 0;
      } else if (currentProduct.costMetrics.marketing.type === 'campaign') {
        const campaignBudget = currentProduct.costMetrics.marketing.campaignBudget || 0;
        const campaignDuration = currentProduct.costMetrics.marketing.campaignDurationWeeks || 1;
        totalBudget = campaignBudget / campaignDuration; // Weekly equivalent
      }
    }
    
    return {
      channels,
      totalBudget,
      hasChannels: channels.length > 0
    };
  }, [currentProduct]);
  
  // Get actuals data for attribution analysis
  const actualsData = useMemo(() => {
    if (!currentProduct || !currentProduct.actuals) return [];
    return currentProduct.actuals;
  }, [currentProduct]);
  
  // Blend actuals with forecast data - this is a new function to create a blended dataset
  const blendedData = useMemo(() => {
    const hasActuals = actualsData.length > 0;
    const hasProjections = currentProduct?.weeklyProjections && currentProduct.weeklyProjections.length > 0;
    
    if (!hasActuals && !hasProjections) return {
      totalRevenue: 0,
      totalMarketingSpend: 0,
      totalVisitors: 0,
      totalConversions: 0,
      isBlended: false,
      source: 'none'
    };
    
    // If we have actuals, use them as primary source
    if (hasActuals) {
      const totalRevenue = actualsData.reduce((sum, actual) => sum + (actual.revenue || 0), 0);
      const totalMarketingSpend = actualsData.reduce((sum, actual) => sum + (actual.marketingCosts || 0), 0);
      
      // Get visitor and conversion data from actuals
      const totalAttendance = actualsData.reduce((sum, actual) => {
        // Try to get attendance from the attendance field, or calculate from events
        const attendance = actual.averageEventAttendance || 0;
        const events = actual.numberOfEvents || 0;
        return sum + (attendance * events);
      }, 0);
      
      // Calculate estimated conversions from revenue
      const avgPrice = currentProduct.revenueMetrics?.ticketPrice || 100;
      const estimatedConversions = totalRevenue > 0 ? Math.round(totalRevenue / avgPrice) : 0;
      
      // If actual data is too sparse, blend with projections
      if (hasProjections && (totalRevenue === 0 || totalMarketingSpend === 0)) {
        // Get projected data for the missing metrics
        const projectedData = {
          totalRevenue: currentProduct.weeklyProjections.reduce(
            (sum, week) => sum + (week.totalRevenue || 0), 0
          ),
          totalMarketingSpend: currentProduct.weeklyProjections.reduce(
            (sum, week) => sum + (week.marketingCosts || 0), 0
          ),
          // Use projected visitors if we have no actual attendance
          totalVisitors: totalAttendance > 0 ? totalAttendance : 
            currentProduct.weeklyProjections.reduce(
              (sum, week) => sum + (week.attendance || 0), 0
            )
        };
        
        // Return the blended data, using actuals where available
        return {
          totalRevenue: totalRevenue > 0 ? totalRevenue : projectedData.totalRevenue,
          totalMarketingSpend: totalMarketingSpend > 0 ? totalMarketingSpend : projectedData.totalMarketingSpend,
          totalVisitors: totalAttendance > 0 ? totalAttendance : projectedData.totalVisitors,
          totalConversions: estimatedConversions,
          isBlended: true,
          source: 'blended'
        };
      }
      
      // Return actuals data only
      return {
        totalRevenue,
        totalMarketingSpend,
        totalVisitors: totalAttendance,
        totalConversions: estimatedConversions,
        isBlended: false,
        source: 'actuals'
      };
    }
    
    // If we only have projections, use them
    if (hasProjections) {
      return {
        totalRevenue: currentProduct.weeklyProjections.reduce(
          (sum, week) => sum + (week.totalRevenue || 0), 0
        ),
        totalMarketingSpend: currentProduct.weeklyProjections.reduce(
          (sum, week) => sum + (week.marketingCosts || 0), 0
        ),
        totalVisitors: currentProduct.weeklyProjections.reduce(
          (sum, week) => sum + (week.attendance || 0), 0
        ),
        // Estimate conversions from revenue
        totalConversions: Math.round(
          currentProduct.weeklyProjections.reduce((sum, week) => sum + (week.totalRevenue || 0), 0) / 
          (currentProduct.revenueMetrics?.ticketPrice || 100)
        ),
        isBlended: false,
        source: 'projections'
      };
    }
    
    // Fallback
    return {
      totalRevenue: 0,
      totalMarketingSpend: 0,
      totalVisitors: 0,
      totalConversions: 0,
      isBlended: false,
      source: 'none'
    };
  }, [currentProduct, actualsData]);
  
  // Calculate CAC (Customer Acquisition Cost) from available data
  const acquisitionMetrics = useMemo(() => {
    if (!currentProduct) return {
      cac: 0,
      cacTargetThreshold: 50,
      conversionRate: 0,
      customerLifetimeValue: 0,
      cacToLtv: 0,
      totalConversions: 0,
      marketingSpendPercentage: 0,
      dataSource: 'none'
    };
    
    // Use the blended data
    const { 
      totalMarketingSpend, 
      totalConversions, 
      totalVisitors, 
      totalRevenue,
      source 
    } = blendedData;
    
    // CRITICAL FIX: Calculate based on weekly budget * forecast period
    const weeklyBudget = marketingData.totalBudget;
    const forecastPeriod = currentProduct.info?.forecastPeriod || 12;
    const totalMarketingBudget = weeklyBudget * forecastPeriod;
    
    // Get conversion rate from actual data if available
    let conversionRate = 0;
    
    // Check if we have channel performance data with impressions and conversions
    const channelData = actualsData.flatMap(actual => actual.channelPerformance || []);
    const totalImpressions = channelData.reduce((sum, ch) => sum + (ch.impressions || 0), 0);
    const totalClicks = channelData.reduce((sum, ch) => sum + (ch.clicks || 0), 0);
    const totalChannelConversions = channelData.reduce((sum, ch) => sum + (ch.conversions || 0), 0);
    
    // If we have channel data, calculate the conversion rate
    if (totalClicks > 0 && totalChannelConversions > 0) {
      conversionRate = (totalChannelConversions / totalClicks) * 100;
    } else if (totalVisitors > 0 && totalConversions > 0) {
      // Fallback calculation based on visitors and estimated conversions
      conversionRate = (totalConversions / totalVisitors) * 100;
    } else {
      // Use a reasonable default if we can't calculate
      conversionRate = 2.5;
    }
    
    // Calculate CAC more accurately
    let cac = 0;
    let totalProjectedVisitors = 0;

    // Get total visitors from projections for a more accurate conversion estimate
    if (currentProduct?.weeklyProjections) {
      totalProjectedVisitors = currentProduct.weeklyProjections.reduce(
        (sum, week) => {
          // Try to use the most appropriate visitor data available
          const weeklyVisitors = week.visitors || 
                                (week.averageEventAttendance || 0) * (week.numberOfEvents || 0) || 
                                0;
          return sum + weeklyVisitors;
        }, 0
      );
      
      // Calculate expected conversions based on our known conversion rate
      const expectedConversions = totalProjectedVisitors * (conversionRate / 100);
      
      // If we have valid conversion estimates, calculate CAC
      if (expectedConversions > 0) {
        cac = totalMarketingBudget / expectedConversions;
        
        console.log('IMPROVED CAC CALCULATION:');
        console.log('- Total Marketing Budget:', totalMarketingBudget);
        console.log('- Total Projected Visitors:', totalProjectedVisitors);
        console.log('- Conversion Rate:', conversionRate.toFixed(1) + '%');
        console.log('- Expected Conversions:', expectedConversions.toFixed(0));
        console.log('- Calculated CAC:', formatCurrency(cac));
      } else if (totalConversions > 0) {
        // Fallback to original calculation
        cac = totalMarketingSpend / totalConversions;
      }
    } else if (totalConversions > 0) {
      // Fallback to original calculation if no projections
      cac = totalMarketingSpend / totalConversions;
    }
    
    // Determine target CAC threshold based on product type
    let cacTargetThreshold = 50; // Default
    if (currentProduct.info && currentProduct.info.type) {
      switch (currentProduct.info.type) {
        case 'Digital Products':
          cacTargetThreshold = 30;
          break;
        case 'Merchandise Drops':
          cacTargetThreshold = 20;
          break;
        case 'Venue-Based Activations':
          cacTargetThreshold = 40;
          break;
        case 'Experiential Events':
          cacTargetThreshold = 50;
          break;
        case 'Food & Beverage Products':
          cacTargetThreshold = 15;
          break;
        default:
          cacTargetThreshold = 50;
      }
    }
    
    // Estimate customer lifetime value (LTV)
    // In reality, would be calculated from retention, repeat purchase rate, etc.
    const avgPrice = currentProduct.revenueMetrics?.ticketPrice || 100;
    const averageOrderValue = totalRevenue > 0 && totalConversions > 0 ? 
      totalRevenue / totalConversions : avgPrice;
    
    // For LTV, check if we have revenueMetrics with repeat purchase data
    const purchaseFrequency = currentProduct.revenueMetrics?.repeatPurchaseRate || 2.5;
    const customerLifespan = currentProduct.revenueMetrics?.customerLifespanYears || 1.5;
    const customerLifetimeValue = averageOrderValue * purchaseFrequency * customerLifespan;
    
    // Calculate LTV:CAC ratio
    const cacToLtv = cac > 0 ? customerLifetimeValue / cac : 0;
    
    // Calculate marketing spend as percentage of revenue - FIXED
    let marketingSpendPercentage = 0;
    
    if (totalRevenue > 0) {
      // Calculate as percentage of total revenue
      marketingSpendPercentage = (totalMarketingBudget / totalRevenue) * 100;
      
      // Cap at a reasonable maximum for display purposes only
      marketingSpendPercentage = Math.min(marketingSpendPercentage, 50);
      
      console.log('FIXED MARKETING % CALCULATION:');
      console.log('- Weekly Budget:', weeklyBudget);
      console.log('- Forecast Period:', forecastPeriod);
      console.log('- Total Marketing Budget:', totalMarketingBudget);
      console.log('- Total Revenue:', totalRevenue);
      console.log('- Marketing % of Revenue (fixed):', marketingSpendPercentage);
    } else {
      // Default when we lack data
      marketingSpendPercentage = 15;
    }
    
    return {
      cac,
      cacTargetThreshold,
      conversionRate,
      customerLifetimeValue,
      cacToLtv,
      totalConversions,
      marketingSpendPercentage,
      dataSource: source
    };
  }, [currentProduct, blendedData, actualsData, marketingData.totalBudget]);
  
  // Calculate channel effectiveness
  const channelPerformance = useMemo(() => {
    if (!marketingData.channels.length) return [];
    
    return marketingData.channels.map((channel, index) => {
      // Check if we have actual performance data for this channel
      const channelActuals = actualsData
        .flatMap(actual => actual.channelPerformance || [])
        .filter(perf => perf.channelId === channel.id);
      
      // If we have actual data, use it to calculate metrics
      if (channelActuals.length > 0) {
        const totalSpend = channelActuals.reduce((sum, perf) => sum + (perf.spend || 0), 0);
        const totalImpressions = channelActuals.reduce((sum, perf) => sum + (perf.impressions || 0), 0);
        const totalClicks = channelActuals.reduce((sum, perf) => sum + (perf.clicks || 0), 0);
        const totalConversions = channelActuals.reduce((sum, perf) => sum + (perf.conversions || 0), 0);
        const totalRevenue = channelActuals.reduce((sum, perf) => sum + (perf.revenue || 0), 0);
        
        // Calculate metrics from actuals
        const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
        const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
        
        return {
          id: channel.id,
          name: channel.name || 'Unnamed Channel',
          budget: channel.budget || 0,
          allocation: channel.allocation || 0,
          conversionRate,
          ctr,
          roi,
          color: COLORS[index % COLORS.length],
          effectiveness: conversionRate * (roi > 0 ? roi/100 + 1 : 0.5), // Simplified effectiveness score
          hasActualData: true
        };
      } else {
        // If no actual data, show a placeholder with clearly marked estimates
        return {
          id: channel.id,
          name: channel.name || 'Unnamed Channel',
          budget: channel.budget || 0,
          allocation: channel.allocation || 0,
          conversionRate: 2 + Math.random() * 3, // Mild randomization for estimates
          ctr: 1 + Math.random() * 2,
          roi: -10 + Math.random() * 50,
          color: COLORS[index % COLORS.length],
          effectiveness: 2 + Math.random() * 4,
          hasActualData: false
        };
      }
    }).sort((a, b) => b.effectiveness - a.effectiveness); // Sort by effectiveness
  }, [marketingData.channels, actualsData]);
  
  // Create channel comparison chart data
  const channelComparisonData = useMemo(() => {
    return channelPerformance.map(channel => ({
      name: channel.name,
      'Budget Allocation': channel.allocation,
      'Conversion Rate': channel.conversionRate,
      'ROI': Math.max(-100, channel.roi), // Cap negative ROI at -100% for visualization
      'CTR': channel.ctr
    }));
  }, [channelPerformance]);
  
  // Create budget allocation data for pie chart
  const budgetAllocationData = useMemo(() => {
    return channelPerformance.map(channel => ({
      name: channel.name,
      value: channel.budget,
      color: channel.color
    }));
  }, [channelPerformance]);
  
  // Create funnel data
  const funnelData = useMemo(() => {
    // In a real implementation, this would come from actual analytics
    const visitors = 15000;
    const productViews = 6750;
    const addToCart = 2300;
    const checkouts = 1250;
    const purchases = 850;
    
    return [
      { name: 'Website Visitors', value: visitors },
      { name: 'Product Views', value: productViews },
      { name: 'Add to Cart', value: addToCart },
      { name: 'Checkout Started', value: checkouts },
      { name: 'Purchases', value: purchases }
    ];
  }, []);
  
  // Calculate conversion rates between funnel stages
  const funnelRates = useMemo(() => {
    if (funnelData.length < 2) return [];
    
    return funnelData.slice(1).map((stage, index) => {
      const previousStage = funnelData[index];
      const conversionRate = (stage.value / previousStage.value) * 100;
      return {
        from: previousStage.name,
        to: stage.name,
        rate: conversionRate,
        dropoff: 100 - conversionRate
      };
    });
  }, [funnelData]);
  
  // Create monthly trend data for marketing performance
  const monthlyTrendData = useMemo(() => {
    // In a real implementation, this would be calculated from actual monthly data
    // For this example, we'll create synthesized data
    return [
      { name: 'Jan', spend: 2800, conversions: 135, cac: 20.7 },
      { name: 'Feb', spend: 3200, conversions: 148, cac: 21.6 },
      { name: 'Mar', spend: 3500, conversions: 172, cac: 20.3 },
      { name: 'Apr', spend: 4100, conversions: 193, cac: 21.2 },
      { name: 'May', spend: 4800, conversions: 238, cac: 20.2 },
      { name: 'Jun', spend: 5200, conversions: 251, cac: 20.7 },
    ];
  }, []);
  
  // Formatter for currency in tooltips
  const currencyFormatter = (value) => formatCurrency(value);
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Rate') || entry.name === 'ROI' 
                ? `${entry.value.toFixed(1)}%` 
                : entry.name.includes('Budget') || entry.name.includes('spend')
                  ? formatCurrency(entry.value)
                  : formatNumber(entry.value)
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Add a useEffect to force calculation and logging
  useEffect(() => {
    if (currentProduct) {
      // Calculate total revenue for debug purposes
      const totalRevenue = currentProduct.weeklyProjections ? 
        currentProduct.weeklyProjections.reduce((sum, week) => sum + (week.totalRevenue || 0), 0) : 0;
      
      // Calculate the marketing spend percentage
      const weeklyBudget = marketingData.totalBudget;
      const forecastPeriod = currentProduct.info?.forecastPeriod || 12;
      const totalMarketingBudget = weeklyBudget * forecastPeriod;
      
      // Calculate as percentage of total revenue
      const marketingPercentage = totalRevenue > 0 ? 
        (totalMarketingBudget / totalRevenue) * 100 : 0;
      
      console.log('MARKETING % CALCULATION:');
      console.log('- Weekly Budget:', weeklyBudget);
      console.log('- Forecast Period:', forecastPeriod);
      console.log('- Total Marketing Budget:', totalMarketingBudget);
      console.log('- Total Revenue:', totalRevenue);
      console.log('- Marketing % of Revenue:', marketingPercentage);
    }
  }, [currentProduct, marketingData.totalBudget]);
  
  // Custom function to calculate marketing spend percentage directly
  const calculateMarketingPercentage = () => {
    // Get weekly budget
    const weeklyBudget = marketingData.totalBudget;
    
    // Get forecast period
    const forecastPeriod = currentProduct?.info?.forecastPeriod || 12;
    
    // Get total marketing spend
    const totalMarketingBudget = weeklyBudget * forecastPeriod;
    
    // Get total revenue from projections
    let totalRevenue = 0;
    let totalVisitors = 0;
    if (currentProduct?.weeklyProjections) {
      totalRevenue = currentProduct.weeklyProjections.reduce(
        (sum, week) => sum + (week.totalRevenue || 0), 0
      );
      
      // Also calculate total visitors/attendees for CAC validation
      totalVisitors = currentProduct.weeklyProjections.reduce(
        (sum, week) => {
          // If we have visitors directly, use that, otherwise compute from attendance
          const visitors = week.visitors || (week.averageEventAttendance || 0) * (week.numberOfEvents || 0);
          return sum + visitors;
        }, 0
      );
    }
    
    console.log('DIRECT CALCULATION:');
    console.log('- Weekly Budget:', weeklyBudget);
    console.log('- Forecast Period:', forecastPeriod);
    console.log('- Total Marketing Budget:', totalMarketingBudget);
    console.log('- Total Revenue:', totalRevenue);
    console.log('- Total Projected Visitors:', totalVisitors);
    console.log('- Conversion Rate (21.1%):', totalVisitors * 0.211);
    console.log('- Expected CAC:', totalMarketingBudget / (totalVisitors * 0.211));
    
    // Calculate percentage
    const percentage = totalRevenue > 0 ? (totalMarketingBudget / totalRevenue) * 100 : 0;
    
    console.log('- UNCAPPED Marketing % of Revenue:', percentage);
    console.log('- FINAL Marketing % of Revenue:', percentage.toFixed(1) + '%');
    
    return percentage;
  };
  
  // Improved rendering for the Marketing Budget Allocation section
  const renderMarketingBudgetAllocation = () => {
    if (!marketingData.hasChannels) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] text-center">
          <p className="text-gray-500 mb-4">No marketing channels configured</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/product/' + currentProductId + '/costs'}
          >
            Configure Marketing Channels
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      );
    }
    
    return (
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={budgetAllocationData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(entry) => `${entry.name}: ${((entry.value / marketingData.totalBudget) * 100).toFixed(1)}%`}
            >
              {budgetAllocationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={currencyFormatter} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  // Enhanced channel effectiveness table
  const renderChannelEffectivenessTable = () => {
    if (!marketingData.hasChannels) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] text-center">
          <p className="text-gray-500 mb-4">No marketing channels configured</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/product/' + currentProductId + '/costs'}
          >
            Configure Marketing Channels
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Channel</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Conv. Rate</TableHead>
              <TableHead>ROI</TableHead>
              <TableHead>Effectiveness</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channelPerformance.slice(0, 4).map((channel) => (
              <TableRow key={channel.id}>
                <TableCell>{channel.name}</TableCell>
                <TableCell>{formatCurrency(channel.budget)}</TableCell>
                <TableCell>
                  {channel.conversionRate.toFixed(1)}%
                  {!channel.hasActualData && <span className="text-xs text-gray-400">*</span>}
                </TableCell>
                <TableCell>
                  <span className={channel.roi >= 0 ? "text-green-600" : "text-red-600"}>
                    {channel.roi.toFixed(1)}%
                  </span>
                  {!channel.hasActualData && <span className="text-xs text-gray-400">*</span>}
                </TableCell>
                <TableCell>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${Math.min(100, channel.effectiveness * 10)}%` }}
                    ></div>
                  </div>
                  {!channel.hasActualData && <span className="text-xs text-gray-400">*</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="text-xs text-gray-500 italic">
          {channelPerformance.some(ch => !ch.hasActualData) && 
            <p>* Based on estimated performance data. Add actuals to improve accuracy.</p>
          }
        </div>
      </div>
    );
  };
  
  // Replace the Conversion Funnel section with a configuration notice if no GA data
  const renderConversionFunnel = () => {
    const hasAnalyticsConfiguration = currentProduct?.analyticsConfig?.googleAnalytics?.isConnected;
    
    if (!hasAnalyticsConfiguration) {
      return (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Conversion Funnel Data Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <p className="text-gray-500 mb-4">
                Connect Google Analytics to view your actual conversion funnel data.
              </p>
              <Button variant="outline">Set Up Analytics Integration</Button>
              <p className="mt-4 text-sm text-gray-400">
                The conversion funnel requires website analytics data to provide accurate insights.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    // Regular conversion funnel rendering code goes here
    // We'll keep the existing code for now
    return (
      <>
        {/* Existing conversion funnel code */}
      </>
    );
  };
  
  // If no product is loaded yet
  if (!currentProduct) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-gray-500">Select a product to view marketing analytics</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Marketing Analytics</CardTitle>
          </div>
          <CardDescription>
            Analyze marketing performance, customer acquisition, and channel effectiveness
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Key Metrics Row - Adjusted for better spacing */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            <Card className="overflow-visible shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-3">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-500">Customer Acquisition Cost</p>
                    <DollarSign className="h-6 w-6 text-blue-500 opacity-80" />
                  </div>
                  <h4 className="text-3xl font-bold">{formatCurrency(acquisitionMetrics.cac)}</h4>
                  <div className="flex items-center">
                    <Badge variant={acquisitionMetrics.cac > acquisitionMetrics.cacTargetThreshold ? "destructive" : "default"} className="text-xs">
                      {acquisitionMetrics.cac > acquisitionMetrics.cacTargetThreshold ? (
                        <>
                          <ChevronUp className="h-3 w-3 mr-1" />
                          Above Target
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3 mr-1" />
                          Below Target
                        </>
                      )}
                    </Badge>
                    {acquisitionMetrics.dataSource !== 'none' && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {acquisitionMetrics.dataSource === 'actuals' ? 'From Actuals' : 
                         acquisitionMetrics.dataSource === 'projections' ? 'From Forecast' : 
                         'Blended Data'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-visible shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-3">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-500">Customer LTV</p>
                    <Users className="h-6 w-6 text-purple-500 opacity-80" />
                  </div>
                  <h4 className="text-3xl font-bold">{formatCurrency(acquisitionMetrics.customerLifetimeValue)}</h4>
                  <div className="flex items-center">
                    <Badge variant="default" className="text-xs">
                      LTV:CAC {acquisitionMetrics.cacToLtv.toFixed(1)}x
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-visible shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-3">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-500">Marketing Budget</p>
                    <BarChartIcon className="h-6 w-6 text-orange-500 opacity-80" />
                  </div>
                  <h4 className="text-3xl font-bold">{formatCurrency(marketingData.totalBudget)}/week</h4>
                  <div className="flex items-center">
                    <Badge variant="outline" className="text-xs">
                      {marketingData.channels.length} channel{marketingData.channels.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-visible shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-3">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                    <ArrowUpDown className="h-6 w-6 text-green-500 opacity-80" />
                  </div>
                  <h4 className="text-3xl font-bold">{acquisitionMetrics.conversionRate.toFixed(1)}%</h4>
                  <div className="flex items-center">
                    <Badge variant={acquisitionMetrics.conversionRate < 3 ? "destructive" : "default"} className="text-xs">
                      {acquisitionMetrics.conversionRate < 3 ? (
                        <>
                          <ChevronDown className="h-3 w-3 mr-1" />
                          Below Average
                        </>
                      ) : (
                        <>
                          <ChevronUp className="h-3 w-3 mr-1" />
                          Above Average
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-visible shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-3">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-500">Marketing % of Revenue</p>
                    <PieChartIcon className="h-6 w-6 text-indigo-500 opacity-80" />
                  </div>
                  <h4 className="text-3xl font-bold">{calculateMarketingPercentage().toFixed(1)}%</h4>
                  <div className="flex items-center">
                    <Badge 
                      variant={
                        calculateMarketingPercentage() > 25 ? "destructive" : 
                        calculateMarketingPercentage() < 5 ? "secondary" : 
                        "default"
                      } 
                      className="text-xs"
                    >
                      {calculateMarketingPercentage() > 25 ? (
                        <>Higher than target</>
                      ) : calculateMarketingPercentage() < 5 ? (
                        <>Lower than target</>
                      ) : (
                        <>Within target range</>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Tabs for different analytics views */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="channels">Channel Analysis</TabsTrigger>
              <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
              <TabsTrigger value="trends">Performance Trends</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-lg">Marketing Budget Allocation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderMarketingBudgetAllocation()}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-lg">Channel Effectiveness</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderChannelEffectivenessTable()}
                  </CardContent>
                </Card>
                
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-lg">Acquisition Cost Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis yAxisId="left" orientation="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip content={CustomTooltip} />
                          <Legend />
                          <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="spend" 
                            name="Marketing Spend" 
                            stroke="#8884d8" 
                            activeDot={{ r: 8 }} 
                          />
                          <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="conversions" 
                            name="Conversions" 
                            stroke="#82ca9d" 
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="cac" 
                            name="CAC" 
                            stroke="#ff7300" 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Channel Analysis Tab */}
            <TabsContent value="channels">
              {marketingData.hasChannels ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-0">
                      <CardTitle className="text-lg">Channel Performance Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={channelComparisonData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip content={CustomTooltip} />
                            <Legend />
                            <Bar dataKey="Budget Allocation" fill="#8884d8" name="Budget %" unit="%" />
                            <Bar dataKey="Conversion Rate" fill="#82ca9d" name="Conv Rate" unit="%" />
                            <Bar dataKey="ROI" fill="#ffc658" name="ROI" unit="%" />
                            <Bar dataKey="CTR" fill="#ff8042" name="CTR" unit="%" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-0">
                      <CardTitle className="text-lg">Channel ROI Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Channel</TableHead>
                            <TableHead>Weekly Budget</TableHead>
                            <TableHead>Est. Monthly Spend</TableHead>
                            <TableHead>Est. Conversions</TableHead>
                            <TableHead>Avg. CAC</TableHead>
                            <TableHead>Est. ROI</TableHead>
                            <TableHead>Recommendation</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {channelPerformance.map((channel) => {
                            const monthlySpend = channel.budget * 4;
                            const estConversions = Math.round((channel.conversionRate / 100) * (monthlySpend / 10)); // Rough estimation
                            const channelCac = estConversions > 0 ? monthlySpend / estConversions : 0;
                            
                            let recommendation;
                            if (channel.roi > 50) recommendation = "Increase budget";
                            else if (channel.roi < 0) recommendation = "Decrease budget";
                            else recommendation = "Maintain budget";
                            
                            return (
                              <TableRow key={channel.id}>
                                <TableCell className="font-medium">{channel.name}</TableCell>
                                <TableCell>{formatCurrency(channel.budget)}</TableCell>
                                <TableCell>{formatCurrency(monthlySpend)}</TableCell>
                                <TableCell>{formatNumber(estConversions)}</TableCell>
                                <TableCell>{formatCurrency(channelCac)}</TableCell>
                                <TableCell className={channel.roi < 0 ? 'text-red-500' : 'text-green-500'}>
                                  {channel.roi.toFixed(1)}%
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      recommendation === "Increase budget" 
                                        ? "default"
                                        : recommendation === "Decrease budget" 
                                          ? "destructive" 
                                          : "outline"
                                    }
                                  >
                                    {recommendation}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      <div className="text-sm text-gray-500 italic text-center mt-4">
                        * Recommendations based on estimated performance data - should be validated with actual analytics
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-center">
                  <div>
                    <p className="text-gray-500 mb-4">No marketing channels configured</p>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = '/cost-forecast'}
                    >
                      Configure in Cost Forecast
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Conversion Funnel Tab */}
            <TabsContent value="funnel">
              {renderConversionFunnel()}
            </TabsContent>
            
            {/* Performance Trends Tab */}
            <TabsContent value="trends">
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-lg">Marketing Performance Metrics (6-Month Trend)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={CustomTooltip} />
                        <Legend />
                        <Line type="monotone" dataKey="spend" name="Marketing Spend" stroke="#8884d8" />
                        <Line type="monotone" dataKey="conversions" name="Conversions" stroke="#82ca9d" />
                        <Line type="monotone" dataKey="cac" name="CAC" stroke="#ff7300" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-medium text-sm text-gray-500 mb-1">Average CAC</h4>
                      <p className="text-xl font-bold">
                        {formatCurrency(
                          monthlyTrendData.reduce((sum, month) => sum + month.cac, 0) / monthlyTrendData.length
                        )}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Average cost to acquire one customer</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-medium text-sm text-gray-500 mb-1">Monthly Spend Growth</h4>
                      <p className="text-xl font-bold">
                        {monthlyTrendData.length > 1 
                          ? `${(((monthlyTrendData[monthlyTrendData.length-1].spend / monthlyTrendData[0].spend) - 1) * 100).toFixed(1)}%` 
                          : '0%'
                        }
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Growth in marketing spend over period</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-medium text-sm text-gray-500 mb-1">Conversion Growth</h4>
                      <p className="text-xl font-bold">
                        {monthlyTrendData.length > 1 
                          ? `${(((monthlyTrendData[monthlyTrendData.length-1].conversions / monthlyTrendData[0].conversions) - 1) * 100).toFixed(1)}%` 
                          : '0%'
                        }
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Growth in customer conversions over period</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 
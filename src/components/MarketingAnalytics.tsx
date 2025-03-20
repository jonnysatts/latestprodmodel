import React, { useState, useMemo } from 'react';
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
  TrendingUp, Info, ExternalLink, PieChart as PieChartIcon, ArrowDownRight, 
  ArrowUpRight, Users, Target, DollarSign, BarChart as BarChartIcon
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../lib/utils';
import useStore from '../store/useStore';

// Import our custom types
import type { Product, MarketingChannelItem } from '../types';

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
  
  // Calculate CAC (Customer Acquisition Cost) from available data
  const acquisitionMetrics = useMemo(() => {
    if (!currentProduct) return {
      cac: 0,
      conversionRate: 0,
      customerLifetimeValue: 0,
      cacToLtv: 0,
      totalConversions: 0,
      marketingSpendPercentage: 0
    };
    
    // Try to extract acquisition data from actuals
    const totalMarketingSpend = actualsData.reduce((sum: number, actual: any) => 
      sum + (actual.marketingCosts || 0), 0);
    
    // Estimate conversions (could be calculated differently based on product type)
    // For this example, we'll use a simple estimate based on revenue and average price
    const avgPrice = currentProduct.revenueMetrics?.basePrice || 100;
    const totalRevenue = actualsData.reduce((sum: number, actual: any) => sum + (actual.revenue || 0), 0);
    const estimatedConversions = Math.round(totalRevenue / avgPrice);
    
    // Calculate metrics
    const cac = estimatedConversions > 0 ? totalMarketingSpend / estimatedConversions : 0;
    const conversionRate = 3.2; // Placeholder - would need real data
    
    // Estimate customer lifetime value (LTV)
    // In reality, would be calculated from retention, repeat purchase rate, etc.
    const averageOrderValue = avgPrice;
    const purchaseFrequency = 2.5; // Placeholder - average purchases per customer
    const customerLifespan = 1.5; // Placeholder - customer lifespan in years
    const customerLifetimeValue = averageOrderValue * purchaseFrequency * customerLifespan;
    
    // Calculate LTV:CAC ratio
    const cacToLtv = cac > 0 ? customerLifetimeValue / cac : 0;
    
    // Calculate marketing spend as percentage of revenue
    // If there's no actual revenue data, calculate against projected revenue
    let marketingSpendPercentage = 0;
    
    // Get total revenue - first check actuals, then projections
    const totalActualRevenue = actualsData.reduce((sum: number, actual: any) => 
      sum + (actual.revenue || 0), 0);
      
    // Calculate total marketing spend (weekly or per channel)
    const weeklyMarketingSpend = marketingData.totalBudget;
    
    // For more accurate percentage, use the appropriate denominator
    // Case 1: We have actual revenue data
    if (totalActualRevenue > 0) {
      // Use actual marketing costs from actuals
      const totalActualMarketingSpend = actualsData.reduce((sum: number, actual: any) => 
        sum + (actual.marketingCosts || 0), 0);
      
      marketingSpendPercentage = (totalActualMarketingSpend / totalActualRevenue) * 100;
      
      console.log('ACTUAL DATA:');
      console.log('- Actual Revenue:', totalActualRevenue);
      console.log('- Actual Marketing Spend:', totalActualMarketingSpend);
      console.log('- Marketing % of Revenue:', marketingSpendPercentage);
    } 
    // Case 2: No actual revenue, use projections
    else if (currentProduct.weeklyProjections && currentProduct.weeklyProjections.length > 0) {
      // Use projected total revenue
      const projectedTotalRevenue = currentProduct.weeklyProjections.reduce(
        (sum: number, week: any) => sum + (week.totalRevenue || 0), 0
      );
      
      // Use projected marketing costs (weekly budget * number of weeks)
      // But limited to the number of weeks with projections
      const weeksCount = currentProduct.weeklyProjections.length;
      const projectedMarketingSpend = weeklyMarketingSpend * weeksCount;
      
      if (projectedTotalRevenue > 0) {
        marketingSpendPercentage = (projectedMarketingSpend / projectedTotalRevenue) * 100;
      }
      
      console.log('PROJECTED DATA:');
      console.log('- Projected Total Revenue:', projectedTotalRevenue);
      console.log('- Weekly Marketing Budget:', weeklyMarketingSpend);
      console.log('- Weeks in Projection:', weeksCount);
      console.log('- Total Projected Marketing Spend:', projectedMarketingSpend);
      console.log('- Marketing % of Revenue:', marketingSpendPercentage);
    }
    
    return {
      cac,
      conversionRate,
      customerLifetimeValue,
      cacToLtv,
      totalConversions: estimatedConversions,
      marketingSpendPercentage
    };
  }, [currentProduct, actualsData, marketingData.totalBudget]);
  
  // Calculate channel effectiveness
  const channelPerformance = useMemo(() => {
    if (!marketingData.channels.length) return [];
    
    return marketingData.channels.map((channel, index) => {
      // In a real implementation, we would use actual performance data from each channel
      // For now, we'll generate hypothetical effectiveness scores
      const conversionRate = 2 + Math.random() * 5; // Random conversion rate between 2-7%
      const ctr = 1 + Math.random() * 4; // Random CTR between 1-5%
      const roi = -20 + Math.random() * 120; // Random ROI between -20% and 100%
      
      return {
        id: channel.id,
        name: channel.name || 'Unnamed Channel',
        budget: channel.budget || 0,
        allocation: channel.allocation || 0,
        conversionRate,
        ctr,
        roi,
        color: COLORS[index % COLORS.length],
        effectiveness: conversionRate * (roi > 0 ? roi/100 + 1 : 0.5) // Simplified effectiveness score
      };
    }).sort((a, b) => b.effectiveness - a.effectiveness); // Sort by effectiveness
  }, [marketingData.channels]);
  
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
                    <Badge variant={acquisitionMetrics.cac > 50 ? "destructive" : "default"} className="text-xs">
                      {acquisitionMetrics.cac > 50 ? (
                        <>
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          Above Target
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                          Below Target
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
                    <Target className="h-6 w-6 text-green-500 opacity-80" />
                  </div>
                  <h4 className="text-3xl font-bold">{acquisitionMetrics.conversionRate.toFixed(1)}%</h4>
                  <div className="flex items-center">
                    <Badge variant={acquisitionMetrics.conversionRate < 3 ? "destructive" : "default"} className="text-xs">
                      {acquisitionMetrics.conversionRate < 3 ? (
                        <>
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                          Below Average
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="h-3 w-3 mr-1" />
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
                  <h4 className="text-3xl font-bold">{acquisitionMetrics.marketingSpendPercentage.toFixed(1)}%</h4>
                  <div className="flex items-center">
                    <Badge 
                      variant={
                        acquisitionMetrics.marketingSpendPercentage > 30 ? "destructive" : 
                        acquisitionMetrics.marketingSpendPercentage < 5 ? "secondary" : 
                        "default"
                      } 
                      className="text-xs"
                    >
                      {acquisitionMetrics.marketingSpendPercentage > 30 ? (
                        <>Higher than target</>
                      ) : acquisitionMetrics.marketingSpendPercentage < 5 ? (
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
                    {marketingData.hasChannels ? (
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
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-center">
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
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-lg">Channel Effectiveness</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {channelPerformance.length > 0 ? (
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
                                <TableCell className="font-medium">{channel.name}</TableCell>
                                <TableCell>{formatCurrency(channel.budget)}</TableCell>
                                <TableCell>{channel.conversionRate.toFixed(1)}%</TableCell>
                                <TableCell className={channel.roi < 0 ? 'text-red-500' : 'text-green-500'}>
                                  {channel.roi.toFixed(1)}%
                                </TableCell>
                                <TableCell>
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div 
                                      className="bg-blue-600 h-2.5 rounded-full" 
                                      style={{ width: `${Math.min(100, channel.effectiveness * 10)}%` }}
                                    ></div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="text-sm text-gray-500 italic text-center mt-2">
                          * Based on estimated performance data
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[300px]">
                        <p className="text-gray-500">No channel data available</p>
                      </div>
                    )}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-lg">Conversion Funnel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={funnelData}
                          margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" />
                          <Tooltip formatter={(value) => formatNumber(value)} />
                          <Bar dataKey="value" fill="#8884d8">
                            {funnelData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-lg">Funnel Conversion Rates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Funnel Stage</TableHead>
                          <TableHead>Conversion Rate</TableHead>
                          <TableHead>Dropoff Rate</TableHead>
                          <TableHead>Opportunity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {funnelRates.map((rate, index) => {
                          let opportunity;
                          if (rate.rate < 30) opportunity = "High";
                          else if (rate.rate < 50) opportunity = "Medium";
                          else opportunity = "Low";
                          
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{rate.from} → {rate.to}</TableCell>
                              <TableCell>{rate.rate.toFixed(1)}%</TableCell>
                              <TableCell className={rate.dropoff > 70 ? 'text-red-500' : 'text-gray-500'}>
                                {rate.dropoff.toFixed(1)}%
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    opportunity === "High" 
                                      ? "default"
                                      : opportunity === "Medium" 
                                        ? "outline" 
                                        : "secondary"
                                  }
                                >
                                  {opportunity}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <div className="mt-6 p-4 bg-blue-50 rounded-md">
                      <h4 className="font-medium mb-2">Optimization Recommendations</h4>
                      <ul className="list-disc pl-5 space-y-2 text-sm">
                        {funnelRates.map((rate, index) => {
                          let recommendation = "";
                          if (rate.from === "Website Visitors" && rate.dropoff > 70) {
                            recommendation = "Improve landing page relevance and design to increase product view rate";
                          } else if (rate.from === "Product Views" && rate.dropoff > 70) {
                            recommendation = "Enhance product descriptions and imagery to increase add-to-cart rate";
                          } else if (rate.from === "Add to Cart" && rate.dropoff > 50) {
                            recommendation = "Simplify checkout process to reduce abandonment";
                          } else if (rate.from === "Checkout Started" && rate.dropoff > 30) {
                            recommendation = "Address payment friction points or shipping concerns";
                          }
                          
                          return recommendation ? (
                            <li key={index}>{recommendation}</li>
                          ) : null;
                        })}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
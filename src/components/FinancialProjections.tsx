import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Area,
  ReferenceLine
} from 'recharts';
import useStore from '../store/useStore';
import { formatCurrency, formatNumber, formatPercent } from '../lib/utils';
export default function FinancialProjections() {
  const { products, currentProductId } = useStore();
  const currentProduct = products.find(p => p.info.id === currentProductId);

  if (!currentProduct) {
    return (
      <div className="text-center py-8 text-gray-500">
        No product selected or product not found.
      </div>
    );
  }

  const { weeklyProjections, actualMetrics = [], actuals = [] } = currentProduct;

  // Get actuals for better integration with projections
  const getActualForWeek = (weekNumber: number) => {
    return actuals.find(a => a.week === weekNumber);
  };

  // Calculate key financial metrics with actuals integration
  let totalRevenue = 0;
  let totalCosts = 0;
  
  weeklyProjections.forEach(week => {
    const actual = getActualForWeek(week.week);
    if (actual) {
      totalRevenue += actual.revenue;
      totalCosts += actual.expenses;
    } else {
      totalRevenue += week.totalRevenue;
      totalCosts += week.totalCosts;
    }
  });
  
  const totalProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) : 0;
  
  // Find break-even week considering actuals
  let cumulativeProfit = 0;
  let breakEvenWeek = 0;
  
  for (let i = 1; i <= weeklyProjections.length; i++) {
    const weekProjection = weeklyProjections.find(w => w.week === i);
    const weekActual = getActualForWeek(i);
    
    if (weekActual) {
      cumulativeProfit += (weekActual.revenue - weekActual.expenses);
    } else if (weekProjection) {
      cumulativeProfit += weekProjection.weeklyProfit;
    }
    
    if (cumulativeProfit > 0 && breakEvenWeek === 0) {
      breakEvenWeek = i;
    }
  }
  
  if (breakEvenWeek === 0) {
    breakEvenWeek = weeklyProjections.length + 1; // After projection period
  }

  // Prepare revenue streams with actuals integration
  const revenueStreams = {
    tickets: 0,
    fb: 0,
    merchandise: 0,
    digital: 0
  };
  
  weeklyProjections.forEach(week => {
    const actual = getActualForWeek(week.week);
    
    if (actual) {
      revenueStreams.tickets += actual.ticketRevenue || 0;
      revenueStreams.fb += actual.fbRevenue || 0;
      revenueStreams.merchandise += actual.merchandiseRevenue || 0;
      revenueStreams.digital += actual.digitalRevenue || 0;
    } else {
      revenueStreams.tickets += week.ticketRevenue;
      revenueStreams.fb += week.fbRevenue;
      revenueStreams.merchandise += week.merchandiseRevenue;
      revenueStreams.digital += week.digitalRevenue;
    }
  });

  // Prepare cost breakdown with actuals integration
  const costBreakdown = {
    marketing: 0,
    staffing: 0,
    events: 0,
    additional: 0
  };
  
  weeklyProjections.forEach(week => {
    const actual = getActualForWeek(week.week);
    
    if (actual) {
      costBreakdown.marketing += actual.marketingCosts || 0;
      costBreakdown.staffing += actual.staffingCosts || 0;
      costBreakdown.events += actual.eventCosts || 0;
      costBreakdown.additional += actual.additionalCosts || 0;
    } else {
      costBreakdown.marketing += week.marketingCosts;
      costBreakdown.staffing += week.staffingCosts;
      costBreakdown.events += week.eventCosts;
      costBreakdown.additional += week.setupCosts;
    }
  });

  // Prepare data for revenue trend chart with improved actuals integration
  const revenueTrendData = weeklyProjections.map(week => {
    const actual = getActualForWeek(week.week);
    return {
      week: `Week ${week.week}`,
      projected: actual ? null : week.totalRevenue, // Only show projected when we don't have actuals
      actual: actual ? actual.revenue : null,
      hasActual: !!actual
    };
  });

  // Calculate weekly profit margins with actuals integration
  const profitMarginData = weeklyProjections.map(week => {
    const actual = getActualForWeek(week.week);
    
    if (actual) {
      const actualRevenue = actual.revenue;
      const actualExpenses = actual.expenses;
      const actualProfit = actualRevenue - actualExpenses;
      return {
        week: `Week ${week.week}`,
        projectedMargin: null,
        actualMargin: actualRevenue > 0 ? (actualProfit / actualRevenue) : 0,
        hasActual: true
      };
    } else {
      return {
        week: `Week ${week.week}`,
        projectedMargin: week.totalRevenue > 0 ? (week.weeklyProfit / week.totalRevenue) : 0,
        actualMargin: null,
        hasActual: false
      };
    }
  });

  // Prepare data for revenue breakdown
  const revenueBreakdownData = [
    { name: 'Tickets', value: revenueStreams.tickets },
    { name: 'F&B', value: revenueStreams.fb },
    { name: 'Merchandise', value: revenueStreams.merchandise },
    { name: 'Digital', value: revenueStreams.digital }
  ];

  // Prepare data for cost breakdown
  const costBreakdownData = [
    { name: 'Marketing', value: costBreakdown.marketing },
    { name: 'Staffing', value: costBreakdown.staffing },
    { name: 'Events', value: costBreakdown.events },
    { name: 'Additional', value: costBreakdown.additional }
  ];

  // Count how many weeks have actual data
  const weeksWithActuals = weeklyProjections.filter(week => getActualForWeek(week.week)).length;
  const totalWeeks = weeklyProjections.length;
  const actualsPercentage = (weeksWithActuals / totalWeeks) * 100;

  // Calculate actual revenue and profit separately
  let actualRevenue = 0;
  let actualCosts = 0;
  let projectedRevenue = 0;
  let projectedCosts = 0;

  weeklyProjections.forEach(week => {
    const actual = getActualForWeek(week.week);
    if (actual) {
      actualRevenue += actual.revenue;
      actualCosts += actual.expenses;
    } else {
      projectedRevenue += week.totalRevenue;
      projectedCosts += week.totalCosts;
    }
  });

  const actualProfit = actualRevenue - actualCosts;
  const projectedProfit = projectedRevenue - projectedCosts;

  // Find the index where actuals end (last week with actual data)
  const lastActualWeekIndex = Math.max(
    ...weeklyProjections
      .filter(week => getActualForWeek(week.week))
      .map(week => weeklyProjections.findIndex(w => w.week === week.week))
  );

  // Also calculate what the original projection would have been (without actuals)
  const originalTotalRevenue = weeklyProjections.reduce((sum, week) => sum + week.totalRevenue, 0);
  const originalTotalCosts = weeklyProjections.reduce((sum, week) => sum + week.totalCosts, 0);
  const originalTotalProfit = originalTotalRevenue - originalTotalCosts;
  
  // Calculate the impact of actuals on the overall projection
  const revenueDifference = totalRevenue - originalTotalRevenue;
  const profitDifference = totalProfit - originalTotalProfit;

  // Add the calculation for the COGS totals in the component
  const totalFbCogs = weeklyProjections.reduce((sum, week) => sum + (week.fbCogs || 0), 0);
  const totalMerchandiseCogs = weeklyProjections.reduce((sum, week) => sum + (week.merchandiseCogs || 0), 0);

  // Calculate total costs by category
  const totalMarketingCosts = weeklyProjections.reduce((sum, week) => sum + (week.marketingCosts || 0), 0);
  const totalStaffingCosts = weeklyProjections.reduce((sum, week) => sum + (week.staffingCosts || 0), 0);
  const totalEventCosts = weeklyProjections.reduce((sum, week) => sum + (week.eventCosts || 0), 0);
  const totalSetupCosts = weeklyProjections.reduce((sum, week) => sum + (week.setupCosts || 0), 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-2xl font-bold mb-1 flex items-center">
                {formatCurrency(totalRevenue)}
                {revenueDifference !== 0 && (
                  <span className={`text-sm ml-2 ${revenueDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {revenueDifference > 0 ? '↑' : '↓'} {formatCurrency(Math.abs(revenueDifference))}
                  </span>
                )}
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <div className="flex flex-col">
                  <span className="font-medium text-green-600">Actual: {formatCurrency(actualRevenue)}</span>
                  <span className="font-medium text-blue-600">Projected: {formatCurrency(projectedRevenue)}</span>
                </div>
                {weeksWithActuals > 0 && (
                  <div className="text-xs text-right">
                    <span className="text-gray-500">Original projection:</span>
                    <div>{formatCurrency(originalTotalRevenue)}</div>
                  </div>
                )}
              </div>
              
              {weeksWithActuals > 0 && (
                <div className="w-full mt-2">
                  <div className="text-xs text-gray-500 mb-1">
                    {actualsPercentage.toFixed(0)}% of period has actual data
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full">
                    <div 
                      className="bg-green-500 h-1.5 rounded-l-full" 
                      style={{ width: `${actualRevenue / totalRevenue * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-2xl font-bold mb-1 flex items-center">
                {formatCurrency(totalProfit)}
                {profitDifference !== 0 && (
                  <span className={`text-sm ml-2 ${profitDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitDifference > 0 ? '↑' : '↓'} {formatCurrency(Math.abs(profitDifference))}
                  </span>
                )}
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <div className="flex flex-col">
                  <span className="font-medium text-green-600">Actual: {formatCurrency(actualProfit)}</span>
                  <span className="font-medium text-blue-600">Projected: {formatCurrency(projectedProfit)}</span>
                </div>
                {weeksWithActuals > 0 && (
                  <div className="text-xs text-right">
                    <span className="text-gray-500">Original projection:</span>
                    <div>{formatCurrency(originalTotalProfit)}</div>
                  </div>
                )}
              </div>
              
              {weeksWithActuals > 0 && (
                <div className="w-full mt-2">
                  <div className="text-xs text-gray-500 mb-1">
                    {actualsPercentage.toFixed(0)}% of period has actual data
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full">
                    <div 
                      className="bg-green-500 h-1.5 rounded-l-full" 
                      style={{ width: `${Math.max(0, actualProfit) / Math.max(0.01, totalProfit) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(profitMargin)}</div>
            <p className="text-xs text-muted-foreground">Overall profit margin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Break-even</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Week {breakEvenWeek}</div>
            <p className="text-xs text-muted-foreground">Expected break-even point</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              <span className="text-sm">Actual Revenue</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 border-2 border-blue-500 rounded-full mr-1"></div>
              <span className="text-sm">Projected Revenue</span>
            </div>
            {lastActualWeekIndex >= 0 && (
              <div className="text-xs text-gray-500">
                Actuals available for weeks 1-{lastActualWeekIndex + 1}
              </div>
            )}
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (value === null) return ['-', name];
                    return [formatCurrency(value), name === 'projected' ? 'Projected Revenue' : 'Actual Revenue'];
                  }}
                  labelFormatter={(label) => label}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="projected"
                  name="Projected Revenue"
                  fill="#4F46E580"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  connectNulls={true}
                />
                <Bar
                  dataKey="actual"
                  name="Actual Revenue"
                  fill="#10B981"
                  connectNulls={true}
                />
                {/* Add a reference line where actuals end */}
                {lastActualWeekIndex >= 0 && (
                  <ReferenceLine
                    x={`Week ${weeklyProjections[lastActualWeekIndex].week}`}
                    stroke="#888"
                    strokeDasharray="3 3"
                    label={{
                      value: "Last Actual",
                      position: "insideTopRight",
                      fill: "#888",
                      fontSize: 12
                    }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Profit Margin Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Margin Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              <span className="text-sm">Actual Margin</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 border-2 border-purple-500 rounded-full mr-1"></div>
              <span className="text-sm">Projected Margin</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={profitMarginData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (value === null) return ['-', name];
                    return [formatPercent(value), name === 'projectedMargin' ? 'Projected Margin' : 'Actual Margin'];
                  }}
                  labelFormatter={(label) => label}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="projectedMargin"
                  name="Projected Margin"
                  fill="#8B5CF680"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  connectNulls={true}
                />
                <Bar
                  dataKey="actualMargin"
                  name="Actual Margin"
                  fill="#10B981"
                  connectNulls={true}
                />
                {/* Add a reference line where actuals end */}
                {lastActualWeekIndex >= 0 && (
                  <ReferenceLine
                    x={`Week ${weeklyProjections[lastActualWeekIndex].week}`}
                    stroke="#888"
                    strokeDasharray="3 3"
                    label={{
                      value: "Last Actual",
                      position: "insideTopRight",
                      fill: "#888",
                      fontSize: 12
                    }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                  />
                  <Bar dataKey="value" name="Amount" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Revenue Stream</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueBreakdownData.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                      <TableCell className="text-right">
                        {formatPercent(item.value / totalRevenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {totalMarketingCosts > 0 && (
                <div className="flex items-center justify-between">
                  <span>Marketing</span>
                  <span className="font-medium">{formatCurrency(totalMarketingCosts)}</span>
                </div>
              )}
              
              {totalStaffingCosts > 0 && (
                <div className="flex items-center justify-between">
                  <span>Staffing</span>
                  <span className="font-medium">{formatCurrency(totalStaffingCosts)}</span>
                </div>
              )}
              
              {totalEventCosts > 0 && (
                <div className="flex items-center justify-between">
                  <span>Events</span>
                  <span className="font-medium">{formatCurrency(totalEventCosts)}</span>
                </div>
              )}
              
              {totalSetupCosts > 0 && (
                <div className="flex items-center justify-between">
                  <span>Setup</span>
                  <span className="font-medium">{formatCurrency(totalSetupCosts)}</span>
                </div>
              )}
              
              {/* Add F&B COGS for all product types if costs exist */}
              {totalFbCogs > 0 && (
                <div className="flex items-center justify-between">
                  <span>F&B Costs</span>
                  <span className="font-medium">{formatCurrency(totalFbCogs)}</span>
                </div>
              )}
              
              {/* Add Merchandise COGS if applicable */}
              {currentProduct.info.type === 'Merchandise Drops' && totalMerchandiseCogs > 0 && (
                <div className="flex items-center justify-between border-l-2 border-pink-500 pl-2 mt-3">
                  <span className="font-medium text-pink-700">Merchandise COGS</span>
                  <span className="font-medium text-pink-700">{formatCurrency(totalMerchandiseCogs)}</span>
                </div>
              )}
              
              <div className="pt-2 border-t mt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Costs</span>
                  <span className="font-semibold">{formatCurrency(originalTotalCosts)}</span>
                </div>
                
                {/* Add COGS impact on margin */}
                {(totalFbCogs > 0 || totalMerchandiseCogs > 0) && (
                  <div className="text-xs text-gray-500 mt-2">
                    <p>COGS represent {formatPercent((totalFbCogs + totalMerchandiseCogs) / originalTotalCosts)} of total costs</p>
                    <p>COGS impact on margin: {formatPercent((totalFbCogs + totalMerchandiseCogs) / totalRevenue)}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
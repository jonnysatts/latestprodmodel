import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import useStore from '../store/useStore';
import { formatCurrency, formatNumber, formatPercent } from '../lib/utils';
import { WeeklyActuals } from '../types';
import { generateWeeklyProjections } from '../lib/calculations';

export default function WeeklyForecast() {
  const { products, currentProductId, updateProduct } = useStore();
  const currentProduct = products.find(p => p.info.id === currentProductId);

  // Regenerate projections to ensure they include COGS
  useEffect(() => {
    if (currentProduct) {
      // Only regenerate if we have a product and it has revenue metrics
      if (currentProduct.info && currentProduct.revenueMetrics && currentProduct.costMetrics) {
        // Make sure F&B COGS percentage has a valid value
        const fbCogPercentage = currentProduct.costMetrics.fbCogPercentage || 30;
        
        // Re-generate weekly projections to ensure COGS are calculated
        const updatedProjections = generateWeeklyProjections(
          currentProduct.info,
          currentProduct.growthMetrics,
          currentProduct.revenueMetrics,
          {
            ...currentProduct.costMetrics,
            fbCogPercentage
          }
        );
        
        // Update the product with regenerated projections only if needed
        if (JSON.stringify(updatedProjections) !== JSON.stringify(currentProduct.weeklyProjections)) {
          console.log('Updating weekly projections with corrected COGS calculations');
          updateProduct({
            ...currentProduct,
            weeklyProjections: updatedProjections
          });
        }
      }
    }
  }, [currentProduct, updateProduct]);

  if (!currentProduct) {
    return (
      <div className="text-center py-8 text-gray-500">
        No product selected or product not found.
      </div>
    );
  }

  const { weeklyProjections, actuals = [] } = currentProduct;
  const isPerEvent = currentProduct.info.forecastType === 'per-event';

  // Helper to find actuals for a specific week
  const getActualsForWeek = (weekNumber: number): WeeklyActuals | undefined => {
    const actualData = actuals.find(actual => actual.week === weekNumber);
    
    // For week 1, include setup costs and marketing costs from the projections
    if (weekNumber === 1 && actualData) {
      // Get the projected data for week 1 to capture setup costs and marketing
      const week1Projection = weeklyProjections.find(w => w.week === 1);
      
      if (week1Projection) {
        // Create a new object that combines actual data with setup and marketing costs
        return {
          ...actualData,
          // Add setup costs and marketing costs to the total expenses
          expenses: actualData.expenses + 
                   (week1Projection.setupCosts || 0) + 
                   (week1Projection.marketingCosts || 0),
        };
      }
    }
    
    return actualData;
  };

  // Calculate the cumulative profit considering actuals
  const calculateCumulativeProfit = (weekNumber: number): number => {
    let cumulativeProfit = 0;
    
    for (let i = 1; i <= weekNumber; i++) {
      const weekActual = getActualsForWeek(i);
      const weekProjection = weeklyProjections.find(w => w.week === i);
      
      if (weekActual) {
        // Use actual profit for this week
        cumulativeProfit += (weekActual.revenue - weekActual.expenses);
      } else if (weekProjection) {
        // Use projected profit for this week
        cumulativeProfit += weekProjection.weeklyProfit;
      }
    }
    
    return cumulativeProfit;
  };

  // Calculate the percentage of weeks with actual data
  const weeksWithActuals = weeklyProjections.filter(week => getActualsForWeek(week.week)).length;
  const totalWeeks = weeklyProjections.length;
  const actualsPercentage = (weeksWithActuals / totalWeeks) * 100;

  // Calculate total actual vs projected values
  let totalActualRevenue = 0;
  let totalProjectedRevenue = 0;
  let totalActualCosts = 0;
  let totalProjectedCosts = 0;
  let totalActualProfit = 0;
  let totalProjectedProfit = 0;
  let totalFbCogs = 0; // Track total F&B COGS
  let totalActualFbCogs = 0; // Track actual F&B COGS

  weeklyProjections.forEach(week => {
    const actual = getActualsForWeek(week.week);
    if (actual) {
      totalActualRevenue += actual.revenue;
      totalActualCosts += actual.expenses;
      totalActualProfit += (actual.revenue - actual.expenses);
      // Include fbCogs from actuals if available
      if (actual.fbCogs !== undefined) {
        totalActualFbCogs += actual.fbCogs;
      } else if (actual.fbRevenue && currentProduct?.costMetrics?.fbCogPercentage) {
        // If actuals don't have fbCogs but do have fbRevenue, calculate it
        const calculatedFbCogs = actual.fbRevenue * (currentProduct.costMetrics.fbCogPercentage / 100);
        totalActualFbCogs += calculatedFbCogs;
      }
    } else {
      totalProjectedRevenue += week.totalRevenue;
      totalProjectedCosts += week.totalCosts;
      totalProjectedProfit += week.weeklyProfit;
      totalFbCogs += (week.fbCogs || 0); // Sum up projected F&B COGS
    }
  });

  // Combine actual and projected COGS for total
  totalFbCogs = totalActualFbCogs + totalFbCogs;

  // Find the last week with actual data
  const lastActualWeek = Math.max(
    ...actuals.map(actual => actual.week),
    0 // Default if no actuals
  );

  // Debug information - log to console
  console.log('Weekly Projections F&B COGS:', weeklyProjections.map(w => ({
    week: w.week,
    footTraffic: w.footTraffic,
    fbRevenue: w.fbRevenue,
    fbCogs: w.fbCogs,
    fbCogsPercentage: w.fbRevenue > 0 ? (w.fbCogs / w.fbRevenue) * 100 : 0
  })));

  // More detailed examination of Week 1 data
  const week1Data = weeklyProjections.find(w => w.week === 1);

  // Debug cost information for Week 1
  const week1Actual = getActualsForWeek(1);
  
  console.log('WEEK 1 COSTS BREAKDOWN:', {
    'Setup Costs': week1Data?.setupCosts || 0,
    'Marketing Costs': week1Data?.marketingCosts || 0,
    'Actual Expenses Before': week1Actual ? actuals.find(a => a.week === 1)?.expenses : 'N/A',
    'Actual Expenses After': week1Actual?.expenses || 'N/A',
    'Projected Total Costs': week1Data?.totalCosts || 0,
    'Weekly Profit': week1Actual 
      ? (week1Actual.revenue - week1Actual.expenses) 
      : (week1Data?.weeklyProfit || 0)
  });
  
  // Calculate total F&B revenue for display
  const calculatedFbRevenue = weeklyProjections.reduce((sum, week) => sum + (week.fbRevenue || 0), 0);
  
  console.log('Current Product Cost Metrics:', currentProduct.costMetrics);
  console.log('Total F&B Revenue:', calculatedFbRevenue, 'Total F&B COGS:', totalFbCogs);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>12-Week Forecast</CardTitle>
          <div className="flex items-center space-x-2 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              <span>Actual</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-200 rounded-full mr-1"></div>
              <span>Projected</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 mb-4 flex flex-col sm:flex-row sm:justify-between">
            <p>
              Weekly revenue and performance projections for the 12-week post-launch period.
            </p>
            {weeksWithActuals > 0 && (
              <div className="font-medium mt-1 sm:mt-0 flex flex-col">
                <p className="mb-1">
                  Actuals available for {weeksWithActuals} of {totalWeeks} weeks ({formatPercent(actualsPercentage / 100)})
                </p>
                <p className="text-xs text-blue-600">
                  <span className="font-bold">Note:</span> Actual data replaces forecasted data and modifies future projections
                </p>
              </div>
            )}
          </div>
          
          {/* F&B COGS Information */}
          {currentProduct.info.type === 'Food & Beverage Products' && (
            <div className="mb-4 bg-orange-50 p-3 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-700 mb-2">Food & Beverage COGS Summary</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Average Weekly F&B Revenue</div>
                  <div className="font-medium">{formatCurrency(calculatedFbRevenue / totalWeeks)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Average Weekly F&B COGS</div>
                  <div className="font-medium">{formatCurrency((totalFbCogs || 0) / totalWeeks)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">12-Week Total</div>
                  <div className="font-medium">{formatCurrency(totalFbCogs || 0)}</div>
                </div>
              </div>
            </div>
          )}
          
          {lastActualWeek > 0 && (
            <div className="mb-4 bg-green-50 p-3 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-700 mb-2">Actuals Summary (Weeks 1-{lastActualWeek})</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Revenue</div>
                  <div className="font-medium">{formatCurrency(totalActualRevenue)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Costs</div>
                  <div className="font-medium">{formatCurrency(totalActualCosts)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Profit</div>
                  <div className="font-medium">{formatCurrency(totalActualProfit)}</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  {isPerEvent && <TableHead className="text-right">Events</TableHead>}
                  <TableHead className="text-right">Total Attendance</TableHead>
                  {isPerEvent && <TableHead className="text-right">Avg per Event</TableHead>}
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Total Costs</TableHead>
                  {currentProduct.info.type === 'Food & Beverage Products' && (
                    <TableHead className="text-right">F&B COGS</TableHead>
                  )}
                  {currentProduct.info.type === 'Merchandise Drops' && (
                    <TableHead className="text-right">Merch COGS</TableHead>
                  )}
                  <TableHead className="text-right">Weekly Profit</TableHead>
                  <TableHead className="text-right">Cumulative Profit</TableHead>
                  <TableHead className="text-center w-16">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklyProjections.map((week) => {
                  // Check if we have actual data for this week
                  const actualData = getActualsForWeek(week.week);
                  
                  // Calculate weekly profit based on available actual data
                  let weeklyProfit = 0;
                  if (actualData) {
                    // Use actual revenue and expenses (which now includes setup and marketing costs)
                    weeklyProfit = actualData.revenue - actualData.expenses;
                  } else {
                    weeklyProfit = week.weeklyProfit;
                  }
                  
                  // Calculate cumulative profit considering actuals for previous weeks
                  const cumulativeProfit = calculateCumulativeProfit(week.week);
                  
                  return (
                    <TableRow 
                      key={week.week}
                      className={actualData ? "bg-green-50 hover:bg-green-100" : "hover:bg-gray-50"}
                    >
                      <TableCell className="font-medium">Week {week.week}</TableCell>
                      
                      {isPerEvent && (
                        <TableCell className={`text-right ${actualData ? 'text-green-600 font-medium' : ''}`}>
                          {actualData ? formatNumber(actualData.numberOfEvents || 0) : formatNumber(week.numberOfEvents)}
                        </TableCell>
                      )}
                      
                      <TableCell className={`text-right ${actualData ? 'text-green-600 font-medium' : ''}`}>
                        {actualData ? formatNumber(actualData.footTraffic || 0) : formatNumber(week.footTraffic)}
                      </TableCell>
                      
                      {isPerEvent && (
                        <TableCell className={`text-right ${actualData ? 'text-green-600 font-medium' : ''}`}>
                          {actualData ? formatNumber(actualData.averageEventAttendance || 0) : formatNumber(week.averageEventAttendance)}
                        </TableCell>
                      )}
                      
                      <TableCell className={`text-right ${actualData ? 'text-green-600 font-medium' : ''}`}>
                        {actualData ? formatCurrency(actualData.revenue) : formatCurrency(week.totalRevenue)}
                      </TableCell>
                      
                      <TableCell className={`text-right ${actualData ? 'text-green-600 font-medium' : ''}`}>
                        {actualData 
                          ? formatCurrency(actualData.expenses) 
                          : formatCurrency(week.totalCosts || 0)
                        }
                      </TableCell>
                      
                      {currentProduct.info.type === 'Food & Beverage Products' && (
                        <TableCell className={`text-right ${actualData ? 'text-green-600 font-medium' : ''} border-l border-orange-100`}>
                          <span className="font-medium text-orange-700">
                            {actualData && actualData.fbCogs !== undefined
                              ? formatCurrency(actualData.fbCogs)
                              : formatCurrency(week.fbCogs || 0)}
                          </span>
                          {(week.week === 1 || actualData) && (
                            <div className="text-xs text-gray-500 mt-1">
                              {actualData && actualData.fbCogs !== undefined && actualData.fbRevenue
                                ? `(${formatPercent(actualData.fbCogs / actualData.fbRevenue)})`
                                : `(${formatPercent((week.fbCogs || 0) / (week.fbRevenue || 1))})`}
                            </div>
                          )}
                        </TableCell>
                      )}
                      
                      {currentProduct.info.type === 'Merchandise Drops' && (
                        <TableCell className={`text-right ${actualData ? 'text-green-600 font-medium' : ''} border-l border-pink-100`}>
                          {formatCurrency(week.merchandiseCogs || 0)}
                        </TableCell>
                      )}
                      
                      <TableCell className={`text-right ${actualData ? 'font-medium' : ''} ${weeklyProfit < 0 ? 'text-red-600' : actualData ? 'text-green-600' : ''}`}>
                        {formatCurrency(weeklyProfit)}
                      </TableCell>
                      
                      <TableCell className={`text-right ${cumulativeProfit < 0 ? 'text-red-600' : ''}`}>
                        {formatCurrency(cumulativeProfit)}
                      </TableCell>
                      
                      <TableCell className="text-center">
                        {actualData ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Actual
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Projected
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {/* Summary row with totals */}
                <TableRow className="bg-gray-50 font-medium">
                  <TableCell colSpan={isPerEvent ? 3 : 2}>Totals</TableCell>
                  {isPerEvent && <TableCell className="text-right">-</TableCell>}
                  <TableCell className="text-right">
                    {formatCurrency(totalActualRevenue + totalProjectedRevenue)}
                    <div className="text-xs text-gray-500 mt-1">
                      {weeksWithActuals > 0 && (
                        <div>
                          <div>{formatCurrency(totalActualRevenue)} actual</div>
                          <div>{formatCurrency(totalProjectedRevenue)} projected</div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totalActualCosts + totalProjectedCosts)}
                    <div className="text-xs text-gray-500 mt-1">
                      {weeksWithActuals > 0 && (
                        <div>
                          <div>{formatCurrency(totalActualCosts)} actual</div>
                          <div>{formatCurrency(totalProjectedCosts)} projected</div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  {currentProduct.info.type === 'Food & Beverage Products' && (
                    <TableCell className="text-right border-l border-orange-100">
                      {formatCurrency(totalFbCogs)}
                    </TableCell>
                  )}
                  
                  {currentProduct.info.type === 'Merchandise Drops' && (
                    <TableCell className="text-right">-</TableCell>
                  )}
                  
                  <TableCell className={`text-right ${(totalActualProfit + totalProjectedProfit) < 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(totalActualProfit + totalProjectedProfit)}
                  </TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
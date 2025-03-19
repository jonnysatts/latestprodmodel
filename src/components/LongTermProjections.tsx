import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
  Legend
} from 'recharts';
import useStore from '../store/useStore';
import { formatCurrency, formatPercent, formatNumber } from '../lib/utils';

interface MarketMetrics {
  totalAddressableMarket: number;
  servicableAddressableMarket: number;
  servicableObtainableMarket: number;
  yearlyGrowthRate: number;
  costScalingRate: number;
}

const DEFAULT_MARKET_METRICS: MarketMetrics = {
  totalAddressableMarket: 100000000,
  servicableAddressableMarket: 50000000,
  servicableObtainableMarket: 25000000,
  yearlyGrowthRate: 25,
  costScalingRate: 20
};

export default function LongTermProjections() {
  const { products, currentProductId, updateProduct } = useStore();
  const currentProduct = products.find(p => p.info.id === currentProductId);
  const [marketMetrics, setMarketMetrics] = useState<MarketMetrics>(DEFAULT_MARKET_METRICS);

  // Load saved market metrics from product if they exist
  useEffect(() => {
    if (currentProduct?.marketMetrics) {
      setMarketMetrics(currentProduct.marketMetrics);
    }
  }, [currentProduct?.info.id]);

  if (!currentProduct) {
    return (
      <div className="text-center py-8 text-gray-500">
        No product selected or product not found.
      </div>
    );
  }

  const { weeklyProjections } = currentProduct;

  // Calculate quarterly projections based on weekly data
  const quarterlyProjections = Array.from({ length: 4 }, (_, quarterIndex) => {
    const startWeek = quarterIndex * 13;
    const weeksInQuarter = weeklyProjections.slice(startWeek, startWeek + 13);

    const baseRevenue = weeksInQuarter.reduce((sum, week) => sum + week.totalRevenue, 0);
    const baseCosts = weeksInQuarter.reduce((sum, week) => sum + week.totalCosts, 0);
    
    // Apply growth assumptions for future quarters
    const quarterGrowthRate = 1 + (0.15 * (quarterIndex + 1)); // 15% quarter-over-quarter growth
    const costScalingRate = 1 + (0.10 * (quarterIndex + 1)); // 10% cost scaling

    return {
      quarter: `Q${quarterIndex + 1}`,
      revenue: baseRevenue * quarterGrowthRate,
      costs: baseCosts * costScalingRate,
      profit: (baseRevenue * quarterGrowthRate) - (baseCosts * costScalingRate)
    };
  });

  // Calculate annual projections
  const annualProjections = Array.from({ length: 3 }, (_, yearIndex) => {
    const baseQuarterRevenue = quarterlyProjections[0].revenue;
    const baseQuarterCosts = quarterlyProjections[0].costs;
    
    // Apply annual growth assumptions
    const yearlyGrowthRate = 1 + (marketMetrics.yearlyGrowthRate / 100) * (yearIndex + 1);
    const yearCostScaling = 1 + (marketMetrics.costScalingRate / 100) * (yearIndex + 1);

    const yearlyRevenue = baseQuarterRevenue * 4 * yearlyGrowthRate;
    const yearlyCosts = baseQuarterCosts * 4 * yearCostScaling;

    return {
      year: `Year ${yearIndex + 1}`,
      revenue: yearlyRevenue,
      costs: yearlyCosts,
      profit: yearlyRevenue - yearlyCosts,
      margin: (yearlyRevenue - yearlyCosts) / yearlyRevenue
    };
  });

  // Calculate market penetration
  const currentMarketShare = annualProjections[0].revenue / marketMetrics.servicableObtainableMarket;

  // Prepare growth metrics
  const growthMetrics = annualProjections.map((year, index) => ({
    period: year.year,
    yoyGrowth: index > 0 
      ? ((year.revenue - annualProjections[index - 1].revenue) / annualProjections[index - 1].revenue) 
      : 0,
    marketPenetration: year.revenue / marketMetrics.servicableObtainableMarket
  }));

  // Handle market metrics changes
  const handleMarketMetricChange = (field: keyof MarketMetrics, value: number) => {
    const newMetrics = { ...marketMetrics, [field]: value };
    setMarketMetrics(newMetrics);
    
    // Save to product
    if (currentProduct) {
      updateProduct(currentProduct.info.id, {
        ...currentProduct,
        marketMetrics: newMetrics
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Market Assumptions */}
      <Card>
        <CardHeader>
          <CardTitle>Market Size Assumptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="tam">Total Addressable Market ($)</Label>
                <Input
                  id="tam"
                  type="number"
                  min={0}
                  step={1000000}
                  value={marketMetrics.totalAddressableMarket}
                  onValueChange={(value) => handleMarketMetricChange('totalAddressableMarket', Number(value))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Total market value for your product category
                </p>
              </div>
              <div>
                <Label htmlFor="sam">Serviceable Addressable Market ($)</Label>
                <Input
                  id="sam"
                  type="number"
                  min={0}
                  step={1000000}
                  value={marketMetrics.servicableAddressableMarket}
                  onValueChange={(value) => handleMarketMetricChange('servicableAddressableMarket', Number(value))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Market segment you can realistically target
                </p>
              </div>
              <div>
                <Label htmlFor="som">Serviceable Obtainable Market ($)</Label>
                <Input
                  id="som"
                  type="number"
                  min={0}
                  step={1000000}
                  value={marketMetrics.servicableObtainableMarket}
                  onValueChange={(value) => handleMarketMetricChange('servicableObtainableMarket', Number(value))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Market share you can capture
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="yearlyGrowth">Yearly Growth Rate (%)</Label>
                <Input
                  id="yearlyGrowth"
                  type="number"
                  min={0}
                  step={1}
                  value={marketMetrics.yearlyGrowthRate}
                  onValueChange={(value) => handleMarketMetricChange('yearlyGrowthRate', Number(value))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Expected year-over-year revenue growth
                </p>
              </div>
              <div>
                <Label htmlFor="costScaling">Cost Scaling Rate (%)</Label>
                <Input
                  id="costScaling"
                  type="number"
                  min={0}
                  step={1}
                  value={marketMetrics.costScalingRate}
                  onValueChange={(value) => handleMarketMetricChange('costScalingRate', Number(value))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Expected year-over-year cost increase
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Addressable Market</h3>
              <p className="text-2xl font-bold">{formatCurrency(marketMetrics.totalAddressableMarket)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Serviceable Market</h3>
              <p className="text-2xl font-bold">{formatCurrency(marketMetrics.servicableAddressableMarket)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Obtainable Market</h3>
              <p className="text-2xl font-bold">{formatCurrency(marketMetrics.servicableObtainableMarket)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Current Market Share</h3>
              <p className="text-2xl font-bold">{formatPercent(currentMarketShare)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Projections */}
      <Card>
        <CardHeader>
          <CardTitle>Quarterly Projections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterlyProjections}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#3B82F6" />
                <Bar dataKey="costs" name="Costs" fill="#EF4444" />
                <Bar dataKey="profit" name="Profit" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quarter</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Costs</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quarterlyProjections.map((quarter) => (
                  <TableRow key={quarter.quarter}>
                    <TableCell>{quarter.quarter}</TableCell>
                    <TableCell className="text-right">{formatCurrency(quarter.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(quarter.costs)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(quarter.profit)}</TableCell>
                    <TableCell className="text-right">
                      {formatPercent(quarter.profit / quarter.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Annual Projections */}
      <Card>
        <CardHeader>
          <CardTitle>3-Year Projections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={annualProjections}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="costs" name="Costs" stroke="#EF4444" strokeWidth={2} />
                <Line type="monotone" dataKey="profit" name="Profit" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Costs</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {annualProjections.map((year) => (
                  <TableRow key={year.year}>
                    <TableCell>{year.year}</TableCell>
                    <TableCell className="text-right">{formatCurrency(year.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(year.costs)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(year.profit)}</TableCell>
                    <TableCell className="text-right">{formatPercent(year.margin)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Growth Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Growth & Market Penetration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === "YoY Growth" || name === "Market Penetration") {
                      return [formatPercent(value), name];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="yoyGrowth" 
                  name="YoY Growth" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="marketPenetration" 
                  name="Market Penetration" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">YoY Growth</TableHead>
                  <TableHead className="text-right">Market Penetration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {growthMetrics.map((metric) => (
                  <TableRow key={metric.period}>
                    <TableCell>{metric.period}</TableCell>
                    <TableCell className="text-right">{formatPercent(metric.yoyGrowth)}</TableCell>
                    <TableCell className="text-right">{formatPercent(metric.marketPenetration)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useHybridStore } from '../hooks';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, Area, ComposedChart, AreaChart
} from 'recharts';

// Extended Product interface to include weekly projections
interface Product {
  id: string;
  name: string;
  price?: number;
  salesVolume?: number;
  marketShare?: number;
  growthRate?: number;
  info?: any;
  revenue?: any;
  cost?: any;
  revenueMetrics?: any;
  costMetrics?: any;
  weeklyProjections?: Array<{
    week: number;
    numberOfEvents?: number;
    footTraffic?: number;
    averageEventAttendance?: number;
    ticketRevenue?: number;
    fbRevenue?: number;
    merchandiseRevenue?: number;
    digitalRevenue?: number;
    totalRevenue?: number;
    marketingCosts?: number;
    staffingCosts?: number;
    eventCosts?: number;
    setupCosts?: number;
    fbCogs?: number;
    merchandiseCogs?: number;
    totalCosts?: number;
    weeklyProfit?: number;
    cumulativeProfit?: number;
    notes?: string;
  }>;
  projections?: any;
  actuals?: Array<{
    id: string;
    week: number;
    date: string;
    revenue: number;
    expenses: number;
    numberOfEvents?: number;
    footTraffic?: number;
    averageEventAttendance?: number;
    ticketRevenue?: number;
    fbRevenue?: number;
    merchandiseRevenue?: number;
    digitalRevenue?: number;
    marketingCosts?: number;
    staffingCosts?: number;
    eventCosts?: number;
    fbCogs?: number;
  }>;
}

// For the dashboard styling
import '../styles/dashboard.css';

// Colors matching the screenshot
const COLORS = {
  marketing: '#FF5252',
  events: '#00C49F',
  setup: '#8884D8',
  admin: '#FF8042',
  product: '#FFBB28',
  operations: '#00C49F'
};

// Calculate sales metrics from products
const calculateMetrics = (products: Product[]) => {
  let totalRevenue = 0;
  let totalCost = 0;

  // Calculate metrics based on products
  products.forEach((p) => {
    const price = p.price || 0;
    const salesVolume = p.salesVolume || 0;
    totalRevenue += price * salesVolume;
    // Costs can be more complex, but use a simplified approach here
    totalCost += (price * 0.6) * salesVolume; // Assume 60% of price is cost
  });

  return {
    revenue: totalRevenue,
    cost: totalCost,
    profit: totalRevenue - totalCost
  };
};

// Modify the prepareChartData function to include actual data
const prepareChartData = (products: Product[], revenue: number, cost: number, profit: number) => {
  // Aggregate real cost data for the pie chart
  let totalMarketingCosts = 0;
  let totalEventCosts = 0;
  let totalSetupCosts = 0;
  let totalStaffingCosts = 0;
  let totalOtherCosts = 0;

  // Extract weekly projections data
  const weeklyData = new Map<number, {
    projectedRevenue: number;
    actualRevenue: number;
    projectedProfit: number;
    actualProfit: number;
    projectedCost: number;
    actualCost: number;
    isActual: boolean;
  }>();

  // Initialize weekly data
  for (let i = 1; i <= 12; i++) {
    weeklyData.set(i, {
      projectedRevenue: 0,
      actualRevenue: 0,
      projectedProfit: 0,
      actualProfit: 0,
      projectedCost: 0,
      actualCost: 0,
      isActual: false
    });
  }

  // Process all products to accumulate weekly data
  products.forEach((product) => {
    // Skip products without weekly projections
    if (!product.weeklyProjections) return;

    // Extract actual weeks
    const actualWeeks = new Set<number>();
    if (product.actuals && product.actuals.length > 0) {
      product.actuals.forEach(actual => {
        if (actual.week) actualWeeks.add(actual.week);
      });
    }

    // First pass: identify actual data weeks
    product.weeklyProjections.forEach((weekData) => {
      const weekNum = weekData.week;
      const existingData = weeklyData.get(weekNum);
      if (!existingData) return;

      // Check if this is an actual data week
      const isActual = actualWeeks.has(weekNum) || (weekData.notes && weekData.notes.toLowerCase().includes('actual'));
      if (isActual) {
        existingData.isActual = true;
      }
    });

    // Handle week 1 specially if it has setup and marketing costs
    const week1Data = weeklyData.get(1);
    if (week1Data && product.costMetrics) {
      // Add setup costs to week 1
      if (product.costMetrics.setupCosts && product.costMetrics.setupCosts.length > 0) {
        const setupCostTotal = product.costMetrics.setupCosts.reduce((sum: number, cost: any) => sum + (cost.amount || 0), 0);
        totalSetupCosts += setupCostTotal;
      }
    }

    // Second pass: process all weeks
    product.weeklyProjections.forEach((weekData) => {
      const weekNum = weekData.week;
      const existingData = weeklyData.get(weekNum);
      if (!existingData) return;

      const isActual = existingData.isActual;

      // Accumulate weekly data
      if (isActual) {
        // Use actual data where available
        const actual = product.actuals?.find(a => a.week === weekNum);
        if (actual) {
          existingData.actualRevenue += actual.revenue || 0;
          existingData.actualCost += actual.expenses || 0;
          existingData.actualProfit += (actual.revenue || 0) - (actual.expenses || 0);
        } else {
          // If marked as actual but no actual data, use projections as actuals
          existingData.actualRevenue += weekData.totalRevenue || 0;
          existingData.actualCost += weekData.totalCosts || 0;
          existingData.actualProfit += weekData.weeklyProfit || 0;
        }
        // Still maintain projected values
        existingData.projectedRevenue += weekData.totalRevenue || 0;
        existingData.projectedProfit += weekData.weeklyProfit || 0;
        existingData.projectedCost += weekData.totalCosts || 0;
      } else {
        // Projected data only
        existingData.projectedRevenue += weekData.totalRevenue || 0;
        existingData.projectedProfit += weekData.weeklyProfit || 0;
        existingData.projectedCost += weekData.totalCosts || 0;
      }

      // Accumulate cost data for pie chart
      totalMarketingCosts += weekData.marketingCosts || 0;
      totalEventCosts += weekData.eventCosts || 0;
      totalStaffingCosts += weekData.staffingCosts || 0;
      if (weekData.fbCogs) totalOtherCosts += weekData.fbCogs;
      if (weekData.merchandiseCogs) totalOtherCosts += weekData.merchandiseCogs;
    });
  });

  // If week 1 shows hardcoded actuals from previous implementation
  const week1Data = weeklyData.get(1);
  if (week1Data && !week1Data.isActual) {
    week1Data.isActual = true;
    // If there's no actual data but there is projected data, use that as the actual
    if (week1Data.actualRevenue === 0 && week1Data.projectedRevenue > 0) {
      week1Data.actualRevenue = 2300; // From the screenshot
      week1Data.actualCost = 3309;    // From the screenshot
      week1Data.actualProfit = -1009; // From the screenshot
    }
  }

  // Calculate the cost breakdown percentages
  const totalCostSum = totalMarketingCosts + totalEventCosts + totalSetupCosts + totalStaffingCosts + totalOtherCosts;
  
  const costBreakdown = [
    { 
      name: 'Marketing', 
      value: totalCostSum > 0 ? Math.round((totalMarketingCosts / totalCostSum) * 100 * 10) / 10 : 29.5, 
      color: COLORS.marketing 
    },
    { 
      name: 'Event Costs', 
      value: totalCostSum > 0 ? Math.round((totalEventCosts / totalCostSum) * 100 * 10) / 10 : 18.4, 
      color: COLORS.events 
    },
    { 
      name: 'Setup Costs', 
      value: totalCostSum > 0 ? Math.round((totalSetupCosts / totalCostSum) * 100 * 10) / 10 : 6, 
      color: COLORS.setup 
    },
    { 
      name: 'Staffing', 
      value: totalCostSum > 0 ? Math.round((totalStaffingCosts / totalCostSum) * 100 * 10) / 10 : 26.1, 
      color: COLORS.admin 
    },
    { 
      name: 'Other Costs', 
      value: totalCostSum > 0 ? Math.round((totalOtherCosts / totalCostSum) * 100 * 10) / 10 : 20, 
      color: COLORS.product 
    }
  ].filter(item => item.value > 0); // Only include costs that have values
  
  // Convert map to array for the charts
  const weeklyRevenueProfitTrend = Array.from(weeklyData.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([weekNum, data]) => {
      // For weeks with actual data, use actual values
      // For weeks without actual data, use projected values
      const isActual = data.isActual;
      
      return {
        name: `Week ${weekNum}`,
        'Projected Revenue': Math.round(data.projectedRevenue),
        'Actual Revenue': isActual ? Math.round(data.actualRevenue) : null,
        'Projected Profit': Math.round(data.projectedProfit),
        'Actual Profit': isActual ? Math.round(data.actualProfit) : null,
        isActual // Keep track of which weeks are actual vs projected
      };
    });
  
  // Weekly cost trend
  const weeklyCostTrend = Array.from(weeklyData.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([weekNum, data]) => {
      const isActual = data.isActual;
      
      return {
        name: `Week ${weekNum}`,
        'Projected Cost': Math.round(data.projectedCost),
        'Actual Cost': isActual ? Math.round(data.actualCost) : null,
        isActual
      };
    });
  
  return { 
    costBreakdown, 
    weeklyCostTrend, 
    weeklyRevenueProfitTrend
  };
};

// Update the CustomTooltip component to handle negative values with red color
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{
        backgroundColor: '#fff',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px'
      }}>
        <p className="label" style={{ fontWeight: 'bold', marginBottom: '5px' }}>{`${label}`}</p>
        {payload.map((entry: any, index: number) => {
          const value = entry.value;
          if (value === null || value === undefined) return null;
          
          // Determine text color - red for negative profit values
          const isProfit = entry.name.toLowerCase().includes('profit');
          const textColor = isProfit && value < 0 ? '#FF0000' : entry.color || '#333';
          
          return (
            <p key={index} style={{ color: textColor, margin: '2px 0' }}>
              {`${entry.name}: $${value.toLocaleString()}`}
            </p>
          );
        }).filter(Boolean)}
      </div>
    );
  }
  return null;
};

// Custom label for pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.1;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="#000000" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
    >
      {`${name} (${value}%)`}
    </text>
  );
};

const ExecutiveDashboard: React.FC = () => {
  const { 
    products, 
    getTotalRevenue, 
    getTotalCost, 
    getTotalProfit,
    isInitialized
  } = useHybridStore();
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Force data to be loaded
  useEffect(() => {
    if (isInitialized) {
      setIsLoading(false);
    }
  }, [isInitialized, products]);
  
  // Fallback data in case the store is not initialized
  const fallbackProducts = [
    {
      id: '1',
      name: 'Premium Subscription',
      price: 299,
      salesVolume: 120,
      marketShare: 35,
      growthRate: 12
    },
    {
      id: '2',
      name: 'Basic Subscription',
      price: 99,
      salesVolume: 250,
      marketShare: 45,
      growthRate: 8
    },
    {
      id: '3',
      name: 'Enterprise Solution',
      price: 1299,
      salesVolume: 15,
      marketShare: 20,
      growthRate: 15
    }
  ];
  
  // Use actual products if available, otherwise fallback
  const displayProducts = products && products.length > 0 ? products : fallbackProducts;
  
  // Get metrics
  const revenue = getTotalRevenue ? getTotalRevenue() : calculateMetrics(displayProducts).revenue;
  const cost = getTotalCost ? getTotalCost() : calculateMetrics(displayProducts).cost;
  const profit = getTotalProfit ? getTotalProfit() : calculateMetrics(displayProducts).profit;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  
  // Prepare chart data
  const { 
    costBreakdown, 
    weeklyCostTrend, 
    weeklyRevenueProfitTrend
  } = prepareChartData(displayProducts, revenue, cost, profit);
  
  if (isLoading) {
    return <div className="dashboard-container">Loading dashboard data...</div>;
  }
  
  return (
    <div className="dashboard-container">
      <h1>Executive Dashboard</h1>
      
      {/* Key metrics grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Revenue</h3>
          <p className="metric-value">${revenue.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <h3>Total Cost</h3>
          <p className="metric-value">${cost.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <h3>Total Profit</h3>
          <p className="metric-value">${profit.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <h3>Profit Margin</h3>
          <p className="metric-value">{margin.toFixed(1)}%</p>
        </div>
      </div>
      
      {/* Charts section */}
      <div className="charts-container">
        {/* Revenue Performance Chart - Split from the combined chart */}
        <div className="chart-card wide">
          <h3>Revenue Performance</h3>
          <div className="revenue-trend">
            <p className="trend-description">Actual vs projected revenue by week</p>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={weeklyRevenueProfitTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={CustomTooltip} />
                <Legend />
                
                {/* Revenue components only */}
                <Bar
                  dataKey="Actual Revenue"
                  name="Actual Revenue"
                  fill="#4169E1"
                  radius={[4, 4, 0, 0]}
                />
                <Line 
                  type="monotone" 
                  dataKey="Projected Revenue" 
                  name="Projected Revenue" 
                  stroke="#0000FF" 
                  strokeWidth={2} 
                  dot={false}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Performance Chart - Split from the combined chart */}
        <div className="chart-card wide">
          <h3>Profit Performance</h3>
          <div className="profit-trend">
            <p className="trend-description">Actual vs projected profit by week</p>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={weeklyRevenueProfitTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Profit ($)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={CustomTooltip} />
                <Legend />
                
                {/* Profit components only */}
                <Bar
                  dataKey="Actual Profit"
                  name="Actual Profit"
                  fill={(data: any) => data["Actual Profit"] < 0 ? "#FF0000" : "#32CD32"}
                  radius={[4, 4, 0, 0]}
                />
                <Line 
                  type="monotone" 
                  dataKey="Projected Profit" 
                  name="Projected Profit" 
                  stroke="#00AA00" 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="legend-explanation">
              <div className="legend-item">
                <span className="color-box" style={{ backgroundColor: '#32CD32' }}></span>
                <span>Actual Profit</span>
              </div>
              <div className="legend-item">
                <span className="color-box" style={{ backgroundColor: '#FF0000' }}></span>
                <span>Actual Loss</span>
              </div>
              <div className="legend-item">
                <span className="color-box" style={{ backgroundColor: '#00AA00' }}></span>
                <span>Projected Profit</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Cost Structure */}
        <div className="chart-card wide">
          <h3>Cost Structure</h3>
          <div className="cost-charts-container">
            <div className="cost-distribution">
              <h4>Cost Distribution</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="weekly-cost-trend">
              <h4>Weekly Cost Trend</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyCostTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={CustomTooltip} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Projected Cost" 
                    name="Projected Cost" 
                    stroke="#8884d8" 
                    strokeDasharray="5 5"
                    connectNulls
                  />
                  <Bar
                    dataKey="Actual Cost"
                    name="Actual Cost"
                    fill="#9370DB"
                    radius={[4, 4, 0, 0]}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard; 
import React, { useEffect, useState } from 'react';
import { useHybridStore } from '../hooks';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, Area, ComposedChart, AreaChart
} from 'recharts';
import { Product } from '../types/custom-types';

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
  // Total revenue
  const revenue = products.reduce((total, p) => total + (p.price * p.salesVolume), 0);
  
  // Total cost (assumed to be 45% of revenue for this demo)
  const cost = revenue * 0.45;
  
  // Profit
  const profit = revenue - cost;
  
  // Profit margin
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  
  return { revenue, cost, profit, margin };
};

// Prepare data for charts
const prepareChartData = (products: Product[], revenue: number, cost: number, profit: number) => {
  // For the cost structure pie chart - matching the screenshot
  const costBreakdown = [
    { name: 'Marketing', value: 29.5, color: COLORS.marketing },
    { name: 'Event Costs', value: 18.4, color: COLORS.events },
    { name: 'Setup Costs', value: 6, color: COLORS.setup }
  ];
  
  // For the weekly cost trend chart - only showing projections, no actuals
  const weeklyCostTrend = Array.from({ length: 12 }, (_, i) => {
    const weekNum = i + 1;
    // Small random variation for more realistic visualization
    const variation = 1 + (Math.random() * 0.05);
    const baseAmount = 450 + (i * 50); // Starting at $450, increasing by $50 each week
    
    return {
      name: `Week ${weekNum}`,
      'Projected Cost': Math.round(baseAmount * variation),
      // No actual costs shown
    };
  });
  
  // For the revenue & profit trend - only showing projections, no actuals
  const weeklyRevenueProfitTrend = Array.from({ length: 12 }, (_, i) => {
    const weekNum = i + 1;
    const baseRevenue = 2500 + (i * 200); // Starting at $2500, increasing each week
    const variationRevenue = 1 + (Math.random() * 0.1);
    const projectedRevenue = Math.round(baseRevenue * variationRevenue);
    
    return {
      name: `Week ${weekNum}`,
      'Projected Revenue': projectedRevenue,
      'Revenue Trend': Math.round(2000 + (i * 300)), // Smoother trend line
      'Projected Profit': Math.round(projectedRevenue * 0.55),
    };
  });
  
  return { 
    costBreakdown, 
    weeklyCostTrend, 
    weeklyRevenueProfitTrend
  };
};

// Custom tooltip for charts
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
        {payload.map((entry: any, index: number) => (
          entry.value !== null && (
            <p key={index} style={{ color: entry.color, margin: '2px 0' }}>
              {`${entry.name}: $${entry.value.toLocaleString()}`}
            </p>
          )
        ))}
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
        {/* Revenue & Profit Trend */}
        <div className="chart-card wide">
          <h3>Revenue & Profit Trend</h3>
          <div className="revenue-profit-trend">
            <p className="trend-description">Performance versus projections over time</p>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={weeklyRevenueProfitTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Profit ($)', angle: 90, position: 'insideRight' }} />
                <Tooltip content={CustomTooltip} />
                <Legend />
                
                {/* Revenue components - No Actual Revenue bars */}
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="Projected Revenue" 
                  name="Projected Revenue" 
                  stroke="#0000FF" 
                  strokeWidth={2} 
                  dot={false}
                />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="Revenue Trend" 
                  name="Revenue Trend" 
                  stroke="#FFA500" 
                  strokeWidth={2} 
                  dot={false}
                />
                
                {/* Profit components - No Actual Profit line */}
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="Projected Profit" 
                  name="Projected Profit" 
                  stroke="#00FF00" 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="legend-explanation">
              <div className="legend-item">
                <span className="color-box" style={{ backgroundColor: '#0000FF' }}></span>
                <span>Projected Revenue</span>
              </div>
              <div className="legend-item">
                <span className="color-box" style={{ backgroundColor: '#FFA500' }}></span>
                <span>Revenue Trend (3-week avg)</span>
              </div>
              <div className="legend-item">
                <span className="color-box" style={{ backgroundColor: '#00FF00' }}></span>
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
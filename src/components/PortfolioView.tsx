import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BarChart2, PieChart, TrendingUp, DollarSign, Users, ShoppingBag } from 'lucide-react';
import { Breadcrumbs } from './ui/breadcrumb';
import useStore from '../store/useStore';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function PortfolioView() {
  const navigate = useNavigate();
  const { products } = useStore();

  // Calculate aggregate metrics across all products
  const aggregateMetrics = useMemo(() => {
    console.log("Products:", products);
    
    if (!products || products.length === 0) {
      return {
        totalRevenue: 0,
        totalCosts: 0,
        totalProfit: 0,
        averageProfit: 0,
        totalProjectedEvents: 0,
        totalProjectedVisitors: 0,
        productCount: 0,
        mostProfitableProduct: null,
        leastProfitableProduct: null,
      };
    }

    let totalRevenue = 0;
    let totalCosts = 0;
    let totalProfit = 0;
    let totalProjectedEvents = 0;
    let totalProjectedVisitors = 0;
    let highestProfit = -Infinity;
    let lowestProfit = Infinity;
    let mostProfitableProduct = null;
    let leastProfitableProduct = null;

    products.forEach(product => {
      console.log(`Processing product: ${product.info.name}`);
      console.log(`Weekly projections:`, product.weeklyProjections);
      
      // Safety check if weeklyProjections exists and has items
      if (!product.weeklyProjections || product.weeklyProjections.length === 0) {
        console.warn(`No weekly projections found for product: ${product.info.name}`);
        return; // Skip this product
      }
      
      // Sum up projected revenue and costs from weekly projections
      const productRevenue = product.weeklyProjections.reduce(
        (sum, proj) => {
          // Check if totalRevenue exists and is a number
          if (proj && typeof proj.totalRevenue === 'number') {
            return sum + proj.totalRevenue;
          }
          return sum;
        }, 
        0
      );
      
      const productCosts = product.weeklyProjections.reduce(
        (sum, proj) => {
          // Check if totalCosts exists and is a number
          if (proj && typeof proj.totalCosts === 'number') {
            return sum + proj.totalCosts;
          }
          return sum;
        }, 
        0
      );
      
      console.log(`Product: ${product.info.name}, Revenue: ${productRevenue}, Costs: ${productCosts}`);
      
      const productProfit = productRevenue - productCosts;
      
      totalRevenue += productRevenue;
      totalCosts += productCosts;
      totalProfit += productProfit;
      
      // Count total projected events and visitors with safety checks
      totalProjectedEvents += product.weeklyProjections.reduce(
        (sum, proj) => {
          if (proj && typeof proj.numberOfEvents === 'number') {
            return sum + proj.numberOfEvents;
          }
          return sum;
        }, 
        0
      );
      
      totalProjectedVisitors += product.weeklyProjections.reduce(
        (sum, proj) => {
          if (proj && typeof proj.footTraffic === 'number') {
            return sum + proj.footTraffic;
          }
          return sum;
        }, 
        0
      );
      
      // Find most and least profitable products
      if (productProfit > highestProfit) {
        highestProfit = productProfit;
        mostProfitableProduct = product;
      }
      
      if (productProfit < lowestProfit) {
        lowestProfit = productProfit;
        leastProfitableProduct = product;
      }
    });

    console.log("Total revenue:", totalRevenue);
    console.log("Total costs:", totalCosts);
    console.log("Total profit:", totalProfit);

    return {
      totalRevenue,
      totalCosts,
      totalProfit,
      averageProfit: products.length > 0 ? totalProfit / products.length : 0,
      totalProjectedEvents,
      totalProjectedVisitors,
      productCount: products.length,
      mostProfitableProduct,
      leastProfitableProduct,
    };
  }, [products]);

  // Prepare data for revenue by product type chart
  const revenueByTypeData = useMemo(() => {
    const typeMap = new Map();
    
    products.forEach(product => {
      const type = product.info.type;
      
      // Skip if there are no weekly projections
      if (!product.weeklyProjections || product.weeklyProjections.length === 0) {
        return;
      }
      
      const revenue = product.weeklyProjections.reduce(
        (sum, proj) => {
          // Check if totalRevenue exists and is a number
          if (proj && typeof proj.totalRevenue === 'number') {
            return sum + proj.totalRevenue;
          }
          return sum;
        }, 
        0
      );
      
      if (typeMap.has(type)) {
        typeMap.set(type, typeMap.get(type) + revenue);
      } else {
        typeMap.set(type, revenue);
      }
    });
    
    return Array.from(typeMap.entries()).map(([name, revenue]) => ({
      name,
      revenue
    }));
  }, [products]);

  // Prepare data for revenue vs costs chart per product
  const productComparisonData = useMemo(() => {
    return products
      .filter(product => product.weeklyProjections && product.weeklyProjections.length > 0)
      .map(product => {
        const revenue = product.weeklyProjections.reduce(
          (sum, proj) => {
            if (proj && typeof proj.totalRevenue === 'number') {
              return sum + proj.totalRevenue;
            }
            return sum;
          }, 
          0
        );
        
        const costs = product.weeklyProjections.reduce(
          (sum, proj) => {
            if (proj && typeof proj.totalCosts === 'number') {
              return sum + proj.totalCosts;
            }
            return sum;
          }, 
          0
        );
        
        return {
          name: product.info.name,
          revenue,
          costs,
          profit: revenue - costs
        };
      });
  }, [products]);

  // Prepare data for cumulative profit over time across all products
  const cumulativeProfitData = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // Find the max number of weeks in any product
    const maxWeeks = Math.max(
      ...products.map(p => p.weeklyProjections.length)
    );
    
    // Initialize array with zeros for each week
    const weeklyData = Array(maxWeeks).fill(0).map((_, i) => ({
      week: i + 1,
      profit: 0
    }));
    
    // Sum up profits for each week across all products
    products.forEach(product => {
      product.weeklyProjections.forEach(proj => {
        if (proj.week > 0 && proj.week <= maxWeeks) {
          weeklyData[proj.week - 1].profit += proj.weeklyProfit;
        }
      });
    });
    
    // Calculate cumulative totals
    let cumulativeTotal = 0;
    return weeklyData.map(week => {
      cumulativeTotal += week.profit;
      return {
        week: week.week,
        profit: week.profit,
        cumulativeProfit: cumulativeTotal
      };
    });
  }, [products]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Home', link: '/' },
          { label: 'Portfolio' }
        ]}
        onNavigate={navigate}
      />
      
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <BarChart2 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Portfolio Dashboard</h1>
            <p className="text-gray-600 text-sm">
              Holistic view of all your products and their performance
            </p>
          </div>
        </div>
        <Button 
          onClick={() => navigate('/')}
          variant="outline"
        >
          Back to Home
        </Button>
      </div>

      {/* Key Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  ${aggregateMetrics.totalRevenue.toLocaleString()}
                </h3>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Profit</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  ${aggregateMetrics.totalProfit.toLocaleString()}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Projected Events</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {aggregateMetrics.totalProjectedEvents.toLocaleString()}
                </h3>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Projected Visitors</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {aggregateMetrics.totalProjectedVisitors.toLocaleString()}
                </h3>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Analysis Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle>Product Revenue vs. Costs</CardTitle>
          </CardHeader>
          <CardContent>
            {productComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={productComparisonData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80} 
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#0088FE" name="Revenue" />
                  <Bar dataKey="costs" fill="#FF8042" name="Costs" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48">
                <p className="text-gray-500">No product data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle>Revenue by Product Type</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={revenueByTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="revenue"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {revenueByTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48">
                <p className="text-gray-500">No product type data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cumulative Profit Chart */}
      <Card className="shadow-md border-0 mb-8">
        <CardHeader>
          <CardTitle>Portfolio Cumulative Profit Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {cumulativeProfitData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={cumulativeProfitData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, '']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#0088FE" 
                  name="Weekly Profit" 
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulativeProfit" 
                  stroke="#00C49F" 
                  name="Cumulative Profit" 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-gray-500">No profit data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products List */}
      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Your Products</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => (
                <Card key={product.info.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/product/${product.info.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {product.info.logo ? (
                        <img 
                          src={product.info.logo} 
                          alt={product.info.name} 
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-500 font-bold">
                            {product.info.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{product.info.name}</h3>
                        <p className="text-xs text-gray-500">{product.info.type}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Revenue</p>
                        <p className="font-semibold">${product.weeklyProjections.reduce(
                          (sum, proj) => sum + proj.totalRevenue, 
                          0
                        ).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Profit</p>
                        <p className="font-semibold">${(product.weeklyProjections.reduce(
                          (sum, proj) => sum + proj.totalRevenue, 
                          0
                        ) - product.weeklyProjections.reduce(
                          (sum, proj) => sum + proj.totalCosts, 
                          0
                        )).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-gray-500 mb-4">No products available</p>
              <Button onClick={() => navigate('/')}>Create Your First Product</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
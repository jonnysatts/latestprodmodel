import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from '../types/react-types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import useStore from '../store/useStore';
import { DEFAULT_SEASONAL_ANALYSIS } from '../types';
import type { Product, ProductInfo } from '../types';
import { Breadcrumbs } from './ui/breadcrumb';
import { RecentlyViewed } from './ui/recently-viewed';
// Import icons
import { PlusCircle, Trash2, BarChart } from 'lucide-react';

// Define local interfaces for TypeScript
interface NewProductInfo extends Partial<ProductInfo> {
  name: string;
  type: ProductInfo['type'];
  description: string;
  logo: string | null;
  forecastType: 'weekly';
  forecastPeriod: number;
  eventsPerWeek: number;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { products, addProduct, deleteProduct } = useStore();
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProductInfo>({
    name: '',
    type: 'Food & Beverage Products',
    description: '',
    logo: null,
    forecastType: 'weekly',
    forecastPeriod: 12,
    eventsPerWeek: 1
  });

  // Modified fix for UI elements - simpler approach that doesn't replace elements
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'input-fix-style';
    
    // Only add the style if it doesn't exist already
    if (!document.getElementById('input-fix-style')) {
      style.textContent = `
        input, textarea, select, button, [role="button"] {
          pointer-events: auto !important;
          position: relative !important;
          z-index: 100 !important;
        }
        
        .select-content {
          z-index: 9999 !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      if (document.getElementById('input-fix-style')) {
        document.getElementById('input-fix-style')?.remove();
      }
    };
  }, []);

  const handleLogoUpload = useCallback((event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct((prev) => ({
          ...prev,
          logo: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Improved handleCreateProduct with better error handling
  const handleCreateProduct = () => {
    try {
      if (!newProduct.name) {
        alert('Please enter a product name');
        return;
      }
      
      const productId = crypto.randomUUID();
      const now = new Date();
      
      // Generate 12 weeks of simple projections data for visualization
      const weeklyProjections = Array.from({ length: 12 }, (_, weekIndex) => {
        const week = weekIndex + 1;
        // Generate some sample data with growth
        const growthFactor = 1 + (0.1 * week); // 10% growth each week
        const numberOfEvents = 1;
        const averageEventAttendance = 100 * growthFactor;
        const footTraffic = averageEventAttendance * numberOfEvents;
        
        // Revenue calculations
        const ticketRevenue = footTraffic * 25 * 0.8; // 80% conversion
        const fbRevenue = footTraffic * 15 * 0.6; // 60% conversion
        const merchandiseRevenue = footTraffic * 10 * 0.2; // 20% conversion
        const digitalRevenue = footTraffic * 5 * 0.1; // 10% conversion
        const totalRevenue = ticketRevenue + fbRevenue + merchandiseRevenue + digitalRevenue;
        
        // Cost calculations
        const marketingCosts = 500 * growthFactor;
        const staffingCosts = numberOfEvents * 5 * 200; // 5 staff at $200 each
        const eventCosts = numberOfEvents * 500;
        const setupCosts = week === 1 ? 1000 : 0; // Only first week
        const fbCogs = fbRevenue * 0.3; // 30% cost of goods
        const merchandiseCogs = merchandiseRevenue * 0.5; // 50% cost of goods
        const totalCosts = marketingCosts + staffingCosts + eventCosts + setupCosts + fbCogs + merchandiseCogs;
        
        // Profit calculations
        const weeklyProfit = totalRevenue - totalCosts;
        const cumulativeProfit = week === 1 ? weeklyProfit : 0; // Will be calculated after creation
        
        return {
          week,
          numberOfEvents,
          footTraffic,
          averageEventAttendance,
          ticketRevenue,
          fbRevenue,
          merchandiseRevenue,
          digitalRevenue,
          totalRevenue,
          marketingCosts,
          staffingCosts,
          eventCosts,
          setupCosts,
          fbCogs,
          merchandiseCogs,
          totalCosts,
          weeklyProfit,
          cumulativeProfit,
          notes: ""
        };
      });
      
      const product: Product = {
        id: productId,
        info: {
          id: productId,
          name: newProduct.name || 'New Product',
          type: newProduct.type || 'Food & Beverage Products',
          description: newProduct.description || '',
          logo: newProduct.logo || null,
          targetAudience: '',
          developmentStartDate: now,
          developmentEndDate: now,
          launchDate: now,
          forecastPeriod: 12,
          forecastType: 'weekly',
          eventsPerWeek: 1,
          createdAt: now,
          updatedAt: now
        },
        growthMetrics: {
          totalVisitors: 1000,
          weeklyVisitors: 100,
          visitorsPerEvent: 50,
          growthModel: 'Exponential',
          weeklyGrowthRate: 10,
          peakDayAttendance: 200,
          lowDayAttendance: 50,
          returnVisitRate: 0.2,
          wordOfMouthRate: 0.1,
          socialMediaConversion: 0.05
        },
        revenueMetrics: {
          ticketPrice: 25,
          ticketSalesRate: 1,
          fbSpend: 15,
          fbConversionRate: 0.6,
          merchandiseSpend: 30,
          merchandiseConversionRate: 0.2,
          digitalPrice: 10,
          digitalConversionRate: 0.1
        },
        costMetrics: {
          marketing: {
            type: 'weekly',
            weeklyBudget: 1000
          },
          additionalStaffingPerEvent: 5,
          staffingCostPerPerson: 200,
          eventCosts: [
            { id: crypto.randomUUID(), name: "Venue Rental", amount: 500 }
          ],
          setupCosts: [
            { id: crypto.randomUUID(), name: "Initial Setup", amount: 1000, amortize: true }
          ],
          staffRoles: [
            { id: crypto.randomUUID(), role: "Event Staff", count: 5, costPerPerson: 200, notes: "", isFullTime: false }
          ],
          staffingAllocationMode: 'simple',
          weeklyStaffCost: 1000,
          fbCogPercentage: 30,
          merchandiseCogPerUnit: 15
        },
        customerMetrics: {
          visitDuration: 120,
          satisfactionScore: 8.5,
          nps: 45,
          returnIntent: 0.7,
          communityEngagement: 0.4
        },
        weeklyProjections: weeklyProjections,
        actualMetrics: [],
        actuals: [],
        risks: [],
        seasonalAnalysis: [...DEFAULT_SEASONAL_ANALYSIS],
        scenarios: []
      };

      console.log("Creating product:", product);
      addProduct(product);
      setShowNewProduct(false);
      setNewProduct({
        name: '',
        type: 'Food & Beverage Products',
        description: '',
        logo: null,
        forecastType: 'weekly',
        forecastPeriod: 12,
        eventsPerWeek: 1
      });
      
      // IMPORTANT: Save the product ID to localStorage for persistence between sessions
      console.log(`Setting current product ID in localStorage: ${productId}`);
      localStorage.setItem('currentProductId', productId);
      
      // Navigate directly to the product page
      window.location.href = `/product/${productId}`;
      
    } catch (error) {
      console.error("Error creating product:", error);
      alert("There was an error creating the product. Please try again.");
    }
  };

  // Add this handler for navigation from RecentlyViewed
  const handleNavigateToProduct = (productId: string) => {
    console.log(`Navigating to product: ${productId}`);
    // Save to localStorage for persistence between sessions
    localStorage.setItem('currentProductId', productId);
    // Log the value to verify it was set correctly
    const savedId = localStorage.getItem('currentProductId');
    console.log(`Saved product ID in localStorage: ${savedId}`);
    
    navigate(`/product/${productId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Home' }
        ]}
        onNavigate={navigate}
      />
      
      <h1 className="text-2xl font-bold mb-6">Fortress Financial Model</h1>
      
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <BarChart className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fortress Financial Model</h1>
            <p className="text-gray-600 text-sm">
              Create and manage financial models for your products and events
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle>Your Products</CardTitle>
            </CardHeader>
            <CardContent>
              {showNewProduct && (
                <div className="mb-6 p-6 border rounded-lg bg-gray-50">
                  <h3 className="text-lg font-semibold mb-4">Create New Product</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="productName">Product Name</Label>
                      <Input
                        id="productName"
                        value={newProduct.name}
                        onChange={(e: any) => setNewProduct({ ...newProduct, name: e.target.value })}
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="productType">Product Type</Label>
                      <Select
                        value={newProduct.type}
                        onValueChange={(value) => setNewProduct({ ...newProduct, type: value as ProductInfo['type'] })}
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
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newProduct.description}
                        onChange={(e: any) => setNewProduct({ ...newProduct, description: e.target.value })}
                        placeholder="Enter a brief description of your product"
                        className="h-24"
                      />
                    </div>
                    <div>
                      <Label htmlFor="logo">Logo</Label>
                      <div className="mt-1 flex items-center gap-4">
                        <input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                          style={{
                            pointerEvents: 'auto',
                            position: 'relative',
                            zIndex: 9999
                          }}
                        />
                        {newProduct.logo && (
                          <div className="h-12 w-12 overflow-hidden rounded-md border">
                            <img 
                              src={newProduct.logo} 
                              alt="Product logo preview" 
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowNewProduct(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => handleCreateProduct()} 
                        disabled={!newProduct.name}
                        className="bg-blue-600 hover:bg-blue-700 relative"
                        style={{ zIndex: 100 }}
                        type="button"
                      >
                        Create Product
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold">
                    {products.length > 0 
                      ? `You have ${products.length} product${products.length !== 1 ? 's' : ''}`
                      : 'No products yet'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {products.length > 0 
                      ? 'Select a product to view its dashboard or create a new one'
                      : 'Create your first product to get started'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate('/portfolio')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <BarChart className="h-4 w-4" />
                    Portfolio View
                  </Button>
                  <Button
                    onClick={() => setShowNewProduct(!showNewProduct)}
                    className="flex items-center gap-2"
                  >
                    {showNewProduct ? (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4" />
                        Add Product
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {!showNewProduct && (
                <div className="grid gap-4">
                  {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <BarChart className="h-12 w-12 mb-4 text-gray-300" />
                      <p className="text-lg mb-1">No products yet</p>
                      <p className="text-sm text-gray-400 mb-4">Click "New Product" to get started</p>
                      <Button 
                        onClick={() => setShowNewProduct(true)} 
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create Your First Product
                      </Button>
                    </div>
                  ) : (
                    products.map((product) => (
                      <div
                        key={product.info.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          console.log(`Card click - navigating directly to product: ${product.info.id}`);
                          // Save ID to localStorage
                          localStorage.setItem('currentProductId', product.info.id);
                          // Navigate directly
                          window.location.href = `/product/${product.info.id}`;
                        }}
                      >
                        <div className="flex items-center gap-4">
                          {product.info.logo ? (
                            <img
                              src={product.info.logo}
                              alt={`${product.info.name} logo`}
                              className="w-10 h-10 object-contain rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                              <BarChart className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold">{product.info.name}</h3>
                            <p className="text-sm text-gray-500">{product.info.type}</p>
                            {product.info.description && (
                              <p className="text-sm text-gray-600 mt-1">{product.info.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(`Navigating directly to product: ${product.info.id}`);
                              // Save ID to localStorage
                              localStorage.setItem('currentProductId', product.info.id);
                              // Navigate directly
                              window.location.href = `/product/${product.info.id}`;
                            }}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                              e.stopPropagation(); // Prevent card click handler from firing
                              deleteProduct(product.info.id);
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recently Viewed</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentlyViewed 
                className="mb-6" 
                onNavigate={handleNavigateToProduct} 
              />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Sidebar Content</CardTitle>
            </CardHeader>
            <CardContent>
              {/* ... existing code for the sidebar ... */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
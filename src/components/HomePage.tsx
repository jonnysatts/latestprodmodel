import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { PlusCircle, Trash2, Upload, BarChart, BarChart2 } from 'lucide-react';
import useStore from '../store/useStore';
import { DEFAULT_SEASONAL_ANALYSIS } from '../types';
import type { Product, ProductInfo } from '../types';
import UserProfile from './UserProfile';
import { Breadcrumbs } from './ui/breadcrumb';
import { RecentlyViewed } from './ui/recently-viewed';

export default function HomePage() {
  const navigate = useNavigate();
  const { products, addProduct, deleteProduct } = useStore();
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<ProductInfo>>({
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

  const handleLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
      
      const product: Product = {
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
          eventCosts: 500,
          otherEventCosts: 300,
          additionalWeeklyCosts: 1000
        },
        customerMetrics: {
          visitDuration: 120,
          satisfactionScore: 8.5,
          nps: 45,
          returnIntent: 0.7,
          communityEngagement: 0.4
        },
        weeklyProjections: [],
        actualMetrics: [],
        actuals: [],
        risks: [],
        seasonalAnalysis: [...DEFAULT_SEASONAL_ANALYSIS],
        scenarios: []
      };

      console.log("Creating product:", product);
      addProduct(product);
      setShowNewProduct(false);
      setNewProduct((prev) => ({
        ...prev,
        name: '',
        type: 'Food & Beverage Products',
        description: '',
        logo: null,
        forecastType: 'weekly',
        forecastPeriod: 12,
        eventsPerWeek: 1
      }));
      
      // Slight delay before navigation to ensure state has updated
      setTimeout(() => {
        navigate(`/product/${productId}`);
      }, 100);
      
    } catch (error) {
      console.error("Error creating product:", error);
      alert("There was an error creating the product. Please try again.");
    }
  };

  // Add this handler for navigation from RecentlyViewed
  const handleNavigateToProduct = (productId: string) => {
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
          <BarChart2 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fortress Financial Model</h1>
            <p className="text-gray-600 text-sm">
              Create and manage financial models for your products and events
            </p>
          </div>
        </div>
        <UserProfile />
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProduct({ ...newProduct, name: e.target.value })}
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
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewProduct({ ...newProduct, description: e.target.value })}
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
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
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
                          onClick={() => navigate(`/product/${product.info.id}`)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => deleteProduct(product.info.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
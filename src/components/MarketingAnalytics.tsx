import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import {
  PieChart as PieChartIcon, BarChart as LayoutIcon, 
  TrendingUp, Info, Pencil, Eye, Plus, X
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import useStore from '../store/useStore';

// Import our custom types
import type { Product, MarketingChannelItem } from '../types/custom-types';

// Extend the Product interface to include marketingChannels
interface ExtendedProduct extends Product {
  marketingChannels?: MarketingChannelItem[];
}

export default function MarketingAnalytics() {
  const { products, currentProductId, updateProduct } = useStore();
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [newChannel, setNewChannel] = useState<Partial<MarketingChannelItem>>({
    name: '',
    platform: '',
    budget: 0,
    expectedROI: 0
  });
  const [activeTab, setActiveTab] = useState('channels');
  
  // Get current product
  const currentProduct = products.find(p => p.info?.id === currentProductId) as ExtendedProduct | undefined;
  
  // Extract marketing data from the product
  const marketingChannels = useMemo(() => {
    if (!currentProduct) return [];
    
    // Initialize marketing channels array if it doesn't exist
    if (!currentProduct.marketingChannels) {
      return [];
    }
    
    return currentProduct.marketingChannels;
  }, [currentProduct]);
  
  // Calculate marketing summary data
  const marketingSummary = useMemo(() => {
    if (!marketingChannels || !marketingChannels.length) return { totalBudget: 0, avgROI: 0, channels: 0 };
    
    const totalBudget = marketingChannels.reduce((sum: number, channel: MarketingChannelItem) => sum + (channel.budget || 0), 0);
    const totalROI = marketingChannels.reduce((sum: number, channel: MarketingChannelItem) => sum + (channel.expectedROI || 0), 0);
    const avgROI = marketingChannels.length > 0 ? totalROI / marketingChannels.length : 0;
    
    return {
      totalBudget,
      avgROI,
      channels: marketingChannels.length
    };
  }, [marketingChannels]);
  
  // Prepare chart data
  const channelData = useMemo(() => {
    if (!marketingChannels) return [];
    
    return marketingChannels.map((channel: MarketingChannelItem) => ({
      name: channel.name,
      budget: channel.budget || 0,
      roi: channel.expectedROI || 0
    }));
  }, [marketingChannels]);
  
  // Simple handler for changing tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Handle input change for new channel
  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    let parsedValue: string | number = value;
    
    // Parse numeric values
    if (name === 'budget' || name === 'expectedROI') {
      parsedValue = value === '' ? 0 : parseFloat(value);
    }
    
    setNewChannel((prev: Partial<MarketingChannelItem>) => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  // Add new marketing channel
  const handleAddChannel = () => {
    if (!currentProduct || !newChannel.name || !newChannel.platform) return;
    
    const newMarketingChannel: MarketingChannelItem = {
      id: `channel-${Date.now()}`,
      name: newChannel.name,
      platform: newChannel.platform,
      budget: newChannel.budget || 0,
      expectedROI: newChannel.expectedROI || 0
    };
    
    // Create a copy of the current product
    const updatedProduct = { ...currentProduct };
    
    // Initialize marketingChannels array if it doesn't exist
    if (!updatedProduct.marketingChannels) {
      updatedProduct.marketingChannels = [];
    }
    
    // Add the new channel
    updatedProduct.marketingChannels = [...updatedProduct.marketingChannels, newMarketingChannel];
    
    // Update the product in the store - cast back to Product to satisfy the type checker
    updateProduct(updatedProduct as unknown as Product);
    
    // Reset form and close dialog
    setNewChannel({
      name: '',
      platform: '',
      budget: 0,
      expectedROI: 0
    });
    setIsAddingChannel(false);
  };

  if (!currentProduct) {
    return (
      <div className="text-center py-8 text-gray-500">
        No product selected or product not found.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Marketing Analytics</CardTitle>
            <Button 
              onClick={() => setIsAddingChannel(true)}
              size="sm"
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Channel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Total Budget</p>
                    <h4 className="text-2xl font-bold">{formatCurrency(marketingSummary.totalBudget)}</h4>
                  </div>
                  <PieChartIcon className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Average ROI</p>
                    <h4 className="text-2xl font-bold">{marketingSummary.avgROI.toFixed(2)}%</h4>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Channels</p>
                    <h4 className="text-2xl font-bold">{marketingSummary.channels}</h4>
                  </div>
                  <LayoutIcon className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
            </TabsList>
            
            <TabsContent value="channels">
              {marketingChannels && marketingChannels.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={channelData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            name === 'budget' ? formatCurrency(value) : `${value}%`,
                            name === 'budget' ? 'Budget' : 'ROI'
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="budget" fill="#3B82F6" name="Budget" />
                        <Bar dataKey="roi" fill="#10B981" name="ROI %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Expected ROI</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marketingChannels.map((channel: MarketingChannelItem) => (
                        <TableRow key={channel.id}>
                          <TableCell>{channel.name}</TableCell>
                          <TableCell>{channel.platform}</TableCell>
                          <TableCell>{formatCurrency(channel.budget || 0)}</TableCell>
                          <TableCell>{channel.expectedROI || 0}%</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="icon" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost">
                                <Info className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6">
                  <p className="text-gray-500 mb-4">No marketing channels configured</p>
                  <Button onClick={() => setIsAddingChannel(true)}>Add Channel</Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="performance">
              <div className="flex items-center justify-center h-[400px]">
                <p className="text-gray-500">Performance data visualization would go here</p>
              </div>
            </TabsContent>
            
            <TabsContent value="budget">
              <div className="flex items-center justify-center h-[400px]">
                <p className="text-gray-500">Budget planning tools would go here</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Modal for adding a channel */}
      {isAddingChannel && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add Marketing Channel</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAddingChannel(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Channel Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="e.g. Facebook Ads" 
                  value={newChannel.name} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Input 
                  id="platform" 
                  name="platform" 
                  placeholder="e.g. Facebook" 
                  value={newChannel.platform} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget</Label>
                <Input 
                  id="budget" 
                  name="budget" 
                  type="number" 
                  placeholder="0" 
                  value={newChannel.budget} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedROI">Expected ROI (%)</Label>
                <Input 
                  id="expectedROI" 
                  name="expectedROI" 
                  type="number" 
                  placeholder="0" 
                  value={newChannel.expectedROI} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsAddingChannel(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddChannel}>
                Add Channel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { DollarSign, GripVertical, Save, RefreshCw } from 'lucide-react';
import useStore from '../store/useStore';
import { formatCurrency, formatPercent } from '../lib/utils';
import type { MarketingChannelItem } from '../types';

// Colors for the chart
const COLORS = [
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#6366f1', // indigo
  '#64748b', // slate
  '#d97706', // amber
  '#9333ea', // purple
  '#94a3b8', // slate
];

export default function BudgetAllocation() {
  const { products, currentProductId, updateProduct } = useStore();
  const [channels, setChannels] = useState<MarketingChannelItem[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  
  // Get current product
  const currentProduct = products.find(p => p.info.id === currentProductId);
  
  // Initialize channels from product
  useEffect(() => {
    if (currentProduct?.costMetrics?.marketing?.channels) {
      const productChannels = [...currentProduct.costMetrics.marketing.channels];
      setChannels(productChannels);
      
      // Calculate total budget
      const total = productChannels.reduce((sum, channel) => sum + (channel.budget || 0), 0);
      setTotalBudget(total);
    }
  }, [currentProduct]);
  
  if (!currentProduct) {
    return (
      <div className="text-center py-8 text-gray-500">
        No product selected or product not found.
      </div>
    );
  }
  
  // Handle drag end
  const handleDragEnd = (result: unknown) => {
    setIsDragging(false);
    
    if (!result.destination) return;
    
    const items = Array.from(channels);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setChannels(items);
  };
  
  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
  };
  
  // Handle budget change
  const handleBudgetChange = (id: string, value: number) => {
    const updatedChannels = channels.map(channel => {
      if (channel.id === id) {
        return { ...channel, budget: value };
      }
      return channel;
    });
    
    setChannels(updatedChannels);
    
    // Update total budget
    const newTotal = updatedChannels.reduce((sum, channel) => sum + (channel.budget || 0), 0);
    setTotalBudget(newTotal);
  };
  
  // Handle slider change
  const handleSliderChange = (id: string, value: number[]) => {
    // Calculate the percentage of total budget
    const percentage = value[0] / 100;
    const newBudget = Math.round(totalBudget * percentage);
    
    handleBudgetChange(id, newBudget);
  };
  
  // Calculate percentage of total budget for each channel
  const getChannelPercentage = (budget: number) => {
    if (totalBudget === 0) return 0;
    return (budget / totalBudget) * 100;
  };
  
  // Save changes to product
  const saveChanges = () => {
    if (!currentProduct) return;
    
    setIsSaving(true);
    
    // Update product with new channel budgets
    const updatedProduct = {
      ...currentProduct,
      costMetrics: {
        ...currentProduct.costMetrics,
        marketing: {
          ...currentProduct.costMetrics?.marketing,
          channels: channels
        }
      }
    };
    
    updateProduct(currentProduct.info.id, updatedProduct);
    
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };
  
  // Reset to original values
  const resetChanges = () => {
    if (currentProduct?.costMetrics?.marketing?.channels) {
      setChannels([...currentProduct.costMetrics.marketing.channels]);
      
      // Calculate total budget
      const total = currentProduct.costMetrics.marketing.channels.reduce(
        (sum, channel) => sum + (channel.budget || 0), 0
      );
      setTotalBudget(total);
    }
  };
  
  // Prepare data for pie chart
  const chartData = channels.map((channel, index) => ({
    name: channel.name,
    value: channel.budget || 0,
    color: COLORS[index % COLORS.length]
  }));
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budget Allocation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Drag and drop to prioritize channels or adjust sliders to allocate budget
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={resetChanges}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveChanges} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Channel Budget Allocation</CardTitle>
              <CardDescription>
                Total Marketing Budget: {formatCurrency(totalBudget)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                <Droppable droppableId="channels">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-4"
                    >
                      {channels.map((channel, index) => (
                        <Draggable key={channel.id} draggableId={channel.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-4 border rounded-lg ${
                                isDragging ? 'bg-gray-50' : 'bg-white'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <div {...provided.dragHandleProps} className="mr-2">
                                    <GripVertical className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <span className="font-medium">{channel.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500">
                                    {formatPercent(getChannelPercentage(channel.budget || 0) / 100)}
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(channel.budget || 0)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                <div className="w-full">
                                  <Slider
                                    value={[getChannelPercentage(channel.budget || 0)]}
                                    max={100}
                                    step={1}
                                    onValueChange={(value) => handleSliderChange(channel.id, value)}
                                  />
                                </div>
                                <div className="w-24">
                                  <div className="relative">
                                    <DollarSign className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                    <Input
                                      type="number"
                                      value={channel.budget || 0}
                                      onChange={(e) => handleBudgetChange(channel.id, Number(e.target.value))}
                                      className="pl-8"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Budget Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.name}`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: unknown) => [formatCurrency(value), 'Budget']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Budget Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Budget:</span>
                  <span className="font-medium">{formatCurrency(totalBudget)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Number of Channels:</span>
                  <span className="font-medium">{channels.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average per Channel:</span>
                  <span className="font-medium">
                    {formatCurrency(channels.length > 0 ? totalBudget / channels.length : 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
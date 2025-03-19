import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Plus,
  Trash2,
  Save,
  X,
  Pencil,
  BarChart
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "./ui/dialog";
import { Label } from "./ui/label";
import useStore from '../store/useStore';
import { formatCurrency, formatNumber, formatPercent } from "../lib/utils";
import type { 
  Product, 
  ActualMetrics, 
  MarketingChannelItem,
  MarketingChannelPerformance
} from "../types";

interface MarketingChannelActualsProps {
  weekNumber?: number;
}

const MarketingChannelActuals = ({ weekNumber }: MarketingChannelActualsProps) => {
  const { products, currentProductId, updateProduct } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number | undefined>(weekNumber);
  const [weekActuals, setWeekActuals] = useState<ActualMetrics | null>(null);
  const [channelMetrics, setChannelMetrics] = useState<Record<string, ChannelMetricInputs>>({});
  const [isEditing, setIsEditing] = useState(false);
  
  // Get current product
  const currentProduct = products.find(p => p.info.id === currentProductId);
  
  // Get marketing channels
  const marketingChannels = currentProduct?.costMetrics?.marketing?.channels || [];
  
  // Get available actual weeks
  const actualWeeks = (currentProduct?.actualMetrics || [])
    .sort((a, b) => a.week - b.week)
    .map(a => a.week);
  
  // Type for form inputs
  interface ChannelMetricInputs {
    spend: string;
    impressions: string;
    clicks: string;
    conversions: string;
    revenue: string;
  }
  
  // Load actuals for the selected week
  useEffect(() => {
    if (!currentProduct || !selectedWeek) return;
    
    const weekData = (currentProduct.actualMetrics || []).find(
      actual => actual.week === selectedWeek
    );
    
    setWeekActuals(weekData || null);
    
    // Initialize channel metrics
    const metrics: Record<string, ChannelMetricInputs> = {};
    
    // First initialize all channels with empty values
    marketingChannels.forEach(channel => {
      metrics[channel.id] = {
        spend: '',
        impressions: '',
        clicks: '',
        conversions: '',
        revenue: ''
      };
    });
    
    // Then fill in existing data if any
    if (weekData && weekData.channelPerformance) {
      weekData.channelPerformance.forEach(perf => {
        if (metrics[perf.channelId]) {
          const existingMetrics = metrics[perf.channelId];
          metrics[perf.channelId] = {
            spend: perf.spend?.toString() || '',
            impressions: perf.impressions?.toString() || '',
            clicks: perf.clicks?.toString() || '',
            conversions: perf.conversions?.toString() || '',
            revenue: perf.revenue?.toString() || ''
          };
        }
      });
    }
    
    setChannelMetrics(metrics);
  }, [currentProduct, selectedWeek, marketingChannels]);
  
  // Handle saving channel actuals
  const handleSaveChannelData = () => {
    if (!currentProduct || !selectedWeek) return;
    
    // Create channel performance data
    const channelPerformance: MarketingChannelPerformance[] = [];
    
    Object.entries(channelMetrics).forEach(([channelId, metrics]) => {
      // Only include channels with at least one metric
      if (metrics.spend || metrics.impressions || metrics.clicks || metrics.conversions || metrics.revenue) {
        channelPerformance.push({
          channelId,
          spend: metrics.spend ? parseFloat(metrics.spend) : undefined,
          impressions: metrics.impressions ? parseInt(metrics.impressions) : undefined,
          clicks: metrics.clicks ? parseInt(metrics.clicks) : undefined,
          conversions: metrics.conversions ? parseInt(metrics.conversions) : undefined,
          revenue: metrics.revenue ? parseFloat(metrics.revenue) : undefined
        });
      }
    });
    
    // If we already have actuals for this week, update them
    const updatedActualMetrics = [...(currentProduct.actualMetrics || [])];
    const existingIndex = updatedActualMetrics.findIndex(a => a.week === selectedWeek);
    
    if (existingIndex >= 0) {
      // Update existing entry
      updatedActualMetrics[existingIndex] = {
        ...updatedActualMetrics[existingIndex],
        channelPerformance
      };
    } else if (channelPerformance.length > 0) {
      // Create new entry if we have channel data
      updatedActualMetrics.push({
        id: `metrics-${Date.now()}`,
        week: selectedWeek,
        year: new Date().getFullYear(),
        channelPerformance
      });
    }
    
    // Update the product
    updateProduct({
      ...currentProduct,
      actualMetrics: updatedActualMetrics
    });
    
    // Close dialog and reset
    setIsDialogOpen(false);
    setIsEditing(false);
  };
  
  // Calculate derived metrics
  const getChannelMetrics = (channelId: string) => {
    const metrics = channelMetrics[channelId];
    if (!metrics) return null;
    
    const spend = parseFloat(metrics.spend || '0');
    const impressions = parseInt(metrics.impressions || '0');
    const clicks = parseInt(metrics.clicks || '0');
    const conversions = parseInt(metrics.conversions || '0');
    const revenue = parseFloat(metrics.revenue || '0');
    
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const convRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const cpa = conversions > 0 ? spend / conversions : 0;
    const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
    
    return { ctr, convRate, cpc, cpa, roi };
  };
  
  // Render the dialog content
  const renderDialogContent = () => (
    <div className="space-y-6">
      {marketingChannels.length === 0 ? (
        <div className="text-center p-4 bg-gray-50 rounded">
          <p className="text-gray-500">No marketing channels defined for this product.</p>
          <p className="text-sm text-gray-500 mt-1">
            Define channels in the Product Setup section to track channel performance.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-medium">Marketing Channel Actuals</h4>
              <p className="text-sm text-gray-500">Week {selectedWeek}</p>
            </div>
            
            <Button 
              variant={isEditing ? "default" : "outline"} 
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Editing..." : "Edit Data"}
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead>Spend</TableHead>
                  <TableHead>Impressions</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketingChannels.map(channel => {
                  const metrics = channelMetrics[channel.id];
                  
                  return (
                    <TableRow key={channel.id}>
                      <TableCell className="font-medium">{channel.name}</TableCell>
                      
                      {isEditing ? (
                        <>
                          <TableCell>
                            <Input
                              type="number"
                              value={metrics?.spend || ''}
                              onChange={(e) => setChannelMetrics(prev => ({
                                ...prev,
                                [channel.id]: { ...(prev[channel.id] || {}), spend: e.target.value }
                              }))}
                              placeholder="0.00"
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={metrics?.impressions || ''}
                              onChange={(e) => setChannelMetrics(prev => ({
                                ...prev,
                                [channel.id]: { ...(prev[channel.id] || {}), impressions: e.target.value }
                              }))}
                              placeholder="0"
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={metrics?.clicks || ''}
                              onChange={(e) => setChannelMetrics(prev => ({
                                ...prev,
                                [channel.id]: { ...(prev[channel.id] || {}), clicks: e.target.value }
                              }))}
                              placeholder="0"
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={metrics?.conversions || ''}
                              onChange={(e) => setChannelMetrics(prev => ({
                                ...prev,
                                [channel.id]: { ...(prev[channel.id] || {}), conversions: e.target.value }
                              }))}
                              placeholder="0"
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={metrics?.revenue || ''}
                              onChange={(e) => setChannelMetrics(prev => ({
                                ...prev,
                                [channel.id]: { ...(prev[channel.id] || {}), revenue: e.target.value }
                              }))}
                              placeholder="0.00"
                              className="w-24"
                            />
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{metrics?.spend ? formatCurrency(parseFloat(metrics.spend)) : '-'}</TableCell>
                          <TableCell>{metrics?.impressions ? formatNumber(parseInt(metrics.impressions)) : '-'}</TableCell>
                          <TableCell>{metrics?.clicks ? formatNumber(parseInt(metrics.clicks)) : '-'}</TableCell>
                          <TableCell>{metrics?.conversions ? formatNumber(parseInt(metrics.conversions)) : '-'}</TableCell>
                          <TableCell>{metrics?.revenue ? formatCurrency(parseFloat(metrics.revenue)) : '-'}</TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {isEditing && (
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveChannelData}>
                Save Channel Data
              </Button>
            </div>
          )}
          
          {/* Derived Metrics Section */}
          {!isEditing && (
            <div className="mt-8">
              <h4 className="text-lg font-medium mb-4">Derived Performance Metrics</h4>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>CTR</TableHead>
                      <TableHead>Conv. Rate</TableHead>
                      <TableHead>CPC</TableHead>
                      <TableHead>CPA</TableHead>
                      <TableHead>ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marketingChannels.map(channel => {
                      const derivedMetrics = getChannelMetrics(channel.id);
                      
                      if (!derivedMetrics) return null;
                      
                      return (
                        <TableRow key={`derived-${channel.id}`}>
                          <TableCell className="font-medium">{channel.name}</TableCell>
                          <TableCell>{formatPercent(derivedMetrics.ctr / 100)}</TableCell>
                          <TableCell>{formatPercent(derivedMetrics.convRate / 100)}</TableCell>
                          <TableCell>{formatCurrency(derivedMetrics.cpc)}</TableCell>
                          <TableCell>{formatCurrency(derivedMetrics.cpa)}</TableCell>
                          <TableCell className={derivedMetrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatPercent(derivedMetrics.roi / 100)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-4" onClick={() => setSelectedWeek(weekNumber)}>
          <BarChart className="h-4 w-4 mr-2" />
          Track Channel Performance
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Marketing Channel Performance</DialogTitle>
          <DialogDescription>
            Record and analyze performance metrics for each marketing channel
          </DialogDescription>
        </DialogHeader>
        
        {renderDialogContent()}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarketingChannelActuals; 
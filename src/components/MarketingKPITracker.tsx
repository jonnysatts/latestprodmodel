import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useStore from '../store/useStore';
import { formatCurrency, formatNumber } from '../lib/utils';

// Define the database service
const db = {
  getMarketingKPIs: async (productId: string) => {
    // This would normally fetch from a database
    return [];
  },
  addMarketingKPI: async (productId: string, kpi: any) => {
    // This would normally add to a database
    return kpi.id;
  },
  updateMarketingKPI: async (productId: string, kpiId: string, updates: any) => {
    // This would normally update in a database
  },
  deleteMarketingKPI: async (productId: string, kpiId: string) => {
    // This would normally delete from a database
  }
};

interface KPI {
  id: string;
  name: string;
  category: 'revenue' | 'engagement' | 'conversion' | 'cost';
  target: number;
  current: number;
  unit: 'currency' | 'percent' | 'number';
  timeframe: 'weekly' | 'monthly' | 'quarterly';
  startDate: string;
  endDate: string;
  productId?: string;
}

// Category data type
interface CategoryProgress {
  category: string;
  progress: number;
  count: number;
}

// Chart data type
interface ChartData {
  name: string;
  target: number;
  current: number;
  progress: number;
  category: string;
}

export default function MarketingKPITracker() {
  const { products, currentProductId } = useStore();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [newKpi, setNewKpi] = useState<Partial<KPI>>({
    category: 'revenue',
    unit: 'currency',
    timeframe: 'weekly',
    target: 0,
    current: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [isAddingKpi, setIsAddingKpi] = useState(false);
  const [editingKpiId, setEditingKpiId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'revenue' | 'engagement' | 'conversion' | 'cost'>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // Get current product
  const currentProduct = products.find(p => p.info.id === currentProductId);
  
  // Load KPIs from database
  useEffect(() => {
    const loadKpis = async () => {
      if (!currentProductId) return;
      
      setIsLoading(true);
      try {
        const productKpis = await db.getMarketingKPIs(currentProductId);
        setKpis(productKpis as KPI[]);
      } catch (error) {
        console.error('Error loading marketing KPIs:', error);
        
        // If there's an error, try to load from localStorage as fallback
        const storedKpis = localStorage.getItem(`marketing-kpis-${currentProductId}`);
        
        if (storedKpis) {
          setKpis(JSON.parse(storedKpis));
        } else {
          // Initialize with example KPIs
          const exampleKpis: KPI[] = [
            {
              id: '1',
              name: 'Weekly Revenue',
              category: 'revenue',
              target: 10000,
              current: 7500,
              unit: 'currency',
              timeframe: 'weekly',
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              productId: currentProductId
            },
            {
              id: '2',
              name: 'Conversion Rate',
              category: 'conversion',
              target: 3.5,
              current: 2.8,
              unit: 'percent',
              timeframe: 'weekly',
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              productId: currentProductId
            },
            {
              id: '3',
              name: 'Cost per Acquisition',
              category: 'cost',
              target: 25,
              current: 32,
              unit: 'currency',
              timeframe: 'weekly',
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              productId: currentProductId
            },
            {
              id: '4',
              name: 'Social Media Engagement',
              category: 'engagement',
              target: 5000,
              current: 3200,
              unit: 'number',
              timeframe: 'weekly',
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              productId: currentProductId
            }
          ];
          
          // Save example KPIs to Firestore
          await Promise.all(exampleKpis.map(kpi => db.addMarketingKPI(currentProductId, kpi)));
          setKpis(exampleKpis);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadKpis();
  }, [currentProductId]);
  
  if (!currentProduct) {
    return (
      <div className="text-center py-8 text-gray-500">
        No product selected or product not found.
      </div>
    );
  }
  
  // Filter KPIs based on active tab
  const filteredKpis = activeTab === 'all' 
    ? kpis 
    : kpis.filter(kpi => kpi.category === activeTab);
  
  // Format KPI value based on unit
  const formatKpiValue = (value: number, unit: KPI['unit']) => {
    switch (unit) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'number':
        return formatNumber(value);
      default:
        return value.toString();
    }
  };
  
  // Calculate progress percentage
  const calculateProgress = (current: number, target: number, category: KPI['category']) => {
    // For cost metrics, lower is better
    if (category === 'cost') {
      if (current <= target) return 100;
      if (target === 0) return 0;
      return Math.max(0, Math.min(100, (target / current) * 100));
    }
    
    // For other metrics, higher is better
    if (target === 0) return current > 0 ? 100 : 0;
    return Math.max(0, Math.min(100, (current / target) * 100));
  };
  
  // Get progress color
  const getProgressColor = (kpi: KPI) => {
    const percentage = calculateProgress(kpi.current, kpi.target, kpi.category);
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 80) return "bg-yellow-500";
    if (percentage >= 60) return "bg-orange-500";
    return "bg-red-500";
  };
  
  // Handle input change for new KPI
  const handleNewKpiChange = (field: keyof KPI, value: unknown) => {
    setNewKpi(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Add new KPI
  const addKpi = async () => {
    if (!newKpi.name || !currentProductId) return;
    
    const kpi: KPI = {
      id: Date.now().toString(),
      name: newKpi.name || '',
      category: newKpi.category || 'revenue',
      target: newKpi.target || 0,
      current: newKpi.current || 0,
      unit: newKpi.unit || 'currency',
      timeframe: newKpi.timeframe || 'weekly',
      startDate: newKpi.startDate || new Date().toISOString().split('T')[0],
      endDate: newKpi.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      productId: currentProductId
    };
    
    try {
      // Add KPI to Firestore
      const newId = await db.addMarketingKPI(currentProductId, kpi);
      
      // Update local state with the new KPI
      const updatedKpi = { ...kpi, id: newId };
      const updatedKpis = [...kpis, updatedKpi];
      setKpis(updatedKpis);
      
      // Reset form
      setNewKpi({
        category: 'revenue',
        unit: 'currency',
        timeframe: 'weekly',
        target: 0,
        current: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      setIsAddingKpi(false);
    } catch (error) {
      console.error('Error adding KPI:', error);
    }
  };
  
  // Update KPI
  const updateKpi = async (id: string, updates: Partial<KPI>) => {
    if (!currentProductId) return;
    
    try {
      // Update KPI in Firestore
      await db.updateMarketingKPI(currentProductId, id, updates);
      
      // Update local state
      const updatedKpis = kpis.map(kpi => 
        kpi.id === id ? { ...kpi, ...updates } : kpi
      );
      
      setKpis(updatedKpis);
      setEditingKpiId(null);
    } catch (error) {
      console.error('Error updating KPI:', error);
    }
  };
  
  // Delete KPI
  const deleteKpi = async (id: string) => {
    if (!currentProductId) return;
    
    try {
      // Delete KPI from Firestore
      await db.deleteMarketingKPI(currentProductId, id);
      
      // Update local state
      const updatedKpis = kpis.filter(kpi => kpi.id !== id);
      setKpis(updatedKpis);
    } catch (error) {
      console.error('Error deleting KPI:', error);
    }
  };
  
  // Prepare chart data
  const chartData = kpis.map(kpi => ({
    name: kpi.name,
    target: kpi.target,
    current: kpi.current,
    progress: calculateProgress(kpi.current, kpi.target, kpi.category),
    category: kpi.category
  }));
  
  // Group KPIs by category for summary
  const kpisByCategory = kpis.reduce((acc: Record<string, KPI[]>, kpi) => {
    if (!acc[kpi.category]) {
      acc[kpi.category] = [];
    }
    acc[kpi.category].push(kpi);
    return acc;
  }, {} as Record<string, KPI[]>);
  
  // Calculate average progress by category
  const categoryProgress = Object.entries(kpisByCategory).map(([category, categoryKpis]) => {
    const avgProgress = categoryKpis.reduce((sum: number, kpi) => 
      sum + calculateProgress(kpi.current, kpi.target, kpi.category), 0
    ) / categoryKpis.length;
    
    return {
      category,
      progress: avgProgress,
      count: categoryKpis.length
    };
  });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing KPI Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">
            Set targets and track progress for key marketing performance indicators
          </p>
        </div>
        <Button onClick={() => setIsAddingKpi(true)} disabled={isAddingKpi || isLoading}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add KPI
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-2 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading marketing KPIs...</p>
          </div>
        </div>
      ) : (
        <>
          {isAddingKpi && (
            <Card>
              <CardHeader>
                <CardTitle>Add New KPI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kpi-name">KPI Name</Label>
                    <Input
                      id="kpi-name"
                      value={newKpi.name || ''}
                      onChange={(e) => handleNewKpiChange('name', e.target.value)}
                      placeholder="e.g., Conversion Rate"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="kpi-category">Category</Label>
                    <select
                      id="kpi-category"
                      className="w-full p-2 border rounded"
                      value={newKpi.category}
                      onChange={(e) => handleNewKpiChange('category', e.target.value)}
                    >
                      <option value="revenue">Revenue</option>
                      <option value="engagement">Engagement</option>
                      <option value="conversion">Conversion</option>
                      <option value="cost">Cost</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="kpi-target">Target Value</Label>
                    <Input
                      id="kpi-target"
                      type="number"
                      value={newKpi.target || 0}
                      onChange={(e) => handleNewKpiChange('target', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="kpi-current">Current Value</Label>
                    <Input
                      id="kpi-current"
                      type="number"
                      value={newKpi.current || 0}
                      onChange={(e) => handleNewKpiChange('current', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="kpi-unit">Unit</Label>
                    <select
                      id="kpi-unit"
                      className="w-full p-2 border rounded"
                      value={newKpi.unit}
                      onChange={(e) => handleNewKpiChange('unit', e.target.value)}
                    >
                      <option value="currency">Currency ($)</option>
                      <option value="percent">Percentage (%)</option>
                      <option value="number">Number</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="kpi-timeframe">Timeframe</Label>
                    <select
                      id="kpi-timeframe"
                      className="w-full p-2 border rounded"
                      value={newKpi.timeframe}
                      onChange={(e) => handleNewKpiChange('timeframe', e.target.value)}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="kpi-start-date">Start Date</Label>
                    <Input
                      id="kpi-start-date"
                      type="date"
                      value={newKpi.startDate}
                      onChange={(e) => handleNewKpiChange('startDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="kpi-end-date">End Date</Label>
                    <Input
                      id="kpi-end-date"
                      type="date"
                      value={newKpi.endDate}
                      onChange={(e) => handleNewKpiChange('endDate', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddingKpi(false)}>
                  Cancel
                </Button>
                <Button onClick={addKpi}>
                  <Check className="h-4 w-4 mr-2" />
                  Add KPI
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {categoryProgress.length > 0 ? (
            <div className="grid md:grid-cols-4 gap-4">
              {categoryProgress.map((category) => (
                <Card key={category.category}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base capitalize">{category.category} KPIs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-1">
                      {category.progress.toFixed(0)}%
                    </div>
                    <Progress value={category.progress} className="h-2 mb-2" />
                    <p className="text-sm text-gray-500">
                      {category.count} KPI{category.count !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <p>No KPIs added yet. Click "Add KPI" to get started.</p>
              </CardContent>
            </Card>
          )}
          
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList>
              <TabsTrigger value="all">All KPIs</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="conversion">Conversion</TabsTrigger>
              <TabsTrigger value="cost">Cost</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{activeTab === 'all' ? 'All KPIs' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} KPIs`}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>KPI</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>Current</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Timeframe</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredKpis.map((kpi) => (
                          <TableRow key={kpi.id}>
                            <TableCell className="font-medium">{kpi.name}</TableCell>
                            <TableCell className="capitalize">{kpi.category}</TableCell>
                            <TableCell>{formatKpiValue(kpi.target, kpi.unit)}</TableCell>
                            <TableCell>
                              {editingKpiId === kpi.id ? (
                                <Input
                                  type="number"
                                  value={kpi.current}
                                  onChange={(e) => updateKpi(kpi.id, { current: Number(e.target.value) })}
                                  className="w-24"
                                />
                              ) : (
                                formatKpiValue(kpi.current, kpi.unit)
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Progress 
                                  value={calculateProgress(kpi.current, kpi.target, kpi.category)}
                                  className="h-2 w-full"
                                  indicatorClassName={getProgressColor(kpi)}
                                />
                                <span className="ml-2 w-10 text-xs">
                                  {calculateProgress(kpi.current, kpi.target, kpi.category).toFixed(0)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="capitalize">{kpi.timeframe}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                {editingKpiId === kpi.id ? (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => setEditingKpiId(null)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => setEditingKpiId(kpi.id)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => deleteKpi(kpi.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredKpis.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                              No KPIs found. Add some to start tracking!
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {kpis.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>KPI Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: unknown) => [`${value}%`, 'Progress']} />
                        <Legend />
                        <Bar dataKey="progress" name="Progress (%)" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Target vs Current</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="target" name="Target" fill="#22c55e" />
                        <Bar dataKey="current" name="Current" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
} 
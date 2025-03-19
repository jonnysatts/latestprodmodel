import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PlusCircle, Trash2, Save, Copy, PieChart, BarChart, ArrowUpDown, Download } from 'lucide-react';
import { 
  PieChart as RechartsChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import useStore from '../store/useStore';
import { ScenarioModel, Product, WeeklyProjection } from '../types';
import { formatCurrency, formatPercent } from '../lib/utils';
import { exportScenarioComparison } from '../lib/exportUtils';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ProductBasedScenarioModeling() {
  const { 
    products, 
    currentProductId, 
    scenarios,
    addScenarioModel, 
    updateScenarioModel, 
    deleteScenarioModel,
    getScenariosByProduct
  } = useStore();
  
  // Selected product state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [baselineData, setBaselineData] = useState<WeeklyProjection[]>([]);
  
  // Scenario management state
  const [activeScenario, setActiveScenario] = useState<ScenarioModel | null>(null);
  const [isCreatingScenario, setIsCreatingScenario] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('parameters');
  
  // Load current product when component mounts or currentProductId changes
  useEffect(() => {
    if (currentProductId) {
      const product = products.find(p => p.info.id === currentProductId);
      if (product) {
        setSelectedProduct(product);
        setBaselineData(product.weeklyProjections || []);
        
        // Load scenarios for this product
        const productScenarios = getScenariosByProduct(currentProductId);
        if (productScenarios.length > 0 && !activeScenario) {
          setActiveScenario(productScenarios[0]);
        }
      }
    }
  }, [currentProductId, products, getScenariosByProduct, activeScenario]);
  
  // Create a default blank scenario for the selected product
  const createDefaultScenario = () => {
    if (!selectedProduct) return;
    
    const newScenario: ScenarioModel = {
      id: crypto.randomUUID(),
      name: `${selectedProduct.info.name} - New Scenario`,
      productId: selectedProduct.info.id,
      description: `Scenario for ${selectedProduct.info.name}`,
      modifiers: {
        revenue: {
          ticketRevenue: 0,
          fbRevenue: 0,
          merchandiseRevenue: 0,
          digitalRevenue: 0
        },
        costs: {
          marketingCost: 0,
          staffingCost: 0,
          eventCost: 0,
          setupCost: 0
        },
        attendance: {
          footTraffic: 0
        }
      },
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      variant: 'custom'
    };
    
    addScenarioModel(newScenario);
    setActiveScenario(newScenario);
    setIsCreatingScenario(false);
  };
  
  // Handle product selection change
  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.info.id === productId);
    if (product) {
      setSelectedProduct(product);
      setBaselineData(product.weeklyProjections || []);
      
      // Load scenarios for this product
      const productScenarios = getScenariosByProduct(productId);
      setActiveScenario(productScenarios.length > 0 ? productScenarios[0] : null);
    }
  };
  
  // Calculate scenario projections by applying modifiers to baseline data
  const calculateScenarioProjections = (scenario: ScenarioModel) => {
    if (!baselineData || baselineData.length === 0) return [];
    
    return baselineData.map(week => {
      const { modifiers } = scenario;
      
      // Apply percentage adjustments to baseline values
      return {
        ...week,
        projectedTicketRevenue: week.projectedTicketRevenue * (1 + modifiers.revenue.ticketRevenue / 100),
        projectedFbRevenue: week.projectedFbRevenue * (1 + modifiers.revenue.fbRevenue / 100),
        projectedMerchandiseRevenue: week.projectedMerchandiseRevenue * (1 + modifiers.revenue.merchandiseRevenue / 100),
        projectedDigitalRevenue: week.projectedDigitalRevenue * (1 + modifiers.revenue.digitalRevenue / 100),
        projectedMarketingCost: week.projectedMarketingCost * (1 + modifiers.costs.marketingCost / 100),
        projectedStaffingCost: week.projectedStaffingCost * (1 + modifiers.costs.staffingCost / 100),
        projectedEventCost: week.projectedEventCost * (1 + modifiers.costs.eventCost / 100),
        projectedSetupCost: week.projectedSetupCost * (1 + modifiers.costs.setupCost / 100),
        projectedFootTraffic: week.projectedFootTraffic * (1 + modifiers.attendance.footTraffic / 100)
      };
    });
  };
  
  // Update a scenario modifier
  const updateModifier = (
    category: 'revenue' | 'costs' | 'attendance',
    key: string,
    value: number
  ) => {
    if (!activeScenario) return;
    
    const updatedScenario = {
      ...activeScenario,
      modifiers: {
        ...activeScenario.modifiers,
        [category]: {
          ...activeScenario.modifiers[category],
          [key]: value
        }
      },
      lastModified: new Date().toISOString()
    };
    
    updateScenarioModel(updatedScenario);
    setActiveScenario(updatedScenario);
  };
  
  // Save the current scenario
  const saveScenario = (name: string, description: string, variant: 'optimistic' | 'pessimistic' | 'neutral' | 'custom' = 'custom') => {
    if (!activeScenario || !selectedProduct) return;
    
    const updatedScenario = {
      ...activeScenario,
      name,
      description,
      variant,
      lastModified: new Date().toISOString()
    };
    
    updateScenarioModel(updatedScenario);
    setActiveScenario(updatedScenario);
  };
  
  // Delete a scenario
  const handleDeleteScenario = (scenarioId: string) => {
    if (window.confirm('Are you sure you want to delete this scenario?')) {
      deleteScenarioModel(scenarioId);
      
      // Select a different scenario if the active one was deleted
      if (activeScenario?.id === scenarioId) {
        const remainingScenarios = getScenariosByProduct(selectedProduct?.info.id || '');
        setActiveScenario(remainingScenarios.length > 0 ? remainingScenarios[0] : null);
      }
    }
  };
  
  // Duplicate a scenario
  const handleDuplicateScenario = (scenarioId: string) => {
    const scenarioToDuplicate = scenarios.find(s => s.id === scenarioId);
    if (!scenarioToDuplicate || !selectedProduct) return;
    
    const newScenario: ScenarioModel = {
      ...scenarioToDuplicate,
      id: crypto.randomUUID(),
      name: `${scenarioToDuplicate.name} (Copy)`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    addScenarioModel(newScenario);
    setActiveScenario(newScenario);
  };
  
  // Export scenario comparison
  const handleExportScenario = () => {
    if (!activeScenario || !selectedProduct) return;
    
    const scenarioData = calculateScenarioProjections(activeScenario);
    exportScenarioComparison(
      selectedProduct,
      baselineData,
      scenarioData,
      activeScenario.name
    );
  };
  
  // Calculate totals for baseline and scenario data for charts and tables
  const calculateTotals = () => {
    if (!baselineData || baselineData.length === 0) {
      return { baseline: null, scenario: null };
    }
    
    const baselineTotals = {
      ticketRevenue: baselineData.reduce((sum, week) => sum + week.projectedTicketRevenue, 0),
      fbRevenue: baselineData.reduce((sum, week) => sum + week.projectedFbRevenue, 0),
      merchandiseRevenue: baselineData.reduce((sum, week) => sum + week.projectedMerchandiseRevenue, 0),
      digitalRevenue: baselineData.reduce((sum, week) => sum + week.projectedDigitalRevenue, 0),
      totalRevenue: baselineData.reduce((sum, week) => 
        sum + week.projectedTicketRevenue + week.projectedFbRevenue + 
        week.projectedMerchandiseRevenue + week.projectedDigitalRevenue, 0),
      
      marketingCost: baselineData.reduce((sum, week) => sum + week.projectedMarketingCost, 0),
      staffingCost: baselineData.reduce((sum, week) => sum + week.projectedStaffingCost, 0),
      eventCost: baselineData.reduce((sum, week) => sum + week.projectedEventCost, 0),
      setupCost: baselineData.reduce((sum, week) => sum + week.projectedSetupCost, 0),
      totalCost: baselineData.reduce((sum, week) => 
        sum + week.projectedMarketingCost + week.projectedStaffingCost + 
        week.projectedEventCost + week.projectedSetupCost, 0),
      
      footTraffic: baselineData.reduce((sum, week) => sum + week.projectedFootTraffic, 0)
    };
    
    baselineTotals.profit = baselineTotals.totalRevenue - baselineTotals.totalCost;
    
    if (!activeScenario) return { baseline: baselineTotals, scenario: null };
    
    const scenarioData = calculateScenarioProjections(activeScenario);
    
    const scenarioTotals = {
      ticketRevenue: scenarioData.reduce((sum, week) => sum + week.projectedTicketRevenue, 0),
      fbRevenue: scenarioData.reduce((sum, week) => sum + week.projectedFbRevenue, 0),
      merchandiseRevenue: scenarioData.reduce((sum, week) => sum + week.projectedMerchandiseRevenue, 0),
      digitalRevenue: scenarioData.reduce((sum, week) => sum + week.projectedDigitalRevenue, 0),
      totalRevenue: scenarioData.reduce((sum, week) => 
        sum + week.projectedTicketRevenue + week.projectedFbRevenue + 
        week.projectedMerchandiseRevenue + week.projectedDigitalRevenue, 0),
      
      marketingCost: scenarioData.reduce((sum, week) => sum + week.projectedMarketingCost, 0),
      staffingCost: scenarioData.reduce((sum, week) => sum + week.projectedStaffingCost, 0),
      eventCost: scenarioData.reduce((sum, week) => sum + week.projectedEventCost, 0),
      setupCost: scenarioData.reduce((sum, week) => sum + week.projectedSetupCost, 0),
      totalCost: scenarioData.reduce((sum, week) => 
        sum + week.projectedMarketingCost + week.projectedStaffingCost + 
        week.projectedEventCost + week.projectedSetupCost, 0),
      
      footTraffic: scenarioData.reduce((sum, week) => sum + week.projectedFootTraffic, 0)
    };
    
    scenarioTotals.profit = scenarioTotals.totalRevenue - scenarioTotals.totalCost;
    
    return { baseline: baselineTotals, scenario: scenarioTotals };
  };
  
  // Format percentage change between baseline and scenario
  const formatChange = (baseline: number, scenario: number) => {
    if (baseline === 0) return 'N/A';
    const change = ((scenario - baseline) / baseline) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
  };
  
  // Render product selector
  const renderProductSelector = () => (
    <Select
      value={selectedProduct?.info.id || ''}
      onValueChange={handleProductChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a product" />
      </SelectTrigger>
      <SelectContent>
        {products.map(product => (
          <SelectItem key={product.info.id} value={product.info.id}>
            {product.info.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  
  // Render scenario selection panel
  const renderScenarioPanel = () => {
    const productScenarios = selectedProduct 
      ? getScenariosByProduct(selectedProduct.info.id)
      : [];
    
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-xl">Scenarios</CardTitle>
          <CardDescription>
            Create and manage scenarios for {selectedProduct?.info.name || 'selected product'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productScenarios.length > 0 ? (
            <div className="space-y-2">
              {productScenarios.map(scenario => (
                <div 
                  key={scenario.id}
                  className={`p-2 border rounded-md flex justify-between items-center cursor-pointer ${
                    activeScenario?.id === scenario.id ? 'bg-blue-50 border-blue-300' : ''
                  }`}
                  onClick={() => setActiveScenario(scenario)}
                >
                  <div>
                    <div className="font-medium">{scenario.name}</div>
                    <div className="text-sm text-gray-500">{scenario.variant}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateScenario(scenario.id);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScenario(scenario.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No scenarios created yet.
            </div>
          )}
          
          <div className="mt-4">
            <Button 
              className="w-full"
              onClick={createDefaultScenario}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Create New Scenario
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Render parameter modification controls
  const renderModifierControls = () => {
    if (!activeScenario) return null;
    
    return (
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="parameters">Revenue</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="parameters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Adjustments</CardTitle>
              <CardDescription>Adjust revenue projections relative to baseline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Ticket Revenue: {activeScenario.modifiers.revenue.ticketRevenue}%</Label>
                  <span>
                    {formatCurrency(calculateTotals().baseline?.ticketRevenue || 0)} → 
                    {formatCurrency(calculateTotals().scenario?.ticketRevenue || 0)}
                  </span>
                </div>
                <Slider 
                  value={[activeScenario.modifiers.revenue.ticketRevenue]} 
                  min={-50} 
                  max={50} 
                  step={1}
                  onValueChange={(value) => updateModifier('revenue', 'ticketRevenue', value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>F&B Revenue: {activeScenario.modifiers.revenue.fbRevenue}%</Label>
                  <span>
                    {formatCurrency(calculateTotals().baseline?.fbRevenue || 0)} → 
                    {formatCurrency(calculateTotals().scenario?.fbRevenue || 0)}
                  </span>
                </div>
                <Slider 
                  value={[activeScenario.modifiers.revenue.fbRevenue]} 
                  min={-50} 
                  max={50} 
                  step={1}
                  onValueChange={(value) => updateModifier('revenue', 'fbRevenue', value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Merchandise Revenue: {activeScenario.modifiers.revenue.merchandiseRevenue}%</Label>
                  <span>
                    {formatCurrency(calculateTotals().baseline?.merchandiseRevenue || 0)} → 
                    {formatCurrency(calculateTotals().scenario?.merchandiseRevenue || 0)}
                  </span>
                </div>
                <Slider 
                  value={[activeScenario.modifiers.revenue.merchandiseRevenue]} 
                  min={-50} 
                  max={50} 
                  step={1}
                  onValueChange={(value) => updateModifier('revenue', 'merchandiseRevenue', value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Digital Revenue: {activeScenario.modifiers.revenue.digitalRevenue}%</Label>
                  <span>
                    {formatCurrency(calculateTotals().baseline?.digitalRevenue || 0)} → 
                    {formatCurrency(calculateTotals().scenario?.digitalRevenue || 0)}
                  </span>
                </div>
                <Slider 
                  value={[activeScenario.modifiers.revenue.digitalRevenue]} 
                  min={-50} 
                  max={50} 
                  step={1}
                  onValueChange={(value) => updateModifier('revenue', 'digitalRevenue', value[0])}
                />
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="font-medium flex justify-between">
                  <span>Total Revenue Impact</span>
                  <span className={calculateTotals().scenario && calculateTotals().baseline && 
                    calculateTotals().scenario.totalRevenue > calculateTotals().baseline.totalRevenue 
                    ? 'text-green-600' 
                    : 'text-red-600'
                  }>
                    {calculateTotals().baseline && calculateTotals().scenario && 
                      formatChange(calculateTotals().baseline.totalRevenue, calculateTotals().scenario.totalRevenue)
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Adjustments</CardTitle>
              <CardDescription>Adjust cost projections relative to baseline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Marketing Cost: {activeScenario.modifiers.costs.marketingCost}%</Label>
                  <span>
                    {formatCurrency(calculateTotals().baseline?.marketingCost || 0)} → 
                    {formatCurrency(calculateTotals().scenario?.marketingCost || 0)}
                  </span>
                </div>
                <Slider 
                  value={[activeScenario.modifiers.costs.marketingCost]} 
                  min={-50} 
                  max={50} 
                  step={1}
                  onValueChange={(value) => updateModifier('costs', 'marketingCost', value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Staffing Cost: {activeScenario.modifiers.costs.staffingCost}%</Label>
                  <span>
                    {formatCurrency(calculateTotals().baseline?.staffingCost || 0)} → 
                    {formatCurrency(calculateTotals().scenario?.staffingCost || 0)}
                  </span>
                </div>
                <Slider 
                  value={[activeScenario.modifiers.costs.staffingCost]} 
                  min={-50} 
                  max={50} 
                  step={1}
                  onValueChange={(value) => updateModifier('costs', 'staffingCost', value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Event Cost: {activeScenario.modifiers.costs.eventCost}%</Label>
                  <span>
                    {formatCurrency(calculateTotals().baseline?.eventCost || 0)} → 
                    {formatCurrency(calculateTotals().scenario?.eventCost || 0)}
                  </span>
                </div>
                <Slider 
                  value={[activeScenario.modifiers.costs.eventCost]} 
                  min={-50} 
                  max={50} 
                  step={1}
                  onValueChange={(value) => updateModifier('costs', 'eventCost', value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Setup Cost: {activeScenario.modifiers.costs.setupCost}%</Label>
                  <span>
                    {formatCurrency(calculateTotals().baseline?.setupCost || 0)} → 
                    {formatCurrency(calculateTotals().scenario?.setupCost || 0)}
                  </span>
                </div>
                <Slider 
                  value={[activeScenario.modifiers.costs.setupCost]} 
                  min={-50} 
                  max={50} 
                  step={1}
                  onValueChange={(value) => updateModifier('costs', 'setupCost', value[0])}
                />
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="font-medium flex justify-between">
                  <span>Total Cost Impact</span>
                  <span className={calculateTotals().scenario && calculateTotals().baseline && 
                    calculateTotals().scenario.totalCost < calculateTotals().baseline.totalCost 
                    ? 'text-green-600' 
                    : 'text-red-600'
                  }>
                    {calculateTotals().baseline && calculateTotals().scenario && 
                      formatChange(calculateTotals().baseline.totalCost, calculateTotals().scenario.totalCost)
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Adjustments</CardTitle>
              <CardDescription>Adjust attendance projections relative to baseline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Foot Traffic: {activeScenario.modifiers.attendance.footTraffic}%</Label>
                  <span>
                    {(calculateTotals().baseline?.footTraffic || 0).toLocaleString()} → 
                    {(calculateTotals().scenario?.footTraffic || 0).toLocaleString()}
                  </span>
                </div>
                <Slider 
                  value={[activeScenario.modifiers.attendance.footTraffic]} 
                  min={-50} 
                  max={50} 
                  step={1}
                  onValueChange={(value) => updateModifier('attendance', 'footTraffic', value[0])}
                />
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="font-medium flex justify-between">
                  <span>Attendance Impact</span>
                  <span className={calculateTotals().scenario && calculateTotals().baseline && 
                    calculateTotals().scenario.footTraffic > calculateTotals().baseline.footTraffic 
                    ? 'text-green-600' 
                    : 'text-red-600'
                  }>
                    {calculateTotals().baseline && calculateTotals().scenario && 
                      formatChange(calculateTotals().baseline.footTraffic, calculateTotals().scenario.footTraffic)
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };
  
  // Render comparison charts and tables
  const renderComparisonCharts = () => {
    const totals = calculateTotals();
    if (!totals.baseline || !totals.scenario) return null;
    
    // Generate data for charts
    const revenueComparisonData = [
      { name: 'Ticket', baseline: totals.baseline.ticketRevenue, scenario: totals.scenario.ticketRevenue },
      { name: 'F&B', baseline: totals.baseline.fbRevenue, scenario: totals.scenario.fbRevenue },
      { name: 'Merch', baseline: totals.baseline.merchandiseRevenue, scenario: totals.scenario.merchandiseRevenue },
      { name: 'Digital', baseline: totals.baseline.digitalRevenue, scenario: totals.scenario.digitalRevenue }
    ];
    
    const costComparisonData = [
      { name: 'Marketing', baseline: totals.baseline.marketingCost, scenario: totals.scenario.marketingCost },
      { name: 'Staffing', baseline: totals.baseline.staffingCost, scenario: totals.scenario.staffingCost },
      { name: 'Event', baseline: totals.baseline.eventCost, scenario: totals.scenario.eventCost },
      { name: 'Setup', baseline: totals.baseline.setupCost, scenario: totals.scenario.setupCost }
    ];
    
    const summaryComparisonData = [
      { name: 'Revenue', baseline: totals.baseline.totalRevenue, scenario: totals.scenario.totalRevenue },
      { name: 'Costs', baseline: totals.baseline.totalCost, scenario: totals.scenario.totalCost },
      { name: 'Profit', baseline: totals.baseline.profit, scenario: totals.scenario.profit },
      { name: 'Attendance', baseline: totals.baseline.footTraffic, scenario: totals.scenario.footTraffic, isCount: true }
    ];
    
    return (
      <div className="space-y-6">
        <div className="text-xl font-semibold">
          Scenario Impact Analysis
          <Button 
            variant="outline" 
            size="sm"
            className="ml-2"
            onClick={handleExportScenario}
          >
            <Download className="h-4 w-4 mr-1" /> Export Comparison
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={revenueComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="baseline" name="Baseline" fill="#8884d8" />
                    <Bar dataKey="scenario" name="Scenario" fill="#82ca9d" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Cost Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={costComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="baseline" name="Baseline" fill="#8884d8" />
                    <Bar dataKey="scenario" name="Scenario" fill="#82ca9d" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Summary Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Baseline</TableHead>
                  <TableHead className="text-right">Scenario</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryComparisonData.map((item) => {
                  const isImprovement = item.name === 'Costs' 
                    ? item.scenario < item.baseline
                    : item.scenario > item.baseline;
                  
                  return (
                    <TableRow key={item.name}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">
                        {item.isCount 
                          ? Math.round(item.baseline).toLocaleString() 
                          : formatCurrency(item.baseline)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.isCount 
                          ? Math.round(item.scenario).toLocaleString() 
                          : formatCurrency(item.scenario)}
                      </TableCell>
                      <TableCell className={`text-right ${isImprovement ? 'text-green-600' : 'text-red-600'}`}>
                        {formatChange(item.baseline, item.scenario)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Main component render
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Product-Based Scenario Modeling</h2>
        <div className="w-1/3">
          {renderProductSelector()}
        </div>
      </div>
      
      {selectedProduct ? (
        <div className="grid grid-cols-4 gap-6">
          {/* Scenario selection panel */}
          <div className="col-span-1">
            {renderScenarioPanel()}
          </div>
          
          {/* Scenario content area */}
          {activeScenario ? (
            <div className="col-span-3 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl">{activeScenario.name}</CardTitle>
                    <div className="text-sm text-gray-500">
                      Last modified: {new Date(activeScenario.lastModified).toLocaleString()}
                    </div>
                  </div>
                  <CardDescription>{activeScenario.description}</CardDescription>
                </CardHeader>
              </Card>
              
              {renderModifierControls()}
              {renderComparisonCharts()}
            </div>
          ) : (
            <div className="col-span-3 flex items-center justify-center h-64 border rounded-lg bg-gray-50">
              <div className="text-center">
                <p className="text-lg text-gray-500 mb-4">No scenario selected</p>
                <Button onClick={createDefaultScenario}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Create New Scenario
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-lg text-gray-500">Select a product to start scenario modeling</p>
        </div>
      )}
    </div>
  );
} 
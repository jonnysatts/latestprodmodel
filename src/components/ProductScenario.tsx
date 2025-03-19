import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import useStore from '../store/useStore';
import { Product, ScenarioModel, WeeklyProjection } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Bar, BarChart
} from 'recharts';
import { exportScenarioComparison } from '../lib/exportUtils';
import { downloadFile } from '../lib/exportUtils';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_MODIFIER_VALUE = 0; // 0% change

const ProductScenario = () => {
  const { id: productIdFromRoute } = useParams<{ id: string }>();
  const { products, scenarios, addScenarioModel, updateScenarioModel, deleteScenarioModel, getScenariosByProduct, currentProductId } = useStore();
  
  // Use the product ID from route params if available, otherwise fall back to currentProductId from store
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    productIdFromRoute || currentProductId || null
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [newScenarioName, setNewScenarioName] = useState<string>('');
  const [activeTab, setActiveTab] = useState('editor');
  
  // Update selectedProductId when productIdFromRoute or currentProductId changes
  useEffect(() => {
    if (productIdFromRoute && productIdFromRoute !== selectedProductId) {
      setSelectedProductId(productIdFromRoute);
    } else if (currentProductId && !selectedProductId) {
      setSelectedProductId(currentProductId);
    }
  }, [productIdFromRoute, currentProductId, selectedProductId]);
  
  // Get the selected product's scenarios
  const productScenarios = selectedProductId 
    ? getScenariosByProduct(selectedProductId) 
    : [];
  
  // Get the active scenario
  const activeScenario = activeScenarioId 
    ? productScenarios.find(s => s.id === activeScenarioId) 
    : null;
  
  // Load product when selected
  useEffect(() => {
    if (selectedProductId) {
      const product = products.find(p => p.info.id === selectedProductId);
      setSelectedProduct(product || null);
      
      // Set first scenario as active if available
      const productScenarios = getScenariosByProduct(selectedProductId);
      if (productScenarios.length > 0 && !activeScenarioId) {
        setActiveScenarioId(productScenarios[0].id);
      } else if (productScenarios.length === 0) {
        // If no scenarios exist, create a default one
        createDefaultScenario(selectedProductId);
      }
    }
  }, [selectedProductId, products, getScenariosByProduct, activeScenarioId]);
  
  // Create a default scenario for a product
  const createDefaultScenario = (productId: string) => {
    const newScenario: ScenarioModel = {
      id: uuidv4(),
      name: 'Default Scenario',
      productId,
      description: 'A default scenario based on product baseline',
      modifiers: {
        revenue: {
          ticketRevenue: DEFAULT_MODIFIER_VALUE,
          fbRevenue: DEFAULT_MODIFIER_VALUE,
          merchandiseRevenue: DEFAULT_MODIFIER_VALUE,
          digitalRevenue: DEFAULT_MODIFIER_VALUE,
        },
        costs: {
          marketingCost: DEFAULT_MODIFIER_VALUE,
          staffingCost: DEFAULT_MODIFIER_VALUE,
          eventCost: DEFAULT_MODIFIER_VALUE,
          setupCost: DEFAULT_MODIFIER_VALUE,
        },
        attendance: DEFAULT_MODIFIER_VALUE
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    addScenarioModel(newScenario);
    setActiveScenarioId(newScenario.id);
  };
  
  // Create a new scenario
  const createNewScenario = () => {
    if (selectedProductId) {
      const newScenarioName = `Scenario ${productScenarios.length + 1}`;
      
      const newScenario: ScenarioModel = {
        id: uuidv4(),
        name: newScenarioName,
        productId: selectedProductId,
        description: 'New scenario based on product baseline',
        modifiers: {
          revenue: {
            ticketRevenue: DEFAULT_MODIFIER_VALUE,
            fbRevenue: DEFAULT_MODIFIER_VALUE,
            merchandiseRevenue: DEFAULT_MODIFIER_VALUE,
            digitalRevenue: DEFAULT_MODIFIER_VALUE,
          },
          costs: {
            marketingCost: DEFAULT_MODIFIER_VALUE,
            staffingCost: DEFAULT_MODIFIER_VALUE,
            eventCost: DEFAULT_MODIFIER_VALUE,
            setupCost: DEFAULT_MODIFIER_VALUE,
          },
          attendance: DEFAULT_MODIFIER_VALUE
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      addScenarioModel(newScenario);
      setActiveScenarioId(newScenario.id);
    }
  };
  
  // Duplicate active scenario
  const duplicateScenario = () => {
    if (activeScenario && selectedProductId) {
      const duplicatedScenario: ScenarioModel = {
        ...activeScenario,
        id: uuidv4(),
        name: `${activeScenario.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      addScenarioModel(duplicatedScenario);
      setActiveScenarioId(duplicatedScenario.id);
    }
  };
  
  // Delete active scenario
  const deleteScenario = () => {
    if (activeScenarioId) {
      deleteScenarioModel(activeScenarioId);
      
      // Set first available scenario as active
      if (productScenarios.length > 1) {
        const remainingScenarios = productScenarios.filter(s => s.id !== activeScenarioId);
        setActiveScenarioId(remainingScenarios[0].id);
      } else {
        // If no scenarios left, create a default one
        createDefaultScenario(selectedProductId as string);
      }
    }
  };
  
  // Start scenario name editing
  const startEditingName = () => {
    if (activeScenario) {
      setNewScenarioName(activeScenario.name);
      setIsEditingName(true);
    }
  };
  
  // Save scenario name
  const saveScenarioName = () => {
    if (activeScenario && newScenarioName.trim() !== '') {
      updateScenarioModel({
        ...activeScenario,
        name: newScenarioName.trim(),
        updatedAt: new Date().toISOString(),
      });
      setIsEditingName(false);
    }
  };
  
  // Update scenario modifier
  const updateModifier = (
    category: 'revenue' | 'costs' | 'attendance',
    type: string | null,
    value: number
  ) => {
    if (activeScenario) {
      const updatedScenario = { ...activeScenario };
      
      if (category === 'revenue' && type) {
        updatedScenario.modifiers.revenue[type as keyof typeof updatedScenario.modifiers.revenue] = value;
      } else if (category === 'costs' && type) {
        updatedScenario.modifiers.costs[type as keyof typeof updatedScenario.modifiers.costs] = value;
      } else if (category === 'attendance') {
        updatedScenario.modifiers.attendance = value;
      }
      
      updatedScenario.updatedAt = new Date().toISOString();
      updateScenarioModel(updatedScenario);
    }
  };
  
  // Apply modifiers to generate projections
  const generateProjectedData = (): { baseline: WeeklyProjection[], scenario: WeeklyProjection[] } => {
    if (!selectedProduct || !activeScenario) {
      return { baseline: [], scenario: [] };
    }
    
    // Get baseline projections
    const baseline = selectedProduct.weeklyProjections || [];
    
    // Generate scenario projections with modifiers applied
    const scenario = baseline.map(week => {
      const modifiers = activeScenario.modifiers;
      
      // Apply revenue modifiers
      const ticketRevenue = week.ticketRevenue * (1 + modifiers.revenue.ticketRevenue / 100);
      const fbRevenue = week.fbRevenue * (1 + modifiers.revenue.fbRevenue / 100);
      const merchandiseRevenue = week.merchandiseRevenue * (1 + modifiers.revenue.merchandiseRevenue / 100);
      const digitalRevenue = week.digitalRevenue * (1 + modifiers.revenue.digitalRevenue / 100);
      
      // Apply cost modifiers
      const marketingCosts = week.marketingCosts * (1 + modifiers.costs.marketingCost / 100);
      const staffingCosts = week.staffingCosts * (1 + modifiers.costs.staffingCost / 100);
      const eventCosts = week.eventCosts * (1 + modifiers.costs.eventCost / 100);
      const setupCosts = week.setupCosts * (1 + modifiers.costs.setupCost / 100);
      
      // Apply attendance modifier
      const footTraffic = week.footTraffic * (1 + modifiers.attendance / 100);
      
      return {
        ...week,
        ticketRevenue: ticketRevenue,
        fbRevenue: fbRevenue,
        merchandiseRevenue: merchandiseRevenue,
        digitalRevenue: digitalRevenue,
        marketingCosts: marketingCosts,
        staffingCosts: staffingCosts,
        eventCosts: eventCosts,
        setupCosts: setupCosts,
        footTraffic: footTraffic,
        // Recalculate totals
        totalRevenue: ticketRevenue + fbRevenue + merchandiseRevenue + digitalRevenue,
        totalCosts: marketingCosts + staffingCosts + eventCosts + setupCosts,
        weeklyProfit: (ticketRevenue + fbRevenue + merchandiseRevenue + digitalRevenue) - 
                     (marketingCosts + staffingCosts + eventCosts + setupCosts)
      };
    });
    
    return { baseline, scenario };
  };
  
  // Generate chart data
  const generateChartData = () => {
    const { baseline, scenario } = generateProjectedData();
    if (baseline.length === 0 || scenario.length === 0) return { chartData: [], summaryData: {} };
    
    // Map the data to format suitable for charts
    const chartData = baseline.map((week, index) => {
      const scenarioWeek = scenario[index];
      
      // Calculate total revenues
      const baselineRevenue = week.totalRevenue;
      const scenarioRevenue = scenarioWeek.totalRevenue;
      
      // Calculate total costs
      const baselineCost = week.totalCosts;
      const scenarioCost = scenarioWeek.totalCosts;
      
      // Calculate profits
      const baselineProfit = baselineRevenue - baselineCost;
      const scenarioProfit = scenarioRevenue - scenarioCost;
      
      return {
        week: week.week,
        baselineRevenue,
        scenarioRevenue,
        revenueDifference: scenarioRevenue - baselineRevenue,
        revenuePercentChange: ((scenarioRevenue - baselineRevenue) / baselineRevenue) * 100,
        baselineCost,
        scenarioCost,
        costDifference: scenarioCost - baselineCost,
        costPercentChange: ((scenarioCost - baselineCost) / baselineCost) * 100,
        baselineProfit,
        scenarioProfit,
        profitDifference: scenarioProfit - baselineProfit,
        profitPercentChange: baselineProfit === 0 ? 0 : ((scenarioProfit - baselineProfit) / Math.abs(baselineProfit)) * 100,
        baselineAttendance: week.footTraffic,
        scenarioAttendance: scenarioWeek.footTraffic
      };
    });
    
    // Calculate summary data
    let baselineTotalRevenue = 0;
    let scenarioTotalRevenue = 0;
    let baselineTotalCost = 0;
    let scenarioTotalCost = 0;
    let baselineTotalProfit = 0;
    let scenarioTotalProfit = 0;
    let baselineTotalAttendance = 0;
    let scenarioTotalAttendance = 0;
    
    baseline.forEach((week, index) => {
      const scenarioWeek = scenario[index];
      
      // Sum revenues
      baselineTotalRevenue += week.totalRevenue;
      scenarioTotalRevenue += scenarioWeek.totalRevenue;
      
      // Sum costs
      baselineTotalCost += week.totalCosts;
      scenarioTotalCost += scenarioWeek.totalCosts;
      
      // Sum attendance
      baselineTotalAttendance += week.footTraffic;
      scenarioTotalAttendance += scenarioWeek.footTraffic;
    });
    
    baselineTotalProfit = baselineTotalRevenue - baselineTotalCost;
    scenarioTotalProfit = scenarioTotalRevenue - scenarioTotalCost;
    
    const summaryData = {
      totalBaselineRevenue: baselineTotalRevenue,
      totalScenarioRevenue: scenarioTotalRevenue,
      revenueDifference: scenarioTotalRevenue - baselineTotalRevenue,
      revenuePercentChange: ((scenarioTotalRevenue - baselineTotalRevenue) / baselineTotalRevenue) * 100,
      
      totalBaselineCost: baselineTotalCost,
      totalScenarioCost: scenarioTotalCost,
      costDifference: scenarioTotalCost - baselineTotalCost,
      costPercentChange: ((scenarioTotalCost - baselineTotalCost) / baselineTotalCost) * 100,
      
      totalBaselineProfit: baselineTotalProfit,
      totalScenarioProfit: scenarioTotalProfit,
      profitDifference: scenarioTotalProfit - baselineTotalProfit,
      profitPercentChange: baselineTotalProfit === 0 ? 0 : ((scenarioTotalProfit - baselineTotalProfit) / Math.abs(baselineTotalProfit)) * 100,
      
      totalBaselineAttendance: baselineTotalAttendance,
      totalScenarioAttendance: scenarioTotalAttendance,
      attendanceDifference: scenarioTotalAttendance - baselineTotalAttendance,
      attendancePercentChange: ((scenarioTotalAttendance - baselineTotalAttendance) / baselineTotalAttendance) * 100
    };
    
    return { chartData, summaryData };
  };
  
  // Generate a list of products for the dropdown
  const productOptions = products.map(product => ({
    value: product.info.id,
    label: product.info.name
  }));
  
  // Handle product selection
  const handleProductChange = (value: string) => {
    setSelectedProductId(value);
  };
  
  // Handle export to Excel
  const handleExportExcel = () => {
    if (selectedProduct && activeScenario) {
      const { baseline, scenario } = generateProjectedData();
      exportScenarioComparison(
        selectedProduct, 
        baseline, 
        scenario, 
        activeScenario.name
      );
    }
  };
  
  // Render the product selector
  const renderProductSelector = () => (
    <div className="mb-6">
      <Label htmlFor="product-select" className="text-sm font-medium">
        Select Product
      </Label>
      <Select 
        onValueChange={(value: string) => handleProductChange(value)}
        value={selectedProductId || ''}
      >
        <SelectTrigger id="product-select" className="w-full">
          <SelectValue placeholder="Select a product" />
        </SelectTrigger>
        <SelectContent>
          {productOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  
  // Render the scenario list
  const renderScenarioList = () => (
    <div className="space-y-2 mb-4">
      {productScenarios.map(scenario => (
        <Button 
          key={scenario.id}
          variant={scenario.id === activeScenarioId ? "default" : "outline"} 
          className="w-full justify-between"
          onClick={() => setActiveScenarioId(scenario.id)}
        >
          <span>{scenario.name}</span>
          {scenario.id === activeScenarioId && (
            <span className="rounded-full bg-primary-foreground h-2 w-2"></span>
          )}
        </Button>
      ))}
    </div>
  );
  
  // Render the revenue sliders
  const renderRevenueSliders = () => (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Adjustments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="ticket-revenue">Ticket Revenue</Label>
              <span>{activeScenario?.modifiers.revenue.ticketRevenue}%</span>
            </div>
            <Slider 
              id="ticket-revenue"
              min={-100}
              max={100}
              step={1}
              value={[activeScenario?.modifiers.revenue.ticketRevenue || 0]}
              onValueChange={(value: number[]) => updateModifier('revenue', 'ticketRevenue', value[0])}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="fb-revenue">F&B Revenue</Label>
              <span>{activeScenario?.modifiers.revenue.fbRevenue}%</span>
            </div>
            <Slider 
              id="fb-revenue"
              min={-100}
              max={100}
              step={1}
              value={[activeScenario?.modifiers.revenue.fbRevenue || 0]}
              onValueChange={(value: number[]) => updateModifier('revenue', 'fbRevenue', value[0])}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="merch-revenue">Merchandise Revenue</Label>
              <span>{activeScenario?.modifiers.revenue.merchandiseRevenue}%</span>
            </div>
            <Slider 
              id="merch-revenue"
              min={-100}
              max={100}
              step={1}
              value={[activeScenario?.modifiers.revenue.merchandiseRevenue || 0]}
              onValueChange={(value: number[]) => updateModifier('revenue', 'merchandiseRevenue', value[0])}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="digital-revenue">Digital Revenue</Label>
              <span>{activeScenario?.modifiers.revenue.digitalRevenue}%</span>
            </div>
            <Slider 
              id="digital-revenue"
              min={-100}
              max={100}
              step={1}
              value={[activeScenario?.modifiers.revenue.digitalRevenue || 0]}
              onValueChange={(value: number[]) => updateModifier('revenue', 'digitalRevenue', value[0])}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // Render the cost sliders
  const renderCostSliders = () => (
    <Card>
      <CardHeader>
        <CardTitle>Cost Adjustments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="marketing-cost">Marketing</Label>
              <span>{activeScenario?.modifiers.costs.marketingCost}%</span>
            </div>
            <Slider 
              id="marketing-cost"
              min={-100}
              max={100}
              step={1}
              value={[activeScenario?.modifiers.costs.marketingCost || 0]}
              onValueChange={(value: number[]) => updateModifier('costs', 'marketingCost', value[0])}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="staffing-cost">Staffing</Label>
              <span>{activeScenario?.modifiers.costs.staffingCost}%</span>
            </div>
            <Slider 
              id="staffing-cost"
              min={-100}
              max={100}
              step={1}
              value={[activeScenario?.modifiers.costs.staffingCost || 0]}
              onValueChange={(value: number[]) => updateModifier('costs', 'staffingCost', value[0])}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="event-cost">Event</Label>
              <span>{activeScenario?.modifiers.costs.eventCost}%</span>
            </div>
            <Slider 
              id="event-cost"
              min={-100}
              max={100}
              step={1}
              value={[activeScenario?.modifiers.costs.eventCost || 0]}
              onValueChange={(value: number[]) => updateModifier('costs', 'eventCost', value[0])}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="setup-cost">Setup</Label>
              <span>{activeScenario?.modifiers.costs.setupCost}%</span>
            </div>
            <Slider 
              id="setup-cost"
              min={-100}
              max={100}
              step={1}
              value={[activeScenario?.modifiers.costs.setupCost || 0]}
              onValueChange={(value: number[]) => updateModifier('costs', 'setupCost', value[0])}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // Render the attendance slider
  const renderAttendanceSlider = () => (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Adjustments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="foot-traffic">Foot Traffic</Label>
            <span>{activeScenario?.modifiers.attendance}%</span>
          </div>
          <Slider 
            id="foot-traffic"
            min={-100}
            max={100}
            step={1}
            value={[activeScenario?.modifiers.attendance || 0]}
            onValueChange={(value: number[]) => updateModifier('attendance', null, value[0])}
          />
        </div>
      </CardContent>
    </Card>
  );
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };
  
  // Get summary for display
  const summary = generateChartData().summaryData;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product-Based Scenario Modeling</CardTitle>
          <CardDescription>
            Create scenarios by modifying baseline product forecasts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Product Selector */}
          {renderProductSelector()}
          
          {/* Only show content if a product is selected */}
          {selectedProductId && (
            <>
              {/* Scenario Navigator */}
              <div className="mb-6 flex items-center space-x-2">
                <div className="flex-1">
                  <Label htmlFor="scenario-select">Scenario</Label>
                  {renderScenarioList()}
                </div>
                <div className="flex space-x-2 pt-6">
                  <Button onClick={createNewScenario} variant="outline" size="sm">New</Button>
                  <Button onClick={duplicateScenario} variant="outline" size="sm">Duplicate</Button>
                  <Button 
                    onClick={deleteScenario} 
                    variant="outline" 
                    size="sm"
                    disabled={productScenarios.length <= 1}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              
              {/* Scenario Name Editor */}
              {activeScenario && (
                <div className="mb-6">
                  {isEditingName ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={newScenarioName}
                        onChange={(e) => setNewScenarioName(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={saveScenarioName} size="sm">Save</Button>
                      <Button onClick={() => setIsEditingName(false)} variant="outline" size="sm">Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{activeScenario.name}</h3>
                      <Button onClick={startEditingName} variant="ghost" size="sm">Edit Name</Button>
                    </div>
                  )}
                </div>
              )}
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="editor">Parameters</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                </TabsList>
                
                {activeScenario && (
                  <>
                    <TabsContent value="editor">
                      {/* Parameter Controls */}
                      <div className="space-y-6">
                        {renderRevenueSliders()}
                        {renderCostSliders()}
                        {renderAttendanceSlider()}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="results">
                      {/* Summary Section */}
                      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Revenue</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Baseline:</span>
                                <span className="font-medium">{formatCurrency(summary.totalBaselineRevenue)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Scenario:</span>
                                <span className="font-medium">{formatCurrency(summary.totalScenarioRevenue)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Difference:</span>
                                <span className={`font-medium ${summary.revenueDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(summary.revenueDifference)} ({formatPercentage(summary.revenuePercentChange)})
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Profit</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Baseline:</span>
                                <span className="font-medium">{formatCurrency(summary.totalBaselineProfit)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Scenario:</span>
                                <span className="font-medium">{formatCurrency(summary.totalScenarioProfit)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Difference:</span>
                                <span className={`font-medium ${summary.profitDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(summary.profitDifference)} ({formatPercentage(summary.profitPercentChange)})
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Attendance</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Baseline:</span>
                                <span className="font-medium">
                                  {summary.totalBaselineAttendance.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Scenario:</span>
                                <span className="font-medium">
                                  {summary.totalScenarioAttendance.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Difference:</span>
                                <span className={`font-medium ${summary.attendanceDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {summary.attendanceDifference.toLocaleString()} ({formatPercentage(summary.attendancePercentChange)})
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Revenue Chart */}
                      <div className="mb-8">
                        <h3 className="font-medium mb-4">Revenue Comparison</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={generateChartData().chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="week" />
                              <YAxis tickFormatter={(value) => `$${value / 1000}K`} />
                              <Tooltip 
                                formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
                                labelFormatter={(label) => label}
                              />
                              <Legend />
                              <Bar dataKey="baselineRevenue" name="Baseline Revenue" fill="#8884d8" />
                              <Bar dataKey="scenarioRevenue" name="Scenario Revenue" fill="#4ade80" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      {/* Profit Chart */}
                      <div className="mb-8">
                        <h3 className="font-medium mb-4">Profit Comparison</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={generateChartData().chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="week" />
                              <YAxis tickFormatter={(value) => `$${value / 1000}K`} />
                              <Tooltip 
                                formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
                                labelFormatter={(label) => label}
                              />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="baselineProfit" 
                                name="Baseline Profit" 
                                stroke="#8884d8" 
                                activeDot={{ r: 8 }} 
                              />
                              <Line 
                                type="monotone" 
                                dataKey="scenarioProfit" 
                                name="Scenario Profit" 
                                stroke="#4ade80" 
                                activeDot={{ r: 8 }} 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      {/* Attendance Chart */}
                      <div>
                        <h3 className="font-medium mb-4">Attendance Comparison</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={generateChartData().chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="week" />
                              <YAxis />
                              <Tooltip 
                                formatter={(value) => [Number(value).toLocaleString(), '']}
                                labelFormatter={(label) => label}
                              />
                              <Legend />
                              <Bar dataKey="baselineAttendance" name="Baseline Attendance" fill="#8884d8" />
                              <Bar dataKey="scenarioAttendance" name="Scenario Attendance" fill="#4ade80" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={() => setSelectedProductId(null)}>
              Back
            </Button>
            <Button onClick={handleExportExcel} disabled={!selectedProductId || !activeScenario}>
              Export Comparison
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProductScenario; 
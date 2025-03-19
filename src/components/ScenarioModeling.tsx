import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { PlusCircle, Trash2, Save, PieChart, Edit, ChevronDown, ChevronUp, Plus, Copy, BarChart, ArrowUpDown } from 'lucide-react';
import { Slider } from './ui/slider';
import { PieChart as RechartsChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import useStore from '../store/useStore';
import { formatCurrency, formatPercent } from '../lib/utils';
import type { Scenario, ScenarioParameter, VariableSensitivity } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Colors for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const SCENARIO_TYPES = ['Base Case', 'Best Case', 'Worst Case', 'Custom'] as const;

function ScenarioModelingComponent() {
  const { products, currentProductId, addScenario, updateScenario, deleteScenario } = useStore();
  const currentProduct = products.find(p => p.info.id === currentProductId);
  
  const [activeView, setActiveView] = useState<'overview' | 'comparison' | 'sensitivity'>('overview');
  const [showNewScenario, setShowNewScenario] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [compareScenarioIds, setCompareScenarioIds] = useState<string[]>([]);
  const [showParameterForm, setShowParameterForm] = useState(false);
  const [showSensitivityForm, setShowSensitivityForm] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Scenario>>({
    name: '',
    description: '',
    type: 'Custom',
    assumptions: [],
    projectedRevenue: 0,
    projectedCosts: 0,
    projectedProfit: 0,
    probabilityOfOccurrence: 50, // Default 50%
    riskFactors: [],
    parameters: [],
    sensitivities: [],
    notes: ''
  });
  
  const [currentAssumption, setCurrentAssumption] = useState('');
  const [currentRiskFactor, setCurrentRiskFactor] = useState('');
  const [currentParameter, setCurrentParameter] = useState<Partial<ScenarioParameter>>({
    name: '',
    baseValue: 0,
    adjustedValue: 0,
    unit: '',
    description: ''
  });
  const [currentSensitivity, setCurrentSensitivity] = useState<Partial<VariableSensitivity>>({
    variable: '',
    baseValue: 0,
    lowValue: 0,
    highValue: 0,
    impact: 'Medium'
  });
  
  useEffect(() => {
    // Calculate projected profit when revenue or costs change
    if (formData.projectedRevenue !== undefined && formData.projectedCosts !== undefined) {
      setFormData(prev => ({
        ...prev,
        projectedProfit: formData.projectedRevenue - formData.projectedCosts
      }));
    }
  }, [formData.projectedRevenue, formData.projectedCosts]);
  
  if (!currentProduct) {
    return (
      <div className="text-center py-8 text-gray-500">
        No product selected or product not found.
      </div>
    );
  }
  
  const scenarios = currentProduct.scenarios || [];
  
  const handleInputChange = (field: keyof Scenario, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleAddAssumption = () => {
    if (!currentAssumption.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      assumptions: [...(prev.assumptions || []), currentAssumption.trim()]
    }));
    
    setCurrentAssumption('');
  };
  
  const handleRemoveAssumption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      assumptions: prev.assumptions?.filter((_, i) => i !== index)
    }));
  };
  
  const handleAddRiskFactor = () => {
    if (!currentRiskFactor.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      riskFactors: [...(prev.riskFactors || []), currentRiskFactor.trim()]
    }));
    
    setCurrentRiskFactor('');
  };
  
  const handleRemoveRiskFactor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      riskFactors: prev.riskFactors?.filter((_, i) => i !== index)
    }));
  };
  
  const handleParameterInputChange = (field: keyof ScenarioParameter, value: unknown) => {
    setCurrentParameter(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleAddParameter = () => {
    if (!currentParameter.name) return;
    
    setFormData(prev => ({
      ...prev,
      parameters: [...(prev.parameters || []), currentParameter as ScenarioParameter]
    }));
    
    setCurrentParameter({
      name: '',
      baseValue: 0,
      adjustedValue: 0,
      unit: '',
      description: ''
    });
  };
  
  const handleRemoveParameter = (index: number) => {
    setFormData(prev => ({
      ...prev,
      parameters: prev.parameters?.filter((_, i) => i !== index) || []
    }));
  };
  
  const handleSensitivityInputChange = (field: keyof VariableSensitivity, value: unknown) => {
    setCurrentSensitivity(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleAddSensitivity = () => {
    if (!currentSensitivity.variable) return;
    
    setFormData(prev => ({
      ...prev,
      sensitivities: [...(prev.sensitivities || []), currentSensitivity as VariableSensitivity]
    }));
    
    setCurrentSensitivity({
      variable: '',
      baseValue: 0,
      lowValue: 0,
      highValue: 0,
      impact: 'Medium'
    });
  };
  
  const handleRemoveSensitivity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sensitivities: prev.sensitivities?.filter((_, i) => i !== index) || []
    }));
  };
  
  const handleSave = () => {
    if (!currentProduct || !formData.name || !formData.description) return;
    
    if (editingScenarioId) {
      // Update existing scenario
      updateScenario(
        currentProduct.info.id,
        editingScenarioId,
        formData as Partial<Scenario>
      );
    } else {
      // Add new scenario
      addScenario(
        currentProduct.info.id,
        {
          ...formData,
          id: '', // This will be replaced with a UUID in the store
          projectedProfit: (formData.projectedRevenue || 0) - (formData.projectedCosts || 0),
          createdAt: new Date(),
          updatedAt: new Date()
        } as Omit<Scenario, 'id'>
      );
    }
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      type: 'Custom',
      assumptions: [],
      projectedRevenue: 0,
      projectedCosts: 0,
      projectedProfit: 0,
      probabilityOfOccurrence: 50,
      riskFactors: [],
      parameters: [],
      sensitivities: [],
      notes: ''
    });
    setShowNewScenario(false);
    setEditingScenarioId(null);
    setShowParameterForm(false);
    setShowSensitivityForm(false);
  };
  
  const handleEdit = (scenario: Scenario) => {
    setFormData({ ...scenario });
    setEditingScenarioId(scenario.id);
    setShowNewScenario(true);
  };
  
  const handleDelete = (scenario: Scenario) => {
    if (window.confirm(`Are you sure you want to delete the scenario "${scenario.name}"?`)) {
      deleteScenario(currentProduct.info.id, scenario.id);
      // Also remove from comparison if selected
      setCompareScenarioIds(prev => prev.filter(id => id !== scenario.id));
    }
  };
  
  const handleDuplicate = (scenario: Scenario) => {
    addScenario(
      currentProduct.info.id,
      {
        ...scenario,
        id: '', // Will be replaced with a UUID
        name: `${scenario.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    );
  };
  
  const calculateTotalProbability = () => {
    return scenarios.reduce((sum, scenario) => sum + (scenario.probabilityOfOccurrence || 0), 0);
  };
  
  const toggleCompareScenario = (scenarioId: string) => {
    setCompareScenarioIds(prev => 
      prev.includes(scenarioId)
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };
  
  // Function to get scenarios to compare
  const getScenariosToCompare = () => {
    if (compareScenarioIds.length === 0 && scenarios.length > 0) {
      // If none selected, compare all scenarios (up to 4)
      return scenarios.slice(0, 4);
    }
    return scenarios.filter(s => compareScenarioIds.includes(s.id));
  };
  
  // Prepare data for charts
  const totalProbability = calculateTotalProbability();
  
  // Probability chart data
  const probabilityChartData = scenarios.map((scenario, index) => ({
    name: scenario.name,
    value: scenario.probabilityOfOccurrence,
    color: COLORS[index % COLORS.length]
  }));
  
  // Financial comparison chart data
  const financialChartData = scenarios.map((scenario, index) => ({
    name: scenario.name,
    value: scenario.projectedProfit || (scenario.projectedRevenue - scenario.projectedCosts),
    revenue: scenario.projectedRevenue,
    costs: scenario.projectedCosts,
    color: COLORS[index % COLORS.length]
  }));
  
  // Comparison data for selected scenarios
  const comparisonData = getScenariosToCompare();
  const comparisonChartData = [
    { name: 'Revenue', ...Object.fromEntries(comparisonData.map(s => [s.name, s.projectedRevenue])) },
    { name: 'Costs', ...Object.fromEntries(comparisonData.map(s => [s.name, s.projectedCosts])) },
    { name: 'Profit', ...Object.fromEntries(comparisonData.map(s => [s.name, s.projectedProfit || (s.projectedRevenue - s.projectedCosts)])) }
  ];
  
  // Sensitivity analysis data
  const sensitivityData = scenarios
    .flatMap(s => (s.sensitivities || []).map(sensitivity => ({
      scenario: s.name,
      ...sensitivity,
      range: sensitivity.highValue - sensitivity.lowValue,
      color: COLORS[scenarios.indexOf(s) % COLORS.length]
    })))
    .sort((a, b) => b.range - a.range); // Sort by range size
  
  return (
    <div className="space-y-6">
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'overview' | 'comparison' | 'sensitivity')}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center">
            <PieChart className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center">
            <BarChart className="h-4 w-4 mr-2" />
            Scenario Comparison
          </TabsTrigger>
          <TabsTrigger value="sensitivity" className="flex items-center">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Sensitivity Analysis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {scenarios.length > 0 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Scenario Probability Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsChart>
                          <Pie
                            data={probabilityChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {probabilityChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value}%`} />
                          <Legend />
                        </RechartsChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="mt-2 text-center text-sm text-muted-foreground">
                      {totalProbability > 100 ? (
                        <p className="text-red-500">
                          Warning: Total probability exceeds 100% ({totalProbability}%)
                        </p>
                      ) : totalProbability < 100 ? (
                        <p className="text-yellow-500">
                          Note: Total probability is {totalProbability}% (ideally should sum to 100%)
                        </p>
                      ) : (
                        <p className="text-green-500">
                          Total probability: 100%
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Outcomes by Scenario</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsChart>
                          <Pie
                            data={financialChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                          >
                            {financialChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Legend />
                        </RechartsChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="comparison">
          {comparisonData.length > 0 ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Scenario Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={comparisonChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        {comparisonData.map((scenario, index) => (
                          <Bar 
                            key={scenario.id} 
                            dataKey={scenario.name} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[15%]">Metric</TableHead>
                          {comparisonData.map(scenario => (
                            <TableHead key={scenario.id}>{scenario.name}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Type</TableCell>
                          {comparisonData.map(scenario => (
                            <TableCell key={`type-${scenario.id}`}>{scenario.type}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Revenue</TableCell>
                          {comparisonData.map(scenario => (
                            <TableCell key={`revenue-${scenario.id}`}>{formatCurrency(scenario.revenue)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Costs</TableCell>
                          {comparisonData.map(scenario => (
                            <TableCell key={`costs-${scenario.id}`}>{formatCurrency(scenario.costs)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Profit</TableCell>
                          {comparisonData.map(scenario => (
                            <TableCell 
                              key={`profit-${scenario.id}`}
                              className={
                                (scenario.profit || (scenario.revenue - scenario.costs)) >= 0 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }
                            >
                              {formatCurrency(scenario.profit || (scenario.revenue - scenario.costs))}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Probability</TableCell>
                          {comparisonData.map(scenario => (
                            <TableCell key={`prob-${scenario.id}`}>{scenario.value}%</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Assumptions</TableCell>
                          {comparisonData.map(scenario => (
                            <TableCell key={`assume-${scenario.id}`} className="text-sm">
                              {scenario.assumptions && scenario.assumptions.length > 0 
                                ? scenario.assumptions.join(', ') 
                                : 'None'}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Risk Factors</TableCell>
                          {comparisonData.map(scenario => (
                            <TableCell key={`risk-${scenario.id}`} className="text-sm">
                              {scenario.riskFactors && scenario.riskFactors.length > 0 
                                ? scenario.riskFactors.join(', ') 
                                : 'None'}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <BarChart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Scenarios to Compare</h3>
              <p className="text-gray-500 mb-4">
                Create at least two scenarios to enable comparison.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="sensitivity">
          {sensitivityData.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Sensitivity Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 text-sm text-muted-foreground">
                  This analysis shows how changes in key variables affect your scenarios' outcomes.
                  Variables with wider ranges have a higher impact on results.
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scenario</TableHead>
                        <TableHead>Variable</TableHead>
                        <TableHead>Base Value</TableHead>
                        <TableHead>Low Value</TableHead>
                        <TableHead>High Value</TableHead>
                        <TableHead>Range</TableHead>
                        <TableHead>Impact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sensitivityData.map((item, index) => (
                        <TableRow key={`sensitivity-${index}`}>
                          <TableCell>{item.scenario}</TableCell>
                          <TableCell>{item.variable}</TableCell>
                          <TableCell>{item.baseValue}</TableCell>
                          <TableCell>{item.lowValue}</TableCell>
                          <TableCell>{item.highValue}</TableCell>
                          <TableCell>
                            <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden">
                              <div 
                                className="h-4 rounded-full" 
                                style={{ 
                                  width: `${Math.min(100, (item.range / (sensitivityData[0]?.range || 1)) * 100)}%`,
                                  backgroundColor: item.color
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.impact === 'High' 
                                ? 'bg-red-100 text-red-800' 
                                : item.impact === 'Medium'
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-green-100 text-green-800'
                            }`}>
                              {item.impact}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <ArrowUpDown className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Sensitivity Data</h3>
              <p className="text-gray-500 mb-4">
                Add sensitivity variables to your scenarios to enable analysis.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Scenario Modeling</CardTitle>
          <Button onClick={() => setShowNewScenario(true)} disabled={showNewScenario}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Scenario
          </Button>
        </CardHeader>
        <CardContent>
          {showNewScenario ? (
            <div className="border rounded-lg p-4 mb-4 bg-white">
              <h3 className="text-lg font-medium mb-4">
                {editingScenarioId ? 'Edit Scenario' : 'Create New Scenario'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="scenario-name">Scenario Name</Label>
                  <Input
                    id="scenario-name"
                    value={formData.name || ''}
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Base Case, Best Case, Worst Case"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scenario-type">Scenario Type</Label>
                  <Select
                    value={formData.type || 'Custom'}
                    onValueChange={(value) => handleInputChange('type', value)}
                  >
                    <SelectTrigger id="scenario-type">
                      <SelectValue placeholder="Select scenario type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCENARIO_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="scenario-probability">Probability of Occurrence (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Slider
                      id="scenario-probability"
                      min={0}
                      max={100}
                      step={1}
                      value={[formData.probabilityOfOccurrence || 50]}
                      onValueChange={(value) => handleInputChange('probabilityOfOccurrence', value[0])}
                      className="flex-1"
                    />
                    <span className="w-12 text-right">{formData.probabilityOfOccurrence || 50}%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scenario-notes">Notes</Label>
                  <Input
                    id="scenario-notes"
                    value={formData.notes || ''}
                    onChange={e => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <Label htmlFor="scenario-description">Description</Label>
                <Textarea
                  id="scenario-description"
                  value={formData.description || ''}
                  onChange={e => handleInputChange('description', e.target.value)}
                  placeholder="Describe this scenario..."
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="scenario-revenue">Projected Revenue</Label>
                  <Input
                    id="scenario-revenue"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.projectedRevenue || 0}
                    onChange={e => handleInputChange('projectedRevenue', parseFloat(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scenario-costs">Projected Costs</Label>
                  <Input
                    id="scenario-costs"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.projectedCosts || 0}
                    onChange={e => handleInputChange('projectedCosts', parseFloat(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scenario-profit">Projected Profit</Label>
                  <Input
                    id="scenario-profit"
                    type="number"
                    disabled
                    value={formData.projectedProfit || (formData.projectedRevenue || 0) - (formData.projectedCosts || 0)}
                    className={
                      (formData.projectedRevenue || 0) - (formData.projectedCosts || 0) >= 0 
                        ? 'text-green-600 bg-green-50' 
                        : 'text-red-600 bg-red-50'
                    }
                  />
                </div>
              </div>
              
              {/* Assumptions and Risk Factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="mb-4">
                  <Label className="mb-2 block">Key Assumptions</Label>
                  <div className="flex mb-2">
                    <Input
                      value={currentAssumption}
                      onChange={e => setCurrentAssumption(e.target.value)}
                      placeholder="Add a key assumption..."
                      className="flex-1 mr-2"
                    />
                    <Button onClick={handleAddAssumption} type="button">Add</Button>
                  </div>
                  
                  {formData.assumptions && formData.assumptions.length > 0 ? (
                    <ul className="space-y-2 mt-2">
                      {formData.assumptions.map((assumption, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>{assumption}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAssumption(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">No assumptions added yet.</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <Label className="mb-2 block">Risk Factors</Label>
                  <div className="flex mb-2">
                    <Input
                      value={currentRiskFactor}
                      onChange={e => setCurrentRiskFactor(e.target.value)}
                      placeholder="Add a risk factor..."
                      className="flex-1 mr-2"
                    />
                    <Button onClick={handleAddRiskFactor} type="button">Add</Button>
                  </div>
                  
                  {formData.riskFactors && formData.riskFactors.length > 0 ? (
                    <ul className="space-y-2 mt-2">
                      {formData.riskFactors.map((risk, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>{risk}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRiskFactor(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">No risk factors added yet.</p>
                  )}
                </div>
              </div>
              
              {/* Advanced Settings */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Advanced Settings</h4>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowParameterForm(!showParameterForm)}
                    >
                      {showParameterForm ? 'Hide Parameters' : 'Show Parameters'}
                      {showParameterForm ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSensitivityForm(!showSensitivityForm)}
                    >
                      {showSensitivityForm ? 'Hide Sensitivity' : 'Show Sensitivity'}
                      {showSensitivityForm ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                {/* Parameters Form */}
                {showParameterForm && (
                  <div className="border p-4 rounded-lg mb-4">
                    <h5 className="font-medium mb-2">Custom Parameters</h5>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add custom parameters to track in this scenario. These can be used for more detailed modeling.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
                      <div>
                        <Label htmlFor="param-name" className="text-xs">Name</Label>
                        <Input
                          id="param-name"
                          value={currentParameter.name || ''}
                          onChange={e => handleParameterInputChange('name', e.target.value)}
                          placeholder="Parameter name"
                          size="sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="param-base" className="text-xs">Base Value</Label>
                        <Input
                          id="param-base"
                          type="number"
                          value={currentParameter.baseValue || 0}
                          onChange={e => handleParameterInputChange('baseValue', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="param-adjusted" className="text-xs">Adjusted Value</Label>
                        <Input
                          id="param-adjusted"
                          type="number"
                          value={currentParameter.adjustedValue || 0}
                          onChange={e => handleParameterInputChange('adjustedValue', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="param-unit" className="text-xs">Unit</Label>
                        <Input
                          id="param-unit"
                          value={currentParameter.unit || ''}
                          onChange={e => handleParameterInputChange('unit', e.target.value)}
                          placeholder="Unit (e.g. %)"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={handleAddParameter} className="w-full" disabled={!currentParameter.name}>
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-2">
                      <Label htmlFor="param-desc" className="text-xs">Description (Optional)</Label>
                      <Input
                        id="param-desc"
                        value={currentParameter.description || ''}
                        onChange={e => handleParameterInputChange('description', e.target.value)}
                        placeholder="Brief description of what this parameter represents"
                      />
                    </div>
                    
                    {formData.parameters && formData.parameters.length > 0 ? (
                      <div className="mt-4">
                        <h6 className="font-medium text-sm mb-2">Added Parameters</h6>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Base Value</TableHead>
                                <TableHead>Adjusted Value</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {formData.parameters.map((param, index) => (
                                <TableRow key={`param-${index}`}>
                                  <TableCell className="font-medium">{param.name}</TableCell>
                                  <TableCell>{param.baseValue}</TableCell>
                                  <TableCell>{param.adjustedValue}</TableCell>
                                  <TableCell>{param.unit}</TableCell>
                                  <TableCell className="text-xs">{param.description}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveParameter(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-4">No parameters added yet.</p>
                    )}
                  </div>
                )}
                
                {/* Sensitivity Analysis Form */}
                {showSensitivityForm && (
                  <div className="border p-4 rounded-lg mb-4">
                    <h5 className="font-medium mb-2">Sensitivity Analysis</h5>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add variables to test how changes affect your model. This helps identify which factors have the most impact.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
                      <div>
                        <Label htmlFor="sens-variable" className="text-xs">Variable</Label>
                        <Input
                          id="sens-variable"
                          value={currentSensitivity.variable || ''}
                          onChange={e => handleSensitivityInputChange('variable', e.target.value)}
                          placeholder="Variable name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="sens-base" className="text-xs">Base Value</Label>
                        <Input
                          id="sens-base"
                          type="number"
                          value={currentSensitivity.baseValue || 0}
                          onChange={e => handleSensitivityInputChange('baseValue', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sens-low" className="text-xs">Low Value</Label>
                        <Input
                          id="sens-low"
                          type="number"
                          value={currentSensitivity.lowValue || 0}
                          onChange={e => handleSensitivityInputChange('lowValue', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sens-high" className="text-xs">High Value</Label>
                        <Input
                          id="sens-high"
                          type="number"
                          value={currentSensitivity.highValue || 0}
                          onChange={e => handleSensitivityInputChange('highValue', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={handleAddSensitivity} className="w-full" disabled={!currentSensitivity.variable}>
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <Label htmlFor="sens-impact" className="text-xs">Impact Level</Label>
                      <Select
                        value={currentSensitivity.impact as string || 'Medium'}
                        onValueChange={(value) => handleSensitivityInputChange('impact', value)}
                      >
                        <SelectTrigger id="sens-impact">
                          <SelectValue placeholder="Select impact level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.sensitivities && formData.sensitivities.length > 0 ? (
                      <div className="mt-4">
                        <h6 className="font-medium text-sm mb-2">Added Sensitivity Variables</h6>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Variable</TableHead>
                                <TableHead>Base</TableHead>
                                <TableHead>Low</TableHead>
                                <TableHead>High</TableHead>
                                <TableHead>Impact</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {formData.sensitivities.map((sensitivity, index) => (
                                <TableRow key={`sensitivity-${index}`}>
                                  <TableCell className="font-medium">{sensitivity.variable}</TableCell>
                                  <TableCell>{sensitivity.baseValue}</TableCell>
                                  <TableCell>{sensitivity.lowValue}</TableCell>
                                  <TableCell>{sensitivity.highValue}</TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      sensitivity.impact === 'High' 
                                        ? 'bg-red-100 text-red-800' 
                                        : sensitivity.impact === 'Medium'
                                          ? 'bg-amber-100 text-amber-800' 
                                          : 'bg-green-100 text-green-800'
                                    }`}>
                                      {sensitivity.impact}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveSensitivity(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-4">No sensitivity variables added yet.</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setShowNewScenario(false);
                  setEditingScenarioId(null);
                  setShowParameterForm(false);
                  setShowSensitivityForm(false);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!formData.name || !formData.description}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingScenarioId ? 'Update Scenario' : 'Save Scenario'}
                </Button>
              </div>
            </div>
          ) : null}
          
          {/* Scenarios List */}
          {scenarios.length === 0 ? (
            <div className="text-center py-12">
              <PieChart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Scenarios Created</h3>
              <p className="text-gray-500 mb-4">
                Create different scenarios to model potential outcomes for your product.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px]"></TableHead>
                    <TableHead className="w-[15%]">Scenario</TableHead>
                    <TableHead className="w-[20%]">Description</TableHead>
                    <TableHead className="w-[10%]">Type</TableHead>
                    <TableHead className="w-[10%]">Probability</TableHead>
                    <TableHead className="w-[12%]">Revenue</TableHead>
                    <TableHead className="w-[12%]">Profit/Loss</TableHead>
                    <TableHead className="w-[12%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scenarios.map(scenario => (
                    <TableRow 
                      key={scenario.id}
                      className={compareScenarioIds.includes(scenario.id) ? 'bg-blue-50' : undefined}
                    >
                      <TableCell>
                        <input 
                          type="checkbox" 
                          checked={compareScenarioIds.includes(scenario.id)} 
                          onChange={() => toggleCompareScenario(scenario.id)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{scenario.name}</TableCell>
                      <TableCell className="max-w-[250px] truncate">
                        {scenario.description}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          scenario.type === 'Best Case' 
                            ? 'bg-green-100 text-green-800' 
                            : scenario.type === 'Worst Case'
                              ? 'bg-red-100 text-red-800' 
                              : scenario.type === 'Base Case'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}>
                          {scenario.type}
                        </span>
                      </TableCell>
                      <TableCell>{scenario.probabilityOfOccurrence}%</TableCell>
                      <TableCell>{formatCurrency(scenario.projectedRevenue)}</TableCell>
                      <TableCell className={
                        (scenario.projectedProfit || (scenario.projectedRevenue - scenario.projectedCosts)) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }>
                        {formatCurrency(scenario.projectedProfit || (scenario.projectedRevenue - scenario.projectedCosts))}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(scenario)} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDuplicate(scenario)} title="Duplicate">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(scenario)} title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Comparison Instructions */}
              {scenarios.length > 1 && (
                <div className="mt-3 text-sm text-muted-foreground border-t pt-3">
                  Select scenarios using the checkboxes to compare them, then switch to the "Scenario Comparison" tab.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ScenarioModelingComponent; 
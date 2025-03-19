import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Save } from 'lucide-react';
import useStore from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import type { SeasonalAnalysis } from '../types';

function SeasonalAnalysisComponent() {
  const { products, currentProductId, updateSeasonalAnalysis } = useStore();
  const currentProduct = products.find(p => p.info.id === currentProductId);
  
  const [seasonalData, setSeasonalData] = useState<SeasonalAnalysis[]>([
    { quarter: 'Q1', seasonalImpactFactor: 1.0, projectedRevenue: 0, projectedCosts: 0, notes: '' },
    { quarter: 'Q2', seasonalImpactFactor: 1.0, projectedRevenue: 0, projectedCosts: 0, notes: '' },
    { quarter: 'Q3', seasonalImpactFactor: 1.0, projectedRevenue: 0, projectedCosts: 0, notes: '' },
    { quarter: 'Q4', seasonalImpactFactor: 1.0, projectedRevenue: 0, projectedCosts: 0, notes: '' }
  ]);
  
  const [isDirty, setIsDirty] = useState(false);
  
  useEffect(() => {
    if (currentProduct?.seasonalAnalysis) {
      setSeasonalData(currentProduct.seasonalAnalysis);
    }
  }, [currentProduct]);
  
  if (!currentProduct) {
    return (
      <div className="text-center py-8 text-gray-500">
        No product selected or product not found.
      </div>
    );
  }
  
  const handleInputChange = (index: number, field: keyof SeasonalAnalysis, value: unknown) => {
    const newData = [...seasonalData];
    newData[index] = { ...newData[index], [field]: value };
    
    // Auto-calculate projected revenue based on impact factor
    if (field === 'seasonalImpactFactor') {
      // Base this on average weekly revenue from projections if available
      const avgQuarterlyRevenue = calculateAverageQuarterlyRevenue();
      newData[index].projectedRevenue = avgQuarterlyRevenue * value;
    }
    
    setSeasonalData(newData);
    setIsDirty(true);
  };
  
  const calculateAverageQuarterlyRevenue = () => {
    if (!currentProduct.weeklyProjections || currentProduct.weeklyProjections.length === 0) {
      return 10000; // Default value if no projections
    }
    
    const totalRevenue = currentProduct.weeklyProjections.reduce(
      (sum, proj) => sum + proj.totalRevenue, 0
    );
    
    // Assuming 13 weeks per quarter
    return (totalRevenue / currentProduct.weeklyProjections.length) * 13;
  };
  
  const handleSave = () => {
    if (!currentProduct) return;
    
    updateSeasonalAnalysis(currentProduct.info.id, seasonalData);
    setIsDirty(false);
  };
  
  const totalAnnualRevenue = seasonalData.reduce((sum, q) => sum + q.projectedRevenue, 0);
  const totalAnnualCosts = seasonalData.reduce((sum, q) => sum + q.projectedCosts, 0);
  const annualProfit = totalAnnualRevenue - totalAnnualCosts;
  
  const chartData = seasonalData.map(q => ({
    quarter: q.quarter,
    revenue: q.projectedRevenue,
    costs: q.projectedCosts,
    profit: q.projectedRevenue - q.projectedCosts,
    impactFactor: q.seasonalImpactFactor
  }));
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(totalAnnualRevenue)}</div>
            <div className="text-sm text-muted-foreground">Annual Revenue</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(totalAnnualCosts)}</div>
            <div className="text-sm text-muted-foreground">Annual Costs</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className={`text-2xl font-bold ${annualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(annualProfit)}
            </div>
            <div className="text-sm text-muted-foreground">Annual Profit</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quarterly Financial Projections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#4f46e5" />
                  <Bar dataKey="costs" name="Costs" fill="#ef4444" />
                  <Bar dataKey="profit" name="Profit" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Seasonal Impact Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis domain={[0, 'dataMax + 0.5']} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="impactFactor" 
                    name="Seasonal Impact" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quarterly Analysis</CardTitle>
          <Button onClick={handleSave} disabled={!isDirty}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quarter</TableHead>
                <TableHead>Seasonal Impact Factor</TableHead>
                <TableHead>Projected Revenue</TableHead>
                <TableHead>Projected Costs</TableHead>
                <TableHead>Projected Profit</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seasonalData.map((quarter, index) => (
                <TableRow key={quarter.quarter}>
                  <TableCell className="font-medium">{quarter.quarter}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={quarter.seasonalImpactFactor}
                      onChange={(e) => handleInputChange(index, 'seasonalImpactFactor', parseFloat(e.target.value))}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="1000"
                      min="0"
                      value={quarter.projectedRevenue}
                      onChange={(e) => handleInputChange(index, 'projectedRevenue', parseFloat(e.target.value))}
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="1000"
                      min="0"
                      value={quarter.projectedCosts}
                      onChange={(e) => handleInputChange(index, 'projectedCosts', parseFloat(e.target.value))}
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell className={`font-medium ${quarter.projectedRevenue - quarter.projectedCosts >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(quarter.projectedRevenue - quarter.projectedCosts)}
                  </TableCell>
                  <TableCell>
                    <Textarea
                      value={quarter.notes}
                      onChange={(e) => handleInputChange(index, 'notes', e.target.value)}
                      className="min-h-[80px]"
                      placeholder="Add notes about seasonal factors..."
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default SeasonalAnalysisComponent; 
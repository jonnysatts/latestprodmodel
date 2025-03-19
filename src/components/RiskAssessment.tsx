import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { PlusCircle, Pencil, Trash2, Save, X, AlertTriangle, Filter, BarChart } from 'lucide-react';
import useStore from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import type { Product, RiskAssessment as RiskAssessmentType, LikelihoodLevel, ImpactLevel, StatusOption } from '../types';
import { RISK_TYPES, LIKELIHOOD_LEVELS, IMPACT_LEVELS, STATUS_OPTIONS } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import RiskMatrix from './RiskMatrix';

function RiskAssessment() {
  const { products, currentProductId, addRiskAssessment, updateRiskAssessment, deleteRiskAssessment } = useStore();
  const currentProduct = products.find(p => p.info.id === currentProductId);

  const [showNewRisk, setShowNewRisk] = useState(false);
  const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'matrix'>('table');
  const [filteredLikelihood, setFilteredLikelihood] = useState<LikelihoodLevel | null>(null);
  const [filteredImpact, setFilteredImpact] = useState<ImpactLevel | null>(null);
  const [formData, setFormData] = useState<Partial<RiskAssessmentType>>({
    type: 'Revenue',
    description: '',
    likelihood: 'Low',
    impact: 'Low',
    financialImpact: 0,
    mitigationStrategy: '',
    owner: '',
    status: 'Open',
    riskScore: 1 // Default score (low likelihood * low impact)
  });

  if (!currentProduct) {
    return (
      <div className="text-center py-8 text-gray-500">
        No product selected or product not found.
      </div>
    );
  }

  const handleInputChange = (field: keyof RiskAssessmentType, value: string | number) => {
    setFormData((prev: Partial<RiskAssessmentType>) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLikelihoodChange = (value: string) => {
    handleInputChange('likelihood', value as LikelihoodLevel);
  };

  const handleImpactChange = (value: string) => {
    handleInputChange('impact', value as ImpactLevel);
  };

  const handleStatusChange = (value: string) => {
    handleInputChange('status', value as StatusOption);
  };

  const handleTypeChange = (value: string) => {
    handleInputChange('type', value);
  };

  const handleFilterTypeChange = (value: string | null) => {
    setFilterType(value);
  };

  const handleFilterStatusChange = (value: string | null) => {
    setFilterStatus(value);
  };

  const handleFilterLikelihoodChange = (e: React.SyntheticEvent<HTMLSelectElement>) => {
    const target = e.target as HTMLSelectElement;
    setFilteredLikelihood(target.value === 'All' ? null : target.value as LikelihoodLevel);
  };

  const handleFilterImpactChange = (e: React.SyntheticEvent<HTMLSelectElement>) => {
    const target = e.target as HTMLSelectElement;
    setFilteredImpact(target.value === 'All' ? null : target.value as ImpactLevel);
  };

  const handleFinancialImpactChange = (value: string) => {
    handleInputChange('financialImpact', parseFloat(value) || 0);
  };

  const handleSave = () => {
    if (!currentProduct) return;

    if (editingRiskId) {
      // Update existing risk
      updateRiskAssessment(
        currentProduct.info.id,
        editingRiskId,
        formData as Partial<RiskAssessmentType>
      );
    } else {
      // Add new risk
      addRiskAssessment(
        currentProduct.info.id,
        formData as Omit<RiskAssessmentType, 'id'>
      );
    }

    // Reset form
    setShowNewRisk(false);
    setEditingRiskId(null);
    setFormData({
      type: 'Revenue',
      description: '',
      likelihood: 'Low',
      impact: 'Low',
      financialImpact: 0,
      mitigationStrategy: '',
      owner: '',
      status: 'Open',
      riskScore: 1
    });
  };

  const handleEdit = (risk: RiskAssessmentType) => {
    setFormData({ ...risk });
    setEditingRiskId(risk.id);
    setShowNewRisk(true);
  };

  const handleDelete = (riskId: string) => {
    if (window.confirm('Are you sure you want to delete this risk?')) {
      deleteRiskAssessment(currentProduct.info.id, riskId);
    }
  };

  const handleCancel = () => {
    setShowNewRisk(false);
    setEditingRiskId(null);
    setFormData({
      type: 'Revenue',
      description: '',
      likelihood: 'Low',
      impact: 'Low',
      financialImpact: 0,
      mitigationStrategy: '',
      owner: '',
      status: 'Open',
      riskScore: 1
    });
  };

  // Filter risks based on selected filters
  const filteredRisks = currentProduct.risks.filter(risk => {
    // Apply type filter
    if (filterType && risk.type !== filterType) return false;
    
    // Apply status filter
    if (filterStatus && risk.status !== filterStatus) return false;
    
    // Apply matrix cell filter if selected
    if (filteredLikelihood && filteredImpact) {
      if (risk.likelihood !== filteredLikelihood || risk.impact !== filteredImpact) return false;
    }
    
    return true;
  });

  const handleMatrixCellClick = (likelihood: LikelihoodLevel, impact: ImpactLevel) => {
    setFilteredLikelihood(likelihood);
    setFilteredImpact(impact);
    setViewMode('table');
  };

  // Calculate risk metrics
  const totalRisks = currentProduct.risks.length;
  const highRisks = currentProduct.risks.filter(r => r.riskScore >= 6).length;
  const mediumRisks = currentProduct.risks.filter(r => r.riskScore >= 3 && r.riskScore < 6).length;
  const lowRisks = currentProduct.risks.filter(r => r.riskScore < 3).length;
  
  const totalFinancialImpact = currentProduct.risks.reduce((sum, risk) => sum + risk.financialImpact, 0);
  const highRiskFinancialImpact = currentProduct.risks
    .filter(r => r.riskScore >= 6)
    .reduce((sum, risk) => sum + risk.financialImpact, 0);

  // Helper functions for risk scores
  const getRiskScoreColor = (score: number) => {
    if (score >= 6) return 'bg-red-100 text-red-800';
    if (score >= 3) return 'bg-amber-100 text-amber-800';
    return 'bg-green-100 text-green-800';
  };

  const getRiskScoreText = (score: number) => {
    if (score >= 6) return 'High';
    if (score >= 3) return 'Medium';
    return 'Low';
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between bg-slate-50">
          <CardTitle>Risk Assessment</CardTitle>
          <div className="flex space-x-2">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'matrix')}>
              <TabsList>
                <TabsTrigger value="table" className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Table View
                </TabsTrigger>
                <TabsTrigger value="matrix" className="flex items-center">
                  <BarChart className="h-4 w-4 mr-2" />
                  Risk Matrix
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setShowNewRisk(true);
                setEditingRiskId(null);
                setFormData({
                  type: 'Revenue',
                  description: '',
                  likelihood: 'Low',
                  impact: 'Low',
                  financialImpact: 0,
                  mitigationStrategy: '',
                  owner: '',
                  status: 'Open',
                  riskScore: 1
                });
              }}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Risk
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Filter controls */}
            <div className="flex flex-wrap gap-4 bg-slate-50 p-4 rounded-lg">
              <div className="w-full md:w-auto">
                <Label htmlFor="filterType">Filter by Type</Label>
                <Select 
                  value={filterType || 'all'} 
                  onValueChange={(value) => setFilterType(value === 'all' ? null : value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {RISK_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-auto">
                <Label htmlFor="filterStatus">Filter by Status</Label>
                <Select 
                  value={filterStatus || 'all'} 
                  onValueChange={(value) => setFilterStatus(value === 'all' ? null : value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-auto flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilterType(null);
                    setFilterStatus(null);
                    setFilteredLikelihood(null);
                    setFilteredImpact(null);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
              
              {/* Show active matrix filter if any */}
              {filteredLikelihood && filteredImpact && (
                <div className="w-full flex items-center mt-2">
                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                    Filtered by: {filteredLikelihood} Likelihood + {filteredImpact} Impact
                    <Button
                      variant="ghost" 
                      size="sm" 
                      className="ml-2 h-5 w-5 p-0"
                      onClick={() => {
                        setFilteredLikelihood(null);
                        setFilteredImpact(null);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </span>
                </div>
              )}
            </div>

            {/* Conditional rendering based on view mode */}
            {viewMode === 'matrix' ? (
              <RiskMatrix 
                risks={currentProduct.risks} 
                onSelectCell={handleMatrixCellClick} 
              />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalRisks}</div>
                      <p className="text-xs text-muted-foreground">
                        across {Object.keys(RISK_TYPES).length} categories
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">High Risks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {highRisks}
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          ({totalRisks > 0 ? Math.round((highRisks / totalRisks) * 100) : 0}%)
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {highRisks > 0 ? 'requiring immediate attention' : 'no high risks detected'}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Risk Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className="bg-red-100 h-2 rounded-full" style={{ width: `${totalRisks > 0 ? (highRisks / totalRisks) * 100 : 0}%` }}></div>
                        <div className="bg-amber-100 h-2 rounded-full" style={{ width: `${totalRisks > 0 ? (mediumRisks / totalRisks) * 100 : 0}%` }}></div>
                        <div className="bg-green-100 h-2 rounded-full" style={{ width: `${totalRisks > 0 ? (lowRisks / totalRisks) * 100 : 0}%` }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>High: {highRisks}</span>
                        <span>Medium: {mediumRisks}</span>
                        <span>Low: {lowRisks}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Financial Impact</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(totalFinancialImpact)}</div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(highRiskFinancialImpact)} from high risk items
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Show form for adding/editing risks */}
                {showNewRisk && (
                  <div className="border rounded-lg p-4 mb-4 bg-white">
                    <h3 className="text-lg font-medium mb-4">
                      {editingRiskId ? 'Edit Risk' : 'Add New Risk'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="risk-type">Risk Type</Label>
                        <Select
                          value={formData.type as string}
                          onValueChange={(value) => handleInputChange('type', value)}
                        >
                          <SelectTrigger id="risk-type">
                            <SelectValue placeholder="Select risk type" />
                          </SelectTrigger>
                          <SelectContent>
                            {RISK_TYPES.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="risk-owner">Risk Owner</Label>
                        <Input
                          id="risk-owner"
                          value={formData.owner || ''}
                          onChange={(e) => handleInputChange('owner', e.target.value)}
                          placeholder="Who is responsible for this risk?"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <Label htmlFor="risk-description">Description</Label>
                      <Textarea
                        id="risk-description"
                        value={formData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe the risk..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="risk-likelihood">Likelihood</Label>
                        <Select
                          value={formData.likelihood as string}
                          onValueChange={(value) => handleInputChange('likelihood', value)}
                        >
                          <SelectTrigger id="risk-likelihood">
                            <SelectValue placeholder="Select likelihood" />
                          </SelectTrigger>
                          <SelectContent>
                            {LIKELIHOOD_LEVELS.map(level => (
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="risk-impact">Impact</Label>
                        <Select
                          value={formData.impact as string}
                          onValueChange={(value) => handleInputChange('impact', value)}
                        >
                          <SelectTrigger id="risk-impact">
                            <SelectValue placeholder="Select impact" />
                          </SelectTrigger>
                          <SelectContent>
                            {IMPACT_LEVELS.map(level => (
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="financial-impact">Financial Impact ($)</Label>
                        <Input
                          id="financial-impact"
                          type="number"
                          value={formData.financialImpact || 0}
                          onChange={(e) => handleInputChange('financialImpact', parseFloat(e.target.value))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="risk-mitigation">Mitigation Strategy</Label>
                        <Textarea
                          id="risk-mitigation"
                          value={formData.mitigationStrategy || ''}
                          onChange={(e) => handleInputChange('mitigationStrategy', e.target.value)}
                          placeholder="How will this risk be mitigated?"
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="risk-status">Status</Label>
                        <Select
                          value={formData.status as string}
                          onValueChange={(value) => handleInputChange('status', value)}
                        >
                          <SelectTrigger id="risk-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(status => (
                              <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <div className="mt-6 flex items-center">
                          <div className="text-sm mr-2">Risk Score:</div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            getRiskScoreColor(
                              (formData.likelihood === 'Low' ? 1 : formData.likelihood === 'Medium' ? 2 : 3) * 
                              (formData.impact === 'Low' ? 1 : formData.impact === 'Medium' ? 2 : 3)
                            )
                          }`}>
                            {getRiskScoreText(
                              (formData.likelihood === 'Low' ? 1 : formData.likelihood === 'Medium' ? 2 : 3) * 
                              (formData.impact === 'Low' ? 1 : formData.impact === 'Medium' ? 2 : 3)
                            )}
                            {' '}
                            ({(formData.likelihood === 'Low' ? 1 : formData.likelihood === 'Medium' ? 2 : 3) * 
                            (formData.impact === 'Low' ? 1 : formData.impact === 'Medium' ? 2 : 3)})
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        {editingRiskId ? 'Update Risk' : 'Add Risk'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Table of risks */}
                {filteredRisks.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-lg border">
                    <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <h3 className="text-lg font-medium">No risks found</h3>
                    <p className="text-muted-foreground">
                      {currentProduct.risks.length === 0 
                        ? 'Start by adding a risk assessment for this product.' 
                        : 'Adjust your filters to see more results.'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Risk</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Likelihood</TableHead>
                          <TableHead>Impact</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Financial Impact</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRisks.map(risk => (
                          <TableRow key={risk.id}>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {risk.description}
                            </TableCell>
                            <TableCell>{risk.type}</TableCell>
                            <TableCell>{risk.owner}</TableCell>
                            <TableCell>{risk.likelihood}</TableCell>
                            <TableCell>{risk.impact}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                getRiskScoreColor(risk.riskScore)
                              }`}>
                                {risk.riskScore}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                risk.status === 'Open' 
                                  ? 'bg-blue-100 text-blue-800'
                                  : risk.status === 'Mitigated'
                                    ? 'bg-green-100 text-green-800'
                                    : risk.status === 'Closed'
                                      ? 'bg-gray-100 text-gray-800'
                                      : 'bg-purple-100 text-purple-800'
                              }`}>
                                {risk.status}
                              </span>
                            </TableCell>
                            <TableCell>{formatCurrency(risk.financialImpact)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEdit(risk)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDelete(risk.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RiskAssessment;
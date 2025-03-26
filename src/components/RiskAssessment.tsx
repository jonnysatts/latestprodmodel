import React, { useState, useEffect } from 'react';
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

  // Effect to reset to table view when adding a new risk
  useEffect(() => {
    if (showNewRisk) {
      setViewMode('table');
    }
  }, [showNewRisk]);

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
    setFilterType(value === 'all' ? null : value);
  };

  const handleFilterStatusChange = (value: string | null) => {
    setFilterStatus(value === 'all' ? null : value);
  };

  const handleFilterLikelihoodChange = (e: any) => {
    setFilteredLikelihood(e.target.value === 'All' ? null : e.target.value as LikelihoodLevel);
  };

  const handleFilterImpactChange = (e: any) => {
    setFilteredImpact(e.target.value === 'All' ? null : e.target.value as ImpactLevel);
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
        {
          ...formData,
          riskScore: (formData.likelihood === 'Low' ? 1 : formData.likelihood === 'Medium' ? 2 : 3) * 
                    (formData.impact === 'Low' ? 1 : formData.impact === 'Medium' ? 2 : 3)
        }
      );
    } else {
      // Add new risk
      addRiskAssessment(
        currentProduct.info.id,
        {
          ...formData,
          riskScore: (formData.likelihood === 'Low' ? 1 : formData.likelihood === 'Medium' ? 2 : 3) * 
                    (formData.impact === 'Low' ? 1 : formData.impact === 'Medium' ? 2 : 3)
        } as Omit<RiskAssessmentType, 'id'>
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
            <div className="flex items-center space-x-2 rounded-md bg-muted p-1">
              <Button 
                variant={viewMode === 'table' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setViewMode('table')}
                className="flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Table View
              </Button>
              <Button 
                variant={viewMode === 'matrix' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setViewMode('matrix')}
                className="flex items-center"
              >
                <BarChart className="h-4 w-4 mr-2" />
                Risk Matrix
              </Button>
            </div>
            
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
                  onValueChange={(value: string) => handleFilterTypeChange(value)}
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
                  onValueChange={(value: string) => handleFilterStatusChange(value)}
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

              {filteredLikelihood && filteredImpact && (
                <div className="w-full md:w-auto flex items-center">
                  <span className="text-sm font-medium mr-2">Filtered by:</span>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    getRiskScoreColor(
                      (filteredLikelihood === 'Low' ? 1 : filteredLikelihood === 'Medium' ? 2 : 3) * 
                      (filteredImpact === 'Low' ? 1 : filteredImpact === 'Medium' ? 2 : 3)
                    )
                  }`}>
                    {filteredLikelihood} Likelihood / {filteredImpact} Impact
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setFilteredLikelihood(null);
                      setFilteredImpact(null);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Total Risks</div>
                      <div className="text-3xl font-bold">{totalRisks}</div>
                    </div>
                    <div className="flex">
                      <div className="flex flex-col items-center mx-2">
                        <div className="text-xs font-medium text-green-600">{lowRisks}</div>
                        <div className="text-xs text-gray-500">Low</div>
                      </div>
                      <div className="flex flex-col items-center mx-2">
                        <div className="text-xs font-medium text-amber-600">{mediumRisks}</div>
                        <div className="text-xs text-gray-500">Medium</div>
                      </div>
                      <div className="flex flex-col items-center mx-2">
                        <div className="text-xs font-medium text-red-600">{highRisks}</div>
                        <div className="text-xs text-gray-500">High</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-muted-foreground">Financial Impact</div>
                  <div className="text-3xl font-bold">{formatCurrency(totalFinancialImpact)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    High-risk items: {formatCurrency(highRiskFinancialImpact)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-muted-foreground">Risk Alert</div>
                  {highRisks > 0 ? (
                    <div className="flex items-center mt-2">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                      <div className="text-sm">
                        {highRisks} high-risk {highRisks === 1 ? 'item' : 'items'} need attention
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm mt-2">No high-risk items detected</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {viewMode === 'table' ? (
              <div className="space-y-4">
                {/* Risk form */}
                {showNewRisk && (
                  <div className="bg-slate-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium mb-4">{editingRiskId ? 'Edit Risk' : 'Add New Risk'}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <Label htmlFor="riskType">Risk Type</Label>
                        <Select 
                          value={formData.type} 
                          onValueChange={handleTypeChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select risk type" />
                          </SelectTrigger>
                          <SelectContent>
                            {RISK_TYPES.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="riskOwner">Owner</Label>
                        <Input
                          id="riskOwner"
                          placeholder="Who is responsible for this risk?"
                          value={formData.owner}
                          onChange={(e) => handleInputChange('owner', e.target.value)}
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="riskDescription">Description</Label>
                        <Textarea
                          id="riskDescription"
                          placeholder="Describe the risk in detail"
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="riskLikelihood">Likelihood</Label>
                        <Select 
                          value={formData.likelihood} 
                          onValueChange={handleLikelihoodChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select likelihood" />
                          </SelectTrigger>
                          <SelectContent>
                            {LIKELIHOOD_LEVELS.map(level => (
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="riskImpact">Impact</Label>
                        <Select 
                          value={formData.impact} 
                          onValueChange={handleImpactChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select impact" />
                          </SelectTrigger>
                          <SelectContent>
                            {IMPACT_LEVELS.map(level => (
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="riskFinancialImpact">Financial Impact ($)</Label>
                        <Input
                          id="riskFinancialImpact"
                          type="number"
                          placeholder="0"
                          value={formData.financialImpact || ''}
                          onChange={(e) => handleFinancialImpactChange(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="riskStatus">Status</Label>
                        <Select 
                          value={formData.status} 
                          onValueChange={handleStatusChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(status => (
                              <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="riskMitigation">Mitigation Strategy</Label>
                        <Textarea
                          id="riskMitigation"
                          placeholder="How will this risk be mitigated?"
                          value={formData.mitigationStrategy}
                          onChange={(e) => handleInputChange('mitigationStrategy', e.target.value)}
                          rows={3}
                        />
                        
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
                {filteredRisks.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Likelihood</TableHead>
                          <TableHead>Impact</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Financial Impact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRisks.map((risk) => (
                          <TableRow key={risk.id}>
                            <TableCell className="font-medium max-w-xs truncate">
                              {risk.description}
                            </TableCell>
                            <TableCell>{risk.type}</TableCell>
                            <TableCell>{risk.likelihood}</TableCell>
                            <TableCell>{risk.impact}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                getRiskScoreColor(risk.riskScore)
                              }`}>
                                {risk.riskScore}
                              </span>
                            </TableCell>
                            <TableCell>{formatCurrency(risk.financialImpact)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                risk.status === 'Open' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : risk.status === 'Mitigated' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                              }`}>
                                {risk.status}
                              </span>
                            </TableCell>
                            <TableCell>{risk.owner}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(risk)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(risk.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-md bg-gray-50">
                    <p className="text-gray-500">No risks match your filters. Try adjusting your filter criteria or add a new risk.</p>
                  </div>
                )}
              </div>
            ) : (
              <RiskMatrix risks={currentProduct.risks} onSelectCell={handleMatrixCellClick} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RiskAssessment;
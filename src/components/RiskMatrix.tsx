import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import type { RiskAssessment, LikelihoodLevel, ImpactLevel } from '../types';
import { LIKELIHOOD_LEVELS, IMPACT_LEVELS } from '../types';
import { formatCurrency } from '../lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';

interface RiskMatrixProps {
  risks: RiskAssessment[];
  onSelectCell: (likelihood: LikelihoodLevel, impact: ImpactLevel) => void;
}

const RiskMatrix = ({ risks, onSelectCell }: RiskMatrixProps) => {
  // Count risks by likelihood and impact
  const riskCounts: Record<string, Record<string, RiskAssessment[]>> = {};
  
  // Initialize the structure
  LIKELIHOOD_LEVELS.forEach(likelihood => {
    riskCounts[likelihood] = {};
    IMPACT_LEVELS.forEach(impact => {
      riskCounts[likelihood][impact] = [];
    });
  });

  // Populate the counts
  risks.forEach((risk: RiskAssessment) => {
    riskCounts[risk.likelihood][risk.impact].push(risk);
  });

  // Helper to get color based on risk score
  const getScoreColor = (likelihood: LikelihoodLevel, impact: ImpactLevel) => {
    const score = calculateRiskScore(likelihood, impact);
    if (score >= 6) return 'bg-red-100 hover:bg-red-200';
    if (score >= 3) return 'bg-amber-100 hover:bg-amber-200';
    return 'bg-green-100 hover:bg-green-200';
  };

  // Helper to calculate risk score
  const calculateRiskScore = (likelihood: LikelihoodLevel, impact: ImpactLevel): number => {
    const likelihoodScore = likelihood === 'Low' ? 1 : likelihood === 'Medium' ? 2 : 3;
    const impactScore = impact === 'Low' ? 1 : impact === 'Medium' ? 2 : 3;
    return likelihoodScore * impactScore;
  };

  // Function to export risk matrix data
  const exportRiskMatrix = () => {
    if (!risks.length) return;

    // Create CSV content
    let csvContent = "Risk Description,Type,Likelihood,Impact,Score,Financial Impact,Status,Owner,Mitigation Strategy\n";
    
    risks.forEach((risk: RiskAssessment) => {
      const rowData = [
        `"${risk.description.replace(/"/g, '""')}"`,
        risk.type,
        risk.likelihood,
        risk.impact,
        risk.riskScore,
        risk.financialImpact,
        risk.status,
        `"${risk.owner.replace(/"/g, '""')}"`,
        `"${risk.mitigationStrategy.replace(/"/g, '""')}"`
      ];
      csvContent += rowData.join(',') + '\n';
    });

    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Risk_Matrix_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!risks.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        No risks to display in the matrix. Add risks to visualize them.
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="col-span-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-semibold">Risk Priority Matrix</h3>
            <Button variant="outline" size="sm" onClick={exportRiskMatrix}>
              <Download className="h-4 w-4 mr-2" />
              Export Matrix
            </Button>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            This matrix visualizes risks by likelihood and impact. Click on any cell to see the risks in that category.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-8">
        <div className="font-medium text-center"></div>
        {IMPACT_LEVELS.map(impact => (
          <div key={`header-${impact}`} className="font-semibold text-center">
            {impact} Impact
          </div>
        ))}

        {LIKELIHOOD_LEVELS.slice().reverse().map(likelihood => (
          <div key={`row-${likelihood}`} className="contents">
            <div className="font-semibold text-right pr-4 flex items-center justify-end">
              {likelihood} <br/>Likelihood
            </div>
            
            {IMPACT_LEVELS.map(impact => {
              const cellRisks = riskCounts[likelihood][impact];
              const score = calculateRiskScore(likelihood as LikelihoodLevel, impact as ImpactLevel);
              
              return (
                <div 
                  key={`cell-${likelihood}-${impact}`}
                  className={`p-4 rounded-lg ${getScoreColor(likelihood as LikelihoodLevel, impact as ImpactLevel)} cursor-pointer transition-all duration-200`}
                  onClick={() => {
                    if (cellRisks.length > 0) {
                      onSelectCell(likelihood as LikelihoodLevel, impact as ImpactLevel);
                    }
                  }}
                >
                  <div className="text-center">
                    <div className="font-bold text-2xl mb-1">{score}</div>
                    <div className="text-sm font-medium mb-2">Risk Score</div>
                    <div className="text-xs font-medium bg-white bg-opacity-50 rounded-full px-2 py-1">
                      {cellRisks.length} {cellRisks.length === 1 ? 'Risk' : 'Risks'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mb-4">
        <h4 className="font-medium mb-2">Legend</h4>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
            <span className="text-sm">Low Risk (1-2)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-amber-100 rounded mr-2"></div>
            <span className="text-sm">Medium Risk (3-4)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
            <span className="text-sm">High Risk (6-9)</span>
          </div>
        </div>
      </div>

      {/* Top Risks Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Top Risks by Score</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Risk</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Financial Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {risks
                .sort((a: RiskAssessment, b: RiskAssessment) => b.riskScore - a.riskScore)
                .slice(0, 5)
                .map((risk: RiskAssessment) => (
                  <TableRow key={`top-${risk.id}`}>
                    <TableCell className="font-medium">{risk.description}</TableCell>
                    <TableCell>{risk.type}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        risk.riskScore >= 6 
                          ? 'bg-red-100 text-red-800' 
                          : risk.riskScore >= 3 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {risk.riskScore}
                      </span>
                    </TableCell>
                    <TableCell>{risk.status}</TableCell>
                    <TableCell>{formatCurrency(risk.financialImpact)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default RiskMatrix; 
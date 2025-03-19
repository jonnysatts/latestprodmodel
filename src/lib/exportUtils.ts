/**
 * Export Utilities
 * Functions for exporting data in various formats (CSV, PDF, Excel)
 */

import { formatCurrency, formatNumber, formatPercent } from './utils';
import { generateDashboardPDF } from './generatePDF';
import { generateMarketingPDF } from './generateMarketingPDF';
import type { Product, WeeklyProjection, ActualMetrics, MarketingChannelPerformance } from '../types';

interface ExportOptions {
  fileName?: string;
  includeTimestamp?: boolean;
}

/**
 * Export data as CSV file
 */
export function exportToCsv(
  data: Record<string, any>[], 
  columns: { key: string, label: string, format?: (value: unknown) => string }[],
  options: ExportOptions = {}
): void {
  if (!data || !data.length) {
    console.warn('No data to export');
    return;
  }

  // Create header row
  const headerRow = columns.map(col => `"${col.label}"`).join(',');
  
  // Create data rows
  const dataRows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key];
      const formattedValue = col.format ? col.format(value) : value;
      // Escape quotes and wrap in quotes
      return `"${String(formattedValue).replace(/"/g, '""')}"`;
    }).join(',');
  }).join('\n');
  
  // Combine header and rows
  const csvContent = `${headerRow}\n${dataRows}`;
  
  // Generate filename
  const timestamp = options.includeTimestamp ? `_${new Date().toISOString().slice(0, 10)}` : '';
  const fileName = `${options.fileName || 'export'}${timestamp}.csv`;
  
  // Create download link
  downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
}

/**
 * Export data for Excel
 * Creates a CSV with UTF-8 BOM to ensure Excel handles special characters correctly
 */
export function exportForExcel(
  data: Record<string, any>[], 
  columns: { key: string, label: string, format?: (value: unknown) => string }[],
  options: ExportOptions = {}
): void {
  if (!data || !data.length) {
    console.warn('No data to export');
    return;
  }
  
  // Add BOM for Excel
  const BOM = '\uFEFF';
  
  // Create header row
  const headerRow = columns.map(col => `"${col.label}"`).join(',');
  
  // Create data rows
  const dataRows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key];
      const formattedValue = col.format ? col.format(value) : value;
      // Escape quotes and wrap in quotes
      return `"${String(formattedValue).replace(/"/g, '""')}"`;
    }).join(',');
  }).join('\n');
  
  // Combine with BOM, header, and rows
  const csvContent = `${BOM}${headerRow}\n${dataRows}`;
  
  // Generate filename
  const timestamp = options.includeTimestamp ? `_${new Date().toISOString().slice(0, 10)}` : '';
  const fileName = `${options.fileName || 'export'}${timestamp}.xlsx`;
  
  // Create download link
  downloadFile(csvContent, fileName, 'application/vnd.ms-excel');
}

/**
 * Export data as JSON file
 */
export function exportToJSON(
  data: any,
  options: ExportOptions = {}
): void {
  if (!data) {
    console.warn('No data to export');
    return;
  }
  
  // Convert to JSON string with pretty formatting
  const jsonContent = JSON.stringify(data, null, 2);
  
  // Generate filename
  const timestamp = options.includeTimestamp ? `_${new Date().toISOString().slice(0, 10)}` : '';
  const fileName = `${options.fileName || 'export'}${timestamp}.json`;
  
  // Create download link
  downloadFile(jsonContent, fileName, 'application/json');
}

/**
 * Export comprehensive financial data for Excel analysis
 * Creates a multi-sheet Excel compatible format
 */
export function exportFinancialData(
  product: Product,
  options: ExportOptions = {}
): void {
  if (!product) {
    console.warn('No product data to export');
    return;
  }
  
  const { info, weeklyProjections, actualMetrics = [] } = product;
  const timestamp = options.includeTimestamp ? `_${new Date().toISOString().slice(0, 10)}` : '';
  const baseFileName = `${info.name}_Financial_Data${timestamp}`;

  // Export weekly projections
  exportWeeklyProjections(weeklyProjections, {
    fileName: `${baseFileName}_Weekly_Projections`,
    includeTimestamp: false
  });
  
  // Export actual metrics
  if (actualMetrics.length > 0) {
    exportActualMetrics(actualMetrics, {
      fileName: `${baseFileName}_Actual_Metrics`,
      includeTimestamp: false
    });
  }
  
  // Export revenue breakdown
  exportRevenueBreakdown(weeklyProjections, actualMetrics, {
    fileName: `${baseFileName}_Revenue_Breakdown`,
    includeTimestamp: false
  });
  
  // Export cost analysis
  exportCostAnalysis(weeklyProjections, actualMetrics, {
    fileName: `${baseFileName}_Cost_Analysis`,
    includeTimestamp: false
  });
  
  // Export variance analysis (projected vs. actual)
  exportVarianceAnalysis(weeklyProjections, actualMetrics, {
    fileName: `${baseFileName}_Variance_Analysis`,
    includeTimestamp: false
  });
}

/**
 * Export weekly projections data for Excel
 */
export function exportWeeklyProjections(
  weeklyProjections: WeeklyProjection[],
  options: ExportOptions = {}
): void {
  const columns = [
    { key: 'week', label: 'Week' },
    { key: 'numberOfEvents', label: 'Events' },
    { key: 'averageEventAttendance', label: 'Avg Attendance', format: formatNumber },
    { key: 'footTraffic', label: 'Total Attendance', format: formatNumber },
    { key: 'ticketRevenue', label: 'Ticket Revenue', format: formatCurrency },
    { key: 'fbRevenue', label: 'F&B Revenue', format: formatCurrency },
    { key: 'merchandiseRevenue', label: 'Merchandise Revenue', format: formatCurrency },
    { key: 'digitalRevenue', label: 'Digital Revenue', format: formatCurrency },
    { key: 'totalRevenue', label: 'Total Revenue', format: formatCurrency },
    { key: 'marketingCosts', label: 'Marketing Costs', format: formatCurrency },
    { key: 'staffingCosts', label: 'Staffing Costs', format: formatCurrency },
    { key: 'eventCosts', label: 'Event Costs', format: formatCurrency },
    { key: 'setupCosts', label: 'Setup Costs', format: formatCurrency },
    { key: 'totalCosts', label: 'Total Costs', format: formatCurrency },
    { key: 'weeklyProfit', label: 'Weekly Profit', format: formatCurrency },
    { key: 'cumulativeProfit', label: 'Cumulative Profit', format: formatCurrency },
    { key: 'notes', label: 'Notes' }
  ];
  
  exportForExcel(weeklyProjections, columns, options);
}

/**
 * Export actual metrics data for Excel
 */
export function exportActualMetrics(
  actualMetrics: ActualMetrics[],
  options: ExportOptions = {}
): void {
  const columns = [
    { key: 'week', label: 'Week' },
    { key: 'date', label: 'Date' },
    { key: 'numberOfEvents', label: 'Events' },
    { key: 'averageEventAttendance', label: 'Avg Attendance', format: formatNumber },
    { key: 'footTraffic', label: 'Total Attendance', format: formatNumber },
    { key: 'ticketRevenue', label: 'Ticket Revenue', format: formatCurrency },
    { key: 'fbRevenue', label: 'F&B Revenue', format: formatCurrency },
    { key: 'merchandiseRevenue', label: 'Merchandise Revenue', format: formatCurrency },
    { key: 'digitalRevenue', label: 'Digital Revenue', format: formatCurrency },
    { key: 'totalRevenue', label: 'Total Revenue', format: formatCurrency },
    { key: 'marketingCost', label: 'Marketing Costs', format: formatCurrency },
    { key: 'staffCost', label: 'Staffing Costs', format: formatCurrency },
    { key: 'eventsCosts', label: 'Event Costs', format: formatCurrency },
    { key: 'setupCosts', label: 'Setup Costs', format: formatCurrency },
    { key: 'technologyCost', label: 'Technology Costs', format: formatCurrency },
    { key: 'officeCost', label: 'Office Costs', format: formatCurrency },
    { key: 'otherCosts', label: 'Other Costs', format: formatCurrency },
    { key: 'totalCosts', label: 'Total Costs', format: formatCurrency },
    { key: 'weeklyProfit', label: 'Weekly Profit', format: formatCurrency },
    { key: 'cumulativeProfit', label: 'Cumulative Profit', format: formatCurrency },
    { key: 'notes', label: 'Notes' }
  ];
  
  exportForExcel(actualMetrics, columns, options);
}

/**
 * Export revenue breakdown data for Excel
 */
export function exportRevenueBreakdown(
  weeklyProjections: WeeklyProjection[],
  actualMetrics: ActualMetrics[],
  options: ExportOptions = {}
): void {
  // Create combined dataset with revenue components
  const revenueData = weeklyProjections.map(week => {
    // Find corresponding actual data for this week if it exists
    const actual = actualMetrics.find(a => a.week === week.week);
    
    return {
      week: week.week,
      projected_ticket: week.ticketRevenue,
      actual_ticket: actual?.ticketRevenue || 0,
      variance_ticket: (actual?.ticketRevenue || 0) - week.ticketRevenue,
      
      projected_fb: week.fbRevenue,
      actual_fb: actual?.fbRevenue || 0,
      variance_fb: (actual?.fbRevenue || 0) - week.fbRevenue,
      
      projected_merchandise: week.merchandiseRevenue,
      actual_merchandise: actual?.merchandiseRevenue || 0,
      variance_merchandise: (actual?.merchandiseRevenue || 0) - week.merchandiseRevenue,
      
      projected_digital: week.digitalRevenue,
      actual_digital: actual?.digitalRevenue || 0,
      variance_digital: (actual?.digitalRevenue || 0) - week.digitalRevenue,
      
      projected_total: week.totalRevenue,
      actual_total: actual?.totalRevenue || 0,
      variance_total: (actual?.totalRevenue || 0) - week.totalRevenue,
      
      variance_percentage: week.totalRevenue > 0 
        ? (((actual?.totalRevenue || 0) - week.totalRevenue) / week.totalRevenue) * 100 
        : 0
    };
  });
  
  const columns = [
    { key: 'week', label: 'Week' },
    { key: 'projected_ticket', label: 'Projected Ticket Revenue', format: formatCurrency },
    { key: 'actual_ticket', label: 'Actual Ticket Revenue', format: formatCurrency },
    { key: 'variance_ticket', label: 'Variance (Ticket)', format: formatCurrency },
    
    { key: 'projected_fb', label: 'Projected F&B Revenue', format: formatCurrency },
    { key: 'actual_fb', label: 'Actual F&B Revenue', format: formatCurrency },
    { key: 'variance_fb', label: 'Variance (F&B)', format: formatCurrency },
    
    { key: 'projected_merchandise', label: 'Projected Merchandise Revenue', format: formatCurrency },
    { key: 'actual_merchandise', label: 'Actual Merchandise Revenue', format: formatCurrency },
    { key: 'variance_merchandise', label: 'Variance (Merchandise)', format: formatCurrency },
    
    { key: 'projected_digital', label: 'Projected Digital Revenue', format: formatCurrency },
    { key: 'actual_digital', label: 'Actual Digital Revenue', format: formatCurrency },
    { key: 'variance_digital', label: 'Variance (Digital)', format: formatCurrency },
    
    { key: 'projected_total', label: 'Projected Total Revenue', format: formatCurrency },
    { key: 'actual_total', label: 'Actual Total Revenue', format: formatCurrency },
    { key: 'variance_total', label: 'Variance (Total)', format: formatCurrency },
    { key: 'variance_percentage', label: 'Variance %', format: (v: number) => v.toFixed(2) + '%' }
  ];
  
  exportForExcel(revenueData, columns, options);
}

/**
 * Export cost analysis data for Excel
 */
export function exportCostAnalysis(
  weeklyProjections: WeeklyProjection[],
  actualMetrics: ActualMetrics[],
  options: ExportOptions = {}
): void {
  // Create combined dataset with cost components
  const costData = weeklyProjections.map(week => {
    // Find corresponding actual data for this week if it exists
    const actual = actualMetrics.find(a => a.week === week.week);
    
    return {
      week: week.week,
      projected_marketing: week.marketingCosts,
      actual_marketing: actual?.marketingCost || 0,
      variance_marketing: (actual?.marketingCost || 0) - week.marketingCosts,
      
      projected_staffing: week.staffingCosts,
      actual_staffing: actual?.staffCost || 0,
      variance_staffing: (actual?.staffCost || 0) - week.staffingCosts,
      
      projected_event: week.eventCosts,
      actual_event: actual?.eventsCosts || 0,
      variance_event: (actual?.eventsCosts || 0) - week.eventCosts,
      
      projected_setup: week.setupCosts,
      actual_setup: actual?.setupCosts || 0,
      variance_setup: (actual?.setupCosts || 0) - week.setupCosts,
      
      actual_technology: actual?.technologyCost || 0,
      actual_office: actual?.officeCost || 0,
      actual_other: actual?.otherCosts || 0,
      
      projected_total: week.totalCosts,
      actual_total: actual?.totalCosts || 0,
      variance_total: (actual?.totalCosts || 0) - week.totalCosts,
      
      variance_percentage: week.totalCosts > 0 
        ? (((actual?.totalCosts || 0) - week.totalCosts) / week.totalCosts) * 100 
        : 0
    };
  });
  
  const columns = [
    { key: 'week', label: 'Week' },
    { key: 'projected_marketing', label: 'Projected Marketing Costs', format: formatCurrency },
    { key: 'actual_marketing', label: 'Actual Marketing Costs', format: formatCurrency },
    { key: 'variance_marketing', label: 'Variance (Marketing)', format: formatCurrency },
    
    { key: 'projected_staffing', label: 'Projected Staffing Costs', format: formatCurrency },
    { key: 'actual_staffing', label: 'Actual Staffing Costs', format: formatCurrency },
    { key: 'variance_staffing', label: 'Variance (Staffing)', format: formatCurrency },
    
    { key: 'projected_event', label: 'Projected Event Costs', format: formatCurrency },
    { key: 'actual_event', label: 'Actual Event Costs', format: formatCurrency },
    { key: 'variance_event', label: 'Variance (Event)', format: formatCurrency },
    
    { key: 'projected_setup', label: 'Projected Setup Costs', format: formatCurrency },
    { key: 'actual_setup', label: 'Actual Setup Costs', format: formatCurrency },
    { key: 'variance_setup', label: 'Variance (Setup)', format: formatCurrency },
    
    { key: 'actual_technology', label: 'Actual Technology Costs', format: formatCurrency },
    { key: 'actual_office', label: 'Actual Office Costs', format: formatCurrency },
    { key: 'actual_other', label: 'Actual Other Costs', format: formatCurrency },
    
    { key: 'projected_total', label: 'Projected Total Costs', format: formatCurrency },
    { key: 'actual_total', label: 'Actual Total Costs', format: formatCurrency },
    { key: 'variance_total', label: 'Variance (Total)', format: formatCurrency },
    { key: 'variance_percentage', label: 'Variance %', format: (v: number) => v.toFixed(2) + '%' }
  ];
  
  exportForExcel(costData, columns, options);
}

/**
 * Export variance analysis data for Excel 
 */
export function exportVarianceAnalysis(
  weeklyProjections: WeeklyProjection[],
  actualMetrics: ActualMetrics[],
  options: ExportOptions = {}
): void {
  // Create combined dataset with performance and variance metrics
  const varianceData = weeklyProjections.map(week => {
    // Find corresponding actual data for this week if it exists
    const actual = actualMetrics.find(a => a.week === week.week);
    
    return {
      week: week.week,
      projected_revenue: week.totalRevenue,
      actual_revenue: actual?.totalRevenue || 0,
      revenue_variance: (actual?.totalRevenue || 0) - week.totalRevenue,
      revenue_variance_pct: week.totalRevenue > 0 
        ? (((actual?.totalRevenue || 0) - week.totalRevenue) / week.totalRevenue) * 100 
        : 0,
      
      projected_costs: week.totalCosts,
      actual_costs: actual?.totalCosts || 0,
      costs_variance: (actual?.totalCosts || 0) - week.totalCosts,
      costs_variance_pct: week.totalCosts > 0 
        ? (((actual?.totalCosts || 0) - week.totalCosts) / week.totalCosts) * 100 
        : 0,
      
      projected_profit: week.weeklyProfit,
      actual_profit: actual?.weeklyProfit || 0,
      profit_variance: (actual?.weeklyProfit || 0) - week.weeklyProfit,
      profit_variance_pct: week.weeklyProfit !== 0
        ? (((actual?.weeklyProfit || 0) - week.weeklyProfit) / Math.abs(week.weeklyProfit)) * 100 
        : 0,
      
      projected_attendance: week.footTraffic,
      actual_attendance: actual?.footTraffic || 0,
      attendance_variance: (actual?.footTraffic || 0) - week.footTraffic,
      attendance_variance_pct: week.footTraffic > 0 
        ? (((actual?.footTraffic || 0) - week.footTraffic) / week.footTraffic) * 100 
        : 0
    };
  });
  
  const columns = [
    { key: 'week', label: 'Week' },
    { key: 'projected_revenue', label: 'Projected Revenue', format: formatCurrency },
    { key: 'actual_revenue', label: 'Actual Revenue', format: formatCurrency },
    { key: 'revenue_variance', label: 'Variance ($)', format: formatCurrency },
    { key: 'revenue_variance_pct', label: 'Variance (%)', format: (v: number) => v.toFixed(2) + '%' },
    
    { key: 'projected_costs', label: 'Projected Costs', format: formatCurrency },
    { key: 'actual_costs', label: 'Actual Costs', format: formatCurrency },
    { key: 'costs_variance', label: 'Variance ($)', format: formatCurrency },
    { key: 'costs_variance_pct', label: 'Variance (%)', format: (v: number) => v.toFixed(2) + '%' },
    
    { key: 'projected_profit', label: 'Projected Profit', format: formatCurrency },
    { key: 'actual_profit', label: 'Actual Profit', format: formatCurrency },
    { key: 'profit_variance', label: 'Variance ($)', format: formatCurrency },
    { key: 'profit_variance_pct', label: 'Variance (%)', format: (v: number) => v.toFixed(2) + '%' },
    
    { key: 'projected_attendance', label: 'Projected Attendance', format: formatNumber },
    { key: 'actual_attendance', label: 'Actual Attendance', format: formatNumber },
    { key: 'attendance_variance', label: 'Variance (#)', format: formatNumber },
    { key: 'attendance_variance_pct', label: 'Variance (%)', format: (v: number) => v.toFixed(2) + '%' }
  ];
  
  exportForExcel(varianceData, columns, options);
}

/**
 * Export marketing channel performance data
 */
export function exportMarketingChannelData(
  actualMetrics: ActualMetrics[],
  options: ExportOptions = {}
): void {
  // Flatten channel performance data from all weeks
  const allChannelData: unknown[] = [];
  
  actualMetrics.forEach(week => {
    if (week.channelPerformance && week.channelPerformance.length > 0) {
      week.channelPerformance.forEach(channel => {
        allChannelData.push({
          week: week.week,
          date: week.date,
          channelId: channel.channelId,
          spend: channel.spend || 0,
          revenue: channel.revenue || 0,
          impressions: channel.impressions || 0,
          clicks: channel.clicks || 0,
          conversions: channel.conversions || 0,
          ctr: channel.impressions ? (channel.clicks! / channel.impressions) * 100 : 0,
          conversionRate: channel.clicks ? (channel.conversions! / channel.clicks) * 100 : 0,
          cpc: channel.clicks ? channel.spend! / channel.clicks : 0,
          cpa: channel.conversions ? channel.spend! / channel.conversions : 0,
          roi: channel.spend ? ((channel.revenue! - channel.spend) / channel.spend) * 100 : 0
        });
      });
    }
  });
  
  if (allChannelData.length === 0) {
    console.warn('No marketing channel data to export');
    return;
  }
  
  const columns = [
    { key: 'week', label: 'Week' },
    { key: 'date', label: 'Date' },
    { key: 'channelId', label: 'Channel' },
    { key: 'spend', label: 'Spend', format: formatCurrency },
    { key: 'revenue', label: 'Revenue', format: formatCurrency },
    { key: 'impressions', label: 'Impressions', format: formatNumber },
    { key: 'clicks', label: 'Clicks', format: formatNumber },
    { key: 'conversions', label: 'Conversions', format: formatNumber },
    { key: 'ctr', label: 'CTR (%)', format: (v: number) => v.toFixed(2) + '%' },
    { key: 'conversionRate', label: 'Conversion Rate (%)', format: (v: number) => v.toFixed(2) + '%' },
    { key: 'cpc', label: 'Cost per Click', format: formatCurrency },
    { key: 'cpa', label: 'Cost per Acquisition', format: formatCurrency },
    { key: 'roi', label: 'ROI (%)', format: (v: number) => v.toFixed(2) + '%' }
  ];
  
  exportForExcel(allChannelData, columns, options);
}

/**
 * Export product data as PDF report
 * reportType determines which PDF generator to use
 */
export type ReportType = 'financial' | 'marketing' | 'executive';

export async function exportToPDF(
  product: Product,
  reportType: ReportType = 'financial',
  options: ExportOptions = {}
): Promise<Blob> {
  if (!product) {
    console.warn('No product data to export');
    throw new Error('No product data to export');
  }
  
  // Generate the PDF blob based on report type
  let pdfBlob: Blob;
  
  switch (reportType) {
    case 'marketing':
      pdfBlob = await generateMarketingPDF(product);
      break;
    case 'executive':
      // Future implementation - for now fallback to financial
      pdfBlob = await generateDashboardPDF(product);
      break;
    case 'financial':
    default:
      pdfBlob = await generateDashboardPDF(product);
      break;
  }
  
  return pdfBlob;
}

/**
 * Export marketing performance data as CSV
 */
export function exportMarketingPerformance(channelData: unknown[], timeframe: string): void {
  const columns = [
    { key: 'name', label: 'Channel' },
    { key: 'budget', label: 'Budget', format: formatCurrency },
    { key: 'totalSpend', label: 'Total Spend', format: formatCurrency },
    { key: 'totalRevenue', label: 'Total Revenue', format: formatCurrency },
    { key: 'expectedROI', label: 'Expected ROI (%)', format: (v: number) => v.toFixed(2) + '%' },
    { key: 'actualROI', label: 'Actual ROI (%)', format: (v: number) => v.toFixed(2) + '%' },
    { key: 'impressions', label: 'Impressions', format: formatNumber },
    { key: 'clicks', label: 'Clicks', format: formatNumber },
    { key: 'conversions', label: 'Conversions', format: formatNumber },
    { 
      key: 'conversionRate', 
      label: 'Conversion Rate',
      format: (row: unknown) => ((row.clicks && row.impressions) ? ((row.clicks / row.impressions) * 100).toFixed(2) + '%' : '0.00%')
    },
    {
      key: 'cpa',
      label: 'Cost per Acquisition',
      format: (row: unknown) => (row.conversions ? formatCurrency(row.totalSpend / row.conversions) : '-')
    }
  ];
  
  exportToCsv(channelData, columns, {
    fileName: `Marketing_Performance_${timeframe.replace(/\s+/g, '_')}`,
    includeTimestamp: true
  });
}

/**
 * Export budget optimization recommendations
 */
export function exportBudgetRecommendations(recommendations: unknown[], goal: string): void {
  const columns = [
    { key: 'name', label: 'Channel' },
    { key: 'currentBudget', label: 'Current Budget', format: formatCurrency },
    { key: 'recommendedBudget', label: 'Recommended Budget', format: formatCurrency },
    { key: 'change', label: 'Change', format: formatCurrency },
    { key: 'percentChange', label: 'Change %', format: (v: number) => v.toFixed(2) + '%' },
    { key: 'performanceMetric', label: 'Performance Metric', format: (v: unknown) => {
      if (goal === 'roi') return v.toFixed(2) + '%';
      if (goal === 'revenue') return formatCurrency(v);
      return formatCurrency(v); // CPA or other
    }},
    { key: 'reason', label: 'Recommendation Reason' }
  ];
  
  exportToCsv(recommendations, columns, {
    fileName: `Budget_Optimization_${goal.toUpperCase()}`,
    includeTimestamp: true
  });
}

/**
 * Helper to download a file to the user's device
 */
export function downloadFile(content: string | Blob, fileName: string, mimeType?: string): void {
  let blob: Blob;
  
  // Convert string content to blob if needed
  if (typeof content === 'string') {
    blob = new Blob([content], { type: mimeType });
  } else {
    blob = content;
  }
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

// Add the new exportScenarioComparison function
export const exportScenarioComparison = (
  product: Product, 
  baselineData: WeeklyProjection[], 
  scenarioData: WeeklyProjection[],
  scenarioName: string
) => {
  // Define the columns for export
  const formatCurrency = (value: unknown) => `$${Number(value).toLocaleString()}`;
  const formatPercentage = (value: unknown) => `${Number(value).toFixed(2)}%`;
  const formatNumber = (value: unknown) => Number(value).toLocaleString();
  
  const headers = [
    { key: 'week', label: 'Week' },
    { key: 'baseline_revenue', label: 'Baseline Revenue', format: formatCurrency },
    { key: 'scenario_revenue', label: 'Scenario Revenue', format: formatCurrency },
    { key: 'revenue_diff', label: 'Revenue Difference', format: formatCurrency },
    { key: 'revenue_diff_pct', label: 'Revenue Diff %', format: formatPercentage },
    { key: 'baseline_cost', label: 'Baseline Cost', format: formatCurrency },
    { key: 'scenario_cost', label: 'Scenario Cost', format: formatCurrency },
    { key: 'cost_diff', label: 'Cost Difference', format: formatCurrency },
    { key: 'cost_diff_pct', label: 'Cost Diff %', format: formatPercentage },
    { key: 'baseline_profit', label: 'Baseline Profit', format: formatCurrency },
    { key: 'scenario_profit', label: 'Scenario Profit', format: formatCurrency },
    { key: 'profit_diff', label: 'Profit Difference', format: formatCurrency },
    { key: 'profit_diff_pct', label: 'Profit Diff %', format: formatPercentage },
    { key: 'baseline_attendance', label: 'Baseline Attendance', format: formatNumber },
    { key: 'scenario_attendance', label: 'Scenario Attendance', format: formatNumber },
    { key: 'attendance_diff_pct', label: 'Attendance Diff %', format: formatPercentage }
  ];

  // Generate weekly data for export
  const dataset = baselineData.map((baseline, index) => {
    const scenario = scenarioData[index];
    
    // Calculate revenues
    const baselineRevenue = baseline.ticketRevenue + baseline.fbRevenue + 
                           baseline.merchandiseRevenue + baseline.digitalRevenue;
    
    const scenarioRevenue = scenario.ticketRevenue + scenario.fbRevenue + 
                          scenario.merchandiseRevenue + scenario.digitalRevenue;
    
    // Calculate costs
    const baselineCost = baseline.marketingCosts + baseline.staffingCosts + 
                        baseline.eventCosts + baseline.setupCosts;
                        
    const scenarioCost = scenario.marketingCosts + scenario.staffingCosts + 
                       scenario.eventCosts + scenario.setupCosts;
    
    // Calculate profits
    const baselineProfit = baselineRevenue - baselineCost;
    const scenarioProfit = scenarioRevenue - scenarioCost;
    
    // Calculate differences
    const revenueDiff = scenarioRevenue - baselineRevenue;
    const revenueDiffPct = baselineRevenue !== 0 ? (revenueDiff / baselineRevenue) * 100 : 0;
    
    const costDiff = scenarioCost - baselineCost;
    const costDiffPct = baselineCost !== 0 ? (costDiff / baselineCost) * 100 : 0;
    
    const profitDiff = scenarioProfit - baselineProfit;
    const profitDiffPct = baselineProfit !== 0 ? (profitDiff / baselineProfit) * 100 : 0;
    
    const attendanceDiffPct = baseline.footTraffic !== 0 
      ? ((scenario.footTraffic - baseline.footTraffic) / baseline.footTraffic) * 100 
      : 0;
    
    return {
      week: baseline.week,
      baseline_revenue: baselineRevenue,
      scenario_revenue: scenarioRevenue,
      revenue_diff: revenueDiff,
      revenue_diff_pct: revenueDiffPct,
      baseline_cost: baselineCost,
      scenario_cost: scenarioCost,
      cost_diff: costDiff,
      cost_diff_pct: costDiffPct,
      baseline_profit: baselineProfit,
      scenario_profit: scenarioProfit,
      profit_diff: profitDiff,
      profit_diff_pct: profitDiffPct,
      baseline_attendance: baseline.footTraffic,
      scenario_attendance: scenario.footTraffic,
      attendance_diff_pct: attendanceDiffPct
    };
  });

  // Add summary row
  const baselineTotalRevenue = dataset.reduce((sum, row) => sum + row.baseline_revenue, 0);
  const scenarioTotalRevenue = dataset.reduce((sum, row) => sum + row.scenario_revenue, 0);
  const baselineTotalCost = dataset.reduce((sum, row) => sum + row.baseline_cost, 0);
  const scenarioTotalCost = dataset.reduce((sum, row) => sum + row.scenario_cost, 0);
  const baselineTotalProfit = dataset.reduce((sum, row) => sum + row.baseline_profit, 0);
  const scenarioTotalProfit = dataset.reduce((sum, row) => sum + row.scenario_profit, 0);
  const baselineTotalAttendance = dataset.reduce((sum, row) => sum + row.baseline_attendance, 0);
  const scenarioTotalAttendance = dataset.reduce((sum, row) => sum + row.scenario_attendance, 0);
  
  const totalRevenueDiff = scenarioTotalRevenue - baselineTotalRevenue;
  const totalRevenueDiffPct = baselineTotalRevenue !== 0 ? (totalRevenueDiff / baselineTotalRevenue) * 100 : 0;
  const totalCostDiff = scenarioTotalCost - baselineTotalCost;
  const totalCostDiffPct = baselineTotalCost !== 0 ? (totalCostDiff / baselineTotalCost) * 100 : 0;
  const totalProfitDiff = scenarioTotalProfit - baselineTotalProfit;
  const totalProfitDiffPct = baselineTotalProfit !== 0 ? (totalProfitDiff / baselineTotalProfit) * 100 : 0;
  const totalAttendanceDiffPct = baselineTotalAttendance !== 0 
    ? ((scenarioTotalAttendance - baselineTotalAttendance) / baselineTotalAttendance) * 100 
    : 0;
    
  dataset.push({
    week: 'TOTAL' as any,
    baseline_revenue: baselineTotalRevenue,
    scenario_revenue: scenarioTotalRevenue,
    revenue_diff: totalRevenueDiff,
    revenue_diff_pct: totalRevenueDiffPct,
    baseline_cost: baselineTotalCost,
    scenario_cost: scenarioTotalCost,
    cost_diff: totalCostDiff,
    cost_diff_pct: totalCostDiffPct,
    baseline_profit: baselineTotalProfit,
    scenario_profit: scenarioTotalProfit,
    profit_diff: totalProfitDiff,
    profit_diff_pct: totalProfitDiffPct,
    baseline_attendance: baselineTotalAttendance,
    scenario_attendance: scenarioTotalAttendance,
    attendance_diff_pct: totalAttendanceDiffPct
  });

  // Export the data as Excel
  return exportForExcel(
    dataset,
    headers,
    { 
      fileName: `${product.info.name}_${scenarioName}_Comparison`,
      includeTimestamp: true
    }
  );
}; 
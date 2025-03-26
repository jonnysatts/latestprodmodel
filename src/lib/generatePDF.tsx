import { format } from 'date-fns';
import type { Product } from '../types';
import { formatCurrency, formatNumber, formatPercent } from './utils';

// Simplified generateDashboardPDF function for client-side only mode
export async function generateDashboardPDF(product: Product): Promise<Blob> {
  if (!product || !product.info) {
    console.error("Invalid product data for PDF generation");
    return new Blob(["Error: Invalid product data"], { type: 'text/plain' });
  }
  
  console.log("PDF generation attempted for product:", product.info.name);
  console.warn("PDF generation is disabled in client-side only mode");
  
  const {
    info,
    weeklyProjections = [],
    growthMetrics,
    revenueMetrics,
    costMetrics,
  } = product;

  // Calculate key metrics
  const totalRevenue = weeklyProjections.reduce((sum, week) => sum + (week.totalRevenue || 0), 0);
  const totalCosts = weeklyProjections.reduce((sum, week) => sum + (week.totalCosts || 0), 0);
  const totalProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;
  
  // Generate a simple text representation as a fallback
  const reportDate = format(new Date(), 'MMMM d, yyyy');
  const content = [
    `FINANCIAL DASHBOARD - ${info.name.toUpperCase()}`,
    `Generated on ${reportDate}`,
    '\n',
    'EXECUTIVE SUMMARY',
    `Product: ${info.name}`,
    `Type: ${info.type || 'N/A'}`,
    `Description: ${info.description || 'N/A'}`,
    '\n',
    'KEY METRICS',
    `Total Revenue: ${formatCurrency(totalRevenue)}`,
    `Total Costs: ${formatCurrency(totalCosts)}`,
    `Total Profit: ${formatCurrency(totalProfit)}`,
    `Profit Margin: ${formatPercent(profitMargin)}`,
    '\n',
    'GROWTH METRICS',
    `Weekly Visitors: ${formatNumber(growthMetrics?.weeklyVisitors || 0)}`,
    `Growth Rate: ${formatPercent((growthMetrics?.weeklyGrowthRate || 0) / 100)}`,
    `Return Visit Rate: ${formatPercent(growthMetrics?.returnVisitRate || 0)}`,
    '\n',
    'WEEKLY PROJECTIONS (First 4 weeks)',
    weeklyProjections.slice(0, 4).map(week => 
      `Week ${week.week}: Revenue ${formatCurrency(week.totalRevenue || 0)}, ` +
      `Costs ${formatCurrency(week.totalCosts || 0)}, ` +
      `Profit ${formatCurrency(week.weeklyProfit || 0)}`
    ).join('\n'),
    '\n',
    'NOTE: PDF generation is disabled in client-side only mode',
    'To enable PDF generation, please integrate with a PDF generation service.'
  ].join('\n');
  
  return new Blob([content], { type: 'text/plain' });
} 
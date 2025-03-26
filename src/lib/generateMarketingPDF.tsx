import { format } from 'date-fns';
import type { Product } from '../types';
import { formatCurrency } from './utils';

// Simplified generateMarketingPDF function that works in client-side only mode
export async function generateMarketingPDF(product: Product): Promise<Blob> {
  if (!product || !product.info) {
    console.error("Invalid product data for PDF generation");
    return new Blob(["Error: Invalid product data"], { type: 'text/plain' });
  }
  
  console.log("PDF generation attempted for product:", product.info.name);
  console.warn("PDF generation is disabled in client-side only mode");
  
  // Generate a simple text representation as a fallback
  const reportDate = format(new Date(), 'MMMM d, yyyy');
  const content = [
    `MARKETING REPORT - ${product.info.name.toUpperCase()}`,
    `Generated on ${reportDate}`,
    '\n',
    'SUMMARY',
    `Product: ${product.info.name}`,
    `Type: ${product.info.type || 'N/A'}`,
    `Description: ${product.info.description || 'N/A'}`,
    '\n',
    'MARKETING METRICS',
    `Budget: ${formatCurrency(product.costMetrics?.marketing?.budget || 0)}`,
    '\n',
    'NOTE: PDF generation is disabled in client-side only mode',
    'To enable PDF generation, please integrate with a PDF generation service.'
  ].join('\n');
  
  return new Blob([content], { type: 'text/plain' });
} 
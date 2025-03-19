import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import type { Product, MarketingChannelPerformance, MarketingChannelItem, ActualMetrics } from '../types';
import { formatCurrency, formatNumber, formatPercent } from './utils';

// Create styles with enhanced visual design
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    padding: 6,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    color: '#1f2937',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  col: {
    flex: 1,
    padding: 5,
  },
  colHalf: {
    flex: 0.5,
    padding: 5,
  },
  colDouble: {
    flex: 2,
    padding: 5,
  },
  label: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  value: {
    fontSize: 12,
    marginBottom: 5,
    color: '#111827',
  },
  highlight: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  positive: {
    color: '#10b981',
  },
  negative: {
    color: '#ef4444',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 6,
    borderRadius: 4,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 2,
  },
  tableRowHighlight: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: '#f0f9ff', 
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    padding: 2,
    color: '#374151',
  },
  tableCellHeader: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    padding: 2,
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    textAlign: 'center',
    fontSize: 10,
    color: '#6b7280',
  },
  companyName: {
    color: '#4338ca',
    fontWeight: 'bold',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 10,
    color: '#9ca3af',
  },
  chartContainer: {
    height: 160,
    marginVertical: 10,
    paddingHorizontal: 5,
    flexDirection: 'row',
  },
  chartLegend: {
    flex: 1,
    padding: 5,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  chartLegendColor: {
    width: 12,
    height: 12,
    marginRight: 5,
  },
  chartLegendText: {
    fontSize: 9,
    color: '#374151',
  },
  kpiCard: {
    borderWidth: 1, 
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: 8,
    margin: 4,
    flex: 1,
  },
  kpiTitle: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  kpiPercentage: {
    fontSize: 10,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  disclaimer: {
    fontSize: 8,
    color: '#9ca3af',
    marginTop: 4,
  },
  callout: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    padding: 10,
    marginBottom: 10,
    borderRadius: 2,
  },
  calloutText: {
    fontSize: 11,
    color: '#1e40af',
  },
});

// Helper function to calculate channel metrics
const calculateChannelMetrics = (channels: MarketingChannelItem[] = [], channelPerformance: MarketingChannelPerformance[] = []) => {
  // Map performance data to channels
  const enrichedChannels = channels.map(channel => {
    const performance = channelPerformance.find(p => p.channelId === channel.id);
    const roi = performance && performance.spend && performance.revenue 
      ? (performance.revenue - performance.spend) / performance.spend 
      : 0;
    
    const conversionRate = performance && performance.clicks && performance.conversions 
      ? performance.conversions / performance.clicks 
      : 0;
    
    const ctr = performance && performance.impressions && performance.clicks 
      ? performance.clicks / performance.impressions 
      : 0;
    
    return {
      ...channel,
      performance: performance || null,
      roi,
      conversionRate,
      ctr
    };
  });
  
  return enrichedChannels;
};

// Main PDF Component
const MarketingReportPDF = ({ product }: { product: Product }) => {
  const {
    info,
    weeklyProjections,
    actualMetrics = [],
    costMetrics,
  } = product;

  // Extract marketing channels and metrics
  const marketingChannels = costMetrics?.marketing?.channels || [];
  
  // Get the most recent actual metrics with channel performance data
  const recentActuals = [...actualMetrics]
    .sort((a, b) => (b.week || 0) - (a.week || 0))
    .filter(metric => metric.channelPerformance && metric.channelPerformance.length > 0)
    .slice(0, 4);
  
  // Calculate channel metrics if we have performance data
  const channelMetrics = recentActuals.length > 0 
    ? calculateChannelMetrics(marketingChannels, recentActuals[0].channelPerformance || [])
    : [];
  
  // Calculate overall marketing metrics
  const totalMarketingBudget = marketingChannels.reduce((sum, ch) => sum + (ch.budget || 0), 0);
  const totalMarketingRevenue = recentActuals.length > 0 
    ? recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.revenue || 0), 0) || 0
    : 0;
  const totalMarketingSpend = recentActuals.length > 0 
    ? recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.spend || 0), 0) || 0
    : 0;
  const overallROI = totalMarketingSpend > 0 
    ? (totalMarketingRevenue - totalMarketingSpend) / totalMarketingSpend 
    : 0;
  
  // Helper function to get style based on performance
  const getPerformanceStyle = (value: number, thresholds = { good: 0.1, neutral: 0 }) => {
    if (value >= thresholds.good) return styles.positive;
    if (value >= thresholds.neutral) return {};
    return styles.negative;
  };

  // Get current date for the report
  const reportDate = format(new Date(), 'PPP');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{info.name} - Marketing Performance Report</Text>
          <Text style={styles.subtitle}>Generated on {reportDate}</Text>
          <Text style={styles.subtitle}>Product Type: {info.type}</Text>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          
          <View style={styles.callout}>
            <Text style={styles.calloutText}>
              This report provides a comprehensive analysis of our marketing activities, 
              performance metrics, and ROI across all channels. Use this data to optimize 
              budget allocation and improve campaign effectiveness.
            </Text>
          </View>
          
          <View style={styles.row}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiTitle}>Marketing Budget</Text>
              <Text style={styles.kpiValue}>{formatCurrency(totalMarketingBudget)}</Text>
              <Text style={styles.kpiPercentage}>
                {totalMarketingBudget > 0 && totalMarketingSpend > 0 && 
                  `${formatPercent(totalMarketingSpend / totalMarketingBudget)} utilized`}
              </Text>
            </View>
            
            <View style={styles.kpiCard}>
              <Text style={styles.kpiTitle}>Marketing Revenue</Text>
              <Text style={styles.kpiValue}>{formatCurrency(totalMarketingRevenue)}</Text>
              {weeklyProjections.length > 0 && (
                <Text style={getPerformanceStyle(totalMarketingRevenue - totalMarketingBudget, { good: 0, neutral: -1000 })}>
                  {totalMarketingRevenue >= totalMarketingBudget ? 'On Target' : 'Below Target'}
                </Text>
              )}
            </View>
            
            <View style={styles.kpiCard}>
              <Text style={styles.kpiTitle}>Overall ROI</Text>
              <Text style={[styles.kpiValue, getPerformanceStyle(overallROI)]}>
                {formatPercent(overallROI)}
              </Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${Math.min(overallROI * 100, 100)}%`, backgroundColor: overallROI > 0 ? '#10b981' : '#ef4444' }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>

        {/* Channel Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Channel Performance</Text>
          
          {channelMetrics.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>Channel</Text>
                <Text style={styles.tableCellHeader}>Budget</Text>
                <Text style={styles.tableCellHeader}>Spend</Text>
                <Text style={styles.tableCellHeader}>Revenue</Text>
                <Text style={styles.tableCellHeader}>ROI</Text>
                <Text style={styles.tableCellHeader}>Conv. Rate</Text>
              </View>
              
              {channelMetrics.map((channel, index) => (
                <View key={channel.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowHighlight}>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>{channel.name || `Channel ${index + 1}`}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(channel.budget || 0)}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(channel.performance?.spend || 0)}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(channel.performance?.revenue || 0)}</Text>
                  <Text style={[styles.tableCell, getPerformanceStyle(channel.roi)]}>
                    {formatPercent(channel.roi)}
                  </Text>
                  <Text style={styles.tableCell}>{formatPercent(channel.conversionRate)}</Text>
                </View>
              ))}
              
              {/* Totals row */}
              <View style={[styles.tableRow, { borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 4 }]}>
                <Text style={[styles.tableCell, { flex: 1.5, fontWeight: 'bold' }]}>Total</Text>
                <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>
                  {formatCurrency(totalMarketingBudget)}
                </Text>
                <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>
                  {formatCurrency(totalMarketingSpend)}
                </Text>
                <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>
                  {formatCurrency(totalMarketingRevenue)}
                </Text>
                <Text style={[styles.tableCell, getPerformanceStyle(overallROI), { fontWeight: 'bold' }]}>
                  {formatPercent(overallROI)}
                </Text>
                <Text style={styles.tableCell}></Text>
              </View>
            </View>
          ) : (
            <Text style={styles.subtitle}>No channel performance data available.</Text>
          )}
        </View>

        {/* Key Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Performance Metrics</Text>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Total Impressions</Text>
              <Text style={styles.value}>
                {formatNumber(recentActuals.length > 0 
                  ? recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.impressions || 0), 0) || 0
                  : 0)}
              </Text>
            </View>
            
            <View style={styles.col}>
              <Text style={styles.label}>Total Clicks</Text>
              <Text style={styles.value}>
                {formatNumber(recentActuals.length > 0 
                  ? recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.clicks || 0), 0) || 0
                  : 0)}
              </Text>
            </View>
            
            <View style={styles.col}>
              <Text style={styles.label}>Total Conversions</Text>
              <Text style={styles.value}>
                {formatNumber(recentActuals.length > 0 
                  ? recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.conversions || 0), 0) || 0
                  : 0)}
              </Text>
            </View>
            
            <View style={styles.col}>
              <Text style={styles.label}>Average CTR</Text>
              <Text style={styles.value}>
                {formatPercent(recentActuals.length > 0 && 
                  recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.impressions || 0), 0) > 0
                  ? (recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.clicks || 0), 0) || 0) / 
                    (recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.impressions || 0), 0) || 1)
                  : 0)}
              </Text>
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Avg. Cost Per Click</Text>
              <Text style={styles.value}>
                {formatCurrency(recentActuals.length > 0 && 
                  recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.clicks || 0), 0) > 0
                  ? (recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.spend || 0), 0) || 0) / 
                    (recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.clicks || 0), 0) || 1)
                  : 0)}
              </Text>
            </View>
            
            <View style={styles.col}>
              <Text style={styles.label}>Avg. Cost Per Acquisition</Text>
              <Text style={styles.value}>
                {formatCurrency(recentActuals.length > 0 && 
                  recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.conversions || 0), 0) > 0
                  ? (recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.spend || 0), 0) || 0) / 
                    (recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.conversions || 0), 0) || 1)
                  : 0)}
              </Text>
            </View>
            
            <View style={styles.col}>
              <Text style={styles.label}>Avg. Revenue Per Conversion</Text>
              <Text style={styles.value}>
                {formatCurrency(recentActuals.length > 0 && 
                  recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.conversions || 0), 0) > 0
                  ? (recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.revenue || 0), 0) || 0) / 
                    (recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.conversions || 0), 0) || 1)
                  : 0)}
              </Text>
            </View>
            
            <View style={styles.col}>
              <Text style={styles.label}>Conversion Rate</Text>
              <Text style={styles.value}>
                {formatPercent(recentActuals.length > 0 && 
                  recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.clicks || 0), 0) > 0
                  ? (recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.conversions || 0), 0) || 0) / 
                    (recentActuals[0].channelPerformance?.reduce((sum, p) => sum + (p.clicks || 0), 0) || 1)
                  : 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Budget Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Optimization Recommendations</Text>
          
          {channelMetrics.length > 0 ? (
            <>
              <Text style={styles.subtitle}>Based on current performance data, we recommend the following budget adjustments:</Text>
              
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>Channel</Text>
                  <Text style={styles.tableCellHeader}>Current Budget</Text>
                  <Text style={styles.tableCellHeader}>Current ROI</Text>
                  <Text style={styles.tableCellHeader}>Recommended Budget</Text>
                  <Text style={styles.tableCellHeader}>Action</Text>
                </View>
                
                {channelMetrics
                  .sort((a, b) => (b.roi || 0) - (a.roi || 0))
                  .map((channel, index) => {
                    // Simplified budget recommendation logic based on ROI
                    const budgetChange = channel.roi > 0.2 ? 1.2 : 
                                       channel.roi > 0 ? 1 : 
                                       channel.roi > -0.2 ? 0.8 : 0.5;
                    
                    const recommendedBudget = (channel.budget || 0) * budgetChange;
                    
                    return (
                      <View key={channel.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowHighlight}>
                        <Text style={[styles.tableCell, { flex: 1.5 }]}>{channel.name || `Channel ${index + 1}`}</Text>
                        <Text style={styles.tableCell}>{formatCurrency(channel.budget || 0)}</Text>
                        <Text style={[styles.tableCell, getPerformanceStyle(channel.roi)]}>
                          {formatPercent(channel.roi)}
                        </Text>
                        <Text style={styles.tableCell}>{formatCurrency(recommendedBudget)}</Text>
                        <Text style={[
                          styles.tableCell, 
                          budgetChange > 1 ? styles.positive : 
                          budgetChange < 1 ? styles.negative : {}
                        ]}>
                          {budgetChange > 1 ? 'Increase' : 
                           budgetChange < 1 ? 'Decrease' : 'Maintain'}
                        </Text>
                      </View>
                    );
                  })}
              </View>
              
              <Text style={styles.disclaimer}>
                Recommendations are based on current performance metrics. Consider other business factors when making final budget decisions.
              </Text>
            </>
          ) : (
            <Text style={styles.subtitle}>Insufficient data to provide budget recommendations.</Text>
          )}
        </View>

        {/* Weekly Performance Trend (stub - would need chart library integration) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Over Time</Text>
          
          {recentActuals.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellHeader}>Week</Text>
                <Text style={styles.tableCellHeader}>Marketing Spend</Text>
                <Text style={styles.tableCellHeader}>Marketing Revenue</Text>
                <Text style={styles.tableCellHeader}>ROI</Text>
                <Text style={styles.tableCellHeader}>Conversion Rate</Text>
              </View>
              
              {recentActuals.map((week, index) => {
                const weekSpend = week.channelPerformance?.reduce((sum, p) => sum + (p.spend || 0), 0) || 0;
                const weekRevenue = week.channelPerformance?.reduce((sum, p) => sum + (p.revenue || 0), 0) || 0;
                const weekROI = weekSpend > 0 ? (weekRevenue - weekSpend) / weekSpend : 0;
                
                // Calculate conversion rate if we have the data
                const weekClicks = week.channelPerformance?.reduce((sum, p) => sum + (p.clicks || 0), 0) || 0;
                const weekConversions = week.channelPerformance?.reduce((sum, p) => sum + (p.conversions || 0), 0) || 0;
                const conversionRate = weekClicks > 0 ? weekConversions / weekClicks : 0;
                
                return (
                  <View key={week.week} style={index % 2 === 0 ? styles.tableRow : styles.tableRowHighlight}>
                    <Text style={styles.tableCell}>Week {week.week}</Text>
                    <Text style={styles.tableCell}>{formatCurrency(weekSpend)}</Text>
                    <Text style={styles.tableCell}>{formatCurrency(weekRevenue)}</Text>
                    <Text style={[styles.tableCell, getPerformanceStyle(weekROI)]}>
                      {formatPercent(weekROI)}
                    </Text>
                    <Text style={styles.tableCell}>{formatPercent(conversionRate)}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.subtitle}>No weekly performance data available.</Text>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Confidential • For internal use only • Generated on {reportDate} by <Text style={styles.companyName}>Fortress Financial Model</Text>
        </Text>
        
        <Text style={styles.pageNumber}>Page 1</Text>
      </Page>
      
      {/* Second page for additional insights */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{info.name} - Marketing Insights</Text>
          <Text style={styles.subtitle}>Generated on {reportDate}</Text>
        </View>

        {/* Channel Effectiveness Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Channel Effectiveness Analysis</Text>
          
          {channelMetrics.length > 0 ? (
            <>
              <Text style={styles.subtitle}>
                This analysis compares key performance indicators across all marketing channels to identify the most effective ones.
              </Text>
              
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>Channel</Text>
                  <Text style={styles.tableCellHeader}>Impressions</Text>
                  <Text style={styles.tableCellHeader}>CTR</Text>
                  <Text style={styles.tableCellHeader}>CPC</Text>
                  <Text style={styles.tableCellHeader}>Conv. Rate</Text>
                  <Text style={styles.tableCellHeader}>CPA</Text>
                </View>
                
                {channelMetrics
                  .filter(channel => channel.performance)
                  .map((channel, index) => {
                    const performance = channel.performance;
                    if (!performance) return null;
                    
                    const impressions = performance.impressions || 0;
                    const clicks = performance.clicks || 0;
                    const conversions = performance.conversions || 0;
                    const spend = performance.spend || 0;
                    
                    const ctr = impressions > 0 ? clicks / impressions : 0;
                    const cpc = clicks > 0 ? spend / clicks : 0;
                    const convRate = clicks > 0 ? conversions / clicks : 0;
                    const cpa = conversions > 0 ? spend / conversions : 0;
                    
                    return (
                      <View key={channel.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowHighlight}>
                        <Text style={[styles.tableCell, { flex: 1.5 }]}>{channel.name || `Channel ${index + 1}`}</Text>
                        <Text style={styles.tableCell}>{formatNumber(impressions)}</Text>
                        <Text style={styles.tableCell}>{formatPercent(ctr)}</Text>
                        <Text style={styles.tableCell}>{formatCurrency(cpc)}</Text>
                        <Text style={styles.tableCell}>{formatPercent(convRate)}</Text>
                        <Text style={styles.tableCell}>{formatCurrency(cpa)}</Text>
                      </View>
                    );
                  })}
              </View>
            </>
          ) : (
            <Text style={styles.subtitle}>No channel performance data available.</Text>
          )}
        </View>

        {/* Revenue Contribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Contribution by Channel</Text>
          
          {channelMetrics.length > 0 ? (
            <>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>Channel</Text>
                  <Text style={styles.tableCellHeader}>Revenue</Text>
                  <Text style={styles.tableCellHeader}>% of Total</Text>
                  <Text style={[styles.tableCellHeader, { flex: 3 }]}>Distribution</Text>
                </View>
                
                {channelMetrics
                  .filter(channel => channel.performance && (channel.performance.revenue || 0) > 0)
                  .sort((a, b) => ((b.performance?.revenue || 0) - (a.performance?.revenue || 0)))
                  .map((channel, index) => {
                    const revenue = channel.performance?.revenue || 0;
                    const percentage = totalMarketingRevenue > 0 ? revenue / totalMarketingRevenue : 0;
                    
                    return (
                      <View key={channel.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowHighlight}>
                        <Text style={[styles.tableCell, { flex: 1.5 }]}>{channel.name || `Channel ${index + 1}`}</Text>
                        <Text style={styles.tableCell}>{formatCurrency(revenue)}</Text>
                        <Text style={styles.tableCell}>{formatPercent(percentage)}</Text>
                        <View style={[styles.tableCell, { flex: 3 }]}>
                          <View style={{ flexDirection: 'row', height: 12, alignItems: 'center' }}>
                            <View 
                              style={{ 
                                height: 8, 
                                width: `${percentage * 100}%`, 
                                backgroundColor: COLORS[Object.keys(COLORS)[index % Object.keys(COLORS).length]],
                                borderRadius: 4
                              }} 
                            />
                          </View>
                        </View>
                      </View>
                    );
                  })}
              </View>
            </>
          ) : (
            <Text style={styles.subtitle}>No revenue contribution data available.</Text>
          )}
        </View>

        {/* Recommendations and Action Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations and Action Items</Text>
          
          <View style={styles.callout}>
            <Text style={styles.calloutText}>
              Based on the performance data and analysis in this report, consider the following strategic recommendations.
            </Text>
          </View>
          
          {channelMetrics.length > 0 ? (
            <View>
              {/* High performing channels */}
              {channelMetrics.filter(c => c.roi > 0.2).length > 0 && (
                <View style={styles.row}>
                  <Text style={[styles.label, { flex: 1, fontWeight: 'bold' }]}>High-Performing Channels:</Text>
                  <Text style={[styles.value, { flex: 4 }]}>
                    {channelMetrics.filter(c => c.roi > 0.2).map(c => c.name).join(', ')}
                    {` - Consider increasing budget allocation to these channels to maximize ROI.`}
                  </Text>
                </View>
              )}
              
              {/* Underperforming channels */}
              {channelMetrics.filter(c => c.roi < 0).length > 0 && (
                <View style={styles.row}>
                  <Text style={[styles.label, { flex: 1, fontWeight: 'bold' }]}>Underperforming Channels:</Text>
                  <Text style={[styles.value, { flex: 4 }]}>
                    {channelMetrics.filter(c => c.roi < 0).map(c => c.name).join(', ')}
                    {` - Review and optimize campaigns or consider reallocating budget to better-performing channels.`}
                  </Text>
                </View>
              )}
              
              {/* General recommendations */}
              <View style={[styles.row, { marginTop: 10 }]}>
                <Text style={[styles.label, { flex: 1, fontWeight: 'bold' }]}>General Actions:</Text>
                <View style={{ flex: 4 }}>
                  <Text style={styles.value}>1. Schedule a marketing review meeting to discuss findings.</Text>
                  <Text style={styles.value}>2. Update campaign targeting based on performance data.</Text>
                  <Text style={styles.value}>3. Implement A/B testing for underperforming channels.</Text>
                  <Text style={styles.value}>4. Review marketing budget allocation for next quarter.</Text>
                  <Text style={styles.value}>5. Set new KPIs based on current performance benchmarks.</Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.subtitle}>
              Insufficient data to provide specific recommendations. Consider implementing more robust 
              tracking of marketing metrics across channels.
            </Text>
          )}
        </View>
        
        {/* Methodology */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Methodology and Definitions</Text>
          
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>ROI</Text>
              <Text style={[styles.tableCell, { flex: 4 }]}>
                Return on Investment = (Revenue - Spend) / Spend
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>CTR</Text>
              <Text style={[styles.tableCell, { flex: 4 }]}>
                Click-Through Rate = Clicks / Impressions
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>CPC</Text>
              <Text style={[styles.tableCell, { flex: 4 }]}>
                Cost Per Click = Spend / Clicks
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>Conv. Rate</Text>
              <Text style={[styles.tableCell, { flex: 4 }]}>
                Conversion Rate = Conversions / Clicks
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>CPA</Text>
              <Text style={[styles.tableCell, { flex: 4 }]}>
                Cost Per Acquisition = Spend / Conversions
              </Text>
            </View>
          </View>
          
          <Text style={styles.disclaimer}>
            This report uses data from the Fortress Financial Model and may include metrics from 
            integrated marketing platforms. Performance metrics are calculated based on available data 
            and may not reflect all marketing activities. For questions regarding methodology, please 
            contact the marketing analytics team.
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Confidential • For internal use only • Generated on {reportDate} by <Text style={styles.companyName}>Fortress Financial Model</Text>
        </Text>
        
        <Text style={styles.pageNumber}>Page 2</Text>
      </Page>
    </Document>
  );
};

// Function to generate the marketing PDF
export async function generateMarketingPDF(product: Product): Promise<Blob> {
  return await pdf(<MarketingReportPDF product={product} />).toBlob();
} 
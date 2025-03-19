import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { format } from 'date-fns';
import type { Product } from '../types';
import { formatCurrency, formatNumber, formatPercent } from './utils';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    padding: 5,
    backgroundColor: '#f3f4f6',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    color: '#666',
  },
  value: {
    fontSize: 12,
    marginBottom: 5,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
  },
});

// Create Document Component
const DashboardPDF = ({ product }: { product: Product }) => {
  const {
    info,
    weeklyProjections,
    actualMetrics = [],
    growthMetrics,
    revenueMetrics,
    costMetrics,
  } = product;

  // Calculate key metrics
  const totalRevenue = weeklyProjections.reduce((sum, week) => sum + week.totalRevenue, 0);
  const totalCosts = weeklyProjections.reduce((sum, week) => sum + week.totalCosts, 0);
  const totalProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;
  const breakEvenWeek = weeklyProjections.findIndex(w => w.cumulativeProfit > 0) + 1;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{info.name} - Financial Dashboard</Text>
          <Text style={styles.subtitle}>Generated on {format(new Date(), 'PPP')}</Text>
          <Text style={styles.subtitle}>Product Type: {info.type}</Text>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Total Revenue</Text>
              <Text style={styles.value}>{formatCurrency(totalRevenue)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Total Costs</Text>
              <Text style={styles.value}>{formatCurrency(totalCosts)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Profit Margin</Text>
              <Text style={styles.value}>{formatPercent(profitMargin)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Break-even Week</Text>
              <Text style={styles.value}>Week {breakEvenWeek}</Text>
            </View>
          </View>
        </View>

        {/* Growth Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Growth Metrics</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Weekly Visitors</Text>
              <Text style={styles.value}>{formatNumber(growthMetrics?.weeklyVisitors || 0)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Growth Rate</Text>
              <Text style={styles.value}>{formatPercent((growthMetrics?.weeklyGrowthRate || 0) / 100)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Return Visit Rate</Text>
              <Text style={styles.value}>{formatPercent(growthMetrics?.returnVisitRate || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Weekly Projections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Projections</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCell}>Week</Text>
              <Text style={styles.tableCell}>Revenue</Text>
              <Text style={styles.tableCell}>Costs</Text>
              <Text style={styles.tableCell}>Profit</Text>
              <Text style={styles.tableCell}>Cumulative</Text>
            </View>
            {weeklyProjections.slice(0, 8).map((week) => (
              <View key={week.week} style={styles.tableRow}>
                <Text style={styles.tableCell}>Week {week.week}</Text>
                <Text style={styles.tableCell}>{formatCurrency(week.totalRevenue)}</Text>
                <Text style={styles.tableCell}>{formatCurrency(week.totalCosts)}</Text>
                <Text style={styles.tableCell}>{formatCurrency(week.weeklyProfit)}</Text>
                <Text style={styles.tableCell}>{formatCurrency(week.cumulativeProfit)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actual Performance */}
        {actualMetrics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actual Performance</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCell}>Week</Text>
                <Text style={styles.tableCell}>Revenue</Text>
                <Text style={styles.tableCell}>Costs</Text>
                <Text style={styles.tableCell}>Profit</Text>
                <Text style={styles.tableCell}>vs Forecast</Text>
              </View>
              {actualMetrics.slice(0, 8).map((metric) => {
                const forecast = weeklyProjections.find(p => p.week === metric.week);
                const variance = forecast 
                  ? ((metric.weeklyProfit - forecast.weeklyProfit) / Math.abs(forecast.weeklyProfit)) * 100 
                  : 0;
                
                return (
                  <View key={metric.week} style={styles.tableRow}>
                    <Text style={styles.tableCell}>Week {metric.week}</Text>
                    <Text style={styles.tableCell}>{formatCurrency(metric.totalRevenue)}</Text>
                    <Text style={styles.tableCell}>{formatCurrency(metric.totalCosts)}</Text>
                    <Text style={styles.tableCell}>{formatCurrency(metric.weeklyProfit)}</Text>
                    <Text style={styles.tableCell}>{variance.toFixed(1)}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by Fortress Financial Model • {format(new Date(), 'PPP')}
        </Text>
      </Page>
    </Document>
  );
};

export async function generateDashboardPDF(product: Product): Promise<Blob> {
  return await pdf(<DashboardPDF product={product} />).toBlob();
}
// Custom type definitions

export interface MarketingChannelItem {
  id: string;
  name: string;
  platform: string;
  budget?: number;
  expectedROI?: number;
  audienceSize?: number;
  targetCPA?: number;
  conversionRate?: number;
  cpc?: number;
  settings?: Record<string, unknown>;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  salesVolume: number;
  marketShare: number;
  growthRate: number;
}

export interface Scenario {
  id: string;
  name: string;
  products: Product[];
  timestamp?: number;
}

export type StorageMode = 'local' | 'firebase';

export interface FirestoreOperation {
  type: 'set' | 'delete';
  collectionName: string;
  docId: string;
  data?: any;
}

// Other interface definitions
export interface WeeklyActuals {
  weekNumber: number;
  revenue: number;
  costs: number;
  profit: number;
  date: number;
  marketingPerformance: {
    channelId: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }[];
}

// Type definitions for chart data
export interface ChartEntry {
  name: string;
  value: number;
  color?: string;
  [key: string]: unknown;
}

// Type definition for tooltip payload
export interface TooltipPayload {
  value: number;
  name: string;
  payload: {
    name: string;
    value: number;
    isFullTime?: boolean;
    [key: string]: unknown;
  };
  color: string;
  dataKey: string;
  [key: string]: unknown;
} 
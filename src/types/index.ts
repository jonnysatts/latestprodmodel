// Export event handler types
export * from './eventHandlers';

// New interfaces for Weekly Actuals tracking
export interface WeeklyActuals {
  id: string;
  date: string;
  week: number;
  // Attendance metrics
  numberOfEvents?: number;
  footTraffic?: number;
  averageEventAttendance?: number;
  
  // Revenue breakdown
  revenue: number;  // Total revenue (for backward compatibility)
  ticketRevenue?: number;
  fbRevenue?: number;
  merchandiseRevenue?: number;
  digitalRevenue?: number;
  
  // Cost breakdown
  expenses: number;  // Total expenses (for backward compatibility)
  marketingCosts?: number;
  staffingCosts?: number;
  eventCosts?: number;
  additionalCosts?: number;
  fbCogs?: number;  // F&B Cost of Goods Sold
  
  conversions: number;
  notes: string;
}

// Projected financials interface
export interface ProjectedFinancials {
  id?: string;
  productId?: string;
  period: number;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductInfo {
  id: string;
  name: string;
  type: 'Experiential Events' | 'Venue-Based Activations' | 'Food & Beverage Products' | 'Merchandise Drops' | 'Digital Products';
  description: string;
  logo: string | null;
  targetAudience: string;
  developmentStartDate: Date;
  developmentEndDate: Date;
  launchDate: Date;
  forecastPeriod: number;
  forecastType: 'per-event' | 'weekly' | 'monthly' | 'quarterly';
  eventsPerWeek?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GrowthMetrics {
  id?: string;
  productId?: string;
  totalVisitors: number;
  weeklyVisitors: number;
  visitorsPerEvent: number;
  growthModel: 'Exponential' | 'Decay' | 'Seasonal';
  weeklyGrowthRate: number;
  peakDayAttendance: number;
  lowDayAttendance: number;
  returnVisitRate: number;
  wordOfMouthRate: number;
  socialMediaConversion: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RevenueMetrics {
  id?: string;
  productId?: string;
  ticketPrice: number;
  ticketSalesRate: number;
  fbSpend: number;
  fbConversionRate: number;
  merchandiseSpend: number;
  merchandiseConversionRate: number;
  digitalPrice: number;
  digitalConversionRate: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CostDepreciation {
  enabled: boolean;
  startWeek: number;
  weeklyDepreciationRate: number;
  minimumAmount: number;
}

export interface MarketingChannelItem {
  id: string;
  name?: string;
  budget?: number;
  allocation?: number; // Percentage of total marketing budget
  targetAudience?: string; // Target demographic or audience segment
  description?: string; // Description of the marketing channel and strategy
}

export interface MarketingCosts {
  budget?: number;
  roi?: number;
  channels?: MarketingChannelItem[];
  allocationMode?: 'simple' | 'channels';
  type?: 'weekly' | 'campaign';
  weeklyBudget?: number;
  campaignBudget?: number;
  campaignDurationWeeks?: number;
  depreciation?: CostDepreciation;
}

export interface StaffRoleItem {
  id: string;
  role: string;
  count: number;
  costPerPerson: number;
  isFullTime?: boolean;
  notes: string;
}

export interface EventCostItem {
  id: string;
  name: string;
  amount: number;
}

export interface SetupCostItem {
  id: string;
  name: string;
  amount: number;
  amortize: boolean;
}

export interface CostMetrics {
  id?: string;
  productId?: string;
  marketing: MarketingCosts;
  additionalStaffingPerEvent: number;
  staffingCostPerPerson: number;
  staffRoles: StaffRoleItem[];
  staffingAllocationMode?: 'simple' | 'detailed';
  weeklyStaffCost?: number;
  eventCosts: EventCostItem[];
  setupCosts: SetupCostItem[];
  // Cost of Goods Sold data
  fbCogPercentage: number; // Percentage of F&B revenue (default 30%)
  merchandiseCogPerUnit: number; // Per-unit cost for merchandise
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerMetrics {
  id?: string;
  productId?: string;
  visitDuration: number;
  satisfactionScore: number;
  nps: number;
  returnIntent: number;
  communityEngagement: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WeeklyProjection {
  id?: string;
  productId?: string;
  week: number;
  numberOfEvents: number;
  footTraffic: number;
  averageEventAttendance: number;
  ticketRevenue: number;
  fbRevenue: number;
  merchandiseRevenue: number;
  digitalRevenue: number;
  totalRevenue: number;
  marketingCosts: number;
  staffingCosts: number;
  eventCosts: number;
  setupCosts: number;
  // COGS breakdown
  fbCogs: number; // Cost of Goods Sold for F&B
  merchandiseCogs: number; // Cost of Goods Sold for Merchandise
  totalCosts: number;
  weeklyProfit: number;
  cumulativeProfit: number;
  notes: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MarketingChannelPerformance {
  channelId: string;
  spend?: number;
  revenue?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
}

export interface ActualMetrics {
  id: string;
  week: number;
  year: number;
  name?: string;
  date?: string;
  
  // Revenue breakdowns - aligned with WeeklyProjection
  revenue?: number;  // Total revenue (legacy support)
  ticketRevenue?: number;
  fbRevenue?: number;
  merchandiseRevenue?: number;
  digitalRevenue?: number;
  totalRevenue?: number;  // Sum of all revenue sources
  
  // Attendance metrics - aligned with WeeklyProjection
  eventCount?: number;  // Legacy support
  numberOfEvents?: number;  // New field aligned with WeeklyProjection
  footTraffic?: number;
  averageEventAttendance?: number;
  
  // Cost breakdowns - aligned with WeeklyProjection where possible
  marketingCost?: number;
  staffCost?: number;
  headcount?: number;
  eventsCosts?: number;
  setupCosts?: number;
  technologyCost?: number;
  officeCost?: number;
  otherCosts?: number;
  totalCosts?: number;  // Sum of all costs
  
  // Performance metrics
  channelPerformance?: MarketingChannelPerformance[];
  weeklyProfit?: number;
  cumulativeProfit?: number;
  notes?: string;
}

export const RISK_TYPES = [
  'Revenue',
  'Operational',
  'Market',
  'Financial', 
  'Sponsorship',
  'Community',
  'Legal/Regulatory',
  'Technical',
  'Strategic',
  'Reputational',
  'Environmental',
  'Supply Chain',
  'Human Resources'
] as const;

export const LIKELIHOOD_LEVELS = ['Low', 'Medium', 'High'] as const;
export const IMPACT_LEVELS = ['Low', 'Medium', 'High'] as const;
export const STATUS_OPTIONS = ['Open', 'Mitigated', 'Closed', 'Monitoring'] as const;

export type RiskType = typeof RISK_TYPES[number];
export type LikelihoodLevel = typeof LIKELIHOOD_LEVELS[number];
export type ImpactLevel = typeof IMPACT_LEVELS[number];
export type StatusOption = typeof STATUS_OPTIONS[number];

export interface RiskAssessment {
  id: string;
  type: RiskType;
  description: string;
  likelihood: LikelihoodLevel;
  financialImpact: number;
  mitigationStrategy: string;
  owner: string;
  status: StatusOption;
  impact: ImpactLevel;
  riskScore: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MarketMetrics {
  totalAddressableMarket: number;
  servicableAddressableMarket: number;
  servicableObtainableMarket: number;
  yearlyGrowthRate: number;
  costScalingRate: number;
  competitiveBenchmarks?: {
    competitorName: string;
    marketShare: number;
    estimatedRevenue: number;
    strengths: string;
    weaknesses: string;
  }[];
  industryTrends?: string[];
}

export interface SeasonalAnalysis {
  id?: string;
  productId?: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  seasonalImpactFactor: number;
  projectedRevenue: number;
  projectedCosts: number;
  notes: string;
}

export interface VariableSensitivity {
  variable: string;
  baseValue: number;
  lowValue: number;
  highValue: number;
  impact: 'High' | 'Medium' | 'Low';
}

export interface ScenarioParameter {
  name: string;
  baseValue: number;
  adjustedValue: number;
  unit: string;
  description: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  productId: string;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Revenue adjustments
  ticketPriceAdjustment?: number;
  ticketSalesRateAdjustment?: number;
  fbSpendAdjustment?: number;
  fbConversionRateAdjustment?: number;
  merchandiseSpendAdjustment?: number;
  merchandiseConversionRateAdjustment?: number;
  digitalPriceAdjustment?: number;
  
  // Cost adjustments
  venueCostAdjustment?: number;
  staffingCostAdjustment?: number;
  marketingCostAdjustment?: number;
  merchandiseCostAdjustment?: number;
  equipmentCostAdjustment?: number;
  licensingCostAdjustment?: number;
  developmentCostAdjustment?: number;
  
  // Attendance adjustments
  weeklyVisitorsAdjustment?: number;
  visitorsPerEventAdjustment?: number;
  weeklyGrowthRateAdjustment?: number;
  returnVisitRateAdjustment?: number;
  
  // Projected outcomes
  projectedRevenue?: number;
  projectedCosts?: number;
  projectedProfit?: number;
  projectedAttendance?: number;
  
  // Original metrics for comparison
  originalRevenue?: number;
  originalCosts?: number;
  originalProfit?: number;
  originalAttendance?: number;
  
  // Additional properties
  isActive?: boolean;
  notes?: string;
}

export interface Product {
  id: string;
  info: ProductInfo;
  growthMetrics: GrowthMetrics | null;
  revenueMetrics: RevenueMetrics | null;
  costMetrics: CostMetrics | null;
  customerMetrics: CustomerMetrics | null;
  marketMetrics?: MarketMetrics;
  weeklyProjections: WeeklyProjection[];
  actualMetrics: ActualMetrics[];
  actuals: WeeklyActuals[];
  risks: RiskAssessment[];
  seasonalAnalysis?: SeasonalAnalysis[];
  scenarios?: Scenario[];
}

export const DEFAULT_GROWTH_METRICS: GrowthMetrics = {
  totalVisitors: 0,
  weeklyVisitors: 0,
  visitorsPerEvent: 0,
  growthModel: 'Exponential',
  weeklyGrowthRate: 0,
  peakDayAttendance: 0,
  lowDayAttendance: 0,
  returnVisitRate: 0,
  wordOfMouthRate: 0,
  socialMediaConversion: 0
};

export const DEFAULT_REVENUE_METRICS: RevenueMetrics = {
  ticketPrice: 0,
  ticketSalesRate: 1,
  fbSpend: 0,
  fbConversionRate: 1,
  merchandiseSpend: 0,
  merchandiseConversionRate: 1,
  digitalPrice: 0,
  digitalConversionRate: 1
};

export const DEFAULT_COST_METRICS: CostMetrics = {
  marketing: {
    budget: 0,
    roi: 0,
    channels: []
  },
  additionalStaffingPerEvent: 0,
  staffingCostPerPerson: 0,
  staffRoles: [],
  staffingAllocationMode: 'simple',
  weeklyStaffCost: 0,
  eventCosts: [],
  setupCosts: [],
  // Default COGS values
  fbCogPercentage: 30, // 30% default COGS for F&B
  merchandiseCogPerUnit: 0 // Default to 0, should be set based on product
};

export const DEFAULT_CUSTOMER_METRICS: CustomerMetrics = {
  visitDuration: 0,
  satisfactionScore: 0,
  nps: 0,
  returnIntent: 0,
  communityEngagement: 0
};

export const DEFAULT_SEASONAL_ANALYSIS: SeasonalAnalysis[] = [
  { quarter: 'Q1', seasonalImpactFactor: 1.0, projectedRevenue: 0, projectedCosts: 0, notes: '' },
  { quarter: 'Q2', seasonalImpactFactor: 1.0, projectedRevenue: 0, projectedCosts: 0, notes: '' },
  { quarter: 'Q3', seasonalImpactFactor: 1.0, projectedRevenue: 0, projectedCosts: 0, notes: '' },
  { quarter: 'Q4', seasonalImpactFactor: 1.0, projectedRevenue: 0, projectedCosts: 0, notes: '' }
];

export interface ScenarioModel {
  id: string;
  name: string;
  productId: string;
  description: string;
  modifiers: {
    revenue: {
      ticketRevenue: number; // percentage change
      fbRevenue: number;
      merchandiseRevenue: number;
      digitalRevenue: number;
    };
    costs: {
      marketingCost: number;
      staffingCost: number;
      eventCost: number;
      setupCost: number;
    };
    attendance: number; // percentage change to footTraffic
  };
  createdAt: string;
  updatedAt: string; // was lastModified before
  variant?: 'optimistic' | 'pessimistic' | 'neutral' | 'custom';
}

// If StoreState exists, augment it, otherwise create it
export interface StoreState {
  // ... existing state properties ...
  scenarios: ScenarioModel[];
}
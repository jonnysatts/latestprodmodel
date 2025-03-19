import type { 
  ProductInfo,
  GrowthMetrics, 
  RevenueMetrics, 
  CostMetrics,
  WeeklyProjection 
} from '../types';

export function generateWeeklyProjections(
  productInfo: ProductInfo,
  growthMetrics: GrowthMetrics | null,
  revenueMetrics: RevenueMetrics | null,
  costMetrics: CostMetrics | null
): WeeklyProjection[] {
  const projections: WeeklyProjection[] = [];
  let cumulativeProfit = 0;

  // Default values if nulls are passed in
  const growthMetricsDefault: GrowthMetrics = growthMetrics || {
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

  const revenueMetricsDefault: RevenueMetrics = revenueMetrics || {
    ticketPrice: 0,
    ticketSalesRate: 0,
    fbSpend: 0,
    fbConversionRate: 0,
    merchandiseSpend: 0,
    merchandiseConversionRate: 0,
    digitalPrice: 0,
    digitalConversionRate: 0
  };

  const costMetricsDefault: CostMetrics = costMetrics || {
    marketing: {
      type: 'weekly',
      weeklyBudget: 0,
      campaignBudget: undefined,
      campaignDurationWeeks: undefined,
      depreciation: {
        enabled: false,
        startWeek: 1,
        weeklyDepreciationRate: 0,
        minimumAmount: 0
      },
      channels: [],
      allocationMode: 'channels'
    },
    additionalStaffingPerEvent: 0,
    staffingCostPerPerson: 0,
    staffRoles: [],
    eventCosts: [],
    setupCosts: [],
    fbCogPercentage: 30,
    merchandiseCogPerUnit: 0
  };

  // Calculate weekly marketing budget based on type and depreciation
  const getMarketingCostForWeek = (week: number): number => {
    let baseCost = 0;
    const marketing = costMetricsDefault.marketing;

    // Determine which allocation mode to use
    const useChannels = marketing.allocationMode === 'channels' || 
                      (!marketing.allocationMode && marketing.channels && marketing.channels.length > 0);
    
    // Simple mode or no channels defined - use legacy approach
    if (!useChannels) {
      if (marketing.type === 'weekly') {
        baseCost = marketing.weeklyBudget || 0;
      } else if (marketing.type === 'campaign') {
        const campaignBudget = marketing.campaignBudget || 0;
        const campaignDuration = marketing.campaignDurationWeeks || 1;
        
        // Only apply campaign budget during the campaign duration
        if (week <= campaignDuration) {
          baseCost = campaignBudget / campaignDuration;
        }
      }
    } 
    // Channels mode - calculate from channel budgets
    else if (marketing.channels && marketing.channels.length > 0) {
      // Sum up the weekly budgets from all channels
      baseCost = marketing.channels.reduce((total, channel) => total + (channel.budget || 0), 0);
      
      // Calculate the marketing-to-revenue ratio for logging
      const weeklyRevenue = calculateWeeklyRevenueEstimate(
        productInfo, 
        growthMetricsDefault, 
        revenueMetricsDefault, 
        week
      );
      
      if (week === 1 && weeklyRevenue > 0) {
        const marketingToRevenueRatio = (baseCost / weeklyRevenue) * 100;
        console.log(`WEEK 1 Marketing-to-Revenue Ratio: ${marketingToRevenueRatio.toFixed(2)}%`);
      }
    }

    // Apply depreciation if enabled
    if (marketing.depreciation?.enabled) {
      const startWeek = marketing.depreciation.startWeek || 1;
      const rate = marketing.depreciation.weeklyDepreciationRate || 0;
      const minAmount = marketing.depreciation.minimumAmount || 0;

      if (week >= startWeek) {
        const weeksAfterStart = week - startWeek;
        const depreciation = Math.pow(1 - (rate / 100), weeksAfterStart);
        baseCost = Math.max(baseCost * depreciation, minAmount);
      }
    }

    return baseCost;
  };
  
  // Helper function to estimate weekly revenue for a specific week
  // This is used for marketing-to-revenue ratio calculations
  const calculateWeeklyRevenueEstimate = (
    productInfo: ProductInfo,
    growthMetrics: GrowthMetrics,
    revenueMetrics: RevenueMetrics,
    week: number
  ): number => {
    // Calculate attendance for this week
    const baseVisitors = productInfo.forecastType === 'per-event' 
      ? (growthMetrics.visitorsPerEvent || 0) * (productInfo.eventsPerWeek || 1)
      : growthMetrics.weeklyVisitors || 0;
    
    const growthRate = (growthMetrics.weeklyGrowthRate || 0) / 100;
    const growthFactor = Math.pow(1 + growthRate, week - 1);
    const visitors = Math.round(baseVisitors * growthFactor);
    
    // Calculate revenue
    const ticketRevenue = visitors * (revenueMetrics.ticketPrice || 0) * (revenueMetrics.ticketSalesRate || 0);
    const fbRevenue = visitors * (revenueMetrics.fbSpend || 0) * (revenueMetrics.fbConversionRate || 0);
    const merchandiseRevenue = visitors * (revenueMetrics.merchandiseSpend || 0) * (revenueMetrics.merchandiseConversionRate || 0);
    const digitalRevenue = visitors * (revenueMetrics.digitalPrice || 0) * (revenueMetrics.digitalConversionRate || 0);
    
    return ticketRevenue + fbRevenue + merchandiseRevenue + digitalRevenue;
  };

  // Calculate setup costs for the week
  const getSetupCostsForWeek = (week: number): number => {
    if (!costMetricsDefault.setupCosts || !Array.isArray(costMetricsDefault.setupCosts)) {
      return 0;
    }

    return costMetricsDefault.setupCosts.reduce((total, cost) => {
      if (cost.amortize) {
        // Distribute cost evenly across all weeks
        return total + (cost.amount / (productInfo.forecastPeriod || 12));
      } else {
        // Apply all cost in week 1
        return total + (week === 1 ? cost.amount : 0);
      }
    }, 0);
  };

  // Calculate total event costs
  const getEventCostsForWeek = (): number => {
    if (!costMetricsDefault.eventCosts || !Array.isArray(costMetricsDefault.eventCosts)) {
      return 0;
    }

    return costMetricsDefault.eventCosts.reduce((total, cost) => total + (cost.amount || 0), 0);
  };

  // Calculate staffing costs based on roles or legacy fields
  const getStaffingCostsForWeek = (): number => {
    const eventsPerWeek = productInfo.eventsPerWeek || 1;
    let staffingCost = 0;
    
    // Calculate from staff roles if defined
    if (costMetricsDefault.staffRoles && costMetricsDefault.staffRoles.length > 0) {
      staffingCost = costMetricsDefault.staffRoles.reduce((total, role) => {
        const roleCount = role.count || 0;
        const costPerPerson = role.costPerPerson || 0;
        
        // Calculate differently for full-time vs event staff
        if (role.isFullTime) {
          // Full-time staff cost is fixed per week regardless of events
          return total + (roleCount * costPerPerson);
        } else {
          // Event staff cost depends on the number of events
          return total + (roleCount * costPerPerson * eventsPerWeek);
        }
      }, 0);
    } else {
      // Use legacy fields if no roles defined
      staffingCost = eventsPerWeek * 
        ((costMetricsDefault.additionalStaffingPerEvent || 0) * (costMetricsDefault.staffingCostPerPerson || 0));
    }
    
    return staffingCost;
  };

  // Generate projections for each week
  for (let week = 1; week <= (productInfo.forecastPeriod || 12); week++) {
    // Calculate attendance
    const baseVisitors = productInfo.forecastType === 'per-event' 
      ? (growthMetricsDefault.visitorsPerEvent || 0) * (productInfo.eventsPerWeek || 1)
      : growthMetricsDefault.weeklyVisitors || 0;
    
    const growthRate = (growthMetricsDefault.weeklyGrowthRate || 0) / 100;
    // Apply weekly growth rate: (base * (1+rate)^(week-1))
    const growthFactor = Math.pow(1 + growthRate, week - 1);
    const visitors = Math.round(baseVisitors * growthFactor);
    
    // Log growth calculation details for first few weeks
    if (week <= 3) {
      console.log(`WEEK ${week} GROWTH CALCULATION:`);
      console.log(`  Base visitors: ${baseVisitors}`);
      console.log(`  Weekly growth rate: ${(growthRate * 100).toFixed(2)}%`);
      console.log(`  Growth factor: ${growthFactor.toFixed(4)} (1+${growthRate})^${week-1}`);
      console.log(`  Calculated visitors: ${visitors}`);
    }
    
    // Calculate revenue
    const ticketRevenue = visitors * (revenueMetricsDefault.ticketPrice || 0) * (revenueMetricsDefault.ticketSalesRate || 0);
    const fbRevenue = visitors * (revenueMetricsDefault.fbSpend || 0) * (revenueMetricsDefault.fbConversionRate || 0);
    const merchandiseRevenue = visitors * (revenueMetricsDefault.merchandiseSpend || 0) * (revenueMetricsDefault.merchandiseConversionRate || 0);
    const digitalRevenue = visitors * (revenueMetricsDefault.digitalPrice || 0) * (revenueMetricsDefault.digitalConversionRate || 0);
    const totalRevenue = ticketRevenue + fbRevenue + merchandiseRevenue + digitalRevenue;

    // Log revenue calculation for first few weeks 
    if (week <= 3) {
      console.log(`  Revenue calculations for ${visitors} visitors:`);
      console.log(`    Ticket revenue: ${ticketRevenue.toFixed(2)}`);
      console.log(`    F&B revenue: ${fbRevenue.toFixed(2)}`);
      console.log(`    Merchandise revenue: ${merchandiseRevenue.toFixed(2)}`);
      console.log(`    Digital revenue: ${digitalRevenue.toFixed(2)}`);
      console.log(`    Total revenue: ${totalRevenue.toFixed(2)}`);
    }
    
    // Calculate costs
    const marketingCosts = getMarketingCostForWeek(week);
    const setupCosts = getSetupCostsForWeek(week);
    const eventCosts = getEventCostsForWeek();
    const staffingCosts = getStaffingCostsForWeek();

    // Calculate COGS based on product type
    // Ensure we always have a valid percentage between 0-100
    const fbCogPercentage = Math.min(Math.max(costMetricsDefault.fbCogPercentage || 30, 0), 100);
    const fbCogs = fbRevenue * (fbCogPercentage / 100);
    
    // Debug log for important values in first week
    if (week === 1) {
      console.log('CALCULATIONS LIB - WEEK 1:');
      console.log('F&B Revenue:', fbRevenue);
      console.log('F&B COGS %:', fbCogPercentage);
      console.log('F&B COGS Amount:', fbCogs);
    }
    
    // For merchandise, calculate COGS based on units sold
    let merchandiseCogs = 0;
    if (productInfo.type === 'Food & Beverage Products' || productInfo.type === 'Merchandise Drops') {
      // For merchandise products, use the per-unit COGS
      const merchandiseUnits = merchandiseRevenue / (revenueMetricsDefault.merchandiseSpend || 1);
      merchandiseCogs = merchandiseUnits * (costMetricsDefault.merchandiseCogPerUnit || 0);
    }

    const totalCosts = marketingCosts + setupCosts + staffingCosts + eventCosts + fbCogs + merchandiseCogs;

    // Calculate profits
    const weeklyProfit = totalRevenue - totalCosts;
    cumulativeProfit += weeklyProfit;

    projections.push({
      week,
      numberOfEvents: productInfo.eventsPerWeek || 1,
      footTraffic: visitors,
      averageEventAttendance: Math.round(visitors / (productInfo.eventsPerWeek || 1)),
      ticketRevenue,
      fbRevenue,
      merchandiseRevenue,
      digitalRevenue,
      totalRevenue,
      marketingCosts,
      staffingCosts,
      eventCosts,
      setupCosts,
      fbCogs,
      merchandiseCogs,
      totalCosts,
      weeklyProfit,
      cumulativeProfit,
      notes: ''
    });
  }

  return projections;
}
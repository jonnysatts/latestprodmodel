import React, { useState, useEffect, ChangeEvent } from 'react';
import { useParams } from '../types/react-types';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Plus,
  Edit,
  Trash2 as Trash,
  Save,
  X,
  Loader2,
} from 'lucide-react';
import useStore from '../store/useStore';
import { formatCurrency, formatNumber, formatPercent } from "../lib/utils";
import type { 
  Product, 
  WeeklyActuals,
  MarketingChannelItem,
  MarketingChannelPerformance
} from "../types";

// Define a type for component props
interface ActualsTrackerProps {
  standalone?: boolean;
}

// Fix for the React.ChangeEvent typing
type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;

// Add this to the type definitions section
interface ChannelSpendState {
  [key: string]: string;
}

const ActualsTracker = ({ standalone = false }: ActualsTrackerProps) => {
  const { id } = useParams<{ id: string }>();
  const { products, updateProduct } = useStore();
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  // State variables
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [isAddingActual, setIsAddingActual] = useState<boolean>(false);
  const [newActualWeek, setNewActualWeek] = useState<number>(1);
  
  const [editingActualId, setEditingActualId] = useState<string | null>(null);
  
  // Form state variables for the new actuals
  const [newWeekNumber, setNewWeekNumber] = useState<string>("1");
  const [newDate, setNewDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [newEvents, setNewEvents] = useState<string>("");
  const [newFootTraffic, setNewFootTraffic] = useState<string>("");
  const [newAttendance, setNewAttendance] = useState<string>("0");
  
  // Revenue breakdown
  const [newTicketRevenue, setNewTicketRevenue] = useState<string>("");
  const [newFBRevenue, setNewFBRevenue] = useState<string>("");
  const [newMerchandiseRevenue, setNewMerchandiseRevenue] = useState<string>("");
  const [newDigitalRevenue, setNewDigitalRevenue] = useState<string>("");
  
  // Cost breakdown
  const [newMarketingCosts, setNewMarketingCosts] = useState<string>("");
  const [newStaffingCosts, setNewStaffingCosts] = useState<string>("");
  const [newEventCosts, setNewEventCosts] = useState<string>("");
  const [newAdditionalCosts, setNewAdditionalCosts] = useState<string>("");

  // Channel breakdown
  const [showChannelBreakdown, setShowChannelBreakdown] = useState<boolean>(false);
  const [channelSpend, setChannelSpend] = useState<ChannelSpendState>({});
  const [marketingChannels, setMarketingChannels] = useState<MarketingChannelItem[]>([]);

  // Helper to log debug info
  const logDebug = (info: string) => {
    console.log(info);
    setDebugInfo(prev => `${prev}\n${info}`);
  };

  // Get current product with improved debug info
  useEffect(() => {
    if (products.length === 0) {
      logDebug("No products available yet");
      return;
    }

    logDebug(`Looking for product with ID: ${id || 'N/A'}, total products: ${products.length}`);
    
    for (const product of products) {
      logDebug(`Available product: ${product.info.id} - ${product.info.name}`);
    }
  }, [products, id]);

  // Improved product finding with fallbacks
  const findCurrentProduct = (): Product | null => {
    // No products yet
    if (!Array.isArray(products) || products.length === 0) {
      return null;
    }

    let product: Product | null = null;

    // Try to find by ID
    if (id) {
      product = products.find(p => p.info.id === id) || null;
      if (product) {
        return product;
      } else {
        logDebug(`No product found with ID: ${id}, will try alternate methods`);
      }
    }

    // Fallback for standalone mode
    if (standalone && products.length > 0) {
      return products[0];
    }

    // Last resort, just use the first product
    if (products.length > 0 && !product) {
      return products[0];
    }

    return null;
  };

  const currentProduct = findCurrentProduct();

  // Initialize actuals if needed
  useEffect(() => {
    if (!currentProduct) {
      logDebug("No current product to initialize actuals for");
      return;
    }

    if (!Array.isArray(currentProduct.actuals)) {
      setLoading(true);
      
      logDebug(`Initializing actuals for product: ${currentProduct.info.id} - ${currentProduct.info.name}`);
      
      // Simple update with timeout to avoid render loops
      setTimeout(() => {
        try {
          updateProduct({
            ...currentProduct,
            actuals: [] // Initialize as empty array
          });
          logDebug("Successfully initialized actuals as empty array");
        } catch (error) {
          logDebug(`Error initializing actuals: ${error}`);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      logDebug(`Product already has ${currentProduct.actuals.length} actuals`);
    }
  }, [currentProduct, updateProduct]);

  // Load marketing channels from the product
  useEffect(() => {
    if (currentProduct && currentProduct.costMetrics?.marketing?.channels) {
      setMarketingChannels(currentProduct.costMetrics.marketing.channels || []);
    }
  }, [currentProduct]);

  // If no product is found or we're still loading
  if (!currentProduct || loading) {
    return (
      <Card className={standalone ? "" : "mt-6"}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold">Actuals Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 min-h-[200px]">
            <div className="flex items-center mb-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <p className="text-gray-500">
                {!currentProduct ? 'Loading product data...' : 'Initializing actuals data...'}
              </p>
            </div>
            
            {/* Debugging info - remove in production */}
            <div className="text-xs text-left w-full mt-4 text-gray-500 bg-gray-100 p-2 rounded-md">
              <pre className="whitespace-pre-wrap">
                Products Count: {products.length}
                Looking for ID: {id || 'N/A'}
                {debugInfo}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ensure actuals is an array
  const actuals = Array.isArray(currentProduct.actuals) ? currentProduct.actuals : [];

  // Filter actuals by selected year and month
  const weeklyActuals = actuals.filter((actual: WeeklyActuals) => {
    try {
      const date = new Date(actual.date);
      return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
    } catch (e) {
      console.error("Error filtering actual:", e, actual);
      return false;
    }
  }).sort((a: WeeklyActuals, b: WeeklyActuals) => {
    try {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    } catch (e) {
      console.error("Error sorting actuals:", e, a, b);
      return 0;
    }
  });

  // Calculate attendance
  const calculateAttendance = (): number => {
    const events = parseInt(newEvents || "0");
    const footTraffic = parseInt(newFootTraffic || "0");
    
    if (events > 0 && footTraffic > 0) {
      return Math.round(footTraffic / events);
    }
    return 0;
  };

  // Update attendance when events or traffic change
  useEffect(() => {
    setNewAttendance(calculateAttendance().toString());
  }, [newEvents, newFootTraffic]);

  // Total revenue calculation
  const calculateTotalRevenue = (): number => {
    const ticketRev = parseFloat(newTicketRevenue || "0");
    const fbRev = parseFloat(newFBRevenue || "0");
    const merchRev = parseFloat(newMerchandiseRevenue || "0");
    const digitalRev = parseFloat(newDigitalRevenue || "0");
    
    return ticketRev + fbRev + merchRev + digitalRev;
  };

  // Total costs calculation
  const calculateTotalCosts = (): number => {
    const marketingCosts = parseFloat(newMarketingCosts || "0");
    const staffingCosts = parseFloat(newStaffingCosts || "0");
    const eventCosts = parseFloat(newEventCosts || "0");
    const additionalCosts = parseFloat(newAdditionalCosts || "0");
    
    return marketingCosts + staffingCosts + eventCosts + additionalCosts;
  };

  // Handle adding a new actual
  const handleAddActual = () => {
    const week = parseInt(newWeekNumber);
    const events = parseInt(newEvents || "0");
    const footTraffic = parseInt(newFootTraffic || "0");
    
    // Revenue breakdown
    const ticketRevenue = parseFloat(newTicketRevenue || "0");
    const fbRevenue = parseFloat(newFBRevenue || "0");
    const merchandiseRevenue = parseFloat(newMerchandiseRevenue || "0");
    const digitalRevenue = parseFloat(newDigitalRevenue || "0");
    const totalRevenue = ticketRevenue + fbRevenue + merchandiseRevenue + digitalRevenue;
    
    // Cost breakdown
    const marketingCosts = parseFloat(newMarketingCosts || "0");
    const staffingCosts = parseFloat(newStaffingCosts || "0");
    const eventCosts = parseFloat(newEventCosts || "0");
    const additionalCosts = parseFloat(newAdditionalCosts || "0");
    
    // Automatically calculate F&B COGS if we have F&B revenue
    let fbCogs = 0;
    if (fbRevenue > 0 && currentProduct?.costMetrics?.fbCogPercentage) {
      fbCogs = fbRevenue * (currentProduct.costMetrics.fbCogPercentage / 100);
      logDebug(`Auto-calculated F&B COGS of ${fbCogs} based on ${fbRevenue} revenue at ${currentProduct.costMetrics.fbCogPercentage}%`);
    }
    
    // Create channel performance data if we have channel breakdown
    const channelPerformance: MarketingChannelPerformance[] = [];
    if (showChannelBreakdown) {
      Object.entries(channelSpend).forEach(([channelId, spendStr]) => {
        const spend = parseFloat(spendStr || "0");
        if (spend > 0) {
          channelPerformance.push({
            channelId,
            spend
          });
        }
      });
    }
    
    // Add fbCogs to total costs
    const totalCosts = marketingCosts + staffingCosts + eventCosts + additionalCosts + fbCogs;
    
    // Date parsing
    const selectedDate = new Date(newDate);
    
    // Create a new actual
    const newActual: WeeklyActuals = {
      id: `actual-${Date.now()}`,
      date: selectedDate.toISOString(),
      week: week,
      numberOfEvents: events,
      footTraffic: footTraffic,
      averageEventAttendance: events > 0 ? Math.round(footTraffic / events) : 0,
      
      // Revenue breakdown
      ticketRevenue: ticketRevenue,
      fbRevenue: fbRevenue,
      merchandiseRevenue: merchandiseRevenue,
      digitalRevenue: digitalRevenue,
      revenue: totalRevenue,
      
      // Cost breakdown
      marketingCosts: marketingCosts,
      staffingCosts: staffingCosts,
      eventCosts: eventCosts,
      additionalCosts: additionalCosts,
      fbCogs: fbCogs, // Add the calculated F&B COGS
      expenses: totalCosts,
      
      conversions: 0,
      notes: ""
    };
    
    // Create the ActualMetrics object to capture additional analytics
    const newActualMetrics: unknown = {
      id: crypto.randomUUID(),
      week: week,
      year: parseInt(format(new Date(newDate), 'yyyy')),
      date: newDate,
      
      // Revenue breakdown
      revenue: totalRevenue,
      ticketRevenue: ticketRevenue,
      fbRevenue: fbRevenue,
      merchandiseRevenue: merchandiseRevenue,
      digitalRevenue: digitalRevenue,
      totalRevenue: totalRevenue,
      
      // Attendance metrics
      eventCount: events,
      numberOfEvents: events,
      footTraffic: footTraffic,
      averageEventAttendance: events > 0 ? Math.round(footTraffic / events) : 0,
      
      // Cost breakdowns
      marketingCost: marketingCosts,
      staffCost: staffingCosts,
      eventsCosts: eventCosts,
      setupCosts: 0,
      totalCosts: totalCosts,
      
      // Performance metrics
      weeklyProfit: totalRevenue - totalCosts,
      cumulativeProfit: 0, // This will need to be calculated elsewhere
      notes: "",
      
      // Add channel performance if we have it
      channelPerformance: channelPerformance
    };
    
    // Add channel performance if available
    if (channelPerformance.length > 0) {
      // Update the product with both actuals and actualMetrics
      const updatedActuals = [...actuals, newActual];
      const updatedActualMetrics = [...(Array.isArray(currentProduct.actualMetrics) ? currentProduct.actualMetrics : []), newActualMetrics];
      
      logDebug(`Adding new actual with ${channelPerformance.length} channel breakdowns`);
      
      updateProduct({
        ...currentProduct,
        actuals: updatedActuals,
        actualMetrics: updatedActualMetrics
      });
    } else {
      // Add the new actual to the current product without channel performance
      const updatedActuals = [...actuals, newActual];
      
      logDebug(`Adding new actual: Week ${week} with revenue ${totalRevenue} and costs ${totalCosts} (including F&B COGS: ${fbCogs})`);
      
      // Update the product with the new actuals
      updateProduct({
        ...currentProduct,
        actuals: updatedActuals
      });
    }
    
    // Reset the form
    setIsAddingActual(false);
    resetForm();
  };

  // Reset form fields
  const resetForm = () => {
    setNewWeekNumber("1");
    setNewDate(format(new Date(), 'yyyy-MM-dd'));
    setNewEvents("");
    setNewFootTraffic("");
    setNewAttendance("0");
    
    setNewTicketRevenue("");
    setNewFBRevenue("");
    setNewMerchandiseRevenue("");
    setNewDigitalRevenue("");
    
    setNewMarketingCosts("");
    setNewStaffingCosts("");
    setNewEventCosts("");
    setNewAdditionalCosts("");
    
    // Reset channel spend
    setChannelSpend({});
    setShowChannelBreakdown(false);
  };

  // Handle editing an actual
  const handleSaveEdit = () => {
    if (!editingActualId) return;
    
    const week = parseInt(newWeekNumber);
    const events = parseInt(newEvents || "0");
    const footTraffic = parseInt(newFootTraffic || "0");
    
    // Revenue breakdown
    const ticketRevenue = parseFloat(newTicketRevenue || "0");
    const fbRevenue = parseFloat(newFBRevenue || "0");
    const merchandiseRevenue = parseFloat(newMerchandiseRevenue || "0");
    const digitalRevenue = parseFloat(newDigitalRevenue || "0");
    const totalRevenue = ticketRevenue + fbRevenue + merchandiseRevenue + digitalRevenue;
    
    // Cost breakdown
    const marketingCosts = parseFloat(newMarketingCosts || "0");
    const staffingCosts = parseFloat(newStaffingCosts || "0");
    const eventCosts = parseFloat(newEventCosts || "0");
    const additionalCosts = parseFloat(newAdditionalCosts || "0");
    
    // Automatically calculate F&B COGS if we have F&B revenue
    let fbCogs = 0;
    if (fbRevenue > 0 && currentProduct?.costMetrics?.fbCogPercentage) {
      fbCogs = fbRevenue * (currentProduct.costMetrics.fbCogPercentage / 100);
      logDebug(`Auto-calculated F&B COGS of ${fbCogs} based on ${fbRevenue} revenue at ${currentProduct.costMetrics.fbCogPercentage}%`);
    }
    
    // Add fbCogs to total costs
    const totalCosts = marketingCosts + staffingCosts + eventCosts + additionalCosts + fbCogs;
    
    // Find the actual being edited
    const updatedActuals = actuals.map((actual: WeeklyActuals) => {
      if (actual.id === editingActualId) {
        return {
          ...actual,
          week: week,
          numberOfEvents: events,
          footTraffic: footTraffic,
          averageEventAttendance: events > 0 ? Math.round(footTraffic / events) : 0,
          
          // Revenue breakdown
          ticketRevenue: ticketRevenue,
          fbRevenue: fbRevenue,
          merchandiseRevenue: merchandiseRevenue,
          digitalRevenue: digitalRevenue,
          revenue: totalRevenue,
          
          // Cost breakdown
          marketingCosts: marketingCosts,
          staffingCosts: staffingCosts,
          eventCosts: eventCosts,
          additionalCosts: additionalCosts,
          fbCogs: fbCogs, // Add the calculated F&B COGS
          expenses: totalCosts,
        };
      }
      return actual;
    });

    // Also update the actualMetrics if they exist
    const updatedActualMetrics = currentProduct.actualMetrics ? 
      currentProduct.actualMetrics.map((metric) => {
        if (metric.week === week) {
          return {
            ...metric,
            // Update with the same data, but using the correct field names
            totalRevenue: totalRevenue,
            ticketRevenue: ticketRevenue,
            fbRevenue: fbRevenue,
            merchandiseRevenue: merchandiseRevenue,
            digitalRevenue: digitalRevenue,
            
            numberOfEvents: events,
            footTraffic: footTraffic,
            averageEventAttendance: events > 0 ? Math.round(footTraffic / events) : 0,
            
            marketingCost: marketingCosts, // Fixed: Use marketingCost not marketingCosts
            staffCost: staffingCosts,
            eventsCosts: eventCosts,
            totalCosts: totalCosts,
            
            weeklyProfit: totalRevenue - totalCosts,
          };
        }
        return metric;
      }) : [];
    
    // Update the product with the edited actuals and actualMetrics
    updateProduct({
      ...currentProduct,
      actuals: updatedActuals,
      actualMetrics: updatedActualMetrics
    });
    
    // Reset the form
    setEditingActualId(null);
    resetForm();
  };

  // Handle deleting an actual
  const handleDeleteActual = (id: string) => {
    // Filter out the actual to delete
    const updatedActuals = actuals.filter((actual: WeeklyActuals) => actual.id !== id);
    
    // Update the product with the filtered actuals
    updateProduct({
      ...currentProduct,
      actuals: updatedActuals
    });
  };

  // Handle editing an actual
  const handleEditActual = (actual: WeeklyActuals) => {
    setEditingActualId(actual.id);
    
    // Set form values
    setNewWeekNumber(actual.week.toString());
    setNewDate(format(new Date(actual.date), 'yyyy-MM-dd'));
    setNewEvents(actual.numberOfEvents?.toString() || "");
    setNewFootTraffic(actual.footTraffic?.toString() || "");
    setNewAttendance(actual.averageEventAttendance?.toString() || "0");
    
    setNewTicketRevenue(actual.ticketRevenue?.toString() || "");
    setNewFBRevenue(actual.fbRevenue?.toString() || "");
    setNewMerchandiseRevenue(actual.merchandiseRevenue?.toString() || "");
    setNewDigitalRevenue(actual.digitalRevenue?.toString() || "");
    
    setNewMarketingCosts(actual.marketingCosts?.toString() || "");
    setNewStaffingCosts(actual.staffingCosts?.toString() || "");
    setNewEventCosts(actual.eventCosts?.toString() || "");
    setNewAdditionalCosts(actual.additionalCosts?.toString() || "");
  };

  // Handle year and month changes
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Calculate totals for the selected period
  const totals = {
    revenue: weeklyActuals.reduce((sum, actual) => sum + (actual.revenue || 0), 0),
    expenses: weeklyActuals.reduce((sum, actual) => sum + (actual.expenses || 0), 0),
    conversions: weeklyActuals.reduce((sum, actual) => sum + (actual.conversions || 0), 0),
    footTraffic: weeklyActuals.reduce((sum, actual) => sum + (actual.footTraffic || 0), 0),
    events: weeklyActuals.reduce((sum, actual) => sum + (actual.numberOfEvents || 0), 0),
    ticketRevenue: weeklyActuals.reduce((sum, actual) => sum + (actual.ticketRevenue || 0), 0),
    fbRevenue: weeklyActuals.reduce((sum, actual) => sum + (actual.fbRevenue || 0), 0),
    merchandiseRevenue: weeklyActuals.reduce((sum, actual) => sum + (actual.merchandiseRevenue || 0), 0),
    digitalRevenue: weeklyActuals.reduce((sum, actual) => sum + (actual.digitalRevenue || 0), 0),
    marketingCosts: weeklyActuals.reduce((sum, actual) => sum + (actual.marketingCosts || 0), 0),
    staffingCosts: weeklyActuals.reduce((sum, actual) => sum + (actual.staffingCosts || 0), 0),
    eventCosts: weeklyActuals.reduce((sum, actual) => sum + (actual.eventCosts || 0), 0),
    additionalCosts: weeklyActuals.reduce((sum, actual) => sum + (actual.additionalCosts || 0), 0)
  };
  
  // Calculate profit and margin
  const profit = totals.revenue - totals.expenses;
  const margin = totals.revenue > 0 ? (profit / totals.revenue) * 100 : 0;

  return (
    <Card className={standalone ? "" : "mt-6"}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">
          Actuals Tracker
          {currentProduct && (
            <span className="text-sm font-normal ml-2 text-gray-500">
              {currentProduct.info.name}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <div className="space-y-1">
            <Label htmlFor="year">Year</Label>
            {/* @ts-expect-error - Select component expects string values but we're using numbers */}
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="month">Month</Label>
            {/* @ts-expect-error - Select component expects string values but we're using numbers */}
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Button 
              variant="outline" 
              className="mt-5" 
              onClick={() => setIsAddingActual(true)}
              disabled={isAddingActual}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Week
            </Button>
          </div>
        </div>
        
        {/* Table of actuals */}
        {weeklyActuals.length > 0 ? (
          <>
            <div className="overflow-x-auto pb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Costs</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyActuals.map((actual: WeeklyActuals) => (
                    <TableRow key={actual.id}>
                      <TableCell>Week {actual.week}</TableCell>
                      <TableCell>{format(new Date(actual.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{formatNumber(actual.numberOfEvents || 0)}</TableCell>
                      <TableCell>{formatNumber(actual.averageEventAttendance || 0)}</TableCell>
                      <TableCell>{formatCurrency(actual.revenue || 0)}</TableCell>
                      <TableCell>{formatCurrency(actual.expenses || 0)}</TableCell>
                      <TableCell>{formatCurrency((actual.revenue || 0) - (actual.expenses || 0))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditActual(actual)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteActual(actual.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Totals row */}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell colSpan={2}>Totals</TableCell>
                    <TableCell>{formatNumber(totals.events)}</TableCell>
                    <TableCell>{totals.events > 0 ? formatNumber(Math.round(totals.footTraffic / totals.events)) : '0'}</TableCell>
                    <TableCell>{formatCurrency(totals.revenue)}</TableCell>
                    <TableCell>{formatCurrency(totals.expenses)}</TableCell>
                    <TableCell>{formatCurrency(profit)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No actuals recorded for {months[selectedMonth]} {selectedYear}</p>
            <p className="text-sm">Add weekly data to track your actual performance</p>
          </div>
        )}
        
        {/* Add new actual form */}
        {(isAddingActual || editingActualId) && (
          <div className="bg-gray-50 p-4 rounded-md mt-4">
            <h4 className="font-semibold mb-3">{editingActualId ? "Edit Week" : "Add New Week"}</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <Label htmlFor="week">Week</Label>
                <Input 
                  id="week" 
                  type="number" 
                  value={newWeekNumber}
                  onChange={(e: InputChangeEvent) => setNewWeekNumber(e.target.value)}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={newDate}
                  onChange={(e: InputChangeEvent) => setNewDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="events">Number of Events</Label>
                <Input 
                  id="events" 
                  type="number" 
                  value={newEvents}
                  onChange={(e: InputChangeEvent) => setNewEvents(e.target.value)}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="footTraffic">Total Foot Traffic</Label>
                <Input 
                  id="footTraffic" 
                  type="number" 
                  value={newFootTraffic}
                  onChange={(e: InputChangeEvent) => setNewFootTraffic(e.target.value)}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="attendance">Average Event Attendance</Label>
                <Input 
                  id="attendance" 
                  type="number" 
                  value={newAttendance}
                  disabled
                  placeholder="Automatically calculated"
                />
                <p className="text-xs text-gray-500">Automatically calculated from total foot traffic ÷ number of events</p>
              </div>
            </div>
            
            <h5 className="font-medium mt-6 mb-3">Revenue Breakdown</h5>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="space-y-1">
                <Label htmlFor="ticketRevenue">Ticket Revenue</Label>
                <Input 
                  id="ticketRevenue" 
                  type="number" 
                  value={newTicketRevenue}
                  onChange={(e: InputChangeEvent) => setNewTicketRevenue(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="fbRevenue">F&B Revenue</Label>
                <Input 
                  id="fbRevenue" 
                  type="number" 
                  value={newFBRevenue}
                  onChange={(e: InputChangeEvent) => setNewFBRevenue(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="merchandiseRevenue">Merchandise Revenue</Label>
                <Input 
                  id="merchandiseRevenue" 
                  type="number" 
                  value={newMerchandiseRevenue}
                  onChange={(e: InputChangeEvent) => setNewMerchandiseRevenue(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="digitalRevenue">Digital Revenue</Label>
                <Input 
                  id="digitalRevenue" 
                  type="number" 
                  value={newDigitalRevenue}
                  onChange={(e: InputChangeEvent) => setNewDigitalRevenue(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <h5 className="font-medium mt-6 mb-3">Costs Breakdown</h5>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="space-y-1">
                <Label htmlFor="marketingCosts">Marketing Costs</Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    id="marketingCosts" 
                    type="number" 
                    value={newMarketingCosts}
                    onChange={(e: InputChangeEvent) => setNewMarketingCosts(e.target.value)}
                    placeholder="0.00"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Toggle the channel breakdown modal
                      setShowChannelBreakdown(!showChannelBreakdown);
                    }}
                  >
                    {showChannelBreakdown ? "Hide Channels" : "Add Channels"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Add total marketing costs or break down by channel</p>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="staffingCosts">Staffing Costs</Label>
                <Input 
                  id="staffingCosts" 
                  type="number" 
                  value={newStaffingCosts}
                  onChange={(e: InputChangeEvent) => setNewStaffingCosts(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="eventCosts">Event Costs</Label>
                <Input 
                  id="eventCosts" 
                  type="number" 
                  value={newEventCosts}
                  onChange={(e: InputChangeEvent) => setNewEventCosts(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="additionalCosts">Additional Costs</Label>
                <Input 
                  id="additionalCosts" 
                  type="number" 
                  value={newAdditionalCosts}
                  onChange={(e: InputChangeEvent) => setNewAdditionalCosts(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            {/* Add the channel breakdown section after the costs section */}
            {showChannelBreakdown && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                <h6 className="font-medium text-sm mb-2">Marketing Channel Breakdown</h6>
                <p className="text-xs text-gray-500 mb-3">
                  Break down your marketing spend by channel to enable detailed analytics
                </p>
                
                <div className="space-y-3">
                  {marketingChannels.map((channel: MarketingChannelItem, index: number) => (
                    <div key={channel.id} className="flex items-center space-x-2">
                      <div className="w-2/5">
                        <p className="text-sm font-medium truncate">{channel.name || 'Channel ' + (index + 1)}</p>
                      </div>
                      <div className="w-3/5">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={channelSpend[channel.id] || ""}
                          onChange={(e: InputChangeEvent) => {
                            const newValue = e.target.value;
                            setChannelSpend((prev: ChannelSpendState) => ({
                              ...prev,
                              [channel.id]: newValue
                            }));
                            
                            // Calculate total marketing spend from all channels
                            const updatedSpend = {...channelSpend, [channel.id]: newValue};
                            const total = Object.values(updatedSpend).reduce(
                              (sum: number, val: string | unknown) => sum + (Number(val) || 0), 
                              0
                            );
                            
                            // Update the main marketing costs field
                            setNewMarketingCosts(total.toString());
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {marketingChannels.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      No marketing channels defined. Define channels in the Product Setup section.
                    </p>
                  )}
                  
                  <div className="flex justify-between pt-2 border-t border-gray-200 mt-3">
                    <span className="text-sm font-medium">Total Channel Spend:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(
                        Object.values(channelSpend).reduce(
                          (sum: number, val: string | unknown) => sum + (Number(val) || 0), 
                          0
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-200">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Total Revenue:</span>
                  <span>{formatCurrency(calculateTotalRevenue())}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Total Costs:</span>
                  <span>{formatCurrency(calculateTotalCosts())}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Profit:</span>
                  <span className={calculateTotalRevenue() - calculateTotalCosts() >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(calculateTotalRevenue() - calculateTotalCosts())}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 items-center">
                <Button variant="outline" onClick={() => {
                  if (editingActualId) {
                    setEditingActualId(null);
                  } else {
                    setIsAddingActual(false);
                  }
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={editingActualId ? handleSaveEdit : handleAddActual}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActualsTracker;
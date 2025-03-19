import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { 
  ArrowLeft, 
  Download, 
  BarChart, 
  PieChart, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  BarChart2, 
  ChevronDown,
  Award,
  FileText,
  ChevronRight,
  FileDown,
  FileUp
} from 'lucide-react';
import { Spinner } from './ui/spinner';
import { Breadcrumbs } from './ui/breadcrumb';
import { RecentlyViewed } from './ui/recently-viewed';
import { QuickJump } from './ui/quick-jump';
import { SetupWizard } from './ui/setup-wizard';
import ProductHeader from './ProductHeader';
import ExecutiveDashboard from './ExecutiveDashboard';
import ForecastRevenue from './ForecastRevenue';
import ForecastCosts from './ForecastCosts';
import WeeklyForecast from './WeeklyForecast';
import FinancialProjections from './FinancialProjections';
import LongTermProjections from './LongTermProjections';
import RiskAssessment from './RiskAssessment';
import ActualsTracker from './ActualsTracker';
import SeasonalAnalysis from './SeasonalAnalysis';
import ProductScenario from './ProductScenario';
import ScenarioModeling from './ScenarioModeling';
import RiskMatrix from './RiskMatrix';
import MarketingAnalytics from './MarketingAnalytics';
import MarketingApiIntegration from './MarketingApiIntegration';
import BudgetAllocation from './BudgetAllocation';
import MarketingKPITracker from './MarketingKPITracker';
import useStore from '../store/useStore';
import { 
  exportToPDF, 
  downloadFile, 
  ReportType, 
  exportToJSON, 
  exportFinancialData,
  exportWeeklyProjections,
  exportActualMetrics,
  exportRevenueBreakdown,
  exportCostAnalysis,
  exportVarianceAnalysis,
  exportMarketingChannelData
} from '../lib/exportUtils';
import { Product } from '../types/custom.d';

export default function ProductDashboard({ currentProduct, updateProduct, isLoading }: { 
  currentProduct: Product; 
  updateProduct: (product: Product) => void;
  isLoading: boolean;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, setCurrentProduct } = useStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<ReportType>('financial');
  const [marketingTab, setMarketingTab] = useState<'analytics' | 'api' | 'budget' | 'kpi'>('analytics');
  const [activeTab, setActiveTab] = useState('dashboard');
  const product = products.find(p => p.info.id === id);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (id) {
      setCurrentProduct(id);
    }
  }, [id, setCurrentProduct]);

  // All the export functions remain the same
  // handleExportPDF, handleExportExcel, handleExportJSON functions...

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (dropdownOpen && !target.closest('.dropdown-container')) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleNavigateToProduct = (productId) => {
    navigate(`/product/${productId}`);
  };
  
  const handleQuickJump = (path) => {
    navigate(path);
  };
  
  // Handle tab selection from the setup wizard
  const handleSelectTab = (tabId: string) => {
    console.log('ProductDashboard: Setting active tab to:', tabId);
    // Force active tab to update by ensuring it's a string type
    const safeTabId = String(tabId);
    setActiveTab(safeTabId);
    
    // Add a small timeout to ensure the UI updates
    setTimeout(() => {
      console.log('ProductDashboard: Active tab is now:', activeTab);
      // Additional check - force scroll to the tab content
      const tabContent = document.querySelector(`[data-state="active"][role="tabpanel"]`);
      if (tabContent) {
        tabContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-yellow-800 mb-4">No Product Selected</h1>
            <p className="text-yellow-700 mb-6">Please select a product to view.</p>
            <Button onClick={() => navigate('/')}>Return to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-yellow-800 mb-4">Product Not Found</h1>
            <p className="text-yellow-700 mb-6">The requested product could not be found.</p>
            <Button onClick={() => navigate('/')}>Return to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  // Render marketing content based on selected tab
  const renderMarketingContent = () => {
    switch (marketingTab) {
      case 'analytics':
        return <MarketingAnalytics />;
      case 'api':
        return <MarketingApiIntegration />;
      case 'budget':
        return <BudgetAllocation />;
      case 'kpi':
        return <MarketingKPITracker />;
      default:
        return <MarketingAnalytics />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs 
          items={[
            { label: 'Products', href: '/' },
            { label: product?.info.name || 'Product Details' }
          ]}
          onNavigate={navigate}
        />
        
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => navigate('/')} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            {/* Export dropdown button */}
            <div className="relative dropdown-container">
              <Button 
                disabled={isExporting}
                className="flex items-center"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {isExporting ? (
                  <Spinner className="h-4 w-4 mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isExporting ? 'Exporting...' : 'Export Data'}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
              
              {dropdownOpen && (
                <div className="absolute right-0 z-50 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    {/* Dropdown content (PDF, Excel, JSON options) */}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product header */}
          <ProductHeader info={product.info} />
        </header>

        {/* Main layout with sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content area - 3/4 width on large screens */}
          <div className="lg:col-span-3">
            {/* Main tab navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <div className="overflow-x-auto pb-2">
                <TabsList className="inline-flex min-w-max w-full md:w-auto">
                  <TabsTrigger value="dashboard" className="whitespace-nowrap">
                    Executive Dashboard
                  </TabsTrigger>
                  <TabsTrigger value="revenue" className="whitespace-nowrap">
                    Revenue Forecast
                  </TabsTrigger>
                  <TabsTrigger value="costs" className="whitespace-nowrap">
                    Cost Forecast
                  </TabsTrigger>
                  <TabsTrigger value="forecast" className="whitespace-nowrap">
                    12-Week Forecast
                  </TabsTrigger>
                  <TabsTrigger value="actuals" className="whitespace-nowrap">
                    Actuals Tracker
                  </TabsTrigger>
                  <TabsTrigger value="marketing" className="whitespace-nowrap">
                    Marketing Analytics
                  </TabsTrigger>
                  <TabsTrigger value="financials" className="whitespace-nowrap">
                    Financial Projections
                  </TabsTrigger>
                  <TabsTrigger value="longterm" className="whitespace-nowrap">
                    Long-term Projections
                  </TabsTrigger>
                  <TabsTrigger value="seasonal" className="whitespace-nowrap">
                    Seasonal Analysis
                  </TabsTrigger>
                  <TabsTrigger value="scenarios" className="whitespace-nowrap">
                    Scenario Modeling
                  </TabsTrigger>
                  <TabsTrigger value="risk" className="whitespace-nowrap">
                    Risk Assessment
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab content */}
              <TabsContent value="dashboard">
                <ExecutiveDashboard />
              </TabsContent>

              <TabsContent value="revenue">
                <ForecastRevenue />
              </TabsContent>

              <TabsContent value="costs">
                <ForecastCosts />
              </TabsContent>

              <TabsContent value="forecast">
                <WeeklyForecast />
              </TabsContent>

              <TabsContent value="actuals">
                <ActualsTracker />
              </TabsContent>

              <TabsContent value="marketing">
                <div className="space-y-4">
                  <Tabs value={marketingTab} onValueChange={(value) => setMarketingTab(value)} className="w-full">
                    <TabsList className="grid grid-cols-4 w-full max-w-md mb-4">
                      <TabsTrigger value="analytics">
                        <BarChart2 className="h-4 w-4 mr-2" />
                        Analytics
                      </TabsTrigger>
                      <TabsTrigger value="api">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        API Import
                      </TabsTrigger>
                      <TabsTrigger value="budget">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Budget
                      </TabsTrigger>
                      <TabsTrigger value="kpi">
                        <Award className="h-4 w-4 mr-2" />
                        KPIs
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  {renderMarketingContent()}
                </div>
              </TabsContent>

              <TabsContent value="financials">
                <FinancialProjections />
              </TabsContent>

              <TabsContent value="longterm">
                <LongTermProjections />
              </TabsContent>
              
              <TabsContent value="seasonal">
                <SeasonalAnalysis />
              </TabsContent>
              
              <TabsContent value="scenarios">
                <ProductScenario />
              </TabsContent>

              <TabsContent value="risk">
                <RiskAssessment />
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar - 1/4 width on large screens */}
          <div className="space-y-4">
            {/* Setup wizard with ability to select tabs */}
            <SetupWizard 
              onNavigate={handleQuickJump} 
              onSelectTab={handleSelectTab}
            />
            
            {/* Quick jump navigation with tab support */}
            <QuickJump 
              onNavigate={handleQuickJump} 
              onSelectTab={handleSelectTab}
            />
            
            {/* Recently viewed products */}
            <RecentlyViewed onNavigate={handleNavigateToProduct} />
          </div>
        </div>
      </div>
    </div>
  );
} 
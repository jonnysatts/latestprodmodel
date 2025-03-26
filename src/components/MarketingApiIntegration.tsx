import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Loader2, Check, X, RefreshCw, Download, ExternalLink } from 'lucide-react';
import useStore from '../store/useStore';
import { formatCurrency, formatNumber, formatPercent } from '../lib/utils';
import { uniqueId } from '../lib/utils';

// Types for Marketing API
export type MarketingPlatform = 'facebook' | 'google' | 'twitter' | 'linkedin' | 'tiktok' | 'custom';

export interface ApiConfig {
  platformName: string;
  apiKey: string;
  endpoint: string;
  isActive: boolean;
}

export interface MarketingApiResponse {
  success: boolean;
  data?: {
    metrics: Record<string, number>;
  };
  error?: string;
}

export interface ActualMetrics {
  id: string;
  week: number;
  year: number;
  revenue?: number;
  marketingCost?: number;
  channelPerformance?: Array<{
    channelId: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
}

// Mock implementation of API functions - using localStorage instead of Firebase
const getApiConfig = (platform: MarketingPlatform): ApiConfig | null => {
  try {
    const configs = localStorage.getItem('marketingApiConfigs');
    if (!configs) return null;
    
    const parsedConfigs = JSON.parse(configs) as Record<MarketingPlatform, ApiConfig>;
    return parsedConfigs[platform] || null;
  } catch (error) {
    console.error('Error loading API config:', error);
    return null;
  }
};

const configureMarketingApi = (platform: MarketingPlatform, config: ApiConfig): void => {
  try {
    const configs = localStorage.getItem('marketingApiConfigs');
    const parsedConfigs = configs ? JSON.parse(configs) : {};
    
    parsedConfigs[platform] = config;
    localStorage.setItem('marketingApiConfigs', JSON.stringify(parsedConfigs));
  } catch (error) {
    console.error('Error saving API config:', error);
  }
};

const saveApiConfigurations = (): void => {
  // This is a no-op in the localStorage version
  // Data is already saved in configureMarketingApi
};

const fetchMarketingData = async (
  platform: MarketingPlatform, 
  startDate: string, 
  endDate: string
): Promise<MarketingApiResponse> => {
  // This is a mock implementation that returns dummy data
  // In a real implementation, this would call the actual marketing APIs
  return {
    success: true,
    data: {
      metrics: {
        spend: 1000,
        impressions: 50000,
        clicks: 1500,
        conversions: 100,
        revenue: 5000
      }
    }
  };
};

const transformApiDataToChannelPerformance = (
  platform: MarketingPlatform,
  channelId: string,
  metrics: Record<string, number> | undefined
) => {
  // Transform API data to our format
  if (!metrics) return null;
  
  return {
    channelId,
    spend: metrics.spend || 0,
    impressions: metrics.impressions || 0,
    clicks: metrics.clicks || 0,
    conversions: metrics.conversions || 0,
    revenue: metrics.revenue || 0
  };
};

export default function MarketingApiIntegration() {
  const { products, currentProductId, updateProduct } = useStore();
  const [activeTab, setActiveTab] = useState<MarketingPlatform>('facebook');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default to 30 days ago
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  // API configuration state
  const [apiConfigs, setApiConfigs] = useState<Record<MarketingPlatform, ApiConfig | null>>({
    facebook: null,
    google: null,
    twitter: null,
    linkedin: null,
    tiktok: null,
    custom: null
  });
  
  // Form state for current platform
  const [formConfig, setFormConfig] = useState<ApiConfig>({
    platformName: '',
    apiKey: '',
    endpoint: '',
    isActive: true
  });
  
  // Load saved configurations on mount
  useEffect(() => {
    const platforms: MarketingPlatform[] = ['facebook', 'google', 'twitter', 'linkedin', 'tiktok', 'custom'];
    const configs: Record<MarketingPlatform, ApiConfig | null> = {
      facebook: null,
      google: null,
      twitter: null,
      linkedin: null,
      tiktok: null,
      custom: null
    };
    
    platforms.forEach(platform => {
      const config = getApiConfig(platform);
      if (config) {
        configs[platform] = config;
      }
    });
    
    setApiConfigs(configs);
    
    // Initialize form with active tab's config
    const activeConfig = getApiConfig(activeTab);
    if (activeConfig) {
      setFormConfig(activeConfig);
    } else {
      setFormConfig({
        platformName: getPlatformDisplayName(activeTab),
        apiKey: '',
        endpoint: getDefaultEndpoint(activeTab),
        isActive: true
      });
    }
  }, []);
  
  // Update form when tab changes
  useEffect(() => {
    const config = getApiConfig(activeTab);
    if (config) {
      setFormConfig(config);
    } else {
      setFormConfig({
        platformName: getPlatformDisplayName(activeTab),
        apiKey: '',
        endpoint: getDefaultEndpoint(activeTab),
        isActive: true
      });
    }
  }, [activeTab]);
  
  // Get current product
  const currentProduct = products?.find(p => p.info?.id === currentProductId);
  
  if (!currentProduct) {
    return (
      <div className="text-center py-8 text-gray-500">
        No product selected or product not found.
      </div>
    );
  }
  
  // Helper to get platform display name
  function getPlatformDisplayName(platform: MarketingPlatform): string {
    switch (platform) {
      case 'facebook': return 'Facebook Ads';
      case 'google': return 'Google Ads';
      case 'twitter': return 'Twitter Ads';
      case 'linkedin': return 'LinkedIn Ads';
      case 'tiktok': return 'TikTok Ads';
      case 'custom': return 'Custom API';
      default: return platform;
    }
  }
  
  // Helper to get default endpoint
  function getDefaultEndpoint(platform: MarketingPlatform): string {
    switch (platform) {
      case 'facebook': return 'https://graph.facebook.com/v16.0/';
      case 'google': return 'https://googleads.googleapis.com/v14/';
      case 'twitter': return 'https://ads-api.twitter.com/10/';
      case 'linkedin': return 'https://api.linkedin.com/v2/adAnalytics';
      case 'tiktok': return 'https://business-api.tiktok.com/open_api/v1.3/';
      case 'custom': return 'https://api.example.com/v1/';
      default: return '';
    }
  }
  
  // Handle form input changes
  const handleInputChange = (field: keyof ApiConfig, value: string | boolean) => {
    setFormConfig((prev: ApiConfig) => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Save API configuration
  const saveApiConfig = () => {
    configureMarketingApi(activeTab, formConfig);
    saveApiConfigurations();
    
    // Update local state
    setApiConfigs((prev: Record<MarketingPlatform, ApiConfig | null>) => ({
      ...prev,
      [activeTab]: formConfig
    }));
    
    setStatusMessage(`${getPlatformDisplayName(activeTab)} configuration saved successfully.`);
    setTimeout(() => setStatusMessage(''), 3000);
  };
  
  // Import data from API
  const importData = async () => {
    if (!currentProduct) return;
    
    setIsImporting(true);
    setImportStatus('loading');
    setStatusMessage(`Importing data from ${getPlatformDisplayName(activeTab)}...`);
    
    try {
      // Fetch data from API
      const response = await fetchMarketingData(activeTab, startDate, endDate);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to import data');
      }
      
      // Find matching marketing channel in the product
      const marketingChannels = currentProduct.costMetrics?.marketing?.channels || [];
      const matchingChannel = marketingChannels.find(
        channel => channel.name?.toLowerCase().includes(activeTab.toLowerCase())
      );
      
      if (!matchingChannel) {
        throw new Error(`No matching marketing channel found for ${getPlatformDisplayName(activeTab)}`);
      }
      
      // Transform API data to our format
      const channelPerformance = transformApiDataToChannelPerformance(
        activeTab,
        matchingChannel.id,
        response.data?.metrics
      );
      
      if (!channelPerformance) {
        throw new Error('Failed to transform API data');
      }
      
      // Find the latest week in actuals
      const latestWeek = Math.max(
        ...(currentProduct.actualMetrics || []).map(metric => metric.week),
        0
      );
      
      // Update the latest week's channel performance
      const updatedActualMetrics = [...(currentProduct.actualMetrics || [])];
      const latestWeekIndex = updatedActualMetrics.findIndex(metric => metric.week === latestWeek);
      
      if (latestWeekIndex >= 0) {
        // Update existing week
        const existingChannelPerformance = updatedActualMetrics[latestWeekIndex].channelPerformance || [];
        const existingChannelIndex = existingChannelPerformance.findIndex(
          cp => cp.channelId === matchingChannel.id
        );
        
        if (existingChannelIndex >= 0) {
          // Update existing channel
          existingChannelPerformance[existingChannelIndex] = channelPerformance;
        } else {
          // Add new channel
          existingChannelPerformance.push(channelPerformance);
        }
        
        updatedActualMetrics[latestWeekIndex] = {
          ...updatedActualMetrics[latestWeekIndex],
          channelPerformance: existingChannelPerformance
        };
      } else if (latestWeek > 0) {
        // Create new week based on the previous one
        updatedActualMetrics.push({
          ...updatedActualMetrics[updatedActualMetrics.length - 1],
          week: latestWeek + 1,
          channelPerformance: [channelPerformance]
        });
      } else {
        // Create first week
        const newActualMetric: ActualMetrics = {
          id: uniqueId('actuals-'),
          week: 1,
          year: new Date().getFullYear(),
          revenue: channelPerformance.revenue,
          marketingCost: channelPerformance.spend,
          channelPerformance: [channelPerformance]
        };
        updatedActualMetrics.push(newActualMetric);
      }
      
      // Update product
      updateProduct(currentProduct.info.id, {
        ...currentProduct,
        actualMetrics: updatedActualMetrics
      });
      
      setImportStatus('success');
      setStatusMessage(`Successfully imported data from ${getPlatformDisplayName(activeTab)}`);
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('error');
      setStatusMessage(`Error importing data: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsImporting(false);
      setTimeout(() => {
        if (importStatus === 'success' || importStatus === 'error') {
          setImportStatus('idle');
          setStatusMessage('');
        }
      }, 5000);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marketing API Integration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect to external marketing platforms to automatically import performance data
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as MarketingPlatform)}>
        <TabsList className="grid grid-cols-6">
          <TabsTrigger value="facebook">Facebook</TabsTrigger>
          <TabsTrigger value="google">Google</TabsTrigger>
          <TabsTrigger value="twitter">Twitter</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="tiktok">TikTok</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>
        
        {(['facebook', 'google', 'twitter', 'linkedin', 'tiktok', 'custom'] as MarketingPlatform[]).map(platform => (
          <TabsContent key={platform} value={platform}>
            <Card>
              <CardHeader>
                <CardTitle>{getPlatformDisplayName(platform)} Integration</CardTitle>
                <CardDescription>
                  Configure connection to {getPlatformDisplayName(platform)} marketing API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${platform}-api-key`}>API Key</Label>
                    <Input
                      id={`${platform}-api-key`}
                      type="password"
                      value={formConfig.apiKey}
                      onChange={(e: { target: { value: string } }) => handleInputChange('apiKey', e.target.value)}
                      placeholder="Enter your API key"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`${platform}-endpoint`}>API Endpoint</Label>
                    <Input
                      id={`${platform}-endpoint`}
                      value={formConfig.endpoint}
                      onChange={(e: { target: { value: string } }) => handleInputChange('endpoint', e.target.value)}
                      placeholder="API endpoint URL"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`${platform}-active`}
                    checked={formConfig.isActive}
                    onCheckedChange={(checked: boolean) => handleInputChange('isActive', checked)}
                  />
                  <Label htmlFor={`${platform}-active`}>Active</Label>
                </div>
                
                {platform === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-platform-name">Platform Name</Label>
                    <Input
                      id="custom-platform-name"
                      value={formConfig.platformName}
                      onChange={(e: { target: { value: string } }) => handleInputChange('platformName', e.target.value)}
                      placeholder="Custom platform name"
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={saveApiConfig}>
                  Save Configuration
                </Button>
                
                <div className="flex items-center space-x-2">
                  <div className={apiConfigs[platform] ? "bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded" : "bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded"}>
                    {apiConfigs[platform] ? "Configured" : "Not Configured"}
                  </div>
                </div>
              </CardFooter>
            </Card>
            
            {apiConfigs[platform] && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Import Data</CardTitle>
                  <CardDescription>
                    Import marketing performance data from {getPlatformDisplayName(platform)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${platform}-start-date`}>Start Date</Label>
                      <Input
                        id={`${platform}-start-date`}
                        type="date"
                        value={startDate}
                        onChange={(e: { target: { value: string } }) => setStartDate(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`${platform}-end-date`}>End Date</Label>
                      <Input
                        id={`${platform}-end-date`}
                        type="date"
                        value={endDate}
                        onChange={(e: { target: { value: string } }) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={importData} 
                    disabled={isImporting || !apiConfigs[platform]?.isActive}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Import Data
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
      
      {importStatus === 'success' && (
        <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
          <div className="flex">
            <Check className="h-5 w-5 mr-2" />
            <div>
              <h5 className="font-medium">Success</h5>
              <p>{statusMessage}</p>
            </div>
          </div>
        </Alert>
      )}
      
      {importStatus === 'error' && (
        <Alert className="mt-4 bg-red-50 text-red-800 border-red-200">
          <div className="flex">
            <X className="h-5 w-5 mr-2" />
            <div>
              <h5 className="font-medium">Error</h5>
              <p>{statusMessage}</p>
            </div>
          </div>
        </Alert>
      )}
      
      <div className="border-t pt-4">
        <h2 className="text-lg font-medium mb-2">Connected Platforms</h2>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(apiConfigs).map(([platform, config]) => {
            if (!config) return null;
            const typedConfig = config as ApiConfig;
            return (
              <Card key={platform}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{typedConfig.platformName}</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm truncate">{typedConfig.endpoint}</p>
                  <div className={typedConfig.isActive ? "bg-green-100 text-green-800 text-xs font-medium mt-2 px-2.5 py-0.5 rounded" : "bg-gray-100 text-gray-800 text-xs font-medium mt-2 px-2.5 py-0.5 rounded"}>
                    {typedConfig.isActive ? "Active" : "Inactive"}
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="ghost" size="sm" asChild>
                    <a href={typedConfig.endpoint} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Visit
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
} 
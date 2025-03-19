// Declaration file for modules without their own type declarations

// Add declaration for lucide-react icons
declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    className?: string;
  }
  
  export type Icon = React.ComponentType<IconProps>;
  
  export const PlusCircle: Icon;
  export const Pencil: Icon;
  export const Trash2: Icon;
  export const Save: Icon;
  export const X: Icon;
  export const AlertTriangle: Icon;
  export const Filter: Icon;
  export const PieChart: Icon;
  export const Edit: Icon;
  export const ArrowLeft: Icon;
  export const Download: Icon;
  export const ChevronDown: Icon;
  export const ChevronUp: Icon;
  export const ExternalLink: Icon;
  export const Calendar: Icon;
  export const BarChart: Icon;
  export const LineChart: Icon;
  export const Pie: Icon;
  export const Dollar: Icon;
  export const DollarSign: Icon;
  export const Users: Icon;
  export const Clipboard: Icon;
  export const ClipboardCheck: Icon;
  export const CheckCircle: Icon;
  export const Eye: Icon;
  export const EyeOff: Icon;
  export const Search: Icon;
  export const Plus: Icon;
  export const Minus: Icon;
  export const Info: Icon;
  export const HelpCircle: Icon;
  export const Copy: Icon;
  export const Award: Icon;
  export const ArrowUpDown: Icon;
  export const TrendingUp: Icon;
  export const BarChart2: Icon;
  export const FileText: Icon;
  export const Check: Icon;
  export const Network: Icon;
  export const WifiOff: Icon;
  export const AlertCircle: Icon;
  export const Loader2: Icon;
  export const RefreshCw: Icon;
  export const TrendingDown: Icon;
  export const Activity: Icon;
  export const Wifi: Icon;
  export const Upload: Icon;
  export const GripVertical: Icon;
  // Add other icons as needed
}

// Add declarations for react-router-dom components
declare module 'react-router-dom' {
  import { ComponentType, ReactNode } from 'react';

  export interface RouteProps {
    path?: string;
    element?: ReactNode;
    children?: ReactNode;
  }

  export interface RoutesProps {
    children?: ReactNode;
    location?: any;
  }

  export interface NavigateProps {
    to: string;
    replace?: boolean;
  }

  export const BrowserRouter: ComponentType<{ children?: ReactNode }>;
  export const Routes: ComponentType<RoutesProps>;
  export const Route: ComponentType<RouteProps>;
  export const Navigate: ComponentType<NavigateProps>;
}

// Add declaration for ErrorBoundary component
declare module './components/ui/error-boundary' {
  import { ComponentType, ReactNode } from 'react';

  export interface ErrorBoundaryProps {
    fallback?: ReactNode;
    children: ReactNode;
    className?: string;
  }

  const ErrorBoundary: ComponentType<ErrorBoundaryProps>;
  export default ErrorBoundary;
}

// Add module declarations for custom UI components
declare module './ui/slider' {
  import { FC, HTMLAttributes } from 'react';
  
  export interface SliderProps extends HTMLAttributes<HTMLDivElement> {
    min?: number;
    max?: number;
    step?: number;
    value?: number[];
    onValueChange?: (value: number[]) => void;
  }
  
  export const Slider: React.ComponentType<SliderProps>;
}

declare module './ui/spinner' {
  import { FC, HTMLAttributes } from 'react';
  
  export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
    size?: 'sm' | 'md' | 'lg';
  }
  
  export const Spinner: React.ComponentType<SpinnerProps>;
}

// Add declarations for any missing React components
declare module 'react' {
  // Extend the JSX namespace
  namespace JSX {
    interface IntrinsicElements {
      // Add any custom elements if needed
    }
  }
}

// Add declarations for HTML element attributes
interface HTMLAttributes {
  // Add any custom attributes if needed
}

// Declare module to make it properly importable
declare module '../types/custom.d' {
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
    info: {
      id: string;
      name: string;
      description: string;
      category: string;
      createdAt: number;
      updatedAt: number;
      forecastPeriod: number;
      startDate: number;
    };
    marketingChannels: MarketingChannelItem[];
    costMetrics: {
      marketing: {
        channels: MarketingChannelItem[];
        // Other marketing properties
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    revenueMetrics: {
      [key: string]: unknown;
    };
    actualMetrics: {
      [key: string]: unknown;
    };
    [key: string]: unknown;
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
} 
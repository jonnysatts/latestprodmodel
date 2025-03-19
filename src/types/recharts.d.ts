// Type definitions for Recharts components to fix JSX component issues
declare module 'recharts' {
  import * as React from 'react';

  export interface RechartsComponentProps {
    [key: string]: any;
  }

  // Component types that work with JSX
  export function LineChart(props: RechartsComponentProps): JSX.Element;
  export function Line(props: RechartsComponentProps): JSX.Element;
  export function BarChart(props: RechartsComponentProps): JSX.Element;
  export function Bar(props: RechartsComponentProps): JSX.Element;
  export function PieChart(props: RechartsComponentProps): JSX.Element;
  export function Pie(props: RechartsComponentProps): JSX.Element;
  export function AreaChart(props: RechartsComponentProps): JSX.Element;
  export function Area(props: RechartsComponentProps): JSX.Element;
  export function XAxis(props: RechartsComponentProps): JSX.Element;
  export function YAxis(props: RechartsComponentProps): JSX.Element;
  export function CartesianGrid(props: RechartsComponentProps): JSX.Element;
  export function Tooltip(props: RechartsComponentProps): JSX.Element;
  export function Legend(props: RechartsComponentProps): JSX.Element;
  export function ComposedChart(props: RechartsComponentProps): JSX.Element;
  export function ResponsiveContainer(props: RechartsComponentProps): JSX.Element;
  export function ReferenceLine(props: RechartsComponentProps): JSX.Element;
  export function ReferenceArea(props: RechartsComponentProps): JSX.Element;
  export function RadarChart(props: RechartsComponentProps): JSX.Element;
  export function Radar(props: RechartsComponentProps): JSX.Element;
  export function PolarGrid(props: RechartsComponentProps): JSX.Element;
  export function PolarAngleAxis(props: RechartsComponentProps): JSX.Element;
  export function PolarRadiusAxis(props: RechartsComponentProps): JSX.Element;
  export function Cell(props: RechartsComponentProps): JSX.Element;
} 
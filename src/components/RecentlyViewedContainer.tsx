import React from 'react';
import { RecentlyViewed } from './ui/recently-viewed';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface RecentlyViewedContainerProps {
  onNavigateToProduct: (productId: string) => void;
}

export default function RecentlyViewedContainer({ onNavigateToProduct }: RecentlyViewedContainerProps) {
  return (
    <Card className="mt-6 shadow-md">
      <CardHeader>
        <CardTitle>Recently Viewed Products</CardTitle>
      </CardHeader>
      <CardContent>
        <RecentlyViewed onNavigate={onNavigateToProduct} />
      </CardContent>
    </Card>
  );
} 
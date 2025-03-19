import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Save, BarChart } from 'lucide-react';
import { useStorage } from '../contexts/StorageContext';
import { Skeleton } from './ui/skeleton';

interface StorageToggleProps {
  compact?: boolean;
}

export const StorageToggle: React.FC<StorageToggleProps> = ({ compact = false }) => {
  const { storageMode, setStorageMode, isCloudAvailable, isInitializing, error } = useStorage();
  const [isChanging, setIsChanging] = useState(false);

  // Handle toggling storage mode
  const handleToggle = async () => {
    setIsChanging(true);
    try {
      const newMode = storageMode === 'cloud' ? 'local' : 'cloud';
      await setStorageMode(newMode);
    } finally {
      setIsChanging(false);
    }
  };

  // If still initializing, show skeleton
  if (isInitializing) {
    return (
      <Card className={`${compact ? 'mt-1' : 'mt-2'}`}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-[180px]" />
          <Skeleton className="h-4 w-[150px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-[120px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${compact ? 'mt-1' : 'mt-2'}`}>
      <CardHeader className={`${compact ? 'p-2' : 'pb-2'}`}>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {storageMode === 'cloud' ? (
            <>
              <Save className="h-4 w-4" /> Cloud Storage
            </>
          ) : (
            <>
              <BarChart className="h-4 w-4" /> Local Storage
            </>
          )}
        </CardTitle>
        <CardDescription className="text-xs">
          {storageMode === 'cloud' 
            ? 'Data is saved to the cloud and synced across devices'
            : 'Data is saved locally in your browser'}
        </CardDescription>
      </CardHeader>
      <CardContent className={`${compact ? 'py-2 px-2' : ''}`}>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleToggle}
          disabled={isChanging || (storageMode === 'cloud' ? false : !isCloudAvailable)}
        >
          Switch to {storageMode === 'cloud' ? 'Local Storage' : 'Cloud Storage'}
        </Button>
      </CardContent>
      {error && (
        <CardFooter className={`pt-0 ${compact ? 'p-2' : ''}`}>
          <p className="text-xs text-destructive">{error}</p>
        </CardFooter>
      )}
    </Card>
  );
}; 
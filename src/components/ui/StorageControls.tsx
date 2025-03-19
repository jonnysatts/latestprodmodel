import React, { useState } from 'react';
import { Save, BarChart, Wifi, WifiOff, AlertCircle, ArrowUpDown } from 'lucide-react';
import { useStorage } from '../../contexts/StorageContext';
import { useNetworkStatus } from '../../contexts/NetworkStatusContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { Button } from './button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './dropdown-menu';

export const StorageControls = () => {
  const { storageMode, setStorageMode, isCloudAvailable } = useStorage();
  const { isOnline, connectionType } = useNetworkStatus();
  const [isChanging, setIsChanging] = useState(false);

  // Handle toggling storage mode
  const handleToggleStorage = async () => {
    setIsChanging(true);
    try {
      const newMode = storageMode === 'cloud' ? 'local' : 'cloud';
      await setStorageMode(newMode);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <TooltipProvider>
        {/* Network Status Indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`rounded-full w-8 h-8 ${
                isOnline 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800' 
                  : 'bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800'
              }`}
            >
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isOnline 
              ? `Online ${connectionType ? `(${connectionType})` : ""}` 
              : "Offline - Saving data locally"}
          </TooltipContent>
        </Tooltip>

        {/* Storage Type Indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`rounded-full w-8 h-8 ${
                storageMode === 'cloud'
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-800'
              }`}
            >
              {storageMode === 'cloud' ? <Save className="h-4 w-4" /> : <BarChart className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {storageMode === 'cloud' 
              ? 'Cloud storage: data synced across devices' 
              : 'Local storage: data saved in browser'}
          </TooltipContent>
        </Tooltip>

        {/* Storage Settings Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full w-8 h-8 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-800"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 font-medium">Storage Settings</div>
            <div className="h-px bg-gray-200 my-1"></div>
            <DropdownMenuItem
              disabled={isChanging || (storageMode === 'local' && !isCloudAvailable)}
              onClick={handleToggleStorage}
              className="flex items-center gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span>Switch to {storageMode === 'cloud' ? 'Local Storage' : 'Cloud Storage'}</span>
            </DropdownMenuItem>
            {!isCloudAvailable && storageMode === 'local' && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Cloud storage unavailable. Configure Firebase first.
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </div>
  );
};

export default StorageControls; 
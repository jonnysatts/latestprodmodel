import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useNetworkStatus } from '../../contexts/NetworkStatusContext';
import { cn } from '../../lib/utils';

export const NetworkStatusIndicator: React.FC = () => {
  const { isOnline, connectionType, isConnectionPending } = useNetworkStatus();

  // Define styles based on connection status
  const getStatusStyles = () => {
    if (isConnectionPending) {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }
    return isOnline
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  // Define icon based on connection status
  const getStatusIcon = () => {
    if (isConnectionPending) {
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
    return isOnline
      ? <Wifi className="h-4 w-4 text-green-500" />
      : <WifiOff className="h-4 w-4 text-red-500" />;
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-sm",
        getStatusStyles()
      )}
    >
      {getStatusIcon()}
      <span>
        {isConnectionPending
          ? "Connecting..."
          : isOnline
            ? `Online ${connectionType ? `(${connectionType})` : ""}`
            : "Offline"}
      </span>
    </div>
  );
};

export default NetworkStatusIndicator; 
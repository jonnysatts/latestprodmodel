import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { cn } from '../../lib/utils';
import type { NotificationType } from '../../contexts/NotificationContext';

// Type for notification config
interface ConfigType {
  bgColor: string;
  textColor: string;
  icon: React.ReactNode;
}

// Configuration for different notification types
const notificationConfig: Record<string, ConfigType> = {
  error: {
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    icon: <AlertCircle className="h-5 w-5 text-red-500" />
  },
  warning: {
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    icon: <AlertCircle className="h-5 w-5 text-yellow-500" />
  },
  success: {
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    icon: <CheckCircle className="h-5 w-5 text-green-500" />
  },
  info: {
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    icon: <Info className="h-5 w-5 text-blue-500" />
  }
};

// Type for notification
export interface NotificationItemType {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  duration?: number;
}

// NotificationItem component
const NotificationItem = ({ 
  notification, 
  onDismiss 
}: {
  notification: NotificationItemType;
  onDismiss: (id: string) => void;
}) => {
  const config = notificationConfig[notification.type] || notificationConfig.info;
  
  useEffect(() => {
    if (notification.duration) {
      const timer = setTimeout(() => {
        onDismiss(notification.id);
      }, notification.duration);
      
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);
  
  return (
    <div className={cn(
      "p-4 mb-4 rounded-lg shadow-md border flex items-start",
      config.bgColor,
      config.textColor
    )}>
      <div className="flex-shrink-0 mr-3">
        {config.icon}
      </div>
      <div className="flex-grow mr-3">
        <p className="text-sm font-medium">{notification.message}</p>
      </div>
      <button
        onClick={() => onDismiss(notification.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-500"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

// Notifications component
const Notifications = () => {
  const { notifications, dismissNotification } = useNotifications();
  
  if (!notifications || !notifications.length) return null;
  
  return (
    <div className="fixed top-4 right-4 w-80 z-50 p-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification as NotificationItemType}
          onDismiss={dismissNotification}
        />
      ))}
    </div>
  );
};

export default Notifications; 
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage';
import ProductDashboard from './components/ProductDashboard';
import ProductScenario from './components/ProductScenario';
import ProductBasedScenarioModeling from './components/ProductBasedScenarioModeling';
import PortfolioView from './components/PortfolioView';
import NotFound from './components/NotFound';
import useStore from './store/useStore';
import useStorageSync from './hooks/useStorageSync';
import { Spinner } from './components/ui/spinner';
import ErrorBoundary from './components/ui/error-boundary';
import { NetworkStatusProvider } from './contexts/NetworkStatusContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { StorageProvider } from './contexts/StorageContext';
import { AuthProvider } from './contexts/AuthContext';
import Notifications from './components/ui/Notifications';
import OfflineManager from './components/ui/OfflineManager';
import StorageControls from './components/ui/StorageControls';
import Debug from './components/Debug';
import TestInputs from './components/TestInputs';

// Check if we're in development mode
const isDevelopment = import.meta.env.MODE === 'development';

function AppContent() {
  const { isLoading, error, initializeStore } = useStore();
  const [appReady, setAppReady] = useState(false);
  
  // Sync storage context with store
  useStorageSync();

  // Force focus to work better on all inputs
  useEffect(() => {
    const fixInputsInApp = () => {
      const inputs = document.querySelectorAll('input, textarea, select, [role="combobox"]');
      inputs.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.pointerEvents = 'auto';
          el.style.position = 'relative';
          el.style.zIndex = '10';
        }
      });
    };
    
    fixInputsInApp();
    const interval = setInterval(fixInputsInApp, 2000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Initialize the store when the app loads
    const loadData = async () => {
      try {
        // This will load data from Firestore or localStorage
        await initializeStore();
      } catch (err) {
        console.error('Failed to initialize the application:', err);
      } finally {
        // Mark the app as ready even if there was an error
        // This will allow users to at least see the UI instead of an infinite loading screen
        setAppReady(true);
      }
    };

    loadData();
  }, [initializeStore]);

  // Show loading spinner while initializing
  if (!appReady || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className="text-gray-500">Loading your products...</p>
        </div>
      </div>
    );
  }

  // Show error message if initialization failed
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h1 className="mb-4 text-xl font-bold text-red-600">Something went wrong</h1>
          <p className="mb-4 text-gray-700">We couldn't load your data. This could be due to:</p>
          <ul className="mb-4 ml-5 list-disc text-gray-700">
            <li>Connection issues</li>
            <li>Server maintenance</li>
            <li>Database configuration</li>
            <li>Corrupted local data</li>
          </ul>
          <p className="text-gray-700">Please try refreshing the page or reset your data if the problem persists.</p>
          <div className="flex gap-4 mt-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => {
                // Clear all local storage data
                localStorage.clear();
                // Reload the page
                window.location.reload();
              }} 
              className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
            >
              Reset All Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/portfolio" element={<PortfolioView />} />
        <Route path="/product/:id" element={<ProductDashboard />} />
        <Route path="/product/:id/scenario" element={<ProductScenario />} />
        <Route path="/scenarios" element={<ProductBasedScenarioModeling />} />
        <Route path="/test-inputs" element={<TestInputs />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Storage Controls Component */}
      <StorageControls />
      
      {/* Offline Manager Component */}
      <OfflineManager />
      
      {/* Notifications Component */}
      <Notifications />

      {/* Debug Component - only shown in development mode */}
      {isDevelopment && <Debug />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <NetworkStatusProvider>
          <NotificationProvider>
            <StorageProvider>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </StorageProvider>
          </NotificationProvider>
        </NetworkStatusProvider>
      </Router>
    </ErrorBoundary>
  );
}
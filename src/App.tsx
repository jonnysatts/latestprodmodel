import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import ProductDashboard from './components/ProductDashboard';
import ProductScenario from './components/ProductScenario';
import ProductBasedScenarioModeling from './components/ProductBasedScenarioModeling';
import PortfolioView from './components/PortfolioView';
import NotFound from './components/NotFound';
import useStore from './store/useStore';
import { Spinner } from './components/ui/spinner';
import { NotificationProvider } from './contexts/NotificationContext';
import { NetworkStatusProvider } from './contexts/NetworkStatusContext';
import { OfflineManager } from './components/ui/OfflineManager';
import { StorageProvider } from './contexts/StorageContext';

// The main App component - simplified to focus on core functionality
export default function App() {
  const { isLoading, error, initializeStore } = useStore();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Initialize the store when the app loads
    const loadData = async () => {
      try {
        console.log("App: Initializing store");
        await initializeStore();
        console.log("App: Store initialization completed");
        
        // Check if we have a currentProductId in the URL path
        const pathParts = window.location.pathname.split('/');
        if (pathParts[1] === 'product' && pathParts[2]) {
          const productId = pathParts[2];
          console.log(`App: Product ID found in URL: ${productId}`);
          
          // Make sure the ID is stored in localStorage
          localStorage.setItem('currentProductId', productId);
        }
      } catch (err) {
        console.error('Failed to initialize the application:', err);
      } finally {
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
          <p className="mb-4 text-gray-700">We couldn't load your data. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <NetworkStatusProvider>
        <StorageProvider>
          <Router>
            <div className="app">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/portfolio" element={<PortfolioView />} />
                <Route path="/product/:id" element={<ProductDashboard />} />
                <Route path="/product/:id/scenario" element={<ProductScenario />} />
                <Route path="/scenarios" element={<ProductBasedScenarioModeling />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <OfflineManager />
            </div>
          </Router>
        </StorageProvider>
      </NetworkStatusProvider>
    </NotificationProvider>
  );
}
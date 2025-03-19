import React, { useState } from 'react';
import useStore from '../store/useStore';
import { X, BarChart } from 'lucide-react';

const Debug: React.FC = () => {
  const { products, currentProductId } = useStore();
  const [isVisible, setIsVisible] = useState(false);
  
  const currentProduct = products.find(p => p.info.id === currentProductId);
  
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white rounded-full p-2 shadow-lg hover:bg-blue-700 transition-colors"
        title="Show Debug Panel"
      >
        <BarChart size={20} />
      </button>
    );
  }
  
  return (
    <div className="fixed top-20 right-4 z-50 max-w-md overflow-auto p-4 bg-white rounded shadow-lg border border-gray-200" style={{ maxHeight: '80vh' }}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug Info</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 p-1 rounded"
          title="Close Debug Panel"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="mb-4">
        <p><strong>Current Product ID:</strong> {currentProductId || 'None'}</p>
        <p><strong>Total Products:</strong> {products.length}</p>
        <p><strong>Has Current Product:</strong> {currentProduct ? 'Yes' : 'No'}</p>
      </div>
      
      {currentProduct && (
        <div>
          <h4 className="font-semibold mb-1">Current Product:</h4>
          <p><strong>Name:</strong> {currentProduct.info.name}</p>
          <p><strong>ID:</strong> {currentProduct.info.id}</p>
          <p><strong>Has actuals array:</strong> {currentProduct.actuals ? 'Yes' : 'No'}</p>
          <p><strong>Actuals is array:</strong> {Array.isArray(currentProduct.actuals) ? 'Yes' : 'No'}</p>
          <p><strong>Actuals length:</strong> {Array.isArray(currentProduct.actuals) ? currentProduct.actuals.length : 'N/A'}</p>
          
          <div className="mt-2">
            <h4 className="font-semibold">Product Structure:</h4>
            <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto" style={{ maxHeight: '300px' }}>
              {JSON.stringify(currentProduct, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default Debug; 
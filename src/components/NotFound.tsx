import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-yellow-800 mb-4">Page Not Found</h1>
          <p className="text-yellow-700 mb-6">The page you are looking for does not exist.</p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 
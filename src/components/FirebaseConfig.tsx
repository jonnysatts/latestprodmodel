import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle } from 'lucide-react';

// Configuration management component
const FirebaseConfig = () => {
  const [showInfo, setShowInfo] = useState(false);
  const hasConfig = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

  if (!showInfo && hasConfig) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button 
          onClick={() => setShowInfo(true)} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4 text-green-500" />
          Firebase Connected (Env Vars)
        </Button>
      </div>
    );
  }

  if (showInfo) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Firebase Configuration</CardTitle>
            <CardDescription>
              Your app is configured with Firebase using environment variables.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Firebase is configured with the following variables from your environment:
            </p>
            <ul className="mt-2 text-xs text-gray-500 list-disc pl-5">
              <li>VITE_FIREBASE_API_KEY: {import.meta.env.VITE_FIREBASE_API_KEY ? '✓ Set' : '✗ Missing'}</li>
              <li>VITE_FIREBASE_PROJECT_ID: {import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing'}</li>
              <li>VITE_FIREBASE_AUTH_DOMAIN: {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✓ Set' : '✗ Missing'}</li>
              <li>VITE_FIREBASE_STORAGE_BUCKET: {import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✓ Set' : '✗ Missing'}</li>
              <li>VITE_FIREBASE_MESSAGING_ID: {import.meta.env.VITE_FIREBASE_MESSAGING_ID ? '✓ Set' : '✗ Missing'}</li>
              <li>VITE_FIREBASE_APP_ID: {import.meta.env.VITE_FIREBASE_APP_ID ? '✓ Set' : '✗ Missing'}</li>
              <li>VITE_FIREBASE_MEASUREMENT_ID: {import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ? '✓ Set' : '✗ Missing'}</li>
            </ul>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="ghost" onClick={() => setShowInfo(false)}>
              Close
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If no config exists, don't show anything
  return null;
};

export default FirebaseConfig; 
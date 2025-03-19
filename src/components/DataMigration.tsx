import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { CheckCircle, Save, AlertTriangle } from 'lucide-react';
import { 
  checkMigrationNeeded, 
  migrateLocalDataToFirestore, 
  MigrationStatus 
} from '../lib/migrateLocalData';

const DataMigration = () => {
  const [migrationNeeded, setMigrationNeeded] = useState<boolean | null>(null);
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [showCard, setShowCard] = useState(true);

  useEffect(() => {
    // Check if migration is needed on component mount
    const checkMigration = async () => {
      try {
        const needed = await checkMigrationNeeded();
        setMigrationNeeded(needed);
      } catch (error) {
        console.error('Error checking migration status:', error);
        setMigrationNeeded(false);
      }
    };

    checkMigration();
  }, []);

  const handleStartMigration = async () => {
    try {
      await migrateLocalDataToFirestore(setStatus);
    } catch (error) {
      console.error('Migration error:', error);
      setStatus((prev: MigrationStatus | null) => prev ? {
        ...prev,
        inProgress: false,
        errors: [...(prev.errors || []), `Unexpected error: ${error instanceof Error ? error.message : String(error)}`]
      } : null);
    }
  };

  // If no migration is needed, don't show anything
  if (migrationNeeded === false) {
    return null;
  }

  // If we're still checking, show a loading state
  if (migrationNeeded === null) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button variant="outline" size="sm" disabled>
          <span className="animate-pulse">Checking data...</span>
        </Button>
      </div>
    );
  }

  // If migration completed and card was dismissed, show a small button
  if (status?.completed && !showCard) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button 
          onClick={() => setShowCard(true)} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2 text-green-600"
        >
          <CheckCircle className="h-4 w-4" />
          Data Migrated Successfully
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Data Migration
          </CardTitle>
          <CardDescription>
            Migrate your local data to the cloud for access across devices.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!status || !status.inProgress && !status.completed ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                We've detected data stored in your browser that needs to be migrated to our cloud storage.
                This will allow you to access your data from any device.
              </p>
              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                <p className="font-semibold">Benefits of cloud storage:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Access your data from any device</li>
                  <li>Collaborate with team members</li>
                  <li>Never lose your work if browser data is cleared</li>
                  <li>More reliable and secure data storage</li>
                </ul>
              </div>
            </div>
          ) : status.inProgress ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Migration in progress. Please don't close the browser...
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Products</span>
                  <span>{status.productsMigrated} / {status.productsTotal}</span>
                </div>
                <Progress 
                  value={status.productsTotal ? (status.productsMigrated / status.productsTotal) * 100 : 0} 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Scenarios</span>
                  <span>{status.scenariosMigrated} / {status.scenariosTotal}</span>
                </div>
                <Progress 
                  value={status.scenariosTotal ? (status.scenariosMigrated / status.scenariosTotal) * 100 : 0} 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Marketing KPIs</span>
                  <span>{status.kpisMigrated} / {status.kpisTotal}</span>
                </div>
                <Progress 
                  value={status.kpisTotal ? (status.kpisMigrated / status.kpisTotal) * 100 : 0} 
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {status.errors.length === 0 ? (
                <div className="flex flex-col items-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                  <p className="text-lg font-medium text-green-700">Migration Complete!</p>
                  <p className="text-sm text-gray-600 text-center mt-1">
                    Your data has been successfully migrated to the cloud.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">Migration completed with warnings</span>
                  </div>
                  
                  <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded text-xs">
                    {status.errors.map((error: string, i: number) => (
                      <div key={i} className="mb-1 last:mb-0 text-gray-700">• {error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {(!status || (!status.inProgress && !status.completed)) && (
            <>
              <Button variant="outline" onClick={() => setShowCard(false)}>
                Later
              </Button>
              <Button onClick={handleStartMigration}>
                Migrate Data Now
              </Button>
            </>
          )}

          {status && status.inProgress && (
            <Button disabled className="w-full">
              <span className="animate-pulse">Migrating...</span>
            </Button>
          )}

          {status && status.completed && (
            <Button onClick={() => setShowCard(false)} className="w-full">
              Close
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default DataMigration; 
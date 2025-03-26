# Firebase Removal Plan

This document outlines the steps needed to completely remove Firebase dependencies from the application and transition to a purely client-side application using localStorage.

## 1. Current Firebase Dependencies

The application currently uses Firebase for:
- Authentication
- Firestore database for data storage
- Network status monitoring
- Offline capabilities

## 2. Key Components to Replace

### 2.1 Storage Layer Replacement
- [x] Created `localStorageService.ts` with localStorage-based implementations of all storage operations
  - [x] Product storage and retrieval
  - [x] Scenario storage and retrieval
  - [x] User settings storage and retrieval
  - [x] Export/import functionality

### 2.2 Authentication Replacement
- [x] Created `LocalAuthContext.tsx` with localStorage-based authentication simulation
  - [x] Anonymous authentication
  - [x] Email/password authentication simulation
  - [x] OAuth simulation (Google)
  - [x] User persistence

### 2.3 Storage Layer Integration
- [ ] Modify store to use only localStorage
  - [x] Created `localStore.ts` with simplified implementation
  - [ ] Update all components to use the new store
  - [ ] Remove useHybridStore and other Firebase-connected stores

### 2.4 Remove Firebase-Specific Components
- [ ] Remove NetworkStatusContext (no longer needed for pure client app)
- [ ] Remove OfflineManager (no longer needed for pure client app)
- [ ] Remove FirebaseConfig component
- [ ] Remove StorageControls
- [ ] Remove all Firebase initialization code

## 3. File Cleanup

### 3.1 Remove Firebase Files
- [ ] `src/lib/firebase.ts`
- [ ] `src/lib/firebase-config.ts`
- [ ] `src/lib/firestoreDb.ts`
- [ ] `src/contexts/AuthContext.tsx` (replaced by LocalAuthContext)
- [ ] `src/contexts/NetworkStatusContext.tsx`
- [ ] `src/contexts/StorageContext.tsx` (no longer needed)
- [ ] `src/hooks/useHybridStore.ts`
- [ ] `src/hooks/useStorageSync.ts`
- [ ] `src/components/ui/OfflineManager.tsx`
- [ ] `src/components/ui/StorageControls.tsx`
- [ ] `src/components/FirebaseConfig.tsx`

### 3.2 Update Import References
- [ ] Update all imports that reference removed files
- [ ] Replace firebase-dependent hooks with local storage alternatives
- [ ] Fix broken component dependencies

## 4. Fix Linter Issues

The application has several linter issues that need to be addressed:

### 4.1 React Hooks Rules
- [ ] Fix all `react-hooks/rules-of-hooks` errors
  - [ ] ActualsTracker.tsx - fix with useCallback for calculateAttendance
  - [ ] Fix other components with hooks dependency issues

### 4.2 Unused Imports and Variables
- [ ] Run `npm run cleanup:remove-unused` to clean up all unused imports
- [ ] Manually verify components that still have issues

### 4.3 `any` Type Issues
- [ ] Replace `any` types with proper TypeScript types
  - [ ] Create interfaces for all data structures
  - [ ] Use `unknown` where appropriate instead of `any`

### 4.4 React Fast Refresh Issues
- [ ] Move utility functions to separate files to fix `react-refresh/only-export-components` issues

## 5. Dummy/Placeholder Data

The application contains several areas with hardcoded or placeholder data that should be replaced with functionality that works with real inputs:

### 5.1 ExecutiveDashboard.tsx
- [ ] Replace hardcoded Week 1 data with real data from localStorage
- [ ] Change fallback values in cost breakdown percentages to use real calculations

### 5.2 MarketingAnalytics.tsx 
- [ ] Replace dummy marketing metrics with real calculations
- [ ] Implement real data for funnel rates and conversion metrics

### 5.3 Forecast Components
- [ ] Update ForecastCosts.tsx to use real data instead of placeholders
- [ ] Update ForecastRevenue.tsx to connect to real data sources

### 5.4 MarketingApiIntegration.tsx
- [ ] Replace mock API configurations with local simulation or remove if not needed

## 6. Testing

After completing all changes:

1. Run full linter check: `npm run lint -- --max-warnings=0`
2. Test all functionality to ensure nothing is broken:
   - [ ] Product creation and editing
   - [ ] Scenario modeling
   - [ ] Financial projections
   - [ ] Marketing analytics
   - [ ] Dashboard views
   - [ ] Data persistence between sessions

## 7. Additional Documentation Updates

- [ ] Update README.md to remove Firebase setup instructions
- [ ] Update all Firebase-related documentation
- [ ] Create new import/export documentation for data backup options 
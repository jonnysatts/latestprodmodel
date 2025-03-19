# Testing Firestore Security Rules

This guide explains how to thoroughly test your Firestore security rules to ensure they are working as expected.

## Local Testing with Firebase Emulator Suite

The Firebase Emulator Suite allows you to test your security rules locally before deploying them to production.

### Setting Up the Firebase Emulator

1. **Install the Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase Emulators**:
   ```bash
   firebase init emulators
   ```
   - Select Firestore and Authentication emulators
   - Choose ports (or accept defaults)

3. **Configure your application to use the emulators**:
   ```typescript
   // In your Firebase config file (e.g., src/lib/firebase.ts)
   import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
   import { getAuth, connectAuthEmulator } from "firebase/auth";

   // Initialize Firebase
   const app = initializeApp(firebaseConfig);
   const db = getFirestore(app);
   const auth = getAuth(app);

   if (process.env.NODE_ENV === 'development') {
     // Connect to local emulators
     connectFirestoreEmulator(db, 'localhost', 8080);
     connectAuthEmulator(auth, 'http://localhost:9099');
     console.log('Using Firebase emulators');
   }
   ```

4. **Start the emulators**:
   ```bash
   firebase emulators:start
   ```

### Writing Security Rules Tests

Create a test file for your security rules. You can use the built-in testing framework:

1. **Create a rules test file**:
   ```bash
   mkdir -p tests
   touch tests/firestore.rules.test.js
   ```

2. **Write tests using the Firebase testing framework**:

   ```javascript
   // tests/firestore.rules.test.js
   const { assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
   const firebase = require('@firebase/rules-unit-testing');

   // Initialize test environment
   const projectId = 'firestore-rules-test';
   
   describe('Firestore Security Rules', () => {
     let adminDb;
     let userDb;
     let anonDb;
   
     beforeAll(async () => {
       // Clear the database between tests
       await firebase.clearFirestoreData({ projectId });
       
       // Setup test app instances with different auth states
       adminDb = firebase.initializeTestApp({
         projectId,
         auth: { uid: 'admin-user', email: 'admin@example.com' }
       }).firestore();
       
       userDb = firebase.initializeTestApp({
         projectId,
         auth: { uid: 'test-user', email: 'user@example.com' }
       }).firestore();
       
       anonDb = firebase.initializeTestApp({
         projectId,
         auth: null
       }).firestore();
     });
   
     afterAll(async () => {
       await Promise.all(firebase.apps().map(app => app.delete()));
     });
   
     // Test products collection
     describe('Products collection', () => {
       beforeEach(async () => {
         // Set up test data
         const adminApp = firebase.initializeAdminApp({ projectId });
         const adminFirestore = adminApp.firestore();
         await adminFirestore.collection('products').doc('product1').set({
           info: { name: 'Test Product', type: 'software' },
           userId: 'test-user'
         });
       });
   
       test('Authenticated users can read products', async () => {
         const productRef = userDb.collection('products').doc('product1');
         await assertSucceeds(productRef.get());
       });
   
       test('Unauthenticated users cannot read products', async () => {
         const productRef = anonDb.collection('products').doc('product1');
         await assertFails(productRef.get());
       });
   
       test('Users can create products with valid data', async () => {
         const newProductRef = userDb.collection('products').doc('newProduct');
         await assertSucceeds(newProductRef.set({
           info: { 
             name: 'New Product', 
             type: 'hardware' 
           },
           userId: 'test-user'
         }));
       });
   
       test('Users cannot create products with invalid data', async () => {
         const newProductRef = userDb.collection('products').doc('invalidProduct');
         await assertFails(newProductRef.set({
           // Missing required info field
           userId: 'test-user'
         }));
       });
   
       test('Users cannot update products they do not own', async () => {
         // Set product owned by a different user
         const adminApp = firebase.initializeAdminApp({ projectId });
         const adminFirestore = adminApp.firestore();
         await adminFirestore.collection('products').doc('otherUserProduct').set({
           info: { name: 'Other User Product', type: 'software' },
           userId: 'other-user'
         });
         
         const productRef = userDb.collection('products').doc('otherUserProduct');
         await assertFails(productRef.update({
           'info.name': 'Attempted Update'
         }));
       });
     });
   
     // Test marketing KPIs collection
     describe('Marketing KPIs collection', () => {
       beforeEach(async () => {
         // Set up test data
         const adminApp = firebase.initializeAdminApp({ projectId });
         const adminFirestore = adminApp.firestore();
         await adminFirestore.collection('marketingKpis').doc('kpi1').set({
           name: 'Customer Acquisition Cost',
           category: 'Acquisition',
           target: 100,
           current: 120,
           unit: 'USD',
           productId: 'product1',
           userId: 'test-user'
         });
       });
   
       test('Users can read their own KPIs', async () => {
         const kpiRef = userDb.collection('marketingKpis').doc('kpi1');
         await assertSucceeds(kpiRef.get());
       });
   
       test('Users cannot read KPIs they do not own', async () => {
         // Set KPI owned by a different user
         const adminApp = firebase.initializeAdminApp({ projectId });
         const adminFirestore = adminApp.firestore();
         await adminFirestore.collection('marketingKpis').doc('otherUserKpi').set({
           name: 'Conversion Rate',
           category: 'Conversion',
           target: 5,
           current: 3,
           unit: '%',
           productId: 'product2',
           userId: 'other-user'
         });
         
         const kpiRef = userDb.collection('marketingKpis').doc('otherUserKpi');
         await assertFails(kpiRef.get());
       });
     });
   
     // Add more tests for other collections
   });
   ```

3. **Run the tests**:
   ```bash
   npx firebase emulators:exec "jest tests/firestore.rules.test.js"
   ```

## Using the Rules Playground in Firebase Console

The Firebase Console provides a Rules Playground that allows you to test your security rules against sample data and user scenarios.

1. **Access the Rules Playground**:
   - Go to the [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Navigate to Firestore Database
   - Click on the "Rules" tab
   - Click on "Rules Playground"

2. **Configure a test scenario**:
   - Select the collection and operation (get, list, create, update, delete)
   - Provide sample data if needed
   - Configure authentication settings (authenticated or unauthenticated)
   - Run the simulation

3. **Analyze the results**:
   - The playground will show if the operation is allowed or denied
   - It will also provide a detailed explanation of why the rule matched or failed

## Common Scenarios to Test

Ensure you test these common scenarios:

1. **Authentication Status**:
   - Test access when authenticated vs. unauthenticated
   - Test with different user types if you have role-based access

2. **Data Ownership**:
   - Test accessing/modifying your own data
   - Test accessing/modifying someone else's data

3. **Data Validation**:
   - Test creating/updating documents with valid data
   - Test creating/updating documents with invalid data
   - Test edge cases in your validation rules

4. **Path-Based Access**:
   - If you have nested collections, test access at different levels
   - Test wildcard paths

5. **Function Behavior**:
   - If using custom functions in your rules, test each function separately
   - Test composition of multiple functions

## Troubleshooting Security Rules

When rules don't work as expected:

1. **Check the Firebase logs** in the console or emulator to see detailed rule evaluation.

2. **Use the `debug()` function** in your rules to log information during evaluation:
   ```
   allow read: if debug('User ID:', request.auth.uid) && isOwner();
   ```

3. **Break down complex rules** into smaller parts to identify which condition is failing.

4. **Test with minimal rules** first, then build up complexity to identify where issues occur.

## Best Practices for Testing Security Rules

1. **Test before deployment** - Always test rules before deploying to production.

2. **Test after deployment** - Verify rules are working in production with limited test data.

3. **Maintain a test suite** - Keep comprehensive tests to prevent regression when rules change.

4. **Test both positive and negative cases** - Ensure rules allow legitimate access and block unauthorized access.

5. **Include edge cases** - Test boundary conditions and unusual data formats.

6. **Automate testing** - Include security rules tests in your CI/CD pipeline.

---

By thoroughly testing your security rules, you can ensure your Firestore database is properly protected while allowing legitimate access patterns. 
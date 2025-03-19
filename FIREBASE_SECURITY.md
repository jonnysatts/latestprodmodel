# Deploying Firestore Security Rules

This guide explains how to deploy your Firestore security rules to Firebase, ensuring your database is properly protected.

## Overview

Security rules are crucial for protecting your Firestore data. They control who can read from and write to your database, and under what conditions. The rules in this project implement:

1. **Authentication checks** - Only authenticated users can access data
2. **User ownership verification** - Users can only access their own data
3. **Data validation** - Ensuring data meets specific format requirements
4. **Granular permissions** - Different rules for different collections

## Deployment Options

### Option 1: Using the Firebase CLI (Recommended)

The Firebase Command Line Interface (CLI) is the most flexible way to deploy your rules.

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done):
   ```bash
   firebase init firestore
   ```
   - This creates a `.firebaserc` file linking to your project
   - It also sets up the default rules file structure

4. **Deploy the rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Option 2: Using the Firebase Console

You can also copy and paste your rules directly into the Firebase Console:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database
4. Click on the "Rules" tab
5. Copy the contents of your `firestore.rules` file
6. Paste them into the rules editor
7. Click "Publish"

## Understanding Our Rules

Our security rules implement several key concepts:

### Helper Functions

- `isAuthenticated()` - Checks if the user is logged in
- `isOwner(userId)` - Checks if the current user owns the data
- `isValidProduct(product)` - Validates product data format
- `isValidMarketingKPI(kpi)` - Validates marketing KPI data format

### Collection-Specific Rules

#### Products Collection
- Only authenticated users can read products
- Creation requires valid product data
- Updates and deletions require ownership

#### Marketing KPIs Collection
- KPIs require ownership for read access
- Creation requires valid KPI data
- Updates and deletions require ownership
- KPIs can exist as standalone documents or as subcollections under products

#### Scenarios Collection
- Users can only read their own scenarios
- Creation requires specific fields
- Updates and deletions require ownership

#### User Data
- Users can only access their own data
- User preferences are protected
- Migration status is user-specific

### Default Deny Policy

- All other access is denied by default
- This follows the security principle of "deny by default"

## Testing Your Rules

Before relying on your deployed rules, you should test them thoroughly:

1. **Use the Firebase Emulator** for local testing
2. **Test with the Rules Playground** in the Firebase Console
3. **Verify with real requests** from your application

For detailed testing instructions, see `TESTING_FIRESTORE_RULES.md`

## Monitoring and Troubleshooting

After deployment, you should:

1. **Monitor rule rejections** in the Firebase Console
2. **Check Firebase logs** for unexpected denials
3. **Update rules** as your data model evolves

## Best Practices

1. **Never hardcode user IDs** in rules
2. **Keep rules modular** with reusable functions
3. **Test thoroughly** before and after deployment
4. **Document changes** to rules for team reference
5. **Audit periodically** to ensure continued security

## Recommended Rule Modifications

As your application evolves, consider these enhancements:

1. **Add rate limiting** to prevent abuse
2. **Implement role-based access** for different user types 
3. **Add more granular validation** as data complexity increases
4. **Create custom functions** for complex authorization logic

---

For questions or issues with Firebase security rules, consult the [Firebase Security Rules documentation](https://firebase.google.com/docs/firestore/security/get-started) or contact the development team. 
# Code Cleanup Scripts

This directory contains scripts to help clean up the codebase and fix linter errors.

## Overview of Linter Issues

Our codebase has several common linter issues:

1. **Unused imports and variables** (`@typescript-eslint/no-unused-vars`)
   - Variables, functions, or components that are defined but never used
   - Imported modules that aren't actually used

2. **Use of `any` type** (`@typescript-eslint/no-explicit-any`)
   - Explicit 'any' types that should be replaced with more specific types
   - Use our new common types in `src/types/common-types.ts` as replacements

3. **React Hook dependency issues** (`react-hooks/exhaustive-deps`)
   - Missing dependencies in useEffect, useCallback, and useMemo hooks
   - These can cause stale closures and hard-to-debug issues

4. **Hook rule violations** (`react-hooks/rules-of-hooks`)
   - Hooks called conditionally or inside functions that aren't components
   - Hooks must be called at the top level of components

5. **Improper type definitions** (`@typescript-eslint/ban-types`)
   - Using `{}` as a type, which should be replaced with more specific types

## Available Scripts

### `fix-linter-issues.js`

This script attempts to automatically fix some common linter issues:

```bash
node cleanup-scripts/fix-linter-issues.js
```

It will:
- Replace common patterns of `any` with appropriate types
- Perform basic cleanup tasks

### `remove-unused-imports.js`

Helps identify potentially unused imports:

```bash
node cleanup-scripts/remove-unused-imports.js
```

This will output a list of imports that might be unused. Review these manually as the detection isn't perfect.

## Manual Cleanup Approach

For a thorough cleanup, follow these steps:

1. Run the linter to see the current issues:
   ```bash
   npm run lint
   ```

2. Prioritize fixing:
   - Unused imports (easy wins)
   - Replace `any` types with proper types from `common-types.ts`
   - Fix hook dependency issues by properly including all dependencies
   - Fix rule-of-hooks violations by restructuring code

3. Regularly run the linter to see your progress:
   ```bash
   npm run lint
   ```

4. Use the `--fix` option to automatically fix some issues:
   ```bash
   npm run lint:fix
   ```

## Common Fix Patterns

### Replacing `any` Types

```typescript
// Before
function processData(data: any): any {
  // ...
}

// After
import { GenericRecord } from '../types/common-types';

function processData(data: GenericRecord): unknown {
  // ...
}
```

### Fixing Hook Dependencies

```typescript
// Before
useEffect(() => {
  setCalculatedValue(price * quantity);
}, []); // Missing dependencies

// After
useEffect(() => {
  setCalculatedValue(price * quantity);
}, [price, quantity]); // All dependencies included
```

### Fixing Unused Imports

Simply remove the unused imports or comment them out if they'll be used later.

### Fixing Conditional Hook Calls

```typescript
// Before (incorrect)
function MyComponent() {
  if (condition) {
    // Error: Hooks can't be called conditionally
    useEffect(() => {
      // ...
    }, []);
  }
}

// After (correct)
function MyComponent() {
  useEffect(() => {
    if (condition) {
      // Now the hook is always called, but its effect is conditional
      // ...
    }
  }, [condition]);
}
```

## TypeScript Specific Issues

For TypeScript specific issues, see our new common types file at `src/types/common-types.ts` which provides ready-to-use types for common patterns. 
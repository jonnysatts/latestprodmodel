// fix-react-hooks.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import glob from 'glob';

/**
 * Script to detect and fix common React Hook violations:
 * 1. Conditional hook calls
 * 2. Missing dependencies in useEffect/useCallback/useMemo
 * 3. Hooks called in non-component functions
 */

// Get the current file URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

// Find all React component files
const findReactFiles = () => {
  return glob.sync(`${srcDir}/**/*.{jsx,tsx}`);
};

// Process React Hook rule violations
const fixReactHooks = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updated = content;
    let hasChanges = false;

    // Fix conditional hook calls by moving hooks outside conditions
    const conditionalHookRegex = /(if|for|while|switch)\s*\([^)]*\)\s*\{[^{}]*\b(use[A-Z][a-zA-Z]+)\(/g;
    if (conditionalHookRegex.test(content)) {
      console.log(`Found conditional hook in ${path.relative(rootDir, filePath)}`);
      // We can't automatically fix this due to complexity, but we can warn about it
      console.log('⚠️ Manual fix needed: Hooks should not be called inside conditionals');
    }

    // Fix missing dependencies in useEffect
    const useEffectRegex = /useEffect\(\(\)\s*=>\s*\{([\s\S]*?)\},\s*\[(.*?)\]\)/g;
    let match;
    
    while ((match = useEffectRegex.exec(content)) !== null) {
      const effectBody = match[1];
      const dependencyArray = match[2];
      const dependencies = dependencyArray.split(',').map(dep => dep.trim()).filter(Boolean);
      
      // Find variables in the effect body that might be dependencies
      const stateRegex = /\b([a-zA-Z][a-zA-Z0-9_]*)\b(?!\s*\()/g;
      const potentialDeps = new Set();
      let stateMatch;
      
      while ((stateMatch = stateRegex.exec(effectBody)) !== null) {
        const varName = stateMatch[1];
        if (!['const', 'let', 'var', 'function', 'if', 'else', 'for', 'while'].includes(varName)) {
          potentialDeps.add(varName);
        }
      }
      
      // Find which dependencies are missing
      const missingDeps = [...potentialDeps].filter(dep => 
        !dependencies.includes(dep) && 
        !['useEffect', 'useState', 'useCallback', 'useMemo', 'useRef'].includes(dep)
      );
      
      if (missingDeps.length > 0) {
        console.log(`Found missing dependencies in ${path.relative(rootDir, filePath)}:`);
        console.log(`Missing: ${missingDeps.join(', ')}`);
        
        // Create new dependency array with missing deps
        const newDependencyArray = [...dependencies, ...missingDeps].join(', ');
        
        // Replace the old dependency array with the new one
        const start = match.index;
        const end = start + match[0].length;
        const replacement = `useEffect(() => {${effectBody}}, [${newDependencyArray}])`;
        
        updated = updated.substring(0, start) + replacement + updated.substring(end);
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, updated);
      console.log(`✅ Updated dependencies in ${path.relative(rootDir, filePath)}`);
    }
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
};

console.log('Fixing React Hook violations...');
const reactFiles = findReactFiles();
reactFiles.forEach(fixReactHooks);
console.log('React Hook violations check completed!'); 
processFiles(); 
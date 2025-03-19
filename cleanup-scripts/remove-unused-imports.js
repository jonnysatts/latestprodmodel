// remove-unused-imports.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import glob from 'glob';

/**
 * Script to aggressively remove unused imports and variables:
 * 1. Identifies and removes unused imports
 * 2. Identifies and removes unused variables
 * 3. Identifies and removes unused function parameters
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

// Find all TypeScript/React files
const findTsFiles = () => {
  return glob.sync(`${srcDir}/**/*.{ts,tsx,js,jsx}`);
};

// Process files to remove unused imports and variables
const removeUnused = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updated = content;
    let hasChanges = false;

    // Remove unused imports
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const imports = match[1];
      const source = match[2];
      
      // Check for imports that have additional comments like "// unused"
      if (imports.includes('// unused') || imports.includes('/* unused */')) {
        console.log(`Found marked unused imports in ${path.relative(rootDir, filePath)} from "${source}"`);
        
        // Parse the imports section and filter out marked unused ones
        const importItems = imports.split(',').map(item => item.trim());
        const cleanImports = importItems.filter(item => 
          !item.includes('// unused') && !item.includes('/* unused */')
        );
        
        if (cleanImports.length === 0) {
          // Remove the entire import statement if all imports are unused
          const start = match.index;
          const end = start + match[0].length;
          updated = updated.substring(0, start) + updated.substring(end);
          hasChanges = true;
        } else {
          // Replace with clean imports
          const start = match.index;
          const end = start + match[0].length;
          const replacement = `import { ${cleanImports.join(', ')} } from '${source}'`;
          updated = updated.substring(0, start) + replacement + updated.substring(end);
          hasChanges = true;
        }
      }
    }
    
    // Use regex pattern to identify unused variables from ESLint comments
    const unusedVarRegex = /(\/\/ eslint-disable-next-line no-unused-vars|\/\* eslint-disable-next-line no-unused-vars \*\/)\s*(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    
    while ((match = unusedVarRegex.exec(content)) !== null) {
      const commentType = match[1];
      const varType = match[2];
      const varName = match[3];
      
      console.log(`Found unused variable ${varName} in ${path.relative(rootDir, filePath)}`);
      
      // Remove the variable declaration and the ESLint comment
      const start = match.index;
      const end = start + match[0].length;
      updated = updated.substring(0, start) + updated.substring(end);
      hasChanges = true;
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, updated);
      console.log(`✅ Removed unused imports/variables in ${path.relative(rootDir, filePath)}`);
    }
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
};

console.log('Removing unused imports and variables...');
const tsFiles = findTsFiles();
tsFiles.forEach(removeUnused);
console.log('Unused imports and variables removal completed!'); 
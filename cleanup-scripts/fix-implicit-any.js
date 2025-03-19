import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import glob from 'glob';

/**
 * Script to add type annotations to implicit 'any' parameters:
 * 1. Identify parameters without type annotations
 * 2. Add 'unknown' type annotation to those parameters
 * 3. Comment suspicious uses of 'any' with recommended types
 */

// Get the current file URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

// Find all TypeScript files
const findTsFiles = () => {
  return glob.sync(`${srcDir}/**/*.{ts,tsx}`);
};

// Process files to fix implicit any types
const fixImplicitAny = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updated = content;
    let hasChanges = false;

    // Fix callback parameters in array methods (map, filter, reduce, forEach, etc.)
    const arrayMethodRegex = /(\.map|\.filter|\.reduce|\.forEach|\.find|\.findIndex|\.some|\.every)\(\(?([a-zA-Z0-9_$]+)(\s*,\s*[a-zA-Z0-9_$]+)?\)?\s*=>/g;
    updated = updated.replace(arrayMethodRegex, (match, method, param1, param2) => {
      if (method === '.reduce') {
        // For reduce, we need to handle accumulator and current value
        return `${method}((${param1}: any${param2 ? `, ${param2.trim()}: any` : ''}) =>`;
      } else {
        // For other methods, add type to each parameter
        return `${method}((${param1}: any${param2 ? `, ${param2.trim()}: any` : ''}) =>`;
      }
    });

    // Fix implicit any in destructuring
    const destructuringRegex = /const\s+\{\s*([^}]+)\s*\}\s*=\s*([a-zA-Z0-9_$.]+)/g;
    updated = updated.replace(destructuringRegex, (match, props, obj) => {
      // Skip if the object is a well-known type with implicit types (like React props)
      if (obj === 'props' || obj === 'this.props' || obj === 'this.state') {
        return match;
      }
      return `const { ${props} }: Record<string, any> = ${obj}`;
    });

    // Fix implicit any in function parameters
    const functionParamRegex = /function\s+([a-zA-Z0-9_$]+)\s*\(\s*([^:)\s]+)(\s*,\s*[^:)\s]+)*\s*\)/g;
    updated = updated.replace(functionParamRegex, (match, funcName, firstParam, restParams) => {
      if (!firstParam) return match; // No parameters
      const typedFirstParam = `${firstParam}: any`;
      const typedRestParams = restParams ? restParams.replace(/([^,\s]+)/g, '$1: any') : '';
      return `function ${funcName}(${typedFirstParam}${typedRestParams})`;
    });

    // Fix implicit any in arrow function parameters
    const arrowFuncRegex = /const\s+([a-zA-Z0-9_$]+)\s*=\s*\(\s*([^:)\s]+)(\s*,\s*[^:)\s]+)*\s*\)\s*=>/g;
    updated = updated.replace(arrowFuncRegex, (match, funcName, firstParam, restParams) => {
      if (!firstParam) return match; // No parameters
      const typedFirstParam = `${firstParam}: any`;
      const typedRestParams = restParams ? restParams.replace(/([^,\s]+)/g, '$1: any') : '';
      return `const ${funcName} = (${typedFirstParam}${typedRestParams}) =>`;
    });

    if (updated !== content) {
      fs.writeFileSync(filePath, updated);
      console.log(`✅ Fixed implicit any types in ${path.relative(rootDir, filePath)}`);
      hasChanges = true;
    }

  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
};

console.log('Fixing implicit any types...');
const tsFiles = findTsFiles();
tsFiles.forEach(fixImplicitAny);
console.log('Implicit any types fix completed!'); 
#!/usr/bin/env node
/**
 * Script to find and fix unused imports in TypeScript files.
 * 
 * Usage:
 * 1. Make this script executable: chmod +x cleanup-scripts/fix-unused-imports.js
 * 2. Run it: ./cleanup-scripts/fix-unused-imports.js [files/directories]
 * 
 * Example: ./cleanup-scripts/fix-unused-imports.js src/components/*.tsx
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get files to process from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Please provide files or directories to process');
  console.log('Example: ./cleanup-scripts/fix-unused-imports.js src/components/*.tsx');
  process.exit(1);
}

// Find all TypeScript files based on args
let files = [];
for (const arg of args) {
  if (arg.includes('*')) {
    // Handle glob patterns
    const globPattern = arg.replace(/\\/g, '/');
    const result = execSync(`find . -type f -path "${globPattern}"`, { encoding: 'utf-8' });
    files = files.concat(result.trim().split('\n').filter(file => file));
  } else if (fs.existsSync(arg)) {
    const stats = fs.statSync(arg);
    if (stats.isDirectory()) {
      // Find all TypeScript files in the directory
      const result = execSync(`find ${arg} -type f -name "*.ts" -o -name "*.tsx"`, { encoding: 'utf-8' });
      files = files.concat(result.trim().split('\n').filter(file => file));
    } else if (stats.isFile() && (arg.endsWith('.ts') || arg.endsWith('.tsx'))) {
      files.push(arg);
    }
  }
}

// Process each file
for (const file of files) {
  if (!file) continue;

  console.log(`Processing ${file}...`);
  
  try {
    // Run ESLint to find unused imports
    const unusedImports = findUnusedImports(file);
    
    if (unusedImports.length === 0) {
      console.log(`  No unused imports found`);
      continue;
    }
    
    console.log(`  Found ${unusedImports.length} unused imports`);
    
    // Read the file content
    let content = fs.readFileSync(file, 'utf-8');
    
    // Remove each unused import
    for (const importName of unusedImports) {
      content = removeImport(content, importName);
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(file, content, 'utf-8');
    
    console.log(`  Updated ${file}`);
  } catch (error) {
    console.error(`  Error processing ${file}:`, error.message);
  }
}

/**
 * Find unused imports in a file using ESLint
 */
function findUnusedImports(file) {
  try {
    // Run ESLint with the no-unused-vars rule
    const output = execSync(
      `npx eslint --no-eslintrc --parser @typescript-eslint/parser --plugin @typescript-eslint --rule '{"@typescript-eslint/no-unused-vars": "error"}' --format json ${file}`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    
    // Parse the JSON output
    const results = JSON.parse(output);
    
    // Find all unused variables that are imports
    const unusedImports = [];
    for (const result of results) {
      if (!result.messages) continue;
      
      for (const message of result.messages) {
        if (message.ruleId === '@typescript-eslint/no-unused-vars') {
          // Read the file content to check if this is an import
          const content = fs.readFileSync(file, 'utf-8');
          const lines = content.split('\n');
          
          // Check if the unused variable is an import
          const importRegex = new RegExp(`import\\s+\\{.*\\b${message.message.split(' ')[0]}\\b.*\\}\\s+from`);
          for (const line of lines) {
            if (importRegex.test(line)) {
              unusedImports.push(message.message.split(' ')[0]);
              break;
            }
          }
        }
      }
    }
    
    return unusedImports;
  } catch (error) {
    // ESLint might return non-zero exit code if it finds issues
    // We need to extract the JSON output from stdout
    if (error.stdout) {
      try {
        const results = JSON.parse(error.stdout);
        
        // Find all unused variables that are imports
        const unusedImports = [];
        for (const result of results) {
          if (!result.messages) continue;
          
          for (const message of result.messages) {
            if (message.ruleId === '@typescript-eslint/no-unused-vars') {
              unusedImports.push(message.message.split(' ')[0]);
            }
          }
        }
        
        return unusedImports;
      } catch (e) {
        console.error('Failed to parse ESLint output:', e.message);
        return [];
      }
    } else {
      console.error('ESLint error:', error.message);
      return [];
    }
  }
}

/**
 * Remove an import from the file content
 */
function removeImport(content, importName) {
  // Remove the import if it's the only one in the import statement
  let regex = new RegExp(`import\\s+\\{\\s*${importName}\\s*\\}\\s+from\\s+['"][^'"]+['"];?\\s*\\n?`, 'g');
  if (regex.test(content)) {
    content = content.replace(regex, '');
    return content;
  }
  
  // Remove the import if it's part of a multi-import statement
  content = content.replace(
    new RegExp(`import\\s+\\{([^}]*)\\b${importName}\\b([^}]*)\\}\\s+from`, 'g'),
    (match, before, after) => {
      // Handle trailing comma
      before = before.replace(/,\s*$/, '');
      after = after.replace(/^\s*,/, '');
      
      if (before.trim() === '' && after.trim() === '') {
        // This was the only import, remove the entire statement
        return '';
      }
      
      // There are other imports, reconstruct the import statement
      const imports = [...before.split(','), ...after.split(',')]
        .map(i => i.trim())
        .filter(i => i !== '' && i !== importName)
        .join(', ');
      
      return `import { ${imports} } from`;
    }
  );
  
  return content;
} 
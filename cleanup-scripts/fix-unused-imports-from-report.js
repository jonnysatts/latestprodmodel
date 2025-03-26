// fix-unused-imports-from-report.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const reportFile = path.join(rootDir, 'eslint-report.json');

// Function to process a file and remove unused imports
const processFile = (filePath, unusedImports) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let hasChanges = false;
    
    // Sort unused imports by position to process them from the end to the beginning
    // This way, we avoid issues with changing line positions
    unusedImports.sort((a, b) => b.position - a.position);
    
    for (const unusedImport of unusedImports) {
      const { name, position, line } = unusedImport;
      
      // Find the import statement containing this import
      const lineContent = content.split('\n')[line - 1];
      
      if (!lineContent.includes('import ')) {
        continue; // Skip if not an import line
      }
      
      // Check if it's a named import in braces
      const namedImportRegex = new RegExp(`import\\s+{([^}]*)${name}([^}]*)}\\s+from\\s+['"](.*?)['"]`);
      const namedMatch = lineContent.match(namedImportRegex);
      
      if (namedMatch) {
        const before = namedMatch[1];
        const after = namedMatch[2];
        const source = namedMatch[3];
        
        // Check if this is the only import
        const trimmedBefore = before.trim();
        const trimmedAfter = after.trim();
        const hasBeforeImports = trimmedBefore && trimmedBefore.length > 0 && !trimmedBefore.endsWith(',');
        const hasAfterImports = trimmedAfter && trimmedAfter.length > 0 && !trimmedAfter.startsWith(',');
        
        if (!hasBeforeImports && !hasAfterImports) {
          // This is the only import, remove the entire line
          const lines = updatedContent.split('\n');
          lines.splice(line - 1, 1);
          updatedContent = lines.join('\n');
          console.log(`Removed entire import line for ${name} in ${filePath}`);
          hasChanges = true;
        } else {
          // Remove just this import from the braces
          let newImport;
          
          if (hasBeforeImports && hasAfterImports) {
            // We have imports before and after, need to handle comma
            newImport = `import {${before}${after}} from '${source}'`;
          } else if (hasBeforeImports) {
            // Only imports before
            newImport = `import {${before.replace(/,\s*$/, '')}} from '${source}'`;
          } else {
            // Only imports after
            newImport = `import {${after.replace(/^\s*,/, '')}} from '${source}'`;
          }
          
          const lines = updatedContent.split('\n');
          lines[line - 1] = newImport;
          updatedContent = lines.join('\n');
          console.log(`Removed import ${name} in ${filePath}`);
          hasChanges = true;
        }
      }
      
      // Check for default imports
      const defaultImportRegex = new RegExp(`import\\s+${name}\\s+from\\s+['"](.*?)['"]`);
      const defaultMatch = lineContent.match(defaultImportRegex);
      
      if (defaultMatch) {
        // Default import, remove the entire line
        const lines = updatedContent.split('\n');
        lines.splice(line - 1, 1);
        updatedContent = lines.join('\n');
        console.log(`Removed default import ${name} in ${filePath}`);
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ Updated ${path.relative(rootDir, filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
};

// Main function
const main = async () => {
  try {
    // Read the ESLint report
    if (!fs.existsSync(reportFile)) {
      console.error('ESLint report not found. Please run npm run lint:report first.');
      process.exit(1);
    }
    
    const reportData = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    
    // Track files with unused imports
    const filesWithUnusedImports = {};
    
    // Extract unused imports from the report
    for (const fileReport of reportData) {
      const filePath = fileReport.filePath;
      const unusedImports = [];
      
      for (const message of fileReport.messages) {
        if (message.ruleId === '@typescript-eslint/no-unused-vars') {
          unusedImports.push({
            name: message.message.split("'")[1], // Extract the variable name
            position: message.column,
            line: message.line
          });
        }
      }
      
      if (unusedImports.length > 0) {
        filesWithUnusedImports[filePath] = unusedImports;
      }
    }
    
    // Process each file
    console.log(`Found ${Object.keys(filesWithUnusedImports).length} files with unused imports.`);
    let totalFixed = 0;
    
    for (const [filePath, unusedImports] of Object.entries(filesWithUnusedImports)) {
      if (processFile(filePath, unusedImports)) {
        totalFixed++;
      }
    }
    
    console.log(`Fixed unused imports in ${totalFixed} files.`);
  } catch (error) {
    console.error('Error running script:', error);
    process.exit(1);
  }
};

// Run the main function
main().catch(error => {
  console.error('Error running script:', error);
  process.exit(1);
}); 
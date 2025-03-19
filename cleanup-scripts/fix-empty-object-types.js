import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Script to replace empty object types ({}) with more appropriate types:
 * - {} as an object type becomes 'object'
 * - {} as a general value type becomes 'unknown'
 */

// Get the current file URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

// Helper function to read all TypeScript declaration files
function readTypeFiles(dir) {
  const files = [];
  
  function traverseDirectory(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        traverseDirectory(fullPath);
      } else if (entry.isFile() && 
                (entry.name.endsWith('.d.ts') || 
                 entry.name === 'vite-env.d.ts' || 
                 entry.name === 'react.d.ts')) {
        files.push(fullPath);
        console.log(`Found: ${fullPath}`);
      }
    }
  }
  
  traverseDirectory(dir);
  return files;
}

// Fix empty object types
function fixEmptyObjectTypes(fileContent) {
  // Replace standalone {} type with better alternatives
  let result = fileContent;
  
  // Replace {}: Type (parameter) with unknown
  result = result.replace(/(\w+\s*:\s*)\{\}(\s*[,)])/g, '$1unknown$2');
  
  // Replace function(): {} with function(): unknown
  result = result.replace(/(\w+\s*\([^)]*\)\s*:\s*)\{\}(\s*[;,)])/g, '$1unknown$2');
  
  // Replace <{}> with <unknown>
  result = result.replace(/<\{\}>(?!\w)/g, '<unknown>');
  
  // Replace }: {} with }: Record<string, never>
  result = result.replace(/(\w+\s*}:\s*)\{\}(\s*[,);])/g, '$1Record<string, never>$2');
  
  return result;
}

// Process all files
function processFiles() {
  const files = readTypeFiles(srcDir);
  
  console.log(`Found ${files.length} TypeScript declaration files to process`);
  let filesUpdated = 0;
  
  for (const file of files) {
    try {
      const fileContent = fs.readFileSync(file, 'utf8');
      
      // Apply transformation
      const updatedContent = fixEmptyObjectTypes(fileContent);
      
      // Only write if content changed
      if (updatedContent !== fileContent) {
        fs.writeFileSync(file, updatedContent, 'utf8');
        console.log(`Updated ${path.relative(rootDir, file)}`);
        filesUpdated++;
      }
    } catch (error) {
      console.error(`Error processing ${file}: ${error.message}`);
    }
  }
  
  console.log(`Completed: Updated ${filesUpdated} files.`);
}

// Run the script
processFiles(); 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Script to replace @ts-ignore with @ts-expect-error
 * This is a common linter issue that's easily fixable
 */

// Get the current file URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

// Helper function to read all TypeScript files
function readTsFiles(dir) {
  const files = [];
  
  function traverseDirectory(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        traverseDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
  }
  
  traverseDirectory(dir);
  return files;
}

// Fix @ts-ignore to @ts-expect-error
function fixTsIgnores(fileContent) {
  // Replace all occurrences of @ts-ignore with @ts-expect-error
  return fileContent.replace(/\/\/ @ts-ignore/g, '// @ts-expect-error');
}

// Process all files
function processFiles() {
  const files = readTsFiles(srcDir);
  
  console.log(`Found ${files.length} TypeScript files to process`);
  let filesUpdated = 0;
  
  for (const file of files) {
    try {
      const fileContent = fs.readFileSync(file, 'utf8');
      
      // Apply transformation
      const updatedContent = fixTsIgnores(fileContent);
      
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
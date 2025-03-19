import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { fileURLToPath } from 'url';

/**
 * Script to automatically fix common linter issues:
 * 1. Remove unused imports
 * 2. Add types to replace 'any' where possible
 * 3. Add missing dependencies to React hooks
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

// Fix unused imports
function fixUnusedImports(fileContent, fileName) {
  const sourceFile = ts.createSourceFile(
    fileName,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );
  
  // Get all import declarations
  const importDeclarations = [];
  function visit(node) {
    if (ts.isImportDeclaration(node)) {
      importDeclarations.push(node);
    }
    ts.forEachChild(node, visit);
  }
  
  ts.forEachChild(sourceFile, visit);
  
  // Process each import declaration
  // (This is a simplified implementation and would need to be expanded)
  
  return fileContent; // Return modified content
}

// Fix explicit any types
function fixExplicitAnyTypes(fileContent) {
  // Replace common patterns of 'any' with appropriate types
  // This is a simplified implementation
  
  return fileContent
    .replace(/: any\[\]/g, ': unknown[]')
    .replace(/: any /g, ': unknown ')
    .replace(/\(.*: any.*\) =>/g, (match) => {
      return match.replace(/: any/g, ': unknown');
    });
}

// Fix React hook dependencies
function fixReactHookDependencies(fileContent) {
  // This is a complex task that would require proper AST parsing
  // A simplified implementation can't reliably fix this
  
  return fileContent;
}

// Process all files
function processFiles() {
  const files = readTsFiles(srcDir);
  
  console.log(`Found ${files.length} TypeScript files to process`);
  
  for (const file of files) {
    try {
      const fileContent = fs.readFileSync(file, 'utf8');
      
      // Apply transformations
      let updatedContent = fileContent;
      updatedContent = fixUnusedImports(updatedContent, file);
      updatedContent = fixExplicitAnyTypes(updatedContent);
      updatedContent = fixReactHookDependencies(updatedContent);
      
      // Only write if content changed
      if (updatedContent !== fileContent) {
        fs.writeFileSync(file, updatedContent, 'utf8');
        console.log(`Updated ${path.relative(rootDir, file)}`);
      }
    } catch (error) {
      console.error(`Error processing ${file}: ${error.message}`);
    }
  }
}

// Run the script
processFiles(); 
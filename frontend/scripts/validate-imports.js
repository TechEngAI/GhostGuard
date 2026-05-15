#!/usr/bin/env node

/**
 * Validates that all React/framer-motion hooks and components are properly imported
 * Runs before build to catch missing imports early
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_IMPORTS = {
  'useState': 'react',
  'useEffect': 'react',
  'useScroll': 'framer-motion',
  'useTransform': 'framer-motion',
  'motion': 'framer-motion',
  'AnimatePresence': 'framer-motion',
  'Link': 'next/link',
  'Button': '@/components/ui/Button',
  'useScrollAnimation': '@/hooks/useScrollAnimation'
};

const componentsDir = path.join(__dirname, '../components');
let errors = [];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Get all imports
  const importedItems = new Set();
  lines.forEach(line => {
    // Matches named imports: import { a, b } from '...'
    const namedMatch = line.match(/import\s+{([^}]+)}\s+from/);
    if (namedMatch) {
      const items = namedMatch[1].split(',').map(s => s.trim().split(' as ')[0]);
      items.forEach(item => importedItems.add(item));
    }
    // Matches default imports: import a from '...'
    const defaultMatch = line.match(/import\s+(\w+)\s+from/);
    if (defaultMatch) {
      importedItems.add(defaultMatch[1]);
    }
  });

  // Check for usage of items that aren't imported
  Object.entries(REQUIRED_IMPORTS).forEach(([item, source]) => {
    const regex = new RegExp(`\\b${item}\\b`);
    if (regex.test(content) && !importedItems.has(item)) {
      // Ignore if it's a type definition or something false positive
      if (content.includes(`export function ${item}`)) return; 
      if (content.includes(`export default function ${item}`)) return;
      errors.push(`${filePath}: "${item}" used but not imported from "${source}"`);
    }
  });
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !file.startsWith('.')) {
      walkDir(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      checkFile(fullPath);
    }
  });
}

console.log('🔍 Validating imports in components directory...');
walkDir(componentsDir);

if (errors.length > 0) {
  console.error('\n❌ IMPORT VALIDATION FAILED:\n');
  errors.forEach(err => console.error(`  ${err}`));
  process.exit(1);
} else {
  console.log('✅ All imports validated successfully!');
  process.exit(0);
}

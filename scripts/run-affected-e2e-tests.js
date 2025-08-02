#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Script to run only E2E tests affected by changed files
 * This helps speed up pre-commit hooks by only running relevant tests
 */

// Get list of changed files
function getChangedFiles() {
  try {
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
    
    const modifiedFiles = execSync('git diff --name-only', { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
    
    return [...new Set([...stagedFiles, ...modifiedFiles])];
  } catch (error) {
    console.error('Error getting changed files:', error.message);
    return [];
  }
}

// Map changed files to affected test specs
function getAffectedTests(changedFiles) {
  const affectedTests = new Set();
  
  const testMappings = {
    // Frontend routes to test specs
    'frontend/src/routes/login': ['auth.spec.ts'],
    'frontend/src/routes/dashboard': ['navigation.spec.ts'],
    'frontend/src/routes/courses': ['courses.spec.ts'],
    'frontend/src/routes/users': ['users.spec.ts'],
    'frontend/src/routes/profile': ['users.spec.ts'],
    
    // Components to test specs
    'frontend/src/components/auth': ['auth.spec.ts'],
    'frontend/src/components/common/Layout': ['navigation.spec.ts'],
    'frontend/src/components/common/Sidebar': ['navigation.spec.ts'],
    'frontend/src/components/course': ['courses.spec.ts'],
    'frontend/src/components/user': ['users.spec.ts'],
    
    // Backend routes to test specs
    'backend/src/routes/auth': ['auth.spec.ts'],
    'backend/src/routes/courses': ['courses.spec.ts'],
    'backend/src/routes/users': ['users.spec.ts'],
    
    // Services to test specs
    'backend/src/services/authService': ['auth.spec.ts'],
    'backend/src/services/courseService': ['courses.spec.ts'],
    'backend/src/services/userService': ['users.spec.ts'],
  };
  
  changedFiles.forEach(file => {
    // Check each mapping pattern
    Object.entries(testMappings).forEach(([pattern, tests]) => {
      if (file.includes(pattern)) {
        tests.forEach(test => affectedTests.add(test));
      }
    });
    
    // If E2E test file itself changed, run it
    if (file.startsWith('e2e/specs/') && file.endsWith('.spec.ts')) {
      affectedTests.add(path.basename(file));
    }
  });
  
  return Array.from(affectedTests);
}

// Run the affected tests
function runTests(testFiles) {
  if (testFiles.length === 0) {
    console.log('✅ No E2E tests affected by changes');
    return;
  }
  
  console.log(`🧪 Running ${testFiles.length} affected E2E test(s):`);
  testFiles.forEach(test => console.log(`   - ${test}`));
  
  const testPattern = testFiles.join('|');
  const command = `npx playwright test --grep "${testPattern}"`;
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log('✅ All affected E2E tests passed!');
  } catch (error) {
    console.error('❌ E2E tests failed!');
    process.exit(1);
  }
}

// Main execution
function main() {
  const changedFiles = getChangedFiles();
  
  if (changedFiles.length === 0) {
    console.log('✅ No changed files detected');
    return;
  }
  
  console.log(`📝 Found ${changedFiles.length} changed file(s)`);
  
  const affectedTests = getAffectedTests(changedFiles);
  runTests(affectedTests);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { getChangedFiles, getAffectedTests, runTests };
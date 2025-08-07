import { FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests');
  
  try {
    // Clean up test data if needed
    console.log('🗑️  Cleaning up test data...');
    
    // Note: Docker test environment is left running for faster subsequent test runs
    // Uncomment the following lines if you want to stop the environment after tests:
    // console.log('🐳 Stopping Docker test environment...');
    // await execAsync('docker compose -f docker-compose.test.yml down', { timeout: 30000 });
    // console.log('✅ Docker test environment stopped');
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;
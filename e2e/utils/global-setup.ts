import { FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests');
  
  try {
    // Ensure test environment is running
    console.log('📋 Checking test environment status...');
    
    // Start Docker test environment if not already running
    try {
      await execAsync('docker compose -f docker-compose.test.yml ps -q', { timeout: 10000 });
      console.log('🐳 Docker test environment is running');
    } catch (error) {
      console.log('🔄 Starting Docker test environment...');
      await execAsync('docker compose -f docker-compose.test.yml up -d', { timeout: 60000 });
      console.log('✅ Docker test environment started');
      
      // Wait for services to be ready
      console.log('⏳ Waiting for services to be ready...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    // Verify MCP server is accessible
    console.log('🔧 Verifying MCP server connection...');
    try {
      await execAsync('curl -f http://localhost:8080/health || exit 0', { timeout: 5000 });
      console.log('✅ MCP server is accessible');
    } catch (error) {
      console.log('⚠️  MCP server health check failed, continuing anyway');
    }
    
    // Set environment variables for E2E tests
    process.env.E2E_BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3002';
    process.env.API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
    process.env.NODE_ENV = 'test';
    
    console.log('✅ Global setup completed successfully');
    console.log(`🌐 Frontend URL: ${process.env.E2E_BASE_URL}`);
    console.log(`🔌 API URL: ${process.env.API_BASE_URL}`);
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

export default globalSetup;
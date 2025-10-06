#!/usr/bin/env node

/**
 * Port conflict detection script for Docker services
 * Checks if required ports are available before starting Docker containers
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Default ports used by the application
const DEFAULT_PORTS = {
  frontend: 3000,
  backend: 5000,
  postgres: 15432,
  redis: 6379,
  // Test environment ports
  frontend_test: 3002,
  backend_test: 3001,
  postgres_test: 15433,
  mcp_server: 3003
};

/**
 * Check if a port is in use
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} - True if port is in use
 */
function checkPort(port) {
  return new Promise((resolve) => {
    exec(`ss -tlnp | grep :${port}`, (error, stdout) => {
      resolve(!!stdout.trim());
    });
  });
}

/**
 * Get Docker containers using specific ports
 * @param {number} port - Port number to check
 * @returns {Promise<string>} - Container name using the port
 */
function getDockerContainerUsingPort(port) {
  return new Promise((resolve) => {
    exec(`docker ps --format "table {{.Names}}\\t{{.Ports}}" | grep ":${port}->"`, (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve(null);
      } else {
        const containerName = stdout.trim().split(/\s+/)[0];
        resolve(containerName);
      }
    });
  });
}

/**
 * Read environment variables from .env file
 * @returns {Object} - Environment variables
 */
function readEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        env[key.trim()] = value.trim();
      }
    });
  }
  
  return env;
}

/**
 * Get actual ports from environment or use defaults
 * @returns {Object} - Port configuration
 */
function getPortConfig() {
  const env = readEnvFile();
  
  return {
    frontend: parseInt(env.FRONTEND_PORT) || DEFAULT_PORTS.frontend,
    backend: parseInt(env.BACKEND_PORT) || DEFAULT_PORTS.backend,
    postgres: parseInt(env.POSTGRES_PORT) || DEFAULT_PORTS.postgres,
    redis: parseInt(env.REDIS_PORT) || DEFAULT_PORTS.redis,
    frontend_test: DEFAULT_PORTS.frontend_test,
    backend_test: DEFAULT_PORTS.backend_test,
    postgres_test: DEFAULT_PORTS.postgres_test,
    mcp_server: DEFAULT_PORTS.mcp_server
  };
}

/**
 * Main function to check port availability
 */
async function main() {
  const mode = process.argv[2] || 'development';
  const ports = getPortConfig();
  
  console.log(`🔍 Checking port availability for ${mode} mode...\n`);
  
  const portsToCheck = mode === 'test' 
    ? ['frontend_test', 'backend_test', 'postgres_test', 'mcp_server']
    : ['frontend', 'backend', 'postgres', 'redis'];
  
  let hasConflicts = false;
  
  for (const service of portsToCheck) {
    const port = ports[service];
    const inUse = await checkPort(port);
    
    if (inUse) {
      hasConflicts = true;
      const container = await getDockerContainerUsingPort(port);
      
      console.log(`❌ Port ${port} (${service}) is already in use`);
      if (container) {
        console.log(`   Used by Docker container: ${container}`);
        console.log(`   To free this port, run: docker stop ${container}`);
      }
    } else {
      console.log(`✅ Port ${port} (${service}) is available`);
    }
  }
  
  if (hasConflicts) {
    console.log('\n🚨 Port conflicts detected!');
    console.log('\nSuggested actions:');
    console.log('1. Stop conflicting containers: docker compose down');
    console.log('2. Stop test containers: npm run docker:test:down');
    console.log('3. Check all running containers: docker ps');
    console.log('4. Use different ports by creating a .env file');
    
    process.exit(1);
  } else {
    console.log('\n✅ All required ports are available!');
    process.exit(0);
  }
}

// Handle command line execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkPort, getPortConfig, getDockerContainerUsingPort };
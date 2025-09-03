#!/usr/bin/env node

/**
 * Docker cleanup utility script
 * Helps resolve port conflicts by stopping and cleaning up Docker containers
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Log with colors
 */
function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

/**
 * Execute shell command and return result
 */
async function execCommand(command, description) {
  try {
    log(`📋 ${description}...`, 'blue');
    const { stdout, stderr } = await execAsync(command);
    return { success: true, stdout, stderr };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get running Docker containers
 */
async function getRunningContainers() {
  const result = await execCommand('docker ps --format "{{.Names}}"', 'Getting running containers');
  if (result.success) {
    return result.stdout.trim().split('\n').filter(name => name);
  }
  return [];
}

/**
 * Get all LMS related containers
 */
async function getLMSContainers() {
  const result = await execCommand('docker ps -a --filter "name=lms-" --format "{{.Names}}"', 'Getting LMS containers');
  if (result.success) {
    return result.stdout.trim().split('\n').filter(name => name);
  }
  return [];
}

/**
 * Stop development containers
 */
async function stopDevelopmentContainers() {
  log('🛑 Stopping development containers...', 'yellow');
  const result = await execCommand('docker compose down', 'Stopping development environment');
  if (result.success) {
    log('✅ Development containers stopped', 'green');
  } else {
    log(`❌ Failed to stop development containers: ${result.error}`, 'red');
  }
  return result.success;
}

/**
 * Stop test containers
 */
async function stopTestContainers() {
  log('🛑 Stopping test containers...', 'yellow');
  const result = await execCommand('docker compose -f docker-compose.test.yml down', 'Stopping test environment');
  if (result.success) {
    log('✅ Test containers stopped', 'green');
  } else {
    log(`❌ Failed to stop test containers: ${result.error}`, 'red');
  }
  return result.success;
}

/**
 * Stop specific container
 */
async function stopContainer(containerName) {
  log(`🛑 Stopping container: ${containerName}`, 'yellow');
  const result = await execCommand(`docker stop ${containerName}`, `Stopping ${containerName}`);
  if (result.success) {
    log(`✅ Container ${containerName} stopped`, 'green');
  } else {
    log(`❌ Failed to stop container ${containerName}: ${result.error}`, 'red');
  }
  return result.success;
}

/**
 * Remove stopped containers
 */
async function removeStoppedContainers() {
  log('🗑️  Removing stopped containers...', 'yellow');
  const result = await execCommand('docker container prune -f', 'Removing stopped containers');
  if (result.success) {
    log('✅ Stopped containers removed', 'green');
  } else {
    log(`❌ Failed to remove stopped containers: ${result.error}`, 'red');
  }
  return result.success;
}

/**
 * Show container status
 */
async function showStatus() {
  log('📊 Current container status:', 'cyan');
  const result = await execCommand('docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"', 'Getting container status');
  if (result.success) {
    console.log(result.stdout);
  } else {
    log(`❌ Failed to get container status: ${result.error}`, 'red');
  }
}

/**
 * Main cleanup function
 */
async function main() {
  const action = process.argv[2] || 'help';
  
  log(`🐳 Docker Cleanup Utility`, 'cyan');
  log(`Action: ${action}\n`, 'blue');
  
  switch (action) {
    case 'status':
      await showStatus();
      break;
      
    case 'dev':
      await stopDevelopmentContainers();
      await showStatus();
      break;
      
    case 'test':
      await stopTestContainers();
      await showStatus();
      break;
      
    case 'all':
      await stopDevelopmentContainers();
      await stopTestContainers();
      await removeStoppedContainers();
      await showStatus();
      break;
      
    case 'container':
      const containerName = process.argv[3];
      if (!containerName) {
        log('❌ Please specify container name: node scripts/docker-cleanup.js container <name>', 'red');
        process.exit(1);
      }
      await stopContainer(containerName);
      await showStatus();
      break;
      
    case 'lms':
      const lmsContainers = await getLMSContainers();
      if (lmsContainers.length === 0) {
        log('✅ No LMS containers found', 'green');
      } else {
        log(`Found LMS containers: ${lmsContainers.join(', ')}`, 'yellow');
        for (const container of lmsContainers) {
          await stopContainer(container);
        }
      }
      await showStatus();
      break;
      
    case 'prune':
      await removeStoppedContainers();
      await showStatus();
      break;
      
    case 'help':
    default:
      log('🔧 Docker Cleanup Utility - Available commands:', 'cyan');
      console.log('');
      console.log('  status     - Show current container status');
      console.log('  dev        - Stop development containers');
      console.log('  test       - Stop test containers');  
      console.log('  all        - Stop all containers and cleanup');
      console.log('  lms        - Stop all LMS-related containers');
      console.log('  container <name> - Stop specific container');
      console.log('  prune      - Remove stopped containers');
      console.log('  help       - Show this help message');
      console.log('');
      log('Examples:', 'yellow');
      console.log('  node scripts/docker-cleanup.js dev');
      console.log('  node scripts/docker-cleanup.js test');
      console.log('  node scripts/docker-cleanup.js container lms-frontend');
      console.log('  node scripts/docker-cleanup.js all');
      break;
  }
}

// Handle command line execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { stopDevelopmentContainers, stopTestContainers, stopContainer, showStatus };
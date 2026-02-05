#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, text) {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

function getPackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    colorLog('red', `Error reading ${filePath}: ${error.message}`);
    return null;
  }
}

function getSystemInfo() {
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
    
    return {
      node: nodeVersion,
      npm: npmVersion,
      git: gitVersion,
      platform: process.platform,
      arch: process.arch
    };
  } catch (error) {
    colorLog('yellow', `Warning: Could not get system info: ${error.message}`);
    return {};
  }
}

function analyzeDependencies(packageJson, category = 'main') {
  if (!packageJson) return [];
  
  const deps = [];
  
  // Production dependencies
  if (packageJson.dependencies) {
    Object.entries(packageJson.dependencies).forEach(([name, version]) => {
      deps.push({
        name,
        version,
        type: 'production',
        category
      });
    });
  }
  
  // Development dependencies
  if (packageJson.devDependencies) {
    Object.entries(packageJson.devDependencies).forEach(([name, version]) => {
      deps.push({
        name,
        version,
        type: 'development',
        category
      });
    });
  }
  
  return deps.sort((a, b) => a.name.localeCompare(b.name));
}

function checkOutdated(dependencies) {
  const outdated = [];
  
  dependencies.forEach(dep => {
    // Skip certain packages that don't need version checks
    const skipPackages = ['letzpocket', 'cms'];
    if (skipPackages.includes(dep.name)) return;
    
    try {
      const latestVersion = execSync(`npm view ${dep.name} version`, { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      }).trim();
      
      const currentVersion = dep.version.replace(/^[\^~]/, '');
      
      if (currentVersion !== latestVersion) {
        outdated.push({
          ...dep,
          latest: latestVersion,
          current: currentVersion,
          needsUpdate: true
        });
      }
    } catch (error) {
      // Skip if package doesn't exist in npm registry
    }
  });
  
  return outdated;
}

function generateAuditReport() {
  colorLog('cyan', '\n🔍 LetzPocket Framework Audit Report');
  colorLog('cyan', '=' .repeat(50));
  
  const timestamp = new Date().toISOString();
  colorLog('blue', `\n📅 Generated: ${timestamp}`);
  
  // System Information
  colorLog('green', '\n🖥️  System Information:');
  const systemInfo = getSystemInfo();
  Object.entries(systemInfo).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  
  // Main App Dependencies
  colorLog('green', '\n📱 Main App Dependencies:');
  const mainPackage = getPackageJson('./package.json');
  const mainDeps = analyzeDependencies(mainPackage, 'main-app');
  
  console.log('\n   Production Dependencies:');
  mainDeps.filter(d => d.type === 'production').forEach(dep => {
    console.log(`   • ${dep.name}: ${dep.version}`);
  });
  
  console.log('\n   Development Dependencies:');
  mainDeps.filter(d => d.type === 'development').forEach(dep => {
    console.log(`   • ${dep.name}: ${dep.version}`);
  });
  
  // CMS Dependencies
  colorLog('green', '\n🔧 CMS Dependencies:');
  const cmsPackage = getPackageJson('./cms/package.json');
  const cmsDeps = analyzeDependencies(cmsPackage, 'cms');
  
  console.log('\n   Production Dependencies:');
  cmsDeps.filter(d => d.type === 'production').forEach(dep => {
    console.log(`   • ${dep.name}: ${dep.version}`);
  });
  
  console.log('\n   Development Dependencies:');
  cmsDeps.filter(d => d.type === 'development').forEach(dep => {
    console.log(`   • ${dep.name}: ${dep.version}`);
  });
  
  // Check for outdated packages (sample check for main dependencies)
  colorLog('yellow', '\n⚠️  Checking for outdated packages...');
  const allDeps = [...mainDeps, ...cmsDeps];
  
  // Check a few key packages for updates
  const keyPackages = ['react', 'react-dom', '@strapi/strapi', 'firebase', 'typescript'];
  const keyDeps = allDeps.filter(dep => keyPackages.includes(dep.name));
  
  const outdated = checkOutdated(keyDeps);
  
  if (outdated.length > 0) {
    colorLog('yellow', '\n📦 Updates Available:');
    outdated.forEach(dep => {
      console.log(`   • ${dep.name}: ${dep.current} → ${dep.latest}`);
    });
  } else {
    colorLog('green', '\n✅ Key packages are up to date');
  }
  
  // Generate JSON report
  const report = {
    timestamp,
    systemInfo,
    applications: {
      main: {
        packageJson: mainPackage,
        dependencies: mainDeps
      },
      cms: {
        packageJson: cmsPackage,
        dependencies: cmsDeps
      }
    },
    outdated: outdated
  };
  
  return report;
}

function saveDeploymentLog(report) {
  const logDir = './logs';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = `${logDir}/deployment-${timestamp}.json`;
  
  fs.writeFileSync(logFile, JSON.stringify(report, null, 2));
  colorLog('green', `\n💾 Deployment log saved: ${logFile}`);
  
  // Also save latest log
  const latestLog = `${logDir}/latest-deployment.json`;
  fs.writeFileSync(latestLog, JSON.stringify(report, null, 2));
  colorLog('green', `💾 Latest log saved: ${latestLog}`);
}

// Main execution
if (require.main === module) {
  try {
    const report = generateAuditReport();
    saveDeploymentLog(report);
    
    colorLog('cyan', '\n✅ Framework audit completed successfully!');
    
  } catch (error) {
    colorLog('red', `\n❌ Error during audit: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { generateAuditReport, saveDeploymentLog };

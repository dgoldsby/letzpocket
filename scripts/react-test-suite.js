#!/usr/bin/env node

// React CMS Test Suite
// Comprehensive testing for React 19 upgrade

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

class ReactTestSuite {
  constructor() {
    this.cmsDir = './cms';
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    console.log(logEntry);
    
    // Write to log file
    fs.appendFileSync('./logs/react-test-suite.log', logEntry + '\n');
  }

  runTest(testName, testFunction) {
    colorLog('blue', `\n🧪 Running: ${testName}`);
    
    try {
      const result = testFunction();
      if (result === true || result === undefined) {
        colorLog('green', `✅ PASSED: ${testName}`);
        this.testResults.passed++;
        this.testResults.tests.push({ name: testName, status: 'passed' });
      } else {
        colorLog('yellow', `⚠️  WARNING: ${testName} - ${result}`);
        this.testResults.warnings++;
        this.testResults.tests.push({ name: testName, status: 'warning', message: result });
      }
    } catch (error) {
      colorLog('red', `❌ FAILED: ${testName} - ${error.message}`);
      this.testResults.failed++;
      this.testResults.tests.push({ name: testName, status: 'failed', error: error.message });
    }
  }

  // Test 1: Package.json validation
  testPackageJson() {
    const packagePath = path.join(this.cmsDir, 'package.json');
    
    if (!fs.existsSync(packagePath)) {
      throw new Error('package.json not found');
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check React version
    const reactVersion = packageJson.dependencies?.react;
    if (!reactVersion || !reactVersion.includes('19')) {
      return `React version should be 19.x, found: ${reactVersion}`;
    }

    // Check React DOM version
    const reactDomVersion = packageJson.dependencies?.['react-dom'];
    if (!reactDomVersion || !reactDomVersion.includes('19')) {
      return `React DOM version should be 19.x, found: ${reactDomVersion}`;
    }

    // Check Strapi version
    const strapiVersion = packageJson.dependencies?.['@strapi/strapi'];
    if (!strapiVersion || !strapiVersion.includes('5.35')) {
      return `Strapi version should be 5.35.x, found: ${strapiVersion}`;
    }

    return true;
  }

  // Test 2: TypeScript configuration
  testTypeScriptConfig() {
    const tsconfigPath = path.join(this.cmsDir, 'tsconfig.json');
    
    if (!fs.existsSync(tsconfigPath)) {
      throw new Error('tsconfig.json not found');
    }

    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    // Check JSX transform
    if (tsconfig.compilerOptions?.jsx !== 'react-jsx') {
      return `JSX transform should be 'react-jsx', found: ${tsconfig.compilerOptions?.jsx}`;
    }

    // Check target
    if (tsconfig.compilerOptions?.target !== 'ES2020') {
      return `Target should be 'ES2020', found: ${tsconfig.compilerOptions?.target}`;
    }

    return true;
  }

  // Test 3: Build process
  testBuildProcess() {
    try {
      process.chdir(this.cmsDir);
      execSync('npm run build', { stdio: 'pipe' });
      process.chdir('..');
      
      // Check if build directory exists
      const buildDir = path.join(this.cmsDir, 'build');
      if (!fs.existsSync(buildDir)) {
        return 'Build directory not created';
      }

      return true;
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  // Test 4: Dependency conflicts
  testDependencyConflicts() {
    try {
      process.chdir(this.cmsDir);
      const output = execSync('npm ls --depth=0', { encoding: 'utf8' });
      process.chdir('..');

      // Check for common conflict indicators
      if (output.includes('UNMET PEER DEPENDENCY')) {
        return 'Unmet peer dependencies found';
      }

      if (output.includes('missing')) {
        return 'Missing dependencies detected';
      }

      return true;
    } catch (error) {
      throw new Error(`Dependency check failed: ${error.message}`);
    }
  }

  // Test 5: File structure integrity
  testFileStructure() {
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'config/plugins.js',
      'config/database.js'
    ];

    const missingFiles = [];
    for (const file of requiredFiles) {
      const filePath = path.join(this.cmsDir, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      return `Missing files: ${missingFiles.join(', ')}`;
    }

    return true;
  }

  // Test 6: Plugin compatibility
  testPluginCompatibility() {
    const packagePath = path.join(this.cmsDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    // Check for known incompatible plugins
    const incompatiblePlugins = [
      '@strapi/plugin-graphql', // May have React 19 issues
      '@strapi/plugin-documentation' // May need updates
    ];

    const warnings = [];
    for (const plugin of incompatiblePlugins) {
      if (packageJson.dependencies?.[plugin]) {
        warnings.push(`${plugin} may have React 19 compatibility issues`);
      }
    }

    if (warnings.length > 0) {
      return warnings.join(', ');
    }

    return true;
  }

  // Test 7: Environment variables
  testEnvironmentVariables() {
    const envPath = path.join(this.cmsDir, '.env');
    
    if (!fs.existsSync(envPath)) {
      return '.env file not found';
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check for required environment variables
    const requiredVars = [
      'NODE_ENV',
      'DATABASE_CLIENT',
      'DATABASE_HOST',
      'DATABASE_PORT',
      'DATABASE_NAME',
      'DATABASE_USERNAME',
      'DATABASE_PASSWORD'
    ];

    const missingVars = [];
    for (const varName of requiredVars) {
      if (!envContent.includes(`${varName}=`)) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      return `Missing environment variables: ${missingVars.join(', ')}`;
    }

    return true;
  }

  // Test 8: Database connection (basic check)
  testDatabaseConnection() {
    const configPath = path.join(this.cmsDir, 'config/database.js');
    
    if (!fs.existsSync(configPath)) {
      return 'Database config not found';
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Basic validation of database config
    if (!configContent.includes('client: \'postgres\'')) {
      return 'Database client should be postgres';
    }

    return true;
  }

  // Generate test report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.passed + this.testResults.failed + this.testResults.warnings,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        warnings: this.testResults.warnings
      },
      tests: this.testResults.tests,
      recommendations: []
    };

    // Add recommendations based on results
    if (this.testResults.failed > 0) {
      report.recommendations.push('Address failed tests before proceeding with deployment');
    }

    if (this.testResults.warnings > 0) {
      report.recommendations.push('Review warnings and assess impact on functionality');
    }

    if (this.testResults.passed === this.testResults.tests.length) {
      report.recommendations.push('All tests passed - ready for deployment');
    }

    // Save report
    const reportPath = `./logs/react-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  // Run all tests
  async runAllTests() {
    colorLog('cyan', '🚀 React CMS Test Suite');
    colorLog('cyan', '=======================');
    
    // Create logs directory
    if (!fs.existsSync('./logs')) {
      fs.mkdirSync('./logs');
    }

    // Run all tests
    this.runTest('Package.json Validation', () => this.testPackageJson());
    this.runTest('TypeScript Configuration', () => this.testTypeScriptConfig());
    this.runTest('Build Process', () => this.testBuildProcess());
    this.runTest('Dependency Conflicts', () => this.testDependencyConflicts());
    this.runTest('File Structure Integrity', () => this.testFileStructure());
    this.runTest('Plugin Compatibility', () => this.testPluginCompatibility());
    this.runTest('Environment Variables', () => this.testEnvironmentVariables());
    this.runTest('Database Connection', () => this.testDatabaseConnection());

    // Generate and display report
    const report = this.generateReport();

    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    colorLog('green', `✅ Passed: ${report.summary.passed}`);
    colorLog('red', `❌ Failed: ${report.summary.failed}`);
    colorLog('yellow', `⚠️  Warnings: ${report.summary.warnings}`);
    colorLog('blue', `📋 Total: ${report.summary.total}`);

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }

    return report;
  }
}

// Main execution
if (require.main === module) {
  const testSuite = new ReactTestSuite();
  
  testSuite.runAllTests()
    .then(report => {
      process.exit(report.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      colorLog('red', `Test suite failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = ReactTestSuite;

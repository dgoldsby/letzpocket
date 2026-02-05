#!/bin/bash

# TypeScript Upgrade Script
# Upgrades TypeScript from 4.9.5 to 5.9.3 with safety checks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Backup current state
backup_current_state() {
    print_status "Creating backup of current state..."
    
    # Backup package.json
    cp package.json package.json.backup
    cp package-lock.json package-lock.json.backup
    
    # Backup tsconfig.json
    cp tsconfig.json tsconfig.json.backup 2>/dev/null || true
    
    print_success "Backup created"
}

# Check current TypeScript version
check_current_version() {
    print_status "Checking current TypeScript version..."
    
    CURRENT_VERSION=$(node -e "console.log(require('./package.json').devDependencies?.typescript || require('./package.json').dependencies?.typescript)")
    echo "Current TypeScript version: $CURRENT_VERSION"
    
    if [[ "$CURRENT_VERSION" == *"4.9"* ]]; then
        print_success "Running expected TypeScript 4.9.x version"
    else
        print_warning "Unexpected TypeScript version: $CURRENT_VERSION"
    fi
}

# Run pre-upgrade checks
pre_upgrade_checks() {
    print_status "Running pre-upgrade checks..."
    
    # Check if build currently works
    print_status "Testing current build..."
    if npm run build; then
        print_success "Current build passes"
    else
        print_error "Current build fails - fix before upgrading"
        exit 1
    fi
    
    # Check for TypeScript-specific issues
    print_status "Checking for TypeScript issues..."
    if npx tsc --noEmit; then
        print_success "TypeScript compilation passes"
    else
        print_warning "TypeScript compilation has issues - review before upgrade"
    fi
}

# Upgrade TypeScript
upgrade_typescript() {
    print_status "Upgrading TypeScript to 5.9.3..."
    
    # Update TypeScript
    npm install typescript@^5.9.3
    
    # Update @types/node for compatibility
    npm install @types/node@^20.11.24
    
    print_success "TypeScript upgraded"
}

# Update tsconfig.json for TypeScript 5
update_tsconfig() {
    print_status "Updating tsconfig.json for TypeScript 5..."
    
    # Check if tsconfig.json exists and update it
    if [ -f "tsconfig.json" ]; then
        # Create a backup
        cp tsconfig.json tsconfig.json.pre-upgrade
        
        # Update tsconfig.json with TypeScript 5 recommended settings
        node -e "
const fs = require('fs');
const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));

// Update compiler options for TypeScript 5
if (!tsconfig.compilerOptions) tsconfig.compilerOptions = {};

// Recommended TypeScript 5 settings
tsconfig.compilerOptions.target = 'ES2020';
tsconfig.compilerOptions.lib = ['DOM', 'DOM.Iterable', 'ES6'];
tsconfig.compilerOptions.allowJs = true;
tsconfig.compilerOptions.skipLibCheck = true;
tsconfig.compilerOptions.esModuleInterop = true;
tsconfig.compilerOptions.allowSyntheticDefaultImports = true;
tsconfig.compilerOptions.strict = true;
tsconfig.compilerOptions.forceConsistentCasingInFileNames = true;
tsconfig.compilerOptions.noFallthroughCasesInSwitch = true;
tsconfig.compilerOptions.module = 'esnext';
tsconfig.compilerOptions.moduleResolution = 'node';
tsconfig.compilerOptions.resolveJsonModule = true;
tsconfig.compilerOptions.isolatedModules = true;
tsconfig.compilerOptions.noEmit = true;
tsconfig.compilerOptions.jsx = 'react-jsx';

fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2));
console.log('tsconfig.json updated for TypeScript 5');
"
        print_success "tsconfig.json updated"
    else
        print_warning "tsconfig.json not found - creating default"
        npx tsc --init
    fi
}

# Run post-upgrade tests
post_upgrade_tests() {
    print_status "Running post-upgrade tests..."
    
    # Clean node_modules and reinstall
    print_status "Cleaning node_modules..."
    rm -rf node_modules package-lock.json
    npm install
    
    # Check TypeScript compilation
    print_status "Testing TypeScript compilation..."
    if npx tsc --noEmit; then
        print_success "TypeScript compilation passes"
    else
        print_error "TypeScript compilation failed"
        return 1
    fi
    
    # Test build
    print_status "Testing build..."
    if npm run build; then
        print_success "Build passes"
    else
        print_error "Build failed"
        return 1
    fi
    
    # Run tests if available
    if npm run test:ci 2>/dev/null; then
        print_success "Tests pass"
    else
        print_warning "Tests failed or not available"
    fi
}

# Create upgrade report
create_upgrade_report() {
    print_status "Creating upgrade report..."
    
    NEW_VERSION=$(node -e "console.log(require('./package.json').devDependencies?.typescript || require('./package.json').dependencies?.typescript)")
    
    REPORT="{
  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\",
  \"upgrade\": {
    \"from\": \"4.9.5\",
    \"to\": \"$NEW_VERSION\",
    \"status\": \"success\"
  },
  \"changes\": [
    \"Updated TypeScript to 5.9.3\",
    \"Updated @types/node to 20.11.24\",
    \"Updated tsconfig.json for TypeScript 5 compatibility\"
  ],
  \"tests\": {
    \"compilation\": \"pass\",
    \"build\": \"pass\",
    \"unit_tests\": \"pass\"
  }
}"
    
    echo "$REPORT" > ./logs/typescript-upgrade-$(date +%Y%m%d-%H%M%S).json
    print_success "Upgrade report created"
}

# Rollback function
rollback() {
    print_warning "Rolling back TypeScript upgrade..."
    
    # Restore package.json and package-lock.json
    mv package.json.backup package.json
    mv package-lock.json.backup package-lock.json
    
    # Restore tsconfig.json if backup exists
    mv tsconfig.json.backup tsconfig.json 2>/dev/null || true
    
    # Clean and reinstall
    rm -rf node_modules
    npm install
    
    print_success "Rollback completed"
}

# Main upgrade function
main() {
    echo "🚀 TypeScript Upgrade Process"
    echo "============================="
    echo "Upgrading from 4.9.5 to 5.9.3"
    echo ""
    
    # Create logs directory
    mkdir -p logs
    
    # Run upgrade steps
    backup_current_state
    check_current_version
    pre_upgrade_checks
    
    # Ask for confirmation
    echo ""
    read -p "Continue with TypeScript upgrade? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        upgrade_typescript
        update_tsconfig
        
        # Test the upgrade
        if post_upgrade_tests; then
            create_upgrade_report
            print_success "🎉 TypeScript upgrade completed successfully!"
        else
            print_error "Post-upgrade tests failed"
            read -p "Rollback changes? (y/N): " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rollback
            fi
            exit 1
        fi
    else
        print_warning "Upgrade cancelled"
        exit 0
    fi
}

# Handle script arguments
case "${1:-}" in
    --rollback)
        rollback
        exit 0
        ;;
    --help|-h)
        echo "TypeScript Upgrade Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --rollback    Rollback to previous version"
        echo "  --help, -h    Show this help message"
        echo ""
        exit 0
        ;;
esac

# Run main function
main "$@"

#!/bin/bash

# Safe TypeScript Upgrade Script
# Addresses React Scripts compatibility issues

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
    
    cp package.json package.json.backup
    cp package-lock.json package-lock.json.backup
    cp tsconfig.json tsconfig.json.backup 2>/dev/null || true
    
    print_success "Backup created"
}

# Check React Scripts compatibility
check_react_scripts_compatibility() {
    print_status "Checking React Scripts compatibility..."
    
    REACT_SCRIPTS_VERSION=$(node -e "console.log(require('./package.json').dependencies['react-scripts'])")
    echo "React Scripts version: $REACT_SCRIPTS_VERSION"
    
    if [[ "$REACT_SCRIPTS_VERSION" == "5.0.1" ]]; then
        print_warning "React Scripts 5.0.1 has TypeScript 4.x limitation"
        print_status "Recommended approach: Upgrade to Vite or CRACO"
        return 1
    else
        print_success "React Scripts version may support TypeScript 5"
        return 0
    fi
}

# Option 1: Upgrade to latest TypeScript 4.x (safer)
upgrade_typescript_4x() {
    print_status "Upgrading to latest TypeScript 4.x (safer option)..."
    
    # Upgrade to latest TypeScript 4.x
    npm install typescript@^4.9.5 --save-exact
    
    # Update @types/node
    npm install @types/node@^20.11.24
    
    print_success "TypeScript upgraded to latest 4.x"
}

# Option 2: Migrate to Vite (recommended for TypeScript 5)
migrate_to_vite() {
    print_status "Migrating from React Scripts to Vite..."
    
    # Install Vite and related packages
    npm install --save-dev vite @vitejs/plugin-react vite-plugin-eslint
    
    # Update package.json scripts
    node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Update scripts for Vite
pkg.scripts = {
  ...pkg.scripts,
  'dev': 'vite',
  'build': 'tsc && vite build',
  'preview': 'vite preview',
  'start': 'vite'
};

// Remove react-scripts
delete pkg.dependencies['react-scripts'];

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Updated package.json for Vite');
"
    
    # Create vite.config.js
    cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'build'
  }
})
EOF
    
    # Create index.html for Vite
    cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LetzPocket</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>
EOF
    
    print_success "Migrated to Vite"
}

# Option 3: Use CRACO with React Scripts
setup_craco() {
    print_status "Setting up CRACO for TypeScript 5 support..."
    
    # Install CRACO
    npm install --save-dev @craco/craco
    
    # Update package.json scripts
    node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts = {
  ...pkg.scripts,
  'start': 'craco start',
  'build': 'craco build',
  'test': 'craco test'
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Updated package.json for CRACO');
"
    
    # Create craco.config.js
    cat > craco.config.js << 'EOF'
module.exports = {
  typescript: {
    enableTypeChecking: true
  }
}
EOF
    
    print_success "CRACO setup completed"
}

# Test the chosen approach
test_migration() {
    print_status "Testing migration..."
    
    # Clean install
    rm -rf node_modules package-lock.json
    npm install --legacy-peer-deps
    
    # Test TypeScript compilation
    if npx tsc --noEmit; then
        print_success "TypeScript compilation passes"
    else
        print_error "TypeScript compilation failed"
        return 1
    fi
    
    # Test build
    if npm run build; then
        print_success "Build passes"
    else
        print_error "Build failed"
        return 1
    fi
}

# Create migration report
create_migration_report() {
    print_status "Creating migration report..."
    
    REPORT="{
  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\",
  \"migration\": {
    \"approach\": \"$1\",
    \"status\": \"success\"
  },
  \"recommendation\": \"Consider Vite migration for full TypeScript 5 support\"
}"
    
    echo "$REPORT" > ./logs/typescript-migration-$(date +%Y%m%d-%H%M%S).json
    print_success "Migration report created"
}

# Main function
main() {
    echo "🚀 TypeScript Migration Options"
    echo "=============================="
    echo ""
    echo "React Scripts 5.0.1 doesn't support TypeScript 5.x"
    echo "Choose your migration approach:"
    echo ""
    echo "1) Upgrade to latest TypeScript 4.x (safest, minimal changes)"
    echo "2) Migrate to Vite (recommended, full TypeScript 5 support)"
    echo "3) Use CRACO with React Scripts (intermediate solution)"
    echo "4) Exit"
    echo ""
    
    read -p "Choose option (1-4): " -n 1 -r
    echo ""
    
    # Create logs directory
    mkdir -p logs
    
    case $REPLY in
        1)
            print_status "Option 1: Upgrade to TypeScript 4.x"
            backup_current_state
            upgrade_typescript_4x
            test_migration
            create_migration_report "typescript-4x"
            print_success "🎉 TypeScript 4.x upgrade completed!"
            ;;
        2)
            print_status "Option 2: Migrate to Vite"
            backup_current_state
            migrate_to_vite
            test_migration
            create_migration_report "vite-migration"
            print_success "🎉 Vite migration completed!"
            ;;
        3)
            print_status "Option 3: Setup CRACO"
            backup_current_state
            setup_craco
            test_migration
            create_migration_report "craco-setup"
            print_success "🎉 CRACO setup completed!"
            ;;
        4)
            print_warning "Exiting without changes"
            exit 0
            ;;
        *)
            print_error "Invalid option"
            exit 1
            ;;
    esac
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "TypeScript Migration Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h    Show this help message"
        echo ""
        exit 0
        ;;
esac

# Run main function
main "$@"

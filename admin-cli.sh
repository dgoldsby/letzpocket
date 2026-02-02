#!/bin/bash

# Admin Access CLI Script for LetzPocket
# Usage: ./admin-cli.sh [grant|remove|list] [email]

FUNCTION_URL="https://us-central1-letzpocket-site.cloudfunctions.net"

show_help() {
    echo "LetzPocket Admin Access CLI"
    echo ""
    echo "Usage: $0 [command] [email]"
    echo ""
    echo "Commands:"
    echo "  grant [email]    Grant admin access to user"
    echo "  remove [email]   Remove admin access from user"
    echo "  list            List all users with their roles"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 grant user@example.com"
    echo "  $0 remove user@example.com"
    echo "  $0 list"
}

grant_admin() {
    local email="$1"
    if [[ -z "$email" ]]; then
        echo "Error: Email address required"
        echo "Usage: $0 grant [email]"
        exit 1
    fi

    echo "Granting admin access to: $email"
    response=$(curl -s -X GET "$FUNCTION_URL/grantAdminAccess?email=$email")
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ Success: $(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)"
        echo "New roles: $(echo "$response" | grep -o '"newRoles":\[[^]]*\]' | sed 's/"newRoles"://; s/[][]//g; s/,/, /g')"
    else
        echo "❌ Error: $(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
        exit 1
    fi
}

remove_admin() {
    local email="$1"
    if [[ -z "$email" ]]; then
        echo "Error: Email address required"
        echo "Usage: $0 remove [email]"
        exit 1
    fi

    echo "Removing admin access from: $email"
    response=$(curl -s -X GET "$FUNCTION_URL/removeAdminAccess?email=$email")
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ Success: $(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)"
        echo "New roles: $(echo "$response" | grep -o '"newRoles":\[[^]]*\]' | sed 's/"newRoles"://; s/[][]//g; s/,/, /g')"
    else
        echo "❌ Error: $(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
        exit 1
    fi
}

list_users() {
    echo "Listing all users..."
    response=$(curl -s -X GET "$FUNCTION_URL/listUsers")
    
    if echo "$response" | grep -q '"success":true'; then
        echo "📋 Users ($(echo "$response" | grep -o '"count":[0-9]*' | cut -d':' -f2) total):"
        echo ""
        
        # Extract and format user information
        echo "$response" | grep -o '"email":"[^"]*","roles":\[[^]]*\],"activeRole":"[^"]*"' | while IFS= read -r line; do
            email=$(echo "$line" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
            roles=$(echo "$line" | grep -o '"roles":\[[^]]*\]' | sed 's/"roles":\[//; s/\]//; s/,/, /g')
            active_role=$(echo "$line" | grep -o '"activeRole":"[^"]*"' | cut -d'"' -f4)
            
            # Add visual indicators for roles
            role_indicators=""
            if [[ "$roles" == *"ADMINISTRATOR"* ]]; then
                role_indicators="🔐 "
            fi
            if [[ "$roles" == *"LANDLORD"* ]]; then
                role_indicators="${role_indicators}🏠 "
            fi
            if [[ "$roles" == *"TENANT"* ]]; then
                role_indicators="${role_indicators}👤 "
            fi
            if [[ "$roles" == *"OPERATOR"* ]]; then
                role_indicators="${role_indicators}⚙️ "
            fi
            
            echo "  $role_indicators$email"
            echo "    Roles: $roles"
            echo "    Active: $active_role"
            echo ""
        done
    else
        echo "❌ Error: $(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
        exit 1
    fi
}

# Main script logic
case "$1" in
    grant)
        grant_admin "$2"
        ;;
    remove)
        remove_admin "$2"
        ;;
    list)
        list_users
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Error: Unknown command '$1'"
        echo ""
        show_help
        exit 1
        ;;
esac

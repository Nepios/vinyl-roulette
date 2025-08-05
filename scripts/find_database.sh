#!/bin/bash

# VinylRoulette Database Finder Script
# This script helps locate and open your React Native SQLite database

DEVICE_ID="C656308C-84DC-4485-BDCB-E5F02FA80206"
SIMULATOR_PATH="$HOME/Library/Developer/CoreSimulator/Devices/$DEVICE_ID"

echo "🔍 Searching for VinylRoulette database..."
echo "Simulator Device: iPhone SE (3rd generation)"
echo "Device ID: $DEVICE_ID"
echo ""

# Search for vinyl.db in all possible locations
echo "Checking Data Application containers..."
DB_PATHS=(
    "$SIMULATOR_PATH/data/Containers/Data/Application/*/Documents/vinyl.db"
    "$SIMULATOR_PATH/data/Containers/Data/Application/*/Library/vinyl.db"
    "$SIMULATOR_PATH/data/Containers/Data/Application/*/Library/LocalDatabase/vinyl.db"
    "$SIMULATOR_PATH/data/Containers/Data/Application/*/Library/Caches/vinyl.db"
    "$SIMULATOR_PATH/data/Containers/Data/Application/*/tmp/vinyl.db"
)

FOUND_DB=""
for pattern in "${DB_PATHS[@]}"; do
    for file in $pattern; do
        if [ -f "$file" ]; then
            echo "✅ Found database: $file"
            FOUND_DB="$file"
            break 2
        fi
    done
done

if [ -z "$FOUND_DB" ]; then
    echo "❌ Database not found. The database might not be created yet."
    echo ""
    echo "💡 To create the database:"
    echo "1. Run your VinylRoulette app in the iOS Simulator"
    echo "2. Trigger any database operation (like fetching records)"
    echo "3. Run this script again"
    echo ""
    echo "📱 Expected locations (will be created when app runs):"
    for pattern in "${DB_PATHS[@]}"; do
        # Remove the vinyl.db filename to show directory
        dir_pattern=$(dirname "$pattern")
        echo "   $dir_pattern/"
    done
else
    echo ""
    echo "🎉 Database found!"
    echo "Location: $FOUND_DB"
    echo ""
    echo "📊 Database info:"
    ls -la "$FOUND_DB"
    echo ""
    
    # Check if we can read the database
    if command -v sqlite3 &> /dev/null; then
        echo "🗄️  Database tables:"
        sqlite3 "$FOUND_DB" ".tables"
        echo ""
        echo "📝 To inspect the database:"
        echo "sqlite3 '$FOUND_DB'"
        echo ""
        echo "🔗 To open with a GUI tool:"
        echo "open '$FOUND_DB'"
        
        # Try to open with default app
        read -p "Would you like to open the database now? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "$FOUND_DB"
        fi
    else
        echo "💡 Install sqlite3 to inspect the database from command line"
        echo "Or open with: open '$FOUND_DB'"
    fi
fi

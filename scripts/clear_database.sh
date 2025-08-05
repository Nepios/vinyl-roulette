#!/bin/bash

# VinylRoulette Database Clear Script
# This script clears all data from the SQLite database

DEVICE_ID="C656308C-84DC-4485-BDCB-E5F02FA80206"
SIMULATOR_PATH="$HOME/Library/Developer/CoreSimulator/Devices/$DEVICE_ID"

echo "🗑️  VinylRoulette Database Clear"
echo "Simulator Device: iPhone SE (3rd generation)"
echo "Device ID: $DEVICE_ID"
echo ""

# Search for vinyl.db in all possible locations
echo "🔍 Searching for database files..."
DB_PATHS=(
    "$SIMULATOR_PATH/data/Containers/Data/Application/*/Documents/vinyl.db"
    "$SIMULATOR_PATH/data/Containers/Data/Application/*/Library/vinyl.db"
    "$SIMULATOR_PATH/data/Containers/Data/Application/*/Library/LocalDatabase/vinyl.db"
    "$SIMULATOR_PATH/data/Containers/Data/Application/*/Library/Caches/vinyl.db"
    "$SIMULATOR_PATH/data/Containers/Data/Application/*/Library/NoCloud/vinyl.db"
    "$SIMULATOR_PATH/data/Containers/Data/Application/*/tmp/vinyl.db"
)

FOUND_DBS=()
for pattern in "${DB_PATHS[@]}"; do
    for file in $pattern; do
        if [ -f "$file" ]; then
            FOUND_DBS+=("$file")
            echo "📍 Found database: $file"
        fi
    done
done

if [ ${#FOUND_DBS[@]} -eq 0 ]; then
    echo "❌ No database files found."
    echo ""
    echo "💡 The database might not be created yet or the app hasn't been run."
    echo "   Run your VinylRoulette app first to create the database."
    exit 0
fi

echo ""
echo "Found ${#FOUND_DBS[@]} database file(s)."
echo ""

# Ask for confirmation
read -p "⚠️  Are you sure you want to delete ALL database files? This cannot be undone! (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operation cancelled."
    exit 0
fi

echo ""
echo "🗑️  Deleting database files..."

# Delete all found database files
DELETED_COUNT=0
for db_file in "${FOUND_DBS[@]}"; do
    if rm -f "$db_file"; then
        echo "✅ Deleted: $db_file"
        ((DELETED_COUNT++))
    else
        echo "❌ Failed to delete: $db_file"
    fi
done

echo ""
echo "🎉 Database clear complete!"
echo "   Deleted $DELETED_COUNT database file(s)."
echo ""
echo "💡 Next steps:"
echo "   1. Restart your VinylRoulette app"
echo "   2. The database will be recreated automatically with empty tables"
echo "   3. All your previous data is now cleared"
echo ""

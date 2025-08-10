#!/bin/bash

# VinylRoulette Progress Summarization Script
# Usage: ./scripts/summarize-progress.sh

# Get current date in YYYY-MM-DD format
DATE=$(date +%Y-%m-%d)
PROGRESS_DIR="progressLogs"
FILENAME="${PROGRESS_DIR}/${DATE}-changes.txt"

# Ensure progressLogs directory exists
mkdir -p "$PROGRESS_DIR"

# Check if file already exists
if [ -f "$FILENAME" ]; then
    echo "Progress file for today already exists: $FILENAME"
    echo "Would you like to overwrite it? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
fi

echo "Creating progress summary for $DATE..."
echo "Please ask Claude to summarize the implementations from the current context window."
echo "The summary should be saved to: $FILENAME"
echo ""
echo "Suggested prompt:"
echo "\"Please summarize all the implementations you have made in the current context window and save them to $FILENAME following the established format and naming convention.\""
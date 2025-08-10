#!/bin/bash

# Enhanced VinylRoulette Progress Summarization Script
# This script provides a structured prompt for Claude to summarize progress

# Get current date in YYYY-MM-DD format
DATE=$(date +%Y-%m-%d)
PROGRESS_DIR="progressLogs"
FILENAME="${PROGRESS_DIR}/${DATE}-changes.txt"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🤖 VinylRoulette Progress Summarization Helper${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""
echo -e "${YELLOW}Date:${NC} $DATE"
echo -e "${YELLOW}Target file:${NC} $FILENAME"
echo ""

# Ensure progressLogs directory exists
mkdir -p "$PROGRESS_DIR"

# Check if file already exists
if [ -f "$FILENAME" ]; then
    echo -e "${YELLOW}⚠️  Progress file for today already exists!${NC}"
    echo "Would you like to continue anyway? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    echo ""
fi

echo -e "${GREEN}📋 Copy and paste this prompt to Claude:${NC}"
echo ""
echo "----------------------------------------"
echo "Please summarize all the implementations you have made in the current context window and save them to $FILENAME following the established format and naming convention. Include:"
echo ""
echo "1. Overview of the session"
echo "2. Major features implemented"
echo "3. Files created/modified with details"
echo "4. Technical architecture decisions"
echo "5. Key metrics (files, tests, components, etc.)"
echo "6. Error resolution details"
echo "7. Future considerations"
echo ""
echo "Use the same comprehensive format as the previous progress logs."
echo "----------------------------------------"
echo ""
echo -e "${BLUE}💡 Tip: After Claude creates the summary, you can verify it exists with:${NC}"
echo "   ls -la $FILENAME"
echo ""
echo -e "${GREEN}✨ Happy coding!${NC}"
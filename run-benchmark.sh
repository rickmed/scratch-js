#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}JavaScript Object Operations Benchmark${NC}"
echo "====================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Please install Node.js to run this benchmark.${NC}"
    exit 1
fi

# Check if TypeScript is installed
if [ ! -d "node_modules/typescript" ]; then
    echo -e "${YELLOW}TypeScript not found. Installing dependencies...${NC}"
    npm install
fi

# Compile TypeScript
echo "Compiling TypeScript..."
npx tsc benchmark.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Compilation successful!${NC}"
    echo ""
    echo "Running benchmark..."
    echo ""
    node benchmark.js
else
    echo -e "${YELLOW}Compilation failed. Please check for errors.${NC}"
    exit 1
fi
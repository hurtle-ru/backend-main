#!/bin/bash

# Check if two arguments are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <file1> <file2>"
    exit 1
fi

# Assign arguments to variables
FILE1=$1
FILE2=$2

# Get current date in format DD.MM.YYYY
CURRENT_DATE=$(date +%d.%m.%Y)

# Run oasdiff with the provided files and output to a dated HTML file
oasdiff changelog "$FILE1" "$FILE2" --include-path-params --lang ru -f html > "${CURRENT_DATE}.html"

# Output confirmation message
echo "Created file: ${CURRENT_DATE}.html"

#!/bin/bash
# File: /src/OpenDevin/analytics/run_analytics.sh

# Shell script to run analytics on a specified directory

# Strict mode
set -euo pipefail
IFS=$'\n\t'

# Set the project root environment variable if not already set
PROJECT_ROOT=${PROJECT_ROOT:-/src/OpenDevin}

# Run the Python script for analytics
python "${PROJECT_ROOT}/analytics/scripts/generate_analytics.py" "${PROJECT_ROOT}/opendevin" \
  "${PROJECT_ROOT}/analytics/results/line_counts.txt" \
  "${PROJECT_ROOT}/analytics/results/file_sizes.txt"

echo "Analytics generation complete. Line counts and file sizes saved in ${PROJECT_ROOT}/analytics/results/."

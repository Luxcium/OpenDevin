#!/bin/bash

# Shell script to set up necessary directories for analytics
# Arguments: BASE_PATH - The base path of the project

BASE_PATH=$1

# Create necessary directories
mkdir -p ${BASE_PATH}/analytics/data
mkdir -p ${BASE_PATH}/analytics/scripts
mkdir -p ${BASE_PATH}/analytics/results

echo "Directories setup complete."

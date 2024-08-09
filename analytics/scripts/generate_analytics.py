#!/usr/bin/env python
# File: /src/OpenDevin/analytics/scripts/generate_analytics.py

"""
Python script to generate line counts and file sizes recursively in a specified directory.
Arguments:
1. target_dir: The target directory to analyze
2. line_count_file: The output file for line counts
3. file_size_file: The output file for file sizes
"""

import os
import sys
import subprocess

def get_line_counts(target_dir, output_file):
    with open(output_file, 'w') as f:
        subprocess.run(['find', target_dir, '-type', 'f', '-exec', 'wc', '-l', '{}', '+'], stdout=f, check=True)

def get_file_sizes(target_dir, output_file):
    with open(output_file, 'w') as f:
        subprocess.run(['du', '-ah', target_dir], stdout=f, check=True)

def main(target_dir, line_count_file, file_size_file):
    get_line_counts(target_dir, line_count_file)
    get_file_sizes(target_dir, file_size_file)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: generate_analytics.py <target_dir> <line_count_file> <file_size_file>")
        sys.exit(1)

    target_dir = sys.argv[1]
    line_count_file = sys.argv[2]
    file_size_file = sys.argv[3]

    main(target_dir, line_count_file, file_size_file)

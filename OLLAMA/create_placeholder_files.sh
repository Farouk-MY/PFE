#!/bin/bash

# Create directory structure if it doesn't exist
mkdir -p data/pdf
mkdir -p data/csv
mkdir -p data/json
mkdir -p data/vector_store

# Create placeholder gitkeep files
touch data/pdf/.gitkeep
touch data/csv/.gitkeep
touch data/json/.gitkeep
touch data/vector_store/.gitkeep

echo "✅ Placeholder files created successfully!"
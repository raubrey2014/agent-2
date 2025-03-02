#!/bin/bash

# Make sure the file exists
if [ ! -f .env.local ]; then
  echo ".env.local file not found!"
  exit 1
fi

# Read each line from .env.local
while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip comments and empty lines
  if [[ ! "$line" =~ ^\# && -n "$line" ]]; then
    # Extract variable name and value
    var_name=$(echo "$line" | cut -d '=' -f 1)
    var_value=$(echo "$line" | cut -d '=' -f 2-)
    
    # Create a temporary file with the value
    echo "$var_value" > temp_env_value
    
    # Add to Vercel (for production environment)
    echo "Adding $var_name to Vercel production environment..."
    vercel env add "$var_name" production < temp_env_value
    
    # Optionally add to preview and development environments as well
    vercel env add "$var_name" preview < temp_env_value
    vercel env add "$var_name" development < temp_env_value
    
    # Remove the temporary file
    rm temp_env_value
  fi
done < ".env.local"

echo "Environment variables have been added to Vercel!"


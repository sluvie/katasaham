#!/bin/bash

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null
then
    echo "PM2 is not installed. Installing PM2 globally..."
    npm install -g pm2
fi

# Install dependencies for backend
echo "Installing backend dependencies..."
npm install

# Install dependencies for frontend
echo "Installing frontend dependencies..."
cd client && npm install && cd ..

# Stop existing processes if any
echo "Stopping existing PM2 processes..."
pm2 stop ecosystem.config.js || true
pm2 delete ecosystem.config.js || true

# Start with PM2
echo "Starting applications with PM2..."
pm2 start ecosystem.config.js

# Save PM2 state
pm2 save

echo "------------------------------------------------"
echo "Setup complete!"
echo "Backend is running on port 3001"
echo "Frontend is running on port 5001"
echo "Use 'pm2 status' to check process status"
echo "Use 'pm2 logs' to see application logs"
echo "------------------------------------------------"

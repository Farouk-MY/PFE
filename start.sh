#!/bin/bash
echo "Installing backend dependencies..."
cd backend
npm i

echo "Starting backend..."
npm run nodemon &

echo "Installing frontend dependencies..."
cd ../frontend
npm i

echo "Starting frontend..."
npm run dev &

wait
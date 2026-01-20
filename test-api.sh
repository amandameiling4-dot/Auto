#!/bin/bash

echo "Creating admin user..."
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","role":"admin"}' \
  -w "\n"

echo ""
echo "Creating regular user..."
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"user123","role":"user"}' \
  -w "\n"

echo ""
echo "Testing login..."
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -w "\n"

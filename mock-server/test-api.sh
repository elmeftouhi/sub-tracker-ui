#!/bin/bash

# Test script for Subscription Tracker Mock API
echo "Testing Subscription Tracker Mock API on http://localhost:3001"
echo "================================================"

# Test health endpoint
echo -e "\n1. Testing health endpoint:"
curl -s http://localhost:3001/health | jq '.' || echo "Failed to connect or parse JSON"

# Test subscriptions list
echo -e "\n2. Testing subscriptions list:"
curl -s http://localhost:3001/api/subscriptions | jq '. | length' | xargs echo "Number of subscriptions:"

# Test analytics
echo -e "\n3. Testing analytics:"
curl -s http://localhost:3001/api/analytics | jq '.monthlyTotal' | xargs echo "Monthly total:"

# Test settings
echo -e "\n4. Testing settings:"
curl -s http://localhost:3001/api/settings | jq '.defaultCurrency' | xargs echo "Default currency:"

# Test payment methods
echo -e "\n5. Testing payment methods:"
curl -s http://localhost:3001/api/payment-methods | jq '. | length' | xargs echo "Number of payment methods:"

# Test upcoming renewals
echo -e "\n6. Testing upcoming renewals:"
curl -s "http://localhost:3001/api/renewals/upcoming?days=30" | jq '. | length' | xargs echo "Upcoming renewals in 30 days:"

echo -e "\nAll tests completed!"
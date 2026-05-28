#!/bin/bash

BASE_URL="http://localhost:49680"

echo "=== Testing Available Endpoints ==="
echo ""

echo "1. Health Check:"
curl -s "${BASE_URL}/api/health" | python3 -m json.tool 2>/dev/null || echo "Endpoint may not exist"
echo ""

echo "2. Wardrobe Save (POST) - Already tested ✅"
echo ""

echo "3. Wardrobe Upload (POST) - For metadata extraction"
echo "   (Would need image data, skipping in test)"
echo ""

echo "4. Wardrobe Detect (POST) - For item detection"  
echo "   (Would need image data, skipping in test)"
echo ""

echo "=== Summary ==="
echo "Current endpoints:"
echo "  POST /api/wardrobe/save - Save wardrobe item ✅"
echo "  POST /api/wardrobe/upload - Extract metadata from image"
echo "  POST /api/wardrobe/detect - Detect clothing items"
echo ""
echo "Missing: GET endpoint to retrieve all wardrobe items"
echo "This would be useful for displaying the wardrobe list"

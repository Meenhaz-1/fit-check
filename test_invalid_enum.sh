#!/bin/bash

BASE_URL="http://localhost:49680"

echo "=== EDGE CASE: Invalid Enum Values ==="
echo ""

echo "Test 1: Invalid formality value (should still save - no validation on enum)"
PAYLOAD='{
  "filename": "test-invalid-enum.jpg",
  "item_type": "shirt",
  "color": "blue",
  "material": "cotton",
  "formality": "ultra-formal",
  "fit": "fitted",
  "silhouette": "straight",
  "visual_weight": "medium"
}'

RESPONSE=$(curl -s -X POST "${BASE_URL}/api/wardrobe/save" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")
echo "$RESPONSE" | python3 -m json.tool
echo ""

echo "=== Checking if API validates enum values ==="
echo "Current implementation: Backend accepts any string value"
echo "The UI provides dropdown menus to guide users, but API doesn't enforce"
echo "This is acceptable for MVP - user-friendly but flexible"

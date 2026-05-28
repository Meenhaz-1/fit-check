#!/bin/bash

BASE_URL="http://localhost:49680"

echo "=== EDGE CASE 1: Missing Required Field (color) ==="
MISSING_FIELD_PAYLOAD='{
  "filename": "incomplete-item.jpg",
  "item_type": "jacket",
  "color": "",
  "material": "wool",
  "formality": "business",
  "fit": "fitted",
  "silhouette": "fitted",
  "visual_weight": "heavy"
}'

RESPONSE=$(curl -s -X POST "${BASE_URL}/api/wardrobe/save" \
  -H "Content-Type: application/json" \
  -d "$MISSING_FIELD_PAYLOAD")
echo "$RESPONSE" | python3 -m json.tool
echo ""

echo "=== EDGE CASE 2: Manual Entry (no AI extraction) ==="
MANUAL_PAYLOAD='{
  "filename": "my-favorite-sweater.jpg",
  "item_type": "sweater",
  "color": "forest green",
  "material": "merino wool",
  "formality": "casual",
  "fit": "loose",
  "silhouette": "oversized",
  "visual_weight": "heavy"
}'

RESPONSE=$(curl -s -X POST "${BASE_URL}/api/wardrobe/save" \
  -H "Content-Type: application/json" \
  -d "$MANUAL_PAYLOAD")
echo "$RESPONSE" | python3 -m json.tool
echo ""

echo "=== EDGE CASE 3: All Required Fields Filled ==="
COMPLETE_PAYLOAD='{
  "filename": "white-button-up.jpg",
  "item_type": "button-up shirt",
  "color": "white",
  "material": "linen",
  "formality": "business casual",
  "fit": "regular",
  "silhouette": "straight",
  "visual_weight": "light"
}'

RESPONSE=$(curl -s -X POST "${BASE_URL}/api/wardrobe/save" \
  -H "Content-Type: application/json" \
  -d "$COMPLETE_PAYLOAD")
echo "$RESPONSE" | python3 -m json.tool
echo ""

echo "=== CSV Status After Edge Case Tests ==="
echo "Total items in wardrobe:"
wc -l < data/sample-wardrobe.csv
echo ""
echo "Last 3 entries:"
tail -3 data/sample-wardrobe.csv

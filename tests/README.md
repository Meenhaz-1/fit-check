# Wardrobe Extraction Test Framework

A comprehensive automated testing framework for evaluating AI-powered clothing metadata extraction accuracy.

## Quick Start

```bash
# Run evaluation (compares extracted vs. expected metadata)
python3 tests/eval_extraction_accuracy.py

# Add new test case (interactive)
python3 tests/add_test_image.py

# View latest results
cat tests/fixtures/evaluation_report.txt
```

## Current Results

**Pass Rate: 37.5%** (3/8 tests 100% accurate)  
**Average Accuracy: 83.9%**

| Field | Accuracy | Status |
|-------|----------|--------|
| color | 100.0% | ✅ Perfect |
| material | 100.0% | ✅ Perfect |
| fit | 100.0% | ✅ Perfect |
| formality | 87.5% | ⚠️ Good |
| silhouette | 87.5% | ⚠️ Good |
| item_type | 62.5% | 🔴 Fair |
| visual_weight | 50.0% | 🔴 Needs work |

## What's Included

### Test Images (8)
- Simple solid-color images with labels
- Covers: t-shirts, jeans, shirts, blazers, cardigans, chinos, polos, sweaters
- Located in: `tests/fixtures/images/`

### Ground Truth File
- Expected metadata for each test image
- Tolerance ranges for acceptable variations
- File: `tests/fixtures/ground_truth.json`

### Evaluation Script
- Automated accuracy testing
- Field-by-field comparison
- Report generation
- File: `tests/eval_extraction_accuracy.py`

### Management Script
- Interactive test case addition
- Supports solid-color generation or existing images
- File: `tests/add_test_image.py`

### Documentation
- Complete evaluation guide
- How to add test cases
- Interpretation guide
- File: `tests/EVALUATION_GUIDE.md`

## How Tests Work

1. **Image is encoded** to base64
2. **API is called** with image and item description
3. **Extracted metadata** is compared against expected values
4. **Field matching** uses tolerance lists for acceptable variations
5. **Report is generated** with accuracy metrics

### Tolerance Matching

Example: If expected color is "blue" and tolerance includes "dark blue", the test passes if AI extracts "dark blue".

This allows for natural language variations without penalizing reasonable differences.

## Adding Test Cases

### Interactive Mode

```bash
python3 tests/add_test_image.py
```

Prompts you for:
- Test ID (unique identifier)
- Image (existing file or auto-generated)
- Description
- Expected metadata for each field
- Tolerance values (acceptable alternatives)

### Manual Mode

Edit `tests/fixtures/ground_truth.json` directly:

```json
{
  "id": "my-test-id",
  "image": "my-image.png",
  "description": "Description of the item",
  "expected": {
    "item_type": "shirt",
    "color": "blue",
    "material": "cotton",
    "formality": "casual",
    "fit": "regular",
    "silhouette": "straight",
    "visual_weight": "light"
  },
  "tolerance": {
    "color": ["blue", "dark blue", "navy"],
    "material": ["cotton", "cotton blend"],
    "fit": ["regular", "fitted"]
  }
}
```

## Understanding Results

### Field Accuracy

- **100%** - Perfect accuracy across all tests
- **75-99%** - Good accuracy, occasional misses
- **50-74%** - Fair accuracy, room for improvement
- **<50%** - Needs significant improvement

### Problem Areas

Current weaknesses:

1. **Visual Weight (50% accuracy)**
   - AI tends to default to "medium"
   - Hard to estimate from still images
   - Recommendation: Add helper text to UI

2. **Item Type Specificity (62.5%)**
   - Confuses similar items: jeans↔pants, blazer↔jacket
   - Recommendation: Improve extraction prompt with examples

3. **Attribute Nuance (87.5%)**
   - Sometimes confuses casual vs business casual
   - Recommendation: Use more realistic training images

## Test Coverage

### Current Focus
- Basic item types (t-shirt, jeans, shirt, blazer, cardigan, chinos, polo, sweater)
- Common colors (red, blue, white, black, gray, khaki, navy, green)
- Basic materials (cotton, denim, wool)
- Simple scenarios (single-colored, no people)

### Not Yet Covered
- Multiple items in one image
- Extreme lighting conditions
- Clothing with patterns/prints
- Realistic photos with people
- Unusual angles or fit
- Edge cases and corner cases

## Expanding the Test Suite

### Phase 1: More Simple Tests (Quick)
```bash
python3 tests/add_test_image.py
# Create 10-20 more solid-color test cases
# Focus on different colors, materials, formalities
```

### Phase 2: Real Photographs (Medium)
- Take actual photos of clothing items
- Include different angles, lighting, wear patterns
- Test with people wearing clothes
- Add via `add_test_image.py`

### Phase 3: Edge Cases (Advanced)
- Multiple items in one image
- Extreme lighting (very dark/very bright)
- Patterns and prints
- Layered clothing
- Unusual fits or styles

## Integration with CI/CD

To run tests automatically:

### GitHub Actions (Example)
```yaml
- name: Test Extraction Accuracy
  run: python3 tests/eval_extraction_accuracy.py
```

### Local Pre-commit Hook
```bash
#!/bin/bash
python3 tests/eval_extraction_accuracy.py
```

### Scheduled Evaluation
```bash
# Run daily at 9 AM
0 9 * * * cd /path/to/wardrobe && python3 tests/eval_extraction_accuracy.py
```

## Interpreting the Report

### Summary Section
Shows overall pass rate and accuracy statistics.

### Field Accuracy Table
Shows accuracy per field across all tests:
- `color`: How well colors are identified
- `material`: Fabric type accuracy
- `item_type`: Item categorization accuracy
- etc.

### Detailed Results
For each test case:
- `[PASS]` - All fields matched
- `[FAIL]` - One or more fields didn't match
- Field-by-field breakdown of expected vs. actual

### Problem Areas
Lists all failing tests and which fields didn't match.

## Performance Goals

| Phase | Pass Rate | Avg Accuracy | Tests |
|-------|-----------|--------------|-------|
| Current | 37.5% | 83.9% | 8 |
| Month 1 | 60% | 88% | 30 |
| Month 2 | 75% | 90% | 50+ |
| Month 3 | 85% | 92% | 100+ |

## Known Limitations

### Test Image Simplicity
Current test images are solid-colored rectangles. This is:
- ✅ Easy to control and reproducible
- ✅ Good for color/material testing
- ❌ Unrealistic (no texture, fit, people)
- ❌ Doesn't show actual clothing appearance

Recommendation: Expand with real photographs.

### API Consistency
Tests depend on OpenAI API stability:
- Rate limits may affect testing
- API responses can vary slightly
- Recommend tolerances for acceptable variation

### Image Format
Currently tests PNG images. Support for:
- JPG (typical user input) - needs testing
- WebP (modern format) - needs testing
- Different resolutions - needs testing

## Troubleshooting

### "Server not found" error
```
Make sure dev server is running:
npm run dev
```

### "File not found" error
```
Check image location:
ls tests/fixtures/images/
```

### API returns 500 error
```
Check:
1. OPENAI_API_KEY is set
2. API account has credits
3. Server logs for errors
```

### Low accuracy on new images
```
Consider:
1. Image quality/clarity
2. Lighting conditions
3. Whether item is visible clearly
4. Update tolerance ranges if needed
```

## Future Enhancements

1. **Batch Testing** - Run tests on multiple images simultaneously
2. **Confidence Scores** - Track AI confidence in each extraction
3. **A/B Testing** - Compare different extraction prompts
4. **User Feedback Loop** - Collect corrections and analyze patterns
5. **Performance Tracking** - Monitor accuracy over time
6. **Automated Prompts** - Generate test cases from image analysis

## Contributing Tests

Want to add test cases? 

1. Use `python3 tests/add_test_image.py` (interactive)
2. Or edit `ground_truth.json` directly
3. Run evaluation: `python3 tests/eval_extraction_accuracy.py`
4. Share results!

---

**Last Updated:** 2026-05-28  
**Framework Version:** 1.0  
**Status:** Active  
**Maintainer:** User

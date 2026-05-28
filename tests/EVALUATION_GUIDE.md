# Wardrobe Extraction Evaluation Framework

## Overview

This framework provides automated testing and evaluation of the AI-powered wardrobe metadata extraction system. It compares extracted metadata against known ground truth values to measure accuracy and identify problem areas.

## Directory Structure

```
tests/
├── fixtures/
│   ├── images/                      # Test images
│   │   ├── red-tshirt-plain.png
│   │   ├── blue-jeans-standard.png
│   │   ├── white-button-up-formal.png
│   │   ├── black-blazer-wool.png
│   │   ├── gray-cardigan-cozy.png
│   │   ├── khaki-chinos.png
│   │   ├── navy-polo-shirt.png
│   │   └── green-sweater-dark.png
│   ├── ground_truth.json            # Expected metadata for each image
│   └── evaluation_report.txt        # Latest evaluation results
├── eval_extraction_accuracy.py      # Evaluation script
└── EVALUATION_GUIDE.md              # This file
```

## Current Results Summary

**Overall Pass Rate: 37.5%** (3/8 tests passed with 100% accuracy)
**Average Field Accuracy: 83.9%**

### Accuracy by Field

| Field | Accuracy | Notes |
|-------|----------|-------|
| color | 100.0% | Excellent - color detection is very reliable |
| material | 100.0% | Excellent - material identification works well |
| fit | 100.0% | Excellent - fit estimation is accurate |
| formality | 87.5% | Good - mostly accurate, some confusion on casual vs business casual |
| silhouette | 87.5% | Good - shape detection works well |
| item_type | 62.5% | Fair - some confusion between similar items (jeans vs pants, blazer vs jacket) |
| visual_weight | 50.0% | Needs improvement - AI tends to default to 'medium' |

### Perfect Matches (100% Accuracy)

✅ White button-up formal shirt
✅ Gray cardigan sweater
✅ Green dark sweater

### Problem Areas

🔴 **visual_weight**: AI defaults to 'medium' for most items instead of distinguishing light/heavy
🔴 **item_type specificity**: Confuses similar items (jeans↔pants, blazer↔jacket, chinos↔pants)
🔴 **fit estimation**: Sometimes disagrees with expected fit from image alone

## How to Use

### Run the Full Evaluation

```bash
cd "C:\Users\Meenhaz\Claude Workspace\AI Wardrobe Assistant"
python3 tests/eval_extraction_accuracy.py
```

### Run Against a Different Server

```bash
python3 tests/eval_extraction_accuracy.py http://localhost:3000
```

## Adding New Test Cases

### Step 1: Create a Test Image

Create a PNG image of the clothing item:
```bash
# Copy/save your image to:
tests/fixtures/images/my-item-name.png
```

### Step 2: Add to Ground Truth

Edit `tests/fixtures/ground_truth.json`:
```json
{
  "id": "my-test-id",
  "image": "my-item-name.png",
  "description": "Description of the item",
  "expected": {
    "item_type": "shirt",
    "color": "blue",
    "material": "cotton",
    "formality": "casual",
    "fit": "regular",
    "silhouette": "straight",
    "visual_weight": "medium"
  },
  "tolerance": {
    "color": ["blue", "dark blue", "navy"],
    "material": ["cotton", "cotton blend"],
    "fit": ["regular", "fitted"],
    "silhouette": ["straight"]
  }
}
```

### Step 3: Run Evaluation

```bash
python3 tests/eval_extraction_accuracy.py
```

## Interpreting Results

### Field Accuracy

- **100%**: Perfect accuracy across all tests
- **75-99%**: Good accuracy, occasional misses
- **50-74%**: Fair accuracy, room for improvement
- **<50%**: Needs significant improvement

### Test Result Breakdown

Each test shows:
- **[PASS]**: All fields matched expected values
- **[FAIL]**: One or more fields didn't match

### Tolerance Matching

The evaluator accepts extracted values that:
1. Exactly match expected value
2. Match any item in the tolerance list
3. Partially match (e.g., "dark blue" accepted for expected "blue")

## Insights from Current Testing

### Strengths ✅

1. **Color Detection**: 100% accuracy - AI is excellent at identifying colors
2. **Material ID**: 100% accuracy - Fabric types recognized reliably
3. **Fit Estimation**: 100% accuracy on these simple images
4. **Basic Item Types**: Correctly identifies main garment categories

### Weaknesses 🔴

1. **Visual Weight**: Only 50% accuracy
   - AI seems to default to "medium" for uncertain cases
   - May need better training on weight characteristics
   - Recommendation: Add more weight-specific training images

2. **Item Type Specificity**: 62.5% accuracy
   - Confuses jeans with pants
   - Confuses blazer with jacket
   - Confuses chinos with pants
   - Recommendation: Add specific prompts to distinguish similar items

3. **Attribute Nuance**: 
   - Formality sometimes confused (casual vs business casual)
   - Silhouette not always correct on simple colored images
   - Recommendation: Use more realistic/detailed images for training

## Recommendations

### Immediate (Quick Wins)

1. ✅ Add helper text for material field (DONE - guides users to check tags)
2. **Add visual weight hints in UI**
   - Help users understand what makes an item "light" vs "heavy"
   - Examples: "light=thin/delicate, heavy=thick/bulky"

3. **Improve item_type accuracy**
   - Use more specific prompts mentioning similar item distinctions
   - Add image examples in extraction prompt

### Short-term

1. **Expand test dataset**
   - Add 20+ more test images covering edge cases
   - Include photos with people, mannequins, different angles
   - Test extreme lighting conditions

2. **Fine-tune prompts**
   - Adjust OpenAI prompt to be more specific about visual weight
   - Add clarity on item type distinctions

3. **User feedback loop**
   - Track which corrections users make most
   - Use patterns to improve prompts

### Long-term

1. **Model fine-tuning**
   - Collect real user corrections as training data
   - Fine-tune GPT on wardrobe-specific extraction
   - Build custom visual weight classifier

2. **Multi-image evaluation**
   - Test on photos with people wearing clothes
   - Test different poses, angles, lighting
   - Build confidence intervals for extraction

## Test Data Characteristics

### Current Test Images

Simple, solid-colored rectangles with text labels. These are:
- ✅ Easy to control
- ✅ Reproduce specific colors/colors
- ❌ Unrealistic (no fabric texture, fit, wear pattern)
- ❌ Don't show actual clothing on people

### Next Phase: Realistic Images

Consider adding:
- Actual photographs of clothing items
- Clothing worn on people/mannequins
- Different lighting conditions
- Various fabrics and patterns
- Real-world wrinkles, wear, fit

## Running Tests Automatically

To run evaluations automatically on a schedule:

```bash
# Create a cron job (Linux/Mac)
*/hour * * * * cd /path/to/wardrobe && python3 tests/eval_extraction_accuracy.py >> tests/fixtures/eval_history.log

# Or create a scheduled task (Windows)
# Task Scheduler > Create Task > Run: python3 tests/eval_extraction_accuracy.py
```

## Troubleshooting

### Server not found

```
Error: Connection refused
```

Make sure the dev server is running:
```bash
npm run dev
```

### Image not found

```
FileNotFoundError: tests/fixtures/images/...
```

Verify image exists in the correct location:
```bash
ls tests/fixtures/images/
```

### JSON parsing error

```
JSONDecodeError: ...
```

The API may have returned an error. Check:
1. Image file is valid PNG
2. OpenAI API key is set
3. API server has no errors

## Next Steps

1. **Add 10+ more test images** with real photographs
2. **Create regression test suite** to catch accuracy drops
3. **Build CI/CD integration** to run tests on each deployment
4. **Gather user feedback** to improve tolerances and prompts
5. **Measure real-world accuracy** on actual user uploads

---

Last Updated: 2026-05-28
Test Images: 8
Pass Rate: 37.5% (3/8)
Average Accuracy: 83.9%

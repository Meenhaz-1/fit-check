#!/usr/bin/env python3
"""
Wardrobe Metadata Extraction Evaluation Suite

Compares AI-extracted metadata against ground truth values.
Generates accuracy metrics and identifies problem cases.
"""

import json
import requests
import base64
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import Dict, List, Optional

@dataclass
class ExtractionResult:
    """Results from a single extraction test"""
    test_id: str
    image_path: str
    expected: Dict[str, str]
    extracted: Dict[str, str]
    tolerance: Dict[str, List[str]]
    field_results: Dict[str, bool]
    overall_match: bool
    accuracy_percentage: float

class ExtractionEvaluator:
    def __init__(self, base_url: str, ground_truth_path: str):
        self.base_url = base_url
        self.ground_truth_path = Path(ground_truth_path)
        self.results: List[ExtractionResult] = []

    def load_ground_truth(self) -> Dict:
        """Load ground truth data"""
        with open(self.ground_truth_path, 'r') as f:
            return json.load(f)

    def encode_image_to_base64(self, image_path: str) -> str:
        """Convert image file to base64 string"""
        with open(image_path, 'rb') as f:
            return base64.b64encode(f.read()).decode('utf-8')

    def extract_metadata(self, image_base64: str, item_description: str) -> Dict:
        """Call the extraction API"""
        payload = {
            "image": image_base64,
            "mediaType": "image/jpeg",
            "itemDescription": item_description
        }

        try:
            response = requests.post(
                f"{self.base_url}/api/wardrobe/upload",
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            data = response.json()
            return data.get('metadata', {})
        except requests.exceptions.RequestException as e:
            print(f"    [ERROR] API request failed: {e}")
            return {}
        except json.JSONDecodeError:
            print(f"    [ERROR] Invalid JSON response")
            return {}

    def check_field_match(self, field: str, expected: str, extracted: str,
                         tolerance: List[str]) -> bool:
        """Check if field matches expected value (with tolerance)"""
        extracted_lower = extracted.lower().strip()
        expected_lower = expected.lower()

        # Direct match
        if extracted_lower == expected_lower:
            return True

        # Check tolerance list
        if tolerance:
            for acceptable in tolerance:
                if acceptable.lower() in extracted_lower or extracted_lower in acceptable.lower():
                    return True

        return False

    def evaluate_test(self, test: Dict, image_dir: str) -> ExtractionResult:
        """Evaluate a single test case"""
        test_id = test['id']
        image_path = Path(image_dir) / test['image']

        print(f"\nTesting: {test_id}")
        print(f"  Description: {test['description']}")

        # Check if image exists
        if not image_path.exists():
            print(f"  [SKIP] Image not found: {test['image']}")
            return None

        # Encode image
        image_base64 = self.encode_image_to_base64(str(image_path))

        # Extract metadata
        extracted = self.extract_metadata(image_base64, test['description'])
        expected = test['expected']
        tolerance = test.get('tolerance', {})

        # Compare fields
        field_results = {}
        total_fields = len(expected)
        matching_fields = 0

        for field, expected_value in expected.items():
            extracted_value = extracted.get(field, 'MISSING')
            tolerance_list = tolerance.get(field, [])

            is_match = self.check_field_match(field, expected_value, extracted_value, tolerance_list)
            field_results[field] = is_match

            if is_match:
                matching_fields += 1
                status = "[PASS]"
            else:
                status = "[FAIL]"

            print(f"    {status} {field}: expected='{expected_value}', got='{extracted_value}'")

        overall_match = matching_fields == total_fields
        accuracy_percentage = (matching_fields / total_fields * 100) if total_fields > 0 else 0

        result = ExtractionResult(
            test_id=test_id,
            image_path=str(image_path),
            expected=expected,
            extracted=extracted,
            tolerance=tolerance,
            field_results=field_results,
            overall_match=overall_match,
            accuracy_percentage=accuracy_percentage
        )

        self.results.append(result)
        return result

    def generate_report(self) -> str:
        """Generate evaluation report"""
        if not self.results:
            return "No test results to report"

        report = []
        report.append("\n" + "=" * 70)
        report.append("WARDROBE EXTRACTION ACCURACY EVALUATION REPORT")
        report.append("=" * 70)

        # Summary statistics
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.overall_match)
        overall_accuracy = sum(r.accuracy_percentage for r in self.results) / total_tests if total_tests > 0 else 0

        report.append(f"\nOVERALL RESULTS")
        report.append("-" * 70)
        report.append(f"Total Tests:        {total_tests}")
        report.append(f"Passed (100%):      {passed_tests}")
        report.append(f"Failed:             {total_tests - passed_tests}")
        report.append(f"Pass Rate:          {passed_tests/total_tests*100:.1f}%")
        report.append(f"Average Accuracy:   {overall_accuracy:.1f}%")

        # Field-by-field accuracy
        field_stats = {}
        for result in self.results:
            for field, passed in result.field_results.items():
                if field not in field_stats:
                    field_stats[field] = {"passed": 0, "total": 0}
                field_stats[field]["total"] += 1
                if passed:
                    field_stats[field]["passed"] += 1

        report.append(f"\nFIELD ACCURACY")
        report.append("-" * 70)
        for field in sorted(field_stats.keys()):
            stats = field_stats[field]
            accuracy = stats["passed"] / stats["total"] * 100
            report.append(f"{field:20} {stats['passed']}/{stats['total']:2}   {accuracy:5.1f}%")

        # Detailed results
        report.append(f"\nDETAILED TEST RESULTS")
        report.append("-" * 70)
        for result in self.results:
            status = "PASS" if result.overall_match else "FAIL"
            report.append(f"\n[{status}] {result.test_id} ({result.accuracy_percentage:.1f}% accuracy)")
            for field, passed in result.field_results.items():
                mark = "OK" if passed else "ERROR"
                expected = result.expected[field]
                extracted = result.extracted.get(field, "MISSING")
                report.append(f"      [{mark}] {field}: {expected} -> {extracted}")

        # Problem areas
        failures = [r for r in self.results if not r.overall_match]
        if failures:
            report.append(f"\nPROBLEM AREAS ({len(failures)} tests failing)")
            report.append("-" * 70)
            for result in failures:
                report.append(f"\n{result.test_id}:")
                for field, passed in result.field_results.items():
                    if not passed:
                        expected = result.expected[field]
                        extracted = result.extracted.get(field, "MISSING")
                        report.append(f"  - {field}: expected '{expected}', got '{extracted}'")

        report.append("\n" + "=" * 70)

        return "\n".join(report)

    def run_evaluation(self) -> None:
        """Run full evaluation"""
        ground_truth = self.load_ground_truth()
        image_dir = self.ground_truth_path.parent / "images"

        print("\nStarting Extraction Accuracy Evaluation")
        print(f"Base URL: {self.base_url}")
        print(f"Ground Truth: {self.ground_truth_path}")
        print(f"Image Directory: {image_dir}")

        for test in ground_truth['tests']:
            result = self.evaluate_test(test, str(image_dir))
            if result is not None:
                pass  # Result already added to self.results in evaluate_test

        report = self.generate_report()
        print(report)

        # Save report
        report_path = self.ground_truth_path.parent / "evaluation_report.txt"
        with open(report_path, 'w') as f:
            f.write(report)
        print(f"\nReport saved to: {report_path}")

def main():
    # Configuration
    BASE_URL = "http://localhost:3001"
    GROUND_TRUTH = "tests/fixtures/ground_truth.json"

    if len(sys.argv) > 1:
        BASE_URL = sys.argv[1]

    evaluator = ExtractionEvaluator(BASE_URL, GROUND_TRUTH)
    evaluator.run_evaluation()

if __name__ == "__main__":
    main()

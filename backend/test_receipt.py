#!/usr/bin/env python3
"""
Simple test script to parse a receipt image using Claude.

Usage:
    python test_receipt.py path/to/receipt.jpg
"""

import sys
import json
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.receipt_parser import ReceiptParser
from app.config import config


def print_receipt(receipt_data):
    """Pretty print the parsed receipt data."""
    print("\n" + "="*60)
    print("PARSED RECEIPT")
    print("="*60)

    # Restaurant name
    restaurant = receipt_data.get('restaurant_name', 'Unknown')
    print(f"\n🏪 Restaurant: {restaurant}")

    # Items
    items = receipt_data.get('items', [])
    if items:
        print(f"\n📝 Items ({len(items)}):")
        for i, item in enumerate(items, 1):
            name = item.get('name', 'Unknown')
            price = item.get('price', 0)
            qty = item.get('quantity', 1)
            if qty > 1:
                print(f"  {i}. {name} x{qty} - ${price:.2f} each (${price * qty:.2f} total)")
            else:
                print(f"  {i}. {name} - ${price:.2f}")

    # Totals
    print(f"\n💰 Totals:")
    if receipt_data.get('subtotal') is not None:
        print(f"  Subtotal: ${receipt_data['subtotal']:.2f}")
    if receipt_data.get('tax') is not None:
        print(f"  Tax:      ${receipt_data['tax']:.2f}")
    if receipt_data.get('tip') is not None:
        print(f"  Tip:      ${receipt_data['tip']:.2f}")
    if receipt_data.get('total') is not None:
        print(f"  TOTAL:    ${receipt_data['total']:.2f}")

    # Confidence
    confidence = receipt_data.get('confidence', 'unknown')
    confidence_emoji = {"high": "✅", "medium": "⚠️", "low": "❌"}.get(confidence, "❓")
    print(f"\n{confidence_emoji} Confidence: {confidence}")

    # Validation
    validation = receipt_data.get('validation', {})
    if validation:
        is_valid = validation.get('is_valid', False)
        issues = validation.get('issues', [])
        warnings = validation.get('warnings', [])

        if is_valid:
            print("\n✅ Validation: PASSED")
        else:
            print("\n❌ Validation: FAILED")

        if issues:
            print("\n⚠️ Issues:")
            for issue in issues:
                print(f"  - {issue}")

        if warnings:
            print("\n⚠️ Warnings:")
            for warning in warnings:
                print(f"  - {warning}")

    print("\n" + "="*60 + "\n")


def main():
    """Main test function."""
    # Check arguments
    if len(sys.argv) < 2:
        print("Usage: python test_receipt.py <path/to/receipt/image>")
        print("\nExample:")
        print("  python test_receipt.py receipt.jpg")
        sys.exit(1)

    image_path = sys.argv[1]

    # Check file exists
    if not Path(image_path).exists():
        print(f"Error: File not found: {image_path}")
        sys.exit(1)

    print(f"🔍 Analyzing receipt: {image_path}")

    try:
        # Validate config
        config.validate()

        # Create parser
        parser = ReceiptParser()

        # Parse receipt
        print("📤 Sending to Claude...")
        receipt_data = parser.parse_receipt_from_path(image_path)

        # Print results
        print_receipt(receipt_data)

        # Save full JSON to file
        output_file = Path(image_path).stem + "_parsed.json"
        with open(output_file, 'w') as f:
            json.dump(receipt_data, f, indent=2)
        print(f"💾 Full JSON saved to: {output_file}\n")

    except ValueError as e:
        print(f"\n❌ Configuration Error: {e}\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

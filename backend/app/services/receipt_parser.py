"""
Receipt parsing service using Claude's vision API.
Sends receipt images to Claude and gets back structured JSON data.
"""

import base64
import json
import logging
from typing import Dict, Any, List, Optional
from pathlib import Path

from anthropic import Anthropic
from app.config import config

logging.basicConfig(level=getattr(logging, config.LOG_LEVEL))
logger = logging.getLogger(__name__)


class ReceiptParser:
    """Parse receipts using Claude's vision capabilities."""

    # System prompt that tells Claude how to parse receipts
    SYSTEM_PROMPT = """You are an expert at reading restaurant receipts and extracting structured data.

Your task is to analyze receipt images and extract all relevant information into a structured JSON format.

Return a JSON object with this exact structure:
{
  "restaurant_name": "Name of the restaurant",
  "items": [
    {
      "name": "Item name",
      "price": 12.99,
      "quantity": 1
    }
  ],
  "subtotal": 25.50,
  "tax": 2.04,
  "tip": 5.00,
  "total": 32.54,
  "confidence": "high|medium|low"
}

Important rules:
- All prices must be numbers (not strings)
- If a field is not found or unclear, use null
- Quantity defaults to 1 if not specified
- Be careful to distinguish between individual item prices and subtotal/total
- Ignore non-item text like "Thank you", "Server:", "Table:", etc.
- confidence should be:
  - "high" if all fields are clearly visible
  - "medium" if some fields are unclear or missing
  - "low" if the receipt is hard to read or many fields are missing
- Only include actual food/drink items in the items array
- For modifiers or add-ons, include them in the item name (e.g., "Burger with cheese")

Return ONLY the JSON object, no other text or explanation."""

    def __init__(self):
        """Initialize Claude API client."""
        # Validate API key is configured
        if not config.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY not configured")

        self.client = Anthropic(api_key=config.ANTHROPIC_API_KEY)
        self.model = config.CLAUDE_MODEL
        self.max_tokens = config.CLAUDE_MAX_TOKENS

        logger.info(f"ReceiptParser initialized with model: {self.model}")

    def parse_receipt_from_path(self, image_path: str) -> Dict[str, Any]:
        """
        Parse a receipt from an image file path.

        Args:
            image_path: Path to the receipt image file

        Returns:
            Dictionary with parsed receipt data
        """
        # Read image file
        with open(image_path, 'rb') as f:
            image_data = f.read()

        return self.parse_receipt(image_data)

    def parse_receipt(self, image_data: bytes) -> Dict[str, Any]:
        """
        Parse a receipt from image bytes.

        Args:
            image_data: Raw image bytes (JPEG, PNG, WebP)

        Returns:
            Dictionary with parsed receipt data including:
            - restaurant_name
            - items (list of {name, price, quantity})
            - subtotal, tax, tip, total
            - confidence level
        """
        try:
            # Encode image to base64
            image_base64 = base64.b64encode(image_data).decode('utf-8')

            # Detect media type
            media_type = self._detect_media_type(image_data)

            logger.info(f"Sending receipt to Claude (model: {self.model}, size: {len(image_data)} bytes)")

            # Call Claude API with vision
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=self.SYSTEM_PROMPT,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": image_base64,
                                },
                            },
                            {
                                "type": "text",
                                "text": "Please parse this receipt and return the structured JSON data."
                            }
                        ],
                    }
                ],
            )

            # Extract response text
            response_text = response.content[0].text
            logger.debug(f"Claude response: {response_text[:200]}...")

            # Parse JSON from response
            receipt_data = self._extract_json(response_text)

            # Add validation
            receipt_data['validation'] = self._validate_receipt(receipt_data)

            logger.info(
                f"Receipt parsed successfully: "
                f"{len(receipt_data.get('items', []))} items, "
                f"total: ${receipt_data.get('total', 0)}, "
                f"confidence: {receipt_data.get('confidence', 'unknown')}"
            )

            return receipt_data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from Claude response: {str(e)}")
            raise ValueError(f"Failed to parse receipt: Invalid response format")
        except Exception as e:
            logger.error(f"Error parsing receipt: {str(e)}", exc_info=True)
            raise

    def _detect_media_type(self, image_data: bytes) -> str:
        """Detect image format from magic bytes."""
        if image_data.startswith(b'\xff\xd8\xff'):
            return "image/jpeg"
        elif image_data.startswith(b'\x89PNG'):
            return "image/png"
        elif image_data.startswith(b'RIFF') and b'WEBP' in image_data[:12]:
            return "image/webp"
        else:
            # Default to JPEG
            logger.warning("Unknown image format, defaulting to JPEG")
            return "image/jpeg"

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """
        Extract JSON from Claude's response.
        Handles cases where JSON might be in markdown code blocks.
        """
        # Try direct parsing first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try extracting from markdown code block
        import re

        # Pattern for ```json ... ```
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass

        # Try finding any JSON object
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass

        raise json.JSONDecodeError(f"No valid JSON found in response", text, 0)

    def _validate_receipt(self, receipt_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate that the receipt data makes sense.
        Checks if totals add up correctly.
        """
        issues = []
        warnings = []

        items = receipt_data.get('items', [])
        subtotal = receipt_data.get('subtotal')
        tax = receipt_data.get('tax')
        tip = receipt_data.get('tip')
        total = receipt_data.get('total')

        # Check for items
        if not items:
            issues.append("No items found in receipt")

        # Check for total
        if total is None:
            warnings.append("No total found")

        # Validate math
        if subtotal is not None and tax is not None and total is not None:
            calculated_total = subtotal + tax
            if tip:
                calculated_total += tip

            difference = abs(calculated_total - total)
            if difference > 0.02:  # Allow 2 cent rounding
                issues.append(
                    f"Math doesn't add up: {subtotal} + {tax} + {tip or 0} = {calculated_total}, "
                    f"but total is {total} (difference: ${difference:.2f})"
                )

        # Check if items sum to subtotal
        if items and subtotal is not None:
            items_sum = sum((item.get('price') or 0) * (item.get('quantity') or 1) for item in items)
            difference = abs(items_sum - subtotal)
            if difference > 0.02:
                warnings.append(
                    f"Items sum (${items_sum:.2f}) doesn't match subtotal (${subtotal:.2f}). "
                    f"Some items may be missing or incorrect."
                )

        return {
            "is_valid": len(issues) == 0,
            "issues": issues,
            "warnings": warnings
        }

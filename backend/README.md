# Bill Splitting Backend - Receipt Parser

Simple receipt parsing using Claude's vision API.

## Setup

### 1. Install Dependencies

```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure API Key

Edit the `.env` file and add your Anthropic API key:

```bash
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
```

Get your API key from: https://console.anthropic.com/

### 3. Test It Out

```bash
python test_receipt.py path/to/receipt.jpg
```

## Example

```bash
python test_receipt.py receipt.jpg
```

Output:
```
🔍 Analyzing receipt: receipt.jpg
📤 Sending to Claude...

============================================================
PARSED RECEIPT
============================================================

🏪 Restaurant: Joe's Diner

📝 Items (3):
  1. Cheeseburger - $12.99
  2. Fries - $4.50
  3. Soda - $2.99

💰 Totals:
  Subtotal: $20.48
  Tax:      $1.84
  Tip:      $4.00
  TOTAL:    $26.32

✅ Confidence: high

✅ Validation: PASSED

============================================================

💾 Full JSON saved to: receipt_parsed.json
```

## What It Does

1. Takes a receipt image (JPEG, PNG, or WebP)
2. Sends it to Claude Sonnet 4.5
3. Gets back structured JSON with:
   - Restaurant name
   - Line items (name, price, quantity)
   - Subtotal, tax, tip, total
   - Confidence level
4. Validates the math
5. Pretty prints the results

## Files

- `app/services/receipt_parser.py` - Main Claude vision parser
- `app/config.py` - Configuration from environment
- `test_receipt.py` - Test script to try it out
- `.env` - Your API key (don't commit this!)
- `requirements.txt` - Python dependencies

## Next Steps

Once this is working, we can:
- Build a FastAPI endpoint for this
- Add the bill splitting logic
- Create the frontend to upload receipts
- Add real-time collaboration with WebSocket

## Troubleshooting

**Error: ANTHROPIC_API_KEY not configured**
- Make sure you've added your API key to the `.env` file
- The key should start with `sk-ant-`

**Error: File not found**
- Make sure the receipt image path is correct
- Try using an absolute path

**Low confidence or parsing errors**
- Try a clearer receipt image
- Make sure the image is right-side up
- Avoid blurry or cropped receipts

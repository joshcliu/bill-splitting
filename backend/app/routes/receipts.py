"""
Receipt processing API routes.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, status
from app.models.schemas import Receipt, UploadReceiptResponse, BillItemCreate
from app.services.receipt_parser import ReceiptParser
from app.services.session_manager import session_manager
import uuid

router = APIRouter(prefix="/api/receipts", tags=["receipts"])

# Initialize receipt parser
receipt_parser = ReceiptParser()


@router.post("/upload", response_model=UploadReceiptResponse, status_code=status.HTTP_201_CREATED)
async def upload_receipt(image: UploadFile = File(...)):
    """
    Upload a receipt image.
    Returns a receipt ID that can be used to scan the receipt.
    """
    # Validate file type
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image (JPEG, PNG, or WebP)"
        )

    # Read image data
    image_data = await image.read()

    # Generate receipt ID
    receipt_id = str(uuid.uuid4())

    # Store the image data temporarily (in production, upload to S3/Cloudinary)
    # For now, we'll store it in the session manager
    session_manager.receipts[f"{receipt_id}_image"] = image_data

    # Generate a placeholder URL (in production, this would be the S3 URL)
    image_url = f"/uploads/{receipt_id}.jpg"

    return UploadReceiptResponse(receiptId=receipt_id, imageUrl=image_url)


@router.post("/{receipt_id}/scan", response_model=Receipt)
async def scan_receipt(receipt_id: str):
    """
    Scan a receipt using Claude vision API.
    Parses the receipt and extracts structured data.
    """
    # Get the stored image data
    image_data = session_manager.receipts.get(f"{receipt_id}_image")
    if not image_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Receipt {receipt_id} not found. Please upload the receipt first."
        )

    try:
        # Parse receipt using Claude vision
        receipt_data = receipt_parser.parse_receipt(image_data)

        # Convert items to BillItemCreate format
        items = []
        for idx, item in enumerate(receipt_data.get("items", [])):
            items.append(BillItemCreate(
                name=item.get("name", "Unknown Item"),
                price=item.get("price") or 0.0,
                quantity=item.get("quantity") or 1,
                lineNumber=idx + 1
            ))

        # Create Receipt response
        receipt = Receipt(
            id=receipt_id,
            restaurantName=receipt_data.get("restaurant_name"),
            items=items,
            subtotal=receipt_data.get("subtotal") or 0.0,
            tax=receipt_data.get("tax") or 0.0,
            tip=receipt_data.get("tip") or 0.0,
            total=receipt_data.get("total") or 0.0,
            confidence=receipt_data.get("confidence")
        )

        # Store the parsed receipt data
        session_manager.store_receipt(receipt_id, receipt_data)

        return receipt

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse receipt: {str(e)}"
        )


@router.get("/{receipt_id}", response_model=Receipt)
async def get_receipt(receipt_id: str):
    """Get a parsed receipt by ID"""
    receipt_data = session_manager.get_receipt(receipt_id)
    if not receipt_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Receipt {receipt_id} not found"
        )

    # Convert to Receipt model
    items = []
    for idx, item in enumerate(receipt_data.get("items", [])):
        items.append(BillItemCreate(
            name=item.get("name", "Unknown Item"),
            price=item.get("price") or 0.0,
            quantity=item.get("quantity") or 1,
            lineNumber=idx + 1
        ))

    receipt = Receipt(
        id=receipt_id,
        restaurantName=receipt_data.get("restaurant_name"),
        items=items,
        subtotal=receipt_data.get("subtotal") or 0.0,
        tax=receipt_data.get("tax") or 0.0,
        tip=receipt_data.get("tip") or 0.0,
        total=receipt_data.get("total") or 0.0,
        confidence=receipt_data.get("confidence")
    )

    return receipt

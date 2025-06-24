from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo import MongoClient
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
import os
import uuid
import qrcode
import io
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json

# Initialize FastAPI app
app = FastAPI(title="Hotel Ulin API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client.hotel_ulin

# Collections
bookings_collection = db.bookings
orders_collection = db.orders
rooms_collection = db.rooms
menu_collection = db.menu_items

# Pydantic models
class BookingRequest(BaseModel):
    guest_name: str
    guest_email: str
    guest_phone: str
    check_in_date: str
    check_out_date: str
    room_type: str
    number_of_guests: int
    special_requests: Optional[str] = ""

class Booking(BaseModel):
    booking_id: str
    guest_name: str
    guest_email: str
    guest_phone: str
    check_in_date: str
    check_out_date: str
    room_type: str
    number_of_guests: int
    special_requests: str
    status: str = "pending"
    created_at: datetime
    total_price: float

class MenuItem(BaseModel):
    item_id: str
    name: str
    description: str
    price: float
    category: str
    menu_type: str  # "bar" or "restaurant"
    available: bool = True

class OrderItem(BaseModel):
    item_id: str
    name: str
    price: float
    quantity: int

class OrderRequest(BaseModel):
    table_number: Optional[str] = ""
    customer_name: Optional[str] = ""
    customer_phone: Optional[str] = ""
    items: List[OrderItem]
    order_type: str  # "bar" or "restaurant"
    special_instructions: Optional[str] = ""

class Order(BaseModel):
    order_id: str
    table_number: str
    customer_name: str
    customer_phone: str
    items: List[OrderItem]
    total_amount: float
    order_type: str
    special_instructions: str
    status: str = "pending"
    created_at: datetime

# Initialize sample data
def initialize_data():
    # Initialize rooms
    if rooms_collection.count_documents({}) == 0:
        rooms = [
            {"room_id": f"room_{i}", "room_number": i, "room_type": "Deluxe Beachfront", "price_per_night": 120.0, "available": True}
            for i in range(1, 13)
        ]
        rooms_collection.insert_many(rooms)
    
    # Initialize menu items
    if menu_collection.count_documents({}) == 0:
        menu_items = [
            # Bar Menu
            {"item_id": "bar_1", "name": "Mojito", "description": "Fresh mint, lime, white rum", "price": 8.0, "category": "Cocktails", "menu_type": "bar", "available": True},
            {"item_id": "bar_2", "name": "Piña Colada", "description": "Coconut cream, pineapple juice, white rum", "price": 9.0, "category": "Cocktails", "menu_type": "bar", "available": True},
            {"item_id": "bar_3", "name": "Local Beer", "description": "Albanian craft beer", "price": 4.0, "category": "Beer", "menu_type": "bar", "available": True},
            {"item_id": "bar_4", "name": "Red Wine", "description": "Local Albanian red wine", "price": 6.0, "category": "Wine", "menu_type": "bar", "available": True},
            {"item_id": "bar_5", "name": "Espresso", "description": "Strong Italian coffee", "price": 2.5, "category": "Coffee", "menu_type": "bar", "available": True},
            {"item_id": "bar_6", "name": "Fresh Orange Juice", "description": "Freshly squeezed orange juice", "price": 3.5, "category": "Non-Alcoholic", "menu_type": "bar", "available": True},
            
            # Restaurant Menu
            {"item_id": "rest_1", "name": "Grilled Sea Bass", "description": "Fresh local sea bass with Mediterranean herbs", "price": 18.0, "category": "Main Course", "menu_type": "restaurant", "available": True},
            {"item_id": "rest_2", "name": "Albanian Byrek", "description": "Traditional Albanian pastry with cheese", "price": 8.0, "category": "Appetizer", "menu_type": "restaurant", "available": True},
            {"item_id": "rest_3", "name": "Tavë Kosi", "description": "Traditional Albanian baked lamb with yogurt", "price": 16.0, "category": "Main Course", "menu_type": "restaurant", "available": True},
            {"item_id": "rest_4", "name": "Greek Salad", "description": "Fresh tomatoes, cucumber, feta cheese, olives", "price": 9.0, "category": "Salad", "menu_type": "restaurant", "available": True},
            {"item_id": "rest_5", "name": "Grilled Vegetables", "description": "Seasonal vegetables grilled to perfection", "price": 10.0, "category": "Vegetarian", "menu_type": "restaurant", "available": True},
            {"item_id": "rest_6", "name": "Baklava", "description": "Traditional honey and nut pastry", "price": 6.0, "category": "Dessert", "menu_type": "restaurant", "available": True},
        ]
        menu_collection.insert_many(menu_items)

# Initialize data on startup
initialize_data()

# API Routes

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Hotel Ulin API"}

# Room and booking endpoints
@app.get("/api/rooms")
async def get_rooms():
    rooms = list(rooms_collection.find({}, {"_id": 0}))
    return {"rooms": rooms}

@app.get("/api/rooms/availability")
async def check_availability(check_in: str, check_out: str):
    # Simple availability check - in real implementation, would check against existing bookings
    available_rooms = list(rooms_collection.find({"available": True}, {"_id": 0}))
    return {"available_rooms": available_rooms, "check_in": check_in, "check_out": check_out}

@app.post("/api/bookings")
async def create_booking(booking_request: BookingRequest):
    booking_id = str(uuid.uuid4())
    
    # Calculate price (simplified - 1 night for now)
    room_price = 120.0  # Deluxe Beachfront room price
    total_price = room_price * 1  # Will calculate nights properly later
    
    booking = Booking(
        booking_id=booking_id,
        guest_name=booking_request.guest_name,
        guest_email=booking_request.guest_email,
        guest_phone=booking_request.guest_phone,
        check_in_date=booking_request.check_in_date,
        check_out_date=booking_request.check_out_date,
        room_type=booking_request.room_type,
        number_of_guests=booking_request.number_of_guests,
        special_requests=booking_request.special_requests,
        status="confirmed",
        created_at=datetime.now(),
        total_price=total_price
    )
    
    # Save to database
    result = bookings_collection.insert_one(booking.dict())
    
    if result.inserted_id:
        return {"message": "Booking created successfully", "booking_id": booking_id, "total_price": total_price}
    else:
        raise HTTPException(status_code=500, detail="Failed to create booking")

@app.get("/api/bookings")
async def get_bookings():
    bookings = list(bookings_collection.find({}, {"_id": 0}))
    return {"bookings": bookings}

@app.get("/api/bookings/{booking_id}")
async def get_booking(booking_id: str):
    booking = bookings_collection.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

# Menu endpoints
@app.get("/api/menu/{menu_type}")
async def get_menu(menu_type: str):
    if menu_type not in ["bar", "restaurant"]:
        raise HTTPException(status_code=400, detail="Invalid menu type")
    
    menu_items = list(menu_collection.find({"menu_type": menu_type, "available": True}, {"_id": 0}))
    
    # Group by category
    grouped_menu = {}
    for item in menu_items:
        category = item["category"]
        if category not in grouped_menu:
            grouped_menu[category] = []
        grouped_menu[category].append(item)
    
    return {"menu_type": menu_type, "menu": grouped_menu}

# QR Code generation
@app.get("/api/qr-code/{menu_type}")
async def generate_qr_code(menu_type: str, request: Request):
    if menu_type not in ["bar", "restaurant"]:
        raise HTTPException(status_code=400, detail="Invalid menu type")
    
    # Get the base URL from the request
    base_url = str(request.base_url).rstrip('/')
    order_url = f"{base_url}/order/{menu_type}"
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(order_url)
    qr.make(fit=True)
    
    # Create QR code image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return {
        "qr_code": f"data:image/png;base64,{img_str}",
        "url": order_url,
        "menu_type": menu_type
    }

# Order endpoints
@app.post("/api/orders")
async def create_order(order_request: OrderRequest):
    order_id = str(uuid.uuid4())
    
    # Calculate total amount
    total_amount = sum(item.price * item.quantity for item in order_request.items)
    
    order = Order(
        order_id=order_id,
        table_number=order_request.table_number,
        customer_name=order_request.customer_name,
        customer_phone=order_request.customer_phone,
        items=order_request.items,
        total_amount=total_amount,
        order_type=order_request.order_type,
        special_instructions=order_request.special_instructions,
        status="pending",
        created_at=datetime.now()
    )
    
    # Save to database
    result = orders_collection.insert_one(order.dict())
    
    if result.inserted_id:
        return {"message": "Order created successfully", "order_id": order_id, "total_amount": total_amount}
    else:
        raise HTTPException(status_code=500, detail="Failed to create order")

@app.get("/api/orders")
async def get_orders():
    orders = list(orders_collection.find({}, {"_id": 0}))
    return {"orders": orders}

@app.put("/api/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    result = orders_collection.update_one(
        {"order_id": order_id},
        {"$set": {"status": status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated successfully"}

@app.get("/api/orders/{order_id}")
async def get_order(order_id: str):
    order = orders_collection.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
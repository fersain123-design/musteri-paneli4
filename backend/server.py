from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from bson import ObjectId
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production-12345")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()

# Create the main app
app = FastAPI(title="Manavım API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: str
    role: str = "customer"  # customer, vendor, admin

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    
    class Config:
        populate_by_name = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class VendorProfile(BaseModel):
    user_id: str
    store_name: str
    store_description: Optional[str] = None
    store_image: Optional[str] = None  # base64
    address: str
    latitude: float
    longitude: float
    phone: str
    working_hours: Optional[str] = "09:00-22:00"
    delivery_options: List[str] = ["self", "platform"]  # self delivery or platform courier
    tax_document: Optional[str] = None  # Vergi levhası (base64)
    tax_number: Optional[str] = None  # Vergi numarası
    is_approved: bool = False
    rating: float = 0.0
    total_orders: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VendorProfileCreate(BaseModel):
    store_name: str
    store_description: Optional[str] = None
    store_image: Optional[str] = None
    address: str
    latitude: float
    longitude: float
    phone: str
    working_hours: Optional[str] = "09:00-22:00"
    delivery_options: List[str] = ["self", "platform"]
    tax_document: Optional[str] = None  # Vergi levhası (base64)
    tax_number: Optional[str] = None  # Vergi numarası

class Product(BaseModel):
    vendor_id: str
    name: str
    description: Optional[str] = None
    category: str  # fruits, vegetables, dairy, etc.
    price: float
    unit: str  # kg, piece, package
    stock: int
    images: List[str] = []  # base64 images
    is_available: bool = True
    discount_percentage: Optional[float] = 0.0
    quality_grade: Optional[str] = "A"  # A, B, C kalite
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    price: float
    unit: str
    stock: int
    images: List[str] = []
    is_available: bool = True
    discount_percentage: Optional[float] = 0.0
    quality_grade: Optional[str] = "A"  # A, B, C kalite

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    unit: Optional[str] = None
    stock: Optional[int] = None
    images: Optional[List[str]] = None
    is_available: Optional[bool] = None
    discount_percentage: Optional[float] = None

class CartItem(BaseModel):
    product_id: str
    quantity: int
    price: float

class Cart(BaseModel):
    user_id: str
    items: List[CartItem] = []
    total: float = 0.0
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    total: float

class Order(BaseModel):
    user_id: str
    vendor_id: str
    items: List[OrderItem]
    subtotal: float
    delivery_fee: float
    total: float
    delivery_address: str
    delivery_latitude: float
    delivery_longitude: float
    phone: str
    status: str = "pending"  # pending, accepted, preparing, ready, delivering, completed, cancelled
    delivery_type: str  # self, platform
    courier_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    vendor_id: str
    items: List[OrderItem]
    subtotal: float
    delivery_fee: float
    total: float
    delivery_address: str
    delivery_latitude: float
    delivery_longitude: float
    phone: str
    delivery_type: str
    notes: Optional[str] = None

class AddToCart(BaseModel):
    product_id: str
    quantity: int = 1

class UpdateCartItem(BaseModel):
    product_id: str
    quantity: int

class RemoveFromCart(BaseModel):
    product_id: str

# ============== HELPER FUNCTIONS ==============

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception
    
    # Add decoded token data to user object for easy access
    user["_id"] = str(user["_id"])
    user["role"] = user.get("role", "customer")
    return user

def require_role(allowed_roles: List[str]):
    """
    Dependency to check if current user has one of the allowed roles
    Usage: current_user: dict = Depends(require_role(["admin", "vendor"]))
    """
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role", "customer")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate role
    valid_roles = ["customer", "vendor", "admin"]
    if user_data.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
    
    # Create user
    user_dict = user_data.model_dump()
    user_dict["password"] = get_password_hash(user_data.password)
    user_dict["created_at"] = datetime.utcnow()
    user_dict["is_active"] = True
    
    result = await db.users.insert_one(user_dict)
    user_id = str(result.inserted_id)
    
    # Create access token with role
    access_token = create_access_token(data={
        "sub": user_id,
        "email": user_data.email,
        "role": user_data.role
    })
    
    # Return user data
    user_dict["_id"] = user_id
    del user_dict["password"]
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_dict["email"],
            "full_name": user_dict["full_name"],
            "phone": user_dict["phone"],
            "role": user_dict["role"],
            "is_active": user_dict["is_active"],
            "created_at": user_dict["created_at"]
        }
    }

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is inactive")
    
    user_id = str(user["_id"])
    user_role = user.get("role", "customer")
    user_email = user.get("email")
    
    # Create access token with role and email
    access_token = create_access_token(data={
        "sub": user_id,
        "email": user_email,
        "role": user_role
    })
    
    # Return structured user data
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_email,
            "full_name": user.get("full_name", ""),
            "phone": user.get("phone", ""),
            "role": user_role,
            "is_active": user.get("is_active", True),
            "created_at": user.get("created_at")
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ============== CUSTOMER ENDPOINTS ==============

@api_router.get("/products")
async def get_all_products(category: Optional[str] = None, search: Optional[str] = None, skip: int = 0, limit: int = 50):
    """
    Get all products (public or authenticated)
    Query params: category, search, skip, limit
    """
    query = {"is_available": True}
    
    if category:
        query["category"] = category
    
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    products = await db.products.find(query).skip(skip).limit(limit).to_list(limit)
    for product in products:
        product["_id"] = str(product["_id"])
    return products

@api_router.get("/products/{product_id}")
async def get_product_by_id(product_id: str):
    """Get single product by ID"""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID")
    
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product["_id"] = str(product["_id"])
    return product

@api_router.post("/orders")
async def create_order(order_data: OrderCreate, current_user: dict = Depends(require_role(["customer"]))):
    """
    Create new order (customer only)
    """
    order_dict = order_data.model_dump()
    order_dict["user_id"] = current_user["_id"]
    order_dict["status"] = "pending"
    order_dict["courier_id"] = None
    order_dict["created_at"] = datetime.utcnow()
    order_dict["updated_at"] = datetime.utcnow()
    
    result = await db.orders.insert_one(order_dict)
    order_dict["_id"] = str(result.inserted_id)
    
    # Clear cart after order
    await db.carts.update_one(
        {"user_id": current_user["_id"]},
        {"$set": {"items": [], "total": 0.0, "updated_at": datetime.utcnow()}}
    )
    
    # Update product stock
    for item in order_data.items:
        if ObjectId.is_valid(item.product_id):
            await db.products.update_one(
                {"_id": ObjectId(item.product_id)},
                {"$inc": {"stock": -item.quantity}}
            )
    
    return {
        "order_id": order_dict["_id"],
        "status": order_dict["status"],
        "total": order_dict["total"],
        "created_at": order_dict["created_at"]
    }

@api_router.get("/orders/my")
async def get_my_orders(current_user: dict = Depends(require_role(["customer"]))):
    """
    Get current user's orders (customer only)
    """
    orders = await db.orders.find({"user_id": current_user["_id"]}).sort("created_at", -1).to_list(100)
    for order in orders:
        order["_id"] = str(order["_id"])
    return orders

# ============== VENDOR ENDPOINTS ==============

@api_router.get("/vendor/products")
async def get_vendor_products(current_user: dict = Depends(require_role(["vendor", "admin"]))):
    """
    Get vendor's products (vendor and admin only)
    """
    # If admin, can see all products
    if current_user.get("role") == "admin":
        products = await db.products.find({}).to_list(100)
    else:
        # Find vendor's user_id in products (using role-based filtering)
        products = await db.products.find({"vendor_id": current_user["_id"]}).to_list(100)
    
    for product in products:
        product["_id"] = str(product["_id"])
    return products

@api_router.post("/vendor/products")
async def create_vendor_product(product: ProductCreate, current_user: dict = Depends(require_role(["vendor", "admin"]))):
    """
    Create new product (vendor and admin only)
    """
    product_dict = product.model_dump()
    product_dict["vendor_id"] = current_user["_id"]  # Store user_id as vendor_id
    product_dict["created_at"] = datetime.utcnow()
    product_dict["updated_at"] = datetime.utcnow()
    
    result = await db.products.insert_one(product_dict)
    product_dict["_id"] = str(result.inserted_id)
    
    return product_dict

@api_router.put("/vendor/products/{product_id}")
async def update_vendor_product(product_id: str, update_data: ProductUpdate, current_user: dict = Depends(require_role(["vendor", "admin"]))):
    """
    Update product (owner vendor or admin only)
    """
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID")
    
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check authorization: admin can edit all, vendor can only edit their own
    if current_user.get("role") != "admin":
        if product.get("vendor_id") != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to edit this product")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": update_dict})
    
    updated_product = await db.products.find_one({"_id": ObjectId(product_id)})
    updated_product["_id"] = str(updated_product["_id"])
    return updated_product

@api_router.get("/vendor/orders")
async def get_vendor_orders(current_user: dict = Depends(require_role(["vendor", "admin"]))):
    """
    Get vendor's orders (vendor and admin only)
    For now, returns all orders. In production, filter by vendor_id.
    """
    # If admin, show all orders
    if current_user.get("role") == "admin":
        orders = await db.orders.find({}).sort("created_at", -1).to_list(100)
    else:
        # For vendor, show orders related to their products
        # Simplified: showing all orders (in production, filter by vendor_id in order items)
        orders = await db.orders.find({}).sort("created_at", -1).to_list(100)
    
    for order in orders:
        order["_id"] = str(order["_id"])
    return orders

# ============== ADMIN ENDPOINTS ==============

@api_router.get("/admin/users")
async def get_all_users(current_user: dict = Depends(require_role(["admin"]))):
    """
    Get all users (admin only)
    """
    users = await db.users.find({}, {"password": 0}).to_list(1000)
    for user in users:
        user["_id"] = str(user["_id"])
    return users

@api_router.get("/admin/vendors")
async def get_all_vendors(current_user: dict = Depends(require_role(["admin"]))):
    """
    Get all vendor users (admin only)
    """
    vendors = await db.users.find({"role": "vendor"}, {"password": 0}).to_list(1000)
    for vendor in vendors:
        vendor["_id"] = str(vendor["_id"])
    return vendors

@api_router.get("/admin/statistics")
async def get_admin_statistics(current_user: dict = Depends(require_role(["admin"]))):
    """
    Get platform statistics (admin only)
    """
    # Count users
    total_users = await db.users.count_documents({})
    total_customers = await db.users.count_documents({"role": "customer"})
    total_vendors = await db.users.count_documents({"role": "vendor"})
    total_admins = await db.users.count_documents({"role": "admin"})
    
    # Count orders
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    completed_orders = await db.orders.count_documents({"status": "completed"})
    
    # Calculate revenue
    all_orders = await db.orders.find({"status": "completed"}).to_list(10000)
    total_revenue = sum(order.get("total", 0) for order in all_orders)
    
    # Count products
    total_products = await db.products.count_documents({})
    active_products = await db.products.count_documents({"is_available": True})
    
    return {
        "users": {
            "total": total_users,
            "customers": total_customers,
            "vendors": total_vendors,
            "admins": total_admins
        },
        "orders": {
            "total": total_orders,
            "pending": pending_orders,
            "completed": completed_orders
        },
        "revenue": {
            "total": round(total_revenue, 2),
            "currency": "TRY"
        },
        "products": {
            "total": total_products,
            "active": active_products
        }
    }

# ============== LEGACY VENDOR PROFILE ENDPOINTS (kept for backward compatibility) ==============

@api_router.post("/vendors/profile")
async def create_vendor_profile(profile: VendorProfileCreate, current_user: dict = Depends(get_current_user)):
    # Check if profile exists
    existing = await db.vendor_profiles.find_one({"user_id": current_user["_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Vendor profile already exists")
    
    profile_dict = profile.model_dump()
    profile_dict["user_id"] = current_user["_id"]
    profile_dict["is_approved"] = False
    profile_dict["rating"] = 0.0
    profile_dict["total_orders"] = 0
    profile_dict["created_at"] = datetime.utcnow()
    
    result = await db.vendor_profiles.insert_one(profile_dict)
    profile_dict["_id"] = str(result.inserted_id)
    
    return profile_dict

@api_router.get("/vendors/profile")
async def get_vendor_profile_by_user(current_user: dict = Depends(get_current_user)):
    profile = await db.vendor_profiles.find_one({"user_id": current_user["_id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    profile["_id"] = str(profile["_id"])
    return profile

@api_router.get("/vendors/nearby")
async def get_nearby_vendors(latitude: float, longitude: float, radius: float = 10.0):
    # Simple distance calculation (for production, use geospatial queries)
    vendors = await db.vendor_profiles.find({"is_approved": True}).to_list(100)
    
    nearby_vendors = []
    for vendor in vendors:
        # Calculate simple distance (this is approximate)
        lat_diff = abs(vendor["latitude"] - latitude)
        lon_diff = abs(vendor["longitude"] - longitude)
        distance = ((lat_diff ** 2) + (lon_diff ** 2)) ** 0.5
        
        if distance <= radius / 111:  # Rough conversion to degrees
            vendor["_id"] = str(vendor["_id"])
            vendor["distance"] = round(distance * 111, 2)  # Convert to km
            nearby_vendors.append(vendor)
    
    # Sort by distance
    nearby_vendors.sort(key=lambda x: x["distance"])
    return nearby_vendors

@api_router.get("/vendors/all")
async def get_all_vendors_list():
    vendors = await db.vendor_profiles.find({"is_approved": True}).to_list(100)
    for vendor in vendors:
        vendor["_id"] = str(vendor["_id"])
    return vendors

@api_router.get("/vendors/{vendor_id}")
async def get_vendor_by_id(vendor_id: str):
    if not ObjectId.is_valid(vendor_id):
        raise HTTPException(status_code=400, detail="Invalid vendor ID")
    
    vendor = await db.vendor_profiles.find_one({"_id": ObjectId(vendor_id)})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    vendor["_id"] = str(vendor["_id"])
    return vendor

# ============== CART ENDPOINTS ==============

@api_router.get("/cart")
async def get_cart(current_user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user["_id"]})
    if not cart:
        # Create empty cart
        cart = {
            "user_id": current_user["_id"],
            "items": [],
            "total": 0.0,
            "updated_at": datetime.utcnow()
        }
        result = await db.carts.insert_one(cart)
        cart["_id"] = str(result.inserted_id)
    else:
        cart["_id"] = str(cart["_id"])
    
    return cart

@api_router.post("/cart/add")
async def add_to_cart(item: AddToCart, current_user: dict = Depends(get_current_user)):
    # Get product
    if not ObjectId.is_valid(item.product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID")
    
    product = await db.products.find_one({"_id": ObjectId(item.product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not product.get("is_available", False):
        raise HTTPException(status_code=400, detail="Product is not available")
    
    if product.get("stock", 0) < item.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    # Get or create cart
    cart = await db.carts.find_one({"user_id": current_user["_id"]})
    if not cart:
        cart = {
            "user_id": current_user["_id"],
            "items": [],
            "total": 0.0,
            "updated_at": datetime.utcnow()
        }
        result = await db.carts.insert_one(cart)
        cart["_id"] = result.inserted_id
    
    # Check if item already in cart
    items = cart.get("items", [])
    found = False
    for cart_item in items:
        if cart_item["product_id"] == item.product_id:
            cart_item["quantity"] += item.quantity
            found = True
            break
    
    if not found:
        items.append({
            "product_id": item.product_id,
            "quantity": item.quantity,
            "price": product["price"]
        })
    
    # Calculate total
    total = sum(i["quantity"] * i["price"] for i in items)
    
    # Update cart
    await db.carts.update_one(
        {"_id": cart["_id"]},
        {"$set": {"items": items, "total": total, "updated_at": datetime.utcnow()}}
    )
    
    cart["items"] = items
    cart["total"] = total
    cart["_id"] = str(cart["_id"])
    
    return cart

@api_router.put("/cart/update")
async def update_cart_item(update: UpdateCartItem, current_user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user["_id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = cart.get("items", [])
    found = False
    
    for cart_item in items:
        if cart_item["product_id"] == update.product_id:
            if update.quantity <= 0:
                items.remove(cart_item)
            else:
                cart_item["quantity"] = update.quantity
            found = True
            break
    
    if not found:
        raise HTTPException(status_code=404, detail="Item not in cart")
    
    total = sum(i["quantity"] * i["price"] for i in items)
    
    await db.carts.update_one(
        {"_id": cart["_id"]},
        {"$set": {"items": items, "total": total, "updated_at": datetime.utcnow()}}
    )
    
    cart["items"] = items
    cart["total"] = total
    cart["_id"] = str(cart["_id"])
    
    return cart

@api_router.post("/cart/remove")
async def remove_from_cart(item: RemoveFromCart, current_user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user["_id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = cart.get("items", [])
    items = [i for i in items if i["product_id"] != item.product_id]
    
    total = sum(i["quantity"] * i["price"] for i in items)
    
    await db.carts.update_one(
        {"_id": cart["_id"]},
        {"$set": {"items": items, "total": total, "updated_at": datetime.utcnow()}}
    )
    
    cart["items"] = items
    cart["total"] = total
    cart["_id"] = str(cart["_id"])
    
    return cart

@api_router.delete("/cart/clear")
async def clear_cart(current_user: dict = Depends(get_current_user)):
    await db.carts.update_one(
        {"user_id": current_user["_id"]},
        {"$set": {"items": [], "total": 0.0, "updated_at": datetime.utcnow()}}
    )
    return {"message": "Cart cleared"}

# ============== ORDER ENDPOINTS ==============

@api_router.post("/orders")
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    order_dict = order_data.model_dump()
    order_dict["user_id"] = current_user["_id"]
    order_dict["status"] = "pending"
    order_dict["courier_id"] = None
    order_dict["created_at"] = datetime.utcnow()
    order_dict["updated_at"] = datetime.utcnow()
    
    result = await db.orders.insert_one(order_dict)
    order_dict["_id"] = str(result.inserted_id)
    
    # Clear cart after order
    await db.carts.update_one(
        {"user_id": current_user["_id"]},
        {"$set": {"items": [], "total": 0.0, "updated_at": datetime.utcnow()}}
    )
    
    # Update product stock
    for item in order_data.items:
        if ObjectId.is_valid(item.product_id):
            await db.products.update_one(
                {"_id": ObjectId(item.product_id)},
                {"$inc": {"stock": -item.quantity}}
            )
    
    return order_dict

@api_router.get("/orders")
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": current_user["_id"]}).sort("created_at", -1).to_list(100)
    for order in orders:
        order["_id"] = str(order["_id"])
    return orders

@api_router.get("/orders/vendor")
async def get_orders_for_vendor(current_user: dict = Depends(get_current_user)):
    vendor = await db.vendor_profiles.find_one({"user_id": current_user["_id"]})
    if not vendor:
        raise HTTPException(status_code=403, detail="Only vendors can access this")
    
    orders = await db.orders.find({"vendor_id": str(vendor["_id"])}).sort("created_at", -1).to_list(100)
    for order in orders:
        order["_id"] = str(order["_id"])
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(order_id):
        raise HTTPException(status_code=400, detail="Invalid order ID")
    
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check authorization
    if order["user_id"] != current_user["_id"]:
        vendor = await db.vendor_profiles.find_one({"user_id": current_user["_id"]})
        if not vendor or order["vendor_id"] != str(vendor["_id"]):
            raise HTTPException(status_code=403, detail="Not authorized")
    
    order["_id"] = str(order["_id"])
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(order_id):
        raise HTTPException(status_code=400, detail="Invalid order ID")
    
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Verify vendor
    vendor = await db.vendor_profiles.find_one({"user_id": current_user["_id"]})
    if not vendor or order["vendor_id"] != str(vendor["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    valid_statuses = ["pending", "accepted", "preparing", "ready", "delivering", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    
    order["status"] = status
    order["_id"] = str(order["_id"])
    return order

# ============== CATEGORIES ==============

@api_router.get("/categories")
async def get_categories():
    return [
        {"id": "fruits", "name": "Fruits", "icon": "🍎"},
        {"id": "vegetables", "name": "Vegetables", "icon": "🥕"},
        {"id": "dairy", "name": "Dairy", "icon": "🥛"},
        {"id": "meat", "name": "Meat & Poultry", "icon": "🍗"},
        {"id": "bakery", "name": "Bakery", "icon": "🍞"},
        {"id": "snacks", "name": "Snacks", "icon": "🍿"},
        {"id": "beverages", "name": "Beverages", "icon": "🥤"},
        {"id": "other", "name": "Other", "icon": "📦"},
    ]

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "Manavım API v1.0", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== PAYMENT MODELS ==============

class PaymentPackage(BaseModel):
    id: str
    name: str
    amount: float
    currency: str = "try"
    description: str

class CheckoutRequest(BaseModel):
    package_id: str
    origin_url: str

class CheckoutResponse(BaseModel):
    url: str
    session_id: str

class PaymentStatusResponse(BaseModel):
    status: str
    payment_status: str
    amount_total: float
    currency: str
    metadata: Dict[str, str]

# ============== PAYMENT ENDPOINTS ==============
# COMMENTED OUT DUE TO MISSING DEPENDENCIES

# # Define fixed payment packages (SECURITY: Never accept amounts from frontend)
# PAYMENT_PACKAGES = {
#     "small": PaymentPackage(
#         id="small",
#         name="Küçük Paket",
#         amount=50.00,
#         currency="try",
#         description="50 TL değerinde alışveriş"
#     ),
#     "medium": PaymentPackage(
#         id="medium",
#         name="Orta Paket",
#         amount=100.00,
#         currency="try",
#         description="100 TL değerinde alışveriş"
#     ),
#     "large": PaymentPackage(
#         id="large",
#         name="Büyük Paket",
#         amount=200.00,
#         currency="try",
#         description="200 TL değerinde alışveriş"
#     )
# }

# ============== VENDOR PANEL ENDPOINTS ==============

class VendorLogin(BaseModel):
    email: EmailStr
    password: str

class VendorDashboardResponse(BaseModel):
    total_orders_today: int
    total_revenue_today: float
    pending_orders: int
    total_products: int
    active_products: int
    low_stock_products: int
    total_orders_week: int
    total_revenue_week: float
    total_orders_month: int
    total_revenue_month: float
    recent_orders: List[Dict[str, Any]]

class VendorProductCreate(BaseModel):
    name: str
    category: str
    price: float
    unit: str
    stock: int
    description: Optional[str] = None
    image: Optional[str] = None
    discount_percentage: Optional[float] = 0
    is_available: bool = True

class VendorProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    unit: Optional[str] = None
    stock: Optional[int] = None
    description: Optional[str] = None
    image: Optional[str] = None
    discount_percentage: Optional[float] = None
    is_available: Optional[bool] = None

class VendorOrderStatusUpdate(BaseModel):
    status: str  # pending, preparing, on_the_way, delivered, cancelled

class VendorWorkingHours(BaseModel):
    monday: Dict[str, str]
    tuesday: Dict[str, str]
    wednesday: Dict[str, str]
    thursday: Dict[str, str]
    friday: Dict[str, str]
    saturday: Dict[str, str]
    sunday: Dict[str, str]
    holidays: List[str] = []


@api_router.post("/vendor/register")
async def vendor_register(vendor_data: VendorLogin):
    """Vendor registration endpoint"""
    try:
        # Check if vendor already exists
        existing_vendor = await db.vendors.find_one({"email": vendor_data.email})
        if existing_vendor:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        hashed_password = pwd_context.hash(vendor_data.password)
        
        # Create vendor
        new_vendor = {
            "email": vendor_data.email,
            "password": hashed_password,
            "name": vendor_data.email.split('@')[0],  # Default name from email
            "phone": "",
            "address": "",
            "description": "",
            "rating": 0.0,
            "is_open": True,
            "created_at": datetime.utcnow()
        }
        
        result = await db.vendors.insert_one(new_vendor)
        new_vendor["_id"] = result.inserted_id
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = jwt.encode(
            {
                "sub": str(result.inserted_id),
                "email": vendor_data.email,
                "type": "vendor",
                "exp": datetime.utcnow() + access_token_expires
            },
            SECRET_KEY,
            algorithm=ALGORITHM
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "vendor": {
                "_id": str(result.inserted_id),
                "name": new_vendor["name"],
                "email": new_vendor["email"],
                "phone": new_vendor.get("phone", ""),
                "address": new_vendor.get("address", "")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/vendor/login")
async def vendor_login(vendor_data: VendorLogin):
    """Vendor login endpoint"""
    try:
        # Find vendor by email
        vendor = await db.vendors.find_one({"email": vendor_data.email})
        
        if not vendor:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password (assuming vendors collection has password field)
        if not vendor.get("password"):
            # If vendor doesn't have password, create one (temporary solution)
            hashed_password = pwd_context.hash("vendor123")
            await db.vendors.update_one(
                {"_id": vendor["_id"]},
                {"$set": {"password": hashed_password}}
            )
            vendor["password"] = hashed_password
        
        if not pwd_context.verify(vendor_data.password, vendor["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = jwt.encode(
            {
                "sub": str(vendor["_id"]),
                "email": vendor["email"],
                "type": "vendor",
                "exp": datetime.utcnow() + access_token_expires
            },
            SECRET_KEY,
            algorithm=ALGORITHM
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "vendor": {
                "_id": str(vendor["_id"]),
                "name": vendor.get("name"),
                "email": vendor.get("email"),
                "address": vendor.get("address"),
                "phone": vendor.get("phone")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in vendor login: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def verify_vendor_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify vendor JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        vendor_id = payload.get("sub")
        token_type = payload.get("type")
        
        if token_type != "vendor":
            raise HTTPException(status_code=403, detail="Not a vendor account")
        
        if vendor_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        vendor = await db.vendors.find_one({"_id": ObjectId(vendor_id)})
        if vendor is None:
            raise HTTPException(status_code=401, detail="Vendor not found")
        
        return vendor
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.get("/vendor/dashboard", response_model=VendorDashboardResponse)
async def get_vendor_dashboard(vendor = Depends(verify_vendor_token)):
    """Get vendor dashboard statistics"""
    try:
        vendor_id = str(vendor["_id"])
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Get all products for this vendor
        products = await db.products.find({"vendor_id": vendor_id}).to_list(None)
        total_products = len(products)
        active_products = len([p for p in products if p.get("is_available", True)])
        low_stock_products = len([p for p in products if p.get("stock", 0) < 10])
        
        # Get orders (simplified - in real scenario, you'd filter by vendor's products)
        all_orders = await db.orders.find().to_list(None)
        
        # Filter orders that contain vendor's products
        vendor_product_ids = [str(p["_id"]) for p in products]
        vendor_orders = []
        for order in all_orders:
            for item in order.get("items", []):
                if item.get("product_id") in vendor_product_ids:
                    vendor_orders.append(order)
                    break
        
        # Today's stats
        orders_today = [o for o in vendor_orders if o.get("created_at", datetime.min) >= today]
        total_orders_today = len(orders_today)
        total_revenue_today = sum(o.get("total", 0) for o in orders_today)
        pending_orders = len([o for o in vendor_orders if o.get("status") == "pending"])
        
        # Week stats
        orders_week = [o for o in vendor_orders if o.get("created_at", datetime.min) >= week_ago]
        total_orders_week = len(orders_week)
        total_revenue_week = sum(o.get("total", 0) for o in orders_week)
        
        # Month stats
        orders_month = [o for o in vendor_orders if o.get("created_at", datetime.min) >= month_ago]
        total_orders_month = len(orders_month)
        total_revenue_month = sum(o.get("total", 0) for o in orders_month)
        
        # Recent orders (last 5)
        recent_orders = sorted(vendor_orders, key=lambda x: x.get("created_at", datetime.min), reverse=True)[:5]
        recent_orders_formatted = []
        for order in recent_orders:
            recent_orders_formatted.append({
                "_id": str(order["_id"]),
                "order_number": order.get("order_number", "N/A"),
                "customer_name": order.get("customer_name", "Unknown"),
                "total": order.get("total", 0),
                "status": order.get("status", "pending"),
                "created_at": order.get("created_at", datetime.utcnow()).isoformat()
            })
        
        return VendorDashboardResponse(
            total_orders_today=total_orders_today,
            total_revenue_today=total_revenue_today,
            pending_orders=pending_orders,
            total_products=total_products,
            active_products=active_products,
            low_stock_products=low_stock_products,
            total_orders_week=total_orders_week,
            total_revenue_week=total_revenue_week,
            total_orders_month=total_orders_month,
            total_revenue_month=total_revenue_month,
            recent_orders=recent_orders_formatted
        )
        
    except Exception as e:
        logger.error(f"Error getting vendor dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/vendor/products")
async def get_vendor_all_products(vendor = Depends(verify_vendor_token)):
    """Get all products for vendor (vendor API)"""
    try:
        vendor_id = str(vendor["_id"])
        products = await db.products.find({"vendor_id": vendor_id}).to_list(None)
        
        # Format products
        formatted_products = []
        for product in products:
            formatted_products.append({
                "_id": str(product["_id"]),
                "name": product.get("name"),
                "category": product.get("category"),
                "price": product.get("price"),
                "unit": product.get("unit"),
                "stock": product.get("stock", 0),
                "description": product.get("description"),
                "image": product.get("image"),
                "discount_percentage": product.get("discount_percentage", 0),
                "is_available": product.get("is_available", True),
                "created_at": product.get("created_at", datetime.utcnow()).isoformat()
            })
        
        return formatted_products
        
    except Exception as e:
        logger.error(f"Error getting vendor products: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/vendor/products")
async def create_vendor_product(product_data: VendorProductCreate, vendor = Depends(verify_vendor_token)):
    """Create new product for vendor"""
    try:
        vendor_id = str(vendor["_id"])
        
        product = {
            "vendor_id": vendor_id,
            "name": product_data.name,
            "category": product_data.category,
            "price": product_data.price,
            "unit": product_data.unit,
            "stock": product_data.stock,
            "description": product_data.description,
            "image": product_data.image,
            "discount_percentage": product_data.discount_percentage,
            "is_available": product_data.is_available,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.products.insert_one(product)
        product["_id"] = str(result.inserted_id)
        
        return product
        
    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/vendor/products/{product_id}")
async def update_vendor_product(
    product_id: str,
    product_data: VendorProductUpdate,
    vendor = Depends(verify_vendor_token)
):
    """Update vendor product"""
    try:
        vendor_id = str(vendor["_id"])
        
        # Verify product belongs to vendor
        product = await db.products.find_one({"_id": ObjectId(product_id), "vendor_id": vendor_id})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Build update dict
        update_data = {}
        if product_data.name is not None:
            update_data["name"] = product_data.name
        if product_data.category is not None:
            update_data["category"] = product_data.category
        if product_data.price is not None:
            update_data["price"] = product_data.price
        if product_data.unit is not None:
            update_data["unit"] = product_data.unit
        if product_data.stock is not None:
            update_data["stock"] = product_data.stock
        if product_data.description is not None:
            update_data["description"] = product_data.description
        if product_data.image is not None:
            update_data["image"] = product_data.image
        if product_data.discount_percentage is not None:
            update_data["discount_percentage"] = product_data.discount_percentage
        if product_data.is_available is not None:
            update_data["is_available"] = product_data.is_available
        
        update_data["updated_at"] = datetime.utcnow()
        
        await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_data}
        )
        
        updated_product = await db.products.find_one({"_id": ObjectId(product_id)})
        updated_product["_id"] = str(updated_product["_id"])
        
        return updated_product
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/vendor/products/{product_id}")
async def delete_vendor_product(product_id: str, vendor = Depends(verify_vendor_token)):
    """Delete vendor product"""
    try:
        vendor_id = str(vendor["_id"])
        
        # Verify product belongs to vendor
        product = await db.products.find_one({"_id": ObjectId(product_id), "vendor_id": vendor_id})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        await db.products.delete_one({"_id": ObjectId(product_id)})
        
        return {"message": "Product deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/vendor/orders")
async def get_vendor_all_orders(vendor = Depends(verify_vendor_token), status: Optional[str] = None):
    """Get all orders for vendor (vendor API)"""
    try:
        vendor_id = str(vendor["_id"])
        
        # Get vendor's products
        products = await db.products.find({"vendor_id": vendor_id}).to_list(None)
        vendor_product_ids = [str(p["_id"]) for p in products]
        
        # Get all orders
        all_orders = await db.orders.find().to_list(None)
        
        # Filter orders containing vendor's products
        vendor_orders = []
        for order in all_orders:
            for item in order.get("items", []):
                if item.get("product_id") in vendor_product_ids:
                    # Filter by status if provided
                    if status is None or order.get("status") == status:
                        vendor_orders.append(order)
                    break
        
        # Format orders
        formatted_orders = []
        for order in vendor_orders:
            formatted_orders.append({
                "_id": str(order["_id"]),
                "order_number": order.get("order_number", "N/A"),
                "customer_name": order.get("customer_name", "Unknown"),
                "customer_phone": order.get("customer_phone", "N/A"),
                "delivery_address": order.get("delivery_address", {}),
                "items": order.get("items", []),
                "total": order.get("total", 0),
                "status": order.get("status", "pending"),
                "notes": order.get("notes", ""),
                "created_at": order.get("created_at", datetime.utcnow()).isoformat(),
                "updated_at": order.get("updated_at", datetime.utcnow()).isoformat()
            })
        
        # Sort by created_at descending
        formatted_orders.sort(key=lambda x: x["created_at"], reverse=True)
        
        return formatted_orders
        
    except Exception as e:
        logger.error(f"Error getting vendor orders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/vendor/orders/{order_id}/status")
async def update_vendor_order_status(
    order_id: str,
    status_data: VendorOrderStatusUpdate,
    vendor = Depends(verify_vendor_token)
):
    """Update order status"""
    try:
        # Verify order exists
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Update order status
        await db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {
                "$set": {
                    "status": status_data.status,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"message": "Order status updated successfully", "status": status_data.status}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating order status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/vendor/profile")
async def get_current_vendor_profile(vendor = Depends(verify_vendor_token)):
    """Get current vendor profile (vendor API)"""
    try:
        return {
            "_id": str(vendor["_id"]),
            "name": vendor.get("name"),
            "email": vendor.get("email"),
            "phone": vendor.get("phone"),
            "address": vendor.get("address"),
            "description": vendor.get("description"),
            "rating": vendor.get("rating", 0),
            "working_hours": vendor.get("working_hours", {}),
            "is_open": vendor.get("is_open", True)
        }
    except Exception as e:
        logger.error(f"Error getting vendor profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/vendor/profile")
async def update_vendor_profile(profile_data: Dict[str, Any], vendor = Depends(verify_vendor_token)):
    """Update vendor profile"""
    try:
        vendor_id = vendor["_id"]
        
        # Build update dict
        update_data = {}
        allowed_fields = ["name", "phone", "address", "description", "working_hours", "is_open"]
        
        for field in allowed_fields:
            if field in profile_data:
                update_data[field] = profile_data[field]
        
        update_data["updated_at"] = datetime.utcnow()
        
        await db.vendors.update_one(
            {"_id": vendor_id},
            {"$set": update_data}
        )
        
        updated_vendor = await db.vendors.find_one({"_id": vendor_id})
        
        return {
            "_id": str(updated_vendor["_id"]),
            "name": updated_vendor.get("name"),
            "email": updated_vendor.get("email"),
            "phone": updated_vendor.get("phone"),
            "address": updated_vendor.get("address"),
            "description": updated_vendor.get("description"),
            "working_hours": updated_vendor.get("working_hours", {}),
            "is_open": updated_vendor.get("is_open", True)
        }
        
    except Exception as e:
        logger.error(f"Error updating vendor profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include router AFTER all endpoints are defined
app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

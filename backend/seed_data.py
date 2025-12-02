"""
Seed data script to populate the database with test data
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_database():
    print("🌱 Starting database seeding...")
    
    # Clear existing data
    print("🗑️  Clearing existing data...")
    await db.users.delete_many({})
    await db.vendor_profiles.delete_many({})
    await db.products.delete_many({})
    await db.orders.delete_many({})
    await db.carts.delete_many({})
    
    # Create test users
    print("👤 Creating users...")
    users = []
    
    # Regular customer
    customer_user = {
        "email": "customer@test.com",
        "password": pwd_context.hash("test123"),
        "full_name": "Ahmet Yılmaz",
        "phone": "05551234567",
        "role": "customer",
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    customer_result = await db.users.insert_one(customer_user)
    users.append(str(customer_result.inserted_id))
    print(f"✅ Customer created: customer@test.com / test123")
    
    # Vendor users
    vendor_users_data = [
        {
            "email": "manav1@test.com",
            "password": pwd_context.hash("test123"),
            "full_name": "Ali Manav",
            "phone": "05551111111",
            "role": "vendor",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "email": "manav2@test.com",
            "password": pwd_context.hash("test123"),
            "full_name": "Mehmet Sebzeci",
            "phone": "05552222222",
            "role": "vendor",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "email": "manav3@test.com",
            "password": pwd_context.hash("test123"),
            "full_name": "Ayşe Meyve",
            "phone": "05553333333",
            "role": "vendor",
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    vendor_user_ids = []
    for vendor_user in vendor_users_data:
        result = await db.users.insert_one(vendor_user)
        vendor_user_ids.append(str(result.inserted_id))
        print(f"✅ Vendor user created: {vendor_user['email']} / test123")
    
    # Create vendor profiles
    print("🏪 Creating vendor profiles...")
    vendor_profiles_data = [
        {
            "user_id": vendor_user_ids[0],
            "store_name": "Taze Meyve & Sebze",
            "store_description": "En taze meyveler ve sebzeler burada!",
            "address": "Kadıköy, İstanbul",
            "latitude": 40.9833,
            "longitude": 29.0333,
            "phone": "05551111111",
            "working_hours": "08:00-22:00",
            "delivery_options": ["self", "platform"],
            "is_approved": True,
            "rating": 4.5,
            "total_orders": 150,
            "created_at": datetime.utcnow()
        },
        {
            "user_id": vendor_user_ids[1],
            "store_name": "Organik Manav",
            "store_description": "100% organik ürünler",
            "address": "Beşiktaş, İstanbul",
            "latitude": 41.0422,
            "longitude": 29.0086,
            "phone": "05552222222",
            "working_hours": "09:00-21:00",
            "delivery_options": ["platform"],
            "is_approved": True,
            "rating": 4.8,
            "total_orders": 200,
            "created_at": datetime.utcnow()
        },
        {
            "user_id": vendor_user_ids[2],
            "store_name": "Köy Pazarı",
            "store_description": "Köyden şehre taze lezzetler",
            "address": "Üsküdar, İstanbul",
            "latitude": 41.0214,
            "longitude": 29.0627,
            "phone": "05553333333",
            "working_hours": "07:00-20:00",
            "delivery_options": ["self", "platform"],
            "is_approved": True,
            "rating": 4.3,
            "total_orders": 120,
            "created_at": datetime.utcnow()
        }
    ]
    
    vendor_ids = []
    for vendor_profile in vendor_profiles_data:
        result = await db.vendor_profiles.insert_one(vendor_profile)
        vendor_ids.append(str(result.inserted_id))
        print(f"✅ Vendor profile created: {vendor_profile['store_name']}")
    
    # Create products
    print("🛒 Creating products...")
    products_data = [
        # Vendor 1 - Taze Meyve & Sebze
        {
            "vendor_id": vendor_ids[0],
            "name": "Domates",
            "description": "Taze domates, kilosu",
            "category": "vegetables",
            "price": 25.50,
            "unit": "kg",
            "stock": 50,
            "images": [],
            "is_available": True,
            "discount_percentage": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "vendor_id": vendor_ids[0],
            "name": "Salatalık",
            "description": "Taze salatalık",
            "category": "vegetables",
            "price": 15.00,
            "unit": "kg",
            "stock": 40,
            "images": [],
            "is_available": True,
            "discount_percentage": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "vendor_id": vendor_ids[0],
            "name": "Elma",
            "description": "Amasya elması",
            "category": "fruits",
            "price": 35.00,
            "unit": "kg",
            "stock": 30,
            "images": [],
            "is_available": True,
            "discount_percentage": 10,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "vendor_id": vendor_ids[0],
            "name": "Muz",
            "description": "Ekvator muzu",
            "category": "fruits",
            "price": 45.00,
            "unit": "kg",
            "stock": 25,
            "images": [],
            "is_available": True,
            "discount_percentage": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        # Vendor 2 - Organik Manav
        {
            "vendor_id": vendor_ids[1],
            "name": "Organik Domates",
            "description": "100% organik domates",
            "category": "vegetables",
            "price": 40.00,
            "unit": "kg",
            "stock": 20,
            "images": [],
            "is_available": True,
            "discount_percentage": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "vendor_id": vendor_ids[1],
            "name": "Organik Marul",
            "description": "Taze organik marul",
            "category": "vegetables",
            "price": 20.00,
            "unit": "adet",
            "stock": 35,
            "images": [],
            "is_available": True,
            "discount_percentage": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "vendor_id": vendor_ids[1],
            "name": "Organik Portakal",
            "description": "Vitamin deposu",
            "category": "fruits",
            "price": 50.00,
            "unit": "kg",
            "stock": 15,
            "images": [],
            "is_available": True,
            "discount_percentage": 15,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "vendor_id": vendor_ids[1],
            "name": "Organik Ispanak",
            "description": "Demirden zengin",
            "category": "vegetables",
            "price": 30.00,
            "unit": "kg",
            "stock": 10,
            "images": [],
            "is_available": True,
            "discount_percentage": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        # Vendor 3 - Köy Pazarı
        {
            "vendor_id": vendor_ids[2],
            "name": "Köy Yumurtası",
            "description": "Köy yumurtası, 10'lu",
            "category": "dairy",
            "price": 60.00,
            "unit": "paket",
            "stock": 50,
            "images": [],
            "is_available": True,
            "discount_percentage": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "vendor_id": vendor_ids[2],
            "name": "Köy Peyniri",
            "description": "El yapımı peynir",
            "category": "dairy",
            "price": 180.00,
            "unit": "kg",
            "stock": 8,
            "images": [],
            "is_available": True,
            "discount_percentage": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "vendor_id": vendor_ids[2],
            "name": "Taze Fasulye",
            "description": "Köyden taze fasulye",
            "category": "vegetables",
            "price": 55.00,
            "unit": "kg",
            "stock": 12,
            "images": [],
            "is_available": True,
            "discount_percentage": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "vendor_id": vendor_ids[2],
            "name": "Karpuz",
            "description": "Diyarbakır karpuzu",
            "category": "fruits",
            "price": 20.00,
            "unit": "kg",
            "stock": 30,
            "images": [],
            "is_available": True,
            "discount_percentage": 20,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    for product in products_data:
        await db.products.insert_one(product)
        print(f"✅ Product created: {product['name']} - {product['price']} TL/{product['unit']}")
    
    print("\n✨ Database seeding completed!")
    print("\n📝 Test credentials:")
    print("   Customer: customer@test.com / test123")
    print("   Vendor 1: manav1@test.com / test123")
    print("   Vendor 2: manav2@test.com / test123")
    print("   Vendor 3: manav3@test.com / test123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())

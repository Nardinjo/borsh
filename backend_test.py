import requests
import unittest
import json
from datetime import datetime, timedelta

class HotelUlinAPITest(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(HotelUlinAPITest, self).__init__(*args, **kwargs)
        # Use the public endpoint from the frontend .env file
        self.base_url = "https://ab0edb74-8d70-40c1-a141-f9b8ed0a01de.preview.emergentagent.com"
        self.headers = {'Content-Type': 'application/json'}
        self.test_booking_id = None
        self.test_order_id = None

    def test_01_health_check(self):
        """Test the health check endpoint"""
        print("\n🔍 Testing health check endpoint...")
        response = requests.get(f"{self.base_url}/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['service'], 'Hotel Ulin API')
        print("✅ Health check endpoint test passed")

    def test_02_get_rooms(self):
        """Test getting all rooms"""
        print("\n🔍 Testing get rooms endpoint...")
        response = requests.get(f"{self.base_url}/api/rooms")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('rooms', data)
        self.assertTrue(len(data['rooms']) > 0)
        print(f"✅ Get rooms endpoint test passed - Found {len(data['rooms'])} rooms")

    def test_03_create_booking(self):
        """Test creating a booking"""
        print("\n🔍 Testing create booking endpoint...")
        # Generate dates for check-in and check-out
        check_in = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
        check_out = (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d')
        
        booking_data = {
            "guest_name": "John Doe",
            "guest_email": "john@example.com",
            "guest_phone": "+355123456789",
            "check_in_date": check_in,
            "check_out_date": check_out,
            "room_type": "Deluxe Beachfront",
            "number_of_guests": 2,
            "special_requests": "Early check-in if possible"
        }
        
        response = requests.post(
            f"{self.base_url}/api/bookings", 
            headers=self.headers,
            json=booking_data
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('booking_id', data)
        self.assertIn('total_price', data)
        self.test_booking_id = data['booking_id']
        print(f"✅ Create booking endpoint test passed - Booking ID: {self.test_booking_id}")

    def test_04_get_bookings(self):
        """Test getting all bookings"""
        print("\n🔍 Testing get bookings endpoint...")
        response = requests.get(f"{self.base_url}/api/bookings")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('bookings', data)
        self.assertTrue(len(data['bookings']) > 0)
        print(f"✅ Get bookings endpoint test passed - Found {len(data['bookings'])} bookings")

    def test_05_get_bar_menu(self):
        """Test getting the bar menu"""
        print("\n🔍 Testing get bar menu endpoint...")
        response = requests.get(f"{self.base_url}/api/menu/bar")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['menu_type'], 'bar')
        self.assertIn('menu', data)
        self.assertTrue(len(data['menu']) > 0)
        print(f"✅ Get bar menu endpoint test passed - Found {len(data['menu'])} categories")

    def test_06_get_restaurant_menu(self):
        """Test getting the restaurant menu"""
        print("\n🔍 Testing get restaurant menu endpoint...")
        response = requests.get(f"{self.base_url}/api/menu/restaurant")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['menu_type'], 'restaurant')
        self.assertIn('menu', data)
        self.assertTrue(len(data['menu']) > 0)
        print(f"✅ Get restaurant menu endpoint test passed - Found {len(data['menu'])} categories")

    def test_07_generate_bar_qr_code(self):
        """Test generating QR code for bar"""
        print("\n🔍 Testing generate bar QR code endpoint...")
        response = requests.get(f"{self.base_url}/api/qr-code/bar")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('qr_code', data)
        self.assertIn('url', data)
        self.assertEqual(data['menu_type'], 'bar')
        print("✅ Generate bar QR code endpoint test passed")

    def test_08_generate_restaurant_qr_code(self):
        """Test generating QR code for restaurant"""
        print("\n🔍 Testing generate restaurant QR code endpoint...")
        response = requests.get(f"{self.base_url}/api/qr-code/restaurant")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('qr_code', data)
        self.assertIn('url', data)
        self.assertEqual(data['menu_type'], 'restaurant')
        print("✅ Generate restaurant QR code endpoint test passed")

    def test_09_create_order(self):
        """Test creating an order"""
        print("\n🔍 Testing create order endpoint...")
        # First, get menu items to use in the order
        response = requests.get(f"{self.base_url}/api/menu/bar")
        self.assertEqual(response.status_code, 200)
        menu_data = response.json()
        
        # Get the first item from each category
        items = []
        for category, category_items in menu_data['menu'].items():
            if category_items:
                item = category_items[0]
                items.append({
                    "item_id": item['item_id'],
                    "name": item['name'],
                    "price": item['price'],
                    "quantity": 2
                })
                if len(items) >= 2:  # Just get 2 items for testing
                    break
        
        order_data = {
            "table_number": "12",
            "customer_name": "John Doe",
            "customer_phone": "+355123456789",
            "items": items,
            "order_type": "bar",
            "special_instructions": "Extra ice in drinks"
        }
        
        response = requests.post(
            f"{self.base_url}/api/orders", 
            headers=self.headers,
            json=order_data
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('order_id', data)
        self.assertIn('total_amount', data)
        self.test_order_id = data['order_id']
        print(f"✅ Create order endpoint test passed - Order ID: {self.test_order_id}")

    def test_10_get_orders(self):
        """Test getting all orders"""
        print("\n🔍 Testing get orders endpoint...")
        response = requests.get(f"{self.base_url}/api/orders")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('orders', data)
        self.assertTrue(len(data['orders']) > 0)
        print(f"✅ Get orders endpoint test passed - Found {len(data['orders'])} orders")

    def run_all_tests(self):
        """Run all tests in sequence"""
        test_methods = [method for method in dir(self) if method.startswith('test_')]
        test_methods.sort()  # Ensure tests run in order
        
        print("\n🔍 Starting Hotel Ulin API Tests...")
        print("=" * 50)
        
        success_count = 0
        for method in test_methods:
            try:
                getattr(self, method)()
                success_count += 1
            except Exception as e:
                print(f"❌ {method} failed: {str(e)}")
        
        print("=" * 50)
        print(f"📊 Tests completed: {success_count}/{len(test_methods)} passed")
        return success_count == len(test_methods)

if __name__ == "__main__":
    tester = HotelUlinAPITest()
    tester.run_all_tests()
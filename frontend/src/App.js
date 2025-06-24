import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [bookingData, setBookingData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in_date: '',
    check_out_date: '',
    room_type: 'Deluxe Beachfront',
    number_of_guests: 1,
    special_requests: ''
  });
  const [barMenu, setBarMenu] = useState({});
  const [restaurantMenu, setRestaurantMenu] = useState({});
  const [currentOrder, setCurrentOrder] = useState([]);
  const [orderType, setOrderType] = useState('bar');
  const [qrCode, setQrCode] = useState('');
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderCustomer, setOrderCustomer] = useState({
    table_number: '',
    customer_name: '',
    customer_phone: ''
  });

  useEffect(() => {
    fetchMenus();
    if (currentPage === 'admin') {
      fetchBookings();
      fetchOrders();
    }
  }, [currentPage]);

  const fetchMenus = async () => {
    try {
      const [barResponse, restaurantResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/menu/bar`),
        fetch(`${API_BASE_URL}/api/menu/restaurant`)
      ]);
      
      if (barResponse.ok && restaurantResponse.ok) {
        const barData = await barResponse.json();
        const restaurantData = await restaurantResponse.json();
        setBarMenu(barData.menu);
        setRestaurantMenu(restaurantData.menu);
      }
    } catch (error) {
      console.error('Error fetching menus:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const generateQRCode = async (menuType) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/qr-code/${menuType}`);
      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qr_code);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Booking confirmed! Booking ID: ${result.booking_id}\nTotal: €${result.total_price}`);
        setBookingData({
          guest_name: '',
          guest_email: '',
          guest_phone: '',
          check_in_date: '',
          check_out_date: '',
          room_type: 'Deluxe Beachfront',
          number_of_guests: 1,
          special_requests: ''
        });
      } else {
        alert('Booking failed. Please try again.');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Booking failed. Please try again.');
    }
  };

  const addToOrder = (item) => {
    const existingItem = currentOrder.find(orderItem => orderItem.item_id === item.item_id);
    if (existingItem) {
      setCurrentOrder(currentOrder.map(orderItem =>
        orderItem.item_id === item.item_id
          ? { ...orderItem, quantity: orderItem.quantity + 1 }
          : orderItem
      ));
    } else {
      setCurrentOrder([...currentOrder, { ...item, quantity: 1 }]);
    }
  };

  const removeFromOrder = (itemId) => {
    setCurrentOrder(currentOrder.filter(item => item.item_id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity === 0) {
      removeFromOrder(itemId);
    } else {
      setCurrentOrder(currentOrder.map(item =>
        item.item_id === itemId ? { ...item, quantity } : item
      ));
    }
  };

  const submitOrder = async () => {
    if (currentOrder.length === 0) {
      alert('Please add items to your order');
      return;
    }

    try {
      const orderRequest = {
        table_number: orderCustomer.table_number,
        customer_name: orderCustomer.customer_name,
        customer_phone: orderCustomer.customer_phone,
        items: currentOrder.map(item => ({
          item_id: item.item_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        order_type: orderType,
        special_instructions: ''
      };

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderRequest),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Order submitted successfully! Order ID: ${result.order_id}\nTotal: €${result.total_amount}`);
        setCurrentOrder([]);
        setOrderCustomer({ table_number: '', customer_name: '', customer_phone: '' });
      } else {
        alert('Order failed. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Order failed. Please try again.');
    }
  };

  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1645990097585-947bbb879c12')`
          }}
        ></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-6xl font-serif font-bold mb-4">Hotel Ulin</h1>
          <p className="text-2xl mb-6">4-Star Beachfront Paradise in Borsh, Albania</p>
          <p className="text-xl mb-8">Experience luxury by the sea with world-class amenities</p>
          <button 
            onClick={() => setCurrentPage('booking')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition duration-300"
          >
            Book Your Stay
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-serif text-center mb-12 text-gray-800">Experience Hotel Ulin</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <img 
                src="https://images.unsplash.com/photo-1540541338287-41700207dee6" 
                alt="Beachfront Location" 
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <h3 className="text-2xl font-semibold mb-2">Beachfront Location</h3>
              <p className="text-gray-600">Direct access to pristine beaches with crystal clear waters</p>
            </div>
            <div className="text-center">
              <img 
                src="https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg" 
                alt="Swimming Pool" 
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <h3 className="text-2xl font-semibold mb-2">Swimming Pool</h3>
              <p className="text-gray-600">Relax in our infinity pool overlooking the sea</p>
            </div>
            <div className="text-center">
              <img 
                src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304" 
                alt="Luxury Rooms" 
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <h3 className="text-2xl font-semibold mb-2">Luxury Rooms</h3>
              <p className="text-gray-600">12 beautifully appointed rooms with sea views</p>
            </div>
          </div>
        </div>
      </div>

      {/* Amenities Section */}
      <div className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-serif mb-8 text-gray-800">Hotel Amenities</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="text-blue-600 text-4xl">🏖️</div>
              <div>
                <h3 className="text-xl font-semibold">Private Beach Access</h3>
                <p className="text-gray-600">Exclusive beachfront location</p>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <div className="text-blue-600 text-4xl">🏊</div>
              <div>
                <h3 className="text-xl font-semibold">Swimming Pool</h3>
                <p className="text-gray-600">Infinity pool with sea views</p>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <div className="text-blue-600 text-4xl">🍽️</div>
              <div>
                <h3 className="text-xl font-semibold">Restaurant & Bar</h3>
                <p className="text-gray-600">Local and international cuisine</p>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <div className="text-blue-600 text-4xl">📱</div>
              <div>
                <h3 className="text-xl font-semibold">QR Code Ordering</h3>
                <p className="text-gray-600">Convenient mobile ordering</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-serif mb-8 text-gray-800">Contact Us</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Visit Us</h3>
              <p className="text-gray-600 mb-2">Borsh Beach, Albania</p>
              <p className="text-gray-600 mb-4">4-Star Beachfront Hotel</p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4">Book Now</h3>
              <p className="text-gray-600 mb-2">Email: booking@hotelulin.com</p>
              <p className="text-gray-600 mb-4">Experience luxury by the sea</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const BookingPage = () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-serif mb-6 text-center">Book Your Stay at Hotel Ulin</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <img 
                src="https://images.pexels.com/photos/2598638/pexels-photo-2598638.jpeg" 
                alt="Hotel Room View" 
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-2">Deluxe Beachfront Room</h3>
                <p className="text-gray-600 mb-2">• Sea view from private balcony</p>
                <p className="text-gray-600 mb-2">• King size bed with premium linens</p>
                <p className="text-gray-600 mb-2">• Modern bathroom with rainfall shower</p>
                <p className="text-gray-600 mb-2">• Mini-bar and coffee station</p>
                <p className="text-2xl font-bold text-blue-600 mt-4">€120 / night</p>
              </div>
            </div>
            
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
                <input
                  type="text"
                  required
                  value={bookingData.guest_name}
                  onChange={(e) => setBookingData({...bookingData, guest_name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={bookingData.guest_email}
                  onChange={(e) => setBookingData({...bookingData, guest_email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={bookingData.guest_phone}
                  onChange={(e) => setBookingData({...bookingData, guest_phone: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
                  <input
                    type="date"
                    required
                    value={bookingData.check_in_date}
                    onChange={(e) => setBookingData({...bookingData, check_in_date: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
                  <input
                    type="date"
                    required
                    value={bookingData.check_out_date}
                    onChange={(e) => setBookingData({...bookingData, check_out_date: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
                <select
                  value={bookingData.number_of_guests}
                  onChange={(e) => setBookingData({...bookingData, number_of_guests: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1 Guest</option>
                  <option value={2}>2 Guests</option>
                  <option value={3}>3 Guests</option>
                  <option value={4}>4 Guests</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                <textarea
                  value={bookingData.special_requests}
                  onChange={(e) => setBookingData({...bookingData, special_requests: e.target.value})}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any special requests or requirements..."
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition duration-300"
              >
                Book Now
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  const MenuPage = () => {
    const currentMenu = orderType === 'bar' ? barMenu : restaurantMenu;
    
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-serif mb-4">Hotel Ulin {orderType === 'bar' ? 'Bar' : 'Restaurant'}</h2>
            <div className="flex justify-center space-x-4 mb-6">
              <button
                onClick={() => setOrderType('bar')}
                className={`px-6 py-2 rounded-lg font-semibold ${
                  orderType === 'bar' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-blue-600 border border-blue-600'
                }`}
              >
                Bar Menu
              </button>
              <button
                onClick={() => setOrderType('restaurant')}
                className={`px-6 py-2 rounded-lg font-semibold ${
                  orderType === 'restaurant' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-blue-600 border border-blue-600'
                }`}
              >
                Restaurant Menu
              </button>
            </div>
            
            <button
              onClick={() => generateQRCode(orderType)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg mb-4"
            >
              Generate QR Code for {orderType === 'bar' ? 'Bar' : 'Restaurant'}
            </button>
            
            {qrCode && (
              <div className="mt-4 flex justify-center">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                  <p className="text-sm text-gray-600 mt-2">Scan to order from mobile</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {Object.entries(currentMenu).map(([category, items]) => (
                <div key={category} className="bg-white rounded-lg shadow-lg p-6 mb-6">
                  <h3 className="text-2xl font-semibold mb-4 text-gray-800">{category}</h3>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.item_id} className="flex justify-between items-center border-b pb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{item.name}</h4>
                          <p className="text-gray-600 text-sm">{item.description}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-xl font-bold text-blue-600">€{item.price}</span>
                          <button
                            onClick={() => addToOrder(item)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-lg p-6 h-fit">
              <h3 className="text-2xl font-semibold mb-4">Your Order</h3>
              
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  placeholder="Table Number"
                  value={orderCustomer.table_number}
                  onChange={(e) => setOrderCustomer({...orderCustomer, table_number: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Your Name"
                  value={orderCustomer.customer_name}
                  onChange={(e) => setOrderCustomer({...orderCustomer, customer_name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={orderCustomer.customer_phone}
                  onChange={(e) => setOrderCustomer({...orderCustomer, customer_phone: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              {currentOrder.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No items in order</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {currentOrder.map((item) => (
                      <div key={item.item_id} className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600">€{item.price} each</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded-full"
                          >
                            -
                          </button>
                          <span className="w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded-full"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromOrder(item.item_id)}
                            className="text-red-600 hover:text-red-800 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total:</span>
                      <span>€{currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={submitOrder}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg mt-4"
                  >
                    Submit Order
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AdminPage = () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-serif mb-8 text-center">Hotel Admin Dashboard</h2>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Bookings Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-semibold mb-4">Recent Bookings</h3>
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No bookings yet</p>
              ) : (
                bookings.slice(0, 5).map((booking) => (
                  <div key={booking.booking_id} className="border-b pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{booking.guest_name}</h4>
                        <p className="text-sm text-gray-600">{booking.guest_email}</p>
                        <p className="text-sm text-gray-600">{booking.guest_phone}</p>
                        <p className="text-sm text-gray-600">
                          {booking.check_in_date} to {booking.check_out_date}
                        </p>
                        <p className="text-sm text-gray-600">{booking.number_of_guests} guests</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status}
                        </span>
                        <p className="text-lg font-bold text-blue-600 mt-1">€{booking.total_price}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Orders Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-semibold mb-4">Recent Orders</h3>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No orders yet</p>
              ) : (
                orders.slice(0, 5).map((order) => (
                  <div key={order.order_id} className="border-b pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{order.customer_name || 'Anonymous'}</h4>
                        <p className="text-sm text-gray-600">Table: {order.table_number}</p>
                        <p className="text-sm text-gray-600">Phone: {order.customer_phone}</p>
                        <p className="text-sm text-gray-600 capitalize">{order.order_type}</p>
                        <p className="text-sm text-gray-600">{order.items.length} items</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          order.status === 'preparing' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                        <p className="text-lg font-bold text-blue-600 mt-1">€{order.total_amount}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const Navigation = () => (
    <nav className="bg-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-serif font-bold text-blue-600">Hotel Ulin</h1>
          </div>
          <div className="flex space-x-6">
            <button
              onClick={() => setCurrentPage('home')}
              className={`font-medium ${currentPage === 'home' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentPage('booking')}
              className={`font-medium ${currentPage === 'booking' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
            >
              Book Now
            </button>
            <button
              onClick={() => setCurrentPage('menu')}
              className={`font-medium ${currentPage === 'menu' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
            >
              Menu & Order
            </button>
            <button
              onClick={() => setCurrentPage('admin')}
              className={`font-medium ${currentPage === 'admin' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="App">
      <Navigation />
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'booking' && <BookingPage />}
      {currentPage === 'menu' && <MenuPage />}
      {currentPage === 'admin' && <AdminPage />}
    </div>
  );
}

export default App;
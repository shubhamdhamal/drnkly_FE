import React, { useEffect, useState, useRef } from 'react';
import { Package, Truck, CheckCircle, Users, Clock, User, Phone, MapPin, Calendar, Hash, Bell } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Button Component
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  icon,
  onClick,
  disabled = false,
  className = ''
}) => {
  const baseStyles = "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95";

  const variantStyles = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 border border-gray-300 shadow-md hover:shadow-lg",
    danger: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl",
    success: "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl"
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      {children}
    </button>
  );
};

// Toast notification function
const toast = {
  success: (message: string) => {
    console.log('Success:', message);
    // You can implement a proper toast library here
  },
  error: (message: string) => {
    console.log('Error:', message);
    // You can implement a proper toast library here
  },
  warning: (message: string) => {
    console.log('Warning:', message);
    // You can implement a proper toast library here
  }
};

interface PickupOrder {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerPhone?: string;
  customerAddress: string;
  totalAmount: number;
  readyTime: string;
  handoverStatus: 'pending' | 'handedOver';
  acceptedAt?: string;
  groupId?: string;
}

interface GroupedOrder {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerAddress: string;
  items: PickupOrder[];
  totalAmount: number;
  readyTime: string;
  handoverStatus: 'pending' | 'handedOver';
  acceptedAt?: string;
}

interface ApiResponse {
  orders: PickupOrder[];
}

const Pickup: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PickupOrder[]>([]);
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrder[]>([]);
  const [newPickupOrders, setNewPickupOrders] = useState<GroupedOrder[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const groupOrdersByCustomer = (orders: PickupOrder[]): GroupedOrder[] => {
    const grouped = orders.reduce((acc: { [key: string]: GroupedOrder }, order) => {
      const key = order.orderNumber;

      if (!acc[key]) {
        acc[key] = {
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerAddress: order.customerAddress,
          items: [],
          totalAmount: 0,
          readyTime: order.readyTime,
          handoverStatus: 'pending',
          acceptedAt: order.acceptedAt
        };
      }

      acc[key].items.push(order);
      acc[key].totalAmount += order.price * order.quantity;

      if (order.handoverStatus === 'handedOver') {
        acc[key].handoverStatus = 'handedOver';
      }

      return acc;
    }, {});

    return Object.values(grouped);
  };

  useEffect(() => {
    // Setup WebSocket connection for real-time updates
    wsRef.current = new WebSocket('ws://localhost:5000/ws/pickup');

    wsRef.current.onmessage = (event) => {
      const updatedOrder = JSON.parse(event.data);
      handleOrderUpdate(updatedOrder);
    };

    fetchPickupOrders();

    // Set up auto-refresh every 30 seconds
    pollingIntervalRef.current = setInterval(fetchPickupOrders, 30000);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const handleOrderUpdate = (updatedOrder: PickupOrder) => {
    setOrders(prev => {
      if (updatedOrder.handoverStatus === 'handedOver') {
        const filteredOrders = prev.filter(o =>
          !(o.orderNumber === updatedOrder.orderNumber && o.productId === updatedOrder.productId)
        );
        const newGrouped = groupOrdersByCustomer(filteredOrders);
        setGroupedOrders(newGrouped);
        return filteredOrders;
      }

      const updatedOrders = [...prev];
      const existingOrderIndex = updatedOrders.findIndex(o =>
        o.orderNumber === updatedOrder.orderNumber &&
        o.productId === updatedOrder.productId
      );

      if (existingOrderIndex === -1) {
        updatedOrders.unshift(updatedOrder);
        // Show notification for new pickup order
        showPickupNotification(updatedOrder);
      } else {
        updatedOrders[existingOrderIndex] = updatedOrder;
      }

      const newGrouped = groupOrdersByCustomer(updatedOrders);
      setGroupedOrders(newGrouped);
      return updatedOrders;
    });
  };

  const showPickupNotification = (newOrder: PickupOrder) => {
    const message = `${newOrder.customerName} का ऑर्डर pickup के लिए तैयार है!`;
    setNotificationMessage(message);
    setShowNotification(true);

    setTimeout(() => {
      setShowNotification(false);
    }, 15000);

    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Pickup Ready!", {
        body: message,
        icon: "/logo.png"
      });
    }

    // Play notification sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.error("Failed to play sound:", err));
    }
  };

  const fetchPickupOrders = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.get<ApiResponse>('http://localhost:5001/api/vendor/ready-for-pickup', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Get the list of handed over orders from localStorage
      const handedOverOrders = JSON.parse(localStorage.getItem('handedOverOrders') || '[]');

      // Filter out orders that are either handed over in the API response or in localStorage
      const filteredOrders = res.data.orders.filter((order: PickupOrder) => {
        // Check if order is handed over in API response
        const isHandedOverInAPI = order.handoverStatus === 'handedOver';

        // Check if order is in localStorage (meaning it was handed over)
        const isHandedOverInStorage = handedOverOrders.some((handedOver: any) =>
          handedOver.orderNumber === order.orderNumber
        );

        // Only show orders that are NOT handed over in either place
        return !isHandedOverInAPI && !isHandedOverInStorage;
      });

      // Sort orders by time
      const sortedOrders = filteredOrders.sort((a: PickupOrder, b: PickupOrder) => {
        const timeA = a.acceptedAt ? new Date(a.acceptedAt).getTime() : new Date(a.readyTime).getTime();
        const timeB = b.acceptedAt ? new Date(b.acceptedAt).getTime() : new Date(b.readyTime).getTime();
        return timeB - timeA;
      });

      setOrders(sortedOrders);
      setGroupedOrders(groupOrdersByCustomer(sortedOrders));
    } catch (err) {
      console.error('Failed to fetch pickup orders', err);
      toast.error('Failed to load pickup orders');
    }
  };

  // Function to track order in payouts
  const trackOrderInPayouts = async (groupedOrder: GroupedOrder, token: string) => {
    try {
      // First try to add to payouts tracking in backend
      await axios.post(
        'http://localhost:5001/api/vendor/payouts/track',
        {
          orderId: groupedOrder.items[0].orderId,
          orderNumber: groupedOrder.orderNumber,
          amount: groupedOrder.totalAmount,
          customerName: groupedOrder.customerName,
          items: groupedOrder.items.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          status: 'completed',
          handedOverAt: new Date().toISOString()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Also store in localStorage for immediate UI updates
      const storedPayouts = JSON.parse(localStorage.getItem('payoutsData') || '[]');
      const newPayout = {
        id: `PAY${Date.now()}`,
        orderId: groupedOrder.items[0].orderId,
        orderNumber: groupedOrder.orderNumber,
        amount: groupedOrder.totalAmount,
        date: new Date().toISOString(),
        status: 'pending',
        commission: Math.round(groupedOrder.totalAmount * 0.1), // 10% commission
        customerName: groupedOrder.customerName,
        items: groupedOrder.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const updatedPayouts = [newPayout, ...storedPayouts];
      localStorage.setItem('payoutsData', JSON.stringify(updatedPayouts));

      return true;
    } catch (error) {
      console.error('Failed to track order in payouts:', error);
      return false;
    }
  };

  const handleGroupHandover = async (groupedOrder: GroupedOrder) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // First remove the order from pickup page immediately
      setOrders(prev => prev.filter(order =>
        !groupedOrder.items.some(item =>
          item.orderNumber === order.orderNumber &&
          item.productId === order.productId
        )
      ));

      setGroupedOrders(prev => prev.filter(group =>
        group.orderNumber !== groupedOrder.orderNumber
      ));

      // Then update the order status to handed over
      const handoverPromises = groupedOrder.items.map(item =>
        axios.put(
          `http://localhost:5001/api/vendor/orders/handover`,
          {
            productId: item.productId,
            orderNumber: item.orderNumber
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      await Promise.all(handoverPromises);

      // Store handed over orders in localStorage for Orders page
      const handedOverOrders = JSON.parse(localStorage.getItem('handedOverOrders') || '[]');
      const newHandedOverOrders = [
        ...handedOverOrders,
        ...groupedOrder.items.map(item => ({
          orderId: item.orderId,
          orderNumber: item.orderNumber,
          handedOverAt: new Date().toISOString(),
          customerName: groupedOrder.customerName,
          totalAmount: groupedOrder.totalAmount,
          items: groupedOrder.items.map(orderItem => ({
            productId: orderItem.productId,
            name: orderItem.name,
            quantity: orderItem.quantity,
            price: orderItem.price,
            status: 'handedOver'
          }))
        }))
      ];
      localStorage.setItem('handedOverOrders', JSON.stringify(newHandedOverOrders));

      // Track order in payouts
      const payoutTracked = await trackOrderInPayouts(groupedOrder, token);
      if (!payoutTracked) {
        toast.warning('Order handed over but payout tracking failed');
      }

      toast.success('Order group handed over to delivery successfully!');

      // Navigate to PastOrders page with the order number as a query parameter
      // This will automatically open the past orders page after handover
      window.location.href = `/past-orders?orderNumber=${groupedOrder.orderNumber}`;

    } catch (err) {
      console.error('Error handing over order group', err);
      toast.error('Failed to hand over the order group');
    }
  };

  // Add cleanup function to remove old handed over orders from localStorage
  useEffect(() => {
    const cleanupHandedOverOrders = () => {
      const handedOverOrders = JSON.parse(localStorage.getItem('handedOverOrders') || '[]');
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const recentHandedOverOrders = handedOverOrders.filter((order: any) =>
        new Date(order.handedOverAt) > oneDayAgo
      );

      localStorage.setItem('handedOverOrders', JSON.stringify(recentHandedOverOrders));
    };

    // Clean up old handed over orders every hour
    const cleanupInterval = setInterval(cleanupHandedOverOrders, 3600000);

    return () => clearInterval(cleanupInterval);
  }, []);

  const handleNotificationClick = () => {
    setShowNotification(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Add notification sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT" type="audio/wav" />
      </audio>

      {/* Enhanced Notification Popup */}
      {showNotification && (
        <div
          onClick={handleNotificationClick}
          className="fixed top-6 right-6 z-50 cursor-pointer transform transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '20px 24px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            animation: 'slideInRight 0.5s ease-out, pulse 2s infinite',
            minWidth: '320px',
            maxWidth: '400px'
          }}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Package size={28} className="animate-bounce" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg mb-2">📦 Pickup Ready!</h4>
              <p className="text-sm opacity-90 mb-3">{notificationMessage}</p>
              <p className="text-xs opacity-75">👆 Click to dismiss</p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Header */}
      <div className="bg-white shadow-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Pickup Management
              </h1>
              <p className="text-gray-600">Orders ready for delivery pickup</p>
            </div>

            <div className="flex items-center gap-6">
              {/* Order Count Badge */}
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl shadow-lg">
                  <div className="flex items-center gap-3">
                    <Package className="w-6 h-6" />
                    <div>
                      <p className="text-sm font-medium opacity-90">Ready for Pickup</p>
                      <p className="text-2xl font-bold">{groupedOrders.length}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Auto-refresh: ON</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {groupedOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="text-center py-20">
              <div className="relative mb-8">
                <Package className="w-24 h-24 text-gray-300 mx-auto" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">No Orders Ready for Pickup</h3>
              <p className="text-gray-500 text-lg">Orders will appear here when they're ready for delivery</p>
              <div className="mt-8 flex justify-center">
                <div className="bg-blue-50 px-6 py-3 rounded-lg">
                  <p className="text-blue-700 font-medium">System is monitoring for new pickup orders...</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6">
              <div className="flex items-center gap-4">
                <Package className="w-8 h-8 text-white" />
                <h2 className="text-2xl font-bold text-white">Ready for Pickup</h2>
                <span className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-full text-sm font-bold">
                  {groupedOrders.length} Orders
                </span>
              </div>
            </div>

            {/* Orders List */}
            <div className="p-8">
              <div className="space-y-8">
                {groupedOrders.map((group, idx) => (
                  <div
                    key={group.orderNumber}
                    className="relative overflow-hidden rounded-2xl border-2 border-gray-200 transition-all duration-300 hover:shadow-2xl hover:border-blue-300 transform hover:-translate-y-1"
                    style={{
                      background: group.handoverStatus === 'handedOver'
                        ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
                        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    }}
                  >
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 transform rotate-12 scale-150"></div>
                    </div>

                    <div className="relative p-8">
                      {/* Order Header */}
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                                <Hash className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold text-gray-800">
                                  Order #{idx + 1}
                                </h3>
                                <p className="text-lg font-semibold text-blue-600">
                                  {group.orderNumber}
                                </p>
                              </div>
                            </div>

                            {/* Status Badge */}
                            {group.handoverStatus === 'handedOver' ? (
                              <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold rounded-full flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                HANDED OVER
                              </span>
                            ) : (
                              <span className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-full animate-pulse">
                                READY FOR PICKUP
                              </span>
                            )}
                          </div>

                          {/* Customer Information Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                            <div className="flex items-center gap-3 p-4 bg-white bg-opacity-60 rounded-xl">
                              <User className="w-6 h-6 text-blue-600" />
                              <div>
                                <p className="text-sm text-gray-500 font-medium">Customer</p>
                                <p className="font-bold text-gray-800 text-lg">{group.customerName}</p>
                              </div>
                            </div>

                            {group.customerPhone && (
                              <div className="flex items-center gap-3 p-4 bg-white bg-opacity-60 rounded-xl">
                                <Phone className="w-6 h-6 text-green-600" />
                                <div>
                                  <p className="text-sm text-gray-500 font-medium">Phone</p>
                                  <p className="font-bold text-gray-800 text-lg">{group.customerPhone}</p>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-3 p-4 bg-white bg-opacity-60 rounded-xl">
                              <Package className="w-6 h-6 text-purple-600" />
                              <div>
                                <p className="text-sm text-gray-500 font-medium">Total Amount</p>
                                <p className="font-bold text-green-600 text-xl">₹{group.totalAmount.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Address */}
                          <div className="flex items-start gap-3 p-4 bg-white bg-opacity-60 rounded-xl mb-6">
                            <MapPin className="w-6 h-6 text-red-600 mt-1" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-500 font-medium mb-1">Delivery Address</p>
                              <p className="text-gray-800 font-medium">{group.customerAddress}</p>
                            </div>
                          </div>

                          {/* Ready Time */}
                          <div className="flex items-center gap-3 p-4 bg-white bg-opacity-60 rounded-xl mb-6">
                            <Calendar className="w-6 h-6 text-indigo-600" />
                            <div>
                              <p className="text-sm text-gray-500 font-medium">Ready Time</p>
                              <p className="font-bold text-gray-800 text-lg">
                                {new Date(group.readyTime).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="bg-white bg-opacity-80 rounded-xl border border-gray-200 overflow-hidden mb-6">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                          <h4 className="font-bold text-gray-800 flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            Order Items ({group.items.length})
                          </h4>
                        </div>

                        <div className="divide-y divide-gray-100">
                          {group.items.map((item, itemIdx) => (
                            <div
                              key={item.productId}
                              className="flex justify-between items-center p-6 hover:bg-gray-50 transition-colors duration-200"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                                  {item.quantity}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-800 text-lg">{item.name}</p>
                                  <p className="text-gray-600">₹{item.price} each</p>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="font-bold text-xl text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</p>
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${item.handoverStatus === 'handedOver'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-orange-100 text-orange-800'
                                  }`}>
                                  {item.handoverStatus === 'handedOver' ? 'HANDED OVER' : 'READY'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      {group.handoverStatus !== 'handedOver' && (
                        <div className="flex justify-center">
                          <Button
                            variant="success"
                            icon={<Truck className="w-5 h-5" />}
                            onClick={() => handleGroupHandover(group)}
                            className="text-lg px-8 py-4 shadow-2xl"
                          >
                            Hand Over All Items to Delivery
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced CSS Animations */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 8px 32px rgba(16, 185, 129, 0.4);
          }
          50% {
            box-shadow: 0 8px 32px rgba(16, 185, 129, 0.6);
          }
        }
        
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes slideIn {
          from { 
            transform: translateX(-100%); 
            opacity: 0; 
          }
          to { 
            transform: translateX(0); 
            opacity: 1; 
          }
        }
        
        @keyframes highlight {
          0%, 100% { 
            background-color: rgba(59, 130, 246, 0.1); 
          }
          50% { 
            background-color: rgba(59, 130, 246, 0.2); 
          }
        }
        
        .order-card {
          animation: fadeIn 0.6s ease-out;
        }
        
        .order-card:nth-child(even) {
          animation-delay: 0.1s;
        }
        
        .order-card:nth-child(odd) {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
};

export default Pickup;

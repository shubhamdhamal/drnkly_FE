import React, { useState, useEffect, useRef } from 'react';
import { Eye, Check, X, Search, Bell, Truck, Clock, Package, User, Phone, MapPin, Calendar, CreditCard, Hash } from 'lucide-react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

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
  const baseStyles = "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg",
    success: "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
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

// Input Component
interface InputProps {
  placeholder?: string;
  icon?: React.ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
}

const Input: React.FC<InputProps> = ({ placeholder, icon, value, onChange, style }) => {
  return (
    <div className="relative" style={style}>
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {icon}
        </div>
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${icon ? 'pl-10' : ''
          }`}
      />
    </div>
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
  }
};

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'handedOver';
}

interface Order {
  transactionId: string | null;
  orderNumber: string;
  id: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: 'paid' | 'pending';
  paymentProof?: string;
  createdAt: string;
  readyForPickup?: boolean;
}

interface ApiResponse {
  orders: Array<{
    orderId: string;
    orderNumber: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    deliveryAddress?: {
      fullName: string;
      phone?: string;
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    items: Array<{
      productId: string;
      name: string;
      quantity: number;
      price: number;
      status: 'pending' | 'accepted' | 'rejected' | 'handedOver';
    }>;
    totalAmount: number;
    paymentStatus: 'pending' | 'paid';
    transactionId?: string;
    paymentProof?: string;
    createdAt: string;
    readyForPickup?: boolean;
  }>;
}

// 1. Add Product type and products state at the top (after imports)
interface Product {
  _id: string;
  name: string;
  brand: string;
  category: string;
  alcoholContent: number;
  price: number;
  stock: number;
  description: string;
  volume: number;
  image: string;
}

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pastOrdersRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(false);
  const prevLiveOrderIdsRef = useRef<string[]>([]);
  const [loading, setLoading] = useState(true); // <-- Add loading state
  const [products, setProducts] = useState<Product[]>([]);

  // Load cached orders on mount for instant display
  useEffect(() => {
    const cachedOrders = localStorage.getItem('cachedOrders');
    if (cachedOrders) {
      try {
        setOrders(JSON.parse(cachedOrders));
        setLoading(false);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // 2. Fetch products on mount (inside Orders component, after useEffect for cachedOrders)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const response = await axios.get('http://localhost:5001/api/products/vendor', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(response.data.products || []);
      } catch (error) {
        console.error('Failed to fetch products', error);
      }
    };
    fetchProducts();
  }, []);

  // Initialize audio context
  const initializeAudio = async () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Resume context if it's suspended
      if (context.state === 'suspended') {
        await context.resume();
      }

      setAudioContext(context);
      setAudioEnabled(true);

      // Test sound to confirm it's working
      playNotificationSound(context);

      console.log('Audio initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  };

  // Play notification sound
  const playNotificationSound = (context?: AudioContext) => {
    const ctx = context || audioContext;
    if (!ctx || !audioEnabled) return;

    try {
      // Create oscillator for beep sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Set frequency and volume
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);

      console.log('Sound played successfully');
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  };

  // Enable audio on user interaction
  const enableAudio = async () => {
    if (!audioEnabled) {
      const success = await initializeAudio();
      if (success) {
        toast.success('Sound notifications enabled!');
      } else {
        toast.error('Failed to enable sound notifications');
      }
    }
  };

  // Play notification sound (ton.mp3)
  const playTonSound = () => {
    if (audioRef.current && soundEnabledRef.current) {
      console.log('🎵 Playing sound for new order');
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.play().then(() => {
          console.log('✅ Sound played successfully');
        }).catch((e) => {
          console.warn('❌ Audio play failed:', e);
        });
      } catch (e) {
        console.warn('❌ Audio play error:', e);
      }
    } else {
      console.log('Sound not enabled or audioRef not ready');
    }
  };

  // Enable sound on any user click (anywhere on page)
  useEffect(() => {
    if (soundEnabled) return;
    const handleAnyClick = () => {
      if (!soundEnabledRef.current) {
        setSoundEnabled(true);
        soundEnabledRef.current = true;
        console.log('🔊 Sound enabled automatically');
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => console.log('Initial sound test failed:', e));
        }
      }
    };
    window.addEventListener('click', handleAnyClick, { once: true });
    return () => window.removeEventListener('click', handleAnyClick);
  }, [soundEnabled]);

  // Keep ref in sync with state
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.get<ApiResponse>('http://localhost:5001/api/vendor/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetchedOrders: Order[] = res.data.orders.map((order) => ({
        id: order.orderId,
        orderNumber: order.orderNumber,
        customerName: order.customerName || order.deliveryAddress?.fullName || 'Customer',
        customerPhone: order.customerPhone || order.deliveryAddress?.phone || '',
        customerAddress:
          order.customerAddress ||
          `${order.deliveryAddress?.street || ''}, ${order.deliveryAddress?.city || ''}, ${order.deliveryAddress?.state || ''} - ${order.deliveryAddress?.pincode || ''}`,
        items: order.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          status: item.status,
        })),
        totalAmount: order.totalAmount || 0,
        paymentStatus: order.paymentStatus || 'pending',
        transactionId: order.transactionId || '',
        paymentProof: order.paymentProof || '',
        createdAt: order.createdAt,
        readyForPickup: order.readyForPickup || false,
      }));

      // --- Only play sound for truly new live orders ---
      const getLiveOrderIds = (orders: Order[]) =>
        orders
          .filter(order => {
            const hasPendingItems = order.items.some(item => item.status === 'pending');
            const hasAcceptedItems = order.items.some(item => item.status === 'accepted');
            const allItemsHandedOver = order.items.every(item => item.status === 'handedOver');
            const allItemsRejected = order.items.every(item => item.status === 'rejected');
            return (hasPendingItems || hasAcceptedItems) && !allItemsHandedOver && !allItemsRejected;
          })
          .map(order => order.id);

      const newLiveOrderIds = getLiveOrderIds(fetchedOrders);
      const prevLiveOrderIds = prevLiveOrderIdsRef.current;
      const trulyNewLiveOrderIds = newLiveOrderIds.filter(id => !prevLiveOrderIds.includes(id));

      if (trulyNewLiveOrderIds.length > 0 && prevLiveOrderIds.length > 0) {
        playTonSound();
      }

      prevLiveOrderIdsRef.current = newLiveOrderIds;
      // --- End new live order sound logic ---

      // Check for new orders by comparing with existing orders
      const existingOrderIds = orders.map(o => o.id);
      const newOrdersDetected = fetchedOrders.filter(order => !existingOrderIds.includes(order.id));

      if (newOrdersDetected.length > 0 && orders.length > 0) {
        // New order detected - play sound immediately and automatically
        console.log('🚨 NEW ORDER DETECTED! Playing sound automatically...');

        // Auto-enable sound if not already enabled
        if (!soundEnabledRef.current) {
          setSoundEnabled(true);
          soundEnabledRef.current = true;
          console.log('🔊 Sound auto-enabled for new order');
        }

        // Play sound
        playTonSound();

        setNewOrders(prev => [...newOrdersDetected, ...prev]);
        showOrderNotification(newOrdersDetected);
      }

      setOrders(fetchedOrders);
      localStorage.setItem('cachedOrders', JSON.stringify(fetchedOrders)); // <-- Cache orders
      setLoading(false); // <-- Set loading false after fetch
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Failed to load orders');
      setLoading(false); // <-- Set loading false on error
    }
  };

  useEffect(() => {
    // Setup WebSocket connection for real-time updates
    wsRef.current = new WebSocket('ws://localhost:5000/ws/orders');

    wsRef.current.onmessage = (event) => {
      const newOrder = JSON.parse(event.data);
      handleNewOrder(newOrder);
      fetchOrders(); // Immediately refresh orders from API
    };

    fetchOrders();
    requestNotificationPermission();

    // Set up auto-refresh every 5 seconds (was 30 seconds)
    pollingIntervalRef.current = setInterval(fetchOrders, 5000);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  useEffect(() => {
    // Handle navigation from pickup page
    if (location.state?.scrollToPastOrders) {
      setTimeout(() => {
        if (pastOrdersRef.current) {
          pastOrdersRef.current.scrollIntoView({ behavior: 'smooth' });

          if (location.state.orderNumber) {
            const orderElement = document.getElementById(`order-${location.state.orderNumber}`);
            if (orderElement) {
              orderElement.classList.add('highlight-order');
              setTimeout(() => {
                orderElement.classList.remove('highlight-order');
              }, 2000);
            }
          }
        }
      }, 500);
    }
  }, [location.state, orders]);

  const handleNewOrder = (newOrder: Order) => {
    setOrders(prev => {
      const filteredOrders = prev.filter(o => o.id !== newOrder.id);
      const updatedOrders = [newOrder, ...filteredOrders];

      setNewOrders(prevNew => [newOrder, ...prevNew]);
      showOrderNotification([newOrder]);

      // Auto-enable sound and play for new order
      if (!soundEnabledRef.current) {
        setSoundEnabled(true);
        soundEnabledRef.current = true;
        console.log('🔊 Sound auto-enabled for WebSocket new order');
      }
      playTonSound();

      return updatedOrders;
    });
  };

  const isLastPendingItem = (order: Order, currentItemId: string): boolean => {
    const pendingItems = order.items.filter(item => item.status === 'pending');
    return pendingItems.length === 1 && pendingItems[0].productId === currentItemId;
  };

  const updateOrderStatus = async (
    orderId: string,
    productId: string,
    status: 'accepted' | 'rejected' | 'handedOver'
  ) => {
    enableAudio(); // Enable audio on user interaction

    const token = localStorage.getItem('authToken');

    try {
      const currentOrder = orders.find(order => order.id === orderId);
      if (!currentOrder) {
        toast.error('Order not found');
        return;
      }

      const shouldRedirectToPickup = status === 'accepted' && isLastPendingItem(currentOrder, productId);

      // If this is the last pending item and we're accepting it, redirect immediately
      if (shouldRedirectToPickup) {
        // Update local state first for immediate feedback
        setOrders((prev) => prev.filter(o => o.id !== orderId));

        // Redirect immediately to pickup page
        window.location.href = '/pickup';

        // Make API calls in the background
        axios.put(
          `http://localhost:5001/api/vendor/orders/${orderId}/status`,
          { productId, status },
          { headers: { Authorization: `Bearer ${token}` } }
        ).then(() => {
          return axios.put(
            `http://localhost:5001/api/vendor/orders/${orderId}/ready-for-pickup`,
            {
              orderId: orderId,
              orderNumber: currentOrder.orderNumber,
              status: 'accepted'
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }).catch(err => {
          console.error('Error updating order status in background:', err);
        });

        return; // Exit early since we're redirecting
      }

      // For non-redirect cases, proceed normally
      const response = await axios.put(
        `http://localhost:5001/api/vendor/orders/${orderId}/status`,
        { productId, status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setOrders((prev) => {
          const updatedOrders = prev.map((order) =>
            order.id === orderId
              ? {
                ...order,
                items: order.items.map((item) =>
                  item.productId === productId ? { ...item, status } : item
                ),
                readyForPickup: shouldRedirectToPickup ? true : order.readyForPickup
              }
              : order
          );

          const updatedOrder = updatedOrders.find(o => o.id === orderId);
          if (updatedOrder && updatedOrder.items.every(item => item.status === 'accepted')) {
            return updatedOrders.filter(o => o.id !== orderId);
          }

          return updatedOrders;
        });

        if (status === 'accepted') {
          toast.success('Item accepted successfully!');
        } else if (status === 'handedOver') {
          toast.success('Order handed over to delivery successfully!');
          // Redirect to past orders page when handed over
          window.location.href = `/past-orders?orderNumber=${currentOrder.orderNumber}`;
        }
      }
    } catch (err) {
      console.error('Failed to update status', err);
      toast.error('Failed to update order status');
    }
  };

  const toggleView = (id: string) => {
    enableAudio(); // Enable audio on user interaction
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  // Live orders - only show orders with pending items (not accepted or handed over)
  const liveOrders = orders.filter(order => {
    const hasPendingItems = order.items.some(item => item.status === 'pending');
    const hasNoAcceptedItems = !order.items.some(item => item.status === 'accepted');
    const hasNoHandedOverItems = !order.items.some(item => item.status === 'handedOver');
    const isNotReadyForPickup = !order.readyForPickup;

    return hasPendingItems && hasNoAcceptedItems && hasNoHandedOverItems && isNotReadyForPickup;
  }).filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesSearch;
  }).sort((a, b) => {
    const aIsNew = newOrders.some(newOrder => newOrder.id === a.id);
    const bIsNew = newOrders.some(newOrder => newOrder.id === b.id);

    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pastOrders = orders.filter(order => {
    const hasHandedOverItems = order.items.some(item => item.status === 'handedOver');
    const allItemsRejected = order.items.every(item => item.status === 'rejected');
    const isHandedOverInStorage = JSON.parse(localStorage.getItem('handedOverOrders') || '[]')
      .some((handedOver: any) => handedOver.orderId === order.id);

    return hasHandedOverItems || allItemsRejected || isHandedOverInStorage;
  }).filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesSearch;
  }).sort((a, b) => {
    const handedOverOrders = JSON.parse(localStorage.getItem('handedOverOrders') || '[]');
    const aHandedOver = handedOverOrders.find((order: any) => order.orderId === a.id);
    const bHandedOver = handedOverOrders.find((order: any) => order.orderId === b.id);

    if (aHandedOver && bHandedOver) {
      return new Date(bHandedOver.handedOverAt).getTime() - new Date(aHandedOver.handedOverAt).getTime();
    }

    if (aHandedOver) return -1;
    if (bHandedOver) return 1;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const showOrderNotification = (newOrders: Order[]) => {
    const orderCount = newOrders.length;
    const pendingCount = newOrders.filter(order =>
      order.items.some(item => item.status === 'pending')
    ).length;

    let message = '';
    if (pendingCount > 0) {
      const firstOrder = newOrders[0];
      const itemsSummary = firstOrder.items
        .filter(item => item.status === 'pending')
        .map(item => `${item.quantity}x ${item.name}`)
        .join(', ');

      message = pendingCount === 1
        ? `${firstOrder.customerName} ने ऑर्डर केली आहे: ${itemsSummary}`
        : `${pendingCount} नवीन ऑर्डर्स आल्या आहेत!`;
    } else {
      message = orderCount === 1
        ? `${newOrders[0].customerName} ची नवीन ऑर्डर: ${newOrders[0].orderNumber}`
        : `${orderCount} नवीन ऑर्डर्स आल्या आहेत!`;
    }

    setNotificationMessage(message);
    setShowNotification(true);

    setTimeout(() => {
      setShowNotification(false);
    }, 30000);

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Drnkly - नवीन ऑर्डर आली आहे!", {
        body: message,
        icon: "/logo.png"
      });
    }

    // Play notification sound multiple times
    if (audioEnabled && audioContext) {
      console.log('Playing notification sound for new order');

      // Play sound 5 times with intervals
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          playNotificationSound();
        }, i * 800); // 0.8 second intervals
      }
    } else {
      console.log('Audio not enabled or context not available');
    }
  };

  const handleNotificationClick = () => {
    enableAudio();
    setShowNotification(false);
    if (newOrders.length > 0) {
      setExpandedOrderId(newOrders[0].id);
      const orderElement = document.getElementById(`order-${newOrders[0].id}`);
      if (orderElement) {
        orderElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        orderElement.classList.add('highlight-order');
        setTimeout(() => {
          orderElement.classList.remove('highlight-order');
        }, 2000);
      }
    }
  };

  const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  };

  const handleOrderAccept = async (order: Order) => {
    enableAudio();
    try {
      const token = localStorage.getItem('authToken');

      // First update the local state to give immediate feedback
      setOrders(prev => prev.filter(o => o.id !== order.id));

      // Redirect immediately to pickup page
      window.location.href = '/pickup';

      // The following code will run in the background after redirect
      const updatePromises = order.items
        .filter(item => item.status === 'pending')
        .map(item =>
          axios.put(
            `http://localhost:5001/api/vendor/orders/${order.id}/status`,
            { productId: item.productId, status: 'accepted' },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );

      // Execute API calls in the background
      Promise.all(updatePromises).then(() => {
        return axios.put(
          `http://localhost:5001/api/vendor/orders/${order.id}/ready-for-pickup`,
          {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: 'accepted'
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }).catch(err => {
        console.error('Failed to accept order in background:', err);
      });
    } catch (err) {
      console.error('Failed to accept order:', err);
    }
  };

  const hasAnyPendingItem = (order: Order) => {
    return order.items.some(item => item.status === 'pending');
  };

  const hasAnyHandedOverItem = (order: Order) => {
    return order.items.some(item => item.status === 'handedOver');
  };

  const handleOrderHandover = async (order: Order) => {
    enableAudio();
    try {
      const token = localStorage.getItem('authToken');

      const updatePromises = order.items
        .filter(item => item.status === 'accepted')
        .map(item =>
          axios.put(
            `http://localhost:5001/api/vendor/orders/${order.id}/status`,
            { productId: item.productId, status: 'handedOver' },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );

      await Promise.all(updatePromises);

      try {
        await axios.post(
          'http://localhost:5001/api/vendor/payouts/track',
          {
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount: order.totalAmount,
            customerName: order.customerName,
            items: order.items.map(item => ({
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
      } catch (payoutErr) {
        console.error('Failed to track order in payouts:', payoutErr);
      }

      setOrders(prev => {
        const updatedOrders = prev.map(o => {
          if (o.id === order.id) {
            return {
              ...o,
              items: o.items.map(item => ({
                ...item,
                status: item.status === 'accepted' ? 'handedOver' : item.status
              }))
            };
          }
          return o;
        });

        const handedOverOrders = JSON.parse(localStorage.getItem('handedOverOrders') || '[]');
        const newHandedOverOrders = [
          ...handedOverOrders,
          {
            orderId: order.id,
            orderNumber: order.orderNumber,
            handedOverAt: new Date().toISOString(),
            customerName: order.customerName,
            totalAmount: order.totalAmount,
            items: order.items.map(item => ({
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              status: 'handedOver'
            }))
          }
        ];
        localStorage.setItem('handedOverOrders', JSON.stringify(newHandedOverOrders));

        const orderExists = updatedOrders.some(o => o.id === order.id);
        if (!orderExists) {
          updatedOrders.push({
            ...order,
            items: order.items.map(item => ({
              ...item,
              status: 'handedOver'
            }))
          });
        }

        return updatedOrders;
      });

      toast.success('Order handed over to delivery successfully!');

      // Automatically navigate to past orders page after handover
      window.location.href = `/past-orders?orderNumber=${order.orderNumber}`;
    } catch (err) {
      console.error('Failed to hand over order', err);
      toast.error('Failed to hand over order');
    }
  };

  const handleOrderReject = async (order: Order) => {
    enableAudio();
    try {
      const updatePromises = order.items
        .filter(item => item.status === 'pending')
        .map(item => updateOrderStatus(order.id, item.productId, 'rejected'));

      await Promise.all(updatePromises);
      toast.success('Order rejected successfully!');
    } catch (err) {
      console.error('Failed to reject order', err);
      toast.error('Failed to reject order');
    }
  };

  const renderOrderCard = (order: Order, index: number, isPastOrder: boolean = false) => {
    const hasHandedOverItems = order.items.some(item => item.status === 'handedOver');
    const hasRejectedItems = order.items.some(item => item.status === 'rejected');
    const allItemsHandedOver = order.items.every(item => item.status === 'handedOver');
    const allItemsRejected = order.items.every(item => item.status === 'rejected');
    const hasPendingItems = order.items.some(item => item.status === 'pending');
    const hasAcceptedItems = order.items.some(item => item.status === 'accepted');
    const isNewOrder = newOrders.some(newOrder => newOrder.id === order.id);

    return (
      <div
        key={order.id}
        id={`order-${order.id}`}
        className={`order-card ${isNewOrder ? 'new-order' : ''} ${isPastOrder ? 'past-order' : 'live-order'}`}
        style={{
          background: allItemsHandedOver ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' :
            allItemsRejected ? 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' :
              hasHandedOverItems ? 'linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%)' :
                'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: isNewOrder
            ? '0 8px 32px rgba(255, 87, 34, 0.2), 0 0 0 2px #ff5722'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: isNewOrder
            ? '2px solid #ff5722'
            : isPastOrder
              ? '1px solid #e0e0e0'
              : '1px solid transparent',
          opacity: isPastOrder ? 0.95 : 1,
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={enableAudio}
      >
        {isNewOrder && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, rgba(255, 87, 34, 0.05) 0%, rgba(255, 87, 34, 0.1) 50%, rgba(255, 87, 34, 0.05) 100%)',
              animation: 'shimmer 2s infinite',
              pointerEvents: 'none'
            }}
          />
        )}

        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-800">
                  {order.orderNumber}
                </h3>
              </div>

              <div className="flex gap-2">
                {isNewOrder && (
                  <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                    NEW ORDER
                  </span>
                )}
                {allItemsHandedOver && (
                  <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold rounded-full">
                    COMPLETED
                  </span>
                )}
                {allItemsRejected && (
                  <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full">
                    REJECTED
                  </span>
                )}
                {hasHandedOverItems && hasRejectedItems && (
                  <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full">
                    PARTIALLY COMPLETED
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-semibold text-gray-800">{order.customerName}</p>
                </div>
              </div>

              {order.customerPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold text-gray-800">{order.customerPhone}</p>
                  </div>
                </div>
              )}
            </div>

            {order.customerAddress && (
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-red-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Delivery Address</p>
                  <p className="text-gray-800">{order.customerAddress}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-500">Order Time</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-bold text-lg text-green-600">₹{order.totalAmount.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <p className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                    {order.paymentStatus.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            {order.transactionId && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="font-mono text-gray-800">{order.transactionId}</p>
              </div>
            )}
          </div>
        </div>

        {expandedOrderId === order.id && (
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items
            </h4>
            <div className="space-y-3">
              {order.items.map((item, index) => {
                // Find product by productId
                const product = products.find(p => p._id === item.productId);
                return (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 rounded-lg transition-all duration-200"
                    style={{
                      background: item.status === 'handedOver' ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' :
                        item.status === 'accepted' ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' :
                          item.status === 'pending' ? 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' :
                            'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                      border: `1px solid ${item.status === 'handedOver' ? '#4caf50' :
                          item.status === 'accepted' ? '#2196f3' :
                            item.status === 'pending' ? '#ff9800' : '#f44336'
                        }`
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-800">
                          {item.quantity}x {item.name}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'handedOver' ? 'bg-green-100 text-green-800' :
                            item.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                              item.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                          }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-lg font-bold text-gray-800">₹{item.price}</p>
                        {/* Show ml/volume if product found */}
                        {product && (
                          <span className="text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded">
                            {product.volume} ml
                          </span>
                        )}
                      </div>
                    </div>

                    {!isPastOrder && item.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          variant="success"
                          icon={<Check className="w-4 h-4" />}
                          onClick={() => updateOrderStatus(order.id, item.productId, 'accepted')}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="danger"
                          icon={<X className="w-4 h-4" />}
                          onClick={() => updateOrderStatus(order.id, item.productId, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}

                    {!isPastOrder && item.status === 'accepted' && (
                      <Button
                        variant="primary"
                        icon={<Truck className="w-4 h-4" />}
                        onClick={() => updateOrderStatus(order.id, item.productId, 'handedOver')}
                      >
                        Hand Over
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
          <Button
            variant="secondary"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => toggleView(order.id)}
          >
            {expandedOrderId === order.id ? 'Hide Details' : 'View Details'}
          </Button>

          {!isPastOrder && hasPendingItems && (
            <>
              <Button
                variant="success"
                icon={<Check className="w-4 h-4" />}
                onClick={() => handleOrderAccept(order)}
              >
                Accept All Items
              </Button>
              <Button
                variant="danger"
                icon={<X className="w-4 h-4" />}
                onClick={() => handleOrderReject(order)}
              >
                Reject All Items
              </Button>
            </>
          )}

          {!isPastOrder && hasAcceptedItems && !hasAnyHandedOverItem(order) && (
            <Button
              variant="primary"
              icon={<Truck className="w-4 h-4" />}
              onClick={() => handleOrderHandover(order)}
            >
              Hand Over All Items
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="text-lg text-blue-600 animate-pulse">Loading orders...</div></div>;
  if (error) return <p className="text-center text-red-600 text-lg">{error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" onClick={enableAudio}>
      {/* Audio element for ton */}
      <audio ref={audioRef} src="/ton.mp3" preload="auto" />

      {/* Sound Status Indicator */}
      <div className="fixed top-4 left-4 z-50">
        <div className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${soundEnabled
            ? 'bg-green-100 text-green-800 border-2 border-green-300'
            : 'bg-orange-100 text-orange-800 border-2 border-orange-300 animate-pulse'
          }`}>
          🔊 Sound: {soundEnabled ? 'READY' : 'Will Auto-Enable'}
        </div>
      </div>

      {showNotification && (
        <div
          onClick={handleNotificationClick}
          className="fixed top-6 right-6 z-50 cursor-pointer transform transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #ff5722 0%, #ff7043 100%)',
            color: 'white',
            padding: '20px 24px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(255, 87, 34, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            animation: 'slideInRight 0.5s ease-out, pulse 2s infinite',
            minWidth: '320px',
            maxWidth: '400px'
          }}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Bell size={28} className="animate-bounce" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg mb-2">🔔 नवीन ऑर्डर!</h4>
              <p className="text-sm opacity-90 mb-3">{notificationMessage}</p>
              <p className="text-xs opacity-75">👆 क्लिक करा आणि ऑर्डर पहा</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Orders</h1>
              <p className="text-gray-600">Manage your incoming orders</p>
            </div>

            <div className="flex items-center gap-4">
              <Input
                placeholder="Search orders, customers, or items..."
                icon={<Search className="w-5 h-5 text-gray-400" />}
                style={{ minWidth: '300px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Auto-refresh: ON</span>
              </div>

              <button
                onClick={enableAudio}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${audioEnabled
                    ? 'bg-green-100 text-green-800 border-2 border-green-300'
                    : 'bg-red-100 text-red-800 border-2 border-red-300 animate-pulse'
                  }`}
              >
                🔊 {audioEnabled ? 'Sound ON' : 'Click to Enable Sound'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              <h2 className="text-2xl font-bold text-white">Live Orders</h2>
              <span className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm font-medium">
                {liveOrders.length} Active
              </span>
            </div>
          </div>

          <div className="p-8">
            {liveOrders.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Live Orders</h3>
                <p className="text-gray-500">New orders will appear here automatically</p>
              </div>
            ) : (
              <div className="space-y-6">
                {liveOrders.map((order, index) => renderOrderCard(order, index))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
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
            box-shadow: 0 8px 32px rgba(255, 87, 34, 0.4);
          }
          50% {
            box-shadow: 0 8px 32px rgba(255, 87, 34, 0.6);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        @keyframes highlight {
          0%, 100% {
            background-color: rgba(255, 235, 59, 0.1);
          }
          50% {
            background-color: rgba(255, 235, 59, 0.3);
          }
        }
        
        .order-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }
        
        .new-order {
          animation: slideInRight 0.5s ease-out;
        }
        
        .highlight-order {
          animation: highlight 2s ease-in-out 3;
        }
        
        .live-order {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .past-order {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .past-order:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default Orders;

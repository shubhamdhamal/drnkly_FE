import React, { useState, useEffect, useRef } from 'react';
import { Eye, Search, Clock, Package, User, Phone, MapPin, Calendar, CreditCard, Hash } from 'lucide-react';
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

// Product type
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

const PastOrders: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const highlightedOrderRef = useRef<HTMLDivElement>(null);

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

  // Fetch products on mount
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

      setOrders(fetchedOrders);
      localStorage.setItem('cachedOrders', JSON.stringify(fetchedOrders));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Failed to load orders');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Set up auto-refresh every 30 seconds
    const pollingInterval = setInterval(fetchOrders, 30000);

    return () => {
      clearInterval(pollingInterval);
    };
  }, []);

  // Scroll to highlighted order if orderNumber is in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const orderNumber = urlParams.get('orderNumber');

    if (orderNumber && highlightedOrderRef.current) {
      setTimeout(() => {
        highlightedOrderRef.current?.scrollIntoView({ behavior: 'smooth' });

        const orderElement = document.getElementById(`order-${orderNumber}`);
        if (orderElement) {
          orderElement.classList.add('highlight-order');
          setTimeout(() => {
            orderElement.classList.remove('highlight-order');
          }, 2000);
        }
      }, 500);
    }
  }, [location.search, orders]);

  const toggleView = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  // Filter for past orders only
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

  const renderOrderCard = (order: Order, index: number) => {
    const hasHandedOverItems = order.items.some(item => item.status === 'handedOver');
    const hasRejectedItems = order.items.some(item => item.status === 'rejected');
    const allItemsHandedOver = order.items.every(item => item.status === 'handedOver');
    const allItemsRejected = order.items.every(item => item.status === 'rejected');
    const urlParams = new URLSearchParams(location.search);
    const highlightedOrderNumber = urlParams.get('orderNumber');
    const isHighlighted = order.orderNumber === highlightedOrderNumber;

    return (
      <div
        key={order.id}
        id={`order-${order.orderNumber}`}
        ref={isHighlighted ? highlightedOrderRef : null}
        className={`order-card past-order ${isHighlighted ? 'highlighted-order' : ''}`}
        style={{
          background: allItemsHandedOver ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' :
            allItemsRejected ? 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' :
              hasHandedOverItems ? 'linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%)' :
                'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: isHighlighted
            ? '0 8px 32px rgba(255, 193, 7, 0.3), 0 0 0 2px #ffc107'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: isHighlighted
            ? '2px solid #ffc107'
            : '1px solid #e0e0e0',
          opacity: 0.95,
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
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
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="text-lg text-blue-600 animate-pulse">Loading orders...</div></div>;
  if (error) return <p className="text-center text-red-600 text-lg">{error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Past Orders</h1>
              <p className="text-gray-600">View your completed and rejected orders</p>
            </div>

            <div className="flex items-center gap-4">
              <Input
                placeholder="Search orders, customers, or items..."
                icon={<Search className="w-5 h-5 text-gray-400" />}
                style={{ minWidth: '300px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">Past Orders</h2>
              <span className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm font-medium">
                {pastOrders.length} Completed
              </span>
            </div>
          </div>

          <div className="p-8">
            {pastOrders.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Past Orders</h3>
                <p className="text-gray-500">Completed orders will appear here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pastOrders.map((order, index) => renderOrderCard(order, index))}
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
          opacity: 1;
        }
        
        .past-order {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .highlight-order {
          animation: highlight 2s ease-in-out 3;
        }
        
        .highlighted-order {
          animation: highlight 2s ease-in-out 3;
        }
      `}</style>
    </div>
  );
};

export default PastOrders;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, TrendingUp, IndianRupeeIcon, CheckCircle, Tag, Plus, X, CheckSquare, Square, AlertTriangle, Percent } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../config';


interface DecodedToken {
  vendorId: string;
  exp: number;
  iat: number;
}

interface Product {
  _id: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  alcoholContent?: number;
  stock: number;
  image: string;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  discountPercentage: number;
  isActive: boolean;
  appliedToProducts: string[];
  couponCode?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // States for products and offers
  const [products, setProducts] = useState<Product[]>([]);
  const [alcoholProducts, setAlcoholProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([
    {
      id: '1',
      title: 'Weekend Special',
      description: '10% off on all premium whiskeys',
      discountPercentage: 10,
      isActive: true,
      appliedToProducts: [],
      couponCode: 'WEEKEND10'
    },
    {
      id: '2',
      title: 'Happy Hour',
      description: '15% off on beer between 5-7 PM',
      discountPercentage: 15,
      isActive: false,
      appliedToProducts: [],
      couponCode: 'HAPPY15'
    },
    {
      id: '3',
      title: 'Buy 2 Get 1',
      description: 'Special deal on wine purchases',
      discountPercentage: 33,
      isActive: false,
      appliedToProducts: [],
      couponCode: 'WINE2GET1'
    },
    {
      id: '4',
      title: 'First-Time Discount',
      description: '5% off on first order',
      discountPercentage: 5,
      isActive: true,
      appliedToProducts: [],
      couponCode: 'FIRST5'
    },
    {
      id: '5',
      title: 'Bulk Purchase',
      description: '20% off on orders above ₹2000',
      discountPercentage: 20,
      isActive: false,
      appliedToProducts: [],
      couponCode: 'BULK20'
    },
    {
      id: '6',
      title: 'Festive Offer',
      description: 'Special discounts for the holiday season',
      discountPercentage: 12,
      isActive: true,
      appliedToProducts: [],
      couponCode: 'FESTIVAL12'
    },
    {
      id: '7',
      title: 'Clearance Sale',
      description: 'Discounts on selected items to clear inventory',
      discountPercentage: 25,
      isActive: false,
      appliedToProducts: [],
      couponCode: 'CLEAR25'
    },
    {
      id: '8',
      title: 'Member Discount',
      description: 'Special pricing for loyalty members',
      discountPercentage: 8,
      isActive: true,
      appliedToProducts: [],
      couponCode: 'MEMBER8'
    },
    {
      id: '9',
      title: 'New Year Offer',
      description: '15% off to celebrate the new year',
      discountPercentage: 15,
      isActive: false,
      appliedToProducts: [],
      couponCode: 'NEWYEAR15'
    },
    {
      id: '10',
      title: 'Premium Selection',
      description: '10% off on premium spirits',
      discountPercentage: 10,
      isActive: true,
      appliedToProducts: [],
      couponCode: 'PREMIUM10'
    }
  ]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Fetch the products for the logged-in vendor
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const response = await axios.get(`${API_BASE_URL}/api/vendor/products`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const allProducts = response.data.products || [];
          setProducts(allProducts);

          // Filter only alcohol products
          const alcoholOnly = allProducts.filter((product: Product) =>
            product.category.toLowerCase() === 'drinks' ||
            product.alcoholContent > 0
          );
          setAlcoholProducts(alcoholOnly);
        } else {
          console.error('No token found');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  // Function to toggle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Function to apply selected offer to products
  const applyOfferToProducts = () => {
    if (!selectedOffer) return;

    // If no products are selected, select all alcohol products
    const productsToApply = selectedProducts.length > 0
      ? selectedProducts
      : alcoholProducts.map(p => p._id);

    // Update the offer with selected products and set isActive to true
    const updatedOffers = offers.map(offer =>
      offer.id === selectedOffer.id
        ? { ...offer, appliedToProducts: productsToApply, isActive: true }
        : offer
    );

    setOffers(updatedOffers);
    toast.success(`${selectedOffer.title} activated and applied to ${productsToApply.length} products`);
    setShowOfferModal(false);
    setSelectedOffer(null);
    setSelectedProducts([]);
  };

  // Function to open offer modal with pre-selected offer
  const openOfferModal = (offer: Offer) => {
    setSelectedOffer(offer);
    setSelectedProducts(offer.appliedToProducts || []);
    setShowOfferModal(true);
  };

  // Function to create a new offer (this would usually involve an API call)
  const createNewOffer = () => {
    const randomCode = 'OFFER' + Math.floor(Math.random() * 10000);
    const newOffer: Offer = {
      id: Date.now().toString(),
      title: "New Offer",
      description: "Description for new offer",
      discountPercentage: 10,
      isActive: false,
      appliedToProducts: [],
      couponCode: randomCode
    };

    setOffers(prev => [...prev, newOffer]);
    openOfferModal(newOffer);
  };

  // Filter top alcohol products by price
  const topAlcoholProducts = [...alcoholProducts]
    .sort((a, b) => b.price - a.price)
    .slice(0, 5);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      setStatsError(null);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setStatsError('Authentication error. Please log in again.');
          toast.error('Authentication error. Please log in again.');
          setLoadingStats(false);
          return;
        }

        const decoded = jwtDecode<DecodedToken>(token);
        const vendorId = decoded.vendorId;

        if (!vendorId) {
          setStatsError('Invalid token. Please log in again.');
          toast.error('Invalid token. Please log in again.');
          setLoadingStats(false);
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/api/vendor-stats?vendorId=${vendorId}`);

        const { activeOrders, totalProducts, completedOrders, totalSales } = res.data;

        setStats(prevStats =>
          prevStats.map(stat => {
            switch (stat.title) {
              case 'Active Orders':
                return { ...stat, value: `${activeOrders}` };
              case 'Products':
                return { ...stat, value: `${totalProducts}` };
              case 'Completed Orders':
                return { ...stat, value: `${completedOrders}` };
              case 'Total Sales':
                return { ...stat, value: `₹${totalSales.toLocaleString()}` };
              default:
                return stat;
            }
          })
        );
        setLoadingStats(false);
      } catch (err) {
        setStatsError('Failed to load dashboard statistics');
        toast.error('Failed to load dashboard statistics');
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);



  const [stats, setStats] = useState([
    {
      title: 'Active Orders',
      value: '0',
      icon: ShoppingBag,
      changeType: 'positive',
      description: 'Need your attention',
      path: '/orders',
      bgGradient: 'from-blue-50 to-blue-100',
      iconColor: 'text-blue-600',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'Products',
      value: '0',
      icon: Package,
      changeType: 'neutral',
      description: 'total in inventory',
      path: '/products',
      searchQuery: 'Old Monk Rum Free',
      bgGradient: 'from-green-50 to-green-100',
      iconColor: 'text-green-600',
      badgeColor: 'bg-green-100 text-green-700',
    },
    {
      title: 'Completed Orders',
      value: '0',
      icon: CheckCircle,
      changeType: 'positive',
      description: 'this month',
      path: '/orders',
      bgGradient: 'from-purple-50 to-purple-100',
      iconColor: 'text-purple-600',
      badgeColor: 'bg-purple-100 text-purple-700',
    },
    {
      title: 'Total Sales',
      value: '₹0',
      icon: IndianRupeeIcon,
      changeType: 'positive',
      description: 'vs. last month',
      path: '/payouts',
      bgGradient: 'from-amber-50 to-amber-100',
      iconColor: 'text-amber-600',
      badgeColor: 'bg-amber-100 text-amber-700',
    }
  ]);


  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your store.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="w-full sm:w-auto px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        {loadingStats ? (
          <div className="col-span-4 flex justify-center items-center min-h-[120px]">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          </div>
        ) : statsError ? (
          <div className="col-span-4 text-center text-red-500 font-semibold min-h-[120px]">{statsError}</div>
        ) : (
          stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`bg-white rounded-xl p-5 md:p-6 shadow-lg border border-gray-100 
                hover:shadow-xl transition-all duration-300 transform hover:translate-y-[-5px] 
                overflow-hidden relative ${stat.path ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (stat.title === 'Completed Orders') {
                    localStorage.setItem('showPastOrders', 'true');
                    navigate('/orders');
                  } else if (stat.title === 'Total Sales') {
                    navigate('/payouts');
                  } else if (stat.path) {
                    if (stat.searchQuery) {
                      localStorage.setItem('productSearchQuery', stat.searchQuery);
                    }
                    navigate(stat.path);
                  }
                }}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-40`}></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className={`bg-white p-3 rounded-lg shadow-sm border border-gray-100`}>
                      <Icon className={`w-7 h-7 ${stat.iconColor}`} />
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs md:text-sm font-medium ${stat.badgeColor}`}>
                      {stat.changeType === 'positive' && '+3.2%'}
                      {stat.changeType === 'negative' && '-1.4%'}
                      {stat.changeType === 'neutral' && 'Current'}
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs md:text-sm text-gray-500 mt-2">{stat.description}</p>
                  </div>

                  {/* Action indicator */}
                  <div className="mt-4 flex items-center text-sm font-medium text-blue-600">
                    <span>View Details</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-bl from-white to-transparent opacity-60 transform rotate-45"></div>
                <div className="absolute bottom-0 left-0 h-16 w-16 bg-gradient-to-tr from-white to-transparent opacity-60 transform -rotate-45"></div>
              </div>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Active Offers */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transform transition-all duration-300 hover:translate-y-[-5px] hover:shadow-xl">
          <div className="p-5 md:p-6 border-b border-gray-100 bg-gradient-to-r from-white to-blue-50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Active Offers</h2>
              <p className="text-sm text-gray-600 mt-1">Current available offers</p>
            </div>
            <button
              onClick={createNewOffer}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> New
            </button>
          </div>
          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {offers
              .filter(offer => offer.isActive)
              .map((offer) => (
                <div key={offer.id} className="p-5 md:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 shadow-sm">
                          <CheckCircle className="w-5 h-5" />
                        </span>
                        <p className="font-medium text-gray-800">{offer.title}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 ml-11">{offer.description}</p>
                      {offer.appliedToProducts.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1 ml-11">Applied to {offer.appliedToProducts.length} products</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm">{offer.discountPercentage}% off</span>
                      <button
                        onClick={() => openOfferModal(offer)}
                        className="bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors border border-gray-200 shadow-sm hover:shadow"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {offers.filter(offer => offer.isActive).length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">No active offers configured yet</p>
                <p className="text-sm mt-1">Create new offers to attract more customers</p>
              </div>
            )}
          </div>
        </div>

        {/* Applied Offers */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transform transition-all duration-300 hover:translate-y-[-5px] hover:shadow-xl">
          <div className="p-5 md:p-6 border-b border-gray-100 bg-gradient-to-r from-white to-green-50">
            <h2 className="text-lg font-semibold text-gray-800">Applied Offers</h2>
            <p className="text-sm text-gray-600 mt-1">Offers you have applied to your products</p>
          </div>
          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {offers
              .filter(offer => offer.isActive && offer.appliedToProducts.length > 0)
              .map((offer) => (
                <div key={offer.id} className="p-5 md:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 shadow-sm">
                          <Percent className="w-5 h-5" />
                        </span>
                        <p className="font-medium text-gray-800">{offer.title}</p>
                      </div>
                      <span className="font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full text-sm">{offer.discountPercentage}% off</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-11">{offer.description}</p>

                    <div className="mt-3 ml-11 pt-3 border-t border-gray-100">
                      <p className="text-sm font-medium mb-3">Applied to {offer.appliedToProducts.length} products:</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {alcoholProducts
                          .filter(product => offer.appliedToProducts.includes(product._id))
                          .slice(0, 3) // Show only first 3 products
                          .map(product => (
                            <div key={product._id} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                              <div className="w-8 h-8 bg-white rounded-md overflow-hidden shadow-sm">
                                <img
                                  src={product.image || `https://via.placeholder.com/50?text=${product.name}`}
                                  alt={product.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-700">{product.name}</span>
                            </div>
                          ))
                        }
                        {offer.appliedToProducts.length > 3 && (
                          <span className="text-sm bg-gray-100 px-3 py-2 rounded-lg border border-gray-200">
                            +{offer.appliedToProducts.length - 3} more
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => openOfferModal(offer)}
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 border border-blue-200 shadow-sm hover:shadow"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            const updatedOffers = offers.map(o =>
                              o.id === offer.id ? { ...o, appliedToProducts: [] } : o
                            );
                            setOffers(updatedOffers);
                            toast.success(`${offer.title} removed from all products`);
                          }}
                          className="bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 border border-red-200 shadow-sm hover:shadow"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {!offers.some(offer => offer.isActive && offer.appliedToProducts.length > 0) && (
              <div className="p-8 text-center text-gray-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">You haven't applied any offers to your products yet</p>
                <button
                  onClick={createNewOffer}
                  className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  Create an offer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Inactive Offers */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transform transition-all duration-300 hover:translate-y-[-5px] hover:shadow-xl">
          <div className="p-5 md:p-6 border-b border-gray-100 bg-gradient-to-r from-white to-purple-50">
            <h2 className="text-lg font-semibold text-gray-800">Inactive Offers</h2>
            <p className="text-sm text-gray-600 mt-1">Offers with coupon codes ready to be activated</p>
          </div>
          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {offers
              .filter(offer => !offer.isActive)
              .map((offer) => (
                <div key={offer.id} className="p-5 md:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 shadow-sm">
                          <Tag className="w-5 h-5" />
                        </span>
                        <p className="font-medium text-gray-800">{offer.title}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 ml-11">{offer.description}</p>

                      {/* Display coupon code */}
                      {offer.couponCode && (
                        <div className="mt-2 ml-11">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                            Coupon: <span className="font-bold ml-1">{offer.couponCode}</span>
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm">{offer.discountPercentage}% off</span>
                      <button
                        onClick={() => {
                          // Pre-select all alcohol products for this offer and directly apply it
                          setSelectedOffer(offer);
                          const allProductIds = alcoholProducts.map(p => p._id);
                          setSelectedProducts(allProductIds);

                          // Create updated offer with these products and active status
                          const updatedOffers = offers.map(o =>
                            o.id === offer.id
                              ? { ...o, appliedToProducts: allProductIds, isActive: true }
                              : o
                          );

                          setOffers(updatedOffers);
                          toast.success(`${offer.title} activated and applied to all ${allProductIds.length} products`);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Activate
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {offers.filter(offer => !offer.isActive).length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">No inactive offers available</p>
                <p className="text-sm mt-1">All your offers are currently active</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offer Selection Modal */}
      {showOfferModal && selectedOffer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-lg">
                {selectedOffer.isActive ? 'Edit Offer' : 'New Offer'}
              </h3>
              <button
                onClick={() => {
                  setShowOfferModal(false);
                  setSelectedOffer(null);
                  setSelectedProducts([]);
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Offer Title</label>
                  <input
                    type="text"
                    value={selectedOffer.title}
                    onChange={(e) => setSelectedOffer({ ...selectedOffer, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={selectedOffer.description}
                    onChange={(e) => setSelectedOffer({ ...selectedOffer, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={selectedOffer.discountPercentage}
                    onChange={(e) => setSelectedOffer({ ...selectedOffer, discountPercentage: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    value={selectedOffer.couponCode || ''}
                    onChange={(e) => setSelectedOffer({ ...selectedOffer, couponCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg uppercase"
                    placeholder="e.g. SUMMER20"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <h4 className="font-medium mb-2">Select Products for this Offer</h4>

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">{selectedProducts.length} of {alcoholProducts.length} products selected</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedProducts(alcoholProducts.map(p => p._id))}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedProducts([])}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {alcoholProducts.map(product => (
                  <div
                    key={product._id}
                    onClick={() => toggleProductSelection(product._id)}
                    className={`flex items-center p-3 rounded-lg border transition-colors cursor-pointer ${selectedProducts.includes(product._id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="mr-3">
                      {selectedProducts.includes(product._id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center flex-1 gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                        <img
                          src={product.image || `https://via.placeholder.com/100?text=${product.name}`}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-600">{product.brand}</p>
                      </div>
                      <div className="ml-auto">
                        <p className="font-semibold">₹{product.price}</p>
                        {selectedOffer.discountPercentage > 0 && (
                          <p className="text-xs text-green-600">
                            ₹{Math.round(product.price * (1 - selectedOffer.discountPercentage / 100))} after discount
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {alcoholProducts.length === 0 && (
                  <div className="p-4 text-center text-gray-500 border border-dashed rounded-lg">
                    <AlertTriangle className="w-5 h-5 mx-auto mb-2" />
                    <p>No alcohol products found to apply offers</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
              <button
                onClick={() => {
                  setShowOfferModal(false);
                  setSelectedOffer(null);
                  setSelectedProducts([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyOfferToProducts}
                disabled={selectedProducts.length === 0}
                className={`px-4 py-2 rounded-lg text-white ${selectedProducts.length > 0
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
                  } transition-colors`}
              >
                Apply Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

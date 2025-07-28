import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowRight } from 'lucide-react';
import Button from '../components/Button';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  // Check for existing authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // If already authenticated, redirect to dashboard
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleGetStarted = () => {
    // Clear any existing auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    localStorage.removeItem('isSkippedLogin');
    
    // Always navigate to login
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Store className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome to Liquor Shop Vendor Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your liquor store, track orders, and grow your business with our comprehensive vendor dashboard
          </p>
        </div>

        <div className="space-y-4">
          <Button
            className="text-lg px-8 py-3"
            icon={<ArrowRight className="w-6 h-6" />}
            onClick={handleGetStarted}
          >
            Get Started
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Easy Management</h3>
            <p className="text-gray-600">Manage your inventory, orders, and deliveries all in one place</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Real-time Updates</h3>
            <p className="text-gray-600">Get instant notifications for new orders and delivery status</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Secure Payments</h3>
            <p className="text-gray-600">Track your earnings and receive secure payouts</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
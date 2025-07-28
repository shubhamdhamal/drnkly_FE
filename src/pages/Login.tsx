import React, { useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Store, Eye, EyeOff } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import axios from 'axios';

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [emailOrPhone, setEmailOrPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [sessionTimer, setSessionTimer] = React.useState<NodeJS.Timeout | null>(null);
  const [lastActivityTime, setLastActivityTime] = React.useState<number>(Date.now());

  // Function to handle session timeout
  const handleSessionTimeout = useCallback(() => {
    // Clear all auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionStartTime');
    
    // Show timeout message
    alert('Your session has expired due to inactivity. Please login again.');
    
    // Redirect to login
    navigate('/login');
  }, [navigate]);

  // Function to reset session timer
  const resetSessionTimer = useCallback(() => {
    // Clear existing timer
    if (sessionTimer) {
      clearTimeout(sessionTimer);
    }

    // Update last activity time
    setLastActivityTime(Date.now());

    // Set new timer
    const timer = setTimeout(() => {
      const currentTime = Date.now();
      const timeSinceLastActivity = currentTime - lastActivityTime;
      
      if (timeSinceLastActivity >= SESSION_TIMEOUT) {
        handleSessionTimeout();
      }
    }, SESSION_TIMEOUT);

    setSessionTimer(timer);
  }, [sessionTimer, lastActivityTime, handleSessionTimeout]);

  // Track user activity
  useEffect(() => {
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'keypress'
    ];

    const handleUserActivity = () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        resetSessionTimer();
      }
    };

    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    // Check for existing session and enforce login
    const token = localStorage.getItem('authToken');
    const sessionStartTime = localStorage.getItem('sessionStartTime');
    
    if (!token) {
      // If no token exists, redirect to login
      navigate('/login');
      return;
    }
    
    if (sessionStartTime) {
      const startTime = new Date(sessionStartTime).getTime();
      const currentTime = Date.now();
      const sessionAge = currentTime - startTime;

      if (sessionAge >= SESSION_TIMEOUT) {
        // Session has expired
        handleSessionTimeout();
      } else {
        // Session is still valid, reset timer
        resetSessionTimer();
        navigate('/dashboard');
      }
    } else {
      // If no session start time, redirect to login
      navigate('/login');
    }

    // Cleanup function
    return () => {
      if (sessionTimer) {
        clearTimeout(sessionTimer);
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [navigate, resetSessionTimer, handleSessionTimeout, sessionTimer]);

  const handleEmailOrPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailOrPhone(e.target.value);
  };

  const isEmail = (input: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  const isPhone = (input: string) => /^\d{10}$/.test(input);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (emailOrPhone.trim() === '') {
      setError('Email or mobile number is required.');
      setIsLoading(false);
      return;
    }

    if (/^\d+$/.test(emailOrPhone)) {
      if (!isPhone(emailOrPhone)) {
        setError('Please enter a valid 10-digit mobile number.');
        setIsLoading(false);
        return;
      }
    } else {
      if (!isEmail(emailOrPhone)) {
        setError('Please enter a valid email address.');
        setIsLoading(false);
        return;
      }
    }

    if (password.trim() === '') {
      setError('Password is required.');
      setIsLoading(false);
      return;
    }

    try {
      // Use Codespace backend for development to avoid CORS issues
      const response = await axios.post('http://localhost:5001/api/vendor/login', {
        emailOrPhone,
        password,
      });

      const token = response.data.token;

      if (token) {
        // Store auth data
        localStorage.setItem('authToken', token);
        localStorage.setItem('sessionStartTime', new Date().toISOString());
        
        // Reset session timer
        resetSessionTimer();
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        setError('Invalid credentials.');
      }

      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      if (err.response) {
        setError(err.response.data.error || 'An error occurred.');
      } else {
        setError('An error occurred.');
      }
      console.error('Login Error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <Store className="w-12 h-12 mx-auto text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-900 mt-4">Welcome back</h2>
          <p className="mt-2 text-gray-600">Sign in to your vendor account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <Input
            label="Email address"
            type="text"
            required
            placeholder="Enter your email address"
            value={emailOrPhone}
            onChange={handleEmailOrPhoneChange}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-10 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && <p className="text-red-500 text-center">{error}</p>}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            icon={<LogIn className="w-5 h-5" />}
            className="w-full"
          >
            Sign in
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Register as a vendor
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

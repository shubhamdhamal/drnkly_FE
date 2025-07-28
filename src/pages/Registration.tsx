import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, MapPin, Wine, Store, FileCheck, Eye, EyeOff, Mail, CheckCircle, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import FileUpload from '../components/FileUpload';

interface UploadedFiles {
  license?: File;
  id?: File;
}

type VerificationMethod = 'otp' | 'admin';

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({});
  const categories = ['Drinks', 'Cigarette', 'Soft Drinks', 'Snacks', 'Glasses & Plates'];
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [vendorId, setVendorId] = useState<string>('');
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('otp');

  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: ''
  });

  // OTP related states
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [errors, setErrors] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    special: false
  });

  useEffect(() => {
    if (!vendorId) return;
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/vendor/status/${vendorId}`);
        setVerificationStatus(res.data.verificationStatus);
      } catch (err) {
        console.error('Error fetching vendor status:', err);
      }
    };
    fetchStatus();
  }, [vendorId]);

  useEffect(() => {
    // Validate password as user types
    setPasswordRequirements({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    });
  }, [password]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);

  const isPasswordValid = () => {
    return Object.values(passwordRequirements).every(req => req === true);
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleFileUpload = (type: keyof UploadedFiles) => (file: File) => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: file
    }));
  };

  const sendOtp = async () => {
    try {
      setResendDisabled(true);
      setCountdown(60); // 60 seconds countdown

      // Show loading state
      setOtpError('Sending OTP...');

      // Send OTP to the user's email
      const response = await axios.post('http://localhost:5001/api/vendor/send-otp', {
        email: businessEmail
      });

      setOtpSent(true);
      setOtpError('');

      // Show success message
      alert(`OTP has been sent to ${businessEmail}. Please check your inbox and spam folder.`);
    } catch (error: any) {
      console.error('Failed to send OTP:', error);

      // Provide specific error messages based on response
      if (error.response) {
        if (error.response.status === 404) {
          setOtpError('Server endpoint not found. Please contact support.');
        } else if (error.response.data && error.response.data.error) {
          setOtpError(error.response.data.error);
        } else {
          setOtpError('Failed to send OTP. Please try again later.');
        }
      } else if (error.request) {
        // Request was made but no response received
        setOtpError('Network error. Please check your internet connection.');
      } else {
        setOtpError('Failed to send OTP. Please try again.');
      }

      setResendDisabled(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setOtpError('Verifying OTP...');

      const response = await axios.post('http://localhost:5001/api/vendor/verify-otp', {
        email: businessEmail,
        otp: otp
      });

      // If OTP verification is successful, proceed with registration
      setOtpError('');
      return true;
    } catch (error: any) {
      console.error('OTP verification failed:', error);

      // Provide specific error messages based on response
      if (error.response) {
        if (error.response.status === 404) {
          setOtpError('Verification service not available. Please contact support.');
        } else if (error.response.data && error.response.data.error) {
          setOtpError(error.response.data.error);
        } else {
          setOtpError('Invalid or expired OTP. Please try again.');
        }
      } else if (error.request) {
        // Request was made but no response received
        setOtpError('Network error. Please check your internet connection.');
      } else {
        setOtpError('Invalid OTP. Please try again.');
      }

      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (!businessName || !businessEmail || !businessPhone || !password) {
        setErrors((prev: any) => ({
          ...prev,
          businessInfo: 'All business fields are required.'
        }));
        return;
      }
      if (!/^\d{10}$/.test(businessPhone)) {
        setErrors((prev: any) => ({
          ...prev,
          businessPhone: 'Business phone number must be exactly 10 digits.'
        }));
        return;
      }

      if (!isPasswordValid()) {
        setErrors((prev: any) => ({
          ...prev,
          password: 'Password does not meet the requirements.'
        }));
        return;
      }

      setErrors({});
      setStep(step + 1);
      return;
    }

    if (step === 2) {
      if (!uploadedFiles.license) {
        setErrors((prev: any) => ({
          ...prev,
          documentUpload: 'Shop License is required to proceed.'
        }));
        return;
      }

      // Double-check that the uploaded license is a valid File object
      if (!(uploadedFiles.license instanceof File)) {
        setErrors((prev: any) => ({
          ...prev,
          documentUpload: 'Invalid license file. Please re-upload.'
        }));
        return;
      }

      setErrors({});
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!location.addressLine1 || !location.city || !location.state || !location.postalCode) {
        setErrors((prev: any) => ({
          ...prev,
          locationInfo: 'All location fields are required.'
        }));
        return;
      }
      setErrors({});
      setStep(step + 1);
      return;
    }

    if (step === 4) {
      // Move to Step 5 without API call yet
      setStep(5);
      return;
    }

    if (step === 5) {
      // Move to verification method selection
      setStep(6);
      return;
    }

    if (step === 6) {
      if (verificationMethod === 'otp') {
        // Send OTP and move to OTP verification step
        await sendOtp();
        setStep(7);
      } else {
        // Admin approval flow - submit directly
        submitRegistration();
      }
      return;
    }

    if (step === 7 && verificationMethod === 'otp') {
      if (!otp) {
        setOtpError('Please enter the OTP sent to your email');
        return;
      }

      const isOtpValid = await verifyOtp();
      if (!isOtpValid) {
        return; // Error is set in verifyOtp function
      }

      // OTP verified, proceed with registration
      submitRegistration();
    }
  };

  const submitRegistration = async () => {
    try {
      const registrationData = {
        businessName,
        businessEmail,
        businessPhone,
        password,
        location,
        productCategories: selectedCategories,
        verificationMethod
      };

      const res = await axios.post('http://localhost:5001/api/vendor/register', registrationData);
      setVendorId(res.data.vendorId);
      setVerificationStatus('pending');

      if (verificationMethod === 'admin') {
        // Show admin approval waiting screen
        setStep(8);
      } else {
        // OTP verified, go to login
        navigate('/login');
      }
    } catch (error: any) {
      console.error('❌ Registration failed:', error.response?.data || error.message);
      alert('Registration failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 relative">
            <h2 className="text-xl font-semibold">Business Information</h2>
            <Input label="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Enter your business name" required />
            <Input label="Business Email" type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} placeholder="Enter your business email" required />
            <Input
              label="Business Phone"
              type="tel"
              value={businessPhone}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,10}$/.test(value)) {
                  setBusinessPhone(value);
                  setErrors((prev: any) => ({ ...prev, businessPhone: undefined }));
                }
              }}
              placeholder="Enter your business phone"
              required
            />
            {errors.businessPhone && <p className="text-red-500">{errors.businessPhone}</p>}
            <div className="relative">
              <Input
                label="Create Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a strong password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-10 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="mt-2 space-y-1 text-sm">
              <p className="font-medium text-gray-700">Password must contain:</p>
              <ul className="pl-4 space-y-1">
                <li className={passwordRequirements.length ? "text-green-600" : "text-red-500"}>
                  ✓ At least 8 characters
                </li>
                <li className={passwordRequirements.uppercase ? "text-green-600" : "text-red-500"}>
                  ✓ At least one uppercase letter (A-Z)
                </li>
                <li className={passwordRequirements.lowercase ? "text-green-600" : "text-red-500"}>
                  ✓ At least one lowercase letter (a-z)
                </li>
                <li className={passwordRequirements.special ? "text-green-600" : "text-red-500"}>
                  ✓ At least one special character (@, #, $, etc.)
                </li>
              </ul>
            </div>

            {errors.password && <p className="text-red-500">{errors.password}</p>}
            {errors.businessInfo && <p className="text-red-500">{errors.businessInfo}</p>}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Document Upload</h2>
            <FileUpload label="Shop License" icon={<FileCheck className="w-12 h-12" />} accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload('license')} description="" />
            {errors.documentUpload && <p className="text-red-500">{errors.documentUpload}</p>}
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Location Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Address Line 1" value={location.addressLine1} onChange={(e) => setLocation({ ...location, addressLine1: e.target.value })} placeholder="Street address" required />
              <Input label="Address Line 2" value={location.addressLine2} onChange={(e) => setLocation({ ...location, addressLine2: e.target.value })} placeholder="Apartment, suite, etc." />
              <Input label="City" value={location.city} onChange={(e) => setLocation({ ...location, city: e.target.value })} placeholder="Enter city" required />
              <Input label="State" value={location.state} onChange={(e) => setLocation({ ...location, state: e.target.value })} placeholder="Enter state" required />
              <Input label="Postal Code" value={location.postalCode} onChange={(e) => setLocation({ ...location, postalCode: e.target.value })} placeholder="Enter postal code" required />
              <Button type="button" variant="secondary" icon={<MapPin className="w-5 h-5" />} className="mt-6">Use Current Location</Button>
            </div>
            {errors.locationInfo && <p className="text-red-500">{errors.locationInfo}</p>}
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Product Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map(category => (
                <div key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`category-${category}`}
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`category-${category}`} className="ml-2 text-gray-700">
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Review Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Business Details</h3>
              <p><span className="font-medium">Name:</span> {businessName}</p>
              <p><span className="font-medium">Email:</span> {businessEmail}</p>
              <p><span className="font-medium">Phone:</span> {businessPhone}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Location</h3>
              <p>{location.addressLine1}</p>
              {location.addressLine2 && <p>{location.addressLine2}</p>}
              <p>{location.city}, {location.state} {location.postalCode}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Product Categories</h3>
              <p>{selectedCategories.join(', ') || 'None selected'}</p>
            </div>

            <p className="text-sm text-gray-600">
              Please review your information carefully before proceeding to the next step.
            </p>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Choose Verification Method</h2>
            <p className="text-gray-600">Select how you want to verify your account:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div
                className={`border rounded-lg p-6 cursor-pointer transition-all ${verificationMethod === 'otp' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                onClick={() => setVerificationMethod('otp')}
              >
                <div className="flex items-center mb-4">
                  <Mail className="w-8 h-8 text-blue-500 mr-3" />
                  <h3 className="text-lg font-medium">Email OTP Verification</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  We'll send a one-time password to your email. Verify it to complete registration instantly.
                </p>
                <div className="mt-4 flex items-center">
                  <input
                    type="radio"
                    id="otp-method"
                    name="verification-method"
                    checked={verificationMethod === 'otp'}
                    onChange={() => setVerificationMethod('otp')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="otp-method" className="ml-2 text-gray-700">Select</label>
                </div>
              </div>

              <div
                className={`border rounded-lg p-6 cursor-pointer transition-all ${verificationMethod === 'admin' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                onClick={() => setVerificationMethod('admin')}
              >
                <div className="flex items-center mb-4">
                  <UserCheck className="w-8 h-8 text-blue-500 mr-3" />
                  <h3 className="text-lg font-medium">Admin Approval</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Submit your registration for admin review. You'll be notified when your account is approved.
                </p>
                <div className="mt-4 flex items-center">
                  <input
                    type="radio"
                    id="admin-method"
                    name="verification-method"
                    checked={verificationMethod === 'admin'}
                    onChange={() => setVerificationMethod('admin')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="admin-method" className="ml-2 text-gray-700">Select</label>
                </div>
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Email Verification</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-start space-x-4">
              <Mail className="w-6 h-6 text-blue-500 mt-1" />
              <div>
                <h3 className="font-medium text-blue-800">Verify your email address</h3>
                <p className="text-sm text-blue-600 mt-1">
                  We've sent a verification code to <span className="font-medium">{businessEmail}</span>.
                  Please check your inbox and enter the code below.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <Input
                label="Enter OTP"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 6) {
                    setOtp(value);
                    setOtpError('');
                  }
                }}
                placeholder="6-digit code"
                maxLength={6}
              />
              {otpError && <p className="text-red-500 mt-2">{otpError}</p>}

              <div className="mt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={resendDisabled}
                  className={`text-sm ${resendDisabled ? 'text-gray-400' : 'text-blue-600 hover:text-blue-800'}`}
                >
                  {resendDisabled ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </button>
                <p className="text-sm text-gray-500">
                  Didn't receive the code? Check your spam folder.
                </p>
              </div>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Registration Submitted</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-yellow-800">Application Under Review</h3>
                <p className="text-sm text-yellow-600 mt-1">Our team is reviewing your application. This usually takes 1-2 business days.</p>
              </div>
              <div className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                pending
              </div>
            </div>

            <p className="text-gray-600">
              You will receive an email notification when your account is approved. Once approved, you can log in to your vendor dashboard.
            </p>

            <div className="mt-6">
              <Button type="button" onClick={() => navigate('/login')} variant="secondary">
                Go to Login Page
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <Store className="w-12 h-12 mx-auto text-blue-600" />
            <h1 className="text-3xl font-bold mt-4">Vendor Registration</h1>
            <p className="text-gray-600 mt-2">Complete your profile to start selling</p>
          </div>

          <div className="flex justify-between mb-8 relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2" />
            <div className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 transition-all duration-300" style={{ width: `${((step - 1) / 7) * 100}%` }} />
            {[1, 2, 3, 4, 5, 6, 7].map(stepNumber => (
              <div key={stepNumber} className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${step >= stepNumber ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-300 text-gray-500'}`}>
                <span className="text-sm">{stepNumber}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {renderStep()}
            <div className="flex justify-between pt-6 border-t">
              {step > 1 && step !== 8 && (
                <Button type="button" variant="secondary" onClick={() => setStep(step - 1)}>
                  Previous
                </Button>
              )}
              <div className="flex flex-col">
                {step !== 8 && (
                  <Button type="submit">
                    {step === 7 ? 'Verify & Register' : step === 6 ? 'Continue with ' + (verificationMethod === 'otp' ? 'OTP' : 'Admin Approval') : 'Continue'}
                  </Button>
                )}
                {step === 6 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {verificationMethod === 'otp' ? 'You will receive an OTP on your email' : 'Your application will be reviewed by admin'}
                  </p>
                )}
                {step === 7 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Please enter the OTP sent to your email
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;

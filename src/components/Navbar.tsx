import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, ChevronDown } from 'lucide-react';
import Button from '../components/Button';
import axios from 'axios';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileInline, setShowProfileInline] = useState(false);
  const [vendorData, setVendorData] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
   
  });

  const profileRef = useRef<HTMLDivElement>(null); // Profile box ref
  const userMenuRef = useRef<HTMLDivElement>(null); // Dropdown ref

  // Fetch vendor data on component mount
  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const token = localStorage.getItem('authToken'); // Get the auth token from localStorage
        if (token) {
          const response = await axios.get('http://localhost:5001/api/vendor/profile', {
            headers: {
              Authorization: `Bearer ${token}`, // Send token in Authorization header
            },
          });
          setVendorData(response.data); // Set the fetched vendor data
        } else {
          console.error('No token found');
        }
      } catch (err) {
        console.error('Failed to fetch vendor data:', err);
      }
    };

    fetchVendorData();
  }, []);

  const handleLogout = () => {
    // Remove both auth token and skipped login flag
    localStorage.removeItem('authToken');
    localStorage.removeItem('isSkippedLogin');
    
    // Dispatch a storage event to notify other components
    window.dispatchEvent(new Event('storage'));
    
    navigate('/login'); // Navigate to login page
  };

  const handleSave = async (updatedData: any) => {
    try {
      const token = localStorage.getItem('authToken'); // Get the auth token from localStorage
      if (token) {
        // Send updated profile data to the server
        const response = await axios.put('http://localhost:5001/api/vendor/profile', updatedData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setVendorData(response.data); // Update the vendor data with the response
        setShowProfileInline(false); // Close the profile inline view
        alert('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };
  

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideProfile = profileRef.current?.contains(target);
      const isInsideUserMenu = userMenuRef.current?.contains(target);
      const isUserButton = (event.target as HTMLElement).closest('.user-button');

      if (!isInsideProfile && !isInsideUserMenu && !isUserButton) {
        setShowProfileInline(false);
        setShowUserMenu(false);
      }
    };

    if (showProfileInline || showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileInline, showUserMenu]);

  return (
    <>
      <nav className="navbar">
        {/* Notifications */}
        <div className="notification-wrapper">
          <button
            className="icon-button"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5" />
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="dropdown-header">Notifications</div>
              {/* Add notifications here */}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="user-menu">
          <button
            className="user-button"
            onClick={() => {
              const newState = !showUserMenu;
              setShowUserMenu(newState);
              setShowProfileInline(newState);
            }}
          >
            <div className="user-avatar">
              <User className="w-5 h-5" />
            </div>
            <div className="user-info">
              <div className="user-name">{vendorData.businessName || 'Guest User'}</div>
            
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>

          <div
            ref={userMenuRef}
            className={`dropdown-menu ${!showUserMenu ? 'dropdown-menu-hidden' : ''}`}
          >
            <button
              className="dropdown-item"
              onClick={() => {
                setShowUserMenu(false);
                setShowProfileInline(true);
              }}
            >
              <User className="w-4 h-4" />
              Profile
            </button>

            <div className="dropdown-divider" />

            <button className="dropdown-item" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {showProfileInline && (
        <div ref={profileRef}>
          <ProfileInline vendorData={vendorData} onSave={handleSave} />
        </div>
      )}
    </>
  );
};

const ProfileInline: React.FC<{ vendorData: any; onSave: (updatedData: any) => void }> = ({ vendorData, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(vendorData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleCancel = () => {
    setFormData(vendorData); // Reset to original data
    setIsEditing(false);
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '24px', margin: '16px', borderRadius: '10px', boxShadow: '0 0 8px rgba(0,0,0,0.05)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>Vendor Profile</h2>

      {!isEditing ? (
        <>
          <p><strong>Name:</strong> {formData.businessName}</p>
          <p><strong>Email:</strong> {formData.businessEmail}</p>
          <p><strong>Phone:</strong> {formData.businessPhone}</p>
         
          <Button onClick={() => setIsEditing(true)} style={{ marginTop: '10px' }}>Edit</Button>
        </>
      ) : (
        <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Name" style={inputStyle} />
          <input name="businessEmail" value={formData.businessEmail} onChange={handleChange} placeholder="Email" style={inputStyle} />
          <input name="businessPhone" value={formData.businessPhone} onChange={handleChange} placeholder="Phone" style={inputStyle} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button onClick={handleSave}>Save</Button>
            <Button onClick={handleCancel} variant="secondary">Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  fontSize: '14px',
};

export default Navbar;

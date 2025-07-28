import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import axios from 'axios';
import { User, BookOpen } from 'lucide-react';
import NavButton from '../components/NavButton';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const Profile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    address: '',
  });
  const [originalData, setOriginalData] = useState(formData);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Fetch the vendor's profile on component mount
  useEffect(() => {
    const fetchVendorData = async () => {
      const token = localStorage.getItem('authToken'); // Get the auth token from localStorage
      if (!token) {
        setError('No authentication token found');
        return;
      }

      try {
        // Send the request to the backend to fetch the profile data
        const response = await axios.get(`${API_BASE_URL}/api/vendor/profile`, {
          headers: {
            Authorization: `Bearer ${token}`, // Send token in Authorization header
          },
        });

        // Set the fetched vendor data into formData state
        const { businessName, businessEmail, businessPhone, location } = response.data;
        setFormData({
          businessName,
          businessEmail,
          businessPhone,
          address: `${location.addressLine1}, ${location.city}, ${location.state}`,
        });
        setOriginalData({
          businessName,
          businessEmail,
          businessPhone,
          address: `${location.addressLine1}, ${location.city}, ${location.state}`,
        });
      } catch (err) {
        console.error('Error fetching vendor profile:', err);
        setError('Failed to fetch vendor profile');
      }
    };

    fetchVendorData();
  }, []);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const isSkipped = localStorage.getItem('isSkippedLogin');
    setIsLoggedIn(!!token && !isSkipped);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    setOriginalData(formData);
    setIsEditing(false);
    alert('Profile updated successfully!');
    // Optional: Send updated data to backend here
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Vendor Profile</h1>

      {!isEditing ? (
        <div style={styles.profileBox}>
          <p><strong>Name:</strong> {formData.businessName}</p>
          <p><strong>Email:</strong> {formData.businessEmail}</p>
          <p><strong>Phone:</strong> {formData.businessPhone}</p>
          <p><strong>Address:</strong> {formData.address}</p>

          <Button onClick={() => setIsEditing(true)} style={{ marginTop: '20px' }}>
            Update Profile
          </Button>
        </div>
      ) : (
        <form style={styles.form} onSubmit={(e) => e.preventDefault()}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="businessEmail"
              value={formData.businessEmail}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Phone</label>
            <input
              type="tel"
              name="businessPhone"
              value={formData.businessPhone}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              style={{ ...styles.input, resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <Button onClick={handleSave}>Save</Button>
            <Button onClick={handleCancel} variant="secondary">Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
};

// Inline Styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '600px',
    margin: '40px auto',
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 0 15px rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '24px',
    textAlign: 'center',
  },
  profileBox: {
    fontSize: '16px',
    lineHeight: '1.8',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '6px',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '15px',
  },
};

export default Profile;

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Input from '../components/Input';
import axios from 'axios';

const DeliveryPartners: React.FC = () => {
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerPassword, setPartnerPassword] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Fetch all delivery partners when component mounts
  useEffect(() => {
    const fetchDeliveryPartners = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/delivery-partners', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        });
        setDeliveryPartners(response.data.deliveryPartners);
      } catch (error) {
        console.error('Error fetching delivery partners:', error);
      }
    };

    fetchDeliveryPartners();
  }, []);



  const handleViewDetails = (partner: any) => {
    alert(`Viewing details of: ${partner.name}`);
  };

  return (
    <Layout>
      <div className="delivery-partner-list">
        {/* Header with Add Delivery Partner button */}
        <div className="header-container">
          <h2 className="form-title">Delivery Partners</h2>

        </div>

        {/* Display List of Registered Delivery Partners */}
        <div className="partner-list-container">
          {deliveryPartners.map((partner, index) => (
            <div key={index} className="partner-card">
              <div className="partner-info">
                <h3>{partner.name}</h3>
                <Button onClick={() => handleViewDetails(partner)} className="view-button">
                  View
                </Button>
              </div>
              <p>Email: {partner.email}</p>
              <p>Phone: {partner.phone}</p>
            </div>
          ))}
        </div>
      </div>


      <style>{`
        .delivery-partner-list {
          padding: 24px;
        }

        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .form-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 0;
        }

        .form-subtitle {
          font-size: 20px;
          font-weight: 500;
          margin-bottom: 16px;
        }

        .add-partner-button {
          padding: 8px 16px;
          font-size: 14px;
          background-color: #007BFF;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .add-partner-button:hover {
          background-color: #0056b3;
        }

        .registration-container {
          background-color: white;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .registration-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        label {
          font-size: 14px;
          color: #666;
        }

        .form-input {
          padding: 10px;
          font-size: 16px;
          border: 1px solid #ccc;
          border-radius: 6px;
          outline: none;
        }

        .form-input:focus {
          border: 1px solid #007BFF;
        }

        .submit-button {
          padding: 12px 16px;
          font-size: 16px;
          background-color: #007BFF;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .submit-button:hover {
          background-color: #0056b3;
        }

        .partner-list-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .partner-card {
          padding: 20px;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
        }

        .partner-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .partner-info h3 {
          font-size: 18px;
          margin: 0;
        }

        .view-button {
          background-color: #007BFF;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.3s;
          font-size: 14px;
        }

        .view-button:hover {
          background-color: #0056b3;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-box {
          background: #fff;
          padding: 24px;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
        }

        .close-button {
          padding: 8px 16px;
          font-size: 14px;
          background-color: #f44336;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.3s ease;
          margin-top: 20px;
        }

        .close-button:hover {
          background-color: #d32f2f;
        }
      `}</style>
    </Layout>
  );
};

export default DeliveryPartners;

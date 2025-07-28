// components/MapViewContent.tsx
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../components/Button';

const MapViewContent: React.FC = () => {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const address = params.get('address');

  return (
    <div style={{ padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '10px' }}>
        Delivery Route for Order {orderId}
      </h2>

      <p style={{ marginBottom: '10px', color: '#666' }}>
        Vendor Location: <strong>Koramangala, Bangalore</strong><br />
        Customer Address: <strong>{decodeURIComponent(address || '')}</strong>
      </p>

      <div style={{ borderRadius: '10px', overflow: 'hidden', height: '500px', marginBottom: '20px' }}>
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/directions?key=YOUR_GOOGLE_MAPS_API_KEY&q=Koramangala,Bangalore+to+${address}`}
          allowFullScreen
        ></iframe>
      </div>

      <div style={{ textAlign: 'right' }}>
        <Button variant="secondary" onClick={() => window.history.back()}>
          Back to Pickup
        </Button>
      </div>
    </div>
  );
};

export default MapViewContent;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Button from '../components/Button';
import { API_BASE_URL } from '../config';

const Availability: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);

  // ✅ Fetch vendor products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('No token found');
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/vendor/products`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProducts(response.data.products);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  // ✅ Handle toggle and update backend instantly
  const handleToggle = async (productId: string, currentStockStatus: boolean) => {
    const updatedStockStatus = !currentStockStatus;

    const updatedProducts = products.map((product) =>
      product._id === productId ? { ...product, inStock: updatedStockStatus } : product
    );
    setProducts(updatedProducts);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      await axios.put(
        `${API_BASE_URL}/api/products/update-stock`,
        {
          products: [{ productId, inStock: updatedStockStatus }],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(`✅ ${productId} updated to ${updatedStockStatus ? 'In Stock' : 'Out of Stock'}`);
    } catch (error) {
      console.error('❌ Failed to update stock:', error);
    }
  };

  // 🔁 Optional bulk save (if needed)
  const handleSaveAvailability = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No token found');
        return;
      }

      const updatedProducts = products.map((product) => ({
        productId: product._id,
        inStock: product.inStock,
      }));

      const response = await axios.put(
        `${API_BASE_URL}/api/products/update-stock`,
        { products: updatedProducts },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ Stock status updated successfully', response.data);
    } catch (error) {
      console.error('❌ Error saving availability settings:', error);
    }
  };

  return (
    <div className="availability-wrapper">
      <h1 className="title">Set Availability</h1>

      <div className="section">
        <h2 className="section-title">Product Availability</h2>
        <div className="product-list">
          {products.map((product) => (
            <div key={product._id} className="product-card">
              <div>
                <div className="product-name">{product.name}</div>
                <div className="product-category">{product.category}</div>
              </div>
              <div className="product-actions">
                <span className={`stock-label ${product.inStock ? 'in-stock' : 'out-stock'}`}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={product.inStock}
                    onChange={() => handleToggle(product._id, product.inStock)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button className="save-button" onClick={handleSaveAvailability}>
        Save Availability Settings
      </Button>

      <style>{`
        .availability-wrapper {
          padding: 20px;
          font-family: sans-serif;
        }

        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
        }

        .section {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          box-shadow: 0 0 5px rgba(0,0,0,0.1);
        }

        .section-title {
          font-size: 18px;
          margin-bottom: 15px;
        }

        .product-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .product-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f9f9f9;
          padding: 14px 18px;
          border-radius: 6px;
        }

        .product-name {
          font-weight: 600;
        }

        .product-category {
          font-size: 13px;
          color: #777;
        }

        .product-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stock-label {
          font-size: 13px;
          padding: 4px 8px;
          border-radius: 20px;
        }

        .in-stock {
          background: #d1fae5;
          color: #065f46;
        }

        .out-stock {
          background: #fee2e2;
          color: #991b1b;
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.4s;
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.4s;
          border-radius: 50%;
        }

        .switch input:checked + .slider {
          background-color: #4ade80;
        }

        .switch input:checked + .slider:before {
          transform: translateX(20px);
        }

        .save-button {
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
};

export default Availability;

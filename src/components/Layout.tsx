import React from 'react';
import {
  Menu,
  Store,
  Package,
  Clock,
  ShoppingBag,
  Truck,
  Wallet,
  User,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import '../styles/Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const menuItems = [
    { icon: Store, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: Clock, label: 'Availability', path: '/availability' },
    { icon: ShoppingBag, label: 'Orders', path: '/orders' },
    { icon: Truck, label: 'Ready for Pickup', path: '/pickup' },
    { icon: Wallet, label: 'Payouts', path: '/payouts' },
    { icon: User, label: 'Delivery Partner', path: '/delivery-partners' },

    // ✅ Added new items below
    { icon: AlertCircle, label: 'Report Issue', path: '/issue-report' },
    { icon: AlertCircle, label: 'Track Issue', path: '/issue-tracking' }
  ];
  
  // Past Orders page is accessible only after handover, not from navigation

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    
    // Dispatch storage event
    window.dispatchEvent(new Event('storage'));
    
    // Navigate to login
    navigate('/login');
  };

  return (
    <div className="layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="menu-button"
          aria-label="Toggle menu"
        >
          <Menu />
        </button>
        <div className="header-logo">
          <div className="logo-icon">
            <Store />
          </div>
          <h1>Liquor Shop</h1>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-container">
            <div className="logo-badge">
              <Store />
            </div>
            <div className="logo-text">
              <h1>Liquor Shop</h1>
              <p>Vendor Portal</p>
            </div>
          </div>
        </div>

        <nav className="nav-container">
          <div className="nav-items">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon />
                  <span>{item.label}</span>
                  {isActive && <div className="active-indicator" />}
                </Link>
              );
            })}
          </div>
          
          {/* Logout Button - Positioned at the bottom */}
          <div className="sidebar-footer">
            <button 
              onClick={() => {
                handleLogout();
                setIsSidebarOpen(false);
              }}
              className="nav-link logout-button"
            >
              <LogOut />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Content Area */}
      <div className="content-area">
        <Navbar />
        <main className="main-content">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Layout;

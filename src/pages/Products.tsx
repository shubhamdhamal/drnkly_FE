import React, { useState, useEffect } from 'react';
import { Plus, Search, Wine, Edit, Trash2, X, ChevronRight } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import FileUpload from '../components/FileUpload';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface Product {
  inStock: any;
  _id: string; // Use _id for MongoDB ID
  name: string;
  brand: string;
  category: string;
  alcoholContent: number;
  price: number;
  stock: number;
  description: string;
  volume: number;
  image: string; // Image path will be saved in the database
}

interface Category {
  _id: string;
  name: string;
}

const Products: React.FC = () => {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Add debounce for search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Add useEffect to check for search query in localStorage
  useEffect(() => {
    const storedQuery = localStorage.getItem('productSearchQuery');
    if (storedQuery) {
      setSearchQuery(storedQuery);
      // Clear the stored query after using it
      localStorage.removeItem('productSearchQuery');
    }
  }, []);

  // Fetch products and categories when the component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('No authentication token found');
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/products/vendor`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProducts(response.data.products); // Set vendor's products
      } catch (error) {
        console.error('Error fetching vendor products:', error);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/categories`);
        setCategories(response.data.categories); // Update state with categories
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchProducts();
    fetchCategories();
  }, []);


  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/products/add`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          // ❌ REMOVE manual Content-Type!
          // Let Axios set it with proper boundary.
        },
      });

      setProducts((prevProducts) => [...prevProducts, response.data.product]);
      setShowAddProduct(false);
      form.reset();
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };



  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct?._id) {
      console.error('Product ID is missing:', editingProduct);
      return;
    }

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const updatedProduct: Product = {
      ...editingProduct,
      name: formData.get('name') as string,
      brand: formData.get('brand') as string,
      category: formData.get('category') as string,
      alcoholContent: Number(formData.get('alcoholContent')),
      price: Number(formData.get('price')),
      stock: Number(formData.get('stock')),
      description: formData.get('description') as string,
      volume: Number(formData.get('volume')),
    };

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Sending the PUT request to update the product
      const response = await axios.put(
        `${API_BASE_URL}/api/products/${updatedProduct._id}`, // Use _id instead of id
        updatedProduct,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      // After successful update, update the state to reflect the changes in the current page
      setProducts(
        products.map((p) =>
          p._id === updatedProduct._id ? response.data.product : p
        )
      );

      // Close the modal and reset editing states
      setIsEditing(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  // Handle deleting a product
  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('No authentication token found');
          return;
        }

        // Send DELETE request to backend
        await axios.delete(`${API_BASE_URL}/api/products/${productId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        // Remove the product from the state
        setProducts(products.filter((p) => p._id !== productId)); // Remove from UI
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  // Improved search filter function
  const filteredProducts = products.filter((product) => {
    const searchTerms = debouncedSearchQuery.toLowerCase().trim().split(/\s+/);

    // Search in multiple fields
    const searchableText = [
      product.name,
      product.brand,
      product.category,
      product.description
    ].map(text => text?.toLowerCase() || '').join(' ');

    // Check if all search terms are found in any of the searchable fields
    const matchesSearch = searchTerms.every(term =>
      searchableText.includes(term)
    );

    // Category filter
    const matchesCategory = selectedCategory === 'all' ||
      product.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Get immediate search results for dropdown
  const getSearchResults = (query: string) => {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().trim().split(/\s+/);
    return products.filter(product => {
      const searchableText = [
        product.name,
        product.brand,
        product.category,
        product.description
      ].map(text => text?.toLowerCase() || '').join(' ');

      return searchTerms.every(term => searchableText.includes(term));
    }).slice(0, 5); // Show only top 5 results in dropdown
  };

  // Handle product click from search dropdown
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setSearchQuery('');
    setShowSearchDropdown(false);
    // Scroll to the product in the grid
    const element = document.getElementById(`product-${product._id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add highlight animation
      element.classList.add('highlight-product');
      setTimeout(() => {
        element.classList.remove('highlight-product');
      }, 2000);
    }
  };

  const ProductForm = ({
    product,
    onSubmit,
    isEditing,
  }: {
    product?: Product;
    onSubmit: (e: React.FormEvent) => void;
    isEditing: boolean;
  }) => (
    <form onSubmit={onSubmit} className="space-y-4" encType="multipart/form-data">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Product Name" name="name" required defaultValue={product?.name} />
        <Input label="Brand" name="brand" required defaultValue={product?.brand} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          name="category"
          className="w-full px-3 py-2 border rounded-lg"
          defaultValue={product?.category}
          required
        >
          <option value="">Select Category</option>
          {categories.map((category) => (
            <option key={category._id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>

        <Input
          label="Alcohol Content (%)"
          type="number"
          name="alcoholContent"
          required
          defaultValue={product?.alcoholContent}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Price" type="number" name="price" required defaultValue={product?.price} />
        <Input label="Stock" type="number" name="stock" required defaultValue={product?.stock} />
        <Input label="Volume (ml)" type="number" name="volume" required defaultValue={product?.volume} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          rows={3}
          className="w-full px-3 py-2 border rounded-lg"
          defaultValue={product?.description}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
        <input
          type="file"
          name="image"
          accept=".jpg,.jpeg,.png"
          className="w-full px-3 py-2 border rounded-lg"
          required={!isEditing}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          variant="secondary"
          onClick={() => {
            setShowAddProduct(false);
            setIsEditing(false);
            setEditingProduct(null);
          }}
        >
          Cancel
        </Button>
        <Button type="submit">{isEditing ? 'Update Product' : 'Add Product'}</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setShowAddProduct(true)} // Toggles the modal visibility
        >
          Add Product
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Input
            placeholder="Search by name, brand, category..."
            icon={<Search className="w-5 h-5 text-gray-400" />}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            className="w-full"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchDropdown(false);
              }}
              className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {/* Search Dropdown */}
          {showSearchDropdown && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-[300px] overflow-y-auto">
              {getSearchResults(searchQuery).map(product => (
                <div
                  key={product._id}
                  onClick={() => handleProductClick(product)}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-600 truncate">{product.brand}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#cd6839]">₹{product.price}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
              {getSearchResults(searchQuery).length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No products found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
        <select
          className="px-4 py-2 border rounded-lg bg-white min-w-[200px]"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category._id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {filteredProducts.map((product) => (
          <div
            id={`product-${product._id}`}
            key={product._id}
            className={`product-card bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all ${!product.inStock ? 'opacity-60 grayscale pointer-events-none' : ''
              }`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              maxWidth: '220px',
              margin: '0 auto',
              width: '100%'
            }}
          >

            {!product.inStock && (
              <div style={{
                position: 'absolute',
                top: '5px',
                left: '5px',
                backgroundColor: '#ef4444',
                color: 'white',
                fontSize: '12px',
                padding: '2px 6px',
                borderRadius: '4px',
                zIndex: 10
              }}>
                Out of Stock
              </div>
            )}


            <div className="relative"> {/* Content wrapper */}
              <div style={{
                width: '100%',
                height: '120px',
                position: 'relative',
                overflow: 'hidden',
                background: 'white'
              }}>
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-image"
                  style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: 'white',
                    transition: 'transform 0.3s ease'
                  }}
                />
                <div className="ribbon">{product.alcoholContent}% ABV</div>
              </div>
              <div className="p-2">
                <h3 style={{ fontSize: '14px', fontWeight: 600, height: '36px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.name}</h3>
                <p className="text-xs text-gray-600 mb-1">{product.brand}</p>

                {/* Show volume for drinks */}
                {['drinks', 'soft drinks'].includes(product.category.toLowerCase()) ? (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-medium bg-blue-50 text-blue-600 py-0.5 px-1.5 rounded">
                      {product.volume} ml
                    </span>
                    <span className="text-base font-bold text-[#cd6839]">
                      ₹{product.price}
                    </span>
                  </div>
                ) : (
                  <p style={{ color: '#cd6839', fontWeight: 'bold', margin: '2px 0', fontSize: '16px' }}>₹{product.price}</p>
                )}

                <div className={`text-xs mt-1 ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                  {product.inStock ? `${product.stock} in stock` : 'Out of Stock'}
                </div>

              </div>
            </div>

            <div className="p-2 mt-auto grid grid-cols-2 gap-1">
              <Button variant="secondary" icon={<Edit className="w-3 h-3" />} onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
                setEditingProduct(product);
              }}
                className="text-xs py-1 px-2"
              >
                Edit
              </Button>
              <Button variant="danger" icon={<Trash2 className="w-3 h-3" />} onClick={(e) => {
                e.stopPropagation();
                handleDeleteProduct(product._id);
              }}
                className="text-xs py-1 px-2"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add styles for highlight animation */}
      <style>
        {`
          @keyframes highlight {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(205, 104, 57, 0.3); }
          }
          
          .highlight-product {
            animation: highlight 1s ease-in-out;
            border-color: #cd6839;
          }
          
          .product-card {
            border: 1px solid #f0f0f0;
          }
          
          .product-card:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
            border-color: #cd6839;
            z-index: 10;
          }
          
          .product-card:hover .product-image {
            transform: scale(1.15);
          }
          
          .ribbon {
            position: absolute;
            top: 0;
            right: 0;
            background: linear-gradient(45deg, #2563eb, #3b82f6);
            color: white;
            font-size: 10px;
            font-weight: bold;
            padding: 2px 8px;
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 10% 50%);
          }
        `}
      </style>

      {/* Add/Edit Product Modal */}
      {(showAddProduct || isEditing) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => {
                  setShowAddProduct(false);
                  setIsEditing(false);
                  setEditingProduct(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ProductForm
              product={editingProduct || undefined}
              onSubmit={isEditing ? handleEditProduct : handleAddProduct}
              isEditing={isEditing}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

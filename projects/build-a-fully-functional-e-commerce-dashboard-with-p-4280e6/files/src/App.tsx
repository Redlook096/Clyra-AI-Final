import React, { useState } from 'react';
import './styles.css';

// Types
type Tab = 'products' | 'orders' | 'analytics' | 'settings';
interface Product { id: number; name: string; price: number; stock: number; category: string; }
interface Order { id: number; customer: string; date: string; total: number; status: 'Pending' | 'Shipped' | 'Delivered'; }

const initialProducts: Product[] = [
  { id: 1, name: 'Wireless Mouse', price: 29.99, stock: 150, category: 'Electronics' },
  { id: 2, name: 'Mechanical Keyboard', price: 89.99, stock: 75, category: 'Electronics' },
  { id: 3, name: 'USB-C Hub', price: 39.99, stock: 200, category: 'Accessories' },
  { id: 4, name: 'Ergonomic Chair', price: 299.99, stock: 20, category: 'Furniture' },
  { id: 5, name: 'Desk Lamp', price: 49.99, stock: 60, category: 'Furniture' },
];

const initialOrders: Order[] = [
  { id: 1001, customer: 'Alice Johnson', date: '2025-01-15', total: 129.97, status: 'Delivered' },
  { id: 1002, customer: 'Bob Smith', date: '2025-01-18', total: 89.99, status: 'Shipped' },
  { id: 1003, customer: 'Charlie Brown', date: '2025-01-20', total: 299.99, status: 'Pending' },
  { id: 1004, customer: 'Diana Prince', date: '2025-01-22', total: 79.98, status: 'Pending' },
  { id: 1005, customer: 'Eve Adams', date: '2025-01-25', total: 149.97, status: 'Shipped' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({ email: true, sms: false });
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', price: '', stock: '', category: '' });

  const addProduct = () => {
    if (!form.name || !form.price || !form.stock || !form.category) return;
    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : Date.now(),
      name: form.name,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      category: form.category,
    };
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? newProduct : p));
    } else {
      setProducts([...products, newProduct]);
    }
    setShowModal(false);
    setEditingProduct(null);
    setForm({ name: '', price: '', stock: '', category: '' });
  };

  const deleteProduct = (id: number) => {
    if (window.confirm('Delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({ name: product.name, price: product.price.toString(), stock: product.stock.toString(), category: product.category });
    setShowModal(true);
  };

  const updateOrderStatus = (id: number, status: Order['status']) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
  };

  const chartData = [
    { label: 'Jan', value: 400 },
    { label: 'Feb', value: 300 },
    { label: 'Mar', value: 600 },
    { label: 'Apr', value: 800 },
    { label: 'May', value: 500 },
    { label: 'Jun', value: 700 },
  ];

  const totalSales = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <nav className="sidebar">
        <div className="logo">🛒 Clyra</div>
        <ul>
          {(['products', 'orders', 'analytics', 'settings'] as Tab[]).map(tab => (
            <li key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
              <span className="icon">
                {tab === 'products' ? '📦' : tab === 'orders' ? '📋' : tab === 'analytics' ? '📊' : '⚙️'}
              </span>
              <span className="label">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            </li>
          ))}
        </ul>
      </nav>

      <main className="content">
        {activeTab === 'products' && (
          <section className="page fade-in">
            <div className="page-header">
              <h1>Products</h1>
              <button className="btn glass" onClick={() => { setShowModal(true); setEditingProduct(null); setForm({ name: '', price: '', stock: '', category: '' }); }}>+ Add Product</button>
            </div>
            <div className="card-grid">
              {products.map(p => (
                <div key={p.id} className="card glass">
                  <h3>{p.name}</h3>
                  <p>${p.price.toFixed(2)}</p>
                  <p>Stock: {p.stock}</p>
                  <p className="category">{p.category}</p>
                  <div className="card-actions">
                    <button className="btn small" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn small danger" onClick={() => deleteProduct(p.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            {showModal && (
              <div className="modal-overlay" onClick={() => setShowModal(false)}>
                <div className="modal glass" onClick={e => e.stopPropagation()}>
                  <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                  <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  <input placeholder="Price" type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                  <input placeholder="Stock" type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
                  <input placeholder="Category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
                  <div className="modal-actions">
                    <button className="btn" onClick={addProduct}>{editingProduct ? 'Update' : 'Add'}</button>
                    <button className="btn secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'orders' && (
          <section className="page fade-in">
            <h1>Orders</h1>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{o.customer}</td>
                    <td>{o.date}</td>
                    <td>${o.total.toFixed(2)}</td>
                    <td><span className={`status ${o.status.toLowerCase()}`}>{o.status}</span></td>
                    <td>
                      <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value as Order['status'])}>
                        <option value="Pending">Pending</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === 'analytics' && (
          <section className="page fade-in">
            <h1>Analytics</h1>
            <div className="metrics">
              <div className="metric glass">
                <span className="value">${totalSales.toLocaleString()}</span>
                <span className="label">Total Sales</span>
              </div>
              <div className="metric glass">
                <span className="value">{totalOrders}</span>
                <span className="label">Total Orders</span>
              </div>
              <div className="metric glass">
                <span className="value">${totalRevenue.toFixed(2)}</span>
                <span className="label">Revenue</span>
              </div>
            </div>
            <div className="chart-container glass">
              <h2>Monthly Revenue (Example)</h2>
              <svg viewBox="0 0 600 200" className="chart">
                {(() => {
                  const max = Math.max(...chartData.map(d => d.value));
                  const barWidth = 600 / chartData.length - 10;
                  return chartData.map((d, i) => {
                    const height = (d.value / max) * 160;
                    const x = i * (barWidth + 10) + 5;
                    const y = 180 - height;
                    return <rect key={i} x={x} y={y} width={barWidth} height={height} rx="4" fill="rgba(255,255,255,0.6)" />;
                  });
                })()}
              </svg>
            </div>
          </section>
        )}

        {activeTab === 'settings' && (
          <section className="page fade-in">
            <h1>Settings</h1>
            <div className="settings-card glass">
              <div className="setting-row">
                <span>Dark Mode</span>
                <label className="toggle">
                  <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="setting-row">
                <span>Email Notifications</span>
                <label className="toggle">
                  <input type="checkbox" checked={notifications.email} onChange={() => setNotifications({...notifications, email: !notifications.email})} />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="setting-row">
                <span>SMS Notifications</span>
                <label className="toggle">
                  <input type="checkbox" checked={notifications.sms} onChange={() => setNotifications({...notifications, sms: !notifications.sms})} />
                  <span className="slider"></span>
                </label>
              </div>
              <button className="btn danger" onClick={() => { if(window.confirm('Reset all data?')) { setProducts(initialProducts); setOrders(initialOrders); setDarkMode(false); setNotifications({email: true, sms: false}); }}}>Reset Data</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
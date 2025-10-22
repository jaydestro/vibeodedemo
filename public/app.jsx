import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

function ProductCard({ p }) {
  return (
    <div className="card">
      <img src={p.image} alt={p.title} />
      <div className="card-body">
        <h3>{p.title}</h3>
        <p className="price">${p.price.toFixed(2)}</p>
        <p>{p.description}</p>
      </div>
    </div>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error('Failed to load products', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <h1>Product Catalog</h1>
      {loading && <p>Loading products…</p>}
      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(React.createElement(App));
}

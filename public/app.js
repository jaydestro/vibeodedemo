// Uses global React and ReactDOM from UMD builds included in index.html
(function () {
  const { useEffect, useState, createElement } = React;

  function ProductCard(_ref) {
    const p = _ref.p;
    return createElement(
      'div',
      { className: 'card' },
      createElement('img', { src: p.image, alt: p.title }),
      createElement(
        'div',
        { className: 'card-body' },
        createElement('h3', null, p.title),
        createElement('p', { className: 'price' }, '$' + p.price.toFixed(2)),
        createElement('p', null, p.description)
      )
    );
  }

  function App() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
      fetch('/api/products')
        .then((r) => r.json())
        .then((data) => setProducts(data))
        .catch((err) => console.error('Failed to load products', err))
        .finally(() => setLoading(false));
    }, []);

    function applyDiscount(percent) {
      setUpdating(true);
      fetch('/api/products/update-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountPercent: percent }),
      })
        .then((r) => r.json())
        .then(() => {
          // refresh
          setLoading(true);
          return fetch('/api/products').then((r) => r.json()).then((data) => setProducts(data));
        })
        .catch((err) => console.error('Update failed', err))
        .finally(() => {
          setUpdating(false);
          setLoading(false);
        });
    }

    return createElement(
      'div',
      { className: 'container' },
      createElement(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        createElement('h1', null, 'Product Catalog'),
        createElement(
          'div',
          null,
          createElement(
            'button',
            { onClick: () => applyDiscount(10), disabled: updating },
            updating ? 'Applying…' : 'Apply 10% discount to all'
          )
        )
      ),
      loading && createElement('p', null, 'Loading products…'),
      createElement(
        'div',
        { className: 'grid' },
        products.map((p) => createElement(ProductCard, { key: p.id, p: p }))
      )
    );
  }

  const rootEl = document.getElementById('root');
  if (rootEl) {
    ReactDOM.createRoot(rootEl).render(createElement(App));
  }
})();

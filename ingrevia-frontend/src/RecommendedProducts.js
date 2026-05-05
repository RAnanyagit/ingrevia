import { useEffect, useState, useContext } from "react";
import { API_URL } from "./config";
import { CartContext } from "./context/CartContext";
import "./App.css";

// 🚀 IMPORT LOCAL ASSETS
import cleanser from "./assets/products/cleanser.png";
import lotion from "./assets/products/lotion.png";
import serum from "./assets/products/serum.png";
import shampoo from "./assets/products/shampoo.png";
import sunscreen from "./assets/products/sunscreen.png";

// 🚀 CREATE IMAGE MAPPING
const imageMap = {
  "cleanser.png": cleanser,
  "lotion.png": lotion,
  "serum.png": serum,
  "shampoo.png": shampoo,
  "sunscreen.png": sunscreen,
};

function RecommendedProducts({ userEmail }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    if (!userEmail) return;
    
    setLoading(true);
    // 🔥 IMPORTANT DEBUG LOG AS REQUESTED
    console.log("Fetching products for:", userEmail);
    
    fetch(`${API_URL}/products-with-risk?user_email=${userEmail}`)
      .then(res => res.json())
      .then(data => {
        console.log("API DATA:", data); // 🔥 IMPORTANT DEBUG
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          console.error("API returned non-array data:", data);
          setProducts([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch products:", err);
        setLoading(false);
      });
  }, [userEmail]);


  const getRiskColor = (risk) => {
    if (risk === "Critical") return "#f85149";
    if (risk === "High") return "var(--risk-high)";
    if (risk === "Moderate") return "#d29922";
    return "var(--risk-low)";
  };

  return (
    <div className="products-container" style={{ animation: "fadeIn 0.5s ease" }}>
      <header className="section-header">
        <h2>🛍️ Recommended Products</h2>
        <p>Personalized safety check for your favorite skincare items.</p>
      </header>

      {loading ? (
        <div className="spinner-container"><div className="spinner"></div></div>
      ) : products.length === 0 ? (
        <div className="no-products-msg">
           <p>No products found for your profile. Please check if your account exists.</p>
        </div>
      ) : (
        <div className="product-grid-main">
          {products.map((p) => (
            <div key={p.id} className="product-premium-card glass-panel">
              <div className={`risk-indicator ${p.risk.toLowerCase()}`}></div>
              <div className="product-image-container">
                <img 
                  src={imageMap[p.image] || cleanser} 
                  alt={p.name} 
                  className="product-img-mini" 
                />
              </div>
              <div className="product-info-top">
                <h4>{p.name}</h4>
                <div className="product-price">₹{p.price}</div>
              </div>
              
              <p className="product-ingredients-preview">
                {p.ingredients.substring(0, 50)}...
              </p>

              <div className="risk-badge-row">
                 <span className="risk-status" style={{ color: getRiskColor(p.risk) }}>
                   {p.risk} Risk
                 </span>
              </div>

              <button 
                className={`btn-product ${p.risk === "High" ? "btn-warning" : "btn-buy"}`}
                onClick={() => addToCart(p)}
              >
                {p.risk === "High" ? "Add Anyway" : "Add to Cart"}
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default RecommendedProducts;

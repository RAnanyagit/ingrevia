import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_URL } from "./config";
import "./App.css";

function OrderSummary() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`${API_URL}/order/${orderId}`);
        const data = await response.json();
        if (response.ok) {
          setOrder(data);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleDownloadInvoice = () => {
    window.open(`${API_URL}/invoice/${orderId}`, "_blank");
  };

  const handleDownloadReport = () => {
    window.open(`${API_URL}/allergy-report/${orderId}`, "_blank");
  };

  if (loading) {
    return (
      <div className="order-summary-container">
        <div className="spinner-container"><div className="spinner"></div></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-summary-container glass-panel">
        <h1>Order Not Found</h1>
        <p>We couldn't find the details for this order.</p>
        <Link to="/" className="btn-shop-now">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="order-summary-container glass-panel animate-fade-in">
      <div className="success-check">✅</div>
      <h1>Order Successful!</h1>
      <p className="order-subtitle">Thank you for choosing safe skincare with Ingrevia.</p>

      <div className="order-card glass-panel">
        <div className="order-card-header">
          <div>
            <span className="label">Order ID:</span>
            <span className="value">#{order.id}</span>
          </div>
          <div>
            <span className="label">Date:</span>
            <span className="value">{new Date(order.date).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="order-items-mini">
          {order.items.map((item) => (
            <div key={item.id} className="mini-item">
              <span className="mini-item-name">{item.name} x {item.quantity}</span>
              <span className="mini-item-price">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="order-card-total">
          <span>Total Paid</span>
          <span>₹{order.total}</span>
        </div>
      </div>

      <div className="order-actions">
        <button className="btn-download-invoice" onClick={handleDownloadInvoice}>
          📄 Download Invoice (PDF)
        </button>
        <button className="btn-download-report" onClick={handleDownloadReport}>
          📋 Allergy Analysis Report
        </button>
        <Link to="/" className="btn-back-home">Continue Shopping</Link>
      </div>

      <div className="allergy-disclaimer">
        <p>🛡️ Your invoice includes a personalized <b>Allergy Safety Summary</b> for these items.</p>
      </div>
    </div>
  );
}

export default OrderSummary;

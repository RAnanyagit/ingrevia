import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./Login";
import Navbar from "./Navbar";
import Dashboard from "./Dashboard";
import Profile from "./Profile";
import HistoryPage from "./HistoryPage";
import ResultsPage from "./ResultsPage";
import CartPage from "./CartPage";
import OrderSummary from "./OrderSummary";
import Chatbot from "./Chatbot";
import { CartProvider } from "./context/CartContext";
import { AllergyProvider } from "./context/AllergyContext";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("email");
    if (savedUser) setUser(savedUser);
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (loading) return null;

  return (
    <Router>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        <AllergyProvider userEmail={user}>
          <CartProvider userEmail={user}>
            <div className="min-h-screen bg-gray-100 font-sans selection:bg-yellow-200">
              <Navbar user={user} logout={logout} />
              <main>
                <Routes>
                  <Route path="/" element={<Dashboard user={user} />} />
                  <Route path="/profile" element={<Profile user={user} />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/results" element={<ResultsPage />} />
                  <Route path="/cart" element={<CartPage userEmail={user} />} />
                  <Route path="/order-summary/:orderId" element={<OrderSummary />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </main>
              <Chatbot />
            </div>
          </CartProvider>
        </AllergyProvider>
      )}
    </Router>
  );
}

export default App;

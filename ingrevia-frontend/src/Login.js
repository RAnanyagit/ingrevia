import { useState } from "react";
import { API_URL } from "./config";
import "./App.css";

function Login({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("email", email);
        setUser(email);
      } else {
        // Correctly handle our structured error responses (401, 503, etc)
        const errorMsg = data.message || data.detail || "Invalid email or password. Please try again.";
        setError(errorMsg);
      }
    } catch (err) {
      console.error("Login Error:", err);
      // This will only hit if the server is NOT listening yet (e.g. within the first few seconds)
      setError("The system is still warming up. Please wait about 30 seconds and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          age: parseInt(age), 
          phone 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Account created successfully! Please log in.");
        setIsLogin(true);
      } else {
        setError(data.detail || "Signup failed. Please check your details.");
      }
    } catch (err) {
      setError("Server connection failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="glass-panel login-card animate-fade-in">
        <div className="auth-header">
          <h1><span>🧪</span> Ingrevia</h1>
          <p>{isLogin ? "Login to access your safety dashboard" : "Create your account to get started"}</p>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleSignup} className="input-section">
          {!isLogin && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="custom-input"
                />
              </div>
              <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    className="custom-input"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    placeholder="+91..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="custom-input"
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="custom-input"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="custom-input"
            />
          </div>

          {error && <p className="error-text" style={{ textAlign: 'center' }}>{error}</p>}
          {success && <p className="success-text" style={{ textAlign: 'center', color: 'var(--risk-low)' }}>{success}</p>}

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? <span className="spinner"></span> : (isLogin ? "Login to Dashboard" : "Create Account")}
          </button>
        </form>

        <p className="auth-footer" style={{ textAlign: 'center', marginTop: '20px' }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span className="link-text" style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: '600' }} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign up" : "Log in"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;

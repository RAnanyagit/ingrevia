import { useContext } from "react";
import { AllergyContext } from "./context/AllergyContext";
import { useNavigate } from "react-router-dom";
import "./App.css";

function Profile({ user }) {
  const { allergies, loading } = useContext(AllergyContext);
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ animation: "fadeIn 0.5s ease-out" }}>
      <button className="back-nav-btn" onClick={() => navigate("/")}>
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path>
        </svg>
        Back to Dashboard
      </button>

      <header className="page-header hero-mini">
        <h1>User Profile</h1>
        <p>Manage your account settings and personalized allergy profile.</p>
      </header>

      <div className="profile-layout">
        <div className="glass-panel profile-card info-card">
          <div className="card-badge">ACCOUNT</div>
          <h3><span>👤</span> Personal Info</h3>
          <div className="info-item">
            <label>Email Address</label>
            <div className="value">{user}</div>
          </div>
          <div className="info-item">
            <label>Member Since</label>
            <div className="value">March 2024</div>
          </div>
        </div>

        <div className="glass-panel profile-card allergy-card">
          <div className="card-badge highlight">PROTECTION</div>
          <h3><span>🛡️</span> My Allergies</h3>
          <p className="section-hint">Ingredients we flag for your safety:</p>
          {loading ? (
            <div className="spinner-container"><div className="spinner"></div></div>
          ) : (
            <div className="allergy-tag-container">
              {allergies.length > 0 ? (
                allergies.map((allergy, i) => (
                  <span key={i} className="premium-tag">{allergy}</span>
                ))
              ) : (
                <div className="empty-state">
                  <p>No allergies saved yet.</p>
                  <button className="btn-secondary">Add Allergies</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;

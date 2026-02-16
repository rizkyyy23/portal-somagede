import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    email: localStorage.getItem("userEmail"),
    department: "IT",
    position: "Senior Developer",
    phone: "+62 812 3456 7890",
    joinDate: "2024-01-15",
  });

  const handleLogout = () => {
    localStorage.removeItem("userType");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    // Here you would typically send the data to a backend API
  };

  return (
    <div className="profile-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <img
            src="/assets/logo somagede black.png"
            alt="Logo"
            className="navbar-logo"
          />
        </div>
        <div className="navbar-right">
          <span className="user-email">
            {localStorage.getItem("userEmail")}
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </nav>

      {/* Page Content */}
      <div className="profile-container">
        <div className="profile-header">
          <h1>My Profile</h1>
        </div>

        <div className="profile-card">
          <div className="profile-avatar">
            <img src="/assets/avatar_placeholder.png" alt="Avatar" />
          </div>

          {!isEditing ? (
            <div className="profile-info">
              <div className="info-item">
                <label>Full Name</label>
                <p>{profileData.name}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>{profileData.email}</p>
              </div>
              <div className="info-item">
                <label>Department</label>
                <p>{profileData.department}</p>
              </div>
              <div className="info-item">
                <label>Position</label>
                <p>{profileData.position}</p>
              </div>
              <div className="info-item">
                <label>Phone</label>
                <p>{profileData.phone}</p>
              </div>
              <div className="info-item">
                <label>Join Date</label>
                <p>{profileData.joinDate}</p>
              </div>

              <button className="btn-edit" onClick={() => setIsEditing(true)}>
                <i className="fas fa-edit"></i> Edit Profile
              </button>
            </div>
          ) : (
            <form
              className="profile-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveProfile();
              }}
            >
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={profileData.department}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Position</label>
                <input
                  type="text"
                  name="position"
                  value={profileData.position}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save">
                  <i className="fas fa-check"></i> Save Changes
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsEditing(false)}
                >
                  <i className="fas fa-times"></i> Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

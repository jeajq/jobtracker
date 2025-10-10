import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import "../components/login.css";

export default function Login({ onLogin }) {
  const [activeTab, setActiveTab] = useState("user"); // user or employer
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState(""); // only for employers
  const [phone, setPhone] = useState(""); // new field
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
  e.preventDefault();
  const collectionName = activeTab === "user" ? "users" : "employers";

  // Validate phone
  const phoneRegex = /^\d{10}$/;
  if (!isLogin && !phoneRegex.test(phone)) {
    setMessage("❌ Phone number must be exactly 10 digits.");
    return;
  }

  // Validate email format (strict)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  if (!isLogin && !emailRegex.test(email)) {
    setMessage("❌ Please enter a valid email (example: user@domain.com).");
    return;
  }

  try {
    if (isLogin) {
      // LOGIN
      const q = query(
        collection(db, collectionName),
        where("email", "==", email),
        where("password", "==", password)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0].data();
        const loggedUser = { ...userDoc, type: activeTab };
        setMessage(`✅ ${activeTab} logged in successfully!`);
        setTimeout(() => onLogin(loggedUser), 1000);
      } else {
        setMessage("❌ Invalid credentials");
      }
    } else {
      // SIGN UP: check if email is unique
      const emailCheck = query(
        collection(db, collectionName),
        where("email", "==", email)
      );
      const existing = await getDocs(emailCheck);
      if (!existing.empty) {
        setMessage("❌ Email already in use. Please login or use a different email.");
        return;
      }

      // Add new user
      const newUser = {
        firstName,
        lastName,
        phone,
        email,
        password,
        createdAt: new Date(),
      };
        if (activeTab === "employer") newUser.companyName = companyName;

        await addDoc(collection(db, collectionName), newUser);

        setMessage(`✅ ${activeTab} signed up successfully!`);
        setFirstName("");
        setLastName("");
        setCompanyName("");
        setPhone("");
        setEmail("");
        setPassword("");

        setTimeout(() => {
          const userData = { type: activeTab, email };
          onLogin(userData);
        }, 1000);
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Error occurred, try again.");
    }
  };


  return (
    <div className="login-wrapper">
      <div className="login-tabs">
        <button
          className={activeTab === "user" ? "active" : ""}
          onClick={() => setActiveTab("user")}
        >
          User
        </button>
        <button
          className={activeTab === "employer" ? "active" : ""}
          onClick={() => setActiveTab("employer")}
        >
          Employer/Manager
        </button>
      </div>

      <div className="login-form">
        <h2>{isLogin ? "Login" : "Sign Up"} as {activeTab}</h2>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
              {activeTab === "employer" && (
                <input
                  type="text"
                  placeholder="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              )}
              <input
                type="text"
                placeholder="Phone (10 digits)"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} // numbers only
                required
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">{isLogin ? "Login" : "Sign Up"}</button>
        </form>

        <p className="toggle-login" onClick={() => setIsLogin(!isLogin)}>
          {isLogin
            ? <>Don't have an account? <span className="toggle-link">Sign Up</span></>
            : <>Already have an account? <span className="toggle-link">Login</span></>}
        </p>

        {message && <div className="login-message">{message}</div>}
      </div>
    </div>
  );
}

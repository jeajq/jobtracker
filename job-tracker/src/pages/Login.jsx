import React, { useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import "../components/login.css";

export default function Login({ onLogin }) {
  const [activeTab, setActiveTab] = useState("user"); //user or employer
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");

  //form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState(""); //only for employers
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    const collectionName = activeTab === "user" ? "users" : "employers";

    const phoneRegex = /^\d{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

    if (!isLogin && !phoneRegex.test(phone)) {
      setMessage("❌ Phone number must be exactly 10 digits.");
      return;
    }
    if (!isLogin && !emailRegex.test(email)) {
      setMessage("❌ Please enter a valid email (example: user@domain.com).");
      return;
    }

    try {
      if (isLogin) {
        //LOGIN
        const q = query(
          collection(db, collectionName),
          where("email", "==", email),
          where("password", "==", password)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const userDoc = {
            id: docSnap.id, //firestore doc id
            uid: docSnap.id, 
            ...docSnap.data(),
            type: activeTab,
          };

          setMessage(`✅ ${activeTab} logged in successfully!`);
          setTimeout(() => onLogin(userDoc), 800);
        } else {
          setMessage("❌ Invalid credentials. Please try again.");
        }
      } else {
        //SIGN UP
        //check if email already exists
        const emailCheck = query(
          collection(db, collectionName),
          where("email", "==", email)
        );
        const existing = await getDocs(emailCheck);

        if (!existing.empty) {
          setMessage("❌ Email already in use. Please login or use a different email.");
          return;
        }

        //create new user or employer document
        const newUser = {
          firstName,
          lastName,
          email,
          password,
          phone,
          createdAt: Timestamp.now(),
        };
        if (activeTab === "employer") newUser.companyName = companyName;

        const docRef = await addDoc(collection(db,collectionName), newUser);
        const createdUser = {
          id: docRef.id,
          uid: docRef.id, 
          ...newUser,
          type: activeTab,
        };


        setMessage(`✅ ${activeTab} signed up successfully!`);
        setFirstName("");
        setLastName("");
        setCompanyName("");
        setPhone("");
        setEmail("");
        setPassword("");

        //automatically log in the user after signup
        setTimeout(() => onLogin(createdUser), 800);
      }
    } catch (error) {
      console.error("Error during login/signup:", error);
      setMessage("❌ An error occurred. Please try again.");
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
          Employer / Manager
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
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
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
          {isLogin ? (
            <>Don't have an account? <span className="toggle-link">Sign Up</span></>
          ) : (
            <>Already have an account? <span className="toggle-link">Login</span></>
          )}
        </p>

        {message && <div className="login-message">{message}</div>}
      </div>
    </div>
  );
}

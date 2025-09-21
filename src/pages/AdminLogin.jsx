import React, { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { User, Lock } from "lucide-react";

const AdminLogin = ({ onLogin }) => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const adminsCol = collection(db, "admins");
      const snapshot = await getDocs(adminsCol);
      const admins = snapshot.docs.map(doc => doc.data());
      const admin = admins.find(a => a.id === id && a.password === password);

      if (admin) {
        onLogin();
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      setError("Error logging in");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-10">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">
          Admin Login
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          Access your dashboard securely
        </p>

        <div className="space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Admin ID"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleLogin}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition shadow-md hover:shadow-lg"
          >
            Login
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center mt-6">
          For Allah’s sake, please do not share these credentials.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;

// import { useState } from "react";
// import firebase from "../firebase/firebaseService";
// const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
//   const [isLogin, setIsLogin] = useState(true);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     try {
//       const { user } = isLogin
//         ? await firebase.signInWithEmailAndPassword(email, password)
//         : await firebase.createUserWithEmailAndPassword(email, password);

//       onAuthSuccess(user); // pass logged-in user back
//       onClose();
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
//         {/* Header */}
//         <div className="p-6 border-b border-gray-100">
//           <div className="flex justify-between items-center">
//             <h2 className="text-xl font-bold text-gray-800">
//               {isLogin ? "Sign In" : "Sign Up"}
//             </h2>
//             <button
//               onClick={onClose}
//               className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//             >
//               <X className="w-5 h-5 text-gray-600" />
//             </button>
//           </div>
//         </div>

//         {/* Form */}
//         <div className="p-6">
//           <form onSubmit={handleSubmit} className="space-y-4">
//             {/* Email */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Email
//               </label>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
//                 placeholder="Enter your email"
//                 required
//               />
//             </div>

//             {/* Password */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Password
//               </label>
//               <input
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
//                 placeholder="Enter your password"
//                 required
//               />
//             </div>

//             {/* Error Message */}
//             {error && (
//               <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
//                 {error}
//               </div>
//             )}

//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
//             >
//               {loading
//                 ? "Processing..."
//                 : isLogin
//                   ? "Sign In"
//                   : "Sign Up"}
//             </button>

//             {/* Toggle Auth Mode */}
//             <div className="text-center">
//               <button
//                 type="button"
//                 onClick={() => setIsLogin(!isLogin)}
//                 className="text-green-600 hover:underline text-sm"
//               >
//                 {isLogin
//                   ? "Don't have an account? Sign up"
//                   : "Already have an account? Sign in"}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AuthModal
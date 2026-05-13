// import { Navigate } from "react-router-dom";

// const ProtectedRoute = ({ children }) => {
//   const token = localStorage.getItem("token");

//   if (!token) {
//     return <Navigate to="/admin-login" />;
//   }

//   return children;
// };

// export default ProtectedRoute;

import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, type }) => {

  const userToken = localStorage.getItem("userToken");
  const adminToken = localStorage.getItem("adminToken");

  // 👉 ADMIN ROUTE
  if (type === "admin") {
    if (!adminToken) {
      return <Navigate to="/admin-login" />;
    }
  }

  // 👉 USER ROUTE
  if (type === "user") {
    if (!userToken) {
      return <Navigate to="/login" />;
    }
  }

  return children;
};

export default ProtectedRoute;
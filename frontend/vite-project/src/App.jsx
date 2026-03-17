import { Routes, Route, useNavigate, useLocation } from "react-router-dom"
import { useEffect } from "react"

import DemoDashboard from "@/pages/DemoDashboard"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import Dashboard from "@/pages/Dashboard"
import BoardPage from "@/pages/BoardPage"
import Layout from "@/components/Layout"

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const publicPaths = ["/", "/login", "/register"];
    
    if (token && publicPaths.includes(location.pathname)) {
      navigate("/dashboard");
    }
    
    if (!token && !publicPaths.includes(location.pathname)) {
      navigate("/");
    }
  }, [navigate, location.pathname]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DemoDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/board/:id" element={<BoardPage />} />
      </Routes>
    </Layout>
  )
}

export default App
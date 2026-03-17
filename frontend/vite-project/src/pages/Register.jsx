import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import API from "@/api"

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await API.post("/api/auth/register", formData);
      localStorage.setItem("token", response.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-white/20">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-linear-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg -rotate-3 group-hover:rotate-0 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Join TaskFlow</h1>
          <p className="text-slate-500 font-medium">Create your free account today</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl text-center">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-[12px] font-black uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
            <input 
              type="text" 
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Jane Doe" 
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-800"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[12px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
            <input 
              type="email" 
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="jane@company.com" 
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-800"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[12px] font-black uppercase tracking-widest text-slate-500 ml-1">Password</label>
            <input 
              type="password" 
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••" 
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-800"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-linear-to-r from-indigo-600 to-violet-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:opacity-90 transition-all active:scale-[0.98] uppercase tracking-widest text-sm"
          >
            Create Account
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-slate-500">
          Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline decoration-2 underline-offset-4">Log in</Link>
        </div>
      </div>
    </div>
  )
}

export default Register

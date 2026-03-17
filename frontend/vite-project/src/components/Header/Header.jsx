import { Link } from "react-router-dom"

function Header() {
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-linear-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/>
              </svg>
            </div>
            <span className="text-xl font-black bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight">TaskFlow</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Features</Link>
            <Link to="/solutions" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Solutions</Link>
            <Link to="/pricing" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Pricing</Link>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-4">
            {token ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Dashboard</Link>
                <button 
                  onClick={handleLogout}
                  className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Sign In</Link>
                <Link to="/register" className="px-5 py-2.5 bg-linear-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg active:scale-95">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

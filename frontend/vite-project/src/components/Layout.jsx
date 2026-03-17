import Header from "./Header/Header"
import Footer from "./Footer/Footer"

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-200/30 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-100/20 rounded-full blur-[150px] pointer-events-none"></div>

      <Header />
      
      <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>

      <Footer />
    </div>
  )
}

export default Layout

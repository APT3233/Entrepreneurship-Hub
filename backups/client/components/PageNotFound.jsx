import { useState, useEffect } from "react";
import { Home, AlertTriangle } from "lucide-react";

export default function PageNotFound() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-mono">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-3 flex items-center gap-3">
        <div className="w-9 h-9 bg-gray-900 rounded flex items-center justify-center">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="w-2 h-2 bg-white rounded-sm" />
            <div className="w-2 h-2 bg-white rounded-sm opacity-50" />
            <div className="w-2 h-2 bg-white rounded-sm opacity-50" />
            <div className="w-2 h-2 bg-white rounded-sm" />
          </div>
        </div>
        <div>
          <p className="text-xs font-bold tracking-widest text-gray-900 uppercase">System Status</p>
          <p className="text-xs tracking-widest text-gray-400 uppercase">E-Hub Enterprise</p>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center">
        <div
          className="text-center transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
        >
          <h1 className="text-8xl font-black text-gray-900 tracking-tight mb-2">404</h1>
          <p className="text-lg text-gray-600 tracking-wide mb-3">Page Not Found</p>
          <div className="w-10 h-0.5 bg-orange-500 mx-auto mb-8" />
          <button
            onClick={() => window.location.href = "/"}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold tracking-widest uppercase px-8 py-4 transition-colors duration-200"
          >
            <Home size={14} />
            Return to Home
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-6 py-4 flex justify-between items-center">
        <p className="text-xs tracking-widest text-gray-400 uppercase">
          © 2024 E-Hub Enterprise. Unified Access Control.
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-xs tracking-widest text-gray-500 hover:text-gray-900 uppercase transition-colors">Standard Protocols</a>
          <a href="#" className="text-xs tracking-widest text-gray-500 hover:text-gray-900 uppercase transition-colors">System Policy</a>
        </div>
      </footer>
    </div>
  );
}
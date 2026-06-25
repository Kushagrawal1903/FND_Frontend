import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = ({ title = 'Dashboard' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/logged-out');
  };

  return (
    <header className="bg-surface border-b border-outline-variant flex justify-between items-center px-margin-mobile md:px-margin-desktop w-full sticky top-0 z-40 h-16 shrink-0">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <span className="font-headline-md text-headline-md font-bold text-on-surface select-none">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:block text-right">
          <p className="font-label-md text-label-md font-semibold text-on-surface">{user?.name || 'Guest'}</p>
          <p className="font-label-sm text-[11px] text-on-surface-variant capitalize">{user?.role || 'Member'}</p>
        </div>

        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer relative">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>

      {/* Mobile Drawer (Simplistic implementation matching design) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="w-64 bg-surface-container-low h-full p-stack-lg flex flex-col border-r border-outline-variant"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-stack-xl">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">lens</span>
                <span className="font-headline-md text-headline-md font-bold text-on-surface">TruthLens</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-on-surface-variant hover:text-error cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              <button 
                onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
                className="w-full text-left font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-highest rounded-lg flex items-center gap-3 px-4 py-2.5 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
                Verify Claim
              </button>

              <button 
                onClick={() => { navigate('/saved'); setMobileMenuOpen(false); }}
                className="w-full text-left font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-highest rounded-lg flex items-center gap-3 px-4 py-2.5 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">bookmark</span>
                Saved Articles
              </button>

              {user && user.role === 'admin' && (
                <button 
                  onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}
                  className="w-full text-left font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-highest rounded-lg flex items-center gap-3 px-4 py-2.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                  Admin Panel
                </button>
              )}
            </nav>

            <div className="mt-auto pt-stack-md border-t border-outline-variant flex flex-col gap-3">
              <button 
                onClick={handleLogout}
                className="w-full text-left font-label-md text-label-md text-error hover:bg-error-container/20 rounded-lg flex items-center gap-3 px-4 py-2.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

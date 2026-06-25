import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/logged-out');
  };

  return (
    <aside className="bg-surface-container-low border-r border-outline-variant h-screen w-64 fixed left-0 top-0 flex flex-col py-stack-lg px-stack-md hidden md:flex z-50">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-stack-xl px-2">
        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline-md font-bold overflow-hidden border border-outline-variant">
          <span className="material-symbols-outlined text-white text-[24px]">lens</span>
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface leading-tight">TruthLens</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant">Verification Suite</p>
        </div>
      </div>

      {/* New Investigation Button */}
      <button 
        onClick={() => navigate('/')}
        className="mb-stack-lg w-full bg-primary text-on-primary hover:bg-primary-container transition-colors py-2.5 px-4 rounded-lg font-label-md text-label-md flex justify-center items-center gap-2 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        New Investigation
      </button>

      {/* Nav links */}
      <nav className="flex-1 flex flex-col gap-1">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `font-label-md text-label-md rounded-lg flex items-center gap-3 px-4 py-2.5 transition-all duration-200 ${
              isActive 
                ? 'bg-secondary-container text-on-secondary-container font-semibold' 
                : 'text-on-surface-variant hover:bg-surface-container-highest'
            }`
          }
        >
          <span className="material-symbols-outlined text-[20px]">fact_check</span>
          Verify Claim
        </NavLink>

        <NavLink 
          to="/saved" 
          className={({ isActive }) => 
            `font-label-md text-label-md rounded-lg flex items-center gap-3 px-4 py-2.5 transition-all duration-200 ${
              isActive 
                ? 'bg-secondary-container text-on-secondary-container font-semibold' 
                : 'text-on-surface-variant hover:bg-surface-container-highest'
            }`
          }
        >
          <span className="material-symbols-outlined text-[20px]">bookmark</span>
          Saved Articles
        </NavLink>

        {user && user.role === 'admin' && (
          <NavLink 
            to="/admin" 
            className={({ isActive }) => 
              `font-label-md text-label-md rounded-lg flex items-center gap-3 px-4 py-2.5 transition-all duration-200 ${
                isActive 
                  ? 'bg-secondary-container text-on-secondary-container font-semibold' 
                  : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
            Admin Dashboard
          </NavLink>
        )}
      </nav>

      {/* User profile footer info */}
      <div className="mt-auto pt-stack-md border-t border-outline-variant flex flex-col gap-2">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="truncate">
            <p className="font-label-md text-label-md font-semibold text-on-surface truncate">{user?.name || 'User'}</p>
            <p className="font-label-sm text-[11px] text-on-surface-variant capitalize">{user?.role || 'Member'}</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full text-left font-label-md text-label-md text-error hover:bg-error-container/20 rounded-lg flex items-center gap-3 px-4 py-2 transition-all duration-200 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

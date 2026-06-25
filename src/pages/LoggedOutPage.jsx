import { useNavigate } from 'react-router-dom';

const LoggedOutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-center items-center px-margin-mobile md:px-margin-desktop py-12 relative overflow-hidden">
      {/* Main Content Canvas */}
      <main className="max-w-md w-full bg-surface border border-outline-variant rounded-xl p-stack-xl text-center shadow-[0px_4px_12px_rgba(0,0,0,0.05)] relative z-10">
        <div className="mb-stack-lg flex justify-center">
          <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl filled">
              check_circle
            </span>
          </div>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-stack-sm font-headline-lg-mobile text-headline-lg-mobile">
          Logged Out
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-stack-xl">
          You have been successfully logged out of TruthLens.
        </p>
        <div className="flex flex-col gap-stack-md">
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-primary text-on-primary font-label-md text-label-md py-3 rounded-lg hover:bg-primary-container transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">login</span>
            Log Back In
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-surface border border-outline-variant text-on-surface font-label-md text-label-md py-3 rounded-lg hover:border-on-surface transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">home</span>
            Return to Home
          </button>
        </div>
      </main>

      {/* Background Atmospheric Pattern */}
      <div
        className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(#151c25 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      ></div>
    </div>
  );
};

export default LoggedOutPage;

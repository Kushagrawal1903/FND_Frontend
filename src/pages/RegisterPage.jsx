import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-center items-center px-margin-mobile md:px-margin-desktop py-12 relative overflow-hidden">
      <div className="w-full max-w-[400px] flex flex-col items-center relative z-10">
        
        {/* Brand Header */}
        <div className="mb-stack-xl flex flex-col items-center">
          <span aria-hidden="true" className="material-symbols-outlined text-[48px] text-on-surface mb-stack-sm">
            lens
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">TruthLens</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-stack-xs text-center">
            Create a Secure Account
          </p>
        </div>

        {/* Register Card */}
        <div className="w-full bg-surface border border-outline-variant rounded-xl p-stack-lg md:p-[32px] shadow-sm">
          {error && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg font-label-sm text-label-sm border border-error-container flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-stack-lg">
            {/* Name Field */}
            <div className="flex flex-col gap-stack-xs">
              <label className="font-label-sm text-label-sm text-on-surface" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-[20px]">person</span>
                </div>
                <input
                  className="block w-full pl-10 bg-surface border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface py-2.5 input-focus-ring transition-all duration-200"
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-stack-xs">
              <label className="font-label-sm text-label-sm text-on-surface" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-[20px]">mail</span>
                </div>
                <input
                  className="block w-full pl-10 bg-surface border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface py-2.5 input-focus-ring transition-all duration-200"
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-stack-xs">
              <label className="font-label-sm text-label-sm text-on-surface" htmlFor="password">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-[20px]">lock</span>
                </div>
                <input
                  className="block w-full pl-10 bg-surface border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface py-2.5 input-focus-ring transition-all duration-200"
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              className={`w-full bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md py-3 rounded-lg mt-stack-sm transition-colors flex justify-center items-center gap-2 cursor-pointer ${
                loading ? 'opacity-80 cursor-wait' : ''
              }`}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
              {!loading && (
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <div className="mt-stack-lg flex flex-col items-center gap-stack-sm">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Already have an account?{' '}
            <Link className="font-label-md text-label-md text-primary hover:underline transition-all" to="/login">
              Sign In
            </Link>
          </p>
        </div>
      </div>

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

export default RegisterPage;

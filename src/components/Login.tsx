import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { signInWithEmailAndPassword } from '../firebase/auth';
import SocialLoginButtons from './SocialLoginButtons';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const { user, error: authError } = await signInWithEmailAndPassword(email, password);

    if (authError) {
      setError(authError);
      setLoading(false);
    } else if (user) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-bg-alt rounded-2xl shadow-xl shadow-purple overflow-hidden border border-border-purple animate-scale-in">
          <div className="px-8 pt-8 pb-6">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 shadow-turquoise hover:shadow-turquoise-strong transition-all duration-300 hover:scale-110">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-text mb-2 text-glow">Welcome Back</h2>
              <p className="text-text-secondary">Sign in to your MarketMate account</p>
            </div>

            {error && (
              <div className="bg-bg-alt border border-error rounded-lg p-4 mb-6">
                <p className="text-error text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-bg-secondary text-text focus:ring-3 focus:ring-accent focus:border-accent transition-all duration-fast"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input w-full pl-10 pr-12 py-3 border border-border rounded-lg bg-bg-secondary text-text focus:ring-3 focus:ring-accent focus:border-accent transition-all duration-fast"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 rounded-lg font-semibold focus:ring-3 focus:ring-accent focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-fast transform hover:scale-105"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-contrast mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Social Login Buttons */}
            <SocialLoginButtons 
              mode="login"
              onLogin={(platform) => {
                console.log(`Social login initiated with ${platform}`);
              }}
              onError={(error) => {
                setError(error);
              }}
              className="mt-6"
            />
          </div>

          <div className="px-8 py-6 bg-bg-tertiary border-t border-border">
            <p className="text-center text-text-secondary">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-primary hover:text-primary-800 font-semibold transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
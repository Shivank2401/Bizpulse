import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn, Sparkles } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      login(response.data.token, response.data.email);
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #162a45 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #538EB7 0%, #0091A7 100%)' }}>
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk', color: '#fff' }}>
            ThriveBrands
          </h1>
          <p className="text-lg" style={{ color: '#B1864E' }}>
            BIZ Pulse Portal
          </p>
        </div>

        {/* Login Card */}
        <div
          className="glass-effect rounded-2xl p-8 shadow-custom"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-gray-200 mb-2 block">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="data.admin@thrivebrands.ai"
                required
                data-testid="login-email-input"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-200 mb-2 block">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                data-testid="login-password-input"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              data-testid="login-submit-button"
              className="w-full h-12 text-lg font-semibold"
              style={{
                background: 'linear-gradient(135deg, #538EB7 0%, #0091A7 100%)',
                color: '#fff'
              }}
            >
              {loading ? (
                'Signing In...'
              ) : (
                <>
                  <LogIn className="mr-2 w-5 h-5" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            <p>Demo Credentials:</p>
            <p className="mt-1">data.admin@thrivebrands.ai / 123456User</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
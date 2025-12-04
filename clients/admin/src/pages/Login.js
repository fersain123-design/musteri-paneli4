import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import apiClient from '../utils/axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post('/api/auth/login', {
        email,
        password
      });

      const { access_token, user } = response.data;

      // Check if user is admin
      if (user.role !== 'admin') {
        toast.error('Bu paneli sadece admin kullanıcılar kullanabilir.');
        setLoading(false);
        return;
      }

      // Save token and user info
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('admin_user', JSON.stringify({
        role: user.role,
        full_name: user.full_name,
        email: user.email
      }));

      toast.success('Giriş başarılı!');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error('Giriş başarısız: ' + (err.response?.data?.detail || err.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F4ED' }}>
      <Card className="w-full max-w-md p-8 shadow-2xl bg-white" data-testid="login-card">
        <div className="text-center mb-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_omnibazaar/artifacts/makpikt7_A6D4272F-6A83-4722-B047-D52ECA1A41A5.png" 
            alt="MANAVIM Logo"
            className="h-24 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk', color: '#0A5C36' }} data-testid="login-title">
            MANAVIM Admin
          </h1>
          <p style={{ color: '#6B7280' }} data-testid="login-subtitle">Satıcı Yönetim Paneli</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Label htmlFor="email" data-testid="email-label">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@manavim.com"
              required
              disabled={loading}
              data-testid="email-input"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password" data-testid="password-label">Şifre</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              data-testid="password-input"
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            style={{ backgroundColor: '#0A5C36' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#064628'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#0A5C36'}
            data-testid="login-submit-btn"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Login;

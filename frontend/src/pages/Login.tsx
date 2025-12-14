import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(0, 200, 83, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, rgba(0, 200, 83, 0.08) 0%, transparent 50%)`,
        }
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper elevation={0} sx={{ p: 6, borderRadius: 5, boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 90,
              height: 90,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #00C853 0%, #009624 100%)',
              mb: 3,
              boxShadow: '0 8px 32px rgba(0, 200, 83, 0.3)'
            }}>
              <Typography variant="h1" sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '3rem' }}>V</Typography>
            </Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ color: '#1a1a1a', fontWeight: 700, mb: 1 }}>
              Vyomaa Energy
            </Typography>
            <Typography variant="h6" sx={{ color: '#666666', fontWeight: 500 }}>
              Sales & CRM Platform
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 4,
                mb: 3,
                py: 1.8,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #00C853 0%, #009624 100%)',
                boxShadow: '0 4px 20px rgba(0, 200, 83, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #009624 0%, #00C853 100%)',
                  boxShadow: '0 6px 24px rgba(0, 200, 83, 0.4)',
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  background: '#cccccc',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Box sx={{
            p: 3,
            backgroundColor: '#f9f9f9',
            borderRadius: 3,
            border: '2px solid #00C853',
            borderLeft: '6px solid #00C853'
          }}>
            <Typography variant="subtitle2" sx={{ color: '#1a1a1a', display: 'block', mb: 1, fontWeight: 700 }}>
              Demo Credentials
            </Typography>
            <Typography variant="body2" sx={{ color: '#666666', display: 'block', mb: 0.5 }}>
              Email: <strong>admin@vyomaa.com</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: '#666666', display: 'block' }}>
              Password: <strong>admin123</strong>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as LeadsIcon,
  ViewKanban as PipelineIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Leads', icon: <LeadsIcon />, path: '/leads' },
  { text: 'Pipeline', icon: <PipelineIcon />, path: '/pipeline' },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/leads') return 'Leads';
    if (path.startsWith('/leads/')) return 'Lead Details';
    if (path === '/pipeline') return 'Sales Pipeline';
    return 'Vyomaa CRM';
  };

  const isMenuActive = (itemPath: string) => {
    if (itemPath === '/leads') {
      return location.pathname === '/leads' || location.pathname.startsWith('/leads/');
    }
    return location.pathname === itemPath;
  };

  const drawer = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a1a' }}>
      <Toolbar sx={{ backgroundColor: '#1a1a1a', borderBottom: '3px solid #00C853', minHeight: '70px !important', py: 2 }}>
        <Typography variant="h6" noWrap component="div" sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1.3rem' }}>
          Vyomaa CRM
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
      <List sx={{ flexGrow: 1, pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={isMenuActive(item.path)}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                mx: 1.5,
                my: 0.5,
                borderRadius: 2,
                py: 1.5,
                color: isMenuActive(item.path) ? '#00C853' : '#CCCCCC',
                backgroundColor: isMenuActive(item.path) ? 'rgba(0, 200, 83, 0.12)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(0, 200, 83, 0.08)',
                  color: '#00C853',
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 200, 83, 0.12)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 200, 83, 0.18)',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: isMenuActive(item.path) ? '#00C853' : '#CCCCCC', minWidth: 45 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: isMenuActive(item.path) ? 600 : 500,
                  fontSize: '1rem'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
      <List>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            onClick={logout}
            sx={{
              mx: 1.5,
              my: 1,
              borderRadius: 2,
              py: 1.5,
              color: '#CCCCCC',
              '&:hover': {
                backgroundColor: 'rgba(255, 82, 82, 0.1)',
                color: '#ff5252',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 45 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '1rem', fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #e0e0e0',
          color: '#1a1a1a',
        }}
      >
        <Toolbar sx={{ minHeight: '70px !important' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600, color: '#1a1a1a', fontSize: '1.2rem' }}>
            {getPageTitle()}
          </Typography>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            backgroundColor: '#fafafa',
            padding: '8px 16px',
            borderRadius: 3,
          }}>
            <Box sx={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00C853 0%, #009624 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '1rem'
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
              {user?.name}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundColor: '#1a1a1a' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundColor: '#1a1a1a', borderRight: 'none' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, sm: 9 },
          backgroundColor: '#fafafa',
          minHeight: '100vh',
        }}
      >
        <Box sx={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

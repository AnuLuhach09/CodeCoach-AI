import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { Login } from './components/pages/Login';
import { Register } from './components/pages/Register';
import { Forgot } from './components/pages/Forgot';
import { Reset } from './components/pages/Reset';
import { Dashboard } from './components/pages/Dashboard';
import { Workspace } from './components/pages/Workspace';
import { Settings } from './components/pages/Settings';
import { Profile } from './components/pages/Profile';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { theme } = useThemeStore();
  
  // Navigation states: 'dashboard' | 'workspace' | 'settings' | 'profile'
  const [view, setView] = useState<'dashboard' | 'workspace' | 'settings' | 'profile'>('dashboard');
  
  // Auth sub-navigation: 'login' | 'register' | 'forgot' | 'reset'
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [resetToken, setResetToken] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Initialize theme on start
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // If not authenticated, render auth views
  if (!isAuthenticated) {
    switch (authView) {
      case 'register':
        return <Register onSuccess={() => setView('dashboard')} onNavigateToLogin={() => setAuthView('login')} />;
      case 'forgot':
        return (
          <Forgot
            onBackToLogin={() => setAuthView('login')}
            onGoToReset={(token) => {
              setResetToken(token);
              setAuthView('reset');
            }}
          />
        );
      case 'reset':
        return <Reset initialToken={resetToken} onBackToLogin={() => setAuthView('login')} />;
      case 'login':
      default:
        return (
          <Login
            onSuccess={() => setView('dashboard')}
            onNavigateToRegister={() => setAuthView('register')}
            onNavigateToForgot={() => setAuthView('forgot')}
          />
        );
    }
  }

  // Render authenticated views
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground transition-all duration-200">
        {view === 'dashboard' && (
          <Dashboard
            onSelectProject={(projectId) => {
              setSelectedProjectId(projectId);
              setView('workspace');
            }}
            onNavigateToSettings={() => setView('settings')}
            onNavigateToProfile={() => setView('profile')}
          />
        )}

        {view === 'workspace' && selectedProjectId && (
          <Workspace
            projectId={selectedProjectId}
            onBackToDashboard={() => {
              setSelectedProjectId(null);
              setView('dashboard');
            }}
          />
        )}

        {view === 'settings' && (
          <Settings onBackToDashboard={() => setView('dashboard')} />
        )}

        {view === 'profile' && (
          <Profile onBackToDashboard={() => setView('dashboard')} />
        )}
      </div>
    </QueryClientProvider>
  );
};

export default App;

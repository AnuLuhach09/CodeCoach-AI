import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ArrowLeft, User, Save, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileProps {
  onBackToDashboard: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onBackToDashboard }) => {
  const { user, setUser, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const [name, setName] = useState('');
  const [lang, setLang] = useState('TypeScript');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setLang(user.preferredLanguage);
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await api.put('/profile', {
        name,
        preferredLanguage: lang,
        theme,
      });
      setUser(res.data.data.user);
      setStatusMsg('Profile successfully updated.');
    } catch (err) {
      setStatusMsg('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('WARNING: Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      return;
    }
    setDeleting(true);
    try {
      await api.delete('/profile');
      logout();
    } catch (err) {
      alert('Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <header className="mb-8 flex items-center space-x-4">
        <button
          onClick={onBackToDashboard}
          className="rounded-lg p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <User className="h-7 w-7 text-primary" /> Profile Preferences
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your personal profile and display settings.
          </p>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6"
      >
        {statusMsg ? (
          <div className="rounded-lg bg-primary/10 p-3.5 text-sm text-primary border border-primary/20">
            {statusMsg}
          </div>
        ) : null}

        <div className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />

          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Preferred Programming Language
            </label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            >
              {['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'SQL'].map(
                (l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Display Theme Mode
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex-1 h-10 rounded-lg border text-sm font-semibold transition-all ${
                  theme === 'dark'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-transparent text-muted-foreground hover:bg-accent'
                }`}
              >
                Dark Theme
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex-1 h-10 rounded-lg border text-sm font-semibold transition-all ${
                  theme === 'light'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-transparent text-muted-foreground hover:bg-accent'
                }`}
              >
                Light Theme
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-border">
          <Button variant="destructive" onClick={handleDeleteAccount} isLoading={deleting}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete Account
          </Button>

          <Button variant="primary" onClick={handleSave} isLoading={saving}>
            <Save className="mr-1.5 h-4 w-4" /> Save Profile
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

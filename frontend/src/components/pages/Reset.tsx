import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const resetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type ResetFields = z.infer<typeof resetSchema>;

interface ResetProps {
  initialToken?: string;
  onBackToLogin: () => void;
}

export const Reset: React.FC<ResetProps> = ({ initialToken = '', onBackToLogin }) => {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFields>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: initialToken,
    },
  });

  const onSubmit = async (data: ResetFields) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.post('/auth/reset-password', data);
      setStatusMsg({ type: 'success', text: res.data.data.message });
      setTimeout(() => {
        onBackToLogin();
      }, 2000);
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to reset password. Please check your token.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-xl"
      >
        <button
          onClick={onBackToLogin}
          className="inline-flex items-center text-xs font-semibold text-muted-foreground uppercase hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Login
        </button>

        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Enter New Password
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Provide the reset token along with your new password
          </p>
        </div>

        {statusMsg ? (
          <div
            className={`rounded-lg p-3.5 text-sm border ${
              statusMsg.type === 'success'
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-destructive/10 text-destructive border-destructive/20'
            }`}
          >
            {statusMsg.text}
          </div>
        ) : null}

        <form className="mt-4 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Reset Token"
              type="text"
              placeholder="Enter your token"
              error={errors.token?.message}
              {...register('token')}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
            Update Password
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

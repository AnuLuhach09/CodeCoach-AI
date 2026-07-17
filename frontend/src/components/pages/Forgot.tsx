import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotFields = z.infer<typeof forgotSchema>;

interface ForgotProps {
  onBackToLogin: () => void;
  onGoToReset: (token: string) => void;
}

export const Forgot: React.FC<ForgotProps> = ({ onBackToLogin, onGoToReset }) => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFields>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFields) => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      const res = await api.post('/auth/forgot-password', data);
      setSuccessMsg(res.data.data.message);
      // Auto transition to reset after 2 seconds for easy testing with the mock token
      if (res.data.data.token) {
        setTimeout(() => {
          onGoToReset(res.data.data.token);
        }, 1500);
      }
    } catch (err: any) {
      setSuccessMsg('An error occurred. Please try again.');
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
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email to receive a password reset token
          </p>
        </div>

        {successMsg ? (
          <div className="rounded-lg bg-primary/10 p-3.5 text-sm text-primary border border-primary/20">
            {successMsg}
          </div>
        ) : null}

        <form className="mt-4 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
            Send Reset Link
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import apiClient from '../../api/apiClient';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card, CardContent, CardHeader } from '../../components/common/Card';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const response = await apiClient.post('/auth/login', {
        email: data.email,
        password: data.password,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // API_CONTRACT states data returns { accessToken, refreshToken, user }
      const { accessToken, refreshToken, user } = data.data;
      
      // Ensure the user has admin role
      const role = user.role?.toUpperCase();
      if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
        toast.error('Access denied. Admin privileges required.');
        return;
      }
      
      setAuth(user, accessToken, refreshToken);
      toast.success('Welcome back, Admin!');
      navigate('/dashboard', { replace: true });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Invalid credentials. Please try again.';
      toast.error(message);
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-h2 font-bold text-textMain-light dark:text-textMain-dark">
            Admin Portal
          </h1>
          <p className="text-textSecondary-light dark:text-textSecondary-dark mt-2">
            Sign in to access the ChatVerse dashboard
          </p>
        </div>

        <Card className="shadow-2xl border-none">
          <CardHeader className="border-none pb-0 pt-8 px-8">
            {loginMutation.isError && (
              <div className="flex items-center gap-3 p-4 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm mb-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>
                  {(loginMutation.error as any).response?.data?.error?.message || 'Login failed. Please check your credentials.'}
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="relative">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="admin@chatverse.com"
                  {...register('email')}
                  error={errors.email?.message}
                  className="pl-10"
                />
                <Mail className="w-5 h-5 text-textMuted-light dark:text-textMuted-dark absolute left-3 top-9" />
              </div>

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password?.message}
                  className="pl-10 pr-10"
                />
                <Lock className="w-5 h-5 text-textMuted-light dark:text-textMuted-dark absolute left-3 top-9" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-textMuted-light dark:text-textMuted-dark hover:text-primary transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register('rememberMe')}
                    className="w-4 h-4 rounded border-border-light dark:border-border-dark text-primary focus:ring-primary focus:ring-offset-background-light dark:focus:ring-offset-background-dark transition-colors cursor-pointer"
                  />
                  <span className="text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark group-hover:text-textMain-light dark:group-hover:text-textMain-dark transition-colors">
                    Remember me
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={loginMutation.isPending}
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

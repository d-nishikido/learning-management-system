import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { AuthError } from '@/types';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }
    
    if (!password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (password.length < 6) {
      newErrors.password = 'パスワードは6文字以上である必要があります';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      await login(email, password);
    } catch (error: unknown) {
      const authError = error as AuthError;
      if (authError.response?.status === 401) {
        setErrors({ general: 'メールアドレスまたはパスワードが正しくありません' });
      } else if (authError.response?.data?.message) {
        setErrors({ general: authError.response.data.message });
      } else {
        setErrors({ general: 'ログインに失敗しました。もう一度お試しください' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{errors.general}</p>
        </div>
      )}
      
      <Input
        id="email"
        type="email"
        label="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        placeholder="your@email.com"
        autoComplete="email"
        required
      />
      
      <Input
        id="password"
        type="password"
        label="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
            ログイン状態を保持する
          </label>
        </div>
        
        <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-500">
          パスワードを忘れた方
        </Link>
      </div>
      
      <Button type="submit" fullWidth isLoading={isLoading}>
        ログイン
      </Button>
      
      <p className="text-center text-sm text-gray-600">
        アカウントをお持ちでない方は{' '}
        <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
          新規登録
        </Link>
      </p>
    </form>
  );
}
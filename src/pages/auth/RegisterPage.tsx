import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../domains/auth';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Label from '../../components/ui/Label';
import { Loader2, AlertCircle } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { data: details } = usePlatformSettings('details');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await register(name, email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setIsLoading(false);
    }
  };

  const platformName = details?.name || 'WPHub.PRO';
  const logoUrl = details?.logoUrl || details?.logoDataUrl;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F6F9] p-4">
      <div className="w-full max-w-[420px]">
        {/* Brand */}
        <div className="flex justify-center items-center gap-3 mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
          ) : (
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(310deg, #4F5482, #7a8ef0)' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          )}
          <span className="text-2xl font-bold text-[#292F4D]">{platformName}</span>
        </div>

        {/* Card */}
        <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold text-[#292F4D]">Create an Account</CardTitle>
            <CardDescription className="text-[#A3A7BA]">
              Get started with {platformName} today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-white rounded-lg bg-[#ea0606]">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#292F4D] font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-[#E7EAF3] focus:ring-[#4F5482]/30 focus:border-[#4F5482]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#292F4D] font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="border-[#E7EAF3] focus:ring-[#4F5482]/30 focus:border-[#4F5482]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#292F4D] font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="border-[#E7EAF3] focus:ring-[#4F5482]/30 focus:border-[#4F5482]"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 text-white font-semibold disabled:opacity-70"
                style={{
                  background: 'linear-gradient(310deg, #4F5482, #7a8ef0)',
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-[#A3A7BA]">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#f97316] hover:underline">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;

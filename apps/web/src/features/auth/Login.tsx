import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email);
    setSent(true);
  };

  if (sent) {
    return <p className="text-center mt-20">Check your email for a magic link.</p>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm w-full p-6">
        <h1 className="text-2xl font-semibold text-center">Sign in to Recall</h1>
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" className="w-full">Send magic link</Button>
      </form>
    </div>
  );
}
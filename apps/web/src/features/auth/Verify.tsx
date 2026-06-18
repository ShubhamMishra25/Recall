import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function Verify() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { verify } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      verify(token).then(() => navigate('/')).catch(() => alert('Invalid link'));
    }
  }, [token]);

  return <p className="text-center mt-20">Verifying...</p>;
}
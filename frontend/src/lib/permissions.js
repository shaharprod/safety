import { useAuth } from '../context/AuthContext.jsx';

const WRITE_ROLES = ['safety_officer', 'admin'];

export function useCanWrite() {
  const { user } = useAuth();
  return WRITE_ROLES.includes(user?.role);
}

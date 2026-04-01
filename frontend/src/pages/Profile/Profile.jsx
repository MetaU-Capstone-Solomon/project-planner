import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export default function Profile() {
  return <Navigate to={ROUTES.SETTINGS} replace />;
}

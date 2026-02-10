import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />;
    }

    return children;
};

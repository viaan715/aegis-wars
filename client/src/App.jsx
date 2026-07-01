import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Builder from './pages/Builder.jsx';
import Analytics from './pages/Analytics.jsx';
import FillForm from './pages/FillForm.jsx';
import NotFound from './pages/NotFound.jsx';

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/:id/edit"
        element={
          <ProtectedRoute>
            <Builder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/:id/responses"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route path="/f/:slug" element={<FillForm />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

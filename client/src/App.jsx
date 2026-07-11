import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import VerifyEmailBanner from './components/VerifyEmailBanner.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import MealPlanPage from './pages/MealPlanPage.jsx';
import MealPlanHistoryPage from './pages/MealPlanHistoryPage.jsx';
import MealPlanHistoryDetailPage from './pages/MealPlanHistoryDetailPage.jsx';
import GroceryListPage from './pages/GroceryListPage.jsx';
import ShoppingModePage from './pages/ShoppingModePage.jsx';
import PantryPage from './pages/PantryPage.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
import RecipeBrowsePage from './pages/RecipeBrowsePage.jsx';
import CustomRecipeFormPage from './pages/CustomRecipeFormPage.jsx';

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <VerifyEmailBanner />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            path="/plan"
            element={
              <ProtectedRoute>
                <MealPlanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <MealPlanHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history/:id"
            element={
              <ProtectedRoute>
                <MealPlanHistoryDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes"
            element={
              <ProtectedRoute>
                <RecipeBrowsePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes/new"
            element={
              <ProtectedRoute>
                <CustomRecipeFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grocery"
            element={
              <ProtectedRoute>
                <GroceryListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopping"
            element={
              <ProtectedRoute>
                <ShoppingModePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pantry"
            element={
              <ProtectedRoute>
                <PantryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/plan" replace />} />
          <Route path="*" element={<Navigate to="/plan" replace />} />
        </Routes>
      </main>
    </div>
  );
}

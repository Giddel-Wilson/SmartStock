import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import CreateProduct from './pages/CreateProduct'
import EditProduct from './pages/EditProduct'
import Inventory from './pages/Inventory'
import Users from './pages/Users'
import UserDetail from './pages/UserDetail'
import CreateUser from './pages/CreateUser'
import EditUser from './pages/EditUser'
import Departments from './pages/Departments'
import Categories from './pages/Categories'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { isAuthenticated, isLoading, setLoading } = useAuthStore()

  useEffect(() => {
    // Initialize auth state
    setLoading(false)
  }, [setLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} 
          />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Products */}
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<CreateProduct />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="products/:id/edit" element={<EditProduct />} />
            
            {/* Inventory */}
            <Route path="inventory" element={<Inventory />} />
            
            {/* Users - Manager only */}
            <Route path="users" element={
              <ProtectedRoute requiredRole="manager">
                <Users />
              </ProtectedRoute>
            } />
            <Route path="users/new" element={
              <ProtectedRoute requiredRole="manager">
                <CreateUser />
              </ProtectedRoute>
            } />
            <Route path="users/:id" element={
              <ProtectedRoute requiredRole="manager">
                <UserDetail />
              </ProtectedRoute>
            } />
            <Route path="users/:id/edit" element={
              <ProtectedRoute requiredRole="manager">
                <EditUser />
              </ProtectedRoute>
            } />
          
          {/* Departments - Manager only */}
          <Route path="departments" element={
            <ProtectedRoute requiredRole="manager">
              <Departments />
            </ProtectedRoute>
          } />
          
          {/* Categories - Manager only */}
          <Route path="categories" element={
            <ProtectedRoute requiredRole="manager">
              <Categories />
            </ProtectedRoute>
          } />
          
          {/* Reports */}
          <Route path="reports" element={<Reports />} />
          
          {/* Profile */}
          <Route path="profile" element={<Profile />} />
          
          {/* Settings - Manager only */}
          <Route path="settings" element={
            <ProtectedRoute requiredRole="manager">
              <Settings />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Fallback for unmatched routes */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App

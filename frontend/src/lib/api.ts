import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for token refresh and error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const { refreshToken, updateTokens, logout } = useAuthStore.getState()

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
      originalRequest._retry = true

      try {
        const response = await axios.post('/api/auth/refresh', {
          refreshToken,
        })

        const { accessToken } = response.data
        updateTokens(accessToken)

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, logout user
        logout()
        window.location.href = '/login'
        toast.error('Session expired. Please login again.')
        return Promise.reject(refreshError)
      }
    }

    // Handle other errors
    if (error.response?.data?.error) {
      // Don't show toast for certain errors that are handled in components
      const silentErrors = ['Invalid credentials', 'User not found']
      if (!silentErrors.includes(error.response.data.error)) {
        toast.error(error.response.data.error)
      }
    } else if (error.message) {
      toast.error(error.message)
    }

    return Promise.reject(error)
  }
)

// API methods
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (userData: any) =>
    api.post('/auth/register', userData),
  
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  
  getProfile: () =>
    api.get('/auth/me'),
}

export const usersAPI = {
  getUsers: (params?: any) =>
    api.get('/users', { params }),
  
  getUser: (id: string) =>
    api.get(`/users/${id}`),
  
  createUser: (data: any) =>
    api.post('/users', data),
  
  updateUser: (id: string, data: any) =>
    api.put(`/users/${id}`, data),
  
  changePassword: (id: string, data: any) =>
    api.post(`/users/${id}/change-password`, data),
  
  resetPassword: (id: string, data: any) =>
    api.post(`/users/${id}/reset-password`, data),
  
  deactivateUser: (id: string) =>
    api.delete(`/users/${id}`),
  
  activateUser: (id: string) =>
    api.post(`/users/${id}/activate`),
}

export const departmentsAPI = {
  getDepartments: () =>
    api.get('/departments'),
  
  getDepartment: (id: string) =>
    api.get(`/departments/${id}`),
  
  createDepartment: (data: any) =>
    api.post('/departments', data),
  
  updateDepartment: (id: string, data: any) =>
    api.put(`/departments/${id}`, data),
  
  deleteDepartment: (id: string) =>
    api.delete(`/departments/${id}`),
}

export const categoriesAPI = {
  getCategories: () =>
    api.get('/categories'),
  
  getCategory: (id: string) =>
    api.get(`/categories/${id}`),
  
  createCategory: (data: any) =>
    api.post('/categories', data),
  
  updateCategory: (id: string, data: any) =>
    api.put(`/categories/${id}`, data),
  
  deleteCategory: (id: string) =>
    api.delete(`/categories/${id}`),
}

export const productsAPI = {
  getProducts: (params?: any) =>
    api.get('/products', { params }),
  
  getProduct: (id: string) =>
    api.get(`/products/${id}`),
  
  createProduct: (data: any) =>
    api.post('/products', data),
  
  updateProduct: (id: string, data: any) =>
    api.put(`/products/${id}`, data),
  
  deleteProduct: (id: string) =>
    api.delete(`/products/${id}`),
  
  getProductHistory: (id: string, params?: any) =>
    api.get(`/products/${id}/history`, { params }),
}

export const inventoryAPI = {
  updateInventory: (data: any) =>
    api.post('/inventory/update', data),
  
  bulkUpdateInventory: (data: any) =>
    api.post('/inventory/bulk-update', data),
  
  getAlerts: (params?: any) =>
    api.get('/inventory/alerts', { params }),
  
  markAlertRead: (id: string) =>
    api.put(`/inventory/alerts/${id}/read`),
  
  getSummary: () =>
    api.get('/inventory/summary'),
}

export const reportsAPI = {
  getInventorySummary: (params?: any) =>
    api.get('/reports/inventory-summary', { params }),
  
  getLowStockReport: (params?: any) =>
    api.get('/reports/low-stock', { params }),
  
  getInventoryMovements: (params?: any) =>
    api.get('/reports/inventory-movements', { params }),
  
  getActivityLogs: (params?: any) =>
    api.get('/reports/activity-logs', { params }),
}

export default api

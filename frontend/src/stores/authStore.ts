import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  name: string
  email: string
  role: 'manager' | 'staff'
  departmentId?: string
  departmentName?: string
  phone?: string
  lastLogin?: string
  createdAt: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  login: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  setLoading: (loading: boolean) => void
  updateTokens: (accessToken: string, refreshToken?: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      updateUser: (userUpdate) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...userUpdate },
          })
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      updateTokens: (accessToken, refreshToken) => {
        set({
          accessToken,
          ...(refreshToken && { refreshToken }),
        })
      },
    }),
    {
      name: 'smartstock-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Migration: Fix field mapping for existing users
        if (state?.user) {
          const user = state.user as any
          let needsMigration = false
          const fixedUser = { ...state.user }
          
          // Migrate department_id to departmentId
          if (!state.user.departmentId && user.department_id) {
            fixedUser.departmentId = user.department_id
            needsMigration = true
          }
          
          // Migrate department_name to departmentName  
          if (!state.user.departmentName && user.department_name) {
            fixedUser.departmentName = user.department_name
            needsMigration = true
          }
          
          // Remove old snake_case fields
          if (user.department_id) {
            delete (fixedUser as any).department_id
            needsMigration = true
          }
          if (user.department_name) {
            delete (fixedUser as any).department_name
            needsMigration = true
          }
          
          if (needsMigration) {
            state.user = fixedUser
            console.log('🔧 Migrated user field mapping:', fixedUser)
          }
        }
      },
    }
  )
)

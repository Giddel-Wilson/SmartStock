import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import {
  ArrowLeftIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { usersAPI, departmentsAPI } from '../lib/api'
import { Department } from '../../../shared/types'

import toast from 'react-hot-toast'

interface UserForm {
  name: string
  email: string
  phone?: string
  role: 'manager' | 'staff'
  departmentId?: string
  isActive: boolean
}

export default function EditUser() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserForm>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'staff',
      departmentId: '',
      isActive: true,
    }
  })

  const { data: userData, isLoading: userLoading, error } = useQuery(
    ['user', id],
    () => usersAPI.getUser(id!),
    {
      enabled: !!id,
      staleTime: 2 * 60 * 1000,
    }
  )

  const { data: departmentsData } = useQuery(
    'departments',
    () => departmentsAPI.getDepartments(),
    {
      staleTime: 10 * 60 * 1000,
    }
  )

  const updateUserMutation = useMutation(
    (data: UserForm) => usersAPI.updateUser(id!, data),
    {
      onSuccess: () => {
        toast.success('User updated successfully')
        queryClient.invalidateQueries(['user', id])
        queryClient.invalidateQueries('users')
        navigate(`/users/${id}`)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update user')
      },
    }
  )

  const departments = (() => {
    try {
      if (!departmentsData?.data?.departments) return []
      return departmentsData.data.departments
    } catch (error) {
      console.error('Error accessing departments:', error)
      return []
    }
  })()

  const user = userData?.data?.user || null

  useEffect(() => {
    if (user) {
      // Only reset the form when user data first loads
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'staff',
        departmentId: user.department_id || '',
        isActive: user.is_active !== undefined ? user.is_active : true,
      })
    }
  }, [user?.id, reset]) // Only depend on user.id, not the entire user object

  const onSubmit = (data: UserForm) => {
    // Clean up empty optional fields
    const cleanData = {
      ...data,
      phone: data.phone?.trim() || undefined,
      departmentId: data.departmentId || undefined,
    }
    updateUserMutation.mutate(cleanData)
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-primary-600"></div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
          <UserCircleIcon className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">User not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The user you're trying to edit doesn't exist or has been removed.
        </p>
        <div className="mt-6">
          <Link to="/users" className="btn-primary">
            Back to Users
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={`/users/${id}`}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
            <p className="text-sm text-gray-600">
              Update user information and permissions
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">User Information</h3>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <div className="mt-1 relative">
                    <UserCircleIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('name', { 
                        required: 'Full name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' }
                      })}
                      type="text"
                      className="pl-10 input-field"
                      placeholder="Enter full name"
                      disabled={updateUserMutation.isLoading}
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <div className="mt-1 relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      type="email"
                      className="pl-10 input-field"
                      placeholder="Enter email address"
                      disabled={updateUserMutation.isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1 relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('phone')}
                      type="tel"
                      className="pl-10 input-field"
                      placeholder="Enter phone number"
                      disabled={updateUserMutation.isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <div className="mt-1 relative">
                    <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      {...register('departmentId')}
                      className="pl-10 select-field"
                      disabled={updateUserMutation.isLoading}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept: Department) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role *
                  </label>
                  <div className="mt-1 relative">
                    <ShieldCheckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      {...register('role', { required: 'Role is required' })}
                      className="pl-10 select-field"
                      disabled={updateUserMutation.isLoading}
                    >
                      <option value="">Select Role</option>
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Account Status
                  </label>
                  <div className="mt-1">
                    <label className="flex items-center">
                      <input
                        {...register('isActive')}
                        type="checkbox"
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        disabled={updateUserMutation.isLoading}
                      />
                      <span className="ml-2 text-sm text-gray-700">Active User</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <Link
                  to={`/users/${id}`}
                  className="btn-outline"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={updateUserMutation.isLoading}
                  className="btn-primary flex items-center"
                >
                  {updateUserMutation.isLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-white mr-2"></div>
                  )}
                  {updateUserMutation.isLoading ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current User Info */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Current User</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <UserCircleIcon className="h-12 w-12 text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900">{user.name}</h4>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`badge-${user.role === 'manager' ? 'info' : 'gray'} text-xs`}
                    >
                      {user.role}
                    </span>
                    <span
                      className={`badge-${user.isActive ? 'success' : 'gray'} text-xs`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Editing User Information
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Update basic user details and contact information</li>
              <li>• Change user role and department assignment</li>
              <li>• Activate or deactivate user accounts</li>
              <li>• All changes are logged for security</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

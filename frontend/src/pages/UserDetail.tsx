import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  ArrowLeftIcon,
  PencilIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { usersAPI } from '../lib/api'
import { User } from '../../../shared/types'

import toast from 'react-hot-toast'

export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)

  const { data: userData, isLoading, error } = useQuery(
    ['user', id],
    () => usersAPI.getUser(id!),
    {
      enabled: !!id,
      staleTime: 2 * 60 * 1000,
    }
  )

  const deactivateUserMutation = useMutation(
    () => usersAPI.deactivateUser(id!),
    {
      onSuccess: () => {
        toast.success('User deactivated successfully')
        queryClient.invalidateQueries(['user', id])
        queryClient.invalidateQueries('users')
        setShowDeactivateModal(false)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to deactivate user')
      },
    }
  )

  const activateUserMutation = useMutation(
    () => usersAPI.activateUser(id!),
    {
      onSuccess: () => {
        toast.success('User activated successfully')
        queryClient.invalidateQueries(['user', id])
        queryClient.invalidateQueries('users')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to activate user')
      },
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-primary-600"></div>
      </div>
    )
  }

  if (error || !userData?.data?.user) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
          <ShieldExclamationIcon className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">User not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The user you're looking for doesn't exist or has been removed.
        </p>
        <div className="mt-6">
          <Link to="/users" className="btn-primary">
            Back to Users
          </Link>
        </div>
      </div>
    )
  }

  const user: User = userData.data.user

  const handleToggleStatus = () => {
    if (user.is_active) {
      setShowDeactivateModal(true)
    } else {
      activateUserMutation.mutate()
    }
  }

  const handleDeactivate = () => {
    deactivateUserMutation.mutate()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/users"
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
            <p className="text-sm text-gray-600">
              View and manage user information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleStatus}
            disabled={deactivateUserMutation.isLoading || activateUserMutation.isLoading}
            className={`btn-outline ${
              user.is_active 
                ? 'text-red-600 border-red-300 hover:bg-red-50' 
                : 'text-green-600 border-green-300 hover:bg-green-50'
            }`}
          >
            {deactivateUserMutation.isLoading || activateUserMutation.isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-current mr-2"></div>
            ) : (
              <ShieldCheckIcon className="h-4 w-4 mr-2" />
            )}
            {user.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <Link
            to={`/users/${user.id}/edit`}
            className="btn-primary flex items-center gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            Edit User
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <UserCircleIcon className="h-16 w-16 text-gray-400" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`badge-${user.role === 'manager' ? 'info' : 'gray'}`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                      <span
                        className={`badge-${user.is_active ? 'success' : 'gray'}`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-900">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">
                        {user.department_name || 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Information */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Activity Information</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Login</p>
                    <p className="text-sm text-gray-500">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleString()
                        : 'Never logged in'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Account Created</p>
                    <p className="text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6 space-y-3">
              <Link
                to={`/users/${user.id}/edit`}
                className="w-full btn-outline text-left"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit User Details
              </Link>
              <button
                onClick={handleToggleStatus}
                disabled={deactivateUserMutation.isLoading || activateUserMutation.isLoading}
                className={`w-full btn-outline text-left ${
                  user.is_active 
                    ? 'text-red-600 border-red-300 hover:bg-red-50' 
                    : 'text-green-600 border-green-300 hover:bg-green-50'
                }`}
              >
                <ShieldCheckIcon className="h-4 w-4 mr-2" />
                {user.is_active ? 'Deactivate User' : 'Activate User'}
              </button>
            </div>
          </div>

          {/* User Stats */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Account Status</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <span
                  className={`badge-${user.is_active ? 'success' : 'gray'}`}
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Role</span>
                <span
                  className={`badge-${user.role === 'manager' ? 'info' : 'gray'}`}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Department</span>
                <span className="text-sm text-gray-900">
                  {user.department_name || 'Unassigned'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <ShieldExclamationIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-3">
                Deactivate User
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to deactivate <strong>{user.name}</strong>? 
                  They will no longer be able to access the system.
                </p>
              </div>
              <div className="flex gap-4 px-4 py-3">
                <button
                  onClick={() => setShowDeactivateModal(false)}
                  className="flex-1 btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivate}
                  disabled={deactivateUserMutation.isLoading}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deactivateUserMutation.isLoading ? 'Deactivating...' : 'Deactivate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { useForm } from 'react-hook-form'
import { usersAPI } from '../lib/api'


interface UserForm {
  name: string
  email: string
  phone?: string
  role: 'manager' | 'staff'
  departmentId?: string
  isActive: boolean
}

export default function EditUserTest() {
  const { id } = useParams<{ id: string }>()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UserForm>()

  const { data: userData, isLoading: userLoading } = useQuery(
    ['user', id],
    () => usersAPI.getUser(id!),
    {
      enabled: !!id,
      staleTime: 2 * 60 * 1000,
    }
  )

  const user = userData?.data?.user || null

  useEffect(() => {
    if (user) {
      console.log('🔍 Test - User data:', user)
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'staff',
        departmentId: user.departmentId || '',
        isActive: user.isActive !== undefined ? user.isActive : true,
      })
    }
  }, [user, reset])

  const watchedValues = watch()
  useEffect(() => {
    console.log('👀 Test - Form values:', watchedValues)
  }, [watchedValues])

  const onSubmit = (data: UserForm) => {
    console.log('Form submitted:', data)
  }

  if (userLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>User not found</div>
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Edit User Test</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            {...register('name', { required: 'Name is required' })}
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            {...register('email', { required: 'Email is required' })}
            type="email"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter email"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            {...register('phone')}
            type="tel"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter phone"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Role
          </label>
          <select
            {...register('role', { required: 'Role is required' })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Role</option>
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center">
            <input
              {...register('isActive')}
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Active User</span>
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Test Submit
        </button>
      </form>
      
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Debug Info:</h3>
        <pre className="text-xs text-gray-600 whitespace-pre-wrap">
          User: {JSON.stringify(user, null, 2)}
        </pre>
        <pre className="text-xs text-gray-600 whitespace-pre-wrap">
          Form: {JSON.stringify(watchedValues, null, 2)}
        </pre>
      </div>
    </div>
  )
}

import clsx from 'clsx'
import {
  CubeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

interface StatsCardProps {
  title: string
  value: string | number
  icon: 'package' | 'dollar' | 'exclamation' | 'x-circle'
  color: 'blue' | 'green' | 'yellow' | 'red'
  alert?: boolean
}

const iconMap = {
  package: CubeIcon,
  dollar: CurrencyDollarIcon,
  exclamation: ExclamationTriangleIcon,
  'x-circle': XCircleIcon,
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-200',
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'text-yellow-600',
    border: 'border-yellow-200',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    border: 'border-red-200',
  },
}

export default function StatsCard({
  title,
  value,
  icon,
  color,
  alert = false,
}: StatsCardProps) {
  const Icon = iconMap[icon]
  const colors = colorMap[color]

  return (
    <div
      className={clsx(
        'bg-white overflow-hidden shadow rounded-lg border-l-4',
        colors.border,
        alert && 'ring-2 ring-red-200 ring-opacity-50'
      )}
    >
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={clsx('p-3 rounded-md', colors.bg)}>
              <Icon className={clsx('h-6 w-6', colors.icon)} aria-hidden="true" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
                {alert && (
                  <div className="ml-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Alert
                    </span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

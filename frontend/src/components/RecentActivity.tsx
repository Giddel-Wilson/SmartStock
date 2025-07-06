import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import { InventoryLog } from '../../../shared/types'

interface RecentActivityProps {
  movements: InventoryLog[]
}

const changeTypeColors = {
  sale: 'bg-red-100 text-red-800',
  purchase: 'bg-green-100 text-green-800',
  adjustment: 'bg-blue-100 text-blue-800',
  transfer: 'bg-yellow-100 text-yellow-800',
  damage: 'bg-gray-100 text-gray-800',
  return: 'bg-purple-100 text-purple-800',
}

const changeTypeLabels = {
  sale: 'Sale',
  purchase: 'Purchase',
  adjustment: 'Adjustment',
  transfer: 'Transfer',
  damage: 'Damage',
  return: 'Return',
}

export default function RecentActivity({ movements }: RecentActivityProps) {
  if (!movements.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {movements.map((movement, index) => (
          <li key={movement.id}>
            <div className="relative pb-8">
              {index !== movements.length - 1 ? (
                <span
                  className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex items-start space-x-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-900">
                      {movement.type?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        {movement.product_name}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {formatDistanceToNow(new Date(movement.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={clsx(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        changeTypeColors[movement.type as keyof typeof changeTypeColors]
                      )}
                    >
                      {changeTypeLabels[movement.type as keyof typeof changeTypeLabels]}
                    </span>
                    <span className="text-sm text-gray-900">
                      {movement.quantity_change > 0 ? '+' : ''}
                      {movement.quantity_change}
                    </span>
                    <span className="text-sm text-gray-500">
                      by {movement.user_name}
                    </span>
                  </div>
                  {movement.reason && (
                    <p className="mt-1 text-sm text-gray-500">
                      {movement.reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

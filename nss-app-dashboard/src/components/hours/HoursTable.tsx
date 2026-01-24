'use client'

/**
 * HoursTable Component
 * Table displaying hours approval records
 */

import Image from 'next/image'
import { Skeleton } from '../Skeleton'

interface Participation {
  id: string
  hoursAttended: number
  approvedHours: number | null
  approvalStatus: string
  volunteer?: { firstName: string; lastName: string; rollNumber: string; email: string; profilePic?: string | null }
  event?: { eventName: string; startDate: string }
}

interface HoursTableProps {
  participations: Participation[]
  selectedItems: string[]
  loading: boolean
  isMobile: boolean
  filter: string
  onSelectItem: (id: string) => void
  onSelectAll: () => void
  onApprove: (p: Participation) => void
  onReject: (p: Participation) => void
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'text-yellow-400 bg-yellow-900/30'
    case 'approved': return 'text-green-400 bg-green-900/30'
    case 'rejected': return 'text-red-400 bg-red-900/30'
    default: return 'text-gray-400 bg-gray-900/30'
  }
}

const formatDate = (dateStr: string | null) => dateStr ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'

export function HoursTable({ participations, selectedItems, loading, isMobile, filter, onSelectItem, onSelectAll, onApprove, onReject }: HoursTableProps) {
  if (loading) {
    return (
      <div className="divide-y divide-gray-700/30">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="px-4 py-3"><Skeleton className="h-16 w-full rounded-lg" /></div>)}
      </div>
    )
  }

  if (participations.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-gray-400">
        <i className="fas fa-clock text-4xl mb-3"></i>
        <p>No records found</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-700/30">
      {participations.map((p) => (
        <div key={p.id} className="px-4 py-3 hover:bg-gray-800/20 transition-colors">
          {isMobile ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                {filter === 'pending' && <input type="checkbox" className="checkbox-custom" checked={selectedItems.includes(p.id)} onChange={() => onSelectItem(p.id)} />}
                <Image src={p.volunteer?.profilePic || '/icon-192x192.png'} alt={p.volunteer ? `${p.volunteer.firstName} ${p.volunteer.lastName}` : 'Unknown'}
                  width={40} height={40} className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-200">{p.volunteer ? `${p.volunteer.firstName} ${p.volunteer.lastName}` : 'Unknown'}</h4>
                  <p className="text-sm text-gray-400">{p.event?.eventName || 'Unknown Event'}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-400">{p.approvalStatus === 'approved' ? p.approvedHours : p.hoursAttended}h</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(p.approvalStatus)}`}>{p.approvalStatus}</span>
                </div>
              </div>
              {p.approvalStatus === 'pending' && (
                <div className="flex justify-end space-x-2">
                  <button onClick={() => onApprove(p)} className="text-green-400 hover:text-green-300 px-3 py-1 text-sm rounded bg-green-900/20">
                    <i className="fas fa-check mr-1"></i> Approve
                  </button>
                  <button onClick={() => onReject(p)} className="text-red-400 hover:text-red-300 px-3 py-1 text-sm rounded bg-red-900/20">
                    <i className="fas fa-times mr-1"></i> Reject
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-4 items-center">
              {filter === 'pending' && (
                <div><input type="checkbox" className="checkbox-custom" checked={selectedItems.includes(p.id)} onChange={() => onSelectItem(p.id)} /></div>
              )}
              <div className={`${filter === 'pending' ? 'col-span-2' : 'col-span-3'} flex items-center space-x-3`}>
                <Image src={p.volunteer?.profilePic || '/icon-192x192.png'} alt={p.volunteer ? `${p.volunteer.firstName} ${p.volunteer.lastName}` : 'Unknown'}
                  width={32} height={32} className="w-8 h-8 rounded-full" />
                <div>
                  <div className="font-medium text-gray-200 text-sm">{p.volunteer ? `${p.volunteer.firstName} ${p.volunteer.lastName}` : 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{p.volunteer?.rollNumber}</div>
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-200">{p.event?.eventName || 'Unknown'}</div>
                <div className="text-xs text-gray-500">{formatDate(p.event?.startDate || null)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-blue-400">{p.approvalStatus === 'approved' ? p.approvedHours : p.hoursAttended} hrs</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(p.approvalStatus)}`}>{p.approvalStatus}</span>
              </div>
              <div className="flex space-x-2">
                {p.approvalStatus === 'pending' ? (
                  <>
                    <button onClick={() => onApprove(p)} className="text-gray-400 hover:text-green-400 p-1 rounded" title="Approve"><i className="fas fa-check"></i></button>
                    <button onClick={() => onReject(p)} className="text-gray-400 hover:text-red-400 p-1 rounded" title="Reject"><i className="fas fa-times"></i></button>
                  </>
                ) : <span className="text-xs text-gray-500">-</span>}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

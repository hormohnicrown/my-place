'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Eye, UserCheck, UserX, Shield, AlertTriangle } from 'lucide-react'
import { updateUserStatus } from '@/lib/admin/actions'
import { useRouter } from 'next/navigation'

type UserManagementActionsProps = {
  userId: string
  userName: string
  userRole: string
  verificationStatus: string
}

export function UserManagementActions({ 
  userId, 
  userName, 
  userRole,
  verificationStatus
}: UserManagementActionsProps) {
  const [isSuspendOpen, setIsSuspendOpen] = useState(false)
  const [isActivateOpen, setIsActivateOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const isSuspended = verificationStatus === 'failed' // Using failed as suspended status for now
  const isVerified = verificationStatus === 'id_verified'

  const handleStatusUpdate = async (status: 'active' | 'suspended') => {
    if (!reason.trim()) return

    setIsSubmitting(true)
    try {
      const result = await updateUserStatus(userId, status, reason)
      if (result.success) {
        setIsSuspendOpen(false)
        setIsActivateOpen(false)
        setReason('')
        router.refresh()
      } else {
        alert(result.error || `Failed to ${status === 'suspended' ? 'suspend' : 'activate'} user`)
      }
    } catch (error) {
      alert(`Failed to ${status === 'suspended' ? 'suspend' : 'activate'} user`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      {/* View Details */}
      <Button variant="outline" size="sm">
        <Eye className="w-4 h-4 mr-1" />
        View
      </Button>

      {/* Status Actions */}
      {isSuspended ? (
        // Activate User Dialog
        <Dialog open={isActivateOpen} onOpenChange={setIsActivateOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <UserCheck className="w-4 h-4 mr-1" />
              Activate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Activate User Account</DialogTitle>
              <DialogDescription>
                You are about to activate the account for <strong>{userName}</strong>.
                This will restore their platform access.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="activate-reason">Activation Reason (required)</Label>
                <Textarea
                  id="activate-reason"
                  placeholder="Explain why this account is being activated (e.g., 'Issue resolved', 'Appeal approved')"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsActivateOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleStatusUpdate('active')}
                disabled={!reason.trim() || isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Activating...' : 'Activate Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        // Suspend User Dialog
        <Dialog open={isSuspendOpen} onOpenChange={setIsSuspendOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <UserX className="w-4 h-4 mr-1" />
              Suspend
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Suspend User Account</DialogTitle>
              <DialogDescription>
                You are about to suspend the account for <strong>{userName}</strong> ({userRole}).
                This will restrict their access to the platform.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="suspend-reason">Suspension Reason (required)</Label>
                <Textarea
                  id="suspend-reason"
                  placeholder="Explain why this account is being suspended (e.g., 'Policy violation', 'Suspicious activity', 'User request')"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-red-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
              <div className="text-sm text-red-700">
                The user will be notified of the suspension and can appeal through customer support.
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsSuspendOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleStatusUpdate('suspended')}
                disabled={!reason.trim() || isSubmitting}
                variant="destructive"
              >
                {isSubmitting ? 'Suspending...' : 'Suspend Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Verification Status Badge */}
      <Badge 
        variant="outline" 
        className={
          isVerified 
            ? "border-green-300 text-green-700 bg-green-50" 
            : isSuspended 
            ? "border-red-300 text-red-700 bg-red-50"
            : "border-yellow-300 text-yellow-700 bg-yellow-50"
        }
      >
        <Shield className="w-3 h-3 mr-1" />
        {isSuspended ? 'Suspended' : isVerified ? 'Active' : 'Pending'}
      </Badge>
    </div>
  )
}
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
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { approveUserVerification, rejectUserVerification } from '@/lib/admin/actions'
import { useRouter } from 'next/navigation'

type VerificationActionsProps = {
  userId: string
  userName: string
  currentStatus: string
  size?: 'sm' | 'default'
}

export function VerificationActions({ 
  userId, 
  userName, 
  currentStatus, 
  size = 'default' 
}: VerificationActionsProps) {
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleApprove = async () => {
    if (!approvalNotes.trim()) return

    setIsSubmitting(true)
    try {
      const result = await approveUserVerification(userId, approvalNotes)
      if (result.success) {
        setIsApproveOpen(false)
        setApprovalNotes('')
        router.refresh()
      } else {
        alert(result.error || 'Failed to approve verification')
      }
    } catch (error) {
      alert('Failed to approve verification')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) return

    setIsSubmitting(true)
    try {
      const result = await rejectUserVerification(userId, rejectionReason)
      if (result.success) {
        setIsRejectOpen(false)
        setRejectionReason('')
        router.refresh()
      } else {
        alert(result.error || 'Failed to reject verification')
      }
    } catch (error) {
      alert('Failed to reject verification')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Don't show actions for already verified users
  if (currentStatus === 'id_verified') {
    return (
      <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">
        <CheckCircle className="w-3 h-3 mr-1" />
        Verified
      </Badge>
    )
  }

  const buttonSize = size === 'sm' ? 'sm' : 'default'

  return (
    <div className="flex items-center space-x-2">
      {/* Approve Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size={buttonSize}
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Approve
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Approve ID Verification</DialogTitle>
            <DialogDescription>
              You are about to approve the ID verification for <strong>{userName}</strong>.
              This will grant them full platform access.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="approval-notes">Approval Notes (required)</Label>
              <Textarea
                id="approval-notes"
                placeholder="Document your review (e.g., 'Valid Driver's License verified, name matches registration')"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsApproveOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={!approvalNotes.trim() || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Approving...' : 'Approve Verification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size={buttonSize}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Reject
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject ID Verification</DialogTitle>
            <DialogDescription>
              You are about to reject the ID verification for <strong>{userName}</strong>.
              They will need to resubmit their documents.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rejection-reason">Rejection Reason (required)</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why the verification was rejected (e.g., 'Document unclear', 'Name mismatch', 'Invalid document type')"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
            <div className="text-sm text-red-700">
              The user will be notified of the rejection and can resubmit their documents.
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRejectOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReject}
              disabled={!rejectionReason.trim() || isSubmitting}
              variant="destructive"
            >
              {isSubmitting ? 'Rejecting...' : 'Reject Verification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
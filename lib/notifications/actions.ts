'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'

export type AppNotification = {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  read_at: string | null
  created_at: string
}

/**
 * Get notifications for current user
 */
export async function getUserNotifications(): Promise<{ success: boolean; data?: AppNotification[]; unreadCount?: number }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, data: [], unreadCount: 0 }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      return { success: false, data: [], unreadCount: 0 }
    }

    const unreadCount = (data || []).filter(n => !n.read_at).length
    return { success: true, data: data || [], unreadCount }
  } catch (error) {
    return { success: false, data: [], unreadCount: 0 }
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false }

    const supabase = await createClient()
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsAsRead() {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false }

    const supabase = await createClient()
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null)

    if (error) return { success: false }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

/**
 * Helper to create a notification for any user
 */
export async function createNotification(params: {
  userId: string
  title: string
  message: string
  type: 'booking' | 'system' | 'dispute' | 'verification'
}) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('notifications').insert({
      user_id: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
    })

    if (error) {
      console.error('Failed to create notification:', error)
      return { success: false }
    }

    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

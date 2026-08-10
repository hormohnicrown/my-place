-- =============================================================================
-- BOOKING WORKFLOW AND NOTIFICATIONS SYSTEM
-- =============================================================================
-- Enhanced booking status workflow with automated transitions and notifications
-- Comprehensive notification system for booking lifecycle events

-- =============================================================================
-- NOTIFICATION SYSTEM TABLES
-- =============================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Target user
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification content
    type TEXT NOT NULL CHECK (type IN (
        'booking_request_received',
        'booking_accepted', 
        'booking_declined',
        'booking_cancelled',
        'service_started',
        'service_completed', 
        'rating_received',
        'payment_status_updated'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Related entities
    booking_request_id UUID REFERENCES booking_requests(id) ON DELETE CASCADE,
    rating_id UUID REFERENCES ratings(id) ON DELETE SET NULL,
    
    -- Status
    read_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
    
    -- Channels
    send_email BOOLEAN DEFAULT false,
    send_sms BOOLEAN DEFAULT false,
    send_push BOOLEAN DEFAULT true,
    
    -- Metadata  
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_booking_request_id ON notifications(booking_request_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notification read status"
ON notifications FOR UPDATE
TO authenticated  
USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()))
WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- System can insert notifications for any user
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- =============================================================================
-- NOTIFICATION TEMPLATES AND FUNCTIONS
-- =============================================================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_booking_request_id UUID DEFAULT NULL,
    p_rating_id UUID DEFAULT NULL,
    p_send_email BOOLEAN DEFAULT false,
    p_send_sms BOOLEAN DEFAULT false,
    p_send_push BOOLEAN DEFAULT true
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        booking_request_id,
        rating_id,
        send_email,
        send_sms,
        send_push
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_booking_request_id,
        p_rating_id,
        p_send_email,
        p_send_sms,
        p_send_push
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- Function to send booking status notifications
CREATE OR REPLACE FUNCTION notify_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
    client_name TEXT;
    merchant_name TEXT;
    service_details TEXT;
    notification_id UUID;
BEGIN
    -- Get participant names and service details
    SELECT 
        c.name,
        m.name,
        NEW.service_details
    INTO client_name, merchant_name, service_details
    FROM users c, users m
    WHERE c.id = NEW.client_user_id 
    AND m.id = NEW.merchant_user_id;

    -- Handle different status transitions
    CASE NEW.status
        WHEN 'accepted' THEN
            -- Notify client that booking was accepted
            notification_id := create_notification(
                NEW.client_user_id,
                'booking_accepted',
                'Booking Accepted! 🎉',
                format('Great news! %s has accepted your booking for "%s". You can now see their full address and contact them directly.', 
                       merchant_name, service_details),
                NEW.id,
                NULL,
                true, -- send email
                true, -- send SMS
                true  -- send push
            );
            
        WHEN 'declined' THEN
            -- Notify client that booking was declined
            notification_id := create_notification(
                NEW.client_user_id,
                'booking_declined', 
                'Booking Update',
                format('Unfortunately, %s cannot take your booking for "%s" at this time. You can search for other merchants or try booking again later.',
                       merchant_name, service_details),
                NEW.id,
                NULL,
                true, -- send email
                false, -- no SMS for declines
                true   -- send push
            );
            
        WHEN 'in_progress' THEN
            -- Notify client that service has started
            notification_id := create_notification(
                NEW.client_user_id,
                'service_started',
                'Service Started 🚀',
                format('%s has started working on your "%s" service. They have checked in at your location.',
                       merchant_name, service_details),
                NEW.id,
                NULL,
                false, -- no email for progress updates
                false, -- no SMS
                true   -- send push
            );
            
            -- Notify merchant that service started (confirmation)
            notification_id := create_notification(
                NEW.merchant_user_id,
                'service_started',
                'Service Started',
                format('You have successfully started the service for %s. GPS check-in recorded for "%s".',
                       client_name, service_details),
                NEW.id,
                NULL,
                false, -- no email
                false, -- no SMS  
                true   -- send push
            );
            
        WHEN 'completed' THEN
            -- Notify client that service is completed
            notification_id := create_notification(
                NEW.client_user_id,
                'service_completed',
                'Service Completed! ✅',
                format('Your "%s" service with %s has been completed. Please take a moment to rate your experience.',
                       service_details, merchant_name),
                NEW.id,
                NULL,
                true,  -- send email
                true,  -- send SMS
                true   -- send push
            );
            
            -- Notify merchant that service is completed (confirmation)
            notification_id := create_notification(
                NEW.merchant_user_id,
                'service_completed',
                'Service Completed',
                format('You have marked the service for %s as completed. You can now rate the client and set the final price for commission tracking.',
                       client_name),
                NEW.id,
                NULL,
                false, -- no email
                false, -- no SMS
                true   -- send push
            );
            
        WHEN 'cancelled' THEN
            -- Determine who cancelled and notify the other party
            IF OLD.status = 'pending' THEN
                -- Client likely cancelled pending booking
                notification_id := create_notification(
                    NEW.merchant_user_id,
                    'booking_cancelled',
                    'Booking Cancelled',
                    format('The booking request from %s for "%s" has been cancelled.',
                           client_name, service_details),
                    NEW.id,
                    NULL,
                    false, -- no email for cancellations
                    false, -- no SMS
                    true   -- send push
                );
            END IF;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- WORKFLOW TRIGGERS
-- =============================================================================

-- Trigger for booking status changes
DROP TRIGGER IF EXISTS notify_on_booking_status_change ON booking_requests;
CREATE TRIGGER notify_on_booking_status_change
    AFTER UPDATE OF status ON booking_requests
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_booking_status_change();

-- Function to notify on new booking requests
CREATE OR REPLACE FUNCTION notify_new_booking_request()
RETURNS TRIGGER AS $$
DECLARE
    client_name TEXT;
    service_details TEXT;
    notification_id UUID;
BEGIN
    -- Get client name
    SELECT name INTO client_name
    FROM users
    WHERE id = NEW.client_user_id;

    -- Notify merchant of new booking request
    notification_id := create_notification(
        NEW.merchant_user_id,
        'booking_request_received',
        'New Booking Request! 📋',
        format('You have a new booking request from %s for "%s". Review the details and respond soon.',
               client_name, NEW.service_details),
        NEW.id,
        NULL,
        true,  -- send email
        true,  -- send SMS
        true   -- send push
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new booking requests
DROP TRIGGER IF EXISTS notify_on_new_booking ON booking_requests;
CREATE TRIGGER notify_on_new_booking
    AFTER INSERT ON booking_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_booking_request();

-- =============================================================================
-- RATING NOTIFICATION TRIGGERS
-- =============================================================================

-- Function to notify when rating is received
CREATE OR REPLACE FUNCTION notify_rating_received()
RETURNS TRIGGER AS $$
DECLARE
    rater_name TEXT;
    service_details TEXT;
    notification_id UUID;
BEGIN
    -- Get rater name and service details
    SELECT 
        u.name,
        br.service_details
    INTO rater_name, service_details
    FROM users u, booking_requests br
    WHERE u.id = NEW.rater_id
    AND br.id = NEW.booking_request_id;

    -- Notify the rated user
    notification_id := create_notification(
        NEW.rated_id,
        'rating_received',
        'New Rating Received! ⭐',
        format('%s has rated your experience for "%s". Check out your updated rating and feedback.',
               rater_name, service_details),
        NEW.booking_request_id,
        NEW.id,
        false, -- no email for ratings
        false, -- no SMS
        true   -- send push
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new ratings
DROP TRIGGER IF EXISTS notify_on_rating_received ON ratings;
CREATE TRIGGER notify_on_rating_received
    AFTER INSERT ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION notify_rating_received();

-- =============================================================================
-- BOOKING WORKFLOW STATE MACHINE
-- =============================================================================

-- Function to validate booking status transitions
CREATE OR REPLACE FUNCTION validate_booking_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Define valid status transitions
    CASE OLD.status
        WHEN 'pending' THEN
            -- From pending: can go to accepted, declined, or cancelled
            IF NEW.status NOT IN ('accepted', 'declined', 'cancelled') THEN
                RAISE EXCEPTION 'Invalid status transition from pending to %', NEW.status;
            END IF;
            
        WHEN 'accepted' THEN
            -- From accepted: can go to in_progress, cancelled, or completed (skip GPS)
            IF NEW.status NOT IN ('in_progress', 'cancelled', 'completed') THEN
                RAISE EXCEPTION 'Invalid status transition from accepted to %', NEW.status;
            END IF;
            
        WHEN 'in_progress' THEN
            -- From in_progress: can only go to completed
            IF NEW.status NOT IN ('completed') THEN
                RAISE EXCEPTION 'Invalid status transition from in_progress to %', NEW.status;
            END IF;
            
        WHEN 'declined' THEN
            -- Declined is terminal - no transitions allowed
            RAISE EXCEPTION 'Cannot change status from declined';
            
        WHEN 'completed' THEN
            -- Completed is terminal - no transitions allowed
            RAISE EXCEPTION 'Cannot change status from completed';
            
        WHEN 'cancelled' THEN
            -- Cancelled is terminal - no transitions allowed  
            RAISE EXCEPTION 'Cannot change status from cancelled';
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce status transition rules
DROP TRIGGER IF EXISTS enforce_booking_status_transitions ON booking_requests;
CREATE TRIGGER enforce_booking_status_transitions
    BEFORE UPDATE OF status ON booking_requests
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION validate_booking_status_transition();

-- =============================================================================
-- NOTIFICATION MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_unread_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    message TEXT,
    booking_request_id UUID,
    rating_id UUID,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.booking_request_id,
        n.rating_id,
        n.read_at,
        n.created_at
    FROM notifications n
    WHERE n.user_id = p_user_id
    AND (p_unread_only = false OR n.read_at IS NULL)
    ORDER BY n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER  
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get current user
    SELECT id INTO current_user_id
    FROM users
    WHERE auth_user_id = auth.uid();
    
    -- Update notification read status
    UPDATE notifications
    SET read_at = NOW(),
        updated_at = NOW()
    WHERE id = p_notification_id
    AND user_id = current_user_id
    AND read_at IS NULL;
    
    RETURN FOUND;
END;
$$;

-- Function to get notification stats
CREATE OR REPLACE FUNCTION get_notification_stats(p_user_id UUID)
RETURNS TABLE (
    total_count BIGINT,
    unread_count BIGINT,
    today_count BIGINT
)
SECURITY DEFINER
SET search_path = public  
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_count,
        COUNT(CASE WHEN read_at IS NULL THEN 1 END)::BIGINT as unread_count,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END)::BIGINT as today_count
    FROM notifications
    WHERE user_id = p_user_id;
END;
$$;

-- =============================================================================
-- CLEANUP AND MAINTENANCE
-- =============================================================================

-- Function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete read notifications older than 30 days
    DELETE FROM notifications
    WHERE read_at IS NOT NULL
    AND read_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete unread notifications older than 90 days  
    DELETE FROM notifications
    WHERE read_at IS NULL
    AND created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE notifications IS 'System notifications for booking workflow and user communications';
COMMENT ON COLUMN notifications.type IS 'Notification category for filtering and processing';
COMMENT ON COLUMN notifications.delivery_status IS 'External notification delivery status (email/SMS)';
COMMENT ON FUNCTION notify_booking_status_change() IS 'Automatically creates notifications when booking status changes';
COMMENT ON FUNCTION validate_booking_status_transition() IS 'Enforces valid booking status state machine transitions';
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Maintenance function to remove old notifications';

-- Create updated_at trigger for notifications
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
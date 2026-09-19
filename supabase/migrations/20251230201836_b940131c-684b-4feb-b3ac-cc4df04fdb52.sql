-- Drop problematic check constraints that are causing issues
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_check;
ALTER TABLE typing_status DROP CONSTRAINT IF EXISTS typing_status_id_check;

-- Add a more flexible check for sender field (he, she, or user)
ALTER TABLE messages ADD CONSTRAINT messages_sender_check 
  CHECK (sender IN ('he', 'she', 'user'));
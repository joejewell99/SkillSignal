ALTER TABLE developer_conversations
    ADD COLUMN requester_closed_at TIMESTAMP(6) WITH TIME ZONE,
    ADD COLUMN receiver_closed_at TIMESTAMP(6) WITH TIME ZONE;

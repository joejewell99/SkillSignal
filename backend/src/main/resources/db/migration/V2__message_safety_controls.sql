ALTER TABLE developer_conversations
    ADD COLUMN requester_blocked_until TIMESTAMP(6) WITH TIME ZONE,
    ADD COLUMN receiver_blocked_until TIMESTAMP(6) WITH TIME ZONE,
    ADD COLUMN requester_muted_until TIMESTAMP(6) WITH TIME ZONE,
    ADD COLUMN receiver_muted_until TIMESTAMP(6) WITH TIME ZONE;

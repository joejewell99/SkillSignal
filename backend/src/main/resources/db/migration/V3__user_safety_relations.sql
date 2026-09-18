CREATE TABLE user_safety_relations (
    id BIGSERIAL PRIMARY KEY,
    owner_user_id BIGINT NOT NULL,
    target_user_id BIGINT NOT NULL,
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    muted_until TIMESTAMP(6) WITH TIME ZONE,
    CONSTRAINT uq_user_safety_owner_target UNIQUE (owner_user_id, target_user_id),
    CONSTRAINT chk_user_safety_different_users CHECK (owner_user_id <> target_user_id)
);

CREATE INDEX idx_user_safety_target ON user_safety_relations(target_user_id);

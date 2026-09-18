CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    presence VARCHAR(255),
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    terms_accepted_at TIMESTAMP(6) WITH TIME ZONE,
    terms_version VARCHAR(40)
);

CREATE TABLE marketplace_profiles (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    image TEXT NOT NULL,
    projects_json TEXT NOT NULL,
    posts_json TEXT NOT NULL,
    contact_links_json TEXT,
    preferences_json TEXT,
    user_id BIGINT UNIQUE,
    featured BOOLEAN NOT NULL,
    displayed BOOLEAN NOT NULL,
    demo_profile BOOLEAN NOT NULL,
    display_order INTEGER NOT NULL
);

CREATE TABLE marketplace_profile_skills (
    profile_id BIGINT NOT NULL REFERENCES marketplace_profiles(id),
    skill_order INTEGER NOT NULL,
    skill VARCHAR(255) NOT NULL,
    PRIMARY KEY (profile_id, skill_order)
);

CREATE TABLE ai_search_usage (
    id BIGSERIAL PRIMARY KEY,
    subject_type VARCHAR(255) NOT NULL,
    subject_key VARCHAR(255) NOT NULL,
    usage_date DATE NOT NULL,
    search_count INTEGER NOT NULL,
    CONSTRAINT uq_ai_search_usage_subject_date UNIQUE (subject_type, subject_key, usage_date)
);

CREATE TABLE developer_connections (
    id BIGSERIAL PRIMARY KEY,
    requester_user_id BIGINT NOT NULL,
    receiver_user_id BIGINT NOT NULL,
    requester_profile_id BIGINT NOT NULL REFERENCES marketplace_profiles(id),
    receiver_profile_id BIGINT NOT NULL REFERENCES marketplace_profiles(id),
    status VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    responded_at TIMESTAMP(6) WITH TIME ZONE
);

CREATE INDEX idx_connection_requester ON developer_connections(requester_user_id);
CREATE INDEX idx_connection_receiver_status ON developer_connections(receiver_user_id, status);

CREATE TABLE saved_candidates (
    id BIGSERIAL PRIMARY KEY,
    employer_user_id BIGINT NOT NULL,
    developer_profile_id BIGINT NOT NULL REFERENCES marketplace_profiles(id),
    created_at TIMESTAMP(6) WITH TIME ZONE
);

CREATE INDEX idx_saved_candidate_employer ON saved_candidates(employer_user_id);
CREATE INDEX idx_saved_candidate_profile ON saved_candidates(developer_profile_id);

CREATE TABLE proof_signals (
    id BIGSERIAL PRIMARY KEY,
    developer_user_id BIGINT NOT NULL,
    developer_profile_id BIGINT NOT NULL REFERENCES marketplace_profiles(id),
    employer_profile_id BIGINT NOT NULL REFERENCES marketplace_profiles(id),
    project_name VARCHAR(160) NOT NULL,
    note VARCHAR(500) NOT NULL,
    project_url VARCHAR(600),
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL
);

CREATE TABLE developer_conversations (
    id BIGSERIAL PRIMARY KEY,
    requester_user_id BIGINT NOT NULL,
    receiver_user_id BIGINT NOT NULL,
    requester_profile_id BIGINT NOT NULL REFERENCES marketplace_profiles(id),
    receiver_profile_id BIGINT NOT NULL REFERENCES marketplace_profiles(id),
    status VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    requester_favorited BOOLEAN NOT NULL,
    receiver_favorited BOOLEAN NOT NULL,
    requester_read_at TIMESTAMP(6) WITH TIME ZONE,
    receiver_read_at TIMESTAMP(6) WITH TIME ZONE
);

CREATE INDEX idx_conversation_requester ON developer_conversations(requester_user_id);
CREATE INDEX idx_conversation_receiver ON developer_conversations(receiver_user_id);
CREATE INDEX idx_conversation_updated ON developer_conversations(updated_at);

CREATE TABLE developer_messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES developer_conversations(id),
    sender_user_id BIGINT NOT NULL,
    body TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_message_conversation_created ON developer_messages(conversation_id, created_at);

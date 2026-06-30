# 노벨플로우 데이터베이스 및 백엔드 서비스 설계서
(Database Schema & BaaS Architecture Specifications)

이 문서는 노벨플로우(Novelflow)의 데이터 관리와 서비스 인프라를 백엔드 서버 코딩 없이 구현하기 위한 **Supabase(BaaS) 설계 명세**를 다룹니다. PostgreSQL/pgvector 기반의 데이터 스키마, Row Level Security(RLS) 보안 정책, 그리고 서버리스 Supabase Edge Functions 명세를 다룹니다.

---

## 1. 데이터베이스 스키마 설계 (PostgreSQL DDL)

```sql
-- pgvector 익스텐션 활성화 (RAG 벡터 검색용)
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. 사용자 및 프로젝트 테이블
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    synopsis TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 인물 및 인물 관계도 테이블
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('PROTAGONIST', 'ANTAGONIST', 'SUPPORTING', 'EXTRA')),
    description TEXT,
    is_custom_name BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE character_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    target_character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL,
    description TEXT,
    strength INT NOT NULL DEFAULT 5 CHECK (strength BETWEEN 1 AND 10),
    is_bidirectional BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_character_relationship UNIQUE (source_character_id, target_character_id, relationship_type)
);

-- 3. 에피소드 및 복선 타임라인 테이블
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    chapter_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_project_chapter UNIQUE (project_id, chapter_number)
);

CREATE TABLE timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_order VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('NORMAL_EVENT', 'FORESHADOWING_SETUP', 'FORESHADOWING_PAYOFF')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE foreshadowing_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    setup_event_id UUID NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
    payoff_event_id UUID REFERENCES timeline_events(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UNRESOLVED' CHECK (status IN ('UNRESOLVED', 'RESOLVED', 'ABANDONED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_foreshadow_link UNIQUE (setup_event_id, payoff_event_id)
);

-- 4. 노션 양방향 동기화 테이블
CREATE TABLE notion_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    access_token VARCHAR(512) NOT NULL,
    workspace_id VARCHAR(255) NOT NULL,
    workspace_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notion_sync_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    local_table VARCHAR(100) NOT NULL,
    local_record_id UUID NOT NULL,
    notion_page_id VARCHAR(255) NOT NULL,
    notion_database_id VARCHAR(255),
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status VARCHAR(50) NOT NULL DEFAULT 'IN_SYNC' CHECK (sync_status IN ('IN_SYNC', 'OUT_OF_SYNC', 'CONFLICT', 'ERROR')),
    last_checksum VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_local_mapping UNIQUE (local_table, local_record_id),
    CONSTRAINT unique_notion_page UNIQUE (notion_page_id)
);

-- 5. RAG 벡터 데이터 테이블
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_table VARCHAR(100) NOT NULL,
    source_id UUID NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    token_count INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id UUID NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
    embedding VECTOR(1536) NOT NULL,
    meta_tags JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- HNSW 인덱싱 생성
CREATE INDEX IF NOT EXISTS document_embeddings_hnsw_idx 
ON document_embeddings USING hnsw (embedding vector_cosine_ops);

-- 6. 세계관 지도 편집기 테이블
CREATE TABLE maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_map_id UUID REFERENCES maps(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE map_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('POLYGON', 'PIN', 'ROUTE', 'TEXT')),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    properties JSONB NOT NULL DEFAULT '{}',
    coordinates JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE map_element_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    element_id UUID NOT NULL REFERENCES map_elements(id) ON DELETE CASCADE,
    link_type VARCHAR(50) NOT NULL CHECK (link_type IN ('CHAPTER', 'CHARACTER', 'FORESHADOWING')),
    linked_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE map_history_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    snapshot_name VARCHAR(255) NOT NULL,
    in_universe_date VARCHAR(255),
    notes TEXT,
    chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE map_history_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id UUID NOT NULL REFERENCES map_history_snapshots(id) ON DELETE CASCADE,
    element_id UUID NOT NULL REFERENCES map_elements(id) ON DELETE CASCADE,
    properties_override JSONB,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE character_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
    coordinates JSONB NOT NULL, -- [x, y]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Supabase RLS (Row Level Security) 보안 정책 설계

```sql
-- 모든 테이블 RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE foreshadowing_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_element_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_history_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_history_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_positions ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정 예시 (본인 소유 데이터만 가동)
CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their own projects" ON projects FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Users can manage maps in their projects" ON maps FOR ALL USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = maps.project_id AND projects.profile_id = auth.uid()));
CREATE POLICY "Users can manage map elements in their maps" ON map_elements FOR ALL USING (EXISTS (SELECT 1 FROM maps JOIN projects ON maps.project_id = projects.id WHERE maps.id = map_elements.map_id AND projects.profile_id = auth.uid()));
CREATE POLICY "Users can manage character positions" ON character_positions FOR ALL USING (EXISTS (SELECT 1 FROM maps JOIN projects ON maps.project_id = projects.id WHERE maps.id = character_positions.map_id AND projects.profile_id = auth.uid()));
```

---

## 3. Supabase Edge Functions 서버리스 명세

| 함수명 | 트리거 | 역할 및 상세 설명 |
| :--- | :--- | :--- |
| **`notion-oauth`** | Notion OAuth Callback | Notion integration 인증 토큰 생성 및 보관 |
| **`notion-sync`** | Webhook / Event Queue | Notion 3 rps 리밋 우회 및 양방향 동기화 처리 |
| **`ai-assistant`** | client invocation | RAG 데이터 조립 후 GPT-4o-mini 작명 제안 |
| **`billing-webhook`** | Portone Webhook | 구독 결제 및 멤버십 해지 웹훅 수령 |

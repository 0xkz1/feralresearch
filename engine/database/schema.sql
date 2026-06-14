create table if not exists disaster_events (
  id text primary key,
  source text not null,
  title text not null,
  url text,
  occurred_at text,
  latitude real,
  longitude real,
  magnitude real,
  raw_json text not null,
  created_at text not null
);

create table if not exists habitat_features (
  id text primary key,
  event_id text not null,
  source text not null,
  feature_type text,
  name text,
  latitude real,
  longitude real,
  tags_json text not null,
  created_at text not null,
  foreign key (event_id) references disaster_events(id)
);

create table if not exists prompt_runs (
  id text primary key,
  event_id text not null,
  scenario_json text not null,
  positive_prompt text not null,
  negative_prompt text not null,
  browser_task_path text,
  prompt_packet_path text not null,
  status text not null,
  created_at text not null,
  -- Research Log fields (added Phase 3)
  entry_type text not null default 'long',
  what_happened text,
  source_context text,
  my_reading text,
  visual_response text,
  foreign key (event_id) references disaster_events(id)
);


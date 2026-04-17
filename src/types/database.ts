export interface DbUser {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface DbContent {
  id: string;
  user_id: string;
  title: string;
  image_url: string;
  prompt: string;
  model: string;
  seed: string | null;
  parent_content_id: string | null;
  created_at: string;
}

export interface DbLike {
  id: string;
  user_id: string;
  content_id: string;
  created_at: string;
}

export interface DbFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export type DbGenerationStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "canceled";

export interface DbGenerationJob {
  id: string;
  user_id: string;
  status: DbGenerationStatus;
  provider: string;
  provider_job_id: string | null;
  model: string;
  prompt: string;
  params: Record<string, unknown>;
  output_content_id: string | null;
  error_code: string | null;
  error_message: string | null;
  attempts: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;
}

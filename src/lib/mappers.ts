import type {
  DbUser,
  DbContent,
  DbGenerationJob,
  User,
  Content,
  GenerationJob,
} from "@/types";

export function mapDbUser(row: DbUser): User {
  return {
    id: row.id,
    username: row.username,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

export function mapDbContent(row: DbContent): Content {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    imageUrl: row.image_url,
    prompt: row.prompt,
    model: row.model,
    seed: row.seed,
    parentContentId: row.parent_content_id,
    createdAt: row.created_at,
  };
}

export function mapDbGenerationJob(row: DbGenerationJob): GenerationJob {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    provider: row.provider,
    providerJobId: row.provider_job_id,
    model: row.model,
    prompt: row.prompt,
    params: row.params ?? {},
    outputContentId: row.output_content_id,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    attempts: row.attempts,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

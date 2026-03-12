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

export interface User {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Content {
  id: string;
  userId: string;
  title: string;
  imageUrl: string;
  prompt: string;
  model: string;
  seed: string | null;
  parentContentId: string | null;
  createdAt: string;
}

export interface ContentWithCreator extends Content {
  creator: Pick<User, "id" | "username" | "avatarUrl">;
}

export interface FeedItem extends ContentWithCreator {
  likeCount: number;
}

export interface ProfileData {
  user: User;
  contentCount: number;
  followerCount: number;
  followingCount: number;
}

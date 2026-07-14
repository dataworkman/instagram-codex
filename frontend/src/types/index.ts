export interface UserBrief {
  id: number;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface User extends UserBrief {
  email: string;
  bio?: string | null;
  posts_count: number;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  created_at: string;
}

export interface Post {
  id: number;
  user: UserBrief;
  image_url: string;
  caption?: string | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
}

export interface Comment {
  id: number;
  post_id: number;
  user: UserBrief;
  content: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

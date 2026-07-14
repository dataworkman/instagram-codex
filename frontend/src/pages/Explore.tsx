import { useEffect, useState } from 'react';
import api from '../api/client';
import PostGrid from '../components/Post/PostGrid';
import { Post } from '../types';

export default function Explore() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Post[]>('/posts/explore', { params: { limit: 30 } })
      .then(({ data }) => setPosts(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">탐색 탭을 불러오는 중...</div>;

  return (
    <div className="container">
      <PostGrid posts={posts} />
    </div>
  );
}

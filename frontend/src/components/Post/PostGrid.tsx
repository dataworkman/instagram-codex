import { useNavigate } from 'react-router-dom';
import { mediaUrl } from '../../api/client';
import { Post } from '../../types';
import styles from './PostGrid.module.css';

interface Props {
  posts: Post[];
}

export default function PostGrid({ posts }: Props) {
  const navigate = useNavigate();

  if (posts.length === 0) {
    return <div className={styles.empty}>게시물이 없습니다.</div>;
  }

  return (
    <div className={styles.grid}>
      {posts.map((post) => (
        <div key={post.id} className={styles.item} onClick={() => navigate(`/p/${post.id}`)}>
          <img src={mediaUrl(post.image_url)} alt="" loading="lazy" />
          <div className={styles.overlay}>
            <span>❤️ {post.likes_count}</span>
            <span>💬 {post.comments_count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

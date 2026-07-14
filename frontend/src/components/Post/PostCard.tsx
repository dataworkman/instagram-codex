import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { mediaUrl, timeAgo } from '../../api/client';
import { Post } from '../../types';
import UserAvatar from '../User/UserAvatar';
import { CommentIcon, HeartIcon, SendIcon } from '../common/Icons';
import styles from './PostCard.module.css';
import { useAuth } from '../../context/AuthContext';

interface Props {
  post: Post;
  onUpdate?: (post: Post) => void;
}

export default function PostCard({ post, onUpdate }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [localPost, setLocalPost] = useState(post);
  const [heartAnim, setHeartAnim] = useState(false);
  const lastTap = useRef(0);

  const updatePost = (updated: Partial<Post>) => {
    const newPost = { ...localPost, ...updated };
    setLocalPost(newPost);
    onUpdate?.(newPost);
  };

  const toggleLike = async () => {
    if (!user) { navigate('/login', { state: { from: window.location.pathname } }); return; }
    const { data } = await api.post(`/posts/${localPost.id}/like`);
    updatePost({ is_liked: data.is_liked, likes_count: data.likes_count });
  };

  const handleImageClick = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!user) { navigate('/login', { state: { from: window.location.pathname } }); return; }
      if (!localPost.is_liked) toggleLike(); setHeartAnim(true); setTimeout(() => setHeartAnim(false), 800);
    }
    lastTap.current = now;
  };

  const sharePost = async () => {
    const url = `${window.location.origin}/p/${localPost.id}`;
    if (navigator.share) {
      await navigator.share({ title: `${localPost.user.username}의 게시물`, text: localPost.caption || undefined, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
  };

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <Link to={`/${localPost.user.username}`}>
          <UserAvatar username={localPost.user.username} avatarUrl={localPost.user.avatar_url} size={32} />
        </Link>
        <Link to={`/${localPost.user.username}`} className={styles.username}>
          {localPost.user.username}
        </Link>
        <span className={styles.dot}>·</span><span className={styles.headerTime}>{timeAgo(localPost.created_at)}</span>
      </header>

      <div className={styles.imageWrap} onClick={handleImageClick}>
        <img src={mediaUrl(localPost.image_url)} alt={localPost.caption || 'post'} loading="lazy" />
        <div className={`${styles.heartOverlay} ${heartAnim ? styles.show : ''}`}><HeartIcon filled /></div>
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${localPost.is_liked ? styles.liked : ''}`}
          onClick={toggleLike}
          aria-label="좋아요"
        >
          <HeartIcon filled={localPost.is_liked} />
        </button>
        <button
          className={styles.actionBtn}
          onClick={() => user ? navigate(`/p/${localPost.id}`) : navigate('/login', { state: { from: `/p/${localPost.id}` } })}
          aria-label="댓글"
        >
          <CommentIcon />
        </button>
        <button className={styles.actionBtn} aria-label="공유" onClick={sharePost}><SendIcon /></button>
      </div>

      <div className={styles.body}>
        <div className={styles.likes}>좋아요 {localPost.likes_count.toLocaleString()}개</div>
        {localPost.caption && (
          <p className={styles.caption}>
            <Link to={`/${localPost.user.username}`} className={styles.captionUser}>
              {localPost.user.username}
            </Link>
            {localPost.caption}
          </p>
        )}
        {localPost.comments_count > 0 && (
          <button className={styles.viewComments} onClick={() => navigate(`/p/${localPost.id}`)}>
            댓글 {localPost.comments_count}개 모두 보기
          </button>
        )}
      </div>
    </article>
  );
}

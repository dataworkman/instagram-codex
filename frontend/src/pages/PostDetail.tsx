import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { mediaUrl, timeAgo } from '../api/client';
import UserAvatar from '../components/User/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { Comment, Post } from '../types';
import styles from './PostDetail.module.css';

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    Promise.all([
      api.get<Post>(`/posts/${postId}`),
      api.get<Comment[]>(`/posts/${postId}/comments`),
    ]).then(([postRes, commentsRes]) => {
      setPost(postRes.data);
      setComments(commentsRes.data);
    }).finally(() => setLoading(false));
  }, [postId]);

  const toggleLike = async () => {
    if (!post) return;
    if (!user) { navigate('/login', { state: { from: `/p/${post.id}` } }); return; }
    const { data } = await api.post(`/posts/${post.id}/like`);
    setPost({ ...post, is_liked: data.is_liked, likes_count: data.likes_count });
  };

  const submitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/login', { state: { from: post ? `/p/${post.id}` : '/' } }); return; }
    if (!newComment.trim() || !post) return;
    const { data } = await api.post(`/posts/${post.id}/comments`, { content: newComment });
    setComments([...comments, data]);
    setPost({ ...post, comments_count: post.comments_count + 1 });
    setNewComment('');
  };

  const deletePost = async () => {
    if (!post || !confirm('게시물을 삭제하시겠습니까?')) return;
    await api.delete(`/posts/${post.id}`);
    navigate(`/${post.user.username}`);
  };

  const deleteComment = async (commentId: number) => {
    await api.delete(`/comments/${commentId}`);
    setComments(comments.filter((c) => c.id !== commentId));
    if (post) setPost({ ...post, comments_count: post.comments_count - 1 });
  };

  if (loading) return <div className="loading">게시물을 불러오는 중...</div>;
  if (!post) return <div className="loading">게시물을 찾을 수 없습니다.</div>;

  const isOwner = user?.id === post.user.id;

  return (
    <div className="container">
      <div className={styles.detail}>
        <div className={styles.imageSection}>
          <img src={mediaUrl(post.image_url)} alt={post.caption || 'post'} />
        </div>
        <div className={styles.infoSection}>
          <header className={styles.postHeader}>
            <Link to={`/${post.user.username}`} className={styles.userInfo}>
              <UserAvatar username={post.user.username} avatarUrl={post.user.avatar_url} size={32} />
              <span className={styles.username}>{post.user.username}</span>
            </Link>
            {isOwner && (
              <button className={styles.deleteBtn} onClick={deletePost}>삭제</button>
            )}
          </header>

          <div className={styles.comments}>
            {post.caption && (
              <div className={styles.comment}>
                <UserAvatar username={post.user.username} avatarUrl={post.user.avatar_url} size={32} />
                <div>
                  <span className={styles.commentUser}>{post.user.username}</span>
                  {post.caption}
                </div>
              </div>
            )}
            {comments.map((c) => (
              <div key={c.id} className={styles.comment}>
                <Link to={`/${c.user.username}`}>
                  <UserAvatar username={c.user.username} avatarUrl={c.user.avatar_url} size={32} />
                </Link>
                <div>
                  <div>
                    <Link to={`/${c.user.username}`} className={styles.commentUser}>{c.user.username}</Link>
                    {c.content}
                  </div>
                  <div className={styles.commentTime}>
                    {timeAgo(c.created_at)}
                    {user?.id === c.user.id && (
                      <button
                        style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: 12 }}
                        onClick={() => deleteComment(c.id)}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.actions}>
            <div className={styles.actionBtns}>
              <button className={`${styles.actionBtn} ${post.is_liked ? styles.liked : ''}`} onClick={toggleLike}>
                {post.is_liked ? '❤️' : '🤍'}
              </button>
            </div>
            <div className={styles.likes}>좋아요 {post.likes_count.toLocaleString()}개</div>
            <time style={{ color: 'var(--color-text-secondary)', fontSize: 12, textTransform: 'uppercase' }}>
              {timeAgo(post.created_at)}
            </time>
          </div>

          <form className={styles.commentForm} onSubmit={submitComment}>
            <input
              className={styles.commentInput}
              placeholder={user ? '댓글 달기...' : '댓글을 작성하려면 로그인하세요'}
              onFocus={() => !user && navigate('/login', { state: { from: `/p/${post.id}` } })}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" className={styles.postBtn} disabled={!!user && !newComment.trim()}>{user ? '게시' : '로그인'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

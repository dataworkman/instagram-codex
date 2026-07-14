import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import PostGrid from '../components/Post/PostGrid';
import FollowButton from '../components/User/FollowButton';
import UserAvatar from '../components/User/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { Post, User } from '../types';
import styles from './Profile.module.css';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', bio: '' });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    Promise.all([
      api.get<User>(`/users/${username}`),
      api.get<Post[]>(`/posts/user/${username}`),
    ]).then(([profileRes, postsRes]) => {
      setProfile(profileRes.data);
      setPosts(postsRes.data);
      setEditForm({
        full_name: profileRes.data.full_name || '',
        bio: profileRes.data.bio || '',
      });
    }).finally(() => setLoading(false));
  }, [username]);

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    const { data } = await api.put<User>('/users/me', editForm);
    setProfile(data);
    setEditing(false);
    await refreshUser();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarStatus('JPG, PNG 또는 WEBP 이미지만 선택할 수 있습니다.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarStatus('프로필 사진은 5MB 이하여야 합니다.');
      e.target.value = '';
      return;
    }

    const form = new FormData();
    form.append('file', file);
    setAvatarUploading(true);
    setAvatarStatus('프로필 사진을 업로드하는 중...');
    try {
      const { data } = await api.post<User>('/users/me/avatar', form);
      setProfile(data);
      await refreshUser();
      setAvatarStatus('프로필 사진이 변경되었습니다.');
    } catch (uploadError: unknown) {
      const detail = (uploadError as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      const messages: Record<string, string> = {
        'Only jpg, jpeg, png, webp files are allowed': 'JPG, PNG 또는 WEBP 이미지만 선택할 수 있습니다.',
        'File size must be less than 5MB': '프로필 사진은 5MB 이하여야 합니다.',
        'Invalid image file': '올바른 이미지 파일을 선택해 주세요.',
        'Image content does not match its extension': '파일 확장자와 이미지 형식이 일치하지 않습니다.',
      };
      setAvatarStatus((detail && messages[detail]) || '사진 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  if (loading) return <div className="loading">프로필을 불러오는 중...</div>;
  if (!profile) return <div className="loading">사용자를 찾을 수 없습니다.</div>;

  return (
    <div className={styles.profile}>
      <header className={styles.header}>
        <div className={styles.avatarWrap}>
          {isOwnProfile ? (
            <button className={styles.avatarButton} onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading} aria-label="프로필 사진 변경">
              <UserAvatar username={profile.username} avatarUrl={profile.avatar_url} size={150} />
              <span>{avatarUploading ? '업로드 중' : '사진 변경'}</span>
            </button>
          ) : (
            <UserAvatar username={profile.username} avatarUrl={profile.avatar_url} size={150} />
          )}
          <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} hidden />
        </div>
        <div className={styles.info}>
          <div className={styles.topRow}>
            <h1 className={styles.username}>{profile.username}</h1>
            <div className={styles.actions}>
              {isOwnProfile ? (
                <>
                  <button className="btn btn-outline" onClick={() => setEditing(!editing)}>
                    {editing ? '취소' : '프로필 수정'}
                  </button>
                  <button className="btn btn-outline" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading}>
                    {avatarUploading ? '업로드 중...' : '사진 변경'}
                  </button>
                  <button className="btn btn-outline" onClick={handleLogout}>로그아웃</button>
                </>
              ) : (
                <>
                  <FollowButton
                    username={profile.username}
                    isFollowing={profile.is_following}
                    onToggle={(isFollowing, followersCount) =>
                      setProfile({ ...profile, is_following: isFollowing, followers_count: followersCount ?? profile.followers_count })
                    }
                  />
                  <button
                    className="btn btn-outline"
                    onClick={() => navigate(`/messages?to=${encodeURIComponent(profile.username)}`)}
                  >
                    메시지
                  </button>
                </>
              )}
            </div>
          </div>
          <div className={styles.stats}>
            <span className={styles.stat}><strong>{profile.posts_count}</strong> 게시물</span>
            <span className={styles.stat}><strong>{profile.followers_count.toLocaleString()}</strong> 팔로워</span>
            <span className={styles.stat}><strong>{profile.following_count.toLocaleString()}</strong> 팔로잉</span>
          </div>
          <div className={styles.bio}>
            {profile.full_name && <div className={styles.fullName}>{profile.full_name}</div>}
            {profile.bio && <div>{profile.bio}</div>}
          </div>
          {isOwnProfile && avatarStatus && <div className={styles.avatarStatus} role="status" aria-live="polite">{avatarStatus}</div>}
          {editing && (
            <form className={styles.editForm} onSubmit={handleEdit}>
              <input className="input" placeholder="이름" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
              <textarea className="input" placeholder="소개" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={3} />
              <button type="submit" className="btn btn-primary">저장</button>
            </form>
          )}
        </div>
      </header>
      <PostGrid posts={posts} />
    </div>
  );
}

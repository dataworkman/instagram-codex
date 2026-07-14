import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import FollowButton from '../components/User/FollowButton';
import UserAvatar from '../components/User/UserAvatar';
import { UserBrief } from '../types';
import styles from './Suggested.module.css';

export default function Suggested() {
  const [users, setUsers] = useState<UserBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<UserBrief[]>('/users/suggestions', { params: { limit: 50 } })
      .then(({ data }) => setUsers(data))
      .catch(() => setError('추천 계정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className={styles.panel}>
      <h1>추천</h1>
      <h2>회원님을 위한 추천</h2>
      {loading && <div className={styles.status}>추천 계정을 불러오는 중...</div>}
      {error && <div className={styles.error} role="alert">{error}</div>}
      {!loading && !error && users.length === 0 && <div className={styles.status}>새로운 추천 계정이 없습니다.</div>}
      <div className={styles.list}>
        {users.map((user) => (
          <div className={styles.user} key={user.id}>
            <Link to={`/${user.username}`} className={styles.profile}>
              <UserAvatar username={user.username} avatarUrl={user.avatar_url} size={48} />
              <div><strong>{user.username}</strong><span>{user.full_name || 'Instagram 사용자'}</span><small>회원님을 위한 추천</small></div>
            </Link>
            <FollowButton username={user.username} isFollowing={false} />
          </div>
        ))}
      </div>
    </section>
  );
}

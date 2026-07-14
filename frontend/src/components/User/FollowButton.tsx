import { useState } from 'react';
import api from '../../api/client';
import styles from './FollowButton.module.css';

interface Props {
  username: string;
  isFollowing: boolean;
  onToggle?: (isFollowing: boolean, followersCount?: number) => void;
}

export default function FollowButton({ username, isFollowing, onToggle }: Props) {
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/users/${username}/follow`);
      setFollowing(data.is_following);
      onToggle?.(data.is_following, data.followers_count);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`${styles.followBtn} ${following ? styles.following : styles.notFollowing}`}
      onClick={handleClick}
      disabled={loading}
    >
      {following ? '팔로잉' : '팔로우'}
    </button>
  );
}

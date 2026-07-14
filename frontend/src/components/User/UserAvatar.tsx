import { mediaUrl } from '../../api/client';
import styles from './UserAvatar.module.css';

interface Props {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}

export default function UserAvatar({ username, avatarUrl, size = 32 }: Props) {
  if (avatarUrl) {
    return (
      <img
        className={styles.avatar}
        src={mediaUrl(avatarUrl)}
        alt={username}
        width={size}
        height={size}
      />
    );
  }
  return (
    <div
      className={styles.placeholder}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {username[0]}
    </div>
  );
}

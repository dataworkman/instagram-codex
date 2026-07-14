import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../User/UserAvatar';
import { ExploreIcon, HeartIcon, HomeIcon, PlusIcon, SearchIcon, SendIcon } from '../common/Icons';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user } = useAuth();
  const items = [
    { to: '/', label: '홈', icon: HomeIcon, end: true },
    { to: '/search', label: '검색', icon: SearchIcon },
    { to: '/explore', label: '탐색 탭', icon: ExploreIcon },
    { to: '/create', label: '만들기', icon: PlusIcon },
  ];
  return <nav className={styles.navbar} aria-label="주 메뉴">
    <NavLink to="/" className={styles.brand}><span className={styles.wordmark}>Instagram</span><span className={styles.brandMark}>◎</span></NavLink>
    <div className={styles.links}>
      {items.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({isActive}) => `${styles.item} ${isActive ? styles.active : ''}`}>
        {({isActive}) => <><Icon filled={isActive}/><span>{label}</span></>}
      </NavLink>)}
      <NavLink to="/messages" className={({isActive}) => `${styles.item} ${isActive ? styles.active : ''}`}><SendIcon/><span>메시지</span></NavLink>
      <NavLink to="/notifications" className={({isActive}) => `${styles.item} ${isActive ? styles.active : ''}`}>{({isActive})=><><HeartIcon filled={isActive}/><span>알림</span></>}</NavLink>
      {user && <NavLink to={`/${user.username}`} className={({isActive}) => `${styles.item} ${isActive ? styles.active : ''}`}>
        <UserAvatar username={user.username} avatarUrl={user.avatar_url} size={25}/><span>프로필</span>
      </NavLink>}
      {!user && <NavLink to="/login" className={`${styles.item} ${styles.login}`}><span>로그인</span></NavLink>}
    </div>
    <NavLink to="/settings" className={({isActive}) => `${styles.more} ${isActive ? styles.active : ''}`}>☰ <span>설정</span></NavLink>
  </nav>;
}

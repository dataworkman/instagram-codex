import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import UserAvatar from '../components/User/UserAvatar';
import { SearchIcon } from '../components/common/Icons';
import { UserBrief } from '../types';
import styles from './Search.module.css';
import sortStyles from './SearchSort.module.css';

type SortBy = 'latest' | 'username';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('latest');
  const [error, setError] = useState('');
  useEffect(() => {
    setLoading(true);
    setError('');
    let active = true;
    const trimmedQuery = query.trim();
    const timer = window.setTimeout(() => {
      const request = trimmedQuery
        ? api.get<UserBrief[]>('/users/search', { params: { q: trimmedQuery, sort_by: sortBy } })
        : api.get<UserBrief[]>('/users/suggestions', { params: { limit: 50, sort_by: sortBy } });
      request
        .then(({ data }) => { if (active) setResults(data); })
        .catch(() => { if (active) { setResults([]); setError('사용자 목록을 불러오지 못했습니다.'); } })
        .finally(() => { if (active) setLoading(false); });
    }, trimmedQuery ? 300 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, sortBy]);
  return <section className={styles.panel}>
    <h1>검색</h1><label className={styles.search}><SearchIcon/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="검색"/>{query && <button onClick={()=>setQuery('')}>×</button>}</label>
    <div className={sortStyles.resultHeader}>
      <div className={styles.heading}>{query.trim() ? '검색 결과' : '사용자 둘러보기'}</div>
      <label>정렬<select value={sortBy} onChange={e=>setSortBy(e.target.value as SortBy)}><option value="latest">최신 가입순</option><option value="username">사용자 이름순</option></select></label>
    </div>
    {loading ? <div className={styles.empty}>불러오는 중...</div> : error ? <div className={sortStyles.error} role="alert">{error}</div> : results.length ? results.map(u => <Link to={`/${u.username}`} className={styles.user} key={u.id}><UserAvatar username={u.username} avatarUrl={u.avatar_url} size={44}/><div><strong>{u.username}</strong><span>{u.full_name || 'Instagram 사용자'}</span></div></Link>) : <div className={styles.empty}>{query ? '검색 결과가 없습니다.' : '표시할 사용자가 없습니다.'}</div>}
  </section>;
}

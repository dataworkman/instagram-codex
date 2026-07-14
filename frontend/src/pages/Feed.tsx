import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import PostCard from '../components/Post/PostCard';
import UserAvatar from '../components/User/UserAvatar';
import FollowButton from '../components/User/FollowButton';
import { useAuth } from '../context/AuthContext';
import { Post, UserBrief } from '../types';
import styles from './Feed.module.css';

const demoStories = ['alice','bob','charlie','sophie','nathan','mira'];
export default function Feed() {
  const { user } = useAuth(); const [posts,setPosts]=useState<Post[]>([]); const [loading,setLoading]=useState(true); const [skip,setSkip]=useState(0); const [hasMore,setHasMore]=useState(true); const limit=10;
  const [suggestions,setSuggestions]=useState<UserBrief[]>([]);
  const loadPosts=async(offset:number,append=false)=>{const endpoint=user?'/posts/feed':'/posts/explore';const {data}=await api.get<Post[]>(endpoint,{params:{skip:offset,limit}});setPosts(p=>append?[...p,...data]:data);setHasMore(data.length===limit)};
  useEffect(()=>{setLoading(true);setSkip(0);loadPosts(0).finally(()=>setLoading(false))},[user?.id]);
  useEffect(()=>{api.get<UserBrief[]>('/users/suggestions',{params:{limit:5}}).then(({data})=>setSuggestions(data)).catch(()=>setSuggestions([]))},[user?.id]);
  if(loading)return <div className={styles.skeleton}><div/><div/><div/></div>;
  return <>
    <div className={styles.shell}>
      <main className={styles.feed}>
        <div className={styles.stories}>{demoStories.map((name,i)=><div className={styles.story} key={name}><div className={styles.storyRing}><UserAvatar username={name} avatarUrl={posts[i]?.user.avatar_url} size={56}/></div><span>{name}</span></div>)}</div>
        {posts.length===0?<div className={styles.empty}><div>◎</div><h2>피드가 비어 있습니다</h2><p>다른 사용자를 팔로우하거나 첫 게시물을 공유해보세요.</p></div>:posts.map(post=><PostCard key={post.id} post={post}/>)}
        {hasMore&&posts.length>0&&<button className={styles.loadMore} onClick={async()=>{const n=skip+limit;await loadPosts(n,true);setSkip(n)}}>게시물 더 보기</button>}
      </main>
      <aside className={styles.aside}>
        {user&&<div className={styles.me}><UserAvatar username={user.username} avatarUrl={user.avatar_url} size={44}/><div><strong>{user.username}</strong><span>{user.full_name}</span></div></div>}
        <div className={styles.suggestTitle}><strong>회원님을 위한 추천</strong><span><Link to="/suggested">모두 보기</Link></span></div>
        {suggestions.map(u=><div className={styles.suggestion} key={u.id}><Link to={`/${u.username}`}><UserAvatar username={u.username} avatarUrl={u.avatar_url} size={34}/></Link><div><Link to={`/${u.username}`}><strong>{u.username}</strong></Link><span>{u.full_name || '회원님을 위한 추천'}</span></div><FollowButton username={u.username} isFollowing={false}/></div>)}
      </aside>
    </div>
    <footer className={styles.siteFooter}>
      <nav aria-label="사이트 정보"><Link to="/about">소개</Link> · <Link to="/help">도움말</Link> · 개인정보처리방침 · 약관 · 위치 · 한국어</nav>
      <p>© 2026 INSTAGRAM FROM META</p>
    </footer>
  </>;
}

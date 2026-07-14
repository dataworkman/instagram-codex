import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { mediaUrl, timeAgo } from '../api/client';
import UserAvatar from '../components/User/UserAvatar';
import { HeartIcon } from '../components/common/Icons';
import { UserBrief } from '../types';
import styles from './Notifications.module.css';

interface Notification {
  id:string;
  type:'like'|'comment'|'follow';
  actor:UserBrief;
  text:string;
  post_id?:number;
  post_image_url?:string;
  created_at:string;
}

export default function Notifications() {
  const [items,setItems]=useState<Notification[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{api.get<Notification[]>('/notifications').then(r=>setItems(r.data)).finally(()=>setLoading(false))},[]);
  return <section className={styles.page}>
    <header><h1>알림</h1></header>
    {loading?<div className={styles.loading}>알림을 불러오는 중...</div>:items.length===0?<div className={styles.empty}><div><HeartIcon/></div><h2>활동 알림</h2><p>회원님의 게시물과 계정에 새로운 활동이 생기면 여기에 표시됩니다.</p></div>:<div className={styles.list}><h2>최근 활동</h2>{items.map(item=><Link key={item.id} to={item.post_id?`/p/${item.post_id}`:`/${item.actor.username}`} className={styles.item}><UserAvatar username={item.actor.username} avatarUrl={item.actor.avatar_url} size={46}/><p><strong>{item.actor.username}</strong> {item.text} <time>{timeAgo(item.created_at)}</time></p>{item.post_image_url?<img className={styles.thumb} src={mediaUrl(item.post_image_url)} alt="관련 게시물"/>:<span className={styles.profileLink}>프로필 보기</span>}</Link>)}</div>}
  </section>;
}

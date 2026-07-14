import { FormEvent, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import api, { timeAgo } from '../api/client';
import UserAvatar from '../components/User/UserAvatar';
import { SendIcon } from '../components/common/Icons';
import { useAuth } from '../context/AuthContext';
import { UserBrief } from '../types';
import styles from './Messages.module.css';
import avatarStyles from './MessageAvatar.module.css';

interface Message { id:number; sender:UserBrief; recipient:UserBrief; content:string; created_at:string }
interface Conversation { user:UserBrief; last_message:string; updated_at:string }

export default function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedUsername = searchParams.get('to');
  const [contacts,setContacts]=useState<UserBrief[]>([]);
  const [conversations,setConversations]=useState<Conversation[]>([]);
  const [selected,setSelected]=useState<UserBrief|null>(null);
  const [messages,setMessages]=useState<Message[]>([]);
  const [text,setText]=useState('');
  const [query,setQuery]=useState('');
  const [sending,setSending]=useState(false);
  const bottomRef=useRef<HTMLDivElement>(null);

  const loadSidebar=async()=>{const [c,u]=await Promise.all([api.get<Conversation[]>('/messages/conversations'),api.get<UserBrief[]>('/messages/contacts')]);setConversations(c.data);setContacts(u.data);const requested=requestedUsername?[...c.data.map(item=>item.user),...u.data].find(contact=>contact.username===requestedUsername):null;setSelected(s=>requested||s||c.data[0]?.user||u.data[0]||null)};
  useEffect(()=>{loadSidebar()},[requestedUsername]);
  useEffect(()=>{if(!selected)return;let active=true;const load=()=>api.get<Message[]>(`/messages/${selected.username}`).then(r=>active&&setMessages(r.data));load();const timer=setInterval(load,3000);return()=>{active=false;clearInterval(timer)}},[selected?.username]);
  useEffect(()=>bottomRef.current?.scrollIntoView({behavior:'smooth'}),[messages]);
  const send=async(e:FormEvent)=>{e.preventDefault();if(!selected||!text.trim()||sending)return;setSending(true);try{const {data}=await api.post<Message>(`/messages/${selected.username}`,{content:text.trim()});setMessages(m=>[...m,data]);setText('');loadSidebar()}finally{setSending(false)}};
  const visible=contacts.filter(c=>(c.username+' '+(c.full_name||'')).toLowerCase().includes(query.toLowerCase()));

  return <section className={styles.page}>
    <aside className={`${styles.sidebar} ${selected?styles.hasSelection:''}`}>
      <header><strong>{user?.username}</strong><span>새 메시지</span></header>
      <input className={styles.search} placeholder="검색" value={query} onChange={e=>setQuery(e.target.value)}/>
      <h2>{query?'검색 결과':'메시지'}</h2>
      {(query?visible:conversations.length?conversations.map(c=>c.user):contacts).map(contact=>{const conversation=conversations.find(c=>c.user.id===contact.id);return <button key={contact.id} className={`${styles.contact} ${selected?.id===contact.id?styles.selected:''}`} onClick={()=>setSelected(contact)}><UserAvatar username={contact.username} avatarUrl={contact.avatar_url} size={54}/><span><strong>{contact.username}</strong><small>{conversation?.last_message||contact.full_name||'대화 시작하기'}</small></span>{conversation&&<time>{timeAgo(conversation.updated_at)}</time>}</button>})}
    </aside>
    <div className={`${styles.chat} ${selected?styles.open:''}`}>
      {selected?<><header className={styles.chatHeader}><button onClick={()=>setSelected(null)}>‹</button><Link to={`/${selected.username}`} className={avatarStyles.headerProfile}><UserAvatar username={selected.username} avatarUrl={selected.avatar_url} size={36}/><strong>{selected.username}</strong></Link></header><div className={styles.thread}><div className={styles.intro}><Link to={`/${selected.username}`}><UserAvatar username={selected.username} avatarUrl={selected.avatar_url} size={86}/></Link><h2>{selected.full_name||selected.username}</h2><p>{selected.username} · Instagram</p></div>{messages.map(m=>{const isMine=m.sender.id===user?.id;return <div key={m.id} className={`${styles.bubbleRow} ${isMine?styles.mine:''} ${!isMine?avatarStyles.receivedRow:''}`}>{!isMine&&<Link to={`/${selected.username}`} className={avatarStyles.messageAvatar} aria-label={`${selected.username} 프로필 보기`}><UserAvatar username={selected.username} avatarUrl={selected.avatar_url} size={28}/></Link>}<div className={styles.bubble}>{m.content}</div></div>})}<div ref={bottomRef}/></div><form className={styles.composer} onSubmit={send}><input value={text} onChange={e=>setText(e.target.value)} placeholder="메시지 입력..." maxLength={2000}/><button disabled={!text.trim()||sending} aria-label="보내기"><SendIcon/></button></form></>:<div className={styles.blank}><div><SendIcon/></div><h2>내 메시지</h2><p>친구에게 비공개 메시지를 보내보세요.</p></div>}
    </div>
  </section>;
}

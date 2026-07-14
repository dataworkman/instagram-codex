import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import api from '../api/client';
import UserAvatar from '../components/User/UserAvatar';
import { useAuth } from '../context/AuthContext';
import styles from './Settings.module.css';
import toastStyles from './SettingsToast.module.css';

type Toast = { message: string; type: 'success' | 'error' };

export default function Settings() {
  const {user,refreshUser,logout}=useAuth();
  const navigate=useNavigate();
  const fileRef=useRef<HTMLInputElement>(null);
  const toastTimerRef=useRef<number|undefined>(undefined);
  const [profile,setProfile]=useState({full_name:'',bio:''});
  const [password,setPassword]=useState({current_password:'',new_password:'',confirm:''});
  const [toast,setToast]=useState<Toast|null>(null);
  const [profileSaving,setProfileSaving]=useState(false);
  const [passwordSaving,setPasswordSaving]=useState(false);
  useEffect(()=>{if(user)setProfile({full_name:user.full_name||'',bio:user.bio||''})},[user]);
  useEffect(()=>()=>window.clearTimeout(toastTimerRef.current),[]);
  const showToast=(message:string,type:Toast['type'])=>{window.clearTimeout(toastTimerRef.current);setToast({message,type});toastTimerRef.current=window.setTimeout(()=>setToast(null),3500)};
  const saveProfile=async(e:FormEvent)=>{e.preventDefault();if(profileSaving)return;setProfileSaving(true);try{await api.put('/users/me',profile);await refreshUser();showToast('프로필이 성공적으로 저장되었습니다.','success')}catch{showToast('프로필 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.','error')}finally{setProfileSaving(false)}};
  const uploadAvatar=async(e:ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;const form=new FormData();form.append('file',file);try{await api.post('/users/me/avatar',form);await refreshUser();showToast('프로필 사진이 변경되었습니다.','success')}catch{showToast('사진 업로드에 실패했습니다.','error')}finally{e.target.value=''}};
  const changePassword=async(e:FormEvent)=>{e.preventDefault();if(passwordSaving)return;if(password.new_password!==password.confirm){showToast('새 비밀번호가 일치하지 않습니다.','error');return}setPasswordSaving(true);try{await api.put('/auth/password',{current_password:password.current_password,new_password:password.new_password});setPassword({current_password:'',new_password:'',confirm:''});showToast('비밀번호가 성공적으로 변경되었습니다.','success')}catch(err:unknown){const detail=(err as {response?:{data?:{detail?:string}}}).response?.data?.detail;showToast(detail==='Current password is incorrect'?'현재 비밀번호가 올바르지 않습니다.':'비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.','error')}finally{setPasswordSaving(false)}};
  const signOut=()=>{logout();navigate('/login')};
  return <section className={styles.page}>
    <aside><h1>설정</h1><a href="#profile" className={styles.current}>프로필 편집</a><a href="#security">비밀번호 및 보안</a><a href="#account">로그인 관리</a><Link to="/help">도움말</Link><Link to="/about">서비스 정보</Link></aside>
    <main>
      <section id="profile" className={styles.section}><h2>프로필 편집</h2><div className={styles.avatarRow}><UserAvatar username={user?.username||''} avatarUrl={user?.avatar_url} size={58}/><div><strong>{user?.username}</strong><button onClick={()=>fileRef.current?.click()}>사진 변경</button><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={uploadAvatar}/></div></div><form onSubmit={saveProfile}><label>이름<input value={profile.full_name} onChange={e=>setProfile({...profile,full_name:e.target.value})} maxLength={100}/></label><label>소개<textarea value={profile.bio} onChange={e=>setProfile({...profile,bio:e.target.value})} maxLength={500} rows={4}/><small>{profile.bio.length} / 500</small></label><div className={styles.formEnd}><span/><button type="submit" disabled={profileSaving}>{profileSaving?'저장 중...':'제출'}</button></div></form></section>
      <section id="security" className={styles.section}><h2>비밀번호 변경</h2><form onSubmit={changePassword}><label>현재 비밀번호<input type="password" value={password.current_password} onChange={e=>setPassword({...password,current_password:e.target.value})} required minLength={6}/></label><label>새 비밀번호<input type="password" value={password.new_password} onChange={e=>setPassword({...password,new_password:e.target.value})} required minLength={6}/></label><label>새 비밀번호 확인<input type="password" value={password.confirm} onChange={e=>setPassword({...password,confirm:e.target.value})} required minLength={6}/></label><div className={styles.formEnd}><span/><button type="submit" disabled={passwordSaving}>{passwordSaving?'변경 중...':'비밀번호 변경'}</button></div></form></section>
      <section id="account" className={styles.section}><h2>로그인 관리</h2><div className={styles.logoutRow}><div><strong>현재 계정에서 로그아웃</strong><p>다시 이용하려면 사용자 이름과 비밀번호가 필요합니다.</p></div><button onClick={signOut}>로그아웃</button></div></section>
    </main>
    {toast&&<div className={`${toastStyles.toast} ${toast.type==='success'?toastStyles.success:toastStyles.error}`} role={toast.type==='error'?'alert':'status'} aria-live="polite"><span className={toastStyles.icon}>{toast.type==='success'?'✓':'!'}</span><span>{toast.message}</span><button onClick={()=>setToast(null)} aria-label="알림 닫기">×</button></div>}
  </section>;
}

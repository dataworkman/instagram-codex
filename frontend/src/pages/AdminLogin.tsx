import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import adminApi from '../api/adminClient';
import styles from './Admin.module.css';

export default function AdminLogin() {
  const navigate=useNavigate(); const [username,setUsername]=useState('admin'); const [password,setPassword]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  if(localStorage.getItem('admin_token')) return <Navigate to="/admin" replace/>;
  const submit=async(e:FormEvent)=>{e.preventDefault();setLoading(true);setError('');try{const {data}=await adminApi.post('/login',{username,password});localStorage.setItem('admin_token',data.access_token);navigate('/admin')}catch{setError('관리자 아이디 또는 비밀번호가 올바르지 않습니다.')}finally{setLoading(false)}};
  return <main className={styles.loginPage}><form className={styles.loginCard} onSubmit={submit}><div className={styles.adminMark}>A</div><h1>관리자 로그인</h1><p>Instagram Clone Administration</p><label>관리자 아이디<input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" required/></label><label>비밀번호<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></label>{error&&<div className={styles.error}>{error}</div>}<button disabled={loading}>{loading?'로그인 중...':'로그인'}</button><a href="/">← 서비스로 돌아가기</a></form></main>;
}

import { FormEvent, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

export default function Register() {
  const { user, register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof msg === 'string' ? msg : '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div>
        <div className={styles.authBox}>
          <h1 className={styles.logo}>Instagram</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 17, marginBottom: 16 }}>
            친구들의 사진과 동영상을 보려면 가입하세요.
          </p>
          <form className={styles.form} onSubmit={handleSubmit}>
            <input className="input" placeholder="이메일" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input className="input" placeholder="성명" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <input className="input" placeholder="사용자 이름" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            <input className="input" type="password" placeholder="비밀번호" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? '가입 중...' : '가입'}
            </button>
          </form>
        </div>
        <div className={styles.signupBox}>
          계정이 있으신가요? <Link to="/login">로그인</Link>
        </div>
      </div>
    </div>
  );
}

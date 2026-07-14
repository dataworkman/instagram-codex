import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const destination = (location.state as { from?: string } | null)?.from || '/';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={destination} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password);
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        if (requestError.response?.status === 401) {
          setError('아이디 또는 비밀번호가 올바르지 않습니다. 다시 확인해 주세요.');
        } else if (!requestError.response) {
          setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
        } else {
          const detail = requestError.response.data?.detail;
          setError(typeof detail === 'string' ? detail : '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        }
      } else {
        setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div>
        <div className={styles.authBox}>
          <h1 className={styles.logo}>Instagram</h1>
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              className="input"
              placeholder="사용자 이름"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError('');
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'login-error' : undefined}
              autoComplete="username"
              required
            />
            <input
              className="input"
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'login-error' : undefined}
              autoComplete="current-password"
              required
            />
            {error && (
              <div id="login-error" className={styles.errorAlert} role="alert" aria-live="assertive">
                {error}
              </div>
            )}
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
          <div className={styles.demo}>
            데모 계정: alice / password123
          </div>
        </div>
        <div className={styles.signupBox}>
          계정이 없으신가요? <Link to="/register">가입하기</Link>
        </div>
      </div>
    </div>
  );
}

import { FormEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import styles from './CreatePost.module.css';

export default function CreatePost() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('이미지를 선택해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('image', file);
      form.append('caption', caption);
      await api.post('/posts', form);
      navigate('/');
    } catch {
      setError('게시물 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>새 게시물</h1>
      <form onSubmit={handleSubmit}>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {preview ? (
          <img src={preview} alt="미리보기" className={styles.preview} onClick={() => fileRef.current?.click()} />
        ) : (
          <div className={styles.uploadArea} onClick={() => fileRef.current?.click()}>
            📷 사진 선택하기
          </div>
        )}
        <textarea
          className={styles.caption}
          placeholder="문구 입력..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={2200}
        />
        {error && <p className="error-text">{error}</p>}
        <div className={styles.actions}>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn btn-primary" disabled={loading || !file}>
            {loading ? '공유 중...' : '공유'}
          </button>
        </div>
      </form>
    </div>
  );
}

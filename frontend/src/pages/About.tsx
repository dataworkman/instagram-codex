import { Link } from 'react-router-dom';
import styles from './InfoPages.module.css';

const features = [
  { icon: '▣', title: '피드와 게시물', text: '사진을 공유하고 좋아요와 댓글로 소통할 수 있습니다.' },
  { icon: '◎', title: '프로필과 팔로우', text: '프로필을 꾸미고 관심 있는 사용자를 팔로우할 수 있습니다.' },
  { icon: '↗', title: '실시간 메시지', text: '사용자 프로필에서 바로 비공개 대화를 시작할 수 있습니다.' },
  { icon: '♡', title: '활동 알림', text: '좋아요, 댓글, 팔로우 등 계정 활동을 한곳에서 확인합니다.' },
];

export default function About() {
  return <div className={styles.page}>
    <header className={`${styles.hero} ${styles.aboutHero}`}><span>서비스 정보</span><h1>순간을 공유하고<br/>사람들과 연결하세요.</h1><p>이 프로젝트는 React와 FastAPI로 제작된 Instagram 스타일의 소셜 네트워크 애플리케이션입니다.</p><div className={styles.heroActions}><Link to="/">피드 둘러보기</Link><Link to="/help">도움말 보기</Link></div></header>
    <main className={styles.content}>
      <section><div className={styles.sectionTitle}><div><span>FEATURES</span><h2>구현된 주요 기능</h2></div></div><div className={styles.featureGrid}>{features.map(feature=><article key={feature.title}><i>{feature.icon}</i><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div></section>
      <section className={styles.tech}><div><span>PROJECT</span><h2>프로젝트 구성</h2><p>반응형 React 인터페이스와 FastAPI 서버가 REST API로 연결되며, 사용자·게시물·메시지 데이터는 SQLite에 저장됩니다.</p></div><dl><div><dt>Frontend</dt><dd>React · TypeScript · Vite</dd></div><div><dt>Backend</dt><dd>FastAPI · SQLAlchemy</dd></div><div><dt>Database</dt><dd>SQLite</dd></div></dl></section>
      <p className={styles.disclaimer}>이 사이트는 학습 및 포트폴리오 목적으로 제작된 독립적인 클론 프로젝트이며 Meta 또는 Instagram의 공식 서비스가 아닙니다.</p>
    </main>
  </div>;
}

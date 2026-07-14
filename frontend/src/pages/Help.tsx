import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './InfoPages.module.css';

const faqs = [
  { category: '계정', question: '회원가입과 로그인은 어떻게 하나요?', answer: '로그인 화면의 가입하기에서 계정을 만들 수 있습니다. 가입 후에는 사용자 이름과 비밀번호로 로그인하세요.' },
  { category: '계정', question: '프로필 정보와 사진을 변경하고 싶어요.', answer: '설정의 프로필 편집에서 이름과 소개를 저장할 수 있습니다. 본인 프로필의 사진 또는 사진 변경 버튼으로 프로필 사진도 바꿀 수 있습니다.' },
  { category: '게시물', question: '새 게시물은 어떻게 작성하나요?', answer: '로그인한 뒤 왼쪽 메뉴의 만들기를 선택하고 이미지와 문구를 입력해 공유하세요. 이미지는 JPG, PNG, WEBP 형식을 지원합니다.' },
  { category: '게시물', question: '좋아요와 댓글이 작동하지 않아요.', answer: '좋아요와 댓글은 로그인이 필요한 기능입니다. 로그아웃 상태에서 선택하면 로그인 화면으로 이동합니다.' },
  { category: '메시지', question: '다른 사용자에게 메시지를 보내려면 어떻게 하나요?', answer: '상대방 프로필의 메시지 버튼을 누르거나 메시지 화면에서 사용자를 검색해 대화를 시작할 수 있습니다.' },
  { category: '개인정보', question: '비밀번호는 어디에서 변경하나요?', answer: '설정의 비밀번호 및 보안에서 현재 비밀번호와 새 비밀번호를 입력하세요. 결과는 토스트 알림으로 안내됩니다.' },
  { category: '검색', question: '사용자를 찾고 싶어요.', answer: '검색 화면에서 사용자 이름이나 이름을 입력하세요. 검색 전에도 최신 가입순 또는 사용자 이름순으로 계정을 둘러볼 수 있습니다.' },
];

export default function Help() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return keyword ? faqs.filter(item => `${item.category} ${item.question} ${item.answer}`.toLowerCase().includes(keyword)) : faqs;
  }, [query]);

  return <div className={styles.page}>
    <header className={styles.hero}><span>도움말 센터</span><h1>무엇을 도와드릴까요?</h1><p>계정과 Instagram 클론 기능 사용법을 빠르게 찾아보세요.</p><label className={styles.helpSearch}><span aria-hidden="true">⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="도움말 검색" aria-label="도움말 검색"/>{query&&<button onClick={()=>setQuery('')} aria-label="검색어 지우기">×</button>}</label></header>
    <main className={styles.content}>
      <section><div className={styles.sectionTitle}><div><span>FAQ</span><h2>자주 묻는 질문</h2></div><small>{filtered.length}개 항목</small></div>
        <div className={styles.faqList}>{filtered.map(item=><details key={item.question}><summary><span>{item.category}</span>{item.question}</summary><p>{item.answer}</p></details>)}</div>
        {!filtered.length&&<div className={styles.noResults}><strong>검색 결과가 없습니다.</strong><p>다른 검색어를 입력하거나 아래 설정 페이지를 확인해 주세요.</p></div>}
      </section>
      <section className={styles.quickLinks}><h2>빠른 도움말</h2><div><Link to="/settings"><strong>계정 설정</strong><span>프로필과 비밀번호 관리 →</span></Link><Link to="/search"><strong>사용자 검색</strong><span>새로운 계정 찾기 →</span></Link><Link to="/about"><strong>서비스 정보</strong><span>프로젝트 자세히 보기 →</span></Link></div></section>
    </main>
  </div>;
}

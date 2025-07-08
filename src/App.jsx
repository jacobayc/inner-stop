// src/App.jsx
import React, { useState, useEffect, useMemo } from 'react';
import './index.css'; // 기본 스타일 임포트

function App() {
  // --- 상태 관리 ---
  const [worries, setWorries] = useState(() => {
    const savedWorries = localStorage.getItem('worries');
    return savedWorries ? JSON.parse(savedWorries) : [];
  });
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  // 걱정 항목 확장 상태 (확장된 worry.id들을 저장)
  const [expandedWorries, setExpandedWorries] = useState(new Set());

  // 액션 버튼 노출 상태
  const [showItemActions, setShowItemActions] = useState(new Set());

  // 새 걱정 기록/수정 폼 상태
  const [currentWorryId, setCurrentWorryId] = useState(null); // 수정 중인 걱정의 ID
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [emotion, setEmotion] = useState('기쁨');
  const [strength, setStrength] = useState(3);
  // 👈 추가: 직접 입력 감정을 위한 상태
  const [customEmotion, setCustomEmotion] = useState(''); 

  // 각 섹션의 노출 여부 토글 상태
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [showFilterSearch, setShowFilterSearch] = useState(false);
  const [showDataIO, setShowDataIO] = useState(false);

  // 필터링/검색 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterEmotion, setFilterEmotion] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // --- 상수 정의 ---
  // 👈 변경: '기타 (직접 입력)' 옵션 추가
  const emotions = ['기쁨', '불안', '만족', '슬픔', '우울', '행복', '분노', '초조', '무기력', '기타 (직접 입력)'];

  // --- useEffect 훅 ---
  // worries 데이터가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem('worries', JSON.stringify(worries));
  }, [worries]);

  // 다크 모드 상태 변경 시 body 클래스 업데이트 및 로컬 스토리지 저장
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // 개별 걱정 항목의 액션 버튼 영역 토글
  const toggleItemActions = (id) => {
    setShowItemActions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id); // 이미 열려 있으면 닫기
      } else {
        newSet.add(id); // 닫혀 있으면 열기
      }
      return newSet;
    });
  };

  // --- 걱정 기록/수정 함수 ---
  const handleAddOrUpdateWorry = (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    // 👈 추가: '기타 (직접 입력)' 선택 시 customEmotion 유효성 검사
    if (emotion === '기타 (직접 입력)' && !customEmotion.trim()) {
      alert('직접 입력할 감정을 입력해주세요.');
      return;
    }

    const newWorry = {
      id: currentWorryId || Date.now(),
      title,
      content,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      // 👈 변경: 감정 선택이 '기타 (직접 입력)'일 경우 customEmotion 사용
      emotion: emotion === '기타 (직접 입력)' ? customEmotion.trim() : emotion,
      strength: parseInt(strength),
      date: currentWorryId ? worries.find(w => w.id === currentWorryId).date : new Date().toISOString(),
      feedback: currentWorryId ? worries.find(w => w.id === currentWorryId).feedback || '' : '',
    };

    if (currentWorryId) {
      // 수정 모드
      setWorries(worries.map(w => (w.id === currentWorryId ? newWorry : w)));
      setCurrentWorryId(null);
    } else {
      // 추가 모드
      setWorries([newWorry, ...worries]);
    }

    // 폼 초기화 및 모든 걱정 항목 접기
    setTitle('');
    setContent('');
    setTags('');
    setEmotion('기쁨');
    setStrength(3);
    setCustomEmotion(''); // 👈 추가: customEmotion 초기화
    setExpandedWorries(new Set());
    setShowWriteForm(false);
  };

  // --- 걱정 수정 시작 함수 ---
  const handleEditWorry = (id) => {
    const worryToEdit = worries.find(w => w.id === id);
    if (worryToEdit) {
      setCurrentWorryId(worryToEdit.id);
      setTitle(worryToEdit.title);
      setContent(worryToEdit.content);
      setTags(worryToEdit.tags.join(', '));
      setStrength(worryToEdit.strength);
      
      // 👈 변경: 저장된 감정이 미리 정의된 목록에 있는지 확인
      if (emotions.includes(worryToEdit.emotion)) {
        setEmotion(worryToEdit.emotion);
        setCustomEmotion(''); // 기존 감정이라면 customEmotion 초기화
      } else {
        setEmotion('기타 (직접 입력)'); // 목록에 없으면 '기타'로 설정
        setCustomEmotion(worryToEdit.emotion); // 실제 감정을 customEmotion에 저장
      }

      setShowWriteForm(true);
      setShowFilterSearch(false);
      setShowDataIO(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- 걱정 삭제 함수 ---
  const handleDeleteWorry = (id) => {
    if (window.confirm('정말 이 걱정을 삭제하시겠습니까?')) {
      setWorries(worries.filter(worry => worry.id !== id));
      setExpandedWorries(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      if (currentWorryId === id) {
        setCurrentWorryId(null);
        setTitle('');
        setContent('');
        setTags('');
        setEmotion('기쁨');
        setStrength(3);
        setCustomEmotion(''); // 👈 추가: customEmotion 초기화
        setShowWriteForm(false);
      }
    }
  };

  // --- 걱정 항목 확장/축소 토글 함수 ---
  const handleToggleExpand = (id) => {
    setExpandedWorries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // --- 필터링된 걱정 목록 계산 (useMemo 사용으로 성능 최적화) ---
  const filteredWorries = useMemo(() => {
    return worries.filter(worry => {
      // 1. 키워드 검색 필터링
      const matchesKeyword = searchKeyword.trim() === '' ||
                             worry.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                             worry.content.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                             worry.tags.some(tag => tag.toLowerCase().includes(searchKeyword.toLowerCase()));

      // 2. 감정 필터링
      // 👈 변경: 필터링 감정이 '기타 (직접 입력)'이거나 비어있지 않다면, 실제 worry.emotion 값과 비교
      const matchesEmotion = filterEmotion === '' || worry.emotion === filterEmotion || 
                             (filterEmotion === '기타 (직접 입력)' && !emotions.includes(worry.emotion)); // '기타' 필터 시 emotions 목록에 없는 감정 모두 포함

      // 3. 날짜 범위 필터링
      const worryDate = new Date(worry.date);
      const matchesStartDate = !filterStartDate || worryDate >= new Date(filterStartDate);
      const matchesEndDate = !filterEndDate || worryDate <= new Date(filterEndDate + 'T23:59:59'); // 하루의 끝까지 포함

      return matchesKeyword && matchesEmotion && matchesStartDate && matchesEndDate;
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // 최신 날짜순 정렬
  }, [worries, searchKeyword, filterEmotion, filterStartDate, filterEndDate, emotions]); // 👈 변경: emotions 의존성 추가

  // --- 데이터 내보내기/가져오기 함수 ---
  const handleExportData = () => {
    const dataStr = JSON.stringify(worries, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worry_diary_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('걱정 데이터가 JSON 파일로 다운로드됩니다!');
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData)) {
          const existingIds = new Set(worries.map(w => w.id));
          const newWorriesToAdd = importedData.filter(w => !existingIds.has(w.id));
          setWorries(prevWorries => [...prevWorries, ...newWorriesToAdd]);
          alert(`새로운 걱정 데이터 ${newWorriesToAdd.length}개가 성공적으로 가져와졌습니다!`);
        } else {
          alert('유효하지 않은 JSON 파일 형식입니다. 배열 형태의 데이터를 기대합니다.');
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('파일을 읽는 도중 오류가 발생했습니다. 올바른 JSON 파일인지 확인해주세요.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setFilterEmotion('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  // 각 영역 토글 함수
  const toggleWriteForm = () => {
    setShowWriteForm(prev => !prev);
    setShowFilterSearch(false);
    setShowDataIO(false);
    if (showWriteForm) {
      setCurrentWorryId(null);
      setTitle('');
      setContent('');
      setTags('');
      setEmotion('기쁨');
      setStrength(3);
      setCustomEmotion(''); // 👈 추가: customEmotion 초기화
    }
  };

  const toggleFilterSearch = () => {
    setShowFilterSearch(prev => !prev);
    setShowWriteForm(false);
    setShowDataIO(false);
  };

  const toggleDataIO = () => {
    setShowDataIO(prev => !prev);
    setShowWriteForm(false);
    setShowFilterSearch(false);
  };

  return (
    <div className="App">
      <div className="header-container">
        <h1 className="main-logo">작은 마음의 방</h1>
        <div className="title-and-darkmode">
          <h2 className="title">오늘의 감정을 살며시 마주해보세요</h2>
          <button className="dark-mode-button" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
        <div className="action-buttons-group">
          <button onClick={toggleWriteForm}>
            {showWriteForm ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            )}
          </button>
          <button onClick={toggleFilterSearch}>
            {showFilterSearch ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            )}
          </button>
          <button onClick={toggleDataIO}>
            {showDataIO ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <polyline points="9 15 12 12 15 15"></polyline>
              </svg>
            )}
          </button>
        </div>
      </div>

      {showWriteForm && (
        <form onSubmit={handleAddOrUpdateWorry}>
          <h2>{currentWorryId ? '마음 수정하기' : '새 마음 기록하기'}</h2>
          <div className="form-group">
            <label htmlFor="title">마음 제목</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="마음의 핵심 내용을 입력하세요"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="content">내용</label>
            <textarea
              id="content"
              rows="5"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="마음에 대한 자세한 내용을 기록하세요"
              required
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="tags">태그 (쉼표로 구분)</label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="예: 직장, 인간관계, 건강"
            />
          </div>
          {/* 👈 변경: 감정 선택 및 직접 입력 필드 */}
          <div className="form-group">
            <label htmlFor="emotion">현재 감정</label>
            <select
              id="emotion"
              value={emotion}
              onChange={(e) => {
                setEmotion(e.target.value);
                if (e.target.value !== '기타 (직접 입력)') {
                  setCustomEmotion(''); // '기타'가 아니면 customEmotion 초기화
                }
              }}
            >
              {emotions.map((emo) => (
                <option key={emo} value={emo}>{emo}</option>
              ))}
            </select>
            {emotion === '기타 (직접 입력)' && (
              <input
                type="text"
                placeholder="감정을 직접 입력하세요"
                value={customEmotion}
                onChange={(e) => setCustomEmotion(e.target.value)}
                required // '기타' 선택 시 필수 입력
              />
            )}
          </div>
          {/* 👈 변경 끝 */}
          <div className="form-group">
            <label htmlFor="strength">마음 강도 (1-5)</label>
            <input
              type="range"
              id="strength"
              min="1"
              max="5"
              value={strength}
              onChange={(e) => setStrength(e.target.value)}
            />
            <span> {strength}</span>
          </div>
          <button type="submit">
            {currentWorryId ? '마음 수정 완료' : '마음 기록하기'}
          </button>
          {currentWorryId && (
            <button type="button" className="secondary" onClick={() => {
              setCurrentWorryId(null);
              setTitle('');
              setContent('');
              setTags('');
              setEmotion('기쁨');
              setStrength(3);
              setCustomEmotion(''); // 👈 추가: customEmotion 초기화
              setShowWriteForm(false);
            }}>
              수정 취소
            </button>
          )}
        </form>
      )}

      {showFilterSearch && (
        <>
          <hr />
          <div className="filter-search-section">
            <h2>마음 필터링 및 검색</h2>
            <div className="form-group">
              <label htmlFor="searchKeyword">키워드 검색</label>
              <input
                type="text"
                id="searchKeyword"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="제목, 내용, 태그 검색"
              />
            </div>
            {/* 👈 변경: 필터링 감정 드롭다운에도 '기타 (직접 입력)' 추가 */}
            <div className="form-group">
              <label htmlFor="filterEmotion">감정 필터링</label>
              <select
                id="filterEmotion"
                value={filterEmotion}
                onChange={(e) => setFilterEmotion(e.target.value)}
              >
                <option value="">모든 감정</option>
                {emotions.map((emo) => (
                  <option key={emo} value={emo}>{emo}</option>
                ))}
              </select>
            </div>
            {/* 👈 변경 끝 */}
            <div className="form-group">
              <label htmlFor="filterStartDate">시작 날짜</label>
              <input
                type="date"
                id="filterStartDate"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="filterEndDate">종료 날짜</label>
              <input
                type="date"
                id="filterEndDate"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>
            <div className="filter-buttons">
              <button className="secondary" onClick={handleClearFilters}>필터 초기화</button>
            </div>
          </div>
        </>
      )}

      {showDataIO && (
        <>
          <hr />
          <div className="data-io-section">
            <h2>데이터 내보내기/가져오기</h2>
            <p>마음 데이터를 JSON 파일로 내보내거나, 기존 JSON 파일에서 데이터를 가져올 수 있습니다.</p>
            <button onClick={handleExportData}>데이터 내보내기 (.json)</button>
            <div className="form-group" style={{marginTop: '15px'}}>
              <label htmlFor="importFile" style={{width: 'auto', marginRight: '10px'}}>데이터 가져오기 (.json)</label>
              <input
                type="file"
                id="importFile"
                accept=".json"
                onChange={handleImportData}
                style={{flexGrow: 'unset', width: 'auto'}}
              />
            </div>
          </div>
        </>
      )}

      <hr />

      <div className="worry-list">
        <h2 className="worry-title">마음의 기록 ({filteredWorries.length})</h2>
        {filteredWorries.length === 0 ? (
          <p>필터 조건에 맞는 마음이 없거나, 아직 기록된 마음이 없습니다.</p>
        ) : (
          filteredWorries.map((worry) => (
            <div key={worry.id} className="worry-item">
              {expandedWorries.has(worry.id) && (
                <button
                  className="worry-item-action-toggle"
                  onClick={() => toggleItemActions(worry.id)}
                >
                  {showItemActions.has(worry.id) ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="12" cy="5" r="1"></circle>
                      <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                  )}
                </button>
              )}

              <h3 onClick={() => handleToggleExpand(worry.id)} style={{ cursor: 'pointer' }}>
                {worry.title}
              </h3>

              {expandedWorries.has(worry.id) && (
                <>
                  <p>{worry.content}</p>
                  <p>
                    <small>
                      {new Date(worry.date).toLocaleString()} | <span className="emotion-tag">{worry.emotion}</span> | <span className="strength-tag">{worry.strength}</span>
                    </small>
                  </p>
                  {worry.tags.length > 0 && (
                    <div className="tags">
                      {worry.tags.map((tag, index) => (
                        <span key={index}>{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="worry-feedback-section">
                    <h4>결과 기록 </h4>
                    <textarea
                      className="feedback-textarea"
                      rows="2"
                      placeholder="결과를 한줄로 기록해보세요 (예: 잘 해결되었습니다!)"
                      value={worry.feedback || ''}
                      onChange={(e) => {
                        setWorries(prevWorries =>
                          prevWorries.map(w =>
                            w.id === worry.id ? { ...w, feedback: e.target.value } : w
                          )
                        );
                      }}
                      onFocus={() => toggleItemActions(worry.id)}
                    ></textarea>
                  </div>
                </>
              )}

              {expandedWorries.has(worry.id) && showItemActions.has(worry.id) && (
                <div className="worry-actions">
                  <button onClick={() => handleEditWorry(worry.id)}>수정</button>
                  <button className="danger" onClick={() => handleDeleteWorry(worry.id)}>삭제</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const analyzeBtn = document.getElementById('analyzeBtn');
const errorBox = document.getElementById('errorBox');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultSection = document.getElementById('resultSection');
const copyBtn = document.getElementById('copyBtn');

const quizContainer = document.getElementById('quizContainer');
const discussionContainer = document.getElementById('discussionContainer');
const answerContainer = document.getElementById('answerContainer');

let selectedFile = null;

// 파일 선택 처리
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('bg-white/80');
});
dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('bg-white/80');
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('bg-white/80');
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
});

function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
    setTimeout(() => { errorBox.classList.add('hidden'); }, 5000);
}

function handleFile(file) {
    if (file.type !== 'application/pdf') {
        showError('PDF 파일만 업로드할 수 있습니다.');
        return;
    }
    if (file.size > 4 * 1024 * 1024) {
        showError('4MB 이하의 PDF만 업로드할 수 있습니다.');
        return;
    }
    
    selectedFile = file;
    fileNameDisplay.querySelector('span:last-child').textContent = file.name;
    fileNameDisplay.classList.remove('hidden');
    analyzeBtn.disabled = false;
    errorBox.classList.add('hidden');
}

// 분석 요청
analyzeBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    analyzeBtn.disabled = true;
    loadingIndicator.classList.remove('hidden');
    resultSection.classList.add('hidden');
    errorBox.classList.add('hidden');
    
    try {
        const headers = { 'Content-Type': 'application/octet-stream' };
        
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: headers,
            body: selectedFile
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `요청에 실패했습니다. (${response.status})`);
        }

        displayResults(data);
        
    } catch (error) {
        showError(error.message);
    } finally {
        analyzeBtn.disabled = false;
        loadingIndicator.classList.add('hidden');
    }
});

function displayResults(data) {
    // 보안을 위해 textContent 사용 (innerHTML 금지)
    
    // 퀴즈 렌더링
    quizContainer.replaceChildren();
    if(data.card1_multiple_choice) {
        data.card1_multiple_choice.forEach(item => {
           const p = document.createElement('p');
           p.textContent = item;
           p.className = 'bg-white/50 p-4 rounded-xl border border-indigo-50';
           quizContainer.appendChild(p);
        });
    }

    // 토론 렌더링
    discussionContainer.replaceChildren();
    if(data.card2_discussion) {
         data.card2_discussion.forEach(item => {
           const p = document.createElement('p');
           p.textContent = item;
           p.className = 'bg-white/50 p-3 rounded-xl border border-purple-50';
           discussionContainer.appendChild(p);
        });
    }

    // 해설 렌더링
    answerContainer.replaceChildren();
    if(data.card3_answers) {
         data.card3_answers.forEach(item => {
           const p = document.createElement('p');
           p.textContent = item;
           p.className = 'bg-white/50 p-3 rounded-xl border border-pink-50';
           answerContainer.appendChild(p);
        });
    }

    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// 복사 기능
copyBtn.addEventListener('click', async () => {
    const quizText = Array.from(quizContainer.children).map(el => el.textContent).join('\n\n');
    const discText = Array.from(discussionContainer.children).map(el => el.textContent).join('\n\n');
    const ansText = Array.from(answerContainer.children).map(el => el.textContent).join('\n\n');
    
    const fullText = `[실전 객관식 퀴즈 5선]\n${quizText}\n\n[생각 넓히기 토론]\n${discText}\n\n[정답 및 해설]\n${ansText}`;
    
    try {
        await navigator.clipboard.writeText(fullText);
        alert('전체 결과가 클립보드에 복사되었습니다!');
    } catch (err) {
        alert('복사에 실패했습니다. 직접 선택해서 복사해 주세요.');
    }
});

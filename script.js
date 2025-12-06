// 드럼비트 데이터
let beatsData = {};
let currentBeat = null;
let currentMode = 'beat';
let currentDifficulty = 'beginner';
let isPlaying = false;
let isMuteMode = false;
let audioContext = null;
let currentBPM = 120;
let playheadPosition = 0;
let beatInterval = null;
let sixteenthNoteTime = 0;

// 오디오 샘플
let kickSound = null;
let snareSound = null;
let hihatSound = null;
let bassSound = null;
let guitarSound = null;
let metronomeSound = null;

// DOM 요소
const elements = {
    dateDisplay: document.getElementById('date-display'),
    bpmSlider: document.getElementById('bpm-slider'),
    bpmValue: document.getElementById('bpm-value'),
    playPauseBtn: document.getElementById('play-pause-btn'),
    muteBtn: document.getElementById('mute-btn'),
    resetBtn: document.getElementById('reset-btn'),
    kickGrid: document.getElementById('kick-grid'),
    snareGrid: document.getElementById('snare-grid'),
    hihatGrid: document.getElementById('hihat-grid'),
    bassGrid: document.getElementById('bass-grid'),
    guitarGrid: document.getElementById('guitar-grid'),
    playhead: document.getElementById('playhead'),
    beatDescription: document.getElementById('beat-description'),
    shareBeatBtn: document.getElementById('share-beat-btn'),
    randomBeatBtn: document.getElementById('random-beat-btn'),
    randomMelodyBtn: document.getElementById('random-melody-btn'),
    timeSignature: document.getElementById('time-signature'),
    loading: document.getElementById('loading'),
    // 모드 관련
    modeBtns: document.querySelectorAll('.mode-btn'),
    beatMode: document.getElementById('beat-mode'),
    rudimentMode: document.getElementById('rudiment-mode'),
    tempoMode: document.getElementById('tempo-mode'),
    // 난이도 관련
    difficultyBtns: document.querySelectorAll('.difficulty-btn'),
    // 루딤먼트 관련
    rudimentPattern: document.getElementById('rudiment-pattern'),
    rudimentBpm: document.getElementById('rudiment-bpm'),
    rudimentBpmValue: document.getElementById('rudiment-bpm-value'),
    rudimentPlayBtn: document.getElementById('rudiment-play-btn'),
    rudimentResetBtn: document.getElementById('rudiment-reset-btn'),
    handIndicator: document.getElementById('hand-indicator'),
    leftHand: document.getElementById('left-hand'),
    rightHand: document.getElementById('right-hand'),
    rudimentPatternText: document.getElementById('rudiment-pattern-text'),
    // 템포 트레이너 관련
    startBpm: document.getElementById('start-bpm'),
    targetBpm: document.getElementById('target-bpm'),
    practiceTime: document.getElementById('practice-time'),
    bpmIncrement: document.getElementById('bpm-increment'),
    currentBpmDisplay: document.getElementById('current-bpm-display'),
    tempoProgressBar: document.getElementById('tempo-progress-bar'),
    timeRemaining: document.getElementById('time-remaining'),
    tempoStartBtn: document.getElementById('tempo-start-btn'),
    tempoStopBtn: document.getElementById('tempo-stop-btn'),
    tempoResetBtn: document.getElementById('tempo-reset-btn')
};

// 날짜 표시 업데이트
function updateDateDisplay() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[today.getDay()];
    
    elements.dateDisplay.textContent = `${year}.${month}.${date} (${dayName})`;
}

// 오디오 컨텍스트 초기화
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 킥 드럼 사운드 (저주파 + 어택)
        kickSound = () => {
            const now = audioContext.currentTime;
            const osc1 = audioContext.createOscillator();
            const osc2 = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(60, now);
            osc1.frequency.exponentialRampToValueAtTime(30, now + 0.1);
            
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(80, now);
            osc2.frequency.exponentialRampToValueAtTime(40, now + 0.05);
            
            filter.type = 'lowpass';
            filter.frequency.value = 200;
            
            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            gainNode.gain.setValueAtTime(0.8, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            
            osc1.start(now);
            osc1.stop(now + 0.2);
            osc2.start(now);
            osc2.stop(now + 0.15);
        };
        
        // 스네어 드럼 사운드 (노이즈 + 톤)
        snareSound = () => {
            const now = audioContext.currentTime;
            const osc = audioContext.createOscillator();
            const noise = audioContext.createBufferSource();
            const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            const gainNode = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            
            // 노이즈 생성
            for (let i = 0; i < noiseData.length; i++) {
                noiseData[i] = Math.random() * 2 - 1;
            }
            noise.buffer = noiseBuffer;
            
            // 톤
            osc.type = 'triangle';
            osc.frequency.value = 200;
            
            filter.type = 'highpass';
            filter.frequency.value = 1000;
            
            osc.connect(gainNode);
            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            gainNode.gain.setValueAtTime(0.6, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            
            osc.start(now);
            osc.stop(now + 0.1);
            noise.start(now);
            noise.stop(now + 0.1);
        };
        
        // 하이햇 사운드 (고주파 노이즈)
        hihatSound = () => {
            const now = audioContext.currentTime;
            const noise = audioContext.createBufferSource();
            const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.05, audioContext.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            const gainNode = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            
            for (let i = 0; i < noiseData.length; i++) {
                noiseData[i] = Math.random() * 2 - 1;
            }
            noise.buffer = noiseBuffer;
            
            filter.type = 'highpass';
            filter.frequency.value = 7000;
            
            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            gainNode.gain.setValueAtTime(0.4, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            
            noise.start(now);
            noise.stop(now + 0.05);
        };
        
        // 베이스 사운드 (저주파 사인파)
        bassSound = (note = 60) => {
            const now = audioContext.currentTime;
            const osc = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            
            // MIDI note to frequency (C2 = 60)
            const freq = 440 * Math.pow(2, (note - 69) / 12);
            
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            
            filter.type = 'lowpass';
            filter.frequency.value = 500;
            filter.Q.value = 1;
            
            osc.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            gainNode.gain.setValueAtTime(0.5, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            
            osc.start(now);
            osc.stop(now + 0.3);
        };
        
        // 기타 사운드 (코드 또는 단일 노트)
        guitarSound = (notes = [64, 67, 71]) => {
            const now = audioContext.currentTime;
            const gainNode = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            const masterGain = audioContext.createGain();
            
            notes.forEach((note, index) => {
                const osc = audioContext.createOscillator();
                const freq = 440 * Math.pow(2, (note - 69) / 12);
                
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                
                const noteGain = audioContext.createGain();
                osc.connect(noteGain);
                noteGain.connect(filter);
                
                noteGain.gain.setValueAtTime(0.3, now);
                noteGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                
                osc.start(now + index * 0.01);
                osc.stop(now + 0.4);
            });
            
            filter.type = 'lowpass';
            filter.frequency.value = 3000;
            filter.Q.value = 2;
            
            filter.connect(gainNode);
            gainNode.connect(masterGain);
            masterGain.connect(audioContext.destination);
            
            gainNode.gain.setValueAtTime(0.4, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            
            masterGain.gain.value = 0.6;
        };
        
        // 메트로놈 사운드
        metronomeSound = () => {
            const now = audioContext.currentTime;
            const osc = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = 1000;
            
            osc.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            gainNode.gain.setValueAtTime(0.5, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            
            osc.start(now);
            osc.stop(now + 0.05);
        };
    }
}

// 오늘의 비트 선택 (날짜 기반 고정)
function getTodayBeat() {
    if (!beatsData[currentDifficulty] || beatsData[currentDifficulty].length === 0) return null;
    
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const beats = beatsData[currentDifficulty];
    const index = dayOfYear % beats.length;
    
    return beats[index];
}

// 랜덤 비트 선택
function getRandomBeat() {
    if (!beatsData[currentDifficulty] || beatsData[currentDifficulty].length === 0) return null;
    
    const beats = beatsData[currentDifficulty];
    const randomIndex = Math.floor(Math.random() * beats.length);
    
    return beats[randomIndex];
}

// 랜덤 비트 선택 및 표시
function selectRandomBeat() {
    const randomBeat = getRandomBeat();
    if (randomBeat) {
        // 재생 중이면 정지
        if (isPlaying) {
            stopBeat();
        }
        currentBeat = randomBeat;
        applyRandomMelody(randomBeat);
        displayBeat(randomBeat);
        
        // 박자도 자동으로 변경
        elements.timeSignature.value = randomBeat.timeSignature;
    }
}

// 랜덤 베이스 멜로디 생성
function generateRandomBassMelody(beat) {
    if (!beat.bass || beat.bass.length === 0) return {};
    
    // C major scale (C=60, D=62, E=64, F=65, G=67, A=69, B=71)
    const scale = [60, 62, 64, 65, 67, 69, 71];
    const bassNotes = {};
    
    beat.bass.forEach(step => {
        // 루트 노트(60)에 가까운 노트를 더 자주 선택
        const random = Math.random();
        if (random < 0.4) {
            bassNotes[String(step)] = 60; // C (루트)
        } else if (random < 0.6) {
            bassNotes[String(step)] = 67; // G (5도)
        } else if (random < 0.75) {
            bassNotes[String(step)] = 65; // F (4도)
        } else {
            // 랜덤 스케일 노트
            bassNotes[String(step)] = scale[Math.floor(Math.random() * scale.length)];
        }
    });
    
    return bassNotes;
}

// 랜덤 기타 코드 생성
function generateRandomGuitarChords(beat) {
    if (!beat.guitar || beat.guitar.length === 0) return {};
    
    // 기본 코드들 (C major scale 기반)
    const chords = {
        'C': [64, 67, 71],      // C major (E, G, B)
        'Dm': [62, 65, 69],     // D minor (D, F, A)
        'Em': [64, 67, 70],     // E minor (E, G, Bb)
        'F': [65, 69, 72],      // F major (F, A, C)
        'G': [67, 71, 74],      // G major (G, B, D)
        'Am': [69, 72, 76],     // A minor (A, C, E)
        'Bdim': [71, 74, 77]    // B diminished (B, D, F)
    };
    
    const chordNames = Object.keys(chords);
    const guitarChords = {};
    let lastChord = 'C';
    
    beat.guitar.forEach(step => {
        // 코드 진행 패턴 (I-IV-V-I 같은 자연스러운 진행)
        const random = Math.random();
        let selectedChord;
        
        if (lastChord === 'C') {
            if (random < 0.4) selectedChord = 'C';
            else if (random < 0.6) selectedChord = 'F';
            else if (random < 0.8) selectedChord = 'G';
            else selectedChord = 'Am';
        } else if (lastChord === 'F') {
            if (random < 0.4) selectedChord = 'C';
            else if (random < 0.6) selectedChord = 'G';
            else if (random < 0.8) selectedChord = 'Am';
            else selectedChord = 'F';
        } else if (lastChord === 'G') {
            if (random < 0.5) selectedChord = 'C';
            else if (random < 0.7) selectedChord = 'Am';
            else if (random < 0.9) selectedChord = 'F';
            else selectedChord = 'G';
        } else {
            if (random < 0.4) selectedChord = 'C';
            else if (random < 0.6) selectedChord = 'F';
            else if (random < 0.8) selectedChord = 'G';
            else selectedChord = chordNames[Math.floor(Math.random() * chordNames.length)];
        }
        
        guitarChords[String(step)] = chords[selectedChord];
        lastChord = selectedChord;
    });
    
    return guitarChords;
}

// 랜덤 멜로디 적용
function applyRandomMelody(beat) {
    // 베이스 패턴이 없으면 킥과 동일한 패턴 생성
    if (!beat.bass || beat.bass.length === 0) {
        beat.bass = beat.kick ? [...beat.kick] : [0, 4, 8, 12];
    }
    beat.bassNotes = generateRandomBassMelody(beat);
    
    // 기타 패턴이 없으면 4박마다 코드 생성
    if (!beat.guitar || beat.guitar.length === 0) {
        const steps = beat.timeSignature === '3/4' ? 12 : beat.timeSignature === '6/8' ? 12 : 16;
        beat.guitar = [];
        for (let i = 0; i < steps; i += 4) {
            beat.guitar.push(i);
        }
    }
    beat.guitarChords = generateRandomGuitarChords(beat);
}

// 랜덤 멜로디만 재생성
function regenerateMelody() {
    if (!currentBeat) return;
    
    // 재생 중이면 정지
    if (isPlaying) {
        stopBeat();
    }
    
    applyRandomMelody(currentBeat);
    displayBeat(currentBeat);
}

// 비트 데이터 로드
async function loadBeats() {
    try {
        elements.loading.classList.remove('hidden');
        
        const response = await fetch('beats.json');
        if (!response.ok) {
            throw new Error('비트 데이터를 불러올 수 없습니다.');
        }
        
        beatsData = await response.json();
        currentBeat = getTodayBeat();
        
        if (currentBeat) {
            // 랜덤 멜로디 자동 적용
            applyRandomMelody(currentBeat);
            displayBeat(currentBeat);
        } else {
            throw new Error('비트를 불러올 수 없습니다.');
        }
        
        elements.loading.classList.add('hidden');
    } catch (error) {
        elements.loading.classList.add('hidden');
        console.error('비트 로드 실패:', error);
        alert('비트를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
    }
}

// 비트 그리드 생성
function createBeatGrid(container, pattern, steps = 16) {
    container.innerHTML = '';
    for (let i = 0; i < steps; i++) {
        const cell = document.createElement('div');
        cell.className = 'beat-cell';
        cell.dataset.position = i;
        if (pattern.includes(i)) {
            cell.classList.add('active');
        }
        container.appendChild(cell);
    }
}

// 비트 표시
function displayBeat(beat) {
    const steps = beat.timeSignature === '3/4' ? 12 : beat.timeSignature === '6/8' ? 12 : 16;
    
    createBeatGrid(elements.kickGrid, beat.kick || [], steps);
    createBeatGrid(elements.snareGrid, beat.snare || [], steps);
    createBeatGrid(elements.hihatGrid, beat.hihat || [], steps);
    createBeatGrid(elements.bassGrid, beat.bass || [], steps);
    createBeatGrid(elements.guitarGrid, beat.guitar || [], steps);
    
    elements.beatDescription.textContent = `${beat.name} - ${beat.description}`;
    
    currentBeat = beat;
    updatePlayheadPosition(0);
}

// BPM 업데이트
function updateBPM(value) {
    currentBPM = parseInt(value);
    elements.bpmValue.textContent = currentBPM;
    sixteenthNoteTime = (60.0 / currentBPM) / 4;
    
    if (isPlaying) {
        stopBeat();
        startBeat();
    }
}

// 플레이헤드 위치 업데이트
function updatePlayheadPosition(position) {
    const steps = currentBeat.timeSignature === '3/4' ? 12 : currentBeat.timeSignature === '6/8' ? 12 : 16;
    const cellWidth = 100 / steps;
    elements.playhead.style.left = `${position * cellWidth}%`;
}

// 비트 재생
function startBeat() {
    if (!currentBeat) return;
    
    isPlaying = true;
    elements.playPauseBtn.textContent = '⏸ 정지';
    initAudioContext();
    
    const steps = currentBeat.timeSignature === '3/4' ? 12 : currentBeat.timeSignature === '6/8' ? 12 : 16;
    let currentStep = playheadPosition;
    
    beatInterval = setInterval(() => {
        // 사운드 재생
        if (!isMuteMode) {
            if (currentBeat.kick && currentBeat.kick.includes(currentStep)) {
                kickSound();
            }
            if (currentBeat.snare && currentBeat.snare.includes(currentStep)) {
                snareSound();
            }
            if (currentBeat.hihat && currentBeat.hihat.includes(currentStep)) {
                hihatSound();
            }
            if (currentBeat.bass && currentBeat.bass.includes(currentStep)) {
                // 베이스는 루트 노트 사용 (C2 = 60)
                const bassNote = currentBeat.bassNotes && currentBeat.bassNotes[String(currentStep)] ? currentBeat.bassNotes[String(currentStep)] : 60;
                bassSound(bassNote);
            }
            if (currentBeat.guitar && currentBeat.guitar.includes(currentStep)) {
                // 기타는 코드 사용 (기본 C major)
                const guitarChord = currentBeat.guitarChords && currentBeat.guitarChords[String(currentStep)] ? currentBeat.guitarChords[String(currentStep)] : [64, 67, 71];
                guitarSound(guitarChord);
            }
        } else {
            // 뮤트 모드: 메트로놈만
            if (currentStep % 4 === 0) {
                metronomeSound();
            }
        }
        
        // 플레이헤드 업데이트
        updatePlayheadPosition(currentStep);
        
        // 셀 하이라이트
        highlightCell(currentStep);
        
        currentStep = (currentStep + 1) % steps;
    }, sixteenthNoteTime * 1000);
}

// 비트 정지
function stopBeat() {
    isPlaying = false;
    elements.playPauseBtn.textContent = '▶ 재생';
    if (beatInterval) {
        clearInterval(beatInterval);
        beatInterval = null;
    }
}

// 비트 리셋
function resetBeat() {
    stopBeat();
    playheadPosition = 0;
    updatePlayheadPosition(0);
    clearHighlights();
}

// 셀 하이라이트
function highlightCell(position) {
    const cells = document.querySelectorAll('.beat-cell');
    cells.forEach(cell => cell.classList.remove('highlight'));
    
    const kickCells = elements.kickGrid.querySelectorAll('.beat-cell');
    const snareCells = elements.snareGrid.querySelectorAll('.beat-cell');
    const hihatCells = elements.hihatGrid.querySelectorAll('.beat-cell');
    const bassCells = elements.bassGrid.querySelectorAll('.beat-cell');
    const guitarCells = elements.guitarGrid.querySelectorAll('.beat-cell');
    
    if (kickCells[position]) kickCells[position].classList.add('highlight');
    if (snareCells[position]) snareCells[position].classList.add('highlight');
    if (hihatCells[position]) hihatCells[position].classList.add('highlight');
    if (bassCells[position]) bassCells[position].classList.add('highlight');
    if (guitarCells[position]) guitarCells[position].classList.add('highlight');
}

// 하이라이트 제거
function clearHighlights() {
    const cells = document.querySelectorAll('.beat-cell');
    cells.forEach(cell => cell.classList.remove('highlight'));
}

// 모드 변경
function switchMode(mode) {
    currentMode = mode;
    
    // 버튼 활성화
    elements.modeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // 모드 컨텐츠 표시
    elements.beatMode.classList.toggle('active', mode === 'beat');
    elements.rudimentMode.classList.toggle('active', mode === 'rudiment');
    elements.tempoMode.classList.toggle('active', mode === 'tempo');
    
    // 모든 재생 정지
    stopBeat();
    stopRudiment();
    stopTempoTrainer();
}

// 난이도 변경
function switchDifficulty(difficulty) {
    currentDifficulty = difficulty;
    
    elements.difficultyBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
    });
    
    currentBeat = getTodayBeat();
    if (currentBeat) {
        // 랜덤 멜로디 자동 적용
        applyRandomMelody(currentBeat);
        displayBeat(currentBeat);
    }
}

// 루딤먼트 패턴
const rudimentPatterns = {
    single: { pattern: ['R', 'L', 'R', 'L'], name: 'Single Stroke' },
    double: { pattern: ['R', 'R', 'L', 'L'], name: 'Double Stroke' },
    paradiddle: { pattern: ['R', 'L', 'R', 'R', 'L', 'R', 'L', 'L'], name: 'Paradiddle' },
    flam: { pattern: ['R', 'L', 'R', 'L'], name: 'Flam' }
};

let rudimentInterval = null;
let rudimentPosition = 0;
let isRudimentPlaying = false;

function startRudiment() {
    const patternKey = elements.rudimentPattern.value;
    const pattern = rudimentPatterns[patternKey].pattern;
    const bpm = parseInt(elements.rudimentBpm.value);
    const noteTime = (60.0 / bpm) / 4;
    
    isRudimentPlaying = true;
    elements.rudimentPlayBtn.textContent = '⏸ 정지';
    initAudioContext();
    
    rudimentPosition = 0;
    updateRudimentDisplay(pattern, rudimentPosition);
    
    rudimentInterval = setInterval(() => {
        const hand = pattern[rudimentPosition];
        if (hand === 'R') {
            elements.rightHand.classList.add('active');
            elements.leftHand.classList.remove('active');
            snareSound();
        } else {
            elements.leftHand.classList.add('active');
            elements.rightHand.classList.remove('active');
            snareSound();
        }
        
        rudimentPosition = (rudimentPosition + 1) % pattern.length;
        updateRudimentDisplay(pattern, rudimentPosition);
    }, noteTime * 1000);
}

function stopRudiment() {
    isRudimentPlaying = false;
    elements.rudimentPlayBtn.textContent = '▶ 재생';
    if (rudimentInterval) {
        clearInterval(rudimentInterval);
        rudimentInterval = null;
    }
    elements.leftHand.classList.remove('active');
    elements.rightHand.classList.remove('active');
}

function updateRudimentDisplay(pattern, position) {
    const patternText = pattern.join(' ');
    elements.rudimentPatternText.textContent = patternText;
}

// 템포 트레이너
let tempoTrainerInterval = null;
let isTempoTrainerRunning = false;
let currentTempoBPM = 80;
let startTime = 0;
let totalTime = 0;

function startTempoTrainer() {
    const startBPM = parseInt(elements.startBpm.value);
    const targetBPM = parseInt(elements.targetBpm.value);
    const practiceTime = parseInt(elements.practiceTime.value);
    const increment = parseFloat(elements.bpmIncrement.value);
    
    currentTempoBPM = startBPM;
    totalTime = practiceTime * 60 * 1000; // 분을 밀리초로 변환
    startTime = Date.now();
    isTempoTrainerRunning = true;
    
    elements.tempoStartBtn.disabled = true;
    elements.tempoStopBtn.disabled = false;
    
    initAudioContext();
    
    // BPM 업데이트
    const bpmChangeInterval = (totalTime / ((targetBPM - startBPM) / increment)) / 1000;
    
    tempoTrainerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / totalTime, 1);
        
        // BPM 증가
        if (currentTempoBPM < targetBPM) {
            currentTempoBPM = Math.min(startBPM + (progress * (targetBPM - startBPM)), targetBPM);
        }
        
        elements.currentBpmDisplay.textContent = Math.round(currentTempoBPM);
        elements.tempoProgressBar.style.width = `${progress * 100}%`;
        
        const remaining = Math.max(0, totalTime - elapsed);
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        elements.timeRemaining.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
        
        if (progress >= 1) {
            stopTempoTrainer();
        }
    }, 100);
    
    // 메트로놈 재생 함수
    function playMetronome() {
        if (!isTempoTrainerRunning) return;
        
        metronomeSound();
        const noteTime = (60.0 / currentTempoBPM) / 4;
        
        // 다음 재생 스케줄링 (BPM이 변경될 수 있으므로 동적으로)
        setTimeout(() => {
            playMetronome();
        }, noteTime * 1000);
    }
    
    // 메트로놈 시작
    playMetronome();
}

function stopTempoTrainer() {
    isTempoTrainerRunning = false;
    elements.tempoStartBtn.disabled = false;
    elements.tempoStopBtn.disabled = true;
    
    if (tempoTrainerInterval) {
        clearInterval(tempoTrainerInterval);
        tempoTrainerInterval = null;
    }
    // 메트로놈은 setTimeout으로 재귀 호출되므로 isTempoTrainerRunning 플래그로 제어
}

function resetTempoTrainer() {
    stopTempoTrainer();
    currentTempoBPM = parseInt(elements.startBpm.value);
    elements.currentBpmDisplay.textContent = currentTempoBPM;
    elements.tempoProgressBar.style.width = '0%';
    elements.timeRemaining.textContent = `${elements.practiceTime.value}:00`;
}

// 공유 기능
async function shareBeat() {
    if (!currentBeat) return;
    
    const shareText = `오늘의 드럼 비트 🥁\n\n${currentBeat.name}\n${currentBeat.description}\nBPM: ${currentBPM}\n\n👇 연습해보세요!\n${window.location.href}`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: '오늘의 드럼 비트',
                text: shareText,
                url: window.location.href
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                fallbackShare(shareText);
            }
        }
    } else {
        fallbackShare(shareText);
    }
}

function fallbackShare(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            alert('클립보드에 복사되었습니다!');
        });
    } else {
        prompt('아래 텍스트를 복사하세요:', text);
    }
}

// 이벤트 리스너
elements.bpmSlider.addEventListener('input', (e) => updateBPM(e.target.value));
elements.playPauseBtn.addEventListener('click', () => {
    if (isPlaying) {
        stopBeat();
    } else {
        startBeat();
    }
});
elements.muteBtn.addEventListener('click', () => {
    isMuteMode = !isMuteMode;
    elements.muteBtn.textContent = isMuteMode ? '🔊 사운드 모드' : '🔇 뮤트 모드';
});
elements.resetBtn.addEventListener('click', resetBeat);
elements.shareBeatBtn.addEventListener('click', shareBeat);
elements.randomBeatBtn.addEventListener('click', selectRandomBeat);
elements.randomMelodyBtn.addEventListener('click', regenerateMelody);

// 모드 변경
elements.modeBtns.forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
});

// 난이도 변경
elements.difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => switchDifficulty(btn.dataset.difficulty));
});

// 루딤먼트
elements.rudimentBpm.addEventListener('input', (e) => {
    elements.rudimentBpmValue.textContent = e.target.value;
    if (isRudimentPlaying) {
        stopRudiment();
        startRudiment();
    }
});
elements.rudimentPattern.addEventListener('change', () => {
    if (isRudimentPlaying) {
        stopRudiment();
        startRudiment();
    } else {
        const patternKey = elements.rudimentPattern.value;
        const pattern = rudimentPatterns[patternKey].pattern;
        updateRudimentDisplay(pattern, 0);
    }
});
elements.rudimentPlayBtn.addEventListener('click', () => {
    if (isRudimentPlaying) {
        stopRudiment();
    } else {
        startRudiment();
    }
});
elements.rudimentResetBtn.addEventListener('click', () => {
    stopRudiment();
    rudimentPosition = 0;
    const patternKey = elements.rudimentPattern.value;
    const pattern = rudimentPatterns[patternKey].pattern;
    updateRudimentDisplay(pattern, 0);
});

// 템포 트레이너
elements.tempoStartBtn.addEventListener('click', startTempoTrainer);
elements.tempoStopBtn.addEventListener('click', stopTempoTrainer);
elements.tempoResetBtn.addEventListener('click', resetTempoTrainer);

// 페이지 로드 시 초기화
updateDateDisplay();
loadBeats();
updateBPM(120);

// 루딤먼트 초기 표시
const initialPatternKey = elements.rudimentPattern.value;
const initialPattern = rudimentPatterns[initialPatternKey].pattern;
updateRudimentDisplay(initialPattern, 0);

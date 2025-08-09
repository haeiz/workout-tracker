 // --- State ---
  let theme = 'dark';
  const appContainer = document.getElementById('appContainer');
  const accentFlash = document.getElementById('accentFlash');
  const stopwatch = document.getElementById('stopwatch');
  const progressBar = document.getElementById('progressBar');
  const setLog = document.getElementById('setLog');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const toggleThemeBtn = document.getElementById('toggleThemeBtn');
  const beepShort = document.getElementById('beepAudioShort');
  const circleProgress = document.querySelector('circle.progress');

  const modeSelect = document.getElementById('modeSelect');
  const exInput = document.getElementById('exerciseDuration');
  const restInput = document.getElementById('restDuration');
  const setsInput = document.getElementById('totalSets');

  let isExercise = true;
  let completedSets = 0;
  let totalSets = 0;
  let timerInterval = null;
  let timeLeft = 0;
  let originalTime = 0;
  let paused = false;

  // Smooth progress animation state
  let targetPercent = 0;
  let currentPercent = 0;
  let targetOffset = 0;
  let currentOffset = 0;

  // Circumference for SVG circle (r=54)
  const CIRC = 2 * Math.PI * 54;
  circleProgress.style.strokeDasharray = CIRC;
  circleProgress.style.strokeDashoffset = CIRC;

  // --- Theme ---
  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }
  toggleThemeBtn.addEventListener('click', toggleTheme);

  // --- Mode presets ---
  function applyModePreset(mode) {
    if (mode === 'hiit') {
      exInput.value = 20; restInput.value = 10; setsInput.value = 8;
    } else if (mode === 'endurance') {
      exInput.value = 90; restInput.value = 30; setsInput.value = 3;
    }
  }
  modeSelect.addEventListener('change', () => applyModePreset(modeSelect.value));

  // --- Helpers ---
  function formatTime(s) { const m = Math.floor(s/60); const sec = s % 60; return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; }

  function flashAccent() {
    accentFlash.classList.remove('show');
    void accentFlash.offsetWidth; // force reflow
    accentFlash.classList.add('show');
  }

  function vibrateOnSupported(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function playShortBeep() { try { beepShort.currentTime = 0; beepShort.play(); } catch(e){} }

  // --- Core sequence control ---
  startBtn.addEventListener('click', () => {
    if (timerInterval) { // reset
      resetWorkout();
      return;
    }
    startWorkoutSequence();
  });

  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  });
  resetBtn.addEventListener('click', resetWorkout);

  function startWorkoutSequence() {
    const exDur = parseInt(exInput.value, 10);
    const restDur = parseInt(restInput.value, 10);
    totalSets = parseInt(setsInput.value, 10);
    if (!exDur || !restDur || !totalSets) return alert('Please fill valid numbers for durations and sets.');

    completedSets = 0; isExercise = true; setLog.innerHTML = '';
    startBtn.textContent = 'Reset'; pauseBtn.style.display = 'inline-block'; pauseBtn.textContent = 'Pause';
    paused = false;
    startPhase(exDur);
  }

  function startPhase(duration) {
    timeLeft = duration; originalTime = duration; updateDisplay(); updateProgress();

    flashAccent();

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
      if (paused) return;
      timeLeft--;

      if (timeLeft > 0 && timeLeft <= 3) playShortBeep();

      updateDisplay(); updateProgress();

      if (timeLeft <= 0) {
        clearInterval(timerInterval); timerInterval = null;
        vibrateOnSupported([200, 100, 200]); // vibration only

        if (isExercise) {
          completedSets++;
          logSet(completedSets);
        }

        if (completedSets >= totalSets) {
          stopwatch.textContent = '🎉 Workout Complete!';
          pauseBtn.style.display = 'none';
          startBtn.textContent = 'Start Workout';
          updateProgress(0);
          return;
        }

        isExercise = !isExercise;
        flashAccent();

        const nextDur = isExercise ? parseInt(exInput.value, 10) : parseInt(restInput.value, 10);
        setTimeout(() => startPhase(nextDur), 200);
      }
    }, 1000);
  }

  function updateDisplay() {
    const label = isExercise ? '🏋️ Exercise' : '🛌 Rest';
    stopwatch.textContent = `${label} - ${formatTime(Math.max(0, timeLeft))}`;
  }

  // Updated for smooth animation
  function updateProgress(overridePercent) {
    if (overridePercent === 0) {
      targetPercent = 0;
      targetOffset = CIRC;
      return;
    }
    targetPercent = originalTime > 0 ? (timeLeft / originalTime) * 100 : 0;
    targetOffset = CIRC - (targetPercent / 100) * CIRC;
  }

  function animateProgress() {
    currentPercent += (targetPercent - currentPercent) * 0.1;
    currentOffset += (targetOffset - currentOffset) * 0.1;

    progressBar.style.width = currentPercent + '%';
    circleProgress.style.strokeDashoffset = currentOffset;

    requestAnimationFrame(animateProgress);
  }
  animateProgress();

  function logSet(n) {
    const div = document.createElement('div');
    div.className = 'set-complete';
    div.textContent = `Set ${n} Complete`;
    setLog.appendChild(div);
    setLog.scrollTop = setLog.scrollHeight;
  }

  function resetWorkout() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null; paused = false; completedSets = 0; isExercise = true;
    startBtn.textContent = 'Start Workout'; pauseBtn.style.display = 'none'; pauseBtn.textContent = 'Pause';
    stopwatch.textContent = '00:00';
    updateProgress(0);
    setLog.innerHTML = '';
  }

  // keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ') { e.preventDefault(); startBtn.click(); }
    if (e.key === 'p') pauseBtn.click();
  });

  // ensure preset applied on load
  applyModePreset(modeSelect.value);
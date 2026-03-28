/* ── QUIZ GAME – 20 Questions with Timer ── */
const QuizGame = (() => {
  const QUESTIONS = [
    { q:"What does HTML stand for?", opts:["HyperText Markup Language","HighText Machine Language","Hyperlink and Text Markup Language","None"], ans:0 },
    { q:"Which planet is known as the Red Planet?", opts:["Earth","Mars","Jupiter","Venus"], ans:1 },
    { q:"What is 2^10?", opts:["512","1024","2048","256"], ans:1 },
    { q:"Who painted the Mona Lisa?", opts:["Michelangelo","Picasso","Leonardo da Vinci","Raphael"], ans:2 },
    { q:"Which language runs in the browser?", opts:["Java","C++","Python","JavaScript"], ans:3 },
    { q:"What is the chemical symbol for Gold?", opts:["Ag","Fe","Au","Gd"], ans:2 },
    { q:"What year did WWW begin?", opts:["1979","1985","1991","2000"], ans:2 },
    { q:"What is the largest ocean?", opts:["Atlantic","Indian","Pacific","Arctic"], ans:2 },
    { q:"Which data structure uses LIFO?", opts:["Queue","Stack","Array","Tree"], ans:1 },
    { q:"What does CSS stand for?", opts:["Computer Style Sheets","Creative Style System","Cascading Style Sheets","Colorful Style Sheets"], ans:2 },
    { q:"Who wrote Romeo and Juliet?", opts:["Dickens","Shakespeare","Austen","Hemingway"], ans:1 },
    { q:"What is the speed of light (km/s)?", opts:["150,000","200,000","300,000","400,000"], ans:2 },
    { q:"What is `null` in JavaScript?", opts:["undefined variable","empty object reference","a string","a number"], ans:1 },
    { q:"How many bits in a byte?", opts:["4","8","16","32"], ans:1 },
    { q:"What planet has the most moons?", opts:["Jupiter","Saturn","Uranus","Neptune"], ans:1 },
    { q:"Which sorting algorithm is O(n log n) worst case?", opts:["Bubble Sort","Quick Sort","Merge Sort","Insertion Sort"], ans:2 },
    { q:"What does DNS stand for?", opts:["Domain Name System","Data Network Service","Direct Name Server","Digital Network Suite"], ans:0 },
    { q:"What is the Fibonacci sequence start?", opts:["0,1,1,2","1,2,3,4","0,2,2,4","1,1,2,3"], ans:0 },
    { q:"Which company created React.js?", opts:["Google","Meta","Microsoft","Apple"], ans:1 },
    { q:"What is the boiling point of water (°C)?", opts:["90","95","100","105"], ans:2 }
  ];

  let questions, current, score, answered, timer, elapsed, running=false;
  const TIME_PER_Q = 15;

  function shuffle(arr) { return [...arr].sort(()=>Math.random()-.5); }

  function init() {
    questions = shuffle(QUESTIONS).slice(0,12);
    current=0; score=0; answered=false; running=true;
  }

  function startTimer() {
    clearInterval(timer); elapsed=0;
    timer=setInterval(()=>{
      elapsed++;
      const left=TIME_PER_Q-elapsed;
      const el=document.getElementById('quiz-timer');
      if(el){
        el.textContent=`⏱ ${left}s`;
        el.className='quiz-timer'+(left<=5?' urgent':'');
      }
      if(left<=0) { clearInterval(timer); autoNext(); }
    },1000);
  }

  function autoNext() {
    if(!answered){
      answered=true;
      const opts=document.querySelectorAll('.quiz-opt');
      opts[questions[current].ans]?.classList.add('correct');
      opts.forEach(o=>o.disabled=true);
      setTimeout(nextQ,900);
    }
  }

  function nextQ() {
    current++;
    if(current>=questions.length) endGame();
    else renderQ();
  }

  function endGame() {
    running=false; clearInterval(timer);
    const pct=Math.round(score/questions.length*100);
    Storage.setHigh('quiz',score);
    MainApp.updateScore(score);
    Audio[pct>=60?'win':'lose']();
    MainApp.gameOver('quiz',score,`${score}/${questions.length} correct (${pct}%)`,pct>=60);
  }

  function renderQ() {
    const qData=questions[current];
    answered=false;

    const progress=document.getElementById('quiz-progress-bar');
    const qEl=document.getElementById('quiz-q');
    const optsEl=document.getElementById('quiz-opts');
    const meta=document.getElementById('quiz-meta');

    if(!qEl) return;
    progress.style.width=`${(current/questions.length)*100}%`;
    qEl.textContent=`Q${current+1}. ${qData.q}`;
    meta.textContent=`Question ${current+1} of ${questions.length}  ·  Score: ${score}`;
    optsEl.innerHTML='';

    qData.opts.forEach((opt,i)=>{
      const btn=document.createElement('button');
      btn.className='quiz-opt'; btn.textContent=opt;
      btn.addEventListener('click',()=>{
        if(answered||!running) return;
        answered=true; clearInterval(timer);
        Audio.click();
        if(i===qData.ans){ btn.classList.add('correct'); score++; Audio.eat(); }
        else { btn.classList.add('wrong'); document.querySelectorAll('.quiz-opt')[qData.ans]?.classList.add('correct'); }
        document.querySelectorAll('.quiz-opt').forEach(o=>o.disabled=true);
        MainApp.updateScore(score);
        setTimeout(nextQ,900);
      });
      optsEl.appendChild(btn);
    });

    startTimer();
  }

  function mount(container) {
    running=false; clearInterval(timer);
    container.innerHTML=`
      <div id="game-quiz">
        <div class="quiz-progress"><div class="quiz-progress-bar" id="quiz-progress-bar" style="width:0%"></div></div>
        <div id="quiz-timer" class="quiz-timer">⏱ ${TIME_PER_Q}s</div>
        <div class="quiz-q" id="quiz-q">Loading…</div>
        <div class="quiz-opts" id="quiz-opts"></div>
        <div class="quiz-meta" id="quiz-meta"></div>
      </div>`;
    init(); renderQ();
  }

  function pause()   { if(running){ clearInterval(timer); } }
  function restart() { clearInterval(timer); init(); renderQ(); }
  function stop()    { running=false; clearInterval(timer); }

  return { id:'quiz', mount, pause, restart, stop };
})();

import React, { useState, useEffect, useRef, useCallback, createContext, useContext, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import './App.css'; // You will need to update this file with the provided CSS.

// ---------- REACTBITS.DEV COMPONENTS ----------
// Note: These components are adapted from reactbits.dev for this implementation.

// --- ClickSpark ---
const ClickSpark = ({ children }) => {
    const [sparks, setSparks] = useState([]);
    const sparkRef = useRef(null);

    const createSpark = useCallback((e) => {
        const { clientX: x, clientY: y } = e;
        const newSpark = {
            id: Date.now(),
            x: x - 5,
            y: y - 5,
            color: `hsl(${Math.random() * 360}, 100%, 75%)`,
        };
        setSparks((prev) => [...prev, newSpark]);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (sparks.length > 0) {
                setSparks((prev) => prev.slice(1));
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [sparks]);

    return (
        <div ref={sparkRef} onClick={createSpark} style={{ width: '100%', height: '100%' }}>
            {sparks.map((spark) => (
                <motion.div
                    key={spark.id}
                    className="spark"
                    style={{
                        position: 'fixed',
                        top: spark.y,
                        left: spark.x,
                        backgroundColor: spark.color,
                    }}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: [1, 1.5, 0], y: [0, -10, -20], opacity: [1, 1, 0] }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
            ))}
            {children}
        </div>
    );
};

// --- Dock ---
const DockContext = createContext(null);
const useDock = () => useContext(DockContext);

const Dock = ({ children }) => {
    const ref = useRef(null);
    const [hovered, setHovered] = useState(false);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        setWidth(ref.current?.offsetWidth || 0);
    }, []);

    return (
        <DockContext.Provider value={{ hovered, width }}>
            <motion.div
                ref={ref}
                className="dock"
                onMouseMove={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {children}
            </motion.div>
        </DockContext.Provider>
    );
};

const DockItem = ({ children, onClick }) => {
    const ref = useRef(null);
    const { hovered, width } = useDock();
    const [x, setX] = useState(0);

    useEffect(() => {
        if (!hovered) {
            setX(0);
        }
    }, [hovered]);

    const handleMouseMove = (e) => {
        if (!ref.current || !hovered) return;
        const rect = ref.current.getBoundingClientRect();
        const parentRect = ref.current.parentElement.getBoundingClientRect();
        const distance = e.clientX - rect.left - rect.width / 2;
        const newX = (distance / (parentRect.width / 2)) * 10;
        setX(newX);
    };

    const scale = useMemo(() => {
        if (!hovered) return 1;
        const distance = Math.abs(x);
        return Math.max(1.5 - distance * 0.1, 1);
    }, [hovered, x]);

    return (
        <motion.div
            ref={ref}
            className="dock-item"
            onMouseMove={handleMouseMove}
            onClick={onClick}
            style={{ x }}
            animate={{ scale }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
            {children}
        </motion.div>
    );
};

// --- Animated List ---
const AnimatedList = ({ children }) => {
    return (
        <motion.div layout>
            <AnimatePresence>
                {React.Children.map(children, (child) => (
                    <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, type: 'spring', stiffness: 200, damping: 25 }}
                    >
                        {child}
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    );
};

// --- Counter ---
const Counter = ({ value }) => {
    return (
        <div className="counter-container">
            <AnimatePresence mode="popLayout">
                {value.toString().split('').map((digit, i) => (
                    <motion.span
                        key={`${digit}-${i}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="counter-digit"
                    >
                        {digit}
                    </motion.span>
                ))}
            </AnimatePresence>
        </div>
    );
};

// --- Magic Bento ---
const MagicBento = ({ children }) => {
    const [mousePosition, setMousePosition] = useState({ x: null, y: null });

    const handleMouseMove = (e) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
    };

    return (
        <div className="bento-grid" onMouseMove={handleMouseMove}>
            <div
                className="bento-spotlight"
                style={{
                    background: mousePosition.x
                        ? `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, var(--bento-spotlight-color) 0%, transparent 40%)`
                        : 'none',
                }}
            />
            {children}
        </div>
    );
};

// --- Splash Cursor ---
const useSplashCursor = () => {
    useEffect(() => {
        const cursorEl = document.createElement('div');
        cursorEl.className = 'splash-cursor';
        document.body.appendChild(cursorEl);

        const moveHandler = (e) => {
            cursorEl.style.left = `${e.clientX}px`;
            cursorEl.style.top = `${e.clientY}px`;
        };

        const createSplash = (e) => {
            const splashEl = document.createElement('div');
            splashEl.className = 'splash';
            splashEl.style.left = `${e.clientX}px`;
            splashEl.style.top = `${e.clientY}px`;
            document.body.appendChild(splashEl);
            setTimeout(() => splashEl.remove(), 600);
        };

        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('click', createSplash);

        return () => {
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('click', createSplash);
            cursorEl.remove();
        };
    }, []);
};


// ---------- Constants and Initial Data ----------
const KEYWORDS = ['calm', 'nature', 'meditation', 'mindfulness', 'serene', 'wellness', 'forest', 'ocean', 'sky', 'mountains'];
const LOW_MOOD_METHODS = [ 'Take a 5-minute walk outside.', 'Drink a glass of water and stretch.', 'Listen to one calm song.', 'Write down one thing you are grateful for.', 'Perform 3 deep belly breaths.' ];
const HIGH_MOOD_METHODS = [ 'Smile and hold it for 30 seconds.', 'Acknowledge one small win today.', 'Share a positive thought with someone.', 'Set a small, achievable goal for the next hour.', 'Check your posture and relax your shoulders.' ];
const INITIAL_TODOS = [ { id: 1, text: 'Take a 15-minute screen break', completed: false }, { id: 2, text: 'Drink 8 glasses of water', completed: false } ];

// ---------- Helper Hooks & Functions ----------
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = value => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue];
};

const fetchQuotes = async () => {
  const sampleQuotes = [
      { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
      { text: "Happiness is not something readymade. It comes from your own actions.", author: "Dalai Lama" },
      { text: "What you think, you become. What you feel, you attract. What you imagine, you create.", author: "Buddha" },
      { text: "The mind is everything. What you think you become.", author: "Buddha" },
      { text: "Believe you can and you’re halfway there.", author: "Theodore Roosevelt" },
  ];
  return Promise.resolve(sampleQuotes);
};

// ---------- Audio Helper ----------
const useSound = (url, volume = 0.5) => {
    const audioRef = useRef(null);

    useEffect(() => {
        const audio = new Audio(url);
        audio.volume = volume;
        audioRef.current = audio;
    }, [url, volume]);

    const play = useCallback(() => {
        audioRef.current?.play().catch(err => console.error("Audio play failed:", err));
    }, []);

    return play;
};


// ---------- UI Components ----------

function Header({ moodScore, onToggleTheme, theme }) {
  const score = parseFloat(moodScore).toFixed(1);
  let scoreClass = '';
  if (score <= 4) scoreClass = 'mood-score-low';
  else if (score <= 7) scoreClass = 'mood-score-medium';
  else scoreClass = 'mood-score-high';

  return (
    <header id="dashboardHeader">
      <div className="brand">
        <div className="logo" aria-hidden="true">MH</div>
        <div>
          <h1>MentalHealth</h1>
          <p className="lead">Calm quotes to ground your day</p>
        </div>
      </div>
      <div className="dashboard-controls">
        <div className="dashboard-header-mood-group">
          <div className="dashboard-flex-row-with-toggle">
            <button title="Toggle Dark/Light Mode" onClick={onToggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
            <div className="mood-score-link">
              <div>
                <div className={`stat-score ${scoreClass}`}>{score}</div>
                <div className="stat-label">Your Mood</div>
              </div>
              <div style={{ fontSize: '30px', opacity: 0.9 }}>🪴</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function QuoteCarousel() {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const loadQuotes = async () => {
            setLoading(true);
            const fetchedQuotes = await fetchQuotes();
            setQuotes(fetchedQuotes);
            setLoading(false);
        };
        loadQuotes();
    }, []);

    const handleNext = () => setIndex((prev) => (prev + 1) % quotes.length);
    const handlePrev = () => setIndex((prev) => (prev - 1 + quotes.length) % quotes.length);

    return (
        <section className="panel carousel-wrap bento-item">
            <div className="controls">
                <strong id="quotesHeading">Daily Quotes</strong>
                <div>
                    <button className="btn" onClick={handlePrev} aria-label="Previous">◀</button>
                    <button className="btn" onClick={handleNext} aria-label="Next">▶</button>
                </div>
            </div>
            <div className="carousel-container-reactbits">
                {loading ? <p>Loading...</p> : (
                    <AnimatePresence initial={false} mode="wait">
                        <motion.div
                            key={index}
                            className="carousel-card-reactbits"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.5 }}
                        >
                            <img src={`https://picsum.photos/seed/${KEYWORDS[index % KEYWORDS.length]}/600/400`} alt={KEYWORDS[index % KEYWORDS.length]} />
                            <blockquote>“{quotes[index].text}”</blockquote>
                            <cite>— {quotes[index].author}</cite>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </section>
    );
}

function TodoList() {
  const [todos, setTodos] = useLocalStorage('todos', INITIAL_TODOS);
  const [inputText, setInputText] = useState('');
  const playAddSound = useSound('https://www.soundjay.com/buttons/sounds/button-09.mp3');
  const playCompleteSound = useSound('https://www.soundjay.com/buttons/sounds/button-10.mp3');

  const handleAddTask = () => {
    if (!inputText.trim()) return;
    const newTodo = { id: Date.now(), text: inputText.trim(), completed: false };
    setTodos(prev => [...prev, newTodo]);
    setInputText('');
    playAddSound();
  };
  
  const handleToggle = (id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    playCompleteSound();
  };
  
  const handleDelete = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  return (
    <section className="panel todo-panel bento-item">
      <strong>Today's Tasks</strong>
      <div className="small" style={{ marginBottom: '12px' }}>What needs to be done?</div>
      <div className="todo-input-group">
        <input
          type="text"
          className="todo-input"
          placeholder="Add a new task..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
        />
        <button className="btn" onClick={handleAddTask}>+ Add</button>
      </div>
      <div className="todo-list">
        <AnimatedList>
          {todos.map(todo => (
            <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <span>{todo.text}</span>
              <div className="todo-actions">
                <button className="complete-btn" onClick={() => handleToggle(todo.id)}>✔</button>
                <button className="delete-btn" onClick={() => handleDelete(todo.id)}>✖</button>
              </div>
            </li>
          ))}
        </AnimatedList>
      </div>
    </section>
  );
}

function DashboardView() {
  return (
    <main id="dashboardMainContent">
      <MagicBento>
        <QuoteCarousel />
        <TodoList />
      </MagicBento>
    </main>
  );
}

function MoodTrackerView() {
  const [moodData, setMoodData] = useLocalStorage('mood_data', [8, 8, 8, 8, 8, 8, 8]);
  const [isLoggedToday, setIsLoggedToday] = useState(false);
  const [showMethods, setShowMethods] = useState(null);

  const avgScore = (moodData.reduce((a, b) => a + b, 0) / moodData.length).toFixed(1);
  const progressPct = (avgScore / 10) * 100;
  
  const handleLogMood = (score) => {
    setMoodData(prev => [...prev.slice(1), score]);
    setIsLoggedToday(true);
    setShowMethods({
      score,
      methods: score <= 5 ? LOW_MOOD_METHODS.slice(0, 3) : HIGH_MOOD_METHODS.slice(0, 3),
      completed: []
    });
  };
  
  const handleCompleteMethod = (methodText) => {
     setMoodData(prev => {
      const newData = [...prev];
      const lastIndex = newData.length - 1;
      newData[lastIndex] = Math.min(10, newData[lastIndex] + 0.5);
      return newData;
    });
    setShowMethods(prev => ({ ...prev, completed: [...prev.completed, methodText] }));
  };

  return (
    <div className="app-page active">
      <header className="page-header">
        <h1>Mood Tracker</h1>
        <p className="lead">Check your progress and log your current feeling.</p>
      </header>
      <div className="mood-grid">
        <section className="chart-panel">
          <h2>Weekly Mood Summary</h2>
          <div className="donut-chart" style={{ background: `conic-gradient(#34d399 ${progressPct}%, var(--bg) ${progressPct}%)` }}>
            <div className="donut-inner">
              <span>{avgScore}</span>
              <span>Avg Mood Score</span>
            </div>
          </div>
          <div className="small" style={{ marginTop: '15px' }}>Last 7 entries.</div>
        </section>
        <section className="question-panel">
          <h2>Log Your Mood</h2>
          <div className="mood-question-card">
            <div>
              <div className="question">How is your energy level right now?</div>
              <div className="small">{isLoggedToday ? 'Mood logged! Try a quick boost.' : 'Click an option to log your mood.'}</div>
            </div>
            <div className="mood-options">
              <button className="mood-option-btn" data-score="9" onClick={() => handleLogMood(9)} disabled={isLoggedToday}>High Energy / Great</button>
              <button className="mood-option-btn" data-score="7" onClick={() => handleLogMood(7)} disabled={isLoggedToday}>Steady / Okay</button>
              <button className="mood-option-btn" data-score="5" onClick={() => handleLogMood(5)} disabled={isLoggedToday}>Low / Tired</button>
              <button className="mood-option-btn" data-score="3" onClick={() => handleLogMood(3)} disabled={isLoggedToday}>Drained / Bad</button>
            </div>
            {showMethods && (
                <div id="improvementMethods" style={{ display: 'block', marginTop: '20px' }}>
                    <strong>{showMethods.score <= 5 ? 'Feeling low? Try these micro-boosts:' : 'Feeling good? Maintain the energy:'}</strong>
                    <ul id="methodsList">
                      <AnimatedList>
                        {showMethods.methods.map(method => {
                          const isCompleted = showMethods.completed.includes(method);
                          return (
                            <li key={method} className={`todo-item ${isCompleted ? 'completed' : ''}`}>
                              <span>{method}</span>
                              <button className="complete-btn" onClick={() => handleCompleteMethod(method)} disabled={isCompleted}>
                                {isCompleted ? 'Completed!' : 'Done'}
                              </button>
                            </li>
                          );
                        })}
                      </AnimatedList>
                    </ul>
                </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function PomodoroView() {
  const [settings, setSettings] = useState({ work: 25, short: 5, long: 15, sessions: 4 });
  const [mode, setMode] = useState('work');
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(settings.work * 60);
  const [sessionCount, setSessionCount] = useState(0);
  const [history, setHistory] = useState([]);
  
  const timerRef = useRef(null);
  const totalDuration = (mode === 'work' ? settings.work : mode === 'short' ? settings.short : settings.long) * 60;
  
  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  
  const resetTimer = useCallback((newMode = 'work', newSettings = settings) => {
    setIsActive(false);
    setMode(newMode);
    if (newMode === 'work') setTimeRemaining(newSettings.work * 60);
    else if (newMode === 'short') setTimeRemaining(newSettings.short * 60);
    else setTimeRemaining(newSettings.long * 60);
  }, [settings]);
  
  const nextMode = useCallback(() => {
    const newHistoryEntry = { id: Date.now(), label: `${mode.charAt(0).toUpperCase() + mode.slice(1)} Session (${totalDuration/60} min)`, time: new Date().toLocaleTimeString() };
    setHistory(prev => [newHistoryEntry, ...prev].slice(0, 8));

    if (mode === 'work') {
      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);
      resetTimer(newSessionCount % settings.sessions === 0 ? 'long' : 'short');
    } else {
      resetTimer('work');
    }
    setIsActive(true);
  }, [mode, sessionCount, settings, resetTimer, totalDuration]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            nextMode();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, nextMode]);
  
  return (
    <div className="app-page active">
        <header className="page-header">
            <h1>Focus Timer</h1>
            <p className="lead">Use the Pomodoro Technique to enhance your focus.</p>
        </header>
        <div className="pomo-grid">
            <div className="pomo-panel timer-card">
                <div className="title">Dedicated Focus Timer</div>
                <div className="pomo-counter-wrapper">
                    <Counter value={formatTime(timeRemaining)} />
                </div>
                <div className="mode">{mode === 'work' ? 'Work' : (mode === 'short' ? 'Short Break' : 'Long Break')}</div>
                <div className="pomo-controls-group">
                    <button className="pomo-btn primary" onClick={() => setIsActive(!isActive)}>{isActive ? 'Pause' : 'Start'}</button>
                    <button className="pomo-btn" onClick={() => { resetTimer(); setSessionCount(0); setHistory([]); }}>Reset</button>
                    <button className="pomo-btn" onClick={nextMode}>Skip</button>
                </div>
            </div>
            <div className="pomo-panel pomo-sessions-history">
                <div className="pomo-row"><label>Session History</label></div>
                <div className="sessions-list-container">
                    <AnimatedList>
                    {history.length === 0 ? <div className="session-item">No sessions yet</div> : history.map((h) => (
                        <div className="session-item" key={h.id}>
                        <div>{h.label}</div>
                        <div className="muted tiny">{h.time}</div>
                        </div>
                    ))}
                    </AnimatedList>
                </div>
            </div>
      </div>
    </div>
  );
}

// Relaxation Center Components
const MagneticLines = () => {
    const grid = Array.from({ length: 20 }, (_, i) => i);
    const [lines, setLines] = useState([]);
    const timeoutRef = useRef(null);

    const handleMouseMove = (e) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        const { clientX, clientY } = e;
        const newLines = [];
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * 2 * Math.PI;
            newLines.push({
                id: Math.random(),
                x: clientX,
                y: clientY,
                dx: Math.cos(angle),
                dy: Math.sin(angle),
            });
        }
        setLines(newLines);
        timeoutRef.current = setTimeout(() => setLines([]), 2000);
    };

    return (
        <div className="magnetic-lines-container" onMouseMove={handleMouseMove}>
            <svg className="magnetic-lines-svg">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {grid.map(i => <line key={`h-${i}`} x1="0" y1={(i / 20) * 100 + '%'} x2="100%" y2={(i / 20) * 100 + '%'} />)}
                {grid.map(i => <line key={`v-${i}`} x1={(i / 20) * 100 + '%'} y1="0" x2={(i / 20) * 100 + '%'} y2="100%" />)}
                 <AnimatePresence>
                    {lines.map(line => (
                        <motion.line
                            key={line.id}
                            x1={line.x} y1={line.y}
                            x2={line.x + line.dx * 200} y2={line.y + line.dy * 200}
                            initial={{ opacity: 0, pathLength: 0 }}
                            animate={{ opacity: 1, pathLength: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            filter="url(#glow)"
                        />
                    ))}
                </AnimatePresence>
            </svg>
        </div>
    );
};

const ShapeBlur = () => {
    return (
        <div className="shape-blur-container">
            <div className="shape-blur-1"></div>
            <div className="shape-blur-2"></div>
            <div className="shape-blur-3"></div>
            <div className="shape-blur-text">Breathe in, breathe out.</div>
        </div>
    );
}

const Cubes = () => {
    const controls = useAnimation();
    return (
        <div className="cubes-container" onMouseEnter={() => controls.start("hover")} onMouseLeave={() => controls.start("initial")}>
            {[...Array(10)].map((_, i) => (
                <motion.div key={i} className="cube"
                    initial="initial"
                    animate={controls}
                    variants={{
                        initial: {
                            rotateX: "0deg",
                            rotateY: "0deg",
                        },
                        hover: {
                            rotateX: `${Math.random() * 180}deg`,
                            rotateY: `${Math.random() * 180}deg`,
                            transition: { duration: 0.5, delay: i * 0.05 }
                        }
                    }}
                />
            ))}
        </div>
    );
}


function RelaxationView() {
    useSplashCursor(); // Activates the splash cursor for this view
    const [activeTab, setActiveTab] = useState('lines');
    
    const renderContent = () => {
        switch (activeTab) {
            case 'lines': return <MagneticLines />;
            case 'blur': return <ShapeBlur />;
            case 'cubes': return <Cubes />;
            default: return <MagneticLines />;
        }
    };
    
    return (
        <div className="app-page active relaxation-view">
             <header className="page-header">
                <h1>Relaxation Center</h1>
                <p className="lead">Interactive experiences to calm your mind.</p>
            </header>
            <div className="relaxation-staggered-menu">
                {['lines', 'blur', 'cubes'].map((item, i) => (
                     <motion.button 
                        key={item}
                        className={`btn ${activeTab === item ? 'active' : ''}`}
                        onClick={() => setActiveTab(item)}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                     >
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                     </motion.button>
                ))}
            </div>
            <div className="relaxation-content">
                {renderContent()}
            </div>
        </div>
    );
}


// ---------- Main App Component ----------
export default function App() {
  const [view, setView] = useLocalStorage('app_view', 'dashboard');
  const [theme, setTheme] = useLocalStorage('theme', 'dark');
  const [moodData] = useLocalStorage('mood_data', [8, 8, 8, 8, 8, 8, 8]);
  const playNavSound = useSound('https://www.soundjay.com/buttons/sounds/button-7.mp3');

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);
  
  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };
  
  const handleNavigate = (newView) => {
      setView(newView);
      playNavSound();
  }
  
  const calculateAverageMood = () => (moodData.reduce((a, b) => a + b, 0) / moodData.length);

  const renderView = () => {
    switch(view) {
      case 'tracker':
        return <MoodTrackerView />;
      case 'pomodoro':
        return <PomodoroView />;
      case 'relax':
        return <RelaxationView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <ClickSpark>
        <div className="app" role="application">
        {view === 'dashboard' &&
            <Header 
            moodScore={calculateAverageMood()}
            onToggleTheme={handleToggleTheme}
            theme={theme}
            />
        }
        <AnimatePresence mode="wait">
             <motion.div
                key={view}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
             >
                {renderView()}
             </motion.div>
        </AnimatePresence>
        
        <Dock>
            <DockItem onClick={() => handleNavigate('dashboard')}>🏠</DockItem>
            <DockItem onClick={() => handleNavigate('pomodoro')}>🍅</DockItem>
            <DockItem onClick={() => handleNavigate('tracker')}>🪴</DockItem>
            <DockItem onClick={() => handleNavigate('relax')}>✨</DockItem>
        </Dock>
        </div>
    </ClickSpark>
  );
}
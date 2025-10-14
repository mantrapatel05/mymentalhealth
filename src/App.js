import React, { useState, useEffect, useRef, useCallback, createContext, useContext, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

// --- GSAP Imports for the ScrambledText Component ---
import { gsap } from 'gsap';
import { SplitText } from 'gsap/dist/SplitText'; 
import { ScrambleTextPlugin } from 'gsap/dist/ScrambleTextPlugin';
// Register plugins once at the top level
gsap.registerPlugin(SplitText, ScrambleTextPlugin);
// --------------------------------------------------

// -----------------------------------------------------------
// ---------- REACTBITS.DEV COMPONENTS & UTILS START ---------
// -----------------------------------------------------------

// --- ClickSpark ---
const ClickSpark = ({ children }) => {
    const [sparks, setSparks] = useState([]);
    const sparkRef = useRef(null);

    const createSpark = useCallback((e) => {
        // Only trigger sparks on interactive elements
        if (!e.target.closest('button, a, .dock-item, .mood-option-btn')) return;

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
        <div ref={sparkRef} onClick={createSpark} onMouseDown={createSpark} style={{ width: '100%', height: '100%' }}>
            {sparks.map((spark) => (
                <motion.div
                    key={spark.id}
                    className="spark"
                    style={{
                        position: 'fixed',
                        top: spark.y,
                        left: spark.x,
                        backgroundColor: spark.color,
                        pointerEvents: 'none', 
                        zIndex: 9999,
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

    return (
        <DockContext.Provider value={{ hovered }}>
            <motion.div
                ref={ref}
                className="dock"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {children}
            </motion.div>
        </DockContext.Provider>
    );
};

const DockItem = ({ children, onClick }) => {
    const ref = useRef(null);
    const { hovered } = useDock();
    const [xOffset, setXOffset] = useState(0);
    const [scale, setScale] = useState(1);
    
    const handleMouseMove = useCallback((e) => {
        if (!ref.current || !hovered) return;

        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const distance = e.clientX - centerX;

        const maxDistance = 100;
        const normalizedDistance = Math.min(Math.abs(distance), maxDistance) / maxDistance;
        const newScale = 1 + (1 - normalizedDistance) * 0.5;
        
        const newX = (distance / (rect.width * 2)) * 10;
        
        setScale(newScale);
        setXOffset(newX);
    }, [hovered]);

    useEffect(() => {
        if (!hovered) {
            setScale(1);
            setXOffset(0);
        }
    }, [hovered]);

    useEffect(() => {
        if (hovered) {
            document.addEventListener('mousemove', handleMouseMove);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
        }
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, [hovered, handleMouseMove]);


    return (
        <motion.div
            ref={ref}
            className="dock-item"
            onClick={onClick}
            animate={{ scale, x: xOffset }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
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
                {React.Children.map(children, (child, index) => (
                    <motion.div
                        key={child?.key || index} 
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
    const displayValue = value.toString();
    return (
        <div className="counter-container">
            <AnimatePresence mode="popLayout">
                {displayValue.split('').map((digit, i) => (
                    <motion.span
                        key={displayValue + i} 
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
    const ref = useRef(null);

    const handleMouseMove = (e) => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
    };

    return (
        <div ref={ref} className="bento-grid" onMouseMove={handleMouseMove} onMouseLeave={() => setMousePosition({x: null, y: null})}>
            <div
                className="bento-spotlight"
                style={{
                    // Use mouse position relative to the bento container
                    background: mousePosition.x !== null
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
        // Check if the relaxation view class is currently active on the <html> tag
        if (!document.documentElement.className.includes('relax-view-active')) return;

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
            if (document.body.contains(cursorEl)) {
                 cursorEl.remove();
            }
        };
    }, [document.documentElement.className]);
};


// -----------------------------------------------------------
// ---------- REACTBITS.DEV COMPONENTS & UTILS END ---------
// -----------------------------------------------------------


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
            console.error("Error reading localStorage key:", key, error);
            return initialValue;
        }
    });

    const setValue = value => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error("Error writing to localStorage key:", key, error);
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
        { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
    ];
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500)); 
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
        if (audioRef.current) {
            // Stop and rewind before playing to handle rapid clicks
            audioRef.current.pause();
            // FIX: Corrected the variable name here from 'audio' to 'audioRef.current'
            audioRef.current.currentTime = 0; 
            audioRef.current.play().catch(err => console.error("Audio play failed (user gesture required):", err));
        }
    }, []);

    return play;
};


// ---------- UI Components START ----------

function Header({ moodScore, onToggleTheme, theme }) {
    const score = parseFloat(moodScore).toFixed(1);
    let scoreClass = '';
    if (score <= 4) scoreClass = 'mood-score-low';
    else if (score <= 7) scoreClass = 'mood-score-medium';
    else scoreClass = 'mood-score-high';

    return (
        <header id="dashboardHeader">
            <div className="brand">
                <div>
                    <h1>My Mental Health</h1>
                    <p className="lead">Daily mental health tracker</p>
                </div>
            </div>
            <div className="dashboard-controls">
                <div className="dashboard-header-mood-group">
                    <div className="dashboard-flex-row-with-toggle">
                        <button title="Toggle Dark/Light Mode" className="theme-toggle-btn" onClick={onToggleTheme}>
                            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                        </button>
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
            </div>
            <div className="carousel-container-reactbits">
                {loading || quotes.length === 0 ? <div className="loading-card">Loading quotes...</div> : (
                    <AnimatePresence initial={false} mode="wait">
                        <motion.div
                            key={index}
                            className="carousel-card-reactbits"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Placeholder image (optimized for light/dark contrast) */}
                            <img 
                                src={`https://placehold.co/600x400/363636/ffffff?text=${KEYWORDS[index % KEYWORDS.length].toUpperCase()}`} 
                                alt={KEYWORDS[index % KEYWORDS.length]} 
                                className="quote-image"
                            />
                            <blockquote>“{quotes[index].text}”</blockquote>
                            <cite>— {quotes[index].author}</cite>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
            <div>
                    <button className="btn control-btn" onClick={handlePrev} aria-label="Previous">◀</button>
                    <button className="btn control-btn" onClick={handleNext} aria-label="Next">▶</button>
                </div>
        </section>
    );
}

function TodoList() {
    const [todos, setTodos] = useLocalStorage('todos', INITIAL_TODOS);
    const [inputText, setInputText] = useState('');
    // Switched to a sound URL that works
    const playAddSound = useSound('https://www.soundjay.com/misc/sounds/pebble.mp3', 0.2); 
    const playCompleteSound = useSound('https://www.soundjay.com/applause/applause_2.wav', 0.2);

    const handleAddTask = () => {
        if (!inputText.trim()) return;
        const newTodo = { id: Date.now(), text: inputText.trim(), completed: false };
        setTodos(prev => [...prev, newTodo]);
        setInputText('');
        playAddSound();
    };
    
    const handleToggle = (id) => {
        setTodos(prev => prev.map(t => {
            if (t.id === id) {
                if (!t.completed) playCompleteSound();
                return { ...t, completed: !t.completed };
            }
            return t;
        }));
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
                                <button className="complete-btn" onClick={() => handleToggle(todo.id)}>
                                    {todo.completed ? '✔' : '☐'}
                                </button>
                                <button className="delete-btn" onClick={() => handleDelete(todo.id)}>
                                    ✖
                                </button>
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

// Function to simulate the AI mood analysis API call
// This function mimics an external AI service (text2data) that converts mood text into a score.
const analyzeMoodWithAI = async (moodText, apiKey) => {
    // --------------------------------------------------------------------------
    // --- REAL API CALL (COMMENTED OUT FOR SIMULATION) ---
    // --------------------------------------------------------------------------
    /*
    // In a production app, the API Key should be secured.
    const response = await fetch('YOUR_TEXT2DATA_AI_ENDPOINT_URL', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // API Key used for Authorization/Authentication
            'Authorization': `Bearer ${apiKey}` 
        },
        body: JSON.stringify({ prompt: `Score the user's mood from 0 to 10 based on this text: "${moodText}"` })
    });
    const data = await response.json();
    const score = parseFloat(data.score); // Assuming the AI returns a 'score' field
    return isNaN(score) ? 5 : Math.max(0, Math.min(10, score));
    */
    // --------------------------------------------------------------------------

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // SIMULATION LOGIC: calculates a score based on keywords.
    const lowerText = moodText.toLowerCase();
    let score = 5; 

    if (lowerText.includes('great') || lowerText.includes('happy') || lowerText.includes('excellent')) {
        score = Math.min(10, 8 + Math.random() * 2);
    } else if (lowerText.includes('good') || lowerText.includes('okay') || lowerText.includes('steady')) {
        score = 6 + Math.random() * 2;
    } else if (lowerText.includes('sad') || lowerText.includes('bad') || lowerText.includes('tired') || lowerText.includes('low')) {
        score = Math.max(0, 2 + Math.random() * 3);
    } else if (lowerText.includes('anxious') || lowerText.includes('stressed') || lowerText.includes('overwhelmed')) {
        score = Math.max(0, 1 + Math.random() * 3);
    } else {
        score = 4 + Math.random() * 3;
    }

    return parseFloat(score.toFixed(1));
};

function MoodTrackerView() {
    // API KEY INTEGRATION: Define the key here and pass it securely to the function.
    const AI_API_KEY = '8A39D368-BBA5-492B-9C49-F75687CA5EE2';

    const [moodData, setMoodData] = useLocalStorage('mood_data', [8, 8, 8, 8, 8, 8, 8]);
    const [isLoggedToday, setIsLoggedToday] = useState(false);
    const [moodInput, setMoodInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showMethods, setShowMethods] = useState(null);
    const playLogSound = useSound('https://www.soundjay.com/buttons/sounds/button-1.mp3', 0.2);

    // Calculate Average Mood Score
    const avgScore = (moodData.reduce((a, b) => a + b, 0) / moodData.length).toFixed(1);
    const progressPct = (avgScore / 10) * 100;
    
    const handleLogMood = (score) => {
        if (isLoggedToday) return;

        setMoodData(prev => [...prev.slice(1), score]);
        setIsLoggedToday(true);
        playLogSound();
        
        setShowMethods({
            score,
            methods: score <= 5 ? LOW_MOOD_METHODS.slice(0, 3) : HIGH_MOOD_METHODS.slice(0, 3),
            completed: []
        });
    };
    
    // UPDATED: handleAnalyzeAndLogMood now passes the AI_API_KEY
    const handleAnalyzeAndLogMood = async () => {
        if (!moodInput.trim() || isLoggedToday || loading) return;

        setLoading(true);
        try {
            // Pass the API key to the analysis function
            const score = await analyzeMoodWithAI(moodInput, AI_API_KEY);
            
            handleLogMood(score); 
        } catch (error) {
            console.error("AI Mood Analysis Failed:", error);
            handleLogMood(5);
        } finally {
            setLoading(false);
        }
    };
    
    const handleCompleteMethod = (methodText) => {
        if (showMethods.completed.includes(methodText)) return;
        
        setMoodData(prev => {
            const newData = [...prev];
            const lastIndex = newData.length - 1;
            newData[lastIndex] = Math.min(10, newData[lastIndex] + 0.3);
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
                <section className="chart-panel panel">
                    <h2>Weekly Mood Summary</h2>
                    <div className="donut-chart" style={{ 
                        background: `conic-gradient(var(--progress-color) ${progressPct}%, var(--bg-secondary) ${progressPct}%)` 
                    }}>
                        <div className="donut-inner">
                            <span>{avgScore}</span>
                            <span>Avg Mood Score</span>
                        </div>
                    </div>
                    <div className="small" style={{ marginTop: '15px' }}>Last 7 entries.</div>
                </section>
                <section className="question-panel panel">
                    <h2>Log Your Mood</h2>
                    <div className="mood-question-card">
                        <div>
                            <div className="question">Describe your current mood in one sentence:</div>
                            <div className="small">{isLoggedToday ? 'Mood logged! Try a quick boost.' : 'AI will analyze your text and score your mood (0-10).'}</div>
                        </div>
                        <div className="mood-input-group" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <input
                                type="text"
                                className="todo-input"
                                placeholder="E.g., I'm feeling great and productive today!"
                                value={moodInput}
                                onChange={(e) => setMoodInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeAndLogMood()}
                                disabled={isLoggedToday || loading}
                            />
                            <button 
                                className="btn pomo-btn primary" 
                                onClick={handleAnalyzeAndLogMood} 
                                disabled={!moodInput.trim() || isLoggedToday || loading}
                                style={{ minWidth: '100px' }}
                            >
                                {loading ? 'Analyzing...' : 'Log Mood'}
                            </button>
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
    const [settings] = useState({ work: 25, short: 5, long: 15, sessions: 4 });
    const [mode, setMode] = useState('work');
    const [isActive, setIsActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(settings.work * 60);
    const [sessionCount, setSessionCount] = useState(0);
    const [history, setHistory] = useState([]);
    
    const timerRef = useRef(null);
    const totalDuration = (mode === 'work' ? settings.work : mode === 'short' ? settings.short : settings.long) * 60;
    const playBell = useSound('https://www.soundjay.com/bell-sounds/bell-ring-03.mp3', 0.5); 
    
    const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
    
    const resetTimer = useCallback((newMode = 'work', newSettings = settings) => {
        setIsActive(false);
        setMode(newMode);
        if (newMode === 'work') setTimeRemaining(newSettings.work * 60);
        else if (newMode === 'short') setTimeRemaining(newSettings.short * 60);
        else setTimeRemaining(newSettings.long * 60);
    }, [settings]);
    
    const nextMode = useCallback(() => {
        playBell();
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
    }, [mode, sessionCount, settings, resetTimer, totalDuration, playBell]);

    useEffect(() => {
        if (isActive) {
            timerRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current); // Clear current interval before calling next mode
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
                <div className="pomo-panel timer-card panel">
                    <div className="title">Dedicated Focus Timer</div>
                    <div className="pomo-counter-wrapper">
                        <Counter value={formatTime(timeRemaining)} />
                    </div>
                    <div className="mode">{mode === 'work' ? 'Work' : (mode === 'short' ? 'Short Break' : 'Long Break')}</div>
                    <div className="pomo-controls-group">
                        <button className="pomo-btn primary" onClick={() => setIsActive(!isActive)}>{isActive ? 'Pause' : 'Start'}</button>
                        <button className="pomo-btn" onClick={() => { resetTimer(); setSessionCount(0); setHistory([]); }}>Reset</button>
                        <button className="pomo-btn" onClick={() => { clearInterval(timerRef.current); nextMode(); }}>Skip</button>
                    </div>
                </div>
                <div className="pomo-panel pomo-sessions-history panel">
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

// -----------------------------------------------------------
// --- MagneticLines Component (Magnet Lines Effect) ---
// -----------------------------------------------------------
const MagneticLines = () => {
    // PARAMETERS
    const GRID_SIZE = 30; 
    const SEGMENT_SIZE = 18; 
    const MAX_DISTANCE = 300; 
    
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // Pre-calculate the grid layout on mount
    const gridPoints = useMemo(() => {
        const points = [];
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                points.push({
                    id: `${i}-${j}`,
                    x: (j / (GRID_SIZE - 1)) * 100, 
                    y: (i / (GRID_SIZE - 1)) * 100,
                });
            }
        }
        return points;
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setCursorPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    }, []);
    
    const calculateRotation = useCallback((pointXPct, pointYPct) => {
        if (!containerRef.current) return 0;

        const rect = containerRef.current.getBoundingClientRect();
        const pointX = (pointXPct / 100) * rect.width;
        const pointY = (pointYPct / 100) * rect.height;

        const dx = cursorPos.x - pointX;
        const dy = cursorPos.y - pointY;
        
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > MAX_DISTANCE) {
            return 0;
        }
        
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const influence = 1 - (distance / MAX_DISTANCE); 
        
        return angle * influence; 
        
    }, [cursorPos]);

    return (
        <div 
            ref={containerRef} 
            className="magnetic-lines-container" 
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setCursorPos({ x: 0, y: 0 })} 
        >
            <div className="grid-segments">
                {gridPoints.map(point => (
                    <motion.div
                        key={point.id}
                        className="line-segment"
                        style={{
                            width: `${SEGMENT_SIZE}px`,
                            height: `2px`,
                            left: `${point.x}%`,
                            top: `${point.y}%`,
                            transform: `translate(-50%, -50%) rotate(${calculateRotation(point.x, point.y)}deg)`,
                            opacity: 1, 
                        }}
                        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                    />
                ))}
            </div>
        </div>
    );
};
// -----------------------------------------------------------
// --- END MagneticLines Component ---
// -----------------------------------------------------------


// -----------------------------------------------------------
// --- ShapeBlur Component (Defined in place for proper order) ---
// -----------------------------------------------------------
function ShapeBlur() {
    return (
        <div className="shape-blur-container">
            <motion.div 
                className="shape-blur-1"
                animate={{ 
                    x: ['0%', '100%', '0%'], 
                    y: ['0%', '100%', '0%'],
                    scale: [1, 1.2, 0.8, 1],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
                className="shape-blur-2"
                animate={{ 
                    x: ['100%', '0%', '100%'], 
                    y: ['0%', '50%', '0%'],
                    scale: [0.8, 1.1, 1],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
                className="shape-blur-3"
                animate={{ 
                    x: ['0%', '100%', '0%'], 
                    y: ['50%', '0%', '50%'],
                    scale: [1.1, 0.9, 1.1],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="shape-blur-text">Breathe in, breathe out.</div>
        </div>
    );
}

// -----------------------------------------------------------
// --- Optimized ScrambledText Component (Final Version) ---
// -----------------------------------------------------------
const ScrambledText = ({ 
    children, 
    radius = 50, 
    duration = 0.5, 
    speed = 0.5,    
    scrambleChars = '.:;', 
}) => {
    const rootRef = useRef(null);
    const charsRef = useRef([]);
    const splitRef = useRef(null); 
    const scrambleTweensRef = useRef([]); 

    useEffect(() => {
        if (!rootRef.current) return;

        // Cleanup previous instances 
        if (splitRef.current) splitRef.current.revert();
        gsap.killTweensOf(scrambleTweensRef.current);

        // 1. Split the text into individual characters
        // NOTE: The SplitText plugin targets the text content inside the <p> tag.
        splitRef.current = SplitText.create(rootRef.current.querySelector('p'), {
            type: 'chars',
            charsClass: 'char'
        });
        const chars = splitRef.current.chars;
        charsRef.current = chars;
        scrambleTweensRef.current = [];

        // 2. Create the permanent scramble loop for each character
        chars.forEach(c => {
            gsap.set(c, { 
                display: 'inline-block',
                attr: { 'data-content': c.innerHTML } 
            });
            
            // Create a permanent, paused scramble tween
            const tween = gsap.to(c, {
                scrambleText: {
                    text: '::', // Scramble constantly
                    chars: scrambleChars,
                    speed: speed,
                    // *** CRITICAL FIX: The revealText must be the original content
                    revealText: c.dataset.content || '', 
                    tweenLength: false 
                },
                duration: duration, 
                timeScale: 0, // Start paused
                paused: true,
                ease: 'none',
            });
            scrambleTweensRef.current.push(tween);
        });

        // 3. Optimized mouse movement handler
        const handleMove = e => {
            window.requestAnimationFrame(() => {
                chars.forEach((c, index) => {
                    const { left, top, width, height } = c.getBoundingClientRect();
                    const dx = e.clientX - (left + width / 2);
                    const dy = e.clientY - (top + height / 2);
                    const dist = Math.hypot(dx, dy);

                    const influence = 1 - Math.min(dist, radius) / radius;
                    const tween = scrambleTweensRef.current[index];

                    if (influence > 0) {
                        tween.timeScale(influence * 1.5); 
                        tween.progress(1 - influence);  
                        tween.play();

                        gsap.to(c, { opacity: 0.5 + 0.5 * influence, duration: 0.1, overwrite: true });
                    } else {
                        if (tween.isActive() || tween.progress() !== 0) {
                            gsap.to(tween, { 
                                progress: 0, 
                                duration: duration * 0.5,
                                onComplete: () => { tween.pause(); }, 
                                ease: 'power1.out'
                            });
                            gsap.to(c, { opacity: 1, duration: 0.2, overwrite: true });
                        }
                    }
                });
            });
        };

        const el = rootRef.current;
        el.addEventListener('pointermove', handleMove);

        // 4. Cleanup function
        return () => {
            el.removeEventListener('pointermove', handleMove);
            if (splitRef.current) splitRef.current.revert();
            gsap.killTweensOf(scrambleTweensRef.current); 
        };
    }, [radius, duration, speed, scrambleChars]); 

    return (
        <div ref={rootRef} className="scrambled-text-container">
            <p>{children}</p>
        </div>
    );
};
// -----------------------------------------------------------
// --- END ScrambledText Component ---
// -----------------------------------------------------------


function RelaxationView({ view }) {
    // Only activate custom cursor when this view is active
    useEffect(() => {
        // Add the relax-view-active class to the root HTML element
        document.documentElement.className += ' relax-view-active';
        return () => {
             // Clean up the class when component unmounts
             document.documentElement.className = document.documentElement.className.replace(' relax-view-active', '').trim();
        }
    }, [view]);

    useSplashCursor(); // Activates the splash cursor logic
    const [activeTab, setActiveTab] = useState('text'); // Default to the new text feature
    
    const renderContent = () => {
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="relaxation-tab-content"
                >
                    {activeTab === 'lines' && <MagneticLines />}
                    {activeTab === 'blur' && <ShapeBlur />}
                    {/* Render the GSAP ScrambledText component with adjusted subtle settings */}
                    {activeTab === 'text' && 
                        <ScrambledText 
                            // Settings adjusted for a very localized, subtle, and smooth hover effect:
                            radius={50} // Very small radius = less text affected
                            duration={1.0} // Slower transition into/out of scramble
                            //  speed={0.05} // Slower scramble speed for less chaos
                            scrambleChars={':'} // Simple scramble characters
                        >
                            The purpose of mindfulness is not to stop thinking, but to stop worrying about what you think. Let your thoughts flow like a river, observing them without judgment. With every deep breath, release tension and find the quiet clarity that lies beneath the surface of your busy day. The present moment is your anchor.
                        </ScrambledText>
                    }
                </motion.div>
            </AnimatePresence>
        );
    };
    
    return (
        <div className="app-page active relaxation-view">
             <header className="page-header">
                <h1>Relaxation Center</h1>
                <p className="lead">Interactive experiences to calm your mind.</p>
            </header>
            <div className="relaxation-staggered-menu">
                {['lines', 'blur', 'text'].map((item, i) => (
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
    const playNavSound = useSound('https://www.soundjay.com/buttons/sounds/button-7.mp3', 0.1);

    // CORE THEME LOGIC: Applies 'dark' or 'light' class to the <html> element
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
                // Pass view prop to RelaxationView to manage body class for cursor
                return <RelaxationView view={view} />; 
            default:
                return <DashboardView />;
        }
    };

    return (
        <>
        <style>{`
            /* ----------------------------------------------------------- */
            /* --- 1. Global Variables: Theme Definition --- */
            /* ----------------------------------------------------------- */

            /* Light Mode Defaults (:root sets the initial state) */
            :root {
                --font-family: 'Inter', sans-serif;
                
                /* General Colors */
                --bg-primary: #ffffff; 
                --bg-secondary: #f7f7f7; 
                --text-primary: #111111; 
                --text-secondary: #666666;
                --border-color: #e0e0e0;
                --progress-color: #34d399; /* Green for mood tracker */

                /* Card/UI Elements */
                --card-shadow: 0 8px 15px rgba(0, 0, 0, 0.05);
                --input-bg: #ffffff;
                --btn-bg: #eeeeee;
                --btn-hover-bg: #dddddd;

                /* Dock */
                --dock-bg: rgba(255, 255, 255, 0.8);
                --dock-border: 1px solid rgba(0, 0, 0, 0.1);

                /* Relaxation View */
                --bento-spotlight-color: rgba(0, 0, 0, 0.05);
                --relax-cube-color: #333333; /* kept cube color variable, now unused in favor of text */
                --relax-line-color: rgba(0, 0, 0, 0.1);
                --relax-shape-1: #ff7e5f;
                --relax-shape-2: #feb47b;
                --relax-shape-3: #ffc72c;
                --splash-color: rgba(0, 0, 0, 0.5);
            }

            /* Dark Mode Overrides (Applied when <html> has class="dark") */
            .dark {
                /* General Colors */
                --bg-primary: #121212; 
                --bg-secondary: #1e1e1e; 
                --text-primary: #ffffff; 
                --text-secondary: #aaaaaa;
                --border-color: #333333;
                --progress-color: #10b981; /* Slightly adjusted green for contrast */

                /* Card/UI Elements */
                --card-shadow: 0 8px 15px rgba(0, 0, 0, 0.3);
                --input-bg: #2a2a2a;
                --btn-bg: #333333;
                --btn-hover-bg: #444444;

                /* Dock */
                --dock-bg: rgba(30, 30, 30, 0.8);
                --dock-border: 1px solid rgba(255, 255, 255, 0.1);

                /* Relaxation View */
                --bento-spotlight-color: rgba(255, 255, 255, 0.05);
                --relax-cube-color: #ffffff; /* kept cube color variable, now unused in favor of text */
                --relax-line-color: rgba(255, 255, 255, 0.1);
                --relax-shape-1: #00bcd4;
                --relax-shape-2: #3f51b5;
                --relax-shape-3: #9c27b0;
                --splash-color: rgba(255, 255, 255, 0.5);
            }

            /* ----------------------------------------------------------- */
            /* --- 2. Base & Global Styles (Using Variables) --- */
            /* ----------------------------------------------------------- */

            * {
                box-sizing: border-box;
                /* Apply transition to all color-related properties */
                transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
            }

            body {
                background-color: var(--bg-primary);
                color: var(--text-primary);
                font-family: var(--font-family);
                margin: 0;
                padding: 0;
                min-height: 100vh;
                overflow-x: hidden;
            }

            #root, .app {
                display: flex;
                flex-direction: column;
                min-height: 100vh;
            }

            h1, h2, h3, strong {
                color: var(--text-primary);
            }

            p, .small, .lead, .muted {
                color: var(--text-secondary);
            }

            .panel {
                background-color: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 20px;
                box-shadow: var(--card-shadow);
                display: flex;
                flex-direction: column;
            }

            /* --- Buttons and Inputs --- */
            .btn, button {
                cursor: pointer;
                background-color: var(--btn-bg);
                color: var(--text-primary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 8px 15px;
                font-size: 14px;
                transition: all 0.2s ease;
            }
            .btn:hover, button:hover {
                background-color: var(--btn-hover-bg);
                border-color: var(--text-secondary);
                transform: translateY(-1px);
            }
            .theme-toggle-btn {
                padding: 6px 10px;
            }

            .todo-input, .todo-input-group input {
                flex-grow: 1;
                padding: 10px;
                border: 1px solid var(--border-color);
                border-radius: 8px;
                background-color: var(--input-bg);
                color: var(--text-primary);
                font-size: 16px;
                outline: none;
            }
            .todo-input:focus {
                border-color: var(--progress-color);
            }

            /* ----------------------------------------------------------- */
            /* --- 3. Layout: Header and Dock --- */
            /* ----------------------------------------------------------- */

            #dashboardHeader {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 40px;
                gap: 20px;
                margin-bottom: 20px;
                border-bottom: 1px solid var(--border-color);
            }
            .brand {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: var(--progress-color);
            }
            .dashboard-flex-row-with-toggle {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            .mood-score-link {
                display: flex;
                align-items: center;
                gap: 10px;
                border: 1px solid var(--border-color);
                padding: 8px 12px;
                border-radius: 12px;
                font-weight: bold;
                background-color: var(--bg-secondary);
            }
            .stat-score {
                font-size: 24px;
                line-height: 1;
            }
            .mood-score-low { color: #f87171; } /* Red */
            .mood-score-medium { color: #facc15; } /* Yellow */
            .mood-score-high { color: var(--progress-color); } /* Green */


            /* Dock Styling */
            .dock {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                padding: 10px;
                border-radius: 20px;
                gap: 5px;
                backdrop-filter: blur(10px);
                background: var(--dock-bg);
                border: var(--dock-border);
                box-shadow: var(--card-shadow);
                z-index: 100;
            }
            .dock-item {
                width: 50px;
                height: 50px;
                font-size: 28px;
                display: flex;
                justify-content: center;
                align-items: center;
                border-radius: 12px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .dock-item:hover {
                background-color: var(--btn-hover-bg);
            }

            /* ----------------------------------------------------------- */
            /* --- 4. Dashboard (Magic Bento) --- */
            /* ----------------------------------------------------------- */

            #dashboardMainContent {
                flex-grow: 1;
                padding: 0 40px 100px 40px; /* Add space for the fixed dock */
            }

            .bento-grid {
                position: relative;
                display: grid;
                grid-template-columns: 2fr 1.5fr;
                gap: 20px;
                padding: 10px;
                overflow: hidden;
                border-radius: 15px;
            }

            .bento-item {
                min-height: 350px;
                position: relative;
                overflow: hidden;
            }

            .bento-spotlight {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                transition: opacity 0.3s;
            }

            /* Quote Carousel */
            .carousel-wrap .controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            .carousel-container-reactbits {
                position: relative;
                flex-grow: 1;
                min-height: 250px;
            }
            .carousel-card-reactbits {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                padding: 20px;
            }
            .carousel-card-reactbits img {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                opacity: 0.15;
                z-index: 0;
                border-radius: 8px;
            }
            .carousel-card-reactbits blockquote {
                font-size: 1.5em;
                font-style: italic;
                margin: 10px 0;
                z-index: 1;
            }
            .carousel-card-reactbits cite {
                margin-top: 10px;
                font-style: normal;
                font-size: 0.9em;
                opacity: 0.7;
                z-index: 1;
            }
            .loading-card {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100%;
                color: var(--text-secondary);
            }

            /* Todo List */
            .todo-input-group {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            }
            .todo-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .todo-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid var(--border-color);
            }
            .todo-item:last-child {
                border-bottom: none;
            }
            .todo-item.completed span {
                text-decoration: line-through;
                opacity: 0.6;
            }
            .todo-actions button {
                margin-left: 8px;
                padding: 4px 8px;
                font-size: 12px;
                line-height: 1;
                min-width: 30px;
            }
            .complete-btn {
                color: var(--progress-color);
                background-color: transparent;
                border: none;
                font-weight: bold;
            }
            .delete-btn {
                color: #ef4444; /* Red */
                background-color: transparent;
                border: none;
            }

            /* ----------------------------------------------------------- */
            /* --- 5. Mood Tracker View --- */
            /* ----------------------------------------------------------- */

            .page-header {
                text-align: center;
                margin: 40px auto 30px auto;
                max-width: 600px;
            }
            .mood-grid {
                display: grid;
                grid-template-columns: 1fr 2fr;
                gap: 20px;
                padding: 20px 40px 100px 40px;
            }
            .chart-panel, .question-panel {
                padding: 25px;
            }

            /* Donut Chart */
            .donut-chart {
                width: 200px;
                height: 200px;
                border-radius: 50%;
                margin: 20px auto;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .donut-inner {
                width: 160px;
                height: 160px;
                background-color: var(--bg-primary);
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                font-weight: bold;
            }
            .donut-inner span:first-child {
                font-size: 2.5em;
                color: var(--progress-color);
            }
            .donut-inner span:last-child {
                font-size: 0.8em;
                color: var(--text-secondary);
            }

            /* Mood Question/Options */
            .mood-question-card {
                margin-top: 15px;
            }
            .question {
                font-size: 1.2em;
                font-weight: bold;
                margin-bottom: 15px;
            }
            .mood-options {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            .mood-option-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                background-color: var(--btn-hover-bg);
            }

            /* ----------------------------------------------------------- */
            /* --- 6. Pomodoro View --- */
            /* ----------------------------------------------------------- */

            .pomo-grid {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 20px;
                padding: 20px 40px 100px 40px;
            }
            .timer-card {
                text-align: center;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            .pomo-counter-wrapper {
                font-size: 5em;
                font-weight: 200;
                margin: 20px 0;
                letter-spacing: -2px;
                color: var(--progress-color);
                display: flex;
                justify-content: center;
                min-height: 100px;
            }
            .counter-container {
                display: flex;
                overflow: hidden;
                position: relative;
                line-height: 1;
                padding: 10px 0;
            }
            .counter-digit {
                display: inline-block;
                position: relative;
            }

            .pomo-controls-group {
                display: flex;
                gap: 15px;
                margin-top: 20px;
            }
            .pomo-btn.primary {
                background-color: var(--progress-color);
                color: white; /* Always white text on primary color */
                border-color: var(--progress-color);
                font-weight: bold;
            }
            .pomo-btn.primary:hover {
                background-color: #2bbd7f; /* Slightly darker green */
            }
            .sessions-list-container {
                margin-top: 15px;
                max-height: 300px;
                overflow-y: auto;
            }
            .session-item {
                padding: 8px 0;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .session-item:last-child {
                border-bottom: none;
            }
            .tiny { font-size: 0.75em; }

            /* ----------------------------------------------------------- */
            /* --- 7. Relaxation View & Reactbits Visuals --- */
            /* ----------------------------------------------------------- */

            .relaxation-view {
                padding-bottom: 100px;
            }
            .relaxation-staggered-menu {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-bottom: 30px;
            }
            .relaxation-staggered-menu .btn.active {
                background-color: var(--progress-color);
                color: white;
                border-color: var(--progress-color);
            }
            .relaxation-content {
                min-height: 500px;
                border: 1px solid var(--border-color);
                border-radius: 12px;
                position: relative;
                overflow: hidden;
                margin: 0 40px;
                display: flex; /* Ensure content is contained */
                justify-content: center;
                align-items: center;
            }
            .relaxation-tab-content {
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
            }

            /* Magnetic Lines (Magnet Lines Effect) */
            .magnetic-lines-container {
                width: 100%;
                height: 100%;
                position: relative;
                cursor: crosshair;
            }
            .grid-segments {
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
            }
            .line-segment {
                position: absolute;
                background-color: var(--text-primary); /* The color of the line segment */
                /* Center the line based on its absolute position */
                transform-origin: center center; 
                border-radius: 1px;
            }

            /* Shape Blur */
            .shape-blur-container {
                width: 100%;
                height: 100%;
                position: relative;
                overflow: hidden;
            }
            .shape-blur-1, .shape-blur-2, .shape-blur-3 {
                position: absolute;
                width: 300px;
                height: 300px;
                border-radius: 50%;
                filter: blur(100px);
                opacity: 0.5;
            }
            .shape-blur-1 {
                background: var(--relax-shape-1);
                top: 10%;
                left: 10%;
            }
            .shape-blur-2 {
                background: var(--relax-shape-2);
                top: 50%;
                left: 70%;
            }
            .shape-blur-3 {
                background: var(--relax-shape-3);
                top: 70%;
                left: 30%;
            }
            .shape-blur-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 2em;
                font-weight: bold;
                z-index: 10;
            }

            /* Scrambled Text (Essential GSAP Styles) */
            .scrambled-text-container {
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: monospace;
                font-size: 1.5rem;
                line-height: 1.8;
                text-align: center;
                padding: 40px;
                cursor: default; /* Show default cursor over the text area */
                color: var(--text-primary);
            }
            .scrambled-text-container p {
                margin: 0; /* Override default p margin */
            }
            .scrambled-text-container .char {
                will-change: transform;
                display: inline-block; /* Crucial for SplitText to work */
                color: inherit;
            }


            /* Splash Cursor */
            .splash-cursor {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background-color: var(--splash-color);
                position: fixed;
                pointer-events: none;
                transform: translate(-50%, -50%);
                z-index: 999;
                transition: transform 0.1s ease-out;
            }
            /* Hide default cursor only when the relaxation view is active (but we've overridden it locally on .scrambled-text-container) */
            .dark.relax-view-active, .light.relax-view-active {
                 /* Setting cursor to default globally allows the individual element styles to take over */
            }

            .splash {
                position: fixed;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background-color: var(--splash-color);
                transform: translate(-50%, -50%);
                animation: splash-wave 0.6s ease-out;
                pointer-events: none;
                z-index: 999;
            }

            @keyframes splash-wave {
                0% {
                    transform: translate(-50%, -50%) scale(0.5);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(3);
                    opacity: 0;
                }
            }

            /* Click Spark (General) */
            .spark {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                z-index: 10000;
            }

            /* ----------------------------------------------------------- */
            /* --- 8. Media Queries (Responsiveness) --- */
            /* ----------------------------------------------------------- */

            @media (max-width: 1024px) {
                #dashboardHeader {
                    padding: 15px 20px;
                    flex-direction: column;
                    align-items: flex-start;
                }
                .dashboard-controls {
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                }
                .bento-grid, .mood-grid, .pomo-grid {
                    grid-template-columns: 1fr;
                    padding: 20px 20px 100px 20px;
                }
                .relaxation-content {
                    margin: 0 20px;
                }
                .mood-options {
                    flex-direction: column;
                }
                .scrambled-text-container {
                    font-size: 1rem;
                }
            }
        `}</style>

        <ClickSpark>
            <div className="app" role="application">
            {/* Header is only shown on the Dashboard for a cleaner look on sub-pages */}
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
        </>
    );
}
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  Activity, 
  ChevronRight, 
  X, 
  Wind, 
  Zap, 
  Brain, 
  History,
  FileText,
  ClipboardCheck,
  ShieldAlert,
  LifeBuoy,
  ExternalLink,
  Smile,
  Moon,
  Lock,
  ArrowRight,
  PenLine,
  MapPin,
  Beaker,
  Stethoscope,
  Users,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Star,
  ChevronLeft,
  AlertCircle,
  EyeOff,
  CloudRain,
  Target,
  BookOpen,
  CheckCircle,
  LineChart,
  Feather,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Compass
} from 'lucide-react';

// --- FIREBASE IMPORTS REMOVED (LOCAL MODE) ---
const appId = typeof (window as any).__app_id !== 'undefined' ? (window as any).__app_id : 'session-zero-app';

// --- MINIMALIST LOGO ---
const ZeroLogo = ({ size = 24 }: { size?: number }) => {
  const gradId = React.useMemo(() => `grad-${Math.random().toString(36).substr(2, 9)}`, []);
  
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-slate-700" />
      <path d="M50 20 C 30 50, 70 50, 50 80" stroke={`url(#${gradId})`} strokeWidth="6" strokeLinecap="round" />
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#5eead4" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const ICON_MAP: Record<string, React.ReactNode> = {
  'Wind': <Wind className="w-4 h-4" />,
  'Zap': <Zap className="w-4 h-4" />,
  'CloudRain': <CloudRain className="w-4 h-4" />,
  'EyeOff': <EyeOff className="w-4 h-4" />,
  'Target': <Target className="w-4 h-4" />,
  'ShieldAlert': <ShieldAlert className="w-4 h-4" />,
  'Moon': <Moon className="w-4 h-4" />,
  'Brain': <Brain className="w-4 h-4" />,
  'Smile': <Smile className="w-4 h-4" />,
  'Activity': <Activity className="w-4 h-4" />
};

// --- SCREENER DATA ---
const SCREENER_DATA: any = {
  phq9: { id: 'phq9', title: "PHQ-9 (Mood)", short: "Mood", questions: ["Little interest or pleasure in doing things?", "Feeling down, depressed, or hopeless?", "Trouble falling or staying asleep, or sleeping too much?", "Feeling tired or having little energy?", "Poor appetite or overeating?", "Feeling bad about yourself?", "Trouble concentrating?", "Moving or speaking slowly?", "Thoughts of self-harm?"], options: ["Not at all", "Several days", "More than half", "Nearly daily"], scoring: (t: number) => t <= 4 ? { label: "Minimal", color: "text-emerald-400", bg: "bg-emerald-500/10" } : t <= 9 ? { label: "Mild", color: "text-yellow-400", bg: "bg-yellow-500/10" } : t <= 14 ? { label: "Moderate", color: "text-orange-400", bg: "bg-orange-500/10" } : { label: "Severe", color: "text-red-400", bg: "bg-red-500/10" } },
  gad7: { id: 'gad7', title: "GAD-7 (Anxiety)", short: "Anxiety", questions: ["Feeling nervous, anxious or on edge?", "Not being able to stop or control worrying?", "Worrying too much about different things?", "Trouble relaxing?", "Being so restless that it is hard to sit still?", "Becoming easily annoyed or irritable?", "Feeling afraid as if something awful might happen?"], options: ["Not at all", "Several days", "More than half", "Nearly daily"], scoring: (t: number) => t <= 4 ? { label: "Minimal", color: "text-emerald-400", bg: "bg-emerald-500/10" } : t <= 9 ? { label: "Mild", color: "text-yellow-400", bg: "bg-yellow-500/10" } : t <= 14 ? { label: "Moderate", color: "text-orange-400", bg: "bg-orange-500/10" } : { label: "Severe", color: "text-red-400", bg: "bg-red-500/10" } },
  mdq: { id: 'mdq', title: "MDQ (Bipolar)", short: "Bipolar", questions: ["Felt so good or hyper that people thought you were not your normal self?", "So irritable that you shouted at people or started fights?", "Felt much more self-confident than usual?", "Got much less sleep than usual and didn't miss it?", "Much more talkative or spoke much faster than usual?", "Thoughts raced through your head or you couldn't slow your mind down?", "So easily distracted by things around you that you had trouble staying on track?", "Had much more energy than usual?", "Were much more active or did many more things than usual?", "Were much more social or outgoing than usual?", "Much more interested in sex than usual?", "Did things that were unusual for you or that others might have thought were excessive, foolish, or risky?", "Spending money got you or your family into trouble?"], options: ["No", "Yes"], scoring: (t: number) => t >= 7 ? { label: "Positive Screen", color: "text-orange-400", bg: "bg-orange-500/10" } : { label: "Negative Screen", color: "text-emerald-400", bg: "bg-emerald-500/10" } },
  ptsd: { id: 'ptsd', title: "PC-PTSD-5 (Trauma)", short: "PTSD", questions: ["Have you had nightmares about the event(s) or thought about the event(s) when you did not want to?", "Tried hard not to think about the event(s) or went out of your way to avoid situations that reminded you of the event(s)?", "Been constantly on guard, watchful, or easily startled?", "Felt numb or detached from people, activities, or your surroundings?", "Felt guilty or unable to stop blaming yourself or others for the event(s) or any problems the event(s) may have caused?"], options: ["No", "Yes"], scoring: (t: number) => t >= 3 ? { label: "Positive Screen", color: "text-orange-400", bg: "bg-orange-500/10" } : { label: "Negative Screen", color: "text-emerald-400", bg: "bg-emerald-500/10" } },
  audit: { id: 'audit', title: "AUDIT-C (Alcohol)", short: "Alcohol", questions: ["How often do you have a drink containing alcohol?", "How many drinks containing alcohol do you have on a typical day when you are drinking?", "How often do you have six or more drinks on one occasion?"], options: ["Never / 1-2", "Monthly or less / 3-4", "2-4 times month / 5-6", "2-3 times week / 7-9", "4+ times week / 10+"], scoring: (t: number) => t >= 4 ? { label: "Positive Screen", color: "text-orange-400", bg: "bg-orange-500/10" } : { label: "Low Risk", color: "text-emerald-400", bg: "bg-emerald-500/10" } },
  dast: { id: 'dast', title: "DAST-10 (Substance)", short: "Substances", questions: ["Have you used drugs other than those required for medical reasons?", "Do you abuse more than one drug at a time?", "Are you always able to stop using drugs when you want to?", "Have you had 'blackouts' or 'flashbacks' as a result of drug use?", "Do you ever feel bad or guilty about your drug use?", "Does your spouse (or parents) ever complain about your involvement with drugs?", "Have you neglected your family because of your use of drugs?", "Have you engaged in illegal activities in order to obtain drugs?", "Have you ever experienced withdrawal symptoms when you stopped taking drugs?", "Have you had medical problems as a result of your drug use?"], options: ["No", "Yes"], scoring: (t: number) => t === 0 ? { label: "None", color: "text-emerald-400", bg: "bg-emerald-500/10" } : t <= 2 ? { label: "Low", color: "text-yellow-400", bg: "bg-yellow-500/10" } : t <= 5 ? { label: "Intermediate", color: "text-orange-400", bg: "bg-orange-500/10" } : { label: "Substantial", color: "text-red-400", bg: "bg-red-500/10" } }
};

// --- SELF-CARE LAB DATA ---
const LAB_SKILLS = [
  { id: 'anxiety', symptom: "Anxiety / Racing Thoughts", iconId: 'Wind', skills: [
    { id: '54321', name: "5-4-3-2-1 Grounding", type: "Sensory", desc: "Identify 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste. Connects you back to the present moment." },
    { id: 'box-breath', name: "Box Breathing", type: "Physiological", desc: "Inhale 4s, Hold 4s, Exhale 4s, Hold 4s. Used by Navy SEALs to lower heart rate rapidly." },
    { id: 'worry-time', name: "Scheduled Worry Time", type: "Cognitive", desc: "If a worry arises, write it down and save it for a dedicated 15-minute 'worry block' later today." },
    { id: '333-rule', name: "The 3-3-3 Rule", type: "Cognitive", desc: "Name 3 things you see, 3 sounds you hear, and move 3 parts of your body." },
    { id: 'worry-script', name: "Worry Scripting", type: "Cognitive", desc: "Write down your worst-case scenario and read it back until the anxiety around it decreases." }
  ] },
  { id: 'depressive', symptom: "Low Energy / Depression", iconId: 'Zap', skills: [
    { id: 'be-act', name: "Behavioral Activation", type: "Action", desc: "Pick one 5-minute task and do it now regardless of motivation." },
    { id: 'opp-act', name: "Opposite Action", type: "DBT", desc: "If you feel like withdrawing, send one text. If you feel like staying in bed, sit up for 2 minutes." },
    { id: 'sunlight', name: "Circadian Reset", type: "Biological", desc: "Get 10 minutes of natural light in your eyes as soon as possible after waking." },
    { id: 'values-check', name: "Values Check-in", type: "Cognitive", desc: "Identify one core value (e.g., creativity, kindness) and do one tiny action aligned with it today." },
    { id: 'compassion', name: "Self-Compassion Break", type: "Mindfulness", desc: "Place a hand on your heart and acknowledge that this is a difficult moment without judging yourself." }
  ] },
  { id: 'dissociation', symptom: "Dissociation / Numbness", iconId: 'CloudRain', skills: [
    { id: 'temp-shock', name: "Temperature Shock", type: "Somatic", desc: "Hold an ice cube or splash freezing water on your face. The intense sensation forces the brain back into the body." },
    { id: 'weight-blanket', name: "Proprioceptive Input", type: "Somatic", desc: "Use a weighted blanket or push hard against a wall. Feeling the resistance helps define your physical boundaries." },
    { id: 'name-color', name: "Category Search", type: "Cognitive", desc: "Scan the room and name every blue object you see. This engages the logical brain over the detached state." },
    { id: 'strong-scents', name: "Olfactory Shock", type: "Sensory", desc: "Smell something strong like peppermint oil, coffee beans, or a citrus peel to ground you." },
    { id: 'texture-focus', name: "Texture Focus", type: "Sensory", desc: "Find an object with a distinct texture (like a rough stone or soft fabric) and focus entirely on how it feels." }
  ] },
  { id: 'intrusive', symptom: "Intrusive Thoughts / OCD", iconId: 'EyeOff', skills: [
    { id: 'labeling', name: "Mental Labeling", type: "Cognitive", desc: "Instead of fighting the thought, label it: 'I am having the thought that I am unsafe.' This creates distance (defusion)." },
    { id: 'leaves-stream', name: "Leaves on a Stream", type: "Visualization", desc: "Visualize each intrusive thought as a leaf falling into a stream and floating away. Do not judge it; just watch it pass." },
    { id: 'delay', name: "The 5-Minute Rule", type: "Behavioral", desc: "If you feel an urge to perform a compulsion, wait exactly 5 minutes before doing it. Gradually increase the delay." },
    { id: 'silly-voice', name: "Silly Voices", type: "Defusion", desc: "Repeat the intrusive thought in your head using a ridiculous cartoon character's voice to strip away its power." },
    { id: 'thought-pass', name: "Cloud Watching", type: "Mindfulness", desc: "Imagine your thoughts are clouds passing in the sky. You don't have to follow them; just watch them pass." }
  ] },
  { id: 'executive', symptom: "ADHD / Paralysis", iconId: 'Target', skills: [
    { id: 'body-double', name: "Body Doubling", type: "Social", desc: "Call a friend or find a virtual room where others are working. The simple presence of another person helps sustain focus." },
    { id: 'pomodoro', name: "10/2 Sprints", type: "Time", desc: "Set a timer for 10 minutes of work and 2 minutes of rest. Tiny windows are less intimidating to the brain than open-ended blocks." },
    { id: 'junk-list', name: "Brain Dump", type: "Cognitive", desc: "Write every single task down on a 'junk list' first. Pick only one thing to move to a 'To-Do' list. Hide the rest." },
    { id: 'task-bracket', name: "Task Bracketing", type: "Behavioral", desc: "Pair a task you don't want to do with something highly rewarding immediately before and after." },
    { id: 'two-min-rule', name: "2-Minute Rule", type: "Action", desc: "If a task takes less than 2 minutes to complete, do it right now instead of putting it on a list." }
  ] },
  { id: 'panic', symptom: "Panic / Acute Distress", iconId: 'ShieldAlert', skills: [
    { id: 'physio-sigh', name: "Physiological Sigh", type: "Respiratory", desc: "Double inhale (quick second sniff) followed by a long, audible exhale. This offloads CO2 and calms the nervous system." },
    { id: 'tipp-muscle', name: "PMR (Muscle Release)", type: "Somatic", desc: "Squeeze your fists as hard as possible for 5 seconds, then release. Repeat with your shoulders and jaw." },
    { id: 'ice-dive', name: "Mammalian Dive Reflex", type: "Somatic", desc: "Submerge your face in a bowl of ice water for 15-30 seconds to instantly lower your heart rate." },
    { id: 'math-distract', name: "Complex Math", type: "Cognitive", desc: "Count backwards from 100 by 7s. This forces your prefrontal cortex to take over, overriding the panic response." }
  ] },
  { id: 'sleep', symptom: "Insomnia / Sleep Anxiety", iconId: 'Moon', skills: [
    { id: 'cog-shuf', name: "Cognitive Shuffling", type: "Cognitive", desc: "Think of a word like 'BED'. Visualize a 'B' (Bear), then 'E' (Eagle), then 'D' (Door). Repeat until asleep." },
    { id: 'stim-ctrl', name: "The 20-Min Rule", type: "Behavioral", desc: "If you can't sleep after 20 minutes, get out of bed. Do a boring task in low light. Return only when you feel sleepy." },
    { id: 'worry-journal', name: "Pre-Sleep Brain Dump", type: "Cognitive", desc: "Keep a journal by your bed. Write down everything on your mind to signal to your brain that it's 'stored' and doesn't need to be remembered right now." },
    { id: 'paradoxical', name: "Paradoxical Intention", type: "Behavioral", desc: "Lie in bed in the dark with your eyes open and gently try to stay awake. This removes the performance anxiety of 'trying' to sleep." },
    { id: 'body-scan-sleep', name: "Sleep Body Scan", type: "Somatic", desc: "Slowly direct your attention from your toes up to your head, consciously relaxing each muscle group as you go." }
  ] }
];

// --- CLINICAL THERAPIES DATA ---
const THERAPY_STYLES = [
  { id: 'cbt', name: "Cognitive Behavioral Therapy (CBT)", iconId: 'Brain', bestFor: "Anxiety, Depression, Phobias", desc: "A highly structured, goal-oriented approach focusing on identifying and changing negative thought patterns and behaviors.", expect: ["Structured, focused sessions", "Homework between sessions", "Focusing on the present, not just childhood"], technique: "Thought Records: Writing down a triggering event, the automatic negative thought you had, and actively finding evidence for and against that thought." },
  { id: 'dbt', name: "Dialectical Behavior Therapy (DBT)", iconId: 'Wind', bestFor: "Intense Emotions, Impulsivity, Conflict", desc: "Combines CBT with mindfulness. Focuses heavily on giving you specific skills to regulate emotions and tolerate extreme distress.", expect: ["Learning 4 specific skill modules", "Balancing acceptance and change", "Focus on reducing harmful behaviors"], technique: "Radical Acceptance: Acknowledging and fully accepting reality as it is in the present moment, without trying to fight or judge it." },
  { id: 'emdr', name: "EMDR", iconId: 'Zap', bestFor: "PTSD, Trauma, Panic", desc: "Eye Movement Desensitization and Reprocessing uses bilateral stimulation to help your brain reprocess 'stuck' traumatic memories.", expect: ["Less talking than traditional therapy", "Focus on physical sensations and images", "A highly structured 8-phase approach"], technique: "Bilateral Stimulation: You may be asked to follow the therapist's fingers with your eyes, or tap the left and right sides of your body while holding a specific memory." },
  { id: 'ba', name: "Behavioral Activation (BA)", iconId: 'Activity', bestFor: "Depression, Low Motivation, Apathy", desc: "A structured approach that focuses on increasing engagement in positive, meaningful activities to break the cycle of depression.", expect: ["Tracking daily activities", "Scheduling pleasant and mastery events", "Focusing on actions, not waiting for motivation"], technique: "Action Precedes Motivation: Completing a small, scheduled task (like a 5-minute walk) even when you don't feel like it, trusting that motivation will follow the action." },
  { id: 'act', name: "Acceptance & Commitment (ACT)", iconId: 'Target', bestFor: "Chronic Pain, OCD, General Anxiety", desc: "Focuses on accepting difficult feelings rather than trying to eliminate them, while committing to actions aligned with your core values.", expect: ["Lots of metaphors and visualizations", "Clarifying what truly matters to you", "Learning to coexist with anxiety"], technique: "Cognitive Defusion: Saying 'I am having the thought that I am a failure' instead of 'I am a failure' to create distance from the thought." },
  { id: 'somatic', name: "Somatic Experiencing", iconId: 'Smile', bestFor: "Trauma, Chronic Stress, Dissociation", desc: "A body-centric approach that helps release 'stuck' fight-or-flight energy in your nervous system. Healing from the bottom up.", expect: ["Slow pacing", "Frequent check-ins on physical sensations", "Releasing physical tension through movement"], technique: "Pendulation: Shifting your attention back and forth between a stressful physical sensation (like a tight chest) and a calming/neutral one (like your feet on the floor)." }
];

const TRACKERS = [
  { id: 'mood', label: 'Mood', icon: <Smile className="w-3 h-3" />, low: 'Heavy', high: 'Light' },
  { id: 'calmness', label: 'Calmness', icon: <Wind className="w-3 h-3" />, low: 'Tense', high: 'Still' },
  { id: 'sleep', label: 'Sleep', icon: <Moon className="w-3 h-3" />, low: 'Poor', high: 'Restful' },
  { id: 'energy', label: 'Energy', icon: <Zap className="w-3 h-3" />, low: 'Drained', high: 'Vibrant' }
];

const BREATHE_PHASES = [
  { text: 'Inhale', scale: 'scale-[1.5]', border: 'border-teal-400', bg: 'bg-teal-500/10', textCol: 'text-teal-400' },
  { text: 'Hold', scale: 'scale-[1.5]', border: 'border-indigo-400', bg: 'bg-indigo-500/10', textCol: 'text-indigo-400' },
  { text: 'Exhale', scale: 'scale-100', border: 'border-teal-400', bg: 'bg-teal-500/10', textCol: 'text-teal-400' },
  { text: 'Hold', scale: 'scale-100', border: 'border-slate-500', bg: 'bg-slate-500/10', textCol: 'text-slate-400' }
];

// --- PERSISTENCE HELPERS ---
const STORAGE_KEY = `session-zero-data-${appId}`;

const DEFAULT_DATA = {
  activeScreeners: { phq9: null, gad7: null, mdq: null, ptsd: null, audit: null, dast: null },
  tracking: { mood: 5, calmness: 5, sleep: 5, energy: 5 },
  history: [],
  journal: "",
  skillRatings: {},
  therapyRatings: {},
  stillStreak: 0,
  lastStillDate: null,
  currentPractice: null 
};

const loadLocalData = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error("Local load error", e);
    return null;
  }
};

const saveLocalData = (data: any) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Local save error", e);
  }
};

const App = () => {
  const [authUser, setAuthUser] = useState<any>({ uid: 'local-user' }); // Mock user for local mode
  const [view, setView] = useState('home'); 
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState('message'); // 'message' or 'logo'

  const [activeScreenerId, setActiveScreenerId] = useState<string | null>(null);
  const [screenerAnswers, setScreenerAnswers] = useState<number[]>([]);
  const [screenerLock, setScreenerLock] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);

  // Lab State
  const [labTab, setLabTab] = useState('self-care'); 
  const [labSelection, setLabSelection] = useState<any>(null);
  const [therapySelection, setTherapySelection] = useState<any>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Be Still State
  const [beStillMode, setBeStillMode] = useState('box'); 
  const [breatheTimeLeft, setBreatheTimeLeft] = useState(60); 
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathePhaseIndex, setBreathePhaseIndex] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [activeActivityItem, setActiveActivityItem] = useState<any>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Summary State
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [therapistSummary, setTherapistSummary] = useState<string | null>(null);

  // Core App Data
  const [data, setData] = useState<any>(DEFAULT_DATA);

  // --- OPENING SEQUENCE ---
  useEffect(() => {
    const timer1 = setTimeout(() => setLoadingPhase('logo'), 2000);
    const timer2 = setTimeout(() => setIsLoading(false), 3000);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  // --- LOCAL SYNC ---
  useEffect(() => {
    const savedData = loadLocalData();
    if (savedData) {
      setData((prev: any) => ({ ...prev, ...savedData }));
    }
  }, []);

  const updateData = (newData: any) => {
    setData(newData);
    saveLocalData(newData);
  };

  // --- TIMERS ---
  useEffect(() => {
    let interval: any = null;
    if (isBreathing && breatheTimeLeft > 0) {
      interval = setInterval(() => setBreatheTimeLeft(prev => prev - 1), 1000);
    } else if (isBreathing && breatheTimeLeft === 0) {
      handleCompleteStillSession();
    }
    return () => clearInterval(interval);
  }, [isBreathing, breatheTimeLeft]);

  useEffect(() => {
    let phaseInterval: any = null;
    if (isBreathing && beStillMode === 'box') {
      phaseInterval = setInterval(() => setBreathePhaseIndex(prev => (prev + 1) % 4), 4000);
    } else {
      setBreathePhaseIndex(0);
    }
    return () => clearInterval(phaseInterval);
  }, [isBreathing, beStillMode]);

  // --- HANDLERS ---
  const playSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play prevented", e));
  };

  const handleCompleteStillSession = () => {
    setIsBreathing(false);
    setIsSessionFinished(true);
    playSound();
    const today = new Date().toDateString();
    const isNewDay = data.lastStillDate !== today;
    updateData({
        ...data,
        stillStreak: isNewDay ? (data.stillStreak || 0) + 1 : data.stillStreak,
        lastStillDate: today,
        history: [{ id: Date.now(), date: new Date().toISOString(), type: 'be-still', mode: beStillMode, duration: selectedDuration }, ...data.history]
    });
  };

  const resetBeStill = () => {
    setIsBreathing(false);
    setIsSessionFinished(false);
    setBreatheTimeLeft(selectedDuration * 60);
    setBreathePhaseIndex(0);
  };

  const handleScreenerStep = (idx: number) => {
    if (screenerLock) return;
    setScreenerLock(true);
    setSelectedOptionIndex(idx);
    
    setTimeout(() => {
      const newAnswers = [...screenerAnswers, idx];
      if (newAnswers.length === SCREENER_DATA[activeScreenerId!].questions.length) {
        const total = newAnswers.reduce((acc, v) => acc + v, 0);
        updateData({
          ...data,
          activeScreeners: { ...data.activeScreeners, [activeScreenerId!]: total }
        });
        setActiveScreenerId(null);
        setScreenerAnswers([]);
      } else {
        setScreenerAnswers(newAnswers);
      }
      setSelectedOptionIndex(null);
      setScreenerLock(false);
    }, 250);
  };

  const generatePractice = (passedRatings = null, skillToSwapOut = null, passedHistory = null) => {
    const historyToUse = passedHistory || data.history;
    const checkins = historyToUse.filter((h: any) => h.type === 'check-in');
    if (checkins.length === 0) return;

    const currentRatings = passedRatings || data.skillRatings;
    
    const latest = checkins[0];
    const { mood, calmness, sleep } = latest.tracking;
    const journalText = (latest.journal || '').toLowerCase();

    let eligibleCategories: string[] = [];
    let reasons: Record<string, string> = {};

    // 1. Analyze Journal Text
    if (journalText.includes('panic') || journalText.includes('attack') || journalText.includes('breathe')) {
      eligibleCategories.push('panic');
      reasons['panic'] = "Because you mentioned panic or acute distress";
    }
    if (journalText.includes('numb') || journalText.includes('unreal') || journalText.includes('dissociat')) {
      eligibleCategories.push('dissociation');
      reasons['dissociation'] = "Because you noted feelings of numbness or detachment";
    }
    if (journalText.includes('intrusive') || journalText.includes('ocd') || journalText.includes('stuck')) {
      eligibleCategories.push('intrusive');
      reasons['intrusive'] = "To help manage the intrusive or stuck thoughts you reported";
    }
    if (journalText.includes('focus') || journalText.includes('adhd') || journalText.includes('distract')) {
      eligibleCategories.push('executive');
      reasons['executive'] = "To support the focus and executive challenges you mentioned";
    }

    // 2. Analyze Sliders and Screeners
    if (calmness <= 4 || (latest.screeners.gad7 && latest.screeners.gad7 >= 10) || journalText.includes('anxi')) {
      if (!eligibleCategories.includes('anxiety')) {
        eligibleCategories.push('anxiety');
        reasons['anxiety'] = "Because your check-in indicated elevated anxiety";
      }
    }
    if (mood <= 4 || (latest.screeners.phq9 && latest.screeners.phq9 >= 10) || journalText.includes('depress') || journalText.includes('sad')) {
      if (!eligibleCategories.includes('depressive')) {
        eligibleCategories.push('depressive');
        reasons['depressive'] = "Because your log indicated a lower mood or energy today";
      }
    }
    if (sleep <= 4 || journalText.includes('sleep') || journalText.includes('tired')) {
      if (!eligibleCategories.includes('sleep')) {
        eligibleCategories.push('sleep');
        reasons['sleep'] = "Because you reported difficulties with sleep or feeling tired";
      }
    }

    // 3. Fallback
    if (eligibleCategories.length === 0) {
      eligibleCategories.push('anxiety');
      reasons['anxiety'] = "A foundational self-care skill for your daily routine";
    }

    let pool: any[] = [];
    
    LAB_SKILLS.forEach(cat => {
      if (eligibleCategories.includes(cat.id)) {
        cat.skills.forEach(skill => {
          if (currentRatings[skill.id] !== 'not-helpful') {
            pool.push({ 
              ...skill, 
              iconId: cat.iconId, 
              categoryName: cat.symptom,
              reason: reasons[cat.id]
            });
          }
        });
      }
    });

    if (skillToSwapOut && data.currentPractice) {
      const keptSkills = data.currentPractice.skills.filter((s: any) => s.id !== skillToSwapOut);
      const availablePool = pool.filter(p => !keptSkills.some((ks: any) => ks.id === p.id));
      const newSkill = availablePool.length > 0 ? availablePool.sort(() => 0.5 - Math.random())[0] : null;
      const updatedSkills = data.currentPractice.skills.map((s: any) => 
        s.id === skillToSwapOut ? newSkill : s
      ).filter(Boolean);

      const newPractice = { ...data.currentPractice, skills: updatedSkills };
      updateData({ ...data, skillRatings: currentRatings, currentPractice: newPractice });
    } else {
      const chosenSkills = pool.sort(() => 0.5 - Math.random()).slice(0, 2);
      const primaryTarget = eligibleCategories[0];
      let preferredTherapyId = 'cbt'; 
      
      if (primaryTarget === 'depressive') preferredTherapyId = 'ba';
      else if (primaryTarget === 'panic') preferredTherapyId = 'emdr';
      else if (primaryTarget === 'dissociation') preferredTherapyId = 'somatic';
      else if (primaryTarget === 'intrusive') preferredTherapyId = 'act';
      else if (primaryTarget === 'executive') preferredTherapyId = 'dbt';
      
      let chosenTherapyRaw = THERAPY_STYLES.find(t => t.id === preferredTherapyId && currentRatings[t.id] !== 'not-helpful');
      if (!chosenTherapyRaw) {
        chosenTherapyRaw = THERAPY_STYLES.find(t => currentRatings[t.id] !== 'not-helpful') || THERAPY_STYLES[0];
      }

      const newPractice = {
        skills: chosenSkills,
        therapy: { ...chosenTherapyRaw },
        targetSymptom: primaryTarget,
        generatedAt: new Date().toDateString(),
        timestamp: Date.now() // Track precisely when this was generated
      };

      updateData({ ...data, history: historyToUse, skillRatings: currentRatings, currentPractice: newPractice });
    }
  };

  const openPractice = () => {
    const today = new Date().toDateString();
    if (data.currentPractice && data.currentPractice.generatedAt === today) {
       setView('practice');
    } else {
       if (data.history.filter((h: any) => h.type === 'check-in').length > 0) {
         generatePractice();
         setView('practice');
       } else {
         setView('practice');
       }
    }
  };

  const handleRateSkill = (skillId: string, rating: string) => {
    const newRatings = { ...data.skillRatings, [skillId]: data.skillRatings[skillId] === rating ? null : rating };
    if (rating === 'not-helpful') {
      const isCurrentlyInPractice = data.currentPractice?.skills?.some((s: any) => s.id === skillId);
      if (isCurrentlyInPractice) {
         generatePractice(newRatings, skillId as any);
         return;
      }
    }
    updateData({ ...data, skillRatings: newRatings });
  };

  const handleRateTherapy = (therapyId: string, rating: string) => {
    updateData({
      ...data,
      therapyRatings: { ...data.therapyRatings, [therapyId]: data.therapyRatings[therapyId] === rating ? null : rating }
    });
  };

  const saveCheckIn = () => {
    const entry = {
      id: Date.now(),
      date: new Date().toISOString(),
      type: 'check-in',
      tracking: { ...data.tracking },
      screeners: { ...data.activeScreeners },
      journal: data.journal
    };
    
    const updatedHistory = [entry, ...data.history];
    const newData = {
      ...data,
      history: updatedHistory,
      tracking: { mood: 5, calmness: 5, sleep: 5, energy: 5 },
      activeScreeners: { phq9: null, gad7: null, mdq: null, ptsd: null, audit: null, dast: null },
      journal: "",
      currentPractice: null 
    };
    
    updateData(newData);
    // Trigger practice generation immediately using the fresh history
    generatePractice(null, null, updatedHistory); 
    setView('trends');
  };

  const handleResetAllData = () => {
    updateData(DEFAULT_DATA);
    setShowResetConfirm(false);
    setView('home');
  };

  const generateTherapistSummary = async () => {
    if (data.history.length === 0) return;
    
    setIsGeneratingSummary(true);
    setTherapistSummary(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const checkins = data.history.filter((h: any) => h.type === 'check-in').slice(0, 14);
      const moodAvg = (checkins.reduce((acc: number, curr: any) => acc + curr.tracking.mood, 0) / checkins.length).toFixed(1);
      const anxietyAvg = (checkins.reduce((acc: number, curr: any) => acc + curr.tracking.calmness, 0) / checkins.length).toFixed(1);
      
      const helpfulSkills = Object.entries(data.skillRatings)
        .filter(([_, r]) => r === 'helpful')
        .map(([id]) => {
          const s = LAB_SKILLS.flatMap(cat => cat.skills).find(sk => sk.id === id);
          return s ? s.name : id;
        });

      const unhelpfulSkills = Object.entries(data.skillRatings)
        .filter(([_, r]) => r === 'not-helpful')
        .map(([id]) => {
          const s = LAB_SKILLS.flatMap(cat => cat.skills).find(sk => sk.id === id);
          return s ? s.name : id;
        });

      const helpfulTherapies = Object.entries(data.therapyRatings)
        .filter(([_, r]) => r === 'helpful')
        .map(([id]) => THERAPY_STYLES.find(t => t.id === id)?.name || id);

      const latestScreener = checkins[0]?.screeners || {};
      const activeScreenerTexts = Object.entries(latestScreener)
        .filter(([_, val]) => val !== null)
        .map(([key, val]: any) => `${SCREENER_DATA[key].title}: ${val} (${SCREENER_DATA[key].scoring(val).label})`);

      const prompt = `
        You are an AI medical assistant for a mental health app called "Session Zero". 
        Your task is to write a brief, professional, and empathetic summary of a patient's recent mental health data. 
        This summary is intended for the patient to show or read to their therapist during a visit to facilitate communication.

        Patient Data from the last 14 logs:
        - Average Mood (1-10, where 10 is light): ${moodAvg}
        - Average Calmness (1-10, where 10 is still): ${anxietyAvg}
        - Recent Clinical Screeners: ${activeScreenerTexts.join(', ') || 'None'}
        - Skills Rated HELPFUL: ${helpfulSkills.join(', ') || 'None'}
        - Skills Rated NOT HELPFUL: ${unhelpfulSkills.join(', ') || 'None'}
        - Therapy Modalities the patient liked: ${helpfulTherapies.join(', ') || 'None'}
        - Recent Journal Keywords: ${checkins.map((c: any) => c.journal).filter(Boolean).join('. ')}

        Instructions:
        1. Keep the summary under 150 words.
        2. Use the first person ("My mood has been...") or third person professional ("The data shows...").
        3. Highlight trends (e.g., if mood is low despite helps).
        4. Mention which specific techniques the patient is resonating with.
        5. DO NOT provide medical advice or diagnosis. Just summarize the observations.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      setTherapistSummary(result.text || "Unable to generate summary at this time.");
    } catch (e) {
      console.error("AI Summary Error", e);
      setTherapistSummary("There was an error generating your summary. Please try again later.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const SparkChart = ({ type }: { type: string }) => {
    const logs = data.history.filter((h: any) => h.type === 'check-in').slice(0, 7).reverse();
    if (logs.length === 0) return null;
    return (
      <div className="flex items-end gap-1 h-8 w-16">
        {logs.map((l: any) => (
          <div 
            key={l.id} 
            className="w-full bg-indigo-500/40 rounded-t-sm transition-all hover:bg-indigo-400" 
            style={{ height: `${(l.tracking[type] / 10) * 100}%`, minHeight: '2px' }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#07090F] text-slate-400 font-sans flex flex-col items-center relative">
      {/* LOADING SCREEN */}
      {isLoading && (
        <div className="absolute inset-0 z-[200] bg-[#07090F] flex items-center justify-center transition-all duration-1000">
           <div className={`absolute transition-all duration-700 transform ${loadingPhase === 'message' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 blur-md'}`}>
              <h2 className="text-xl font-light italic text-slate-100 tracking-wider">remember, you are enough</h2>
           </div>
           <div className={`absolute transition-all duration-700 transform ${loadingPhase === 'logo' ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}>
              <ZeroLogo size={64} />
           </div>
        </div>
      )}

      <div className={`w-full flex flex-col items-center h-full transition-all duration-1000 ${isLoading ? 'blur-2xl opacity-50 pointer-events-none' : 'blur-0 opacity-100'}`}>
        {/* ACTIVITY DETAIL MODAL */}
        {activeActivityItem && (
          <div className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-0 animate-in fade-in duration-300">
             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActiveActivityItem(null)}></div>
             <div className="w-full max-w-[320px] bg-[#0d111a] border-t border-x border-slate-800 rounded-t-[32px] p-6 pb-12 z-20 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
                <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto mb-6"></div>
                
                <div className="flex items-center justify-between mb-8">
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{activeActivityItem.type === 'check-in' ? 'Session Log' : 'Practice Record'}</p>
                      <h4 className="text-lg font-light text-slate-100">{new Date(activeActivityItem.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</h4>
                      <p className="text-[10px] text-slate-500">{new Date(activeActivityItem.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                   </div>
                   <button onClick={() => setActiveActivityItem(null)} className="p-2 bg-slate-900 rounded-full text-slate-500 hover:text-white transition-colors">
                      <X size={20} />
                   </button>
                </div>

                {activeActivityItem.type === 'check-in' && (
                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-3">
                         {TRACKERS.map(t => (
                            <div key={t.id} className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl space-y-1">
                               <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest leading-none">{t.label}</p>
                               <div className="flex items-center gap-2">
                                  <span className="text-lg font-mono text-slate-200">{activeActivityItem.tracking[t.id]}</span>
                                  <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                     <div className="h-full bg-indigo-500" style={{ width: `${(activeActivityItem.tracking[t.id]/10)*100}%` }}></div>
                                  </div>
                               </div>
                            </div>
                         ))}
                      </div>

                      {Object.keys(activeActivityItem.screeners || {}).some(k => activeActivityItem.screeners[k] !== null) && (
                         <div className="space-y-3">
                            <h5 className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Clinical Screeners</h5>
                            <div className="space-y-2">
                               {Object.entries(activeActivityItem.screeners).map(([key, val]: any) => {
                                  if (val === null) return null;
                                  const screener = SCREENER_DATA[key];
                                  const result = screener.scoring(val);
                                  return (
                                     <div key={key} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/40 rounded-xl">
                                        <span className="text-[11px] text-slate-400 font-medium">{screener.short} Score: <span className="text-slate-200">{val}</span></span>
                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${result.bg} ${result.color}`}>{result.label}</span>
                                     </div>
                                  );
                               })}
                            </div>
                         </div>
                      )}

                      {activeActivityItem.journal && (
                         <div className="space-y-2">
                            <h5 className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Journal Notes</h5>
                            <div className="p-4 bg-slate-950/60 border border-slate-800/40 rounded-2xl italic text-[11px] text-slate-400 leading-relaxed">
                               "{activeActivityItem.journal}"
                            </div>
                         </div>
                      )}
                   </div>
                )}

                {activeActivityItem.type === 'be-still' && (
                   <div className="space-y-6">
                      <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl flex flex-col items-center text-center space-y-4">
                         <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <Wind size={32} />
                         </div>
                         <div className="space-y-1">
                            <h5 className="text-lg font-light text-slate-100">{activeActivityItem.mode === 'box' ? 'Box Breathing' : 'Mindful Stillness'}</h5>
                            <p className="text-2xl font-mono text-indigo-400">{activeActivityItem.duration}m 00s</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Total Duration Completed</p>
                         </div>
                      </div>
                      <p className="text-[11px] text-center text-slate-500 px-4 leading-relaxed">You dedicated this time to regulating your nervous system and practicing presence.</p>
                   </div>
                )}

                <button onClick={() => setActiveActivityItem(null)} className="w-full mt-8 py-4 bg-slate-900 border border-slate-800 rounded-2xl font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-all">Close Details</button>
             </div>
          </div>
        )}

        {/* RESET CONFIRMATION MODAL */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-6 animate-in fade-in duration-300">
             <div className="absolute inset-0 bg-black/95" onClick={() => setShowResetConfirm(false)}></div>
             <div className="bg-[#0f141f] border border-slate-800 p-8 rounded-[32px] w-full max-w-[280px] z-50 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto">
                   <AlertCircle size={32} />
                </div>
                <div className="space-y-2">
                   <h4 className="text-lg font-light text-slate-100 italic">Are you sure?</h4>
                   <p className="text-xs text-slate-500 leading-relaxed">This will permanently delete all your check-ins, history, and streaks. This cannot be undone.</p>
                </div>
                <div className="space-y-2 pt-2">
                   <button 
                    onClick={handleResetAllData}
                    className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-rose-500 transition-all"
                   >
                    Reset Everything
                   </button>
                   <button 
                    onClick={() => setShowResetConfirm(false)}
                    className="w-full py-4 bg-slate-900 text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:text-white transition-all"
                   >
                    Cancel
                   </button>
                </div>
             </div>
          </div>
        )}

        <div className="w-full max-w-[320px] bg-[#07090F]/90 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-50 px-4 pt-4 pb-2">
          <div className="flex flex-col items-center gap-1 mb-1">
            <div className="flex items-center gap-2">
              <ZeroLogo size={24} />
              <h1 className="text-xl font-light text-slate-100 tracking-wider lowercase">session zero</h1>
            </div>
            {view === 'home' && (
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">your mental health matters</p>
            )}
          </div>
          {view !== 'home' && (
            <div className="flex items-center justify-between pb-2 mt-2">
               <button onClick={() => { 
                 if (labSelection) setLabSelection(null); 
                 else if (therapySelection) setTherapySelection(null);
                 else {
                   if (view === 'bestill') resetBeStill();
                   setView('home');
                 }
               }} className="flex items-center gap-1.5 p-1 -ml-1 text-slate-500 hover:text-white transition-colors">
                  <ChevronLeft size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Back</span>
               </button>
               <h2 className="text-[9px] font-black uppercase tracking-[0.25em] text-indigo-500/80 absolute left-1/2 -translate-x-1/2">
                 {view === 'track' ? 'Check In' : view === 'lab' ? 'The Lab' : view === 'resources' ? 'Help' : view === 'trends' ? 'My Trends' : view === 'bestill' ? 'Be Still' : view === 'practice' ? 'The Practice' : ''}
               </h2>
               {view === 'track' && (
                 <button onClick={saveCheckIn} className="text-[10px] font-bold uppercase text-indigo-400 tracking-tighter hover:text-indigo-300">Save</button>
               )}
            </div>
          )}
        </div>

        <main className="flex-1 w-full max-w-[320px] overflow-y-auto px-4 pb-24 pt-4">
          {view === 'home' && (
            <div className="flex flex-col items-center w-full space-y-2 animate-in fade-in duration-500">
              <button onClick={() => setView('track')} className="w-full flex flex-col items-center justify-center p-6 bg-slate-900/40 border border-slate-800 rounded-2xl gap-2 group relative overflow-hidden transition-all hover:bg-slate-800/50">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors"></div>
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:text-white group-hover:bg-indigo-500 transition-colors z-10"><MapPin size={20} /></div>
                <h3 className="text-sm font-medium text-slate-200 z-10">Start here</h3>
                <p className="text-[10px] text-slate-500 z-10">Daily check-in & screeners</p>
              </button>

              <button onClick={openPractice} className="w-full flex flex-col items-center justify-center p-6 bg-slate-900/40 border border-slate-800 rounded-2xl gap-2 group relative overflow-hidden transition-all hover:bg-slate-800/50">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-teal-500/5 rounded-full blur-xl group-hover:bg-teal-500/10 transition-colors"></div>
                <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 group-hover:text-white group-hover:bg-teal-500 transition-colors z-10"><Compass size={20} /></div>
                <h3 className="text-sm font-medium text-slate-200 z-10">The Practice</h3>
                <p className="text-[10px] text-slate-500 z-10">Your customized daily plan</p>
              </button>
              
              <div className="grid grid-cols-2 gap-2 w-full pt-1">
                <button onClick={() => setView('lab')} className="flex flex-col items-center justify-center p-5 bg-slate-900/40 border border-slate-800 rounded-2xl gap-2 hover:bg-slate-800/50 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-colors"><Beaker size={20} /></div>
                  <h3 className="text-[11px] font-medium text-slate-200">The Lab</h3>
                </button>
                <button onClick={() => setView('bestill')} className="flex flex-col items-center justify-center p-5 bg-slate-900/40 border border-slate-800 rounded-2xl gap-2 hover:bg-slate-800/50 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors"><Feather size={20}/></div>
                  <h3 className="text-[11px] font-medium text-slate-200">Be Still</h3>
                </button>
                <button onClick={() => setView('trends')} className="flex flex-col items-center justify-center p-5 bg-slate-900/40 border border-slate-800 rounded-2xl gap-2 hover:bg-slate-800/50 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors"><LineChart size={20}/></div>
                  <h3 className="text-[11px] font-medium text-slate-200">My Trends</h3>
                </button>
                <button onClick={() => setView('resources')} className="flex flex-col items-center justify-center p-5 bg-slate-900/40 border border-slate-800 rounded-2xl gap-2 hover:bg-slate-800/50 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-slate-700 group-hover:text-white transition-colors"><LifeBuoy size={20} /></div>
                  <h3 className="text-[11px] font-medium text-slate-200">Resources</h3>
                </button>
              </div>
            </div>
          )}

          {view === 'track' && (
            <div className="space-y-6 pb-10 animate-in slide-in-from-right-4">
              <section className="space-y-4 bg-slate-900/20 p-5 rounded-3xl border border-slate-800/40">
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Daily State</h3>
                {TRACKERS.map(item => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 text-slate-300">{item.icon} <span>{item.label}</span></div>
                      <span className="font-mono text-indigo-400">{data.tracking[item.id]}/10</span>
                    </div>
                    <div className="px-1">
                      <input type="range" min="1" max="10" value={data.tracking[item.id]} onChange={(e) => setData({...data, tracking: { ...data.tracking, [item.id]: parseInt(e.target.value) }})} className="w-full h-1 bg-slate-800 rounded-lg appearance-none accent-indigo-500" />
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">{item.low}</span>
                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">{item.high}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
              
              <section className="space-y-2">
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-600 ml-1">How are you doing?</h3>
                <textarea value={data.journal} onChange={(e) => setData({...data, journal: e.target.value})} placeholder="Share how you are feeling to help guide your plan..." className="w-full h-24 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[12px] text-slate-300 outline-none resize-none focus:border-indigo-500 transition-colors" />
              </section>

              <section className="space-y-2">
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-600 ml-1">Clinical Screening</h3>
                <div className="space-y-2">
                  {Object.values(SCREENER_DATA).map((screener: any) => {
                    const score = data.activeScreeners[screener.id];
                    const result = score !== null ? screener.scoring(score) : null;
                    return (
                      <button key={screener.id} onClick={() => setActiveScreenerId(screener.id)} className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-[12px] hover:border-slate-600 transition-all">
                        <span>{screener.title}</span>
                        {score !== null ? (
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${result.bg} ${result.color}`}>
                            {result.label}
                          </span>
                        ) : (
                          <ChevronRight size={14} className="text-slate-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
              
              <button onClick={saveCheckIn} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"><Lock size={12}/> Complete Daily Log</button>
            </div>
          )}

          {/* VIEW: THE PRACTICE (BLUEPRINT) */}
          {view === 'practice' && (
            <div className="space-y-6 pb-10 animate-in slide-in-from-right-4">
              {data.currentPractice ? (
                <div className="space-y-6">
                  <div className="text-center space-y-2 mt-2 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-lg mx-auto mb-4">
                      <Compass className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-light text-slate-100">The Practice</h2>
                    <p className="text-[11px] text-slate-500 px-4 leading-relaxed italic">
                      Your customized protocol based on your last check-in.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-px bg-slate-800 flex-1"></div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Daily Skills</span>
                    <div className="h-px bg-slate-800 flex-1"></div>
                  </div>

                  <div className="space-y-3">
                    {data.currentPractice.skills.map((skill: any) => (
                      <div key={skill.id} className="p-5 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
                              {ICON_MAP[skill.iconId] || <Zap size={16} />}
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-slate-200">{skill.name}</h4>
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{skill.type}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleRateSkill(skill.id, 'helpful')} className={`p-1.5 rounded-lg transition-all ${data.skillRatings[skill.id] === 'helpful' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}><ThumbsUp size={14}/></button>
                            <button onClick={() => handleRateSkill(skill.id, 'not-helpful')} className={`p-1.5 rounded-lg transition-all ${data.skillRatings[skill.id] === 'not-helpful' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-600 hover:text-slate-400'}`}><ThumbsDown size={14}/></button>
                          </div>
                        </div>
                        <p className="text-[12px] leading-relaxed text-slate-400">{skill.desc}</p>
                        <div className="pt-2 flex items-center gap-2">
                           <div className="w-1 h-1 rounded-full bg-indigo-500"></div>
                           <p className="text-[10px] italic text-slate-500">{skill.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <div className="h-px bg-slate-800 flex-1"></div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Therapeutic Focus</span>
                    <div className="h-px bg-slate-800 flex-1"></div>
                  </div>

                  <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                          <Brain size={16} />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-200">{data.currentPractice.therapy.name}</h4>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Recommended Modality</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleRateTherapy(data.currentPractice.therapy.id, 'helpful')} className={`p-1.5 rounded-lg transition-all ${data.therapyRatings[data.currentPractice.therapy.id] === 'helpful' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}><ThumbsUp size={14}/></button>
                        <button onClick={() => handleRateTherapy(data.currentPractice.therapy.id, 'not-helpful')} className={`p-1.5 rounded-lg transition-all ${data.therapyRatings[data.currentPractice.therapy.id] === 'not-helpful' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-600 hover:text-slate-400'}`}><ThumbsDown size={14}/></button>
                      </div>
                    </div>
                    <p className="text-[12px] leading-relaxed text-slate-400">{data.currentPractice.therapy.desc}</p>
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                       <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Try this technique:</p>
                       <p className="text-[11px] text-slate-300 leading-relaxed italic">{data.currentPractice.therapy.technique}</p>
                    </div>
                  </div>
                  
                  <button onClick={() => setView('track')} className="w-full py-4 border border-slate-800 text-slate-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 transition-all">Update Check-in</button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-700">
                    <Compass size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-slate-200 font-medium">No Practice Yet</h3>
                    <p className="text-xs text-slate-500 px-8">Complete a check-in to generate your personalized daily plan.</p>
                  </div>
                  <button onClick={() => setView('track')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all">Check In Now</button>
                </div>
              )}
            </div>
          )}

          {/* VIEW: BE STILL */}
          {view === 'bestill' && (
            <div className="space-y-8 pb-10 animate-in slide-in-from-right-4 flex flex-col items-center">
              {!isSessionFinished ? (
                <>
                  <div className="text-center space-y-2 mt-2">
                    <h2 className="text-xl font-light text-slate-100 italic">Be Still</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Regulation & Presence</p>
                  </div>

                  <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-full">
                    <button onClick={() => setBeStillMode('box')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${beStillMode === 'box' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Box Breath</button>
                    <button onClick={() => setBeStillMode('mindful')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${beStillMode === 'mindful' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Mindfulness</button>
                  </div>

                  <div className="relative w-64 h-64 flex items-center justify-center">
                    {beStillMode === 'box' ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        {/* THE BOX ANIMATION */}
                        <svg className="absolute inset-0 w-full h-full p-2" viewBox="0 0 100 100">
                          <rect x="5" y="5" width="90" height="90" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-800" rx="4" />
                          {isBreathing && (
                            <motion.rect
                              x="5" y="5" width="90" height="90"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              className="text-indigo-500"
                              rx="4"
                              initial={{ pathLength: 0, pathOffset: 0 }}
                              animate={{ 
                                pathLength: 0.25, 
                                pathOffset: [0, 0.25, 0.5, 0.75, 1] 
                              }}
                              transition={{ 
                                duration: 16, 
                                ease: "linear", 
                                repeat: Infinity 
                              }}
                            />
                          )}
                        </svg>
                        
                        <div className="z-10 text-center space-y-1">
                          {isBreathing ? (
                            <>
                              <p className={`text-xl font-light tracking-widest transition-colors duration-500 ${BREATHE_PHASES[breathePhaseIndex].textCol}`}>{BREATHE_PHASES[breathePhaseIndex].text}</p>
                              <p className="text-[10px] font-mono text-slate-500">{Math.floor(breatheTimeLeft / 60)}:{(breatheTimeLeft % 60).toString().padStart(2, '0')}</p>
                            </>
                          ) : (
                            <button onClick={() => setIsBreathing(true)} className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"><Play size={24} className="ml-1"/></button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                        {isBreathing ? (
                          <div className="flex flex-col items-center space-y-6 animate-in fade-in duration-1000">
                            <div className="text-center space-y-4 px-2">
                               <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Mindful Presence</p>
                                  <p className="text-2xl font-mono text-slate-200">{Math.floor(breatheTimeLeft / 60)}:{(breatheTimeLeft % 60).toString().padStart(2, '0')}</p>
                               </div>
                               <div className="space-y-4 text-[11px] leading-relaxed text-slate-400 italic">
                                  <p>1. Focus on your home base (e.g. breath in nostrils, chest, or belly).</p>
                                  <p>2. Get really into how it feels.</p>
                                  <p>3. When distracted, notice it, and return to your home base.</p>
                               </div>
                            </div>
                            <div className="w-12 h-12 rounded-full border border-indigo-500/20 flex items-center justify-center">
                               <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setIsBreathing(true)} className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"><Play size={24} className="ml-1"/></button>
                        )}
                      </div>
                    )}
                  </div>

                  {!isBreathing && (
                    <div className="w-full space-y-4">
                       <div className="flex justify-between items-center px-2">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Duration</span>
                          <span className="text-[10px] font-mono text-indigo-400">{selectedDuration} MIN</span>
                       </div>
                       <div className="flex gap-2">
                          {[1, 3, 5, 10].map(m => (
                            <button key={m} onClick={() => { setSelectedDuration(m); setBreatheTimeLeft(m * 60); }} className={`flex-1 py-3 rounded-xl border text-[11px] font-bold transition-all ${selectedDuration === m ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600'}`}>{m}m</button>
                          ))}
                       </div>
                    </div>
                  )}

                  {isBreathing && (
                    <button onClick={() => setIsBreathing(false)} className="px-8 py-3 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all">Pause Session</button>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-8 animate-in zoom-in-95">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <CheckCircle size={48} />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">+1 STREAK</div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-light text-slate-100">Session Complete</h3>
                    <p className="text-xs text-slate-500 px-8 leading-relaxed">You took {selectedDuration} {selectedDuration === 1 ? 'minute' : 'minutes'} to just be. Your nervous system thanks you.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
                       <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Current Streak</p>
                       <p className="text-xl font-light text-slate-200">{data.stillStreak} Days</p>
                    </div>
                    <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
                       <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Total Time</p>
                       <p className="text-xl font-light text-slate-200">{data.history.filter((h: any) => h.type === 'be-still').reduce((acc: any, h: any) => acc + h.duration, 0)}m</p>
                    </div>
                  </div>
                  <button onClick={resetBeStill} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs hover:bg-indigo-500 transition-all">Finish</button>
                </div>
              )}
            </div>
          )}

          {/* VIEW: MY TRENDS */}
          {view === 'trends' && (
            <div className="space-y-6 pb-10 animate-in slide-in-from-right-4">
              {data.currentPractice && (
                <button 
                  onClick={() => setView('practice')}
                  className="w-full p-4 bg-gradient-to-r from-indigo-600 to-teal-600 rounded-2xl flex items-center justify-between group hover:shadow-lg hover:shadow-indigo-500/20 transition-all animate-in fade-in slide-in-from-top-4 duration-500"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                      <Compass size={16} className="animate-spin-slow" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Practice Ready</p>
                      <p className="text-xs font-medium text-white">View your daily protocol</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-white/70 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                {TRACKERS.map(t => (
                  <div key={t.id} className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="text-slate-500">{t.icon}</div>
                      <SparkChart type={t.id} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{t.label}</p>
                      <p className="text-lg font-light text-slate-200">{data.history.filter((h: any) => h.type === 'check-in').length > 0 ? (data.history.filter((h: any) => h.type === 'check-in').reduce((acc: any, curr: any) => acc + curr.tracking[t.id], 0) / data.history.filter((h: any) => h.type === 'check-in').length).toFixed(1) : '--'}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-600 ml-1">Recent Activity</h3>
                {data.history.slice(0, 10).map((item: any) => (
                  <button 
                    key={item.id} 
                    onClick={() => setActiveActivityItem(item)}
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between hover:border-indigo-500/50 hover:bg-slate-900/40 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${item.type === 'check-in' ? 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white' : 'bg-teal-500/10 text-teal-400 group-hover:bg-teal-500 group-hover:text-white'}`}>
                        {item.type === 'check-in' ? <ClipboardCheck size={16}/> : <Wind size={16}/>}
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-slate-200">{item.type === 'check-in' ? 'Daily Check-in' : `Be Still (${item.mode})`}</p>
                        <p className="text-[9px] text-slate-500">{new Date(item.date).toLocaleDateString()} • {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.type === 'check-in' && (
                        <div className="flex gap-0.5">
                          {Object.values(item.tracking).map((v: any, i) => (
                            <div key={i} className="w-0.5 h-3 bg-slate-800 rounded-full overflow-hidden">
                              <div className="w-full bg-indigo-500" style={{ height: `${(v/10)*100}%` }}></div>
                            </div>
                          ))}
                        </div>
                      )}
                      {item.type === 'be-still' && (
                        <span className="text-[10px] font-mono text-teal-500">{item.duration}m</span>
                      )}
                      <ChevronRight size={12} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>

              {/* AI THERAPIST SUMMARY SECTION */}
              <div className="space-y-3 pt-4 border-t border-slate-800/50">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Therapist Summary</h3>
                  {!therapistSummary && !isGeneratingSummary && (
                    <button 
                      onClick={generateTherapistSummary}
                      disabled={data.history.length === 0}
                      className="flex items-center gap-1 text-[9px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300 disabled:opacity-30"
                    >
                      <Sparkles size={10} />
                      Generate
                    </button>
                  )}
                </div>

                {isGeneratingSummary ? (
                   <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl flex flex-col items-center justify-center space-y-3">
                      <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                      <p className="text-[10px] text-slate-500 font-medium animate-pulse">Analyzing trends for your visit...</p>
                   </div>
                ) : therapistSummary ? (
                   <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-400">
                          <Brain size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Visit Summary</span>
                        </div>
                        <button onClick={() => setTherapistSummary(null)} className="text-slate-600 hover:text-slate-400"><X size={14}/></button>
                      </div>
                      <p className="text-[12px] leading-relaxed text-slate-300 italic whitespace-pre-wrap">{therapistSummary}</p>
                      <div className="pt-2 flex justify-end">
                         <button 
                          onClick={generateTherapistSummary}
                          className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-400"
                        >
                          <RotateCcw size={10} /> Regenerate
                        </button>
                      </div>
                   </div>
                ) : data.history.length === 0 ? (
                  <div className="p-5 bg-slate-900/20 border border-slate-800/40 rounded-2xl text-center">
                    <p className="text-[10px] text-slate-600">Complete check-ins to unlock AI summaries.</p>
                  </div>
                ) : null}
              </div>

              {/* DATA RESET SECTION */}
              <div className="pt-10 pb-6 flex justify-center">
                <button 
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2 text-[9px] font-bold text-slate-700 uppercase tracking-[0.2em] hover:text-rose-500 transition-colors flex items-center gap-2"
                >
                  <AlertCircle size={12} />
                  Clear Data & History
                </button>
              </div>
            </div>
          )}

          {/* VIEW: THE LAB */}
          {view === 'lab' && (
            <div className="space-y-6 pb-10 animate-in slide-in-from-right-4">
              <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                <button onClick={() => setLabTab('self-care')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${labTab === 'self-care' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Self-Care</button>
                <button onClick={() => setLabTab('therapy')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${labTab === 'therapy' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Therapies</button>
              </div>

              {labTab === 'self-care' ? (
                <div className="space-y-6">
                  {LAB_SKILLS.map(cat => (
                    <div key={cat.id} className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <div className="text-indigo-500">{ICON_MAP[cat.iconId]}</div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{cat.symptom}</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {cat.skills.map(skill => (
                          <button key={skill.id} onClick={() => setLabSelection({...skill, iconId: cat.iconId})} className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between group hover:border-slate-600 transition-all">
                            <div className="text-left">
                              <p className="text-[12px] font-medium text-slate-200 group-hover:text-white">{skill.name}</p>
                              <p className="text-[9px] text-slate-600 uppercase font-bold tracking-tighter">{skill.type}</p>
                            </div>
                            <div className="flex items-center gap-3">
                               {data.skillRatings[skill.id] === 'helpful' && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                               <ChevronRight size={14} className="text-slate-700 group-hover:text-slate-400" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {THERAPY_STYLES.map(style => (
                    <button key={style.id} onClick={() => setTherapySelection(style)} className="w-full p-5 bg-slate-900/40 border border-slate-800 rounded-3xl text-left space-y-2 hover:bg-slate-800/50 transition-all group">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                           {ICON_MAP[style.iconId] || <Brain size={20} />}
                        </div>
                        <ChevronRight size={16} className="text-slate-700" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-200">{style.name}</h4>
                        <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-tighter">Best for: {style.bestFor}</p>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{style.desc}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW: RESOURCES */}
          {view === 'resources' && (
            <div className="space-y-6 pb-10 animate-in slide-in-from-right-4">
               <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3 text-rose-400">
                    <ShieldAlert size={24} />
                    <h3 className="text-lg font-light">Crisis Support</h3>
                  </div>
                  <p className="text-xs text-rose-200/70 leading-relaxed">If you are in immediate danger or having thoughts of self-harm, please reach out to these professional services now.</p>
                  <div className="space-y-2">
                     <a href="tel:988" className="flex items-center justify-between p-4 bg-rose-500 text-white rounded-2xl font-bold text-sm">
                        <span>988 Suicide & Crisis Lifeline</span>
                        <ExternalLink size={16} />
                     </a>
                     <a href="sms:741741" className="flex items-center justify-between p-4 bg-white text-rose-500 rounded-2xl font-bold text-sm">
                        <span>Crisis Text Line (741741)</span>
                        <ExternalLink size={16} />
                     </a>
                  </div>
               </div>

               <div className="space-y-3">
                  <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-600 ml-1">Connect to help locally</h3>
                  <div className="space-y-2">
                     <a href="https://www.psychologytoday.com/us/therapists" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800 text-slate-200 rounded-2xl font-bold text-sm hover:border-indigo-500/50 transition-all group">
                        <span>Find a Therapist</span>
                        <ExternalLink size={16} className="text-slate-600 group-hover:text-indigo-400" />
                     </a>
                     <a href="https://www.zocdoc.com/psychiatrists" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800 text-slate-200 rounded-2xl font-bold text-sm hover:border-indigo-500/50 transition-all group">
                        <span>Find a Psychiatrist</span>
                        <ExternalLink size={16} className="text-slate-600 group-hover:text-indigo-400" />
                     </a>
                  </div>
               </div>

               <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl text-center space-y-3">
                  <LifeBuoy size={24} className="mx-auto text-slate-600" />
                  <p className="text-[11px] text-slate-500 leading-relaxed italic">"You don't have to see the whole staircase, just take the first step."</p>
               </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: LAB SELECTION */}
      {labSelection && (
        <div className="fixed inset-0 z-[110] bg-[#07090F]/95 backdrop-blur-md p-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
           <div className="w-full max-w-[320px] flex justify-end mb-6">
              <button onClick={() => setLabSelection(null)} className="p-2 bg-slate-900 rounded-full text-slate-500 hover:text-white transition-colors"><X size={18}/></button>
           </div>
           <div className="w-full max-w-[320px] space-y-6">
              <div className="text-center space-y-2">
                 <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto mb-4">
                    {ICON_MAP[labSelection.iconId] || <Zap size={32} />}
                 </div>
                 <h2 className="text-xl font-light text-white">{labSelection.name}</h2>
                 <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">{labSelection.type} Skill</p>
              </div>
              
              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
                 <p className="text-sm text-slate-300 leading-relaxed text-center">{labSelection.desc}</p>
              </div>

              <div className="space-y-3">
                 <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest text-center">How helpful is this for you?</p>
                 <div className="flex gap-2">
                    <button onClick={() => handleRateSkill(labSelection.id, 'helpful')} className={`flex-1 py-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${data.skillRatings[labSelection.id] === 'helpful' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                       <ThumbsUp size={20} />
                       <span className="text-[10px] font-bold uppercase tracking-tighter">Helpful</span>
                    </button>
                    <button onClick={() => handleRateSkill(labSelection.id, 'not-helpful')} className={`flex-1 py-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${data.skillRatings[labSelection.id] === 'not-helpful' ? 'bg-rose-500/10 border-rose-500 text-rose-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                       <ThumbsDown size={20} />
                       <span className="text-[10px] font-bold uppercase tracking-tighter">Not for me</span>
                    </button>
                 </div>
              </div>
              
              <button onClick={() => setLabSelection(null)} className="w-full py-4 bg-slate-900 text-slate-400 rounded-2xl font-bold text-xs hover:text-white transition-all">Close</button>
           </div>
        </div>
      )}

      {/* MODAL: THERAPY SELECTION */}
      {therapySelection && (
        <div className="fixed inset-0 z-[110] bg-[#07090F]/95 backdrop-blur-md p-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
           <div className="w-full max-w-[320px] flex justify-end mb-6">
              <button onClick={() => setTherapySelection(null)} className="p-2 bg-slate-900 rounded-full text-slate-500 hover:text-white transition-colors"><X size={18}/></button>
           </div>
           <div className="w-full max-w-[320px] space-y-6">
              <div className="space-y-2">
                 <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
                    {ICON_MAP[therapySelection.iconId] || <Brain size={24} />}
                 </div>
                 <h2 className="text-xl font-light text-white">{therapySelection.name}</h2>
                 <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Therapeutic Modality</p>
              </div>
              
              <div className="space-y-4">
                 <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Overview</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{therapySelection.desc}</p>
                 </div>
                 <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">What to expect</h4>
                    <ul className="space-y-1.5">
                       {therapySelection.expect.map((e: string, i: number) => (
                         <li key={i} className="flex items-start gap-2 text-[12px] text-slate-400">
                            <div className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                            <span>{e}</span>
                         </li>
                       ))}
                    </ul>
                 </div>
                 <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Core Technique</h4>
                    <p className="text-[12px] text-slate-300 leading-relaxed italic">{therapySelection.technique}</p>
                 </div>
              </div>

              <div className="space-y-3">
                 <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest text-center">Is this style interesting to you?</p>
                 <div className="flex gap-2">
                    <button onClick={() => handleRateTherapy(therapySelection.id, 'helpful')} className={`flex-1 py-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${data.therapyRatings[therapySelection.id] === 'helpful' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                       <ThumbsUp size={20} />
                       <span className="text-[10px] font-bold uppercase tracking-tighter">Interested</span>
                    </button>
                    <button onClick={() => handleRateTherapy(therapySelection.id, 'not-helpful')} className={`flex-1 py-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${data.therapyRatings[therapySelection.id] === 'not-helpful' ? 'bg-rose-500/10 border-rose-500 text-rose-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                       <ThumbsDown size={20} />
                       <span className="text-[10px] font-bold uppercase tracking-tighter">Not for me</span>
                    </button>
                 </div>
              </div>
              
              <button onClick={() => setTherapySelection(null)} className="w-full py-4 bg-slate-900 text-slate-400 rounded-2xl font-bold text-xs hover:text-white transition-all">Close</button>
           </div>
        </div>
      )}
      {/* SCREENER MODAL */}
      {activeScreenerId && (
        <div className="fixed inset-0 z-[100] bg-[#07090F] p-6 flex flex-col items-center animate-in zoom-in-95 duration-200 overflow-y-auto">
          <div className="w-full max-w-[320px] flex justify-between mb-8 items-center">
             <div className="space-y-1">
                <h2 className="text-white font-medium text-lg">{SCREENER_DATA[activeScreenerId].title}</h2>
                <div className="h-1 w-12 bg-indigo-600 rounded-full"></div>
             </div>
             <button onClick={() => { setActiveScreenerId(null); setScreenerAnswers([]); }} className="p-2 bg-slate-900 rounded-full text-slate-500 hover:text-white transition-colors"><X size={18}/></button>
          </div>
          <div className="w-full max-w-[320px] space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                <span>Question {screenerAnswers.length + 1} / {SCREENER_DATA[activeScreenerId].questions.length}</span>
                <span className="text-indigo-500">{Math.round(((screenerAnswers.length) / SCREENER_DATA[activeScreenerId].questions.length) * 100)}%</span>
              </div>
              <p className={`text-slate-100 text-base leading-relaxed font-light transition-opacity duration-200 ${screenerLock ? 'opacity-0' : 'opacity-100'}`}>
                {SCREENER_DATA[activeScreenerId].questions[screenerAnswers.length]}
              </p>
            </div>
            <div className="space-y-2">
              {SCREENER_DATA[activeScreenerId].options.map((option: string, idx: number) => (
                <button 
                  key={idx} 
                  disabled={selectedOptionIndex !== null}
                  onClick={() => handleScreenerStep(idx)} 
                  className={`w-full p-4 border rounded-2xl text-left text-sm transition-all duration-200 ${selectedOptionIndex === idx ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

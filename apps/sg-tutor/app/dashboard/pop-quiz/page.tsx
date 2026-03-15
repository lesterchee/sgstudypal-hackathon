// Purpose: Teach Me — Clean SaaS curriculum explorer with compact topic grid,
// simulated progress bars, and inline Lesson View toggle.
// Sprint 60: Removed Playlist horizontal scroll. Grid with progress bars.
// Clicking a card opens a Lesson View (checklist + chat) instead of routing to /help-me.

"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Confetti from "react-confetti";
import {
    Brain, BookOpen, Calculator, FlaskConical, Languages,
    ArrowLeft, CheckCircle2, Circle, Send, Bot, User, PanelLeft
} from "lucide-react";

const BrainIcon = Brain as any;
const BookOpenIcon = BookOpen as any;
const CalculatorIcon = Calculator as any;
const FlaskConicalIcon = FlaskConical as any;
const LanguagesIcon = Languages as any;
const ArrowLeftIcon = ArrowLeft as any;
const CheckCircle2Icon = CheckCircle2 as any;
const CircleIcon = Circle as any;
const SendIcon = Send as any;
const BotIcon = Bot as any;
const UserIcon = User as any;
const PanelLeftIcon = PanelLeft as any;

// Purpose: Subject configuration for the navigation bar.
type Subject = "Math" | "Science" | "English";

const SUBJECT_NAV: { key: Subject; label: string; icon: any; activeColor: string }[] = [
    { key: "Math", label: "Mathematics", icon: CalculatorIcon, activeColor: "bg-blue-100 text-blue-700 border-blue-200" },
    { key: "Science", label: "Science", icon: FlaskConicalIcon, activeColor: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { key: "English", label: "English", icon: BookOpenIcon, activeColor: "bg-amber-100 text-amber-700 border-amber-200" },
];

// Purpose: Parse AI responses to separate feedback, the next question, and the MCQ suggestions.
// Sprint 94: Strips hidden <scratchpad> CoT calculations before rendering.
// Sprint 107: Returns isThinking flag when scratchpad is open but unclosed.
function parseQuizMessage(text: string): { feedback: string; nextQuestion: string; suggestions: string[]; isThinking: boolean } {
    // Purpose: Sprint 107 — Check if the AI is currently calculating inside an unclosed scratchpad.
    const isThinking = text.includes("<scratchpad>") && !text.includes("</scratchpad>");

    // Purpose: Sprint 99 — Remove hidden scratchpad calculations. Handles unclosed tags during streaming.
    let cleanText = text.replace(/<scratchpad>[\s\S]*?(?:<\/scratchpad>|$)/gi, "").trim();

    let mainContent = cleanText;
    let nextQuestion = "";
    let suggestions: string[] = [];

    const sugIdx = mainContent.indexOf("###SUGGESTIONS###");
    if (sugIdx !== -1) {
        const sugBlock = mainContent.slice(sugIdx + "###SUGGESTIONS###".length).trim();
        suggestions = sugBlock
            .split(/\n/)
            .map((line) => line.replace(/^\d+\.\s*/, "").trim())
            .filter((line) => line.length > 0)
            .slice(0, 3);
        mainContent = mainContent.slice(0, sugIdx).trim();
    }

    const nqIdx = mainContent.indexOf("###NEXT_QUESTION###");
    if (nqIdx !== -1) {
        nextQuestion = mainContent.slice(nqIdx + "###NEXT_QUESTION###".length).trim();
        mainContent = mainContent.slice(0, nqIdx).trim();
    }

    return { feedback: mainContent, nextQuestion, suggestions, isThinking };
}

// Purpose: Realistic P6 MOE syllabus mock data across all 4 subjects.
interface SyllabusTopic {
    id: string;
    name: string;
    emoji: string;
    description: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    progress: number; // Purpose: Simulated percent complete (0-100).
    subtopics: string[]; // Purpose: Lesson View checklist items.
}

const P6_SYLLABUS: Record<Subject, SyllabusTopic[]> = {
    Math: [
        { id: "m1", name: "Fractions", emoji: "➗", description: "Dividing a proper fraction by a whole number, and dividing by a proper fraction.", difficulty: "intermediate", progress: 0, subtopics: ["Dividing proper fraction by whole number", "Dividing whole number by proper fraction", "Dividing proper fraction by proper fraction"] },
        { id: "m2", name: "Percentage", emoji: "💯", description: "Finding the whole given a part and the percentage, and calculating percentage increase or decrease.", difficulty: "advanced", progress: 0, subtopics: ["Finding the whole given a part", "Finding percentage increase", "Finding percentage decrease"] },
        { id: "m3", name: "Ratio", emoji: "⚖️", description: "Notation of ratios, equivalent ratios, dividing quantities in a given ratio, and fraction relationships.", difficulty: "intermediate", progress: 0, subtopics: ["Notation of a:b and a:b:c", "Equivalent ratios in simplest form", "Dividing a quantity in a given ratio", "Finding missing terms", "Relationship between fraction and ratio"] },
        { id: "m4", name: "Algebra", emoji: "🔤", description: "Using letters to represent unknown numbers, simplifying algebraic expressions, and solving simple equations.", difficulty: "advanced", progress: 0, subtopics: ["Letters as unknown numbers", "Evaluating simple linear expressions", "Simplifying linear expressions", "Solving simple linear equations"] },
        { id: "m5", name: "Circles", emoji: "⭕", description: "Finding area, perimeter, and circumference of circles, semicircles, quarter circles, and composite figures.", difficulty: "advanced", progress: 0, subtopics: ["Area and circumference of circle", "Perimeter and area of semicircles", "Perimeter and area of quarter circles", "Composite figures"] },
        { id: "m6", name: "Volume of Cubes & Cuboids", emoji: "🧊", description: "Finding unknown dimensions, edge lengths, and base areas of cubes and cuboids given their volume.", difficulty: "intermediate", progress: 0, subtopics: ["Finding one dimension given volume", "Finding edge of cube given volume", "Finding height given base area", "Finding area of a face"] },
        { id: "m7", name: "Special Quadrilaterals", emoji: "📐", description: "Finding unknown angles in composite geometric figures without additional construction of lines.", difficulty: "intermediate", progress: 0, subtopics: ["Angles in squares and rectangles", "Angles in triangles", "Angles in parallelograms and rhombuses", "Angles in trapeziums"] },
        { id: "m8", name: "Average", emoji: "📊", description: "Calculating the average of a set of data and finding total values or number of data.", difficulty: "beginner", progress: 0, subtopics: ["Average as total value ÷ number of data", "Finding total value", "Finding number of data"] },
    ],
    Science: [
        { id: "s1", name: "Interaction of Forces", emoji: "🧲", description: "Understanding forces as a push or pull, their effects, and types of forces including friction, gravity, and elastic spring force.", difficulty: "intermediate", progress: 0, subtopics: ["Effects of a force", "Types of forces", "Frictional force", "Gravitational force and weight", "Elastic spring force"] },
        { id: "s2", name: "Interactions in the Environment", emoji: "🌱", description: "Understanding factors affecting survival, food webs, populations, adaptations, and Man's impact.", difficulty: "advanced", progress: 0, subtopics: ["Factors affecting survival", "Food chains and food webs", "Populations and communities", "Structural and behavioural adaptations", "Man's impact on the environment"] },
        { id: "s3", name: "Energy Forms & Uses (Photosynthesis)", emoji: "☀️", description: "Understanding the Sun as the primary source of energy, respiration, and the requirements for photosynthesis.", difficulty: "intermediate", progress: 0, subtopics: ["Sun as primary energy source", "Energy from respiration", "Requirements for photosynthesis", "How plants and animals obtain energy"] },
        { id: "s4", name: "Energy Conversion", emoji: "⚡", description: "Recognising various forms of energy and investigating how energy is converted from one form to another.", difficulty: "advanced", progress: 0, subtopics: ["Forms of energy", "Energy conversion processes", "Energy derived from the Sun", "Conserving energy"] },
    ],
    English: [
        { id: "e1", name: "Vocabulary", emoji: "📖", description: "Practice vocabulary MCQ and cloze passages.", difficulty: "intermediate", progress: 0, subtopics: ["Vocabulary MCQ", "Vocabulary Cloze"] },
        { id: "e2", name: "Grammar", emoji: "✏️", description: "Practice grammar rules, tenses, and synthesis.", difficulty: "intermediate", progress: 0, subtopics: ["Grammar MCQ", "Grammar Cloze", "Synthesis & Transformation"] },
        { id: "e3", name: "Comprehension", emoji: "🔍", description: "Practice extracting information and inferring meaning.", difficulty: "advanced", progress: 0, subtopics: ["Visual Text", "Open-Ended Comprehension"] },
    ],
};

const P1_SYLLABUS: Record<Subject, SyllabusTopic[]> = {
    Math: [
        { id: "p1-m1", name: "Numbers to 100", emoji: "🔢", description: "Counting, place values, and comparing numbers up to 100.", difficulty: "beginner", progress: 0, subtopics: ["Counting to 100", "Place values (tens, ones)", "Comparing and ordering", "Number patterns"] },
        { id: "p1-m2", name: "Addition & Subtraction", emoji: "➕", description: "Adding and subtracting numbers within 100.", difficulty: "beginner", progress: 0, subtopics: ["Concepts of addition/subtraction", "Adding/subtracting within 100", "Mental calculation within 20"] },
        { id: "p1-m3", name: "Multiplication & Division", emoji: "✖️", description: "Basic concepts of grouping and sharing.", difficulty: "intermediate", progress: 0, subtopics: ["Concepts of multiplication", "Concepts of division", "Multiplying within 40", "Dividing within 20"] },
        { id: "p1-m4", name: "Money, Time & Length", emoji: "⏱️", description: "Counting coins, telling time to 5 minutes, and measuring in cm.", difficulty: "beginner", progress: 0, subtopics: ["Counting money (cents/dollars)", "Telling time (5 mins, am/pm)", "Measuring length (cm)"] },
        { id: "p1-m5", name: "2D Shapes & Graphs", emoji: "🔺", description: "Identifying basic shapes and reading picture graphs.", difficulty: "beginner", progress: 0, subtopics: ["Identifying 2D shapes", "Forming figures", "Picture graphs"] },
    ],
    Science: [], // Note: Science starts in P3
    English: [
        { id: "p1-e1", name: "Vocabulary", emoji: "📖", description: "Practice vocabulary MCQ and cloze passages.", difficulty: "intermediate", progress: 0, subtopics: ["Vocabulary MCQ", "Vocabulary Cloze"] },
        { id: "p1-e2", name: "Grammar", emoji: "✏️", description: "Practice grammar rules, tenses, and synthesis.", difficulty: "intermediate", progress: 0, subtopics: ["Grammar MCQ", "Grammar Cloze", "Synthesis & Transformation"] },
        { id: "p1-e3", name: "Comprehension", emoji: "🔍", description: "Practice extracting information and inferring meaning.", difficulty: "advanced", progress: 0, subtopics: ["Visual Text", "Open-Ended Comprehension"] },
    ],
};

const P2_SYLLABUS: Record<Subject, SyllabusTopic[]> = {
    Math: [
        { id: "p2-m1", name: "Numbers to 1000", emoji: "💯", description: "Counting, place values, and patterns up to 1000.", difficulty: "beginner", progress: 0, subtopics: ["Counting to 1000", "Place values (hundreds, tens, ones)", "Odd and even numbers"] },
        { id: "p2-m2", name: "Add, Sub, Mult & Div", emoji: "➗", description: "Algorithms up to 3 digits and multiplication tables of 2, 3, 4, 5, 10.", difficulty: "intermediate", progress: 0, subtopics: ["Algorithms up to 3 digits", "Multiplication tables (2,3,4,5,10)", "Relationship between mult/div"] },
        { id: "p2-m3", name: "Fractions", emoji: "🍕", description: "Fractions as part of a whole, comparing, and simple addition.", difficulty: "intermediate", progress: 0, subtopics: ["Fractions as part of a whole", "Comparing and ordering", "Adding/subtracting like fractions"] },
        { id: "p2-m4", name: "Measurement & Geometry", emoji: "📏", description: "Mass, volume, 3D shapes, and picture graphs with scales.", difficulty: "beginner", progress: 0, subtopics: ["Length, Mass (kg/g), Volume (l)", "Time (hours/mins)", "3D Shapes", "Picture graphs with scales"] },
    ],
    Science: [], // Note: Science starts in P3
    English: [
        { id: "p2-e1", name: "Vocabulary", emoji: "📖", description: "Practice vocabulary MCQ and cloze passages.", difficulty: "intermediate", progress: 0, subtopics: ["Vocabulary MCQ", "Vocabulary Cloze"] },
        { id: "p2-e2", name: "Grammar", emoji: "✏️", description: "Practice grammar rules, tenses, and synthesis.", difficulty: "intermediate", progress: 0, subtopics: ["Grammar MCQ", "Grammar Cloze", "Synthesis & Transformation"] },
        { id: "p2-e3", name: "Comprehension", emoji: "🔍", description: "Practice extracting information and inferring meaning.", difficulty: "advanced", progress: 0, subtopics: ["Visual Text", "Open-Ended Comprehension"] },
    ],
};

const P3_SYLLABUS: Record<Subject, SyllabusTopic[]> = {
    Math: [
        { id: "p3-m1", name: "Numbers to 10,000", emoji: "🔢", description: "Place values, addition, and subtraction up to 4 digits.", difficulty: "intermediate", progress: 0, subtopics: ["Numbers to 10,000", "Addition/Subtraction algorithms"] },
        { id: "p3-m2", name: "Multiplication & Division", emoji: "✖️", description: "Tables 6-9, long multiplication, and division with remainders.", difficulty: "advanced", progress: 0, subtopics: ["Tables 6, 7, 8, 9", "Algorithms (3-digit by 1-digit)", "Division with remainders"] },
        { id: "p3-m3", name: "Equivalent Fractions", emoji: "🍰", description: "Simplest forms, comparing unlike fractions, and related fractions.", difficulty: "advanced", progress: 0, subtopics: ["Equivalent fractions", "Simplest form", "Adding/subtracting related fractions"] },
        { id: "p3-m4", name: "Geometry & Measurement", emoji: "📐", description: "Area, perimeter, angles, and compound units.", difficulty: "intermediate", progress: 0, subtopics: ["Compound units (km/m, kg/g)", "Area & Perimeter", "Angles (Right angles)", "Perpendicular & Parallel lines"] },
    ],
    Science: [
        { id: "p3-s1", name: "Diversity of Things", emoji: "🌍", description: "General characteristics and classification of living/non-living things and materials.", difficulty: "beginner", progress: 0, subtopics: ["Characteristics of living things", "Classifying plants, animals, fungi", "Physical properties of materials"] },
        { id: "p3-s2", name: "Life Cycles", emoji: "🔄", description: "Life cycles of plants and animals over time.", difficulty: "intermediate", progress: 0, subtopics: ["Plant life cycles (Seed to Adult)", "Animal life cycles (Frog, Butterfly, etc)"] },
        { id: "p3-s3", name: "Magnets", emoji: "🧲", description: "Characteristics of magnets, poles, and uses in everyday life.", difficulty: "intermediate", progress: 0, subtopics: ["Pushes and pulls", "Magnetic characteristics & poles", "Making a magnet"] },
    ],
    English: [
        { id: "p3-e1", name: "Vocabulary", emoji: "📖", description: "Practice vocabulary MCQ and cloze passages.", difficulty: "intermediate", progress: 0, subtopics: ["Vocabulary MCQ", "Vocabulary Cloze"] },
        { id: "p3-e2", name: "Grammar", emoji: "✏️", description: "Practice grammar rules, tenses, and synthesis.", difficulty: "intermediate", progress: 0, subtopics: ["Grammar MCQ", "Grammar Cloze", "Synthesis & Transformation"] },
        { id: "p3-e3", name: "Comprehension", emoji: "🔍", description: "Practice extracting information and inferring meaning.", difficulty: "advanced", progress: 0, subtopics: ["Visual Text", "Open-Ended Comprehension"] },
    ],
};

const P4_SYLLABUS: Record<Subject, SyllabusTopic[]> = {
    Math: [
        { id: "p4-m1", name: "Whole Numbers & Factors", emoji: "💯", description: "Numbers to 100,000, rounding, factors, and multiples.", difficulty: "intermediate", progress: 0, subtopics: ["Numbers to 100,000", "Rounding off", "Factors & Multiples"] },
        { id: "p4-m2", name: "Fractions & Decimals", emoji: "🍕", description: "Mixed numbers, improper fractions, and decimals to 3 places.", difficulty: "advanced", progress: 0, subtopics: ["Mixed/Improper fractions", "Fraction of a set", "Decimals (tenths, hundredths, thousandths)", "Four operations with decimals"] },
        { id: "p4-m3", name: "Geometry & Area", emoji: "📐", description: "Composite figures, line symmetry, nets, and angles in degrees.", difficulty: "advanced", progress: 0, subtopics: ["Area/Perimeter of composite figures", "Measuring angles in degrees", "Rectangle & Square properties", "Line symmetry & Nets"] },
    ],
    Science: [
        { id: "p4-s1", name: "Plant & Human Systems", emoji: "🌿", description: "Functions of plant parts and the human digestive system.", difficulty: "intermediate", progress: 0, subtopics: ["Plant parts (Leaf, Stem, Root)", "Human Digestive System"] },
        { id: "p4-s2", name: "Matter & Water", emoji: "🧊", description: "States of matter (solid, liquid, gas) and their properties.", difficulty: "intermediate", progress: 0, subtopics: ["Mass and volume", "Solid, Liquid, Gas properties"] },
        { id: "p4-s3", name: "Energy: Light & Heat", emoji: "💡", description: "Sources of heat/light, reflection, shadows, and heat transfer.", difficulty: "advanced", progress: 0, subtopics: ["Reflection and shadows", "Heat vs Temperature", "Conductors and insulators"] },
    ],
    English: [
        { id: "p4-e1", name: "Vocabulary", emoji: "📖", description: "Practice vocabulary MCQ and cloze passages.", difficulty: "intermediate", progress: 0, subtopics: ["Vocabulary MCQ", "Vocabulary Cloze"] },
        { id: "p4-e2", name: "Grammar", emoji: "✏️", description: "Practice grammar rules, tenses, and synthesis.", difficulty: "intermediate", progress: 0, subtopics: ["Grammar MCQ", "Grammar Cloze", "Synthesis & Transformation"] },
        { id: "p4-e3", name: "Comprehension", emoji: "🔍", description: "Practice extracting information and inferring meaning.", difficulty: "advanced", progress: 0, subtopics: ["Visual Text", "Open-Ended Comprehension"] },
    ],
};

const P5_SYLLABUS: Record<Subject, SyllabusTopic[]> = {
    Math: [
        { id: "p5-m1", name: "Numbers to 10 Million", emoji: "📈", description: "Four operations, order of operations, and multiplying by 10s/100s.", difficulty: "intermediate", progress: 0, subtopics: ["Numbers to 10 million", "Order of operations", "Multiply/divide by 10, 100, 1000"] },
        { id: "p5-m2", name: "Advanced Fractions", emoji: "🍰", description: "Fractions as division, multiplying fractions, and mixed numbers.", difficulty: "advanced", progress: 0, subtopics: ["Fraction & division", "Multiplying fractions", "Improper/mixed number operations"] },
        { id: "p5-m3", name: "Percentage & Rate", emoji: "💯", description: "Converting fractions to percentages, finding discounts, and rate.", difficulty: "advanced", progress: 0, subtopics: ["Percentage of a whole", "Discount, GST, Interest", "Rate calculation"] },
        { id: "p5-m4", name: "Geometry & Volume", emoji: "🧊", description: "Area of triangles, volume of cuboids, and properties of triangles/quadrilaterals.", difficulty: "advanced", progress: 0, subtopics: ["Area of triangle", "Volume of cube/cuboid", "Angles at a point/straight line", "Properties of triangles & parallelograms"] },
    ],
    Science: [
        { id: "p5-s1", name: "Reproduction Cycles", emoji: "🌱", description: "Sexual reproduction in flowering plants and humans.", difficulty: "advanced", progress: 0, subtopics: ["Plant reproduction (Pollination, Fertilisation)", "Seed dispersal & germination", "Human reproduction"] },
        { id: "p5-s2", name: "Water Cycle", emoji: "💧", description: "Changes in states of water and the importance of the water cycle.", difficulty: "intermediate", progress: 0, subtopics: ["Melting, Freezing, Boiling, Condensation", "Evaporation factors", "Water cycle importance"] },
        { id: "p5-s3", name: "Respiratory & Circulatory Systems", emoji: "🫁", description: "Transport systems in plants and humans.", difficulty: "advanced", progress: 0, subtopics: ["Human respiratory & circulatory parts", "Plant transport system", "Integration of systems"] },
        { id: "p5-s4", name: "Electrical Systems", emoji: "🔋", description: "Closed circuits, batteries, bulbs, conductors, and insulators.", difficulty: "intermediate", progress: 0, subtopics: ["Circuit components", "Closed circuits", "Conductors & Insulators", "Series/Parallel arrangements"] },
    ],
    English: [
        { id: "p5-e1", name: "Vocabulary", emoji: "📖", description: "Practice vocabulary MCQ and cloze passages.", difficulty: "intermediate", progress: 0, subtopics: ["Vocabulary MCQ", "Vocabulary Cloze"] },
        { id: "p5-e2", name: "Grammar", emoji: "✏️", description: "Practice grammar rules, tenses, and synthesis.", difficulty: "intermediate", progress: 0, subtopics: ["Grammar MCQ", "Grammar Cloze", "Synthesis & Transformation"] },
        { id: "p5-e3", name: "Comprehension", emoji: "🔍", description: "Practice extracting information and inferring meaning.", difficulty: "advanced", progress: 0, subtopics: ["Visual Text", "Open-Ended Comprehension"] },
    ],
};



export default function PopQuizPage() {
    const [activeSubject, setActiveSubject] = useState<Subject>("Math");
    // Purpose: Lesson View state — when set, shows lesson instead of grid.
    const [activeTopic, setActiveTopic] = useState<SyllabusTopic | null>(null);
    // Purpose: Sprint 97 — Collapsible sidebar toggle.
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    // Purpose: Sprint 70 — Track whether Firestore history was loaded for this topic.
    const [historyLoaded, setHistoryLoaded] = useState(false);
    // Purpose: Sprint 70 — Initial messages fetched from Firestore for useChat.
    const [initialMessages, setInitialMessages] = useState<any[]>([]);
    // Purpose: Sprint 70 — Unique chat ID per topic to force useChat re-initialization.
    const [chatKey, setChatKey] = useState(0);
    // Purpose: Sprint 100 — Loading state for topic initialization.
    const [isInitializing, setIsInitializing] = useState(false);
    // Purpose: Sprint 111 — Read student interests from localStorage (SSR-safe).
    const [studentInterests, setStudentInterests] = useState("");
    // Purpose: Sprint 121 — Quiz Master Boss HP bar (Zeigarnik Effect).
    const MAX_HP = 10;
    const [quizMasterHP, setQuizMasterHP] = useState(MAX_HP);
    // Purpose: Sprint 109 — Correct answer counter driving HP and topic progress.
    const [correctAnswers, setCorrectAnswers] = useState(0);
    // Purpose: Sprint 109 — Track last processed message ID to prevent double-counting.
    const lastProcessedMsgIdRef = useRef<string | null>(null);
    // Purpose: Sprint 121 — Confetti trigger on streak milestones.
    const [showConfetti, setShowConfetti] = useState(false);
    // Purpose: Sprint 121 — SSR-safe window dimensions for confetti.
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    // Purpose: Sprint 122 — Tutor persona for dynamic AI tone.
    const [tutorPersona, setTutorPersona] = useState("Hype Me");
    useEffect(() => {
        setStudentInterests(localStorage.getItem("studentInterests") || "");
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        setTutorPersona(localStorage.getItem("tutorPersona") || "Hype Me");
    }, []);

    // Purpose: Lesson View chat — separate useChat instance for the lesson.
    // Sprint 70: Sends topicId, subject, and topicName to the API route for
    // dynamic system prompt injection. Uses chatKey to force re-initialization
    // when switching topics. AI SDK v6: body is passed via DefaultChatTransport,
    // initial messages are passed as `messages` on ChatInit.
    const { messages: lessonMessages, sendMessage: sendLessonMessage, status: lessonStatus } = useChat({
        id: `lesson-${chatKey}`,
        messages: initialMessages.length > 0 ? initialMessages : undefined,
        transport: new DefaultChatTransport({
            api: "/api/chat",
            body: activeTopic ? {
                topicId: activeTopic.id,
                subject: activeSubject,
                topicName: activeTopic.name,
                studentInterests: studentInterests,
                tutorPersona: tutorPersona,
            } : undefined,
        }),
    });
    const [lessonInput, setLessonInput] = useState("");
    const isLessonStreaming = lessonStatus === "streaming" || lessonStatus === "submitted";

    // Purpose: Sprint 105 — Anti-Jitter. Use instant scroll during streaming to prevent layout thrashing, and smooth scroll when finished.
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: isLessonStreaming ? "auto" : "smooth"
        });
    }, [lessonMessages, isLessonStreaming]);

    // Purpose: Sprint 109 — Parse AI stream for game state (HP, topic %, confetti).
    // Only fires when streaming completes to prevent mid-stream double-counting.
    useEffect(() => {
        if (lessonMessages.length === 0 || isLessonStreaming) return;
        const lastMsg = lessonMessages[lessonMessages.length - 1];
        if (lastMsg.role !== "assistant") return;
        // Purpose: Guard against double-processing the same message on re-renders.
        if (lastProcessedMsgIdRef.current === lastMsg.id) return;
        lastProcessedMsgIdRef.current = lastMsg.id;

        const rawText = lastMsg.parts
            .filter((p) => p.type === "text")
            .map((p) => (p as any).text)
            .join("");

        // Purpose: Detect correct answer via PATH A markers from the Quizmaster prompt.
        if (rawText.includes("###NEXT_QUESTION###")) {
            setCorrectAnswers((prev) => {
                const next = prev + 1;
                setQuizMasterHP(Math.max(0, MAX_HP - next));
                // Purpose: Fire confetti on every 3rd correct answer (streak milestone).
                if (next % 3 === 0) {
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 4000);
                }
                return next;
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lessonMessages, isLessonStreaming]);

    // Purpose: Sprint 109 — Derive topic progress % from correctAnswers.
    const topicProgress = Math.min(100, Math.round((correctAnswers / MAX_HP) * 100));
    const topics = P6_SYLLABUS[activeSubject].map((t) =>
        activeTopic && t.id === activeTopic.id ? { ...t, progress: topicProgress } : t
    );

    // Purpose: Open Lesson View for a topic.
    // Sprint 70: Fetch existing conversation from Firestore before opening.
    const handleTopicClick = async (topic: SyllabusTopic) => {
        setActiveTopic(topic);
        setLessonInput("");
        setHistoryLoaded(false);
        // Purpose: Sprint 109 — Reset game state when switching topics.
        setCorrectAnswers(0);
        setQuizMasterHP(MAX_HP);
        lastProcessedMsgIdRef.current = null;
        // Purpose: Sprint 100 — Show loading spinner during Firestore fetch.
        setIsInitializing(true);

        // Purpose: Sprint 70 — Fetch Firestore lesson history for this topic.
        try {
            const res = await fetch(`/api/lessons?topicId=${topic.id}`);
            if (res.ok) {
                const data = await res.json();
                if (data.messages && data.messages.length > 0) {
                    setInitialMessages(data.messages);
                    setHistoryLoaded(true);
                } else {
                    setInitialMessages([]);
                    setHistoryLoaded(false);
                }
            } else {
                setInitialMessages([]);
                setHistoryLoaded(false);
            }
        } catch {
            setInitialMessages([]);
            setHistoryLoaded(false);
        } finally {
            // Purpose: Sprint 100 — Clear loading state regardless of success/failure.
            setIsInitializing(false);
        }
        // Purpose: Force useChat to re-initialize with new initialMessages.
        setChatKey((k) => k + 1);
    };

    // Purpose: Sprint 64/70 — Proactive Tutor. When a topic is selected and
    // no Firestore history was loaded, automatically inject an initial greeting
    // that prompts the AI to begin teaching immediately.
    useEffect(() => {
        if (activeTopic && !historyLoaded && chatKey > 0) {
            // Purpose: Small delay to ensure useChat has re-initialized with new key.
            const timer = setTimeout(() => {
                sendLessonMessage({
                    text: `Hi Quizmaster, I am ready for my Pop Quiz on ${activeTopic.name}. Please give me my first multiple-choice question.`,
                });
            }, 100);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatKey]);

    // Purpose: Send a message in the Lesson View chat.
    const handleLessonSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = lessonInput.trim();
        if (!text) return;
        sendLessonMessage({ text });
        setLessonInput("");
    };


    // Purpose: Sprint 97 — Unified 3-pane layout. Sidebar has subject nav + topic list;
    // Main area shows chat when a topic is active, empty state otherwise.
    return (
        <div className="flex-1 flex h-full bg-gray-50 dark:bg-slate-950 relative">
            {/* Purpose: Sprint 97 — LEFT SIDEBAR (collapsible w-72): Subject nav + topic list. */}
            <aside className={`${isSidebarOpen ? "w-72 flex" : "hidden"} flex-col shrink-0 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 md:flex transition-all`}>
                {/* Purpose: Subject navigation tabs inside sidebar. */}
                <div className="px-3 py-3 border-b border-gray-200 dark:border-slate-800 shrink-0">
                    <div className="flex flex-wrap gap-1.5">
                        {SUBJECT_NAV.map((sub) => {
                            const isActive = activeSubject === sub.key;
                            return (
                                <button
                                    key={sub.key}
                                    onClick={() => { setActiveSubject(sub.key); setActiveTopic(null); }}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer border ${isActive
                                        ? sub.activeColor
                                        : "bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    <sub.icon size={11} />
                                    {sub.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Purpose: Scrollable vertical topic list. */}
                <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1 min-h-0">
                    {topics.map((topic) => (
                        <button
                            key={topic.id}
                            onClick={() => handleTopicClick(topic)}
                            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left cursor-pointer ${activeTopic?.id === topic.id
                                ? "bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700"
                                : "hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent"
                                }`}
                        >
                            <span className="text-lg shrink-0">{topic.emoji}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{topic.name}</p>
                                <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1 mt-1">
                                    <div
                                        className={`h-1 rounded-full ${topic.progress >= 80 ? "bg-emerald-500" : topic.progress >= 50 ? "bg-blue-500" : topic.progress >= 20 ? "bg-amber-500" : "bg-gray-300"} transition-all duration-500`}
                                        style={{ width: `${topic.progress}%` }}
                                    />
                                </div>
                            </div>
                            <span className="text-[9px] text-gray-400 shrink-0">{topic.progress}%</span>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Purpose: RIGHT MAIN AREA — Chat or Empty State. */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Purpose: Sprint 97 — Top bar with sidebar toggle + active topic info. */}
                <header className="px-4 py-2 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
                    >
                        <PanelLeftIcon size={16} />
                    </button>
                    {activeTopic && (
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{activeTopic.emoji}</span>
                            <div>
                                <h1 className="text-sm font-bold text-gray-900 dark:text-white">{activeTopic.name}</h1>
                                <p className="text-[10px] text-gray-500">{activeSubject} • {activeTopic.difficulty}</p>
                            </div>
                        </div>
                    )}
                    {!activeTopic && (
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 dark:text-white">Syllabus Pop Quiz</h1>
                            <p className="text-[10px] text-gray-500">Select a topic to begin</p>
                        </div>
                    )}
                </header>

                {/* Purpose: Sprint 121 — Render the Quiz Master Boss Health Bar (Zeigarnik Effect). */}
                {activeTopic && (
                    <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shrink-0">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Quiz Master HP</span>
                            <span className="text-xs font-bold text-red-500">{quizMasterHP} / 10</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-red-500 transition-all duration-500 ease-out"
                                style={{ width: `${(quizMasterHP / 10) * 100}%` }}
                            />
                        </div>
                        {quizMasterHP === 0 && <p className="text-xs text-center font-bold text-emerald-500 mt-2 animate-pulse">QUIZ MASTER DEFEATED! 🎉</p>}
                    </div>
                )}

                {/* Purpose: Sprint 121 — Streak confetti overlay. */}
                {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={400} />}

                {!activeTopic ? (
                    /* Purpose: Empty state when no topic is selected. */
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-8">
                        <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                            <BrainIcon size={24} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-1">Choose a Topic</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm">
                                Select a topic from the sidebar to start your pop quiz.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Purpose: Chat area when a topic is active. */
                    <>
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0">
                            {/* Purpose: Sprint 100 — Loading spinner during topic initialization. */}
                            {isInitializing && (
                                <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
                                    <div className="w-12 h-12 rounded-full border-4 border-violet-100 dark:border-violet-900/30 border-t-violet-600 animate-spin"></div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-slate-400 animate-pulse">
                                        Quizmaster is entering the room...
                                    </p>
                                </div>
                            )}
                            {!isInitializing && lessonMessages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                                    <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                                        <BrainIcon size={22} className="text-violet-600" />
                                    </div>
                                    <p className="text-sm text-gray-500 max-w-sm">
                                        Get ready for your pop quiz on <strong>{activeTopic.name}</strong>. I will test your knowledge one question at a time.
                                    </p>
                                </div>
                            )}

                            {lessonMessages.map((msg, idx) => {
                                const isUser = msg.role === "user";
                                const rawText = msg.parts
                                    .filter((p) => p.type === "text")
                                    .map((p) => (p as any).text)
                                    .join("");
                                // Purpose: Sprint 89/108 — Dual Bubble Quizmaster UI parsing with isThinking flag.
                                const { feedback, nextQuestion, suggestions, isThinking } = isUser
                                    ? { feedback: rawText, nextQuestion: "", suggestions: [], isThinking: false }
                                    : parseQuizMessage(rawText);
                                return (
                                    <div key={msg.id} className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
                                        <div className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${isUser ? "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300" : "bg-violet-100 text-violet-600"}`}>
                                            {isUser ? <UserIcon size={12} /> : <BotIcon size={12} />}
                                        </div>
                                        <div className="max-w-[75%]">
                                            <div className="space-y-2">
                                                <div className={`rounded-xl px-3 py-2 text-base font-sans leading-relaxed ${isUser
                                                    ? "bg-gray-800 dark:bg-slate-700 text-white rounded-tr-sm"
                                                    : "bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-tl-sm"
                                                    }`}>
                                                    <span className="whitespace-pre-wrap">{feedback}</span>
                                                </div>
                                                {!isUser && nextQuestion && (
                                                    <div className="bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-xl rounded-bl-sm px-3 py-2 text-base font-sans leading-relaxed">
                                                        <span className="whitespace-pre-wrap">{nextQuestion}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Purpose: Sprint 108 — Display a pulsing thinking state while the AI calculates the scratchpad. */}
                                            {!isUser && isThinking && (
                                                <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg w-fit border border-gray-100 dark:border-slate-700">
                                                    <div className="flex gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Formulating options...</span>
                                                </div>
                                            )}
                                            {/* Purpose: Sprint 87 — Interactive Choice Engine buttons (Large MCQ format). */}
                                            {!isUser && suggestions.length > 0 && !isLessonStreaming && (
                                                <div className="flex flex-col gap-3 mt-4 w-full max-w-lg">
                                                    {suggestions.map((choice, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => sendLessonMessage({ text: choice })}
                                                            className="w-full px-5 py-4 text-left text-sm md:text-base font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-violet-500 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all shadow-sm cursor-pointer"
                                                        >
                                                            {choice}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Purpose: Sprint 113 — 3-way subject-specific secondary action button.
                                               English: Skip (maintain pacing). Math: Analogy deep-dive. Science: Option breakdown (pauses game loop). */}
                                            {!isUser && idx === lessonMessages.length - 1 && !isLessonStreaming && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {activeSubject === "English" && (
                                                        <button
                                                            onClick={() => sendLessonMessage(
                                                                { text: "⏭️ I want to skip this question." },
                                                                { body: { hiddenDirective: "The user wants to skip. Please briefly tell them the correct answer, strictly insert the ###NEXT_QUESTION### delimiter, and give a brand new question with 3 new options." } }
                                                            )}
                                                            className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 px-3 py-1.5 rounded-md transition-colors border border-amber-200 dark:border-amber-800 cursor-pointer"
                                                        >
                                                            ⏭️ I want to skip this question
                                                        </button>
                                                    )}
                                                    {activeSubject === "Math" && (
                                                        <button
                                                            onClick={() => sendLessonMessage({ text: "I'm still a bit stuck. This concept isn't quite clicking for me yet. Could you explain the hardest part one more time using a different approach? Break it down into bite-sized pieces for a 12-year-old. Using a clear analogy from everyday life in Singapore—like taking the MRT, buying food at the hawker centre, or managing pocket money—would really help me visualize it." })}
                                                            className="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 px-3 py-1.5 rounded-md transition-colors border border-violet-100 dark:border-violet-800 cursor-pointer"
                                                        >
                                                            💡 I need more help. Explain this further
                                                        </button>
                                                    )}
                                                    {activeSubject === "Science" && (
                                                        <button
                                                            onClick={() => sendLessonMessage({ text: "I'm still confused. Please break down all the options for me. Explain exactly why the correct option is right, and specifically why the other options are wrong based on the scientific concepts. Do NOT ask me a new question yet." })}
                                                            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-3 py-1.5 rounded-md transition-colors border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                                                        >
                                                            🔬 Explain why the options are right/wrong
                                                        </button>
                                                    )}
                                                    {/* Purpose: Universal advance button — lets the student manually progress
                                                       after a Science breakdown or any non-auto-advancing AI response. */}
                                                    <button
                                                        onClick={() => sendLessonMessage(
                                                            { text: "Got it! I'm ready for the next question. Let's keep the streak going!" },
                                                            { body: { hiddenDirective: "Strictly insert the ###NEXT_QUESTION### delimiter and generate a brand new PSLE question with 3 new options." } }
                                                        )}
                                                        className="text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-md transition-colors border border-blue-200 dark:border-blue-800 cursor-pointer"
                                                    >
                                                        🔄 Give me another question
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {isLessonStreaming && lessonMessages.at(-1)?.role === "user" && (
                                <div className="flex items-start gap-2">
                                    <div className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center bg-violet-100 text-violet-600">
                                        <BotIcon size={12} />
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-xl rounded-tl-sm px-3 py-2">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Purpose: Lesson chat input. */}
                        <div className="shrink-0 px-6 py-3 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <form onSubmit={handleLessonSubmit} className="flex items-end gap-2">
                                <div className="flex-1">
                                    <textarea
                                        value={lessonInput}
                                        onChange={(e) => setLessonInput(e.target.value)}
                                        placeholder={`Ask about ${activeTopic.name}...`}
                                        rows={1}
                                        className="w-full resize-none rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleLessonSubmit(e);
                                            }
                                        }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLessonStreaming || !lessonInput.trim()}
                                    className="shrink-0 w-9 h-9 rounded-lg bg-violet-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-violet-500 transition-all cursor-pointer"
                                >
                                    <SendIcon size={14} />
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

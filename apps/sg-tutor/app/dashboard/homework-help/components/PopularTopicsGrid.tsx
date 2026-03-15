// Purpose: Reusable cold-start topic grid component that renders
// subject-specific topics from the centralized syllabus data.
// Accepts `level` and `subject` props to dynamically fetch the
// correct topic set and renders gradient cards with an IconMapper.

"use client";

import { syllabus, TOPIC_GRADIENTS, type Topic } from "@/lib/constants/syllabus";
import {
    Calculator,
    PieChart,
    Compass,
    Variable,
    Gauge,
    Divide,
    BarChart3,
    Box,
    Zap,
    ArrowDownUp,
    Network,
    Leaf,
    Microscope,
    Droplets,
    BookOpen,
    HelpCircle,
    Hash,
    Plus,
    Coins,
    X,
    Scale,
    Ruler,
    Magnet,
    Baseline,
    Square,
    Sun,
    Activity,
    Percent,
    CloudRain,
    Flower2,
    CircleDashed,
    Move,
} from "lucide-react";

// Purpose: Cast lucide-react components to `any` to work around the
// ForwardRefExoticComponent / ReactNode type incompatibility in this
// project's @types/react version. Same pattern used across sg-tutor.
const CalculatorIcon = Calculator as any;
const PieChartIcon = PieChart as any;
const CompassIcon = Compass as any;
const VariableIcon = Variable as any;
const GaugeIcon = Gauge as any;
const DivideIcon = Divide as any;
const BarChart3Icon = BarChart3 as any;
const BoxIcon = Box as any;
const ZapIcon = Zap as any;
const ArrowDownUpIcon = ArrowDownUp as any;
const NetworkIcon = Network as any;
const LeafIcon = Leaf as any;
const MicroscopeIcon = Microscope as any;
const DropletsIcon = Droplets as any;
const BookOpenIcon = BookOpen as any;
const HelpCircleIcon = HelpCircle as any;
const HashIcon = Hash as any;
const PlusIcon = Plus as any;
const CoinsIcon = Coins as any;
const XIcon = X as any;
const ScaleIcon = Scale as any;
const RulerIcon = Ruler as any;
const MagnetIcon = Magnet as any;
const BaselineIcon = Baseline as any;
const SquareIcon = Square as any;
const SunIcon = Sun as any;
const ActivityIcon = Activity as any;
const PercentIcon = Percent as any;
const CloudRainIcon = CloudRain as any;
const Flower2Icon = Flower2 as any;
const CircleDashedIcon = CircleDashed as any;
const MoveIcon = Move as any;

// Purpose: Static icon mapper that converts the `iconName` string
// from the syllabus data to the actual lucide-react component.
// Uses a switch/case pattern for full TypeScript type safety —
// avoids dynamic indexing which can cause TS errors.
function IconMapper({ name, size = 24 }: { name: string; size?: number }) {
    const props = { size, className: "drop-shadow-sm" };

    switch (name) {
        case "Calculator": return <CalculatorIcon {...props} />;
        case "PieChart": return <PieChartIcon {...props} />;
        case "Compass": return <CompassIcon {...props} />;
        case "Variable": return <VariableIcon {...props} />;
        case "Gauge": return <GaugeIcon {...props} />;
        case "Divide": return <DivideIcon {...props} />;
        case "BarChart3": return <BarChart3Icon {...props} />;
        case "Box": return <BoxIcon {...props} />;
        case "Zap": return <ZapIcon {...props} />;
        case "ArrowDownUp": return <ArrowDownUpIcon {...props} />;
        case "Network": return <NetworkIcon {...props} />;
        case "Leaf": return <LeafIcon {...props} />;
        case "Microscope": return <MicroscopeIcon {...props} />;
        case "Droplets": return <DropletsIcon {...props} />;
        case "BookOpen": return <BookOpenIcon {...props} />;
        // P1–P5 icons
        case "Hash": return <HashIcon {...props} />;
        case "Plus": return <PlusIcon {...props} />;
        case "Coins": return <CoinsIcon {...props} />;
        case "X": return <XIcon {...props} />;
        case "Scale": return <ScaleIcon {...props} />;
        case "Ruler": return <RulerIcon {...props} />;
        case "Magnet": return <MagnetIcon {...props} />;
        case "Baseline": return <BaselineIcon {...props} />;
        case "Square": return <SquareIcon {...props} />;
        case "Sun": return <SunIcon {...props} />;
        case "Activity": return <ActivityIcon {...props} />;
        case "Percent": return <PercentIcon {...props} />;
        case "CloudRain": return <CloudRainIcon {...props} />;
        case "Flower": return <Flower2Icon {...props} />;
        case "CircleDashed": return <CircleDashedIcon {...props} />;
        case "Move": return <MoveIcon {...props} />;
        default: return <HelpCircleIcon {...props} />;
    }
}

// Purpose: Map subject query param values (e.g. "MATH") to the syllabus
// object keys (e.g. "math"). Handles both lowercase and uppercase inputs.
const SUBJECT_KEY_MAP: Record<string, string> = {
    MATH: "math",
    math: "math",
    SCIENCE: "science",
    science: "science",
    ENGLISH: "english",
    english: "english",
    MT: "mother_tongue",
    mother_tongue: "mother_tongue",
};

interface PopularTopicsGridProps {
    /** Purpose: Academic level key, e.g. "p6", "p5". */
    level: string;
    /** Purpose: Subject key, e.g. "MATH", "SCIENCE". */
    subject: string;
    /** Purpose: Callback fired when a student clicks a topic card. */
    onSelectTopic: (prompt: string) => void;
}

export default function PopularTopicsGrid({ level, subject, onSelectTopic }: PopularTopicsGridProps) {
    // Purpose: Resolve the topics array from the syllabus data based
    // on the current level and normalized subject key.
    const subjectKey = SUBJECT_KEY_MAP[subject] || "math";
    const levelData = syllabus[level];
    const topics: Topic[] = levelData?.[subjectKey] || [];

    // Purpose: Graceful empty state — render an informational message
    // when no topics are available for the selected level/subject
    // instead of crashing or showing a blank grid.
    if (topics.length === 0) {
        return (
            <div className="w-full max-w-lg mt-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Popular Topics 📌
                </p>
                <div className="flex items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                    <p className="text-sm text-slate-400 text-center">
                        Topics for this subject are being updated. Try another level or subject!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg mt-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Jump straight into popular topics 📌
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {topics.map((topic, idx) => {
                    // Purpose: Cycle through gradient presets to give each card
                    // a unique visual identity even when topics exceed the gradient count.
                    const gradient = TOPIC_GRADIENTS[idx % TOPIC_GRADIENTS.length];
                    return (
                        <button
                            key={topic.id}
                            onClick={() => onSelectTopic(topic.prompt)}
                            title={topic.description}
                            className={`group flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${gradient.from} ${gradient.to} text-white shadow-lg ${gradient.shadow} hover:scale-105 hover:shadow-xl transition-all duration-200 cursor-pointer`}
                        >
                            <IconMapper name={topic.iconName} size={24} />
                            <span className="text-xs font-semibold tracking-wide">{topic.title}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

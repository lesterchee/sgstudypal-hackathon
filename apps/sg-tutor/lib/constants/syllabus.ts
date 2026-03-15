// Purpose: Centralized, strongly-typed syllabus data structure for
// sg-tutor covering P1–P6 across MOE Math and Science. This is the
// single source of truth for topic metadata consumed by the
// PopularTopicsGrid and any future curriculum-aware components.

// ---------------------------------------------------------------------------
// Purpose: TypeScript interfaces for the syllabus data model.
// ---------------------------------------------------------------------------

/** Purpose: Represents a single tutoring topic within a subject. */
export interface Topic {
    /** Purpose: Unique kebab-case identifier, e.g. "p6-percentage". */
    id: string;
    /** Purpose: Human-readable display title shown on the topic card. */
    title: string;
    /** Purpose: Short description of the topic for tooltips or expanded views. */
    description: string;
    /** Purpose: String key mapped to a lucide-react icon via IconMapper.
     *  Keeps the data layer free of React component references. */
    iconName: string;
    /** Purpose: The hidden prompt sent to the AI Tutor when a student
     *  clicks this topic card. */
    prompt: string;
}

/** Purpose: Represents the subjects available at a given academic level.
 *  Uses an index signature for flexible subject keys. */
export interface SubjectData {
    [subjectKey: string]: Topic[];
}

/** Purpose: Top-level syllabus type keyed by academic level (p1–p6). */
export interface SyllabusData {
    [levelKey: string]: SubjectData;
}

// ---------------------------------------------------------------------------
// Purpose: Gradient colour presets for topic cards. Cycled through by the
// PopularTopicsGrid component to give each card a unique visual identity.
// ---------------------------------------------------------------------------

export const TOPIC_GRADIENTS = [
    { from: "from-rose-500", to: "to-pink-500", shadow: "shadow-rose-200" },
    { from: "from-cyan-500", to: "to-blue-500", shadow: "shadow-cyan-200" },
    { from: "from-violet-500", to: "to-indigo-500", shadow: "shadow-violet-200" },
    { from: "from-amber-500", to: "to-orange-500", shadow: "shadow-amber-200" },
    { from: "from-emerald-500", to: "to-teal-500", shadow: "shadow-emerald-200" },
    { from: "from-fuchsia-500", to: "to-purple-500", shadow: "shadow-fuchsia-200" },
    { from: "from-sky-500", to: "to-indigo-500", shadow: "shadow-sky-200" },
    { from: "from-lime-500", to: "to-green-500", shadow: "shadow-lime-200" },
];

// ---------------------------------------------------------------------------
// Purpose: The master syllabus data object. P1–P6 populated per the MOE
// national curriculum for Mathematics and Science.
// ---------------------------------------------------------------------------

export const syllabus: SyllabusData = {
    // -----------------------------------------------------------------------
    // Primary 1
    // -----------------------------------------------------------------------
    p1: {
        math: [
            { id: "p1-numbers", title: "Numbers to 100", description: "Counting, comparing, and ordering numbers.", iconName: "Hash", prompt: "Give me a P1 math question about counting and comparing numbers up to 100." },
            { id: "p1-addition", title: "Addition & Subtraction", description: "Basic addition and subtraction within 100.", iconName: "Plus", prompt: "Give me a simple P1 word problem involving addition and subtraction." },
            { id: "p1-money", title: "Money", description: "Counting coins and notes in Singapore Dollars.", iconName: "Coins", prompt: "Give me a P1 math question about buying items at a Singapore canteen using coins." },
        ],
    },

    // -----------------------------------------------------------------------
    // Primary 2
    // -----------------------------------------------------------------------
    p2: {
        math: [
            { id: "p2-multiplication", title: "Multiplication Tables", description: "Multiplying by 2, 3, 4, 5, and 10.", iconName: "X", prompt: "Give me a P2 word problem requiring multiplication tables." },
            { id: "p2-mass", title: "Mass & Volume", description: "Measuring in kilograms, grams, and liters.", iconName: "Scale", prompt: "Give me a P2 math question about measuring the mass of objects in kilograms." },
        ],
    },

    // -----------------------------------------------------------------------
    // Primary 3
    // -----------------------------------------------------------------------
    p3: {
        math: [
            { id: "p3-fractions", title: "Equivalent Fractions", description: "Understanding numerators and denominators.", iconName: "PieChart", prompt: "Give me a P3 question about comparing equivalent fractions." },
            { id: "p3-angles", title: "Angles & Lines", description: "Right angles, parallel and perpendicular lines.", iconName: "Ruler", prompt: "Give me a P3 geometry question identifying right angles." },
        ],
        science: [
            { id: "p3-diversity", title: "Diversity of Materials", description: "Classifying living and non-living things.", iconName: "Leaf", prompt: "Give me a P3 science question classifying different materials." },
            { id: "p3-magnets", title: "Magnets", description: "Magnetic poles and properties.", iconName: "Magnet", prompt: "Give me a P3 science question about how magnets attract and repel." },
        ],
    },

    // -----------------------------------------------------------------------
    // Primary 4
    // -----------------------------------------------------------------------
    p4: {
        math: [
            { id: "p4-decimals", title: "Decimals", description: "Addition and subtraction of decimals.", iconName: "Baseline", prompt: "Give me a P4 word problem involving money and decimals." },
            { id: "p4-area", title: "Area & Perimeter", description: "Calculating rectangles and squares.", iconName: "Square", prompt: "Give me a P4 question to find the area and perimeter of a composite figure." },
        ],
        science: [
            { id: "p4-matter", title: "States of Matter", description: "Solids, liquids, and gases.", iconName: "Droplets", prompt: "Give me a P4 science question about the properties of liquids and gases." },
            { id: "p4-heat", title: "Heat & Light Energy", description: "Heat transfer and light reflection.", iconName: "Sun", prompt: "Give me a P4 science question about heat conductivity." },
        ],
    },

    // -----------------------------------------------------------------------
    // Primary 5
    // -----------------------------------------------------------------------
    p5: {
        math: [
            { id: "p5-ratio", title: "Ratio", description: "Finding equivalent ratios.", iconName: "Activity", prompt: "Give me a challenging P5 word problem involving ratio." },
            { id: "p5-percentage", title: "Percentage", description: "Converting fractions to percentages.", iconName: "Percent", prompt: "Give me a P5 question calculating the percentage discount of an item." },
        ],
        science: [
            { id: "p5-water", title: "The Water Cycle", description: "Evaporation and condensation.", iconName: "CloudRain", prompt: "Give me a P5 science question explaining the processes in the water cycle." },
            { id: "p5-reproduction", title: "Reproduction in Plants", description: "Pollination and seed dispersal.", iconName: "Flower", prompt: "Give me a P5 science question about how seeds are dispersed." },
        ],
    },

    // -----------------------------------------------------------------------
    // Primary 6 PSLE
    // -----------------------------------------------------------------------
    p6: {
        math: [
            { id: "p6-percentage", title: "Percentage", description: "Discounts, GST, and percentage change.", iconName: "Percent", prompt: "Generate a challenging PSLE-style word problem about percentage increase." },
            { id: "p6-ratio", title: "Ratio", description: "Equivalent ratios and unchanged quantities.", iconName: "Activity", prompt: "Generate a PSLE-style word problem involving an unchanged total ratio." },
            { id: "p6-geometry", title: "Circles & Geometry", description: "Area, circumference, composite figures.", iconName: "CircleDashed", prompt: "Explain how to find the area of a composite figure made of semi-circles." },
            { id: "p6-algebra", title: "Algebra", description: "Simplifying expressions and solving unknowns.", iconName: "Calculator", prompt: "Give me a word problem to represent an unknown number using a letter." },
        ],
        science: [
            { id: "p6-energy", title: "Energy Conversion", description: "Kinetic, potential, and electrical energy.", iconName: "Zap", prompt: "Generate a PSLE-style question about energy conversion in a roller coaster." },
            { id: "p6-forces", title: "Forces", description: "Friction, gravity, and elastic spring force.", iconName: "Move", prompt: "Generate a PSLE science question analyzing frictional force." },
            { id: "p6-web", title: "Web of Life", description: "Food chains and food webs.", iconName: "Network", prompt: "Generate a PSLE science question analyzing a change in a food web." },
        ],
    },
};

// ---------------------------------------------------------------------------
// Purpose: Sprint 17 — Define the chronological MOE syllabus boundaries to
// prevent the AI from referencing advanced topics prematurely. These matrices
// are consumed by the prompt router (Sprint 19) to enforce grade-appropriate
// scope in every AI response.
// ---------------------------------------------------------------------------

// Purpose: Math Scope — P1-P6 core topics and permitted heuristics.
// Each grade lists the topics the student HAS been taught. The AI must NOT
// reference topics from higher grades.
export const MATH_SCOPE: Record<string, string[]> = {
    P1: [
        'Numbers to 100', 'Addition within 100', 'Subtraction within 100',
        'Number bonds', 'Counting in 2s, 5s, 10s', 'Shapes (square, rectangle, triangle, circle)',
        'Comparing lengths', 'Singapore money (coins and notes)',
    ],
    P2: [
        'Numbers to 1000', 'Multiplication tables (2, 3, 4, 5, 10)',
        'Division as grouping and sharing', 'Fractions (halves, quarters, thirds)',
        'Measuring mass in kg/g', 'Volume in litres',
        'Time (hours, minutes, am/pm)', 'Picture graphs',
    ],
    P3: [
        'Numbers to 10000', 'Same-denominator fractions', 'Equivalent fractions',
        'Addition and subtraction of fractions (same denominator)',
        'Right angles', 'Parallel and perpendicular lines',
        'Area in cm² (counting squares)', 'Perimeter',
        'Bar graphs', 'Time (24-hour clock, duration)',
    ],
    P4: [
        'Numbers to 100000', 'Factors and multiples',
        'Addition and subtraction of decimals (2dp)',
        'Unlike-denominator fractions (related denominators)',
        'Area and perimeter of rectangles/squares and composite figures',
        'Symmetry', 'Tessellation', 'Tables and line graphs',
        'Bar model (Part-Whole, Comparison)', 'Angles (measuring, turns)',
    ],
    P5: [
        'Numbers to 10 million', 'Percentage (fraction → %)',
        'Ratio (equivalent ratios, simplifying)',
        'Volume of cube and cuboid', 'Rate',
        'Average', 'Triangles and quadrilaterals (angle sum)',
        'Nets of cubes and cuboids', 'Pie charts',
        'Assumption Method (not simultaneous equations)',
    ],
    P6: [
        'Algebra (simple linear expressions, substitution)',
        'Percentage change (increase, decrease, GST, discount)',
        'Ratio (unchanged total, constant difference, internal transfer)',
        'Speed, distance, time', 'Circles (circumference, area, semi/quarter circles)',
        'Volume of composite solids', 'Pie charts (calculation)',
        'Bar model + Algebra combined heuristics',
    ],
};

// Purpose: Science Scope — P3-P6 themes grouped by MOE blocks.
// P1-P2 do NOT have formal Science in the Singapore syllabus.
// Lower Block = P3/P4, Upper Block = P5/P6.
export const SCIENCE_SCOPE: Record<string, string[]> = {
    P1: [],
    P2: [],
    P3: [
        'Diversity of Living Things (classifying animals, plants)',
        'Diversity of Materials (properties, use)',
        'Magnets (poles, attraction, repulsion, magnetic vs non-magnetic materials)',
        'Life Cycles (plants: seed → seedling → adult → seed)',
    ],
    P4: [
        'Life Cycles (animals: metamorphosis, 3-stage vs 4-stage)',
        'States of Matter (solid, liquid, gas, melting, freezing, boiling, condensation)',
        'Heat (gained heat / lost heat, conductors vs insulators)',
        'Light (travels in straight line, shadows, opaque/translucent/transparent)',
    ],
    P5: [
        'The Water Cycle (evaporation, condensation, precipitation)',
        'Reproduction in Plants (pollination, seed dispersal, germination)',
        'Respiratory and Circulatory Systems (human body)',
        'Cells (basic structure, plant vs animal)',
        'Electrical Systems (open/closed circuits, series circuits)',
    ],
    P6: [
        'Energy Conversion (kinetic, potential, light, heat, sound, electrical)',
        'Forces (friction, gravity, elastic spring force, effects on speed/direction)',
        'Food Chains and Food Webs (producers, consumers, predators, prey)',
        'Adaptations (structural, behavioural, for survival)',
        'Man and the Environment (impact, conservation)',
    ],
};

// Purpose: Chinese Vocabulary Scope — P1-P6 vocabulary bounds.
// Defines the complexity tier and type of vocab appropriate for each grade.
// The AI must restrict character usage and composition expectations to
// the student's grade or lower.
export const CHINESE_VOCAB: Record<string, { tier: string; categories: string[]; notes: string }> = {
    P1: {
        tier: 'Foundational',
        categories: [
            '基本笔画 (Basic strokes)',
            '家庭成员 (Family members: 爸爸, 妈妈, 哥哥, 姐姐)',
            '数字 (Numbers 一 to 十)',
            '颜色 (Colours: 红, 蓝, 绿, 黄)',
            '身体部位 (Body parts: 手, 脚, 眼睛)',
        ],
        notes: 'Mandatory Pinyin on ALL characters. Max 5 characters per sentence. Use pictures.',
    },
    P2: {
        tier: 'Foundational',
        categories: [
            '日常生活词汇 (Daily life: 学校, 老师, 朋友, 食堂)',
            '时间词汇 (Time: 今天, 明天, 昨天, 星期)',
            '食物 (Food: 饭, 面, 鸡肉, 鱼)',
            '交通工具 (Transport SG: 德士, 巴士, 地铁, MRT)',
            '动物 (Animals: 猫, 狗, 鸟, 鱼)',
        ],
        notes: 'Mandatory Pinyin on ALL characters. Simple 2-3 sentence compositions.',
    },
    P3: {
        tier: 'Intermediate',
        categories: [
            '动作词 (Action verbs: 跑, 跳, 游泳, 打球)',
            '学校生活 (School life: 考试, 功课, 假期, 图书馆)',
            '描写词 (Descriptive: 高兴, 生气, 美丽, 辛苦)',
            '新加坡地点 (SG Places: 组屋, 巴刹, 甘榜, 小贩中心)',
        ],
        notes: 'Pinyin on new/complex characters only. 4-6 sentence compositions with 起因 → 经过 → 结果.',
    },
    P4: {
        tier: 'Intermediate',
        categories: [
            '形容词进阶 (Advanced adjectives: 焦急, 兴奋, 惊讶, 感动)',
            '天气与自然 (Weather/Nature: 下雨, 太阳, 闪电, 彩虹)',
            '社区与职业 (Community/Jobs: 医生, 警察, 消防员, 清洁工人)',
            '节日 (Festivals: 农历新年, 中秋节, 端午节)',
        ],
        notes: 'Pinyin only on request. 6-8 sentence compositions with 起因 → 经过 → 结果 → 感想.',
    },
    P5: {
        tier: 'Advanced',
        categories: [
            '成语入门 (Basic idioms: 一心一意, 自言自语, 七上八下)',
            '抽象概念 (Abstract: 责任, 友谊, 团结, 勇敢)',
            '报章词汇 (News vocab: 环保, 科技, 社会, 活动)',
            '书信格式 (Letter format: 收信人, 问候语, 祝福语)',
        ],
        notes: 'No Pinyin unless requested. 8-10 sentence compositions with mandatory 感想. Introduce 好词好句.',
    },
    P6: {
        tier: 'Advanced',
        categories: [
            '高级成语 (Advanced idioms: 废寝忘食, 刻骨铭心, 半途而废)',
            '议论文词汇 (Argumentative: 虽然, 但是, 因此, 总而言之)',
            '比喻与拟人 (Figurative: simile, personification in Chinese)',
            'PSLE作文技巧 (Composition techniques: 开门见山, 设置悬念)',
        ],
        notes: 'No Pinyin. 10+ sentence compositions. Must use 2+ idioms naturally. Penalize Mainland/Taiwanese vocab per SG localization rules.',
    },
};

// Purpose: Math Model Component — renders structured JSON from the LLM
// as visual SVG bar models, counting blocks, or comparison charts.
// Supports 3 render modes: "blocks" (counting), "bar" (ratio segments),
// and "comparison" (side-by-side labelled bars).

"use client";

// Purpose: Type definitions for the structured JSON the LLM produces.
interface BlocksModel {
    render: 'blocks';
    /** Purpose: Number of counting blocks to display. */
    count: number;
    /** Purpose: Optional label displayed below the blocks. */
    label?: string;
}

interface BarModel {
    render: 'bar';
    /** Purpose: Array of segment sizes. The bar is divided proportionally. */
    parts: number[];
    /** Purpose: Optional labels for each segment. */
    labels?: string[];
}

interface ComparisonModel {
    render: 'comparison';
    /** Purpose: Items to compare — each has a label and a numeric value. */
    items: Array<{ label: string; value: number }>;
}

// Purpose: Union type for all supported model render modes.
export type MathModelData = BlocksModel | BarModel | ComparisonModel;

// Purpose: Colour palette for model segments — cycles through for visual variety.
const SEGMENT_COLORS = [
    { fill: '#8B5CF6', stroke: '#7C3AED', text: '#F5F3FF' }, // violet
    { fill: '#06B6D4', stroke: '#0891B2', text: '#ECFEFF' }, // cyan
    { fill: '#F59E0B', stroke: '#D97706', text: '#FFFBEB' }, // amber
    { fill: '#10B981', stroke: '#059669', text: '#ECFDF5' }, // emerald
    { fill: '#F43F5E', stroke: '#E11D48', text: '#FFF1F2' }, // rose
    { fill: '#6366F1', stroke: '#4F46E5', text: '#EEF2FF' }, // indigo
];

// Purpose: Props for the MathModel component.
interface MathModelProps {
    /** Purpose: The structured JSON data describing the visual model. */
    data: MathModelData;
}

// Purpose: Main component — dispatches to the correct renderer based on the
// `render` field in the structured JSON from the LLM.
export default function MathModel({ data }: MathModelProps) {
    switch (data.render) {
        case 'blocks':
            return <BlocksRenderer count={data.count} label={data.label} />;
        case 'bar':
            return <BarRenderer parts={data.parts} labels={data.labels} />;
        case 'comparison':
            return <ComparisonRenderer items={data.items} />;
        default:
            return null;
    }
}

// Purpose: Counting Blocks renderer — displays `count` square blocks in a
// horizontal row. Used for P1-P2 concrete counting exercises.
function BlocksRenderer({ count, label }: { count: number; label?: string }) {
    // Purpose: Clamp to max 20 blocks to avoid SVG overflow.
    const safeCount = Math.min(Math.max(count, 1), 20);
    const blockSize = 36;
    const gap = 6;
    const totalWidth = safeCount * (blockSize + gap) - gap;
    const svgHeight = label ? blockSize + 28 : blockSize + 8;

    return (
        <div className="inline-block rounded-xl bg-slate-50 border border-slate-200 p-4">
            <svg width={totalWidth + 8} height={svgHeight} viewBox={`0 0 ${totalWidth + 8} ${svgHeight}`}>
                {Array.from({ length: safeCount }).map((_, i) => {
                    const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
                    return (
                        <g key={i}>
                            <rect
                                x={4 + i * (blockSize + gap)}
                                y={4}
                                width={blockSize}
                                height={blockSize}
                                rx={6}
                                fill={color.fill}
                                stroke={color.stroke}
                                strokeWidth={1.5}
                            />
                            {/* Purpose: Display the count number inside each block. */}
                            <text
                                x={4 + i * (blockSize + gap) + blockSize / 2}
                                y={4 + blockSize / 2 + 5}
                                textAnchor="middle"
                                fill={color.text}
                                fontSize={14}
                                fontWeight="bold"
                            >
                                {i + 1}
                            </text>
                        </g>
                    );
                })}
                {/* Purpose: Optional label below the blocks row. */}
                {label && (
                    <text
                        x={(totalWidth + 8) / 2}
                        y={blockSize + 22}
                        textAnchor="middle"
                        fill="#64748B"
                        fontSize={12}
                        fontWeight="600"
                    >
                        {label}
                    </text>
                )}
            </svg>
        </div>
    );
}

// Purpose: Bar Model renderer — draws a horizontal bar divided into proportional
// segments. Used for ratio and fraction visualisation (Model Method).
function BarRenderer({ parts, labels }: { parts: number[]; labels?: string[] }) {
    const total = parts.reduce((sum, p) => sum + p, 0);
    if (total === 0) return null;

    const barWidth = 400;
    const barHeight = 48;
    const svgHeight = labels ? barHeight + 32 : barHeight + 8;

    // Purpose: Calculate pixel widths proportionally.
    let xOffset = 4;

    return (
        <div className="inline-block rounded-xl bg-slate-50 border border-slate-200 p-4">
            <svg width={barWidth + 8} height={svgHeight} viewBox={`0 0 ${barWidth + 8} ${svgHeight}`}>
                {parts.map((part, i) => {
                    const segmentWidth = (part / total) * barWidth;
                    const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
                    const x = xOffset;
                    xOffset += segmentWidth;

                    return (
                        <g key={i}>
                            <rect
                                x={x}
                                y={4}
                                width={segmentWidth}
                                height={barHeight}
                                rx={i === 0 ? 8 : 0}
                                fill={color.fill}
                                stroke={color.stroke}
                                strokeWidth={1.5}
                            />
                            {/* Purpose: Display the part value centred within the segment. */}
                            <text
                                x={x + segmentWidth / 2}
                                y={4 + barHeight / 2 + 5}
                                textAnchor="middle"
                                fill={color.text}
                                fontSize={16}
                                fontWeight="bold"
                            >
                                {part}
                            </text>
                            {/* Purpose: Optional label below each segment. */}
                            {labels && labels[i] && (
                                <text
                                    x={x + segmentWidth / 2}
                                    y={barHeight + 22}
                                    textAnchor="middle"
                                    fill="#64748B"
                                    fontSize={11}
                                    fontWeight="600"
                                >
                                    {labels[i]}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

// Purpose: Comparison renderer — side-by-side horizontal bars for comparing
// two or more quantities. Each bar has a label and scales proportionally
// to the maximum value.
function ComparisonRenderer({ items }: { items: Array<{ label: string; value: number }> }) {
    const maxValue = Math.max(...items.map((item) => item.value), 1);
    const maxBarWidth = 320;
    const barHeight = 32;
    const rowHeight = barHeight + 16;
    const svgHeight = items.length * rowHeight + 8;

    return (
        <div className="inline-block rounded-xl bg-slate-50 border border-slate-200 p-4">
            <svg width={maxBarWidth + 100} height={svgHeight} viewBox={`0 0 ${maxBarWidth + 100} ${svgHeight}`}>
                {items.map((item, i) => {
                    const barWidth = (item.value / maxValue) * maxBarWidth;
                    const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
                    const y = 4 + i * rowHeight;

                    return (
                        <g key={i}>
                            {/* Purpose: Label to the left of the bar. */}
                            <text
                                x={4}
                                y={y + barHeight / 2 + 5}
                                fill="#334155"
                                fontSize={13}
                                fontWeight="600"
                            >
                                {item.label}
                            </text>
                            {/* Purpose: Proportional bar. */}
                            <rect
                                x={60}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                rx={6}
                                fill={color.fill}
                                stroke={color.stroke}
                                strokeWidth={1.5}
                            />
                            {/* Purpose: Value displayed at the end of the bar. */}
                            <text
                                x={60 + barWidth + 8}
                                y={y + barHeight / 2 + 5}
                                fill="#64748B"
                                fontSize={13}
                                fontWeight="bold"
                            >
                                {item.value}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

import React from 'react';

// Purpose: Defines the structure for a single slice of data in the PieChart.
export interface PieChartData {
    label: string;
    value: number;
    color?: string; // Optional custom color
}

// Purpose: Defines the properties for configuring the PieChart component.
export interface PieChartProps {
    data: PieChartData[];
    title?: string;
    description?: string;
    emptyStateMessage?: string;
}

// Purpose: Default color palette for chart segments if custom colors are omitted.
const DEFAULT_COLORS = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#6366f1', // indigo-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
];

// Purpose: A visual component that renders a stylized, CSS-based pie chart for displaying proportional data sets.
export const PieChart: React.FC<PieChartProps> = ({ data, title, description, emptyStateMessage = "No data available" }) => {
    if (!data || data.length === 0) {
        return (
            <div className="p-6 border rounded-xl bg-white shadow-sm flex flex-col items-center justify-center min-h-[250px] text-center">
                <p className="text-sm text-slate-500">{emptyStateMessage}</p>
            </div>
        );
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);

    // CSS Conic Gradient string generation for the pie chart effect
    let currentAngle = 0;
    const conicGradientString = data.map((item, index) => {
        const percentage = total > 0 ? (item.value / total) * 100 : 0;
        const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
        const start = currentAngle;
        const end = currentAngle + percentage;
        currentAngle = end;
        return `${color} ${start}% ${end}%`;
    }).join(', ');

    return (
        <div className="p-6 border rounded-xl bg-white shadow-sm">
            {title && <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>}
            {description && <p className="text-sm text-slate-500 mb-6">{description}</p>}

            <div className="flex flex-col sm:flex-row items-center gap-8">
                {/* Visual Chart */}
                <div
                    className="w-48 h-48 rounded-full shadow-inner flex-shrink-0"
                    style={{
                        background: `conic-gradient(${conicGradientString})`
                    }}
                />

                {/* Legend & Details */}
                <div className="flex-1 w-full space-y-3">
                    {data.map((item, index) => {
                        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                        const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];

                        return (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="font-medium text-slate-700 truncate max-w-[150px]" title={item.label}>
                                        {item.label}
                                    </span>
                                </div>
                                <div className="text-slate-600 font-medium">
                                    {percentage}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

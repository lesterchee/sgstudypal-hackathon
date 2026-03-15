import React from 'react';

// Purpose: Defines the data structure for a single bar in the graph.
export interface BarGraphData {
    label: string;
    value: number;
    color?: string; // Optional custom color
}

// Purpose: Defines the properties for configuring the BarGraph component.
export interface BarGraphProps {
    data: BarGraphData[];
    title?: string;
    description?: string;
    maxValue?: number; // Optional enforced max value, otherwise calculated from data
    valuePrefix?: string; // e.g "$ "
}

// Purpose: Fallback default colors for the bars if custom ones are not provided.
const DEFAULT_COLORS = [
    '#3b82f6', // blue-500
    '#f43f5e', // rose-500
    '#10b981', // emerald-500
    '#8b5cf6', // violet-500
];

// Purpose: A visual component that renders a stylized horizontal bar graph from an array of data points.
export const BarGraph: React.FC<BarGraphProps> = ({ data, title, description, maxValue, valuePrefix = "" }) => {
    if (!data || data.length === 0) {
        return (
            <div className="p-6 border rounded-xl bg-white shadow-sm flex flex-col items-center justify-center min-h-[250px] text-center">
                <p className="text-sm text-slate-500">No data available to display</p>
            </div>
        );
    }

    // Determine the maximum value for scaling the bars relative to the container
    const computedMax = maxValue ?? Math.max(...data.map(d => d.value), 1); // Avoid division by 0

    return (
        <div className="p-6 border rounded-xl bg-white shadow-sm w-full">
            {title && <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>}
            {description && <p className="text-sm text-slate-500 mb-6">{description}</p>}

            <div className="space-y-5">
                {data.map((item, index) => {
                    const widthPercentage = Math.min((item.value / computedMax) * 100, 100);
                    const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];

                    return (
                        <div key={index} className="w-full">
                            <div className="flex justify-between items-end mb-1 text-sm">
                                <span className="font-medium text-slate-700">{item.label}</span>
                                <span className="font-semibold text-slate-900">
                                    {valuePrefix}{item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500 ease-out"
                                    style={{
                                        width: `${widthPercentage}%`,
                                        backgroundColor: color
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

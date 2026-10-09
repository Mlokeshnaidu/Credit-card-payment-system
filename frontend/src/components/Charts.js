import React, { useState } from 'react';

// Palette for categories
export const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#64748b', // slate
];

/**
 * Responsive SVG Line Chart for Monthly Trends
 */
export function SpendingLineChart({ data = [], title = 'Monthly Spending Trend', height = 220 }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="card-glass p-5 flex flex-col items-center justify-center h-52 text-slate-400">
        <p className="text-sm">No monthly trend data available yet</p>
      </div>
    );
  }

  const values = data.map((d) => d.total_amount || 0);
  const maxVal = Math.max(...values, 1000);
  const paddingX = 45;
  const paddingY = 30;
  const chartWidth = 550;
  const chartHeight = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i * (chartWidth - paddingX * 2)) / Math.max(data.length - 1, 1);
    const y = paddingY + chartHeight - (d.total_amount / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');
  const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} ${paddingY + chartHeight} L ${points[0].x} ${paddingY + chartHeight} Z` : '';

  return (
    <div className="card-glass p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Historical expense volume over time</p>
        </div>
        {hoverIndex !== null && points[hoverIndex] && (
          <div className="text-right animate-fadeIn">
            <span className="text-xs font-semibold text-slate-400">{points[hoverIndex].month}: </span>
            <span className="text-sm font-extrabold text-blue-500">₹{points[hoverIndex].total_amount.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${height}`} className="w-full h-auto min-w-[320px]">
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingY + chartHeight * (1 - ratio);
            const val = maxVal * ratio;
            return (
              <g key={ratio}>
                <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
                <text x={paddingX - 8} y={y + 3} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                  {val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val.toFixed(0)}`}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {areaD && <path d={areaD} fill="url(#chartGradient)" />}

          {/* Line Stroke */}
          {pathD && <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Data Points */}
          {points.map((pt, i) => (
            <g key={i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)} className="cursor-pointer">
              <circle cx={pt.x} cy={pt.y} r={hoverIndex === i ? 6 : 4} className={`transition-all duration-150 ${hoverIndex === i ? 'fill-blue-400 stroke-white dark:stroke-slate-900 stroke-2' : 'fill-blue-600'}`} />
              <text x={pt.x} y={height - 8} textAnchor="middle" className="text-[10px] fill-slate-500 dark:text-slate-400 font-medium">
                {pt.month_short || pt.month?.split(' ')[0]}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

/**
 * Donut / Pie Chart for Category-Wise Expenses
 */
export function CategoryPieChart({ categories = [], title = 'Category-Wise Expenses' }) {
  const [activeCategory, setActiveCategory] = useState(null);

  const cleanCategories = (categories || []).filter((c) => (c.amount || 0) > 0);
  const totalAmount = cleanCategories.reduce((sum, c) => sum + (c.amount || 0), 0);

  if (!cleanCategories.length) {
    return (
      <div className="card-glass p-6 flex flex-col items-center justify-center h-64 text-slate-400">
        <p className="text-sm">No categorized expenses recorded yet</p>
      </div>
    );
  }

  // Calculate SVG Donut strokeDasharray segments
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const segments = cleanCategories.map((c, i) => {
    const pct = totalAmount > 0 ? c.amount / totalAmount : 0;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += pct;
    const color = CHART_COLORS[i % CHART_COLORS.length];
    return { ...c, color, strokeDasharray, strokeDashoffset, pct: (pct * 100).toFixed(1) };
  });

  return (
    <div className="card-glass p-6">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Distribution across spending categories</p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-around gap-6">
        {/* Donut SVG */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90 transform">
            <circle cx="80" cy="80" r={radius} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="18" />
            {segments.map((seg, idx) => (
              <circle
                key={idx}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={activeCategory === seg.category ? 22 : 18}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setActiveCategory(seg.category)}
                onMouseLeave={() => setActiveCategory(null)}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xs text-slate-400 font-semibold uppercase">Total</span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">₹{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-2 max-h-48 overflow-y-auto pr-2">
          {segments.map((seg) => (
            <div
              key={seg.category}
              className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                activeCategory === seg.category ? 'bg-slate-200/80 dark:bg-slate-800/80 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
              onMouseEnter={() => setActiveCategory(seg.category)}
              onMouseLeave={() => setActiveCategory(null)}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }}></span>
                <span className="text-slate-700 dark:text-slate-300">{seg.label || seg.category}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-900 dark:text-white">₹{seg.amount.toLocaleString()}</span>
                <span className="text-slate-400 font-mono w-10 text-right">{seg.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Credit Utilization Progress Gauge & Bar
 */
export function UtilizationGauge({ percentage = 0, totalLimit = 50000, totalSpent = 0 }) {
  const pct = Math.min(Math.max(percentage, 0), 100);

  // Status and color based on percentage thresholds
  let colorClass = 'from-emerald-500 to-teal-400';
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let statusText = 'Optimal (<30%)';

  if (pct > 70) {
    colorClass = 'from-rose-500 to-red-600';
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    statusText = 'High Risk (>70%)';
  } else if (pct > 30) {
    colorClass = 'from-amber-500 to-orange-400';
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    statusText = 'Moderate (30-70%)';
  }

  return (
    <div className="card-glass p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Credit Utilization</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Used credit versus overall sanctioned limit</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}>
          {statusText}
        </span>
      </div>

      <div className="my-4">
        <div className="flex justify-between items-end mb-1.5">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{pct.toFixed(1)}%</span>
          <span className="text-xs text-slate-400">
            ₹{totalSpent.toLocaleString()} of ₹{totalLimit.toLocaleString()}
          </span>
        </div>
        {/* Multi-step progress bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700/50">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-700 ease-out`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-slate-400 block">Available Credit</span>
          <span className="font-bold text-emerald-500 text-sm">₹{Math.max(0, totalLimit - totalSpent).toLocaleString()}</span>
        </div>
        <div className="text-right">
          <span className="text-slate-400 block">Total Sanctioned Limit</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">₹{totalLimit.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

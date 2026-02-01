export const Gauge = ({ value, max = 100, label, unit = '%', size = 120 }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const radius = (size - 16) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    // Color based on value
    const getColor = () => {
        if (percentage >= 90) return '#FF003C';
        if (percentage >= 70) return '#FFB800';
        return '#00FF41';
    };

    return (
        <div className="gauge-container" style={{ width: size, height: size }} data-testid={`gauge-${label?.toLowerCase().replace(/\s/g, '-')}`}>
            <svg className="gauge-svg" width={size} height={size}>
                {/* Background circle */}
                <circle
                    className="gauge-bg"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                />
                {/* Progress circle */}
                <circle
                    className="gauge-fill"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    style={{
                        stroke: getColor(),
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                    }}
                />
            </svg>
            <div className="gauge-text">
                <div className="text-2xl font-bold text-glow" style={{ color: getColor() }}>
                    {value.toFixed(1)}
                </div>
                <div className="text-xs text-[var(--matrix-dark)] uppercase">
                    {unit}
                </div>
            </div>
        </div>
    );
};

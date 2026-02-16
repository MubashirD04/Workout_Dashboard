
const ConsistencyHeatmap = () => {
    // Generate 90 days of dummy data
    const days = Array.from({ length: 90 }, (_, i) => {
        // Random intensity: 0 (no workout), 1 (light), 2 (medium), 3 (heavy)
        const intensity = Math.floor(Math.random() * 4);
        return { day: i, intensity };
    });

    const getIntensityClass = (intensity: number) => {
        switch (intensity) {
            case 0: return 'bg-slate-800/50';
            case 1: return 'bg-primary/30';
            case 2: return 'bg-primary/60';
            case 3: return 'bg-primary shadow-glow';
            default: return 'bg-slate-800/50';
        }
    };

    return (
        <div className="w-full h-full glass-card p-6">
            <h3 className="text-xl font-bold mb-4 text-primary text-glow">Configuration Consistency (Last 90 Days)</h3>
            <div className="flex flex-wrap gap-1 justify-center">
                {days.map((d) => (
                    <div
                        key={d.day}
                        className={`w-3 h-3 rounded-sm ${getIntensityClass(d.intensity)} transition-all duration-300 hover:scale-125`}
                        title={`Day ${d.day + 1}: ${['Rest', 'Light', 'Medium', 'Heavy'][d.intensity]}`}
                    />
                ))}
            </div>
            <div className="flex items-center justify-end mt-4 gap-2 text-xs text-slate-400">
                <span>Less</span>
                <div className="w-3 h-3 rounded-sm bg-slate-800/50"></div>
                <div className="w-3 h-3 rounded-sm bg-primary/30"></div>
                <div className="w-3 h-3 rounded-sm bg-primary/60"></div>
                <div className="w-3 h-3 rounded-sm bg-primary shadow-glow"></div>
                <span>More</span>
            </div>
        </div>
    );
};

export default ConsistencyHeatmap;

import React from 'react';

// A loose network/constellation motif — same topology (edge list) redrawn at four
// slightly different node layouts. Each layout is an absolutely-positioned SVG
// "frame" that crossfades into the next on a loop, giving a hand-drawn,
// vector-style ambient animation without any video/image assets.
const EDGES: [number, number][] = [
    [0, 1], [1, 2], [2, 6], [6, 7], [7, 8], [8, 9],
    [9, 5], [5, 3], [3, 4], [4, 0], [2, 3], [6, 9],
];

const FRAMES: [number, number][][] = [
    [[120, 180], [340, 90], [560, 220], [300, 380], [80, 480], [520, 520], [760, 340], [980, 160], [1080, 420], [880, 560]],
    [[150, 160], [370, 120], [540, 260], [330, 340], [110, 450], [560, 480], [730, 300], [950, 200], [1050, 380], [860, 520]],
    [[140, 200], [360, 80], [580, 200], [310, 400], [90, 460], [500, 540], [780, 360], [1000, 140], [1090, 440], [900, 580]],
    [[130, 170], [350, 100], [555, 235], [295, 370], [85, 470], [515, 510], [755, 330], [975, 175], [1075, 410], [875, 550]],
];

const FRAME_DURATION = 16;
const FRAME_DELAY = FRAME_DURATION / FRAMES.length;

const NetworkFrame: React.FC<{ nodes: [number, number][]; delay: number }> = ({ nodes, delay }) => (
    <svg
        className="landing-bg-frame"
        style={{ animationDelay: `${delay}s` }}
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
    >
        {EDGES.map(([a, b], i) => (
            <line
                key={i}
                x1={nodes[a][0]} y1={nodes[a][1]}
                x2={nodes[b][0]} y2={nodes[b][1]}
                stroke="var(--color-primary)"
                strokeWidth={1.1}
                strokeOpacity={0.35}
            />
        ))}
        {nodes.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 4.5 : 3} fill="var(--color-primary)" fillOpacity={0.6} />
        ))}
    </svg>
);

const LandingBackground: React.FC = () => {
    return (
        <div className="landing-bg" aria-hidden="true">
            <div className="landing-bg-blob landing-bg-blob-a" />
            <div className="landing-bg-blob landing-bg-blob-b" />
            <div className="landing-bg-blob landing-bg-blob-c" />

            {FRAMES.map((nodes, i) => (
                <NetworkFrame key={i} nodes={nodes} delay={i * FRAME_DELAY} />
            ))}

            <div className="landing-bg-grid" />
            <div className="landing-bg-fade" />

            <style>{`
                .landing-bg {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                    z-index: 0;
                    background: var(--color-slate-950);
                }
                .landing-bg-blob {
                    position: absolute;
                    border-radius: 9999px;
                    filter: blur(90px);
                    opacity: 0.55;
                    will-change: transform;
                }
                .landing-bg-blob-a {
                    width: 42vw;
                    height: 42vw;
                    top: -10%;
                    left: -8%;
                    background: radial-gradient(circle, var(--color-primary-glow), transparent 70%);
                    animation: landing-drift-a 26s ease-in-out infinite;
                }
                .landing-bg-blob-b {
                    width: 34vw;
                    height: 34vw;
                    bottom: -12%;
                    right: -6%;
                    background: radial-gradient(circle, rgba(193, 117, 74, 0.22), transparent 70%);
                    animation: landing-drift-b 32s ease-in-out infinite;
                }
                .landing-bg-blob-c {
                    width: 26vw;
                    height: 26vw;
                    top: 30%;
                    right: 22%;
                    background: radial-gradient(circle, rgba(193, 117, 74, 0.14), transparent 70%);
                    animation: landing-drift-c 22s ease-in-out infinite;
                }
                .landing-bg-frame {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    animation: landing-frame-cycle ${FRAME_DURATION}s linear infinite;
                }
                .landing-bg-grid {
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
                    background-size: 56px 56px;
                    mask-image: radial-gradient(ellipse 80% 60% at 50% 20%, black, transparent 75%);
                }
                .landing-bg-fade {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, rgba(8, 9, 12, 0.35) 0%, rgba(8, 9, 12, 0.55) 55%, var(--color-slate-950) 100%);
                }

                @keyframes landing-drift-a {
                    0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
                    50% { transform: translate3d(6%, 8%, 0) scale(1.12); }
                }
                @keyframes landing-drift-b {
                    0%, 100% { transform: translate3d(0, 0, 0) scale(1.05); }
                    50% { transform: translate3d(-7%, -6%, 0) scale(0.95); }
                }
                @keyframes landing-drift-c {
                    0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
                    50% { transform: translate3d(-5%, 9%, 0) scale(1.18); }
                }
                @keyframes landing-frame-cycle {
                    0% { opacity: 0; }
                    6% { opacity: 1; }
                    22% { opacity: 1; }
                    30% { opacity: 0; }
                    100% { opacity: 0; }
                }

                @media (prefers-reduced-motion: reduce) {
                    .landing-bg-blob, .landing-bg-frame {
                        animation: none !important;
                    }
                    .landing-bg-frame:first-of-type {
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default LandingBackground;

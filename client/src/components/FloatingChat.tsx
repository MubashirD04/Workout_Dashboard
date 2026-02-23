import React, { useState, useRef, useEffect } from 'react';
import { chatApi } from '../api/chatApi';

interface Message {
    id?: number;
    role: 'user' | 'assistant';
    content: string;
    sources?: string[];
}

const FloatingChat: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-expand textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        const question = input;
        setInput('');
        setLoading(true);

        try {
            const response = await chatApi.ask(question, conversationId ?? undefined);
            if (!conversationId && response.conversationId) {
                setConversationId(response.conversationId);
            }
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: response.answer, sources: response.sources },
            ]);
        } catch (error: any) {
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: error?.error || error?.message || 'Something went wrong. Please try again.' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setConversationId(null);
    };

    /* ── Collapsed button ── */
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '1.5rem',
                    right: '1.5rem',
                    zIndex: 9999,
                    width: '3.5rem',
                    height: '3.5rem',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(249,115,22,0.4), 0 4px 20px rgba(0,0,0,0.4)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                aria-label="Open AI coach"
            >
                {/* Chat bubble icon */}
                <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            </button>
        );
    }

    /* ── Expanded panel ── */
    return (
        <div
            style={{
                position: 'fixed',
                bottom: '1.5rem',
                right: '1.5rem',
                zIndex: 9999,
                width: '22rem',
                height: '38rem',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '1rem',
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)',
                background: '#0f172a',
            }}
        >
            {/* Header */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: '2rem', height: '2rem', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <div style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>AI Coach</div>
                        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem' }}>Fitness &amp; Nutrition</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={handleNewChat} title="New chat" style={iconBtnStyle}>
                        <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                    <button onClick={() => setIsOpen(false)} title="Close" style={iconBtnStyle}>
                        <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '1rem',
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                background: '#020617',
            }}>
                {messages.length === 0 && (
                    <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        color: '#64748b', textAlign: 'center', padding: '1rem',
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💪</div>
                        <p style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>Hi! I'm your AI fitness coach.</p>
                        <p style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>I have access to:</p>
                        <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.72rem', textAlign: 'left' }}>
                            {['Your workout history', 'Your cardio sessions', 'Your body metrics', '6 professional fitness books'].map(item => (
                                <li key={item} style={{ marginBottom: '0.2rem' }}>✓ {item}</li>
                            ))}
                        </ul>
                        <p style={{ marginTop: '0.75rem', fontSize: '0.75rem' }}>Ask me anything!</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                            maxWidth: '85%',
                            background: msg.role === 'user'
                                ? 'linear-gradient(135deg, #f97316, #ea580c)'
                                : '#1e293b',
                            color: 'white',
                            borderRadius: msg.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.8rem',
                            lineHeight: 1.5,
                        }}>
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</p>
                            {msg.sources && msg.sources.length > 0 && (
                                <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>Sources:</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                        {msg.sources.map((src, i) => (
                                            <span key={i} style={{
                                                fontSize: '0.62rem', background: 'rgba(255,255,255,0.1)',
                                                padding: '0.1rem 0.4rem', borderRadius: '0.25rem',
                                            }}>{src}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{
                            background: '#1e293b', borderRadius: '1rem 1rem 1rem 0.25rem',
                            padding: '0.6rem 0.85rem', display: 'flex', gap: '0.3rem', alignItems: 'center',
                        }}>
                            {[0, 150, 300].map(delay => (
                                <span key={delay} style={{
                                    width: '6px', height: '6px', borderRadius: '50%',
                                    background: '#64748b', display: 'inline-block',
                                    animation: 'bounce 1s ease-in-out infinite',
                                    animationDelay: `${delay}ms`,
                                }} />
                            ))}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
                padding: '0.65rem', background: '#0f172a',
                borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything..."
                        disabled={loading}
                        style={{
                            flex: 1,
                            background: '#1e293b',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '0.5rem',
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.8rem',
                            color: 'white',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            resize: 'none',
                            overflow: 'hidden',
                            minHeight: '2.2rem',
                            maxHeight: '120px',
                            lineHeight: '1.4',
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        style={{
                            background: input.trim() && !loading ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#1e293b',
                            border: 'none',
                            borderRadius: '0.5rem',
                            padding: '0.45rem 0.85rem',
                            color: 'white',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                            opacity: input.trim() && !loading ? 1 : 0.4,
                            transition: 'all 0.2s',
                        }}
                    >
                        Send
                    </button>
                </div>
            </div>

            {/* Bounce animation */}
            <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
        </div>
    );
};

const iconBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.25rem',
    opacity: 0.8,
    transition: 'opacity 0.2s',
};

export default FloatingChat;

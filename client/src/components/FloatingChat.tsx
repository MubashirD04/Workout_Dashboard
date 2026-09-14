import React, { useState, useRef, useEffect } from 'react';
import { useAction, useMutation } from 'convex/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { getErrorMessage } from '../utils/errorUtils';

interface Message {
    id?: number;
    role: 'user' | 'assistant';
    content: string;
    sources?: string[];
}

interface FloatingChatProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatMarkdown: React.FC<{ content: string }> = ({ content }) => (
    <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
            p: ({ children }) => <p className="whitespace-pre-wrap break-words mb-1.5 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            a: ({ children, href }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary-hover break-words">
                    {children}
                </a>
            ),
            ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5 last:mb-0">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5 last:mb-0">{children}</ol>,
            li: ({ children }) => <li className="whitespace-pre-wrap break-words">{children}</li>,
            h1: ({ children }) => <h1 className="text-[0.95rem] font-bold text-white mt-2 mb-1 first:mt-0">{children}</h1>,
            h2: ({ children }) => <h2 className="text-[0.88rem] font-bold text-white mt-2 mb-1 first:mt-0">{children}</h2>,
            h3: ({ children }) => <h3 className="text-[0.82rem] font-bold text-white mt-1.5 mb-1 first:mt-0">{children}</h3>,
            blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-primary/60 pl-2 my-1.5 text-slate-300 italic">{children}</blockquote>
            ),
            hr: () => <hr className="my-2 border-white/10" />,
            code: ({ children, className }) => {
                const isBlock = /language-/.test(className || '');
                return isBlock ? (
                    <code className={`block whitespace-pre-wrap break-words ${className || ''}`}>{children}</code>
                ) : (
                    <code className="bg-white/10 rounded px-1 py-0.5 text-[0.75rem] font-mono break-words">{children}</code>
                );
            },
            pre: ({ children }) => (
                <pre className="bg-slate-950/70 border border-white/10 rounded-lg p-2 my-1.5 overflow-x-auto text-[0.75rem] font-mono">{children}</pre>
            ),
            table: ({ children }) => (
                <div className="overflow-x-auto my-1.5">
                    <table className="w-full border-collapse text-[0.75rem]">{children}</table>
                </div>
            ),
            thead: ({ children }) => <thead className="border-b border-white/15">{children}</thead>,
            th: ({ children }) => <th className="text-left font-semibold text-white px-1.5 py-1 whitespace-nowrap">{children}</th>,
            td: ({ children }) => <td className="px-1.5 py-1 border-t border-white/[0.06] align-top">{children}</td>,
        }}
    >
        {content}
    </ReactMarkdown>
);

const FloatingChat: React.FC<FloatingChatProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [convexConversationId, setConvexConversationId] = useState<Id<"conversations"> | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { user } = useCurrentUser();
    const askQuestion = useAction(api.chat.askQuestion);
    const createConversation = useMutation(api.chat.createConversation);

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
        if (!input.trim() || loading || !user) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        const question = input;
        setInput('');
        setLoading(true);

        try {
            let convId = convexConversationId;
            if (!convId) {
                convId = await createConversation({});
                setConvexConversationId(convId);
            }

            const response = await askQuestion({
                question,
                conversationId: convId,
                targetUserId: user._id,
            });

            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: response.answer, sources: response.sources },
            ]);
        } catch (error) {
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: getErrorMessage(error, 'Something went wrong. Please try again.') },
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
        setConvexConversationId(null);
    };

    return (
        <div
            className={`fixed z-[9999] bottom-6 right-6 w-[calc(100%-3rem)] sm:w-[380px] h-[600px] max-h-[calc(100vh-120px)] flex flex-col transition-all duration-300 ease-in-out ${isOpen
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 translate-y-8 pointer-events-none'
                }`}
            aria-hidden={!isOpen}
        >
            {/* Inner styled panel (This is where we apply the glassmorphism card styling) */}
            <div className="glass-card flex-1 flex flex-col overflow-hidden h-full">

                {/* --- Header --- */}
                <div className="flex items-center justify-between gap-2 px-4 py-3.5 bg-gradient-to-r from-primary to-primary-hover shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div className="min-w-0 leading-tight">
                            <p className="text-white font-bold text-sm truncate">AI Coach</p>
                            <p className="text-white/75 text-[11px] truncate">Fitness &amp; Nutrition</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={handleNewChat}
                            title="New chat"
                            className="p-1.5 rounded-lg text-white/85 hover:text-white hover:bg-white/10 transition-colors outline-none focus:outline-none"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                        <button
                            onClick={onClose}
                            title="Close"
                            className="p-1.5 rounded-lg text-white/85 hover:text-white hover:bg-white/10 transition-colors outline-none focus:outline-none"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* --- Messages --- */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-950/60">
                    {messages.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 text-muted">
                            <div className="text-3xl mb-2">💪</div>
                            <p className="text-sm text-slate-300 mb-2">Hi! I'm your AI fitness coach.</p>
                            <p className="eyebrow mb-2">I have access to</p>
                            <ul className="text-left space-y-1">
                                {['Your workout history', 'Your cardio sessions', 'Your body metrics', '6 professional fitness books'].map(item => (
                                    <li key={item} className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <span className="text-primary">✓</span> {item}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-slate-400 mt-3">Ask me anything!</p>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[85%] px-3 py-2 text-[0.8rem] leading-relaxed ${msg.role === 'user'
                                    ? 'bg-primary text-white rounded-2xl rounded-br-md'
                                    : 'bg-slate-850/80 border border-white/[0.06] text-slate-100 rounded-2xl rounded-bl-md'
                                    }`}
                            >
                                {msg.role === 'assistant' ? (
                                    <ChatMarkdown content={msg.content} />
                                ) : (
                                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                )}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-1.5 pt-1.5 border-t border-white/10">
                                        <p className="text-[10px] text-white/50 mb-1">Sources:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {msg.sources.map((src, i) => (
                                                <span key={i} className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">
                                                    {src}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-850/80 border border-white/[0.06] rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-1">
                                {[0, 150, 300].map(delay => (
                                    <span
                                        key={delay}
                                        className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                                        style={{ animationDelay: `${delay}ms` }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* --- Input --- */}
                <div className="px-3 py-2.5 bg-slate-900/80 border-t border-white/[0.06] shrink-0">
                    <div className="flex items-end gap-2">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything..."
                            disabled={loading}
                            className="flex-1 min-h-[2.2rem] max-h-[120px] resize-none overflow-hidden bg-slate-850/80 border border-white/10 rounded-xl px-3 py-2 text-[0.8rem] leading-relaxed text-white placeholder:text-slate-500 outline-none focus:border-primary transition-colors"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className={`px-3.5 py-2 rounded-xl text-[0.78rem] font-bold shrink-0 transition-all ${input.trim() && !loading
                                ? 'bg-primary text-white hover:bg-primary-hover shadow-glow-sm'
                                : 'bg-slate-850/80 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            Send
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FloatingChat;
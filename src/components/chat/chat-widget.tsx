"use client";

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatWidgetProps {
    storeId: string;
    storeName: string;
    primaryColor: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'data';
    content: string;
}

export default function ChatWidget({ storeId, storeName, primaryColor }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Using standard useChat bindings
    const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
        // @ts-expect-error - Suppressing Vercel api options mismatch in certain environments
        api: '/api/chat',
        body: { storeId },
        maxSteps: 5,
        initialMessages: [
            { id: '1', role: 'assistant', content: `Hi there! I'm the digital assistant for ${storeName}. What are you looking for today?` }
        ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    const onClearChat = () => {
        setMessages([
            { id: '1', role: 'assistant', content: `Hi there! I'm the digital assistant for ${storeName}. What are you looking for today?` }
        ]);
    };

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-16 right-0 mb-4 w-80 sm:w-96 bg-card border border-border/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-sm"
                        style={{ maxHeight: 'calc(100vh - 120px)', height: '500px' }}
                    >
                        {/* Chat Header */}
                        <div 
                            className="p-4 flex items-center justify-between text-white shrink-0 shadow-sm z-10"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner">
                                    <Bot className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold leading-tight tracking-tight text-white">{storeName} Assistant</span>
                                    <span className="text-[10px] text-white/80 uppercase tracking-widest font-bold">Online</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={onClearChat}
                                    title="Clear Chat"
                                    className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 text-white"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </button>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 text-white"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-canvas/30">
                            {messages.map((msg: Message) => {
                                return (
                                <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        
                                        {/* Avatar */}
                                        <div className={`shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[10px] shadow-sm ${
                                            msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-secondary text-foreground border border-border/50'
                                        }`}>
                                            {msg.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                                        </div>
                                        
                                        {/* Bubble */}
                                        <div className={`px-4 py-2.5 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-sm text-sm ${
                                            msg.role === 'user' 
                                                ? 'bg-indigo-600 text-white rounded-br-sm' 
                                                : 'bg-card border border-border/50 text-foreground rounded-bl-sm'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                            {isLoading && (
                                <div className="flex w-full justify-start">
                                    <div className="flex items-end gap-2 max-w-[85%]">
                                        <div className="shrink-0 h-6 w-6 rounded-full flex items-center justify-center bg-secondary text-foreground border border-border/50 shadow-sm">
                                            <Bot className="h-3 w-3" />
                                        </div>
                                        <div className="px-5 py-3.5 rounded-2xl bg-card border border-border/50 text-foreground rounded-bl-sm shadow-sm flex items-center gap-1.5 h-10">
                                            <span className="h-1.5 w-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="h-1.5 w-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="h-1.5 w-1.5 bg-foreground/40 rounded-full animate-bounce"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div className="p-3 bg-card border-t border-border/50 shrink-0">
                            <form 
                                onSubmit={handleSubmit}
                                className="flex items-center gap-2 bg-secondary rounded-full p-1 pl-4 shadow-inner border border-border/30 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all font-medium"
                            >
                                <input
                                    value={input}
                                    onChange={handleInputChange}
                                    placeholder="Type your question..."
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-foreground/40"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !input?.trim()}
                                    className="h-10 w-10 shrink-0 rounded-full bg-indigo-600 flex items-center justify-center text-white disabled:opacity-40 disabled:scale-100 hover:bg-indigo-700 active:scale-95 transition-all shadow-md"
                                    style={{ backgroundColor: !isLoading && input?.trim() ? primaryColor : undefined }}
                                >
                                    <Send className="h-4 w-4 ml-0.5" />
                                </button>
                            </form>
                            <p className="text-center text-[9px] uppercase tracking-[0.2em] font-black text-foreground/30 mt-3 mb-1">
                                Powered by AI
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Trigger Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-14 w-14 rounded-full flex items-center justify-center text-white shadow-2xl backdrop-blur-md relative overflow-hidden group border-2 border-white/20"
                style={{ backgroundColor: primaryColor }}
            >
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <X className="h-6 w-6" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <MessageCircle className="h-6 w-6" />
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Red dot badge when closed to draw attention */}
                {!isOpen && (
                    <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 border-2 border-white rounded-full"></span>
                )}
            </motion.button>
        </div>
    );
}

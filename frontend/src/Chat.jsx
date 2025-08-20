import React, { useEffect, useState, useRef } from "react";
import showdown from "showdown";
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Chat({ quill, serverUrl }) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [unread, setUnread] = useState(0);
    const listRef = useRef();
    const panelRef = useRef();
    const converter = new showdown.Converter();

    // auto-scroll to bottom when messages change
    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages]);

    // Close on ESC and detect outside clicks
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        const onDown = (e) => {
            if (!isOpen) return;
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onDown);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onDown);
        };
    }, [isOpen]);

    const toggle = () => {
        setIsOpen((v) => {
            const next = !v;
            if (next) setUnread(0);
            return next;
        });
    };

    const sendPrompt = async (e) => {
        e?.preventDefault();
        const trimmed = input.trim();
        if (!trimmed) return;

        // User message with correct 'parts' property
        const userMsg = {
            role: "user",
            parts: [{ text: trimmed }],
        };

        const newMessages = [...messages, { ...userMsg, id: Date.now().toString() }];
        setMessages(newMessages);
        setInput("");

        try {
            const response = await axios.post(
                `${serverUrl}/api/v1/ai/chat`,
                { history: newMessages },
                { withCredentials: true }
            );

            // Access response text safely, handle cases where it might be missing
            const aiResponseText = response.data?.response;
            if (!aiResponseText) {
                throw new Error("Empty AI response received.");
            }

            // Correctly format the successful AI message
            const aiMessage = {
                role: "model", // Correct role for the API
                parts: [{ text: aiResponseText }],
            };

            setMessages((prevMessages) => [...prevMessages, { ...aiMessage, id: Date.now().toString() }]);
        } catch (error) {
            console.error('API Error:', error);
            const errorMessage = {
                id: Date.now().toString(),
                role: "model", // Correct role for the API
                parts: [{ text: "Sorry, I couldn't get a response. Please try again." }], // Correctly formatted with 'parts'
            };
            setMessages((prevMessages) => [...prevMessages, errorMessage]);
            toast.error("Failed to get AI response.");
        }
    };

    const insertIntoDoc = (markdownText) => {
        if (!quill) {
            console.error("Quill instance not available!");
            return;
        }
        if (!markdownText) return;
        quill.focus();
        const range = quill.getSelection(true);
        const index = range ? range.index : quill.getLength();
        const htmlToInsert = converter.makeHtml(markdownText);
        quill.clipboard.dangerouslyPasteHTML(index, htmlToInsert, "user");
    };

    return (
        <>
            <style>{`
                .chat-toggle {
                    position: fixed; right: 20px; bottom: 20px; z-index: 9999; width: 56px; height: 56px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 6px 18px rgba(0,0,0,0.12); background: linear-gradient(180deg,#3b82f6,#2563eb); border: none; cursor: pointer; color: white;
                }
                .chat-badge {
                    position: absolute; top: -6px; right: -6px; min-width: 20px; height: 20px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: #ef4444; color: #fff; font-size: 12px; padding: 0 6px;
                }
                .chat-panel {
                    position: fixed; right: 20px; bottom: 90px; z-index: 9998; width: 360px; max-height: calc(100vh - 120px); display: flex; flex-direction: column; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); overflow: hidden; transform-origin: bottom right; transition: transform 220ms cubic-bezier(.2,.9,.2,1), opacity 220ms; opacity: 0; pointer-events: none;
                }
                .chat-panel.open {
                    transform: translateY(0) scale(1); opacity: 1; pointer-events: auto;
                }
                .chat-panel .header {
                    padding: 12px 14px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; justify-content: space-between;
                }
                .chat-panel .header .title { font-weight: 700; }
                .chat-panel .content {
                    padding: 12px; overflow-y: auto; flex: 1;
                }
                .chat-input-row {
                    display: flex; padding: 8px; border-top: 1px solid #eee; background: linear-gradient(180deg, #fafafa, #fff);
                }
                .chat-input-row input[type="text"] {
                    flex: 1; padding: 8px 10px; border-radius: 8px; border: 1px solid #e6e6e6; outline: none; font-size: 14px;
                }
                .chat-input-row button[type="submit"] {
                    margin-left: 8px; padding: 8px 12px; border-radius: 8px; border: none; cursor: pointer;
                }
                .message { margin-bottom: 12px; }
                .message .meta { font-size: 12px; color: #666; margin-bottom: 6px; }
                .message .bubble {
                    padding: 10px; border-radius: 8px; white-space: pre-wrap; line-height: 1.4;
                }
                .message.ai .bubble { background: #f7f7fb; }
                .message.user .bubble { background: #e8f3ff; }
                @media (max-width: 640px) {
                    .chat-panel {
                        left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100% !important; max-height: 90vh !important; border-radius: 12px 12px 0 0; transform-origin: bottom center;
                    }
                    .chat-toggle { right: 16px; bottom: 16px; }
                }
            `}</style>

            {/* Floating toggle button */}
            <button
                aria-expanded={isOpen}
                aria-controls="chat-panel"
                aria-label={isOpen ? "Close chat" : "Open chat"}
                className="chat-toggle"
                onClick={toggle}
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {unread > 0 && <span className="chat-badge" aria-hidden>{unread}</span>}
            </button>

            {/* Chat panel */}
            <div
                id="chat-panel"
                role="dialog"
                aria-modal="false"
                aria-label="AI Assistant chat"
                ref={panelRef}
                className={`chat-panel ${isOpen ? "open" : ""}`}
            >
                <div className="header">
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <strong className="title">AI Assistant</strong>
                        <span style={{ fontSize: 12, color: "#777" }}>/ Ask anything</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => { setMessages([]); setUnread(0); }} aria-label="Clear chat">Clear</button>
                        <button onClick={() => setIsOpen(false)} aria-label="Close chat">Close</button>
                    </div>
                </div>

                <div ref={listRef} className="content" style={{ flex: 1 }}>
                    {messages.length === 0 && (
                        <div style={{ color: "#666", fontSize: 13 }}>No messages yet — say hi 👋</div>
                    )}
                    {messages.map((m, index) => (
                        <div key={m.id} className={`message ${m.role === "model" ? "ai" : "user"}`}>
                            <div className="meta">{m.role === "model" ? "assistant" : "you"}</div>
                            <div
                                className="bubble"
                                dangerouslySetInnerHTML={{
                                    __html: m.role === "model"
                                        ? converter.makeHtml(m.parts[0]?.text || '')
                                        : (m.parts[0]?.text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;"),
                                }}
                            />
                            {m.role === "model" && (
                                <div style={{ marginTop: 6 }}>
                                    <button onClick={() => insertIntoDoc(m.parts[0]?.text || '')}>Insert into document</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <form onSubmit={sendPrompt} className="chat-input-row">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask the assistant..."
                        aria-label="Chat input"
                    />
                    <button type="submit">Send</button>
                </form>
            </div>
        </>
    );
}
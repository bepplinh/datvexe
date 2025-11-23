import { useState, useRef, useEffect } from "react";
import { chatService } from "../../services/chatService";
import "./ChatBot.scss";

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Xin chào! Tôi có thể giúp bạn tìm chuyến xe. Bạn muốn đi đâu?",
            sender: "bot",
            timestamp: new Date(),
        },
    ]);
    const [inputMessage, setInputMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isTyping) return;

        const userMessage = {
            id: Date.now(),
            text: inputMessage.trim(),
            sender: "user",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputMessage("");
        setIsTyping(true);

        try {
            const response = await chatService.sendMessage(userMessage.text);

            // Simulate typing delay for better UX
            await new Promise((resolve) => setTimeout(resolve, 500));

            const botMessage = {
                id: Date.now() + 1,
                text:
                    response.message ||
                    "Xin lỗi, tôi không thể trả lời lúc này.",
                sender: "bot",
                timestamp: new Date(),
                trips: response.trips || null,
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage = {
                id: Date.now() + 1,
                text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
                sender: "bot",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="chatbot-container">
            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <div className="chatbot-header-info">
                            <div className="chatbot-avatar">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3>Trợ lý tìm chuyến xe</h3>
                                <span className="chatbot-status">
                                    Đang hoạt động
                                </span>
                            </div>
                        </div>
                        <button
                            className="chatbot-close-btn"
                            onClick={() => setIsOpen(false)}
                            aria-label="Đóng chat"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M15 5L5 15M5 5L15 15"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`message ${message.sender}`}
                            >
                                <div className="message-content">
                                    <p>{message.text}</p>
                                    {message.trips &&
                                        message.trips.length > 0 && (
                                            <div className="trips-preview">
                                                <p className="trips-count">
                                                    Tìm thấy{" "}
                                                    {message.trips.length}{" "}
                                                    chuyến
                                                </p>
                                            </div>
                                        )}
                                    <span className="message-time">
                                        {formatTime(message.timestamp)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="message bot">
                                <div className="message-content">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chatbot-input-container">
                        <input
                            ref={inputRef}
                            type="text"
                            className="chatbot-input"
                            placeholder="Nhập tin nhắn..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isTyping}
                        />
                        <button
                            className="chatbot-send-btn"
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || isTyping}
                            aria-label="Gửi tin nhắn"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M18 2L9 11M18 2L12 18L9 11M18 2L2 8L9 11"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <button
                className="chatbot-toggle-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Mở chat"
            >
                {isOpen ? (
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M18 6L6 18M6 6L18 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                ) : (
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
                {!isOpen && messages.length > 1 && (
                    <span className="chatbot-badge">{messages.length - 1}</span>
                )}
            </button>
        </div>
    );
};

export default ChatBot;

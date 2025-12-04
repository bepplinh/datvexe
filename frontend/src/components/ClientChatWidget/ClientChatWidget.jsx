import { useEffect, useRef, useState } from "react";
import { Send, X, MessageCircle } from "lucide-react";
import "./ClientChatWidget.scss";
import { conversationService } from "../../services/conversationService";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const formatTime = (value) => (value ? dayjs(value).format("HH:mm") : "");

const ClientChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversation?.messages, isOpen]);

    const ensureConversation = async () => {
        if (conversation || loading) return;
        setLoading(true);
        try {
            const list = await conversationService.getConversations();
            const existing = list?.data?.[0];

            if (existing) {
                const detail = await conversationService.getConversation(
                    existing.id
                );
                setConversation(detail);
                return;
            }

            const created = await conversationService.createConversation({});
            const detail = await conversationService.getConversation(created.id);
            setConversation(detail);
        } catch (error) {
            console.error("Client chat init error", error);
            toast.error("Không thể khởi tạo hộp chat, vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async () => {
        const next = !isOpen;
        setIsOpen(next);
        if (next) {
            await ensureConversation();
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !conversation || sending) return;

        setSending(true);
        try {
            const newMessage = await conversationService.sendMessage(
                conversation.id,
                { content: input.trim() }
            );
            setInput("");
            setConversation((prev) => ({
                ...prev,
                messages: [...(prev.messages || []), newMessage],
                last_message_at: newMessage.created_at,
                last_message: newMessage,
            }));
        } catch (error) {
            console.error("Send client chat message error", error);
            toast.error("Không thể gửi tin nhắn, vui lòng thử lại.");
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="client-chat">
            {isOpen && (
                <div className="client-chat__window">
                    <div className="client-chat__header">
                        <div>
                            <h3>Hỗ trợ khách hàng</h3>
                            <p>Chat trực tiếp với nhân viên</p>
                        </div>
                        <button
                            type="button"
                            className="client-chat__icon-btn"
                            onClick={handleToggle}
                            aria-label="Đóng chat"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="client-chat__messages">
                        {loading && (
                            <div className="client-chat__empty">
                                Đang khởi tạo hội thoại...
                            </div>
                        )}

                        {!loading &&
                            conversation?.messages?.map((message) => {
                                const isClient =
                                    message.sender?.role !== "admin";
                                return (
                                    <div
                                        key={message.id}
                                        className={`client-chat__message ${
                                            isClient
                                                ? "client-chat__message--client"
                                                : "client-chat__message--agent"
                                        }`}
                                    >
                                        <div className="client-chat__bubble">
                                            <p>{message.content}</p>
                                            <span>
                                                {formatTime(
                                                    message.created_at
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}

                        {!loading &&
                            (!conversation?.messages ||
                                conversation.messages.length === 0) && (
                                <div className="client-chat__empty">
                                    Hãy gửi tin nhắn đầu tiên cho chúng tôi.
                                </div>
                            )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="client-chat__composer">
                        <input
                            type="text"
                            placeholder="Nhập tin nhắn..."
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={handleKeyPress}
                            disabled={sending || loading}
                        />
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={!input.trim() || sending || loading}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}

            <button
                type="button"
                className="client-chat__toggle"
                onClick={handleToggle}
                aria-label="Mở chat hỗ trợ"
            >
                <MessageCircle size={22} />
            </button>
        </div>
    );
};

export default ClientChatWidget;



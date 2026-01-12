import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Mail,
    MapPin,
    MoreVertical,
    Phone,
    Search,
    Send,
    Tag,
    Clock3,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { toast } from "react-toastify";
import { conversationService } from "../../../services/conversationService";
import { useAdminAuth } from "../../../hooks/useAdminAuth";
import { createEchoInstance } from "../../../lib/echo";
import "./SupportChat.scss";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const getCustomerName = (conversation) => {
    const customer = conversation?.customer;
    if (!customer) return "Khách hàng";
    return customer.name || customer.email || `Khách #${customer.id}`;
};

const getInitials = (value) =>
    value
        ?.trim()
        .split(/\s+/)
        .map((word) => word.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase() || "??";

const formatRelativeTime = (value) => {
    if (!value) return "Chưa có tin nhắn";
    return dayjs(value).fromNow();
};

const formatMessageTime = (value) => (value ? dayjs(value).format("HH:mm") : "");

const SupportChat = () => {
    const { admin } = useAdminAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [activeConversation, setActiveConversation] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [draftMessage, setDraftMessage] = useState("");
    const [listLoading, setListLoading] = useState(true);
    const [conversationLoading, setConversationLoading] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const echoRef = useRef(null);
    const adminChannelRef = useRef(null);
    const conversationChannelRef = useRef(null);
    const messagesEndRef = useRef(null);

    const fetchConversations = useCallback(async () => {
        setListLoading(true);
        try {
            const data = await conversationService.getConversations();
            // Chuẩn hoá dữ liệu: API đôi khi trả mảng trực tiếp, đôi khi trong data/data.data
            const items = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data?.data?.data)
                        ? data.data.data
                        : [];
            setConversations(items);
        } catch (error) {
            console.error("Failed to load conversations", error);
            toast.error("Không thể tải danh sách hội thoại");
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Khởi tạo Echo (Reverb)
    useEffect(() => {
        if (!echoRef.current) {
            echoRef.current = createEchoInstance();
        }
        return () => {
            if (echoRef.current) {
                echoRef.current.disconnect();
            }
        };
    }, []);

    // Lắng nghe kênh tạo hội thoại mới cho admin
    useEffect(() => {
        if (!echoRef.current) return;

        const channelName = "admin.conversations";
        adminChannelRef.current = echoRef.current
            .private(channelName)
            .listen(".ConversationCreated", (payload) => {
                setConversations((prev) => {
                    if (prev.some((c) => c.id === payload.id)) return prev;
                    return [payload, ...prev];
                });
            });

        return () => {
            echoRef.current.leave(channelName);
        };
    }, []);

    useEffect(() => {
        if (!activeConversationId && conversations.length > 0) {
            setActiveConversationId(conversations[0].id);
        }
    }, [conversations, activeConversationId]);

    const fetchConversationDetail = useCallback(async (conversationId) => {
        setConversationLoading(true);
        try {
            const data = await conversationService.getConversation(conversationId);
            setActiveConversation(data);
        } catch (error) {
            console.error("Failed to load conversation", error);
            toast.error("Không thể tải hội thoại");
        } finally {
            setConversationLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!activeConversationId) {
            setActiveConversation(null);
            return;
        }
        fetchConversationDetail(activeConversationId);
    }, [activeConversationId, fetchConversationDetail]);

    // Lắng nghe realtime tin nhắn của cuộc hội thoại đang mở
    useEffect(() => {
        if (!echoRef.current || !activeConversationId) return;

        // Rời kênh cũ nếu có
        if (conversationChannelRef.current) {
            echoRef.current.leave(`conversation.${conversationChannelRef.current}`);
            conversationChannelRef.current = null;
        }

        const channelName = `conversation.${activeConversationId}`;
        conversationChannelRef.current = activeConversationId;

        echoRef.current
            .private(channelName)
            .listen(".MessageCreated", (message) => {
                setActiveConversation((prev) => {
                    if (!prev || prev.id !== message.conversation_id) return prev;
                    const nextMessages = [...(prev.messages || []), message];
                    return {
                        ...prev,
                        messages: nextMessages,
                        last_message_at: message.created_at,
                        last_message: message,
                    };
                });

                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === message.conversation_id
                            ? {
                                ...c,
                                last_message: message,
                                last_message_at: message.created_at,
                            }
                            : c
                    )
                );
            });

        return () => {
            echoRef.current.leave(channelName);
        };
    }, [activeConversationId]);

    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) {
            return conversations;
        }
        const keyword = searchQuery.toLowerCase();
        return conversations.filter((conversation) =>
            `${getCustomerName(conversation)} ${conversation.subject ?? ""}`
                .toLowerCase()
                .includes(keyword)
        );
    }, [conversations, searchQuery]);

    const handleSendMessage = async (event) => {
        event.preventDefault();
        if (!draftMessage.trim() || !activeConversationId) {
            return;
        }

        setSendingMessage(true);
        try {
            const newMessage = await conversationService.sendMessage(
                activeConversationId,
                {
                    content: draftMessage.trim(),
                }
            );

            setActiveConversation((prev) => {
                if (!prev) return prev;
                const nextMessages = [...(prev.messages || []), newMessage];
                return {
                    ...prev,
                    messages: nextMessages,
                    last_message_at: newMessage.created_at,
                    last_message: newMessage,
                };
            });

            setConversations((prev) =>
                prev.map((conversation) =>
                    conversation.id === activeConversationId
                        ? {
                            ...conversation,
                            last_message: newMessage,
                            last_message_at: newMessage.created_at,
                        }
                        : conversation
                )
            );

            setDraftMessage("");
        } catch (error) {
            console.error("Send message error", error);
            toast.error("Không thể gửi tin nhắn, vui lòng thử lại");
        } finally {
            setSendingMessage(false);
        }
    };

    const detailTags = useMemo(() => {
        if (!activeConversation) return [];
        const tags = [];
        if (activeConversation.status) {
            tags.push(activeConversation.status);
        }
        if (activeConversation.customer?.role) {
            tags.push(activeConversation.customer.role);
        }
        return tags;
    }, [activeConversation]);

    const renderConversationPreview = (conversation) => {
        const lastMessage = conversation.last_message;
        if (!lastMessage) {
            return "Chưa có tin nhắn";
        }
        return lastMessage.content;
    };

    const renderConversationTime = (conversation) =>
        formatRelativeTime(
            conversation.last_message_at || conversation.last_message?.created_at
        );

    const handleSelectConversation = (conversationId) => {
        setActiveConversationId(conversationId);
    };

    // Tự động scroll xuống cuối khi đổi cuộc trò chuyện hoặc có thêm tin nhắn
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [activeConversationId, activeConversation?.messages?.length]);

    return (
        <div className="support-chat">
            <div className="support-chat__panel support-chat__panel--list">
                <div className="support-chat__panel-header">
                    <div>
                        <p className="support-chat__eyebrow">Conversations</p>
                        <h2 className="support-chat__title">Hỗ trợ khách hàng</h2>
                    </div>
                    <button className="support-chat__icon-btn" type="button">
                        <MoreVertical size={18} />
                    </button>
                </div>

                <div className="support-chat__search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Tìm khách hàng..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                    />
                </div>

                <div className="support-chat__conversation-list">
                    {listLoading ? (
                        <div className="support-chat__empty">
                            Đang tải danh sách hội thoại...
                        </div>
                    ) : filteredConversations.length ? (
                        filteredConversations.map((conversation) => (
                            <button
                                key={conversation.id}
                                type="button"
                                className={`support-chat__conversation-card ${activeConversationId === conversation.id
                                    ? "support-chat__conversation-card--active"
                                    : ""
                                    }`}
                                onClick={() => handleSelectConversation(conversation.id)}
                            >
                                <div className="support-chat__conversation-avatar">
                                    <span>{getInitials(getCustomerName(conversation))}</span>
                                </div>
                                <div className="support-chat__conversation-info">
                                    <div className="support-chat__conversation-heading">
                                        <p>{getCustomerName(conversation)}</p>
                                        <span>{renderConversationTime(conversation)}</span>
                                    </div>
                                    <p className="support-chat__conversation-preview">
                                        {renderConversationPreview(conversation)}
                                    </p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="support-chat__empty">
                            Không có hội thoại phù hợp
                        </div>
                    )}
                </div>
            </div>

            <div className="support-chat__panel support-chat__panel--conversation">
                {conversationLoading ? (
                    <div className="support-chat__empty">
                        Đang tải nội dung hội thoại...
                    </div>
                ) : activeConversation ? (
                    <>
                        <div className="support-chat__panel-header support-chat__panel-header--conversation">
                            <div className="support-chat__agent">
                                <div className="support-chat__avatar-large">
                                    {getInitials(getCustomerName(activeConversation))}
                                </div>
                                <div>
                                    <h3>{getCustomerName(activeConversation)}</h3>
                                    <p className="support-chat__status">
                                        {activeConversation.status === "closed"
                                            ? "Đã đóng"
                                            : "Đang mở"}
                                    </p>
                                </div>
                            </div>
                            <div className="support-chat__conversation-meta">
                                <span>
                                    <Clock3 size={16} />
                                    Cập nhật {formatRelativeTime(activeConversation.last_message_at)}
                                </span>
                                {detailTags.length > 0 && (
                                    <div className="support-chat__tags-inline">
                                        {detailTags.map((tag) => (
                                            <span key={tag}>{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="support-chat__messages">
                            {activeConversation.messages?.length ? (
                                activeConversation.messages.map((message) => {
                                    const isAgent =
                                        message.sender?.role === "admin" ||
                                        message.sender?.id === admin?.id;
                                    return (
                                        <div
                                            key={message.id}
                                            className={`support-chat__message ${isAgent ? "support-chat__message--agent" : ""
                                                }`}
                                        >
                                            <div className="support-chat__bubble">
                                                <p>{message.content}</p>
                                                <span>{formatMessageTime(message.created_at)}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="support-chat__empty">
                                    Chưa có tin nhắn nào trong hội thoại này
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="support-chat__composer" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                placeholder="Nhập tin nhắn..."
                                value={draftMessage}
                                onChange={(event) => setDraftMessage(event.target.value)}
                                disabled={sendingMessage}
                            />
                            <button type="submit" disabled={sendingMessage}>
                                Gửi
                                <Send size={16} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="support-chat__empty">
                        <h3>Không tìm thấy cuộc trò chuyện</h3>
                        <p>Vui lòng chọn khách hàng khác hoặc xoá bộ lọc tìm kiếm.</p>
                    </div>
                )}
            </div>

            <div className="support-chat__panel support-chat__panel--details">
                {activeConversation ? (
                    <>
                        <div className="support-chat__panel-header">
                            <div>
                                <p className="support-chat__eyebrow">Khách hàng</p>
                                <h2 className="support-chat__title">
                                    {getCustomerName(activeConversation)}
                                </h2>
                            </div>
                            <button className="support-chat__icon-btn" type="button">
                                <MoreVertical size={18} />
                            </button>
                        </div>

                        <div className="support-chat__contact-card">
                            <div className="support-chat__contact-row">
                                <Mail size={16} />
                                <div>
                                    <p className="support-chat__contact-label">Email</p>
                                    <p className="support-chat__contact-value">
                                        {activeConversation.customer?.email || "—"}
                                    </p>
                                </div>
                            </div>
                            <div className="support-chat__contact-row">
                                <Phone size={16} />
                                <div>
                                    <p className="support-chat__contact-label">Số điện thoại</p>
                                    <p className="support-chat__contact-value">
                                        {activeConversation.customer?.phone || "—"}
                                    </p>
                                </div>
                            </div>
                            <div className="support-chat__contact-row">
                                <MapPin size={16} />
                                <div>
                                    <p className="support-chat__contact-label">Địa điểm</p>
                                    <p className="support-chat__contact-value">Chưa cập nhật</p>
                                </div>
                            </div>
                        </div>

                        {detailTags.length > 0 && (
                            <div className="support-chat__section">
                                <div className="support-chat__section-header">
                                    <Tag size={16} />
                                    <h4>Ghi chú</h4>
                                </div>
                                <div className="support-chat__tags">
                                    {detailTags.map((tag) => (
                                        <span key={tag}>{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="support-chat__section">
                            <div className="support-chat__section-header">
                                <h4>Nhân viên phụ trách</h4>
                            </div>
                            <p className="support-chat__contact-value">
                                {activeConversation.agent?.name || "Chưa gán"}
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="support-chat__empty">
                        <h3>Chưa chọn khách hàng</h3>
                        <p>Chọn khách hàng để xem thông tin chi tiết và lịch sử đơn hàng.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportChat;


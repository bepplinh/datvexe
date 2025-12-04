import {
    MoreHorizontal,
    Paperclip,
    Image as ImageIcon,
    Smile,
    Search,
    Plus,
    Send,
    Tag,
    Mail,
    Phone,
    MapPin,
    Clock,
    CheckCircle,
} from "lucide-react";
import "./AdminChat.scss";

const conversationList = [
    {
        id: "sarah-mitchell",
        name: "Sarah Mitchell",
        message: "Thank you so much for your help!",
        timeAgo: "2m ago",
        status: "online",
        unread: 0,
    },
    {
        id: "james-chen",
        name: "James Chen",
        message: "When will my order arrive?",
        timeAgo: "15m ago",
        status: "away",
        unread: 2,
    },
    {
        id: "emily-rodriguez",
        name: "Emily Rodriguez",
        message: "Perfect, that solved my issue",
        timeAgo: "1h ago",
        status: "offline",
        unread: 0,
    },
    {
        id: "michael-brown",
        name: "Michael Brown",
        message: "Can I get a refund?",
        timeAgo: "2h ago",
        status: "offline",
        unread: 0,
    },
    {
        id: "lisa-thompson",
        name: "Lisa Thompson",
        message: "I have a question about my subscription…",
        timeAgo: "3h ago",
        status: "offline",
        unread: 0,
    },
];

const mockMessages = [
    {
        id: 1,
        author: "Sarah Mitchell",
        timestamp: "10:30 AM",
        text: "Hi, I need help with my recent order",
        direction: "incoming",
    },
    {
        id: 2,
        author: "Admin Support",
        timestamp: "10:31 AM",
        text: "Hello Sarah! I'd be happy to help you with that. Could you please provide your order number?",
        direction: "outgoing",
    },
    {
        id: 3,
        author: "Sarah Mitchell",
        timestamp: "10:32 AM",
        text: "Sure, it's #ORD-12345",
        direction: "incoming",
    },
    {
        id: 4,
        author: "Admin Support",
        timestamp: "10:33 AM",
        text: "Thank you! I can see your order here. It's currently being processed and should ship within 24 hours. You'll receive a tracking number via email.",
        direction: "outgoing",
    },
    {
        id: 5,
        author: "Sarah Mitchell",
        timestamp: "10:34 AM",
        text: "Thank you so much for your help!",
        direction: "incoming",
    },
];

const orderHistory = [
    {
        id: "#ORD-12345",
        date: "Dec 4, 2025",
        amount: "$124.99",
        status: "Processing",
    },
    {
        id: "#ORD-12298",
        date: "Nov 28, 2025",
        amount: "$89.50",
        status: "Delivered",
    },
];

const customerTags = ["Premium", "Loyal Customer"];

const AdminChat = () => {
    const activeConversation = conversationList[0];

    return (
        <div className="admin-chat">
            <div className="admin-chat__header">
                <div>
                    <p className="admin-chat__eyebrow">Hỗ trợ khách hàng</p>
                    <h1>Hộp thư hỗ trợ</h1>
                </div>
                <button className="admin-chat__primary-btn">
                    <Plus size={18} />
                    Tạo hội thoại mới
                </button>
            </div>

            <div className="admin-chat__body">
                <aside className="admin-chat__sidebar">
                    <div className="admin-chat__search">
                        <Search size={18} />
                        <input type="text" placeholder="Tìm kiếm cuộc trò chuyện..." />
                        <button type="button" aria-label="Thêm lọc">
                            <MoreHorizontal size={18} />
                        </button>
                    </div>

                    <div className="admin-chat__sidebar-list">
                        {conversationList.map((conversation) => (
                            <button
                                key={conversation.id}
                                className={`admin-chat__conversation-item ${
                                    conversation.id === activeConversation.id ? "active" : ""
                                }`}
                            >
                                <div className="admin-chat__avatar">
                                    {conversation.name
                                        .split(" ")
                                        .map((word) => word[0])
                                        .slice(0, 2)
                                        .join("")}
                                    <span className={`status-dot status-dot--${conversation.status}`} />
                                </div>
                                <div className="admin-chat__conversation-info">
                                    <div className="admin-chat__conversation-row">
                                        <span className="admin-chat__conversation-name">
                                            {conversation.name}
                                        </span>
                                        <span className="admin-chat__conversation-time">
                                            {conversation.timeAgo}
                                        </span>
                                    </div>
                                    <div className="admin-chat__conversation-row">
                                        <p>{conversation.message}</p>
                                        {conversation.unread > 0 && (
                                            <span className="admin-chat__conversation-unread">
                                                {conversation.unread}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                <section className="admin-chat__panel">
                    <div className="admin-chat__panel-header">
                        <div>
                            <h2>{activeConversation.name}</h2>
                            <p>Online • Order #{orderHistory[0].id.replace("#", "")}</p>
                        </div>
                        <div className="admin-chat__panel-actions">
                            <button type="button">
                                <Tag size={18} />
                                Thêm tag
                            </button>
                            <button type="button">
                                <MoreHorizontal size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="admin-chat__messages">
                        {mockMessages.map((message) => (
                            <div
                                key={message.id}
                                className={`admin-chat__message admin-chat__message--${message.direction}`}
                            >
                                <div className="admin-chat__message-meta">
                                    <span>{message.author}</span>
                                    <span>{message.timestamp}</span>
                                </div>
                                <p>{message.text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="admin-chat__composer">
                        <div className="admin-chat__composer-actions">
                            <button type="button" aria-label="Đính kèm tập tin">
                                <Paperclip size={18} />
                            </button>
                            <button type="button" aria-label="Chèn hình ảnh">
                                <ImageIcon size={18} />
                            </button>
                            <button type="button" aria-label="Gửi emoji">
                                <Smile size={18} />
                            </button>
                        </div>
                        <input type="text" placeholder="Nhập tin nhắn của bạn..." />
                        <button className="admin-chat__send-btn" type="button">
                            Gửi
                            <Send size={16} />
                        </button>
                    </div>
                </section>

                <aside className="admin-chat__details">
                    <div className="admin-chat__customer-card">
                        <div className="admin-chat__customer-avatar">SM</div>
                        <h3>Sarah Mitchell</h3>
                        <p>Online</p>
                    </div>

                    <div className="admin-chat__detail-section">
                        <h4>Thông tin liên hệ</h4>
                        <ul>
                            <li>
                                <Mail size={16} />
                                <span>sarah.mitchell@email.com</span>
                            </li>
                            <li>
                                <Phone size={16} />
                                <span>+1 (555) 123-4567</span>
                            </li>
                            <li>
                                <MapPin size={16} />
                                <span>New York, NY</span>
                            </li>
                        </ul>
                    </div>

                    <div className="admin-chat__detail-section">
                        <h4>Tags</h4>
                        <div className="admin-chat__tags">
                            {customerTags.map((tag) => (
                                <span key={tag}>{tag}</span>
                            ))}
                        </div>
                    </div>

                    <div className="admin-chat__detail-section">
                        <h4>Đơn hàng gần đây</h4>
                        <div className="admin-chat__orders">
                            {orderHistory.map((order) => (
                                <div key={order.id} className="admin-chat__order-item">
                                    <div>
                                        <p>{order.id}</p>
                                        <span>{order.date}</span>
                                    </div>
                                    <div>
                                        <strong>{order.amount}</strong>
                                        <span
                                            className={`order-status order-status--${order.status.toLowerCase()}`}
                                        >
                                            <CheckCircle size={14} />
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="admin-chat__detail-section">
                        <h4>Dòng thời gian</h4>
                        <ul className="admin-chat__timeline">
                            <li>
                                <Clock size={16} />
                                <div>
                                    <p>Đã tạo yêu cầu hỗ trợ</p>
                                    <span>Hôm nay, 10:30 AM</span>
                                </div>
                            </li>
                            <li>
                                <Clock size={16} />
                                <div>
                                    <p>Đơn hàng #ORD-12345 đang xử lý</p>
                                    <span>Hôm nay, 10:33 AM</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default AdminChat;


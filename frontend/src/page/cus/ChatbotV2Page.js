import React, { useState, useRef, useEffect, useCallback } from "react";
import CustomerFooterNav from "../../components/CustomerFooterNav";
import {
    Layout,
    Typography,
    Button,
    Input,
    Card,
    Tooltip,
    message as antMessage,
} from "antd";
import {
    ArrowLeftOutlined,
    SendOutlined,
    DeleteOutlined,
    ReloadOutlined,
    CopyOutlined,
    CheckOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

// ============================================
// UTILITIES
// ============================================

// Get QR session ID from localStorage (same as other pages)
const getQrSessionId = () => {
    try {
        const sessionData = localStorage.getItem("qr_session");
        if (sessionData) {
            const { session_id } = JSON.parse(sessionData);
            return session_id;
        }
    } catch (error) {
        console.error("Error getting qr_session_id:", error);
    }
    return null;
};

// Format price
const formatPrice = (price) => {
    if (!price) return "Liên hệ";
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
};

// Parse markdown-like text to JSX
const parseMarkdown = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    let inList = false;

    lines.forEach((line, idx) => {
        // Bold: **text**
        line = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        // Italic: *text*
        line = line.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

        // Bullet points
        if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
            if (!inList) {
                inList = true;
                listItems = [];
            }
            const content = line.trim().replace(/^[•\-*]\s*/, '');
            listItems.push(content);
        } else {
            if (inList && listItems.length > 0) {
                elements.push(
                    <ul key={`list-${idx}`} style={{ margin: '8px 0', paddingLeft: 20 }}>
                        {listItems.map((item, i) => (
                            <li key={i} dangerouslySetInnerHTML={{ __html: item }} style={{ marginBottom: 4 }} />
                        ))}
                    </ul>
                );
                listItems = [];
                inList = false;
            }

            if (line.trim()) {
                elements.push(
                    <p key={idx} dangerouslySetInnerHTML={{ __html: line }} style={{ margin: '4px 0' }} />
                );
            } else if (elements.length > 0) {
                elements.push(<br key={idx} />);
            }
        }
    });

    if (listItems.length > 0) {
        elements.push(
            <ul key="list-end" style={{ margin: '8px 0', paddingLeft: 20 }}>
                {listItems.map((item, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: item }} style={{ marginBottom: 4 }} />
                ))}
            </ul>
        );
    }

    return elements;
};

// ============================================
// COMPONENTS
// ============================================

// Copy button component
const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Tooltip title={copied ? "Đã copy!" : "Copy"}>
            <Button
                type="text"
                size="small"
                icon={copied ? <CheckOutlined style={{ color: "#52c41a" }} /> : <CopyOutlined />}
                onClick={handleCopy}
                style={{ opacity: 0.6 }}
            />
        </Tooltip>
    );
};

// 🎨 Menu Item Card Component
const MenuItemCard = ({ item, navigate, showReason = false }) => {
    return (
        <Card
            hoverable
            onClick={() => navigate(`/cus/fooddetails/${item.id}`)}
            style={{
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                transition: "all 0.3s",
            }}
            bodyStyle={{ padding: 0 }}
            cover={
                <div style={{ position: "relative" }}>
                    <img
                        alt={item.name}
                        src={item.image_url || '/assets/images/default-food.png'}
                        style={{
                            width: "100%",
                            height: 140,
                            objectFit: "cover",
                        }}
                        onError={(e) => {
                            e.target.src = '/assets/images/default-food.png';
                        }}
                    />
                    {/* Price badge */}
                    <div style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        background: "#226533",
                        color: "#fff",
                        padding: "4px 10px",
                        borderRadius: 16,
                        fontSize: 14,
                        fontWeight: 600,
                    }}>
                        {formatPrice(item.price)}
                    </div>
                </div>
            }
        >
            <div style={{ padding: "10px 12px" }}>
                <Text strong style={{ fontSize: 14, display: "block", color: "#1a1a1a", lineHeight: 1.4 }}>
                    {item.name}
                </Text>
                {showReason && item.reason && (
                    <Text style={{ fontSize: 12, color: "#666", display: "block", marginTop: 4, lineHeight: 1.4 }}>
                        💡 {item.reason}
                    </Text>
                )}
                {item.description && !showReason && (
                    <Text type="secondary" style={{
                        fontSize: 12,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        marginTop: 4,
                    }}>
                        {item.description}
                    </Text>
                )}
            </div>
        </Card>
    );
};

// 🎨 Rich Content Renderer Component
const RichContentRenderer = ({ contents, navigate }) => {
    if (!contents || contents.length === 0) return null;

    return (
        <div style={{ maxWidth: "100%", width: "100%" }}>
            {contents.map((content, index) => {
                // 1️⃣ TEXT CONTENT
                if (content.type === 'text') {
                    return (
                        <div
                            key={index}
                            style={{
                                background: "#f0f0f0",
                                color: "#333",
                                padding: "10px 14px",
                                borderRadius: 16,
                                marginBottom: contents.length > 1 ? 12 : 0,
                                fontSize: 15,
                                lineHeight: 1.6,
                            }}
                        >
                            {parseMarkdown(content.value)}
                        </div>
                    );
                }

                // 2️⃣ MENU ITEMS (Grid layout with images)
                if (content.type === 'menu_items') {
                    return (
                        <div key={index} style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: 10,
                            marginBottom: 12,
                        }}>
                            {content.items?.map((item) => (
                                <MenuItemCard
                                    key={item.id}
                                    item={item}
                                    navigate={navigate}
                                    showReason={true}
                                />
                            ))}
                        </div>
                    );
                }

                // 3️⃣ MENTIONED ITEMS (smaller horizontal cards)
                if (content.type === 'mentioned_items') {
                    return (
                        <div key={index} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                            {content.items?.map((item) => (
                                <Card
                                    key={item.id}
                                    hoverable
                                    onClick={() => navigate(`/cus/fooddetails/${item.id}`)}
                                    size="small"
                                    style={{
                                        borderRadius: 12,
                                        overflow: "hidden",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                    }}
                                    bodyStyle={{ padding: 0 }}
                                >
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <img
                                            src={item.image_url || '/assets/images/default-food.png'}
                                            alt={item.name}
                                            style={{
                                                width: 70,
                                                height: 70,
                                                objectFit: "cover",
                                                borderRadius: "12px 0 0 12px",
                                            }}
                                            onError={(e) => {
                                                e.target.src = '/assets/images/default-food.png';
                                            }}
                                        />
                                        <div style={{ flex: 1, padding: "8px 12px" }}>
                                            <Text strong style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
                                                {item.name}
                                            </Text>
                                            <Text strong style={{ fontSize: 14, color: "#226533" }}>
                                                {formatPrice(item.price)}
                                            </Text>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    );
                }

                // 4️⃣ CATEGORIES
                if (content.type === 'categories') {
                    return (
                        <div key={index} style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            marginTop: 8,
                            marginBottom: 12,
                        }}>
                            {content.categories?.map((cat) => (
                                <Button
                                    key={cat.id}
                                    size="small"
                                    onClick={() => navigate(`/cus/menus?category=${cat.id}`)}
                                    style={{
                                        borderRadius: 16,
                                        borderColor: "#226533",
                                        color: "#226533",
                                    }}
                                >
                                    {cat.name} ({cat.item_count})
                                </Button>
                            ))}
                        </div>
                    );
                }

                // 5️⃣ ACTION BUTTONS
                if (content.type === 'actions') {
                    return (
                        <div key={index} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                            {content.buttons?.map((btn, i) => (
                                <Button
                                    key={i}
                                    type="primary"
                                    size="small"
                                    style={{
                                        borderRadius: 16,
                                        background: "#226533",
                                        borderColor: "#226533",
                                    }}
                                    onClick={() => {
                                        if (btn.action === 'navigate' && btn.data) {
                                            navigate(btn.data);
                                        } else if (btn.action === 'call') {
                                            window.location.href = `tel:${btn.data}`;
                                        } else if (btn.action === 'copy') {
                                            navigator.clipboard.writeText(btn.data);
                                            antMessage.success('Đã copy!');
                                        }
                                    }}
                                >
                                    {btn.label}
                                </Button>
                            ))}
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
};

// Message Component (without Avatar)
const Message = ({ message, navigate, onRetry, isLast }) => {
    const isUser = message.from === "user";
    const [showActions, setShowActions] = useState(false);

    const getPlainText = () => {
        if (message.type === 'text') return message.text;
        if (message.type === 'rich_content') {
            return message.contents
                ?.filter(c => c.type === 'text')
                .map(c => c.value?.replace(/<[^>]*>/g, ''))
                .join('\n') || '';
        }
        return '';
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                marginBottom: 12,
            }}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Message Content */}
            <div style={{ maxWidth: isUser ? "75%" : "90%" }}>
                {isUser ? (
                    // User message bubble
                    <div
                        style={{
                            background: "#226533",
                            color: "white",
                            padding: "10px 14px",
                            borderRadius: 16,
                            fontSize: 15,
                            lineHeight: 1.5,
                            wordBreak: "break-word",
                        }}
                    >
                        {message.text}
                    </div>
                ) : message.type === "rich_content" ? (
                    // Rich content response
                    <RichContentRenderer contents={message.contents} navigate={navigate} />
                ) : (
                    // Bot text message with markdown
                    <div
                        style={{
                            background: "#f0f0f0",
                            color: "#333",
                            padding: "10px 14px",
                            borderRadius: 16,
                            fontSize: 15,
                            lineHeight: 1.6,
                        }}
                    >
                        {parseMarkdown(message.text)}
                    </div>
                )}

                {/* Action buttons for bot messages */}
                {!isUser && showActions && (
                    <div style={{
                        display: "flex",
                        gap: 4,
                        marginTop: 4,
                        opacity: 0.7,
                    }}>
                        <CopyButton text={getPlainText()} />
                        {isLast && onRetry && (
                            <Tooltip title="Thử lại">
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<ReloadOutlined />}
                                    onClick={onRetry}
                                    style={{ opacity: 0.6 }}
                                />
                            </Tooltip>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Typing Indicator (without Avatar)
const TypingIndicator = () => (
    <div style={{
        display: "flex",
        justifyContent: "flex-start",
        marginBottom: 12,
    }}>
        <div style={{
            background: "#f0f0f0",
            padding: "12px 16px",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
        }}>
            <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#226533",
                            animation: `typing 1.4s infinite`,
                            animationDelay: `${i * 0.2}s`,
                        }}
                    />
                ))}
            </div>
            <Text type="secondary" style={{ fontSize: 13 }}>
                Đang trả lời...
            </Text>
        </div>

        <style>{`
            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                30% { transform: translateY(-4px); opacity: 1; }
            }
        `}</style>
    </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

export default function ChatbotV2Page() {
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    // Redux cart count
    const order = useSelector((state) => state.cart.order);
    const cartCount = order?.foodOrderList?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    // QR Session ID for conversation continuity (from localStorage like other pages)
    const [qrSessionId, setQrSessionId] = useState(getQrSessionId);

    // Check QR session on mount
    useEffect(() => {
        const sessionId = getQrSessionId();
        if (!sessionId) {
            antMessage.warning("Vui lòng quét mã QR để sử dụng chatbot!");
            // Optional: navigate to QR scan page
            // navigate("/cus/qr-scan");
        }
        setQrSessionId(sessionId);
    }, []);

    // Load messages from sessionStorage on mount
    const [messages, setMessages] = useState(() => {
        try {
            const savedMessages = sessionStorage.getItem("chatbot_v2_messages");
            if (savedMessages) {
                return JSON.parse(savedMessages);
            }
        } catch (error) {
            console.error("Error loading chat history:", error);
        }

        // Default welcome message
        return [
            {
                from: "bot",
                type: "text",
                text: "Xin chào! 👋 Tôi là trợ lý AI của nhà hàng.\n\nTôi có thể giúp bạn:\n• Xem menu và giá món ăn\n• Gợi ý món ngon, món phổ biến\n• Tìm món theo danh mục hoặc sở thích\n\nHãy hỏi tôi bất cứ điều gì về menu nhé! 😊",
            },
        ];
    });

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [lastUserMessage, setLastUserMessage] = useState("");

    // Save messages to sessionStorage whenever they change
    useEffect(() => {
        try {
            sessionStorage.setItem("chatbot_v2_messages", JSON.stringify(messages));
        } catch (error) {
            console.error("Error saving chat history:", error);
        }
    }, [messages]);

    // Auto scroll when new message
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, loading]);

    // Send message to Chatbot V2 API
    const handleSend = useCallback(async (text = input) => {
        const messageText = text.trim();
        if (!messageText || loading) return;

        // Check QR session
        if (!qrSessionId) {
            antMessage.error("Không tìm thấy phiên QR. Vui lòng quét mã QR!");
            return;
        }

        // Save for retry
        setLastUserMessage(messageText);

        // Add user message
        const userMessage = { from: "user", type: "text", text: messageText };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            // Call Chatbot V2 API with qr_session_id
            const response = await axios.post(`${REACT_APP_API_URL}/chatbot-v2/chat`, {
                message: messageText,
                session_id: qrSessionId,
            });

            if (response.data.success) {
                const botResponse = response.data.data;

                // Handle rich content response
                if (botResponse.response_type === 'rich_content' && botResponse.contents) {
                    setMessages((prev) => [
                        ...prev,
                        {
                            from: "bot",
                            type: "rich_content",
                            contents: botResponse.contents,
                        },
                    ]);
                } else {
                    // Text response fallback
                    setMessages((prev) => [
                        ...prev,
                        {
                            from: "bot",
                            type: "text",
                            text: botResponse.text || botResponse.message || "Xin lỗi, tôi không hiểu câu hỏi của bạn.",
                        },
                    ]);
                }
            } else {
                throw new Error(response.data.error || 'Unknown error');
            }

        } catch (error) {
            console.error("Chatbot V2 error:", error);

            let errorMessage = "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại! 🙏";
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            }

            setMessages((prev) => [
                ...prev,
                {
                    from: "bot",
                    type: "text",
                    text: errorMessage,
                },
            ]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, qrSessionId]);

    // Retry last message
    const handleRetry = useCallback(() => {
        if (lastUserMessage && !loading) {
            // Remove last bot message
            setMessages(prev => prev.slice(0, -1));
            handleSend(lastUserMessage);
        }
    }, [lastUserMessage, loading, handleSend]);

    // Clear chat history and reset session
    const handleClearChat = async () => {
        if (!qrSessionId) {
            antMessage.error("Không tìm thấy phiên QR!");
            return;
        }

        try {
            // Call API to clear conversation on server
            await axios.delete(`${REACT_APP_API_URL}/chatbot-v2/conversation/${qrSessionId}`);
        } catch (error) {
            console.error("Error clearing conversation on server:", error);
        }

        const welcomeMessage = {
            from: "bot",
            type: "text",
            text: "Xin chào! 👋 Tôi là trợ lý AI của nhà hàng.\n\nTôi có thể giúp bạn:\n• Xem menu và giá món ăn\n• Gợi ý món ngon, món phổ biến\n• Tìm món theo danh mục hoặc sở thích\n\nHãy hỏi tôi bất cứ điều gì về menu nhé! 😊",
        };

        // Clear sessionStorage
        sessionStorage.removeItem("chatbot_v2_messages");

        // Reset messages
        setMessages([welcomeMessage]);

        antMessage.success("Đã bắt đầu cuộc hội thoại mới!");
    };

    return (
        <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
            {/* ========== HEADER ========== */}
            <Header
                style={{
                    background: "#fff",
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    height: 64,
                }}
            >
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined style={{ fontSize: 18 }} />}
                    onClick={() => navigate(-1)}
                    style={{ width: 40, height: 40 }}
                />
                <Title
                    level={5}
                    style={{
                        margin: 0,
                        color: "#226533",
                        fontWeight: 600,
                    }}
                >
                    Trợ lý AI
                </Title>
                <Button
                    type="text"
                    icon={<DeleteOutlined style={{ fontSize: 18, color: "#226533" }} />}
                    onClick={handleClearChat}
                    style={{ width: 40, height: 40 }}
                    title="Xóa cuộc hội thoại"
                />
            </Header>

            {/* ========== CONTENT ========== */}
            <Content
                style={{
                    padding: "12px",
                    paddingTop: "76px",
                    paddingBottom: "220px",
                }}
            >
                <div
                    style={{
                        height: "calc(100vh - 290px)",
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}
                >
                    {messages.map((msg, index) => (
                        <Message
                            key={index}
                            message={msg}
                            navigate={navigate}
                            onRetry={handleRetry}
                            isLast={index === messages.length - 1 && msg.from === 'bot'}
                        />
                    ))}

                    {/* Loading indicator */}
                    {loading && <TypingIndicator />}

                    <div ref={messagesEndRef} />
                </div>
            </Content>

            {/* ========== QUICK SUGGESTIONS ========== */}
            <div
                style={{
                    position: "fixed",
                    bottom: 120,
                    left: 0,
                    right: 0,
                    padding: "8px 12px",
                    background: "#fff",
                    borderTop: "1px solid #e8e8e8",
                    display: "flex",
                    overflowX: "auto",
                    whiteSpace: "nowrap",
                    gap: 8,
                    zIndex: 1000,
                }}
            >
                {[
                    "Gợi ý món ngon",
                    "Xem menu",
                    "Món ăn phổ biến",
                    "Danh mục món ăn",
                    "Món ít cay",
                ].map((suggestion, i) => (
                    <Button
                        key={i}
                        size="small"
                        onClick={() => handleSend(suggestion)}
                        disabled={loading}
                        style={{
                            borderRadius: 16,
                            fontSize: 13,
                            whiteSpace: "nowrap",
                            borderColor: "#226533",
                            color: "#226533",
                        }}
                    >
                        {suggestion}
                    </Button>
                ))}
            </div>

            {/* ========== INPUT BOX ========== */}
            <div
                style={{
                    position: "fixed",
                    bottom: 70,
                    left: 0,
                    right: 0,
                    padding: "8px 12px",
                    background: "#fff",
                    borderTop: "2px solid #f0f0f0",
                    display: "flex",
                    gap: 8,
                    zIndex: 1000,
                }}
            >
                <Input
                    placeholder="Hỏi về menu, món ăn..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onPressEnter={() => handleSend()}
                    disabled={loading}
                    style={{
                        borderRadius: 20,
                        fontSize: 14,
                    }}
                />
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => handleSend()}
                    disabled={loading || !input.trim()}
                    style={{
                        borderRadius: 20,
                        background: "#226533",
                        borderColor: "#226533",
                    }}
                />
            </div>

            {/* ========== FOOTER NAV ========== */}
            <CustomerFooterNav cartCount={cartCount} />
        </Layout>
    );
}

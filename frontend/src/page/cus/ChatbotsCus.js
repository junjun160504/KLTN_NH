import React, { useState, useRef, useEffect } from "react";
import CustomerFooterNav from "../../components/CustomerFooterNav";
import {
  Layout,
  Typography,
  Button,
  Input,
  Spin,
  Card,
} from "antd";
import {
  ArrowLeftOutlined,
  SendOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

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
                lineHeight: 1.5,
              }}
            >
              {/* Main text */}
              <div dangerouslySetInnerHTML={{
                __html: content.value.replace(
                  /(https?:\/\/[^\s]+)/g,
                  '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #226533; text-decoration: underline;">$1</a>'
                )
              }} />

              {/* Extracted URLs as buttons */}
              {content.urls && content.urls.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {content.urls.map((url, i) => (
                    <Button
                      key={i}
                      size="small"
                      type="link"
                      href={url}
                      target="_blank"
                      style={{ padding: '0 8px', height: 24 }}
                    >
                      🔗 Link {i + 1}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // 2️⃣ MENU ITEMS (Suggestions)
        if (content.type === 'menu_items') {
          return (
            <div key={index} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {content.items.map((item) => (
                <Card
                  key={item.id}
                  hoverable
                  onClick={() => navigate(`/food/${item.id}`)}
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    transition: "all 0.3s",
                  }}
                  bodyStyle={{ padding: 0 }}
                >
                  <div style={{ display: "flex", alignItems: "stretch" }}>
                    <img
                      src={item.image_url}
                      alt={item.name}
                      style={{
                        width: 90,
                        height: 90,
                        objectFit: "cover",
                        flexShrink: 0,
                        display: "block",
                        margin: 8,
                        borderRadius: 8,
                      }}
                    />
                    <div style={{
                      flex: 1,
                      padding: "8px 12px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}>
                      <div>
                        <Text strong style={{ fontSize: 14, display: "block", marginBottom: 4, color: "#1a1a1a", lineHeight: 1.3 }}>
                          {item.name}
                        </Text>
                        {item.reason && (
                          <Text style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4, lineHeight: 1.3 }}>
                            {item.reason}
                          </Text>
                        )}
                      </div>
                      <Text strong style={{ fontSize: 15, color: "#226533", fontWeight: 700 }}>
                        {item.price.toLocaleString()}đ
                      </Text>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          );
        }

        // 3️⃣ MENTIONED ITEMS (smaller cards)
        if (content.type === 'mentioned_items') {
          return (
            <div key={index} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {content.items.map((item) => (
                <Card
                  key={item.id}
                  hoverable
                  onClick={() => navigate(`/food/${item.id}`)}
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
                      src={item.image_url}
                      alt={item.name}
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: "cover",
                        margin: 8,
                        borderRadius: 8,
                      }}
                    />
                    <div style={{ flex: 1, padding: "8px 12px" }}>
                      <Text strong style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
                        {item.name}
                      </Text>
                      <Text strong style={{ fontSize: 14, color: "#226533" }}>
                        {item.price.toLocaleString()}đ
                      </Text>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          );
        }

        // 4️⃣ ACTION BUTTONS
        if (content.type === 'actions') {
          return (
            <div key={index} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {content.buttons.map((btn, i) => (
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
                    // Handle action based on type
                    if (btn.action === 'navigate' && btn.data) {
                      navigate(btn.data);
                    } else if (btn.action === 'call') {
                      window.location.href = `tel:${btn.data}`;
                    }
                  }}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          );
        }

        // 5️⃣ IMAGES
        if (content.type === 'images') {
          return (
            <div key={index} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {content.urls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Image ${i + 1}`}
                  style={{
                    maxWidth: '100%',
                    borderRadius: 12,
                    cursor: 'pointer',
                  }}
                  onClick={() => window.open(url, '_blank')}
                />
              ))}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default function CustomerChatbotPage() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Redux cart count
  const order = useSelector((state) => state.cart.order);
  const cartCount = order?.foodOrderList?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // ✅ Load messages from sessionStorage on mount
  const [messages, setMessages] = useState(() => {
    try {
      const savedMessages = sessionStorage.getItem("chatbot_messages");
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
        text: "Xin chào! Tôi có thể giúp gì cho bạn hôm nay? 😊",
      },
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Save messages to sessionStorage whenever they change
  useEffect(() => {
    try {
      sessionStorage.setItem("chatbot_messages", JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  }, [messages]);

  // Auto scroll when new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send message to chatbot API
  const handleSend = async (text = input) => {
    const messageText = text.trim();
    if (!messageText) return;

    // Add user message
    const userMessage = { from: "user", type: "text", text: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // ✅ Build conversation history (last 10 messages for context)
      const history = messages.slice(-10).map((msg) => ({
        from: msg.from,
        text: msg.type === "text" ? msg.text : msg.intro, // Use intro for suggestion messages
      }));

      // Call chatbot API with history
      const response = await axios.post(`${REACT_APP_API_URL}/chatbot`, {
        message: messageText,
        history: history, // Send conversation context
      });

      const botResponse = response.data.data;

      // 🎨 Handle rich content response
      if (botResponse.response_type === 'rich_content') {
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            type: "rich_content",
            contents: botResponse.contents,
            // Legacy fields for backward compatibility
            intro: botResponse.intro,
            suggestions: botResponse.suggestions,
            mentioned_items: botResponse.mentioned_items
          },
        ]);
      }
      // Legacy handling
      else if (botResponse.type === "suggestions" && botResponse.suggestions?.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            type: "suggestions",
            intro: botResponse.intro,
            suggestions: botResponse.suggestions,
          },
        ]);
      } else if (botResponse.type === "text_with_items" && botResponse.mentioned_items?.length > 0) {
        // ✅ Handle text with mentioned items
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            type: "text_with_items",
            text: botResponse.text,
            mentioned_items: botResponse.mentioned_items,
          },
        ]);
      } else {
        // Text response fallback
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            type: "text",
            text: botResponse.suggestion || botResponse.text || botResponse.intro || "Xin lỗi, tôi không hiểu câu hỏi của bạn.",
          },
        ]);
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          type: "text",
          text: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại! 🙏",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Clear chat history and reset context
  const handleClearChat = () => {
    const welcomeMessage = {
      from: "bot",
      type: "text",
      text: "Xin chào! Tôi có thể giúp gì cho bạn hôm nay? 😊",
    };

    // Clear sessionStorage first
    sessionStorage.removeItem("chatbot_messages");

    // Reset messages (this will trigger useEffect to save only welcome message)
    setMessages([welcomeMessage]);

    // Optional: Show confirmation
    console.log("✅ Chat history cleared. Starting fresh conversation.");
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
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
              }}
            >
              {msg.from === "user" ? (
                // User message bubble
                <div
                  style={{
                    background: "#226533",
                    color: "white",
                    padding: "10px 14px",
                    borderRadius: 16,
                    maxWidth: "75%",
                    fontSize: 15,
                    lineHeight: 1.5,
                  }}
                >
                  {msg.text}
                </div>
              ) : msg.type === "rich_content" ? (
                // 🎨 Rich content response (new)
                <RichContentRenderer contents={msg.contents} navigate={navigate} />
              ) : msg.type === "suggestions" ? (
                // Bot suggestions with images
                <div style={{ maxWidth: "100%", width: "100%" }}>
                  {/* Intro text */}
                  <div
                    style={{
                      background: "#f0f0f0",
                      color: "#333",
                      padding: "10px 14px",
                      borderRadius: 16,
                      marginBottom: 12,
                      fontSize: 15,
                      lineHeight: 1.5,
                    }}
                  >
                    {msg.intro}
                  </div>

                  {/* Suggestion cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {msg.suggestions.map((item) => (
                      <Card
                        key={item.id}
                        hoverable
                        onClick={() => navigate(`/food/${item.id}`)}
                        style={{
                          borderRadius: 12,
                          overflow: "hidden",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          transition: "all 0.3s",
                        }}
                        bodyStyle={{ padding: 0 }}
                      >
                        <div style={{ display: "flex", alignItems: "stretch" }}>
                          {/* Image */}
                          <img
                            src={item.image_url}
                            alt={item.name}
                            style={{
                              width: 90,
                              height: 90,
                              objectFit: "cover",
                              flexShrink: 0,
                              display: "block",
                              margin: 8,
                              borderRadius: 8,
                            }}
                          />

                          {/* Info */}
                          <div style={{
                            flex: 1,
                            padding: "8px 12px 8px 12px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                          }}>
                            <div>
                              <Text
                                strong
                                style={{
                                  fontSize: 14,
                                  display: "block",
                                  marginBottom: 4,
                                  color: "#1a1a1a",
                                  lineHeight: 1.3,
                                }}
                              >
                                {item.name}
                              </Text>

                              <Text
                                style={{
                                  fontSize: 12,
                                  color: "#666",
                                  display: "block",
                                  marginBottom: 4,
                                  lineHeight: 1.3,
                                }}
                              >
                                {item.reason}
                              </Text>
                            </div>

                            <Text
                              strong
                              style={{
                                fontSize: 15,
                                color: "#226533",
                                fontWeight: 700,
                              }}
                            >
                              {item.price.toLocaleString()}đ
                            </Text>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : msg.type === "text_with_items" ? (
                // ✅ Bot text with mentioned items
                <div style={{ maxWidth: "100%", width: "100%" }}>
                  {/* Text response */}
                  <div
                    style={{
                      background: "#f0f0f0",
                      color: "#333",
                      padding: "10px 14px",
                      borderRadius: 16,
                      marginBottom: 12,
                      fontSize: 15,
                      lineHeight: 1.5,
                    }}
                  >
                    {msg.text}
                  </div>

                  {/* Mentioned items cards */}
                  {msg.mentioned_items && msg.mentioned_items.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {msg.mentioned_items.map((item) => (
                        <Card
                          key={item.id}
                          hoverable
                          onClick={() => navigate(`/food/${item.id}`)}
                          style={{
                            borderRadius: 12,
                            overflow: "hidden",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            transition: "all 0.3s",
                          }}
                          bodyStyle={{ padding: 0 }}
                        >
                          <div style={{ display: "flex", alignItems: "stretch" }}>
                            {/* Image */}
                            <img
                              src={item.image_url}
                              alt={item.name}
                              style={{
                                width: 90,
                                height: 90,
                                objectFit: "cover",
                                flexShrink: 0,
                                display: "block",
                                margin: 8,
                                borderRadius: 8,
                              }}
                            />

                            {/* Info */}
                            <div style={{
                              flex: 1,
                              padding: "8px 12px 8px 12px",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                            }}>
                              <Text
                                strong
                                style={{
                                  fontSize: 14,
                                  display: "block",
                                  marginBottom: 6,
                                  color: "#1a1a1a",
                                  lineHeight: 1.3,
                                }}
                              >
                                {item.name}
                              </Text>

                              <Text
                                strong
                                style={{
                                  fontSize: 15,
                                  color: "#226533",
                                  fontWeight: 700,
                                }}
                              >
                                {item.price.toLocaleString()}đ
                              </Text>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Bot text message
                <div
                  style={{
                    background: "#f0f0f0",
                    color: "#333",
                    padding: "10px 14px",
                    borderRadius: 16,
                    maxWidth: "75%",
                    fontSize: 15,
                    lineHeight: 1.5,
                  }}
                >
                  {msg.text}
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  background: "#f0f0f0",
                  padding: "10px 14px",
                  borderRadius: 16,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <Spin size="small" />
                <Text type="secondary" style={{ fontSize: 14 }}>Đang suy nghĩ...</Text>
              </div>
            </div>
          )}

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
          "Món mới gần đây?",
          "Món đặc trưng?",
          "Đồ ăn cho 2 người?",
          "Món ít cay?",
        ].map((suggestion, i) => (
          <Button
            key={i}
            size="small"
            onClick={() => handleSend(suggestion)}
            style={{
              borderRadius: 16,
              fontSize: 13,
              whiteSpace: "nowrap",
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
          placeholder="Hỏi món gì đó..."
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


import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Send, XCircle } from "lucide-react";
import { getSupabaseErrorMessage, supabase } from "../supabaseClient";

import "./Chat.css";

export default function Chat() {
  const { chatId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);

  const loadChat = useCallback(async () => {
    try {
      setError("");

      const {
        data: { user: loggedInUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!loggedInUser) {
        navigate("/login");
        return;
      }

      setUser(loggedInUser);

      const { data: chatData, error: chatError } = await supabase
        .from("chats")
        .select("*")
        .eq("id", chatId)
        .single();

      if (chatError) throw chatError;

      if (
        chatData.donor_id !== loggedInUser.id &&
        chatData.receiver_id !== loggedInUser.id
      ) {
        throw new Error("You are not a participant in this chat.");
      }

      setChat(chatData);

      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (messageError) throw messageError;

      setMessages(messageData || []);
    } catch (err) {
      console.error("Chat loading error:", err);
      setError(getSupabaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [chatId, navigate]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  // Subscribe to new messages and chat status changes.
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat-room-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const incoming = payload.new;

          setMessages((previous) => {
            if (previous.some((item) => item.id === incoming.id)) {
              return previous;
            }

            return [...previous, incoming].sort(
              (a, b) =>
                new Date(a.created_at) - new Date(b.created_at)
            );
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chats",
          filter: `id=eq.${chatId}`,
        },
        (payload) => {
          setChat(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // Keep the latest message visible.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (event) => {
    event.preventDefault();

    const text = newMessage.trim();

    if (!text || !user || !chat || sending) return;

    if (chat.status !== "active") {
      setError("This chat is closed. You cannot send new messages.");
      return;
    }

    if (text.length > 4000) {
      setError("Message cannot exceed 4000 characters.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const { data, error: insertError } = await supabase
        .from("messages")
        .insert({
          chat_id: chat.id,
          sender_id: user.id,
          message: text,
        })
        .select("*")
        .single();

      if (insertError) throw insertError;

      setMessages((previous) => {
        if (previous.some((item) => item.id === data.id)) {
          return previous;
        }

        return [...previous, data];
      });

      setNewMessage("");
    } catch (err) {
      console.error("Message sending error:", err);
      setError(getSupabaseErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleCloseChat = async () => {
    if (!chat || chat.status !== "active" || closing) return;

    const confirmed = window.confirm(
      "Close this chat? The conversation will remain saved, but no new messages can be sent."
    );

    if (!confirmed) return;

    setClosing(true);
    setError("");

    try {
      const { error: closeError } = await supabase.rpc("close_chat", {
        p_chat_id: chat.id,
      });

      if (closeError) throw closeError;

      setChat((previous) => ({
        ...previous,
        status: "closed",
      }));
    } catch (err) {
      console.error("Close chat error:", err);
      setError(getSupabaseErrorMessage(err));
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="chat-loading">
        Loading conversation...
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="chat-error-page">
        <p>{error || "Chat could not be found."}</p>
        <button onClick={() => navigate("/dashboard")}>
          Back to Chat History
        </button>
      </div>
    );
  }

  const isDonor = user?.id === chat.donor_id;

  const otherPerson = isDonor
    ? {
        name: chat.receiver_name,
        email: chat.receiver_email,
      }
    : {
        name: chat.donor_name,
        email: chat.donor_email,
      };

  const isActive = chat.status === "active";

  return (
    <main className="chat-page">
      <section className="chat-container">

        {/* CHAT HEADER */}
        <header className="chat-header">
          <div className="chat-header-person">
            <button
              type="button"
              className="chat-back-btn"
              onClick={() => navigate("/dashboard")}
              aria-label="Back to chat history"
            >
              <ArrowLeft size={21} />
            </button>

            <div className="chat-avatar">
              <MessageCircle size={23} />
            </div>

            <div className="chat-person-details">
              <h2>{otherPerson.name || "ShareNest Member"}</h2>
              <p>{otherPerson.email || "Email unavailable"}</p>
              <span className={`chat-status ${isActive ? "online" : "offline"}`}>
                {isActive ? "Active conversation" : "Chat " + chat.status}
              </span>
            </div>
          </div>

          {isActive && (
            <button
              type="button"
              className="close-chat-btn"
              onClick={handleCloseChat}
              disabled={closing}
            >
              <XCircle size={17} />
              {closing ? "Closing..." : "Close Chat"}
            </button>
          )}
        </header>

        {/* ERROR */}
        {error && (
          <div className="chat-error" role="alert">
            {error}
          </div>
        )}

        {/* CHAT BODY */}
        <div className="chat-messages">
          <div className="chat-date-note">
            Messages between donor and receiver
          </div>

          {messages.length === 0 ? (
            <div className="chat-empty">
              <MessageCircle size={35} />
              <h3>No messages yet</h3>
              <p>Start the conversation with a friendly message.</p>
            </div>
          ) : (
            messages.map((message) => {
              const mine = message.sender_id === user?.id;

              return (
                <div
                  key={message.id}
                  className={`message-row ${mine ? "my-message-row" : ""}`}
                >
                  <div
                    className={`message-bubble ${mine ? "my-message" : "their-message"}`}
                  >
                    {!mine && (
                      <strong className="message-sender">
                        {message.sender_name || otherPerson.name || "Member"}
                      </strong>
                    )}

                    <p>{message.message}</p>

                    <span className="message-time">
                      {new Date(message.created_at).toLocaleString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          <div ref={bottomRef} />
        </div>

        {/* MESSAGE INPUT */}
        {isActive ? (
          <form className="chat-input-area" onSubmit={handleSend}>
            <textarea
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder="Write your message..."
              rows={1}
              maxLength={4000}
              disabled={sending}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  handleSend(event);
                }
              }}
            />

            <button
              type="submit"
              className="send-message-btn"
              disabled={sending || !newMessage.trim()}
              aria-label="Send message"
            >
              <Send size={19} />
              {sending ? "Sending" : "Send"}
            </button>
          </form>
        ) : (
          <div className="chat-closed-notice">
            This conversation is closed. Messages are saved as history.
            New messages are disabled.
          </div>
        )}

        <div className="chat-footer">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={16} /> Back to Chat History
          </button>
        </div>

      </section>
    </main>
  );
}

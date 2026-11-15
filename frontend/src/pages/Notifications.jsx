
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  MessageCircle,
  Package,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import "./Notifications.css";

function formatDate(date) {
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "";

  return value.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const PAGE_SIZE = 30;

function getNotificationIcon(type) {
  if (type?.startsWith("chat")) {
    return <MessageCircle size={21} />;
  }

  if (type?.startsWith("claim")) {
    return <Package size={21} />;
  }

  return <Bell size={21} />;
}

export default function Notifications({ embedded = false }) {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadNotifications = useCallback(async (userId, offset = 0, append = false) => {
    if (!supabase || !userId) return;

    const { data, error: fetchError } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (fetchError) throw fetchError;

    // Chat invitations belong exclusively to the Messages panel.
    const rows = (data || []).filter((item) => !String(item.type || "").startsWith("chat"));

    const claimIds = [
      ...new Set(rows.map((item) => item.related_claim_id).filter(Boolean)),
    ];

    const chatIds = [];

    let claims = [];
    let chats = [];

    if (claimIds.length > 0) {
      const { data, error } = await supabase
        .from("claims")
        .select("id,status")
        .in("id", claimIds);

      if (error) throw error;
      claims = data || [];
    }

    if (chatIds.length > 0) {
      const { data, error } = await supabase
        .from("chats")
        .select("id,status")
        .in("id", chatIds);

      if (error) throw error;
      chats = data || [];
    }

    const claimMap = new Map(claims.map((item) => [item.id, item]));
    const chatMap = new Map(chats.map((item) => [item.id, item]));

    const enrichedRows = rows.map((item) => ({
      ...item,
      claim: item.related_claim_id
        ? claimMap.get(item.related_claim_id)
        : null,
      chat: item.related_chat_id
        ? chatMap.get(item.related_chat_id)
        : null,
    }));

    setHasMore((data || []).length === PAGE_SIZE);
    setNotifications((previous) =>
      append ? [...previous, ...enrichedRows] : enrichedRows
    );
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!supabase) {
      setError("Supabase is not configured. Check your environment settings.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        navigate("/login");
        return;
      }

      setCurrentUser(user);
      await loadNotifications(user.id);
    } catch (err) {
      console.error("Notification loading error:", err);
      setError(err.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [loadNotifications, navigate]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (!currentUser || !supabase) return;

    const channel = supabase
      .channel(`notifications-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${currentUser.id}`,
        },
        () => {
          loadNotifications(currentUser.id).catch(console.error);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, loadNotifications]);

  const loadOlderNotifications = async () => {
    if (!currentUser || loadingMore || !hasMore) return;

    setLoadingMore(true);
    setError("");

    try {
      await loadNotifications(currentUser.id, notifications.length, true);
    } catch (err) {
      setError(err.message || "Unable to load older notifications.");
    } finally {
      setLoadingMore(false);
    }
  };

  const deleteNotification = async (notification) => {
    if (!notification?.id || !currentUser || !supabase || busyId) return;

    const confirmed = window.confirm(
      "Delete this notification from your history? This cannot be undone."
    );

    if (!confirmed) return;

    setBusyId(notification.id);
    setError("");
    setSuccess("");

    try {
      const { error: deleteError } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notification.id)
        .eq("recipient_id", currentUser.id);

      if (deleteError) throw deleteError;

      setNotifications((previous) =>
        previous.filter((item) => item.id !== notification.id)
      );
      setSuccess("Notification deleted from your history.");
    } catch (err) {
      console.error("Notification delete error:", err);
      setError(
        err.message ||
          "Unable to delete this notification. Check your notification delete policy."
      );
    } finally {
      setBusyId(null);
    }
  };

  const markAsRead = async (notification) => {
    if (!notification || notification.read_at || !currentUser || !supabase) {
      return;
    }

    setError("");
    const readAt = new Date().toISOString();

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .eq("id", notification.id)
      .eq("recipient_id", currentUser.id);

    if (error) {
      setError(error.message);
      return;
    }

    setNotifications((previous) =>
      previous.map((item) =>
        item.id === notification.id
          ? { ...item, read_at: readAt }
          : item
      )
    );
  };

  const markAllAsRead = async () => {
    if (!currentUser || !supabase || busyId) return;

    setError("");
    const readAt = new Date().toISOString();

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .eq("recipient_id", currentUser.id)
      .is("read_at", null);

    if (error) {
      setError(error.message);
      return;
    }

    setNotifications((previous) =>
      previous.map((item) => ({
        ...item,
        read_at: item.read_at || readAt,
      }))
    );

    setSuccess("All notifications marked as read.");
  };

  const handleRequest = async (notification, accepted) => {
    if (!supabase || !notification || !currentUser || busyId) return;

    setBusyId(notification.id);
    setError("");
    setSuccess("");

    try {
      if (notification.type === "claim_request") {
        if (!notification.related_claim_id) {
          throw new Error("Claim information is missing.");
        }

        if (accepted) {
          const { error } = await supabase.rpc("approve_claim", {
            p_claim_id: notification.related_claim_id,
          });

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("claims")
            .update({ status: "rejected" })
            .eq("id", notification.related_claim_id)
            .eq("status", "pending");

          if (error) throw error;
        }

        setSuccess(
          accepted
            ? "Donation request approved."
            : "Donation request rejected."
        );
      }


      await markAsRead(notification);
      await loadNotifications(currentUser.id);
    } catch (err) {
      console.error("Request action error:", err);
      setError(err.message || "Unable to process this request.");
    } finally {
      setBusyId(null);
    }
  };

  const unreadCount = notifications.filter(
    (item) => !item.read_at
  ).length;

  const canRespond = (notification) => {
    if (notification.type === "claim_request") {
      return notification.claim?.status === "pending";
    }

    return false;
  };

  return (
    <div
      className={`notifications-page ${
        embedded ? "notifications-embedded" : ""
      }`}
    >
      <div className="notifications-header">
        <div>
          <span style={{ display: "inline-block", marginBottom: 8, color: "#78917b", fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>YOUR ACTIVITY</span>
          <h1 className="notifications-heading">Notifications</h1>
          <p className="notifications-subtitle">
            Your donation requests and updates, newest first.
          </p>
          <p className="notifications-subtitle">
            {unreadCount} unread in loaded notifications
          </p>
        </div>

        <div className="notifications-header-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="notification-mark-all"
              onClick={markAllAsRead}
            >
              <CheckCheck size={15} />
              Mark all as read
            </button>
          )}

          <button
            type="button"
            className="notifications-refresh-btn"
            onClick={refreshNotifications}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={loading ? "notifications-spinner" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="notifications-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="notifications-alert success">
          {success}
        </div>
      )}

      {loading ? (
        <div className="notifications-loading">
          <RefreshCw
            size={28}
            className="notifications-spinner"
          />
          <p>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="notifications-empty">
          <div className="notifications-empty-icon">
            <Bell size={26} />
          </div>

          <h3>No notifications yet</h3>

          <p>
            Your donation requests and updates will appear here.
          </p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => {
            const pending = canRespond(notification);
            const isBusy = busyId === notification.id;

            return (
              <div
                key={notification.id}
                className={`notification-card ${
                  notification.read_at ? "" : "unread"
                }`}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="notification-card-content">
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <h3 className="notification-title">
                      {notification.title || "ShareNest update"}

                      {!notification.read_at && (
                        <span className="notification-unread-dot" />
                      )}
                    </h3>

                    <button
                      type="button"
                      onClick={() => deleteNotification(notification)}
                      disabled={isBusy}
                      title="Delete notification"
                      aria-label="Delete notification"
                      style={{
                        width: 34,
                        height: 34,
                        flex: "0 0 34px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #f0dddd",
                        borderRadius: 9,
                        background: "#fff",
                        color: "#a85b55",
                        cursor: isBusy ? "not-allowed" : "pointer",
                        opacity: isBusy ? 0.5 : 1,
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p className="notification-body">
                    {notification.body}
                  </p>

                  <div className="notification-date">
                    <Clock size={13} />
                    {formatDate(notification.created_at)}
                  </div>

                  {pending && (
                    <div className="notification-actions">
                      <button
                        type="button"
                        className="notification-accept-btn"
                        disabled={isBusy}
                        onClick={() => handleRequest(notification, true)}
                      >
                        <Check size={14} />
                        {isBusy ? "Please wait..." : "Accept"}
                      </button>

                      <button
                        type="button"
                        className="notification-reject-btn"
                        disabled={isBusy}
                        onClick={() => handleRequest(notification, false)}
                      >
                        <X size={14} />
                        Reject
                      </button>
                    </div>
                  )}

                  {!notification.read_at && (
                    <button
                      type="button"
                      className="notification-mark-read"
                      onClick={() => markAsRead(notification)}
                    >
                      <Check size={13} />
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && notifications.length > 0 && hasMore && (
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 24px" }}>
          <button
            type="button"
            onClick={loadOlderNotifications}
            disabled={loadingMore}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              minHeight: 44,
              padding: "0 20px",
              border: "1px solid #d9e5d9",
              borderRadius: 11,
              background: "#fff",
              color: "#315f40",
              fontSize: 13,
              fontWeight: 700,
              cursor: loadingMore ? "wait" : "pointer",
            }}
          >
            {loadingMore ? (
              <>
                <RefreshCw size={15} className="notifications-spinner" />
                Loading older notifications...
              </>
            ) : (
              "Load older notifications"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

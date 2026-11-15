
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MessageCircle,
  Send,
  Package,
  Clock,
  RefreshCw,
  MapPin,
  CalendarDays,
  Image as ImageIcon,
  LayoutDashboard,
  PlusCircle,
  Search,
  UserRound,
  LogOut,
  Heart,
  Bell,
  MessageSquare,
  Trash2,
  SlidersHorizontal,
  CheckCircle2,
  Camera,
  Save,
  Pencil,
  X,
  Mail,
  Phone,
  Cake,
  User,
  ArrowUpRight,
  PackageCheck,
  Activity,
  FileText,
} from "lucide-react";

import { getSupabaseErrorMessage, supabase } from "../supabaseClient";
import Notifications from "./Notifications";

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "#fff",
    border: "1px solid #e6ece7",
    borderRadius: "15px",
    overflow: "hidden",
    boxShadow: "0 4px 15px rgba(25, 55, 32, 0.05)",
  },
  image: {
    width: "100%",
    height: "185px",
    objectFit: "cover",
    background: "#edf5ed",
  },
  imagePlaceholder: {
    height: "145px",
    background: "#edf5ed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#75947a",
  },
  cardBody: {
    padding: "18px",
  },
  itemName: {
    fontSize: "18px",
    fontWeight: 700,
    margin: "0 0 8px",
    color: "#263c2d",
  },
  muted: {
    color: "#77847a",
    fontSize: "13px",
    margin: "7px 0",
    lineHeight: 1.5,
  },
  badge: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 700,
    background: "#edf5ed",
    color: "#315f40",
    textTransform: "capitalize",
  },
  buttons: {
    display: "flex",
    flexWrap: "wrap",
    gap: "9px",
    marginTop: "15px",
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 650,
    fontSize: "13px",
  },
  primary: {
    background: "#315f40",
    color: "#fff",
  },
  secondary: {
    background: "#edf5ed",
    color: "#315f40",
  },
  danger: {
    background: "#fff0ef",
    color: "#b33b35",
  },
  disabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  empty: {
    textAlign: "center",
    padding: "55px 20px",
    background: "#f8fbf8",
    border: "1px dashed #d5e2d7",
    borderRadius: "14px",
    color: "#77847a",
  },
};

function formatDate(value) {
  if (!value) return "Date unavailable";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusStyle(status) {
  if (status === "approved" || status === "active") {
    return {
      background: "#e5f5e8",
      color: "#24733b",
    };
  }

  if (
    status === "rejected" ||
    status === "cancelled" ||
    status === "closed"
  ) {
    return {
      background: "#fff0ef",
      color: "#b33b35",
    };
  }

  return {
    background: "#fff5df",
    color: "#986a13",
  };
}

function DonationImage({ donation }) {
  const images = Array.isArray(donation?.image_urls)
    ? donation.image_urls
    : [];

  if (images.length > 0) {
    return (
      <img
        src={images[0]}
        alt={donation?.name || "Donation"}
        style={styles.image}
      />
    );
  }

  return (
    <div style={styles.imagePlaceholder}>
      <ImageIcon size={38} />
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span style={{ ...styles.badge, ...statusStyle(status) }}>
      {status || "unknown"}
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <div style={styles.empty}>
      <Package size={38} style={{ marginBottom: "12px" }} />
      <p style={{ margin: 0 }}>{text}</p>
    </div>
  );
}

export default function MyDashboard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isNotificationsPage =
    location.pathname === "/notifications";

  const isBrowsePage =
    location.pathname === "/donations";

  const isAddDonationPage =
    location.pathname === "/add-donation";

  const isChatPage =
    location.pathname.startsWith("/chat/");


  const isRoutedPage =
    isNotificationsPage ||
    isBrowsePage ||
    isAddDonationPage ||
    isChatPage;

  const pageTitle = isNotificationsPage
    ? "Notifications"
    : isBrowsePage
    ? "Browse Donations"
    : isAddDonationPage
    ? "Add Donation"
    : isChatPage
    ? "Messages"
    : null;

  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "", bio: "", date_of_birth: "", location: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [profilePhoneError, setProfilePhoneError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activitySearch, setActivitySearch] = useState("");
  const [activityStatus, setActivityStatus] = useState("all");

  const [donations, setDonations] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [chats, setChats] = useState([]);
  const [chatSearch, setChatSearch] = useState("");
  const [hiddenChatIds, setHiddenChatIds] = useState([]);
  const [chatDonationNames, setChatDonationNames] = useState({});
  const [removingChatId, setRemovingChatId] = useState(null);
  const [respondingChatId, setRespondingChatId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState(null);

  const [openPanel, setOpenPanel] = useState(null);

  useEffect(() => {
    if (!openPanel) return;
    const onEscape = (event) => {
      if (event.key === "Escape") setOpenPanel(null);
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [openPanel]);

  useEffect(() => {
    setOpenPanel(null);
  }, [location.pathname]);

  const showNotice = (type, message) => {
    setNotice({ type, message });
  };

  // Dismiss temporary feedback automatically.
  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Profile-specific confirmation should not follow users into other pages.
  useEffect(() => {
    if (location.pathname !== "/dashboard" || activeTab !== "profile") {
      setNotice((previous) =>
        previous?.type === "success" &&
        (previous.message === "Profile updated successfully." ||
          previous.message === "Profile photo updated.")
          ? null
          : previous
      );
    }
  }, [activeTab, location.pathname]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setCurrentUser(null);
        setProfile(null);
        setDonations([]);
        setMyClaims([]);
        setIncomingRequests([]);
        setChats([]);
        setHiddenChatIds([]);
        navigate("/login");
        return;
      }

      setCurrentUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, phone, bio, avatar_url, date_of_birth, location")
        .eq("id", user.id)
        .maybeSingle();

      setProfile(profileData || null);
      setProfileForm({
        full_name: profileData?.full_name || "",
        phone: profileData?.phone || "",
        bio: profileData?.bio || "",
        date_of_birth: profileData?.date_of_birth || "",
        location: profileData?.location || "",
      });

      const [
        donationsResult,
        claimsResult,
        incomingResult,
        chatsResult,
      ] = await Promise.all([
        supabase
          .from("donations")
          .select("*")
          .eq("donor_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("claims")
          .select("*, donation:donations(*)")
          .eq("claimant_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("claims")
          .select("*, donation:donations!inner(*)")
          .eq("donations.donor_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("chats")
          .select("*")
          .or(`donor_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: false }),
      ]);

      if (donationsResult.error) throw donationsResult.error;
      if (claimsResult.error) throw claimsResult.error;
      if (incomingResult.error) throw incomingResult.error;
      if (chatsResult.error) throw chatsResult.error;

      setDonations(donationsResult.data || []);
      setMyClaims(claimsResult.data || []);
      setIncomingRequests(incomingResult.data || []);
      setChats(chatsResult.data || []);
      const { data: hiddenRows, error: hiddenError } = await supabase
        .from("chat_hidden").select("chat_id").eq("user_id", user.id);
      if (hiddenError) throw hiddenError;
      setHiddenChatIds((hiddenRows || []).map((row) => row.chat_id));
      const donationIds = [...new Set((chatsResult.data || [])
        .map((chat) => chat.donation_id).filter(Boolean))];
      if (donationIds.length) {
        const { data: donationRows } = await supabase
          .from("donations").select("id,name").in("id", donationIds);
        setChatDonationNames(Object.fromEntries(
          (donationRows || []).map((row) => [row.id, row.name])
        ));
      } else setChatDonationNames({});
    } catch (error) {
      console.error("Dashboard loading error:", error);
      showNotice("error", getSupabaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const getChatForClaim = (claimId) => {
    const claimChats = chats.filter(
      (chat) => chat.claim_id === claimId
    );

    return (
      claimChats.find(
        (chat) =>
          chat.status === "pending" ||
          chat.status === "active"
      ) ||
      claimChats[0] ||
      null
    );
  };

  const handleSendChatRequest = async (claim) => {
    if (!claim?.id || busyId) return;

    setBusyId(claim.id);
    setNotice(null);

    try {
      const { error } = await supabase.rpc("create_chat_request", {
        p_claim_id: claim.id,
      });

      if (error) throw error;

      showNotice("success", "Chat request sent to the donor.");
      await loadDashboard();
    } catch (error) {
      console.error("Create chat request error:", error);
      showNotice("error", getSupabaseErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const openChat = (chat) => {
    if (chat?.id) {
      setOpenPanel(null);
      navigate(`/chat/${chat.id}`);
    }
  };

  const respondToChatInvitation = async (chat, accept) => {
    if (!chat?.id || chat.status !== "pending" ||
        chat.donor_id !== currentUser?.id || respondingChatId) return;

    setRespondingChatId(chat.id);
    setNotice(null);
    try {
      const { error } = await supabase.rpc("respond_to_chat_request", {
        p_chat_id: chat.id,
        p_accept: accept,
      });
      if (error) throw error;
      setChats((previous) => previous.map((item) =>
        item.id === chat.id
          ? { ...item, status: accept ? "active" : "rejected" }
          : item
      ));
      if (accept) {
        setOpenPanel(null);
        navigate(`/chat/${chat.id}`);
      } else {
        showNotice("success", "Chat invitation rejected.");
      }
    } catch (error) {
      showNotice("error", getSupabaseErrorMessage(error));
    } finally {
      setRespondingChatId(null);
    }
  };

  const removeChatFromMyHistory = async (chat) => {
    if (!currentUser?.id || removingChatId) return;
    if (!window.confirm("Remove this conversation from your history? The other person will still have their messages.")) return;
    setRemovingChatId(chat.id);
    try {
      const { error } = await supabase.from("chat_hidden").upsert({
        chat_id: chat.id, user_id: currentUser.id,
      }, { onConflict: "chat_id,user_id" });
      if (error) throw error;
      setHiddenChatIds((ids) => [...ids, chat.id]);
    } catch (error) { showNotice("error", getSupabaseErrorMessage(error)); }
    finally { setRemovingChatId(null); }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!currentUser?.id || profileSaving) return;

    const fullName = profileForm.full_name.trim();
    const phone = profileForm.phone.trim();
    const bio = profileForm.bio.trim();
    const locationText = profileForm.location.trim();
    const dateOfBirth = profileForm.date_of_birth;

    if (fullName.length < 2 || fullName.length > 80) {
      showNotice("error", "Name must be between 2 and 80 characters.");
      return;
    }

    if (phone && !/^[6-9][0-9]{9}$/.test(phone)) {
      showNotice("error", "Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (locationText.length > 180) {
      showNotice("error", "Location cannot exceed 180 characters.");
      return;
    }

    if (dateOfBirth && (dateOfBirth > new Date().toISOString().slice(0, 10) || dateOfBirth < "1900-01-01")) {
      showNotice("error", "Please select a valid date of birth.");
      return;
    }

    if (bio.length > 300) {
      showNotice("error", "Bio cannot exceed 300 characters.");
      return;
    }

    setProfileSaving(true);
    try {
      const changes = {
        full_name: fullName,
        phone: phone || null,
        bio,
        location: locationText || null,
        date_of_birth: dateOfBirth || null,
      };
      const { data, error } = await supabase
        .from("profiles")
        .update(changes)
        .eq("id", currentUser.id)
        .select("full_name, phone, bio, avatar_url, date_of_birth, location")
        .single();

      if (error) throw error;
      setProfile(data);
      setIsProfileEditing(false);
      setProfilePhoneError("");
      showNotice("success", "Profile updated successfully.");
    } catch (error) {
      showNotice("error", getSupabaseErrorMessage(error));
    } finally {
      setProfileSaving(false);
    }
  };

  const uploadProfilePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !currentUser?.id || avatarUploading) return;

    const types = ["image/jpeg", "image/png", "image/webp"];
    if (!types.includes(file.type)) {
      showNotice("error", "Choose a JPG, PNG or WebP photo.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showNotice("error", "Profile photo must be 2 MB or smaller.");
      return;
    }

    setAvatarUploading(true);
    try {
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${currentUser.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-avatars")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profile-avatars")
        .getPublicUrl(path);

      const { data, error } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", currentUser.id)
        .select("full_name, phone, bio, avatar_url, date_of_birth, location")
        .single();

      if (error) throw error;
      setProfile(data);
      showNotice("success", "Profile photo updated.");
    } catch (error) {
      showNotice("error", getSupabaseErrorMessage(error));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const displayName =
    profile?.full_name ||
    currentUser?.user_metadata?.full_name ||
    currentUser?.user_metadata?.name ||
    currentUser?.email?.split("@")[0] ||
    "ShareNest Member";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const notifications = useMemo(() => {
    const items = [];

    incomingRequests
      .filter((claim) => claim.status === "pending")
      .forEach((claim) => {
        items.push({
          id: `claim-${claim.id}`,
          type: "claim",
          date: claim.created_at,
        });
      });

    chats
      .filter(
        (chat) =>
          chat.status === "pending" &&
          chat.donor_id === currentUser?.id
      )
      .forEach((chat) => {
        items.push({
          id: `chat-${chat.id}`,
          type: "chat",
          date: chat.created_at,
        });
      });

    myClaims
      .filter(
        (claim) =>
          claim.status === "approved" ||
          claim.status === "rejected"
      )
      .forEach((claim) => {
        items.push({
          id: `claim-status-${claim.id}`,
          type: "status",
          date: claim.created_at,
        });
      });

    return items.sort(
      (a, b) =>
        new Date(b.date || 0).getTime() -
        new Date(a.date || 0).getTime()
    );
  }, [incomingRequests, chats, myClaims, currentUser]);

  const pendingNotificationCount = notifications.filter(
    (item) => item.type === "claim"
  ).length;

  const pendingChatInvitations = chats.filter(
    (chat) => chat.status === "pending" &&
      chat.donor_id === currentUser?.id && !hiddenChatIds.includes(chat.id)
  );

  const getChatTitle = (chat) => {
    if (chat.donor_id === currentUser?.id) {
      return chat.receiver_name || "Receiver";
    }

    return chat.donor_name || "Donor";
  };

  const visibleChats = chats.filter((chat) => !hiddenChatIds.includes(chat.id));
  const filteredChats = visibleChats.filter((chat) => {
    const query = chatSearch.trim().toLowerCase();
    return !query || [getChatTitle(chat), chatDonationNames[chat.donation_id], chat.status]
      .some((value) => String(value || "").toLowerCase().includes(query));
  });

  const getChatDonationName = (chat) => {
    const claim =
      incomingRequests.find((item) => item.id === chat.claim_id) ||
      myClaims.find((item) => item.id === chat.claim_id);

    return chatDonationNames[chat.donation_id] || claim?.donation?.name || "Donation conversation";
  };

  const filteredDonations = donations.filter((donation) => {
    const query = activitySearch.trim().toLowerCase();
    const matchesText = [donation.name, donation.category, donation.location, donation.description]
      .some((value) => String(value || "").toLowerCase().includes(query));
    return matchesText && (activityStatus === "all" || (donation.status || "unknown").toLowerCase() === activityStatus);
  });

  const filteredClaims = myClaims.filter((claim) => {
    const donation = claim.donation || {};
    const query = activitySearch.trim().toLowerCase();
    const matchesText = [donation.name, donation.category, donation.location, donation.donor_name]
      .some((value) => String(value || "").toLowerCase().includes(query));
    return matchesText && (activityStatus === "all" || (claim.status || "unknown").toLowerCase() === activityStatus);
  });

  const activityStatuses = [...new Set((activeTab === "donated" ? donations : myClaims)
    .map((item) => (item.status || "unknown").toLowerCase()))].sort();

  const renderActivityToolbar = (type) => (
    <div className="sn-activity-toolbar">
      <div className="sn-activity-intro">
        <span className="sn-activity-eyebrow"><SlidersHorizontal size={14} /> YOUR ACTIVITY</span>
        <h2>{type === "donated" ? "My Donations" : "My Claims"}</h2>
        <p>{type === "donated" ? "Track every item you've shared with your community." : "Follow the requests you've made and their progress."}</p>
      </div>
      <div className="sn-activity-controls">
        <label className="sn-activity-search">
          <Search size={17} />
          <input value={activitySearch} onChange={(event) => setActivitySearch(event.target.value)}
            placeholder={type === "donated" ? "Search your donations" : "Search your claims"} aria-label="Search activity" />
        </label>
        <select value={activityStatus} onChange={(event) => setActivityStatus(event.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {activityStatuses.map((status) => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}
        </select>
      </div>
    </div>
  );

  const renderDonationCard = (donation) => (
    <article key={donation.id} className="sn-activity-card" style={styles.card}>
      <DonationImage donation={donation} />

      <div style={styles.cardBody}>
        <h3 style={styles.itemName}>{donation.name}</h3>

        <p style={styles.muted}>
          {donation.category || "Other"} ·{" "}
          {donation.item_condition || "Condition not specified"}
        </p>

        <p style={styles.muted}>
          <MapPin size={14} style={{ verticalAlign: "middle" }} />{" "}
          {donation.location || "Location not specified"}
        </p>

        <p style={styles.muted}>
          <CalendarDays size={14} style={{ verticalAlign: "middle" }} />{" "}
          {formatDate(donation.created_at)}
        </p>

        <p style={styles.muted}>
          {donation.description || "No description provided."}
        </p>

        <StatusBadge status={donation.status} />
      </div>
    </article>
  );

  const renderMyClaimCard = (claim) => {
    const donation = claim.donation;
    const chat = getChatForClaim(claim.id);

    const canSendChatRequest =
      claim.status === "approved" &&
      (!chat ||
        chat.status === "closed" ||
        chat.status === "rejected");

    return (
      <article key={claim.id} className="sn-activity-card" style={styles.card}>
        {donation && <DonationImage donation={donation} />}

        <div style={styles.cardBody}>
          <h3 style={styles.itemName}>
            {donation?.name || "Donation item"}
          </h3>

          <p style={styles.muted}>
            Donor: {donation?.donor_name || "Donor"}
          </p>

          <p style={styles.muted}>
            <MapPin size={14} style={{ verticalAlign: "middle" }} />{" "}
            {donation?.location || "Location not specified"}
          </p>

          <p style={styles.muted}>
            Requested on: {formatDate(claim.created_at)}
          </p>

          <StatusBadge status={claim.status} />

          {claim.status === "pending" && (
            <p style={styles.muted}>
              <Clock size={14} style={{ verticalAlign: "middle" }} />{" "}
              Waiting for the donor to approve your request.
            </p>
          )}

          {canSendChatRequest && (
            <div style={styles.buttons}>
              <button
                style={{
                  ...styles.button,
                  ...styles.primary,
                  ...(busyId === claim.id ? styles.disabled : {}),
                }}
                disabled={busyId === claim.id}
                onClick={() => handleSendChatRequest(claim)}
              >
                <Send size={15} />
                {busyId === claim.id ? "Sending..." : "Send Chat Request"}
              </button>
            </div>
          )}

          {chat?.status === "pending" && (
            <p style={styles.muted}>
              <Clock size={14} style={{ verticalAlign: "middle" }} />{" "}
              Chat request sent. Waiting for the donor's response.
            </p>
          )}

          {chat?.status === "active" && (
            <button
              style={{ ...styles.button, ...styles.primary }}
              onClick={() => openChat(chat)}
            >
              <MessageCircle size={16} />
              Open Chat
            </button>
          )}
        </div>
      </article>
    );
  };

  if (loading) {
    return (
      <div className="profile-dashboard-loading">
        <RefreshCw size={28} className="spin-icon" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="profile-dashboard-shell">
      <style>{`
        /* Full-page Messages dialog, independent of dashboard layout */
        .sn-messages-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(20, 40, 27, .48);
          backdrop-filter: blur(5px);
        }
        .sn-messages-overlay .sn-messages-dialog {
          position: relative !important;
          inset: auto !important;
          top: auto !important;
          right: auto !important;
          left: auto !important;
          width: min(900px, 100%) !important;
          height: min(760px, calc(100dvh - 40px)) !important;
          max-width: none !important;
          max-height: none !important;
          min-height: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          border-radius: 22px;
          box-shadow: 0 30px 100px rgba(10, 35, 18, .3);
        }
        .sn-messages-overlay .sn-messages-list {
          flex: 1;
          min-height: 0;
          max-height: none !important;
          overflow-y: auto;
        }
        .sn-chat-invite-actions {
          display: flex;
          gap: 10px;
          padding: 0 18px 15px 75px;
          flex-wrap: wrap;
        }
        .sn-chat-invite-actions button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 13px;
          border-radius: 9px;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .sn-chat-invite-accept { background: #315f40; color: white; border: 1px solid #315f40; }
        .sn-chat-invite-reject { background: white; color: #a94740; border: 1px solid #e6c9c5; }
        .sn-chat-invite-actions button:disabled { opacity: .55; cursor: wait; }
        .sn-notifications-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 18px 24px 28px;
          overscroll-behavior: contain;
        }
        .sn-notifications-dialog .notifications-page {
          width: 100%;
          max-width: none;
          margin: 0;
        }
        .sn-notifications-dialog .notifications-header {
          margin-top: 0;
        }
        @media (max-width: 650px) {
          .sn-notifications-scroll { padding: 12px 14px 24px; }
        }
        .sn-messages-overlay .social-panel-empty {
          min-height: 280px;
        }
        @media (max-width: 650px) {
          .sn-messages-overlay { padding: 0; }
          .sn-messages-overlay .sn-messages-dialog {
            width: 100% !important;
            height: 100dvh !important;
            border-radius: 0;
          }
        }
        .sn-activity-section { animation: snFadeUp .35s ease both; }
        .sn-activity-toolbar { display:flex;justify-content:space-between;align-items:end;gap:22px;flex-wrap:wrap;margin-bottom:20px; }
        .sn-activity-eyebrow { display:inline-flex;align-items:center;gap:7px;color:#477852;font-size:11px;font-weight:800;letter-spacing:1.2px; }
        .sn-activity-intro h2 { font-size:clamp(23px,2.5vw,30px);letter-spacing:-.8px;margin:7px 0;color:#203e2a; }
        .sn-activity-intro p { color:#7c8980;font-size:13px;margin:0; }
        .sn-activity-controls { display:flex;gap:10px;align-items:center;flex-wrap:wrap; }
        .sn-activity-search { display:flex;align-items:center;gap:9px;background:white;border:1px solid #dce8df;border-radius:12px;padding:0 13px;color:#62846b;min-height:43px; }
        .sn-activity-search:focus-within { border-color:#477852;box-shadow:0 0 0 3px #e9f5eb; }
        .sn-activity-search input { border:0;outline:0;background:transparent;font:inherit;font-size:13px;min-width:190px;color:#294333; }
        .sn-activity-controls select { min-height:43px;border:1px solid #dce8df;border-radius:12px;background:#fff;color:#294333;padding:0 12px;font:inherit;font-size:13px;cursor:pointer; }
        .sn-activity-count { display:flex;align-items:center;gap:7px;color:#67816c;font-size:12px;font-weight:600;margin:0 0 15px; }
        .sn-activity-card { transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease; }
        .sn-activity-card:hover { transform:translateY(-4px);box-shadow:0 15px 32px rgba(28,75,43,.12)!important;border-color:#c5dec9!important; }
        .sn-activity-card img { transition:transform .3s ease; }
        @keyframes snFadeUp { from {opacity:0;transform:translateY(8px)} to {opacity:1;transform:translateY(0)} }
        @media(max-width:650px) { .sn-activity-toolbar,.sn-activity-controls {width:100%;} .sn-activity-search {flex:1;min-width:180px;} .sn-activity-search input {min-width:0;width:100%;} }
        @media(prefers-reduced-motion:reduce) { .sn-activity-section,.sn-activity-card {animation:none;transition:none;} }
      `}</style>
      <aside className="profile-sidebar">
        <button
          className="profile-sidebar-brand"
          onClick={() => navigate("/dashboard")}
        >
          <span className="profile-brand-mark">
            <Heart size={20} fill="currentColor" />
          </span>
          <span>
            Share<span>Nest</span>
          </span>
        </button>

        <div className="profile-sidebar-label">WORKSPACE</div>

        <nav className="profile-sidebar-nav">
          <button
            className={`profile-side-link ${
              !isRoutedPage && activeTab === "dashboard" ? "active" : ""
            }`}
            onClick={() => {
              if (location.pathname !== "/dashboard") {
                navigate("/dashboard");
              }
              setActiveTab("dashboard");
            }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            className={`profile-side-link ${
              !isRoutedPage && activeTab === "donated" ? "active" : ""
            }`}
            onClick={() => {
              if (location.pathname !== "/dashboard") {
                navigate("/dashboard");
              }
              setActiveTab("donated");
            }}
          >
            <Package size={18} />
            <span>My Donations</span>
          </button>

          <button
            className={`profile-side-link ${
              !isRoutedPage && activeTab === "claimed" ? "active" : ""
            }`}
            onClick={() => {
              if (location.pathname !== "/dashboard") {
                navigate("/dashboard");
              }
              setActiveTab("claimed");
            }}
          >
            <Heart size={18} />
            <span>My Claims</span>
          </button>

          <button
            className={`profile-side-link ${
              isBrowsePage ? "active" : ""
            }`}
            onClick={() => navigate("/donations")}
          >
            <Search size={18} />
            <span>Browse Donations</span>
          </button>

          <button
            className={`profile-side-link ${
              isAddDonationPage ? "active" : ""
            }`}
            onClick={() => navigate("/add-donation")}
          >
            <PlusCircle size={18} />
            <span>Add Donation</span>
          </button>

          <button
            className={`profile-side-link ${
              !isRoutedPage && activeTab === "profile" ? "active" : ""
            }`}
            onClick={() => {
              if (location.pathname !== "/dashboard") {
                navigate("/dashboard");
              }
              setActiveTab("profile");
            }}
          >
            <UserRound size={18} />
            <span>My Profile</span>
          </button>
        </nav>

        <div className="profile-sidebar-bottom">
          <div className="profile-sidebar-user">
            <div className="profile-avatar-small">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              ) : initials || "S"}
            </div>

            <div className="profile-sidebar-user-text">
              <strong>{displayName}</strong>
              <span>Member account</span>
            </div>
          </div>

          <button
            className="profile-side-link logout-link"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="profile-dashboard-main">
        <div
          className="profile-dashboard-topbar"
          style={isBrowsePage ? { display: "none" } : activeTab === "dashboard" && !children ? { justifyContent: "flex-end", marginBottom: "12px", paddingBottom: "0", minHeight: "auto" } : undefined}
        >
          <div>

            {!isBrowsePage && (activeTab !== "dashboard" || children) && <h1>
              {pageTitle ||
                (activeTab === "profile"
                  ? "My Profile"
                  : activeTab === "donated"
                  ? "My Donations"
                  : activeTab === "claimed"
                  ? "My Claims"
                  : "Dashboard")}
            </h1>}

            {!isBrowsePage && (activeTab !== "dashboard" || children) && (
              <p className="profile-dashboard-subtitle">
                Manage your donations and conversations in one place.
              </p>
            )}
          </div>

          <div className="social-topbar-actions">
            <button
              className={`social-topbar-icon ${
                openPanel === "chats" ? "selected" : ""
              }`}
              title="Messages"
              aria-label="Open messages"
              onClick={() =>
                setOpenPanel(openPanel === "chats" ? null : "chats")
              }
            >
              <MessageCircle size={21} />
              {pendingChatInvitations.length > 0 && (
                <span className="social-icon-count">
                  {pendingChatInvitations.length}
                </span>
              )}
            </button>

            <button
              className={`social-topbar-icon ${
                openPanel === "notifications" ? "selected" : ""
              }`}
              title="Notifications"
              aria-label="Open notifications"
              onClick={() => setOpenPanel(openPanel === "notifications" ? null : "notifications")}
            >
              <Bell size={21} />

              {incomingRequests.filter((claim) => claim.status === "pending").length > 0 && (
                <span className="social-icon-count">
                  {incomingRequests.filter((claim) => claim.status === "pending").length}
                </span>
              )}
            </button>

            <button
              className="profile-refresh-button"
              onClick={loadDashboard}
              title="Refresh dashboard"
            >
              <RefreshCw size={16} />
            </button>

            {openPanel === "notifications" && createPortal((
              <div
                className="sn-messages-overlay"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) setOpenPanel(null);
                }}
              >
                <div
                  className="social-popover sn-messages-dialog sn-notifications-dialog"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Notifications"
                >
                  <div className="social-popover-header">
                    <div>
                      <h3>Notifications</h3>
                      <p>Your latest updates and requests</p>
                    </div>
                    <button
                      type="button"
                      className="social-popover-close"
                      onClick={() => setOpenPanel(null)}
                      aria-label="Close notifications"
                    >
                      ×
                    </button>
                  </div>
                  <div className="sn-notifications-scroll">
                    <Notifications embedded />
                  </div>
                </div>
              </div>
            ), document.body)}

            {openPanel === "chats" && createPortal((
              <div className="sn-messages-overlay" onMouseDown={(event) => {
                if (event.target === event.currentTarget) setOpenPanel(null);
              }}>
                <div className="social-popover sn-messages-dialog" role="dialog" aria-modal="true" aria-label="Messages">
                <div className="social-popover-header">
                  <div>
                    <h3>Messages</h3>
                    <p>{visibleChats.length} conversations · All history</p>
                  </div>

                  <button
                    className="social-popover-close"
                    onClick={() => setOpenPanel(null)}
                    aria-label="Close messages"
                  >
                    ×
                  </button>
                </div>

                <div style={{ padding: "10px 16px" }}>
                  <input
                    aria-label="Search conversations"
                    placeholder="Search chats, donations, status..."
                    value={chatSearch}
                    onChange={(event) => setChatSearch(event.target.value)}
                    style={{ width: "100%", padding: "11px 12px", border: "1px solid #dce7dd", borderRadius: 10, font: "inherit", fontSize: 13 }}
                  />
                </div>
                <div className="social-popover-list sn-messages-list">
                  {filteredChats.length === 0 ? (
                    <div className="social-panel-empty">
                      <MessageSquare size={30} />
                      <strong>{chatSearch ? "No matching conversations" : "No conversations yet"}</strong>
                      <span>Your chats will appear here.</span>
                    </div>
                  ) : filteredChats.map((chat) => (
                    <div key={chat.id} style={{ position: "relative" }}>
                      <button
                        type="button"
                        className={`social-chat-item ${chat.status !== "active" ? "inactive" : ""}`}
                        onClick={() => { if (chat.status === "active") openChat(chat); }}
                        disabled={chat.status !== "active"}
                        style={{ width: "100%", paddingRight: 55, cursor: chat.status === "active" ? "pointer" : "default", opacity: 1 }}
                      >
                        <span className="social-chat-avatar">
                          {(getChatTitle(chat).charAt(0) || "M").toUpperCase()}
                        </span>
                        <span className="social-chat-details">
                          <strong>{getChatTitle(chat)}</strong>
                          <span>{getChatDonationName(chat)}</span>
                          <small>{chat.status === "active" ? "Open conversation" : `Chat ${chat.status}`}</small>
                        </span>
                        <span className="social-chat-status">
                          {chat.status === "active" ? <MessageCircle size={17} /> : <Clock size={17} />}
                        </span>
                      </button>
                      {chat.status === "pending" && chat.donor_id === currentUser?.id && (
                        <div className="sn-chat-invite-actions">
                          <button type="button" className="sn-chat-invite-accept"
                            disabled={Boolean(respondingChatId)}
                            onClick={() => respondToChatInvitation(chat, true)}>
                            <CheckCircle2 size={15} /> {respondingChatId === chat.id ? "Processing..." : "Accept invitation"}
                          </button>
                          <button type="button" className="sn-chat-invite-reject"
                            disabled={Boolean(respondingChatId)}
                            onClick={() => respondToChatInvitation(chat, false)}>
                            <X size={15} /> Reject
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        title="Remove from my history"
                        aria-label="Remove conversation from my history"
                        disabled={removingChatId === chat.id}
                        onClick={() => removeChatFromMyHistory(chat)}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "1px solid #f0dfdc", borderRadius: 8, background: "#fff", color: "#b45048", padding: 7, cursor: "pointer" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                </div>
              </div>
            ), document.body)}
          </div>
        </div>

        {notice && (
          <div
            className={`profile-dashboard-notice ${
              notice.type === "error" ? "error" : "success"
            }`}
            role="alert"
          >
            {notice.message}
          </div>
        )}

        {children ? (
          <section className="profile-activity-section dashboard-routed-content">
            {children}
          </section>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <section className="sn-overview">
                <style>{`
                  @keyframes snOverviewAppear {
                    from {
                      opacity: 0;
                      transform: translateY(10px);
                    }

                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }

                  .sn-overview {
                    display: grid;
                    gap: 22px;
                    padding: clamp(20px, 3vw, 34px);
                    border: 1px solid #dfe9e1;
                    border-radius: 22px;
                    background: #ffffff;
                    box-shadow: 0 10px 34px rgba(34, 74, 43, 0.045);
                    animation: snOverviewAppear 0.4s ease both;
                  }

                  .sn-overview-heading {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 18px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #edf1ed;
                  }

                  .sn-overview-heading-title {
                    display: flex;
                    align-items: center;
                    gap: 13px;
                  }

                  .sn-overview-heading-icon {
                    display: grid;
                    place-items: center;
                    flex-shrink: 0;
                    width: 44px;
                    height: 44px;
                    border-radius: 13px;
                    background: #eaf5ec;
                    color: #3b7850;
                  }

                  .sn-overview-heading h2 {
                    margin: 0 0 7px;
                    font-size: clamp(21px, 2.4vw, 26px);
                    letter-spacing: -0.8px;
                    color: #263e2d;
                  }

                  .sn-overview-heading p {
                    margin: 0;
                    color: #738477;
                    font-size: 13px;
                  }

                  .sn-overview-mark {
                    display: grid;
                    place-items: center;
                    width: 50px;
                    height: 50px;
                    border-radius: 15px;
                    background: #eaf5ec;
                    color: #447a51;
                  }

                  .sn-overview-metrics {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 15px;
                  }

                  .sn-overview-metric {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 12px;
                    min-width: 0;
                    padding: 19px;
                    border: 1px solid #e8eee9;
                    border-radius: 14px;
                    background: #ffffff;
                    text-align: left;
                    cursor: pointer;
                    transition: border-color 0.2s ease, transform 0.2s ease;
                  }

                  .sn-overview-metric:hover {
                    border-color: #a9cbb0;
                    transform: translateY(-3px);
                  }

                  .sn-overview-metric strong {
                    display: block;
                    margin: 9px 0 6px;
                    font-size: 29px;
                    line-height: 1;
                    color: #25432f;
                  }

                  .sn-overview-metric small {
                    color: #758678;
                    font-size: 12px;
                  }

                  .sn-overview-icon {
                    display: grid;
                    place-items: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    background: #eaf4eb;
                    color: #417b50;
                  }

                  .sn-overview-icon.violet {
                    background: #f0edfa;
                    color: #7866a5;
                  }

                  .sn-overview-icon.gold {
                    background: #fff3e4;
                    color: #a67a3d;
                  }

                  .sn-overview-bottom {
                    display: grid;
                    grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
                    gap: 17px;
                  }

                  .sn-overview-panel {
                    min-width: 0;
                    padding: 21px;
                    border: 1px solid #e8eee9;
                    border-radius: 14px;
                    background: #ffffff;
                  }

                  .sn-overview-panel h3 {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    margin: 0 0 20px;
                    font-size: 16px;
                    color: #294532;
                  }

                  .sn-overview-activity {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                  }

                  .sn-overview-activity-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    padding: 0 0 14px;
                    border-bottom: 1px solid #edf1ed;
                    color: #657768;
                    font-size: 13px;
                  }

                  .sn-overview-activity-row:last-child {
                    padding-bottom: 0;
                    border-bottom: 0;
                  }

                  .sn-overview-activity-row span {
                    display: inline-flex;
                    align-items: center;
                    gap: 9px;
                  }

                  .sn-overview-activity-row strong {
                    color: #2d5439;
                    font-size: 13px;
                  }

                  .sn-overview-profile {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    margin-bottom: 17px;
                  }

                  .sn-overview-avatar {
                    display: grid;
                    place-items: center;
                    flex-shrink: 0;
                    width: 54px;
                    height: 54px;
                    overflow: hidden;
                    border-radius: 50%;
                    background: #e8f3e9;
                    color: #3b6d48;
                    font-weight: 750;
                  }

                  .sn-overview-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                  }

                  .sn-overview-profile strong {
                    display: block;
                    margin-bottom: 4px;
                    color: #294532;
                    font-size: 14px;
                  }

                  .sn-overview-profile small {
                    color: #7b8a7d;
                    font-size: 12px;
                  }

                  .sn-overview-profile-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    padding: 0;
                    border: 0;
                    background: transparent;
                    color: #376c44;
                    font: inherit;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                  }

                  @media (max-width: 900px) {
                    .sn-overview-bottom {
                      grid-template-columns: 1fr;
                    }
                  }

                  @media (max-width: 650px) {
                    .sn-overview {
                      padding: 16px;
                      border-radius: 16px;
                    }

                    .sn-overview-metrics {
                      grid-template-columns: 1fr;
                    }

                    .sn-overview-metric {
                      padding: 17px;
                    }

                    .sn-overview-panel {
                      padding: 19px;
                    }
                  }

                  @media (prefers-reduced-motion: reduce) {
                    .sn-overview {
                      animation: none;
                    }

                    .sn-overview-metric {
                      transition: none;
                    }
                  }
                `}</style>

                <header className="sn-overview-heading">
                  <div className="sn-overview-heading-title">
                    <span className="sn-overview-heading-icon" aria-hidden="true">
                      <LayoutDashboard size={22} strokeWidth={1.9} />
                    </span>
                    <div>
                      <h2>Dashboard Overview</h2>
                      <p>Your activity at a glance</p>
                    </div>
                  </div>
                </header>

                <div className="sn-overview-metrics">
                  <button
                    type="button"
                    className="sn-overview-metric"
                    onClick={() => setActiveTab("donated")}
                  >
                    <div>
                      <small>My Donations</small>
                      <strong>{donations.length}</strong>
                      <small>Items shared</small>
                    </div>
                    <span className="sn-overview-icon">
                      <Package size={20} />
                    </span>
                  </button>

                  <button
                    type="button"
                    className="sn-overview-metric"
                    onClick={() => setActiveTab("claimed")}
                  >
                    <div>
                      <small>My Claims</small>
                      <strong>{myClaims.length}</strong>
                      <small>Items requested</small>
                    </div>
                    <span className="sn-overview-icon violet">
                      <Heart size={20} />
                    </span>
                  </button>

                  <button
                    type="button"
                    className="sn-overview-metric"
                    onClick={() => navigate("/notifications")}
                  >
                    <div>
                      <small>Notifications</small>
                      <strong>{pendingNotificationCount}</strong>
                      <small>Pending actions</small>
                    </div>
                    <span className="sn-overview-icon gold">
                      <Bell size={20} />
                    </span>
                  </button>
                </div>

                <div className="sn-overview-bottom">
                  <section className="sn-overview-panel">
                    <h3>
                      <Activity size={19} color="#568262" />
                      Activity Summary
                    </h3>

                    <div className="sn-overview-activity">
                      <div className="sn-overview-activity-row">
                        <span>
                          <PackageCheck size={17} />
                          Available donations
                        </span>
                        <strong>
                          {donations.filter((item) => item.status === "available").length}
                        </strong>
                      </div>

                      <div className="sn-overview-activity-row">
                        <span>
                          <Clock size={17} />
                          Pending claims
                        </span>
                        <strong>
                          {myClaims.filter((item) => item.status === "pending").length}
                        </strong>
                      </div>

                      <div className="sn-overview-activity-row">
                        <span>
                          <CheckCircle2 size={17} />
                          Approved claims
                        </span>
                        <strong>
                          {myClaims.filter((item) => item.status === "approved").length}
                        </strong>
                      </div>
                    </div>
                  </section>

                  <section className="sn-overview-panel">
                    <h3>
                      <UserRound size={19} color="#568262" />
                      Your Profile
                    </h3>

                    <div className="sn-overview-profile">
                      <div className="sn-overview-avatar">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" />
                        ) : (
                          initials || "S"
                        )}
                      </div>

                      <div>
                        <strong>{displayName}</strong>
                        <small>ShareNest member</small>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="sn-overview-profile-link"
                      onClick={() => setActiveTab("profile")}
                    >
                      View profile
                      <ArrowUpRight size={16} />
                    </button>
                  </section>
                </div>
              </section>
            )}

            {activeTab === "donated" && (
              <section className="profile-activity-section sn-activity-section">
                {renderActivityToolbar("donated")}
                {donations.length === 0 ? (
                  <EmptyState text="You haven't published any donations yet." />
                ) : filteredDonations.length === 0 ? (
                  <EmptyState text="No donations match your search or status filter." />
                ) : (
                  <>
                    <p className="sn-activity-count"><CheckCircle2 size={15} /> Showing {filteredDonations.length} of {donations.length} donations</p>
                    <div style={styles.grid}>{filteredDonations.map(renderDonationCard)}</div>
                  </>
                )}
              </section>
            )}

            {activeTab === "claimed" && (
              <section className="profile-activity-section sn-activity-section">
                {renderActivityToolbar("claimed")}
                {myClaims.length === 0 ? (
                  <EmptyState text="You haven't requested any donation items yet." />
                ) : filteredClaims.length === 0 ? (
                  <EmptyState text="No claims match your search or status filter." />
                ) : (
                  <>
                    <p className="sn-activity-count"><CheckCircle2 size={15} /> Showing {filteredClaims.length} of {myClaims.length} claims</p>
                    <div style={styles.grid}>{filteredClaims.map(renderMyClaimCard)}</div>
                  </>
                )}
              </section>
            )}

            {activeTab === "profile" && (
              <section className="sn-profile-page">
                <style>{`
                  .sn-profile-page {
                    max-width: 1000px;
                    margin: 0 auto;
                    color: #263c2d;
                  }

                  .sn-profile-panel {
                    overflow: hidden;
                    background: #ffffff;
                    border: 1px solid #e1eae2;
                    border-radius: 24px;
                    box-shadow: 0 12px 40px rgba(31, 65, 41, 0.06);
                  }

                  .sn-profile-banner {
                    height: 115px;
                    background: linear-gradient(120deg, #e3f0e4, #f7faf5 65%, #edf4e8);
                  }

                  .sn-profile-content {
                    padding: 0 clamp(20px, 4vw, 40px) 32px;
                  }

                  .sn-profile-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    gap: 18px;
                    margin-top: -53px;
                    margin-bottom: 28px;
                  }

                  .sn-profile-person {
                    display: flex;
                    align-items: flex-end;
                    gap: 20px;
                    flex-wrap: wrap;
                  }

                  .sn-avatar-wrap {
                    position: relative;
                    flex-shrink: 0;
                  }

                  .sn-avatar-view {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 110px;
                    height: 110px;
                    overflow: hidden;
                    border: 5px solid white;
                    border-radius: 50%;
                    background: #dfeee2;
                    color: #315f40;
                    font-size: 36px;
                    font-weight: 700;
                    box-shadow: 0 4px 18px rgba(30, 60, 35, 0.12);
                    cursor: pointer;
                  }

                  .sn-avatar-view img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                  }

                  .sn-avatar-camera {
                    position: absolute;
                    right: 1px;
                    bottom: 2px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 35px;
                    height: 35px;
                    border: 3px solid white;
                    border-radius: 50%;
                    background: #315f40;
                    color: #fff;
                    cursor: pointer;
                  }

                  .sn-avatar-camera input {
                    display: none;
                  }

                  .sn-profile-person h2 {
                    margin: 0 0 5px;
                    font-size: clamp(22px, 3vw, 29px);
                  }

                  .sn-profile-person p {
                    margin: 0;
                    color: #728276;
                    font-size: 13px;
                  }

                  .sn-profile-edit {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 11px 17px;
                    border: 1px solid #cddfd0;
                    border-radius: 11px;
                    background: #f4faf4;
                    color: #315f40;
                    font-weight: 700;
                    cursor: pointer;
                  }

                  .sn-profile-heading {
                    margin: 0 0 17px;
                    font-size: 17px;
                    font-weight: 750;
                  }

                  .sn-profile-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 16px;
                  }

                  .sn-profile-detail {
                    display: flex;
                    align-items: flex-start;
                    gap: 13px;
                    padding: 18px;
                    border: 1px solid #e6ece6;
                    border-radius: 15px;
                    background: #fcfdfb;
                    min-width: 0;
                  }

                  .sn-profile-detail-icon {
                    color: #4c7c58;
                    flex-shrink: 0;
                  }

                  .sn-profile-detail label {
                    display: block;
                    margin-bottom: 7px;
                    color: #78867a;
                    font-size: 12px;
                    font-weight: 650;
                  }

                  .sn-profile-detail p {
                    margin: 0;
                    font-size: 14px;
                    overflow-wrap: anywhere;
                    line-height: 1.5;
                  }

                  .sn-profile-bio {
                    grid-column: 1 / -1;
                  }

                  .sn-profile-edit-fields {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 18px;
                  }

                  .sn-profile-field {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    min-width: 0;
                  }

                  .sn-profile-field label {
                    font-size: 13px;
                    font-weight: 700;
                  }

                  .sn-profile-field input,
                  .sn-profile-field textarea {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 12px 14px;
                    border: 1px solid #d8e5db;
                    border-radius: 11px;
                    background: #ffffff;
                    color: #263c2d;
                    font: inherit;
                    outline: none;
                  }

                  .sn-profile-field input:focus,
                  .sn-profile-field textarea:focus {
                    border-color: #78a884;
                    box-shadow: 0 0 0 3px #e9f3ea;
                  }

                  .sn-profile-field textarea {
                    min-height: 112px;
                    resize: vertical;
                  }

                  .sn-profile-field-wide {
                    grid-column: 1 / -1;
                  }

                  .sn-profile-error {
                    color: #b13b36;
                    font-size: 12px;
                  }

                  .sn-profile-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 25px;
                  }

                  .sn-profile-actions button {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 18px;
                    border-radius: 11px;
                    cursor: pointer;
                    font-weight: 700;
                  }

                  .sn-profile-cancel {
                    border: 1px solid #d8e3d9;
                    background: #ffffff;
                    color: #4c6252;
                  }

                  .sn-profile-save {
                    border: 0;
                    background: #315f40;
                    color: #ffffff;
                  }

                  .sn-profile-modal {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 28px;
                    background: rgba(12, 22, 16, 0.86);
                  }

                  .sn-profile-modal img {
                    max-width: min(90vw, 680px);
                    max-height: 80vh;
                    object-fit: contain;
                    border-radius: 12px;
                  }

                  .sn-profile-modal-close {
                    position: absolute;
                    top: 24px;
                    right: 24px;
                    display: flex;
                    padding: 10px;
                    border: 0;
                    border-radius: 50%;
                    background: #ffffff;
                    cursor: pointer;
                  }

                  @media (max-width: 680px) {
                    .sn-profile-grid,
                    .sn-profile-edit-fields {
                      grid-template-columns: 1fr;
                    }

                    .sn-profile-top {
                      align-items: flex-start;
                      flex-direction: column;
                    }

                    .sn-profile-edit {
                      align-self: flex-end;
                    }

                    .sn-profile-bio,
                    .sn-profile-field-wide {
                      grid-column: auto;
                    }
                  }
                `}</style>

                <div className="sn-profile-panel">
                  <div className="sn-profile-banner" />

                  <div className="sn-profile-content">
                    <div className="sn-profile-top">
                      <div className="sn-profile-person">
                        <div className="sn-avatar-wrap">
                          <button
                            type="button"
                            className="sn-avatar-view"
                            title="View profile photo"
                            onClick={() => {
                              if (profile?.avatar_url) {
                                setPhotoPreviewOpen(true);
                              }
                            }}
                          >
                            {profile?.avatar_url ? (
                              <img src={profile.avatar_url} alt="Your profile" />
                            ) : (
                              initials || "S"
                            )}
                          </button>

                          <label className="sn-avatar-camera" title="Change profile photo">
                            <Camera size={17} />
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              disabled={avatarUploading}
                              onChange={uploadProfilePhoto}
                            />
                          </label>
                        </div>

                        <div>
                          <h2>{displayName}</h2>
                          <p>ShareNest Member</p>
                        </div>
                      </div>

                      {!isProfileEditing && (
                        <button
                          type="button"
                          className="sn-profile-edit"
                          onClick={() => {
                            setProfilePhoneError("");
                            setIsProfileEditing(true);
                          }}
                        >
                          <Pencil size={16} />
                          Edit Profile
                        </button>
                      )}
                    </div>

                    {!isProfileEditing ? (
                      <>
                        <h3 className="sn-profile-heading">Personal Information</h3>

                        <div className="sn-profile-grid">
                          <div className="sn-profile-detail">
                            <User className="sn-profile-detail-icon" size={20} />
                            <div>
                              <label>Full Name</label>
                              <p>{displayName}</p>
                            </div>
                          </div>

                          <div className="sn-profile-detail">
                            <Mail className="sn-profile-detail-icon" size={20} />
                            <div>
                              <label>Email Address</label>
                              <p>{currentUser?.email || "Not available"}</p>
                            </div>
                          </div>

                          <div className="sn-profile-detail">
                            <Phone className="sn-profile-detail-icon" size={20} />
                            <div>
                              <label>Mobile Number</label>
                              <p>{profile?.phone || "Not added"}</p>
                            </div>
                          </div>

                          <div className="sn-profile-detail">
                            <Cake className="sn-profile-detail-icon" size={20} />
                            <div>
                              <label>Date of Birth</label>
                              <p>{profile?.date_of_birth || "Not added"}</p>
                            </div>
                          </div>

                          <div className="sn-profile-detail sn-profile-bio">
                            <MapPin className="sn-profile-detail-icon" size={20} />
                            <div>
                              <label>Location</label>
                              <p>{profile?.location || "Not added"}</p>
                            </div>
                          </div>

                          <div className="sn-profile-detail sn-profile-bio">
                            <FileText className="sn-profile-detail-icon" size={20} />
                            <div>
                              <label>About Me</label>
                              <p>{profile?.bio || "Tell others a little about yourself."}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <form onSubmit={saveProfile}>
                        <h3 className="sn-profile-heading">Edit Personal Information</h3>

                        <div className="sn-profile-edit-fields">
                          <div className="sn-profile-field">
                            <label htmlFor="profile-name">Full Name</label>
                            <input
                              id="profile-name"
                              required
                              minLength={2}
                              maxLength={80}
                              value={profileForm.full_name}
                              onChange={(event) => {
                                setProfileForm((previous) => ({
                                  ...previous,
                                  full_name: event.target.value,
                                }));
                              }}
                            />
                          </div>

                          <div className="sn-profile-field">
                            <label htmlFor="profile-phone">Mobile Number</label>
                            <input
                              id="profile-phone"
                              type="tel"
                              inputMode="numeric"
                              maxLength={10}
                              placeholder="Enter mobile number"
                              value={profileForm.phone}
                              onChange={(event) => {
                                const input = event.target.value;

                                if (/[^0-9]/.test(input)) {
                                  setProfilePhoneError("Only numbers are allowed.");
                                  return;
                                }

                                if (input && !/^[6-9]/.test(input)) {
                                  setProfilePhoneError("Indian mobile numbers must start with 6, 7, 8 or 9.");
                                  return;
                                }

                                setProfilePhoneError("");
                                setProfileForm((previous) => ({
                                  ...previous,
                                  phone: input.slice(0, 10),
                                }));
                              }}
                            />
                            {profilePhoneError && (
                              <span className="sn-profile-error">{profilePhoneError}</span>
                            )}
                          </div>

                          <div className="sn-profile-field">
                            <label htmlFor="profile-dob">Date of Birth</label>
                            <input
                              id="profile-dob"
                              type="date"
                              min="1900-01-01"
                              max={new Date().toISOString().slice(0, 10)}
                              value={profileForm.date_of_birth}
                              onChange={(event) => {
                                setProfileForm((previous) => ({
                                  ...previous,
                                  date_of_birth: event.target.value,
                                }));
                              }}
                            />
                          </div>

                          <div className="sn-profile-field">
                            <label htmlFor="profile-location">Location</label>
                            <input
                              id="profile-location"
                              maxLength={180}
                              placeholder="City, State"
                              value={profileForm.location}
                              onChange={(event) => {
                                setProfileForm((previous) => ({
                                  ...previous,
                                  location: event.target.value,
                                }));
                              }}
                            />
                          </div>

                          <div className="sn-profile-field sn-profile-field-wide">
                            <label htmlFor="profile-email">Email Address</label>
                            <input
                              id="profile-email"
                              value={currentUser?.email || ""}
                              disabled
                            />
                          </div>

                          <div className="sn-profile-field sn-profile-field-wide">
                            <label htmlFor="profile-bio">About Me</label>
                            <textarea
                              id="profile-bio"
                              maxLength={300}
                              placeholder="Write a little about yourself..."
                              value={profileForm.bio}
                              onChange={(event) => {
                                setProfileForm((previous) => ({
                                  ...previous,
                                  bio: event.target.value,
                                }));
                              }}
                            />
                            <span style={{ textAlign: "right", color: "#7b897d", fontSize: 12 }}>
                              {profileForm.bio.length}/300 characters
                            </span>
                          </div>
                        </div>

                        <div className="sn-profile-actions">
                          <button
                            type="button"
                            className="sn-profile-cancel"
                            onClick={() => {
                              setProfileForm({
                                full_name: profile?.full_name || "",
                                phone: profile?.phone || "",
                                bio: profile?.bio || "",
                                date_of_birth: profile?.date_of_birth || "",
                                location: profile?.location || "",
                              });
                              setProfilePhoneError("");
                              setIsProfileEditing(false);
                            }}
                          >
                            <X size={16} />
                            Cancel
                          </button>

                          <button
                            type="submit"
                            className="sn-profile-save"
                            disabled={profileSaving}
                          >
                            <Save size={16} />
                            {profileSaving ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {photoPreviewOpen && profile?.avatar_url && (
                  <div
                    className="sn-profile-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Profile photo preview"
                    onClick={() => setPhotoPreviewOpen(false)}
                  >
                    <button
                      type="button"
                      className="sn-profile-modal-close"
                      aria-label="Close photo preview"
                      onClick={() => setPhotoPreviewOpen(false)}
                    >
                      <X size={22} />
                    </button>
                    <img
                      src={profile.avatar_url}
                      alt="Full-size profile"
                      onClick={(event) => event.stopPropagation()}
                    />
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

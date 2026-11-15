
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { useNavigate } from "react-router-dom";

import {
  Search,
  MapPin,
  Package,
  Gift,
  LocateFixed,
  X,
  RefreshCw,
  Heart,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import { getSupabaseErrorMessage, supabase } from "../supabaseClient";
import "../App.css";



// =====================================
// HELPER FUNCTIONS
// =====================================

function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const earthRadius = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const a = Math.min(1, Math.max(0, haversine));

  return earthRadius * 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );
}

function getDonationImages(item) {
  const value = item?.image_urls;

  if (Array.isArray(value)) {
    return value.filter(
      (url) => typeof url === "string" && url.trim()
    );
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (url) => typeof url === "string" && url.trim()
        );
      }

      if (typeof parsed === "string" && parsed.trim()) {
        return [parsed.trim()];
      }
    } catch {
      return [value.trim()];
    }

    return [];
  }

  return [];
}

function formatDistance(distance) {
  if (!Number.isFinite(distance)) return "";

  if (distance < 1) {
    return `${Math.round(distance * 1000)} metres away`;
  }

  return `${distance.toFixed(1)} km away`;
}

function getFriendlyClaimError(message = "") {
  const msg = message.toLowerCase();

  if (
    msg.includes("row-level security") ||
    msg.includes("permission denied")
  ) {
    return "Your request couldn't be submitted because access was denied. Please try again later.";
  }

  if (
    msg.includes("duplicate") ||
    msg.includes("unique constraint")
  ) {
    return "You've already requested this item. Please check your dashboard for updates.";
  }

  if (msg.includes("network") || msg.includes("fetch")) {
    return "Connection problem. Please check your internet and try again.";
  }

  return getSupabaseErrorMessage(
    { message },
    "We couldn't send your request right now. Please try again in a moment."
  );
}

// =====================================
// DONATIONS PAGE
// =====================================

function Donations() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  const [donations, setDonations] = useState([]);
  const [preview, setPreview] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [radius, setRadius] = useState("all");
  const [pinFilter, setPinFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const [userLocation, setUserLocation] = useState(null);

  const [locationLoading, setLocationLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [claimingId, setClaimingId] = useState(null);

  const [claimFeedback, setClaimFeedback] = useState({});
  const [imageIndexes, setImageIndexes] = useState({});
  const [brokenImages, setBrokenImages] = useState({});

  const [fetchError, setFetchError] = useState("");
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    if (!preview) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setPreview(null);
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        setPreview((current) => {
          if (!current) return null;
          const length = getDonationImages(current.item).length;
          if (!length) return current;
          const step = event.key === "ArrowRight" ? 1 : -1;
          return { ...current, index: (current.index + step + length) % length };
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [preview]);

  // Press / to focus the donation search, Escape to clear it.
  useEffect(() => {
    const handleSearchShortcut = (event) => {
      const tag = event.target?.tagName;
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(tag) || event.target?.isContentEditable;
      if (event.key === "/" && !isTyping && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === "Escape" && document.activeElement === searchInputRef.current) {
        setSearch("");
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  // =====================================
  // LOAD DONATIONS
  // =====================================

  const loadDonations = useCallback(async () => {
    setLoading(true);
    setFetchError("");

    try {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDonations(data || []);
      setImageIndexes({});
      setBrokenImages({});
    } catch (err) {
      console.error("Donation loading error:", err);

      setFetchError(
        getSupabaseErrorMessage(
          err,
          "We couldn't load donations. Please check your connection and try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  // =====================================
  // LOCATION
  // =====================================

  const findNearbyDonations = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Your browser does not support location services."
      );
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });

        setSortBy("nearest");
        setRadius("all");
        setLocationLoading(false);
      },
      (error) => {
        console.error("Location error:", error);

        setLocationLoading(false);

        if (error.code === 1) {
          setLocationError(
            "Location permission was denied. Please allow location access in your browser settings."
          );
        } else if (error.code === 3) {
          setLocationError(
            "Location request timed out. Please try again."
          );
        } else {
          setLocationError(
            "We couldn't find your location. Please try again."
          );
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  // =====================================
  // CLAIM REQUEST
  // =====================================

  const showClaimFeedback = (donationId, type, message) => {
    setClaimFeedback((previous) => ({
      ...previous,
      [donationId]: { type, message }
    }));
  };


const handleClaim = async (item) => {
  if (claimingId !== null) return;

  if (claimFeedback[item.id]?.type === "success") return;

  setClaimingId(item.id);

  setClaimFeedback((previous) => ({
    ...previous,
    [item.id]: null
  }));

  try {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) throw userError;

    if (!user) {
      navigate("/login", {
        state: {
          message: "Please log in to request a donation."
        }
      });
      return;
    }

    if (String(item.donor_id) === String(user.id)) {
      showClaimFeedback(
        item.id,
        "error",
        "You cannot request your own donation."
      );
      return;
    }

    const { data, error } = await supabase.rpc(
      "request_donation",
      {
        p_donation_id: item.id
      }
    );

    if (error) throw error;

    if (!data?.success) {
      throw new Error("Unable to submit your donation request.");
    }

    showClaimFeedback(
      item.id,
      "success",
      data.reused
        ? "Your request has been submitted again successfully! You can track it in My Dashboard."
        : "Your request has been sent successfully! You can track its status in My Dashboard."
    );

  } catch (err) {
    console.error("Claim request error:", err);

    showClaimFeedback(
      item.id,
      "error",
      getFriendlyClaimError(err.message)
    );

  } finally {
    setClaimingId(null);
  }
};


  // =====================================
  // IMAGE GALLERY
  // =====================================

  const changeImage = (donationId, totalImages, direction) => {
    if (totalImages <= 1) return;

    setImageIndexes((previous) => {
      const currentIndex = previous[donationId] || 0;

      return {
        ...previous,
        [donationId]:
          (currentIndex + direction + totalImages) % totalImages
      };
    });
  };

  // =====================================
  // DISTANCE CALCULATION
  // =====================================

  const donationsWithDistance = useMemo(() => {
    return donations.map((item) => {
      let distance = null;

      const latitude = Number(item.latitude);
      const longitude = Number(item.longitude);

      const hasCoordinates =
        item.latitude !== null &&
        item.latitude !== undefined &&
        item.latitude !== "" &&
        item.longitude !== null &&
        item.longitude !== undefined &&
        item.longitude !== "" &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude);

      if (userLocation && hasCoordinates) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          latitude,
          longitude
        );
      }

      return {
        ...item,
        distance
      };
    });
  }, [donations, userLocation]);

  // =====================================
  // SEARCH, FILTER AND SORT
  // =====================================

  const filteredDonations = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    const filtered = donationsWithDistance.filter((item) => {
      const searchableValues = [
        item.name,
        item.category,
        item.location,
        item.description,
        item.pincode,
        item.donor_name
      ];

      const matchesSearch =
        !searchText ||
        searchableValues.some(
          (value) =>
            value &&
            String(value).toLowerCase().includes(searchText)
        );

      const matchesCategory =
        category === "All" || item.category === category;

      const matchesRadius =
        radius === "all" ||
        (
          item.distance !== null &&
          item.distance <= Number(radius)
        );

      const matchesPin = !pinFilter || String(item.pincode || "").startsWith(pinFilter);
      const matchesCondition = conditionFilter === "All" ||
        String(item.item_condition || "").toLowerCase() === conditionFilter.toLowerCase();
      return matchesSearch && matchesCategory && matchesRadius && matchesPin && matchesCondition;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "nearest" && userLocation) {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;

        return a.distance - b.distance;
      }

      const dateDifference = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sortBy === "oldest" ? -dateDifference : dateDifference;
    });
  }, [
    donationsWithDistance,
    search,
    category,
    radius,
    pinFilter,
    conditionFilter,
    sortBy,
    userLocation
  ]);

  // =====================================
  // CLEAR FILTERS
  // =====================================

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setRadius("all");
    setPinFilter("");
    setConditionFilter("All");
    setSortBy("newest");
  };

  const hasActiveFilters =
    search !== "" ||
    category !== "All" ||
    radius !== "all" ||
    pinFilter !== "" ||
    conditionFilter !== "All" ||
    sortBy !== "newest";

  // =====================================
  // UI
  // =====================================

  return (
    <section className="donations-section">
      <div className="donations-container">
      <style>{`
        .donations-section {
          width: 100%;
          min-width: 0;
          color: #233b2b;
          font-family: inherit;
        }

        .donations-section *,
        .donations-section *::before,
        .donations-section *::after {
          box-sizing: border-box;
        }

        .donations-section .donations-container {
          width: 100%;
          max-width: 1380px;
          padding: 0 4px 36px;
          margin: 0 auto;
        }

        .donations-section .sn-browse-heading-box {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 8px;
          padding: 14px 4px 18px;
          border: 0;
          border-bottom: 1px solid #e2eae2;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }

        .donations-section .sn-browse-heading-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 49px;
          width: 49px;
          height: 49px;
          border-radius: 14px;
          background: #e9f4eb;
          color: #315f40;
        }

        .donations-section .sn-browse-heading-box h1 {
          margin: 0 0 7px;
          color: #213c2b;
          font-size: clamp(25px, 3vw, 32px);
          font-weight: 750;
          letter-spacing: -0.8px;
        }

        .donations-section .sn-browse-heading-box p {
          margin: 0;
          color: #758579;
          font-size: 13px;
        }

        .donations-section .sn-market-toolbar {
          padding: 16px 4px 12px;
          margin-bottom: 20px;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }

        .donations-section .sn-market-intro {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 19px;
        }

        .donations-section .sn-market-intro p {
          margin: 0;
          font-size: 15px;
          color: #526b58;
          line-height: 1.6;
        }

        .donations-section .sn-market-intro-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 13px;
          border: 1px solid #d6e8d8;
          border-radius: 999px;
          background: #eaf5eb;
          color: #356846;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .donations-section .sn-market-search-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: stretch;
          gap: 10px;
          width: 100%;
        }

        .donations-section .donation-search {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          min-width: 0;
          height: 52px;
          padding: 0 16px;
          border: 1px solid #d9e6dc;
          border-radius: 12px;
          background: #ffffff;
          color: #4d7658;
          box-shadow: 0 2px 7px rgba(36, 75, 46, 0.025);
        }

        .donations-section .donation-search:focus-within {
          border-color: #80aa89;
          box-shadow: 0 0 0 3px rgba(84, 143, 97, 0.12);
        }

        .donations-section .donation-search input {
          flex: 1;
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          font: inherit;
          font-size: 14px;
          color: #233b2b;
        }

        .donations-section .clear-search-btn {
          display: grid;
          place-items: center;
          width: 26px;
          height: 26px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: #edf3ee;
          color: #4b6953;
          cursor: pointer;
        }

        .donations-section .location-search-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 52px;
          min-width: 120px;
          padding: 0 18px;
          border: 1px solid #315f40;
          border-radius: 13px;
          background: #315f40;
          color: #ffffff;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
        }

        .donations-section .location-search-btn:hover {
          background: #244e33;
        }

        .donations-section .location-search-btn:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .donations-section .sn-market-filter-row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 12px;
        }

        .donations-section .sn-market-pin {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
          height: 44px;
          padding: 0 13px;
          border: 1px solid #e5ebe5;
          border-radius: 10px;
          background: #f7faf7;
          color: #52745a;
        }

        .donations-section .sn-market-pin input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          font: inherit;
          font-size: 13px;
          color: #233b2b;
        }

        .donations-section .sn-market-filter-row select {
          width: 100%;
          min-width: 0;
          height: 44px;
          padding: 0 13px;
          border: 1px solid #e5ebe5;
          border-radius: 10px;
          background: #f7faf7;
          color: #3b5842;
          font: inherit;
          font-size: 13px;
          cursor: pointer;
        }

        .donations-section .sn-market-filter-row select:disabled {
          background: #f5f7f5;
          color: #9aa69d;
          cursor: not-allowed;
        }

        .donations-section .donation-results-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .donations-section .donation-results-heading h2 {
          margin: 0;
          font-size: 23px;
          font-weight: 750;
          letter-spacing: -0.6px;
          color: #233d2b;
        }

        .donations-section .donation-results-actions {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .donations-section .donation-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 38px;
          padding: 8px 13px;
          border: 1px solid #dce7de;
          border-radius: 10px;
          background: #ffffff;
          color: #365f40;
          font: inherit;
          font-size: 12px;
          font-weight: 650;
          white-space: nowrap;
          cursor: pointer;
        }

        .donations-section .donation-action-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .donations-section .donation-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: stretch;
          gap: 22px;
        }

        .donations-section .donation-card {
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
          border: 1px solid #e0e9e1;
          border-radius: 20px;
          background: #ffffff;
          box-shadow: 0 8px 24px rgba(33, 69, 43, 0.055);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .donations-section .donation-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 17px 38px rgba(33, 69, 43, 0.12);
        }

        .donations-section .donation-photo {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 205px;
          padding: 0;
          overflow: hidden;
          isolation: isolate;
          background: #edf2ed;
        }

        .donations-section .sn-photo-backdrop {
          position: absolute;
          inset: -20px;
          z-index: 0;
          background-position: center;
          background-size: cover;
          filter: blur(22px);
          opacity: 0.22;
          transform: scale(1.1);
          pointer-events: none;
        }

        .donations-section .donation-photo img.sn-clickable-image {
          position: relative;
          z-index: 1;
          display: block;
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
          max-height: none !important;
          padding: 9px;
          margin: 0;
          border-radius: 0;
          object-fit: contain !important;
          object-position: center !important;
          cursor: zoom-in;
        }

        .donations-section .donation-photo .available-tag {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 4;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 11px;
          border: 1px solid rgba(219, 235, 222, 0.9);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.95);
          color: #2f7143;
          font-size: 11px;
          font-weight: 750;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .donations-section .available-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #52a76a;
        }

        .donations-section .donation-photo .gallery-arrow {
          position: absolute;
          top: 50%;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px !important;
          height: 26px !important;
          min-width: 26px !important;
          min-height: 26px !important;
          padding: 0 !important;
          margin: 0;
          transform: translateY(-50%);
          border: 1px solid rgba(219, 230, 220, 0.95);
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.94);
          color: #355d40;
          box-shadow: 0 2px 7px rgba(0, 0, 0, 0.08);
          cursor: pointer;
          line-height: 1;
        }

        .donations-section .donation-photo .gallery-prev {
          left: 10px;
          right: auto;
        }

        .donations-section .donation-photo .gallery-next {
          right: 10px;
          left: auto;
        }

        .donations-section .donation-photo .gallery-arrow svg {
          display: block;
          width: 14px !important;
          height: 14px !important;
          flex-shrink: 0;
          stroke-width: 2.2;
        }

        .donations-section .donation-photo .gallery-arrow:hover {
          background: #315f40;
          color: #ffffff;
        }

        .donations-section .donation-photo .gallery-counter {
          position: absolute;
          right: 12px;
          bottom: 12px;
          z-index: 4;
          padding: 5px 8px;
          border-radius: 7px;
          background: rgba(24, 39, 28, 0.67);
          color: #ffffff;
          font-size: 11px;
          line-height: 1.1;
        }

        .donations-section .donation-photo-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #78917d;
        }

        .donations-section .donation-info {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 0;
          padding: 13px 16px 15px;
        }

        .donations-section .donation-card-top {
          margin-bottom: 6px;
        }

        .donations-section .category-label {
          display: inline-flex;
          align-items: center;
          padding: 6px 11px;
          border-radius: 999px;
          background: #edf5ec;
          color: #386948;
          font-size: 11px;
          font-weight: 750;
        }

        .donations-section .donation-info h3 {
          margin: 0 0 5px;
          color: #203b29;
          font-size: 18px;
          line-height: 1.3;
          font-weight: 750;
          letter-spacing: -0.4px;
        }

        .donations-section .donation-description {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 0;
          margin: 0 0 9px;
          color: #708073;
          font-size: 13px;
          line-height: 1.65;
        }

        .donations-section .condition-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-top: 1px solid #edf1ed;
          color: #7a8a7e;
          font-size: 12px;
        }

        .donations-section .condition-info strong {
          color: #385d42;
          font-weight: 700;
        }

        .donations-section .donation-meta {
          margin: 0 0 8px;
        }

        .donations-section .donation-meta p {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin: 4px 0;
          color: #667b6b;
          font-size: 12px;
          line-height: 1.5;
        }

        .donations-section .donation-meta svg {
          flex-shrink: 0;
          color: #63876a;
        }

        .donations-section .donation-donor {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 0;
          margin-top: auto;
          border-top: 1px solid #edf1ed;
        }

        .donations-section .donor-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #e5f0e7;
          color: #376a44;
          font-size: 13px;
          font-weight: 750;
        }

        .donations-section .donation-donor small,
        .donations-section .donation-donor strong {
          display: block;
        }

        .donations-section .donation-donor small {
          color: #829084;
          font-size: 11px;
        }

        .donations-section .donation-donor strong {
          color: #34543d;
          font-size: 12px;
        }

        .donations-section .request-item-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          width: 100%;
          min-height: 44px;
          padding: 11px 16px;
          border: 0;
          border-radius: 11px;
          background: #315f40;
          color: #ffffff;
          font: inherit;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
        }

        .donations-section .request-item-btn:hover:not(:disabled) {
          background: #244d32;
        }

        .donations-section .request-item-btn:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .donations-section .donations-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 260px;
          padding: 35px 22px;
          border: 1px dashed #d9e6dc;
          border-radius: 18px;
          background: #f9fbf9;
          text-align: center;
        }

        .donations-section .donations-empty h3 {
          margin: 13px 0 6px;
        }

        .donations-section .donations-empty p {
          color: #758578;
        }

        .donations-section .primary-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 17px;
          border: 0;
          border-radius: 11px;
          background: #315f40;
          color: #ffffff;
          cursor: pointer;
        }

        .donations-section .donation-notice,
        .donations-section .claim-feedback {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 11px 13px;
          border-radius: 10px;
          font-size: 12px;
          line-height: 1.5;
        }

        .donations-section .donation-notice-error,
        .donations-section .claim-feedback-error {
          background: #fff2ef;
          color: #a44136;
        }

        .donations-section .claim-feedback-success {
          background: #eaf6ec;
          color: #356d44;
        }

        .donations-section .donation-notice button {
          margin-left: auto;
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .donations-section .sn-lightbox {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 22px;
          background: rgba(13, 25, 17, 0.88);
        }

        .donations-section .sn-lightbox-content {
          width: min(100%, 950px);
          max-height: 94vh;
        }

        .donations-section .sn-lightbox-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 14px;
          color: #ffffff;
          font-weight: 700;
        }

        .donations-section .sn-lightbox-top button {
          display: grid;
          place-items: center;
          width: 36px;
          height: 36px;
          border: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.16);
          color: #ffffff;
          cursor: pointer;
        }

        .donations-section .sn-lightbox-stage {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          min-height: 180px;
        }

        .donations-section .sn-lightbox-stage img {
          display: block;
          width: min(100%, 760px);
          max-height: 75vh;
          object-fit: contain;
          border-radius: 12px;
        }

        .donations-section .sn-lightbox-stage button {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 35px;
          height: 35px;
          border: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.16);
          color: #ffffff;
          cursor: pointer;
        }

        .donations-section .sn-lightbox-count {
          margin: 12px 0 0;
          color: #e5eee6;
          text-align: center;
          font-size: 12px;
        }

        .donations-section .spin-icon {
          animation: snBrowseSpin 1s linear infinite;
        }

        @keyframes snBrowseSpin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1100px) {
          .donations-section .donation-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .donations-section .sn-market-toolbar {
            padding: 17px;
          }

          .donations-section .sn-market-intro-badge {
            display: none;
          }

          .donations-section .sn-market-filter-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .donations-section .donation-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .donations-section .donation-photo {
            height: 185px;
          }

          .donations-section .donation-info {
            padding: 15px;
          }

          .donations-section .donation-info h3 {
            font-size: 17px;
          }
        }

        @media (max-width: 480px) {
          .donations-section .sn-market-search-row {
            grid-template-columns: 1fr;
          }

          .donations-section .sn-market-filter-row,
          .donations-section .donation-grid {
            grid-template-columns: 1fr;
          }

          .donations-section .donation-photo {
            height: 220px;
          }

          .donations-section .donation-results-heading {
            align-items: flex-start;
          }

          .donations-section .donation-results-heading h2 {
            font-size: 20px;
          }

          .donations-section .donation-action-btn {
            padding: 8px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .donations-section .donation-card {
            transition: none;
          }

          .donations-section .donation-card:hover {
            transform: none;
          }
        }
      `}</style>
      <div className="sn-browse-heading-box">
        <div className="sn-browse-heading-icon" aria-hidden="true">
          <Search size={23} />
        </div>
        <div>
          <h1>Browse Donations</h1>
          <p>Explore items shared by people near you.</p>
        </div>
      </div>

      {/* Discovery controls */}
      <div className="sn-market-toolbar">
        <div className="sn-market-search-row">
          <div className="donation-search">
            <Search size={20} />
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search items, city or location..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search donations"
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}
          </div>
          <button
            type="button"
            className="location-search-btn"
            onClick={findNearbyDonations}
            disabled={locationLoading}
          >
            {locationLoading ? <RefreshCw size={17} className="spin-icon" /> : <LocateFixed size={17} />}
            {locationLoading ? "Locating..." : userLocation ? "Update location" : "Near me"}
          </button>
        </div>

        <div className="sn-market-filter-row">
          <label className="sn-market-pin">
            <MapPin size={17} />
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pinFilter}
              onChange={(event) => setPinFilter(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="PIN code"
              aria-label="Filter by PIN code"
            />
          </label>
          <select
            value={conditionFilter}
            onChange={(event) => setConditionFilter(event.target.value)}
            aria-label="Item condition"
          >
            <option value="All">All conditions</option>
            {Array.from(new Set(donations.map((item) => item.item_condition).filter(Boolean)))
              .sort()
              .map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select
            value={radius}
            onChange={(event) => setRadius(event.target.value)}
            disabled={!userLocation}
            aria-label="Distance"
          >
            <option value="all">Any distance</option>
            <option value="5">Within 5 km</option>
            <option value="10">Within 10 km</option>
            <option value="25">Within 25 km</option>
            <option value="50">Within 50 km</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            aria-label="Sort items"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="nearest" disabled={!userLocation}>Nearest first</option>
          </select>
        </div>
        {locationError && (
          <div className="donation-notice donation-notice-error" role="alert">
            <AlertCircle size={17} />
            <span>{locationError}</span>
            <button type="button" onClick={() => setLocationError("")} aria-label="Dismiss location error">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* RESULTS HEADER */}

      <div className="donation-results-heading" aria-live="polite">
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Package size={21} color="#4b8059" />
            Recently Shared
          </h2>


        </div>

        <div className="donation-results-actions">

          <button
            type="button"
            className="donation-action-btn refresh-action"
            onClick={loadDonations}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={loading ? "spin-icon" : ""}
            />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="donation-action-btn clear-action"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          >
            <X size={16} />
            Clear filters
          </button>

        </div>
      </div>

      {/* LOADING */}

      {loading ? (
        <div className="donations-empty">
          <RefreshCw size={32} className="spin-icon" />
          <h3>Loading donations</h3>
          <p>Please wait while we find available items.</p>
        </div>

      ) : fetchError ? (
        <div className="donations-empty">
          <Package size={42} />
          <h3>Unable to load donations</h3>
          <p>{fetchError || "Please check your connection and try again."}</p>

          <button
            type="button"
            className="primary-btn"
            onClick={loadDonations}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>

      ) : filteredDonations.length > 0 ? (

        <div className="donation-grid">

          {filteredDonations.map((item) => {
            const images = getDonationImages(item);

            const currentImageIndex = Math.min(
              imageIndexes[item.id] || 0,
              Math.max(images.length - 1, 0)
            );

            const currentImage = images[currentImageIndex];

            const feedback = claimFeedback[item.id];
            const isClaiming = claimingId === item.id;
            const requestSent = feedback?.type === "success";

            const imageFailed = brokenImages[
              `${item.id}-${currentImageIndex}`
            ];

            return (
              <article className="donation-card" key={item.id}>

                {/* IMAGE */}

                <div className="donation-photo">

                  {currentImage && !imageFailed ? (
                    <>
                    <div
                      className="sn-photo-backdrop"
                      style={{ backgroundImage: `url("${currentImage.replace(/"/g, "%22")}")` }}
                      aria-hidden="true"
                    />
                    <img
                      key={currentImage}
                      className="sn-clickable-image"
                      role="button"
                      tabIndex={0}
                      title="Preview photos"
                      onClick={() => setPreview({ item, index: currentImageIndex })}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setPreview({ item, index: currentImageIndex });
                        }
                      }}
                      src={currentImage}
                      alt={item.name || "Donated item"}
                      loading="lazy"
                      onError={() => {
                        setBrokenImages((previous) => ({
                          ...previous,
                          [`${item.id}-${currentImageIndex}`]: true
                        }));
                      }}
                    />
                    </>
                  ) : (
                    <div className="donation-photo-placeholder">
                      <Gift size={43} />
                      <span>No image available</span>
                    </div>
                  )}

                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="gallery-arrow gallery-prev"
                        onClick={() =>
                          changeImage(item.id, images.length, -1)
                        }
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={22} />
                      </button>

                      <button
                        type="button"
                        className="gallery-arrow gallery-next"
                        onClick={() =>
                          changeImage(item.id, images.length, 1)
                        }
                        aria-label="Next image"
                      >
                        <ChevronRight size={22} />
                      </button>

                      <span className="gallery-counter">
                        {currentImageIndex + 1} / {images.length}
                      </span>
                    </>
                  )}

                  <span className="available-tag">
                    <span className="available-dot"></span>
                    Available
                  </span>
                </div>

                {/* DETAILS */}

                <div className="donation-info">

                  <div className="donation-card-top">
                    <span className="category-label">
                      {item.category || "Other"}
                    </span>
                  </div>

                  <h3>{item.name || "Untitled donation"}</h3>

                  <p className="donation-description">
                    {item.description || "No description provided."}
                  </p>

                  {item.item_condition && (
                    <div className="condition-info">
                      <span>Condition</span>
                      <strong>{item.item_condition}</strong>
                    </div>
                  )}

                  <div className="donation-meta">
                    <p className="location">
                      <MapPin size={16} />
                      <span>
                        {item.location || "Location not provided"}
                      </span>
                    </p>

                    {item.distance !== null && (
                      <p className="distance-label">
                        <LocateFixed size={15} />
                        {formatDistance(item.distance)}
                      </p>
                    )}
                  </div>

                  {/* DONOR */}

                  <div className="donation-donor">
                    <div className="donor-avatar">
                      {(item.donor_name || "C")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <small>Shared by</small>
                      <strong>
                        {item.donor_name || "Community Member"}
                      </strong>
                    </div>
                  </div>

                  {/* FEEDBACK */}

                  {feedback && (
                    <div
                      className={`claim-feedback ${
                        feedback.type === "success"
                          ? "claim-feedback-success"
                          : "claim-feedback-error"
                      }`}
                      role={
                        feedback.type === "error"
                          ? "alert"
                          : "status"
                      }
                    >
                      {feedback.type === "success" ? (
                        <CheckCircle2 size={19} />
                      ) : (
                        <AlertCircle size={19} />
                      )}

                      <span>{feedback.message}</span>
                    </div>
                  )}

                  {/* REQUEST */}

                  <button
                    type="button"
                    className="request-item-btn"
                    disabled={claimingId !== null || requestSent}
                    onClick={() => handleClaim(item)}
                  >
                    {isClaiming ? (
                      <>
                        <RefreshCw size={16} className="spin-icon" />
                        Sending request...
                      </>
                    ) : requestSent ? (
                      <>
                        <CheckCircle2 size={16} />
                        Request Sent
                      </>
                    ) : (
                      <>
                        <Heart size={16} />
                        Request Item
                      </>
                    )}
                  </button>

                </div>
              </article>
            );
          })}

        </div>

      ) : (

        <div className="donations-empty">
          <div className="empty-icon">
            <Package size={42} />
          </div>

          <h3>No Donations Found</h3>

          <p>
            We couldn't find items matching your search. Try changing the filters or searching by city or PIN code.
          </p>

          <button
            type="button"
            className="primary-btn"
            onClick={clearFilters}
          >
            <RefreshCw size={16} />
            Reset Filters
          </button>
        </div>
      )}

      </div>
      {preview && (
        <div
          className="sn-lightbox"
          role="presentation"
          onClick={() => setPreview(null)}
        >
          <div
            className="sn-lightbox-content"
            role="dialog"
            aria-modal="true"
            aria-label="Donation photo preview"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sn-lightbox-top">
              <span>{preview.item.name || "Donation photos"}</span>
              <button type="button" aria-label="Close preview" onClick={() => setPreview(null)}>
                <X size={23} />
              </button>
            </div>
            <div className="sn-lightbox-stage">
              {getDonationImages(preview.item).length > 1 && (
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={() => setPreview((current) => ({
                    ...current,
                    index: (current.index - 1 + getDonationImages(current.item).length) % getDonationImages(current.item).length,
                  }))}
                >
                  <ChevronLeft size={26} />
                </button>
              )}
              <img
                src={getDonationImages(preview.item)[preview.index]}
                alt={`${preview.item.name || "Donation"} photo ${preview.index + 1}`}
              />
              {getDonationImages(preview.item).length > 1 && (
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={() => setPreview((current) => ({
                    ...current,
                    index: (current.index + 1) % getDonationImages(current.item).length,
                  }))}
                >
                  <ChevronRight size={26} />
                </button>
              )}
            </div>
            <p className="sn-lightbox-count">
              {preview.index + 1} / {getDonationImages(preview.item).length}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default Donations;


import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  Heart,
  BookOpen,
  Shirt,
  Armchair,
  Gift,
  HandHeart,
  HeartHandshake,
  ArrowRight,
  ArrowUpRight,
  Leaf,
  Home as HomeIcon,
  ShieldCheck,
  Sparkles,
  Users,
  Recycle,
  CheckCircle2,
  ImagePlus,
  LocateFixed,
  X,
  Menu,
} from "lucide-react";

import { getSupabaseErrorMessage, supabase } from "./supabaseClient";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Donations from "./pages/Donations";
import MyDashboard from "./pages/MyDashboard";
import Chat from "./pages/Chat";
import Notifications from "./pages/Notifications";

import "./App.css";

// =====================================
// NAVBAR
// =====================================

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (mounted) {
        setUser(data.session?.user || null);
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return;
    }

    setUser(null);
    setMenuOpen(false);
    navigate("/");
  };

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [menuOpen]);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar" aria-label="Main navigation">
      <Link to="/" className="logo" onClick={closeMenu}>
        <span className="logo-icon">
          <HandHeart size={25} />
        </span>
        <span>
          Share<span className="logo-nest">Nest</span>
        </span>
      </Link>

      <button
        type="button"
        className="mobile-menu-btn"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={menuOpen}
        aria-controls="sharenest-navigation"
      >
        {menuOpen ? <X size={23} /> : <Menu size={23} />}
      </button>

      <div id="sharenest-navigation" className={`nav-links ${menuOpen ? "nav-links-open" : ""}`}>
        <Link to="/" className={isActive("/") ? "nav-active" : ""} onClick={closeMenu}>
          Home
        </Link>

        {user && (
          <>
            <Link to="/donations" className={isActive("/donations") ? "nav-active" : ""} onClick={closeMenu}>
              Donations
            </Link>
            <Link to="/dashboard" className={isActive("/dashboard") ? "nav-active" : ""} onClick={closeMenu}>
              My Dashboard
            </Link>
            <Link to="/add-donation" className={isActive("/add-donation") ? "nav-active" : ""} onClick={closeMenu}>
              Donate
            </Link>
          </>
        )}

        <a href="/#about" onClick={closeMenu}>
          About
        </a>
        <a href="/#contact" onClick={closeMenu}>
          Contact
        </a>

        <div className="mobile-nav-actions">
          {user ? (
            <button
              type="button"
              className="primary-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="login-btn" onClick={closeMenu}>
                Login
              </Link>
              <Link to="/register" className="primary-btn" onClick={closeMenu}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="nav-actions desktop-nav-actions">
        {user ? (
          <>
            <span className="nav-user">
              <span className="nav-user-dot" aria-hidden="true" />
              Hi, {user.user_metadata?.full_name?.split(" ")[0] || "User"}
            </span>

            <button
              type="button"
              className="primary-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="login-btn">
              Login
            </Link>
            <Link to="/register" className="primary-btn">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

// =====================================
// HOME PAGE
// =====================================

function Home() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSignedIn(Boolean(data.session?.user));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSignedIn(Boolean(session?.user));
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);
  const accessLink = (path) => signedIn ? { pathname: path } : { pathname: "/login" };
  const accessState = (path) => signedIn ? undefined : { from: path };
  const categories = [
    {
      name: "Clothes",
      description: "Give clothes a second life.",
      icon: <Shirt />,
      color: "mint",
    },
    {
      name: "Books",
      description: "Pass knowledge along.",
      icon: <BookOpen />,
      color: "peach",
    },
    {
      name: "Furniture",
      description: "Make room for someone.",
      icon: <Armchair />,
      color: "lavender",
    },
    {
      name: "Household Items",
      description: "Share everyday essentials.",
      icon: <HomeIcon />,
      color: "yellow",
    },
  ];

  const features = [
    {
      icon: <HeartHandshake />,
      title: "Give with purpose",
      description:
        "Share useful items with people who can genuinely benefit from them.",
    },
    {
      icon: <Recycle />,
      title: "Reduce waste",
      description:
        "Keep useful things in circulation instead of throwing them away.",
    },
    {
      icon: <Users />,
      title: "Build community",
      description:
        "Create meaningful connections through simple acts of kindness.",
    },
  ];

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="hero-decoration hero-decoration-one" />
        <div className="hero-decoration hero-decoration-two" />

        <div className="home-container hero-layout">
          <div className="hero-copy">
            <div className="hero-eyebrow">
              <Heart size={14} fill="currentColor" />
              A LITTLE SHARING GOES A LONG WAY
            </div>

            <h1>
              Give things a
              <span className="hero-highlight"> second life.</span>
              <br />
              Give people
              <span className="hero-highlight"> new hope.</span>
            </h1>

            <p className="hero-description">
              Your unused things could mean the world to someone else.
              Share what you no longer need and help create a community
              where everyone has something to give and receive.
            </p>

            <div className="hero-actions">
              <Link to={accessLink("/donations")} state={accessState("/donations")} className="home-btn home-btn-primary">
                {signedIn ? "Explore donations" : "Explore donations"} <ArrowUpRight size={18} />
              </Link>

              <Link to={accessLink("/add-donation")} state={accessState("/add-donation")} className="home-btn home-btn-secondary">
                <HeartHandshake size={18} /> Give an item
              </Link>
            </div>

            {!signedIn && (
              <div className="sn-guest-prompt">
                <ShieldCheck size={18} />
                <span>Free account required to donate, browse items or send requests.</span>
              </div>
            )}
            <div className="hero-trust">
              <div className="trust-avatars">
                <span>😊</span>
                <span>🌿</span>
                <span>💛</span>
                <span>🤝</span>
              </div>

              <div>
                <strong>Small acts. Real impact.</strong>
                <p>A kinder way to share with your community.</p>
              </div>
            </div>
          </div>

          <div className="hero-art">
            <div className="art-glow" />

            <div className="floating-note note-top">
              <span className="note-icon green-note">
                <Leaf size={18} />
              </span>
              <span>
                <strong>Less waste</strong>
                <small>More possibilities</small>
              </span>
            </div>

            <div className="hero-illustration">
              <div className="illustration-circle" />
              <div className="illustration-sun" />

              <div className="gift-box gift-box-back">
                <div className="gift-ribbon" />
              </div>

              <div className="gift-box gift-box-front">
                <div className="gift-ribbon" />
                <div className="gift-bow" />
              </div>

              <div className="illustration-leaf leaf-left">✦</div>
              <div className="illustration-leaf leaf-right">✿</div>
              <div className="illustration-ground" />
            </div>

            <div className="floating-note note-bottom">
              <span className="note-icon peach-note">
                <Heart size={18} fill="currentColor" />
              </span>
              <span>
                <strong>Share kindness</strong>
                <small>One item at a time</small>
              </span>
              <CheckCircle2 size={19} className="note-check" />
            </div>

            <div className="art-sparkle sparkle-one">✦</div>
            <div className="art-sparkle sparkle-two">✧</div>
            <div className="art-sparkle sparkle-three">✦</div>
          </div>
        </div>

        <div className="hero-bottom">
          <span>SHARE</span>
          <span className="hero-bottom-line" />
          <span>CARE</span>
          <span className="hero-bottom-line" />
          <span>REUSE</span>
        </div>
      </section>

      <section className="home-intro">
        <div className="home-container intro-layout">
          <div>
            <span className="section-eyebrow">THE IDEA IS SIMPLE</span>
            <h2>
              Someone's extra
              <span> can be someone else's essential.</span>
            </h2>
          </div>

          <p>
            We believe good things should be shared, not wasted.
            ShareNest makes it easier to pass useful items forward
            and bring people a little closer.
          </p>
        </div>
      </section>

      <section className="home-categories">
        <div className="home-container">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">FIND SOMETHING USEFUL</span>
              <h2>Explore what you can share.</h2>
              <p>
                Every item has the potential to make someone's day better.
              </p>
            </div>

            <Link to={accessLink("/donations")} state={accessState("/donations")} className="text-link">
              View all donations <ArrowRight size={17} />
            </Link>
          </div>

          <div className="home-category-grid">
            {categories.map((category, index) => (
              <Link
                to={accessLink("/donations")} state={accessState("/donations")}
                className={`home-category-card ${category.color}`}
                key={category.name}
                style={{ "--card-index": index }}
              >
                <div className="category-card-top">
                  <div className="home-category-icon">{category.icon}</div>
                  <ArrowUpRight size={20} className="category-arrow" />
                </div>

                <div>
                  <span className="category-count">{signedIn ? "Explore category" : "Sign in to explore"}</span>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-why" id="about">
        <div className="home-container why-layout">
          <div className="why-visual">
            <div className="why-visual-main">
              <div className="why-circle circle-one" />
              <div className="why-circle circle-two" />

              <div className="why-center-icon">
                <HeartHandshake size={65} strokeWidth={1.3} />
              </div>

              <div className="why-floating-card why-card-one">
                <Leaf size={19} /> <span>Reuse more</span>
              </div>

              <div className="why-floating-card why-card-two">
                <Heart size={18} fill="currentColor" />
                <span>Care more</span>
              </div>

              <div className="why-decoration">✦</div>
            </div>
          </div>

          <div className="why-content">
            <span className="section-eyebrow">WHY SHARENEST?</span>

            <h2>
              More than giving.
              <span> It's about belonging.</span>
            </h2>

            <p className="why-description">
              What you don't need anymore might be exactly
              what someone else is looking for.
            </p>

            <div className="feature-list">
              {features.map((feature, index) => (
                <div className="feature-item" key={feature.title}>
                  <div className={`feature-icon feature-${index + 1}`}>
                    {feature.icon}
                  </div>

                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/register" className="home-btn home-btn-primary">
              Become a member <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-how">
        <div className="home-container">
          <div className="section-heading centered-heading">
            <span className="section-eyebrow">THREE SIMPLE STEPS</span>
            <h2>Sharing made simple.</h2>
            <p>
              A few simple steps can turn an unused item into something meaningful.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon">
                <Gift size={28} />
              </div>
              <h3>Find or give</h3>
              <p>
                Browse available donations or list something useful you'd like to share.
              </p>
            </div>

            <div className="step-connector">
              <ArrowRight size={23} />
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon">
                <Users size={28} />
              </div>
              <h3>Connect</h3>
              <p>
                Send a claim request and let the donor review your request.
              </p>
            </div>

            <div className="step-connector">
              <ArrowRight size={23} />
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon">
                <HeartHandshake size={28} />
              </div>
              <h3>Pass it forward</h3>
              <p>
                Coordinate with each other and give a useful item a new home.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-values">
        <div className="home-container values-layout">
          <div className="values-icon">
            <ShieldCheck size={34} />
          </div>

          <div>
            <span>BUILT ON KINDNESS</span>
            <h2>A community where giving feels good.</h2>
            <p>
              Be thoughtful, respect each other and help make sharing positive for everyone.
            </p>
          </div>

          <Sparkles className="values-sparkle" size={42} />
        </div>
      </section>

      <section className="home-cta" id="contact">
        <div className="home-container">
          <div className="cta-card">
            <div className="cta-decoration cta-decoration-one" />
            <div className="cta-decoration cta-decoration-two" />

            <div className="cta-content">
              <span className="cta-eyebrow">
                <Heart size={14} fill="currentColor" />
                MAKE KINDNESS CIRCULATE
              </span>

              <h2>
                Your next small act
                <br />
                could mean a lot.
              </h2>

              <p>
                Join ShareNest and be part of a community
                that believes in giving things another chance.
              </p>

              <div className="cta-buttons">
                <Link to="/register" className="home-btn cta-white-btn">
                  Join ShareNest <ArrowUpRight size={18} />
                </Link>

                <Link to={accessLink("/donations")} state={accessState("/donations")} className="cta-text-link">
                  Explore donations <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            <div className="cta-art">
              <div className="cta-art-circle">
                <HeartHandshake size={100} strokeWidth={1.1} />
              </div>
              <span className="cta-heart heart-one">♥</span>
              <span className="cta-heart heart-two">✦</span>
              <span className="cta-heart heart-three">♥</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// =====================================
// ADD DONATION PAGE
// =====================================

function AddDonation() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    category: "Clothes",
    description: "",
    location: "",
    pincode: "",
    contact: "",
    item_condition: "Good",
  });

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [coordinates, setCoordinates] = useState({
    latitude: null,
    longitude: null,
  });

  const [errors, setErrors] = useState({});
  const [pageError, setPageError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [pinLookup, setPinLookup] = useState({ status: "idle", detail: "" });

  useEffect(() => {
    const pin = form.pincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setPinLookup({ status: "idle", detail: "" });
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPinLookup({ status: "loading", detail: "Finding area, district and state..." });
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Lookup unavailable");
        const results = await response.json();
        const offices = results?.[0]?.PostOffice;
        if (results?.[0]?.Status !== "Success" || !Array.isArray(offices) || !offices.length) {
          setPinLookup({ status: "error", detail: "PIN code not found. Please check it." });
          return;
        }
        const office = offices.find((entry) => entry.DeliveryStatus === "Delivery") || offices[0];
        const location = [office.Name, office.District, office.State]
          .filter(Boolean).filter((value, index, all) => all.indexOf(value) === index).join(", ");
        setForm((previous) => previous.pincode === pin ? { ...previous, location } : previous);
        setErrors((previous) => ({ ...previous, location: "" }));
        setPinLookup({ status: "success", detail: `Auto-filled: ${office.District}, ${office.State} · ${offices.length} post office(s) found` });
      } catch (error) {
        if (error.name !== "AbortError") setPinLookup({ status: "error", detail: "Could not fetch PIN details. Enter location manually." });
      }
    }, 450);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [form.pincode]);

  const categories = [
    "Clothes",
    "Books",
    "Furniture",
    "Electronics",
    "Mobile Phones",
    "Home Appliances",
    "Study Materials",
    "Toys",
    "Sports Equipment",
    "Kitchen Items",
    "Household Items",
    "Other",
  ];

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));

    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Please enter the item name.";
        if (value.trim().length < 2) {
          return "Item name must contain at least 2 characters.";
        }
        return "";

      case "description":
        if (!value.trim()) return "Please describe your donation.";
        if (value.trim().length < 10) {
          return "Description must contain at least 10 characters.";
        }
        return "";

      case "location":
        if (!value.trim()) return "Please enter your city or area.";
        return "";

      case "pincode":
        if (!value) return "Please enter your PIN code.";
        if (value[0] === "0") return "Indian PIN codes cannot begin with 0.";
        if (!/^[0-9]{6}$/.test(value)) return "PIN code must contain exactly 6 digits.";
        return "";

      case "contact":
        if (!value) return "Please enter your mobile number.";
        if (!/^[6-9]/.test(value)) return "Indian mobile numbers must begin with 6, 7, 8 or 9.";
        if (!/^[0-9]{10}$/.test(value)) return "Mobile number must contain exactly 10 digits.";
        return "";

      default:
        return "";
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "pincode" || name === "contact") {
      const limit = name === "pincode" ? 6 : 10;
      const digits = value.replace(/\D/g, "").slice(0, limit);
      const invalidStart = digits && (name === "pincode" ? digits[0] === "0" : !/^[6-9]/.test(digits));
      if (invalidStart) {
        setErrors((previous) => ({
          ...previous,
          [name]: name === "pincode"
            ? "Indian PIN codes cannot begin with 0."
            : "Indian mobile numbers must begin with 6, 7, 8 or 9.",
        }));
        return;
      }
      setForm((previous) => ({ ...previous, [name]: digits }));
      // A manually changed PIN must not retain coordinates from an earlier area.
      if (name === "pincode") {
        setCoordinates({ latitude: null, longitude: null });
      }
      setErrors((previous) => ({
        ...previous,
        [name]: value !== digits && /[^0-9]/.test(value)
          ? "Only numbers are allowed in this field."
          : "",
      }));
      setPageError("");
      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
    if (name === "location") {
      setCoordinates({ latitude: null, longitude: null });
    }

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setPageError("");
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    const message = validateField(name, value);

    setErrors((previous) => ({
      ...previous,
      [name]: message,
    }));
  };

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    setErrors((previous) => ({
      ...previous,
      images: "",
    }));

    setPageError("");

    const acceptedFiles = [];
    const rejectedMessages = [];

    for (const file of selectedFiles) {
      if (images.length + acceptedFiles.length >= 5) {
        rejectedMessages.push("Only 5 photos are allowed.");
        break;
      }

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        rejectedMessages.push(`${file.name}: Please select a JPG, PNG or WebP image.`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        rejectedMessages.push(`${file.name}: Image must be smaller than 5 MB.`);
        continue;
      }

      const alreadySelected = [...images, ...acceptedFiles].some(
        (existing) =>
          existing.name === file.name &&
          existing.size === file.size &&
          existing.lastModified === file.lastModified
      );

      if (alreadySelected) {
        rejectedMessages.push(`${file.name}: This image is already selected.`);
        continue;
      }

      acceptedFiles.push(file);
    }

    if (acceptedFiles.length > 0) {
      setImages((previous) => [...previous, ...acceptedFiles]);
    }

    if (rejectedMessages.length > 0) {
      setErrors((previous) => ({
        ...previous,
        images: rejectedMessages.join(" "),
      }));
    }

    event.target.value = "";
  };

  const removeImage = (index) => {
    setImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );

    setErrors((previous) => ({
      ...previous,
      images: "",
    }));
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setErrors((previous) => ({
        ...previous,
        location: "Location services are not supported by this browser.",
      }));
      return;
    }

    setLocationLoading(true);

    setErrors((previous) => ({
      ...previous,
      location: "",
    }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });

        setLocationLoading(false);
      },
      (error) => {
        console.error("Location error:", error);

        setLocationLoading(false);

        setErrors((previous) => ({
          ...previous,
          location:
            "Location permission was unavailable. You can enter your area manually.",
        }));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
      }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setPageError("");
    setSuccess("");

    const newErrors = {};

    ["name", "description", "location", "pincode", "contact"].forEach(
      (field) => {
        const message = validateField(field, form[field]);

        if (message) {
          newErrors[field] = message;
        }
      }
    );

    setErrors((previous) => ({
      ...previous,
      ...newErrors,
    }));

    if (Object.keys(newErrors).length > 0) {
      setPageError("Please correct the highlighted fields.");
      return;
    }

    if (images.length > 5) {
      setErrors((previous) => ({
        ...previous,
        images: "You can upload a maximum of 5 photos.",
      }));
      return;
    }

    setLoading(true);

    const uploadedPaths = [];

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        navigate("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.warn("Could not load donor profile:", profileError.message);
      }

      const imageUrls = [];

      for (let index = 0; index < images.length; index++) {
        const file = images[index];

        const safeFileName = file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

        const filePath =
          `${user.id}/${Date.now()}-${index}-${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("donation-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          setErrors((previous) => ({
            ...previous,
            images: `Photo upload failed: ${uploadError.message}`,
          }));

          throw uploadError;
        }

        uploadedPaths.push(filePath);

        const { data: publicData } = supabase.storage
          .from("donation-images")
          .getPublicUrl(filePath);

        if (!publicData?.publicUrl) {
          throw new Error(
            "Could not generate a public URL for an uploaded photo."
          );
        }

        imageUrls.push(publicData.publicUrl);
      }

      const { error: insertError } = await supabase
        .from("donations")
        .insert({
          donor_id: user.id,
          donor_name:
            profile?.full_name ||
            user.user_metadata?.full_name ||
            "Community Member",
          name: form.name.trim(),
          category: form.category,
          description: form.description.trim(),
          location: form.location.trim(),
          pincode: form.pincode.trim(),
          contact: form.contact.trim(),
          item_condition: form.item_condition,
          image_urls: imageUrls,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          status: "available",
        });

      if (insertError) throw insertError;

      setSuccess("Your donation has been published successfully!");

      setForm({
        name: "",
        category: "Clothes",
        description: "",
        location: "",
        pincode: "",
        contact: "",
        item_condition: "Good",
      });

      setImages([]);
      setCoordinates({
        latitude: null,
        longitude: null,
      });
      setErrors({});

      setTimeout(() => {
        navigate("/donations");
      }, 1200);
    } catch (err) {
      console.error("Donation submission error:", err);

      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from("donation-images")
          .remove(uploadedPaths);

        if (cleanupError) {
          console.error("Image cleanup error:", cleanupError);
        }
      }

      setPageError(
        getSupabaseErrorMessage(
          err,
          "Something went wrong while publishing your donation."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section add-donation-section sn-premium-donation">
      <style>{`
        .sn-premium-donation{display:block!important;width:100%!important;min-height:0!important;padding:0!important;background:transparent!important}
        .sn-premium-donation .donation-form-card{display:block!important;width:100%!important;max-width:1120px!important;margin:0 auto!important;padding:0!important;border-radius:24px!important;overflow:hidden!important;border:1px solid #e2eae3!important;background:#fff!important;box-shadow:0 20px 65px rgba(27,64,41,.075)!important}
        .sn-premium-donation .donation-form-heading{position:relative;display:flex!important;flex-direction:row!important;align-items:center!important;gap:22px!important;text-align:left!important;padding:36px 45px!important;margin:0!important;min-height:0!important;background:linear-gradient(115deg,#eef7ee 0%,#f8fbf6 58%,#fffaf1 100%)!important;border-bottom:1px solid #e4ede4!important;color:#233d2d!important;overflow:hidden}
        .sn-premium-donation .donation-form-heading:after{content:'';position:absolute;right:-55px;top:-100px;width:280px;height:280px;border:1px solid #d5e6d7;border-radius:50%;box-shadow:0 0 0 42px #e4f0e544,0 0 0 90px #e4f0e533;pointer-events:none}
        .sn-premium-donation .donation-form-icon{flex:none;display:grid!important;place-items:center!important;width:76px!important;height:76px!important;margin:0!important;border-radius:22px!important;background:#fff!important;color:#315f40!important;border:1px solid #dce9df!important;box-shadow:0 10px 24px #315f4012!important}
        .sn-premium-donation .sn-heading-copy{position:relative;z-index:1}
        .sn-premium-donation .section-eyebrow{display:block!important;font-size:11px!important;letter-spacing:2.3px!important;font-weight:800!important;color:#4c8560!important}
        .sn-premium-donation .donation-form-heading h2{font-size:clamp(27px,3vw,39px)!important;letter-spacing:-1.4px!important;line-height:1.16!important;margin:8px 0 8px!important;color:#1d3c2a!important}
        .sn-premium-donation .donation-form-heading p{font-size:14px!important;line-height:1.65!important;margin:0!important;color:#6c7e70!important;max-width:550px}
        .sn-premium-donation form{padding:35px 45px 42px!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;column-gap:26px!important;row-gap:0!important;align-items:start!important;min-width:0}
        .sn-premium-donation .sn-section-heading{grid-column:1/-1;display:flex!important;align-items:center;gap:12px;margin:14px 0 22px!important;padding:0 0 14px!important;font-size:17px!important;font-weight:800!important;letter-spacing:-.3px;color:#254634!important;border-bottom:1px solid #e8eee9!important}
        .sn-premium-donation .sn-section-heading:first-child{margin-top:0!important}
        .sn-premium-donation .sn-section-heading span{display:none!important}
        .sn-premium-donation .sn-section-heading:before{content:'';display:block;width:5px;height:22px;border-radius:6px;background:#70a77a}
        .sn-premium-donation .sn-field{display:flex;flex-direction:column;min-width:0;margin:0 0 22px!important}
        .sn-premium-donation .sn-wide{grid-column:1/-1}
        .sn-premium-donation .sn-field>label{font-size:13px!important;font-weight:750!important;color:#334b3b!important;margin:0 0 9px!important}
        .sn-premium-donation .sn-field>input,.sn-premium-donation .sn-field>select,.sn-premium-donation .sn-field>textarea{width:100%!important;min-height:53px!important;padding:13px 16px!important;margin:0!important;background:#fbfcfa!important;color:#263c2d!important;border:1px solid #dce7dd!important;border-radius:13px!important;font:inherit!important;font-size:14px!important;box-shadow:none!important;transition:background .2s,border-color .2s,box-shadow .2s}
        .sn-premium-donation .sn-field>textarea{min-height:115px!important;resize:vertical}
        .sn-premium-donation .sn-field>input:hover,.sn-premium-donation .sn-field>select:hover,.sn-premium-donation .sn-field>textarea:hover{border-color:#b9d2bc!important}
        .sn-premium-donation .sn-field>input:focus,.sn-premium-donation .sn-field>select:focus,.sn-premium-donation .sn-field>textarea:focus{outline:none!important;background:white!important;border-color:#44845b!important;box-shadow:0 0 0 4px #44845b17!important}
        .sn-premium-donation .sn-field>input.input-error,.sn-premium-donation .sn-field>textarea.input-error{border-color:#d95050!important;background:#fffafa!important}
        .sn-premium-donation .field-error{display:block!important;color:#bf3535!important;font-size:12px!important;font-weight:650!important;margin:7px 0 0!important;line-height:1.45}
        .sn-premium-donation .form-hint{font-size:12px!important;color:#78877b!important;margin:8px 0 0!important}
        .sn-premium-donation .image-upload-box{min-height:180px!important;background:linear-gradient(145deg,#f8fbf8,#f1f8f2)!important;border:1.5px dashed #b2ceb8!important;border-radius:17px!important;display:flex!important;align-items:center;justify-content:center;flex-direction:column;gap:9px;padding:25px!important;cursor:pointer;transition:background .2s,border-color .2s,transform .2s}
        .sn-premium-donation .image-upload-box:hover{background:#eaf5ec!important;border-color:#4f9165!important;transform:translateY(-2px)}
        .sn-premium-donation .location-capture-btn{margin:12px 0 0!important;min-height:46px!important;border-radius:12px!important}
        .sn-premium-donation .sn-submit{grid-column:1/-1;margin-top:12px!important;padding-top:22px!important;border-top:1px solid #edf0ec}
        .sn-premium-donation .sn-submit .primary-btn{width:100%!important;min-height:56px!important;border-radius:13px!important;font-weight:800!important;font-size:15px!important;box-shadow:0 9px 20px #315f4026!important}
        @media(max-width:750px){.sn-premium-donation .donation-form-heading{padding:26px!important;gap:15px!important}.sn-premium-donation .donation-form-icon{width:56px!important;height:56px!important;border-radius:16px!important}.sn-premium-donation form{padding:26px!important;column-gap:16px!important}}
        @media(max-width:580px){.sn-premium-donation .donation-form-card{border-radius:17px!important}.sn-premium-donation .donation-form-heading{padding:24px 20px!important}.sn-premium-donation .donation-form-heading h2{font-size:27px!important}.sn-premium-donation .donation-form-icon{display:none!important}.sn-premium-donation form{grid-template-columns:1fr!important;padding:22px 20px!important}.sn-premium-donation .sn-wide,.sn-premium-donation .sn-section-heading{grid-column:1}}
        @media(prefers-reduced-motion:reduce){.sn-premium-donation *{transition:none!important}}
      `}</style>
      <div className="auth-card donation-form-card">
        <div className="donation-form-heading">
          <div className="donation-form-icon"><HandHeart size={32} /></div>
          <div className="sn-heading-copy">
            <span className="section-eyebrow">SHARENEST · DONATIONS</span>
            <h2>Add a donation</h2>
            <p>Fill in the item details below to publish your listing.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="sn-section-heading">Item details</div>
          <div className="sn-field">
          <label htmlFor="donation-name">Item Name</label>
          <input
            id="donation-name"
            name="name"
            placeholder="Example: Laptop, study table..."
            value={form.name}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength={100}
            className={errors.name ? "input-error" : ""}
          />
          {errors.name && (
            <small className="field-error">{errors.name}</small>
          )}

          </div>
          <div className="sn-field">
          <label htmlFor="donation-category">Category</label>
          <select
            id="donation-category"
            name="category"
            value={form.category}
            onChange={handleChange}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          </div>
          <div className="sn-field">
          <label htmlFor="donation-condition">Item Condition</label>
          <select
            id="donation-condition"
            name="item_condition"
            value={form.item_condition}
            onChange={handleChange}
          >
            <option>New</option>
            <option>Like New</option>
            <option>Good</option>
            <option>Fair</option>
            <option>Needs Repair</option>
          </select>

          </div>
          <div className="sn-field sn-wide">
          <label htmlFor="donation-description">Description</label>
          <textarea
            id="donation-description"
            name="description"
            placeholder="Describe the item and mention important details..."
            value={form.description}
            onChange={handleChange}
            onBlur={handleBlur}
            rows="4"
            maxLength={1000}
            className={errors.description ? "input-error" : ""}
          />
          <small className="form-hint">
            {form.description.length}/1000 characters
          </small>
          {errors.description && (
            <small className="field-error">{errors.description}</small>
          )}

          </div>
          <div className="sn-section-heading">Photos</div>
          <div className="sn-field sn-wide">
          <label>Product Photos <span style={{fontWeight:400,color:"#7a8b7e"}}>(up to 5)</span></label>

          <label className="image-upload-box">
            <ImagePlus size={30} />
            <span>Click to upload product photos</span>
            <small>
              {images.length}/5 photos selected · Maximum 5 MB per photo
            </small>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              hidden
              disabled={images.length >= 5 || loading}
            />
          </label>

          {errors.images && (
            <small className="field-error">{errors.images}</small>
          )}

          {previews.length > 0 && (
            <div className="image-preview-grid">
              {previews.map((url, index) => (
                <div className="image-preview-item" key={url}>
                  <img
                    src={url}
                    alt={`Donation preview ${index + 1}`}
                  />

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label={`Remove photo ${index + 1}`}
                    disabled={loading}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          </div>
          <div className="sn-section-heading">Location & contact</div>
          <div className="sn-field">
          <label htmlFor="donation-location">City / Area</label>
          <input
            id="donation-location"
            name="location"
            placeholder="Example: Dehradun, Uttarakhand"
            value={form.location}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors.location ? "input-error" : ""}
          />

          {errors.location && (
            <small className="field-error">{errors.location}</small>
          )}

          <button
            type="button"
            className="location-search-btn location-capture-btn"
            onClick={captureLocation}
            disabled={locationLoading || loading}
          >
            <LocateFixed size={18} />
            {locationLoading
              ? "Getting location..."
              : coordinates.latitude !== null
              ? "Coordinates captured"
              : "Use approximate current location"}
          </button>

          {coordinates.latitude !== null && (
            <small className="form-hint">
              Location coordinates captured successfully.
            </small>
          )}

          <small className="form-hint">
            Optional. You can skip location access and enter your area manually.
          </small>

          </div>
          <div className="sn-field">
          <label htmlFor="donation-pincode">PIN Code</label>
          <input
            id="donation-pincode"
            name="pincode"
            onKeyDown={(event) => {
              if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
              if (!/^[0-9]$/.test(event.key)) {
                event.preventDefault();
                setErrors((previous) => ({ ...previous, pincode: "PIN code accepts numbers only." }));
              } else if (!form.pincode && event.key === "0") {
                event.preventDefault();
                setErrors((previous) => ({ ...previous, pincode: "Indian PIN codes cannot begin with 0." }));
              }
            }}
            inputMode="numeric"
            placeholder="e.g. 248001"
            value={form.pincode}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength={6}
            className={errors.pincode ? "input-error" : ""}
          />

          {pinLookup.status !== "idle" && (
            <small role="status" style={{display:"block",marginTop:7,color:pinLookup.status === "error" ? "#b45309" : "#315f40",fontWeight:600}}>
              {pinLookup.status === "loading" ? "⌛ " : pinLookup.status === "success" ? "✓ " : "ⓘ "}{pinLookup.detail}
            </small>
          )}
          {errors.pincode && (
            <small className="field-error">{errors.pincode}</small>
          )}

          </div>
          <div className="sn-field sn-wide">
          <label htmlFor="donation-contact">Contact Number</label>
          <input
            id="donation-contact"
            type="tel"
            onKeyDown={(event) => {
              if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
              if (!/^[0-9]$/.test(event.key)) {
                event.preventDefault();
                setErrors((previous) => ({ ...previous, contact: "Mobile number accepts numbers only." }));
              } else if (!form.contact && !/^[6-9]$/.test(event.key)) {
                event.preventDefault();
                setErrors((previous) => ({ ...previous, contact: "Indian mobile numbers must begin with 6, 7, 8 or 9." }));
              }
            }}
            name="contact"
            inputMode="numeric"
            placeholder="10-digit mobile number"
            value={form.contact}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength={10}
            className={errors.contact ? "input-error" : ""}
          />

          {errors.contact && (
            <small className="field-error">{errors.contact}</small>
          )}

          </div>
          <div className="sn-submit">
          {pageError && (
            <div
              className="form-message form-message-error"
              role="alert"
            >
              {pageError}
            </div>
          )}

          {success && (
            <div
              className="form-message form-message-success"
              role="status"
            >
              <CheckCircle2 size={18} />
              {success}
            </div>
          )}

          <button
            type="submit"
            className="primary-btn full-btn"
            disabled={loading || !!success}
          >
            {loading ? (
              "Publishing Donation..."
            ) : success ? (
              "Published Successfully"
            ) : (
              <>
                Publish Donation <ArrowRight size={17} />
              </>
            )}
          </button>
          </div>
        </form>
      </div>
    </section>
  );
}

// =====================================
// FOOTER
// =====================================

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <h2>
          <HandHeart size={23} /> ShareNest
        </h2>

        <p>Sharing resources. Reducing waste. Helping people.</p>

        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/donations">Donations</Link>
          <Link to="/register">Join ShareNest</Link>
        </div>

        <p className="footer-copyright">
          © {new Date().getFullYear()} ShareNest. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function ProtectedRoute({ children }) {
  const location = useLocation();
  const [auth, setAuth] = useState({ ready: false, user: null });

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (mounted) setAuth({ ready: true, user: error ? null : data.session?.user || null });
    }).catch(() => {
      if (mounted) setAuth({ ready: true, user: null });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setAuth({ ready: true, user: session?.user || null });
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  if (!auth.ready) {
    return (
      <div className="sn-auth-check" role="status" aria-live="polite">
        <div className="sn-auth-check-card">
          <ShieldCheck size={27} />
          <strong>Checking your account...</strong>
          <span>Keeping your ShareNest community secure.</span>
        </div>
      </div>
    );
  }
  if (!auth.user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

// =====================================
// APP ROUTES
// =====================================

function AppContent() {
  const location = useLocation();

  // All authenticated workspace pages use the same dashboard shell.
  const isDashboardLayoutPage = [
    "/dashboard",
    "/donations",
    "/add-donation",
    "/notifications",
  ].includes(location.pathname) || location.pathname.startsWith("/chat/");

  return (
    <>
      {!isDashboardLayoutPage && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<ProtectedRoute><MyDashboard /></ProtectedRoute>} />

        <Route
          path="/donations"
          element={
            <ProtectedRoute>
              <MyDashboard>
                <Donations />
              </MyDashboard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-donation"
          element={
            <ProtectedRoute>
              <MyDashboard>
                <AddDonation />
              </MyDashboard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <MyDashboard>
                <Notifications embedded />
              </MyDashboard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:chatId"
          element={
            <ProtectedRoute>
              <MyDashboard>
                <Chat />
              </MyDashboard>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Home />} />
      </Routes>

      {!isDashboardLayoutPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

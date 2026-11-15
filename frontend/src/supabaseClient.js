
import { createClient } from "@supabase/supabase-js";

// Read Supabase configuration from .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();

const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ""
).trim();

// Validate Supabase API key
const isSupportedApiKey =
  supabaseKey.startsWith("sb_publishable_") ||
  supabaseKey.startsWith("eyJ");

// Check configuration
export const supabaseConfigError = !supabaseUrl
  ? "VITE_SUPABASE_URL is missing in frontend/.env."
  : !/^https:\/\/[^/]+\.supabase\.co\/?$/.test(supabaseUrl)
    ? "Invalid Supabase project URL. Check VITE_SUPABASE_URL."
    : !supabaseKey
      ? "Supabase API key is missing in frontend/.env."
      : !isSupportedApiKey
        ? "Invalid Supabase API key. Use your publishable or legacy anon key."
        : "";

// Check whether Supabase is configured
export const isSupabaseConfigured = !supabaseConfigError;

// Initialize Supabase client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Convert Supabase errors into readable messages
export function getSupabaseErrorMessage(
  error,
  fallback = ""
) {
  if (!error) {
    return fallback || "Something went wrong. Please try again.";
  }

  const message = String(error.message || "");
  const status = Number(error.status || error.statusCode || 0);
  const code = String(error.code || "");

  // Authentication errors
  if (
    /invalid login credentials/i.test(message)
  ) {
    return "Incorrect email or password.";
  }

  if (/email not confirmed/i.test(message)) {
    return "Please verify your email before logging in.";
  }

  if (
    /user already registered|already been registered/i.test(message)
  ) {
    return "This email is already registered. Please log in.";
  }

  if (/password should be at least/i.test(message)) {
    return "Your password does not meet the minimum length requirement.";
  }

  // Supabase API key errors
  if (
    /invalid api key|api key.*invalid/i.test(message) ||
    (status === 401 &&
      !/invalid login credentials/i.test(message))
  ) {
    return "Supabase authentication failed. Check your project URL, API key and login session.";
  }

  // Session errors
  if (
    /jwt expired|session.*expired|refresh token.*not found/i.test(
      message
    )
  ) {
    return "Your session has expired. Please log in again.";
  }

  // Permissions
  if (
    status === 403 ||
    code === "42501" ||
    /row.level security|permission denied/i.test(message)
  ) {
    return "You don't have permission to perform this action.";
  }

  // Duplicate records
  if (code === "23505") {
    return "This record already exists.";
  }

  // Foreign key errors
  if (code === "23503") {
    return "The related record could not be found.";
  }

  // Network errors
  if (
    /failed to fetch|network|connection refused|load failed/i.test(
      message
    )
  ) {
    return "Could not connect to Supabase. Check your internet connection and try again.";
  }

  // Rate limiting
  if (status === 429) {
    return "Too many requests. Please wait before trying again.";
  }

  // Server errors
  if (status >= 500) {
    return "Supabase is temporarily unavailable. Please try again later.";
  }

  // Original error for debugging
  console.error("Supabase Error:", error);

  return fallback || message || "Something went wrong. Please try again.";
}

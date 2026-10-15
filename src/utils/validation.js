// Client-side validation that mirrors the backend auth rules so users get
// immediate feedback. The backend still validates authoritatively.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LIMITS = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,
  EMAIL_MAX: 254,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 72,
};

export function validateUsername(username) {
  const value = typeof username === "string" ? username.trim() : "";
  if (!value) return "Username is required.";
  if (value.length < LIMITS.USERNAME_MIN || value.length > LIMITS.USERNAME_MAX) {
    return `Username must be between ${LIMITS.USERNAME_MIN} and ${LIMITS.USERNAME_MAX} characters.`;
  }
  return null;
}

export function validateEmail(email) {
  const value = typeof email === "string" ? email.trim() : "";
  if (!value) return "Email is required.";
  if (value.length > LIMITS.EMAIL_MAX || !EMAIL_REGEX.test(value)) {
    return "Please provide a valid email address.";
  }
  return null;
}

export function validatePassword(password) {
  const value = typeof password === "string" ? password : "";
  if (!value) return "Password is required.";
  if (value.length < LIMITS.PASSWORD_MIN) {
    return `Password must be at least ${LIMITS.PASSWORD_MIN} characters.`;
  }
  if (value.length > LIMITS.PASSWORD_MAX) {
    return `Password must be at most ${LIMITS.PASSWORD_MAX} characters.`;
  }
  return null;
}

export function validateRegisterForm({ username, email, password }) {
  return {
    username: validateUsername(username),
    email: validateEmail(email),
    password: validatePassword(password),
  };
}

export function validateLoginForm({ email, password }) {
  return {
    email: validateEmail(email),
    password: password ? null : "Password is required.",
  };
}

// Removes null/undefined entries so a plain `Object.keys(errors).length` check
// tells us whether a form is valid.
export function compactErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, value]) => Boolean(value)));
}

// ---------------------------------------------------------------------------
// Feature-form validators. They mirror the backend rules so users get instant
// feedback; the backend still validates authoritatively.
// ---------------------------------------------------------------------------

import {
  ASSET_STATUSES,
  REQUEST_PRIORITIES,
  USER_ROLES,
} from "./constants.js";

function requiredText(value, label, max) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return `${label} is required.`;
  if (max && text.length > max) return `${label} must be at most ${max} characters.`;
  return null;
}

function optionalText(value, label, max) {
  const text = typeof value === "string" ? value.trim() : "";
  if (max && text.length > max) return `${label} must be at most ${max} characters.`;
  return null;
}

function optionalDate(value, label) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;
  return Number.isNaN(new Date(text).getTime()) ? `${label} must be a valid date.` : null;
}

export function validateRequestForm(values) {
  return {
    title: requiredText(values.title, "Title", 120),
    description: requiredText(values.description, "Description", 2000),
    priority: REQUEST_PRIORITIES.includes(values.priority)
      ? null
      : "Choose a valid priority.",
    category: optionalText(values.category, "Category", 80),
    location: optionalText(values.location, "Location", 120),
    dueDate: optionalDate(values.dueDate, "Due date"),
  };
}

export function validateAssetForm(values) {
  return {
    name: requiredText(values.name, "Name", 120),
    assetCode: requiredText(values.assetCode, "Asset code", 40),
    category: requiredText(values.category, "Category", 80),
    location: requiredText(values.location, "Location", 120),
    description: optionalText(values.description, "Description", 1000),
    status: ASSET_STATUSES.includes(values.status) ? null : "Choose a valid status.",
  };
}

export function validateUserForm(values) {
  return {
    username: validateUsername(values.username),
    email: validateEmail(values.email),
    password: validatePassword(values.password),
    role: USER_ROLES.includes(values.role) ? null : "Choose a valid role.",
  };
}

// Asset code is trimmed and upper-cased by the backend; do the same client-side
// so comparisons and the read-only edit field match what is stored.
export function normalizeAssetCode(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

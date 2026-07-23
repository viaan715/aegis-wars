"use client";

import { useEffect, useSyncExternalStore } from "react";

type ThemePref = "light" | "dark" | null;

const STORAGE_KEY = "theme-pref";
const PREF_EVENT = "theme-pref-changed";

function subscribePref(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(PREF_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PREF_EVENT, callback);
  };
}

function getPrefSnapshot(): ThemePref {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

function getPrefServerSnapshot(): ThemePref {
  return null;
}

function setThemePref(pref: ThemePref) {
  if (pref) window.localStorage.setItem(STORAGE_KEY, pref);
  else window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(PREF_EVENT));
}

function subscribeMedia(callback: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getMediaSnapshot(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getMediaServerSnapshot(): boolean {
  return false;
}

export function ThemeToggle() {
  const pref = useSyncExternalStore(subscribePref, getPrefSnapshot, getPrefServerSnapshot);
  const prefersDark = useSyncExternalStore(subscribeMedia, getMediaSnapshot, getMediaServerSnapshot);
  const isDark = pref === "dark" || (pref === null && prefersDark);

  useEffect(() => {
    const root = document.documentElement;
    if (pref) root.setAttribute("data-theme", pref);
    else root.removeAttribute("data-theme");
  }, [pref]);

  function cycle() {
    setThemePref(isDark ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-8 w-8 items-center justify-center rounded-md border text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      style={{ borderColor: "var(--border)" }}
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1v2M8 13v2M2.5 2.5l1.4 1.4M12.1 12.1l1.4 1.4M1 8h2M13 8h2M2.5 13.5l1.4-1.4M12.1 3.9l1.4-1.4"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M13.5 9.5A5.8 5.8 0 1 1 6.5 2.5a4.6 4.6 0 0 0 7 7Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

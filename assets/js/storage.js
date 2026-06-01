const PREFIX = "nagoyaTrip.";

export function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export function loadString(key, fallback = "") {
  return localStorage.getItem(PREFIX + key) ?? fallback;
}

export function saveString(key, value) {
  localStorage.setItem(PREFIX + key, value);
}

export function uid(prefix = "id") {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
}

// Shared open/closed computation for exchanges.
//
// The backend stores per-exchange working hours plus an `open_override` flag
// (the supervisor toggle on /berze used for testing outside trading hours,
// see e2e.txt:19). The same computation needs to run in two places — the
// Berza listing page and the order form's pre-flight warning — so it lives
// here to avoid drift.
//
// We prefer the backend's `is_open` flag when present; fall back to the
// stored open/close clock + offset, weekend skip, and override.

function parseTimeOfDay(value) {
  if (!value || typeof value !== "string") return null;
  const [h, m = "0"] = value.split(":");
  const hh = Number(h);
  const mm = Number(m);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

function parseUtcOffset(value) {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const s = String(value).trim();
  // Accepts "+8", "-3", "+8:00", "+05:30".
  const match = s.match(/^([+-]?)(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const h = Number(match[2]);
  const m = Number(match[3] || 0);
  return sign * (h + m / 60);
}

export function computeExchangeStatus(ex) {
  if (!ex) {
    return { open: false, label: "Nepoznato", className: "unknown", override: false };
  }
  if (ex.open_override) {
    return { open: true, label: "Otvorena (override)", className: "open", override: true };
  }
  if (typeof ex.is_open === "boolean") {
    return {
      open: ex.is_open,
      label: ex.is_open ? "Otvorena" : "Zatvorena",
      className: ex.is_open ? "open" : "closed",
      override: false,
    };
  }
  const openMin = parseTimeOfDay(ex.open_time);
  const closeMin = parseTimeOfDay(ex.close_time);
  if (openMin == null || closeMin == null) {
    return { open: false, label: "Nepoznato", className: "unknown", override: false };
  }
  const offsetH = parseUtcOffset(ex.time_zone_offset);
  const now = new Date();
  const localMs = now.getTime() + (now.getTimezoneOffset() + offsetH * 60) * 60000;
  const localDate = new Date(localMs);
  const day = localDate.getUTCDay();
  if (day === 0 || day === 6) {
    return { open: false, label: "Zatvorena (vikend)", className: "closed", override: false };
  }
  const minutesNow = localDate.getUTCHours() * 60 + localDate.getUTCMinutes();
  const isOpen = minutesNow >= openMin && minutesNow <= closeMin;
  return {
    open: isOpen,
    label: isOpen ? "Otvorena" : "Zatvorena",
    className: isOpen ? "open" : "closed",
    override: false,
  };
}

// findExchangeByAcronym returns the exchange whose acronym matches the
// supplied value (case-insensitive). Useful for resolving a security's
// `exchange` string back to the exchange row that carries hours/override.
export function findExchangeByAcronym(exchanges, acronym) {
  if (!acronym || !Array.isArray(exchanges)) return null;
  const target = String(acronym).toUpperCase();
  return exchanges.find((ex) => (ex.acronym || "").toUpperCase() === target) || null;
}

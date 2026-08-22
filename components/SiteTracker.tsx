"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type SiteEventType =
  | "page_view"
  | "quote_click"
  | "whatsapp_click"
  | "cart_click"
  | "checkout_start"
  | "order_created"
  | "tracking_search"
  | "portfolio_view"
  | "product_view"
  | "service_view"
  | "reservation_view"
  | "admin_view"
  | "other";

declare global {
  interface Window {
    samoraTrackEvent?: (
      eventType: SiteEventType,
      metadata?: Record<string, unknown>
    ) => void;
  }
}

const VISITOR_KEY = "samora_visitor_id";
const SESSION_KEY = "samora_session_id";
const SESSION_UPDATED_KEY = "samora_session_updated_at";
const LAST_PAGE_VIEW_KEY = "samora_last_page_view";
const LAST_CONTEXT_EVENT_KEY = "samora_last_context_event";

const SESSION_TTL_MS = 30 * 60 * 1000;
const DUPLICATE_PAGE_VIEW_MS = 1500;
const DUPLICATE_CONTEXT_EVENT_MS = 1500;

const allowedEventTypes = new Set<SiteEventType>([
  "page_view",
  "quote_click",
  "whatsapp_click",
  "cart_click",
  "checkout_start",
  "order_created",
  "tracking_search",
  "portfolio_view",
  "product_view",
  "service_view",
  "reservation_view",
  "admin_view",
  "other",
]);

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}

function getOrCreateVisitorId() {
  try {
    const saved = localStorage.getItem(VISITOR_KEY);

    if (saved) return saved;

    const id = createId("visitor");
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return createId("visitor");
  }
}

function getOrCreateSessionId() {
  try {
    const now = Date.now();
    const savedSession = sessionStorage.getItem(SESSION_KEY);
    const savedUpdatedAt = Number(
      sessionStorage.getItem(SESSION_UPDATED_KEY) ?? 0
    );

    if (savedSession && now - savedUpdatedAt < SESSION_TTL_MS) {
      sessionStorage.setItem(SESSION_UPDATED_KEY, String(now));
      return savedSession;
    }

    const id = createId("session");
    sessionStorage.setItem(SESSION_KEY, id);
    sessionStorage.setItem(SESSION_UPDATED_KEY, String(now));
    return id;
  } catch {
    return createId("session");
  }
}

function getDeviceType(width: number) {
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function getSafeReferrer() {
  if (typeof document === "undefined" || !document.referrer) return null;

  try {
    const url = new URL(document.referrer);
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}

function getUtmParams() {
  if (typeof window === "undefined") {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    };
  }

  const params = new URLSearchParams(window.location.search);

  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"),
  };
}

function shouldIgnorePath(path: string) {
  return (
    path.startsWith("/admin") ||
    path.startsWith("/api") ||
    path.startsWith("/_next")
  );
}

function getPageGroup(path: string) {
  if (path === "/") return "landing";
  if (path.startsWith("/portafolio")) return "portafolio";
  if (path.startsWith("/servicios")) return "servicios";
  if (path.startsWith("/tienda")) return "tienda";
  if (path.startsWith("/carrito")) return "carrito";
  if (path.startsWith("/checkout")) return "checkout";
  if (path.startsWith("/seguimiento")) return "seguimiento";
  if (path.startsWith("/contacto")) return "contacto";
  if (path.startsWith("/nosotros")) return "nosotros";
  return "otro";
}

function getContextEventFromPath(path: string): SiteEventType | null {
  if (shouldIgnorePath(path)) return null;

  if (path.startsWith("/servicios")) {
    return "service_view";
  }

  if (path.startsWith("/portafolio")) {
    return "portfolio_view";
  }

  if (path.startsWith("/tienda/")) {
    return "product_view";
  }

  if (path.startsWith("/carrito")) {
    return "cart_click";
  }

  if (path.startsWith("/checkout")) {
    return "checkout_start";
  }

  return null;
}

function wasRecentlyTracked(path: string) {
  try {
    const raw = sessionStorage.getItem(LAST_PAGE_VIEW_KEY);

    if (!raw) return false;

    const parsed = JSON.parse(raw) as {
      path?: string;
      time?: number;
    };

    return (
      parsed.path === path &&
      typeof parsed.time === "number" &&
      Date.now() - parsed.time < DUPLICATE_PAGE_VIEW_MS
    );
  } catch {
    return false;
  }
}

function markPageTracked(path: string) {
  try {
    sessionStorage.setItem(
      LAST_PAGE_VIEW_KEY,
      JSON.stringify({
        path,
        time: Date.now(),
      })
    );
  } catch {
    // No pasa nada si sessionStorage no está disponible.
  }
}

function wasRecentlyTrackedContextEvent(eventType: SiteEventType, path: string) {
  try {
    const raw = sessionStorage.getItem(LAST_CONTEXT_EVENT_KEY);

    if (!raw) return false;

    const parsed = JSON.parse(raw) as {
      eventType?: SiteEventType;
      path?: string;
      time?: number;
    };

    return (
      parsed.eventType === eventType &&
      parsed.path === path &&
      typeof parsed.time === "number" &&
      Date.now() - parsed.time < DUPLICATE_CONTEXT_EVENT_MS
    );
  } catch {
    return false;
  }
}

function markContextEventTracked(eventType: SiteEventType, path: string) {
  try {
    sessionStorage.setItem(
      LAST_CONTEXT_EVENT_KEY,
      JSON.stringify({
        eventType,
        path,
        time: Date.now(),
      })
    );
  } catch {
    // No pasa nada si sessionStorage no está disponible.
  }
}

function normalizeText(value: string | null | undefined, maxLength = 160) {
  if (!value) return null;

  const cleaned = value.replace(/\s+/g, " ").trim();

  if (!cleaned) return null;

  return cleaned.slice(0, maxLength);
}

function getPathFromHref(href: string) {
  try {
    const url = new URL(href, window.location.origin);

    if (url.origin === window.location.origin) {
      return `${url.pathname}${url.search}${url.hash}`;
    }

    return url.href;
  } catch {
    return href;
  }
}

function getEventFromHref(href: string): SiteEventType | null {
  const normalizedHref = href.toLowerCase();

  if (
    normalizedHref.includes("wa.me") ||
    normalizedHref.includes("whatsapp.com") ||
    normalizedHref.includes("api.whatsapp")
  ) {
    return "whatsapp_click";
  }

  const path = getPathFromHref(href).toLowerCase();

  if (path.includes("/servicios#cotizador")) {
    return "quote_click";
  }

  if (path === "/servicios" || path.startsWith("/servicios?")) {
    return "service_view";
  }

  if (path.startsWith("/carrito")) {
    return "cart_click";
  }

  if (path.startsWith("/checkout")) {
    return "checkout_start";
  }

  if (path === "/tienda" || path.startsWith("/tienda?")) {
    return "product_view";
  }

  if (path.startsWith("/tienda/")) {
    return "product_view";
  }

  if (path.startsWith("/portafolio")) {
    return "portfolio_view";
  }

  return null;
}

function getEventFromDataset(element: HTMLElement): SiteEventType | null {
  const eventType = element.dataset.trackEvent;

  if (!eventType) return null;

  if (allowedEventTypes.has(eventType as SiteEventType)) {
    return eventType as SiteEventType;
  }

  return null;
}

async function sendSiteEvent(
  eventType: SiteEventType,
  path: string,
  metadata: Record<string, unknown> = {}
) {
  if (typeof window === "undefined") return;
  if (shouldIgnorePath(window.location.pathname)) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  const payload = {
    event_type: eventType,
    path,
    page_title: document.title,
    referrer: getSafeReferrer(),
    visitor_id: getOrCreateVisitorId(),
    session_id: getOrCreateSessionId(),
    device_type: getDeviceType(width),
    viewport_width: width,
    viewport_height: height,
    ...getUtmParams(),
    metadata: {
      page_group: getPageGroup(window.location.pathname || "/"),
      source: "site_tracker",
      ...metadata,
    },
  };

  try {
    await fetch("/api/site-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // No bloqueamos navegación ni UI si falla la analítica.
  }
}

export default function SiteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || shouldIgnorePath(pathname)) return;

    if (!wasRecentlyTracked(pathname)) {
      markPageTracked(pathname);
      void sendSiteEvent("page_view", pathname);
    }

    const contextEvent = getContextEventFromPath(pathname);

    if (
      contextEvent &&
      !wasRecentlyTrackedContextEvent(contextEvent, pathname)
    ) {
      markContextEventTracked(contextEvent, pathname);

      void sendSiteEvent(contextEvent, pathname, {
        trigger: "page_context",
      });
    }
  }, [pathname]);

  useEffect(() => {
    window.samoraTrackEvent = (
      eventType: SiteEventType,
      metadata: Record<string, unknown> = {}
    ) => {
      const path = window.location.pathname || "/";
      void sendSiteEvent(eventType, path, {
        trigger: "manual",
        ...metadata,
      });
    };

    return () => {
      delete window.samoraTrackEvent;
    };
  }, []);

  useEffect(() => {
    function handleTrackedClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) return;

      const clickable = target.closest("a,button");

      if (!(clickable instanceof HTMLElement)) return;

      const datasetEvent = getEventFromDataset(clickable);

      let href: string | null = null;

      if (clickable instanceof HTMLAnchorElement) {
        href = clickable.href;
      }

      const eventFromHref = href ? getEventFromHref(href) : null;
      const eventType = datasetEvent ?? eventFromHref;

      if (!eventType) return;

      const currentPath = window.location.pathname || "/";
      const destination = href ? getPathFromHref(href) : null;
      const label = normalizeText(clickable.textContent);

      void sendSiteEvent(eventType, currentPath, {
        trigger: datasetEvent ? "data_attribute" : "link_click",
        destination,
        label,
      });
    }

    document.addEventListener("click", handleTrackedClick, true);

    return () => {
      document.removeEventListener("click", handleTrackedClick, true);
    };
  }, []);

  return null;
}
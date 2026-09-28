export function DevBadge() {
  const show =
    process.env.VERCEL_GIT_COMMIT_REF === "dev" ||
    process.env.NEXT_PUBLIC_SITE_ENV === "dev";

  if (!show) return null;

  return (
    <aside
      role="status"
      aria-label="Preview — not production"
      style={{
        position: "fixed",
        right: 12,
        bottom: 64,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        background: "#111",
        color: "#fff",
        fontFamily: "var(--font-dm-sans), Arial, sans-serif",
        fontSize: 11,
        letterSpacing: "0.06em",
        lineHeight: 1.2,
        pointerEvents: "none",
      }}
    >
      <strong style={{ color: "#ff643d", fontWeight: 700 }}>DEV</strong>
      <span>Preview — not production</span>
    </aside>
  );
}

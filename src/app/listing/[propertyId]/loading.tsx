export default function ListingDetailLoading() {
  const shimmerStyle = {
    background:
      "linear-gradient(90deg, rgba(226,232,240,0.72), rgba(241,245,249,0.98), rgba(226,232,240,0.72))",
    backgroundSize: "200% 100%",
    animation: "listing-detail-shimmer 1.3s linear infinite",
  } as const;

  const block = (height: number, width = "100%", radius = 16) => (
    <div
      style={{
        ...shimmerStyle,
        width,
        height,
        borderRadius: radius,
      }}
    />
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <style>{`
        @keyframes listing-detail-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: 16, display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gap: 10 }}>
          {block(18, "132px", 999)}
          {block(34, "42%")}
          {block(18, "58%")}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {block(30, "84px", 999)}
            {block(30, "98px", 999)}
            {block(30, "110px", 999)}
          </div>
        </div>
        {block(460, "100%", 18)}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {block(88)}
          {block(88)}
          {block(88)}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.6fr) minmax(280px, 0.9fr)",
            gap: 16,
          }}
        >
          {block(220)}
          {block(220)}
        </div>
      </div>
    </div>
  );
}

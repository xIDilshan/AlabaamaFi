export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050505",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "48px", marginBottom: "16px" }}>
          AlabaamaFi
        </h1>

        <p style={{ fontSize: "20px", color: "#999" }}>
          Mainnet
        </p>

        <p style={{ marginTop: "12px", color: "#666" }}>
          One place. Every move.
        </p>
      </div>
    </main>
  );
}

"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export default function Home() {
  const [assets, setAssets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [type, setType] = useState("azione");
  const [value, setValue] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestions = [
    "Cosa succederebbe al mio portafoglio se domani il mercato crollasse del 30%?",
    "Come posso riequilibrare il mio portafoglio per ridurre il rischio mantenendo al contempo il potenziale di crescita?",
    "Quali delle mie posizioni azionarie sono più al di sotto dei massimi delle ultime 52 settimane e quali potrebbero rappresentare buone opportunità di acquisto?",
    "Considerando le mie posizioni e la storia del mio portafoglio, qual è la probabilità di raggiungere un patrimonio netto di 1 milione di dollari in 10 anni?"
  ];

  useEffect(() => { loadAssets(); }, []);

  async function loadAssets() {
    const { data } = await supabase.from("assets").select("*").order("created_at", { ascending: false });
    setAssets(data || []);
  }

  async function addAsset() {
    if (!name || !value) return;
    await supabase.from("assets").insert({ name, ticker, asset_type: type, value: parseFloat(value) });
    setName(""); setTicker(""); setValue(""); setShowForm(false);
    loadAssets();
  }

  async function askAI(question) {
    setLoading(true);
    setAiResponse("");
    const context = assets.map(a => `${a.name} (${a.asset_type}): €${a.value}`).join(", ");
    const prompt = `Sei un consulente finanziario esperto. Portfolio dell'utente: ${context || "nessun asset"}. Domanda: ${question}`;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      setAiResponse(result.response.text());
    } catch { setAiResponse("Errore. Controlla la chiave API nelle impostazioni."); }
    setLoading(false);
  }

  const netWorth = assets.reduce((sum, a) => sum + a.value, 0);
  const chartData = assets.map(a => ({ name: a.name, valore: a.value }));

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, marginBottom: 5 }}>Bentornato, Giuseppe17</h1>
      <p style={{ color: "#666", marginBottom: 30 }}>Ecco il riepilogo</p>

      <div style={{ background: "#f9fafb", borderRadius: 12, padding: 24, marginBottom: 24, border: "1px solid #e5e7eb" }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Storia del patrimonio netto</h2>
        {assets.length === 0 ? (
          <p style={{ color: "#999" }}>Aggiungi i tuoi beni per iniziare a monitorare il tuo patrimonio netto.</p>
        ) : (
          <>
            <p style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>€{netWorth.toLocaleString()}</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="valore" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: "10px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>+ Nuovo asset</button>
          <button style={{ padding: "10px 20px", background: "white", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer" }}>Importare</button>
        </div>
        {showForm && (
          <div style={{ marginTop: 16, padding: 16, background: "white", borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <input placeholder="Nome (es. AAPL, Casa)" value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 8, border: "1px solid #d1d5db", borderRadius: 6 }} />
            <input placeholder="Ticker (opzionale)" value={ticker} onChange={e => setTicker(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 8, border: "1px solid #d1d5db", borderRadius: 6 }} />
            <select value={type} onChange={e => setType(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 8, border: "1px solid #d1d5db", borderRadius: 6 }}>
              <option value="azione">Azione</option>
              <option value="crypto">Crypto</option>
              <option value="contanti">Contanti</option>
              <option value="immobile">Immobile</option>
              <option value="altro">Altro</option>
            </select>
            <input placeholder="Valore (€)" type="number" value={value} onChange={e => setValue(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 8, border: "1px solid #d1d5db", borderRadius: 6 }} />
            <button onClick={addAsset} style={{ width: "100%", padding: 12, background: "#2563eb", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>Salva asset</button>
          </div>
        )}
      </div>

      <div style={{ background: "#f9fafb", borderRadius: 12, padding: 24, marginBottom: 24, border: "1px solid #e5e7eb" }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Notizie dal portfolio</h2>
        {assets.length === 0 ? (
          <p style={{ color: "#999" }}>Aggiungi gli asset per iniziare a ricevere notizie relative al tuo portafoglio.</p>
        ) : (
          <p style={{ color: "#666" }}>📰 Presto disponibile: notizie su {assets.map(a => a.name).join(", ")}</p>
        )}
      </div>

      <div style={{ background: "#f9fafb", borderRadius: 12, padding: 24, marginBottom: 24, border: "1px solid #e5e7eb" }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Suggestioni</h2>
        {suggestions.map((s, i) => (
          <p key={i} onClick={() => askAI(s)} style={{ padding: "10px 0", cursor: "pointer", color: "#2563eb", borderBottom: "1px solid #e5e7eb" }}>
            {s}
          </p>
        ))}
        {loading && <p style={{ marginTop: 16, color: "#666" }}>🧠 Pensando...</p>}
        {aiResponse && (
          <div style={{ marginTop: 16, padding: 16, background: "white", borderRadius: 8, border: "1px solid #e5e7eb", whiteSpace: "pre-wrap" }}>
            {aiResponse}
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", color: "#999", fontSize: 13, marginTop: 40 }}>
        <p>Foliofox · v0.1.0-beta</p>
      </div>
    </div>
  );
}

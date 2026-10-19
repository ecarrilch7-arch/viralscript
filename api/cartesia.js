// Proxy para Cartesia (voz opcional). Igual que elevenlabs.js: la app manda
// { action, apiKey, ... } y aqui se llama a Cartesia desde el servidor (evita CORS).
const CARTESIA_VERSION = "2026-08-14";
const CARTESIA_MODEL = "sonic-3.6";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const action = req.body.action;
    const apiKey = req.body.apiKey;
    const headers = {
      "Authorization": "Bearer " + apiKey,
      "Cartesia-Version": CARTESIA_VERSION,
    };

    if (action === "voices") {
      const language = req.body.language || "es";
      const url = "https://api.cartesia.ai/voices?limit=100&language=" + encodeURIComponent(language);
      const response = await fetch(url, { method: "GET", headers: headers });
      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: errText });
      }
      const data = await response.json();
      const voices = (data.data || []).map(function (v) {
        return { voice_id: v.id, name: v.name, desc: v.description || "", gender: v.gender || "" };
      });
      return res.status(200).json({ voices: voices });
    }

    if (action === "speak") {
      const response = await fetch("https://api.cartesia.ai/tts/bytes", {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, headers),
        body: JSON.stringify({
          model_id: CARTESIA_MODEL,
          transcript: req.body.text,
          voice: req.body.voiceId,
          output_format: { container: "mp3", sample_rate: 44100, bit_rate: 128000 },
          language: req.body.language || "es",
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: errText });
      }
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return res.status(200).json({ audioBase64: base64 });
    }

    return res.status(400).json({ error: "Accion no valida" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

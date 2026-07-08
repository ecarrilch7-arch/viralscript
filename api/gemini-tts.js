const GEMINI_VOICES = [
  "Zephyr","Puck","Charon","Kore","Fenrir","Leda","Orus","Aoede",
  "Callirrhoe","Autonoe","Enceladus","Iapetus","Umbriel","Algieba",
  "Despina","Erinome","Algenib","Rasalgethi","Laomedeia","Achernar",
  "Alnilam","Schedar","Gacrux","Pulcherrima","Achird","Zubenelgenubi",
  "Vindemiatrix","Sadachbia","Sadaltager","Sulafat"
];

function buildWavBuffer(pcmBuffer, sampleRate, channels, bitDepth) {
  const byteRate = sampleRate * channels * (bitDepth / 8);
  const blockAlign = channels * (bitDepth / 8);
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcmBuffer]);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const action = req.body.action;
    const apiKey = req.body.apiKey;

    if (action === "voices") {
      return res.status(200).json({ voices: GEMINI_VOICES });
    }

    if (action === "speak") {
      const voiceName = req.body.voiceId || "Kore";
      const text = req.body.text;
      const model = "gemini-2.5-flash-preview-tts";
      const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } }
            }
          }
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: errText });
      }

      const data = await response.json();
      const part = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0];
      const base64Pcm = part && part.inlineData && part.inlineData.data;
      if (!base64Pcm) {
        return res.status(500).json({ error: "Gemini no devolvio audio. Verifica tu API key." });
      }

      const pcmBuffer = Buffer.from(base64Pcm, "base64");
      const wavBuffer = buildWavBuffer(pcmBuffer, 24000, 1, 16);
      const base64Wav = wavBuffer.toString("base64");
      return res.status(200).json({ audioBase64: base64Wav });
    }

    return res.status(400).json({ error: "Accion no valida" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

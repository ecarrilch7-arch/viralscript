export default function handler(req, res) {
  const { clientId, redirectUri, state } = req.query;
  if (!clientId || !redirectUri) {
    return res.status(400).json({ error: "Falta clientId o redirectUri" });
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/youtube.upload",
    access_type: "offline",
    prompt: "consent",
  });
  // "state" viaja clientId/clientSecret de forma segura hasta el callback: Google lo
  // reenvia intacto junto con el "code", sin exigir que su contenido este pre-registrado
  // (a diferencia del redirect_uri, que si debe ser un match exacto de lo registrado).
  if (state) params.set("state", state);
  res.redirect("https://accounts.google.com/o/oauth2/v2/auth?" + params.toString());
}

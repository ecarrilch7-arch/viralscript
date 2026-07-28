export default function handler(req, res) {
  const { clientId, redirectUri } = req.query;
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
  res.redirect("https://accounts.google.com/o/oauth2/v2/auth?" + params.toString());
}

export default async function handler(req, res) {
  const { code, clientId, clientSecret, redirectUri } = req.query;
  if (!code) return res.status(400).send("Falta el codigo de autorizacion.");

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(data.error_description || "Error obteniendo el token.");

    res.setHeader("Content-Type", "text/html");
    res.send(
      "<html><body style='font-family:sans-serif;background:#0a0a0f;color:#e8e8f0;padding:40px;text-align:center;'>" +
      "<h2>✅ Conectado con YouTube</h2>" +
      "<p>Copia este codigo y pegalo en el formulario del canal en ViralScript:</p>" +
      "<textarea readonly style='width:90%;max-width:500px;height:80px;padding:12px;font-size:14px;'>" +
      (data.refresh_token || "NO SE RECIBIO REFRESH TOKEN — revoca el acceso en https://myaccount.google.com/permissions y vuelve a intentar") +
      "</textarea>" +
      "</body></html>"
    );
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
}

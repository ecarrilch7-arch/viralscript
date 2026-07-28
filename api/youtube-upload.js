export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo no permitido" });
  const { clientId, clientSecret, refreshToken, title, description, videoBase64, privacyStatus } = req.body;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error_description || "Error refrescando el token.");
    const accessToken = tokenData.access_token;

    const metadata = {
      snippet: {
        title: title || "Video sin titulo",
        description: description || "",
        categoryId: "22",
      },
      status: {
        privacyStatus: privacyStatus || "private",
        selfDeclaredMadeForKids: false,
      },
    };

    const videoBuffer = Buffer.from(videoBase64, "base64");
    const boundary = "viralscript_boundary_" + Date.now();
    const bodyParts = [
      "--" + boundary,
      "Content-Type: application/json; charset=UTF-8",
      "",
      JSON.stringify(metadata),
      "--" + boundary,
      "Content-Type: video/mp4",
      "",
    ].join("\r\n");
    const closing = "\r\n--" + boundary + "--";

    const multipartBody = Buffer.concat([
      Buffer.from(bodyParts + "\r\n", "utf-8"),
      videoBuffer,
      Buffer.from(closing, "utf-8"),
    ]);

    const uploadRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "multipart/related; boundary=" + boundary,
        },
        body: multipartBody,
      }
    );
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(uploadData.error?.message || "Error subiendo el video.");

    res.status(200).json({ videoId: uploadData.id, url: "https://youtube.com/watch?v=" + uploadData.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

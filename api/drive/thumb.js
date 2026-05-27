export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).end();

  const { fileId, sz } = req.query;
  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) return res.status(400).end();

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return res.status(500).end();

  // Validate size param (numeric only, 100-2000)
  const size = Math.min(2000, Math.max(100, parseInt(sz) || 400));

  try {
    const metaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=thumbnailLink&key=${encodeURIComponent(apiKey)}`
    );
    if (!metaRes.ok) return res.status(metaRes.status).end();

    const meta = await metaRes.json();
    if (!meta.thumbnailLink) return res.status(404).end();

    const thumbUrl = meta.thumbnailLink.replace(/=s\d+$/, `=s${size}`);
    const imgRes = await fetch(thumbUrl);
    if (!imgRes.ok) return res.status(imgRes.status).end();

    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.setHeader("Content-Type", imgRes.headers.get("content-type") || "image/jpeg");
    res.send(Buffer.from(await imgRes.arrayBuffer()));
  } catch {
    res.status(502).end();
  }
}

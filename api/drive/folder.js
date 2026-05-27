export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { folderId } = req.query;
  if (!folderId || !/^[a-zA-Z0-9_-]+$/.test(folderId))
    return res.status(400).json({ error: "Invalid folderId" });

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`);
  url.searchParams.set("fields", "files(id,name,createdTime,imageMediaMetadata,thumbnailLink,mimeType)");
  url.searchParams.set("orderBy", "createdTime");
  url.searchParams.set("pageSize", "100");
  url.searchParams.set("key", apiKey);

  try {
    const driveRes = await fetch(url.toString());
    if (!driveRes.ok) {
      const err = await driveRes.json().catch(() => ({}));
      if (driveRes.status === 404) return res.status(404).json({ error: "Folder not found or not public" });
      return res.status(502).json({ error: err?.error?.message || "Drive API error" });
    }
    const data = await driveRes.json();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(200).json({ files: data.files || [] });
  } catch (e) {
    return res.status(502).json({ error: "Failed to reach Google Drive API" });
  }
}

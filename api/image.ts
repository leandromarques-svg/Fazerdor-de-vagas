// Simple image proxy for Vercel/Serverless
// Usage: GET /api/image?url=<encoded_url>
// This fetches the remote resource and returns it with CORS headers.

export default async function handler(req: any, res: any) {
  try {
    const url = (req.query && req.query.url) || (req.url && new URL(req.url, `http://${req.headers.host}`).searchParams.get('url'));
    if (!url) return res.status(400).send('Missing url parameter');

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return res.status(400).send('Invalid url parameter');
    }

    // Allowlist hosts to reduce abuse. Add your domains here.
    const allowedHosts = ['metarh.com.br', 'supabase.co'];
    const hostname = parsedUrl.hostname;
    const ok = allowedHosts.some(h => hostname === h || hostname.endsWith('.' + h));
    if (!ok) return res.status(403).send('Host not allowed');

    const upstream = await fetch(url);
    if (!upstream.ok) return res.status(upstream.status).send('Upstream error');

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).end(buffer);
  } catch (err: any) {
    console.error('Proxy error:', err?.message || err);
    try { return (req.res || res).status(500).send('Proxy error'); } catch (e) { return; }
  }
}

/**
 * Google Merchant Center Product Feed Generator
 * Fetches live catalog items from YWS Global API and creates public/google-feed.xml
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.VITE_BACKEND_TARGET || 'https://api.ywsglobal.com';
const SITE_URL = 'https://ywsglobal.com';

const escapeXml = (unsafe) => {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const cleanTextAndEscapeXml = (unsafe, maxLen = 150) => {
  if (!unsafe) return '';
  // 1. Strip HTML tags, remove illegal XML control characters, normalize whitespace
  const plain = String(unsafe)
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  // 2. SLICE FIRST before escaping so XML entities like &amp; are never cut in half!
  const sliced = maxLen && plain.length > maxLen ? plain.slice(0, maxLen).trim() : plain;
  // 3. Escape for XML
  return escapeXml(sliced);
};

const cleanUrlAndEscapeXml = (unsafeUrl) => {
  if (!unsafeUrl) return '';
  const trimmed = String(unsafeUrl).trim();
  // Replace raw '&' in URLs with '&amp;' for valid XML
  return escapeXml(trimmed);
};

async function getGuestToken() {
  try {
    const loginRes = await fetch(`${API_URL}/api/auth/user/guest/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (loginRes.ok) {
      const data = await loginRes.json();
      return data?.token || null;
    }
  } catch (e) {
    console.warn('[Google Feed Generator] Guest login failed:', e.message);
  }
  return null;
}

async function generateFeed() {
  const TARGET_LIMIT = process.env.FEED_LIMIT || 5000;
  console.log(`[Google Feed Generator] Authenticating with ${API_URL}...`);
  const token = await getGuestToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  console.log(`[Google Feed Generator] Fetching ${TARGET_LIMIT} products from ${API_URL}/api/user/product/all...`);
  let products = [];

  try {
    const res = await fetch(`${API_URL}/api/user/product/all?limit=${TARGET_LIMIT}`, { headers });
    if (res.ok) {
      const json = await res.json();
      products = json.data || [];
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(`[Google Feed Generator] Failed to fetch live products: ${err.message}`);
    process.exit(1);
  }

  const validProducts = products.filter((p) => {
    const price = Number(p.sellPrice ?? p.price ?? 0);
    return p.id && p.name && price > 0;
  });

  if (validProducts.length === 0) {
    console.error('[Google Feed Generator] No valid products (with id, name, price > 0) found. Aborting overwrite.');
    process.exit(1);
  }

  const itemsXml = validProducts.map((p) => {
    const id = p.id;
    const name = cleanTextAndEscapeXml(p.name, 150);
    const description = cleanTextAndEscapeXml(p.shortDescription || p.name || 'Verified store inventory at your door', 5000);
    const link = cleanUrlAndEscapeXml(`${SITE_URL}/product/${id}`);
    const rawImg = p.image || (Array.isArray(p.media) && p.media[0]?.url) || `${SITE_URL}/assets/hero-drop.jpg`;
    const fullImg = rawImg.startsWith('http') ? rawImg : `${SITE_URL}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`;
    const imageLink = cleanUrlAndEscapeXml(fullImg);
    const price = Number(p.sellPrice ?? p.price ?? 0).toFixed(2);
    const rawBrand = (Array.isArray(p.vendor) ? p.vendor[0]?.name : p.vendor?.name) || 'Yorder';
    const brand = cleanTextAndEscapeXml(rawBrand, 70);
    const isOutOfStock = Number(p.availableQuantity ?? 0) <= 0 && p.availableQuantity !== undefined;

    return `    <item>
      <g:id>${id}</g:id>
      <g:title>${name}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${isOutOfStock ? 'out_of_stock' : 'in_stock'}</g:availability>
      <g:price>${price} INR</g:price>
      <g:brand>${brand}</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:shipping>
        <g:country>IN</g:country>
        <g:service>Express Doorstep Trial</g:service>
        <g:price>0.00 INR</g:price>
      </g:shipping>
    </item>`;
  }).join('\n');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Yorder — Real stores, real stock</title>
    <link>${SITE_URL}</link>
    <description>Every item sits on a real shelf in a physical showroom. Instant door trials.</description>
${itemsXml}
  </channel>
</rss>
`;

  const outputPath = path.resolve(__dirname, '../public/google-feed.xml');
  fs.writeFileSync(outputPath, xmlContent.trim(), 'utf-8');
  console.log(`[Google Feed Generator] Successfully wrote ${validProducts.length} products to ${outputPath}`);
}

generateFeed().catch(console.error);

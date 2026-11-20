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

const KEEP_UPPER = new Set([
  'OG', 'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII', 'XXI',
  'UK', 'US', 'EU', 'LED', 'USB', 'HD', 'FHD', 'UHD', '4K', 'RGB', 'RTX',
  'GTX', 'SSD', 'RAM', 'GB', 'TB', 'ML', 'GM', 'KG', 'XL', 'XXL', 'XS', 'SPF',
]);

const normalizeTitleCase = (str) => {
  if (!str) return '';
  // Replace mangled '{' or '}' separators from vendor imports with '-'
  let cleaned = String(str).replace(/[{}]/g, '-').replace(/\s+-\s+/g, ' - ').replace(/\s+/g, ' ').trim();
  // If more than 65% of alphabetic characters are uppercase, convert to Title Case to satisfy Google editorial rules
  const letters = cleaned.replace(/[^a-zA-Z]/g, '');
  const upperCount = cleaned.replace(/[^A-Z]/g, '').length;
  if (letters.length > 6 && upperCount / letters.length > 0.65) {
    cleaned = cleaned
      .split(' ')
      .map((word) => {
        const bare = word.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (KEEP_UPPER.has(bare)) return bare;
        if (word.length <= 1) return word.toUpperCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
  return cleaned;
};

const cleanTextAndEscapeXml = (unsafe, maxLen = 150, isTitle = false) => {
  if (!unsafe) return '';
  // 1. Strip HTML tags, remove illegal XML control characters, normalize whitespace
  let plain = String(unsafe)
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[{}]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  if (isTitle) {
    plain = normalizeTitleCase(plain);
  }
  // 2. SLICE FIRST before escaping so XML entities like &amp; are never cut in half!
  const sliced = maxLen && plain.length > maxLen ? plain.slice(0, maxLen).trim() : plain;
  // 3. Escape for XML
  return escapeXml(sliced);
};

const cleanUrlAndEscapeXml = (unsafeUrl) => {
  if (!unsafeUrl) return '';
  const trimmed = String(unsafeUrl).trim();
  return escapeXml(trimmed);
};

// Google Merchant Center only accepts standard web raster image formats (JPEG, PNG, WebP, GIF)
const isValidGoogleImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  if (!clean.startsWith('http')) return false;
  if (/\.(html|php|octet-stream|avif|svg|mp4|mov)/i.test(clean)) return false;
  if (/charset=/i.test(clean)) return false;
  return /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(clean);
};

// Exact match with src/api/products.api.ts and ProductDetailPage.tsx inventory logic
const computeStockAndPrice = (bp) => {
  const vendor = Array.isArray(bp.vendor) ? bp.vendor[0] : bp.vendor;
  const isVendorManageInventory =
    vendor?.is_vendor_manage_inventory === true ||
    vendor?.is_vendor_manage_inventory === 1 ||
    vendor?.is_vendor_manage_inventory === '1';
  const variableProducts = Array.isArray(bp.variableProducts) ? bp.variableProducts : [];

  let isOutOfStock = false;
  if (!isVendorManageInventory) {
    isOutOfStock = false;
  } else if (variableProducts.length > 0) {
    let allVariantsOut = true;
    let anyQtySpecified = false;
    for (const v of variableProducts) {
      const q = v?.availableQty ?? v?.availableQuantity;
      if (q !== undefined && q !== null) {
        anyQtySpecified = true;
        if (Number(q) > 0) allVariantsOut = false;
      }
    }
    if (anyQtySpecified) {
      isOutOfStock = allVariantsOut;
    } else {
      const baseQty = bp.availableQuantity ?? bp.availableQty;
      isOutOfStock = baseQty !== undefined && baseQty !== null ? Number(baseQty) <= 0 : false;
    }
  } else {
    const baseQty = bp.availableQuantity ?? bp.availableQty;
    isOutOfStock = baseQty !== undefined && baseQty !== null ? Number(baseQty) <= 0 : false;
  }

  // Match ProductDetailPage activeVariant price logic
  let selectedIdx = 0;
  if (variableProducts.length > 0 && isVendorManageInventory) {
    const firstInStock = variableProducts.findIndex((v) => {
      const q = Number(v?.availableQty ?? v?.availableQuantity ?? 0);
      return q > 0;
    });
    if (firstInStock >= 0) selectedIdx = firstInStock;
  }
  const activeVariant = variableProducts[selectedIdx];
  const basePrice = Number(bp.sellPrice ?? bp.price ?? 0);
  const activePrice = Number(activeVariant?.sellPrice ?? activeVariant?.price ?? basePrice);

  return { isOutOfStock, activePrice };
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
  const TARGET_LIMIT = Number(process.env.FEED_LIMIT || 5000);
  const FETCH_POOL = Math.round(TARGET_LIMIT * 1.15); // Fetch extra to replace products filtered out due to broken images
  console.log(`[Google Feed Generator] Authenticating with ${API_URL}...`);
  const token = await getGuestToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  console.log(`[Google Feed Generator] Fetching pool of ${FETCH_POOL} products from ${API_URL}/api/user/product/all...`);
  let products = [];

  try {
    const res = await fetch(`${API_URL}/api/user/product/all?limit=${FETCH_POOL}`, { headers });
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

  const validProducts = [];
  let skippedBrokenImages = 0;

  for (const p of products) {
    if (!p.id || !p.name) continue;
    const rawImg = p.image || (Array.isArray(p.media) && p.media[0]?.url) || '';
    const fullImg = rawImg.startsWith('http') ? rawImg : (rawImg ? `${SITE_URL}${rawImg.startsWith('/') ? '' : '/'}${rawImg}` : '');

    if (!isValidGoogleImageUrl(fullImg)) {
      skippedBrokenImages++;
      continue;
    }

    const { isOutOfStock, activePrice } = computeStockAndPrice(p);
    if (activePrice <= 0) continue;

    validProducts.push({ p, fullImg, isOutOfStock, activePrice });
    if (validProducts.length >= TARGET_LIMIT) break;
  }

  console.log(`[Google Feed Generator] Filtered out ${skippedBrokenImages} broken/unsupported image URLs.`);

  if (validProducts.length === 0) {
    console.error('[Google Feed Generator] No valid products found. Aborting overwrite.');
    process.exit(1);
  }

  const itemsXml = validProducts.map(({ p, fullImg, isOutOfStock, activePrice }) => {
    const id = p.id;
    const name = cleanTextAndEscapeXml(p.name, 150, true);
    const rawBrand = (Array.isArray(p.vendor) ? p.vendor[0]?.name : p.vendor?.name) || 'Yorder';
    const brand = cleanTextAndEscapeXml(rawBrand, 70, false);

    let rawDesc = String(p.shortDescription || p.name || '').trim();
    if (rawDesc.length < 40 || rawDesc.toLowerCase() === String(p.name).trim().toLowerCase()) {
      rawDesc = `${normalizeTitleCase(p.name)} by ${rawBrand}. Authentic showroom stock in Mumbai, available for instant 10-minute doorstep trial and express delivery on Yorder.`;
    }
    const description = cleanTextAndEscapeXml(rawDesc, 5000, false);

    const link = cleanUrlAndEscapeXml(`${SITE_URL}/product/${id}`);
    const imageLink = cleanUrlAndEscapeXml(fullImg);
    const price = activePrice.toFixed(2);

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
        <g:price>10.00 INR</g:price>
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
  console.log(`[Google Feed Generator] Successfully wrote ${validProducts.length} clean products to ${outputPath}`);
}

generateFeed().catch(console.error);

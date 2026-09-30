import { getStore } from "@netlify/blobs";

const STORE_NAME = "hotmart-access";
const APPROVED_EVENTS = new Set(["PURCHASE_APPROVED", "PURCHASE_COMPLETE"]);
const REVOKED_EVENTS = new Set([
  "PURCHASE_REFUNDED",
  "PURCHASE_CHARGEBACK",
  "PURCHASE_CANCELED",
  "PURCHASE_EXPIRED",
  "PURCHASE_PROTEST",
]);

const cleanEmail = (value) => String(value || "").trim().toLowerCase();
const cleanId = (value) => String(value ?? "").trim().toLowerCase();
const keyFor = (email) => `email:${encodeURIComponent(email)}`;

function collectProductIds(data) {
  const ids = new Set();
  const add = (value) => {
    const id = cleanId(value);
    if (id) ids.add(id);
  };
  const product = data?.product || {};
  add(product.id);
  add(product.ucode);
  add(product.external_id);
  add(product.sku);
  add(data?.purchase?.offer?.code);
  for (const item of product.content?.products || []) {
    add(item.id);
    add(item.ucode);
    add(item.external_id);
    add(item.sku);
  }
  return [...ids];
}

export default async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const expected = process.env.HOTMART_HOTTOK;
  const received = request.headers.get("x-hotmart-hottok") || request.headers.get("hottok");
  if (!expected || !received || received !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const event = String(payload?.event || "").toUpperCase();
  const email = cleanEmail(payload?.data?.buyer?.email || payload?.buyer?.email);
  if (!email || (!APPROVED_EVENTS.has(event) && !REVOKED_EVENTS.has(event))) {
    return new Response("OK", { status: 200 });
  }

  const store = getStore(STORE_NAME);
  const key = keyFor(email);
  const current = (await store.get(key, { type: "json" })) || { email, products: [], updatedAt: null };
  const ids = collectProductIds(payload?.data || payload);
  const products = new Set((current.products || []).map(cleanId));

  if (APPROVED_EVENTS.has(event)) ids.forEach((id) => products.add(id));
  if (REVOKED_EVENTS.has(event)) ids.forEach((id) => products.delete(id));

  await store.setJSON(key, {
    email,
    products: [...products],
    updatedAt: new Date().toISOString(),
    lastEvent: event,
  });

  return new Response("OK", { status: 200 });
};

import { getStore } from "@netlify/blobs";

const STORE_NAME = "hotmart-access";
const cleanEmail = (value) => String(value || "").trim().toLowerCase();
const keyFor = (email) => `email:${encodeURIComponent(email)}`;

export default async (request) => {
  if (request.method !== "POST" && request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  let email = "";
  if (request.method === "POST") {
    try {
      email = cleanEmail((await request.json())?.email);
    } catch {
      email = "";
    }
  } else {
    email = cleanEmail(new URL(request.url).searchParams.get("email"));
  }

  if (!email || !email.includes("@")) {
    return new Response(JSON.stringify({ products: [] }), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }

  const store = getStore(STORE_NAME);
  const record = await store.get(keyFor(email), { type: "json" });
  return new Response(JSON.stringify({
    email,
    products: Array.isArray(record?.products) ? record.products : [],
    updatedAt: record?.updatedAt || null,
  }), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
};

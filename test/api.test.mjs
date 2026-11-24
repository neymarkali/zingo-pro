// Run: node --experimental-sqlite test/api.test.mjs  (Node 22+). D1 is emulated with node:sqlite.
import { DatabaseSync } from "node:sqlite";
import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import worker from "../worker.js";

const sql = new DatabaseSync(":memory:");
const wrap = (s, args = []) => ({
  bind: (...a) => wrap(s, a),
  run: async () => { const r = sql.prepare(s).run(...args); return { meta: { last_row_id: Number(r.lastInsertRowid) } }; },
  first: async () => sql.prepare(s).get(...args) || null,
  all: async () => ({ results: sql.prepare(s).all(...args) }),
});
const DB = { prepare: (s) => wrap(s), batch: async (st) => { for (const x of st) await x.run(); return []; } };
const env = { DB, ASSETS: { fetch: async () => new Response("asset") }, TELEGRAM_BOT_TOKEN: "123:TEST", DEV_AUTH: "1", ADMIN_IDS: "1" };
const call = async (path, { user = "1", body, init } = {}) => {
  const h = { "X-Dev-User": user };
  if (init) { delete h["X-Dev-User"]; h["X-Telegram-Init-Data"] = init; }
  const r = await worker.fetch(new Request("https://x" + path, { method: body ? "POST" : "GET", headers: h, body: body && JSON.stringify(body) }), env);
  return { s: r.status, ...(await r.json().catch(() => ({}))) };
};
const t0 = Math.floor(Date.now() / 1000), lock = t0 + 3600;

// real Telegram initData signature
const mk = (id, tok = env.TELEGRAM_BOT_TOKEN) => {
  const p = new URLSearchParams({ auth_date: String(t0), user: JSON.stringify({ id, first_name: "A" }) });
  const chk = [...p.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => `${k}=${v}`).join("\n");
  const sec = createHmac("sha256", "WebAppData").update(tok).digest();
  p.set("hash", createHmac("sha256", sec).update(chk).digest("hex"));
  return p.toString();
};
assert.equal((await call("/api/me", { init: mk(7) })).s, 200, "valid initData");
assert.equal((await call("/api/me", { init: mk(7, "9:OTHER") })).s, 401, "bad signature");
assert.equal((await call("/api/me", { init: "garbage" })).s, 401);
env.DEV_AUTH = "0"; assert.equal((await call("/api/me")).s, 401, "dev header ignored when off"); env.DEV_AUTH = "1";

// profile + names
assert.equal((await call("/api/profile", { user: "2", body: { name: "Zingo" } })).error, "name_forbidden");
assert.equal((await call("/api/profile", { user: "2", body: { name: "زينغو" } })).error, "name_forbidden");
assert.equal((await call("/api/profile", { user: "2", body: { name: "ab" } })).error, "name_too_short");
assert.equal((await call("/api/profile", { user: "2", body: { name: "سلطان", emblem: 3 } })).ok, true);
assert.equal((await call("/api/profile", { user: "3", body: { name: "سلطان" } })).error, "name_taken");
assert.equal((await call("/api/profile", { user: "2", body: { name: "رعد" } })).error, "name_locked", "30-day lock");
assert.equal((await call("/api/profile", { user: "2", body: { frame: "diamond" } })).error, "frame_locked");
for (const [u, n] of [["3", "نجم"], ["4", "الصقر"], ["5", "بدر"]]) await call("/api/profile", { user: u, body: { name: n } });

// admin round (free) + access control
assert.equal((await call("/api/admin/round", { user: "2", body: {} })).s, 403);
const ms = [["BAR", "RMA"], ["INT", "MIL"], ["ARS", "CHE"]].map(([home, away], i) => ({ home, away, kickoff: lock + i * 60 }));
const rd = await call("/api/admin/round", { body: { tier: "free", title: "الجولة 1", lock_at: lock, matches: ms } });
assert.equal(rd.ok, true);
const R = await call("/api/round?tier=free", { user: "2" });
assert.equal(R.matches.length, 3);
const [a, b, c] = R.matches.map((m) => m.id);
assert.equal((await call("/api/round?tier=pro", { user: "2" })).s, 403, "pro needs subscription");

// predictions: save-once, tier gating, boost
assert.equal((await call("/api/predict", { user: "2", body: { match_id: a, wdl: "1", btts: "y" } })).ok, true);
assert.equal((await call("/api/predict", { user: "2", body: { match_id: a, wdl: "2" } })).error, "already_saved");
assert.equal((await call("/api/predict", { user: "2", body: { match_id: b, cor: "o" } })).error, "pro_only");
assert.equal((await call("/api/predict", { user: "2", body: { match_id: b, wdl: "X", boost: true } })).error, "pro_only");
assert.equal((await call("/api/total", { user: "2", body: { round_id: R.round.id, guess: 9 } })).ok, true);
assert.equal((await call("/api/total", { user: "2", body: { round_id: R.round.id, guess: 5 } })).error, "already_saved");
await call("/api/predict", { user: "3", body: { match_id: a, wdl: "2", btts: "n" } });
await call("/api/total", { user: "3", body: { round_id: R.round.id, guess: 10 } });
await call("/api/total", { user: "4", body: { round_id: R.round.id, guess: 4 } });
await call("/api/predict", { user: "4", body: { match_id: a, wdl: "1" } });

// pro/vip rules
await call("/api/admin/grant", { body: { tg: "2", tier: "vip", days: 30 } });
await call("/api/admin/grant", { body: { tg: "5", tier: "pro", days: 30 } });
const pr = await call("/api/admin/round", { body: { tier: "pro", title: "برو", lock_at: lock, matches: ms } });
const vr = await call("/api/admin/round", { body: { tier: "vip", title: "VIP", lock_at: lock, matches: [{ home: "RMA", away: "BAR", kickoff: lock, str_home: 90, str_away: 70 }, ...ms] } });
const P = await call("/api/round?tier=pro", { user: "5" }), V = await call("/api/round?tier=vip", { user: "2" });
const [p1, p2] = P.matches.map((m) => m.id);
assert.equal((await call("/api/predict", { user: "5", body: { match_id: p1, wdl: "1", cor: "o", car: "u", boost: true } })).ok, true);
assert.equal((await call("/api/predict", { user: "5", body: { match_id: p2, wdl: "1", boost: true } })).error, "boost_used", "one boost per round");
assert.equal((await call("/api/predict", { user: "5", body: { match_id: p2, dc: "1X" } })).error, "vip_only");
assert.equal((await call("/api/round?tier=vip", { user: "5" })).s, 403);
const big = V.matches.find((m) => m.home === "RMA");
assert.ok(big.points.wdl["1"] < big.points.wdl["2"], "favourite pays less in VIP");
assert.equal((await call("/api/predict", { user: "2", body: { match_id: big.id, ex: { h: 2, a: 1 }, wdl: "1" } })).ok, true);
assert.equal((await call("/api/round?tier=vip", { user: "2" })).matches.find((m) => m.id === big.id).pick.wdl, null, "exact score drops other options");
assert.equal((await call("/api/profile", { user: "2", body: { frame: "diamond" } })).player.frame, "diamond", "vip owns diamond frame");

// settle free round: a 2-1 (3 goals), b 1-1 (2), c 0-0 (0) => total 5 ... user4 guessed 4 (off by 1), user2 9, user3 10
const st = await call("/api/admin/settle", { body: { round_id: rd.round_id, results: [{ match_id: a, hg: 2, ag: 1 }, { match_id: b, hg: 1, ag: 1 }, { match_id: c, hg: 0, ag: 0 }] } });
assert.equal(st.total_goals, 5);
const rk = await call("/api/ranking?tier=free", { user: "2" });
const pts = Object.fromEntries(rk.rows.map((r) => [r.name, r.points]));
assert.equal(pts["سلطان"], 2 + 1, "user2: wdl 2 + btts 1, total guess off by 4 -> 0");
assert.equal(pts["الصقر"], 2 + 2, "user4: wdl 2 + total off by 1 -> 2");
assert.equal(pts["نجم"], 0, "user3 wrong picks, total off by 5");
assert.equal(rk.rows[0].name, "الصقر");
assert.equal((await call("/api/me", { user: "4" })).frames[0], "gold", "weekly #1 gets gold frame");
assert.equal((await call("/api/predict", { user: "3", body: { match_id: b, wdl: "1" } })).error, "round_locked", "settled round closed");

// not found / assets
assert.equal((await call("/api/nope")).s, 404);
assert.equal(await (await worker.fetch(new Request("https://x/"), env)).text(), "asset");
console.log("ALL API TESTS PASSED");

// ZINGO API (rebuild). Cloudflare Worker + D1. Static design is served from ./public.
// Tiers: free | pro | vip. Points follow the agreed rules (see POINTS / settle()).

const POINTS = { wdl: 2, btts: 1, cor: 1, car: 1, ex: 5 };
const TOTAL_POINTS = [3, 2, 1]; // exact, off by 1, off by 2
const NAME_COOLDOWN_DAYS = 30;
const TIERS = ["free", "pro", "vip"];
const EMBLEM_COUNT = 20;
const FRAMES = ["diamond", "gold", "silver", "bronze", "aurora", "blaze"];

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS z_players (
    tg TEXT PRIMARY KEY, name TEXT NOT NULL, name_key TEXT NOT NULL UNIQUE,
    name_changed_at INTEGER NOT NULL, emblem INTEGER NOT NULL DEFAULT 0,
    frame TEXT, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS z_subs (
    tg TEXT NOT NULL, tier TEXT NOT NULL, ends_at INTEGER NOT NULL, PRIMARY KEY (tg, tier))`,
  `CREATE TABLE IF NOT EXISTS z_awards (
    tg TEXT NOT NULL, frame TEXT NOT NULL, round_id INTEGER, PRIMARY KEY (tg, frame))`,
  `CREATE TABLE IF NOT EXISTS z_rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT, tier TEXT NOT NULL, title TEXT NOT NULL,
    lock_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'open', total_goals INTEGER)`,
  `CREATE TABLE IF NOT EXISTS z_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT, round_id INTEGER NOT NULL, home TEXT NOT NULL,
    away TEXT NOT NULL, kickoff INTEGER NOT NULL, cor_line REAL, car_line REAL,
    ph REAL, pd REAL, pa REAL, hg INTEGER, ag INTEGER, corners INTEGER, cards INTEGER)`,
  `CREATE TABLE IF NOT EXISTS z_picks (
    tg TEXT NOT NULL, match_id INTEGER NOT NULL, round_id INTEGER NOT NULL,
    wdl TEXT, btts TEXT, cor TEXT, car TEXT, dc TEXT, ex_h INTEGER, ex_a INTEGER,
    boost INTEGER NOT NULL DEFAULT 0, saved_at INTEGER NOT NULL, points INTEGER,
    PRIMARY KEY (tg, match_id))`,
  `CREATE TABLE IF NOT EXISTS z_totals (
    tg TEXT NOT NULL, round_id INTEGER NOT NULL, guess INTEGER NOT NULL,
    saved_at INTEGER NOT NULL, points INTEGER, PRIMARY KEY (tg, round_id))`,
  `CREATE INDEX IF NOT EXISTS z_picks_round ON z_picks(round_id, tg)`,
];

let schemaReady = false;
async function ensureSchema(env) {
  if (schemaReady) return;
  await env.DB.batch(SCHEMA.map((s) => env.DB.prepare(s)));
  try { await env.DB.prepare("ALTER TABLE z_matches ADD COLUMN ext_id INTEGER").run(); } catch (e) { /* column already exists */ }
  schemaReady = true;
}

// ---------- helpers ----------
const now = () => Math.floor(Date.now() / 1000);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
const fail = (error, status = 400) => json({ ok: false, error }, status);
const adminIds = (env) => new Set(String(env.ADMIN_IDS || "994708968").split(",").map((s) => s.trim()));

// ---------- Telegram auth ----------
const hex = (b) => Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg)));
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
// Bot tokens accepted for initData: the new bot (TELEGRAM_BOT_TOKEN_NEW) and the existing one (TELEGRAM_BOT_TOKEN).
const botTokens = (env) => [env.TELEGRAM_BOT_TOKEN_NEW, env.TELEGRAM_BOT_TOKEN].filter(Boolean).map(String);
async function authUser(request, env) {
  if (env.DEV_AUTH === "1") {
    const dev = request.headers.get("X-Dev-User");
    if (dev) return { id: String(dev) };
  }
  const initData = request.headers.get("X-Telegram-Init-Data") || "";
  if (!initData) return { reason: "no_init_data" };
  const tokens = botTokens(env);
  if (!tokens.length) return { reason: "no_token" };
  const params = new URLSearchParams(initData);
  const received = params.get("hash");
  if (!received) return { reason: "no_hash" };
  params.delete("hash");
  const check = [...params.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => `${k}=${v}`).join("\n");
  let ok = false;
  for (const tok of tokens) {
    const secret = await hmac(new TextEncoder().encode("WebAppData"), tok);
    if (safeEqual(hex(await hmac(secret, check)), received.toLowerCase())) { ok = true; break; }
  }
  if (!ok) return { reason: "bad_signature" };
  const age = now() - Number(params.get("auth_date") || 0);
  if (!(age >= -60 && age <= 86400)) return { reason: "expired" };
  try {
    const u = JSON.parse(params.get("user") || "null");
    return u && u.id ? { id: String(u.id) } : { reason: "no_user" };
  } catch {
    return { reason: "no_user" };
  }
}

// ---------- names ----------
function normName(v) {
  return String(v || "")
    .normalize("NFKC").replace(/[​-‍﻿]/g, "").toLowerCase().trim()
    .replace(/[ً-ٰٟۖ-ۭ]/g, "")
    .replace(/[إأآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/ة/g, "ه")
    .replace(/[\s_\-.'`~!@#$%^&*()+={}[\]|\\:;"<>?,/،؛؟]+/g, "");
}
function forbiddenName(key) {
  if (!key) return true;
  if (/زين?[غجق]و|زنغو|ز[يى]نغ/.test(key)) return true;
  const latin = key.replace(/0/g, "o").replace(/[1|!l]/g, "i").replace(/3/g, "e").replace(/[4@]/g, "a").replace(/5/g, "s").replace(/7/g, "t");
  return /z[i]?ngo|zinqo|zingo/.test(latin);
}
function checkName(raw) {
  const name = String(raw || "").normalize("NFKC").trim();
  if (name.length < 3) return { error: "name_too_short" };
  if (name.length > 16) return { error: "name_too_long" };
  const key = normName(name);
  if (forbiddenName(key)) return { error: "name_forbidden" };
  return { name, key };
}

// ---------- access ----------
async function access(env, tg) {
  if (adminIds(env).has(tg)) return { pro: true, vip: true, admin: true };
  const rows = await env.DB.prepare("SELECT tier FROM z_subs WHERE tg=? AND ends_at>?").bind(tg, now()).all();
  const t = new Set((rows.results || []).map((r) => r.tier));
  const vip = t.has("vip");
  return { pro: vip || t.has("pro"), vip, admin: false };
}
const canPlay = (acc, tier) => tier === "free" || (tier === "pro" && acc.pro) || (tier === "vip" && acc.vip);

// ---------- points ----------
function dynPoints(m) {
  // VIP: harder outcomes pay more. Probabilities are fixed when the round is created.
  const p = { 1: m.ph, X: m.pd, 2: m.pa };
  const wdl = {};
  for (const k of ["1", "X", "2"]) wdl[k] = clamp(Math.round(1.2 / p[k]), 1, 6);
  return {
    wdl,
    dc: {
      "1X": clamp(Math.round(0.9 / (m.ph + m.pd)), 1, 4),
      "12": clamp(Math.round(0.9 / (m.ph + m.pa)), 1, 4),
      X2: clamp(Math.round(0.9 / (m.pd + m.pa)), 1, 4),
    },
  };
}
function scorePick(tier, m, p) {
  if (m.hg == null || m.ag == null) return null;
  let pts = 0;
  if (p.ex_h != null) {
    pts = p.ex_h === m.hg && p.ex_a === m.ag ? POINTS.ex : 0;
  } else {
    const res = m.hg > m.ag ? "1" : m.hg < m.ag ? "2" : "X";
    const dyn = tier === "vip" && m.ph ? dynPoints(m) : null;
    if (p.wdl && p.wdl === res) pts += dyn ? dyn.wdl[res] : POINTS.wdl;
    if (p.dc && dyn && p.dc.includes(res === "X" ? "X" : res)) pts += dyn.dc[p.dc];
    if (p.btts && (p.btts === "y") === (m.hg > 0 && m.ag > 0)) pts += POINTS.btts;
    if (p.cor && m.corners != null && m.cor_line != null && (p.cor === "o") === (m.corners > m.cor_line)) pts += POINTS.cor;
    if (p.car && m.cards != null && m.car_line != null && (p.car === "o") === (m.cards > m.car_line)) pts += POINTS.car;
  }
  return p.boost ? pts * 2 : pts;
}

// ---------- handlers ----------
async function me(env, user) {
  const p = await env.DB.prepare("SELECT * FROM z_players WHERE tg=?").bind(user.id).first();
  const acc = await access(env, user.id);
  const awards = p ? ((await env.DB.prepare("SELECT frame FROM z_awards WHERE tg=?").bind(user.id).all()).results || []).map((r) => r.frame) : [];
  const days = p ? Math.max(0, Math.ceil((p.name_changed_at + NAME_COOLDOWN_DAYS * 86400 - now()) / 86400)) : 0;
  return json({ ok: true, player: p && { name: p.name, emblem: p.emblem, frame: p.frame }, access: acc, name_locked_days: days, frames: awards });
}

async function saveProfile(env, user, body) {
  const acc = await access(env, user.id);
  const cur = await env.DB.prepare("SELECT * FROM z_players WHERE tg=?").bind(user.id).first();
  const t = now();
  let emblem = body.emblem != null ? Number(body.emblem) : cur ? cur.emblem : 0;
  if (!Number.isInteger(emblem) || emblem < 0 || emblem >= EMBLEM_COUNT) return fail("bad_emblem");
  let frame = body.frame !== undefined ? body.frame : cur ? cur.frame : null;
  if (frame) {
    if (!FRAMES.includes(frame)) return fail("bad_frame");
    const owned = frame === "diamond" ? acc.vip : !!(await env.DB.prepare("SELECT 1 x FROM z_awards WHERE tg=? AND frame=?").bind(user.id, frame).first());
    if (!owned) return fail("frame_locked", 403);
  }
  let name = cur && cur.name, key = cur && cur.name_key, changed = cur ? cur.name_changed_at : t;
  if (body.name !== undefined && (!cur || body.name !== cur.name)) {
    if (cur && t < cur.name_changed_at + NAME_COOLDOWN_DAYS * 86400) return fail("name_locked", 403);
    const v = checkName(body.name);
    if (v.error) return fail(v.error);
    const dup = await env.DB.prepare("SELECT tg FROM z_players WHERE name_key=? AND tg<>?").bind(v.key, user.id).first();
    if (dup) return fail("name_taken", 409);
    name = v.name; key = v.key; changed = t;
  }
  if (!name) return fail("name_required");
  try {
    await env.DB.prepare(
      `INSERT INTO z_players (tg,name,name_key,name_changed_at,emblem,frame,created_at) VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(tg) DO UPDATE SET name=excluded.name,name_key=excluded.name_key,name_changed_at=excluded.name_changed_at,emblem=excluded.emblem,frame=excluded.frame`
    ).bind(user.id, name, key, changed, emblem, frame || null, t).run();
  } catch (e) {
    if (String(e).includes("UNIQUE")) return fail("name_taken", 409);
    throw e;
  }
  return me(env, user);
}

async function getRound(env, user, tier, roundId) {
  if (!TIERS.includes(tier)) return fail("bad_tier");
  const acc = await access(env, user.id);
  if (!canPlay(acc, tier)) return fail("subscription_required", 403);
  const r = roundId
    ? await env.DB.prepare("SELECT * FROM z_rounds WHERE id=? AND tier=?").bind(roundId, tier).first()
    : await env.DB.prepare("SELECT * FROM z_rounds WHERE tier=? ORDER BY (status='open') DESC, id DESC LIMIT 1").bind(tier).first();
  if (!r) return json({ ok: true, round: null });
  const ms = (await env.DB.prepare("SELECT * FROM z_matches WHERE round_id=? ORDER BY kickoff,id").bind(r.id).all()).results || [];
  const picks = (await env.DB.prepare("SELECT * FROM z_picks WHERE tg=? AND round_id=?").bind(user.id, r.id).all()).results || [];
  const tot = await env.DB.prepare("SELECT guess,points FROM z_totals WHERE tg=? AND round_id=?").bind(user.id, r.id).first();
  const byMatch = Object.fromEntries(picks.map((p) => [p.match_id, p]));
  const settled = r.status === "settled";
  return json({
    ok: true,
    round: { id: r.id, tier: r.tier, title: r.title, lock_at: r.lock_at, status: r.status, locked: now() >= r.lock_at, total_goals: settled ? r.total_goals : null },
    matches: ms.map((m) => ({
      id: m.id, home: m.home, away: m.away, kickoff: m.kickoff, cor_line: m.cor_line, car_line: m.car_line,
      points: tier === "vip" && m.ph ? dynPoints(m) : null,
      result: settled ? { hg: m.hg, ag: m.ag, corners: m.corners, cards: m.cards } : null,
      pick: byMatch[m.id] ? pickOut(byMatch[m.id]) : null,
    })),
    total: tot || null,
    boost_used: picks.some((p) => p.boost),
  });
}
const pickOut = (p) => ({ wdl: p.wdl, btts: p.btts, cor: p.cor, car: p.car, dc: p.dc, ex: p.ex_h != null ? { h: p.ex_h, a: p.ex_a } : null, boost: !!p.boost, points: p.points });

async function predict(env, user, b) {
  const m = await env.DB.prepare("SELECT m.*, r.tier, r.lock_at, r.status FROM z_matches m JOIN z_rounds r ON r.id=m.round_id WHERE m.id=?").bind(Number(b.match_id)).first();
  if (!m) return fail("match_not_found", 404);
  const acc = await access(env, user.id);
  if (!canPlay(acc, m.tier)) return fail("subscription_required", 403);
  if (!(await env.DB.prepare("SELECT 1 x FROM z_players WHERE tg=?").bind(user.id).first())) return fail("profile_required", 403);
  if (m.status !== "open" || now() >= m.lock_at) return fail("round_locked", 403);
  const oneOf = (v, set) => (v == null ? null : set.includes(v) ? v : false);
  let wdl = oneOf(b.wdl, ["1", "X", "2"]), btts = oneOf(b.btts, ["y", "n"]), cor = oneOf(b.cor, ["o", "u"]), car = oneOf(b.car, ["o", "u"]), dc = oneOf(b.dc, ["1X", "12", "X2"]);
  if ([wdl, btts, cor, car, dc].includes(false)) return fail("bad_pick");
  let exh = null, exa = null;
  if (b.ex) {
    if (m.tier !== "vip") return fail("vip_only", 403);
    exh = Number(b.ex.h); exa = Number(b.ex.a);
    if (!Number.isInteger(exh) || !Number.isInteger(exa) || exh < 0 || exa < 0 || exh > 9 || exa > 9) return fail("bad_pick");
    wdl = btts = cor = car = dc = null; // exact score locks the other options for this match only
  }
  if ((cor || car) && m.tier === "free") return fail("pro_only", 403);
  if (dc && m.tier !== "vip") return fail("vip_only", 403);
  const boost = b.boost ? 1 : 0;
  if (boost && m.tier === "free") return fail("pro_only", 403);
  if (!(wdl || btts || cor || car || dc || exh != null)) return fail("empty_pick");
  if (boost) {
    const used = await env.DB.prepare("SELECT 1 x FROM z_picks WHERE tg=? AND round_id=? AND boost=1").bind(user.id, m.round_id).first();
    if (used) return fail("boost_used", 409);
  }
  try {
    await env.DB.prepare("INSERT INTO z_picks (tg,match_id,round_id,wdl,btts,cor,car,dc,ex_h,ex_a,boost,saved_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(user.id, m.id, m.round_id, wdl, btts, cor, car, dc, exh, exa, boost, now()).run();
  } catch (e) {
    if (String(e).includes("UNIQUE") || String(e).includes("PRIMARY")) return fail("already_saved", 409);
    throw e;
  }
  return json({ ok: true });
}

async function saveTotal(env, user, b) {
  const r = await env.DB.prepare("SELECT * FROM z_rounds WHERE id=?").bind(Number(b.round_id)).first();
  if (!r) return fail("round_not_found", 404);
  const acc = await access(env, user.id);
  if (!canPlay(acc, r.tier)) return fail("subscription_required", 403);
  if (!(await env.DB.prepare("SELECT 1 x FROM z_players WHERE tg=?").bind(user.id).first())) return fail("profile_required", 403);
  const g = Number(b.guess);
  if (!Number.isInteger(g) || g < 0 || g > 99) return fail("bad_pick");
  if (r.status !== "open" || now() >= r.lock_at) return fail("round_locked", 403);
  try {
    await env.DB.prepare("INSERT INTO z_totals (tg,round_id,guess,saved_at) VALUES (?,?,?,?)").bind(user.id, r.id, g, now()).run();
  } catch (e) {
    if (String(e).includes("UNIQUE") || String(e).includes("PRIMARY")) return fail("already_saved", 409);
    throw e;
  }
  return json({ ok: true });
}

async function ranking(env, user, tier, roundId) {
  if (!TIERS.includes(tier)) return fail("bad_tier");
  const r = roundId
    ? await env.DB.prepare("SELECT * FROM z_rounds WHERE id=? AND tier=?").bind(roundId, tier).first()
    : await env.DB.prepare("SELECT * FROM z_rounds WHERE tier=? ORDER BY id DESC LIMIT 1").bind(tier).first();
  if (!r) return json({ ok: true, round_id: null, rows: [] });
  const q = await env.DB.prepare(
    `SELECT p.tg, p.name, p.emblem, p.frame,
       COALESCE((SELECT SUM(points) FROM z_picks WHERE tg=p.tg AND round_id=?1),0) + COALESCE((SELECT points FROM z_totals WHERE tg=p.tg AND round_id=?1),0) AS pts
     FROM z_players p
     WHERE p.tg IN (SELECT tg FROM z_picks WHERE round_id=?1 UNION SELECT tg FROM z_totals WHERE round_id=?1)
     ORDER BY pts DESC, p.name LIMIT 100`
  ).bind(r.id).all();
  const rows = (q.results || []).map((x, i) => ({ rank: i + 1, name: x.name, emblem: x.emblem, frame: x.frame, points: x.pts, me: x.tg === user.id }));
  return json({ ok: true, round_id: r.id, status: r.status, rows });
}

// ---------- admin ----------
async function adminRound(env, b) {
  if (!TIERS.includes(b.tier) || !Array.isArray(b.matches) || !b.matches.length || !b.lock_at) return fail("bad_round");
  const rr = await env.DB.prepare("INSERT INTO z_rounds (tier,title,lock_at) VALUES (?,?,?)").bind(b.tier, String(b.title || "جولة"), Number(b.lock_at)).run();
  const id = rr.meta.last_row_id;
  const rnd = (a) => a.sort(() => Math.random() - 0.5); // matches are shown in random order
  const stmts = rnd([...b.matches]).map((m) => {
    // optional team strengths (0-100) fix the VIP odds at creation time
    const d = (Number(m.str_home ?? 80) - Number(m.str_away ?? 80)) + 3;
    const ph0 = 1 / (1 + Math.pow(10, -d / 12)), pd = Math.max(0.18, 0.3 - 0.012 * Math.abs(d)), r = 1 - pd;
    return env.DB.prepare("INSERT INTO z_matches (round_id,home,away,kickoff,cor_line,car_line,ph,pd,pa,ext_id) VALUES (?,?,?,?,?,?,?,?,?,?)")
      .bind(id, m.home, m.away, Number(m.kickoff), m.cor_line ?? 9.5, m.car_line ?? 4.5, r * ph0, pd, r * (1 - ph0), m.ext_id ? Number(m.ext_id) : null);
  });
  await env.DB.batch(stmts);
  return json({ ok: true, round_id: id });
}

async function adminSettle(env, b) {
  const r = await env.DB.prepare("SELECT * FROM z_rounds WHERE id=?").bind(Number(b.round_id)).first();
  if (!r) return fail("round_not_found", 404);
  for (const x of b.results || []) {
    await env.DB.prepare("UPDATE z_matches SET hg=?,ag=?,corners=?,cards=? WHERE id=? AND round_id=?")
      .bind(x.hg, x.ag, x.corners ?? null, x.cards ?? null, x.match_id, r.id).run();
  }
  const ms = (await env.DB.prepare("SELECT * FROM z_matches WHERE round_id=?").bind(r.id).all()).results || [];
  if (ms.some((m) => m.hg == null)) return fail("results_incomplete");
  const byId = Object.fromEntries(ms.map((m) => [m.id, m]));
  const picks = (await env.DB.prepare("SELECT * FROM z_picks WHERE round_id=?").bind(r.id).all()).results || [];
  const ups = picks.map((p) => env.DB.prepare("UPDATE z_picks SET points=? WHERE tg=? AND match_id=?").bind(scorePick(r.tier, byId[p.match_id], p), p.tg, p.match_id));
  // total goals: nearest guess wins 3/2/1 depending on distance (0/1/2); ties share the same points
  const total = ms.reduce((s, m) => s + m.hg + m.ag, 0);
  const tots = (await env.DB.prepare("SELECT * FROM z_totals WHERE round_id=?").bind(r.id).all()).results || [];
  const best = tots.length ? Math.min(...tots.map((t) => Math.abs(t.guess - total))) : 99;
  for (const t of tots) {
    const d = Math.abs(t.guess - total);
    ups.push(env.DB.prepare("UPDATE z_totals SET points=? WHERE tg=? AND round_id=?").bind(d === best && best <= 2 ? TOTAL_POINTS[best] : 0, t.tg, r.id));
  }
  ups.push(env.DB.prepare("UPDATE z_rounds SET status='settled', total_goals=? WHERE id=?").bind(total, r.id));
  if (ups.length) await env.DB.batch(ups);
  // frames for the weekly top 3 of this round
  const top = (await ranking(env, { id: "" }, r.tier, r.id).then((x) => x.json())).rows.slice(0, 3);
  const names = ["gold", "silver", "bronze"];
  for (let i = 0; i < top.length; i++) {
    if (top[i].points <= 0) continue;
    const p = await env.DB.prepare("SELECT tg FROM z_players WHERE name=?").bind(top[i].name).first();
    if (p) await env.DB.prepare("INSERT OR IGNORE INTO z_awards (tg,frame,round_id) VALUES (?,?,?)").bind(p.tg, names[i], r.id).run();
  }
  return json({ ok: true, total_goals: total, scored: picks.length });
}

async function adminGrant(env, b) {
  if (!["pro", "vip"].includes(b.tier) || !b.tg) return fail("bad_grant");
  const ends = now() + Math.max(1, Number(b.days || 30)) * 86400;
  await env.DB.prepare("INSERT INTO z_subs (tg,tier,ends_at) VALUES (?,?,?) ON CONFLICT(tg,tier) DO UPDATE SET ends_at=excluded.ends_at").bind(String(b.tg), b.tier, ends).run();
  return json({ ok: true, ends_at: ends });
}

async function adminRounds(env) {
  const rs = (await env.DB.prepare("SELECT * FROM z_rounds ORDER BY id DESC LIMIT 12").all()).results || [];
  const out = [];
  for (const r of rs) {
    const ms = (await env.DB.prepare("SELECT id,home,away,kickoff,hg,ag,corners,cards FROM z_matches WHERE round_id=? ORDER BY kickoff,id").bind(r.id).all()).results || [];
    const c = await env.DB.prepare("SELECT COUNT(DISTINCT tg) n FROM (SELECT tg FROM z_picks WHERE round_id=?1 UNION SELECT tg FROM z_totals WHERE round_id=?1)").bind(r.id).first();
    out.push({ id: r.id, tier: r.tier, title: r.title, lock_at: r.lock_at, status: r.status, total_goals: r.total_goals, players: c ? c.n : 0, matches: ms });
  }
  return json({ ok: true, rounds: out });
}
async function adminPlayers(env, q) {
  const like = "%" + String(q || "").replace(/[%_]/g, "") + "%";
  const rows = (await env.DB.prepare("SELECT tg,name FROM z_players WHERE name LIKE ? OR tg LIKE ? ORDER BY created_at DESC LIMIT 20").bind(like, like).all()).results || [];
  const now_ = now();
  const out = [];
  for (const p of rows) {
    const subs = (await env.DB.prepare("SELECT tier,ends_at FROM z_subs WHERE tg=? AND ends_at>?").bind(p.tg, now_).all()).results || [];
    out.push({ tg: p.tg, name: p.name, subs });
  }
  return json({ ok: true, players: out });
}
async function adminDeleteRound(env, b) {
  const id = Number(b.round_id);
  const used = await env.DB.prepare("SELECT 1 x FROM z_picks WHERE round_id=?1 UNION SELECT 1 FROM z_totals WHERE round_id=?1").bind(id).first();
  if (used) return fail("has_picks", 409);
  await env.DB.batch([env.DB.prepare("DELETE FROM z_matches WHERE round_id=?").bind(id), env.DB.prepare("DELETE FROM z_rounds WHERE id=?").bind(id)]);
  return json({ ok: true });
}

// ---------- API-Football v3 (fixtures and final scores) ----------
// Key: APIF_KEY, or FOOTBALL_DATA_TOKEN (kept for the existing secret name).
const LEAGUES = { PL: 39, PD: 140, SA: 135 };
const FINISHED = new Set(["FT", "AET", "PEN"]);
async function apif(env, path) {
  const key = env.APIF_KEY || env.FOOTBALL_DATA_TOKEN;
  if (!key) return { error: "no_football_token" };
  const r = await fetch("https://v3.football.api-sports.io" + path, { headers: { "x-apisports-key": key } });
  if (!r.ok) return { error: "football_api_" + r.status };
  const j = await r.json().catch(() => null);
  if (!j) return { error: "football_api_bad_json" };
  const errs = j.errors && (Array.isArray(j.errors) ? j.errors : Object.values(j.errors));
  if (errs && errs.length) return { error: "football_api_error", detail: String(errs[0]).slice(0, 200) };
  return { data: j };
}
const seasonOf = (d) => (d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1);
async function adminFixtures(env, q) {
  const comps = String(q.get("comps") || "PL,PD,SA").split(",").filter((c) => LEAGUES[c]);
  if (!comps.length) return fail("bad_comps");
  const replay = q.get("mode") === "replay";
  const out = [];
  for (const c of comps) {
    let path;
    if (replay) {
      const season = Number(q.get("season")), round = Number(q.get("round"));
      if (!(season >= 2000 && season <= 2100) || !(round >= 1 && round <= 60)) return fail("bad_round");
      path = `/fixtures?league=${LEAGUES[c]}&season=${season}&round=${encodeURIComponent("Regular Season - " + round)}`;
    } else {
      const from = String(q.get("from") || ""), to = String(q.get("to") || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return fail("bad_dates");
      path = `/fixtures?league=${LEAGUES[c]}&season=${seasonOf(new Date(from))}&from=${from}&to=${to}`;
    }
    const r = await apif(env, path);
    if (r.error) return json({ ok: false, error: r.error, detail: r.detail }, 502);
    for (const m of r.data.response || []) {
      const st = m.fixture.status && m.fixture.status.short;
      if (!replay && st !== "NS" && st !== "TBD") continue;
      out.push({ ext_id: m.fixture.id, home: m.teams.home.name, away: m.teams.away.name, kickoff: Math.floor(Date.parse(m.fixture.date) / 1000), comp: c });
    }
  }
  return json({ ok: true, matches: out });
}
async function adminFetchResults(env, q) {
  const rows = (await env.DB.prepare("SELECT id,ext_id FROM z_matches WHERE round_id=? AND ext_id IS NOT NULL ORDER BY id").bind(Number(q.get("round_id"))).all()).results || [];
  if (!rows.length) return json({ ok: true, results: [] });
  const byExt = {};
  for (let i = 0; i < rows.length; i += 20) {
    const r = await apif(env, `/fixtures?ids=${rows.slice(i, i + 20).map((x) => x.ext_id).join("-")}`);
    if (r.error) return json({ ok: false, error: r.error, detail: r.detail }, 502);
    for (const m of r.data.response || []) byExt[m.fixture.id] = m;
  }
  const results = rows.map((x) => {
    const m = byExt[x.ext_id], st = m && m.fixture.status && m.fixture.status.short;
    const done = m && FINISHED.has(st) && m.goals.home != null && m.goals.away != null;
    return { match_id: x.id, status: st || "UNKNOWN", hg: done ? m.goals.home : null, ag: done ? m.goals.away : null };
  });
  return json({ ok: true, results });
}

// ---------- router ----------
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (url.pathname === "/api/health") {
      // bot ids (digits before ":") are public; they let you compare with the bot you open the app from
      const ids = botTokens(env).map((t) => t.split(":")[0]);
      return json({ ok: true, auth: ids.length > 0, football: Boolean(env.APIF_KEY || env.FOOTBALL_DATA_TOKEN), bot_ids: ids });
    }
    try {
      await ensureSchema(env);
      const user = await authUser(request, env);
      if (!user || user.reason) return json({ ok: false, error: "unauthorized", reason: user && user.reason }, 401);
      const post = request.method === "POST";
      const body = post ? await request.json().catch(() => ({})) : {};
      const q = url.searchParams;
      switch (url.pathname) {
        case "/api/me": return me(env, user);
        case "/api/profile": return post ? saveProfile(env, user, body) : fail("method", 405);
        case "/api/round": return getRound(env, user, q.get("tier") || "free", Number(q.get("id")) || 0);
        case "/api/predict": return post ? predict(env, user, body) : fail("method", 405);
        case "/api/total": return post ? saveTotal(env, user, body) : fail("method", 405);
        case "/api/ranking": return ranking(env, user, q.get("tier") || "free", Number(q.get("id")) || 0);
      }
      if (url.pathname.startsWith("/api/admin/")) {
        if (!adminIds(env).has(user.id)) return fail("forbidden", 403);
        if (url.pathname === "/api/admin/rounds") return adminRounds(env);
        if (url.pathname === "/api/admin/fixtures") return adminFixtures(env, q);
        if (url.pathname === "/api/admin/results") return adminFetchResults(env, q);
        if (url.pathname === "/api/admin/players") return adminPlayers(env, q.get("q"));
        if (!post) return fail("method", 405);
        if (url.pathname === "/api/admin/round/delete") return adminDeleteRound(env, body);
        if (url.pathname === "/api/admin/round") return adminRound(env, body);
        if (url.pathname === "/api/admin/settle") return adminSettle(env, body);
        if (url.pathname === "/api/admin/grant") return adminGrant(env, body);
      }
      return fail("not_found", 404);
    } catch (e) {
      console.error("api error", e);
      return fail("server_error", 500);
    }
  },
};

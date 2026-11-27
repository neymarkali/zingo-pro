// ZINGO API (rebuild). Cloudflare Worker + D1. Static design is served from ./public.
// Tiers: free | pro | vip. Points follow the agreed rules (see POINTS / settle()).

const POINTS = { wdl: 2, btts: 1, cor: 1, car: 1, ex: 5 };
const TOTAL_POINTS = [3, 2, 1]; // exact, off by 1, off by 2
const NAME_COOLDOWN_DAYS = 30;
const TIERS = ["free", "pro", "vip"];
const EMBLEM_COUNT = 20;
const FRAMES = ["bronze", "silver", "gold", "elite", "royal", "throne"];

// ---------- rules (mirrors zingo-rules.mjs) ----------
const XP = { save: 5, result1x2: 20, extraOption: 10, exact: 50, achievement: 100, weekly: 30 };
const MAX_LEVEL = 30;
const ACHIEVEMENTS = {
  first:     { name: "أول توقع", goal: 1, need: (s) => s.predictions >= 1, value: (s) => s.predictions },
  correct10: { name: "10 توقعات صحيحة", goal: 10, need: (s) => s.correct >= 10, value: (s) => s.correct },
  streak7:   { name: "سلسلة 7 فوز", goal: 7, need: (s) => s.bestStreak >= 7, value: (s) => s.bestStreak },
  fullWeek:  { name: "أسبوع كامل", goal: 1, need: (s) => s.fullWeekDone, value: (s) => (s.fullWeekDone ? 1 : 0) },
  rank1x2:   { name: "المركز الأول مرتين", goal: 2, need: (s) => s.rank1Count >= 2, value: (s) => s.rank1Count },
  exact3:    { name: "نتيجة دقيقة", goal: 3, need: (s) => s.exact >= 3, value: (s) => s.exact },
  weeks10:   { name: "10 أسابيع", goal: 10, need: (s) => s.consecutiveWeeks >= 10, value: (s) => s.consecutiveWeeks },
  legend:    { name: "أسطورة زينغو", goal: 3, need: (s) => s.rank1Count >= 3 || (s.points >= 500 && s.top5Count >= 4), value: (s) => s.rank1Count },
};
// frame id -> tier needed to have ever subscribed, and the achievement that unlocks it
const FRAME_RULES = {
  bronze: { tier: "pro", achievement: "first" },
  silver: { tier: "pro", achievement: "correct10" },
  gold:   { tier: "pro", achievement: "rank1x2" },
  elite:  { tier: "vip", achievement: "exact3" },
  royal:  { tier: "vip", achievement: "streak7" },
  throne: { tier: "vip", achievement: "legend" },
};

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS z_xp (tg TEXT PRIMARY KEY, xp INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS z_ach (tg TEXT NOT NULL, ach TEXT NOT NULL, unlocked_at INTEGER, PRIMARY KEY (tg, ach))`,
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
    .normalize("NFKC").replace(/[-‍﻿]/g, "").toLowerCase().trim()
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

// ---------- rules helpers ----------
const xpForLevel = (n) => {
  if (n <= 1) return 0;
  let total = 0, step = 100;
  for (let i = 2; i <= n; i++) { total += Math.round(step); step *= 1.2; }
  return total;
};
function levelFromXp(xp) {
  let lvl = 1;
  while (lvl < MAX_LEVEL && xp >= xpForLevel(lvl + 1)) lvl++;
  const cur = xpForLevel(lvl);
  const next = lvl >= MAX_LEVEL ? null : xpForLevel(lvl + 1);
  return { level: lvl, xp, progress: next === null ? 1 : (xp - cur) / (next - cur) };
}
function xpForPick(tier, m, p) {
  if (!m || m.hg == null || m.ag == null) return 0;
  if (p.ex_h != null) return p.ex_h === m.hg && p.ex_a === m.ag ? XP.exact : 0;
  let x = 0;
  const res = m.hg > m.ag ? "1" : m.hg < m.ag ? "2" : "X";
  if (p.wdl && p.wdl === res) x += XP.result1x2;
  if (p.btts && (p.btts === "y") === (m.hg > 0 && m.ag > 0)) x += XP.extraOption;
  if (p.cor && m.corners != null && m.cor_line != null && (p.cor === "o") === (m.corners > m.cor_line)) x += XP.extraOption;
  if (p.car && m.cards != null && m.car_line != null && (p.car === "o") === (m.cards > m.car_line)) x += XP.extraOption;
  if (p.dc && tier === "vip" && p.dc.includes(res)) x += XP.extraOption;
  return x;
}
async function addXp(env, tg, n) {
  if (!n) return;
  await env.DB.prepare("INSERT INTO z_xp (tg,xp) VALUES (?,?) ON CONFLICT(tg) DO UPDATE SET xp=xp+excluded.xp").bind(tg, n).run();
}
// Everything the achievements need, computed from settled history only.
async function playerStats(env, tg) {
  const picks = (await env.DB.prepare("SELECT match_id, round_id, points, ex_h, ex_a, saved_at FROM z_picks WHERE tg=? ORDER BY saved_at").bind(tg).all()).results || [];
  const scored = picks.filter((p) => p.points != null);
  let bestStreak = 0, run = 0;
  for (const p of scored) { run = p.points > 0 ? run + 1 : 0; bestStreak = Math.max(bestStreak, run); }
  const rounds = (await env.DB.prepare(
    `SELECT r.id, r.tier, (SELECT COUNT(*) FROM z_matches m WHERE m.round_id=r.id) AS mc
       FROM z_rounds r WHERE r.status='settled' ORDER BY r.id`).all()).results || [];
  let fullWeekDone = false, rank1Count = 0, top5Count = 0, consecutiveWeeks = 0;
  const perRound = {};
  for (const pk of picks) (perRound[pk.round_id] ||= []).push(pk);
  for (const r of rounds) {
    const mine = perRound[r.id] || [];
    if (!mine.length) continue;
    const ok = mine.filter((p) => p.points > 0).length;
    if (mine.length === r.mc && ok / mine.length >= 0.8) fullWeekDone = true;
    const rk = await ranking(env, { id: tg }, r.tier, r.id).then((x) => x.json());
    const me = (rk.rows || []).find((x) => x.me);
    if (me && me.rank === 1) rank1Count++;
    if (me && me.rank <= 5) top5Count++;
  }
  // consecutive settled weeks per tier with at least one point, longest run
  for (const tier of TIERS) {
    let cur = 0;
    for (const r of rounds.filter((x) => x.tier === tier)) {
      const mine = perRound[r.id] || [];
      const pts = mine.reduce((a, p) => a + (p.points || 0), 0);
      cur = mine.length && pts > 0 ? cur + 1 : 0;
      consecutiveWeeks = Math.max(consecutiveWeeks, cur);
    }
  }
  const total = await env.DB.prepare("SELECT COALESCE(SUM(points),0) AS s FROM z_picks WHERE tg=?").bind(tg).first();
  const tot = await env.DB.prepare("SELECT COALESCE(SUM(points),0) AS s FROM z_totals WHERE tg=?").bind(tg).first();
  return {
    predictions: picks.length,
    correct: scored.filter((p) => p.points > 0).length,
    exact: scored.filter((p) => p.ex_h != null && p.points > 0).length,
    bestStreak, fullWeekDone, rank1Count, top5Count, consecutiveWeeks,
    points: (total ? total.s : 0) + (tot ? tot.s : 0),
  };
}
// Unlocks achievements (once each, +XP) and frames (once each, never removed).
async function checkAchievements(env, tg) {
  const stats = await playerStats(env, tg);
  const have = new Set(((await env.DB.prepare("SELECT ach FROM z_ach WHERE tg=?").bind(tg).all()).results || []).map((r) => r.ach));
  for (const [id, a] of Object.entries(ACHIEVEMENTS)) {
    if (have.has(id) || !a.need(stats)) continue;
    await env.DB.prepare("INSERT OR IGNORE INTO z_ach (tg,ach,unlocked_at) VALUES (?,?,?)").bind(tg, id, now()).run();
    await addXp(env, tg, XP.achievement);
  }
  const owned = new Set(((await env.DB.prepare("SELECT frame FROM z_awards WHERE tg=?").bind(tg).all()).results || []).map((r) => r.frame));
  const ever = new Set(((await env.DB.prepare("SELECT tier FROM z_subs WHERE tg=?").bind(tg).all()).results || []).map((r) => r.tier));
  for (const [frame, rule] of Object.entries(FRAME_RULES)) {
    if (owned.has(frame)) continue;
    if (ever.has(rule.tier) && ACHIEVEMENTS[rule.achievement].need(stats)) {
      await env.DB.prepare("INSERT OR IGNORE INTO z_awards (tg,frame,round_id) VALUES (?,?,NULL)").bind(tg, frame).run();
    }
  }
}

// ---------- handlers ----------
async function me(env, user) {
  const p = await env.DB.prepare("SELECT * FROM z_players WHERE tg=?").bind(user.id).first();
  const acc = await access(env, user.id);
  const awards = p ? ((await env.DB.prepare("SELECT frame FROM z_awards WHERE tg=?").bind(user.id).all()).results || []).map((r) => r.frame) : [];
  const days = p ? Math.max(0, Math.ceil((p.name_changed_at + NAME_COOLDOWN_DAYS * 86400 - now()) / 86400)) : 0;
  const xpRow = await env.DB.prepare("SELECT xp FROM z_xp WHERE tg=?").bind(user.id).first();
  const xp = xpRow ? xpRow.xp : 0;
  const got = new Set(((await env.DB.prepare("SELECT ach FROM z_ach WHERE tg=?").bind(user.id).all()).results || []).map((r) => r.ach));
  const stats = await playerStats(env, user.id);
  const achievements = Object.entries(ACHIEVEMENTS).map(([id, a]) => ({
    id, name: a.name, unlocked: got.has(id), progress: Math.min(1, a.value(stats) / a.goal),
  }));
  return json({ ok: true, player: p && { name: p.name, emblem: p.emblem, frame: p.frame }, access: acc, name_locked_days: days, frames: awards, level: levelFromXp(xp), achievements });
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
    const owned = !!(await env.DB.prepare("SELECT 1 x FROM z_awards WHERE tg=? AND frame=?").bind(user.id, frame).first());
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
  

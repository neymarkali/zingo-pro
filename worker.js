function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Init-Data",
    },
  });
}

async function getActivePro(env) {
  return await env.DB.prepare(`
    SELECT *
    FROM competitions
    WHERE type = 'pro'
      AND status IN ('active', 'upcoming')
    ORDER BY
      CASE WHEN status = 'active' THEN 0 ELSE 1 END,
      start_at ASC
    LIMIT 1
  `).first();
}

const ZINGO_ADMIN_IDS = new Set([
  "994708968"
]);

function isZingoAdmin(telegramId) {
  return ZINGO_ADMIN_IDS.has(String(telegramId || "").trim());
}


function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return diff === 0;
}

async function hmacSha256(key, message) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  return new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      new TextEncoder().encode(message)
    )
  );
}

async function verifyTelegramInitData(request, env) {
  const initData =
    request.headers.get("X-Telegram-Init-Data") || "";

  if (!initData) {
    return {
      ok: false,
      status: 401,
      error: "telegram_init_data_missing"
    };
  }

  if (!env.TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not configured");

    return {
      ok: false,
      status: 500,
      error: "telegram_auth_not_configured"
    };
  }

  try {
    const params = new URLSearchParams(initData);
    const receivedHash = params.get("hash");

    if (!receivedHash) {
      return {
        ok: false,
        status: 401,
        error: "telegram_hash_missing"
      };
    }

    params.delete("hash");

    const dataCheckString = Array.from(params.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const botToken = new TextEncoder().encode(
      env.TELEGRAM_BOT_TOKEN
    );

    const secretKey = await hmacSha256(
      new TextEncoder().encode("WebAppData"),
      env.TELEGRAM_BOT_TOKEN
    );

    const calculatedHash = bytesToHex(
      await hmacSha256(secretKey, dataCheckString)
    );

    if (
      !safeEqual(
        calculatedHash,
        receivedHash.toLowerCase()
      )
    ) {
      return {
        ok: false,
        status: 401,
        error: "telegram_init_data_invalid"
      };
    }

    const authDate = Number(
      params.get("auth_date") || 0
    );

    const now = Math.floor(Date.now() / 1000);

    if (
      !Number.isFinite(authDate) ||
      authDate <= 0 ||
      Math.abs(now - authDate) > 86400
    ) {
      return {
        ok: false,
        status: 401,
        error: "telegram_init_data_expired"
      };
    }

    let user;

    try {
      user = JSON.parse(
        params.get("user") || "null"
      );
    } catch {
      user = null;
    }

    if (!user || !user.id) {
      return {
        ok: false,
        status: 401,
        error: "telegram_user_missing"
      };
    }

    return {
      ok: true,
      user: {
        id: String(user.id),
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        username: user.username || ""
      }
    };

  } catch (error) {
    console.error(
      "Telegram authentication error:",
      error
    );

    return {
      ok: false,
      status: 401,
      error: "telegram_auth_failed"
    };
  }
}

async function requireTelegramUser(request, env) {
  const result =
    await verifyTelegramInitData(request, env);

  if (!result.ok) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          error: result.error
        },
        result.status
      )
    };
  }

  return {
    ok: true,
    user: result.user
  };
}

async function getSubscription(env, telegramId) {
  const id = String(telegramId || '').trim();

  if (!id || id === '0') {
    return null;
  }

  // ZINGO ADMIN: unrestricted PRO/VIP access.
  // Server-side check: subscription expiry cannot block the admin account.
  if (isZingoAdmin(id)) {
    return {
      active: true,
      plan: 'vip',
      status: 'admin',
      start_at: '2000-01-01T00:00:00.000Z',
      end_at: '2999-12-31T23:59:59.999Z',
      payment_method: 'admin'
    };
  }

  const row = await env.DB.prepare(`
    SELECT
      id,
      telegram_id,
      plan,
      start_at,
      end_at,
      status,
      payment_method
    FROM subscriptions
    WHERE telegram_id = ?
      AND plan = 'vip'
    ORDER BY id DESC
    LIMIT 1
  `).bind(id).first();

  if (!row) {
    return null;
  }

  const now = Date.now();
  const start = row.start_at ? Date.parse(row.start_at) : NaN;
  const end = row.end_at ? Date.parse(row.end_at) : NaN;

  const active =
    row.status === 'active' &&
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    start <= now &&
    now <= end;

  return {
    active,
    plan: row.plan,
    status: row.status,
    start_at: row.start_at,
    end_at: row.end_at,
    payment_method: row.payment_method || null
  };
}


// ZINGO PLAYER IDENTITY V1

async function ensureZingoProfiles(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS zingo_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      name_key TEXT NOT NULL UNIQUE,
      avatar_data TEXT,
      club_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.DB.prepare(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_zingo_profiles_name_key
    ON zingo_profiles(name_key)
  `).run();
}

function normalizeZingoName(value) {
  let s = String(value || "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase()
    .trim();

  s = s
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه");

  return s
    .replace(/[\s_\-.'`~!@#$%^&*()+={}[\]|\\:;"<>?,/،؛؟]+/g, "")
    .trim();
}

function isForbiddenZingoName(value) {
  const key = normalizeZingoName(value);

  if (!key) return true;

  const blocked = new Set([
    "zingo",
    "زينغو",
    "زينجو",
    "زينقو",
    "زينغ",
    "z1ngo",
    "zlngo",
    "zinqo",
    "zingoapp",
    "zingopro",
    "zingovip"
  ]);

  if (blocked.has(key)) return true;

  const latin = key
    .replace(/[0]/g, "o")
    .replace(/[1|!]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4@]/g, "a")
    .replace(/[5]/g, "s")
    .replace(/[7]/g, "t");

  if (latin === "zingo") return true;

  return false;
}

function validateZingoDisplayName(value) {
  const name = String(value || "").normalize("NFKC").trim();

  if (name.length < 2) {
    return { ok:false, error:"الاسم يجب أن يحتوي على حرفين على الأقل" };
  }

  if (name.length > 24) {
    return { ok:false, error:"الاسم يجب ألا يتجاوز 24 حرفاً" };
  }

  if (isForbiddenZingoName(name)) {
    return { ok:false, error:"هذا الاسم غير مسموح" };
  }

  return {
    ok:true,
    name,
    name_key:normalizeZingoName(name)
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/subscription' && request.method === 'GET') {
  try {
    const auth = await requireTelegramUser(request, env);
    if (!auth.ok) return auth.response;
    const telegramId = auth.user.id;

    const vip = await getSubscription(env, telegramId);

    return json({
      ok: true,
      vip: vip || {
        active: false,
        plan: 'vip',
        status: 'none',
        start_at: null,
        end_at: null,
        payment_method: null
      }
    });
  } catch (e) {
    console.error('subscription error:', e);

    return json({
      ok: false,
      vip: {
        active: false
      },
      error: 'subscription_lookup_failed'
    }, 500);
  }
}

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Init-Data",
        },
      });
    }

    try {
      // =========================
      // PRO ROUND
      // =========================
      if (url.pathname === "/api/db/status") {
  return json({
    ok: true,
    secret_configured: Boolean(env.ZINGO_DB_SECRET),
  });
}

if (url.pathname === "/api/db/query" || url.pathname === "/api/xdb") {
        if (request.method !== "POST") {
          return json({ ok: false, error: "Method not allowed" }, 405);
        }

        try {
          const body = await request.json();
          const dbKey = typeof body?.db_key === "string" ? body.db_key.trim() : "";
          const sql = typeof body?.sql === "string" ? body.sql.trim() : "";
          const params = Array.isArray(body?.params) ? body.params : [];

          if (!env.ZINGO_DB_SECRET || dbKey !== env.ZINGO_DB_SECRET) {
            return json({ ok: false, error: "Unauthorized" }, 401);
          }

          if (!sql) {
            return json({ ok: false, error: "SQL is required" }, 400);
          }

          if (sql.includes(";")) {
            return json(
              { ok: false, error: "Multiple SQL statements are not allowed" },
              400
            );
          }

          const result = await env.DB
            .prepare(sql)
            .bind(...params)
            .all();

          return json({
            ok: true,
            rows: result.results || [],
            meta: {
              changes: result.meta?.changes ?? 0,
              last_row_id: result.meta?.last_row_id ?? null,
              rows_read: result.meta?.rows_read ?? 0,
              rows_written: result.meta?.rows_written ?? 0,
            },
          });
        } catch (error) {
          console.error("DB QUERY ERROR:", error);

          return json(
            {
              ok: false,
              error: error?.message || "Database error",
            },
            500
          );
        }
      }

      if (url.pathname === "/api/pro_round") {
        const auth = await requireTelegramUser(request, env);
        if (!auth.ok) return auth.response;
        const telegramId = Number(auth.user.id);

        const competition = await getActivePro(env);

        if (!competition) {
          return json({
            ok: true,
            competition: null,
            matches: [],
          });
        }

        const matches = await env.DB.prepare(`
          SELECT
            cm.id,
            cm.match_id,
            cm.home_team,
            cm.away_team,
            cm.market,
            cm.result,
            cm.extra_market,
            cm.extra_prediction,
            p1.prediction AS prediction_1x2,
            pb.prediction AS prediction_btts
          FROM competition_matches cm
          LEFT JOIN competition_predictions p1
            ON p1.competition_match_id = cm.id
            AND p1.telegram_id = ?
            AND p1.market = '1x2'
          LEFT JOIN competition_predictions pb
            ON pb.competition_match_id = cm.id
            AND pb.telegram_id = ?
            AND pb.market = 'btts'
          WHERE cm.competition_id = ?
          ORDER BY cm.id ASC
        `)
          .bind(telegramId, telegramId, competition.id)
          .all();

        // تأكيد تسجيل المستخدم بالمسابقة
        if (telegramId) {
          await env.DB.prepare(`
            INSERT OR IGNORE INTO competition_entries
            (competition_id, telegram_id, status, points)
            VALUES (?, ?, 'active', 0)
          `)
            .bind(competition.id, telegramId)
            .run();
        }

        return json({
          ok: true,
          competition,
          matches: matches.results || [],
        });
      }

      // =========================
      // SUBMIT PREDICTION
      // =========================
      if (
        url.pathname === "/api/pro_submit" &&
        request.method === "POST"
      ) {
        const body = await request.json();

        const auth = await requireTelegramUser(request, env);
        if (!auth.ok) return auth.response;

        const telegramId = Number(auth.user.id);
        const competitionMatchId = Number(
          body.competition_match_id || 0
        );
        const prediction = String(body.prediction || "").trim();
        const market = String(body.market || "1x2").trim();

        if (
          !telegramId ||
          !competitionMatchId ||
          !prediction ||
          !["1x2", "btts"].includes(market)
        ) {
          return json(
            {
              ok: false,
              error: "بيانات التوقع غير مكتملة",
            },
            400
          );
        }

        const competition = await getActivePro(env);

        if (!competition) {
          return json(
            {
              ok: false,
              error: "لا توجد مسابقة PRO فعالة حالياً",
            },
            404
          );
        }

        const match = await env.DB.prepare(`
          SELECT *
          FROM competition_matches
          WHERE id = ?
            AND competition_id = ?
          LIMIT 1
        `)
          .bind(competitionMatchId, competition.id)
          .first();

        if (!match) {
          return json(
            {
              ok: false,
              error: "المباراة غير موجودة",
            },
            404
          );
        }

        // لا تسمح بتعديل التوقع بعد تسجيله
        const existing = await env.DB.prepare(`
          SELECT id
          FROM competition_predictions
          WHERE competition_match_id = ?
            AND telegram_id = ?
            AND market = ?
          LIMIT 1
        `)
          .bind(competitionMatchId, telegramId, market)
          .first();

        if (existing) {
          return json({
            ok: true,
            already_submitted: true,
          });
        }

        await env.DB.prepare(`
          INSERT INTO competition_entries
          (competition_id, telegram_id, status, points)
          VALUES (?, ?, 'active', 0)
          ON CONFLICT(competition_id, telegram_id)
          DO NOTHING
        `)
          .bind(competition.id, telegramId)
          .run();

        await env.DB.prepare(`
          INSERT INTO competition_predictions
          (
            competition_id,
            competition_match_id,
            telegram_id,
            prediction,
            result,
            points,
            market
          )
          VALUES (?, ?, ?, ?, 'pending', 0, ?)
        `)
          .bind(
            competition.id,
            competitionMatchId,
            telegramId,
            prediction,
            market
          )
          .run();

        return json({
          ok: true,
          already_submitted: false,
        });
      }

      // =========================
      // RANKING
      // =========================
      if (url.pathname === "/api/pro_ranking") {
        const auth = await requireTelegramUser(request, env);
        if (!auth.ok) return auth.response;
        const telegramId = Number(auth.user.id);

        const competition = await getActivePro(env);

        if (!competition) {
          return json({
            ok: true,
            players: [],
            current_rank: null,
            total_players: 0,
          });
        }

        const ranking = await env.DB.prepare(`
          SELECT
            ce.telegram_id,
            ce.points,
            ROW_NUMBER() OVER (
              ORDER BY ce.points DESC, ce.created_at ASC
            ) AS rank
          FROM competition_entries ce
          WHERE ce.competition_id = ?
            AND ce.status != 'cancelled'
          ORDER BY ce.points DESC, ce.created_at ASC
          LIMIT 100
        `)
          .bind(competition.id)
          .all();

        const rows = ranking.results || [];

        const players = rows.map((player, index) => {
        const playerId = Number(player.telegram_id);
        const isMe = playerId === telegramId;

        return {
          rank: Number(player.rank || index + 1),
          telegram_id: playerId,
          name: isMe
            ? "أنت"
            : `لاعب ${String(playerId).slice(-4)}`,
          points: Number(player.points || 0),
          is_me: isMe,
        };
      });

        const current = players.find(
          (player) => player.telegram_id === telegramId
        );

        return json({
          ok: true,
          players,
          current_rank: current ? current.rank : null,
          total_players: rows.length,
        });
      }

      // =========================
      // TEST / HEALTH
      // =========================

    // =========================
    // ZINGO PLAYER PROFILE
    // =========================

    if (
      (url.pathname === "/api/profile" ||
       url.pathname === "/api/profile/update") &&
      (request.method === "GET" || request.method === "POST")
    ) {

      const auth = await requireTelegramUser(request, env);
      if (!auth.ok) return auth.response;

      const telegramId = String(auth.user.id);

      try {
        await ensureZingoProfiles(env);

        if (request.method === "GET") {

          const profile = await env.DB.prepare(`
            SELECT
              telegram_id,
              display_name,
              avatar_data,
              club_id,
              created_at,
              updated_at
            FROM zingo_profiles
            WHERE telegram_id = ?
            LIMIT 1
          `)
          .bind(telegramId)
          .first();

          return json({
            ok:true,
            profile:profile || null
          });
        }

        const body = await request.json();

        const checked = validateZingoDisplayName(body?.display_name);

        if (!checked.ok) {
          return json({
            ok:false,
            error:checked.error
          },400);
        }

        const avatar =
          typeof body?.avatar_data === "string"
            ? body.avatar_data.trim()
            : "";

        const clubId =
          typeof body?.club_id === "string"
            ? body.club_id.trim().slice(0,80)
            : "";

        if (avatar && avatar.length > 180000) {
          return json({
            ok:false,
            error:"الصورة كبيرة جداً"
          },413);
        }

        const existing = await env.DB.prepare(`
          SELECT telegram_id
          FROM zingo_profiles
          WHERE name_key = ?
          AND telegram_id != ?
          LIMIT 1
        `)
        .bind(checked.name_key, telegramId)
        .first();

        if (existing) {
          return json({
            ok:false,
            error:"هذا الاسم مستخدم من لاعب آخر"
          },409);
        }

        try {

          await env.DB.prepare(`
            INSERT INTO zingo_profiles
              (telegram_id,display_name,name_key,avatar_data,club_id)
            VALUES (?,?,?,?,?)
            ON CONFLICT(telegram_id)
            DO UPDATE SET
              display_name=excluded.display_name,
              name_key=excluded.name_key,
              avatar_data=excluded.avatar_data,
              club_id=excluded.club_id,
              updated_at=CURRENT_TIMESTAMP
          `)
          .bind(
            telegramId,
            checked.name,
            checked.name_key,
            avatar || null,
            clubId || null
          )
          .run();

        } catch (e) {

          const msg = String(e?.message || "");

          if (
            msg.toLowerCase().includes("unique") ||
            msg.toLowerCase().includes("constraint")
          ) {
            return json({
              ok:false,
              error:"هذا الاسم مستخدم من لاعب آخر"
            },409);
          }

          throw e;
        }

        const profile = await env.DB.prepare(`
          SELECT
            telegram_id,
            display_name,
            avatar_data,
            club_id,
            created_at,
            updated_at
          FROM zingo_profiles
          WHERE telegram_id = ?
          LIMIT 1
        `)
        .bind(telegramId)
        .first();

        return json({
          ok:true,
          profile
        });

      } catch (e) {

        console.error("profile error:",e);

        return json({
          ok:false,
          error:"تعذر حفظ الملف الشخصي"
        },500);
      }
    }

    if (url.pathname === "/api/health") {
        const competition = await getActivePro(env);

        return json({
          ok: true,
          cloud: true,
          d1: true,
          active_pro: competition
            ? {
                id: competition.id,
                name: competition.name,
                status: competition.status,
              }
            : null,
        });
      }

      // =========================
      // PRO PAGE
      // =========================
      if (url.pathname === "/pro") {
        return new Response(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ZINGO PRO</title>
<style>
body{
  margin:0;
  min-height:100vh;
  background:#050914;
  color:white;
  font-family:Arial,sans-serif;
  display:flex;
  align-items:center;
  justify-content:center;
}
.box{
  width:90%;
  max-width:500px;
  padding:35px;
  text-align:center;
  border:1px solid #1264ff;
  border-radius:24px;
  background:#081120;
  box-shadow:0 0 40px rgba(0,100,255,.25);
}
.logo{
  font-size:60px;
  font-weight:900;
  color:#1680ff;
}
h1{
  margin:10px 0;
}
p{
  color:#aebbd0;
}
.ok{
  display:inline-block;
  margin-top:20px;
  padding:10px 18px;
  border-radius:30px;
  background:#073c22;
  color:#36e98a;
}
</style>
</head>
<body>
<div class="box">
  <div class="logo">Z</div>
  <h1>ZINGO PRO</h1>
  <p>نظام المسابقات السحابي</p>
  <div class="ok">🟢 النظام السحابي متصل</div>
</div>
</body>
</html>
        `, {
          headers: {
            "Content-Type": "text/html; charset=utf-8"
          }
        });
      }

      return json({
        ok: true,
        service: "ZINGO PRO",
        status: "online",
      });

    } catch (error) {
      console.error(error);

      return json(
        {
          ok: false,
          error: error?.message || "Server error",
        },
        500
      );
    }
  },
};

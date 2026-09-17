function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
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
        const telegramId = Number(url.searchParams.get("telegram_id") || 0);

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

        const telegramId = Number(body.telegram_id || 0);
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
        const telegramId = Number(url.searchParams.get("telegram_id") || 0);

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

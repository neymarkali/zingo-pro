from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time

ROOT = Path.cwd()
INDEX = ROOT / "index.html"

if not INDEX.exists():
    raise SystemExit("❌ index.html غير موجود")

original = INDEX.read_text(encoding="utf-8")

PRO_START_RE = re.compile(
    r'<section\b[^>]*\bid=["\']zingoProWorld["\'][^>]*>',
    re.I
)
VIP_START_RE = re.compile(
    r'<section\b[^>]*\bid=["\']zingoVipWorld["\'][^>]*>',
    re.I
)
FREE_START_RE = re.compile(
    r'<section\b[^>]*\bid=["\']zingoFreeWorld["\'][^>]*>',
    re.I
)


def one_match(pattern, text, label):
    matches = list(pattern.finditer(text))
    if len(matches) != 1:
        raise SystemExit(
            f"❌ {label}: expected 1, found {len(matches)}"
        )
    return matches[0]


# ============================================================
# 1) VERIFY ORIGINAL STRUCTURE
# ============================================================

pro_m = one_match(PRO_START_RE, original, "zingoProWorld")
vip_m = one_match(VIP_START_RE, original, "zingoVipWorld")
free_m = one_match(FREE_START_RE, original, "zingoFreeWorld")

if free_m.start() >= pro_m.start():
    raise SystemExit("❌ FREE/PRO section order is invalid")

if pro_m.start() >= vip_m.start():
    raise SystemExit("❌ PRO/VIP section order is invalid")

free_block = original[free_m.start():pro_m.start()]


# ============================================================
# 2) PRO STYLE
# ============================================================

STYLE_ID = "zingoProExactFinal20260926"

style = r"""
<style id="zingoProExactFinal20260926">

:root{
  --zpro-bg:#090909;
  --zpro-panel:#15110c;
  --zpro-panel2:#211507;
  --zpro-gold:#f0bf43;
  --zpro-gold2:#ffd86a;
  --zpro-cream:#fff7df;
  --zpro-line:rgba(243,193,67,.18);
  --zpro-line2:rgba(243,193,67,.38);
  --zpro-shadow:0 18px 60px rgba(0,0,0,.56);
}

#zingoProWorld.zingo-pro-exact-final{
  position:relative;
  min-height:100dvh;
  width:100%;
  overflow:hidden;
  box-sizing:border-box;
  padding:18px 12px 24px;
  background:
    radial-gradient(circle at 50% -8%,rgba(255,201,74,.12),transparent 36%),
    radial-gradient(circle at 90% 26%,rgba(143,86,13,.10),transparent 30%),
    linear-gradient(180deg,#0b0a08 0%,#090909 48%,#070707 100%);
  color:var(--zpro-cream);
  font-family:"Cairo","Tajawal",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  isolation:isolate;
}

#zingoProWorld.zingo-pro-exact-final *{
  box-sizing:border-box;
}

#zingoProWorld.zingo-pro-exact-final::before{
  content:"";
  position:absolute;
  inset:-25%;
  z-index:-2;
  pointer-events:none;
  background:
    radial-gradient(circle at 12% 10%,rgba(255,220,120,.08) 0 1px,transparent 1.6px),
    radial-gradient(circle at 72% 14%,rgba(255,214,87,.10) 0 1px,transparent 1.7px),
    radial-gradient(circle at 38% 58%,rgba(255,230,159,.06) 0 1px,transparent 1.5px),
    radial-gradient(circle at 82% 78%,rgba(255,201,74,.07) 0 1px,transparent 1.4px);
  background-size:
    110px 110px,
    150px 150px,
    125px 125px,
    170px 170px;
  transform:rotate(5deg);
  opacity:.85;
}

#zingoProWorld.zingo-pro-exact-final::after{
  content:"";
  position:absolute;
  inset:0;
  z-index:-1;
  pointer-events:none;
  background:
    linear-gradient(
      110deg,
      transparent 0 34%,
      rgba(255,255,255,.025) 38%,
      transparent 41% 100%
    ),
    radial-gradient(
      circle at 50% 36%,
      rgba(255,201,74,.08),
      transparent 32%
    );
}

#zingoProWorld.zingo-pro-exact-final .zpro-phone{
  position:relative;
  width:min(100%,430px);
  min-height:calc(100dvh - 42px);
  margin:0 auto;
  padding:8px;
  border:1px solid rgba(255,214,107,.50);
  border-radius:34px;
  background:
    linear-gradient(
      145deg,
      rgba(255,220,126,.14),
      rgba(77,45,8,.22) 35%,
      rgba(9,9,9,.96) 70%
    );
  box-shadow:
    0 0 0 1px rgba(255,211,91,.07) inset,
    0 0 28px rgba(240,191,67,.18),
    0 0 88px rgba(172,108,12,.10),
    var(--zpro-shadow);
}

#zingoProWorld.zingo-pro-exact-final .zpro-phone::before{
  content:"";
  position:absolute;
  inset:3px;
  border-radius:30px;
  pointer-events:none;
  border:1px solid rgba(255,235,170,.16);
  background:
    linear-gradient(
      110deg,
      rgba(255,255,255,.045),
      transparent 20% 74%,
      rgba(255,212,92,.035)
    );
}

#zingoProWorld.zingo-pro-exact-final .zpro-screen{
  position:relative;
  min-height:calc(100dvh - 58px);
  overflow:hidden;
  border-radius:27px;
  background:
    radial-gradient(
      circle at 52% 14%,
      rgba(255,196,69,.08),
      transparent 24%
    ),
    linear-gradient(
      180deg,
      #0d0c0b 0%,
      #0a0908 54%,
      #080808 100%
    );
  border:1px solid rgba(255,215,112,.10);
}

#zingoProWorld.zingo-pro-exact-final .zpro-light{
  position:absolute;
  width:180px;
  height:180px;
  right:-95px;
  top:95px;
  border-radius:50%;
  background:
    radial-gradient(
      circle,
      rgba(255,207,84,.16),
      rgba(255,207,84,.04) 38%,
      transparent 72%
    );
  filter:blur(3px);
  pointer-events:none;
}

#zingoProWorld.zingo-pro-exact-final .zpro-wrap{
  position:relative;
  padding:14px 12px 120px;
}

#zingoProWorld.zingo-pro-exact-final .zpro-topbar{
  display:grid;
  grid-template-columns:38px 1fr 38px;
  align-items:center;
  gap:8px;
  margin-bottom:12px;
}

#zingoProWorld.zingo-pro-exact-final .zpro-icon-btn,
#zingoProWorld.zingo-pro-exact-final .zpro-crown{
  width:38px;
  height:38px;
  display:grid;
  place-items:center;
  border-radius:13px;
  color:var(--zpro-gold2);
  border:1px solid var(--zpro-line);
  background:
    linear-gradient(
      145deg,
      rgba(255,220,123,.08),
      rgba(255,200,69,.025)
    );
  box-shadow:
    0 7px 22px rgba(0,0,0,.28),
    0 0 17px rgba(240,191,67,.07);
  user-select:none;
}

#zingoProWorld.zingo-pro-exact-final .zpro-icon-btn svg,
#zingoProWorld.zingo-pro-exact-final .zpro-crown svg,
#zingoProWorld.zingo-pro-exact-final .zpro-feature-icon svg,
#zingoProWorld.zingo-pro-exact-final .zpro-nav svg,
#zingoProWorld.zingo-pro-exact-final .zpro-trust svg{
  width:17px;
  height:17px;
}

#zingoProWorld.zingo-pro-exact-final .zpro-brand{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:9px;
  min-width:0;
}

#zingoProWorld.zingo-pro-exact-final .zpro-logo{
  width:36px;
  height:36px;
  flex:0 0 36px;
  border-radius:50%;
  display:grid;
  place-items:center;
  font-size:16px;
  font-weight:1000;
  letter-spacing:-.8px;
  color:#090909;
  background:
    radial-gradient(
      circle at 32% 28%,
      #fff4c8 0 7%,
      transparent 8%
    ),
    linear-gradient(
      145deg,
      #fff0a8 0%,
      #f0bf43 28%,
      #b8740d 72%,
      #ffd969 100%
    );
  border:1px solid rgba(255,242,183,.72);
  box-shadow:
    0 0 0 2px rgba(242,191,65,.10),
    0 0 24px rgba(240,191,67,.20);
}

#zingoProWorld.zingo-pro-exact-final .zpro-brand-title{
  font-size:14px;
  font-weight:1000;
  letter-spacing:1.9px;
  color:#fff2c3;
}

#zingoProWorld.zingo-pro-exact-final .zpro-brand-sub{
  font-size:8px;
  color:#9f9279;
  letter-spacing:1.5px;
  margin-top:-2px;
}

#zingoProWorld.zingo-pro-exact-final .zpro-crown{
  font-size:17px;
  position:relative;
}

#zingoProWorld.zingo-pro-exact-final .zpro-crown::after{
  content:"";
  position:absolute;
  width:5px;
  height:5px;
  border-radius:50%;
  right:7px;
  top:7px;
  background:#ffe691;
  box-shadow:0 0 10px #f0bf43;
}

#zingoProWorld.zingo-pro-exact-final .zpro-hero{
  position:relative;
  min-height:188px;
  overflow:hidden;
  padding:20px 18px;
  border-radius:24px;
  border:1px solid var(--zpro-line2);
  background:
    radial-gradient(
      circle at 82% 44%,
      rgba(255,216,108,.12),
      transparent 26%
    ),
    linear-gradient(
      135deg,
      rgba(33,21,7,.92),
      rgba(14,12,10,.98) 58%,
      rgba(20,15,9,.97)
    );
  box-shadow:
    0 22px 52px rgba(0,0,0,.38),
    0 0 38px rgba(240,191,67,.06);
}

#zingoProWorld.zingo-pro-exact-final .zpro-hero::before{
  content:"";
  position:absolute;
  inset:0;
  background:
    linear-gradient(
      115deg,
      transparent 0 42%,
      rgba(255,239,194,.05) 46%,
      transparent 49%
    ),
    radial-gradient(
      circle at 16% 18%,
      rgba(255,255,255,.045),
      transparent 15%
    );
  pointer-events:none;
}

#zingoProWorld.zingo-pro-exact-final .zpro-kicker{
  position:relative;
  z-index:1;
  display:inline-flex;
  align-items:center;
  gap:7px;
  padding:5px 9px;
  border-radius:99px;
  border:1px solid rgba(255,215,107,.20);
  background:rgba(255,211,95,.045);
  color:#bca883;
  font-size:8px;
  font-weight:900;
  letter-spacing:2px;
}

#zingoProWorld.zingo-pro-exact-final .zpro-kicker-dot{
  width:5px;
  height:5px;
  border-radius:50%;
  background:#f0bf43;
  box-shadow:0 0 10px rgba(240,191,67,.8);
}

#zingoProWorld.zingo-pro-exact-final .zpro-hero-title{
  position:relative;
  z-index:1;
  margin-top:18px;
  font-size:31px;
  line-height:1;
  font-weight:1000;
  letter-spacing:1.5px;
  color:#f7cf68;
  text-shadow:
    0 0 7px rgba(255,214,94,.24),
    0 0 22px rgba(240,191,67,.10);
}

#zingoProWorld.zingo-pro-exact-final .zpro-hero-sub{
  position:relative;
  z-index:1;
  margin-top:8px;
  font-size:9px;
  color:#fff4d2;
  font-weight:900;
}

#zingoProWorld.zingo-pro-exact-final .zpro-hero-copy{
  position:relative;
  z-index:1;
  width:58%;
  max-width:225px;
  margin-top:10px;
  color:#94886f;
  font-size:9px;
  line-height:1.95;
}

#zingoProWorld.zingo-pro-exact-final .zpro-hero-art{
  position:absolute;
  right:-6px;
  top:20px;
  width:172px;
  height:172px;
  display:grid;
  place-items:center;
  transform:rotate(-6deg);
}

#zingoProWorld.zingo-pro-exact-final .zpro-ball{
  position:absolute;
  width:116px;
  height:116px;
  border-radius:50%;
  background:
    radial-gradient(
      circle at 34% 28%,
      rgba(255,255,255,.90) 0 3%,
      transparent 3.5%
    ),
    radial-gradient(
      circle at 43% 38%,
      #3b2c16 0 7%,
      transparent 7.6%
    ),
    radial-gradient(
      circle at 62% 62%,
      #382917 0 7%,
      transparent 7.6%
    ),
    radial-gradient(
      circle at 30% 70%,
      #4a381d 0 7%,
      transparent 7.5%
    ),
    linear-gradient(
      145deg,
      #f7e4a8,
      #d7b75d 42%,
      #8f641a 100%
    );
  box-shadow:
    inset -15px -18px 24px rgba(0,0,0,.32),
    inset 12px 10px 22px rgba(255,255,255,.16),
    0 0 0 2px rgba(255,229,151,.25),
    0 0 35px rgba(240,191,67,.24);
}

#zingoProWorld.zingo-pro-exact-final .zpro-ball::before,
#zingoProWorld.zingo-pro-exact-final .zpro-ball::after{
  content:"";
  position:absolute;
  inset:19% 18%;
  border:2px solid rgba(99,67,22,.68);
  border-radius:50%;
  transform:rotate(32deg);
}

#zingoProWorld.zingo-pro-exact-final .zpro-ball::after{
  inset:34% 33%;
  border-radius:22%;
  transform:rotate(-16deg);
}

#zingoProWorld.zingo-pro-exact-final .zpro-hero-crown{
  position:absolute;
  top:8px;
  right:10px;
  width:44px;
  height:44px;
  display:grid;
  place-items:center;
  color:#ffe28c;
  filter:drop-shadow(0 0 13px rgba(255,211,88,.62));
  transform:rotate(7deg);
}

#zingoProWorld.zingo-pro-exact-final .zpro-hero-crown svg{
  width:39px;
  height:39px;
}

#zingoProWorld.zingo-pro-exact-final .zpro-orbit{
  position:absolute;
  width:145px;
  height:78px;
  border:1px solid rgba(255,216,106,.20);
  border-left-color:transparent;
  border-right-color:transparent;
  border-radius:50%;
  transform:rotate(-18deg);
}

#zingoProWorld.zingo-pro-exact-final .zpro-spark{
  position:absolute;
  width:4px;
  height:4px;
  border-radius:50%;
  background:#fff0ad;
  box-shadow:0 0 12px rgba(240,191,67,.72);
}

#zingoProWorld.zingo-pro-exact-final .s1{
  right:10px;
  top:33px;
}

#zingoProWorld.zingo-pro-exact-final .s2{
  right:50px;
  top:3px;
  width:3px;
  height:3px;
}

#zingoProWorld.zingo-pro-exact-final .s3{
  right:135px;
  top:33px;
  width:3px;
  height:3px;
}

#zingoProWorld.zingo-pro-exact-final .s4{
  right:116px;
  top:142px;
}

#zingoProWorld.zingo-pro-exact-final .s5{
  right:32px;
  top:132px;
  width:3px;
  height:3px;
}

#zingoProWorld.zingo-pro-exact-final .zpro-section-head{
  display:flex;
  align-items:end;
  justify-content:space-between;
  gap:10px;
  margin:18px 2px 10px;
}

#zingoProWorld.zingo-pro-exact-final .zpro-section-kicker{
  color:#7c715f;
  font-size:8px;
  letter-spacing:1.8px;
  font-weight:900;
}

#zingoProWorld.zingo-pro-exact-final .zpro-section-title{
  margin-top:2px;
  font-size:16px;
  font-weight:1000;
  color:#fff4d4;
}

#zingoProWorld.zingo-pro-exact-final .zpro-line{
  flex:1;
  height:1px;
  margin-bottom:4px;
  background:linear-gradient(
    90deg,
    transparent,
    var(--zpro-line2),
    transparent
  );
}

#zingoProWorld.zingo-pro-exact-final .zpro-features{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:8px;
}

#zingoProWorld.zingo-pro-exact-final .zpro-feature{
  min-height:104px;
  padding:11px 8px 10px;
  border-radius:18px;
  border:1px solid rgba(255,215,111,.15);
  background:
    linear-gradient(
      180deg,
      rgba(255,221,136,.06),
      rgba(255,221,136,.015)
    ),
    rgba(16,13,10,.86);
  box-shadow:
    0 10px 28px rgba(0,0,0,.27),
    inset 0 1px 0 rgba(255,244,200,.04);
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
}

#zingoProWorld.zingo-pro-exact-final .zpro-feature-icon{
  width:38px;
  height:38px;
  border-radius:13px;
  display:grid;
  place-items:center;
  margin-bottom:8px;
  color:#f6cf68;
  border:1px solid rgba(255,215,111,.20);
  background:
    linear-gradient(
      145deg,
      rgba(240,191,67,.13),
      rgba(240,191,67,.03)
    );
  box-shadow:0 0 22px rgba(240,191,67,.07);
}

#zingoProWorld.zingo-pro-exact-final .zpro-feature-title{
  font-size:10px;
  line-height:1.45;
  font-weight:900;
  color:#f7eed7;
}

#zingoProWorld.zingo-pro-exact-final .zpro-feature-note{
  margin-top:5px;
  font-size:7px;
  line-height:1.4;
  color:#827765;
}

#zingoProWorld.zingo-pro-exact-final .zpro-matches{
  display:grid;
  gap:8px;
}

#zingoProWorld.zingo-pro-exact-final .zpro-match{
  border:1px solid rgba(255,212,96,.14);
  border-radius:17px;
  background:
    linear-gradient(
      105deg,
      rgba(255,215,120,.038),
      transparent 22% 72%,
      rgba(240,191,67,.05)
    ),
    rgba(14,12,10,.92);
  box-shadow:0 10px 24px rgba(0,0,0,.25);
  overflow:hidden;
}

#zingoProWorld.zingo-pro-exact-final .zpro-match summary{
  list-style:none;
  cursor:pointer;
  display:grid;
  grid-template-columns:50px 1fr 64px;
  align-items:center;
  gap:10px;
  padding:11px;
}

#zingoProWorld.zingo-pro-exact-final .zpro-match summary::-webkit-details-marker{
  display:none;
}

#zingoProWorld.zingo-pro-exact-final .zpro-match-date{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:3px;
  min-height:42px;
  border-radius:12px;
  background:rgba(240,191,67,.07);
  border:1px solid rgba(240,191,67,.12);
}

#zingoProWorld.zingo-pro-exact-final .zpro-match-date b{
  font-size:12px;
  line-height:1;
  color:#f5d578;
}

#zingoProWorld.zingo-pro-exact-final .zpro-match-date span{
  font-size:7px;
  color:#8f836e;
}

#zingoProWorld.zingo-pro-exact-final .zpro-teams{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  min-width:0;
}

#zingoProWorld.zingo-pro-exact-final .zpro-team{
  display:flex;
  align-items:center;
  gap:6px;
  min-width:0;
  color:#f1ead8;
  font-size:9px;
  font-weight:800;
}

#zingoProWorld.zingo-pro-exact-final .zpro-team em{
  width:24px;
  height:24px;
  flex:0 0 24px;
  border-radius:50%;
  display:grid;
  place-items:center;
  font-style:normal;
  font-size:9px;
  color:#0a0a0a;
  background:
    linear-gradient(
      145deg,
      #fff2bb,
      #e1b850 45%,
      #8e5d12
    );
  box-shadow:0 0 13px rgba(240,191,67,.16);
}

#zingoProWorld.zingo-pro-exact-final .zpro-vs{
  color:#6e624e;
  font-size:8px;
  font-weight:1000;
}

#zingoProWorld.zingo-pro-exact-final .zpro-league{
  margin-top:4px;
  font-size:7px;
  color:#7e725e;
  text-align:center;
}

#zingoProWorld.zingo-pro-exact-final .zpro-status{
  display:flex;
  flex-direction:column;
  align-items:flex-end;
  gap:5px;
}

#zingoProWorld.zingo-pro-exact-final .zpro-time{
  color:#fff1c5;
  font-size:9px;
  font-weight:900;
}

#zingoProWorld.zingo-pro-exact-final .zpro-live{
  display:inline-flex;
  align-items:center;
  gap:4px;
  padding:4px 7px;
  border-radius:99px;
  font-size:6px;
  font-weight:1000;
  color:#f4cf68;
  border:1px solid rgba(240,191,67,.20);
  background:rgba(240,191,67,.05);
}

#zingoProWorld.zingo-pro-exact-final .zpro-live-dot{
  width:5px;
  height:5px;
  border-radius:50%;
  background:#f0bf43;
  box-shadow:0 0 9px rgba(240,191,67,.82);
}

#zingoProWorld.zingo-pro-exact-final .zpro-match-extra{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:7px;
  padding:0 11px 11px;
}

#zingoProWorld.zingo-pro-exact-final .zpro-extra{
  min-height:44px;
  padding:8px 9px;
  border-radius:11px;
  border:1px solid rgba(255,216,111,.10);
  background:rgba(255,255,255,.018);
}

#zingoProWorld.zingo-pro-exact-final .zpro-extra b{
  display:block;
  font-size:7px;
  color:#6f6454;
  margin-bottom:3px;
}

#zingoProWorld.zingo-pro-exact-final .zpro-extra span{
  font-size:9px;
  font-weight:800;
  color:#d6c9aa;
}

#zingoProWorld.zingo-pro-exact-final .zpro-cta{
  position:relative;
  margin-top:16px;
  width:100%;
  border:1px solid rgba(255,239,178,.74);
  border-radius:19px;
  padding:14px 16px;
  color:#171108;
  background:
    linear-gradient(
      135deg,
      #fff0a4 0%,
      #f5cf65 27%,
      #d79f28 67%,
      #ffe08b 100%
    );
  box-shadow:
    0 13px 32px rgba(0,0,0,.34),
    0 0 35px rgba(240,191,67,.18),
    inset 0 1px 0 rgba(255,255,255,.72);
  text-align:center;
  cursor:pointer;
  overflow:hidden;
  transition:
    transform .18s ease,
    filter .18s ease;
}

#zingoProWorld.zingo-pro-exact-final .zpro-cta:active,
#zingoProWorld.zingo-pro-exact-final .zpro-cta.is-pressed{
  transform:translateY(1px) scale(.985);
  filter:brightness(.96);
}

#zingoProWorld.zingo-pro-exact-final .zpro-cta::before{
  content:"";
  position:absolute;
  top:0;
  bottom:0;
  left:-35%;
  width:28%;
  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,.46),
      transparent
    );
  transform:skewX(-18deg);
  transition:transform .65s ease;
}

#zingoProWorld.zingo-pro-exact-final .zpro-cta:hover::before,
#zingoProWorld.zingo-pro-exact-final .zpro-cta:focus-visible::before{
  transform:translateX(460%) skewX(-18deg);
}

#zingoProWorld.zingo-pro-exact-final .zpro-cta-title{
  position:relative;
  z-index:1;
  display:block;
  font-size:15px;
  font-weight:1000;
}

#zingoProWorld.zingo-pro-exact-final .zpro-cta-sub{
  position:relative;
  z-index:1;
  display:block;
  margin-top:3px;
  font-size:8px;
  font-weight:900;
}

#zingoProWorld.zingo-pro-exact-final .zpro-trust{
  display:flex;
  justify-content:center;
  flex-wrap:wrap;
  gap:10px;
  margin-top:8px;
  color:#6f6454;
  font-size:6.5px;
}

#zingoProWorld.zingo-pro-exact-final .zpro-trust span{
  display:inline-flex;
  align-items:center;
  gap:4px;
}

#zingoProWorld.zingo-pro-exact-final .zpro-nav{
  position:absolute;
  left:10px;
  right:10px;
  bottom:10px;
  display:grid;
  grid-template-columns:repeat(5,1fr);
  gap:5px;
  padding:7px;
  border-radius:20px;
  border:1px solid rgba(255,216,111,.14);
  background:rgba(10,9,8,.92);
  backdrop-filter:blur(18px);
  box-shadow:
    0 14px 32px rgba(0,0,0,.42),
    0 0 24px rgba(240,191,67,.05);
}

#zingoProWorld.zingo-pro-exact-final .zpro-nav a{
  min-height:48px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:3px;
  border-radius:14px;
  text-decoration:none;
  color:#756a59;
  font-size:6.5px;
  font-weight:800;
  border:1px solid transparent;
  transition:
    transform .18s ease,
    background .18s ease,
    color .18s ease,
    border-color .18s ease,
    box-shadow .18s ease;
  position:relative;
}

#zingoProWorld.zingo-pro-exact-final .zpro-nav a:active{
  transform:scale(.96);
}

#zingoProWorld.zingo-pro-exact-final .zpro-nav .is-active{
  color:#f6d16e;
  background:
    linear-gradient(
      145deg,
      rgba(240,191,67,.14),
      rgba(240,191,67,.035)
    );
  border-color:rgba(240,191,67,.23);
  box-shadow:
    0 0 22px rgba(240,191,67,.08),
    inset 0 1px 0 rgba(255,239,181,.06);
}

#zingoProWorld.zingo-pro-exact-final .zpro-nav .nav-icon{
  width:23px;
  height:23px;
  display:grid;
  place-items:center;
  border-radius:9px;
}

#zingoProWorld.zingo-pro-exact-final .zpro-pro-pill{
  position:absolute;
  top:-14px;
  right:50%;
  transform:translateX(50%);
  min-width:58px;
  padding:4px 9px;
  border-radius:99px;
  color:#1d1407;
  background:
    linear-gradient(
      145deg,
      #fff0aa,
      #f2c85d 55%,
      #bb7b13
    );
  border:1px solid rgba(255,238,178,.82);
  box-shadow:0 0 17px rgba(240,191,67,.35);
  font-size:8px;
  font-weight:1000;
  letter-spacing:1px;
}

#zingoProWorld.zingo-pro-exact-final .zpro-nav .is-active .nav-icon{
  background:rgba(240,191,67,.11);
  box-shadow:0 0 15px rgba(240,191,67,.08);
}

#zingoProWorld.zingo-pro-exact-final .zpro-nav .is-active .nav-label{
  font-weight:1000;
}

#zingoProWorld.zingo-pro-exact-final .zpro-note{
  margin-top:12px;
  text-align:center;
  color:#5e5547;
  font-size:6.5px;
  line-height:1.6;
}

@media (min-width:560px){
  #zingoProWorld.zingo-pro-exact-final{
    padding-top:28px;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-phone{
    min-height:720px;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-screen{
    min-height:704px;
  }
}

@media (max-width:390px){
  #zingoProWorld.zingo-pro-exact-final{
    padding:10px 7px 18px;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-phone{
    padding:6px;
    border-radius:29px;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-screen{
    border-radius:23px;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-wrap{
    padding:11px 9px 112px;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-hero{
    min-height:177px;
    padding:18px 14px;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-hero-art{
    transform:scale(.90) rotate(-6deg);
    right:-14px;
    top:18px;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-features{
    gap:6px;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-feature{
    padding-left:5px;
    padding-right:5px;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-match summary{
    grid-template-columns:45px 1fr 57px;
    gap:7px;
    padding:9px 8px;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-nav{
    left:8px;
    right:8px;
    bottom:8px;
  }
}

</style>
"""


# ============================================================
# 3) SVG ICONS
# ============================================================

def svg(body):
    return (
        '<svg viewBox="0 0 24 24" aria-hidden="true" '
        'fill="none" stroke="currentColor" stroke-width="1.7" '
        'stroke-linecap="round" stroke-linejoin="round">'
        f"{body}</svg>"
    )


I = {
    "arrow": svg(
        '<path d="M15 18l-6-6 6-6"/>'
        '<path d="M9 12h11"/>'
    ),

    "crown": svg(
        '<path d="M3 7l4 3 5-7 5 7 4-3-2 12H5L3 7Z"/>'
        '<path d="M5 19h14"/>'
    ),

    "chart": svg(
        '<path d="M4 19V5"/>'
        '<path d="M4 19h16"/>'
        '<path d="M8 16v-5"/>'
        '<path d="M12 16V8"/>'
        '<path d="M16 16v-9"/>'
    ),

    "trophy": svg(
        '<path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/>'
        '<path d="M6 6H3a4 4 0 0 0 4 4"/>'
        '<path d="M18 6h3a4 4 0 0 1-4 4"/>'
        '<path d="M12 12v5"/>'
        '<path d="M8 21h8"/>'
        '<path d="M9 17h6"/>'
    ),

    "gift": svg(
        '<path d="M20 12v8H4v-8"/>'
        '<path d="M2 7h20v5H2z"/>'
        '<path d="M12 7v13"/>'
        '<path d="M12 7H8.5a2.5 2.5 0 1 1 2.5-2.5V7Z"/>'
        '<path d="M12 7h3.5A2.5 2.5 0 1 0 13 4.5V7Z"/>'
    ),

    "home": svg(
        '<path d="m3 10 9-7 9 7"/>'
        '<path d="M5 9v11h14V9"/>'
        '<path d="M9 20v-6h6v6"/>'
    ),

    "matches": svg(
        '<circle cx="8" cy="8" r="3"/>'
        '<circle cx="16" cy="16" r="3"/>'
        '<path d="M10.5 10.5 13.5 13.5"/>'
    ),

    "user": svg(
        '<circle cx="12" cy="8" r="4"/>'
        '<path d="M4 21a8 8 0 0 1 16 0"/>'
    ),

    "more": svg(
        '<circle cx="5" cy="12" r="1"/>'
        '<circle cx="12" cy="12" r="1"/>'
        '<circle cx="19" cy="12" r="1"/>'
    ),

    "check": svg(
        '<path d="m5 12 4 4L19 6"/>'
    ),
}


# ============================================================
# 4) FULL PRO UI
# ============================================================

pro_html = f"""
<section id="zingoProWorld"
         class="zingo-world hidden zingo-pro-exact-final"
         dir="rtl"
         aria-label="واجهة ZINGO PRO">

  <div class="zpro-phone">
    <div class="zpro-screen">

      <span class="zpro-light"></span>

      <div class="zpro-wrap">

        <header class="zpro-topbar">

          <button class="zpro-icon-btn"
                  type="button"
                  aria-label="رجوع"
                  onclick="if(window.Zingo&&typeof window.Zingo.go==='function'){{window.Zingo.go('home')}}">
            {I["arrow"]}
          </button>

          <div class="zpro-brand">

            <div class="zpro-logo" aria-hidden="true">Z</div>

            <div>
              <div class="zpro-brand-title">ZINGO</div>
              <div class="zpro-brand-sub">FOOTBALL PRO</div>
            </div>

          </div>

          <button class="zpro-crown"
                  type="button"
                  aria-label="PRO">
            {I["crown"]}
          </button>

        </header>


        <section class="zpro-hero"
                 aria-label="ZINGO PRO">

          <span class="zpro-kicker">
            <span class="zpro-kicker-dot"></span>
            WEEKLY MISSION
          </span>

          <div class="zpro-hero-title">
            ZINGO PRO
          </div>

          <div class="zpro-hero-sub">
            اشتراك احترافي لعشاق كرة القدم
          </div>

          <div class="zpro-hero-copy">
            تحليلات أعمق، مسابقات خاصة، ومكافآت مصممة لتجربة كروية أكثر تميزًا.
          </div>

          <div class="zpro-hero-art" aria-hidden="true">

            <span class="zpro-orbit"></span>

            <span class="zpro-ball"></span>

            <span class="zpro-hero-crown">
              {I["crown"]}
            </span>

            <i class="zpro-spark s1"></i>
            <i class="zpro-spark s2"></i>
            <i class="zpro-spark s3"></i>
            <i class="zpro-spark s4"></i>
            <i class="zpro-spark s5"></i>

          </div>

        </section>


        <div class="zpro-section-head">

          <div>
            <div class="zpro-section-kicker">
              PRO EXPERIENCE
            </div>

            <div class="zpro-section-title">
              مزاياك الحصرية
            </div>
          </div>

          <div class="zpro-line"></div>

        </div>


        <section class="zpro-features"
                 aria-label="مزايا PRO">

          <article class="zpro-feature">

            <div class="zpro-feature-icon">
              {I["chart"]}
            </div>

            <div class="zpro-feature-title">
              تحليلات متقدمة
            </div>

            <div class="zpro-feature-note">
              قراءة أعمق للمباريات
            </div>

          </article>


          <article class="zpro-feature">

            <div class="zpro-feature-icon">
              {I["trophy"]}
            </div>

            <div class="zpro-feature-title">
              مسابقات خاصة
            </div>

            <div class="zpro-feature-note">
              جولات وتحديات حصرية
            </div>

          </article>


          <article class="zpro-feature">

            <div class="zpro-feature-icon">
              {I["gift"]}
            </div>

            <div class="zpro-feature-title">
              جوائز حصرية
            </div>

            <div class="zpro-feature-note">
              مكافآت وتجارب مميزة
            </div>

          </article>

        </section>


        <div class="zpro-section-head">

          <div>
            <div class="zpro-section-kicker">
              WEEKLY CHALLENGES
            </div>

            <div class="zpro-section-title">
              المسابقات الخاصة
            </div>
          </div>

          <div class="zpro-line"></div>

        </div>


        <section class="zpro-matches"
                 aria-label="المسابقات الخاصة">


          <details class="zpro-match" open>

            <summary>

              <div class="zpro-match-date">
                <b>20:45</b>
                <span>اليوم</span>
              </div>

              <div>

                <div class="zpro-teams">

                  <div class="zpro-team">
                    <em>ر</em>
                    <span>ريال مدريد</span>
                  </div>

                  <span class="zpro-vs">VS</span>

                  <div class="zpro-team">
                    <span>برشلونة</span>
                    <em>ب</em>
                  </div>

                </div>

                <div class="zpro-league">
                  الدوري الإسباني • مسابقة PRO
                </div>

              </div>

              <div class="zpro-status">
                <div class="zpro-time">متاح</div>

                <span class="zpro-live">
                  <i class="zpro-live-dot"></i>
                  مفتوح
                </span>
              </div>

            </summary>


            <div class="zpro-match-extra">

              <div class="zpro-extra">
                <b>حالة الجولة</b>
                <span>التوقع مفتوح</span>
              </div>

              <div class="zpro-extra">
                <b>القفل</b>
                <span>قبل البداية بساعة</span>
              </div>

            </div>

          </details>


          <details class="zpro-match">

            <summary>

              <div class="zpro-match-date">
                <b>22:00</b>
                <span>اليوم</span>
              </div>

              <div>

                <div class="zpro-teams">

                  <div class="zpro-team">
                    <em>م</em>
                    <span>مانشستر سيتي</span>
                  </div>

                  <span class="zpro-vs">VS</span>

                  <div class="zpro-team">
                    <span>ليفربول</span>
                    <em>ل</em>
                  </div>

                </div>

                <div class="zpro-league">
                  الدوري الإنجليزي • مسابقة PRO
                </div>

              </div>

              <div class="zpro-status">

                <div class="zpro-time">
                  غدًا
                </div>

                <span class="zpro-live">
                  <i class="zpro-live-dot"></i>
                  محجوز
                </span>

              </div>

            </summary>


            <div class="zpro-match-extra">

              <div class="zpro-extra">
                <b>المنافسة</b>
                <span>توقع النتيجة والأهداف</span>
              </div>

              <div class="zpro-extra">
                <b>الحالة</b>
                <span>سيُفتح تلقائيًا</span>
              </div>

            </div>

          </details>


          <details class="zpro-match">

            <summary>

              <div class="zpro-match-date">
                <b>21:30</b>
                <span>السبت</span>
              </div>

              <div>

                <div class="zpro-teams">

                  <div class="zpro-team">
                    <em>إ</em>
                    <span>إنتر ميلان</span>
                  </div>

                  <span class="zpro-vs">VS</span>

                  <div class="zpro-team">
                    <span>ميلان</span>
                    <em>م</em>
                  </div>

                </div>

                <div class="zpro-league">
                  الدوري الإيطالي • مسابقة PRO
                </div>

              </div>

              <div class="zpro-status">

                <div class="zpro-time">
                  القادمة
                </div>

                <span class="zpro-live">
                  <i class="zpro-live-dot"></i>
                  متاحة
                </span>

              </div>

            </summary>


            <div class="zpro-match-extra">

              <div class="zpro-extra">
                <b>المهمة</b>
                <span>نتيجة المباراة + الأهداف</span>
              </div>

              <div class="zpro-extra">
                <b>المكافأة</b>
                <span>نقاط PRO إضافية</span>
              </div>

            </div>

          </details>

        </section>


        <button class="zpro-cta"
                type="button"
                aria-label="اشترك الآن واحصل على مزايا PRO"
                onclick="this.classList.add('is-pressed');var t=this.querySelector('.zpro-cta-title');t.textContent='تم اختيار الاشتراك';var b=this;setTimeout(function(){{b.classList.remove('is-pressed');t.textContent='اشترك الآن'}},1200)">

          <span class="zpro-cta-title">
            اشترك الآن
          </span>

          <span class="zpro-cta-sub">
            احصل على مزايا PRO
          </span>

        </button>


        <div class="zpro-trust">

          <span>
            {I["check"]}
            تفعيل آمن
          </span>

          <span>
            {I["check"]}
            مزايا حصرية
          </span>

          <span>
            {I["check"]}
            تجربة متقدمة
          </span>

        </div>


        <div class="zpro-note">
          ZINGO PRO • تجربة كرة قدم مصممة للمستخدمين المحترفين
        </div>

      </div>


      <nav class="zpro-nav"
           aria-label="التنقل السفلي">

        <a href="#"
           onclick="if(window.Zingo&&typeof window.Zingo.go==='function'){{window.Zingo.go('home')}};return false;">

          <span class="nav-icon">
            {I["home"]}
          </span>

          <span class="nav-label">
            الرئيسية
          </span>

        </a>


        <a href="#"
           onclick="if(window.Zingo&&typeof window.Zingo.go==='function'){{window.Zingo.go('matches')}};return false;">

          <span class="nav-icon">
            {I["matches"]}
          </span>

          <span class="nav-label">
            المباريات
          </span>

        </a>


        <a href="#"
           class="is-active"
           aria-current="page">

          <span class="zpro-pro-pill">
            PRO
          </span>

          <span class="nav-icon">
            {I["crown"]}
          </span>

          <span class="nav-label">
            اشتراك احترافي
          </span>

        </a>


        <a href="#"
           onclick="if(window.zingoOpenProfileEditor){{window.zingoOpenProfileEditor()}};return false;">

          <span class="nav-icon">
            {I["user"]}
          </span>

          <span class="nav-label">
            الملف الشخصي
          </span>

        </a>


        <a href="#"
           onclick="window.scrollTo({{top:0,behavior:'smooth'}});return false;">

          <span class="nav-icon">
            {I["more"]}
          </span>

          <span class="nav-label">
            المزيد
          </span>

        </a>

      </nav>

    </div>
  </div>

</section>
"""


# ============================================================
# 5) REMOVE OUR PREVIOUS FINAL STYLE ONLY
# ============================================================

cleaned = re.sub(
    rf'<style\b[^>]*id=["\']{re.escape(STYLE_ID)}["\'][^>]*>.*?</style\s*>',
    '',
    original,
    flags=re.I | re.S
)


# ============================================================
# 6) REPLACE PRO ONLY
# ============================================================

pro_m2 = one_match(PRO_START_RE, cleaned, "zingoProWorld")
vip_m2 = one_match(VIP_START_RE, cleaned, "zingoVipWorld")

new_html = (
    cleaned[:pro_m2.start()]
    + pro_html.strip()
    + "\n\n"
    + cleaned[vip_m2.start():]
)


# ============================================================
# 7) INSERT STYLE INTO HEAD
# ============================================================

head_close = re.search(r'</head\s*>', new_html, re.I)

if not head_close:
    raise SystemExit("❌ </head> غير موجود")

new_html = (
    new_html[:head_close.start()]
    + style.strip()
    + "\n"
    + new_html[head_close.start():]
)


# ============================================================
# 8) STRUCTURE CHECK
# ============================================================

pro_final = one_match(
    PRO_START_RE,
    new_html,
    "zingoProWorld after patch"
)

vip_final = one_match(
    VIP_START_RE,
    new_html,
    "zingoVipWorld after patch"
)

free_final = one_match(
    FREE_START_RE,
    new_html,
    "zingoFreeWorld after patch"
)

if pro_final.start() >= vip_final.start():
    raise SystemExit(
        "❌ ترتيب PRO/VIP بعد التعديل غير صحيح"
    )


# ============================================================
# 9) FREE MUST REMAIN EXACTLY THE SAME
# ============================================================

free_block_after = new_html[
    free_final.start():pro_final.start()
]

if free_block_after != free_block:
    raise SystemExit(
        "❌ FREE_SECTION_CHANGED"
    )


# ============================================================
# 10) ALL SCRIPT TAGS MUST REMAIN BYTE-FOR-BYTE
# ============================================================

script_re = re.compile(
    r'<script\b[^>]*>.*?</script\s*>',
    re.I | re.S
)

old_scripts = script_re.findall(original)
new_scripts = script_re.findall(new_html)

if old_scripts != new_scripts:
    raise SystemExit(
        "❌ SCRIPT_TAGS_CHANGED"
    )


# ============================================================
# 11) IMPORTANT PROJECT MARKERS MUST REMAIN
# ============================================================

required = [
    "/api/subscription",
    "window.zingoOpenProfileEditor",
    "Telegram.WebApp",
]

missing = [
    marker
    for marker in required
    if marker not in new_html
]

if missing:
    raise SystemExit(
        "❌ REQUIRED_MARKERS_MISSING: "
        + ", ".join(missing)
    )


# ============================================================
# 12) MAKE BACKUP BEFORE WRITING
# ============================================================

backup = (
    ROOT
    / "index_before_pro_exact_final_20260926.html"
)

if backup.exists():
    backup = (
        ROOT
        / (
            "index_before_pro_exact_final_20260926_"
            + time.strftime("%H%M%S")
            + ".html"
        )
    )

shutil.copy2(INDEX, backup)


# ============================================================
# 13) WRITE NEW INDEX
# ============================================================

INDEX.write_text(
    new_html,
    encoding="utf-8"
)


# ============================================================
# 14) NODE JS SYNTAX CHECK
# ============================================================

inline_scripts = re.findall(
    r'<script\b(?![^>]*\bsrc=)[^>]*>(.*?)</script\s*>',
    new_html,
    re.I | re.S
)

with tempfile.TemporaryDirectory(
    prefix="zingo_js_"
) as td:

    td_path = Path(td)

    for i, body in enumerate(
        inline_scripts,
        1
    ):

        js = body.strip()

        if not js:
            continue

        js_file = td_path / f"script_{i}.js"

        js_file.write_text(
            js,
            encoding="utf-8"
        )

        proc = subprocess.run(
            [
                "node",
                "--check",
                str(js_file)
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        if proc.returncode != 0:

            shutil.copy2(
                backup,
                INDEX
            )

            print(proc.stdout, end="")
            print(proc.stderr, end="")

            raise SystemExit(
                f"❌ JS_SYNTAX_ERROR_IN_SCRIPT_{i}; "
                "تم استرجاع index.html"
            )


# ============================================================
# 15) FINAL REPORT
# ============================================================

print("✅ تم تطبيق تصميم PRO النهائي الكامل.")
print(f"BACKUP={backup.name}")
print(
    f"OLD_SIZE={len(original.encode('utf-8'))}"
)
print(
    f"NEW_SIZE={len(new_html.encode('utf-8'))}"
)
print(f"SCRIPTS={len(new_scripts)}")
print("JS=ALL_OK")
print("PRO_UI=FULL_PROMPT_FINAL")
print("FREE_SECTION=UNCHANGED")
print("VIP_SECTION=KEPT")
print("API_JS=UNCHANGED_BYTE_FOR_BYTE")
print("PROFILE=UNCHANGED")
print("TELEGRAM=UNCHANGED")
print("BOT=NOT_TOUCHED")
print("WORKER=NOT_TOUCHED")
print("DEPLOY=NOT_PERFORMED")

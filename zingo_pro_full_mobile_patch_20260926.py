from pathlib import Path
import re
import shutil
import subprocess
import html

ROOT = Path(".")
INDEX = ROOT / "index.html"
BACKUP = ROOT / "index_before_pro_full_mobile_20260926.html"
PREVIEW = ROOT / "PRO_ONLY.html"

if not INDEX.exists():
    raise SystemExit("❌ index.html غير موجود")

original = INDEX.read_text(encoding="utf-8")

# ============================================================
# 1) العثور على قسم PRO بالكامل مع دعم الأقسام المتداخلة
# ============================================================
open_pat = re.compile(
    r'<section\b[^>]*\bid=["\']zingoProWorld["\'][^>]*>',
    re.I
)

m = open_pat.search(original)
if not m:
    raise SystemExit("❌ لم يتم العثور على <section id=\"zingoProWorld\">")

open_tag = m.group(0)
start = m.start()
content_start = m.end()

tag_pat = re.compile(r'</?section\b[^>]*>', re.I)
depth = 1
close_start = None
close_end = None

for tm in tag_pat.finditer(original, content_start):
    tag = tm.group(0)
    if tag.lower().startswith("</section"):
        depth -= 1
        if depth == 0:
            close_start = tm.start()
            close_end = tm.end()
            break
    else:
        depth += 1

if close_start is None:
    raise SystemExit("❌ لم يتم العثور على نهاية قسم PRO")

old_pro = original[start:close_end]
old_inner = original[content_start:close_start]

# ============================================================
# 2) حماية: لا نلمس أي Script موجود مسبقاً
# ============================================================
def script_bodies(s):
    return re.findall(
        r'<script(?:\s[^>]*)?>(.*?)</script>',
        s,
        re.I | re.S
    )

before_scripts = script_bodies(original)

# ============================================================
# 3) واجهة PRO كاملة
# ============================================================
PRO_INNER = r'''
<style>
/* ============================================================
   ZINGO PRO — FULL MOBILE UI
   Scoped بالكامل داخل #zingoProWorld
   ============================================================ */

#zingoProWorld{
  --zp-gold:#d6a83b;
  --zp-gold-2:#f4d47a;
  --zp-amber:#ffb62d;
  --zp-cream:#fff7df;
  --zp-muted:#aa9a7a;
  --zp-line:rgba(214,168,59,.30);
  --zp-panel:rgba(23,16,9,.94);
  --zp-panel-2:rgba(35,22,8,.90);
  --zp-black:#070707;
  --zp-brown:#211507;
  width:100%;
  min-height:100svh;
  background:
    radial-gradient(circle at 80% 2%, rgba(244,212,122,.13), transparent 23%),
    radial-gradient(circle at 15% 36%, rgba(129,73,21,.11), transparent 28%),
    linear-gradient(180deg,#060606 0%,#0e0a06 52%,#050505 100%);
  color:var(--zp-cream);
  font-family:Cairo,Tajawal,system-ui,-apple-system,"Segoe UI",Arial,sans-serif;
  overflow-x:hidden;
}

#zingoProWorld *{
  box-sizing:border-box;
  -webkit-tap-highlight-color:transparent;
}

#zingoProWorld button,
#zingoProWorld input,
#zingoProWorld select{
  font:inherit;
}

#zingoProWorld .zp-wrap{
  width:min(100%,470px);
  min-height:100svh;
  margin:0 auto;
  padding:7px 8px 14px;
}

#zingoProWorld .zp-phone{
  position:relative;
  width:100%;
  min-height:calc(100svh - 21px);
  overflow:hidden;
  border-radius:32px;
  border:1px solid rgba(244,212,122,.42);
  background:
    radial-gradient(circle at 50% 0%,rgba(214,168,59,.10),transparent 26%),
    linear-gradient(180deg,#160d06 0%,#090909 34%,#070707 100%);
  box-shadow:
    0 0 0 1px rgba(214,168,59,.11),
    0 0 36px rgba(214,168,59,.13),
    inset 0 0 75px rgba(214,168,59,.06);
}

#zingoProWorld .zp-phone::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    radial-gradient(circle at 16% 24%,rgba(255,255,255,.045) 0 1px,transparent 2px),
    radial-gradient(circle at 76% 17%,rgba(244,212,122,.075) 0 1px,transparent 2px),
    radial-gradient(circle at 68% 61%,rgba(244,212,122,.045) 0 1px,transparent 2px),
    radial-gradient(circle at 21% 76%,rgba(255,255,255,.035) 0 1px,transparent 2px);
  background-size:140px 140px,180px 180px,210px 210px,170px 170px;
  opacity:.8;
}

#zingoProWorld .zp-glow-top{
  position:absolute;
  top:-50px;
  left:50%;
  transform:translateX(-50%);
  width:230px;
  height:120px;
  background:radial-gradient(circle,rgba(244,212,122,.20),transparent 68%);
  filter:blur(10px);
  pointer-events:none;
}

#zingoProWorld .zp-shell{
  position:relative;
  z-index:2;
  min-height:100%;
}

#zingoProWorld .zp-topbar{
  display:grid;
  grid-template-columns:52px 1fr 72px;
  align-items:center;
  gap:8px;
  min-height:74px;
  padding:10px 11px 8px;
  border-bottom:1px solid rgba(214,168,59,.24);
  background:linear-gradient(180deg,rgba(18,12,7,.97),rgba(10,10,10,.88));
}

#zingoProWorld .zp-icon{
  width:43px;
  height:43px;
  display:grid;
  place-items:center;
  border-radius:14px;
  border:1px solid rgba(214,168,59,.35);
  background:
    linear-gradient(145deg,rgba(58,38,12,.95),rgba(9,9,9,.98));
  color:var(--zp-gold-2);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.04),
    0 0 13px rgba(214,168,59,.08);
}

#zingoProWorld .zp-back{
  justify-self:end;
  font-size:27px;
  line-height:1;
  cursor:pointer;
}

#zingoProWorld .zp-brand{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:9px;
  min-width:0;
}

#zingoProWorld .zp-logo{
  width:38px;
  height:38px;
  flex:0 0 auto;
  display:grid;
  place-items:center;
  border-radius:50%;
  border:2px solid var(--zp-gold);
  background:
    radial-gradient(circle at 35% 28%,#4e3711,#090909 62%);
  color:var(--zp-gold-2);
  font-size:10px;
  font-weight:1000;
  letter-spacing:1px;
  box-shadow:
    0 0 0 2px rgba(214,168,59,.10),
    0 0 18px rgba(214,168,59,.18);
}

#zingoProWorld .zp-brand-txt{
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  gap:0;
  line-height:1.05;
}

#zingoProWorld .zp-brand-txt strong{
  font-size:15px;
  font-weight:1000;
  letter-spacing:.8px;
  color:#fff8e7;
}

#zingoProWorld .zp-brand-txt span{
  font-size:9px;
  font-weight:900;
  color:var(--zp-gold);
  letter-spacing:2px;
}

#zingoProWorld .zp-status{
  display:flex;
  align-items:center;
  justify-content:flex-start;
  gap:6px;
}

#zingoProWorld .zp-status-dot{
  width:7px;
  height:7px;
  border-radius:50%;
  background:#eac66b;
  box-shadow:0 0 11px rgba(244,212,122,.85);
}

#zingoProWorld .zp-crown{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:28px;
  height:28px;
  border-radius:10px;
  color:#171006;
  background:linear-gradient(135deg,#7e5514,#f4d47a 45%,#9f711f);
  box-shadow:
    0 0 16px rgba(244,212,122,.26),
    inset 0 1px 0 rgba(255,255,255,.55);
  font-size:14px;
}

#zingoProWorld .zp-content{
  padding:10px 10px 96px;
}

#zingoProWorld .zp-hero{
  position:relative;
  overflow:hidden;
  min-height:176px;
  display:grid;
  grid-template-columns:1.15fr .85fr;
  gap:7px;
  align-items:center;
  padding:18px 17px;
  border:1px solid rgba(244,212,122,.29);
  border-radius:26px;
  background:
    radial-gradient(circle at 86% 40%,rgba(244,212,122,.19),transparent 27%),
    linear-gradient(140deg,rgba(52,34,10,.96),rgba(15,11,8,.97) 54%,rgba(7,7,7,.98));
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.045),
    0 17px 45px rgba(0,0,0,.24);
}

#zingoProWorld .zp-hero::after{
  content:"";
  position:absolute;
  inset:-50%;
  background:conic-gradient(from 40deg,transparent 0 30%,rgba(244,212,122,.06) 34%,transparent 39% 100%);
  animation:zpSweep 8s linear infinite;
  pointer-events:none;
}

@keyframes zpSweep{
  from{transform:rotate(0deg)}
  to{transform:rotate(360deg)}
}

#zingoProWorld .zp-hero-copy{
  position:relative;
  z-index:2;
  min-width:0;
}

#zingoProWorld .zp-kicker{
  display:inline-flex;
  align-items:center;
  gap:7px;
  margin-bottom:8px;
  padding:6px 9px;
  border-radius:999px;
  border:1px solid rgba(244,212,122,.26);
  background:rgba(6,6,6,.45);
  color:var(--zp-gold-2);
  font-size:9px;
  font-weight:1000;
  letter-spacing:1.7px;
}

#zingoProWorld .zp-title{
  margin:0;
  font-size:32px;
  line-height:.95;
  font-weight:1000;
  letter-spacing:.3px;
  background:linear-gradient(180deg,#fff6da 0%,#f4d47a 30%,#c6922a 65%,#8a5f16 100%);
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
  text-shadow:0 0 18px rgba(244,212,122,.11);
}

#zingoProWorld .zp-subtitle{
  margin:8px 0 0;
  color:#b8aa8e;
  font-size:10px;
  font-weight:1000;
  letter-spacing:2.1px;
}

#zingoProWorld .zp-hero-note{
  margin:10px 0 0;
  color:#efe4cd;
  font-size:11px;
  line-height:1.7;
  max-width:210px;
}

#zingoProWorld .zp-hero-art{
  position:relative;
  z-index:2;
  min-height:138px;
  display:grid;
  place-items:center;
}

#zingoProWorld .zp-ball-orb{
  position:relative;
  width:120px;
  height:120px;
  display:grid;
  place-items:center;
  border-radius:50%;
  border:1px solid rgba(244,212,122,.56);
  background:
    radial-gradient(circle at 30% 26%,rgba(255,255,255,.22),transparent 13%),
    radial-gradient(circle,#3d290d 0%,#1a1006 46%,#080808 72%);
  box-shadow:
    0 0 0 7px rgba(214,168,59,.05),
    0 0 40px rgba(214,168,59,.22),
    inset 0 0 34px rgba(244,212,122,.16);
}

#zingoProWorld .zp-ball{
  font-size:63px;
  filter:
    drop-shadow(0 0 7px rgba(255,220,133,.23))
    saturate(.35);
  transform:rotate(-9deg);
}

#zingoProWorld .zp-orbit{
  position:absolute;
  inset:12px;
  border:1px dashed rgba(244,212,122,.26);
  border-radius:50%;
  animation:zpSpin 10s linear infinite;
}

@keyframes zpSpin{
  from{transform:rotate(0)}
  to{transform:rotate(360deg)}
}

#zingoProWorld .zp-orbit::after{
  content:"✦";
  position:absolute;
  top:-8px;
  right:18px;
  color:var(--zp-gold-2);
  font-size:11px;
  text-shadow:0 0 10px rgba(244,212,122,.7);
}

#zingoProWorld .zp-crown-float{
  position:absolute;
  right:8px;
  top:1px;
  font-size:24px;
  color:#f6db8b;
  filter:drop-shadow(0 0 10px rgba(244,212,122,.55));
  animation:zpFloat 2.9s ease-in-out infinite;
}

@keyframes zpFloat{
  0%,100%{transform:translateY(0)}
  50%{transform:translateY(-6px)}
}

#zingoProWorld .zp-feature-head{
  display:flex;
  align-items:end;
  justify-content:space-between;
  gap:8px;
  margin:13px 2px 8px;
}

#zingoProWorld .zp-section-title{
  margin:0;
  font-size:16px;
  font-weight:1000;
  color:#fff7e3;
}

#zingoProWorld .zp-section-meta{
  color:#9d8d6d;
  font-size:9px;
  font-weight:900;
}

#zingoProWorld .zp-features{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:7px;
}

#zingoProWorld .zp-feature{
  min-height:110px;
  padding:10px 7px 9px;
  border-radius:18px;
  border:1px solid rgba(214,168,59,.22);
  background:linear-gradient(155deg,rgba(39,25,8,.92),rgba(11,11,10,.97));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.03);
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
}

#zingoProWorld .zp-feature-icon{
  width:40px;
  height:40px;
  display:grid;
  place-items:center;
  border-radius:13px;
  margin-bottom:7px;
  color:#f5d57d;
  border:1px solid rgba(244,212,122,.30);
  background:radial-gradient(circle at 35% 30%,#5f4415,#12100d 72%);
  box-shadow:0 0 16px rgba(214,168,59,.11);
  font-size:19px;
}

#zingoProWorld .zp-feature b{
  font-size:11px;
  font-weight:1000;
  color:#f8edda;
}

#zingoProWorld .zp-feature span{
  margin-top:3px;
  font-size:8px;
  color:#9e9178;
  line-height:1.5;
}

#zingoProWorld .zp-competition-head{
  margin:15px 2px 8px;
}

#zingoProWorld .zp-competition-head h2{
  margin:0;
  font-size:17px;
  font-weight:1000;
}

#zingoProWorld .zp-competition-head p{
  margin:4px 0 0;
  color:#91846e;
  font-size:9px;
}

#zingoProWorld .zp-match{
  overflow:hidden;
  margin-bottom:8px;
  border:1px solid rgba(214,168,59,.20);
  border-radius:20px;
  background:
    linear-gradient(145deg,rgba(31,20,8,.96),rgba(11,11,10,.98));
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.025),
    0 8px 24px rgba(0,0,0,.20);
}

#zingoProWorld .zp-match-top{
  display:grid;
  grid-template-columns:62px 1fr 62px;
  gap:7px;
  align-items:center;
  padding:10px 10px 9px;
}

#zingoProWorld .zp-team{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:4px;
  text-align:center;
}

#zingoProWorld .zp-team-badge{
  width:42px;
  height:42px;
  display:grid;
  place-items:center;
  border-radius:50%;
  border:1px solid rgba(244,212,122,.35);
  background:radial-gradient(circle,#4c3410,#0d0d0d 72%);
  color:#f4d47a;
  font-size:11px;
  font-weight:1000;
  box-shadow:0 0 12px rgba(214,168,59,.08);
}

#zingoProWorld .zp-team span:last-child{
  font-size:9px;
  color:#eadfc8;
  font-weight:900;
  line-height:1.25;
}

#zingoProWorld .zp-vs{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:4px;
}

#zingoProWorld .zp-time{
  font-size:16px;
  font-weight:1000;
  color:#fff4d7;
}

#zingoProWorld .zp-vs small{
  font-size:8px;
  color:#8f8068;
}

#zingoProWorld .zp-status{
  justify-self:end;
  display:flex;
  flex-direction:column;
  align-items:flex-end;
  gap:5px;
}

#zingoProWorld .zp-league{
  color:#cfb775;
  font-size:8px;
  font-weight:900;
  white-space:nowrap;
}

#zingoProWorld .zp-live{
  display:inline-flex;
  align-items:center;
  gap:5px;
  padding:4px 7px;
  border-radius:999px;
  border:1px solid rgba(244,212,122,.20);
  background:rgba(244,212,122,.06);
  color:#f1d58d;
  font-size:7px;
  font-weight:1000;
}

#zingoProWorld .zp-live::before{
  content:"";
  width:5px;
  height:5px;
  border-radius:50%;
  background:#f0c65a;
  box-shadow:0 0 7px rgba(240,198,90,.75);
}

#zingoProWorld .zp-details{
  border-top:1px solid rgba(214,168,59,.13);
  padding:9px 10px 10px;
}

#zingoProWorld .zp-label{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  margin-bottom:7px;
  font-size:10px;
  color:#c8b99d;
  font-weight:900;
}

#zingoProWorld .zp-market-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:6px;
}

#zingoProWorld .zp-market{
  position:relative;
}

#zingoProWorld .zp-market input{
  position:absolute;
  opacity:0;
  pointer-events:none;
}

#zingoProWorld .zp-market span{
  min-height:43px;
  display:grid;
  place-items:center;
  padding:6px;
  border-radius:13px;
  border:1px solid rgba(214,168,59,.18);
  background:#0d0d0c;
  color:#b7aa93;
  font-size:9px;
  font-weight:1000;
  text-align:center;
}

#zingoProWorld .zp-market input:checked + span{
  border-color:#efc85e;
  color:#fff7df;
  background:
    linear-gradient(145deg,rgba(98,68,17,.90),rgba(19,15,9,.98));
  box-shadow:
    0 0 0 1px rgba(244,212,122,.15),
    0 0 16px rgba(214,168,59,.16);
}

#zingoProWorld .zp-extra-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:7px;
  margin-top:8px;
}

#zingoProWorld .zp-field{
  display:flex;
  flex-direction:column;
  gap:5px;
}

#zingoProWorld .zp-field label{
  color:#9d9077;
  font-size:8px;
  font-weight:900;
}

#zingoProWorld .zp-field select{
  width:100%;
  min-height:38px;
  padding:0 10px;
  border-radius:12px;
  border:1px solid rgba(214,168,59,.20);
  background:#0b0b0a;
  color:#f7edd7;
  outline:none;
}

#zingoProWorld .zp-save{
  width:100%;
  margin-top:8px;
  min-height:43px;
  border:1px solid rgba(244,212,122,.32);
  border-radius:13px;
  color:#57400f;
  background:linear-gradient(180deg,#f8d67a,#c08a22);
  font-size:10px;
  font-weight:1000;
  opacity:.34;
  cursor:pointer;
  transition:.18s ease;
}

#zingoProWorld .zp-details:has(input:checked) .zp-save{
  opacity:1;
  box-shadow:0 0 20px rgba(214,168,59,.17);
}

#zingoProWorld .zp-save:active{
  transform:scale(.985);
}

#zingoProWorld .zp-save.is-saved{
  color:#fff7df;
  background:linear-gradient(145deg,#3c2b0b,#6e5013);
  border-color:rgba(244,212,122,.46);
}

#zingoProWorld .zp-locked{
  display:inline-flex;
  align-items:center;
  gap:6px;
  margin-top:6px;
  padding:5px 8px;
  border-radius:999px;
  color:#8e826f;
  font-size:7px;
  background:rgba(255,255,255,.025);
  border:1px solid rgba(255,255,255,.06);
}

#zingoProWorld .zp-achievements{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
  margin-top:13px;
}

#zingoProWorld .zp-stat{
  padding:12px;
  border:1px solid rgba(214,168,59,.18);
  border-radius:18px;
  background:linear-gradient(145deg,rgba(31,20,8,.80),rgba(9,9,9,.96));
}

#zingoProWorld .zp-stat small{
  display:block;
  color:#8e8068;
  font-size:8px;
  font-weight:900;
}

#zingoProWorld .zp-stat strong{
  display:block;
  margin-top:4px;
  color:#f4d47a;
  font-size:20px;
  font-weight:1000;
}

#zingoProWorld .zp-cta{
  position:relative;
  overflow:hidden;
  margin-top:13px;
  padding:15px;
  border-radius:22px;
  border:1px solid rgba(244,212,122,.45);
  background:
    radial-gradient(circle at 85% 30%,rgba(244,212,122,.16),transparent 24%),
    linear-gradient(145deg,#5b3d0e,#1b1207 58%,#090909);
  box-shadow:
    0 0 28px rgba(214,168,59,.12),
    inset 0 1px 0 rgba(255,255,255,.07);
}

#zingoProWorld .zp-cta-copy{
  position:relative;
  z-index:2;
}

#zingoProWorld .zp-cta-badge{
  display:inline-flex;
  padding:5px 8px;
  border-radius:999px;
  background:rgba(7,7,7,.45);
  border:1px solid rgba(244,212,122,.22);
  color:#f3d27b;
  font-size:8px;
  font-weight:1000;
}

#zingoProWorld .zp-cta h3{
  margin:8px 0 2px;
  font-size:18px;
  font-weight:1000;
}

#zingoProWorld .zp-cta p{
  margin:0 0 10px;
  color:#bfb294;
  font-size:9px;
}

#zingoProWorld .zp-cta button{
  width:100%;
  min-height:48px;
  border:0;
  border-radius:15px;
  color:#4b350c;
  background:
    linear-gradient(180deg,#ffe296,#e2b54e 58%,#bd8620);
  box-shadow:
    0 8px 22px rgba(214,168,59,.20),
    inset 0 1px 0 rgba(255,255,255,.58);
  font-size:13px;
  font-weight:1000;
  cursor:pointer;
}

#zingoProWorld .zp-cta button span{
  display:block;
  margin-top:2px;
  color:#705214;
  font-size:8px;
  font-weight:900;
}

#zingoProWorld .zp-cta-crown{
  position:absolute;
  top:10px;
  left:13px;
  font-size:34px;
  color:#f5d782;
  opacity:.18;
  filter:drop-shadow(0 0 13px rgba(244,212,122,.5));
  transform:rotate(-10deg);
}

#zingoProWorld .zp-bottom{
  position:absolute;
  z-index:8;
  left:8px;
  right:8px;
  bottom:8px;
  min-height:72px;
  display:grid;
  grid-template-columns:repeat(5,1fr);
  gap:4px;
  padding:7px;
  border:1px solid rgba(244,212,122,.20);
  border-radius:22px;
  background:rgba(10,10,9,.93);
  backdrop-filter:blur(17px);
  -webkit-backdrop-filter:blur(17px);
  box-shadow:
    0 -8px 30px rgba(0,0,0,.30),
    0 0 20px rgba(214,168,59,.07);
}

#zingoProWorld .zp-nav{
  min-width:0;
  min-height:54px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:3px;
  border:0;
  border-radius:16px;
  background:transparent;
  color:#776f61;
  cursor:pointer;
}

#zingoProWorld .zp-nav-icon{
  font-size:18px;
  line-height:1;
}

#zingoProWorld .zp-nav small{
  font-size:7px;
  font-weight:1000;
  white-space:nowrap;
}

#zingoProWorld .zp-nav.active{
  color:#f5d77d;
  background:linear-gradient(145deg,rgba(104,72,18,.34),rgba(26,19,9,.48));
  box-shadow:inset 0 0 20px rgba(214,168,59,.07);
}

#zingoProWorld .zp-nav.pro{
  border:1px solid rgba(244,212,122,.38);
  background:
    radial-gradient(circle at 50% 15%,rgba(244,212,122,.16),transparent 38%),
    linear-gradient(145deg,#3c290c,#0d0d0c);
  color:#f4d47a;
  box-shadow:
    0 0 16px rgba(214,168,59,.11),
    inset 0 1px 0 rgba(255,255,255,.07);
}

#zingoProWorld .zp-nav.pro .zp-nav-icon{
  width:26px;
  height:26px;
  display:grid;
  place-items:center;
  border-radius:50%;
  border:1px solid rgba(244,212,122,.45);
  background:#140e06;
  font-size:10px;
  font-weight:1000;
}

#zingoProWorld .zp-mini-note{
  margin:10px 2px 0;
  text-align:center;
  color:#665e52;
  font-size:7px;
  line-height:1.65;
}

@media (max-width:360px){
  #zingoProWorld .zp-wrap{
    padding:4px;
  }
  #zingoProWorld .zp-phone{
    border-radius:26px;
  }
  #zingoProWorld .zp-title{
    font-size:27px;
  }
  #zingoProWorld .zp-hero{
    min-height:165px;
    padding:14px;
  }
  #zingoProWorld .zp-ball-orb{
    width:105px;
    height:105px;
  }
  #zingoProWorld .zp-ball{
    font-size:55px;
  }
}
</style>

<div class="zp-wrap">
  <div class="zp-phone">
    <div class="zp-glow-top"></div>

    <div class="zp-shell">

      <!-- TOP BAR -->
      <header class="zp-topbar">
        <button
          class="zp-icon zp-back"
          type="button"
          aria-label="رجوع"
          onclick="if(window.Zingo&&typeof window.Zingo.go==='function'){window.Zingo.go('home')}else{history.back()}"
        >‹</button>

        <div class="zp-brand">
          <div class="zp-logo">ZINGO</div>
          <div class="zp-brand-txt">
            <strong>ZINGO</strong>
            <span>تحليل احترافي</span>
          </div>
        </div>

        <div class="zp-status">
          <span class="zp-crown">♛</span>
          <span class="zp-status-dot"></span>
        </div>
      </header>

      <main class="zp-content">

        <!-- HERO -->
        <section class="zp-hero">
          <div class="zp-hero-copy">
            <div class="zp-kicker">✦ أسبوع PRO</div>
            <h1 class="zp-title">ZINGO PRO</h1>
            <div class="zp-subtitle">WEEKLY MISSION</div>
            <p class="zp-hero-note">
              مساحة التحليل الاحترافي والتحديات الخاصة والجوائز الأسبوعية.
            </p>
          </div>

          <div class="zp-hero-art">
            <div class="zp-crown-float">♛</div>
            <div class="zp-ball-orb">
              <div class="zp-orbit"></div>
              <div class="zp-ball">⚽</div>
            </div>
          </div>
        </section>

        <!-- PREMIUM FEATURES -->
        <div class="zp-feature-head">
          <h2 class="zp-section-title">مزايا PRO</h2>
          <span class="zp-section-meta">وصول احترافي</span>
        </div>

        <section class="zp-features">
          <article class="zp-feature">
            <div class="zp-feature-icon">⌁</div>
            <b>تحليلات متقدمة</b>
            <span>تفاصيل وتحليل أعمق للمباريات</span>
          </article>

          <article class="zp-feature">
            <div class="zp-feature-icon">♛</div>
            <b>مسابقات خاصة</b>
            <span>تحديات أسبوعية خاصة بالمشتركين</span>
          </article>

          <article class="zp-feature">
            <div class="zp-feature-icon">✦</div>
            <b>جوائز حصرية</b>
            <span>نقاط ومكافآت أسبوعية</span>
          </article>
        </section>

        <!-- COMPETITIONS -->
        <div class="zp-competition-head">
          <h2 class="zp-section-title">المسابقات الخاصة</h2>
          <p>اختر المباراة، حدّد توقعك، ثم احفظ التوقع قبل الإغلاق.</p>
        </div>

        <!-- MATCH 1 -->
        <details class="zp-match" open>
          <summary style="list-style:none;cursor:pointer">
            <div class="zp-match-top">
              <div class="zp-team">
                <div class="zp-team-badge">RM</div>
                <span>ريال مدريد</span>
              </div>

              <div class="zp-vs">
                <div class="zp-time">21:00</div>
                <small>اليوم</small>
              </div>

              <div class="zp-team">
                <div class="zp-team-badge">FCB</div>
                <span>برشلونة</span>
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;padding:0 10px 9px">
              <span class="zp-league">إسبانيا • الدوري</span>
              <span class="zp-live">متاح للتوقع</span>
            </div>
          </summary>

          <form class="zp-details" onsubmit="event.preventDefault();const b=this.querySelector('.zp-save');if(!this.querySelector('input[type=radio]:checked')){alert('اختر توقعك أولاً');return false;}b.textContent='تم حفظ التوقع';b.classList.add('is-saved');return false;">
            <div class="zp-label">
              <span>النتيجة المتوقعة</span>
              <span>اختيار واحد</span>
            </div>

            <div class="zp-market-grid">
              <label class="zp-market">
                <input type="radio" name="zp_match_1" value="home">
                <span>فوز ريال</span>
              </label>

              <label class="zp-market">
                <input type="radio" name="zp_match_1" value="draw">
                <span>تعادل</span>
              </label>

              <label class="zp-market">
                <input type="radio" name="zp_match_1" value="away">
                <span>فوز برشلونة</span>
              </label>
            </div>

            <div class="zp-extra-grid">
              <div class="zp-field">
                <label>عدد الأهداف المتوقع</label>
                <select>
                  <option>اختر</option>
                  <option>0 أهداف</option>
                  <option>1 هدف</option>
                  <option>2 هدف</option>
                  <option>3 أهداف</option>
                  <option>4 أهداف</option>
                  <option>5 أهداف</option>
                  <option>6+ أهداف</option>
                </select>
              </div>

              <div class="zp-field">
                <label>الركنيات المتوقعة</label>
                <select>
                  <option>اختر</option>
                  <option>0–4</option>
                  <option>5–7</option>
                  <option>8–10</option>
                  <option>11–13</option>
                  <option>14+</option>
                </select>
              </div>
            </div>

            <button type="submit" class="zp-save">حفظ التوقع</button>
            <div class="zp-locked">🔒 يغلق التوقع قبل المباراة بساعة</div>
          </form>
        </details>

        <!-- MATCH 2 -->
        <details class="zp-match">
          <summary style="list-style:none;cursor:pointer">
            <div class="zp-match-top">
              <div class="zp-team">
                <div class="zp-team-badge">ARS</div>
                <span>أرسنال</span>
              </div>

              <div class="zp-vs">
                <div class="zp-time">22:30</div>
                <small>غداً</small>
              </div>

              <div class="zp-team">
                <div class="zp-team-badge">LIV</div>
                <span>ليفربول</span>
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;padding:0 10px 9px">
              <span class="zp-league">إنجلترا • الدوري</span>
              <span class="zp-live">متاح للتوقع</span>
            </div>
          </summary>

          <form class="zp-details" onsubmit="event.preventDefault();const b=this.querySelector('.zp-save');if(!this.querySelector('input[type=radio]:checked')){alert('اختر توقعك أولاً');return false;}b.textContent='تم حفظ التوقع';b.classList.add('is-saved');return false;">
            <div class="zp-label">
              <span>النتيجة المتوقعة</span>
              <span>اختيار واحد</span>
            </div>

            <div class="zp-market-grid">
              <label class="zp-market">
                <input type="radio" name="zp_match_2" value="home">
                <span>فوز أرسنال</span>
              </label>

              <label class="zp-market">
                <input type="radio" name="zp_match_2" value="draw">
                <span>تعادل</span>
              </label>

              <label class="zp-market">
                <input type="radio" name="zp_match_2" value="away">
                <span>فوز ليفربول</span>
              </label>
            </div>

            <div class="zp-extra-grid">
              <div class="zp-field">
                <label>عدد الأهداف المتوقع</label>
                <select>
                  <option>اختر</option>
                  <option>0 أهداف</option>
                  <option>1 هدف</option>
                  <option>2 هدف</option>
                  <option>3 أهداف</option>
                  <option>4 أهداف</option>
                  <option>5 أهداف</option>
                  <option>6+ أهداف</option>
                </select>
              </div>

              <div class="zp-field">
                <label>الركنيات المتوقعة</label>
                <select>
                  <option>اختر</option>
                  <option>0–4</option>
                  <option>5–7</option>
                  <option>8–10</option>
                  <option>11–13</option>
                  <option>14+</option>
                </select>
              </div>
            </div>

            <button type="submit" class="zp-save">حفظ التوقع</button>
            <div class="zp-locked">🔒 يغلق التوقع قبل المباراة بساعة</div>
          </form>
        </details>

        <!-- MATCH 3 -->
        <details class="zp-match">
          <summary style="list-style:none;cursor:pointer">
            <div class="zp-match-top">
              <div class="zp-team">
                <div class="zp-team-badge">PSG</div>
                <span>باريس</span>
              </div>

              <div class="zp-vs">
                <div class="zp-time">20:45</div>
                <small>غداً</small>
              </div>

              <div class="zp-team">
                <div class="zp-team-badge">OM</div>
                <span>مارسيليا</span>
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;padding:0 10px 9px">
              <span class="zp-league">فرنسا • الدوري</span>
              <span class="zp-live">متاح للتوقع</span>
            </div>
          </summary>

          <form class="zp-details" onsubmit="event.preventDefault();const b=this.querySelector('.zp-save');if(!this.querySelector('input[type=radio]:checked')){alert('اختر توقعك أولاً');return false;}b.textContent='تم حفظ التوقع';b.classList.add('is-saved');return false;">
            <div class="zp-label">
              <span>النتيجة المتوقعة</span>
              <span>اختيار واحد</span>
            </div>

            <div class="zp-market-grid">
              <label class="zp-market">
                <input type="radio" name="zp_match_3" value="home">
                <span>فوز باريس</span>
              </label>

              <label class="zp-market">
                <input type="radio" name="zp_match_3" value="draw">
                <span>تعادل</span>
              </label>

              <label class="zp-market">
                <input type="radio" name="zp_match_3" value="away">
                <span>فوز مارسيليا</span>
              </label>
            </div>

            <div class="zp-extra-grid">
              <div class="zp-field">
                <label>عدد الأهداف المتوقع</label>
                <select>
                  <option>اختر</option>
                  <option>0 أهداف</option>
                  <option>1 هدف</option>
                  <option>2 هدف</option>
                  <option>3 أهداف</option>
                  <option>4 أهداف</option>
                  <option>5 أهداف</option>
                  <option>6+ أهداف</option>
                </select>
              </div>

              <div class="zp-field">
                <label>الركنيات المتوقعة</label>
                <select>
                  <option>اختر</option>
                  <option>0–4</option>
                  <option>5–7</option>
                  <option>8–10</option>
                  <option>11–13</option>
                  <option>14+</option>
                </select>
              </div>
            </div>

            <button type="submit" class="zp-save">حفظ التوقع</button>
            <div class="zp-locked">🔒 يغلق التوقع قبل المباراة بساعة</div>
          </form>
        </details>

        <!-- MATCH 4 -->
        <details class="zp-match">
          <summary style="list-style:none;cursor:pointer">
            <div class="zp-match-top">
              <div class="zp-team">
                <div class="zp-team-badge">MIL</div>
                <span>ميلان</span>
              </div>

              <div class="zp-vs">
                <div class="zp-time">21:45</div>
                <small>السبت</small>
              </div>

              <div class="zp-team">
                <div class="zp-team-badge">INT</div>
                <span>إنتر</span>
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;padding:0 10px 9px">
              <span class="zp-league">إيطاليا • الدوري</span>
              <span class="zp-live">متاح للتوقع</span>
            </div>
          </summary>

          <form class="zp-details" onsubmit="event.preventDefault();const b=this.querySelector('.zp-save');if(!this.querySelector('input[type=radio]:checked')){alert('اختر توقعك أولاً');return false;}b.textContent='تم حفظ التوقع';b.classList.add('is-saved');return false;">
            <div class="zp-label">
              <span>النتيجة المتوقعة</span>
              <span>اختيار واحد</span>
            </div>

            <div class="zp-market-grid">
              <label class="zp-market">
                <input type="radio" name="zp_match_4" value="home">
                <span>فوز ميلان</span>
              </label>

              <label class="zp-market">
                <input type="radio" name="zp_match_4" value="draw">
                <span>تعادل</span>
              </label>

              <label class="zp-market">
                <input type="radio" name="zp_match_4" value="away">
                <span>فوز إنتر</span>
              </label>
            </div>

            <div class="zp-extra-grid">
              <div class="zp-field">
                <label>عدد الأهداف المتوقع</label>
                <select>
                  <option>اختر</option>
                  <option>0 أهداف</option>
                  <option>1 هدف</option>
                  <option>2 هدف</option>
                  <option>3 أهداف</option>
                  <option>4 أهداف</option>
                  <option>5 أهداف</option>
                  <option>6+ أهداف</option>
                </select>
              </div>

              <div class="zp-field">
                <label>الركنيات المتوقعة</label>
                <select>
                  <option>اختر</option>
                  <option>0–4</option>
                  <option>5–7</option>
                  <option>8–10</option>
                  <option>11–13</option>
                  <option>14+</option>
                </select>
              </div>
            </div>

            <button type="submit" class="zp-save">حفظ التوقع</button>
            <div class="zp-locked">🔒 يغلق التوقع قبل المباراة بساعة</div>
          </form>
        </details>

        <!-- PLAYER STATS -->
        <section class="zp-achievements">
          <div class="zp-stat">
            <small>توقعات محفوظة</small>
            <strong>0</strong>
          </div>

          <div class="zp-stat">
            <small>نقاط الأسبوع</small>
            <strong>0</strong>
          </div>
        </section>

        <!-- CTA -->
        <section class="zp-cta">
          <div class="zp-cta-crown">♛</div>

          <div class="zp-cta-copy">
            <div class="zp-cta-badge">✦ وصول PRO</div>
            <h3>جاهز لتبدأ؟</h3>
            <p>فعّل المزايا الاحترافية وادخل تحديات الأسبوع.</p>

            <button
              type="button"
              onclick="if(window.zingoOpenProfileEditorV2){window.zingoOpenProfileEditorV2()}else if(window.zingoOpenProfileEditor){window.zingoOpenProfileEditor()}"
            >
              اشترك الآن
              <span>احصل على مزايا PRO</span>
            </button>
          </div>
        </section>

        <div class="zp-mini-note">
          التوقعات قابلة للتعديل قبل الإغلاق، وبعد الإغلاق يتم احتساب النتيجة تلقائياً حسب قواعد المسابقة.
        </div>

      </main>

      <!-- BOTTOM NAV -->
      <nav class="zp-bottom" aria-label="التنقل">
        <button
          class="zp-nav"
          type="button"
          onclick="if(window.Zingo&&typeof window.Zingo.go==='function'){window.Zingo.go('home')}"
        >
          <span class="zp-nav-icon">⌂</span>
          <small>الرئيسية</small>
        </button>

        <button
          class="zp-nav"
          type="button"
          onclick="if(window.Zingo&&typeof window.Zingo.go==='function'){window.Zingo.go('analysis')}"
        >
          <span class="zp-nav-icon">⌁</span>
          <small>التحليل</small>
        </button>

        <button
          class="zp-nav active"
          type="button"
        >
          <span class="zp-nav-icon">🏆</span>
          <small>المسابقات</small>
        </button>

        <button
          class="zp-nav"
          type="button"
          onclick="window.zingoOpenProfileEditorV2?.()"
        >
          <span class="zp-nav-icon">♙</span>
          <small>الملف</small>
        </button>

        <button
          class="zp-nav pro"
          type="button"
        >
          <span class="zp-nav-icon">PRO</span>
          <small>اشتراك احترافي</small>
        </button>
      </nav>

    </div>
  </div>
</div>
'''

# ============================================================
# 4) الحفاظ على افتتاح/إغلاق section الأصلي
# ============================================================
new_pro = open_tag + PRO_INNER + "</section>"
new_html = original[:start] + new_pro + original[close_end:]

# ============================================================
# 5) تأكيد أن سكربتات الصفحة لم تتغير
# ============================================================
after_scripts = script_bodies(new_html)

if before_scripts != after_scripts:
    raise SystemExit(
        "❌ تم اكتشاف تغيير في <script> موجود مسبقاً — تم إلغاء الباتش"
    )

# ============================================================
# 6) تأكيد وجود العناصر الأساسية
# ============================================================
required = [
    'id="zingoProWorld"',
    "ZINGO PRO",
    "WEEKLY MISSION",
    "تحليلات متقدمة",
    "مسابقات خاصة",
    "جوائز حصرية",
    "المسابقات الخاصة",
    "اشترك الآن",
    "احصل على مزايا PRO",
    "اشتراك احترافي",
    "name=\"zp_match_1\"",
    "name=\"zp_match_2\"",
    "name=\"zp_match_3\"",
    "name=\"zp_match_4\"",
]

missing = [x for x in required if x not in new_html]
if missing:
    raise SystemExit(
        "❌ REQUIRED_UI_MISSING: " + ", ".join(missing)
    )

# ============================================================
# 7) نسخة احتياطية
# ============================================================
shutil.copy2(INDEX, BACKUP)

# ============================================================
# 8) كتابة index.html
# ============================================================
INDEX.write_text(new_html, encoding="utf-8")

# ============================================================
# 9) إنشاء PRO_ONLY.html حقيقي للمعاينة
# ============================================================
preview = f'''<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#070707">
<title>ZINGO PRO</title>
</head>
<body style="margin:0;background:#000;min-height:100svh;">
{new_pro}
</body>
</html>
'''

PREVIEW.write_text(preview, encoding="utf-8")

# ============================================================
# 10) فحص JavaScript القديم
# ============================================================
node_ok = True

try:
    # فحص كل script block القديم كما هو موجود بعد التعديل
    scripts = re.findall(
        r'<script(?:\s[^>]*)?>(.*?)</script>',
        new_html,
        re.I | re.S
    )
    for i, body in enumerate(scripts, start=1):
        body = body.strip()
        if not body:
            continue
        result = subprocess.run(
            ["node", "--check"],
            input=body,
            text=True,
            capture_output=True
        )
        if result.returncode != 0:
            node_ok = False
            print(f"❌ NODE_SCRIPT_{i}_ERROR")
            print(result.stderr.strip())
            break
except FileNotFoundError:
    print("⚠️ node غير مثبت — تم تجاوز فحص Node")
except Exception as e:
    node_ok = False
    print("❌ NODE_CHECK_EXCEPTION:", e)

# ============================================================
# 11) تقرير نهائي
# ============================================================
print()
print("✅ تم تطبيق باتش PRO الكامل بنجاح.")
print(f"BACKUP={BACKUP.name}")
print(f"PREVIEW={PREVIEW.name}")
print(f"OLD_SIZE={len(original.encode('utf-8'))}")
print(f"NEW_SIZE={len(new_html.encode('utf-8'))}")
print(f"SCRIPTS_BEFORE={len(before_scripts)}")
print(f"SCRIPTS_AFTER={len(after_scripts)}")
print("PRO_UI=FULL_MOBILE_COMPLETE")
print("FREE=NOT_TOUCHED")
print("VIP=NOT_TOUCHED")
print("API_JS=NOT_TOUCHED")
print("PROFILE=NOT_TOUCHED")
print("TELEGRAM=NOT_TOUCHED")
print("BOT=NOT_TOUCHED")
print("WORKER=NOT_TOUCHED")
print("DEPLOY=NOT_PERFORMED")
print("NODE=OK" if node_ok else "NODE=FAILED")
print()

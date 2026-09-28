#!/usr/bin/env python3
from pathlib import Path
import re
import shutil
import subprocess
import sys
from datetime import datetime

ROOT = Path.home() / 'zingo-pro-check'
HTML = ROOT / 'index.html'
MARK = '<!-- ZINGO 3 TIERS DESIGN SAFE V1 -->'

NEW_BAR = r'''
<!-- ZINGO 3 TIERS MODE BAR -->
<div id="zingoModeBar" aria-label="طبقات ZINGO">
  <button id="zingoFreeBtn" class="zingoModeBtn tier-free active-free" type="button" onclick="window.zingoSetTier('free')">
    مجاني
    <small>الأساسي</small>
  </button>
  <button id="zingoProBtn" class="zingoModeBtn tier-pro" type="button" onclick="window.zingoSetTier('pro')">
    احترافي
    <small>PRO</small>
  </button>
  <button id="zingoVipBtn" class="zingoModeBtn tier-vip" type="button" onclick="window.zingoSetTier('vip')">
    ملكي
    <small>VIP</small>
  </button>
</div>
'''

STYLE = r'''
<style id="zingo3TierDesignStyle">
:root{
  --z3-bg:#03050a;
  --z3-panel:rgba(13,18,29,.90);
  --z3-panel2:rgba(19,27,43,.92);
  --z3-text:#f7f9ff;
  --z3-muted:#8f9bb0;
  --z3-line:rgba(255,255,255,.09);
  --z3-blue:#3195ff;
  --z3-blue2:#86c7ff;
  --z3-gold:#e6b94d;
  --z3-gold2:#fff0a8;
  --z3-ice:#d9f4ff;
  --z3-ice2:#7bd8ff;
}

body{
  background:
    radial-gradient(circle at 12% 0%,rgba(49,149,255,.12),transparent 27%),
    radial-gradient(circle at 90% 35%,rgba(111,86,255,.08),transparent 25%),
    #03050a !important;
}

body:before{display:none !important}

#zingoModeBar{
  width:100%;
  max-width:760px;
  margin:0 auto 14px;
  padding:6px;
  display:grid !important;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:6px;
  background:rgba(7,12,22,.94);
  border:1px solid rgba(255,255,255,.10);
  border-radius:20px;
  box-sizing:border-box;
  position:relative;
  z-index:9999;
  box-shadow:0 18px 42px rgba(0,0,0,.42);
  backdrop-filter:blur(18px);
}

#zingoModeBar .zingoModeBtn{
  min-width:0;
  border:1px solid transparent;
  border-radius:15px;
  padding:11px 6px 9px;
  font-weight:900;
  font-size:13px;
  line-height:1.2;
  color:#9aa8c2;
  background:rgba(255,255,255,.025);
  cursor:pointer;
  transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease,color .18s ease;
}

#zingoModeBar .zingoModeBtn:active{transform:scale(.985)}
#zingoModeBar .zingoModeBtn small{display:block;margin-top:4px;font-size:8px;opacity:.65;font-weight:800;letter-spacing:.4px}

#zingoModeBar .zingoModeBtn.active-free{
  color:#fff;
  border-color:rgba(49,149,255,.65);
  background:linear-gradient(145deg,rgba(49,149,255,.22),rgba(49,149,255,.07));
  box-shadow:0 0 22px rgba(49,149,255,.12) inset,0 0 18px rgba(49,149,255,.08);
}

#zingoModeBar .zingoModeBtn.active-pro{
  color:#fff7d8;
  border-color:rgba(230,185,77,.72);
  background:linear-gradient(145deg,rgba(230,185,77,.24),rgba(82,57,10,.16));
  box-shadow:0 0 24px rgba(230,185,77,.10) inset,0 0 18px rgba(230,185,77,.07);
}

#zingoModeBar .zingoModeBtn.active-vip{
  color:#071018;
  border-color:rgba(217,244,255,.85);
  background:linear-gradient(145deg,#e7fbff,#9fd4e5 48%,#ffffff);
  box-shadow:0 0 26px rgba(123,216,255,.18),inset 0 0 18px rgba(255,255,255,.45);
}

#zingoProLayer{
  width:100%;
}

body.tier-free .header{
  background:linear-gradient(145deg,rgba(18,31,53,.97),rgba(5,9,17,.98)) !important;
  border-color:rgba(49,149,255,.30) !important;
  box-shadow:0 20px 55px rgba(0,0,0,.48),0 0 35px rgba(49,149,255,.06) !important;
}
body.tier-free .logo{
  background:linear-gradient(145deg,#172a47,#09111e) !important;
  border-color:rgba(134,199,255,.34) !important;
  box-shadow:0 0 28px rgba(49,149,255,.15) !important;
}
body.tier-free .status{color:#9dd4ff !important;border-color:rgba(49,149,255,.35) !important}
body.tier-free .intro{background:linear-gradient(145deg,rgba(18,31,53,.94),rgba(7,12,22,.98)) !important;border-color:rgba(49,149,255,.22) !important}
body.tier-free .rule{background:rgba(49,149,255,.07) !important;border-color:rgba(49,149,255,.16) !important}
body.tier-free .option.active{border-color:var(--z3-blue) !important;background:rgba(49,149,255,.15) !important;box-shadow:0 0 18px rgba(49,149,255,.10) !important}
body.tier-free .submit{background:linear-gradient(135deg,#1678e8,#46adff) !important;color:#fff !important}

body.tier-pro .header{
  background:linear-gradient(145deg,rgba(47,37,18,.97),rgba(11,10,7,.99)) !important;
  border-color:rgba(230,185,77,.34) !important;
  box-shadow:0 20px 55px rgba(0,0,0,.52),0 0 35px rgba(230,185,77,.05) !important;
}
body.tier-pro .logo{
  background:linear-gradient(145deg,#5a4519,#171106) !important;
  border-color:rgba(255,226,137,.45) !important;
  box-shadow:0 0 28px rgba(230,185,77,.13) !important;
}
body.tier-pro .status{color:#ffe39a !important;border-color:rgba(230,185,77,.38) !important}
body.tier-pro .intro{background:linear-gradient(145deg,rgba(47,37,18,.94),rgba(12,10,7,.98)) !important;border-color:rgba(230,185,77,.26) !important}
body.tier-pro .rule{background:rgba(230,185,77,.07) !important;border-color:rgba(230,185,77,.17) !important}
body.tier-pro .option.active{border-color:var(--z3-gold) !important;background:rgba(230,185,77,.14) !important;box-shadow:0 0 20px rgba(230,185,77,.09) !important}
body.tier-pro .submit{background:linear-gradient(135deg,#8b6819,#f0cd70,#a37818) !important;color:#171106 !important}

body.tier-vip .header{
  background:linear-gradient(145deg,rgba(30,39,46,.98),rgba(4,7,10,.99)) !important;
  border-color:rgba(217,244,255,.30) !important;
  box-shadow:0 20px 55px rgba(0,0,0,.62),0 0 40px rgba(123,216,255,.08) !important;
}
body.tier-vip .logo{
  background:linear-gradient(145deg,#edfaff,#9ab4bd 46%,#202b31) !important;
  color:#071018 !important;
  border-color:rgba(255,255,255,.78) !important;
  box-shadow:0 0 32px rgba(123,216,255,.18) !important;
}
body.tier-vip .status{color:#e8fbff !important;border-color:rgba(217,244,255,.40) !important}
body.tier-vip .intro{background:linear-gradient(145deg,rgba(31,41,48,.96),rgba(4,7,10,.99)) !important;border-color:rgba(217,244,255,.25) !important}
body.tier-vip .rule{background:rgba(123,216,255,.06) !important;border-color:rgba(123,216,255,.16) !important}
body.tier-vip .option.active{border-color:var(--z3-ice2) !important;background:rgba(123,216,255,.11) !important;box-shadow:0 0 22px rgba(123,216,255,.11) !important}
body.tier-vip .submit{background:linear-gradient(135deg,#8db5c4,#ffffff,#7bcfe9) !important;color:#071018 !important}

body.tier-pro .sectionTitle,
body.tier-vip .sectionTitle{font-weight:1000}
body.tier-pro .progressBar{background:linear-gradient(90deg,#9e761e,#ffe28a,#d09b25) !important}
body.tier-vip .progressBar{background:linear-gradient(90deg,#9fdfff,#fff,#75d4ff) !important}

body.tier-vip #zingoProLayer{filter:saturate(.98)}

@media(max-width:430px){
  #zingoModeBar{width:calc(100% - 2px);gap:5px;padding:5px}
  #zingoModeBar .zingoModeBtn{padding:10px 4px 8px;font-size:12px;border-radius:13px}
}
</style>
'''

SCRIPT = r'''
<script id="zingo3TierController">
(function(){
  "use strict";
  if(window.__zingo3TierInstalled) return;
  window.__zingo3TierInstalled=true;

  var bar=document.getElementById("zingoModeBar");
  var freeBtn=document.getElementById("zingoFreeBtn");
  var proBtn=document.getElementById("zingoProBtn");
  var vipBtn=document.getElementById("zingoVipBtn");
  if(!bar||!freeBtn||!proBtn||!vipBtn){
    console.error("ZINGO 3 TIERS: required mode controls are missing");
    return;
  }

  var originalSwitch=typeof window.switchZingoMode==="function" ? window.switchZingoMode : null;

  function mark(tier){
    document.body.classList.remove("tier-free","tier-pro","tier-vip");
    document.body.classList.add("tier-"+tier);
    [freeBtn,proBtn,vipBtn].forEach(function(btn){
      btn.classList.remove("active-free","active-pro","active-vip");
    });
    if(tier==="free") freeBtn.classList.add("active-free");
    else if(tier==="pro") proBtn.classList.add("active-pro");
    else vipBtn.classList.add("active-vip");
  }

  function afterSwitch(tier){
    mark(tier);
    try{window.scrollTo({top:0,behavior:"instant"});}catch(e){try{window.scrollTo(0,0)}catch(_){}}
    try{localStorage.setItem("zingo_last_tier",tier)}catch(e){}
  }

  window.zingoSetTier=async function(tier){
    if(tier!=="free" && tier!=="pro" && tier!=="vip") return;

    if(tier==="free"){
      if(originalSwitch){
        try{await Promise.resolve(originalSwitch("pro"));}catch(e){console.error("ZINGO free switch:",e)}
      }
      afterSwitch("free");
      return;
    }

    if(originalSwitch){
      try{
        await Promise.resolve(originalSwitch(tier));
        var vipVisible=window.getComputedStyle(vipBtn).display!=="none";
        if(tier!=="vip" || !vipVisible || document.getElementById("zingoVipLayer")){
          afterSwitch(tier);
        }
      }catch(e){
        console.error("ZINGO tier switch:",e);
      }
    }else{
      afterSwitch(tier);
    }
  };

  function restore(){
    var saved="free";
    try{saved=localStorage.getItem("zingo_last_tier")||"free"}catch(e){}
    if(saved!=="free"&&saved!=="pro"&&saved!=="vip") saved="free";
    mark(saved);
    if(saved!=="free" && originalSwitch){
      Promise.resolve(originalSwitch(saved)).then(function(){mark(saved)}).catch(function(){mark("free")});
    }
  }

  restore();
})();
</script>
'''


def fail(msg):
    print("❌", msg)
    sys.exit(1)

if not HTML.exists():
    fail(f"لم أجد الملف: {HTML}")

src = HTML.read_text(encoding='utf-8')
if MARK in src:
    fail("الـ3 tiers موجودة مسبقًا؛ لن أكرر التعديل.")

required = [
    '<div id="zingoModeBar">',
    'id="zingoProBtn"',
    'id="zingoVipBtn"',
    '<div id="zingoProLayer">',
    '<div id="zingoVipLayer">',
    'window.switchZingoMode',
    '</html>',
]
for x in required:
    if x not in src:
        fail(f"علامة أساسية مفقودة، أوقفت التعديل: {x}")

m = re.search(r'<div id="zingoModeBar">[\s\S]*?</div>', src)
if not m:
    fail("لم أستطع تحديد شريط الطبقات القديم بأمان.")

stamp=datetime.now().strftime('%Y%m%d_%H%M%S')
backup=ROOT / f'index_before_3tiers_safe_{stamp}.html'
shutil.copy2(HTML, backup)

patched = src[:m.start()] + NEW_BAR + src[m.end():]
insert_at = patched.rfind('</html>')
if insert_at < 0:
    fail("اختفى </html> بعد التحضير؛ لم أكتب الملف.")
patched = patched[:insert_at] + MARK + '\n' + STYLE + '\n' + SCRIPT + '\n' + patched[insert_at:]

# Strict basic integrity checks before write.
checks = {
    'one_marker': patched.count(MARK) == 1,
    'one_mode_bar': patched.count('id="zingoModeBar"') == 1,
    'one_free_btn': patched.count('id="zingoFreeBtn"') == 1,
    'one_pro_btn': patched.count('id="zingoProBtn"') == 1,
    'one_vip_btn': patched.count('id="zingoVipBtn"') == 1,
    'has_api_pro_round': '/api/pro_round' in patched,
    'has_api_pro_submit': '/api/pro_submit' in patched,
    'has_api_pro_ranking': '/api/pro_ranking' in patched,
    'has_telegram': 'Telegram.WebApp' in patched,
    'has_html_end': patched.rstrip().endswith('</html>'),
}
for k,v in checks.items():
    if not v:
        try: backup.unlink()
        except Exception: pass
        fail(f"فشل فحص {k}؛ لم يتم استبدال الملف.")

# Write only after integrity checks.
HTML.write_text(patched,encoding='utf-8')

# Extract and syntax-check every inline script with Node.
current=HTML.read_text(encoding='utf-8')
blocks=re.findall(r'<script(?:\s[^>]*)?>([\s\S]*?)</script>',current,re.I)
if not blocks:
    shutil.copy2(backup,HTML)
    fail("لا توجد كتل JavaScript بعد التعديل؛ تمت استعادة النسخة.")

errors=[]
for i,body in enumerate(blocks,1):
    p=ROOT / f'.zingo3_check_{i}.js'
    p.write_text(body,encoding='utf-8')
    proc=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
    try:p.unlink()
    except Exception:pass
    if proc.returncode!=0:
        errors.append((i,proc.stderr.strip() or proc.stdout.strip() or 'unknown error'))

if errors:
    shutil.copy2(backup,HTML)
    print('❌ JavaScript syntax error detected. Restored original index.html.')
    for i,e in errors:
        print(f'  SCRIPT_{i}: {e}')
    sys.exit(1)

# Make sure critical original routes/identifiers survived.
for x in ['/api/pro_round','/api/pro_submit','/api/pro_ranking','Telegram.WebApp','zingoProLayer','zingoVipLayer','switchZingoMode']:
    if x not in current:
        shutil.copy2(backup,HTML)
        fail(f'اختفى بعد الفحص: {x}. تمت الاستعادة.')

print('✅ تم تركيب تصميم 3 طبقات بأمان.')
print('✅ لم يتم تعديل bot.py أو worker.js.')
print('✅ تم إنشاء نسخة احتياطية:', backup)
print('✅ JavaScript syntax: جميع الكتل OK')
print('✅ API markers محفوظة')
print('✅ Telegram.WebApp محفوظ')
print('✅ FREE / PRO / VIP controls موجودة')
print('FILE=',HTML)

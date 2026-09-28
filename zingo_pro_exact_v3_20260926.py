
from pathlib import Path
import re, subprocess, shutil

P=Path("index.html")
if not P.exists(): raise SystemExit("❌ index.html غير موجود")
src=P.read_text(encoding="utf-8")

a=re.search(r'<section[^>]*id=["\']zingoProWorld["\'][^>]*>',src,re.I)
b=re.search(r'<section[^>]*id=["\']zingoVipWorld["\'][^>]*>',src,re.I)
if not a or not b or b.start()<=a.start(): raise SystemExit("❌ تعذر تحديد قسم PRO")

pro=r'''
<section id="zingoProWorld" class="zingo-world hidden" dir="rtl">
<div class="zp-app">
<header class="zp-top">
<button class="zp-icon-btn" type="button">♛</button>
<div class="zp-brand"><div class="zp-logo">Z</div><div class="zp-brand-name">ZINGO</div></div>
<button class="zp-icon-btn zp-back" type="button">‹</button>
</header>
<main class="zp-content">
<section class="zp-hero">
<div class="zp-hero-copy">
<div class="zp-mini-crown">♛</div>
<div class="zp-kicker">WEEKLY MISSION</div>
<h1>ZINGO <b>PRO</b></h1>
<p>ارتقِ بتجربتك الكروية واحصل على مزايا PRO الحصرية.</p>
</div>
<div class="zp-hero-ball-wrap"><div class="zp-glow"></div><div class="zp-ball"><i></i><i></i><i></i><i></i><i></i></div><div class="zp-crown-orbit">♛</div></div>
</section>
<section class="zp-features">
<article class="zp-feature"><div class="zp-feature-icon">◈</div><h3>تحليلات متقدمة</h3><p>قراءة أعمق للمباريات وإحصاءات تساعدك على بناء توقعات أدق.</p></article>
<article class="zp-feature"><div class="zp-feature-icon">♛</div><h3>مسابقات خاصة</h3><p>شارك في مسابقات PRO وتنافس على الصدارة مع أصحاب التوقعات.</p></article>
<article class="zp-feature"><div class="zp-feature-icon">✦</div><h3>جوائز حصرية</h3><p>مكافآت ومزايا إضافية مخصصة لمشتركي PRO.</p></article>
</section>
<section class="zp-competitions">
<div class="zp-section-head"><div><span>PRO</span><h2>المسابقات الخاصة</h2></div><em>● مباشر</em></div>
<article class="zp-match"><div><small>الدوري الإسباني</small><strong>ريال مدريد <i>VS</i> برشلونة</strong></div><aside><b>PRO</b><small>اليوم · 10:00</small></aside><button>‹</button></article>
<article class="zp-match"><div><small>الدوري الإنكليزي</small><strong>مانشستر سيتي <i>VS</i> ليفربول</strong></div><aside><b>PRO</b><small>غدًا · 09:30</small></aside><button>‹</button></article>
<article class="zp-match"><div><small>الدوري الإيطالي</small><strong>إنتر <i>VS</i> ميلان</strong></div><aside><b>PRO</b><small>غدًا · 11:00</small></aside><button>‹</button></article>
</section>
<section class="zp-cta"><div><small>طوّر تجربتك الآن</small><strong>احصل على مزايا PRO</strong></div><button>اشترك الآن <b>‹</b></button></section>
</main>
<nav class="zp-bottom">
<button>⌂<small>الرئيسية</small></button><button>◈<small>المباريات</small></button><button class="active">♛<small>اشتراك احترافي</small></button><button>🏆<small>المسابقات</small></button><button>●<small>الملف</small></button>
</nav>
</div>
</section>
'''

css=r'''
<style id="zingoProExactV3">
#zingoProWorld{--g:#d6a83b;--g2:#f4cd69;--w:#f7eed8;--m:#afa184;display:block!important;min-height:100vh;width:100%;overflow:visible!important;background:radial-gradient(circle at 82% 5%,#4b310d22,transparent 28%),linear-gradient(145deg,#090909,#211507 52%,#090909);color:var(--w);font-family:system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif}
#zingoProWorld *{box-sizing:border-box}
#zingoProWorld .zp-app{width:min(100%,520px);min-height:100vh;margin:auto;position:relative;overflow:hidden;background:radial-gradient(circle,#d6a83b08 1px,transparent 2px),linear-gradient(180deg,#1b1007ee,#080808);background-size:110px 110px,auto;border-inline:1px solid #d6a83b66;box-shadow:inset 0 0 70px #d6a83b09}
#zingoProWorld .zp-top{height:86px;display:grid;grid-template-columns:58px 1fr 58px;align-items:center;padding:12px 16px;border-bottom:1px solid #d6a83b55;background:#120d08dd}
#zingoProWorld .zp-icon-btn{width:48px;height:48px;border:1px solid #d6a83b66;border-radius:16px;background:linear-gradient(145deg,#30200c,#0b0b0a);color:var(--g2);font-size:25px;display:grid;place-items:center}
#zingoProWorld .zp-back{justify-self:end;font-size:38px}
#zingoProWorld .zp-brand{display:flex;justify-content:center;align-items:center;gap:10px}
#zingoProWorld .zp-brand-name{font-size:22px;font-weight:950;letter-spacing:4px;font-style:italic}
#zingoProWorld .zp-logo{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;border:1px solid #e1b744;color:#fff2bd;background:radial-gradient(circle at 35% 30%,#70551b,#080808 70%);box-shadow:0 0 20px #e0b03655}
#zingoProWorld .zp-content{padding:18px 16px 105px}
#zingoProWorld .zp-hero{min-height:280px;position:relative;display:flex;align-items:center;padding:28px 23px;overflow:hidden;border:1px solid #d6a83b77;border-radius:28px;background:radial-gradient(circle at 86% 50%,#e0b03630,transparent 28%),linear-gradient(135deg,#080808f5,#261807ee);box-shadow:inset 0 0 38px #d6a83b0e}
#zingoProWorld .zp-hero-copy{width:62%;position:relative;z-index:2}
#zingoProWorld .zp-mini-crown{font-size:20px;color:#f0c85d}
#zingoProWorld .zp-kicker{font-size:11px;font-weight:950;letter-spacing:4px;color:#f1cc6c}
#zingoProWorld .zp-hero h1{margin:7px 0 12px;font-size:38px;line-height:1;font-weight:950;font-style:italic;background:linear-gradient(#fff1a9,#e5af37,#8e6117);-webkit-background-clip:text;background-clip:text;color:transparent}
#zingoProWorld .zp-hero p{margin:0;color:#d1c5ab;font-size:14px;line-height:1.8}
#zingoProWorld .zp-hero-ball-wrap{position:absolute;width:190px;height:190px;right:-8px;top:50%;transform:translateY(-50%)}
#zingoProWorld .zp-glow{position:absolute;inset:5px;border-radius:50%;background:#eabc4533;filter:blur(22px)}
#zingoProWorld .zp-ball{position:absolute;width:142px;height:142px;left:22px;top:25px;border-radius:50%;background:radial-gradient(circle at 33% 27%,#fff,#aaa 18%,#3e3e3e 20%,#eee 30%,#686868 44%,#ddd 57%,#292929 76%,#090909);box-shadow:0 0 30px #e8b94355,inset -12px -14px 20px #0007;transform:rotate(-13deg)}
#zingoProWorld .zp-ball i{position:absolute;width:31px;height:27px;background:#222;border-radius:45%}
#zingoProWorld .zp-ball i:nth-child(1){left:55px;top:12px}#zingoProWorld .zp-ball i:nth-child(2){left:101px;top:54px}#zingoProWorld .zp-ball i:nth-child(3){left:70px;top:104px}#zingoProWorld .zp-ball i:nth-child(4){left:18px;top:86px}#zingoProWorld .zp-ball i:nth-child(5){left:15px;top:38px}
#zingoProWorld .zp-crown-orbit{position:absolute;right:7px;top:1px;color:#ffe18a;font-size:34px;filter:drop-shadow(0 0 10px #ffcd4e88)}
#zingoProWorld .zp-features{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
#zingoProWorld .zp-feature{min-height:145px;padding:14px 11px;border:1px solid #d6a83b44;border-radius:20px;background:linear-gradient(155deg,#281908c4,#0c0c0be8);box-shadow:inset 0 0 20px #d6a83b08}
#zingoProWorld .zp-feature-icon{width:39px;height:39px;display:grid;place-items:center;border-radius:13px;border:1px solid #e0b34166;color:#f6cf72;background:#d6a83b12;font-size:20px;margin-bottom:10px}
#zingoProWorld .zp-feature h3{margin:0 0 7px;font-size:14px;color:#f8eac4}
#zingoProWorld .zp-feature p{margin:0;color:#a99c84;font-size:11px;line-height:1.75}
#zingoProWorld .zp-competitions{margin-top:23px}
#zingoProWorld .zp-section-head{display:flex;align-items:end;justify-content:space-between;margin-bottom:11px}
#zingoProWorld .zp-section-head span{display:block;color:#b88a2b;font-size:10px;font-weight:950;letter-spacing:2px}
#zingoProWorld .zp-section-head h2{margin:3px 0 0;font-size:22px;color:#f7e7bd}
#zingoProWorld .zp-section-head em{font-style:normal;color:#d5b25e;font-size:10px;border:1px solid #d6a83b40;border-radius:20px;padding:6px 9px}
#zingoProWorld .zp-match{min-height:82px;display:grid;grid-template-columns:1fr auto 32px;gap:9px;align-items:center;margin:9px 0;padding:12px;border:1px solid #d6a83b40;border-radius:18px;background:linear-gradient(110deg,#1f1408e0,#0a0a09f5)}
#zingoProWorld .zp-match small{display:block;color:#948873;font-size:10px;margin-bottom:5px}
#zingoProWorld .zp-match strong{display:block;color:#eee2c3;font-size:13px}
#zingoProWorld .zp-match i{color:#d4a73a;font-style:normal;font-size:10px;margin:0 4px}
#zingoProWorld .zp-match aside{text-align:left}
#zingoProWorld .zp-match aside b{display:block;color:#e8be55;font-size:9px}
#zingoProWorld .zp-match aside small{white-space:nowrap;margin-top:4px}
#zingoProWorld .zp-match>button{width:30px;height:30px;border-radius:10px;border:1px solid #d6a83b44;background:#d6a83b0f;color:#edc15b;font-size:25px}
#zingoProWorld .zp-cta{margin-top:18px;padding:18px;border-radius:22px;border:1px solid #ecbe468f;background:linear-gradient(105deg,#2b1a07,#100e0b 62%,#241705);display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 0 30px #d8a52f14}
#zingoProWorld .zp-cta small{display:block;color:#a9997b;font-size:10px;margin-bottom:4px}
#zingoProWorld .zp-cta strong{color:#fff0c4;font-size:16px}
#zingoProWorld .zp-cta>button{border:1px solid #f0c45a;border-radius:14px;padding:11px 13px;color:#211507;font-weight:950;background:linear-gradient(#ffe18a,#c8942a);white-space:nowrap}
#zingoProWorld .zp-cta>button b{font-size:20px}
#zingoProWorld .zp-bottom{position:absolute;bottom:0;left:0;right:0;height:82px;display:grid;grid-template-columns:repeat(5,1fr);padding:8px;border-top:1px solid #d6a83b4d;background:#090908f2;backdrop-filter:blur(14px)}
#zingoProWorld .zp-bottom button{border:0;background:none;color:#766c5a;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:19px}
#zingoProWorld .zp-bottom small{font-size:9px;color:#766c5a}
#zingoProWorld .zp-bottom .active,#zingoProWorld .zp-bottom .active small{color:#f1c65d}
@media(max-width:380px){#zingoProWorld .zp-content{padding-inline:11px}#zingoProWorld .zp-feature{padding:11px 9px}#zingoProWorld .zp-feature h3{font-size:12px}#zingoProWorld .zp-feature p{font-size:10px}#zingoProWorld .zp-hero{padding-inline:18px}#zingoProWorld .zp-hero h1{font-size:32px}}
</style>
'''

new=src[:a.start()]+pro+src[b.start():]
new=re.sub(r'<style id="zingoProExactV3">.*?</style>',css.strip(),new,flags=re.I|re.S)
if 'id="zingoProExactV3"' not in new: new=new.replace('</head>',css+'</head>',1)

old_scripts=re.findall(r'<script\b[^>]*>.*?</script>',src,re.I|re.S)
new_scripts=re.findall(r'<script\b[^>]*>.*?</script>',new,re.I|re.S)
if old_scripts!=new_scripts: raise SystemExit("❌ STOP: script content changed")

for i,body in enumerate(re.findall(r'<script\b[^>]*>(.*?)</script>',new,re.I|re.S),1):
    if not body.strip(): continue
    f=Path(f'.zingo_v3_{i}.js'); f.write_text(body,encoding='utf-8')
    try:
        r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
        if r.returncode: raise SystemExit(f"❌ JS ERROR IN SCRIPT {i}\n{r.stderr}")
    finally: f.unlink(missing_ok=True)

backup=P.with_name('index_before_pro_exact_v3_20260926.html')
shutil.copy2(P,backup)
old=P.stat().st_size
P.write_text(new,encoding='utf-8')
print("✅ تم تطبيق PRO V3 الكامل.")
print("BACKUP="+backup.name)
print("OLD_SIZE="+str(old))
print("NEW_SIZE="+str(P.stat().st_size))
print("SCRIPTS="+str(len(new_scripts)))
print("JS=ALL_OK")
print("PRO_UI=FULL_PROMPT_VERSION")
print("FREE_SECTION=KEPT")
print("VIP_SECTION=KEPT")
print("API_JS=UNCHANGED_BYTE_FOR_BYTE")
print("PROFILE=UNCHANGED")
print("TELEGRAM=UNCHANGED")
print("BOT=NOT_TOUCHED")
print("WORKER=NOT_TOUCHED")
print("DEPLOY=NOT_PERFORMED")

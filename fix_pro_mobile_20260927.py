from pathlib import Path

p = Path("index.html")
s = p.read_text(encoding="utf-8")

MARK = "/* ZINGO PRO MOBILE MASTER FIX 20260927 */"

if MARK in s:
    raise SystemExit("❌ PATCH_ALREADY_INSTALLED")

css = r'''
<style>
/* ZINGO PRO MOBILE MASTER FIX 20260927 */

#zingoProWorld.zingo-pro-exact-final{
  position:relative!important;
  width:100%!important;
  min-width:0!important;
  min-height:100dvh!important;
  height:auto!important;
  margin:0!important;
  padding:0!important;
  overflow:visible!important;
  box-sizing:border-box!important;
  background:
    radial-gradient(circle at 50% -8%,rgba(255,201,74,.12),transparent 36%),
    radial-gradient(circle at 90% 26%,rgba(143,86,13,.10),transparent 30%),
    linear-gradient(180deg,#0b0a08 0%,#090909 48%,#070707 100%)!important;
}

/* لا يوجد هاتف داخل الهاتف */
#zingoProWorld.zingo-pro-exact-final .zpro-phone{
  position:relative!important;
  width:100%!important;
  max-width:none!important;
  min-width:0!important;
  min-height:100dvh!important;
  height:auto!important;
  margin:0!important;
  padding:0!important;
  border:0!important;
  border-radius:0!important;
  background:transparent!important;
  box-shadow:none!important;
}

/* إزالة الإطار الداخلي */
#zingoProWorld.zingo-pro-exact-final .zpro-phone::before{
  display:none!important;
}

/* الشاشة هي الصفحة نفسها */
#zingoProWorld.zingo-pro-exact-final .zpro-screen{
  position:relative!important;
  width:100%!important;
  min-width:0!important;
  min-height:100dvh!important;
  height:auto!important;
  overflow:visible!important;
  border:0!important;
  border-radius:0!important;
  background:
    radial-gradient(circle at 52% 14%,rgba(255,196,69,.08),transparent 24%),
    linear-gradient(180deg,#0d0c0b 0%,#0a0908 54%,#080808 100%)!important;
}

/* المحتوى هو الذي يتمدد، وليس إطارًا صغيرًا */
#zingoProWorld.zingo-pro-exact-final .zpro-wrap{
  position:relative!important;
  width:100%!important;
  max-width:none!important;
  min-width:0!important;
  padding:
    12px
    13px
    calc(112px + env(safe-area-inset-bottom))
    13px!important;
}

/* الهيدر */
#zingoProWorld.zingo-pro-exact-final .zpro-topbar{
  width:100%!important;
  min-width:0!important;
  grid-template-columns:40px minmax(0,1fr) 40px!important;
  gap:7px!important;
  margin-bottom:12px!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-brand{
  min-width:0!important;
  overflow:hidden!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-brand-title{
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}

/* البطل */
#zingoProWorld.zingo-pro-exact-final .zpro-hero{
  width:100%!important;
  min-width:0!important;
  min-height:190px!important;
  padding:20px 17px!important;
  border-radius:22px!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-hero-copy{
  width:61%!important;
  max-width:230px!important;
  min-width:0!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-hero-title{
  font-size:30px!important;
  line-height:1.05!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-hero-art{
  right:-5px!important;
  top:18px!important;
  width:165px!important;
  height:165px!important;
  pointer-events:none!important;
}

/* الميزات: بطاقات واضحة على الهاتف */
#zingoProWorld.zingo-pro-exact-final .zpro-features{
  width:100%!important;
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  gap:7px!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-feature{
  min-width:0!important;
  min-height:112px!important;
  padding:11px 7px!important;
  border-radius:17px!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-feature-icon{
  width:40px!important;
  height:40px!important;
  margin-bottom:7px!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-feature-title{
  font-size:10px!important;
  line-height:1.55!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-feature-note{
  font-size:7px!important;
  line-height:1.45!important;
}

/* قسم المباريات */
#zingoProWorld.zingo-pro-exact-final .zpro-matches{
  width:100%!important;
  gap:10px!important;
}

/* بطاقة المباراة */
#zingoProWorld.zingo-pro-exact-final .zpro-match{
  width:100%!important;
  min-width:0!important;
  border-radius:18px!important;
}

/* صف المباراة: تاريخ / الفرق / الحالة */
#zingoProWorld.zingo-pro-exact-final .zpro-match summary{
  width:100%!important;
  min-width:0!important;
  grid-template-columns:50px minmax(0,1fr) 68px!important;
  gap:9px!important;
  padding:12px 10px!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-teams{
  min-width:0!important;
  width:100%!important;
  gap:7px!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-team{
  min-width:0!important;
  max-width:42%!important;
  font-size:10px!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-team span{
  min-width:0!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  white-space:nowrap!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-team em{
  width:28px!important;
  height:28px!important;
  flex:0 0 28px!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-vs{
  flex:0 0 auto!important;
  font-size:9px!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-status{
  min-width:0!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-time{
  font-size:10px!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-live{
  font-size:7px!important;
  padding:4px 6px!important;
}

/* المعلومات الإضافية */
#zingoProWorld.zingo-pro-exact-final .zpro-match-extra{
  width:100%!important;
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
  gap:7px!important;
  padding:0 10px 10px!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-extra{
  min-width:0!important;
  min-height:47px!important;
  padding:9px!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-extra b{
  font-size:7px!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-extra span{
  font-size:10px!important;
}

/* زر التوقع الرئيسي */
#zingoProWorld.zingo-pro-exact-final .zpro-cta{
  width:100%!important;
  min-height:55px!important;
  margin-top:15px!important;
  padding:14px 12px!important;
  border-radius:18px!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-cta-title{
  font-size:16px!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-cta-sub{
  font-size:9px!important;
}

/* شريط التنقل ثابت على الشاشة */
#zingoProWorld.zingo-pro-exact-final .zpro-nav{
  position:fixed!important;
  left:10px!important;
  right:10px!important;
  bottom:calc(8px + env(safe-area-inset-bottom))!important;
  width:auto!important;
  max-width:none!important;
  z-index:99999!important;

  display:grid!important;
  grid-template-columns:repeat(5,minmax(0,1fr))!important;
  gap:4px!important;

  padding:6px!important;
  min-height:66px!important;

  border-radius:19px!important;
  border:1px solid rgba(255,216,111,.18)!important;
  background:rgba(10,9,8,.96)!important;
  backdrop-filter:blur(20px)!important;
  -webkit-backdrop-filter:blur(20px)!important;

  box-shadow:
    0 14px 35px rgba(0,0,0,.55),
    0 0 28px rgba(240,191,67,.07)!important;
}

/* أزرار الشريط */
#zingoProWorld.zingo-pro-exact-final .zpro-nav a{
  min-width:0!important;
  min-height:52px!important;
  padding:5px 2px!important;
  border-radius:13px!important;
  font-size:7px!important;
  gap:3px!important;
  -webkit-tap-highlight-color:transparent!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-nav .nav-icon{
  width:27px!important;
  height:27px!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-nav .nav-label{
  font-size:8px!important;
  white-space:nowrap!important;
}

/* لا تجعل الـ nav جزءًا من المحتوى */
#zingoProWorld.zingo-pro-exact-final .zpro-nav + *{
  margin-bottom:0!important;
}

/* التوقعات/الاختيارات إن ظهرت داخل تفاصيل المباراة */
#zingoProWorld.zingo-pro-exact-final .zpro-match details,
#zingoProWorld.zingo-pro-exact-final .zpro-match[open]{
  width:100%!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-match button,
#zingoProWorld.zingo-pro-exact-final .zpro-match input,
#zingoProWorld.zingo-pro-exact-final .zpro-match select{
  touch-action:manipulation!important;
}

/* أي خيارات توقع تظهر بعد فتح المباراة */
#zingoProWorld.zingo-pro-exact-final .zpro-picks,
#zingoProWorld.zingo-pro-exact-final .zpro-options,
#zingoProWorld.zingo-pro-exact-final .zpro-predictions,
#zingoProWorld.zingo-pro-exact-final .zpro-prediction-options{
  width:100%!important;
  display:grid!important;
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  gap:8px!important;
  margin-top:10px!important;
}

#zingoProWorld.zingo-pro-exact-final .zpro-picks button,
#zingoProWorld.zingo-pro-exact-final .zpro-options button,
#zingoProWorld.zingo-pro-exact-final .zpro-predictions button,
#zingoProWorld.zingo-pro-exact-final .zpro-prediction-options button{
  min-height:48px!important;
  border-radius:13px!important;
  font-size:13px!important;
  font-weight:1000!important;
}

/* الهاتف الصغير */
@media(max-width:380px){

  #zingoProWorld.zingo-pro-exact-final .zpro-wrap{
    padding-left:10px!important;
    padding-right:10px!important;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-hero{
    min-height:180px!important;
    padding:18px 14px!important;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-hero-copy{
    width:62%!important;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-hero-title{
    font-size:27px!important;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-hero-art{
    transform:scale(.88) rotate(-6deg)!important;
    right:-17px!important;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-features{
    gap:5px!important;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-feature{
    min-height:105px!important;
    padding:9px 4px!important;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-feature-icon{
    width:36px!important;
    height:36px!important;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-feature-title{
    font-size:9px!important;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-match summary{
    grid-template-columns:45px minmax(0,1fr) 59px!important;
    gap:6px!important;
    padding:10px 8px!important;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-team{
    font-size:9px!important;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-team em{
    width:25px!important;
    height:25px!important;
    flex-basis:25px!important;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-nav{
    left:7px!important;
    right:7px!important;
  }
}

/* الشاشات الأكبر: يبقى التصميم Mobile-style ولا يتحول إلى Desktop */
@media(min-width:560px){

  #zingoProWorld.zingo-pro-exact-final{
    padding:0!important;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-phone,
  #zingoProWorld.zingo-pro-exact-final .zpro-screen{
    min-height:100dvh!important;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-wrap{
    max-width:560px!important;
    margin:0 auto!important;
  }

  #zingoProWorld.zingo-pro-exact-final .zpro-nav{
    left:50%!important;
    right:auto!important;
    width:min(calc(100% - 20px),540px)!important;
    transform:translateX(-50%)!important;
  }
}

/* safe area */
@supports(padding:max(0px)){
  #zingoProWorld.zingo-pro-exact-final .zpro-wrap{
    padding-bottom:max(112px,calc(92px + env(safe-area-inset-bottom)))!important;
  }
}
</style>
'''

# Insert immediately before </head> so it overrides every previous PRO layer.
needle = "</head>"
if needle not in s:
    raise SystemExit("❌ HEAD_NOT_FOUND")

s = s.replace(needle, "\n" + MARK + "\n" + css + "\n</head>", 1)

p.write_text(s, encoding="utf-8")
print("✅ PRO_MOBILE_MASTER_FIX_APPLIED")
print("✅ FILE:", p)
print("✅ BACKUP: index_before_pro_mobile_fix_20260927_v2.html")
print("✅ API UNTOUCHED")
print("✅ BOT UNTOUCHED")
print("✅ WORKER UNTOUCHED")

/* ZINGO BILINGUAL I18N V1 */

(function(){

  const KEEP = new Set([
    "ZINGO",
    "ZINGO PRO",
    "ZINGO VIP",
    "PRO",
    "VIP",
    "BLACK DIAMOND",
    "ROYAL ASCENSION",
    "COMMAND CENTER",
    "PREDICTION COCKPIT",
    "AAA ESPORTS",
    "النقاط",
    "HUD",
    "VFX",
    "AR",
    "EN"
  ]);

  const dict = {

    "AAA ESPORTS COMMAND CENTER":"مركز قيادة AAA للرياضات الإلكترونية",
    "مركز اللعب":"مركز قيادة الألعاب",
    "مركز VIP":"مركز قيادة VIP",
    "ULTRA EXCLUSIVE / VIP":"حصري للغاية / VIP",
    "AAA ESPORTS / PRO":"AAA ESPORTS / PRO",

    "أهلًا بعودتك":"مرحبًا بعودتك",
    "أهلًا بك في VIP":"مرحبًا بك في Black Diamond",

    "لعبتك. ترتيبك. توقعك.":"لعبتك. رتبتك. قرارك.",
    "مساحتك الخاصة للتوقعات.":"قمرة توقعاتك الخاصة.",
    "Track matches, make predictions, earn النقاط and climb the championship system.":"تابع المباريات، ضع التوقعات، اكسب النقاط واصعد في نظام البطولة.",
    "A living VIP environment built around your predictions, analysis, royal rank and exclusive rewards.":"بيئة VIP متكاملة مبنية حول توقعاتك وتحليلك ورتبتك الملكية ومكافآتك الحصرية.",

    "ترتيب PRO":"رتبة PRO",
    "التصنيف الحالي":"القسم الحالي",
    "Season progress":"تقدم الموسم",
    "Total saved":"إجمالي المحفوظ",
    "Championship":"البطولة",
    "Royal":"ROYAL",
    "Leaderboard":"المتصدرون",

    "Live Cockpit":"القمرة المباشرة",
    "Match Center":"مركز المباريات",
    "ACTIVE":"نشطة",
    "UPCOMING":"قادمة",
    "PREDICT":"توقع",
    "ضع توقعك":"إنشاء توقع",
    "عرض الإحصائيات":"عرض الإحصائيات",
    "OPEN COCKPIT":"فتح القمرة",
    "ROYAL المكافآت":"المكافآت الملكية",

    "PRO مركز المباريات":"مركز مباريات PRO",
    "No active matches available right now.":"لا توجد مباريات نشطة حاليًا.",
    "No matches available.":"لا توجد مباريات متاحة.",
    "مباراة نشطة":"مباراة نشطة",

    "PRO التوقعات":"توقعات PRO",
    "VIP PREDICTION COCKPIT":"قمرة توقعات VIP",
    "Cockpit":"القمرة",
    "Make your call":"ضع توقعك",
    "الفائز":"الفائز",
    "الأهداف":"الأهداف",
    "النتيجة":"النتيجة",
    "صاحب الأرض":"صاحب الأرض",
    "الضيف":"الضيف",
    "تعادل":"تعادل",
    "حفظ التوقع":"حفظ التوقع",
    "تم حفظ التوقع":"تم حفظ التوقع",
    "القواعد":"القواعد",
    "Select your prediction for each market, then save it before the prediction window closes.":"اختر توقعك لكل سوق، ثم احفظه قبل انتهاء نافذة التوقع.",
    "Each prediction is stored individually. Results become visible after the match is settled.":"يتم حفظ كل توقع بشكل مستقل، وتظهر النتيجة بعد حسم المباراة.",

    "PLAYER HUB":"الملف الشخصي",
    "TELEGRAM IDENTITY":"هوية تيليجرام",
    "PLAYER IDENTITY":"هوية اللاعب",
    "BLACK DIAMOND PLAYER":"لاعب Black Diamond",

    "Stats":"الإحصائيات",
    "Accuracy":"الدقة",
    "Awaiting settled data":"بانتظار البيانات النهائية",
    "Wins":"الانتصارات",
    "Season":"الموسم",
    "Progress":"التقدم",
    "Season Progress":"تقدم الموسم",
    "Analysis Center":"مركز التحليل",
    "ADVANCED التحليل":"التحليل المتقدم",
    "Private intelligence layer.":"طبقة استخبارات خاصة.",
    "This is the dedicated VIP architecture layer for advanced match intelligence, deeper statistics and future analysis modules.":"هذه طبقة VIP مخصصة للتحليل المتقدم للمباريات والإحصائيات الأعمق ووحدات التحليل المستقبلية.",
    "VIP MODULE":"وحدة VIP",
    "Module architecture ready for live data.":"بنية الوحدة جاهزة للبيانات المباشرة.",

    "المكافآت SYSTEM":"نظام المكافآت",
    "Royal Vault":"الخزنة الملكية",
    "Rewards":"المكافآت",
    "Exclusive rewards await.":"مكافآت حصرية بانتظارك.",
    "Build your reward profile.":"طوّر ملف مكافآتك.",
    "Points, badges, rank progression and future reward modules live here.":"النقاط والشارات وتطور الرتبة ووحدات المكافآت المستقبلية موجودة هنا.",
    "Badges":"الشارات",
    "System ready":"النظام جاهز",
    "Achievements":"الإنجازات",

    "Momentum Engine":"محرك الزخم",
    "Team Form":"مستوى الفريق",
    "Goal Patterns":"أنماط الأهداف",
    "Market Intelligence":"ذكاء الأسواق",

    "ROYAL ASCENSION":"ROYAL ASCENSION",



    "Home":"الرئيسية",
    "Dashboard":"لوحة القيادة",
    "Command Center":"مركز القيادة",
    "Matches":"المباريات",
    "Match Center":"مركز المباريات",
    "Predictions":"التوقعات",
    "Prediction":"التوقع",
    "Prediction Cockpit":"قمرة التوقعات",
    "Markets":"الأسواق",
    "Winner":"الفائز",
    "Goals":"الأهداف",
    "Score":"النتيجة",
    "Stats":"الإحصائيات",
    "History":"السجل",
    "Results":"النتائج",
    "Profile":"الملف الشخصي",
    "Achievements":"الإنجازات",
    "Rewards":"المكافآت",
    "Competition":"البطولة",
    "Leaderboard":"لوحة المتصدرين",
    "Championship Leaderboard":"لوحة أبطال البطولة",
    "Player Hub":"مركز اللاعب",
    "الترتيب":"الرتبة",
    "النقاط":"النقاط",
    "Points":"النقاط",
    "Missions":"المهمات",
    "Rewards":"المكافآت",
    "Save Prediction":"حفظ التوقع",
    "Saved":"تم الحفظ",
    "Save":"حفظ",
    "Edit":"تعديل",
    "Cancel":"إلغاء",
    "Confirm":"تأكيد",
    "Back":"رجوع",
    "Next":"التالي",
    "Close":"إغلاق",
    "Skip":"تخطي",
    "Start":"ابدأ",
    "Continue":"متابعة",
    "Loading":"جارٍ التحميل...",
    "Loading...":"جارٍ التحميل...",
    "No matches":"لا توجد مباريات",
    "No active matches":"لا توجد مباريات نشطة",
    "Rules":"القواعد",
    "Your Prediction":"توقعك",
    "Your Predictions":"توقعاتك",
    "Prediction saved":"تم حفظ التوقع",
    "Prediction submitted":"تم إرسال التوقع",
    "Choose your prediction":"اختر توقعك",
    "Select a match":"اختر مباراة",
    "Select":"اختيار",
    "Selected":"تم الاختيار",
    "Overview":"نظرة عامة",
    "Analysis":"التحليل",
    "Advanced Analysis Center":"مركز التحليل المتقدم",
    "Royal Rewards":"المكافآت الملكية",
    "Royal الترتيب":"الرتبة الملكية",
    "VIP Command Center":"مركز قيادة VIP",
    "Black Diamond":"Black Diamond",
    "Premium":"VIP",
    "Upgrade":"ترقية",
    "Upgrade to VIP":"الترقية إلى VIP",
    "Access":"الدخول",
    "VIP Access":"دخول VIP",
    "Locked":"مغلق",
    "Unlocked":"مفتوح",
    "Exclusive":"حصري",
    "Elite":"نخبة",
    "Player":"اللاعب",
    "Players":"اللاعبون",
    "Season":"الموسم",
    "Division":"القسم",
    "Status":"الحالة",
    "Active":"نشط",
    "Upcoming":"قادمة",
    "Finished":"منتهية",
    "Live":"مباشر",
    "Win":"فوز",
    "Loss":"خسارة",
    "Draw":"تعادل",
    "Total":"الإجمالي",
    "Today":"اليوم",
    "Recent":"الأخيرة",
    "Welcome":"أهلًا بك",
    "أهلًا بعودتك":"مرحبًا بعودتك",
    "Good luck":"بالتوفيق",
    "Leaderboard":"المتصدرون",
    "History & Results":"السجل والنتائج",
    "Stats & History":"الإحصائيات والسجل",
    "Settings":"الإعدادات",
    "Language":"اللغة",
    "Arabic":"العربية",
    "English":"English",
    "Choose language":"اختر اللغة",

    "ROYAL ASCENSION":"ROYAL ASCENSION",
    "SKIP":"تخطي",
    "Away":"الضيف",
    "OVER 1.5":"أكثر من 1.5",
    "UNDER 1.5":"أقل من 1.5",
    "OVER 2.5":"أكثر من 2.5",
    "UNDER 2.5":"أقل من 2.5",
    "VIP access required":"يتطلب دخول VIP",
    "Request failed":"فشل الطلب",
    "Black Diamond Access":"دخول Black Diamond",
    "PRO → BLACK DIAMOND VIP":"PRO → BLACK DIAMOND VIP"

  };

  const originals = new WeakMap();

  function clean(v){
    return v.replace(/\s+/g," ").trim();
  }

  function translateText(text, lang){
    const key = clean(text);
    if(!key || KEEP.has(key)) return null;

    if(lang === "ar"){
      return dict[key] || null;
    }

    return null;
  }

  function shouldSkip(el){
    if(!el || !el.parentElement) return true;

    const tag = el.parentElement.tagName;

    return [
      "SCRIPT",
      "STYLE",
      "NOSCRIPT",
      "TEXTAREA",
      "INPUT"
    ].includes(tag);
  }

  function capture(root=document.body){
    if(!root) return;

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT
    );

    const nodes=[];

    while(walker.nextNode()){
      const n=walker.currentNode;
      if(!shouldSkip(n)) nodes.push(n);
    }

    nodes.forEach(n=>{
      if(!originals.has(n)){
        originals.set(n,n.nodeValue);
      }
    });
  }

  function apply(lang){
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    capture();

    document.querySelectorAll(
      "script,style"
    ).forEach(()=>{});

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );

    const nodes=[];

    while(walker.nextNode()){
      const n=walker.currentNode;
      if(!shouldSkip(n)) nodes.push(n);
    }

    nodes.forEach(n=>{
      const original=originals.get(n);
      if(original == null) return;

      const key=clean(original);

      if(lang === "en"){
        n.nodeValue=original;
        return;
      }

      const translated=translateText(original,lang);

      if(translated){
        n.nodeValue=original.replace(key,translated);
      }
    });

    document.querySelectorAll("[placeholder]").forEach(el=>{
      if(!el.dataset.zingoOriginalPlaceholder){
        el.dataset.zingoOriginalPlaceholder=el.getAttribute("placeholder") || "";
      }

      const original=el.dataset.zingoOriginalPlaceholder;
      const translated=lang==="ar" ? translateText(original,lang) : null;

      el.setAttribute(
        "placeholder",
        translated || original
      );
    });

    document.querySelectorAll("[aria-label]").forEach(el=>{

      if(!el.dataset.zingoOriginalAria){
        el.dataset.zingoOriginalAria=el.getAttribute("aria-label") || "";
      }

      const original=el.dataset.zingoOriginalAria;
      const translated=lang==="ar" ? translateText(original,lang) : null;

      if(translated){
        el.setAttribute("aria-label",translated);
      }else if(lang==="en"){
        el.setAttribute("aria-label",original);
      }
    });

    document.querySelectorAll(
      "#zingoLangAR,#zingoLangEN"
    ).forEach(b=>b.classList.remove("active"));

    document
      .getElementById(lang==="ar" ? "zingoLangAR" : "zingoLangEN")
      ?.classList.add("active");

    document.body.classList.remove("zingo-i18n-fade");
    void document.body.offsetWidth;
    document.body.classList.add("zingo-i18n-fade");

    localStorage.setItem("zingo_language",lang);

    window.dispatchEvent(
      new CustomEvent("zingo:language-change",{
        detail:{language:lang}
      })
    );
  }

  function init(){

    capture();

    const saved=localStorage.getItem("zingo_language") || "ar";

    document
      .getElementById("zingoLangAR")
      ?.addEventListener("click",()=>apply("ar"));

    document
      .getElementById("zingoLangEN")
      ?.addEventListener("click",()=>apply("en"));

    apply(saved);

    const observer=new MutationObserver(mutations=>{
      let added=false;

      for(const m of mutations){
        if(m.addedNodes && m.addedNodes.length){
          added=true;
          break;
        }
      }

      if(added){
        capture();
        const current=localStorage.getItem("zingo_language") || "ar";
        apply(current);
      }
    });

    observer.observe(document.body,{
      childList:true,
      subtree:true
    });

    window.zingoI18n={
      setLanguage:apply,
      getLanguage:()=>localStorage.getItem("zingo_language") || "ar"
    };
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",init);
  }else{
    init();
  }

})();
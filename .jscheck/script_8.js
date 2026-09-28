/* =========================================================
   ZINGO PROFILE SYSTEM V2
   FREE / PRO / VIP
   XP + LEVEL + RATING + ACHIEVEMENTS + MISSIONS
   TITLES + BADGES + FRAMES
   ========================================================= */

(function(){

  const STORE = "zingo_profile_identity_v2";

  const MODE = () => String(
    window.__zingoMode ||
    window.__zingoState?.mode ||
    "free"
  ).toLowerCase();

  const esc = v => String(v ?? "").replace(/[&<>"']/g,m=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[m]));

  const telegramUser =
    window.Telegram?.WebApp?.initDataUnsafe?.user || {};

  function readStore(){
    try{
      return JSON.parse(localStorage.getItem(STORE) || "{}");
    }catch(e){
      return {};
    }
  }

  function writeStore(data){
    try{
      localStorage.setItem(STORE,JSON.stringify(data));
    }catch(e){}
  }

  function defaultData(){
    return {
      xp:0,
      rating:0,
      correct:0,
      exact:0,
      predictions:0,
      streak:0,
      bestStreak:0,
      achievements:[],
      missions:{},
      unlockedTitles:[],
      selectedTitle:"",
      selectedFrame:"none",
      vipAvatar:"",
      avatarType:"initial"
    };
  }

  function data(){
    return {
      ...defaultData(),
      ...readStore()
    };
  }

  function saveData(d){
    writeStore(d);
    window.__zingoProfileProgress = d;
  }

  window.__zingoProfileProgress = data();

/* V2 editor draft */
window.__zingoProfileV2Draft = {
  club_id:"",
  avatar:"",
  frame:"none"
};

  /* =========================================================
     LEVEL SYSTEM
     ========================================================= */

  const LEVELS = [
    {level:1,xp:0,name:"مبتدئ"},
    {level:2,xp:100,name:"متدرّب"},
    {level:3,xp:250,name:"متوقع"},
    {level:4,xp:450,name:"متقدم"},
    {level:5,xp:700,name:"محلل"},
    {level:6,xp:1000,name:"خبير"},
    {level:7,xp:1400,name:"محترف"},
    {level:8,xp:1900,name:"نخبة"},
    {level:9,xp:2500,name:"أسطوري"},
    {level:10,xp:3300,name:"سيد"},
    {level:11,xp:4300,name:"ملك"},
    {level:12,xp:5600,name:"أسطورة"},
    {level:13,xp:7200,name:"ملكي"},
    {level:14,xp:9200,name:"المهيب"},
    {level:15,xp:12000,name:"العرش"}
  ];

  function getLevel(xp){
    let current=LEVELS[0];

    for(const l of LEVELS){
      if(xp>=l.xp) current=l;
    }

    return current;
  }

  function nextLevel(xp){
    return LEVELS.find(l=>xp<l.xp) || null;
  }

  function levelProgress(xp){
    const current=getLevel(xp);
    const next=nextLevel(xp);

    if(!next) return 100;

    return Math.max(
      0,
      Math.min(
        100,
        ((xp-current.xp)/(next.xp-current.xp))*100
      )
    );
  }

  /* =========================================================
     RATING
     ========================================================= */

  function calculateRating(d){
    const predictions=Number(d.predictions||0);
    const correct=Number(d.correct||0);
    const exact=Number(d.exact||0);
    const streak=Number(d.bestStreak||0);

    if(!predictions) return 0;

    const accuracy=(correct/predictions)*70;
    const exactBonus=Math.min(20,exact*2);
    const streakBonus=Math.min(10,streak);

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(accuracy+exactBonus+streakBonus)
      )
    );
  }

  /* =========================================================
     TITLES
     ========================================================= */

  const TITLES = [

    {
      id:"first_prediction",
      name:"المتوقع",
      icon:"🎯",
      rarity:"عادي",
      xp:50
    },

    {
      id:"accurate",
      name:"قارئ المباراة",
      icon:"👁️",
      rarity:"نادر",
      xp:400
    },

    {
      id:"streak",
      name:"صائد السلاسل",
      icon:"🔥",
      rarity:"نادر",
      streak:5
    },

    {
      id:"sniper",
      name:"قناص النتائج",
      icon:"🎯",
      rarity:"ملحمي",
      exact:3
    },

    {
      id:"master",
      name:"خبير التوقعات",
      icon:"💎",
      rarity:"ملحمي",
      correct:50
    },

    {
      id:"champion",
      name:"بطل المنافسات",
      icon:"🏆",
      rarity:"أسطوري",
      rating:80
    },

    {
      id:"king",
      name:"الملك",
      icon:"👑",
      rarity:"ملكي",
      vip:true,
      xp:5600
    },

    {
      id:"master_of_predictions",
      name:"السيد",
      icon:"♛",
      rarity:"ملكي",
      vip:true,
      correct:100
    },

    {
      id:"legend",
      name:"الأسطورة",
      icon:"🏆",
      rarity:"ملكي",
      vip:true,
      exact:15
    },

    {
      id:"royal",
      name:"الملكي",
      icon:"👑",
      rarity:"ملكي",
      vip:true,
      rating:95,
      xp:9200
    },

    {
      id:"throne",
      name:"صاحب العرش",
      icon:"♔",
      rarity:"نادر جدًا",
      vip:true,
      xp:12000
    }

  ];

  function titleUnlocked(t,d){
    if(t.vip && MODE()!=="vip") return false;
    if(t.xp && d.xp<t.xp) return false;
    if(t.correct && d.correct<t.correct) return false;
    if(t.exact && d.exact<t.exact) return false;
    if(t.streak && d.bestStreak<t.streak) return false;
    if(t.rating && d.rating<t.rating) return false;
    return true;
  }

  function availableTitles(d){
    return TITLES.filter(t=>titleUnlocked(t,d));
  }

  function currentTitle(d){
    const unlocked=availableTitles(d);

    if(!unlocked.length) return TITLES[0];

    if(d.selectedTitle){
      const selected=unlocked.find(t=>t.id===d.selectedTitle);
      if(selected) return selected;
    }

    return unlocked[unlocked.length-1];
  }

  /* =========================================================
     ACHIEVEMENTS
     ========================================================= */

  const ACHIEVEMENTS = [

    {
      id:"first",
      icon:"🌱",
      name:"البداية",
      text:"أول توقع",
      check:d=>d.predictions>=1,
      xp:50
    },

    {
      id:"five",
      icon:"🎯",
      name:"بداية الدقة",
      text:"5 توقعات صحيحة",
      check:d=>d.correct>=5,
      xp:100
    },

    {
      id:"ten",
      icon:"🔥",
      name:"القنّاص",
      text:"10 توقعات صحيحة",
      check:d=>d.correct>=10,
      xp:150
    },

    {
      id:"streak5",
      icon:"⚡",
      name:"سلسلة النار",
      text:"5 توقعات صحيحة متتالية",
      check:d=>d.bestStreak>=5,
      xp:200
    },

    {
      id:"exact3",
      icon:"🎯",
      name:"عين النتيجة",
      text:"3 نتائج دقيقة",
      check:d=>d.exact>=3,
      xp:250
    },

    {
      id:"correct25",
      icon:"💎",
      name:"المحلل",
      text:"25 توقعًا صحيحًا",
      check:d=>d.correct>=25,
      xp:350
    },

    {
      id:"correct50",
      icon:"👑",
      name:"خبير التوقعات",
      text:"50 توقعًا صحيحًا",
      check:d=>d.correct>=50,
      xp:500
    },

    {
      id:"exact10",
      icon:"🏆",
      name:"صياد النتائج",
      text:"10 نتائج دقيقة",
      check:d=>d.exact>=10,
      xp:700
    },

    {
      id:"rating80",
      icon:"⭐",
      name:"نخبة الدقة",
      text:"الوصول إلى تقييم 80",
      check:d=>d.rating>=80,
      xp:600
    },

    {
      id:"vip100",
      icon:"♛",
      name:"السيد",
      text:"100 توقع صحيح",
      check:d=>MODE()==="vip" && d.correct>=100,
      xp:1200,
      vip:true
    },

    {
      id:"vip15exact",
      icon:"👑",
      name:"الأسطورة",
      text:"15 نتيجة دقيقة",
      check:d=>MODE()==="vip" && d.exact>=15,
      xp:1500,
      vip:true
    },

    {
      id:"royal",
      icon:"♔",
      name:"الملكي",
      text:"تقييم 95 و 9200 XP",
      check:d=>MODE()==="vip" && d.rating>=95 && d.xp>=9200,
      xp:2000,
      vip:true
    }

  ];

  function refreshAchievements(d){
    const unlocked=new Set(d.achievements||[]);

    for(const a of ACHIEVEMENTS){

      if(a.vip && MODE()!=="vip") continue;

      if(a.check(d) && !unlocked.has(a.id)){
        unlocked.add(a.id);
        d.xp += Number(a.xp||0);
      }

    }

    d.achievements=[...unlocked];
    d.rating=calculateRating(d);

    const possible=availableTitles(d);

    d.unlockedTitles=possible.map(x=>x.id);

    saveData(d);

    return d;
  }

  /* =========================================================
     MISSIONS
     ========================================================= */

  const MISSIONS = [

    {
      id:"daily_predictions",
      name:"مهمة اليوم",
      text:"أكمل 3 توقعات",
      target:3,
      type:"predictions",
      reward:50
    },

    {
      id:"daily_correct",
      name:"مهمة الدقة",
      text:"حقق توقعين صحيحين",
      target:2,
      type:"correct",
      reward:75
    },

    {
      id:"weekly_streak",
      name:"مهمة الأسبوع",
      text:"حقق سلسلة من 5 توقعات صحيحة",
      target:5,
      type:"streak",
      reward:150
    },

    {
      id:"vip_exact",
      name:"المهمة الملكية",
      text:"حقق نتيجتين دقيقتين",
      target:2,
      type:"exact",
      reward:250,
      vip:true
    }

  ];

  function missionValue(m,d){
    if(m.type==="predictions") return d.predictions;
    if(m.type==="correct") return d.correct;
    if(m.type==="streak") return d.bestStreak;
    if(m.type==="exact") return d.exact;
    return 0;
  }

  function missionDone(m,d){
    if(m.vip && MODE()!=="vip") return false;
    return missionValue(m,d)>=m.target;
  }

  /* =========================================================
     FRAME SYSTEM
     ========================================================= */

  const FRAMES=[

    {
      id:"none",
      name:"بدون إطار",
      icon:"○",
      unlock:0,
      vip:false
    },

    {
      id:"bronze",
      name:"إطار البداية",
      icon:"🥉",
      unlock:250,
      vip:false
    },

    {
      id:"silver",
      name:"إطار النخبة",
      icon:"🥈",
      unlock:1000,
      vip:false
    },

    {
      id:"gold",
      name:"الإطار الذهبي",
      icon:"🥇",
      unlock:2500,
      vip:false
    },

    {
      id:"royal",
      name:"الإطار الملكي",
      icon:"👑",
      unlock:5600,
      vip:true
    },

    {
      id:"legendary",
      name:"إطار الأسطورة",
      icon:"♛",
      unlock:9200,
      vip:true
    },

    {
      id:"throne",
      name:"إطار العرش",
      icon:"♔",
      unlock:12000,
      vip:true
    }

  ];

  function frameUnlocked(f,d){
    if(f.vip && MODE()!=="vip") return false;
    return d.xp>=f.unlock;
  }

  function currentFrame(d){
    const f=FRAMES.find(x=>x.id===d.selectedFrame);
    if(f && frameUnlocked(f,d)) return f;
    return FRAMES[0];
  }

  /* =========================================================
     AVATAR
     ========================================================= */

  function profile(){
    return window.__zingoProfile || {};
  }

  function initialAvatar(name){
    const value=String(
      name ||
      profile().display_name ||
      telegramUser.first_name ||
      "م"
    ).trim();

    return value.charAt(0).toUpperCase() || "م";
  }

  function clubAvatar(){
    const p=profile();

    if(
      typeof window.zingoClubById==="function" &&
      p.club_id
    ){
      const c=window.zingoClubById(p.club_id);
      if(c) return c[2];
    }

    return "";
  }

  function avatarData(d){
    if(MODE()==="free"){
      return {
        type:"initial",
        value:initialAvatar(profile().display_name)
      };
    }

    if(MODE()==="vip" && d.vipAvatar){
      return {
        type:"image",
        value:d.vipAvatar
      };
    }

    const club=clubAvatar();

    if(club){
      return {
        type:"club",
        value:club
      };
    }

    return {
      type:"initial",
      value:initialAvatar(profile().display_name)
    };
  }

  /* =========================================================
     IDENTITY HTML
     ========================================================= */

  function avatarHTML(d,small=false){

    const a=avatarData(d);
    const frame=currentFrame(d);

    const size=small ? "54px" : "92px";

    let inner="";

    if(a.type==="image" || a.type==="club"){

      inner=`
        <img
          src="${esc(a.value)}"
          alt=""
          style="
            width:100%;
            height:100%;
            object-fit:cover;
            border-radius:50%;
            display:block;
          "
        >
      `;

    }else{

      inner=`
        <span
          style="
            font-size:${small ? 22 : 38}px;
            font-weight:1000;
          "
        >
          ${esc(a.value)}
        </span>
      `;

    }

    return `
      <div
        class="zingo-v2-avatar-frame zingo-frame-${esc(frame.id)}"
        style="
          width:${size};
          height:${size};
          border-radius:50%;
          display:grid;
          place-items:center;
          position:relative;
          flex:0 0 auto;
        "
      >
        <div
          style="
            width:88%;
            height:88%;
            border-radius:50%;
            overflow:hidden;
            display:grid;
            place-items:center;
            background:rgba(255,255,255,.06);
          "
        >
          ${inner}
        </div>

        ${
          frame.id!=="none"
          ? `<span
              style="
                position:absolute;
                right:-3px;
                bottom:-3px;
                font-size:${small ? 15 : 20}px;
              "
            >${frame.icon}</span>`
          : ""
        }
      </div>
    `;
  }

  function identityHTML(){

    const d=refreshData();
    const p=profile();

    const title=currentTitle(d);
    const level=getLevel(d.xp);
    const next=nextLevel(d.xp);
    const progress=levelProgress(d.xp);

    return `
      <div
        class="zingo-v2-identity"
        style="
          display:flex;
          align-items:center;
          gap:12px;
          padding:10px 0;
        "
      >

        ${avatarHTML(d,true)}

        <div style="min-width:0;flex:1">

          <div
            style="
              display:flex;
              align-items:center;
              gap:6px;
              flex-wrap:wrap;
            "
          >

            <strong
              style="
                font-size:15px;
                font-weight:950;
              "
            >
              ${esc(
                p.display_name ||
                telegramUser.first_name ||
                "اللاعب"
              )}
            </strong>

            <span
              style="
                font-size:11px;
                opacity:.9;
              "
            >
              ${title.icon}
            </span>

            <span
              style="
                font-size:10px;
                font-weight:900;
              "
            >
              ${esc(title.name)}
            </span>

          </div>

          <div
            style="
              display:flex;
              align-items:center;
              gap:8px;
              margin-top:4px;
              font-size:10px;
              opacity:.72;
            "
          >
            <span>المستوى ${level.level}</span>
            <span>•</span>
            <span>${d.xp} XP</span>
            <span>•</span>
            <span>التقييم ${d.rating}</span>
          </div>

          <div
            style="
              height:4px;
              margin-top:6px;
              background:rgba(255,255,255,.08);
              border-radius:20px;
              overflow:hidden;
            "
          >
            <div
              style="
                width:${progress}%;
                height:100%;
                background:currentColor;
                border-radius:20px;
              "
            ></div>
          </div>

        </div>

      </div>
    `;
  }

  /* =========================================================
     DATA REFRESH
     ========================================================= */

  function refreshData(){

    const d=data();

    d.rating=calculateRating(d);

    const possible=availableTitles(d);

    d.unlockedTitles=possible.map(x=>x.id);

    saveData(d);

    return d;
  }

  /* =========================================================
     PROFILE CARD
     ========================================================= */

  function renderProfileCard(){

    const d=refreshData();
    const p=profile();
    const title=currentTitle(d);
    const level=getLevel(d.xp);
    const next=nextLevel(d.xp);

    return `

      <section class="card card-pad">

        <div
          style="
            display:flex;
            flex-direction:column;
            align-items:center;
            text-align:center;
          "
        >

          ${avatarHTML(d,false)}

          <div style="margin-top:12px">

            <h2 style="margin:0">
              ${esc(
                p.display_name ||
                telegramUser.first_name ||
                "اللاعب"
              )}
            </h2>

            <div
              style="
                margin-top:6px;
                font-weight:900;
              "
            >
              ${title.icon} ${esc(title.name)}
            </div>

            <div
              style="
                margin-top:5px;
                font-size:10px;
                opacity:.65;
              "
            >
              المستوى ${level.level}
              •
              ${d.xp} XP
              •
              التقييم ${d.rating}
            </div>

          </div>

        </div>

        <div
          style="
            display:grid;
            grid-template-columns:repeat(3,1fr);
            gap:8px;
            margin-top:18px;
          "
        >

          <div class="card card-pad" style="text-align:center">
            <strong>${d.predictions}</strong>
            <div class="muted" style="font-size:9px">التوقعات</div>
          </div>

          <div class="card card-pad" style="text-align:center">
            <strong>${d.correct}</strong>
            <div class="muted" style="font-size:9px">الصحيحة</div>
          </div>

          <div class="card card-pad" style="text-align:center">
            <strong>${d.exact}</strong>
            <div class="muted" style="font-size:9px">الدقيقة</div>
          </div>

        </div>

        <div style="margin-top:14px">

          <div
            style="
              display:flex;
              justify-content:space-between;
              font-size:10px;
              margin-bottom:5px;
            "
          >
            <span>التقدم</span>
            <span>
              ${
                next
                ? `${d.xp} / ${next.xp} XP`
                : "أعلى مستوى"
              }
            </span>
          </div>

          <div
            style="
              height:6px;
              border-radius:20px;
              overflow:hidden;
              background:rgba(255,255,255,.08);
            "
          >
            <div
              style="
                width:${levelProgress(d.xp)}%;
                height:100%;
                background:currentColor;
              "
            ></div>
          </div>

        </div>

        <button
          class="btn primary"
          type="button"
          style="width:100%;margin-top:16px"
          onclick="window.zingoOpenProfileEditorV2()"
        >
          تعديل الملف الشخصي
        </button>

        <button
          class="btn"
          type="button"
          style="width:100%;margin-top:8px"
          onclick="window.zingoOpenIdentityDetails()"
        >
          الإنجازات والألقاب والمهام
        </button>

      </section>
    `;
  }

  /* =========================================================
     PROFILE EDITOR
     ========================================================= */

  function closeEditor(){

    document
      .getElementById("zingoV2ProfileModal")
      ?.remove();

  }

  function editor(){

    closeEditor();

    const d=refreshData();
    const p=profile();

    const mode=MODE();

    const modal=document.createElement("div");

    modal.id="zingoV2ProfileModal";

    modal.style.cssText=`
      position:fixed;
      inset:0;
      z-index:99999;
      background:rgba(0,0,0,.82);
      backdrop-filter:blur(12px);
      overflow:auto;
      padding:20px 12px;
    `;

    const title=currentTitle(d);

    modal.innerHTML=`

      <div
        style="
          max-width:520px;
          margin:0 auto;
          padding-bottom:30px;
        "
      >

        <section class="card card-pad">

          <div
            style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              margin-bottom:15px;
            "
          >

            <div>
              <div class="eyebrow">الملف الشخصي</div>
              <h2 style="margin:5px 0 0">
                هوية اللاعب
              </h2>
            </div>

            <button
              class="btn"
              type="button"
              onclick="window.zingoCloseProfileEditorV2()"
            >
              إغلاق
            </button>

          </div>

          <div
            style="
              display:flex;
              flex-direction:column;
              align-items:center;
              text-align:center;
              margin:10px 0 20px;
            "
          >

            ${avatarHTML(d,false)}

            <div style="margin-top:8px;font-weight:900">
              ${title.icon} ${esc(title.name)}
            </div>

            <div
              class="muted"
              style="font-size:10px;margin-top:4px"
            >
              المستوى ${getLevel(d.xp).level}
              • ${d.xp} XP
            </div>

          </div>

          <label style="display:block">

            <div class="eyebrow" style="margin-bottom:7px">
              اسم اللاعب
            </div>

            <input
              id="zingoV2Name"
              class="zingo-profile-input"
              maxlength="24"
              value="${esc(p.display_name || "")}"
              placeholder="اكتب اسمك"
              autocomplete="off"
            >

          </label>

          ${
            mode==="free"
            ? `
              <div
                class="muted"
                style="
                  margin-top:12px;
                  padding:10px;
                  border-radius:10px;
                  background:rgba(255,255,255,.04);
                  font-size:11px;
                "
              >
                في النسخة المجانية تظهر صورتك تلقائيًا
                من أول حرف في اسمك.
              </div>
            `
            : `
              <div style="margin-top:18px">

                <div class="eyebrow">
                  الصورة الشخصية
                </div>

                <label
                  class="btn"
                  style="
                    display:block;
                    text-align:center;
                    margin-top:8px;
                  "
                >
                  اختيار صورة
                  <input
                    id="zingoV2Avatar"
                    type="file"
                    accept="image/*"
                    hidden
                  >
                </label>

                <div
                  class="muted"
                  style="font-size:10px;margin-top:6px"
                >
                  ${
                    mode==="vip"
                    ? "العضوية الملكية تدعم صورة شخصية حقيقية مع الإطارات."
                    : "العضوية الاحترافية تستخدم شعارات الأندية."
                  }
                </div>

              </div>
            `
          }

          ${
            mode==="pro" || mode==="vip"
            ? `
              <div style="margin-top:20px">

                <div class="eyebrow">
                  النادي المفضل
                </div>

                ${
                  Array.isArray(window.__zingoClubGroups)
                  ? ""
                  : ""
                }

                <div
                  id="zingoV2ClubGrid"
                  style="
                    display:grid;
                    grid-template-columns:repeat(3,1fr);
                    gap:8px;
                    margin-top:9px;
                  "
                >

                  ${
                    typeof window.zingoClubById==="function"
                    ? `
                      <div
                        style="
                          grid-column:1/-1;
                          font-size:10px;
                          opacity:.65;
                          padding:5px 0;
                        "
                      >
                        اختر شعار ناديك
                      </div>
                    `
                    : ""
                  }

                </div>

              </div>
            `
            : ""
          }

          ${
            mode==="vip"
            ? `
              <div style="margin-top:20px">

                <div class="eyebrow">
                  الإطار
                </div>

                <div
                  id="zingoV2FrameGrid"
                  style="
                    display:grid;
                    grid-template-columns:repeat(2,1fr);
                    gap:8px;
                    margin-top:9px;
                  "
                ></div>

              </div>
            `
            : ""
          }

          <div
            id="zingoV2Message"
            class="muted"
            style="
              min-height:20px;
              margin-top:12px;
              font-size:11px;
            "
          ></div>

          <div
            style="
              display:flex;
              gap:8px;
              margin-top:10px;
            "
          >

            <button
              class="btn primary"
              type="button"
              style="flex:1"
              onclick="window.zingoSaveProfileV2()"
            >
              حفظ
            </button>

            <button
              class="btn"
              type="button"
              onclick="window.zingoCloseProfileEditorV2()"
            >
              إلغاء
            </button>

          </div>

        </section>

      </div>
    `;

    document.body.appendChild(modal);

    let selectedClub=p.club_id || "";
    let selectedFrame=currentFrame(d).id;
    let selectedAvatar=d.vipAvatar || "";

    window.__zingoProfileV2Draft={
      club_id:selectedClub,
      avatar:selectedAvatar,
      frame:selectedFrame
    };

    /* النادي */

    const grid=document.getElementById("zingoV2ClubGrid");

    window.__zingoProfileV2Draft.club_id =
      p.club_id || "";

    if(
      grid &&
      typeof window.zingoAllClubs==="function"
    ){

      const clubs=window.zingoAllClubs();

      clubs.forEach(c=>{

        const id=c[0];
        const name=c[1];
        const logo=c[2];

        const b=document.createElement("button");

        b.type="button";
        b.className="btn";
        b.dataset.v2Club=id;

        b.style.cssText=`
          padding:7px 4px;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap:4px;
          min-height:72px;
          outline:${id===window.__zingoProfileV2Draft.club_id
            ? "2px solid currentColor"
            : "none"};
        `;

        b.innerHTML=`
          <img
            src="${esc(logo)}"
            alt=""
            style="
              width:34px;
              height:34px;
              object-fit:contain;
            "
          >
          <span style="font-size:8px">
            ${esc(name)}
          </span>
        `;

        b.addEventListener("click",()=>{

          window.__zingoProfileV2Draft.club_id=id;

          grid
            .querySelectorAll("[data-v2-club]")
            .forEach(x=>{
              x.style.outline=
                x.dataset.v2Club===id
                ? "2px solid currentColor"
                : "none";
            });

        });

        grid.appendChild(b);

      });

    }

    /* صورة VIP */
    document
      .getElementById("zingoV2Avatar")
      ?.addEventListener("change",async e=>{

        const file=e.target.files?.[0];

        if(!file) return;

        if(mode!=="vip"){
          selectedAvatar="";
          return;
        }

        try{

          const result=await new Promise((resolve,reject)=>{

            const reader=new FileReader();

            reader.onload=()=>{

              const img=new Image();

              img.onload=()=>{

                const max=512;

                let w=img.width;
                let h=img.height;

                if(w>max || h>max){

                  const scale=Math.min(
                    max/w,
                    max/h
                  );

                  w=Math.round(w*scale);
                  h=Math.round(h*scale);

                }

                const canvas=document.createElement("canvas");

                canvas.width=w;
                canvas.height=h;

                const ctx=canvas.getContext("2d");

                if(!ctx){
                  reject(new Error("تعذر معالجة الصورة"));
                  return;
                }

                ctx.drawImage(img,0,0,w,h);

                resolve(
                  canvas.toDataURL("image/jpeg",.82)
                );

              };

              img.onerror=()=>reject(
                new Error("الصورة غير صالحة")
              );

              img.src=reader.result;

            };

            reader.onerror=()=>reject(
              new Error("تعذر قراءة الصورة")
            );

            reader.readAsDataURL(file);

          });

          selectedAvatar=result;

          window.__zingoProfileV2Draft.avatar=result;

        }catch(err){

          const msg=document.getElementById("zingoV2Message");

          if(msg) msg.textContent=err.message;

        }

      });

    /* الإطارات */
    const frameGrid=document.getElementById("zingoV2FrameGrid");

    if(frameGrid){

      FRAMES
        .filter(f=>frameUnlocked(f,d))
        .forEach(f=>{

          const b=document.createElement("button");

          b.type="button";
          b.className="btn";

          b.style.cssText=`
            min-height:60px;
            font-size:10px;
            outline:${f.id===selectedFrame ? "2px solid currentColor" : "none"};
          `;

          b.innerHTML=`
            <div style="font-size:20px">${f.icon}</div>
            <div>${esc(f.name)}</div>
          `;

          b.addEventListener("click",()=>{

            selectedFrame=f.id;

            window.__zingoProfileV2Draft.frame=f.id;

            frameGrid
              .querySelectorAll("button")
              .forEach(x=>{
                x.style.outline="none";
              });

            b.style.outline="2px solid currentColor";

          });

          frameGrid.appendChild(b);

        });

    }

  }

  /* =========================================================
     SAVE
     ========================================================= */

  async function saveProfile(){

    const input=document.getElementById("zingoV2Name");

    const draft=window.__zingoProfileV2Draft || {
      club_id:"",
      avatar:"",
      frame:"none"
    };
    const msg=document.getElementById("zingoV2Message");

    const name=(input?.value || "").trim();

    if(!name){

      if(msg) msg.textContent="اكتب اسم اللاعب أولًا";

      return;

    }

    const d=refreshData();
    const mode=MODE();

    let avatar="";

    if(mode==="vip" && draft.avatar){
      avatar=draft.avatar;
    }

    if(
      mode!=="free" &&
      draft.club_id &&
      typeof window.zingoClubById==="function"
    ){

      const club=window.zingoClubById(draft.club_id);

      if(club){
        avatar=mode==="vip" && draft.avatar
          ? draft.avatar
          : club[2];
      }

    }

    try{

      if(typeof profileApi==="function"){

        const payload={
          display_name:name
        };

        if(mode!=="free" && draft.club_id){

          payload.club_id=draft.club_id;

        }

        if(mode==="vip" && draft.avatar){

          payload.avatar_data=draft.avatar;

        }else if(mode==="pro" && avatar){

          payload.avatar_data=avatar;

        }

        const result=await profileApi(
          "/api/profile/update",
          {
            method:"POST",
            body:JSON.stringify(payload)
          }
        );

        if(result?.profile){
          window.__zingoProfile=result.profile;
        }

      }

      if(mode==="vip" && draft.avatar){
        d.vipAvatar=draft.avatar;
        d.avatarType="image";
      }

      if(mode==="vip"){
        d.selectedFrame=draft.frame || "none";
      }

      saveData(d);

      closeEditor();

      renderIdentityEverywhere();

      if(typeof toast==="function"){
        toast("تم تحديث الملف الشخصي");
      }

    }catch(e){

      if(msg){
        msg.textContent=
          e.message ||
          "تعذر حفظ الملف الشخصي";
      }

    }

  }

  /* =========================================================
     DETAILS
     ========================================================= */

  function details(){

    document
      .getElementById("zingoV2IdentityDetails")
      ?.remove();

    const d=refreshData();
    const title=currentTitle(d);
    const level=getLevel(d.xp);

    const modal=document.createElement("div");

    modal.id="zingoV2IdentityDetails";

    modal.style.cssText=`
      position:fixed;
      inset:0;
      z-index:99998;
      background:rgba(0,0,0,.84);
      backdrop-filter:blur(12px);
      overflow:auto;
      padding:18px 12px 35px;
    `;

    modal.innerHTML=`

      <div style="max-width:560px;margin:auto">

        <section class="card card-pad">

          <div
            style="
              display:flex;
              justify-content:space-between;
              align-items:center;
            "
          >

            <div>
              <div class="eyebrow">هوية اللاعب</div>
              <h2 style="margin:5px 0">
                الإنجازات والألقاب
              </h2>
            </div>

            <button
              class="btn"
              onclick="document.getElementById('zingoV2IdentityDetails')?.remove()"
            >
              إغلاق
            </button>

          </div>

          <div
            style="
              display:flex;
              align-items:center;
              gap:12px;
              margin-top:15px;
            "
          >

            ${avatarHTML(d,true)}

            <div>

              <strong>${esc(
                profile().display_name ||
                telegramUser.first_name ||
                "اللاعب"
              )}</strong>

              <div style="font-size:10px;margin-top:4px">
                ${title.icon} ${esc(title.name)}
              </div>

              <div class="muted" style="font-size:9px;margin-top:3px">
                المستوى ${level.level}
                • ${d.xp} XP
                • التقييم ${d.rating}
              </div>

            </div>

          </div>

          <div style="margin-top:20px">

            <div class="eyebrow">الإنجازات</div>

            <div
              style="
                display:grid;
                grid-template-columns:repeat(2,1fr);
                gap:8px;
                margin-top:9px;
              "
            >

              ${
                ACHIEVEMENTS
                .filter(a=>!a.vip || MODE()==="vip")
                .map(a=>{

                  const unlocked=d.achievements.includes(a.id);

                  return `
                    <div
                      class="card card-pad"
                      style="
                        opacity:${unlocked ? 1 : .42};
                        position:relative;
                      "
                    >

                      <div style="font-size:24px">
                        ${a.icon}
                      </div>

                      <strong style="font-size:11px">
                        ${esc(a.name)}
                      </strong>

                      <div
                        class="muted"
                        style="font-size:9px;margin-top:3px"
                      >
                        ${esc(a.text)}
                      </div>

                      <div
                        style="
                          font-size:8px;
                          margin-top:5px;
                        "
                      >
                        ${unlocked ? "مفتوح" : "مغلق"}
                        • +${a.xp} XP
                      </div>

                    </div>
                  `;

                }).join("")
              }

            </div>

          </div>

          <div style="margin-top:20px">

            <div class="eyebrow">المهام</div>

            <div style="display:grid;gap:8px;margin-top:9px">

              ${
                MISSIONS
                .filter(m=>!m.vip || MODE()==="vip")
                .map(m=>{

                  const value=Math.min(
                    m.target,
                    missionValue(m,d)
                  );

                  const done=missionDone(m,d);

                  return `
                    <div class="card card-pad">

                      <div
                        style="
                          display:flex;
                          justify-content:space-between;
                          gap:10px;
                        "
                      >

                        <div>

                          <strong style="font-size:11px">
                            ${esc(m.name)}
                          </strong>

                          <div
                            class="muted"
                            style="font-size:9px;margin-top:3px"
                          >
                            ${esc(m.text)}
                          </div>

                        </div>

                        <strong>
                          ${done ? "✓" : `${value}/${m.target}`}
                        </strong>

                      </div>

                      <div
                        style="
                          height:4px;
                          margin-top:8px;
                          background:rgba(255,255,255,.08);
                          border-radius:10px;
                          overflow:hidden;
                        "
                      >

                        <div
                          style="
                            width:${Math.min(
                              100,
                              (value/m.target)*100
                            )}%;
                            height:100%;
                            background:currentColor;
                          "
                        ></div>

                      </div>

                      <div
                        class="muted"
                        style="font-size:8px;margin-top:5px"
                      >
                        المكافأة +${m.reward} XP
                      </div>

                    </div>
                  `;

                }).join("")
              }

            </div>

          </div>

          <div style="margin-top:20px">

            <div class="eyebrow">الألقاب</div>

            <div
              style="
                display:grid;
                grid-template-columns:repeat(2,1fr);
                gap:8px;
                margin-top:9px;
              "
            >

              ${
                TITLES
                .filter(t=>!t.vip || MODE()==="vip")
                .map(t=>{

                  const unlocked=titleUnlocked(t,d);
                  const selected=currentTitle(d).id===t.id;

                  return `
                    <button
                      type="button"
                      class="btn"
                      ${
                        unlocked
                        ? `onclick="window.zingoSelectTitleV2('${t.id}')"`
                        : ""
                      }
                      style="
                        text-align:right;
                        opacity:${unlocked ? 1 : .4};
                        outline:${selected ? "2px solid currentColor" : "none"};
                      "
                    >

                      <div style="font-size:20px">
                        ${t.icon}
                      </div>

                      <strong style="font-size:10px">
                        ${esc(t.name)}
                      </strong>

                      <div
                        style="
                          font-size:8px;
                          margin-top:3px;
                        "
                      >
                        ${esc(t.rarity)}
                      </div>

                    </button>
                  `;

                }).join("")
              }

            </div>

          </div>

        </section>

      </div>
    `;

    document.body.appendChild(modal);

  }

  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.zingoOpenProfileEditorV2=editor;

  window.zingoCloseProfileEditorV2=closeEditor;

  window.zingoSaveProfileV2=saveProfile;

  window.zingoOpenIdentityDetails=details;

  window.zingoSelectTitleV2=function(id){

    const d=refreshData();

    const t=TITLES.find(x=>x.id===id);

    if(!t || !titleUnlocked(t,d)) return;

    d.selectedTitle=id;

    saveData(d);

    details();

    renderIdentityEverywhere();

  };

  window.zingoProfileSystem={

    getData:()=>({...refreshData()}),

    getLevel:()=>getLevel(refreshData().xp),

    getTitle:()=>currentTitle(refreshData()),

    getFrame:()=>currentFrame(refreshData()),

    addXP:function(amount){

      const d=refreshData();

      d.xp=Math.max(
        0,
        d.xp+Math.max(0,Number(amount)||0)
      );

      refreshAchievements(d);

      renderIdentityEverywhere();

      return d.xp;

    },

    registerPrediction:function(correct=false,exact=false){

      const d=refreshData();

      d.predictions++;

      if(correct){

        d.correct++;
        d.streak++;

        if(d.streak>d.bestStreak){
          d.bestStreak=d.streak;
        }

      }else{

        d.streak=0;

      }

      if(exact){
        d.exact++;
      }

      /*
       * XP من الأداء.
       * لا نغيّر نقاط المسابقة نفسها.
       */

      d.xp += exact ? 25 : correct ? 10 : 2;

      refreshAchievements(d);

      renderIdentityEverywhere();

      return {...d};

    },

    setStats:function(stats={}){

      const d=refreshData();

      if(stats.predictions!=null)
        d.predictions=Math.max(
          0,
          Number(stats.predictions)||0
        );

      if(stats.correct!=null)
        d.correct=Math.max(
          0,
          Number(stats.correct)||0
        );

      if(stats.exact!=null)
        d.exact=Math.max(
          0,
          Number(stats.exact)||0
        );

      if(stats.streak!=null)
        d.streak=Math.max(
          0,
          Number(stats.streak)||0
        );

      if(stats.bestStreak!=null)
        d.bestStreak=Math.max(
          0,
          Number(stats.bestStreak)||0
        );

      if(stats.xp!=null)
        d.xp=Math.max(
          0,
          Number(stats.xp)||0
        );

      d.rating=calculateRating(d);

      refreshAchievements(d);

      renderIdentityEverywhere();

      return {...d};

    }

  };

  /* =========================================================
     RENDER BRIDGE
     ========================================================= */

  function renderIdentityEverywhere(){

    try{

      document
        .querySelectorAll("[data-zingo-profile-identity]")
        .forEach(el=>{
          el.innerHTML=identityHTML();
        });

    }catch(e){}

  }

  /*
   * إذا كان البروفايل الحالي يستخدم zingoProfileCard
   * نغلفه بدل حذف النسخة القديمة.
   */

  const originalProfileCard=
    window.zingoProfileCard;

  window.zingoProfileCard=function(){

    try{

      const base=
        typeof originalProfileCard==="function"
        ? originalProfileCard()
        : "";

      /*
       * نحافظ على محتوى البروفايل الحالي
       * ونضيف هوية V2 تحته.
       */

      return `
        ${base}
        <div data-zingo-profile-identity>
          ${identityHTML()}
        </div>
      `;

    }catch(e){

      console.error("ZINGO PROFILE V2:",e);

      return `
        <div data-zingo-profile-identity>
          ${identityHTML()}
        </div>
      `;

    }

  };

  /* =========================================================
     INITIALIZE
     ========================================================= */

  refreshData();

  window.addEventListener("zingo:profile-updated",()=>{
    refreshData();
    renderIdentityEverywhere();
  });

})();
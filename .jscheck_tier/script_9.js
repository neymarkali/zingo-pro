
(function(){

  if(window.__zingoProfileIdentityV3Loaded) return;
  window.__zingoProfileIdentityV3Loaded=true;

  const KEY="zingo_profile_identity_v3";

  const MODE=()=>{
    return String(
      window.__zingoMode ||
      window.__zingoState?.mode ||
      "free"
    ).toLowerCase();
  };

  const TIER={
    FREE:"free",
    PRO:"pro",
    VIP:"vip"
  };

  const cleanTier=()=>{
    const m=MODE();
    return m==="vip" ? "vip" : m==="pro" ? "pro" : "free";
  };

  const emptyData={
    name:"",
    xp:0,
    rating:0,
    points:0,
    predictions:0,
    correct:0,
    exact:0,
    streak:0,
    bestStreak:0,
    achievements:[],
    missions:{},
    unlockedTitles:[],
    selectedTitle:"",
    selectedFrame:"none",
    club_id:"",
    avatar:"",
    avatarType:"letter",
    vipAvatar:"",
    animatedAvatar:false,
    vipAvatarId:"",
    lastDaily:"",
    lastWeekly:"",
    createdAt:Date.now()
  };

  function read(){
    try{
      const raw=localStorage.getItem(KEY);
      if(raw){
        const d=JSON.parse(raw);
        return Object.assign({},emptyData,d||{});
      }
    }catch(e){}
    return Object.assign({},emptyData);
  }

  function save(d){
    try{
      localStorage.setItem(KEY,JSON.stringify(d));
    }catch(e){}
    return d;
  }

  function migrate(){
    let d=read();

    try{
      const old=localStorage.getItem("zingo_profile_identity_v2");
      if(old){
        const o=JSON.parse(old)||{};
        d=Object.assign({},d,{
          name:o.name || d.name || "",
          xp:Number(o.xp||d.xp||0),
          rating:Number(o.rating||d.rating||0),
          predictions:Number(o.predictions||d.predictions||0),
          correct:Number(o.correct||d.correct||0),
          exact:Number(o.exact||d.exact||0),
          streak:Number(o.streak||d.streak||0),
          bestStreak:Number(o.bestStreak||d.bestStreak||0),
          achievements:Array.isArray(o.achievements)?o.achievements:d.achievements,
          missions:o.missions||d.missions,
          unlockedTitles:Array.isArray(o.unlockedTitles)?o.unlockedTitles:d.unlockedTitles,
          selectedTitle:o.selectedTitle||d.selectedTitle||"",
          selectedFrame:o.selectedFrame||d.selectedFrame||"none",
          club_id:o.club_id||d.club_id||"",
          avatar:o.avatar||d.avatar||"",
          vipAvatar:o.vipAvatar||d.vipAvatar||"",
          avatarType:o.avatarType||d.avatarType||"letter"
        });
        save(d);
      }
    }catch(e){}

    return d;
  }

  const LEVELS=[
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
    {level:15,xp:12000,name:"العرش"},
    {level:16,xp:15000,name:"النخبة الملكية"},
    {level:17,xp:18500,name:"سيد العرش"},
    {level:18,xp:22500,name:"قمة النخبة"},
    {level:19,xp:27000,name:"الرتبة العليا"},
    {level:20,xp:32000,name:"صاحب التاج"}
  ];

  function getLevel(xp){
    let cur=LEVELS[0];
    for(const l of LEVELS){
      if(Number(xp||0)>=l.xp) cur=l;
    }
    return cur;
  }

  function nextLevel(xp){
    return LEVELS.find(x=>Number(xp||0)<x.xp)||null;
  }

  function progress(xp){
    const cur=getLevel(xp);
    const next=nextLevel(xp);
    if(!next) return 100;
    return Math.max(
      0,
      Math.min(
        100,
        ((Number(xp||0)-cur.xp)/(next.xp-cur.xp))*100
      )
    );
  }

  const TITLES=[
    {id:"starter",name:"متوقع ناشئ",badge:"🥉",tier:"pro",xp:50},
    {id:"analyst",name:"محلل",badge:"🥈",tier:"pro",xp:250},
    {id:"expert",name:"خبير التوقعات",badge:"🥇",tier:"pro",xp:700},
    {id:"reader",name:"قارئ المباراة",badge:"🔵",tier:"pro",xp:1000,rating:70},
    {id:"hunter",name:"صياد النتائج",badge:"🔥",tier:"pro",xp:1400,exact:3},
    {id:"sniper",name:"قناص التوقعات",badge:"🎯",tier:"pro",xp:2500,exact:10},
    {id:"master",name:"سيد التوقعات",badge:"🏆",tier:"pro",xp:4300,rating:85},
    {id:"king_results",name:"ملك النتائج",badge:"👑",tier:"vip",xp:7200,rating:90},
    {id:"match_sniper",name:"قناص المباريات",badge:"🎯",tier:"vip",xp:9200,exact:25},
    {id:"master_analysis",name:"سيد التحليل",badge:"♛",tier:"vip",xp:12000,rating:94},
    {id:"legend",name:"الأسطورة",badge:"👑",tier:"vip",xp:15000,rating:96},
    {id:"royal",name:"الملكي",badge:"♛",tier:"vip",xp:18500,rating:97},
    {id:"throne",name:"صاحب العرش",badge:"👑",tier:"vip",xp:22500,rating:98}
  ];

  const ACHIEVEMENTS=[
    {id:"first_correct",name:"أول توقع صحيح",xp:50,check:d=>d.correct>=1},
    {id:"correct_5",name:"5 توقعات صحيحة",xp:100,check:d=>d.correct>=5},
    {id:"correct_10",name:"10 توقعات صحيحة",xp:150,check:d=>d.correct>=10},
    {id:"correct_25",name:"25 توقعًا صحيحًا",xp:250,check:d=>d.correct>=25},
    {id:"correct_50",name:"50 توقعًا صحيحًا",xp:400,check:d=>d.correct>=50},
    {id:"correct_100",name:"100 توقع صحيح",xp:700,check:d=>d.correct>=100},
    {id:"streak_3",name:"سلسلة 3 صحيحة",xp:100,check:d=>d.bestStreak>=3},
    {id:"streak_5",name:"سلسلة 5 صحيحة",xp:200,check:d=>d.bestStreak>=5},
    {id:"streak_10",name:"سلسلة 10 صحيحة",xp:500,check:d=>d.bestStreak>=10},
    {id:"exact_1",name:"أول نتيجة دقيقة",xp:100,check:d=>d.exact>=1},
    {id:"exact_3",name:"3 نتائج دقيقة",xp:200,check:d=>d.exact>=3},
    {id:"exact_10",name:"10 نتائج دقيقة",xp:500,check:d=>d.exact>=10},
    {id:"exact_25",name:"25 نتيجة دقيقة",xp:1000,check:d=>d.exact>=25},
    {id:"rating_80",name:"تقييم 80",xp:600,check:d=>d.rating>=80},
    {id:"rating_90",name:"تقييم 90",xp:1200,check:d=>d.rating>=90},
    {id:"vip_95",name:"رتبة ملكية",xp:2000,check:d=>cleanTier()==="vip"&&d.rating>=95},
    {id:"vip_rare",name:"إنجاز ملكي نادر",xp:3000,check:d=>cleanTier()==="vip"&&d.xp>=12000&&d.exact>=25}
  ];

  const MISSIONS=[
    {id:"daily_correct_2",name:"مهمة اليوم: حقق توقعين صحيحين",period:"daily",goal:2,type:"correct",xp:50},
    {id:"daily_exact_1",name:"مهمة اليوم: حقق نتيجة دقيقة",period:"daily",goal:1,type:"exact",xp:75},
    {id:"weekly_matches_10",name:"مهمة الأسبوع: شارك في 10 مباريات",period:"weekly",goal:10,type:"predictions",xp:150},
    {id:"weekly_correct_10",name:"مهمة الأسبوع: 10 توقعات صحيحة",period:"weekly",goal:10,type:"correct",xp:250},
    {id:"advanced_exact_3",name:"مهمة متقدمة: 3 نتائج دقيقة",period:"advanced",goal:3,type:"exact",xp:300},
    {id:"vip_exact_10",name:"مهمة ملكية: 10 نتائج دقيقة",period:"vip",goal:10,type:"exact",xp:700,tier:"vip"}
  ];

  const FRAMES=[
    {id:"none",name:"بدون إطار",unlock:0,tier:"free"},
    {id:"bronze",name:"إطار برونزي",unlock:500,tier:"pro"},
    {id:"silver",name:"إطار فضي",unlock:1500,tier:"pro"},
    {id:"gold",name:"الإطار الذهبي",unlock:3500,tier:"pro"},
    {id:"elite",name:"إطار النخبة",unlock:7000,tier:"vip"},
    {id:"royal",name:"الإطار الملكي",unlock:12000,tier:"vip"},
    {id:"throne",name:"إطار العرش",unlock:20000,tier:"vip"}
  ];

  function rating(d){
    const p=Number(d.predictions||0);
    if(!p) return Number(d.rating||0);
    const accuracy=(Number(d.correct||0)/p)*100;
    const exactBonus=Math.min(15,(Number(d.exact||0)/Math.max(1,p))*100);
    const streakBonus=Math.min(10,Number(d.bestStreak||0));
    return Math.round(
      Math.max(
        0,
        Math.min(
          100,
          accuracy*.75 + exactBonus + streakBonus
        )
      )
    );
  }

  function allowed(feature,tier=cleanTier()){
    if(feature==="free") return true;
    if(feature==="pro") return tier==="pro"||tier==="vip";
    if(feature==="vip") return tier==="vip";
    return false;
  }

  function letter(name){
    const value=String(name||"Z");
    return Array.from(value.trim())[0]||"Z";
  }

  function club(id){
    try{
      if(typeof window.zingoClubById==="function"){
        return window.zingoClubById(id);
      }
      if(typeof window.zingoAllClubs==="function"){
        return (window.zingoAllClubs()||[]).find(x=>x.id===id);
      }
    }catch(e){}
    return null;
  }

  function currentAvatar(d){
    const tier=cleanTier();

    if(tier==="free"){
      return {
        type:"letter",
        value:letter(d.name)
      };
    }

    if(tier==="pro"){
      const c=club(d.club_id);
      if(c && c.logo){
        return {
          type:"image",
          value:c.logo
        };
      }
      return {
        type:"letter",
        value:letter(d.name)
      };
    }

    if(d.vipAvatar){
      return {
        type:"image",
        value:d.vipAvatar,
        animated:!!d.animatedAvatar
      };
    }

    const c=club(d.club_id);
    if(c && c.logo){
      return {
        type:"image",
        value:c.logo
      };
    }

    return {
      type:"letter",
      value:letter(d.name)
    };
  }

  function currentFrame(d){
    const tier=cleanTier();
    if(tier!=="vip") return "none";
    const f=FRAMES.find(x=>x.id===d.selectedFrame);
    if(!f || d.xp<f.unlock) return "none";
    return f.id;
  }

  function refresh(d){
    d.rating=rating(d);

    const unlocked=new Set(d.achievements||[]);

    for(const a of ACHIEVEMENTS){
      try{
        if(a.check(d)) unlocked.add(a.id);
      }catch(e){}
    }

    d.achievements=[...unlocked];

    const titles=TITLES
      .filter(t=>{
        if(t.tier==="vip" && cleanTier()!=="vip") return false;
        if(t.tier==="pro" && !allowed("pro")) return false;
        if(t.xp && d.xp<t.xp) return false;
        if(t.rating && d.rating<t.rating) return false;
        if(t.exact && d.exact<t.exact) return false;
        return true;
      })
      .map(t=>t.id);

    d.unlockedTitles=titles;

    if(d.selectedTitle && !titles.includes(d.selectedTitle)){
      d.selectedTitle="";
    }

    if(cleanTier()!=="vip"){
      d.selectedFrame="none";
      d.vipAvatar="";
      d.animatedAvatar=false;
    }

    if(cleanTier()==="free"){
      d.club_id="";
      d.selectedTitle="";
      d.selectedFrame="none";
      d.vipAvatar="";
      d.animatedAvatar=false;
    }

    return save(d);
  }

  function identityHTML(options={}){
    let d=refresh(migrate());
    const tier=cleanTier();
    const av=currentAvatar(d);
    const frame=currentFrame(d);
    const level=getLevel(d.xp);
    const title=TITLES.find(x=>x.id===d.selectedTitle);

    let frameClass="";
    if(frame==="bronze") frameClass="zingo-v3-frame-bronze";
    if(frame==="silver") frameClass="zingo-v3-frame-silver";
    if(frame==="gold") frameClass="zingo-v3-frame-gold";
    if(frame==="elite") frameClass="zingo-v3-frame-elite";
    if(frame==="royal") frameClass="zingo-v3-frame-royal";
    if(frame==="throne") frameClass="zingo-v3-frame-throne";

    const avatar=av.type==="image"
      ? `<img src="${String(av.value).replace(/"/g,"&quot;")}" alt="">`
      : `<span class="zingo-v3-letter">${String(av.value).replace(/[<>&"]/g,"")}</span>`;

    const titleHTML=
      tier!=="free" && title
      ? `<span class="zingo-v3-title">${title.badge} ${title.name}</span>`
      : "";

    const meta=tier==="free"
      ? `المستوى ${level.level} • ${d.points||0} نقطة`
      : `المستوى ${level.level} • ${d.xp} XP • التقييم ${d.rating}`;

    return `
      <div class="zingo-v3-identity" data-zingo-profile-identity-v3="${options.compact?"compact":"full"}">
        <div class="zingo-v3-avatar ${frameClass}">
          ${avatar}
          <span class="zingo-v3-level">${level.level}</span>
        </div>
        <div class="zingo-v3-info">
          <span class="zingo-v3-name">${String(d.name||"Zingo").replace(/[<>&"]/g,"")}</span>
          ${titleHTML}
          <span class="zingo-v3-meta">${meta}</span>
        </div>
      </div>
    `;
  }

  function addXP(amount){
    const d=refresh(migrate());

    if(cleanTier()==="free"){
      d.points=Math.max(
        0,
        Number(d.points||0)+Math.max(0,Number(amount)||0)
      );
    }else{
      d.xp=Math.max(
        0,
        Number(d.xp||0)+Math.max(0,Number(amount)||0)
      );
    }

    refresh(d);
    return d.xp;
  }

  function registerPrediction(correct=false,exact=false){
    const d=refresh(migrate());

    d.predictions++;
    d.points += correct ? 2 : 0;

    if(correct){
      d.correct++;
      d.streak++;
      d.bestStreak=Math.max(d.bestStreak,d.streak);
    }else{
      d.streak=0;
    }

    if(exact) d.exact++;

    if(cleanTier()==="free"){
      d.points += exact ? 3 : 0;
    }else{
      d.xp += exact ? 25 : correct ? 10 : 2;
    }

    refresh(d);
    return d;
  }

  function setStats(stats={}){
    const d=refresh(migrate());

    for(const k of [
      "predictions",
      "correct",
      "exact",
      "streak",
      "bestStreak",
      "points"
    ]){
      if(stats[k]!=null){
        d[k]=Math.max(0,Number(stats[k])||0);
      }
    }

    if(stats.xp!=null && cleanTier()!=="free"){
      d.xp=Math.max(0,Number(stats.xp)||0);
    }

    refresh(d);
    return d;
  }

  function missionValue(m,d){
    if(m.type==="correct") return Number(d.correct||0);
    if(m.type==="exact") return Number(d.exact||0);
    if(m.type==="predictions") return Number(d.predictions||0);
    return 0;
  }

  function missionDone(m,d){
    return missionValue(m,d)>=m.goal;
  }

  function availableMissions(d){
    const tier=cleanTier();

    return MISSIONS.filter(m=>{
      if(m.tier==="vip" && tier!=="vip") return false;
      if(m.tier==="pro" && !allowed("pro")) return false;
      return true;
    });
  }

  function profileDashboard(){
    const d=refresh(migrate());
    const tier=cleanTier();
    const level=getLevel(d.xp);
    const next=nextLevel(d.xp);
    const title=TITLES.find(x=>x.id===d.selectedTitle);
    const achievements=ACHIEVEMENTS.filter(a=>d.achievements.includes(a.id));
    const missions=availableMissions(d);

    const stats=tier==="free"
      ? `
        <div class="zingo-v3-grid">
          <div class="zingo-v3-stat"><b>${d.points||0}</b><span>النقاط</span></div>
          <div class="zingo-v3-stat"><b>${level.level}</b><span>المستوى</span></div>
        </div>
      `
      : `
        <div class="zingo-v3-grid">
          <div class="zingo-v3-stat"><b>${d.xp}</b><span>نقاط الخبرة</span></div>
          <div class="zingo-v3-stat"><b>${d.rating}</b><span>التقييم</span></div>
          <div class="zingo-v3-stat"><b>${d.correct}</b><span>صحيحة</span></div>
          <div class="zingo-v3-stat"><b>${d.exact}</b><span>نتائج دقيقة</span></div>
        </div>
      `;

    const levelBar=tier==="free"
      ? ""
      : `
        <div class="zingo-v3-panel">
          <div style="display:flex;justify-content:space-between;gap:8px">
            <b>المستوى ${level.level}</b>
            <span style="opacity:.7">${next?`${d.xp} / ${next.xp} نقطة خبرة`:"الحد الأعلى"}</span>
          </div>
          <div class="zingo-v3-progress">
            <i style="width:${progress(d.xp)}%"></i>
          </div>
        </div>
      `;

    const achievementsHTML=tier==="free"
      ? ""
      : `
        <div class="zingo-v3-panel">
          <b>الإنجازات</b>
          <div style="margin-top:10px;display:grid;gap:7px">
            ${
              achievements.length
              ? achievements.slice(-8).map(a=>`
                <div style="font-size:11px">🏅 ${a.name} <span style="opacity:.6">+${a.xp} نقطة خبرة</span></div>
              `).join("")
              : `<div style="font-size:11px;opacity:.6">لم تُفتح إنجازات بعد</div>`
            }
          </div>
        </div>
      `;

    const missionsHTML=tier==="free"
      ? ""
      : `
        <div class="zingo-v3-panel">
          <b>المهام</b>
          <div style="margin-top:10px;display:grid;gap:9px">
            ${missions.map(m=>{
              const value=missionValue(m,d);
              const done=missionDone(m,d);
              return `
                <div style="font-size:11px">
                  <div style="display:flex;justify-content:space-between;gap:8px">
                    <span>${done?"✅":"🎯"} ${m.name}</span>
                    <span>${Math.min(value,m.goal)}/${m.goal}</span>
                  </div>
                  <div class="zingo-v3-progress">
                    <i style="width:${Math.min(100,(value/m.goal)*100)}%"></i>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;

    const titleHTML=tier==="free"
      ? ""
      : `
        <div class="zingo-v3-panel">
          <b>الألقاب</b>
          <div style="margin-top:8px;font-size:12px">
            ${title ? `${title.badge} ${title.name}` : "اختر لقبًا بعد فتحه"}
          </div>
        </div>
      `;

    return `
      <div style="display:grid;gap:10px">
        <div class="zingo-v3-panel">
          ${identityHTML()}
        </div>
        ${stats}
        ${levelBar}
        ${titleHTML}
        ${achievementsHTML}
        ${missionsHTML}
      </div>
    `;
  }

  async function saveRemote(payload){
    try{
      if(typeof window.profileApi==="function"){
        return await window.profileApi(
          "/api/profile/update",
          {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(payload)
          }
        );
      }
    }catch(e){}
    return null;
  }

  function editor(){
    const d=refresh(migrate());
    const tier=cleanTier();

    if(!document.getElementById("zingoV3Editor")){
      document.body.insertAdjacentHTML("beforeend",`
        <div id="zingoV3Editor" class="zingo-v3-editor">
          <div class="zingo-v3-editor-box" dir="rtl">
            <div class="zingo-v3-editor-head">
              <b>هوية اللاعب</b>
              <button type="button" id="zingoV3Close">×</button>
            </div>

            <label>الاسم</label>
            <input id="zingoV3Name" class="zingo-v3-input" maxlength="30">

            <div id="zingoV3ProArea"></div>
            <div id="zingoV3VipArea"></div>

            <div class="zingo-v3-editor-actions">
              <button class="zingo-v3-cancel" id="zingoV3Cancel">إلغاء</button>
              <button class="zingo-v3-save" id="zingoV3Save">حفظ</button>
            </div>
          </div>
        </div>
      `);

      document.getElementById("zingoV3Close").onclick=closeEditor;
      document.getElementById("zingoV3Cancel").onclick=closeEditor;
      document.getElementById("zingoV3Save").onclick=saveEditor;
    }

    const root=document.getElementById("zingoV3Editor");
    root.style.display="flex";

    document.getElementById("zingoV3Name").value=d.name||"";

    const proArea=document.getElementById("zingoV3ProArea");
    const vipArea=document.getElementById("zingoV3VipArea");

    proArea.innerHTML="";
    vipArea.innerHTML="";

    if(tier!=="free"){
      const clubs=typeof window.zingoAllClubs==="function"
        ? (window.zingoAllClubs()||[])
        : [];

      proArea.innerHTML=`
        <div style="margin-top:8px">
          <b>صورة الملف الشخصي</b>
          <div style="font-size:10px;opacity:.6;margin:4px 0 9px">
            اختر شعارًا من مكتبة الأندية
          </div>
          <div class="zingo-v3-clubs">
            ${clubs.map(c=>`
              <button type="button"
                class="zingo-v3-club ${c.id===d.club_id?"active":""}"
                data-club="${String(c.id).replace(/"/g,"&quot;")}">
                <img src="${String(c.logo||"").replace(/"/g,"&quot;")}" alt="">
                <span>${String(c.name||"").replace(/[<>&"]/g,"")}</span>
              </button>
            `).join("")}
          </div>
        </div>

        <div style="margin-top:16px">
          <b>الألقاب المفتوحة</b>
          <div class="zingo-v3-grid" style="margin-top:8px">
            ${TITLES.filter(t=>t.tier==="pro"||tier==="vip")
              .filter(t=>d.unlockedTitles.includes(t.id))
              .map(t=>`
                <button type="button"
                  class="zingo-v3-stat"
                  data-title="${t.id}"
                  style="border:1px solid ${d.selectedTitle===t.id?"currentColor":"rgba(255,255,255,.08)"};color:#fff;text-align:right">
                  <b>${t.badge} ${t.name}</b>
                  <span>لقب مفتوح</span>
                </button>
              `).join("") || `<div style="font-size:11px;opacity:.6">لا توجد ألقاب مفتوحة بعد</div>`
            }
          </div>
        </div>
      `;

      proArea.querySelectorAll("[data-club]").forEach(btn=>{
        btn.onclick=()=>{
          proArea.querySelectorAll("[data-club]").forEach(x=>x.classList.remove("active"));
          btn.classList.add("active");
          root.dataset.club=btn.dataset.club;
        };
      });

      proArea.querySelectorAll("[data-title]").forEach(btn=>{
        btn.onclick=()=>{
          proArea.querySelectorAll("[data-title]").forEach(x=>{
            x.style.borderColor="rgba(255,255,255,.08)";
          });
          btn.style.borderColor="currentColor";
          root.dataset.title=btn.dataset.title;
        };
      });
    }

    if(tier==="vip"){
      vipArea.innerHTML=`
        <div style="margin-top:16px">
          <b>الصورة الشخصية الملكية</b>
          <div style="font-size:10px;opacity:.6;margin:4px 0 8px">
            يمكن استخدام صور ثابتة أو متحركة بصيغة GIF أو WebP إذا كان الجهاز يدعمها.
          </div>
          <input id="zingoV3AvatarFile" type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            class="zingo-v3-input">

          <div style="margin-top:12px">
            <b>الإطارات</b>
            <div class="zingo-v3-frames" style="margin-top:8px">
              ${FRAMES.filter(f=>f.tier==="vip"||f.id==="none")
                .map(f=>{
                  const unlocked=d.xp>=f.unlock;
                  return `
                    <button type="button"
                      class="zingo-v3-frame-btn ${d.selectedFrame===f.id?"active":""}"
                      data-frame="${f.id}"
                      ${unlocked?"":"disabled"}
                      style="opacity:${unlocked?1:.35}">
                      ${f.name}
                      <div style="font-size:9px;opacity:.6">
                        ${f.unlock?`${f.unlock} XP`:"متاح"}
                      </div>
                    </button>
                  `;
                }).join("")}
            </div>
          </div>
        </div>
      `;

      const file=document.getElementById("zingoV3AvatarFile");

      file.onchange=()=>{
        const f=file.files&&file.files[0];
        if(!f) return;

        if(f.size>4*1024*1024){
          alert("حجم الصورة يجب ألا يتجاوز 4 ميغابايت");
          file.value="";
          return;
        }

        const reader=new FileReader();

        reader.onload=()=>{
          root.dataset.avatar=String(reader.result||"");
          root.dataset.animated=/gif|webp/i.test(f.type);
        };

        reader.readAsDataURL(f);
      };

      vipArea.querySelectorAll("[data-frame]").forEach(btn=>{
        btn.onclick=()=>{
          if(btn.disabled) return;

          vipArea.querySelectorAll("[data-frame]").forEach(x=>x.classList.remove("active"));
          btn.classList.add("active");
          root.dataset.frame=btn.dataset.frame;
        };
      });
    }
  }

  function closeEditor(){
    const root=document.getElementById("zingoV3Editor");
    if(root) root.style.display="none";
  }

  async function saveEditor(){
    const root=document.getElementById("zingoV3Editor");
    if(!root) return;

    const tier=cleanTier();
    const d=refresh(migrate());

    const name=String(
      document.getElementById("zingoV3Name")?.value||""
    ).trim();

    if(!name){
      alert("اكتب الاسم أولًا");
      return;
    }

    d.name=name;

    if(tier==="free"){
      d.club_id="";
      d.vipAvatar="";
      d.animatedAvatar=false;
      d.selectedFrame="none";
      d.selectedTitle="";
      d.avatarType="letter";
    }

    if(tier==="pro"){
      d.club_id=root.dataset.club || d.club_id || "";
      d.selectedTitle=root.dataset.title || d.selectedTitle || "";
      d.selectedFrame="none";
      d.vipAvatar="";
      d.animatedAvatar=false;
      d.avatarType=d.club_id?"club":"letter";
    }

    if(tier==="vip"){
      d.club_id=root.dataset.club || d.club_id || "";
      d.selectedTitle=root.dataset.title || d.selectedTitle || "";
      d.selectedFrame=root.dataset.frame || d.selectedFrame || "none";

      if(root.dataset.avatar){
        d.vipAvatar=root.dataset.avatar;
        d.animatedAvatar=root.dataset.animated==="true";
        d.avatarType="image";
      }
    }

    refresh(d);
    save(d);

    try{
      const payload={
        display_name:d.name
      };

      if(tier!=="free" && d.club_id){
        payload.club_id=d.club_id;
      }

      if(tier==="pro"){
        const c=club(d.club_id);
        if(c?.logo) payload.avatar_data=c.logo;
      }

      if(tier==="vip" && d.vipAvatar){
        payload.avatar_data=d.vipAvatar;
      }

      await saveRemote(payload);
    }catch(e){}

    closeEditor();

    document
      .querySelectorAll("[data-zingo-profile-identity]")
      .forEach(el=>{
        try{
          el.innerHTML=identityHTML();
        }catch(e){}
      });

    document
      .querySelectorAll("[data-zingo-profile-identity-v3]")
      .forEach(el=>{
        try{
          el.outerHTML=identityHTML();
        }catch(e){}
      });
  }

  function injectIdentities(){
    try{
      document
        .querySelectorAll("[data-zingo-profile-identity]")
        .forEach(el=>{
          if(!el.querySelector("[data-zingo-profile-identity-v3]")){
            el.innerHTML=identityHTML({
              compact:el.dataset.zingoProfileCompact==="true"
            });
          }
        });
    }catch(e){}
  }

  window.zingoProfileIdentityV3={
    getData:()=>refresh(migrate()),
    getTier:cleanTier,
    allowed,
    getLevel:(xp)=>getLevel(xp),
    getNextLevel:(xp)=>nextLevel(xp),
    getProgress:(xp)=>progress(xp),
    getTitles:()=>TITLES.slice(),
    getAchievements:()=>ACHIEVEMENTS.slice(),
    getMissions:()=>MISSIONS.slice(),
    getFrames:()=>FRAMES.slice(),
    identityHTML,
    dashboard:profileDashboard,
    addXP,
    registerPrediction,
    setStats,
    refresh:()=>refresh(migrate())
  };

  window.zingoProfileSystem=window.zingoProfileIdentityV3;
/* =========================================================
   ZINGO PROFILE V3 — V2 COMPATIBILITY BRIDGE
   ========================================================= */

(function(){
  try{
    const v3 = window.zingoProfileIdentityV3;
    if(!v3) return;

    const oldApi = window.zingoProfileSystem || {};

    v3.getTitle = function(){
      try{
        const d = v3.getData();
        const titles = v3.getTitles ? v3.getTitles() : [];
        const id = d.selectedTitle;
        return titles.find(x=>x.id===id) || null;
      }catch(e){
        return null;
      }
    };

    v3.getFrame = function(){
      try{
        const d = v3.getData();
        const frames = v3.getFrames ? v3.getFrames() : [];
        const id = d.selectedFrame || "none";
        return frames.find(x=>x.id===id) || frames[0] || null;
      }catch(e){
        return null;
      }
    };

    v3.getAvatar = function(){
      try{
        return typeof window.zingoIdentityHTML==="function"
          ? window.zingoIdentityHTML()
          : "";
      }catch(e){
        return "";
      }
    };

    v3.legacy = oldApi;

    window.zingoProfileSystem = v3;
  }catch(e){
    console.warn("ZINGO PROFILE COMPAT:",e);
  }
})();


  window.zingoOpenProfileEditorV2=editor;
  window.zingoOpenProfileEditor=editor;

  window.zingoIdentityHTML=identityHTML;

  const oldSetMode=window.switchZingoMode;

  if(typeof oldSetMode==="function"){
    window.switchZingoMode=function(mode){
      const result=oldSetMode.apply(this,arguments);
      setTimeout(()=>{
        refresh(migrate());
        injectIdentities();
      },0);
      return result;
    };
  }

  setTimeout(()=>{
    refresh(migrate());
    injectIdentities();
  },0);

  window.addEventListener("zingo:profile:update",()=>{
    refresh(migrate());
    injectIdentities();
  });

})();

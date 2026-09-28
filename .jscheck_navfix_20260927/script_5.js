
/* ZINGO PLAYER IDENTITY UI V1 */

(function(){

const CLUBS = [

  {
    league:"Premier League",
    clubs:[
      ["arsenal","Arsenal","https://images.fotmob.com/image_resources/logo/teamlogo/9825.png"],
      ["chelsea","Chelsea","https://images.fotmob.com/image_resources/logo/teamlogo/8455.png"],
      ["liverpool","Liverpool","https://images.fotmob.com/image_resources/logo/teamlogo/8650.png"],
      ["mancity","Manchester City","https://images.fotmob.com/image_resources/logo/teamlogo/8456.png"],
      ["manutd","Manchester United","https://images.fotmob.com/image_resources/logo/teamlogo/10260.png"],
      ["tottenham","Tottenham","https://images.fotmob.com/image_resources/logo/teamlogo/8586.png"]
    ]
  },

  {
    league:"La Liga",
    clubs:[
      ["realmadrid","Real Madrid","https://images.fotmob.com/image_resources/logo/teamlogo/8633.png"],
      ["barcelona","Barcelona","https://images.fotmob.com/image_resources/logo/teamlogo/8634.png"],
      ["atletico","Atlético Madrid","https://images.fotmob.com/image_resources/logo/teamlogo/8636.png"],
      ["sevilla","Sevilla","https://images.fotmob.com/image_resources/logo/teamlogo/8661.png"],
      ["valencia","Valencia","https://images.fotmob.com/image_resources/logo/teamlogo/8678.png"],
      ["bilbao","Athletic Club","https://images.fotmob.com/image_resources/logo/teamlogo/8315.png"]
    ]
  },

  {
    league:"Serie A",
    clubs:[
      ["inter","Inter","https://images.fotmob.com/image_resources/logo/teamlogo/8636.png"],
      ["milan","AC Milan","https://images.fotmob.com/image_resources/logo/teamlogo/8564.png"],
      ["juventus","Juventus","https://images.fotmob.com/image_resources/logo/teamlogo/9882.png"],
      ["napoli","Napoli","https://images.fotmob.com/image_resources/logo/teamlogo/9875.png"],
      ["roma","Roma","https://images.fotmob.com/image_resources/logo/teamlogo/8686.png"],
      ["lazio","Lazio","https://images.fotmob.com/image_resources/logo/teamlogo/8543.png"]
    ]
  },

  {
    league:"Bundesliga",
    clubs:[
      ["bayern","Bayern Munich","https://images.fotmob.com/image_resources/logo/teamlogo/9823.png"],
      ["dortmund","Borussia Dortmund","https://images.fotmob.com/image_resources/logo/teamlogo/9789.png"],
      ["leverkusen","Bayer Leverkusen","https://images.fotmob.com/image_resources/logo/teamlogo/8178.png"],
      ["leipzig","RB Leipzig","https://images.fotmob.com/image_resources/logo/teamlogo/178475.png"],
      ["frankfurt","Eintracht Frankfurt","https://images.fotmob.com/image_resources/logo/teamlogo/9810.png"],
      ["wolfsburg","Wolfsburg","https://images.fotmob.com/image_resources/logo/teamlogo/9831.png"]
    ]
  },

  {
    league:"Ligue 1",
    clubs:[
      ["psg","Paris Saint-Germain","https://images.fotmob.com/image_resources/logo/teamlogo/9847.png"],
      ["marseille","Marseille","https://images.fotmob.com/image_resources/logo/teamlogo/8592.png"],
      ["lyon","Lyon","https://images.fotmob.com/image_resources/logo/teamlogo/9746.png"],
      ["monaco","Monaco","https://images.fotmob.com/image_resources/logo/teamlogo/9829.png"],
      ["lille","Lille","https://images.fotmob.com/image_resources/logo/teamlogo/8639.png"],
      ["nice","Nice","https://images.fotmob.com/image_resources/logo/teamlogo/9830.png"]
    ]
  }

];

function profileApi(path,options={}){
  if(typeof api === "function"){
    return api(path,options);
  }

  return fetch(path,{
    ...options,
    headers:{
      "Content-Type":"application/json",
      ...(typeof zingoAuthHeaders==="function" ? zingoAuthHeaders() : {}),
      ...(options.headers || {})
    }
  }).then(async r=>{
    const data=await r.json().catch(()=>({}));
    if(!r.ok || data.ok===false){
      throw new Error(data.error || "Request failed");
    }
    return data;
  });
}


window.profileApi=profileApi;
function allClubs(){
  return CLUBS.flatMap(x=>x.clubs);
}

function clubById(id){
  return allClubs().find(x=>x[0]===id) || null;
}

function getProfile(){
  return window.__zingoProfile || {};
}

async function loadZingoProfile(){
  try{
    const result=await profileApi("/api/profile");
    window.__zingoProfile=result.profile || {};
    return window.__zingoProfile;
  }catch(e){
    console.warn("profile:",e.message);
    return {};
  }
}

window.zingoClubById=clubById;
window.zingoAllClubs=allClubs;
window.__zingoLoadData=loadZingoProfile;

function profileAvatar(profile){
  const p=profile || {};
  const club=clubById(p.club_id);

  if(p.avatar_data){
    return p.avatar_data;
  }

  if(club){
    return club[2];
  }

  return "";
}

window.zingoProfileCard=profileCard;

function profileCard(){
  const zState=window.__zingoState || {};

  const p=
    typeof getProfile==="function"
      ? getProfile()
      : (window.__zingoProfile || {});

  const tgUser=
    window.Telegram?.WebApp?.initDataUnsafe?.user
    || {};

  const u=
    zState.user
    || tgUser
    || {};

  const escProfileCard=(v)=>{
    return String(v ?? "").replace(/[&<>"']/g,m=>({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    }[m]));
  };

  const avatar=
    typeof profileAvatar==="function"
      ? profileAvatar(p)
      : "";

  const vip=
    String(
      window.__zingoMode
      || zState.mode
      || "pro"
    ).toLowerCase()==="vip";

  const club=
    p.club_id &&
    typeof window.zingoClubById==="function"
      ? window.zingoClubById(p.club_id)
      : null;

  return `
    <div class="card card-pad">

      <div class="zingo-avatar-wrap">

        ${
          avatar
            ? `<img
                class="zingo-avatar ${vip ? "zingo-vip-crest" : ""}"
                src="${escProfileCard(avatar)}"
                alt=""
              >`
            : `<div
                class="zingo-avatar ${vip ? "zingo-vip-crest" : ""}"
                style="display:grid;place-items:center;font-size:38px"
              >
                ◇
              </div>`
        }

      </div>

      <div style="text-align:center">

        <div class="eyebrow">
          ${vip ? "BLACK DIAMOND PLAYER" : "PLAYER IDENTITY"}
        </div>

        <h2 style="margin-top:8px">
          ${escProfileCard(
            p.display_name
            || u.first_name
            || "Player"
          )}
        </h2>

        ${
          club
            ? `<div class="muted">${escProfileCard(club[1])}</div>`
            : ""
        }

      </div>

      <div style="margin-top:16px">

        <button
          class="btn primary"
          type="button"
          onclick="window.zingoOpenProfileEditorV2()"
        >
          تعديل الملف الشخصي
        </button>

      </div>

    </div>
  `;
}

window.zingoOpenProfileEditor=async function(){

  alert("1️⃣ الزر شغال");

  try{
    alert("2️⃣ قبل تحميل البروفايل");

    await loadZingoProfile();

    alert("3️⃣ تم تحميل البروفايل");

    const p=getProfile();
  const zState=window.__zingoState || {};
  const currentMode=String(zState.mode || "pro").toLowerCase();

  const app=document.getElementById("app");
  if(!app) return;

  const avatar=profileAvatar(p);
  const vip=currentMode==="vip";

  app.innerHTML=shell(`
    <div class="page">

      <div class="page-head">
        <div>
          <div class="eyebrow">هوية اللاعب</div>
          <h1>تعديل الملف الشخصي</h1>
        </div>
      </div>

      <section class="card card-pad zingo-profile-editor">

        <div class="zingo-avatar-wrap">
          ${
            avatar
            ? `<img
                id="zingoAvatarPreview"
                class="zingo-avatar ${vip ? "zingo-vip-crest" : ""}"
                src="${esc(avatar)}"
                alt=""
              >`
            : `<div
                id="zingoAvatarPreview"
                class="zingo-avatar ${vip ? "zingo-vip-crest" : ""}"
                style="display:grid;place-items:center;font-size:38px"
              >
                ◇
              </div>`
          }
        </div>

        <label class="btn">
          تغيير الصورة
          <input
            id="zingoAvatarInput"
            type="file"
            accept="image/*"
            hidden
          >
        </label>

        <label>
          <div class="eyebrow" style="margin-bottom:7px">
            اسم اللاعب
          </div>

          <input
            id="zingoDisplayName"
            class="zingo-profile-input"
            maxlength="24"
            value="${esc(p.display_name || "")}"
            placeholder="اكتب اسمك"
            autocomplete="off"
          >

          <div class="muted" style="margin-top:6px;font-size:10px">
            الاسم يجب أن يكون فريداً بين اللاعبين.
          </div>
        </label>

        <div>

          <div class="eyebrow">
            النادي المفضل
          </div>

          ${
            CLUBS.map(league=>`
              <div class="zingo-league-title">
                ${esc(league.league)}
              </div>

              <div class="zingo-club-grid">
                ${
                  league.clubs.map(c=>`
                    <button
                      type="button"
                      class="zingo-club ${p.club_id===c[0] ? "active" : ""}"
                      data-club="${esc(c[0])}"
                    >
                      <img
                        src="${esc(c[2])}"
                        alt=""
                      >
                      <span>${esc(c[1])}</span>
                    </button>
                  `).join("")
                }
              </div>
            `).join("")
          }

        </div>

        <div>

          <div class="eyebrow">
            لغة الواجهة
          </div>

          <div style="display:flex;gap:8px;margin-top:8px">

            <button
              id="zingoProfileLangAR"
              class="btn"
              type="button"
              onclick="window.zingoSelectProfileLanguage('ar')"
            >
              العربية
            </button>

            <button
              id="zingoProfileLangEN"
              class="btn"
              type="button"
              onclick="window.zingoSelectProfileLanguage('en')"
            >
              EN
            </button>

          </div>

        </div>

        <div style="display:flex;gap:8px">

          <button
            class="btn primary"
            type="button"
            onclick="window.zingoSaveProfile()"
          >
            حفظ
          </button>

          <button
            class="btn"
            type="button"
            onclick="window.Zingo?.go ? window.Zingo.go('profile') : render()"
          >
            إلغاء
          </button>

        </div>

        <div
          id="zingoProfileMessage"
          class="muted"
        ></div>

      </section>
    </div>
  `);

  let selectedClub=p.club_id || "";

  document.querySelectorAll("[data-club]").forEach(btn=>{

    btn.addEventListener("click",()=>{

      selectedClub=btn.dataset.club;

      document
        .querySelectorAll("[data-club]")
        .forEach(x=>{
          x.classList.toggle(
            "active",
            x.dataset.club===selectedClub
          );
        });

    });

  });

  document
    .getElementById("zingoAvatarInput")
    ?.addEventListener("change",async e=>{

      const file=e.target.files?.[0];
      if(!file) return;

      try{

        const data=await new Promise((resolve,reject)=>{

          const img=new Image();
          const reader=new FileReader();

          reader.onload=()=>{

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
                reject(new Error("Canvas unavailable"));
                return;
              }

              ctx.drawImage(
                img,
                0,
                0,
                w,
                h
              );

              resolve(
                canvas.toDataURL(
                  "image/jpeg",
                  .78
                )
              );

            };

            img.onerror=reject;
            img.src=reader.result;

          };

          reader.onerror=reject;
          reader.readAsDataURL(file);

        });

        window.__zingoProfileDraftAvatar=data;

        const preview=document.getElementById(
          "zingoAvatarPreview"
        );

        if(preview){

          if(preview.tagName==="IMG"){

            preview.src=data;

          }else{

            preview.outerHTML=`
              <img
                id="zingoAvatarPreview"
                class="zingo-avatar ${
                  String(
                    (window.__zingoState || {}).mode || "pro"
                  ).toLowerCase()==="vip"
                    ? "zingo-vip-crest"
                    : ""
                }"
                src="${esc(data)}"
                alt=""
              >
            `;

          }

        }

      }catch(err){

        console.error(
          "ZINGO AVATAR ERROR:",
          err
        );

        alert("تعذر قراءة الصورة");

      }

    });

  window.__zingoProfileDraftClub=selectedClub;

  window.__zingoProfileDraftLanguage=
    localStorage.getItem("zingo_language") || "ar";

  window.zingoSelectProfileLanguage=function(lang){

    lang=lang==="en" ? "en" : "ar";

    window.__zingoProfileDraftLanguage=lang;

    const ar=document.getElementById(
      "zingoProfileLangAR"
    );

    const en=document.getElementById(
      "zingoProfileLangEN"
    );

    if(ar){
      ar.classList.toggle(
        "primary",
        lang==="ar"
      );
    }

    if(en){
      en.classList.toggle(
        "primary",
        lang==="en"
      );
    }

  };

  window.zingoSelectProfileLanguage(
    window.__zingoProfileDraftLanguage
  );




}catch(e){
  console.error("ZINGO PROFILE EDITOR ERROR:",e);
  alert(e?.message || "تعذر فتح محرر الملف الشخصي");
  }
};

window.zingoSaveProfile=async function(){

  const input=document.getElementById(
    "zingoDisplayName"
  );

  const msg=document.getElementById(
    "zingoProfileMessage"
  );

  const name=(input?.value || "").trim();

  const avatar=
    window.__zingoProfileDraftAvatar
    || getProfile().avatar_data
    || "";

  const club=
    document.querySelector(
      "[data-club].active"
    )?.dataset.club
    || getProfile().club_id
    || "";

  if(!name){

    if(msg){
      msg.textContent=
        "اكتب اسم اللاعب أولاً";
    }

    return;
  }

  try{

    if(msg){
      msg.textContent=
        "جارٍ الحفظ...";
    }

    const result=await profileApi(
      "/api/profile/update",
      {
        method:"POST",

        body:JSON.stringify({
          display_name:name,
          avatar_data:avatar,
          club_id:club
        })
      }
    );

    window.__zingoProfile=
      result.profile || {};

    const selectedLanguage=
      window.__zingoProfileDraftLanguage==="en"
        ? "en"
        : "ar";

    localStorage.setItem(
      "zingo_language",
      selectedLanguage
    );

    window.__zingoProfileDraftAvatar="";
    window.__zingoProfileDraftClub="";
    window.__zingoProfileDraftLanguage="";

    if(
      window.zingoI18n &&
      typeof window.zingoI18n.setLanguage==="function"
    ){

      window.zingoI18n.setLanguage(
        selectedLanguage
      );

    }

    if(typeof toast==="function"){

      toast(
        "تم تحديث الملف الشخصي"
      );

    }

    if(
      window.Zingo &&
      typeof window.Zingo.go==="function"
    ){

      window.Zingo.go("profile");

    }else if(typeof render==="function"){

      render();

    }

  }catch(e){

    console.error(
      "ZINGO الملف الشخصي SAVE ERROR:",
      e
    );

    if(msg){

      msg.textContent=
        e.message ||
        "تعذر حفظ الملف الشخصي";

    }

  }

};


window.zingoSettings=function(){

  const app=document.getElementById("app");
  if(!app) return;

  app.innerHTML=`
    <div class="page">

      <div class="page-head">
        <div>
          <div class="eyebrow">SYSTEM</div>
          <h1>الإعدادات</h1>
        </div>
      </div>

      <section class="card card-pad zingo-settings-card">
<div class="zingo-setting-row">
          <div>
            <strong>الملف الشخصي</strong>
            <div class="muted">الاسم، الصورة، والنادي</div>
          </div>

          <button
            class="btn"
            onclick="window.zingoOpenProfileEditorV2()"
          >
            تعديل
          </button>
        </div>

        <div class="zingo-setting-row">
          <div>
            <strong>الملكية</strong>
            <div class="muted">
              ${window.__zingoSubscription?.vip?.active ? "Black Diamond Access" : "VIP Access"}
            </div>
          </div>

          <button
            class="btn"
            onclick="window.switchZingoMode ? window.switchZingoMode('vip') : (state.mode='vip',state.page='home',render())"
          >
            VIP
          </button>
        </div>

      </section>
    </div>
  `;
};



})();

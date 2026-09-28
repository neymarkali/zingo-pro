
(function(){
  "use strict";

  const Z = window.ZingoUnified = window.ZingoUnified || {};

  function E(id){
    return document.getElementById(id);
  }

  function cleanTier(tier){
    const t=String(tier||"").toLowerCase();
    return t==="vip" ? "vip" : t==="pro" ? "pro" : "free";
  }

  function uid(){
    try{
      return String(window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "");
    }catch(e){
      return "";
    }
  }

  function syncState(tier){
    tier=cleanTier(tier);
    window.__zingoMode=tier;
    window.__zingoState=window.__zingoState || {};
    window.__zingoState.mode=tier;
    window.__zingoState.tier=tier;
    try{
      window.dispatchEvent(new CustomEvent("zingo:mode-changed",{
        detail:{mode:tier,tier:tier}
      }));
    }catch(e){}
  }

  function setTierBar(open){
    const root=E("zingoUnifiedExperience");
    if(root){
      root.classList.toggle("zingo-tier-menu-open",!!open);
    }
  }

  async function getSubscription(){
    const id=uid();

    if(!id){
      return {
        ok:false,
        pro:{active:false},
        vip:{active:false}
      };
    }

    try{
      const apiUrl = window.API?.subscription || "/api/subscription";
      const join = apiUrl.indexOf("?") === -1 ? "?" : "&";
      const r = await fetch(
        apiUrl + join + "telegram_id=" + encodeURIComponent(id),
        {
          cache:"no-store",
          credentials:"include",
          headers:{"Accept":"application/json"}
        }
      );

      const d=await r.json().catch(()=>({}));

      return {
        ok:r.ok && d?.ok !== false,
        pro:d?.pro || {active:false},
        vip:d?.vip || {active:false}
      };
    }catch(e){
      console.warn("Zingo subscription:",e);
      return {
        ok:false,
        pro:{active:false},
        vip:{active:false}
      };
    }
  }

  function clearWorlds(){
    E("zingoFreeWorld")?.classList.add("hidden");
    E("zingoProWorld")?.classList.add("hidden");
    E("zingoVipWorld")?.classList.add("hidden");

    document
      .querySelectorAll(".zingo-tier-btn")
      .forEach(x=>x.classList.remove("active"));
  }

  function showWorld(tier){
    tier=cleanTier(tier);
    clearWorlds();
    syncState(tier);

    if(tier==="free"){
      E("zingoFreeWorld")?.classList.remove("hidden");
      E("zingoTierFree")?.classList.add("active");
      setTierBar(false);
      return;
    }

    if(tier==="pro"){
      E("zingoProWorld")?.classList.remove("hidden");
      E("zingoTierPro")?.classList.add("active");
      setTierBar(true);
      return;
    }

    E("zingoVipWorld")?.classList.remove("hidden");
    E("zingoTierVip")?.classList.add("active");
    setTierBar(true);
  }

  async function select(tier){
    tier=cleanTier(tier);

    /*
     * All tiers are rendered inside the same document.
     * No relative navigation is used, so Cloudflare SPA fallback,
     * Telegram caching, or a missing secondary asset cannot send PRO back to FREE.
     */
    showWorld(tier);

    return tier;
  }

  function updateStates(pro,vip){
    const proState=E("zingoProTierState");
    const vipState=E("zingoVipTierState");

    if(proState) proState.textContent=pro ? "مفعّل" : "الاشتراك مطلوب";
    if(vipState) vipState.textContent=vip ? "مفعّل" : "الاشتراك مطلوب";
  }

  async function openPackages(){
    try{
      if(typeof window.Zingo?.go==="function"){
        return window.Zingo.go("packages");
      }
    }catch(e){}

    try{
      if(typeof window.zingoSettings==="function"){
        return window.zingoSettings();
      }
    }catch(e){}

    if(typeof window.toast==="function"){
      window.toast("افتح الباقات لتفعيل الاشتراك");
    }
  }

  async function boot(){
    try{
      const tg=window.Telegram?.WebApp;
      if(tg){
        try{tg.ready();}catch(e){}
        try{tg.expand();}catch(e){}
      }
    }catch(e){}

    const requested=cleanTier(
      new URLSearchParams(location.search).get("tier") || "free"
    );

    await select(requested);

    getSubscription().then(function(sub){
      updateStates(
        !!sub?.pro?.active,
        !!sub?.vip?.active
      );

      window.__zingoSubscription=sub;
    }).catch(function(e){
      console.warn("Zingo background subscription:",e);
    });
  }

  Z.select=select;
  Z.subscription=getSubscription;
  Z.openPackages=openPackages;

  /* Legacy compatibility used by profile/settings buttons in this file. */
  window.switchZingoMode=function(mode){
    return Z.select(cleanTier(mode));
  };

  window.Zingo=window.Zingo || {};
  if(typeof window.Zingo.go!=="function"){
    window.Zingo.go=function(page){
      const p=String(page||"").toLowerCase();
      const current=cleanTier(window.__zingoMode || window.__zingoState?.mode || "free");

      if(p==="home" || p==="competitions"){
        return Z.select(current);
      }

      if(p==="profile"){
        if(typeof window.zingoOpenProfileEditorV2==="function"){
          return window.zingoOpenProfileEditorV2();
        }
        return;
      }

      if(p==="packages"){
        if(typeof window.zingoSettings==="function"){
          return window.zingoSettings();
        }
        if(typeof window.toast==="function"){
          window.toast("الباقات غير متاحة حاليًا");
        }
        return;
      }

      if(p==="analysis" || p==="ranking"){
        if(typeof window.toast==="function"){
          window.toast("سيتم تفعيل هذا القسم مع ربط البيانات");
        }
      }
    };
  }

  window.zingoBootTier=boot;

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",function(){
      setTimeout(function(){ boot().catch(e=>console.warn("Zingo boot:",e)); },0);
    },{once:true});
  }else{
    setTimeout(function(){ boot().catch(e=>console.warn("Zingo boot:",e)); },0);
  }

})();

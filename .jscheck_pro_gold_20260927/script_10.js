
(function(){
  let refreshQueued=false;

  function refresh(){
    try{
      if(typeof window.zingoIdentityHTML!=="function") return;

      document
        .querySelectorAll("[data-zingo-profile-identity]")
        .forEach(function(el){
          const next=window.zingoIdentityHTML({compact:true});
          if(el.innerHTML!==next){
            el.innerHTML=next;
          }
        });
    }catch(e){}
  }

  function scheduleRefresh(){
    if(refreshQueued) return;
    refreshQueued=true;
    setTimeout(function(){
      refreshQueued=false;
      refresh();
    },0);
  }

  window.zingoRefreshProfileIdentity=refresh;

  const oldRefresh =
    window.zingoProfileIdentityV3 &&
    window.zingoProfileIdentityV3.refresh;

  if(window.zingoProfileIdentityV3){
    const api=window.zingoProfileIdentityV3;

    api.refresh=function(){
      let result;
      try{
        if(typeof oldRefresh==="function"){
          result=oldRefresh.apply(this,arguments);
        }
      }catch(e){}
      scheduleRefresh();
      return result;
    };
  }

  function boot(){
    refresh();
    setTimeout(refresh,250);
    setTimeout(refresh,1000);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  }else{
    boot();
  }

  window.addEventListener("zingo:profile-updated",scheduleRefresh);
  window.addEventListener("zingo:mode-changed",function(){
    setTimeout(refresh,50);
  });
})();

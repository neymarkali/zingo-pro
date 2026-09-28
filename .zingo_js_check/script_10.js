
(function(){
  function refresh(){
    try{
      if(typeof window.zingoIdentityHTML!=="function") return;

      document
        .querySelectorAll("[data-zingo-profile-identity]")
        .forEach(function(el){
          el.innerHTML = window.zingoIdentityHTML({
            compact:true
          });
        });
    }catch(e){}
  }

  window.zingoRefreshProfileIdentity = refresh;

  const oldRefresh =
    window.zingoProfileIdentityV3 &&
    window.zingoProfileIdentityV3.refresh;

  if(window.zingoProfileIdentityV3){
    const api = window.zingoProfileIdentityV3;

    api.refresh = function(){
      let result;

      try{
        if(typeof oldRefresh==="function"){
          result = oldRefresh.apply(this,arguments);
        }
      }catch(e){}

      setTimeout(refresh,0);
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

  const observer = new MutationObserver(function(){
    refresh();
  });

  if(document.body){
    observer.observe(document.body,{
      childList:true,
      subtree:true
    });
  }

  window.addEventListener("zingo:profile-updated",refresh);
  window.addEventListener("zingo:mode-changed",function(){
    setTimeout(refresh,50);
  });
})();

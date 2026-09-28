
(function(){
  function bootSafety(){
    try{
      /* Never force-hide active VIP cinematic scenes.
         Only clear accidental inline blocking states. */
      var ids=[
        "zingoLoading",
        "zingoLoader",
        "telegramLoader",
        "appLoader",
        "loadingScreen"
      ];

      ids.forEach(function(id){
        var el=document.getElementById(id);
        if(el && !el.classList.contains("active")){
          var cs=getComputedStyle(el);
          if(cs.position==="fixed" && cs.zIndex && Number(cs.zIndex)>=9998){
            el.style.display="none";
            el.style.pointerEvents="none";
          }
        }
      });

      /* If the document itself was accidentally hidden, restore it. */
      if(document.documentElement){
        var htmlStyle=getComputedStyle(document.documentElement);
        if(htmlStyle.visibility==="hidden"){
          document.documentElement.style.visibility="visible";
        }
      }

      if(document.body){
        var bodyStyle=getComputedStyle(document.body);
        if(bodyStyle.visibility==="hidden"){
          document.body.style.visibility="visible";
        }
      }

      /* Telegram must always receive ready after the UI exists. */
      var tg=window.Telegram&&window.Telegram.WebApp;
      if(tg){
        try{tg.ready();}catch(e){}
        try{tg.expand();}catch(e){}
      }
    }catch(e){}
  }

  bootSafety();

  try{
    if(document.readyState==="loading"){
      document.addEventListener("DOMContentLoaded",bootSafety,{once:true});
    }else{
      bootSafety();
    }
  }catch(e){}

  try{
    window.addEventListener("load",bootSafety,{once:true});
  }catch(e){}
})();

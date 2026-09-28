(function(){
  try{
    const tg = window.Telegram && window.Telegram.WebApp;
    if(tg){
      try{ tg.ready(); }catch(e){}
      try{ tg.expand(); }catch(e){}
    }
  }catch(e){}
})();
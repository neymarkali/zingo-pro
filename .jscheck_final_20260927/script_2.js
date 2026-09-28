
(function(){
  function ready(){
    try{
      var tg=window.Telegram&&window.Telegram.WebApp;
      if(!tg) return false;
      try{tg.ready();}catch(e){}
      try{tg.expand();}catch(e){}
      return true;
    }catch(e){
      return false;
    }
  }

  ready();

  try{
    document.addEventListener("DOMContentLoaded",ready,{once:true});
  }catch(e){}

  try{
    window.addEventListener("load",ready,{once:true});
  }catch(e){}

  var n=0;
  var t=setInterval(function(){
    n++;
    if(ready() || n>=120) clearInterval(t);
  },100);
})();

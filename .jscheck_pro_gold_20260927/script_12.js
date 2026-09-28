
(function(){
  if(typeof window.toast!=="function"){
    window.toast=function(message){
      const el=document.getElementById("toast");
      if(!el) return;
      el.textContent=String(message||"");
      el.classList.add("show");
      clearTimeout(window.__zingoToastTimer);
      window.__zingoToastTimer=setTimeout(function(){
        el.classList.remove("show");
      },2200);
    };
  }

  if(typeof window.finishAscension!=="function"){
    window.finishAscension=function(){
      const el=document.getElementById("ascension");
      if(el) el.classList.remove("show");
    };
  }
})();

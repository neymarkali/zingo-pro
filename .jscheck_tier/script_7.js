

(function(){

const Z = window.ZingoUnified = window.ZingoUnified || {};

function E(id){
return document.getElementById(id);
}

function uid(){

try{
return window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "";
}catch(e){
return "";
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

const api =
window.API?.subscription ||
"/api/subscription";

const r=await fetch(
api+"?telegram_id="+encodeURIComponent(id),
{
cache:"no-store",
credentials:"include"
}
);

const d=await r.json();

return {
ok:!!d?.ok,
pro:d?.pro||{active:false},
vip:d?.vip||{active:false}
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

function updateStates(pro,vip){

if(E("zingoProTierState"))
E("zingoProTierState").textContent =
pro ? "مفعّل" : "الاشتراك مطلوب";

if(E("zingoVipTierState"))
E("zingoVipTierState").textContent =
vip ? "مفعّل" : "الاشتراك مطلوب";

}

async function select(tier){
  clearWorlds();

  if(tier==="free"){
    E("zingoFreeWorld")?.classList.remove("hidden");
    E("zingoTierFree")?.classList.add("active");
    return;
  }

  if(tier==="pro"){
    E("zingoProWorld")?.classList.remove("hidden");
    E("zingoTierPro")?.classList.add("active");
    return;
  }

  if(tier==="vip"){
    E("zingoVipWorld")?.classList.remove("hidden");
    E("zingoTierVip")?.classList.add("active");
    return;
  }
}
(function(){

function zingoBootTier(){

  try{

    const q=new URLSearchParams(location.search);

    const tier=(q.get("tier")||"free").toLowerCase();

    if(typeof select==="function"){

      if(tier==="pro"){
        select("pro");
        return;
      }

      if(tier==="vip"){
        select("vip");
        return;
      }

      select("free");
    }

  }catch(e){
    console.warn("Tier boot:",e);
  }

}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",zingoBootTier);
}else{
  setTimeout(zingoBootTier,100);
}

window.zingoBootTier=zingoBootTier;

})();




function openPackages(){

try{

if(window.Zingo &&
typeof window.Zingo.go==="function"){

window.Zingo.go("packages");
return;

}

}catch(e){}

try{

if(typeof window.zingoSettings==="function"){

window.zingoSettings();
return;

}

}catch(e){}

if(typeof window.toast==="function")
window.toast("افتح الباقات لتفعيل الاشتراك");

}

Z.select=select;
Z.subscription=getSubscription;
Z.openPackages=openPackages;

async function boot(){
try{
const tg=window.Telegram?.WebApp;
if(tg){
try{tg.ready()}catch(e){}
try{tg.expand()}catch(e){}
}
}catch(e){}

/* افتح الواجهة المجانية فورًا */
clearWorlds();
E("zingoFreeWorld")?.classList.remove("hidden");
E("zingoTierFree")?.classList.add("active");

/* تحقق من الاشتراك بالخلفية بدون تعطيل الواجهة */
getSubscription().then(function(sub){
updateStates(
!!sub?.pro?.active,
!!sub?.vip?.active
);
}).catch(function(e){
console.warn("Zingo background subscription:",e);
});
}

if(document.readyState==="loading"){

document.addEventListener(
"DOMContentLoaded",
()=>setTimeout(boot,400)
);

}else{

setTimeout(boot,400);

}

})();


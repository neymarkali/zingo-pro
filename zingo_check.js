

(function(){

"use strict";

var tg=window.Telegram&&window.Telegram.WebApp;

if(tg){
  function zingoTelegramReady(){
    try{tg.ready()}catch(e){}
    try{tg.expand()}catch(e){}
    try{
      if(tg.disableVerticalSwipes) tg.disableVerticalSwipes();
    }catch(e){}
  }

  zingoTelegramReady();

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", zingoTelegramReady, {once:true});
  }else{
    setTimeout(zingoTelegramReady, 0);
  }
}

var state={
  tier:"free",
  page:"home",
  name:"لاعب جديد",
  points:0,
  level:1,
  picks:{}
};

var matches=[
  {
    id:1,
    league:"الدوري الإنجليزي",
    a:"ليفربول",
    b:"تشيلسي"
  },
  {
    id:2,
    league:"الدوري الإسباني",
    a:"ريال مدريد",
    b:"برشلونة"
  },
  {
    id:3,
    league:"الدوري الإيطالي",
    a:"إنتر",
    b:"ميلان"
  }
];

function $(id){
  return document.getElementById(id);
}

function safe(s){
  return String(s).replace(/[&<>"']/g,function(x){
    return {
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    }[x];
  });
}

function tierName(){
  if(state.tier==="pro") return "احترافي";
  if(state.tier==="vip") return "ملكي";
  return "مجاني";
}

function save(){
  try{
    localStorage.setItem(
      "zingo_clean_3tiers",
      JSON.stringify(state)
    );
  }catch(e){}
}

function load(){
  try{
    var x=JSON.parse(
      localStorage.getItem("zingo_clean_3tiers")||"null"
    );

    if(!x) return;

    if(["free","pro","vip"].includes(x.tier))
      state.tier=x.tier;

    if([
      "home",
      "matches",
      "predictions",
      "stats",
      "profile"
    ].includes(x.page))
      state.page=x.page;

    if(typeof x.name==="string"&&x.name)
      state.name=x.name;

    if(Number.isFinite(x.points))
      state.points=x.points;

    if(Number.isFinite(x.level))
      state.level=x.level;

    if(x.picks&&typeof x.picks==="object")
      state.picks=x.picks;

  }catch(e){}
}


function vipDifficulty(m){
  /*
   * نقاط VIP حسب صعوبة الاختيار.
   * هذه قيم البداية للواجهة الحالية، ويمكن لاحقاً استبدالها
   * بقيم تأتي من الباك إند/الاحتمالات الحقيقية.
   */
  var sets={
    1:{
      result:{1:1.5,X:4,2:8},
      double:{"1X":2,"X2":5,"12":3},
      btts:{yes:2,no:2.5},
      over25:{over:2,nover:2},
      exact:5
    },
    2:{
      result:{1:3,X:3.5,2:4},
      double:{"1X":2,"X2":2.5,"12":2.5},
      btts:{yes:2,no:2},
      over25:{over:2,nover:2},
      exact:5
    },
    3:{
      result:{1:3, X:3.5, 2:3},
      double:{"1X":2,"X2":2,"12":2},
      btts:{yes:2,no:2},
      over25:{over:2,nover:2},
      exact:5
    }
  };

  return sets[m.id] || sets[1];
}

function predictionCard(m){
  var p=state.picks[m.id]||{};
  var open=!!p.open;
  var vip=state.tier==="vip";
  var pro=state.tier!=="free";
  var d=vipDifficulty(m);
  var html='';

  html+=
    '<div class="prediction-head" data-toggle-match="'+m.id+'">'+
      '<div class="teams">'+
        '<span>'+safe(m.a)+'</span>'+
        '<span>ضد</span>'+
        '<span>'+safe(m.b)+'</span>'+
      '</div>'+
      '<div class="league">'+safe(m.league)+'</div>'+
      '<div class="prediction-open-indicator">'+
        (open?'▲':'▼')+
      '</div>'+
    '</div>';

  if(!open){
    if(p.pick || p.double || p.exactHome!==undefined || p.exactAway!==undefined){
      html+='<div class="prediction-summary">تم اختيار التوقع — اضغط لفتح المباراة والتعديل</div>';
    }
    return html;
  }

  html+=
    '<div class="prediction-panel">';

  /* النتيجة الأساسية */
  html+=
    '<div class="prediction-extra">'+
      '<div class="prediction-label">نتيجة المباراة</div>'+
      '<div class="opts">'+
        '<button class="opt prediction-choice'+(p.pick==="1"?" selected":"")+'" data-pick="1">'+
          'فوز '+safe(m.a)+
          (vip?'<small>'+d.result[1]+' نقطة</small>':'')+
        '</button>'+
        '<button class="opt prediction-choice'+(p.pick==="X"?" selected":"")+'" data-pick="X">'+
          'تعادل'+
          (vip?'<small>'+d.result.X+' نقطة</small>':'')+
        '</button>'+
        '<button class="opt prediction-choice'+(p.pick==="2"?" selected":"")+'" data-pick="2">'+
          'فوز '+safe(m.b)+
          (vip?'<small>'+d.result[2]+' نقطة</small>':'')+
        '</button>'+
      '</div>'+
    '</div>';

  /* PRO + VIP */
  if(pro){
    html+=
      '<div class="prediction-extra">'+
        '<div class="prediction-label">كلاهما يسجل</div>'+
        '<div class="opts">'+
          '<button class="opt prediction-choice'+(p.btts==="yes"?" selected":"")+'" data-extra-value="btts" data-value="yes">'+
            'نعم'+
            (vip?'<small>'+d.btts.yes+' نقطة</small>':'')+
          '</button>'+
          '<button class="opt prediction-choice'+(p.btts==="no"?" selected":"")+'" data-extra-value="btts" data-value="no">'+
            'لا'+
            (vip?'<small>'+d.btts.no+' نقطة</small>':'')+
          '</button>'+
        '</div>'+
      '</div>';

    html+=
      '<div class="prediction-extra">'+
        '<div class="prediction-label">أكثر أو أقل من 2.5 هدف</div>'+
        '<div class="opts">'+
          '<button class="opt prediction-choice'+(p.over25==="over"?" selected":"")+'" data-extra-value="over25" data-value="over">'+
            'أكثر من 2.5'+
            (vip?'<small>'+d.over25.over+' نقطة</small>':'')+
          '</button>'+
          '<button class="opt prediction-choice'+(p.over25==="under"?" selected":"")+'" data-extra-value="over25" data-value="under">'+
            'أقل من 2.5'+
            (vip?'<small>'+d.over25.nover+' نقطة</small>':'')+
          '</button>'+
        '</div>'+
      '</div>';
  }

  /* VIP إضافي */
  if(vip){
    html+=
      '<div class="prediction-extra vip-extra">'+
        '<div class="prediction-label">النتيجة الدقيقة</div>'+
        '<div class="exact-score-row">'+
          '<input class="exact-score-input" type="number" min="0" max="15" inputmode="numeric" placeholder="0" data-exact-home="'+m.id+'" value="'+
            (p.exactHome!==undefined?p.exactHome:'')+
          '">'+
          '<span> - </span>'+
          '<input class="exact-score-input" type="number" min="0" max="15" inputmode="numeric" placeholder="0" data-exact-away="'+m.id+'" value="'+
            (p.exactAway!==undefined?p.exactAway:'')+
          '">'+
        '</div>'+
        '<div class="vip-points-note">النتيجة الدقيقة: '+d.exact+' نقاط أو أكثر حسب صعوبة التوقع</div>'+
      '</div>';

    html+=
      '<div class="prediction-extra vip-extra">'+
        '<div class="prediction-label">فرصة مزدوجة</div>'+
        '<div class="opts">'+
          '<button class="opt prediction-choice'+(p.double==="1X"?" selected":"")+'" data-double="1X">1X<small>'+d.double["1X"]+' نقطة</small></button>'+
          '<button class="opt prediction-choice'+(p.double==="X2"?" selected":"")+'" data-double="X2">X2<small>'+d.double["X2"]+' نقطة</small></button>'+
          '<button class="opt prediction-choice'+(p.double==="12"?" selected":"")+'" data-double="12">12<small>'+d.double["12"]+' نقطة</small></button>'+
        '</div>'+
      '</div>';

    html+=
      '<div class="prediction-extra vip-extra">'+
        '<div class="prediction-label">توقع الركنيات</div>'+
        '<div class="opts">';

    [3,5,7,9,11].forEach(function(n){
      html+=
        '<button class="opt prediction-choice'+
        (String(p.corners)===String(n)?" selected":"")+
        '" data-corner="'+n+'">'+n+'</button>';
    });

    html+='</div></div>';
  }

  if(p.pick){
    html+=
      '<button class="opt save-prediction prediction-save" data-save-match="'+m.id+'">'+
        (p.saved?"تم حفظ التوقع":"حفظ التوقع")+
      '</button>';
  }

  html+='</div>';

  return html;
}

function bindPredictionCard(c){

  /* فتح وإغلاق المباراة */
  c.querySelectorAll("[data-toggle-match]").forEach(function(b){
    b.onclick=function(){
      var id=b.dataset.toggleMatch;

      if(!state.picks[id]){
        state.picks[id]={};
      }

      state.picks[id].open=!state.picks[id].open;
      save();
      render();
    };
  });

  /* النتيجة */
  c.querySelectorAll("[data-pick]").forEach(function(b){
    b.onclick=function(){
      var card=b.closest(".match");
      if(!card) return;

      var id=card.dataset.match;
      var m=matches.find(function(x){
        return String(x.id)===String(id);
      });

      if(!m) return;

      if(!state.picks[id]){
        state.picks[id]={};
      }

      state.picks[id].a=m.a;
      state.picks[id].b=m.b;
      state.picks[id].pick=b.dataset.pick;
      state.picks[id].saved=false;

      b.classList.remove("vip-pulse","pro-pulse");
      void b.offsetWidth;
      b.classList.add(state.tier==="vip"?"vip-pulse":"pro-pulse");

      save();
      render();
    };
  });

  /* كلاهما يسجل + أكثر/أقل */
  c.querySelectorAll("[data-extra-value]").forEach(function(b){
    b.onclick=function(){
      var card=b.closest(".match");
      if(!card) return;

      var id=card.dataset.match;

      if(!state.picks[id]){
        state.picks[id]={};
      }

      state.picks[id][b.dataset.extraValue]=b.dataset.value;
      state.picks[id].saved=false;

      b.classList.remove("vip-pulse","pro-pulse");
      void b.offsetWidth;
      b.classList.add(state.tier==="vip"?"vip-pulse":"pro-pulse");

      save();
      render();
    };
  });

  /* الفرصة المزدوجة */
  c.querySelectorAll("[data-double]").forEach(function(b){
    b.onclick=function(){
      var card=b.closest(".match");
      if(!card) return;

      var id=card.dataset.match;

      if(!state.picks[id]){
        state.picks[id]={};
      }

      state.picks[id].double=b.dataset.double;
      state.picks[id].saved=false;

      b.classList.remove("vip-pulse");
      void b.offsetWidth;
      b.classList.add("vip-pulse");

      save();
      render();
    };
  });

  /* النتيجة الدقيقة */
  c.querySelectorAll("[data-exact-home]").forEach(function(input){
    input.onchange=function(){
      var id=input.dataset.exactHome;

      if(!state.picks[id]){
        state.picks[id]={};
      }

      state.picks[id].exactHome=Math.max(0,Math.min(15,Number(input.value||0)));
      state.picks[id].saved=false;
      save();
    };
  });

  c.querySelectorAll("[data-exact-away]").forEach(function(input){
    input.onchange=function(){
      var id=input.dataset.exactAway;

      if(!state.picks[id]){
        state.picks[id]={};
      }

      state.picks[id].exactAway=Math.max(0,Math.min(15,Number(input.value||0)));
      state.picks[id].saved=false;
      save();
    };
  });

  /* الركنيات */
  c.querySelectorAll("[data-corner]").forEach(function(b){
    b.onclick=function(){
      var card=b.closest(".match");
      if(!card) return;

      var id=card.dataset.match;

      if(!state.picks[id]){
        state.picks[id]={};
      }

      state.picks[id].corners=Number(b.dataset.corner);
      state.picks[id].saved=false;

      b.classList.remove("vip-pulse");
      void b.offsetWidth;
      b.classList.add("vip-pulse");

      save();
      render();
    };
  });

  /* حفظ التوقع */
  c.querySelectorAll("[data-save-match]").forEach(function(b){
    b.onclick=function(){
      var id=b.dataset.saveMatch;
      var p=state.picks[id];

      if(!p || !p.pick) return;

      p.saved=true;
      p.savedAt=Date.now();

      save();
      render();
    };
  });
}

(function(){

  var order=["free","pro","vip"];
  var pendingTier=null;

  function nextTier(){
    var i=order.indexOf(state.tier);
    return order[(i+1)%order.length];
  }

  function tierArabic(t){
    if(t==="pro") return "احترافي";
    if(t==="vip") return "ملكي";
    return "مجاني";
  }

  function prepareTransfer(){

    var target=nextTier();
    pendingTier=target;

    var label=$("luxuryTarget");
    if(label){
      label.textContent="الوجهة: "+tierArabic(target);
    }

    var ball=$("luxuryBall");
    if(ball){
      ball.classList.remove("spinning");
      void ball.offsetWidth;
      ball.classList.add("spinning");
    }
  }

  function commitTransfer(){

    var target=pendingTier||nextTier();

    state.tier=target;
    state.page="home";

    save();
    render();

    pendingTier=null;

    var ball=$("luxuryBall");
    if(ball){
      ball.classList.remove("spinning");
      void ball.offsetWidth;
      ball.classList.add("spinning");
    }
  }

  var ball=$("luxuryBall");
  var transfer=$("luxuryTransfer");

  if(ball){
    ball.addEventListener("click",prepareTransfer);
  }

  if(transfer){
    transfer.addEventListener("click",function(){
      if(!pendingTier){
        prepareTransfer();
        setTimeout(commitTransfer,420);
      }else{
        commitTransfer();
      }
    });
  }

})();

document.querySelectorAll(".nav").forEach(function(b){

  b.onclick=function(){

    state.page=b.dataset.page;

    save();
    render();
  };

});

load();
render();

})();

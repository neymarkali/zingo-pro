
(function(){
  "use strict";

  /*
   * ZINGO PRO API BRIDGE
   * 2026-09-27
   *
   * This layer connects the existing PRO GOLD SIGNATURE UI
   * to the existing PRO API without replacing the UI.
   */

  const API = {
    subscription: "/api/subscription",
    round: "/api/pro_round",
    submit: "/api/pro_submit",
    ranking: "/api/pro_ranking"
  };

  window.API = Object.assign(window.API || {}, API);

  const tg = window.Telegram?.WebApp;

  function authHeaders(){
    const initData = tg?.initData || "";
    return initData
      ? {"X-Telegram-Init-Data": initData}
      : {};
  }

  async function api(path, options={}){
    const headers = {
      ...(options.body ? {"Content-Type":"application/json"} : {}),
      ...authHeaders(),
      ...(options.headers || {})
    };

    const res = await fetch(path, {
      ...options,
      headers,
      cache: "no-store",
      credentials: "include"
    });

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      data = {raw:text};
    }

    if(!res.ok){
      throw new Error(
        data?.error ||
        data?.message ||
        `HTTP ${res.status}`
      );
    }

    return data;
  }

  function asArray(data){
    if(Array.isArray(data)) return data;

    return (
      data?.matches ||
      data?.fixtures ||
      data?.games ||
      data?.data ||
      data?.round?.matches ||
      data?.round?.fixtures ||
      []
    );
  }

  function valueOf(obj, keys, fallback=""){
    for(const key of keys){
      const v = obj?.[key];
      if(v !== undefined && v !== null && String(v) !== ""){
        return v;
      }
    }
    return fallback;
  }

  function matchId(match, index){
    return String(
      valueOf(
        match,
        ["id","match_id","fixture_id","game_id"],
        `pro-${index+1}`
      )
    );
  }

  function teamName(match, side){
    if(side === "home"){
      return String(valueOf(
        match,
        ["home_team","home","team1","homeTeam","home_name"],
        ""
      ));
    }

    return String(valueOf(
      match,
      ["away_team","away","team2","awayTeam","away_name"],
      ""
    ));
  }

  function leagueName(match){
    const league = match?.league;

    if(typeof league === "string" && league){
      return league;
    }

    if(league && typeof league === "object"){
      return String(
        league.name ||
        league.title ||
        league.league_name ||
        ""
      );
    }

    return String(valueOf(
      match,
      ["league_name","competition","tournament","league"],
      ""
    ));
  }

  function matchTime(match){
    return String(valueOf(
      match,
      ["time","start_time","kickoff","date_time","datetime"],
      ""
    ));
  }

  function setText(el, value){
    if(el && value !== ""){
      el.textContent = String(value);
    }
  }

  function formatTime(raw){
    if(!raw) return "";

    const s = String(raw);

    /*
     * Keep already formatted values such as 21:00.
     */
    if(/^\\d{1,2}:\\d{2}$/.test(s)){
      return s;
    }

    const d = new Date(s);

    if(Number.isNaN(d.getTime())){
      return s;
    }

    return d.toLocaleTimeString("ar", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }

  function installMatchIds(){
    const matches = document.querySelectorAll(
      "#zingoProWorld details.zp-match"
    );

    matches.forEach((details, index)=>{
      if(!details.dataset.matchIndex){
        details.dataset.matchIndex = String(index);
      }
    });

    return matches;
  }

  function updateMatchFromApi(details, match, index){
    if(!details || !match) return;

    const id = matchId(match,index);
    details.dataset.matchId = id;

    const home = teamName(match,"home");
    const away = teamName(match,"away");
    const league = leagueName(match);
    const time = formatTime(matchTime(match));

    const teams = details.querySelectorAll(".zp-team span");

    if(home && teams[0]){
      teams[0].textContent = home;
    }

    if(away && teams[1]){
      teams[1].textContent = away;
    }

    const timeEl = details.querySelector(".zp-time");
    if(time && timeEl){
      timeEl.textContent = time;
    }

    const leagueEl = details.querySelector(".zp-league");
    if(league && leagueEl){
      leagueEl.textContent = league;
    }

    /*
     * Optional backend status.
     */
    const status = String(valueOf(
      match,
      ["status","state","availability"],
      ""
    ));

    const statusEl = details.querySelector(".zp-live");

    if(statusEl && status){
      statusEl.textContent = status;
    }

    /*
     * Store the complete backend match object for submission.
     */
    details.__zingoMatch = match;
  }

  async function loadRound(){
    const details = Array.from(
      document.querySelectorAll(
        "#zingoProWorld details.zp-match"
      )
    );

    if(!details.length){
      return;
    }

    try{
      const data = await api(API.round);
      const matches = asArray(data);

      if(!matches.length){
        console.warn("Zingo PRO: round returned no matches");
        return;
      }

      matches.forEach((match,index)=>{
        if(details[index]){
          updateMatchFromApi(details[index],match,index);
        }
      });

      window.__zingoProRound = data;

      /*
       * Re-apply prediction handlers after the backend data
       * has been attached.
       */
      installPredictionHandlers();

      console.log(
        "Zingo PRO round loaded:",
        matches.length,
        "matches"
      );

    }catch(e){
      console.warn(
        "Zingo PRO round:",
        e?.message || e
      );
    }
  }

  function selectedValue(form, selector){
    const el = form.querySelector(selector);
    return el ? String(el.value || "") : "";
  }

  function normalizeGoals(value){
    const s = String(value || "").trim();

    if(!s || s === "اختر"){
      return "";
    }

    const m = s.match(/\\d+/);

    if(!m){
      return s;
    }

    if(s.includes("6+")){
      return "6+";
    }

    return m[0];
  }

  function collectPrediction(form){
    const winner = form.querySelector(
      'input[type="radio"][name^="zp_match_"]:checked'
    );

    const selects = form.querySelectorAll(
      ".zp-field select"
    );

    const goals = selects[0]
      ? normalizeGoals(selects[0].value)
      : "";

    const corners = selects[1]
      ? String(selects[1].value || "")
      : "";

    return {
      winner: winner ? String(winner.value || "") : "",
      goals,
      corners
    };
  }

  function matchIdFromForm(form,index){
    const details = form.closest("details.zp-match");

    return String(
      details?.dataset?.matchId ||
      details?.__zingoMatch?.id ||
      details?.__zingoMatch?.match_id ||
      details?.__zingoMatch?.fixture_id ||
      `pro-${index+1}`
    );
  }

  async function submitPrediction(form,index){
    const button = form.querySelector(".zp-save");

    if(!button){
      return;
    }

    const prediction = collectPrediction(form);

    if(!prediction.winner){
      alert("اختر توقعك أولاً");
      return;
    }

    const originalText = button.textContent;

    button.disabled = true;
    button.textContent = "جارٍ الحفظ…";

    try{
      const matchId = matchIdFromForm(form,index);

      const body = {
        match_id: matchId,

        predictions: {
          winner: prediction.winner,
          goals: prediction.goals,
          corners: prediction.corners
        },

        prediction: {
          winner: prediction.winner,
          goals: prediction.goals,
          corners: prediction.corners
        }
      };

      const result = await api(API.submit,{
        method: "POST",
        body: JSON.stringify(body)
      });

      form.dataset.saved = "1";
      form.dataset.savedPrediction = JSON.stringify(prediction);

      button.disabled = false;
      button.textContent = "تم حفظ التوقع";
      button.classList.add("is-saved");

      /*
       * Keep the success state even if the user scrolls.
       */
      window.__zingoLastSubmit = {
        match_id: matchId,
        prediction,
        result
      };

      try{
        tg?.HapticFeedback?.notificationOccurred("success");
      }catch(e){}

      console.log(
        "Zingo PRO prediction saved:",
        matchId,
        result
      );

    }catch(e){
      console.error("Zingo PRO submit:",e);

      button.disabled = false;
      button.textContent = originalText || "حفظ التوقع";

      alert(
        e?.message ||
        "تعذر حفظ التوقع"
      );
    }
  }

  function installPredictionHandlers(){
    const forms = document.querySelectorAll(
      "#zingoProWorld details.zp-match form.zp-details"
    );

    forms.forEach((form,index)=>{
      if(form.dataset.zingoApiBound === "1"){
        return;
      }

      form.dataset.zingoApiBound = "1";

      /*
       * Remove the old inline-only submit behaviour by
       * intercepting the event here.
       */
      form.addEventListener("submit",function(event){
        event.preventDefault();
        event.stopPropagation();

        submitPrediction(form,index);
      },true);

      /*
       * A new choice means the prediction has changed,
       * therefore the old saved state is no longer valid.
       */
      form.addEventListener("change",function(event){
        const target = event.target;

        if(
          target?.matches?.(
            'input[type="radio"], select'
          )
        ){
          form.dataset.saved = "0";

          const button = form.querySelector(".zp-save");

          if(
            button &&
            !button.classList.contains("is-saved")
          ){
            button.textContent = "حفظ التوقع";
          }

          if(button){
            button.classList.remove("is-saved");
          }
        }
      });
    });
  }

  async function loadRanking(){
    try{
      const data = await api(API.ranking);
      window.__zingoProRanking = data;
      return data;
    }catch(e){
      console.warn(
        "Zingo PRO ranking:",
        e?.message || e
      );
      return null;
    }
  }

  /*
   * Make ranking available to the existing navigation
   * without replacing its design.
   */
  window.ZingoProAPI = {
    api,
    loadRound,
    loadRanking,
    submitPrediction,
    getPrediction: collectPrediction
  };

  function boot(){
    installMatchIds();
    installPredictionHandlers();

    /*
     * Give the existing tier system time to reveal PRO
     * if PRO is the selected tier.
     */
    setTimeout(function(){
      installMatchIds();
      installPredictionHandlers();

      const world = document.getElementById("zingoProWorld");

      if(world && !world.classList.contains("hidden")){
        loadRound();
      }
    },250);
  }

  if(document.readyState === "loading"){
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      {once:true}
    );
  }else{
    boot();
  }

})();

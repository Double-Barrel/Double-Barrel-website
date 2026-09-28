// Story page: tonight's special from the weekly rotation.
// Lives in its own file because the site's security policy blocks
// scripts written inside the page.
(function(){
  var ROTATION = [
    {day:0,name:"8 oz Sirloin",line:"$24 — 8 oz Angus sirloin, charbroiled, house seasoning & homemade au jus."},
    {day:2,name:"8 oz Sirloin",line:"$24 — 8 oz Angus sirloin, charbroiled, house seasoning & homemade au jus."},
    {day:3,name:"14 oz HamBurger Steak",line:"$23 — 14 oz Angus beef, house seasoning & homemade au jus."},
    {day:4,name:"14 oz HamBurger Steak",line:"$23 — 14 oz Angus beef, house seasoning & homemade au jus."},
    {day:5,name:"Prime Rib",line:"Slow-roasted, house seasoning & homemade au jus — 12 oz or 16 oz, $27/$39. Fridays only, while it lasts."},
    {day:6,name:"Steak Specials",line:"Saturday night — usually more than one cut on the board."}
  ];
  var FALLBACK_TITLE = "The salad bar never takes a day off.";
  var FALLBACK_LINE = "Homemade soups and salads daily — and check the full site for tonight's cut.";
  var CLOSED_MSG = "We're closed Mondays — but the rest of the week, there's always a cut on the board.";

  var card = document.getElementById("special-card");
  if(!card) return;

  var today = new Date().getDay(); // 0=Sun
  var hit = null;
  for(var i=0;i<ROTATION.length;i++){
    if(ROTATION[i].day === today){hit = ROTATION[i]; break;}
  }

  var html = "";
  if(today === 1){
    html = '<div class="special-label">Monday</div>';
    html += '<div class="special-closed">' + CLOSED_MSG + '</div>';
    document.getElementById("special-section").querySelector("h2").textContent = "We’re off tonight";
  } else if(hit){
    html = '<div class="special-label">Tonight’s Special</div>';
    html += '<div class="special-name">' + hit.name + '</div>';
    html += '<div class="special-line">' + hit.line + '</div>';
  } else {
    html = '<div class="special-label">On the menu</div>';
    html += '<div class="special-name">' + FALLBACK_TITLE + '</div>';
    html += '<div class="special-line">' + FALLBACK_LINE + '</div>';
  }
  card.innerHTML = html;
})();

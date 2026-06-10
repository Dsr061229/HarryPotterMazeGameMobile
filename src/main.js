// ===== DOM 引用 =====
var canvas = document.querySelector("#game");
var overlay = document.querySelector("#overlay");
var resultPanel = document.querySelector("#result");
var quizPanel = document.querySelector("#quiz");
var quizQuestionEl = document.querySelector("#quiz-question");
var quizOptionsEl = document.querySelector("#quiz-options");
var startButton = document.querySelector("#start");
var restartButton = document.querySelector("#restart");
var resultTitle = document.querySelector("#result-title");
var resultCopy = document.querySelector("#result-copy");
var timeEl = document.querySelector("#time");
var healthEl = document.querySelector("#health");
var wandEl = document.querySelector("#runes");
var messageEl = document.querySelector("#message");
var interactionEl = document.querySelector("#interaction");
var deadEndCountEl = document.querySelector("#dead-end-count");
var joystickEl = document.querySelector("#virtual-joystick");
var joystickBaseEl = document.querySelector("#joystick-base");
var joystickKnobEl = document.querySelector("#joystick-knob");
var btnSprint = document.querySelector("#btn-sprint");
var btnInteract = document.querySelector("#btn-interact");
var btnMark = document.querySelector("#btn-mark");
var btnScroll = document.querySelector("#btn-scroll");
var btnWeapon = document.querySelector("#btn-weapon");
var diffTabs = document.querySelector("#diff-tabs");
var heroCards = document.querySelector("#hero-cards");

// ===== 游戏配置 =====
var currentDifficulty = "medium";
var currentHero = null;

var difficultySettings = {
  easy:   { size:13, startTime:240, sentinelSpeed:0.55, sphinxDmg:15, label:"简单" },
  medium: { size:17, startTime:180, sentinelSpeed:1.0, sphinxDmg:30, label:"中档" },
  hard:   { size:19, startTime:130, sentinelSpeed:1.35, sphinxDmg:50, label:"困难" }
};

var heroConfig = {
  harry: {
    name:"哈利·波特", speed:6.0, hp:100,
    passive:function(dmg,type){if(type==="dementor")return dmg*0.6;return dmg;},
    weaponName:"格兰芬多宝剑", weaponCD:6,
    weapon:function(){
      if(!sentinel.mesh||sentinel.banished||weaponCooldown>0)return false;
      var pf=new THREE.Vector3(player.position.x,1.02,player.position.z);
      var distS=sentinel.position.distanceTo(pf);
      var hitBE=blastEnded.mesh&&blastEnded.state!=="stunned"&&blastEnded.position.distanceTo(new THREE.Vector3(player.position.x,0.62,player.position.z))<4;
      if(distS>4.5&&!hitBE)return false;
      if(distS<=4.5){
        var dir=pf.clone().sub(sentinel.position).normalize();
        var knock=new THREE.Vector3(dir.x,0,dir.z).normalize().multiplyScalar(CELL*5);
        sentinel.position.add(knock);sentinel.mesh.position.copy(sentinel.position);
        if(sentinel.light)sentinel.light.position.set(sentinel.position.x,1.72,sentinel.position.z);
        sentinel.forcedChaseTimer=0;sentinel.banished=false;sentinel.banishTimer=0;
      }
      if(hitBE){
        var dirBE=new THREE.Vector3(blastEnded.position.x-player.position.x,0,blastEnded.position.z-player.position.z).normalize().multiplyScalar(CELL*4);
        blastEnded.position.add(dirBE);blastEnded.mesh.position.copy(blastEnded.position);
        if(blastEnded.light)blastEnded.light.position.set(blastEnded.position.x,1,blastEnded.position.z);
        blastEnded.state="stunned";blastEnded.stunTimer=2;
      }
      playChord([262,330,392],0.22,0.06);speakSpell("除你武器！");setMessage("格兰芬多宝剑斩击！"+(hitBE?"炸尾螺也被震退了。":""),2);
      return true;
    }
  },
  cedric: {
    name:"塞德里克·迪戈里", speed:6.0, hp:120,
    passive:function(dmg,type){if(type==="sphinx")return dmg*0.75;return dmg;},
    wandDecayMult:0.65,
    weaponName:"速速禁锢", weaponCD:8,
    weapon:function(){
      if(!sentinel.mesh||sentinel.banished||weaponCooldown>0)return false;
      var pf=new THREE.Vector3(player.position.x,0.62,player.position.z);
      if(sentinel.position.distanceTo(pf)>5)return false;
      sentinel.forcedChaseTimer=0;sentinel._frozen=performance.now()+4000;
      playChord([330,440,554],0.3,0.06);speakSpell("速速禁锢！");setMessage("速速禁锢！摄魂怪被定身4秒。",2);
      return true;
    }
  },
  viktor: {
    name:"威克多尔·克鲁姆", speed:7.2, hp:100,
    passive:function(dmg,type){if(type==="sphinx")return dmg*1.2;return dmg;},
    weaponName:"秘鲁隐身烟雾弹", weaponCD:15,
    weapon:function(){
      if(!sentinel.mesh||weaponCooldown>0)return false;
      sentinel.banished=true;sentinel.banishTimer=10;sentinel.forcedChaseTimer=0;
      sentinel.mesh.visible=false;if(sentinel.light)sentinel.light.visible=false;
      if(blastEnded.mesh){blastEnded.state="stunned";blastEnded.stunTimer=3;}
      // 烟雾粒子特效
      var smGeo=new THREE.SphereGeometry(0.35,8,8);var smMat=new THREE.MeshBasicMaterial({color:0x333333,transparent:true,opacity:0.7});
      for(var si=0;si<15;si++){var sm=new THREE.Mesh(smGeo,smMat.clone());sm.position.copy(player.position);sm.position.y+=0.8+Math.random()*1.2;sm.position.x+=(Math.random()-0.5)*3;sm.position.z+=(Math.random()-0.5)*3;sm.userData={life:1.5+Math.random()*1.5,seed:Math.random()*10};scene.add(sm);if(!currentHero._smokeFx)currentHero._smokeFx=[];currentHero._smokeFx.push(sm);}
      playNoiseBurst(0.5,0.08);speakSpell("烟雾弹！");setMessage("隐身烟雾！3秒无敌。",2);
      currentHero._vanishUntil=performance.now()+3000;
      return true;
    }
  },
  fleur: {
    name:"芙蓉·德拉库尔", speed:6.0, hp:90,
    passive:function(dmg,type){return dmg;},
    lightMult:1.25, deadEndRange:2,
    weaponName:"福灵剂", weaponCD:30,
    weapon:function(){
      if(gameState!=="quiz"||!currentQuiz||weaponCooldown>0)return false;
      var d=currentQuiz._data||quizData[currentQuiz.quizIndex%quizData.length];
      var order=currentQuiz._order||[0,1,2];
      var btns=quizOptionsEl.querySelectorAll("button");
      var disabled=0;
      for(var k=0;k<order.length&&disabled<2;k++){
        var origIdx=order[k];
        if(origIdx!==d.answer&&btns[k]){btns[k].style.opacity="0.2";btns[k].style.textDecoration="line-through";btns[k].disabled=true;disabled++;}
      }
      speakSpell("福灵剂！");setMessage("福灵剂生效！2个错误答案被排除。",3);playChord([523,659,784],0.25,0.05);
      return true;
    }
  }
};

var weaponCooldown = 0;

// ===== 大厅交互 =====
if(diffTabs){
  diffTabs.addEventListener("click",function(e){
    var btn=e.target.closest(".diff-btn");if(!btn)return;
    diffTabs.querySelectorAll(".diff-btn").forEach(function(b){b.classList.remove("active")});
    btn.classList.add("active");currentDifficulty=btn.dataset.diff;
  });
}
if(heroCards){
  heroCards.addEventListener("click",function(e){
    var card=e.target.closest(".hero-card");if(!card)return;
    heroCards.querySelectorAll(".hero-card").forEach(function(c){c.classList.remove("selected")});
    card.classList.add("selected");currentHero=card.dataset.hero;
  });
}

// ===== 事件（最早注册） =====
if (startButton) startButton.addEventListener("click", function () {
  if(!currentHero&&!isAdmin){setMessage("请先选择难度和角色",2);return}
  overlay.classList.add("hidden");startGame();
});
if (restartButton) restartButton.addEventListener("click", function () { resultPanel.classList.add("hidden"); startGame(); });
if (btnWeapon) { btnWeapon.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();useWeapon()}); btnWeapon.addEventListener("touchstart",function(e){e.preventDefault();e.stopPropagation()}); }

// ===== 用户系统 =====
var currentUser = null, isAdmin = false;
var SUPABASE_URL = "https://psadnnnoyeqinuixwumj.supabase.co/rest/v1";
var SUPABASE_KEY = "sb_publishable_iwAnf0X2uoGzL_y8gasb0A_sMII0EVm";
var ADMIN_PW = "061229";
var EXPRESS_API = (location.protocol === "file:" || location.hostname === "localhost" || location.hostname === "127.0.0.1") 
  ? "http://localhost:8080" 
  : null;

function dbFetch(method, path, body) {
  var headers, url;
  if (EXPRESS_API) {
    headers = { "Content-Type": "application/json" };
    url = EXPRESS_API + path;
  } else {
    headers = { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY };
    if (body) { headers["Content-Type"] = "application/json"; headers["Prefer"] = "return=representation"; }
    url = SUPABASE_URL + path;
  }
  return fetch(url, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.headers.get("content-length") === "0" ? null : r.json(); });
}

function localDB() { try { return JSON.parse(localStorage.getItem("maze_game_db")) || { users: {} } } catch (e) { return { users: {} } } }
function localSave(db) { localStorage.setItem("maze_game_db", JSON.stringify(db)) }
function localRecord(won, score) {
  if (!currentUser) return;
  var db = localDB(), u = db.users[currentUser];
  if (!u) { u = { wins: 0, losses: 0, totalScore: 0, rankScore: 0, lastHealth: 100, createdAt: Date.now(), banned: false }; db.users[currentUser] = u }
  if (won) u.wins++; else u.losses++;
  u.totalScore += score; u.rankScore = u.rankScore || 0; u.rankScore += score + (won?500:0) + (u.lastHealth||0); localSave(db);
}


var authLogin=document.querySelector("#auth-login"),authPanel=document.querySelector("#auth-panel"),authUidEl=document.querySelector("#auth-uid");
var authMsg=document.querySelector("#auth-msg"),rulesPanel=document.querySelector("#rules-panel");
var rulesOk=document.querySelector("#rules-ok"),adminPanel=document.querySelector("#admin-panel");
var adminClose=document.querySelector("#admin-close"),adminUsers=document.querySelector("#admin-users");
var statsPanel=document.querySelector("#stats-panel"),statsClose=document.querySelector("#stats-close");
var myStats=document.querySelector("#my-stats"),leaderboard=document.querySelector("#leaderboard");
var btnStats=document.querySelector("#btn-stats"),btnAdmin=document.querySelector("#btn-admin");

if(authLogin)authLogin.addEventListener("click",doAuth);
if(authUidEl)authUidEl.addEventListener("keydown",function(e){if(e.key==="Enter")doAuth()});
if(rulesOk)rulesOk.addEventListener("click",function(){rulesPanel.classList.add("hidden");authPanel.classList.add("hidden");overlay.classList.remove("hidden");setMessage("选择你的难度和勇士，然后踏入迷宫！",3)});
if(adminClose)adminClose.addEventListener("click",function(){adminPanel.classList.add("hidden")});
if(statsClose)statsClose.addEventListener("click",function(){statsPanel.classList.add("hidden")});
if(btnStats)btnStats.addEventListener("click",function(e){e.stopPropagation();showStats()});
if(btnAdmin)btnAdmin.addEventListener("click",function(e){e.stopPropagation();showAdmin()});

function doAuth(){
  var uid=(authUidEl.value||"").trim();
  if(!uid){authMsg.textContent="请输入游戏ID";return}
  if(!/^[a-zA-Z0-9]+$/.test(uid)){authMsg.textContent="只能使用英文字母和数字";return}
  if(uid.length<2){authMsg.textContent="ID至少2个字符";return}
  if(uid==="Dsr"){var pw=prompt("管理员密码:");if(pw===ADMIN_PW){isAdmin=true;currentUser="Dsr";btnAdmin.classList.remove("hidden");authPanel.classList.add("hidden");overlay.classList.remove("hidden");setMessage("管理员登录成功，选择难度后踏入迷宫",2);dbFetch("GET","/users?select=uid&uid=eq.Dsr").then(function(r){if(!r||!r.length){dbFetch("POST","/users",{uid:"Dsr",wins:0,losses:0,total_score:0,banned:false}).catch(function(){})}}).catch(function(){});return}else{authMsg.textContent="密码错误";return}}
  dbFetch("GET","/users?select=*&uid=eq."+encodeURIComponent(uid)).then(function(r){var u=(r&&r.length)?r[0]:null;if(u&&u.banned){authMsg.textContent="该账号已被禁用";return}if(!u){dbFetch("POST","/users",{uid:uid,wins:0,losses:0,total_score:0,banned:false}).then(function(){finishAuth(uid)}).catch(function(){fallbackAuth(uid)})}else{finishAuth(uid)}}).catch(function(e){fallbackAuth(uid)})}
function finishAuth(uid){isAdmin=false;currentUser=uid;btnAdmin.classList.add("hidden");authPanel.classList.add("hidden");overlay.classList.remove("hidden");setMessage("欢迎回来，"+uid+"！选择勇士踏入迷宫。",2)}
function fallbackAuth(uid){var db=localDB();if(db.users[uid]&&db.users[uid].banned){authMsg.textContent="该账号已被禁用";return}if(!db.users[uid]){db.users[uid]={wins:0,losses:0,totalScore:0,rankScore:0,lastHealth:100,createdAt:Date.now(),banned:false};localSave(db)}finishAuth(uid)}
function recordGameResult(won,score,endHealth){
  if(!currentUser)return;
  var hp=endHealth!==undefined?Math.max(0,Math.ceil(endHealth)):0;
  dbFetch("GET","/users?select=wins,losses,total_score&uid=eq."+encodeURIComponent(currentUser)).then(function(r){if(r&&r.length){var u=r[0],w=u.wins,l=u.losses,s=(u.total_score||0)+(score||0)+(won?500:0)+hp;if(won)w++;else l++;dbFetch("PATCH","/users?uid=eq."+encodeURIComponent(currentUser),{wins:w,losses:l,total_score:s}).catch(function(){})}}).catch(function(){localRecord(won,score)});
}
function showStats(){
  if(!currentUser){alert("请先登录");return}
  dbFetch("GET","/users?select=*&uid=eq."+encodeURIComponent(currentUser)).then(function(r){var u=(r&&r.length)?r[0]:{};myStats.innerHTML="<p>ID: "+currentUser+"</p><p>胜利: "+(u.wins||0)+" 场</p><p>失败: "+(u.losses||0)+" 场</p><p>排名分: "+(u.total_score||0)+"</p>"}).catch(function(){myStats.innerHTML="<p>ID: "+currentUser+" (离线)</p>"});
  dbFetch("GET","/users?select=uid,wins,total_score&banned=eq.false&order=total_score.desc&limit=20").then(function(r){var html="";if(r){for(var i=0;i<r.length;i++)html+="<div><span>"+(i+1)+". "+r[i].uid+" ("+r[i].wins+"胜)</span><span>"+(r[i].total_score||0)+"分</span></div>"}leaderboard.innerHTML=html||"暂无数据"}).catch(function(){leaderboard.innerHTML="排行榜暂不可用"});statsPanel.classList.remove("hidden")}
function showAdmin(){
  if(!isAdmin)return;
  dbFetch("GET","/users?select=*&order=total_score.desc").then(function(r){var html="";if(r){for(var i=0;i<r.length;i++){var u=r[i];html+="<div><span>"+u.uid+" (赢"+(u.wins||0)+" 输"+(u.losses||0)+" 排名"+(u.total_score||0)+")"+(u.banned?" [已禁]":"")+"</span><span>";if(u.uid!=="Dsr"){if(!u.banned)html+="<button class='btn-ban' onclick=\"toggleBan('"+u.uid+"')\">禁用</button>";else html+="<button onclick=\"toggleBan('"+u.uid+"')\">解禁</button>";html+="<button class='btn-del' onclick=\"removeUser('"+u.uid+"')\">删除</button>"}html+="</div>"}}adminUsers.innerHTML=html||"暂无用户";adminPanel.classList.remove("hidden")}).catch(function(){alert("无法连接数据库")})}
function toggleBan(uid){if(!isAdmin||uid==="Dsr")return;dbFetch("GET","/users?select=banned&uid=eq."+encodeURIComponent(uid)).then(function(r){var nb=!(r&&r.length&&r[0].banned);dbFetch("PATCH","/users?uid=eq."+encodeURIComponent(uid),{banned:nb}).then(function(){showAdmin()})}).catch(function(){var db=localDB();if(db.users[uid]){db.users[uid].banned=!db.users[uid].banned;localSave(db)}showAdmin()})}
function removeUser(uid){if(!isAdmin||uid==="Dsr")return;if(!confirm("确定删除用户 "+uid+" 吗？"))return;dbFetch("DELETE","/users?uid=eq."+encodeURIComponent(uid)).then(function(){showAdmin()}).catch(function(){var db=localDB();delete db.users[uid];localSave(db);showAdmin()})}

// ===== 核心常量 =====
var CELL=4,PLAYER_RADIUS=0.72,PLAYER_HEIGHT=1.7;
var WAND_DECAY=0.005,WAND_MIN=0.2,SPRINT_DRAIN=0.22,SPRINT_RECOVERY=0.38,SPRINT_SPEED=1.4;
var DEMENTOR_DMG=16,BLAST_DMG=14,SNARE_DMG=9,WALL_CRUSH_DMG=4;
var JOYSTICK_MAX_R=55,TOUCH_SENSITIVITY=0.005;
// 动态游戏变量
var MAZE_SIZE=21,START_TIME=300,WALK_SPEED=4.8,SENTINEL_SPD=1.0,SPHINX_DMG=28;
var heroHP=100,heroWandDecay=1,heroLightMult=1,heroDeadEndR=0;

// ===== 迷宫生成 =====
function generateMaze(){
  var SIZE=MAZE_SIZE||21,grid,startOK;
  for(var ga=0;ga<30;ga++){grid=[];for(var r=0;r<SIZE;r++){grid[r]=[];for(var c=0;c<SIZE;c++)grid[r][c]="#"}
    var dp=[[-2,0],[2,0],[0,-2],[0,2]];
    function carve(r,c){grid[r][c]=".";var ds=dp.slice().sort(function(){return Math.random()-0.5});
      for(var d=0;d<ds.length;d++){var dr=ds[d][0],dc=ds[d][1];var nr=r+dr,nc=c+dc;
        if(nr>0&&nr<SIZE-1&&nc>0&&nc<SIZE-1&&grid[nr][nc]==="#"){grid[r+dr/2][c+dc/2]=".";carve(nr,nc)}}}
    carve(1,1);
    var maxO=12+Math.floor(Math.random()*10),totalO=0,ol=[]; // 收集候选墙
    for(var wr=2;wr<SIZE-2;wr++)for(var wc=2;wc<SIZE-2;wc++){if(grid[wr][wc]!=="#")continue;var adj=0;
      if(wr>0&&grid[wr-1][wc]===".")adj++;if(wr<SIZE-1&&grid[wr+1][wc]===".")adj++;
      if(wc>0&&grid[wr][wc-1]===".")adj++;if(wc<SIZE-1&&grid[wr][wc+1]===".")adj++;if(adj>=2)ol.push({r:wr,c:wc})}
    for(var i=ol.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=ol[i];ol[i]=ol[j];ol[j]=t}
    for(var oi=0;oi<ol.length&&totalO<maxO;oi++){grid[ol[oi].r][ol[oi].c]=".";totalO++}
    // 起点枢纽2x2
    for(var dr=-1;dr<=1;dr++)for(var dc=-1;dc<=1;dc++){var sr=1+dr,sc=1+dc;if(sr>0&&sr<SIZE-1&&sc>0&&sc<SIZE-1)grid[sr][sc]="."}
    var hd=[[-2,0],[3,0],[0,-2],[0,3]];for(var d=0;d<hd.length;d++){var hr=1+hd[d][0],hc=1+hd[d][1];if(hr>0&&hr<SIZE-1&&hc>0&&hc<SIZE-1){
      var sr2=hd[d][0]===0?0:(hd[d][0]>0?1:-1),sc2=hd[d][1]===0?0:(hd[d][1]>0?1:-1);var cr=1,cc=1;
      while(cr!==hr||cc!==hc){cr+=sr2;cc+=sc2;grid[cr][cc]="."}}}
    // 广场2-3个
    var pl=2+Math.floor(Math.random()*2);for(var pi=0;pi<pl;pi++){var pr=4+Math.floor(Math.random()*(SIZE-8)),pc=4+Math.floor(Math.random()*(SIZE-8));
      for(var dr=-1;dr<=1;dr++)for(var dc=-1;dc<=1;dc++){var cr2=pr+dr,cc2=pc+dc;if(cr2>0&&cr2<SIZE-1&&cc2>0&&cc2<SIZE-1)grid[cr2][cc2]="."}}
    // S/E
    startCell={r:1,c:1};grid[1][1]="S";
    var eRegions=[{r:SIZE-2,c:SIZE-2},{r:SIZE-2,c:2},{r:2,c:SIZE-2},{r:SIZE-3,c:Math.floor(SIZE/2)}];
    var ch=eRegions[Math.floor(Math.random()*eRegions.length)];exitCell={r:ch.r,c:ch.c};grid[exitCell.r][exitCell.c]="E";
    var de=[[-1,0],[1,0],[0,-1],[0,1]];for(var d=0;d<4;d++){var er=exitCell.r+de[d][0],ec=exitCell.c+de[d][1];if(er>0&&er<SIZE-1&&ec>0&&ec<SIZE-1&&grid[er][ec]==="#"){grid[er][ec]=".";break}}
    startOK=hasPath(grid,1,1,exitCell.r,exitCell.c);var snb=0;for(var d=0;d<4;d++){var nr=1+de[d][0],nc=1+de[d][1];if(nr>=0&&nr<SIZE&&nc>=0&&nc<SIZE&&grid[nr][nc]!=="#")snb++}if(snb<2)startOK=false;
    if(startOK)break}
  if(!startOK){grid=[];for(var r=0;r<SIZE;r++){grid[r]=[];for(var c=0;c<SIZE;c++)grid[r][c]="#"}
    function c2(r,c){grid[r][c]=".";var ds=[[-2,0],[2,0],[0,-2],[0,2]].sort(function(){return Math.random()-0.5});for(var d=0;d<ds.length;d++){var nr=r+ds[d][0],nc=c+ds[d][1];if(nr>0&&nr<SIZE-1&&nc>0&&nc<SIZE-1&&grid[nr][nc]==="#"){grid[r+ds[d][0]/2][c+ds[d][1]/2]=".";c2(nr,nc)}}}c2(1,1);for(var i=0;i<25;i++){var wr=2+Math.floor(Math.random()*(SIZE-4)),wc=2+Math.floor(Math.random()*(SIZE-4));if(grid[wr][wc]==="#")grid[wr][wc]="."}startCell={r:1,c:1};grid[1][1]="S";exitCell={r:SIZE-2,c:SIZE-2};grid[SIZE-2][SIZE-2]="E"}
  // 放R/T/B
  var reach=[];for(var r=1;r<SIZE-1;r++)for(var c=1;c<SIZE-1;c++)if(grid[r][c]===".")reach.push({r:r,c:c});
  var filt=reach.filter(function(p){return Math.abs(p.r-startCell.r)+Math.abs(p.c-startCell.c)>=3&&Math.abs(p.r-exitCell.r)+Math.abs(p.c-exitCell.c)>=3});
  for(var i=filt.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=filt[i];filt[i]=filt[j];filt[j]=t}
  var idx=0;for(var i=0;i<6&&idx<filt.length;i++,idx++)grid[filt[idx].r][filt[idx].c]="R";
  for(var i=0;i<7&&idx<filt.length;i++,idx++)grid[filt[idx].r][filt[idx].c]="T";
  if(idx<filt.length){blastEnded.home={r:filt[idx].r,c:filt[idx].c};grid[filt[idx].r][filt[idx].c]="B"}
  mazeRows=[];for(var r=0;r<SIZE;r++)mazeRows.push(grid[r].join(""))
}
function hasPath(grid,sr,sc,er,ec){var S=grid.length;var v=[];for(var r=0;r<S;r++){v[r]=[];for(var c=0;c<S;c++)v[r][c]=false}var q=[{r:sr,c:sc}];v[sr][sc]=true;var ds=[[-1,0],[1,0],[0,-1],[0,1]];while(q.length>0){var cur=q.shift();if(cur.r===er&&cur.c===ec)return true;for(var d=0;d<4;d++){var nr=cur.r+ds[d][0],nc=cur.c+ds[d][1];if(nr>=0&&nr<S&&nc>=0&&nc<S&&!v[nr][nc]&&grid[nr][nc]!=="#"){v[nr][nc]=true;q.push({r:nr,c:nc})}}}return false}

var mazeRows=[],startCell={r:1,c:1},exitCell={r:13,c:13};

// ===== Three.js =====
if(typeof THREE==='undefined'){alert('Three.js库加载失败');throw new Error('THREE undefined')}
var scene=new THREE.Scene();scene.background=new THREE.Color(0x1a2a1e);scene.fog=new THREE.Fog(0x1a2a1e,5,28);
var camera=new THREE.PerspectiveCamera(72,window.innerWidth/window.innerHeight,0.1,80);camera.rotation.order="YXZ";scene.add(camera);
var isMobile=('ontouchstart' in window)||(navigator.maxTouchPoints||0)>0;
var renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:false,powerPreference:"high-performance"});renderer.setSize(window.innerWidth,window.innerHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.2));renderer.shadowMap.enabled=!isMobile;if(!isMobile)renderer.shadowMap.type=THREE.PCFSoftShadowMap;
var ambient=new THREE.AmbientLight(0x3a5a3a,1.2);scene.add(ambient);
var hemi=new THREE.HemisphereLight(0x88bb88,0x3a2a1a,0.7);scene.add(hemi);
var moon=new THREE.DirectionalLight(0xeeddbb,1.0);moon.position.set(-18,32,-8);moon.castShadow=true;moon.shadow.mapSize.set(512,512);scene.add(moon);
var lumos=new THREE.SpotLight(0xf5faff,14,22,Math.PI/4.5,0.3,1.5);lumos.position.set(0.34,-0.22,-0.22);lumos.target.position.set(0,-0.22,-5);camera.add(lumos,lumos.target);

function mapWidth(){return mazeRows[0]?mazeRows[0].length:21}
function mapHeight(){return mazeRows.length}
function mapHalfW(){return(mapWidth()*CELL)/2}
function mapHalfH(){return(mapHeight()*CELL)/2}

var keys=new Set,solids=new Set,markerCells=new Set,magicShards=[],traps=[],sphinxes=[],gates=[],quizBarriers=[],fireflies=[],shiftingWalls=[],shiftingWallSolidCache={},deadEndMarks=[],buffs=[],exitParticles=[],torches=[],entranceBraziers=[];

var joystickState={active:false,touchId:null,baseX:0,baseY:0,dx:0,dy:0};
var cameraTouch={active:false,touchId:null,lastX:0,lastY:0};
var sprintToggled=false,keyboardSprint=false;
var yaw=0,pitch=0,velocity=new THREE.Vector3(),lastTime=performance.now(),gameState="intro";
var timeLeft=START_TIME,health=100,wandPower=1,sprintEnergy=1,isSprinting=false,dementorAura=false,snare=null,scrollCharges=0,cupKeyObtained=false,freeSprintUntil=0,guideUntil=0,currentQuiz=null,ceremonyAlpha=0,housePoints=0;
var audioCtx=null,ambientDrone=null,lastExitChime=0,lastDementorTone=0,lastFootstep=0,lastLumosCrackle=0,lastSnarePulse=0,lastTorchCrackle=0;
var player={position:new THREE.Vector3(),cell:{r:0,c:0}};
var sentinel={mesh:null,light:null,position:new THREE.Vector3(),path:[],target:0,strikeTimer:0,forcedChaseTimer:0,banished:false,banishTimer:0};
var goldenSnitch={mesh:null,light:null,position:new THREE.Vector3(),velocity:new THREE.Vector3(),home:{r:7,c:7},wanderTimer:0};
var patronusBeam={active:false,mesh:null,light:null,target:new THREE.Vector3(),origin:new THREE.Vector3(),startTime:0,duration:0.6};
var blastEnded={mesh:null,light:null,position:new THREE.Vector3(),home:{r:3,c:11},state:"patrol",patrolPhase:0,stunTimer:0,chargeTarget:new THREE.Vector3(),chargeDir:new THREE.Vector3(),hitTimer:0};

var quizData=[{question:"三根魔杖依次闪光：蓝、蓝、金、蓝、蓝、金。下一次金光前还会出现几次蓝光？",options:["2 次","1 次","3 次"],answer:0},{question:"一瓶复方汤剂每分钟翻倍，8 分钟装满坩埚。它在第几分钟装到一半？",options:["第 4 分钟","第 7 分钟","第 6 分钟"],answer:1},{question:"七个波特用复方汤剂伪装，真哈利必须和谁一组来迷惑食死徒？",options:["穆迪","海格","罗恩"],answer:1},{question:"蛇怪的眼睛能直接致死，哈利在密室中用什么武器击败了蛇怪？",options:["蛇牙","魔杖","格兰芬多宝剑"],answer:2},{question:"活点地图的咒语是\"我庄严宣誓我不干好事\"，关闭它的咒语是什么？",options:["恶作剧完毕","咒立停","一切结束"],answer:0},{question:"三强争霸赛第二个项目中，参赛者需要从人鱼手中救回什么？",options:["魔法书","金蛋","心爱的人"],answer:2},{question:"魁地奇比赛中，抓住金色飞贼得多少分？",options:["50 分","100 分","150 分"],answer:2},{question:"伏地魔的七个魂器中，哪一个被藏在霍格沃茨的有求必应屋里？",options:["拉文克劳的冠冕","斯莱特林的挂坠盒","汤姆·里德尔的日记"],answer:0},{question:"死亡圣器不包括以下哪一项？",options:["老魔杖","格兰芬多宝剑","复活石"],answer:1},{question:"小天狼星布莱克在阿兹卡班变成什么动物越狱的？",options:["老鼠","猫","大黑狗"],answer:2},{question:"凤凰社的总部位于哪里？",options:["霍格沃茨","对角巷","格里莫广场12号"],answer:2},{question:"赫敏在一年级时用什么谜题帮助哈利通过倒数第二关？",options:["棋盘","魔药瓶谜题","钥匙"],answer:1},{question:"哈利波特的魔杖杖芯是什么？",options:["龙心弦","独角兽毛","凤凰尾羽"],answer:2},{question:"霍格沃茨共有几个学院？",options:["3 个","4 个","5 个"],answer:1},{question:"海格第一次带哈利去对角巷是从哪里进入的？",options:["破釜酒吧后院","古灵阁旁边","丽痕书店后面"],answer:0},{question:"纳威·隆巴顿最擅长的魔法科目是什么？",options:["变形术","魔咒学","草药学"],answer:2},{question:"伏地魔的真名是什么？",options:["汤姆·马沃罗·里德尔","汤姆·马修斯·里德尔","汤姆·马库斯·里德尔"],answer:0},{question:"多比最初是谁的家养小精灵？",options:["韦斯莱家族","克拉布家族","马尔福家族"],answer:2},{question:"混血王子是谁？",options:["詹姆·波特","西弗勒斯·斯内普","小天狼星·布莱克"],answer:1},{question:"卢平教授在满月时会变成什么？",options:["摄魂怪","狼人","吸血鬼"],answer:1}];

var wallMaterial=new THREE.MeshStandardMaterial({color:0x1a3522,roughness:0.94});
var wallTopMaterial=new THREE.MeshStandardMaterial({color:0x2d4f2a,roughness:0.9});
var floorMaterial=new THREE.MeshStandardMaterial({color:0x1a1a10,roughness:0.85,metalness:0.05});
var trapMaterial=new THREE.MeshStandardMaterial({color:0x2a180f,emissive:0x220600,roughness:0.76});
var gateMaterial=new THREE.MeshStandardMaterial({color:0x111a28,emissive:0x143a73,emissiveIntensity:0.65,transparent:true,opacity:0.84});
var torchWoodMat=new THREE.MeshStandardMaterial({color:0x4a3020,roughness:0.88});
var torchFlameMat=new THREE.MeshBasicMaterial({color:0xff8830});
var archStoneMat=new THREE.MeshStandardMaterial({color:0x5a5a56,roughness:0.85,metalness:0.15});

// ===== 世界初始化 =====
function initWorld(){solids.clear();var w=mapWidth(),h=mapHeight();
  var floor=new THREE.Mesh(new THREE.PlaneGeometry(w*CELL,h*CELL),floorMaterial);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  var wallGeo=new THREE.BoxGeometry(CELL,3.4,CELL),topGeo=new THREE.BoxGeometry(CELL*0.92,0.65,CELL*0.92);
  var shardGeo=new THREE.IcosahedronGeometry(0.46,1),trapGeo=new THREE.CylinderGeometry(1.35,1.35,0.08,24),gateGeo=new THREE.BoxGeometry(CELL*0.86,2.55,0.28);
  var allCells=[];
  mazeRows.forEach(function(row,r){var chars=row.split("");chars.forEach(function(ch,c){var pos=cellToWorld(r,c),x=pos.x,z=pos.z;
    if(ch==="#"){solids.add(keyOf(r,c));var wall=new THREE.Mesh(wallGeo,wallMaterial);wall.position.set(x,1.7,z);wall.castShadow=true;wall.receiveShadow=true;scene.add(wall);var top=new THREE.Mesh(topGeo,wallTopMaterial);top.position.set(x,3.7,z);top.castShadow=true;scene.add(top)}
    if(ch==="S")startCell={r:r,c:c};if(ch==="E")exitCell={r:r,c:c};if(ch==="B")blastEnded.home={r:r,c:c};if(ch==="R")addMagicShard(r,c,shardGeo);if(ch==="T")addSnareTrap(r,c,trapGeo);if(ch==="G")addGate(r,c,gateGeo);if(ch===".")allCells.push({r:r,c:c})})});
  var mainPath=findMainPath(),gate1Idx=0,gate2Idx=0;
  if(mainPath&&mainPath.length>12){gate1Idx=Math.floor(mainPath.length*0.3);gate2Idx=Math.floor(mainPath.length*0.65);
    if(gate1Idx>2&&gate1Idx<mainPath.length-3){var gc1=mainPath[gate1Idx];if(!isWallCell(gc1.r,gc1.c)){addGate(gc1.r,gc1.c,gateGeo)}}
    if(gate2Idx>gate1Idx+6&&gate2Idx<mainPath.length-3){var gc2=mainPath[gate2Idx];if(!isWallCell(gc2.r,gc2.c)){addGate(gc2.r,gc2.c,gateGeo)}}}
  if(mainPath&&mainPath.length>6){placeSphinxForGate(0,0,gate1Idx||mainPath.length,mainPath);if(gate1Idx>0)placeSphinxForGate(1,gate1Idx,mainPath.length,mainPath)}
  if(sphinxes.length>0){var ki=Math.floor(Math.random()*sphinxes.length);sphinxes[ki].isKeySphinx=true}
  for(var si=sphinxes.length-1;si>=0;si--){if(!isCellReachable(sphinxes[si].r,sphinxes[si].c)){scene.remove(sphinxes[si].mesh);scene.remove(sphinxes[si].barrier);quizBarriers.splice(quizBarriers.indexOf(sphinxes[si]),1);sphinxes.splice(si,1)}}
  if(sphinxes.length>0&&!sphinxes.some(function(s){return s.isKeySphinx}))sphinxes[0].isKeySphinx=true;
  var de=[[-1,0],[1,0],[0,-1],[0,1]];var startExits=0;for(var d=0;d<4;d++){var nr=startCell.r+de[d][0],nc=startCell.c+de[d][1];if(!isWallCell(nr,nc)&&!isQuizBarrierCell(nr,nc)&&!isGateCell(nr,nc))startExits++}if(startExits<2)cleanBlockedExits(startCell.r,startCell.c);
  var scs=findShiftWallPositions();for(var i=0;i<Math.min(3,scs.length);i++)addShiftingWall(scs[i].r,scs[i].c,(Math.PI*2/3)*i+Math.random()*0.3);
  addTriwizardCup();placeTorches();
  if(mainPath&&mainPath.length>10){var mi=Math.floor(mainPath.length*0.4);if(mi<mainPath.length&&mi>3){var tc=mainPath[mi];if(!isWallCell(tc.r,tc.c)){var alr=traps.some(function(t){return t.r===tc.r&&t.c===tc.c});if(!alr)addSnareTrap(tc.r,tc.c,trapGeo)}}
    var ne=Math.floor(mainPath.length*0.82);for(var ti=ne;ti<mainPath.length-1;ti+=Math.max(3,Math.floor(mainPath.length*0.06))){var tc2=mainPath[Math.min(ti,mainPath.length-2)];if(!isWallCell(tc2.r,tc2.c)){var alr2=traps.some(function(t){return t.r===tc2.r&&t.c===tc2.c});if(!alr2)addSnareTrap(tc2.r,tc2.c,trapGeo)}}}
  var nes=findShiftWallPositionsNearExit();for(var ssi=0;ssi<Math.min(1,nes.length);ssi++)addShiftingWall(nes[ssi].r,nes[ssi].c,Math.random()*Math.PI*2);
  addEntranceArch();addSentinel();
  if(mainPath&&mainPath.length>5&&sentinel.path.length>0){var cp=mainPath[Math.floor(mainPath.length*0.5)];sentinel.path.splice(2,1,{r:cp.r,c:cp.c});sentinel._crossPath=cp}
  addBlastEndedSkrewt();addFireflies();addBuffs();addGoldenSnitch()}

function findNarrowCorridorCells(){var cands=[],h=mapHeight(),w=mapWidth(),MD=5;for(var r=1;r<h-1;r++)for(var c=1;c<w-1;c++){if(isWallCell(r,c))continue;var k=keyOf(r,c);if(k===keyOf(startCell.r,startCell.c)||k===keyOf(exitCell.r,exitCell.c))continue;var dS=Math.abs(r-startCell.r)+Math.abs(c-startCell.c),dE=Math.abs(r-exitCell.r)+Math.abs(c-exitCell.c);if(dS<MD||dE<MD)continue;var wc=0;if(isWallCell(r-1,c))wc++;if(isWallCell(r+1,c))wc++;if(isWallCell(r,c-1))wc++;if(isWallCell(r,c+1))wc++;if(wc>=2)cands.push({r:r,c:c})}for(var i=cands.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=cands[i];cands[i]=cands[j];cands[j]=t}return cands.slice(0,3)}
function findAdjacentOpenWall(r,c){var ds=[[-1,0],[1,0],[0,-1],[0,1]],h=mapHeight(),w=mapWidth();for(var d=0;d<ds.length;d++){var nr=r+ds[d][0],nc=c+ds[d][1];if(nr>=0&&nr<h&&nc>=0&&nc<w&&!isWallCell(nr,nc)){var dS=Math.abs(nr-startCell.r)+Math.abs(nc-startCell.c),dE=Math.abs(nr-exitCell.r)+Math.abs(nc-exitCell.c);if(dS>=5&&dE>=5)return{r:nr,c:nc}}}for(var d=0;d<ds.length;d++){var nr=r+ds[d][0],nc=c+ds[d][1];if(nr>=0&&nr<h&&nc>=0&&nc<w&&!isWallCell(nr,nc))return{r:nr,c:nc}}return{r:r,c:c+1}}
function findMainPath(){var h=mapHeight(),w=mapWidth(),vis=[],par=[];for(var r=0;r<h;r++){vis[r]=[];par[r]=[];for(var c=0;c<w;c++){vis[r][c]=false;par[r][c]=null}}var q=[{r:startCell.r,c:startCell.c}];vis[startCell.r][startCell.c]=true;var ds=[[-1,0],[1,0],[0,-1],[0,1]];while(q.length>0){var cur=q.shift();if(cur.r===exitCell.r&&cur.c===exitCell.c){var path=[];var node=cur;while(node){path.unshift(node);node=par[node.r][node.c]}return path}for(var d=0;d<4;d++){var nr=cur.r+ds[d][0],nc=cur.c+ds[d][1];if(nr<0||nr>=h||nc<0||nc>=w||vis[nr][nc])continue;if(solids.has(keyOf(nr,nc)))continue;vis[nr][nc]=true;par[nr][nc]=cur;q.push({r:nr,c:nc})}}return null}
function findBarrierOffMainPath(r,c,mp){var ds=[[-1,0],[1,0],[0,-1],[0,1]],ps={},h=mapHeight(),w=mapWidth();if(mp)mp.forEach(function(cell){ps[keyOf(cell.r,cell.c)]=true});for(var d=0;d<ds.length;d++){var nr=r+ds[d][0],nc=c+ds[d][1];if(nr>0&&nr<h-1&&nc>0&&nc<w-1&&!isWallCell(nr,nc)){var k=keyOf(nr,nc);if(!ps[k]&&k!==keyOf(startCell.r,startCell.c)&&k!==keyOf(exitCell.r,exitCell.c))return{r:nr,c:nc}}}for(var d=0;d<ds.length;d++){var nr=r+ds[d][0],nc=c+ds[d][1];if(nr>0&&nr<h-1&&nc>0&&nc<w-1&&!isWallCell(nr,nc))return{r:nr,c:nc}}return null}
function isCellReachable(tr,tc){var h=mapHeight(),w=mapWidth(),vis=[];for(var r=0;r<h;r++){vis[r]=[];for(var c=0;c<w;c++)vis[r][c]=false}var q=[{r:startCell.r,c:startCell.c}];vis[startCell.r][startCell.c]=true;var ds=[[-1,0],[1,0],[0,-1],[0,1]];while(q.length>0){var cur=q.shift();if(cur.r===tr&&cur.c===tc)return true;for(var d=0;d<4;d++){var nr=cur.r+ds[d][0],nc=cur.c+ds[d][1];if(nr<0||nr>=h||nc<0||nc>=w||vis[nr][nc])continue;if(solids.has(keyOf(nr,nc)))continue;if(isQuizBarrierCell(nr,nc))continue;vis[nr][nc]=true;q.push({r:nr,c:nc})}}return false}
function cleanBlockedExits(sr,sc){var ds=[[-1,0],[1,0],[0,-1],[0,1]];for(var d=0;d<4;d++){var nr=sr+ds[d][0],nc=sc+ds[d][1];if(nr<=0||nr>=mapHeight()-1||nc<=0||nc>=mapWidth()-1)continue;for(var i=quizBarriers.length-1;i>=0;i--){var qb=quizBarriers[i];if(qb.gateCell.r===nr&&qb.gateCell.c===nc){scene.remove(qb.barrier);scene.remove(qb.mesh);quizBarriers.splice(i,1);sphinxes.splice(sphinxes.indexOf(qb),1)}}for(var i=gates.length-1;i>=0;i--){if(gates[i].r===nr&&gates[i].c===nc){gates[i].open=true;if(gates[i].mesh)gates[i].mesh.visible=false}}}}
function placeSphinxForGate(gi,ps,pe,mp){if(!mp||gi>=gates.length)return;var cands=[],h=mapHeight(),w=mapWidth(),pathSet={};for(var i=ps;i<Math.min(pe,mp.length);i++)pathSet[keyOf(mp[i].r,mp[i].c)]=true;for(var r=2;r<h-2;r++)for(var c=2;c<w-2;c++){if(isWallCell(r,c))continue;var k=keyOf(r,c);if(k===keyOf(startCell.r,startCell.c)||k===keyOf(exitCell.r,exitCell.c))continue;var np=pathSet[k]||false;if(!np){var ds2=[[-1,0],[1,0],[0,-1],[0,1]];for(var d=0;d<4;d++){if(pathSet[keyOf(r+ds2[d][0],c+ds2[d][1])]){np=true;break}}}if(!np)continue;var wc=0;if(isWallCell(r-1,c))wc++;if(isWallCell(r+1,c))wc++;if(isWallCell(r,c-1))wc++;if(isWallCell(r,c+1))wc++;if(wc>=2)cands.push({r:r,c:c})}for(var i=cands.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=cands[i];cands[i]=cands[j];cands[j]=t}for(var ci=0;ci<Math.min(2,cands.length);ci++){var sc=cands[ci];var bc=findBarrierOffMainPath(sc.r,sc.c,mp);if(bc)addSphinx(sc.r,sc.c,bc,Math.floor(Math.random()*quizData.length),gi)}}
function findShiftWallPositionsNearExit(){var cands=[],h=mapHeight(),w=mapWidth();for(var r=2;r<h-2;r++)for(var c=2;c<w-2;c++){if(!isWallCell(r,c))continue;var dE=Math.abs(r-exitCell.r)+Math.abs(c-exitCell.c);if(dE>6)continue;var oa=(!isWallCell(r-1,c)&&!isWallCell(r+1,c))||(!isWallCell(r,c-1)&&!isWallCell(r,c+1));if(oa)cands.push({r:r,c:c})}for(var i=cands.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=cands[i];cands[i]=cands[j];cands[j]=t}return cands.slice(0,2)}
function findShiftWallPositions(){var cands=[],h=mapHeight(),w=mapWidth();for(var r=2;r<h-2;r++)for(var c=2;c<w-2;c++){if(!isWallCell(r,c))continue;var oa=(!isWallCell(r-1,c)&&!isWallCell(r+1,c))||(!isWallCell(r,c-1)&&!isWallCell(r,c+1));if(oa)cands.push({r:r,c:c})}for(var i=cands.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=cands[i];cands[i]=cands[j];cands[j]=t}return cands.slice(0,4)}

function addMagicShard(r,c,geo){var pos=cellToWorld(r,c);var mat=new THREE.MeshStandardMaterial({color:0xd8f8ff,emissive:0x58c8ff,emissiveIntensity:1.7,roughness:0.28});var mesh=new THREE.Mesh(geo,mat);mesh.position.set(pos.x,1.1,pos.z);mesh.castShadow=true;var light=new THREE.PointLight(0x83ddff,2.2,8);light.position.set(pos.x,1.6,pos.z);scene.add(mesh,light);magicShards.push({r:r,c:c,mesh:mesh,light:light,collected:false})}
function addSnareTrap(r,c,geo){var pos=cellToWorld(r,c);var mesh=new THREE.Mesh(geo,trapMaterial.clone());mesh.position.set(pos.x,0.08,pos.z);mesh.receiveShadow=true;scene.add(mesh);traps.push({r:r,c:c,mesh:mesh,cooldown:0})}
function addGate(r,c,geo){var pos=cellToWorld(r,c);var mesh=new THREE.Mesh(geo,gateMaterial);mesh.position.set(pos.x,1.45,pos.z-CELL*0.36);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);gates.push({r:r,c:c,mesh:mesh,open:false})}
function addSphinx(r,c,gc,qi,li){var pos=cellToWorld(r,c);var group=new THREE.Group();var body=new THREE.Mesh(new THREE.BoxGeometry(1.45,0.62,2.1),new THREE.MeshStandardMaterial({color:0x75634d,emissive:0x241a10,roughness:0.82}));var head=new THREE.Mesh(new THREE.SphereGeometry(0.52,18,12),new THREE.MeshStandardMaterial({color:0x9a8365,emissive:0x352714,roughness:0.78}));var glow=new THREE.PointLight(0xffdd8c,1.2,7);head.position.set(0,0.82,-0.7);glow.position.set(0,1.1,-0.65);group.add(body,head,glow);group.position.set(pos.x,0.62,pos.z);group.castShadow=true;scene.add(group);var gw=cellToWorld(gc.r,gc.c);var barrier=new THREE.Mesh(new THREE.BoxGeometry(CELL*0.9,2.35,0.22),new THREE.MeshStandardMaterial({color:0x78cfff,emissive:0x2588ff,emissiveIntensity:1.3,transparent:true,opacity:0.72,roughness:0.18}));barrier.position.set(gw.x,1.25,gw.z);barrier.castShadow=true;scene.add(barrier);var s={r:r,c:c,gateCell:gc,quizIndex:qi,mesh:group,barrier:barrier,solved:false,linkedGateIdx:li};sphinxes.push(s);quizBarriers.push(s)}
function addShiftingWall(r,c,phase){var pos=cellToWorld(r,c);var mat=new THREE.MeshStandardMaterial({color:0x375b2d,emissive:0x0d240f,transparent:true,opacity:0.88,roughness:0.86});var mesh=new THREE.Mesh(new THREE.BoxGeometry(CELL*0.95,3.25,CELL*0.95),mat);mesh.position.set(pos.x,-4,pos.z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);shiftingWalls.push({r:r,c:c,phase:phase,mesh:mesh,active:false,y:-4});solids.delete(keyOf(r,c))}
function addTriwizardCup(){var pos=cellToWorld(exitCell.r,exitCell.c);var cup=new THREE.Group();var gold=new THREE.MeshStandardMaterial({color:0xffd675,metalness:0.72,roughness:0.24,emissive:0x4a3510,emissiveIntensity:0.4});var blue=new THREE.MeshBasicMaterial({color:0x9ee9ff,transparent:true,opacity:0.85});var bowl=new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.48,0.72,32),gold);var stem=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.24,0.82,24),gold);var foot=new THREE.Mesh(new THREE.CylinderGeometry(0.72,0.42,0.2,32),gold);var lip=new THREE.Mesh(new THREE.TorusGeometry(0.9,0.06,10,36),gold);var lh=new THREE.Mesh(new THREE.TorusGeometry(0.48,0.045,10,26,Math.PI),gold);var rh=lh.clone();var flame=new THREE.Mesh(new THREE.CylinderGeometry(0,0.42,0.9,24),blue);bowl.position.y=1.45;stem.position.y=0.75;foot.position.y=0.26;lip.position.y=1.83;lh.position.set(-0.83,1.5,0);lh.rotation.z=Math.PI/2;rh.position.set(0.83,1.5,0);rh.rotation.z=-Math.PI/2;flame.position.y=2.36;flame.name="cupFlame";cup.add(bowl,stem,foot,lip,lh,rh,flame);cup.position.set(pos.x,0,pos.z);cup.name="triwizardCup";scene.add(cup);var cl=new THREE.PointLight(0x9ee9ff,3.5,10);cl.name="cupLight";cl.position.set(pos.x,2.2,pos.z);scene.add(cl);var pg=new THREE.SphereGeometry(0.05,8,8);for(var i=0;i<16;i++){var p=new THREE.Mesh(pg,blue.clone());p.position.set(pos.x,2+Math.random()*2.2,pos.z);scene.add(p);exitParticles.push({mesh:p,seed:Math.random()*100,radius:0.5+Math.random()*1.2,height:2+Math.random()*2.0})}}
function placeTorches(){var placed=[],ms=5,h=mapHeight(),w=mapWidth();for(var r=1;r<h-1;r++)for(var c=1;c<w-1;c++){if(isWallCell(r,c))continue;var k=keyOf(r,c);if(k===keyOf(startCell.r,startCell.c)||k===keyOf(exitCell.r,exitCell.c))continue;var ds=[[-1,0],[1,0],[0,-1],[0,1]];var wds=ds.filter(function(d){return isWallCell(r+d[0],c+d[1])});if(wds.length<1||wds.length>2)continue;var tc=placed.some(function(p){return Math.abs(p.r-r)+Math.abs(p.c-c)<ms});if(tc)continue;var dir=wds[0],pos=cellToWorld(r,c),ox=dir[1]*1.45,oz=dir[0]*1.45;createTorch(pos.x+ox,pos.z+oz,r,c);placed.push({r:r,c:c})}}
function createTorch(wx,wz,cr,cc){var group=new THREE.Group();var post=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.09,2.0,8),torchWoodMat);post.position.y=1.0;post.receiveShadow=true;group.add(post);var flame=new THREE.Mesh(new THREE.CylinderGeometry(0,0.1,0.35,8),torchFlameMat.clone());flame.position.y=2.15;flame.name="torchFlame";group.add(flame);var light=new THREE.PointLight(0xff9944,3.0,11);light.position.y=2.4;light.name="torchLight";group.add(light);group.position.set(wx,0,wz);scene.add(group);torches.push({group:group,light:light,flame:flame,baseIntensity:3.0,seed:Math.random()*100,cellR:cr,cellC:cc})}
function addEntranceArch(){var ep=cellToWorld(startCell.r,startCell.c);var cands=[{r:startCell.r-1,c:startCell.c},{r:startCell.r+1,c:startCell.c},{r:startCell.r,c:startCell.c-1},{r:startCell.r,c:startCell.c+1}];var ew=null;for(var i=0;i<cands.length;i++){if(solids.has(keyOf(cands[i].r,cands[i].c))){ew=cands[i];break}}if(!ew)return;solids.delete(keyOf(ew.r,ew.c));var wp=cellToWorld(ew.r,ew.c),ax=wp.x,az=wp.z;var ag=new THREE.Group();var pg=new THREE.BoxGeometry(0.35,4.2,0.35),lg=new THREE.BoxGeometry(CELL*0.9,0.3,0.4);var lp=new THREE.Mesh(pg,archStoneMat);lp.position.set(-1.55,2.1,0);lp.castShadow=true;var rp=new THREE.Mesh(pg,archStoneMat);rp.position.set(1.55,2.1,0);rp.castShadow=true;var ll=new THREE.Mesh(lg,archStoneMat);ll.position.set(0,4.25,0);ll.castShadow=true;ag.add(lp,rp,ll);ag.position.set(ax,0,az);var sp=cellToWorld(startCell.r,startCell.c);ag.lookAt(new THREE.Vector3(sp.x,1.5,sp.z));ag.name="entranceArch";scene.add(ag);var bg=new THREE.SphereGeometry(0.22,12,8),bm=new THREE.MeshStandardMaterial({color:0x3a3a3a,metalness:0.85,roughness:0.4});for(var j=-1;j<=1;j+=2){var br=new THREE.Mesh(bg,bm);br.position.set(j*1.55,3.95,0);ag.add(br);var fg=new THREE.PointLight(0xff7733,3.5,8);fg.position.set(j*1.55,4.1,0);ag.add(fg);entranceBraziers.push({light:fg,seed:Math.random()*100,baseY:4.1,parent:ag})}}
function addSentinel(){var body=new THREE.Mesh(new THREE.CapsuleGeometry(0.52,1.4,7,14),new THREE.MeshStandardMaterial({color:0x08070a,emissive:0x28304a,emissiveIntensity:0.7,roughness:0.55}));body.castShadow=true;var eye=new THREE.PointLight(0xbfd7ff,2.8,9);sentinel.path=[];var h=mapHeight(),w=mapWidth();for(var i=0;i<6;i++){for(var tries=0;tries<100;tries++){var pr=2+Math.floor(Math.random()*(h-4)),pc=2+Math.floor(Math.random()*(w-4));if(!isWallCell(pr,pc)){sentinel.path.push({r:pr,c:pc});break}}}if(sentinel.path.length===0)sentinel.path.push({r:Math.floor(h/2),c:Math.floor(w/2)});var first=cellToWorld(sentinel.path[0].r,sentinel.path[0].c);sentinel.position.set(first.x,1.02,first.z);body.position.copy(sentinel.position);eye.position.set(first.x,1.7,first.z);sentinel.mesh=body;sentinel.light=eye;scene.add(body,eye)}
function addBlastEndedSkrewt(){var pos=cellToWorld(blastEnded.home.r,blastEnded.home.c);var group=new THREE.Group();var shell=new THREE.Mesh(new THREE.SphereGeometry(0.72,18,12),new THREE.MeshStandardMaterial({color:0x3b2318,emissive:0x351008,roughness:0.64}));shell.scale.set(1.35,0.62,0.82);var tail=new THREE.Mesh(new THREE.CylinderGeometry(0,0.22,1,12),new THREE.MeshStandardMaterial({color:0xbb3b18,emissive:0x8a1208,roughness:0.45}));tail.position.z=0.92;tail.rotation.x=Math.PI/2;group.add(shell,tail);group.position.set(pos.x,0.62,pos.z);scene.add(group);var light=new THREE.PointLight(0xff5d28,1.2,5);light.position.set(pos.x,1,pos.z);scene.add(light);blastEnded.mesh=group;blastEnded.light=light;blastEnded.position.set(pos.x,0.62,pos.z)}
function addFireflies(){var mat=new THREE.MeshBasicMaterial({color:0xa9fff2}),geo=new THREE.SphereGeometry(0.03,6,6);for(var i=0;i<20;i++){var c=1+Math.floor(Math.random()*(mapWidth()-2)),r=1+Math.floor(Math.random()*(mapHeight()-2));if(isWallCell(r,c))continue;var pos=cellToWorld(r,c);var mote=new THREE.Mesh(geo,mat);mote.position.set(pos.x+(Math.random()-0.5)*CELL,1+Math.random()*2.2,pos.z+(Math.random()-0.5)*CELL);scene.add(mote);fireflies.push({mesh:mote,seed:Math.random()*100})}}
function addBuffs(){var de=findDeadEnds().filter(function(cell){var k=keyOf(cell.r,cell.c);return k!==keyOf(startCell.r,startCell.c)&&k!==keyOf(exitCell.r,exitCell.c)});var sh=de.slice().sort(function(){return Math.random()-0.5}),count=Math.min(sh.length,4),types=["time","scroll","shoes","time"];for(var i=0;i<count;i++){var cell=sh[i],type=types[i%types.length],pos=cellToWorld(cell.r,cell.c);var mat=new THREE.MeshStandardMaterial({color:type==="time"?0xffd56f:type==="scroll"?0xa9e5ff:0xb5ff90,emissive:type==="time"?0xb06a16:type==="scroll"?0x2f95ff:0x45c737,emissiveIntensity:1.45,roughness:0.36});var geo=type==="time"?new THREE.OctahedronGeometry(0.48):type==="scroll"?new THREE.BoxGeometry(0.75,0.24,0.42):new THREE.TorusGeometry(0.42,0.11,10,20);var mesh=new THREE.Mesh(geo,mat);mesh.position.set(pos.x,0.85,pos.z);mesh.castShadow=true;var light=new THREE.PointLight(mat.color,1.8,7);light.position.set(pos.x,1.3,pos.z);scene.add(mesh,light);buffs.push({r:cell.r,c:cell.c,type:type,mesh:mesh,light:light,collected:false})}}
function addGoldenSnitch(){var h=mapHeight(),w=mapWidth(),r=Math.floor(h/2)+Math.floor(Math.random()*5-2),c=Math.floor(w/2)+Math.floor(Math.random()*5-2);if(isWallCell(r,c)){r=Math.floor(h/2);c=Math.floor(w/2)}goldenSnitch.home={r:r,c:c};var pos=cellToWorld(r,c);var group=new THREE.Group();var body=new THREE.Mesh(new THREE.SphereGeometry(0.2,16,12),new THREE.MeshStandardMaterial({color:0xffd700,metalness:0.9,roughness:0.2,emissive:0x885500,emissiveIntensity:0.6}));group.add(body);var wg=new THREE.PlaneGeometry(0.35,0.12),wm=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.5,side:THREE.DoubleSide});var lw=new THREE.Mesh(wg,wm);lw.position.set(0.2,0.05,0);group.add(lw);var rw=new THREE.Mesh(wg,wm);rw.position.set(-0.2,0.05,0);group.add(rw);group.position.set(pos.x,1.8,pos.z);group.castShadow=true;group.name="goldenSnitch";scene.add(group);var light=new THREE.PointLight(0xffd700,2.5,8);light.position.copy(group.position);scene.add(light);goldenSnitch.mesh=group;goldenSnitch.light=light;goldenSnitch.position.copy(group.position);goldenSnitch.velocity.set((Math.random()-0.5)*3,0,(Math.random()-0.5)*3);var rc=worldToCell(pos.x,pos.z);if(isWallCell(rc.r,rc.c)){group.position.set(pos.x,1.8,pos.z+CELL*2);goldenSnitch.position.copy(group.position)}}

function updateJoystick(){if(!joystickEl||!joystickKnobEl)return;if(!joystickState.active){joystickEl.classList.add("joystick-hidden");joystickEl.classList.remove("joystick-active");return}joystickEl.classList.add("joystick-active");joystickEl.classList.remove("joystick-hidden");joystickEl.style.left=(joystickState.baseX-65)+"px";joystickEl.style.top=(joystickState.baseY-65)+"px";var dist=Math.hypot(joystickState.dx,joystickState.dy),cd=Math.min(dist,JOYSTICK_MAX_R),nx=dist>0?joystickState.dx/dist*cd:0,ny=dist>0?joystickState.dy/dist*cd:0;joystickKnobEl.style.transform="translate(calc(-50% + "+nx+"px), calc(-50% + "+ny+"px))"}
function getMoveInput(){var ix=0,iz=0;if(joystickState.active){var dist=Math.hypot(joystickState.dx,joystickState.dy);if(dist>8){var norm=Math.min(dist,JOYSTICK_MAX_R)/JOYSTICK_MAX_R;ix=joystickState.dx/dist*norm;iz=-joystickState.dy/dist*norm}}else{if(keys.has("ArrowUp")||keys.has("KeyW"))iz=1;if(keys.has("ArrowDown")||keys.has("KeyS"))iz=-1;if(keys.has("ArrowRight")||keys.has("KeyD"))ix=1;if(keys.has("ArrowLeft")||keys.has("KeyA"))ix=-1}return{x:ix,z:iz}}

function startGame(){if(!currentUser&&!isAdmin){authPanel.classList.remove("hidden");setMessage("请先登录或注册游戏ID",3);return}if(!currentHero&&!isAdmin){setMessage("请选择难度和角色后再踏入迷宫！",3);return}var diff=difficultySettings[currentDifficulty];var hero=currentHero?heroConfig[currentHero]:null;currentHero=hero;MAZE_SIZE=diff.size;START_TIME=diff.startTime;SENTINEL_SPD=diff.sentinelSpeed;SPHINX_DMG=diff.sphinxDmg;if(hero){WALK_SPEED=hero.speed;heroHP=hero.hp;heroWandDecay=hero.wandDecayMult||1;heroLightMult=hero.lightMult||1;heroDeadEndR=hero.deadEndRange||0}else{heroHP=100;heroWandDecay=1;heroLightMult=1;heroDeadEndR=0}weaponCooldown=0;if(currentHero){currentHero._vanishUntil=0}if(currentHero&&currentHero._smokeFx){for(var si=0;si<currentHero._smokeFx.length;si++){var sm=currentHero._smokeFx[si];scene.remove(sm);sm.geometry.dispose();sm.material.dispose()}currentHero._smokeFx=[]}cleanupWorld();generateMaze();initWorld();overlay.classList.add("hidden");resultPanel.classList.add("hidden");quizPanel.classList.add("hidden");gameState="ceremony";ceremonyAlpha=0;resetGame(true);var itd=('ontouchstart' in window)||(navigator.maxTouchPoints||0)>0;try{canvas.requestPointerLock()}catch(e){}if(itd){tryFullscreen()}ensureAudio();startAmbientDrone();setMessage("你站在迷宫入口。树篱在你前方分开，远处有微弱的蓝光在闪烁。",4);if(joystickEl){joystickEl.classList.add("joystick-hidden");joystickEl.classList.remove("joystick-active")}joystickState.active=false;cameraTouch.active=false}
function tryFullscreen(){var el=document.documentElement;if(el.requestFullscreen){el.requestFullscreen().catch(function(){})}else if(el.webkitRequestFullscreen){el.webkitRequestFullscreen()}else if(el.msRequestFullscreen){el.msRequestFullscreen()}}
function cleanupWorld(){var ps=new Set([scene,camera,lumos,lumos.target]);for(var i=scene.children.length-1;i>=0;i--){var child=scene.children[i];if(ps.has(child))continue;disposeR(child);scene.remove(child)}function disposeR(obj){if(ps.has(obj))return;if(obj.children){for(var i=obj.children.length-1;i>=0;i--){disposeR(obj.children[i]);obj.remove(obj.children[i])}}if(obj.geometry&&!obj.geometry._shared){try{obj.geometry.dispose()}catch(e){}}if(obj.dispose&&typeof obj.dispose==="function"&&!obj.geometry){try{obj.dispose()}catch(e){}}}magicShards.length=0;traps.length=0;sphinxes.length=0;gates.length=0;quizBarriers.length=0;fireflies.length=0;shiftingWalls.length=0;shiftingWallSolidCache={};deadEndMarks.length=0;buffs.length=0;exitParticles.length=0;torches.length=0;entranceBraziers.length=0;solids.clear();markerCells.clear()}
function setupCeremonyCamera(){var sp=cellToWorld(startCell.r,startCell.c);player.position.set(sp.x,PLAYER_HEIGHT,sp.z);camera.position.copy(player.position);yaw=Math.atan2(sp.x-0,sp.z-0);pitch=0;updateCamera()}
function resetGame(placeAtStart){timeLeft=START_TIME;health=heroHP;wandPower=1;sprintEnergy=1;isSprinting=false;dementorAura=false;snare=null;scrollCharges=0;cupKeyObtained=false;freeSprintUntil=0;guideUntil=0;currentQuiz=null;ceremonyAlpha=0;housePoints=0;velocity.set(0,0,0);yaw=-Math.PI/2;pitch=0;markerCells.clear();deadEndMarks.forEach(function(m){if(m.mesh)scene.remove(m.mesh)});deadEndMarks.length=0;sprintToggled=false;keyboardSprint=false;if(btnSprint)btnSprint.classList.remove("active","boosting");if(placeAtStart)setupCeremonyCamera();magicShards.forEach(function(s){s.collected=false;s.mesh.visible=true;s.light.visible=true});traps.forEach(function(t){t.cooldown=0;t.mesh.material.emissive.setHex(0x220600)});sphinxes.forEach(function(s){s.solved=false;s.mesh.visible=true;s.barrier.visible=true});gates.forEach(function(g){g.open=false;g.mesh.visible=true});buffs.forEach(function(b){b.collected=false;b.mesh.visible=true;b.light.visible=true});sentinel.target=0;sentinel.strikeTimer=0;sentinel.forcedChaseTimer=0;sentinel.banished=false;sentinel.banishTimer=0;clearPatronusBeam();clearGhostPath();guideUntil=0;if(sentinel.path.length>0&&sentinel.mesh){var f=cellToWorld(sentinel.path[0].r,sentinel.path[0].c);sentinel.position.set(f.x,1.02,f.z);sentinel.mesh.position.copy(sentinel.position);if(sentinel.light)sentinel.light.position.set(f.x,1.7,f.z)}var bh=cellToWorld(blastEnded.home.r,blastEnded.home.c);blastEnded.position.set(bh.x,0.62,bh.z);blastEnded.state="patrol";blastEnded.stunTimer=0;blastEnded.hitTimer=0;if(blastEnded.mesh){blastEnded.mesh.position.copy(blastEnded.position);if(blastEnded.light)blastEnded.light.position.set(bh.x,1,bh.z)}document.body.classList.remove("snared","dementor","damaged","shake");document.body.classList.add("ceremony");updateHud();setMessage("黑暗笼罩着树篱迷宫。左侧摇杆移动，右侧滑动环顾。",4)}

function animate(now){var dt=Math.min((now-lastTime)/1000,0.05);lastTime=now;var t=now/1000;if(weaponCooldown>0)weaponCooldown-=dt;
  if(currentHero&&currentHero._smokeFx){for(var si=currentHero._smokeFx.length-1;si>=0;si--){var s=currentHero._smokeFx[si];s.userData.life-=dt;s.material.opacity=Math.max(0,s.userData.life/2.5);s.scale.setScalar(1+(2.5-s.userData.life)*2);if(s.userData.life<=0){scene.remove(s);s.geometry.dispose();s.material.dispose();currentHero._smokeFx.splice(si,1)}}}updateSceneMotion(t,dt);if(gameState==="playing"){updatePlayer(dt);updateSentinel(dt,t);updateBlastEnded(dt,t);updateGameRules(dt,t);updateInteractionPrompt();updateExitAudio(t);updateStateAudio(t)}else if(gameState==="ceremony"){updateCeremony(dt,t);updatePlayer(dt);updateSentinel(dt,t);updateStateAudio(t)}else{updateSentinel(dt,t)}lumos.intensity=8.0+wandPower*8.0+Math.sin(t*0.012)*0.3;lumos.distance=(14+wandPower*16)*heroLightMult;lumos.angle=Math.PI/(4.5/heroLightMult);updateCamera(t);updateJoystick();renderer.render(scene,camera);requestAnimationFrame(animate)}
function updateCeremony(dt,t){ceremonyAlpha+=dt;var moved=Math.hypot(velocity.x,velocity.z)>0.4;if(moved||ceremonyAlpha>2.5){gameState="playing";document.body.classList.remove("ceremony");timeLeft=START_TIME;setMessage("你踏入了迷宫。远处传来火龙杯的低吟……",3.5);playChord([392,523,784],0.32,0.055)}}
function updateSceneMotion(t,dt){if(!magicShards.length&&!torches.length)return;magicShards.forEach(function(s,i){if(!s.mesh)return;s.mesh.rotation.y+=dt*1.8;s.mesh.position.y=1.1+Math.sin(t*2.6+i)*0.14;if(s.light)s.light.intensity=s.collected?0:1.6+Math.sin(t*4+i)*0.3});var cup=scene.getObjectByName("triwizardCup"),cf=scene.getObjectByName("cupFlame"),cl=scene.getObjectByName("cupLight");if(cup)cup.rotation.y+=dt*0.35;if(cf){cf.scale.setScalar(0.85+Math.sin(t*5.5)*0.15);cf.rotation.y+=dt*1.4}if(cl)cl.intensity=3.0+Math.sin(t*3.8)*0.8;var ew=cellToWorld(exitCell.r,exitCell.c);exitParticles.forEach(function(p){if(!p.mesh)return;var a=t*1.4+p.seed;p.mesh.position.x=ew.x+Math.cos(a)*p.radius;p.mesh.position.z=ew.z+Math.sin(a*0.9)*p.radius;p.mesh.position.y=p.height+Math.sin(a*1.7)*0.8;p.mesh.material.opacity=0.42+Math.sin(a*2.2)*0.28});torches.forEach(function(tc){if(!tc.light)return;var fl=0.82+Math.sin(t*12+tc.seed)*0.14+Math.sin(t*19+tc.seed)*0.08;tc.light.intensity=tc.baseIntensity*fl;if(tc.flame){tc.flame.scale.setScalar(0.85+Math.sin(t*14+tc.seed)*0.18);tc.flame.position.y=2.15+Math.sin(t*16+tc.seed)*0.04}});entranceBraziers.forEach(function(b){if(!b.light)return;b.light.intensity=3.0+Math.sin(t*11+b.seed)*0.8+Math.sin(t*17+b.seed)*0.3});fireflies.forEach(function(f){if(!f.mesh)return;f.mesh.position.y+=Math.sin(t*1.4+f.seed)*0.002;f.mesh.position.x+=Math.sin(t*0.8+f.seed)*0.003});shiftingWalls.forEach(function(w){if(!w.mesh)return;w.active=Math.sin(t*0.72+w.phase)>0.35;var ty=w.active?1.7:-4;w.y=w.y+(ty-w.y)*Math.min(dt*6.5,1);if(Math.abs(w.y-ty)<0.05)w.y=ty;w.mesh.position.y=w.y;w.mesh.visible=w.y>-3.7;w.mesh.material.opacity=Math.max(0.18,Math.min(0.92,(w.y+4)/5.7));var solid=w.active&&w.y>-0.2;shiftingWallSolidCache[keyOf(w.r,w.c)]=solid});deadEndMarks.forEach(function(m,i){if(!m.mesh)return;m.mesh.rotation.y+=dt*2.8;if(m.mat)m.mat.emissiveIntensity=0.9+Math.sin(t*7+i)*0.55});if(goldenSnitch.mesh){goldenSnitch.wanderTimer-=dt;if(goldenSnitch.wanderTimer<=0){goldenSnitch.wanderTimer=1.0+Math.random()*2;goldenSnitch.velocity.set((Math.random()-0.5)*8,Math.sin(t*4)*2,(Math.random()-0.5)*8)}var tp=player.position.clone();tp.y=0;var sp=goldenSnitch.position.clone();sp.y=0;var dtp=sp.distanceTo(tp);if(dtp<7){var away=sp.clone().sub(tp).normalize().multiplyScalar(8);goldenSnitch.velocity.lerp(away,dt*5)}var ns=goldenSnitch.position.clone().addScaledVector(goldenSnitch.velocity,dt);var sc=worldToCell(ns.x,ns.z);if(isWallCell(sc.r,sc.c)){goldenSnitch.velocity.x*=-0.8;goldenSnitch.velocity.z*=-0.8}else{goldenSnitch.position.copy(ns)}goldenSnitch.position.y=1.8+Math.sin(t*4)*0.5;goldenSnitch.mesh.position.copy(goldenSnitch.position);goldenSnitch.mesh.rotation.y+=dt*4;if(goldenSnitch.light)goldenSnitch.light.position.copy(goldenSnitch.position)}if(ghostPathMarkers.length>0){var fp=guideUntil>0?Math.max(0,(guideUntil-performance.now())/6000):0;for(var gi=0;gi<ghostPathMarkers.length;gi++){var gm=ghostPathMarkers[gi];if(gm.mat)gm.mat.opacity=0.15+fp*0.55}if(performance.now()>guideUntil){clearGhostPath();guideUntil=0}}buffs.forEach(function(b,i){if(!b.mesh||b.collected)return;b.mesh.rotation.y+=dt*1.4;b.mesh.position.y=0.85+Math.sin(t*2.2+i)*0.12;if(b.light)b.light.intensity=1.4+Math.sin(t*4.5+i)*0.35});if(patronusBeam.active){var el=(performance.now()-patronusBeam.startTime)/1000,prog=Math.min(el/patronusBeam.duration,1);var pos=new THREE.Vector3().lerpVectors(patronusBeam.origin,patronusBeam.target,prog);if(patronusBeam.mesh){patronusBeam.mesh.position.copy(pos);patronusBeam.mesh.lookAt(patronusBeam.target);patronusBeam.mesh.rotation.x+=Math.PI/2;patronusBeam.mesh.scale.y=Math.min(prog*8,8);patronusBeam.mesh.material.opacity=0.9*(1-prog*0.5)}if(patronusBeam.light)patronusBeam.light.position.copy(pos);if(patronusBeam.particles){for(var pi=0;pi<patronusBeam.particles.length;pi++){var pp=patronusBeam.particles[pi];var pProg=Math.min(prog+pi*0.04,1);pp.position.lerpVectors(patronusBeam.origin,patronusBeam.target,pProg);pp.position.x+=(Math.random()-0.5)*0.4;pp.position.y+=(Math.random()-0.5)*0.4;pp.material.opacity=0.8*(1-pProg)}}if(prog>=1){if(!sentinel.banished){sentinel.banished=true;sentinel.banishTimer=15+Math.random()*10;housePoints+=50;setMessage("呼神护卫击中了摄魂怪！+50 分。它暂时消散了。",3);playChord([523,784,1046],0.3,0.08);dementorAura=false;document.body.classList.remove("dementor","shake")}clearPatronusBeam()}}}
function updatePlayer(dt){var forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),input=new THREE.Vector3();var mi=getMoveInput();if(mi.z!==0)input.add(forward.clone().multiplyScalar(mi.z));if(mi.x!==0)input.add(right.clone().multiplyScalar(mi.x));if(input.lengthSq()>0)input.normalize();var ws=keys.has("ShiftLeft")||keys.has("ShiftRight")||sprintToggled,fs=performance.now()<freeSprintUntil,cs=ws&&!dementorAura&&input.lengthSq()>0&&(sprintEnergy>0.05||fs);isSprinting=cs;if(btnSprint){if(fs)btnSprint.classList.add("boosting");else btnSprint.classList.remove("boosting")}var sl=snare?0.3:1,sb=cs?SPRINT_SPEED:1,target=input.multiplyScalar(WALK_SPEED*sb*sl);velocity.x=THREE.MathUtils.damp(velocity.x,target.x,12,dt);velocity.z=THREE.MathUtils.damp(velocity.z,target.z,12,dt);if(cs&&!fs&&input.lengthSq()>0.01)sprintEnergy=Math.max(0,sprintEnergy-dt*SPRINT_DRAIN);else if(!cs||input.lengthSq()<0.01)sprintEnergy=Math.min(1,sprintEnergy+dt*SPRINT_RECOVERY);moveWithCollision(velocity.x*dt,velocity.z*dt);player.cell=worldToCell(player.position.x,player.position.z);var moving=Math.hypot(velocity.x,velocity.z)>0.65,fg=isSprinting?260:450;if(moving&&performance.now()-lastFootstep>fg){lastFootstep=performance.now();playFootstep(isSprinting?0.048:0.028)}}
function moveWithCollision(dx,dz){var nx=player.position.x+dx;if(!checkXCollision(nx,player.position.z,dx))player.position.x=nx;else velocity.x=0;var nz=player.position.z+dz;if(!checkZCollision(player.position.x,nz,dz))player.position.z=nz;else velocity.z=0}
function checkXCollision(x,z,dx){var s=dx>0?1:-1;return isSolidSingle(x+s*PLAYER_RADIUS,z)}
function checkZCollision(x,z,dz){var s=dz>0?1:-1;return isSolidSingle(x,z+s*PLAYER_RADIUS)}
function isSolidSingle(px,pz){var cell=worldToCell(px,pz);if(cell.r<0||cell.c<0||cell.r>=mapHeight()||cell.c>=mapWidth())return true;if(solids.has(keyOf(cell.r,cell.c)))return true;if(isGateCell(cell.r,cell.c))return true;if(isQuizBarrierCell(cell.r,cell.c))return true;return!!shiftingWallSolidCache[keyOf(cell.r,cell.c)]}
function updateSentinel(dt,t){if(!sentinel.mesh)return;if(sentinel.banished){var dt2=Math.hypot(player.position.x-cellToWorld(exitCell.r,exitCell.c).x,player.position.z-cellToWorld(exitCell.r,exitCell.c).z);var ne2=dt2<CELL*8;sentinel.banishTimer-=dt*(ne2?1.8:1.0);sentinel.mesh.visible=false;if(sentinel.light)sentinel.light.visible=false;if(sentinel.banishTimer<=0)respawnSentinel();return}if(sentinel._frozen&&performance.now()<sentinel._frozen){sentinel.mesh.visible=true;if(sentinel.light)sentinel.light.visible=true;sentinel.forcedChaseTimer=0;dementorAura=false;return}sentinel.mesh.visible=true;if(sentinel.light)sentinel.light.visible=true;var dtE=Math.hypot(player.position.x-cellToWorld(exitCell.r,exitCell.c).x,player.position.z-cellToWorld(exitCell.r,exitCell.c).z);var ne=dtE<CELL*8,et=ne?1.6:1.0;var pf=new THREE.Vector3(player.position.x,1.02,player.position.z);var dist=sentinel.position.distanceTo(pf);var sees=dist<(ne?13:10)&&hasLineOfSight(sentinel.position,player.position);dementorAura=dist<(ne?6:5)&&sees;sentinel.forcedChaseTimer=Math.max(0,sentinel.forcedChaseTimer-dt);var tp;if(sees||sentinel.forcedChaseTimer>0){tp=pf;if(performance.now()-lastDementorTone>1100){playTone(68,0.2,"sawtooth",dementorAura?0.06:0.03);lastDementorTone=performance.now()}}else{if(sentinel.path.length===0)return;var cell=sentinel.path[sentinel.target];var w=cellToWorld(cell.r,cell.c);tp=new THREE.Vector3(w.x,1.02,w.z);if(sentinel.position.distanceTo(tp)<0.25)sentinel.target=(sentinel.target+1)%sentinel.path.length}var dir=tp.clone().sub(sentinel.position);if(dir.lengthSq()>0.001){dir.normalize();sentinel.position.addScaledVector(dir,dt*(sees||sentinel.forcedChaseTimer>0?2.8*et*SENTINEL_SPD:1.1*Math.max(0.5,SENTINEL_SPD)))}sentinel.mesh.position.copy(sentinel.position);sentinel.light.position.set(sentinel.position.x,1.72,sentinel.position.z);sentinel.mesh.rotation.y=Math.atan2(dir.x,dir.z);sentinel.light.intensity=dementorAura?4.4+Math.sin(t*8):2.6;sentinel.strikeTimer=Math.max(0,sentinel.strikeTimer-dt*et);if(dist<(ne?1.5:1.25)&&sentinel.strikeTimer<=0){sentinel.strikeTimer=1.0;damage(DEMENTOR_DMG,"摄魂怪的寒意穿过胸口。","dementor");playTone(46,0.2,"square",0.065);playNoiseBurst(0.18,0.03)}document.body.classList.toggle("dementor",dementorAura);document.body.classList.toggle("shake",dementorAura||blastEnded.state==="charge")}
function respawnSentinel(){sentinel.banished=false;sentinel.banishTimer=0;sentinel.forcedChaseTimer=0;sentinel.strikeTimer=0;var h=mapHeight(),w=mapWidth();for(var a=0;a<200;a++){var pr=2+Math.floor(Math.random()*(h-4)),pc=2+Math.floor(Math.random()*(w-4));if(!isWallCell(pr,pc)){var pos=cellToWorld(pr,pc);var dist=Math.hypot(pos.x-player.position.x,pos.z-player.position.z);if(dist>12){sentinel.position.set(pos.x,1.02,pos.z);sentinel.mesh.position.copy(sentinel.position);if(sentinel.light)sentinel.light.position.set(pos.x,1.7,pos.z);sentinel.mesh.visible=true;if(sentinel.light)sentinel.light.visible=true;sentinel.path=[];sentinel.target=0;if(sentinel._crossPath)sentinel.path.push({r:sentinel._crossPath.r,c:sentinel._crossPath.c});for(var i=0;i<5;i++){var rr=2+Math.floor(Math.random()*(h-4)),rc=2+Math.floor(Math.random()*(w-4));if(!isWallCell(rr,rc))sentinel.path.push({r:rr,c:rc})}if(sentinel.path.length===0)sentinel.path.push({r:pr,c:pc});setMessage("远处又响起了摄魂怪的低语……它回来了。",3);playTone(55,0.15,"sawtooth",0.04);return}}}sentinel.mesh.visible=true;if(sentinel.light)sentinel.light.visible=true}
function updateBlastEnded(dt,t){if(!blastEnded.mesh)return;var pf=new THREE.Vector3(player.position.x,0.62,player.position.z);var dist=blastEnded.position.distanceTo(pf);blastEnded.hitTimer=Math.max(0,blastEnded.hitTimer-dt);if(blastEnded.state==="stunned"){blastEnded.stunTimer-=dt;if(blastEnded.stunTimer<=0)blastEnded.state="patrol"}else if(blastEnded.state==="charge"){var nx=blastEnded.position.clone().addScaledVector(blastEnded.chargeDir,dt*7.5);if(isSolidWorldCollideAll(nx.x,nx.z)||blastEnded.position.distanceTo(blastEnded.chargeTarget)<0.45){blastEnded.state="stunned";blastEnded.stunTimer=2;playNoiseBurst(0.12,0.06)}else{blastEnded.position.copy(nx)}}else{blastEnded.patrolPhase+=dt;var home=cellToWorld(blastEnded.home.r,blastEnded.home.c);blastEnded.position.x=home.x+Math.sin(blastEnded.patrolPhase*0.55)*1.2;blastEnded.position.z=home.z+Math.cos(blastEnded.patrolPhase*0.45)*0.8;if(isSprinting&&dist<10&&hasLineOfSight(blastEnded.position,player.position)){blastEnded.state="charge";blastEnded.chargeTarget.copy(pf);blastEnded.chargeDir.copy(pf).sub(blastEnded.position).normalize();setMessage("炸尾螺听见了疾跑声，正朝声音暴冲！",2);playNoiseBurst(0.16,0.1)}}if(dist<1.15&&blastEnded.hitTimer<=0){blastEnded.hitTimer=1.5;damage(BLAST_DMG,"炸尾螺狠狠撞上你。");blastEnded.state="stunned";blastEnded.stunTimer=2}blastEnded.mesh.position.copy(blastEnded.position);blastEnded.light.position.set(blastEnded.position.x,1,blastEnded.position.z);blastEnded.mesh.rotation.y=Math.atan2(blastEnded.chargeDir.x,blastEnded.chargeDir.z);blastEnded.light.intensity=blastEnded.state==="charge"?3.2+Math.sin(t*18):1.0}
function updateGameRules(dt){timeLeft-=dt;wandPower=Math.max(WAND_MIN,wandPower-dt*WAND_DECAY*heroWandDecay);var tc=traps.find(function(t){return t.r===player.cell.r&&t.c===player.cell.c});if(tc&&!snare){snare={trap:tc,presses:0,damageTimer:0};tc.mesh.material.emissive.setHex(0x3f0d06);document.body.classList.add("snared");setMessage("魔鬼网缠住了你！快速连续点击互动按钮施展火焰熊熊。",4);playTone(118,0.16,"triangle",0.06);playNoiseBurst(0.24,0.045)}if(snare){snare.damageTimer+=dt;if(snare.damageTimer>=1){snare.damageTimer=0;damage(SNARE_DMG,"魔鬼网勒紧了脚踝，点击互动按钮挣脱："+snare.presses+"/5")}}var cr=shiftingWalls.some(function(w){return isShiftingWallSolid(w)&&w.r===player.cell.r&&w.c===player.cell.c});if(cr)damage(WALL_CRUSH_DMG*dt,"位移树篱从地下升起，正在挤压你。");collectNearbyItems();if(timeLeft<=0)endGame(false,"时间耗尽，被迷宫吞噬。");if(health<=0)endGame(false,"你倒在了黑暗的树篱中。");updateHud()}
function interact(){if(gameState==="quiz")return;if(gameState!=="playing")return;if(snare){snare.presses+=1;playTone(260+snare.presses*55,0.05,"square",0.05);playNoiseBurst(0.05,0.02);if(snare.presses===1)speakSpell("火焰熊熊！");setMessage("火焰熊熊："+snare.presses+"/5",0.8);if(snare.presses>=5){snare.trap.mesh.material.emissive.setHex(0x220600);snare=null;document.body.classList.remove("snared");setMessage("火光烧断藤蔓，你挣脱了魔鬼网。",2.4);playChord([330,494,740],0.16,0.05)}return}if(canCastPatronus()){castPatronus();return}var cd=distanceToCell(exitCell.r,exitCell.c);if(cd<3.5){if(!cupKeyObtained){setMessage("火龙杯被强大的魔法封印保护着。找到守钥的斯芬克斯才能解锁。",3);return}endGame(true,"你握住火龙杯，蓝白色火焰撕开了迷宫的出口。三强争霸赛的冠军诞生了！");return}var sphinx=sphinxes.find(function(s){return!s.solved&&distanceToCell(s.r,s.c)<2.8});if(sphinx){openQuiz(sphinx);return}setMessage("附近没有可互动的魔法痕迹。卷轴 "+scrollCharges+" 个 | 疾跑 "+Math.round(sprintEnergy*100)+"%",1.5)}
function useWeapon(){if(gameState!=="playing"&&gameState!=="quiz")return;if(!currentHero||!currentHero.weapon||weaponCooldown>0){if(weaponCooldown>0)setMessage("武器冷却中: "+Math.ceil(weaponCooldown)+"秒",1);return}if(currentHero.weapon()){weaponCooldown=currentHero.weaponCD;}}
function canCastPatronus(){if(!sentinel.mesh||sentinel.banished||patronusBeam.active)return false;var pf=new THREE.Vector3(player.position.x,1.02,player.position.z);var dist=sentinel.position.distanceTo(pf);if(dist>10||!hasLineOfSight(player.position,sentinel.position))return false;return isReticleOnTarget(sentinel.position,1.4)}
function isReticleOnTarget(tp,rad){var cd=new THREE.Vector3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));cd.normalize();var cp=player.position.clone();cp.y=PLAYER_HEIGHT;var oc=cp.clone().sub(tp);var a=cd.dot(cd),b=2*oc.dot(cd),c=oc.dot(oc)-rad*rad;return b*b-4*a*c>=0}
function castPatronus(){speakSpell("呼神护卫！");var orig=new THREE.Vector3(player.position.x,PLAYER_HEIGHT*0.7,player.position.z);var tgt=sentinel.position.clone();tgt.y=1.3;var bg=new THREE.CylinderGeometry(0.08,0.15,1,8),bm=new THREE.MeshBasicMaterial({color:0xffdd66,transparent:true,opacity:0.9});var beam=new THREE.Mesh(bg,bm);beam.position.copy(orig);beam.castShadow=false;scene.add(beam);var glow=new THREE.PointLight(0xffdd66,8,18);glow.position.copy(orig);scene.add(glow);var parts=[],pg=new THREE.SphereGeometry(0.06,6,6);for(var i=0;i<12;i++){var p=new THREE.Mesh(pg,bm.clone());p.position.copy(orig);scene.add(p);parts.push(p)}patronusBeam.active=true;patronusBeam.mesh=beam;patronusBeam.light=glow;patronusBeam.particles=parts;patronusBeam.target.copy(tgt);patronusBeam.origin.copy(orig);patronusBeam.startTime=performance.now();playChord([392,523,659,784],0.35,0.07);playTone(1046,0.25,"sine",0.05,0.1)}
function speakSpell(text){try{if(typeof SpeechSynthesisUtterance!=='undefined'&&'speechSynthesis' in window){window.speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=0.95;u.pitch=1.25;u.volume=1.0;window.speechSynthesis.speak(u)}}catch(e){}}
function openQuiz(s){currentQuiz=s;gameState="quiz";try{document.exitPointerLock()}catch(e){}var d=quizData[s.quizIndex%quizData.length];quizQuestionEl.textContent=d.question;quizOptionsEl.innerHTML="";var order=[];for(var oi=0;oi<d.options.length;oi++)order.push(oi);for(var oi=order.length-1;oi>0;oi--){var j=Math.floor(Math.random()*(oi+1));var t=order[oi];order[oi]=order[j];order[j]=t}currentQuiz._order=order;currentQuiz._data=d;order.forEach(function(origIdx){var b=document.createElement("button");b.type="button";b.textContent=d.options[origIdx];b.addEventListener("click",function(){answerQuiz(origIdx)});quizOptionsEl.appendChild(b)});quizPanel.classList.remove("hidden");setMessage("斯芬克斯挡住去路。答题期间迷宫的时间仍在流逝。",3)}
function answerQuiz(i){if(!currentQuiz)return;var d=quizData[currentQuiz.quizIndex%quizData.length];quizPanel.classList.add("hidden");gameState="playing";try{canvas.requestPointerLock()}catch(e){}if(i===d.answer){currentQuiz.solved=true;if(currentQuiz.mesh)currentQuiz.mesh.visible=false;housePoints+=30;openSphinxPassage(currentQuiz);setMessage("斯芬克斯低头让路，前方的魔法屏障消散。一道栅栏门轰然开启！",3);playChord([523,659,988],0.22,0.055);speakSpell("答对了！")}else{damage(SPHINX_DMG,"答案错误。斯芬克斯发出尖啸，摄魂怪立刻追来。","sphinx");sentinel.forcedChaseTimer=9;playNoiseBurst(0.24,0.12)}currentQuiz=null}
function openSphinxPassage(s){s.barrier.visible=false;if(s.linkedGateIdx!==undefined&&s.linkedGateIdx>=0&&s.linkedGateIdx<gates.length){var g=gates[s.linkedGateIdx];g.open=true;if(g.mesh)g.mesh.visible=false}if(s.isKeySphinx){cupKeyObtained=true;setMessage("斯芬克斯消散时掉落了一把古老的钥匙——火龙杯的封印解除了！",4);playChord([440,554,659,880],0.4,0.08)}}
function markDeadEnd(){if(gameState!=="playing")return;var cell=player.cell,targetCell=null;var range=heroDeadEndR||0;if(range>0){for(var dr=-range;dr<=range&&!targetCell;dr++){for(var dc=-range;dc<=range&&!targetCell;dc++){if(dr===0&&dc===0)continue;var nr=player.cell.r+dr,nc=player.cell.c+dc;if(nr<0||nc<0||nr>=mapHeight()||nc>=mapWidth())continue;if(isWallCell(nr,nc))continue;if(markerCells.has(keyOf(nr,nc)))continue;if(isDeadEndCell(nr,nc))targetCell={r:nr,c:nc}}}}if(!targetCell&&!isDeadEndCell(cell.r,cell.c)){if(range>0)setMessage("附近也没有发现死胡同。",1.4);else setMessage("这里还不是死胡同。把标记留给真正容易迷路的位置。",2);return}var tr=targetCell?targetCell.r:cell.r,tc=targetCell?targetCell.c:cell.c,k=keyOf(tr,tc);if(markerCells.has(k)){setMessage("这里已经留下红色死胡同标记。",1.4);return}var pos=cellToWorld(tr,tc);var mat=new THREE.MeshStandardMaterial({color:0xff2b2b,emissive:0xff1111,emissiveIntensity:1.2,roughness:0.3});var group=new THREE.Group();var a=new THREE.Mesh(new THREE.BoxGeometry(1.45,0.045,0.18),mat);var b=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.045,1.45),mat);group.add(a,b);group.position.set(pos.x,0.06,pos.z);scene.add(group);markerCells.add(k);deadEndMarks.push({r:tr,c:tc,mesh:group,mat:mat});housePoints+=10;setMessage("红色十字星已标记：这是一条死胡同。+10 分",2);playTone(196,0.08,"square",0.04);speakSpell("标记死路！")}
function useScroll(){if(gameState!=="playing")return;if(scrollCharges<=0){setMessage("没有透视卷轴。在死胡同中寻找道具吧。",1.6);return}scrollCharges-=1;guideUntil=performance.now()+6000;showGhostPath();playChord([294,440,880],0.2,0.045);speakSpell("急急现形！")}
var ghostPathMarkers=[];
function showGhostPath(){clearGhostPath();var path=bfsShortestPath(player.cell.r,player.cell.c,exitCell.r,exitCell.c);if(!path||path.length<2)return;var mg=new THREE.RingGeometry(0.25,0.35,8),mm=new THREE.MeshBasicMaterial({color:0x88ccff,transparent:true,opacity:0.7,side:THREE.DoubleSide});var step=Math.max(1,Math.floor(path.length/15));for(var i=0;i<path.length;i+=step){var cell=path[i],pos=cellToWorld(cell.r,cell.c);var m=new THREE.Mesh(mg,mm.clone());m.rotation.x=-Math.PI/2;m.position.set(pos.x,0.08,pos.z);scene.add(m);ghostPathMarkers.push({mesh:m,mat:m.material})}var ep=cellToWorld(exitCell.r,exitCell.c);var pg=new THREE.CylinderGeometry(0.15,0.15,4,8);var p=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({color:0x66bbff,transparent:true,opacity:0.6}));p.position.set(ep.x,2,ep.z);p.name="ghostPillar";scene.add(p);ghostPathMarkers.push({mesh:p,mat:p.material,isPillar:true})}
function clearGhostPath(){for(var i=0;i<ghostPathMarkers.length;i++){var m=ghostPathMarkers[i];scene.remove(m.mesh);m.mesh.geometry.dispose();m.mat.dispose()}ghostPathMarkers.length=0}
function bfsShortestPath(sr,sc,er,ec){var h=mapHeight(),w=mapWidth(),vis=[],par=[];for(var r=0;r<h;r++){vis[r]=[];par[r]=[];for(var c=0;c<w;c++){vis[r][c]=false;par[r][c]=null}}var q=[{r:sr,c:sc}];vis[sr][sc]=true;var ds=[[-1,0],[1,0],[0,-1],[0,1]];while(q.length>0){var cur=q.shift();if(cur.r===er&&cur.c===ec){var path=[];var node=cur;while(node){path.unshift(node);node=par[node.r][node.c]}return path}for(var d=0;d<4;d++){var nr=cur.r+ds[d][0],nc=cur.c+ds[d][1];if(nr<0||nr>=h||nc<0||nc>=w||vis[nr][nc])continue;if(solids.has(keyOf(nr,nc)))continue;if(isGateCell(nr,nc))continue;if(isQuizBarrierCell(nr,nc))continue;vis[nr][nc]=true;par[nr][nc]=cur;q.push({r:nr,c:nc})}}return null}
function collectNearbyItems(){if(goldenSnitch.mesh&&goldenSnitch.mesh.visible){var sd=new THREE.Vector3(player.position.x,0,player.position.z).distanceTo(new THREE.Vector3(goldenSnitch.position.x,0,goldenSnitch.position.z));if(sd<1.5){goldenSnitch.mesh.visible=false;if(goldenSnitch.light)goldenSnitch.light.visible=false;timeLeft=Math.min(START_TIME,timeLeft+30);housePoints+=100;setMessage("你抓住了金色飞贼！+100 分，+30 秒！",3);playChord([392,523,659,784,1046],0.3,0.06);speakSpell("抓住了金色飞贼！格兰芬多加一百分！");setTimeout(function(){respawnSnitch()},10000)}}magicShards.forEach(function(s){if(s.collected||distanceToCell(s.r,s.c)>1.35)return;s.collected=true;s.mesh.visible=false;s.light.visible=false;wandPower=Math.min(1,wandPower+0.4);timeLeft=Math.min(START_TIME,timeLeft+15);housePoints+=20;setMessage("魔力碎片恢复了荧光，+20 分，并争取到一点时间。",2.2);playChord([622,932],0.12,0.05)});buffs.forEach(function(b){if(b.collected||distanceToCell(b.r,b.c)>1.35)return;b.collected=true;b.mesh.visible=false;b.light.visible=false;if(b.type==="time"){timeLeft=Math.min(START_TIME,timeLeft+35);setMessage("时间沙漏倒转，倒计时恢复 35 秒。",2.5)}else if(b.type==="scroll"){scrollCharges+=1;setMessage("获得透视卷轴。使用后地面将短暂显示通往出口的路径。",3)}else{freeSprintUntil=performance.now()+10000;sprintEnergy=1;setMessage("疾跑鞋生效：10 秒内疾跑不消耗体力。",3)}playChord([392,587,784],0.15,0.045)});if(guideUntil>0&&performance.now()>guideUntil){clearGhostPath();guideUntil=0}}
function updateInteractionPrompt(){var ns=sphinxes.some(function(s){return!s.solved&&distanceToCell(s.r,s.c)<2.8});var nc=distanceToCell(exitCell.r,exitCell.c)<3.5;var cp=canCastPatronus();if(snare)interactionEl.textContent="点击互动 火焰熊熊 "+snare.presses+"/5";else if(nc&&!cupKeyObtained)interactionEl.textContent="需要钥匙 找守钥斯芬克斯";else if(nc)interactionEl.textContent="点击互动 锁定火龙杯";else if(ns)interactionEl.textContent="点击互动 回答斯芬克斯";else if(cp)interactionEl.textContent="点击互动 呼神护卫！";else interactionEl.textContent="";if(messageEl.dataset.temporary==="done"){messageEl.dataset.temporary="";messageEl.textContent="卷轴 "+scrollCharges+" | 疾跑 "+Math.round(sprintEnergy*100)+"% | 标记 "+deadEndMarks.length+" 处"}}
function updateExitAudio(t){if(!audioCtx||t-lastExitChime<3.2)return;lastExitChime=t;var exit=cellToWorld(exitCell.r,exitCell.c);var dx=exit.x-player.position.x,dz=exit.z-player.position.z;var dist=Math.hypot(dx,dz);var vol=Math.max(0.018,Math.min(0.14,0.14-dist/380));var pan=Math.max(-1,Math.min(1,Math.sin(Math.atan2(dx,dz)-yaw)));playDirectionalChord([261.63,392,523.25],0.85,vol,pan)}
function updateStateAudio(t){if(!audioCtx)return;if(t-lastLumosCrackle>5+wandPower*3){lastLumosCrackle=t;playTone(880+Math.random()*140,0.03,"triangle",0.015);playTone(1320+Math.random()*160,0.024,"sine",0.01,0.03)}if(snare&&t-lastSnarePulse>0.72){lastSnarePulse=t;playTone(88,0.1,"sawtooth",0.03);playNoiseBurst(0.07,0.015)}if(t-lastTorchCrackle>3.5+Math.random()*4){lastTorchCrackle=t;playNoiseBurst(0.03,0.012+Math.random()*0.015)}if(ambientDrone&&ambientDrone.gain){var target=dementorAura?0.032:snare?0.024:0.013;ambientDrone.gain.gain.setTargetAtTime(target,audioCtx.currentTime,0.35)}}
function updateCamera(t){camera.position.copy(player.position);camera.rotation.y=yaw;camera.rotation.x=pitch;if(dementorAura){camera.position.x+=Math.sin((t||0)*27)*0.022;camera.position.y+=Math.cos((t||0)*19)*0.015}}
function respawnSnitch(){var h=mapHeight(),w=mapWidth();for(var a=0;a<50;a++){var r=3+Math.floor(Math.random()*(h-6)),c=3+Math.floor(Math.random()*(w-6));if(!isWallCell(r,c)){var pos=cellToWorld(r,c);var dist=Math.hypot(pos.x-player.position.x,pos.z-player.position.z);if(dist>6){goldenSnitch.position.set(pos.x,1.8,pos.z);goldenSnitch.mesh.position.copy(goldenSnitch.position);if(goldenSnitch.light)goldenSnitch.light.position.copy(goldenSnitch.position);goldenSnitch.mesh.visible=true;if(goldenSnitch.light)goldenSnitch.light.visible=true;goldenSnitch.home={r:r,c:c};goldenSnitch.velocity.set((Math.random()-0.5)*5,0,(Math.random()-0.5)*5);setMessage("金色飞贼重新出现了！快抓住它！",2.5);return}}}}
function clearPatronusBeam(){if(patronusBeam.mesh){scene.remove(patronusBeam.mesh);patronusBeam.mesh.geometry.dispose();patronusBeam.mesh.material.dispose()}if(patronusBeam.light)scene.remove(patronusBeam.light);if(patronusBeam.particles){for(var i=0;i<patronusBeam.particles.length;i++){var p=patronusBeam.particles[i];scene.remove(p);p.geometry.dispose();p.material.dispose()}}patronusBeam.active=false;patronusBeam.mesh=null;patronusBeam.light=null;patronusBeam.particles=null}
function updateHud(){timeEl.textContent=formatTime(timeLeft);healthEl.textContent=""+Math.max(0,Math.ceil(health));wandEl.textContent=Math.round(wandPower*100)+"%";var se=document.querySelector("#score");if(se)se.textContent=""+housePoints;if(deadEndCountEl)deadEndCountEl.textContent=""+deadEndMarks.length;var sf=document.querySelector("#stamina-fill");if(sf){var pct=Math.round(sprintEnergy*100);sf.style.width=pct+"%";sf.className=freeSprintUntil>performance.now()?"boosting":pct<25?"low":""}if(btnWeapon&&currentHero){var cdPct=currentHero.weaponCD>0?(weaponCooldown/currentHero.weaponCD)*100:0;btnWeapon.textContent=weaponCooldown>0?Math.ceil(weaponCooldown)+"s":"武器R";btnWeapon.style.setProperty("--cooldown-pct",(100-cdPct)+"%");if(weaponCooldown>0)btnWeapon.classList.add("cooldown");else btnWeapon.classList.remove("cooldown")}}
function damage(amount,text,type){if(gameState!=="playing"&&gameState!=="quiz")return;if(currentHero&&currentHero._vanishUntil&&performance.now()<currentHero._vanishUntil)return;if(currentHero&&currentHero.passive)amount=currentHero.passive(amount,type||"");health=Math.max(0,health-amount);setMessage(text,1.5);document.body.classList.add("damaged");window.clearTimeout(damage._timer);damage._timer=window.setTimeout(function(){document.body.classList.remove("damaged")},140)}
function endGame(won,copy){if(gameState!=="playing"&&gameState!=="quiz")return;gameState=won?"won":"lost";try{document.exitPointerLock()}catch(e){}quizPanel.classList.add("hidden");resultTitle.textContent=won?"你夺得了火龙杯":"迷宫吞没了你";var sm=won?" | 学院分: "+housePoints:"";resultCopy.textContent=copy+sm;resultPanel.classList.remove("hidden");document.body.classList.remove("snared","dementor","shake","ceremony");stopAmbientDrone();  recordGameResult(won,housePoints,health);playChord(won?[392,523,659,1046]:[90,72,55],won?0.45:0.55,won?0.07:0.06);speakSpell(won?"我们赢了！三强争霸赛的冠军！":"你倒在了黑暗的树篱中...")}
function setMessage(text,seconds){if(seconds===void 0)seconds=2;messageEl.textContent=text;messageEl.dataset.temporary="active";window.clearTimeout(setMessage._timer);setMessage._timer=window.setTimeout(function(){messageEl.dataset.temporary="done"},seconds*1000)}
function isSolidWorldCollideAll(x,z){var samples=[[x-0.5,z-0.5],[x+0.5,z-0.5],[x-0.5,z+0.5],[x+0.5,z+0.5]];return samples.some(function(p){var cell=worldToCell(p[0],p[1]);if(cell.r<0||cell.c<0||cell.r>=mapHeight()||cell.c>=mapWidth())return true;if(solids.has(keyOf(cell.r,cell.c)))return true;if(isGateCell(cell.r,cell.c))return true;if(isQuizBarrierCell(cell.r,cell.c))return true;return!!shiftingWallSolidCache[keyOf(cell.r,cell.c)]})}
function isWallCell(r,c){if(r<0||c<0||r>=mapHeight()||c>=mapWidth())return true;if(solids.has(keyOf(r,c)))return true;if(isGateCell(r,c))return true;if(isQuizBarrierCell(r,c))return true;return!!shiftingWallSolidCache[keyOf(r,c)]}
function isGateCell(r,c){return gates.some(function(g){return!g.open&&g.r===r&&g.c===c})}
function isQuizBarrierCell(r,c){return quizBarriers.some(function(s){return!s.solved&&s.gateCell.r===r&&s.gateCell.c===c})}
function isShiftingWallSolid(wall){return wall.active&&wall.y>-0.2}
function hasLineOfSight(from,to){var steps=Math.ceil(from.distanceTo(to)/0.55);for(var i=1;i<steps;i++){var ratio=i/steps;var x=THREE.MathUtils.lerp(from.x,to.x,ratio),z=THREE.MathUtils.lerp(from.z,to.z,ratio);var cell=worldToCell(x,z);if(isWallCell(cell.r,cell.c)||isGateCell(cell.r,cell.c)||isQuizBarrierCell(cell.r,cell.c))return false}return true}
function findDeadEnds(){var cells=[],h=mapHeight(),w=mapWidth();for(var r=1;r<h-1;r++)for(var c=1;c<w-1;c++){if(isWallCell(r,c))continue;if(isDeadEndCell(r,c))cells.push({r:r,c:c})}return cells}
function isDeadEndCell(r,c){if(isWallCell(r,c))return false;var openCnt=0,ds=[[1,0],[-1,0],[0,1],[0,-1]];for(var d=0;d<4;d++){var nr=r+ds[d][0],nc=c+ds[d][1];if(!isSolid(nr,nc))openCnt++}return openCnt<=1}
function isSolid(r,c){if(r<0||c<0||r>=mapHeight()||c>=mapWidth())return true;if(solids.has(keyOf(r,c)))return true;if(isGateCell(r,c))return true;if(isQuizBarrierCell(r,c))return true;return!!shiftingWallSolidCache[keyOf(r,c)]}
function distanceToCell(r,c){var pos=cellToWorld(r,c);return Math.hypot(pos.x-player.position.x,pos.z-player.position.z)}
function cellToWorld(r,c){return{x:c*CELL-mapHalfW()+CELL/2,z:r*CELL-mapHalfH()+CELL/2}}
function worldToCell(x,z){return{c:Math.floor((x+mapHalfW())/CELL),r:Math.floor((z+mapHalfH())/CELL)}}
function keyOf(r,c){return r+","+c}
function formatTime(seconds){var s=Math.max(0,Math.ceil(seconds)),m=Math.floor(s/60).toString().padStart(2,"0"),sec=(s%60).toString().padStart(2,"0");return m+":"+sec}

function ensureAudio(){var E=window.AudioContext||window.webkitAudioContext;if(!E)return;if(!audioCtx)audioCtx=new E();if(audioCtx.state==="suspended")audioCtx.resume()}
function startAmbientDrone(){if(!audioCtx||ambientDrone)return;var low=audioCtx.createOscillator(),high=audioCtx.createOscillator(),gain=audioCtx.createGain(),filter=audioCtx.createBiquadFilter();low.type="sine";high.type="triangle";low.frequency.value=54;high.frequency.value=108;filter.type="lowpass";filter.frequency.value=380;gain.gain.value=0.0001;low.connect(filter);high.connect(filter);filter.connect(gain).connect(audioCtx.destination);low.start();high.start();gain.gain.setTargetAtTime(0.012,audioCtx.currentTime,0.8);ambientDrone={low:low,high:high,gain:gain,filter:filter}}
function stopAmbientDrone(){if(!audioCtx||!ambientDrone)return;var d=ambientDrone;d.gain.gain.setTargetAtTime(0.0001,audioCtx.currentTime,0.18);d.low.stop(audioCtx.currentTime+0.35);d.high.stop(audioCtx.currentTime+0.35);ambientDrone=null}
function playFootstep(gain){if(!audioCtx)return;playNoiseBurst(0.04,gain);playTone(90+Math.random()*25,0.03,"triangle",gain*0.4)}
function playTone(freq,dur,type,gain,delay){if(!audioCtx)return;var start=audioCtx.currentTime+(delay||0);var osc=audioCtx.createOscillator(),vol=audioCtx.createGain();osc.type=type||"sine";osc.frequency.setValueAtTime(freq,start);vol.gain.setValueAtTime(0.0001,start);vol.gain.linearRampToValueAtTime(gain,start+0.015);vol.gain.exponentialRampToValueAtTime(0.0001,start+dur);osc.connect(vol).connect(audioCtx.destination);osc.start(start);osc.stop(start+dur+0.03)}
function playChord(freqs,dur,gain){freqs.forEach(function(f,i){playTone(f,dur,"sine",gain,i*0.035)})}
function playDirectionalChord(freqs,dur,gain,pan){if(!audioCtx)return;var start=audioCtx.currentTime;var panner=audioCtx.createStereoPanner?audioCtx.createStereoPanner():null;if(panner)panner.pan.setValueAtTime(pan,start);freqs.forEach(function(f,i){var osc=audioCtx.createOscillator(),vol=audioCtx.createGain();osc.type=i===0?"sine":"triangle";osc.frequency.setValueAtTime(f,start);vol.gain.setValueAtTime(0.0001,start);vol.gain.linearRampToValueAtTime(gain/freqs.length,start+0.05);vol.gain.exponentialRampToValueAtTime(0.0001,start+dur);if(panner)osc.connect(vol).connect(panner).connect(audioCtx.destination);else osc.connect(vol).connect(audioCtx.destination);osc.start(start+i*0.03);osc.stop(start+dur+0.04)})}
function playNoiseBurst(dur,gain){if(!audioCtx)return;var bufSize=Math.max(1,Math.floor(audioCtx.sampleRate*dur));var buffer=audioCtx.createBuffer(1,bufSize,audioCtx.sampleRate);var data=buffer.getChannelData(0);for(var i=0;i<bufSize;i++)data[i]=(Math.random()*2-1)*(1-i/bufSize);var source=audioCtx.createBufferSource(),volume=audioCtx.createGain();volume.gain.value=gain;source.buffer=buffer;source.connect(volume).connect(audioCtx.destination);source.start()}

function isInLeftZone(cx){return cx<window.innerWidth*0.35}
canvas.addEventListener("touchstart",function(e){e.preventDefault();for(var i=0;i<e.changedTouches.length;i++){var touch=e.changedTouches[i];if(isInLeftZone(touch.clientX)&&!joystickState.active){joystickState.active=true;joystickState.touchId=touch.identifier;joystickState.baseX=touch.clientX;joystickState.baseY=touch.clientY;joystickState.dx=0;joystickState.dy=0}else if(!isInLeftZone(touch.clientX)&&!cameraTouch.active){cameraTouch.active=true;cameraTouch.touchId=touch.identifier;cameraTouch.lastX=touch.clientX;cameraTouch.lastY=touch.clientY}}},{passive:false});
canvas.addEventListener("touchmove",function(e){e.preventDefault();for(var i=0;i<e.changedTouches.length;i++){var touch=e.changedTouches[i];if(touch.identifier===joystickState.touchId){joystickState.dx=touch.clientX-joystickState.baseX;joystickState.dy=touch.clientY-joystickState.baseY;var dist=Math.hypot(joystickState.dx,joystickState.dy);if(dist>JOYSTICK_MAX_R){joystickState.dx=joystickState.dx/dist*JOYSTICK_MAX_R;joystickState.dy=joystickState.dy/dist*JOYSTICK_MAX_R}}else if(touch.identifier===cameraTouch.touchId){var dx=touch.clientX-cameraTouch.lastX,dy=touch.clientY-cameraTouch.lastY;yaw-=dx*TOUCH_SENSITIVITY;pitch-=dy*TOUCH_SENSITIVITY;pitch=Math.max(-1.2,Math.min(1.2,pitch));cameraTouch.lastX=touch.clientX;cameraTouch.lastY=touch.clientY}}},{passive:false});
canvas.addEventListener("touchend",function(e){for(var i=0;i<e.changedTouches.length;i++){var touch=e.changedTouches[i];if(touch.identifier===joystickState.touchId){joystickState.active=false;joystickState.touchId=null;joystickState.dx=0;joystickState.dy=0}else if(touch.identifier===cameraTouch.touchId){cameraTouch.active=false;cameraTouch.touchId=null}}});
canvas.addEventListener("touchcancel",function(e){for(var i=0;i<e.changedTouches.length;i++){var touch=e.changedTouches[i];if(touch.identifier===joystickState.touchId){joystickState.active=false;joystickState.touchId=null;joystickState.dx=0;joystickState.dy=0}else if(touch.identifier===cameraTouch.touchId){cameraTouch.active=false;cameraTouch.touchId=null}}});
btnSprint.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();sprintToggled=!sprintToggled;if(sprintToggled)btnSprint.classList.add("active");else btnSprint.classList.remove("active")});
btnInteract.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();interact()});
btnMark.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();markDeadEnd()});
btnScroll.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();useScroll()});
var allButtons=document.querySelectorAll(".mobile-btn");for(var bi=0;bi<allButtons.length;bi++){allButtons[bi].addEventListener("touchstart",function(e){e.preventDefault();e.stopPropagation()})}
document.addEventListener("keydown",function(e){keys.add(e.code);if(e.code==="KeyE"){e.preventDefault();interact()}if(e.code==="KeyQ"){e.preventDefault();markDeadEnd()}if(e.code==="KeyF"){e.preventDefault();useScroll()}if(e.code==="KeyR"){e.preventDefault();useWeapon()}if(e.code==="ShiftLeft"||e.code==="ShiftRight"){keyboardSprint=true;if(btnSprint)btnSprint.classList.add("active")}});
document.addEventListener("keyup",function(e){keys.delete(e.code);if(e.code==="ShiftLeft"||e.code==="ShiftRight"){keyboardSprint=false;if(btnSprint)btnSprint.classList.remove("active")}});
document.addEventListener("pointerlockchange",function(){if(document.pointerLockElement!==canvas&&gameState==="playing"){setMessage("迷宫仍在低语。点击画面继续探索。",2.5)}});
document.addEventListener("mousemove",function(e){if(document.pointerLockElement!==canvas||(gameState!=="playing"&&gameState!=="ceremony"))return;yaw-=e.movementX*0.004;pitch-=e.movementY*0.004;pitch=THREE.MathUtils.clamp(pitch,-1.2,1.2)});
canvas.addEventListener("click",function(){if(gameState==="playing"||gameState==="ceremony"){try{canvas.requestPointerLock()}catch(e){}}});
function checkOrientation(){var isLandscape=window.innerWidth>window.innerHeight;var hint=document.querySelector("#rotate-hint");if(hint){hint.classList.toggle("show",!isLandscape);hint.classList.toggle("hidden",isLandscape)}}
window.addEventListener("resize",function(){camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.2));checkOrientation()});
window.addEventListener("orientationchange",function(){setTimeout(checkOrientation,300)});

(function init(){if(typeof THREE==='undefined'){alert('Three.js库未能加载。请检查网络后刷新。');return}try{generateMaze();initWorld();checkOrientation();requestAnimationFrame(animate);overlay.classList.add("hidden")}catch(e){alert('初始化失败: '+(e.message||e)+'\n请刷新页面重试。')}})();

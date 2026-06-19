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
var joystickKnobEl = document.querySelector("#joystick-knob");
var btnSprint = document.querySelector("#btn-sprint");
var btnInteract = document.querySelector("#btn-interact");
var btnMark = document.querySelector("#btn-mark");
var btnScroll = document.querySelector("#btn-scroll");
var btnWeapon = document.querySelector("#btn-weapon");
var btnSettings = document.querySelector("#btn-settings");
var hud = document.querySelector("#hud");
var mobileButtons = document.querySelector("#mobile-buttons");
var diffTabs = document.querySelector("#diff-tabs");
var heroCards = document.querySelector("#hero-cards");
var difficultyPanel = document.querySelector("#difficulty-panel");
var difficultyBack = document.querySelector("#difficulty-back");
var difficultyConfirm = document.querySelector("#difficulty-confirm");
var settingsPanel = document.querySelector("#settings-panel");
var settingsRestart = document.querySelector("#settings-restart");
var settingsLobby = document.querySelector("#settings-lobby");
var settingsContinue = document.querySelector("#settings-continue");
var settingsRules = document.querySelector("#settings-rules");
var heroPrev = document.querySelector("#hero-prev");
var heroNext = document.querySelector("#hero-next");
var lobbyHeroAvatar = document.querySelector("#lobby-hero-avatar");
var lobbyHeroName = document.querySelector("#lobby-hero-name");
var lobbyHeroTitle = document.querySelector("#lobby-hero-title");
var heroStatSpeed = document.querySelector("#hero-stat-speed");
var heroStatHp = document.querySelector("#hero-stat-hp");
var heroStatPassive = document.querySelector("#hero-stat-passive");
var heroStatWeapon = document.querySelector("#hero-stat-weapon");

var GAME_STATES = {
  AUTH: "AUTH",
  RULES: "RULES",
  LOBBY: "LOBBY",
  DIFFICULTY_SELECT: "DIFFICULTY_SELECT",
  PLAYING: "PLAYING",
  CEREMONY: "CEREMONY",
  QUIZ: "QUIZ",
  SETTINGS: "SETTINGS",
  GAMEOVER: "GAMEOVER"
};
var previousGameState = GAME_STATES.LOBBY;
var rulesReturnState = GAME_STATES.LOBBY;

// ===== 游戏配置 =====
var currentDifficulty = "medium";
var selectedHeroId = localStorage.getItem("maze_hero") || "harry";
var currentHero = null;

var difficultySettings = {
  easy:   { size:11, startTime:240, sentinelSpeed:0.6, sphinxDmg:15, label:"简单" },
  medium: { size:15, startTime:180, sentinelSpeed:1.0, sphinxDmg:30, label:"中档" },
  hard:   { size:19, startTime:130, sentinelSpeed:0.85, sphinxDmg:50, label:"困难" }
};

var GAME_BALANCE = {
  shards: 6,
  traps: 7,
  snitchRespawnMs: 10000,
  mazeExtraOpenings: { easy: 5, medium: 7, hard: 8 },
  mazePlazas: { easy: 1, medium: 1, hard: 2 },
  patronus: { aimRange: 10, assistRange: 7.5, closeRange: 4.2 },
  damage: { dementor: 16, blastEnded: 14, snare: 9, wallCrush: 4 },
  blastEnded: {
    extraOnHard: 1,
    patrolRadiusX: 2.4,
    patrolRadiusZ: 0.8,
    hearingRange: 10,
    smellRange: 4.4,
    chargeSpeed: 7.5,
    hitRange: 1.15,
    hitCooldown: 1.5,
    stunSeconds: 2
  }
};

var heroConfig = {
  harry: {
    name:"哈利·波特", title:"格兰芬多找球手", speed:5.4, hp:100, avatar:"⚡", className:"harry-avatar hero-figure--harry", passiveText:"摄魂怪伤害减免40%", weaponText:"格兰芬多宝剑斩击",
    passive:function(dmg,type){if(type==="dementor")return dmg*0.6;return dmg;},
    weaponName:"格兰芬多宝剑", weaponCD:6,
    weapon:function(){
      var hit=false;
      function slashSentinel(s){if(!s.mesh||s.banished)return;var pf=new THREE.Vector3(player.position.x,1.02,player.position.z);if(s.position.distanceTo(pf)<=4.5){hit=true;var dir=pf.clone().sub(s.position).normalize();var knock=new THREE.Vector3(dir.x,0,dir.z).normalize().multiplyScalar(CELL*5);s.position.add(knock);s.mesh.position.copy(s.position);if(s.light)s.light.position.set(s.position.x,1.72,s.position.z);s.forcedChaseTimer=0;s.banished=false;s.banishTimer=0;}}
      slashSentinel(sentinel);slashSentinel(sentinel2);
      if(blastEnded.mesh&&blastEnded.state!=="stunned"){var bep=new THREE.Vector3(player.position.x,0.62,player.position.z);if(blastEnded.position.distanceTo(bep)<4){hit=true;var dirBE=new THREE.Vector3(blastEnded.position.x-player.position.x,0,blastEnded.position.z-player.position.z).normalize().multiplyScalar(CELL*4);blastEnded.position.add(dirBE);blastEnded.mesh.position.copy(blastEnded.position);if(blastEnded.light)blastEnded.light.position.set(blastEnded.position.x,1,blastEnded.position.z);blastEnded.state="stunned";blastEnded.stunTimer=2;}}
      playNoiseBurst(0.08,0.12);playTone(600,0.06,"sawtooth",0.15);playTone(300,0.1,"square",0.1,0.03);speakSpell(hit?"除你武器！":"宝剑挥空……");setMessage(hit?"格兰芬多宝剑斩击！敌人被震退。":"宝剑划破空气，没有命中目标。",2);
      return true;
    }
  },
  cedric: {
    name:"塞德里克·迪戈里", title:"赫奇帕奇级长", speed:5.2, hp:120, avatar:"🦡", className:"cedric-avatar hero-figure--cedric", passiveText:"火把消耗-35%，答错扣血-25%，待机1.5秒后每秒回3HP", weaponText:"速速禁锢：定身摄魂怪和炸尾螺，并获得2.5秒加速",
    passive:function(dmg,type){if(type==="sphinx")return dmg*0.75;return dmg;},
    wandDecayMult:0.65,
    weaponName:"速速禁锢", weaponCD:8,
    weapon:function(){
      var hit=false;
      function freezeS(s){if(!s.mesh||s.banished)return;var pf=new THREE.Vector3(player.position.x,0.62,player.position.z);if(s.position.distanceTo(pf)<=5){hit=true;s.forcedChaseTimer=0;s._frozen=performance.now()+4000;}}
      freezeS(sentinel);freezeS(sentinel2);
      if(hit){
        blastEndedPack.forEach(function(be){if(be.mesh)be._frozen=performance.now()+4000;});
        heroSpeedBuff={until:performance.now()+2500,mult:1.25};
      }
      playTone(160,0.12,"sawtooth",0.1);playTone(110,0.18,"triangle",0.08,0.04);playNoiseBurst(0.09,0.06);speakSpell(hit?"速速禁锢！":"绳索飞出……");setMessage(hit?"速速禁锢！摄魂怪和炸尾螺被定身4秒，你获得2.5秒加速！":"魔咒飞出，但附近没有目标。",2);
      return true;
    }
  },
  viktor: {
    name:"威克多尔·克鲁姆", title:"德姆斯特朗明星", speed:7.2, hp:100, avatar:"🦈", className:"viktor-avatar hero-figure--viktor", passiveText:"移速20%↑，但答错扣血+20%", weaponText:"秘鲁隐身烟雾弹",
    passive:function(dmg,type){if(type==="sphinx")return dmg*1.2;return dmg;},
    weaponName:"秘鲁隐身烟雾弹", weaponCD:15,
    weapon:function(){
      blastEndedPack.forEach(function(be){if(be.mesh){be.state="stunned";be.stunTimer=3;}});
      var smGeo=new THREE.SphereGeometry(0.55,8,8);var smMat=new THREE.MeshBasicMaterial({color:0xcccccc,transparent:true,opacity:0.55});
      for(var si=0;si<12;si++){var sm=new THREE.Mesh(smGeo,smMat.clone());sm.position.copy(player.position);sm.position.y+=0.5+Math.random()*1.5;sm.position.x+=(Math.random()-0.5)*4;sm.position.z+=(Math.random()-0.5)*4;sm.userData={life:2+Math.random()*2,seed:Math.random()*10};scene.add(sm);if(!currentHero._smokeFx)currentHero._smokeFx=[];currentHero._smokeFx.push(sm);}
      currentHero._vanishUntil=performance.now()+3000;
      playNoiseBurst(0.5,0.12);playTone(80,0.25,"sawtooth",0.08);playTone(60,0.35,"triangle",0.05,0.1);speakSpell("烟雾弹！");setMessage("隐身烟雾！3秒内摄魂怪无法察觉你。",2);
      return true;
    }
  },
  fleur: {
    name:"芙蓉·德拉库尔", title:"布斯巴顿之花", speed:5.5, hp:95, avatar:"🦋", className:"fleur-avatar hero-figure--fleur", passiveText:"探照范围+25%，远距感知死路，附近摄魂怪减速20%", weaponText:"福灵剂：谜题排除错误答案/战斗中5秒幸运保护",
    passive:function(dmg,type){return dmg;},
    lightMult:1.25, deadEndRange:2,
    weaponName:"福灵剂", weaponCD:18,
    weapon:function(){
      if(gameState!==GAME_STATES.QUIZ){
        currentHero._luckyDodge=performance.now()+5000;
        playTone(1000,0.08,"sine",0.1);playTone(700,0.12,"sine",0.08,0.04);playTone(500,0.16,"triangle",0.06,0.08);speakSpell("福灵剂！");setMessage("福灵剂！5秒内摄魂怪的下一次攻击将被幸运抵消。",3);
        return true;
      }
      var worked=false;
      if(currentQuiz){
        var d=currentQuiz._data||quizData[currentQuiz.quizIndex%quizData.length];
        var order=currentQuiz._order||[0,1,2];
        var btns=quizOptionsEl.querySelectorAll("button");
        var disabled=0;
        for(var k=0;k<order.length&&disabled<2;k++){
          var origIdx=order[k];
          if(origIdx!==d.answer&&btns[k]){btns[k].style.opacity="0.2";btns[k].style.textDecoration="line-through";btns[k].disabled=true;disabled++;}
        }
        worked=disabled>0;
      }
      playTone(1000,0.08,"sine",0.1);playTone(700,0.12,"sine",0.08,0.04);playTone(500,0.16,"triangle",0.06,0.08);speakSpell(worked?"福灵剂！":"还不到时候……");setMessage(worked?"福灵剂生效！2个错误答案被排除。":"附近没有谜题，福灵剂在战斗外无效。",3);
      return worked;
    }
  }
};

var weaponCooldown = 0;

// ===== 大厅交互 =====
var heroOrder=["harry","cedric","viktor","fleur"];
var HERO_IMAGE_SRC={harry:"../image/processed/harry.webp",cedric:"../image/processed/cedric.webp",viktor:"../image/processed/viktor.webp",fleur:"../image/processed/fleur.webp"};
var WORLD_IMAGE_SRC={sphinx:"./image/processed/sphinx.webp",blastEnded:"./image/processed/blast-ended-skrewt.webp",dementor:"./image/processed/dementor.webp"};
var MODEL_PATHS={dementor:"./image/Dementor.glb",sphinx:"./image/Sphinx.glb",skrewt:"./image/Blast-Ended_Skrewt.glb"};
var modelCache={},modelMixers=[],modelsLoaded=false;
function loadModel(key){return new Promise(function(resolve){if(!THREE.GLTFLoader){console.warn("GLTFLoader not available, skipping: "+key);resolve(null);return}try{var loader=new THREE.GLTFLoader();loader.load(MODEL_PATHS[key],function(gltf){modelCache[key]=gltf;console.log("Model loaded: "+key);resolve(gltf)},undefined,function(e){console.warn("Model load failed: "+key,e);resolve(null)})}catch(e){console.warn("Model load error: "+key,e);resolve(null)}})}
function loadAllModels(){return Promise.all([loadModel("dementor"),loadModel("sphinx"),loadModel("skrewt")])}
var FALLBACK_GEO={dementor:function(){return new THREE.CapsuleGeometry(0.45,1.6,7,14)},sphinx:function(){return new THREE.BoxGeometry(1.6,0.7,2.2)},skrewt:function(){return new THREE.SphereGeometry(0.7,14,10)}};
var FALLBACK_MAT={dementor:function(){return new THREE.MeshStandardMaterial({color:0x0a0a12,emissive:0x1a2a3a,emissiveIntensity:0.6,roughness:0.8,transparent:true,opacity:0.9})},sphinx:function(){return new THREE.MeshStandardMaterial({color:0x7a6a4a,emissive:0x2a1a08,roughness:0.85})},skrewt:function(){return new THREE.MeshStandardMaterial({color:0x3a2015,emissive:0x3a0c04,emissiveIntensity:0.5,roughness:0.65})}};
function createModelInstance(key,opts){opts=opts||{};var wrapper=new THREE.Group();var gltf=modelCache[key];if(!gltf||!gltf.scene){var fg=FALLBACK_GEO[key],fm=FALLBACK_MAT[key];if(fg&&fm){var mesh=new THREE.Mesh(fg(),fm());mesh.castShadow=true;mesh.receiveShadow=true;var h=opts.height||2;if(key==="dementor"){mesh.position.y=0;mesh.scale.setScalar(h/2.5)}else if(key==="sphinx"){mesh.scale.set(h/1.4,h/1.4,h/1.4);if(opts.groundAlign)mesh.position.y=h*0.25}else if(key==="skrewt"){mesh.scale.set(h/1.0*1.6,h/1.0*0.6,h/1.0);if(opts.groundAlign)mesh.position.y=h*0.35}wrapper.add(mesh)}return wrapper}var model=gltf.scene.clone(true);model.traverse(function(child){child.visible=true;if(child.isMesh){child.castShadow=true;child.receiveShadow=true;if(child.material){var mats=Array.isArray(child.material)?child.material:[child.material];var cloned=mats.map(function(m){var mc=m.clone();if(mc.metalness!==undefined)mc.metalness=Math.min(mc.metalness,0.55);if(mc.roughness!==undefined)mc.roughness=Math.max(Math.min(mc.roughness,0.82),0.35);mc.envMapIntensity=0;mc.envMap=null;if(mc.opacity!==undefined&&mc.opacity<0.15)mc.opacity=1;mc.needsUpdate=true;return mc});child.material=Array.isArray(child.material)?cloned:cloned[0]}}});var box=new THREE.Box3().setFromObject(model);var size=box.getSize(new THREE.Vector3());var targetH=opts.height||2;var scale=targetH/Math.max(size.y,0.01);model.scale.setScalar(scale);box.setFromObject(model);var center=box.getCenter(new THREE.Vector3());model.position.x=-center.x;model.position.z=-center.z;if(opts.groundAlign){model.position.y=-box.min.y}else{model.position.y=-center.y}model.userData._baseScale=scale;wrapper.add(model);wrapper.userData.modelInner=model;if(gltf.animations&&gltf.animations.length>0){var mixer=new THREE.AnimationMixer(model);gltf.animations.forEach(function(clip){mixer.clipAction(clip).play()});wrapper.userData.mixer=mixer;modelMixers.push(mixer)}return wrapper}
function applyHeroAvatar(el,id){if(!el)return;el.style.setProperty("--hero-image","url('"+(HERO_IMAGE_SRC[id]||HERO_IMAGE_SRC.harry)+"')");el.dataset.hero=id;el.textContent=""}
function syncHeroCardImages(){if(!heroCards)return;heroCards.querySelectorAll(".hero-card").forEach(function(c){applyHeroAvatar(c.querySelector(".hero-avatar"),c.dataset.hero)})}
function resetLobby(){currentDifficulty=localStorage.getItem("maze_diff")||"medium";selectedHeroId=localStorage.getItem("maze_hero")||selectedHeroId||"harry";if(!heroConfig[selectedHeroId])selectedHeroId="harry";syncDifficultyUI();syncHeroUI()}
function syncDifficultyUI(){if(diffTabs){diffTabs.querySelectorAll(".diff-btn").forEach(function(b){b.classList.remove("active");if(b.dataset.diff===currentDifficulty)b.classList.add("active")})}}
function syncHeroUI(){
  var hero=heroConfig[selectedHeroId]||heroConfig.harry;
  if(heroCards){heroCards.querySelectorAll(".hero-card").forEach(function(c){c.classList.toggle("selected",c.dataset.hero===selectedHeroId)})}
  syncHeroCardImages();
  if(lobbyHeroAvatar){lobbyHeroAvatar.className="hero-showcase-avatar "+hero.className;applyHeroAvatar(lobbyHeroAvatar,selectedHeroId)}
  if(lobbyHeroName)lobbyHeroName.textContent=hero.name;
  if(lobbyHeroTitle)lobbyHeroTitle.textContent=hero.title||"三强勇士";
  if(heroStatSpeed)heroStatSpeed.textContent=hero.speed.toFixed(1);
  if(heroStatHp)heroStatHp.textContent=hero.hp;
  if(heroStatPassive)heroStatPassive.textContent=hero.passiveText||"无";
  if(heroStatWeapon)heroStatWeapon.textContent=hero.weaponText||hero.weaponName||"无";
}
function selectHero(id){if(!heroConfig[id])return;selectedHeroId=id;localStorage.setItem("maze_hero",selectedHeroId);syncHeroUI()}
function cycleHero(dir){var idx=heroOrder.indexOf(selectedHeroId);if(idx<0)idx=0;idx=(idx+dir+heroOrder.length)%heroOrder.length;selectHero(heroOrder[idx])}
if(diffTabs){
  diffTabs.addEventListener("click",function(e){
    var btn=e.target.closest(".diff-btn");if(!btn)return;
    currentDifficulty=btn.dataset.diff;localStorage.setItem("maze_diff",currentDifficulty);syncDifficultyUI();
  });
}
if(heroCards){
  heroCards.addEventListener("click",function(e){
    var card=e.target.closest(".hero-card");if(!card)return;
    selectHero(card.dataset.hero);
  });
}
if(heroPrev)heroPrev.addEventListener("click",function(){cycleHero(-1)});
if(heroNext)heroNext.addEventListener("click",function(){cycleHero(1)});

// ===== 事件（最早注册） =====
if (startButton) startButton.addEventListener("click", function () {
  if(!selectedHeroId&&!isAdmin){setMessage("请先选择角色",2);return}
  setGameState(GAME_STATES.DIFFICULTY_SELECT);
});
if (restartButton) restartButton.addEventListener("click", function () { resultPanel.classList.add("hidden"); setGameState(GAME_STATES.DIFFICULTY_SELECT); });
if (btnWeapon) { btnWeapon.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();useWeapon()}); btnWeapon.addEventListener("touchstart",function(e){e.preventDefault();e.stopPropagation()}); }
if(difficultyBack)difficultyBack.addEventListener("click",function(){setGameState(GAME_STATES.LOBBY)});
if(difficultyConfirm)difficultyConfirm.addEventListener("click",function(){enterMaze(selectedHeroId,currentDifficulty)});
if(btnSettings)btnSettings.addEventListener("click",function(){if(gameState===GAME_STATES.PLAYING||gameState===GAME_STATES.CEREMONY){previousGameState=gameState;setGameState(GAME_STATES.SETTINGS)}});
if(settingsContinue)settingsContinue.addEventListener("click",function(){setGameState(previousGameState===GAME_STATES.CEREMONY?GAME_STATES.CEREMONY:GAME_STATES.PLAYING)});
if(settingsRestart)settingsRestart.addEventListener("click",function(){exitMaze(false);setGameState(GAME_STATES.DIFFICULTY_SELECT)});
if(settingsLobby)settingsLobby.addEventListener("click",function(){exitMaze(true);setGameState(GAME_STATES.LOBBY)});
if(settingsRules)settingsRules.addEventListener("click",function(){rulesReturnState=GAME_STATES.SETTINGS;setGameState(GAME_STATES.RULES)});

// ===== 用户系统 =====
var currentUser = null, isAdmin = false, adminToken = "", userToken = "";
var DEFAULT_API_BASE = "https://harry-potter-maze-api.158486706.workers.dev";
var SUPABASE_REST_URL = "https://psadnnnoyeqinuixwumj.supabase.co/rest/v1";
var SUPABASE_PUBLIC_KEY = "sb_publishable_iwAnf0X2uoGzL_y8gasb0A_sMII0EVm";
var API_BASE = getInitialApiBase();
var REQUEST_TIMEOUT_MS = 6500;
var RESULT_QUEUE_KEY = "maze_pending_results";

function getInitialApiBase(){
  if(location.protocol==="file:"||location.hostname==="localhost"||location.hostname==="127.0.0.1")return "http://localhost:8080";
  try{
    var params=new URLSearchParams(location.search);
    var fromUrl=params.get("api");
    if(fromUrl&&/^https:\/\/[a-zA-Z0-9.-]+(?::\d+)?(?:\/.*)?$/.test(fromUrl)){
      localStorage.setItem("maze_api_base",fromUrl.replace(/\/+$/,""));
      return localStorage.getItem("maze_api_base");
    }
    return (localStorage.getItem("maze_api_base")||DEFAULT_API_BASE||"").replace(/\/+$/,"");
  }catch(e){return ""}
}

function apiFetch(method,path,body,admin){
  if(!API_BASE)return Promise.reject(new Error("API 未配置，已切换离线模式"));
  var headers={"Content-Type":"application/json"};
  if(admin&&adminToken)headers["x-admin-token"]=adminToken;
  if(!admin&&userToken)headers["x-user-token"]=userToken;
  return fetchJson(API_BASE+path,{method:method,headers:headers,body:body?JSON.stringify(body):undefined});
}

function fetchWithTimeout(url,opts){
  opts=opts||{};
  var timer=null,ctrl=null;
  if(typeof AbortController!=="undefined"){ctrl=new AbortController();opts.signal=ctrl.signal;timer=setTimeout(function(){ctrl.abort()},REQUEST_TIMEOUT_MS)}
  return fetch(url,opts).then(function(r){if(timer)clearTimeout(timer);return r},function(e){if(timer)clearTimeout(timer);throw e});
}

function fetchJson(url,opts){
  return fetchWithTimeout(url,opts).then(function(r){
    return r.text().then(function(text){
      var data=null;
      if(text){try{data=JSON.parse(text)}catch(e){data={error:text}}}
      if(!r.ok){var msg=data&&data.error?data.error:"HTTP "+r.status;throw new Error(msg)}
      return data;
    });
  });
}

function supaFetch(method,path,body){
  var headers={"apikey":SUPABASE_PUBLIC_KEY,"Authorization":"Bearer "+SUPABASE_PUBLIC_KEY};
  if(body){headers["Content-Type"]="application/json";headers["Prefer"]="return=representation"}
  var run=function(){return fetchJson(SUPABASE_REST_URL+path,{method:method,headers:headers,body:body?JSON.stringify(body):undefined})};
  return run().catch(function(e){if(method==="GET")return run();throw e});
}

function isBannedError(e){
  var msg=e&&e.message?e.message:"";
  return msg.indexOf("禁用")!==-1;
}

function userTokenKey(uid){return"maze_user_token_"+uid}
function saveUserToken(uid,token){userToken=token||"";if(uid&&token)localStorage.setItem(userTokenKey(uid),token)}
function loadUserToken(uid){userToken=uid?(localStorage.getItem(userTokenKey(uid))||""):"";return userToken}

function localDB() { try { return JSON.parse(localStorage.getItem("maze_game_db")) || { users: {} } } catch (e) { return { users: {} } } }
function localSave(db) { localStorage.setItem("maze_game_db", JSON.stringify(db)) }
function getLocalUser(uid){var db=localDB();return db.users[uid]||null}
function localRecord(won, score, endHealth) {
  if (!currentUser) return;
  var db = localDB(), u = db.users[currentUser];
  if (!u) { u = { wins: 0, losses: 0, totalScore: 0, rankScore: 0, lastHealth: 100, createdAt: Date.now(), banned: false }; db.users[currentUser] = u }
  var hp = endHealth !== undefined ? Math.max(0, Math.ceil(endHealth)) : (u.lastHealth || 0);
  if (won) u.wins++; else u.losses++;
  u.lastHealth = hp;
  u.totalScore += score || 0; u.rankScore = u.rankScore || 0; u.rankScore += (score || 0) + (won?500:0) + hp; localSave(db);
}

function pendingResults(){try{return JSON.parse(localStorage.getItem(RESULT_QUEUE_KEY))||[]}catch(e){return []}}
function savePendingResults(q){localStorage.setItem(RESULT_QUEUE_KEY,JSON.stringify(q.slice(-30)))}
function queueResult(payload){var q=pendingResults();q.push({uid:payload.uid,won:payload.won,score:payload.score,health:payload.health,queuedAt:Date.now()});savePendingResults(q);localRecord(payload.won,payload.score,payload.health)}
function ensureCloudSession(){if(!currentUser||isAdmin)return Promise.resolve();if(loadUserToken(currentUser))return Promise.resolve();return cloudAuth(currentUser).catch(function(){})}

function supaAuth(uid){
  return supaFetch("GET","/users?select=*&uid=eq."+encodeURIComponent(uid)).then(function(rows){
    var user=rows&&rows.length?rows[0]:null;
    if(user&&user.banned)throw new Error("该账号已被禁用");
    if(user)return {ok:true,user:user,mode:"supabase",created:false};
    return supaFetch("POST","/users",{uid:uid,wins:0,losses:0,total_score:0,banned:false}).then(function(created){
      return {ok:true,user:created&&created[0]?created[0]:{uid:uid,wins:0,losses:0,total_score:0,banned:false},mode:"supabase",created:true};
    }).catch(function(e){
      var msg=e&&e.message?e.message:"";
      if(msg.indexOf("duplicate")!==-1||msg.indexOf("409")!==-1)return supaAuth(uid);
      throw e;
    });
  });
}

function cloudAuth(uid){
  var viaApi=API_BASE?apiFetch("POST","/api/auth",{uid:uid}):Promise.reject(new Error("API 未配置"));
  return viaApi.then(function(r){
    if(r&&r.token)saveUserToken(uid,r.token);
    if(r&&r.created===undefined)r.created=!!r.isNew;
    return r;
  }).catch(function(e){
    if(isBannedError(e))throw e;
    return supaAuth(uid);
  });
}

function supaRecord(payload){
  return supaFetch("GET","/users?select=*&uid=eq."+encodeURIComponent(payload.uid)).then(function(rows){
    var u=rows&&rows.length?rows[0]:null;
    if(!u)return supaAuth(payload.uid).then(function(){return supaRecord(payload)});
    if(u.banned)throw new Error("该账号已被禁用");
    var hp=payload.health!==undefined?Math.ceil(Math.max(0,payload.health)):0;
    var score=Math.max(0,Math.round(payload.score||0));
    return supaFetch("PATCH","/users?uid=eq."+encodeURIComponent(payload.uid),{
      wins:payload.won?(u.wins||0)+1:(u.wins||0),
      losses:payload.won?(u.losses||0):(u.losses||0)+1,
      total_score:(u.total_score||0)+score+(payload.won?500:0)+hp
    });
  });
}

function cloudRecord(payload){
  loadUserToken(payload.uid);
  var viaApi=API_BASE?apiFetch("POST","/api/result",payload):Promise.reject(new Error("API 未配置"));
  return viaApi.catch(function(e){if(isBannedError(e))throw e;return supaRecord(payload)});
}

function cloudStats(uid){
  var viaApi=API_BASE?apiFetch("GET","/api/stats/"+encodeURIComponent(uid)):Promise.reject(new Error("API 未配置"));
  return viaApi.catch(function(e){
    if(isBannedError(e))throw e;
    return supaFetch("GET","/users?select=*&uid=eq."+encodeURIComponent(uid)).then(function(rows){
      if(!rows||!rows.length)throw new Error("用户不存在");
      if(rows[0].banned)throw new Error("该账号已被禁用");
      return rows[0];
    });
  });
}

function cloudLeaderboard(){
  var viaApi=API_BASE?apiFetch("GET","/api/leaderboard"):Promise.reject(new Error("API 未配置"));
  return viaApi.catch(function(){return supaFetch("GET","/users?select=uid,wins,total_score&banned=eq.false&order=total_score.desc&limit=20")});
}

function flushPendingResults(){
  if(!currentUser||isAdmin)return Promise.resolve();
  var q=pendingResults();
  if(!q.length)return Promise.resolve();
  var kept=[],synced=0,chain=Promise.resolve();
  chain=chain.then(ensureCloudSession);
  q.forEach(function(item){
    chain=chain.then(function(){
      if(item.uid!==currentUser){kept.push(item);return null}
      return cloudRecord(item).then(function(){synced++}).catch(function(e){if(!isBannedError(e))kept.push(item)});
    });
  });
  return chain.then(function(){savePendingResults(kept);if(synced>0)setMessage("已补传 "+synced+" 条离线战绩。",2)});
}


var authLogin=document.querySelector("#auth-login"),authPanel=document.querySelector("#auth-panel"),authUidEl=document.querySelector("#auth-uid");
var authMsg=document.querySelector("#auth-msg"),rulesPanel=document.querySelector("#rules-panel");
var rulesOk=document.querySelector("#rules-ok"),adminPanel=document.querySelector("#admin-panel");
var adminClose=document.querySelector("#admin-close"),adminUsers=document.querySelector("#admin-users");
var statsPanel=document.querySelector("#stats-panel"),statsClose=document.querySelector("#stats-close");
var myStats=document.querySelector("#my-stats"),leaderboard=document.querySelector("#leaderboard");
var btnStats=document.querySelector("#btn-stats"),btnAdmin=document.querySelector("#btn-admin");
var lobbyStats=document.querySelector("#lobby-stats"),settingsStats=document.querySelector("#settings-stats");

if(authLogin)authLogin.addEventListener("click",doAuth);
if(authUidEl)authUidEl.addEventListener("keydown",function(e){if(e.key==="Enter")doAuth()});
if(rulesOk)rulesOk.addEventListener("click",function(){var target=rulesReturnState||GAME_STATES.LOBBY;if(target===GAME_STATES.SETTINGS){setGameState(GAME_STATES.SETTINGS);setMessage("规则已查看。",1.5);return}setGameState(GAME_STATES.LOBBY);tryFullscreen();setMessage("选择你的勇士，然后踏入迷宫！",3)});
if(adminClose)adminClose.addEventListener("click",function(){adminPanel.classList.add("hidden")});
if(statsClose)statsClose.addEventListener("click",function(){statsPanel.classList.add("hidden")});
if(btnStats)btnStats.addEventListener("click",function(e){e.stopPropagation();showStats()});
if(lobbyStats)lobbyStats.addEventListener("click",function(e){e.stopPropagation();showStats()});
if(settingsStats)settingsStats.addEventListener("click",function(e){e.stopPropagation();showStats()});
if(btnAdmin)btnAdmin.addEventListener("click",function(e){e.stopPropagation();showAdmin()});
if(window.addEventListener)window.addEventListener("online",function(){flushPendingResults()});

function doAuth(){
  var uid=(authUidEl.value||"").trim();
  if(!uid){authMsg.textContent="请输入游戏ID";return}
  if(!/^[a-zA-Z0-9]+$/.test(uid)){authMsg.textContent="只能使用英文字母和数字";return}
  if(uid.length<2){authMsg.textContent="ID至少2个字符";return}
  if(uid==="Dsr"){if(!API_BASE){authMsg.textContent="管理员功能需要先配置后端 API";return}var pw=prompt("管理员密码:");if(pw===null){authMsg.textContent="已取消登录";return}apiFetch("POST","/api/admin/login",{uid:uid,password:pw}).then(function(r){adminToken=r.token;userToken="";isAdmin=true;currentUser="Dsr";btnAdmin.classList.remove("hidden");authPanel.classList.add("hidden");rulesPanel.classList.add("hidden");tryFullscreen();setGameState(GAME_STATES.LOBBY);setMessage("管理员登录成功，选择勇士踏入迷宫。",2)}).catch(function(e){authMsg.textContent=e.message||"密码错误"});return}
  authMsg.textContent="正在连接云端...";
  cloudAuth(uid).then(function(r){finishAuth(uid,!!(r&&r.created));flushPendingResults()}).catch(function(e){if(isBannedError(e)){authMsg.textContent=e.message;return}fallbackAuth(uid);if(currentUser===uid)setMessage("云端暂不可用，本局会先离线记录，稍后自动补传。",3)})}
function finishAuth(uid,isNew){isAdmin=false;currentUser=uid;btnAdmin.classList.add("hidden");authPanel.classList.add("hidden");if(isNew){rulesReturnState=GAME_STATES.LOBBY;setGameState(GAME_STATES.RULES);setMessage("欢迎加入。先看规则，再进入大厅。",3);return}rulesPanel.classList.add("hidden");tryFullscreen();setGameState(GAME_STATES.LOBBY);setMessage("欢迎回来，"+uid+"。选择勇士后踏入迷宫。",3)}
function fallbackAuth(uid){userToken="";var db=localDB();if(db.users[uid]&&db.users[uid].banned){authMsg.textContent="该账号已被禁用";return}var created=false;if(!db.users[uid]){created=true;db.users[uid]={wins:0,losses:0,totalScore:0,rankScore:0,lastHealth:100,createdAt:Date.now(),banned:false};localSave(db)}finishAuth(uid,created)}
function showSelectionLobby(msg,requestFull){setGameState(GAME_STATES.LOBBY);if(requestFull)tryFullscreen();setMessage(msg||"选择你的勇士，然后踏入迷宫！",3)}
function recordGameResult(won,score,endHealth){
  if(!currentUser)return;
  var hp=endHealth!==undefined?Math.max(0,Math.ceil(endHealth)):0;
  var payload={uid:currentUser,won:won===true,score:score||0,health:hp};
  cloudRecord(payload).then(function(){flushPendingResults()}).catch(function(e){if(isBannedError(e)){setMessage("该账号已被禁用，战绩未记录。",3);return}queueResult(payload)});
}
function showStats(){
  if(!currentUser){alert("请先登录");return}
  flushPendingResults();
  cloudStats(currentUser).then(function(u){renderMyStats(u,false)}).catch(function(){renderMyStats(getLocalUser(currentUser)||{uid:currentUser},true)});
  cloudLeaderboard().then(renderLeaderboard).catch(function(){leaderboard.textContent="排行榜暂不可用"});statsPanel.classList.remove("hidden")}
function showAdmin(){
  if(!isAdmin)return;
  apiFetch("GET","/api/admin/users",null,true).then(function(r){renderAdminUsers(r);adminPanel.classList.remove("hidden")}).catch(function(e){alert(e.message||"无法连接数据库")})}
function toggleBan(uid){if(!isAdmin||uid==="Dsr")return;apiFetch("POST","/api/admin/toggleban",{uid:uid},true).then(function(){showAdmin()}).catch(function(e){alert(e.message||"操作失败")})}
function removeUser(uid){if(!isAdmin||uid==="Dsr")return;if(!confirm("确定删除用户 "+uid+" 吗？"))return;apiFetch("POST","/api/admin/remove",{uid:uid},true).then(function(){showAdmin()}).catch(function(e){alert(e.message||"操作失败")})}
function clearChildren(el){while(el.firstChild)el.removeChild(el.firstChild)}
function addTextLine(parent,text){var p=document.createElement("p");p.textContent=text;parent.appendChild(p)}
function renderMyStats(u,offline){clearChildren(myStats);addTextLine(myStats,"ID: "+currentUser+(offline?" (离线)":""));addTextLine(myStats,"胜利: "+(u.wins||0)+" 场");addTextLine(myStats,"失败: "+(u.losses||0)+" 场");addTextLine(myStats,"排名分: "+(u.total_score!==undefined?u.total_score:(u.rankScore||u.totalScore||0)))}
function renderLeaderboard(rows){clearChildren(leaderboard);if(!rows||!rows.length){leaderboard.textContent="暂无数据";return}rows.forEach(function(u,i){var row=document.createElement("div"),left=document.createElement("span"),right=document.createElement("span");left.textContent=(i+1)+". "+u.uid+" ("+(u.wins||0)+"胜)";right.textContent=(u.total_score||0)+"分";row.appendChild(left);row.appendChild(right);leaderboard.appendChild(row)})}
function renderAdminUsers(rows){clearChildren(adminUsers);if(!rows||!rows.length){adminUsers.textContent="暂无用户";return}rows.forEach(function(u){var row=document.createElement("div"),info=document.createElement("span"),actions=document.createElement("span");info.textContent=u.uid+" (赢"+(u.wins||0)+" 输"+(u.losses||0)+" 排名"+(u.total_score||0)+")"+(u.banned?" [已禁]":"");row.appendChild(info);if(u.uid!=="Dsr"){var ban=document.createElement("button");ban.textContent=u.banned?"解禁":"禁用";if(!u.banned)ban.className="btn-ban";ban.addEventListener("click",function(){toggleBan(u.uid)});var del=document.createElement("button");del.textContent="删除";del.className="btn-del";del.addEventListener("click",function(){removeUser(u.uid)});actions.appendChild(ban);actions.appendChild(del)}row.appendChild(actions);adminUsers.appendChild(row)})}

// ===== 核心常量 =====
var CELL=4,PLAYER_RADIUS=0.72,PLAYER_HEIGHT=1.7;
var WAND_DECAY=0.005,WAND_MIN=0.2,SPRINT_DRAIN=0.22,SPRINT_RECOVERY=0.38,SPRINT_SPEED=1.4;
var DEMENTOR_DMG=GAME_BALANCE.damage.dementor,BLAST_DMG=GAME_BALANCE.damage.blastEnded,SNARE_DMG=GAME_BALANCE.damage.snare,WALL_CRUSH_DMG=GAME_BALANCE.damage.wallCrush;
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
    var maxO=(GAME_BALANCE.mazeExtraOpenings[currentDifficulty]||7)+Math.floor(Math.random()*3),totalO=0,ol=[]; // 收集候选墙
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
    // 少量小空地，保留喘息点但避免迷宫过于空旷。
    var pl=GAME_BALANCE.mazePlazas[currentDifficulty]||1;for(var pi=0;pi<pl;pi++){var pr=4+Math.floor(Math.random()*(SIZE-8)),pc=4+Math.floor(Math.random()*(SIZE-8));
      for(var dr=-1;dr<=1;dr++)for(var dc=-1;dc<=1;dc++){if(Math.abs(dr)+Math.abs(dc)>1&&Math.random()<0.45)continue;var cr2=pr+dr,cc2=pc+dc;if(cr2>0&&cr2<SIZE-1&&cc2>0&&cc2<SIZE-1)grid[cr2][cc2]="."}}
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
  var idx=0;for(var i=0;i<GAME_BALANCE.shards&&idx<filt.length;i++,idx++)grid[filt[idx].r][filt[idx].c]="R";
  for(var i=0;i<GAME_BALANCE.traps&&idx<filt.length;i++,idx++)grid[filt[idx].r][filt[idx].c]="T";
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
var renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:false,powerPreference:"high-performance"});renderer.setSize(window.innerWidth,window.innerHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.2));renderer.shadowMap.enabled=!isMobile;if(!isMobile)renderer.shadowMap.type=THREE.PCFSoftShadowMap;try{if(THREE.SRGBColorSpace)renderer.outputColorSpace=THREE.SRGBColorSpace}catch(e){}var ambient=new THREE.AmbientLight(0x6a8a6a,2.0);scene.add(ambient);
var hemi=new THREE.HemisphereLight(0x88bb88,0x3a2a1a,0.7);scene.add(hemi);
var moon=new THREE.DirectionalLight(0xeeddbb,1.0);moon.position.set(-18,32,-8);moon.castShadow=true;moon.shadow.mapSize.set(512,512);scene.add(moon);
var lumos=new THREE.SpotLight(0xf5faff,14,22,Math.PI/4.5,0.3,1.5);lumos.position.set(0.34,-0.22,-0.22);lumos.target.position.set(0,-0.22,-5);camera.add(lumos,lumos.target);


function updateCreatureAnimations(t,dt){modelMixers.forEach(function(m){m.update(dt)});[sentinel,sentinel2].forEach(function(s){if(!s||!s.mesh||s.mesh.visible===false)return;s.mesh.position.y=s.position.y+Math.sin(t*2.2+(s.mesh.userData.animSeed||0))*0.15;s.mesh.children.forEach(function(ch){if(ch.userData&&ch.userData.home){var h=ch.userData.home,sd=ch.userData.seed||0;ch.position.x=h.x+Math.sin(t*1.7+sd)*0.12;ch.position.y=h.y+Math.sin(t*2.2+sd)*0.16;ch.position.z=h.z+Math.cos(t*1.4+sd)*0.08;if(ch.material)ch.material.opacity=0.12+Math.sin(t*2.5+sd)*0.08}})});blastEndedPack.forEach(function(be){if(!be||!be.mesh||be.mesh.visible===false)return;if(be.state==="charge"){be.mesh.rotation.x=0.15}else if(be.state==="stunned"){be.mesh.rotation.x=-0.1}else{be.mesh.rotation.x=0}});sphinxes.forEach(function(s){if(!s||!s.mesh)return;var inner=s.mesh.userData.modelInner;if(inner){var base=inner.userData._baseScale||inner.scale.x;var breath=base*(1+Math.sin(t*1.5)*0.015);inner.scale.setScalar(breath)}})}
function mapWidth(){return mazeRows[0]?mazeRows[0].length:21}
function mapHeight(){return mazeRows.length}
function mapHalfW(){return(mapWidth()*CELL)/2}
function mapHalfH(){return(mapHeight()*CELL)/2}

var keys=new Set,solids=new Set,markerCells=new Set,magicShards=[],traps=[],sphinxes=[],gates=[],quizBarriers=[],fireflies=[],shiftingWalls=[],shiftingWallSolidCache={},deadEndMarks=[],buffs=[],exitParticles=[],torches=[],entranceBraziers=[];

var joystickState={active:false,touchId:null,baseX:0,baseY:0,dx:0,dy:0};
var cameraTouch={active:false,touchId:null,lastX:0,lastY:0};
var sprintToggled=false,keyboardSprint=false;
var yaw=0,pitch=0,velocity=new THREE.Vector3(),lastTime=performance.now(),gameState=GAME_STATES.AUTH,animationFrameId=0,lobbyReady=false;
var timeLeft=START_TIME,health=100,wandPower=1,sprintEnergy=1,isSprinting=false,dementorAura=false,snare=null,scrollCharges=0,cupKeyObtained=false,freeSprintUntil=0,guideUntil=0,currentQuiz=null,ceremonyAlpha=0,housePoints=0;
var mapCharges=0,frenzyActivated=false,dementorSlow=false,heroSpeedBuff=null,_idleSince=0,_dementorDrainAcc=0,shiftWallCountdown=20;
var tinnitusOsc=null,tinnitusGain=null,wailOsc=null,wailGain=null;
var audioCtx=null,ambientDrone=null,lastExitChime=0,lastDementorTone=0,lastFootstep=0,lastLumosCrackle=0,lastSnarePulse=0,lastTorchCrackle=0;
var player={position:new THREE.Vector3(),cell:{r:0,c:0}};
var sentinel={mesh:null,light:null,position:new THREE.Vector3(),path:[],target:0,strikeTimer:0,forcedChaseTimer:0,banished:false,banishTimer:0};
var sentinel2={mesh:null,light:null,position:new THREE.Vector3(),path:[],target:0,strikeTimer:0,forcedChaseTimer:0,banished:false,banishTimer:0};
var goldenSnitch={mesh:null,light:null,position:new THREE.Vector3(),velocity:new THREE.Vector3(),home:{r:7,c:7},wanderTimer:0};
var patronusBeam={active:false,mesh:null,light:null,target:new THREE.Vector3(),origin:new THREE.Vector3(),startTime:0,duration:0.6};
var patronusTarget=null;
function makeBlastEndedState(r,c){return{mesh:null,light:null,position:new THREE.Vector3(),home:{r:r,c:c},state:"patrol",patrolPhase:0,stunTimer:0,chargeTarget:new THREE.Vector3(),chargeDir:new THREE.Vector3(),hitTimer:0,listenTimer:0}}
var blastEnded=makeBlastEndedState(3,11);
var blastEnded2=makeBlastEndedState(5,9);
var blastEndedPack=[blastEnded,blastEnded2];

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
  ensureSphinxCoverage(mainPath,gateGeo);
  for(var si=sphinxes.length-1;si>=0;si--){if(!isCellReachable(sphinxes[si].r,sphinxes[si].c,sphinxes[si]))removeSphinxAt(si)}
  ensureKeySphinx();
  var de=[[-1,0],[1,0],[0,-1],[0,1]];var startExits=0;for(var d=0;d<4;d++){var nr=startCell.r+de[d][0],nc=startCell.c+de[d][1];if(!isWallCell(nr,nc)&&!isQuizBarrierCell(nr,nc)&&!isGateCell(nr,nc))startExits++}if(startExits<2)cleanBlockedExits(startCell.r,startCell.c);
  var scs=findShiftWallPositions();for(var i=0;i<Math.min(3,scs.length);i++)addShiftingWall(scs[i].r,scs[i].c,(Math.PI*2/3)*i+Math.random()*0.3);
  addTriwizardCup();placeTorches();
  if(mainPath&&mainPath.length>10){var mi=Math.floor(mainPath.length*0.4);if(mi<mainPath.length&&mi>3){var tc=mainPath[mi];if(!isWallCell(tc.r,tc.c)){var alr=traps.some(function(t){return t.r===tc.r&&t.c===tc.c});if(!alr)addSnareTrap(tc.r,tc.c,trapGeo)}}
    var ne=Math.floor(mainPath.length*0.82);for(var ti=ne;ti<mainPath.length-1;ti+=Math.max(3,Math.floor(mainPath.length*0.06))){var tc2=mainPath[Math.min(ti,mainPath.length-2)];if(!isWallCell(tc2.r,tc2.c)){var alr2=traps.some(function(t){return t.r===tc2.r&&t.c===tc2.c});if(!alr2)addSnareTrap(tc2.r,tc2.c,trapGeo)}}}
  var nes=findShiftWallPositionsNearExit();for(var ssi=0;ssi<Math.min(1,nes.length);ssi++)addShiftingWall(nes[ssi].r,nes[ssi].c,Math.random()*Math.PI*2);
  addEntranceArch();addSentinel();
  if(mainPath&&mainPath.length>5&&sentinel.path.length>0){var cp=mainPath[Math.floor(mainPath.length*0.5)];sentinel.path.splice(2,1,{r:cp.r,c:cp.c});sentinel._crossPath=cp}
  addBlastEndedSkrewt(blastEnded);
  if(currentDifficulty==="hard"&&GAME_BALANCE.blastEnded.extraOnHard>0){placeExtraBlastEnded(mainPath);addBlastEndedSkrewt(blastEnded2)}
  addFireflies();addBuffs();addGoldenSnitch()}

function initLobby(){
  cleanupWorld();lobbyReady=true;currentHero=null;timeLeft=START_TIME;health=heroHP;housePoints=0;weaponCooldown=0;
  var floor=new THREE.Mesh(new THREE.PlaneGeometry(42,28),floorMaterial);floor.rotation.x=-Math.PI/2;floor.position.z=-10;floor.receiveShadow=true;scene.add(floor);
  var hedgeMat=new THREE.MeshStandardMaterial({color:0x20351f,roughness:0.9,emissive:0x071407,emissiveIntensity:0.25});
  function hedge(x,z,w,h){var m=new THREE.Mesh(new THREE.BoxGeometry(w,4.2,h),hedgeMat);m.position.set(x,2.1,z);m.receiveShadow=true;m.castShadow=true;scene.add(m)}
  hedge(-8,-12,3,18);hedge(8,-12,3,18);hedge(0,-20,20,3);hedge(-14,-8,8,3);hedge(14,-8,8,3);
  var archMat=new THREE.MeshStandardMaterial({color:0x726044,roughness:0.65,emissive:0x1f170d,emissiveIntensity:0.2});
  var left=new THREE.Mesh(new THREE.BoxGeometry(1.1,5.6,1.1),archMat),right=left.clone(),top=new THREE.Mesh(new THREE.BoxGeometry(6.2,1.0,1.1),archMat);
  left.position.set(-3,2.8,-5);right.position.set(3,2.8,-5);top.position.set(0,5.6,-5);scene.add(left,right,top);
  for(var i=0;i<2;i++){createTorch(i?4.2:-4.2,-4.2,0,0)}
  player.position.set(0,PLAYER_HEIGHT,8);yaw=Math.PI;pitch=-0.08;camera.position.copy(player.position);updateCamera();
  lumos.intensity=7;lumos.distance=18;startRenderLoop();setMessage("大厅已就绪。选择你的勇士，确认难度后踏入迷宫。",3)
}

function setGameState(next){
  gameState=next;
  if(authPanel)authPanel.classList.toggle("hidden",next!==GAME_STATES.AUTH);
  if(rulesPanel)rulesPanel.classList.toggle("hidden",next!==GAME_STATES.RULES);
  if(overlay)overlay.classList.toggle("hidden",next!==GAME_STATES.LOBBY);
  if(difficultyPanel)difficultyPanel.classList.toggle("hidden",next!==GAME_STATES.DIFFICULTY_SELECT);
  if(settingsPanel)settingsPanel.classList.toggle("hidden",next!==GAME_STATES.SETTINGS);
  if(resultPanel)resultPanel.classList.toggle("hidden",next!==GAME_STATES.GAMEOVER);
  if(quizPanel&&next!==GAME_STATES.QUIZ)quizPanel.classList.add("hidden");
  var inRun=next===GAME_STATES.PLAYING||next===GAME_STATES.CEREMONY||next===GAME_STATES.QUIZ||next===GAME_STATES.SETTINGS;
  if(hud)hud.classList.toggle("hidden",next===GAME_STATES.AUTH||next===GAME_STATES.RULES||next===GAME_STATES.LOBBY||next===GAME_STATES.DIFFICULTY_SELECT);
  if(btnSettings)btnSettings.classList.toggle("hidden",!(next===GAME_STATES.PLAYING||next===GAME_STATES.CEREMONY));
  if(btnStats)btnStats.classList.toggle("hidden",next===GAME_STATES.AUTH||next===GAME_STATES.RULES||next===GAME_STATES.GAMEOVER);
  if(mobileButtons)mobileButtons.classList.toggle("hidden",next!==GAME_STATES.PLAYING&&next!==GAME_STATES.CEREMONY);
  if(next===GAME_STATES.LOBBY){resetLobby();if(!lobbyReady)initLobby()}
  if(next===GAME_STATES.DIFFICULTY_SELECT){syncDifficultyUI();tryFullscreen()}
  checkOrientation();
}


function findMainPath(){var h=mapHeight(),w=mapWidth(),vis=[],par=[];for(var r=0;r<h;r++){vis[r]=[];par[r]=[];for(var c=0;c<w;c++){vis[r][c]=false;par[r][c]=null}}var q=[{r:startCell.r,c:startCell.c}];vis[startCell.r][startCell.c]=true;var ds=[[-1,0],[1,0],[0,-1],[0,1]];while(q.length>0){var cur=q.shift();if(cur.r===exitCell.r&&cur.c===exitCell.c){var path=[];var node=cur;while(node){path.unshift(node);node=par[node.r][node.c]}return path}for(var d=0;d<4;d++){var nr=cur.r+ds[d][0],nc=cur.c+ds[d][1];if(nr<0||nr>=h||nc<0||nc>=w||vis[nr][nc])continue;if(solids.has(keyOf(nr,nc)))continue;vis[nr][nc]=true;par[nr][nc]=cur;q.push({r:nr,c:nc})}}return null}
function findBarrierOffMainPath(r,c,mp){var ds=[[-1,0],[1,0],[0,-1],[0,1]],ps={},h=mapHeight(),w=mapWidth();if(mp)mp.forEach(function(cell){ps[keyOf(cell.r,cell.c)]=true});for(var d=0;d<ds.length;d++){var nr=r+ds[d][0],nc=c+ds[d][1];if(nr>0&&nr<h-1&&nc>0&&nc<w-1&&!isWallCell(nr,nc)){var k=keyOf(nr,nc);if(!ps[k]&&k!==keyOf(startCell.r,startCell.c)&&k!==keyOf(exitCell.r,exitCell.c))return{r:nr,c:nc}}}for(var d=0;d<ds.length;d++){var nr=r+ds[d][0],nc=c+ds[d][1];if(nr>0&&nr<h-1&&nc>0&&nc<w-1&&!isWallCell(nr,nc))return{r:nr,c:nc}}return null}
function isCellReachable(tr,tc){var h=mapHeight(),w=mapWidth(),vis=[];for(var r=0;r<h;r++){vis[r]=[];for(var c=0;c<w;c++)vis[r][c]=false}var q=[{r:startCell.r,c:startCell.c}];vis[startCell.r][startCell.c]=true;var ds=[[-1,0],[1,0],[0,-1],[0,1]];while(q.length>0){var cur=q.shift();if(cur.r===tr&&cur.c===tc)return true;for(var d=0;d<4;d++){var nr=cur.r+ds[d][0],nc=cur.c+ds[d][1];if(nr<0||nr>=h||nc<0||nc>=w||vis[nr][nc])continue;if(solids.has(keyOf(nr,nc)))continue;vis[nr][nc]=true;q.push({r:nr,c:nc})}}return false}
function cleanBlockedExits(sr,sc){var ds=[[-1,0],[1,0],[0,-1],[0,1]];for(var d=0;d<4;d++){var nr=sr+ds[d][0],nc=sc+ds[d][1];if(nr<=0||nr>=mapHeight()-1||nc<=0||nc>=mapWidth()-1)continue;for(var i=quizBarriers.length-1;i>=0;i--){var qb=quizBarriers[i];if(qb.gateCell.r===nr&&qb.gateCell.c===nc){scene.remove(qb.barrier);scene.remove(qb.mesh);quizBarriers.splice(i,1);sphinxes.splice(sphinxes.indexOf(qb),1)}}for(var i=gates.length-1;i>=0;i--){if(gates[i].r===nr&&gates[i].c===nc){gates[i].open=true;if(gates[i].mesh)gates[i].mesh.visible=false}}}}
function pathIndexOf(mp,r,c){if(!mp)return-1;for(var i=0;i<mp.length;i++)if(mp[i].r===r&&mp[i].c===c)return i;return-1}
function isNearExistingSphinx(r,c){return sphinxes.some(function(s){return Math.abs(s.r-r)+Math.abs(s.c-c)<4})}
function removeSphinxAt(i){var s=sphinxes[i];if(!s)return;if(s.mesh)scene.remove(s.mesh);if(s.barrier)scene.remove(s.barrier);var bi=quizBarriers.indexOf(s);if(bi>=0)quizBarriers.splice(bi,1);sphinxes.splice(i,1)}
function ensureKeySphinx(){if(!sphinxes.length)return;var best=sphinxes[0],bestScore=-1;sphinxes.forEach(function(s){s.isKeySphinx=false;var g=s.linkedGateIdx!==undefined?gates[s.linkedGateIdx]:null;var score=g?Math.abs(g.r-startCell.r)+Math.abs(g.c-startCell.c):0;if(score>bestScore){best=s;bestScore=score}});best.isKeySphinx=true}
function ensureSphinxCoverage(mp,gateGeo){if(!mp||mp.length<7)return;if(gates.length===0){var gc=mp[Math.max(3,Math.floor(mp.length*0.62))];if(gc&&!isWallCell(gc.r,gc.c))addGate(gc.r,gc.c,gateGeo)}for(var gi=0;gi<gates.length;gi++){var has=sphinxes.some(function(s){return s.linkedGateIdx===gi});if(!has)placeSphinxForGate(gi,0,mp.length,mp)}if(sphinxes.length===0){var idx=Math.max(2,Math.floor(mp.length*0.42)),cell=mp[idx],gate=gates[0];if(cell&&gate)addSphinx(cell.r,cell.c,{r:gate.r,c:gate.c},Math.floor(Math.random()*quizData.length),0)}ensureKeySphinx()}
function placeSphinxForGate(gi,ps,pe,mp){if(!mp||gi>=gates.length)return false;var gate=gates[gi],gateIdx=pathIndexOf(mp,gate.r,gate.c);if(gateIdx<0)gateIdx=Math.min(pe,mp.length-2);var from=Math.max(1,ps+1),to=Math.max(from,Math.min(pe-1,gateIdx-1,mp.length-2)),cands=[];for(var i=to;i>=from;i--){var cell=mp[i];if(!cell||isWallCell(cell.r,cell.c))continue;if(cell.r===startCell.r&&cell.c===startCell.c)continue;if(cell.r===exitCell.r&&cell.c===exitCell.c)continue;if(isNearExistingSphinx(cell.r,cell.c))continue;var wc=0;if(isWallCell(cell.r-1,cell.c))wc++;if(isWallCell(cell.r+1,cell.c))wc++;if(isWallCell(cell.r,cell.c-1))wc++;if(isWallCell(cell.r,cell.c+1))wc++;cands.push({r:cell.r,c:cell.c,score:(i/from)+wc*3+Math.random()})}if(!cands.length){for(var j=Math.max(1,gateIdx-4);j>=1;j--){var fb=mp[j];if(fb&&!isWallCell(fb.r,fb.c)&&!isNearExistingSphinx(fb.r,fb.c)){cands.push({r:fb.r,c:fb.c,score:1});break}}}if(!cands.length)return false;cands.sort(function(a,b){return b.score-a.score});var sc=cands[0];addSphinx(sc.r,sc.c,{r:gate.r,c:gate.c},Math.floor(Math.random()*quizData.length),gi);return true}
function findShiftWallPositionsNearExit(){var cands=[],h=mapHeight(),w=mapWidth();for(var r=2;r<h-2;r++)for(var c=2;c<w-2;c++){if(!isWallCell(r,c))continue;var dE=Math.abs(r-exitCell.r)+Math.abs(c-exitCell.c);if(dE>6)continue;var oa=(!isWallCell(r-1,c)&&!isWallCell(r+1,c))||(!isWallCell(r,c-1)&&!isWallCell(r,c+1));if(oa)cands.push({r:r,c:c})}for(var i=cands.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=cands[i];cands[i]=cands[j];cands[j]=t}return cands.slice(0,2)}
function findShiftWallPositions(){var cands=[],h=mapHeight(),w=mapWidth();for(var r=2;r<h-2;r++)for(var c=2;c<w-2;c++){if(!isWallCell(r,c))continue;var oa=(!isWallCell(r-1,c)&&!isWallCell(r+1,c))||(!isWallCell(r,c-1)&&!isWallCell(r,c+1));if(oa)cands.push({r:r,c:c})}for(var i=cands.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=cands[i];cands[i]=cands[j];cands[j]=t}return cands.slice(0,4)}
function placeExtraBlastEnded(path){var pool=(path&&path.length>8?path:[]).filter(function(cell){return Math.abs(cell.r-startCell.r)+Math.abs(cell.c-startCell.c)>6&&Math.abs(cell.r-blastEnded.home.r)+Math.abs(cell.c-blastEnded.home.c)>5&&!isWallCell(cell.r,cell.c)});var cell=pool.length?pool[Math.floor(pool.length*0.72)]:{r:Math.max(2,exitCell.r-2),c:Math.max(2,exitCell.c-2)};blastEnded2.home={r:cell.r,c:cell.c}}

function addMagicShard(r,c,geo){var pos=cellToWorld(r,c);var mat=new THREE.MeshStandardMaterial({color:0xd8f8ff,emissive:0x58c8ff,emissiveIntensity:1.7,roughness:0.28});var mesh=new THREE.Mesh(geo,mat);mesh.position.set(pos.x,1.1,pos.z);mesh.castShadow=true;var light=new THREE.PointLight(0x83ddff,2.2,8);light.position.set(pos.x,1.6,pos.z);scene.add(mesh,light);magicShards.push({r:r,c:c,mesh:mesh,light:light,collected:false})}
function addSnareTrap(r,c,geo){var pos=cellToWorld(r,c);var mesh=new THREE.Mesh(geo,trapMaterial.clone());mesh.position.set(pos.x,0.08,pos.z);mesh.receiveShadow=true;scene.add(mesh);traps.push({r:r,c:c,mesh:mesh,cooldown:0})}
function addGate(r,c,geo){var pos=cellToWorld(r,c);var mesh=new THREE.Mesh(geo,gateMaterial);mesh.position.set(pos.x,1.45,pos.z-CELL*0.36);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);gates.push({r:r,c:c,mesh:mesh,open:false})}
function addSphinx(r,c,gc,qi,li){var pos=cellToWorld(r,c);var group=createModelInstance("sphinx",{height:1.6,groundAlign:true});var glow=new THREE.PointLight(0xffdd8c,4.0,10);glow.position.set(0,1.4,0.2);group.add(glow);group.position.set(pos.x,0,pos.z);var gw=cellToWorld(gc.r,gc.c);group.lookAt(new THREE.Vector3(gw.x,0,gw.z));group.rotateY(Math.PI);scene.add(group);var barrier=new THREE.Mesh(new THREE.BoxGeometry(CELL*0.9,2.35,0.22),new THREE.MeshStandardMaterial({color:0x78cfff,emissive:0x2588ff,emissiveIntensity:1.3,transparent:true,opacity:0.72,roughness:0.18}));barrier.position.set(gw.x,1.25,gw.z);barrier.castShadow=true;scene.add(barrier);var s={r:r,c:c,gateCell:gc,quizIndex:qi,mesh:group,barrier:barrier,solved:false,linkedGateIdx:li};sphinxes.push(s);quizBarriers.push(s)}
function addShiftingWall(r,c,phase){var pos=cellToWorld(r,c);var mat=new THREE.MeshStandardMaterial({color:0x375b2d,emissive:0x0d240f,transparent:true,opacity:0.88,roughness:0.86});var mesh=new THREE.Mesh(new THREE.BoxGeometry(CELL*0.95,3.25,CELL*0.95),mat);mesh.position.set(pos.x,-4,pos.z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);shiftingWalls.push({r:r,c:c,phase:phase,mesh:mesh,active:false,y:-4});solids.delete(keyOf(r,c))}
function addTriwizardCup(){var pos=cellToWorld(exitCell.r,exitCell.c);var cup=new THREE.Group();var gold=new THREE.MeshStandardMaterial({color:0xffd675,metalness:0.72,roughness:0.24,emissive:0x4a3510,emissiveIntensity:0.4});var blue=new THREE.MeshBasicMaterial({color:0x9ee9ff,transparent:true,opacity:0.85});var bowl=new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.48,0.72,32),gold);var stem=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.24,0.82,24),gold);var foot=new THREE.Mesh(new THREE.CylinderGeometry(0.72,0.42,0.2,32),gold);var lip=new THREE.Mesh(new THREE.TorusGeometry(0.9,0.06,10,36),gold);var lh=new THREE.Mesh(new THREE.TorusGeometry(0.48,0.045,10,26,Math.PI),gold);var rh=lh.clone();var flame=new THREE.Mesh(new THREE.CylinderGeometry(0,0.42,0.9,24),blue);bowl.position.y=1.45;stem.position.y=0.75;foot.position.y=0.26;lip.position.y=1.83;lh.position.set(-0.83,1.5,0);lh.rotation.z=Math.PI/2;rh.position.set(0.83,1.5,0);rh.rotation.z=-Math.PI/2;flame.position.y=2.36;flame.name="cupFlame";cup.add(bowl,stem,foot,lip,lh,rh,flame);cup.position.set(pos.x,0,pos.z);cup.name="triwizardCup";scene.add(cup);var cl=new THREE.PointLight(0x9ee9ff,3.5,10);cl.name="cupLight";cl.position.set(pos.x,2.2,pos.z);scene.add(cl);var pg=new THREE.SphereGeometry(0.05,8,8);for(var i=0;i<16;i++){var p=new THREE.Mesh(pg,blue.clone());p.position.set(pos.x,2+Math.random()*2.2,pos.z);scene.add(p);exitParticles.push({mesh:p,seed:Math.random()*100,radius:0.5+Math.random()*1.2,height:2+Math.random()*2.0})}}
function placeTorches(){var placed=[],ms=5,h=mapHeight(),w=mapWidth();for(var r=1;r<h-1;r++)for(var c=1;c<w-1;c++){if(isWallCell(r,c))continue;var k=keyOf(r,c);if(k===keyOf(startCell.r,startCell.c)||k===keyOf(exitCell.r,exitCell.c))continue;var ds=[[-1,0],[1,0],[0,-1],[0,1]];var wds=ds.filter(function(d){return isWallCell(r+d[0],c+d[1])});if(wds.length<1||wds.length>2)continue;var tc=placed.some(function(p){return Math.abs(p.r-r)+Math.abs(p.c-c)<ms});if(tc)continue;var dir=wds[0],pos=cellToWorld(r,c),ox=dir[1]*1.45,oz=dir[0]*1.45;createTorch(pos.x+ox,pos.z+oz,r,c);placed.push({r:r,c:c})}}
function createTorch(wx,wz,cr,cc){var group=new THREE.Group();var post=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.09,2.0,8),torchWoodMat);post.position.y=1.0;post.receiveShadow=true;group.add(post);var flame=new THREE.Mesh(new THREE.CylinderGeometry(0,0.1,0.35,8),torchFlameMat.clone());flame.position.y=2.15;flame.name="torchFlame";group.add(flame);var light=new THREE.PointLight(0xff9944,3.0,11);light.position.y=2.4;light.name="torchLight";group.add(light);group.position.set(wx,0,wz);scene.add(group);torches.push({group:group,light:light,flame:flame,baseIntensity:3.0,seed:Math.random()*100,cellR:cr,cellC:cc})}
function addEntranceArch(){var ep=cellToWorld(startCell.r,startCell.c);var cands=[{r:startCell.r-1,c:startCell.c},{r:startCell.r+1,c:startCell.c},{r:startCell.r,c:startCell.c-1},{r:startCell.r,c:startCell.c+1}];var ew=null;for(var i=0;i<cands.length;i++){if(solids.has(keyOf(cands[i].r,cands[i].c))){ew=cands[i];break}}if(!ew)return;solids.delete(keyOf(ew.r,ew.c));var wp=cellToWorld(ew.r,ew.c),ax=wp.x,az=wp.z;var ag=new THREE.Group();var pg=new THREE.BoxGeometry(0.35,4.2,0.35),lg=new THREE.BoxGeometry(CELL*0.9,0.3,0.4);var lp=new THREE.Mesh(pg,archStoneMat);lp.position.set(-1.55,2.1,0);lp.castShadow=true;var rp=new THREE.Mesh(pg,archStoneMat);rp.position.set(1.55,2.1,0);rp.castShadow=true;var ll=new THREE.Mesh(lg,archStoneMat);ll.position.set(0,4.25,0);ll.castShadow=true;ag.add(lp,rp,ll);ag.position.set(ax,0,az);var sp=cellToWorld(startCell.r,startCell.c);ag.lookAt(new THREE.Vector3(sp.x,1.5,sp.z));ag.name="entranceArch";scene.add(ag);var bg=new THREE.SphereGeometry(0.22,12,8),bm=new THREE.MeshStandardMaterial({color:0x3a3a3a,metalness:0.85,roughness:0.4});for(var j=-1;j<=1;j+=2){var br=new THREE.Mesh(bg,bm);br.position.set(j*1.55,3.95,0);ag.add(br);var fg=new THREE.PointLight(0xff7733,3.5,8);fg.position.set(j*1.55,4.1,0);ag.add(fg);entranceBraziers.push({light:fg,seed:Math.random()*100,baseY:4.1,parent:ag})}}
function addSentinelObj(s){var body=createModelInstance("dementor",{height:2.8,groundAlign:false});body.castShadow=true;var mistMat=new THREE.MeshBasicMaterial({color:0x8eeeff,transparent:true,opacity:0.2,depthWrite:false});for(var mi=0;mi<6;mi++){var wisp=new THREE.Mesh(new THREE.SphereGeometry(0.1+Math.random()*0.08,6,5),mistMat.clone());wisp.position.set((Math.random()-0.5)*1.2,Math.random()*2.5-0.5,(Math.random()-0.5)*0.8);wisp.userData={seed:Math.random()*100,home:wisp.position.clone()};body.add(wisp)}var eye=new THREE.PointLight(0xbdf6ff,5.0,12);s.path=[];var h=mapHeight(),w=mapWidth();for(var i=0;i<6;i++){for(var tries=0;tries<100;tries++){var pr=2+Math.floor(Math.random()*(h-4)),pc=2+Math.floor(Math.random()*(w-4));if(!isWallCell(pr,pc)){s.path.push({r:pr,c:pc});break}}}if(s.path.length===0)s.path.push({r:Math.floor(h/2),c:Math.floor(w/2)});var first=cellToWorld(s.path[0].r,s.path[0].c);s.position.set(first.x,1.02,first.z);body.position.copy(s.position);eye.position.set(first.x,1.82,first.z);s.mesh=body;s.light=eye;scene.add(body,eye)}
function addSentinel(){addSentinelObj(sentinel);if(currentDifficulty==="hard")addSentinelObj(sentinel2);}
function addBlastEndedSkrewt(be){var pos=cellToWorld(be.home.r,be.home.c);var group=createModelInstance("skrewt",{height:2.2,groundAlign:true});group.position.set(pos.x,0,pos.z);scene.add(group);var light=new THREE.PointLight(0xff5d28,3.5,9);light.position.set(pos.x,1,pos.z);scene.add(light);be.mesh=group;be.light=light;be.position.set(pos.x,0,pos.z);be.state="patrol";be.patrolPhase=Math.random()*Math.PI*2;be.hitTimer=0;be.listenTimer=0}
function addFireflies(){var mat=new THREE.MeshBasicMaterial({color:0xa9fff2}),geo=new THREE.SphereGeometry(0.03,6,6);for(var i=0;i<20;i++){var c=1+Math.floor(Math.random()*(mapWidth()-2)),r=1+Math.floor(Math.random()*(mapHeight()-2));if(isWallCell(r,c))continue;var pos=cellToWorld(r,c);var mote=new THREE.Mesh(geo,mat);mote.position.set(pos.x+(Math.random()-0.5)*CELL,1+Math.random()*2.2,pos.z+(Math.random()-0.5)*CELL);scene.add(mote);fireflies.push({mesh:mote,seed:Math.random()*100})}}
function addBuffs(){var de=findDeadEnds().filter(function(cell){var k=keyOf(cell.r,cell.c);return k!==keyOf(startCell.r,startCell.c)&&k!==keyOf(exitCell.r,exitCell.c)});var sh=de.slice().sort(function(){return Math.random()-0.5});var baseTypes=["time","scroll","shoes","time"];var allTypes=baseTypes.slice();if(sh.length>4&&Math.random()<0.45)allTypes.push("map");var count=Math.min(sh.length,allTypes.length);for(var i=0;i<count;i++){var cell=sh[i],type=allTypes[i],pos=cellToWorld(cell.r,cell.c);var matColor=type==="time"?0xffd56f:type==="scroll"?0xa9e5ff:type==="map"?0xf5e6c8:0xb5ff90;var matEmissive=type==="time"?0xb06a16:type==="scroll"?0x2f95ff:type==="map"?0x4a3520:0x45c737;var mat=new THREE.MeshStandardMaterial({color:matColor,emissive:matEmissive,emissiveIntensity:1.45,roughness:0.36});var geo=type==="time"?new THREE.OctahedronGeometry(0.48):type==="scroll"?new THREE.BoxGeometry(0.75,0.24,0.42):type==="map"?new THREE.BoxGeometry(0.6,0.1,0.8):new THREE.TorusGeometry(0.42,0.11,10,20);var mesh=new THREE.Mesh(geo,mat);mesh.position.set(pos.x,0.85,pos.z);mesh.castShadow=true;var light=new THREE.PointLight(matColor,1.8,7);light.position.set(pos.x,1.3,pos.z);scene.add(mesh,light);buffs.push({r:cell.r,c:cell.c,type:type,mesh:mesh,light:light,collected:false})}}
function addGoldenSnitch(){var h=mapHeight(),w=mapWidth(),r=Math.floor(h/2)+Math.floor(Math.random()*5-2),c=Math.floor(w/2)+Math.floor(Math.random()*5-2);if(isWallCell(r,c)){r=Math.floor(h/2);c=Math.floor(w/2)}goldenSnitch.home={r:r,c:c};var pos=cellToWorld(r,c);var group=new THREE.Group();var body=new THREE.Mesh(new THREE.SphereGeometry(0.2,16,12),new THREE.MeshStandardMaterial({color:0xffd700,metalness:0.9,roughness:0.2,emissive:0x885500,emissiveIntensity:0.6}));group.add(body);var wg=new THREE.PlaneGeometry(0.35,0.12),wm=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.5,side:THREE.DoubleSide});var lw=new THREE.Mesh(wg,wm);lw.position.set(0.2,0.05,0);group.add(lw);var rw=new THREE.Mesh(wg,wm);rw.position.set(-0.2,0.05,0);group.add(rw);group.position.set(pos.x,1.8,pos.z);group.castShadow=true;group.name="goldenSnitch";scene.add(group);var light=new THREE.PointLight(0xffd700,2.5,8);light.position.copy(group.position);scene.add(light);goldenSnitch.mesh=group;goldenSnitch.light=light;goldenSnitch.position.copy(group.position);goldenSnitch.velocity.set((Math.random()-0.5)*3,0,(Math.random()-0.5)*3);var rc=worldToCell(pos.x,pos.z);if(isWallCell(rc.r,rc.c)){group.position.set(pos.x,1.8,pos.z+CELL*2);goldenSnitch.position.copy(group.position)}}

function updateJoystick(){if(!joystickEl||!joystickKnobEl)return;if(!joystickState.active){joystickEl.classList.add("joystick-hidden");joystickEl.classList.remove("joystick-active");return}joystickEl.classList.add("joystick-active");joystickEl.classList.remove("joystick-hidden");joystickEl.style.left=(joystickState.baseX-65)+"px";joystickEl.style.top=(joystickState.baseY-65)+"px";var dist=Math.hypot(joystickState.dx,joystickState.dy),cd=Math.min(dist,JOYSTICK_MAX_R),nx=dist>0?joystickState.dx/dist*cd:0,ny=dist>0?joystickState.dy/dist*cd:0;joystickKnobEl.style.transform="translate(calc(-50% + "+nx+"px), calc(-50% + "+ny+"px))"}
function getMoveInput(){var ix=0,iz=0;if(joystickState.active){var dist=Math.hypot(joystickState.dx,joystickState.dy);if(dist>8){var norm=Math.min(dist,JOYSTICK_MAX_R)/JOYSTICK_MAX_R;ix=joystickState.dx/dist*norm;iz=-joystickState.dy/dist*norm}}else{if(keys.has("ArrowUp")||keys.has("KeyW"))iz=1;if(keys.has("ArrowDown")||keys.has("KeyS"))iz=-1;if(keys.has("ArrowRight")||keys.has("KeyD"))ix=1;if(keys.has("ArrowLeft")||keys.has("KeyA"))ix=-1}return{x:ix,z:iz}}

function startGame(){return enterMaze(selectedHeroId,currentDifficulty)}
function enterMaze(heroId,difficulty){
  if(!modelsLoaded){setMessage("正在加载3D模型资源，请稍候...",2);loadAllModels().then(function(){modelsLoaded=true;enterMaze(heroId,difficulty)}).catch(function(){modelsLoaded=true;enterMaze(heroId,difficulty)});return}
  if(!currentUser&&!isAdmin){setGameState(GAME_STATES.AUTH);setMessage("请先登录或注册游戏ID",3);return}
  if(!heroId&&!isAdmin){setMessage("请选择角色后再踏入迷宫！",3);setGameState(GAME_STATES.LOBBY);return}
  currentDifficulty=difficultySettings[difficulty]?difficulty:"medium";localStorage.setItem("maze_diff",currentDifficulty);
  selectedHeroId=heroConfig[heroId]?heroId:"harry";localStorage.setItem("maze_hero",selectedHeroId);
  var diff=difficultySettings[currentDifficulty],hero=heroConfig[selectedHeroId];currentHero=hero;
  MAZE_SIZE=diff.size;START_TIME=diff.startTime;SENTINEL_SPD=diff.sentinelSpeed;SPHINX_DMG=diff.sphinxDmg;
  if(hero){WALK_SPEED=hero.speed;heroHP=hero.hp;heroWandDecay=hero.wandDecayMult||1;heroLightMult=hero.lightMult||1;heroDeadEndR=hero.deadEndRange||0}else{heroHP=100;heroWandDecay=1;heroLightMult=1;heroDeadEndR=0}
  weaponCooldown=0;if(currentHero){currentHero._vanishUntil=0}
  if(currentHero&&currentHero._smokeFx){for(var si=0;si<currentHero._smokeFx.length;si++){var sm=currentHero._smokeFx[si];scene.remove(sm);sm.geometry.dispose();sm.material.dispose()}currentHero._smokeFx=[]}
  cleanupWorld();generateMaze();initWorld();
  setGameState(GAME_STATES.CEREMONY);ceremonyAlpha=0;document.body.classList.add("ceremony");resetGame(true);
  try{canvas.requestPointerLock()}catch(e){}if(isMobile){tryFullscreen()}
  ensureAudio();startAmbientDrone();setMessage("你站在迷宫入口。树篱在你前方分开，远处有微弱的蓝光在闪烁。",4);
  if(joystickEl){joystickEl.classList.add("joystick-hidden");joystickEl.classList.remove("joystick-active")}joystickState.active=false;cameraTouch.active=false
}
function exitMaze(resetAudio){stopRenderLoop();try{document.exitPointerLock()}catch(e){}stopAmbientDrone();clearPatronusBeam();clearGhostPath();cleanupWorld();currentHero=null;snare=null;currentQuiz=null;dementorAura=false;document.body.classList.remove("snared","dementor","damaged","shake","ceremony");if(resetAudio&&audioCtx){try{audioCtx.close()}catch(e){}audioCtx=null;ambientDrone=null}initLobby()}
function tryFullscreen(){var el=document.documentElement,p=null;if(document.fullscreenElement||document.webkitFullscreenElement||document.msFullscreenElement){tryLockLandscape();return}if(el.requestFullscreen){p=el.requestFullscreen()}else if(el.webkitRequestFullscreen){p=el.webkitRequestFullscreen()}else if(el.msRequestFullscreen){p=el.msRequestFullscreen()}if(p&&p.then){p.then(function(){tryLockLandscape()}).catch(function(){tryLockLandscape()})}else tryLockLandscape()}
function tryLockLandscape(){try{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock("landscape").catch(function(){})}catch(e){}}
function cleanupWorld(){lobbyReady=false;var ps=new Set([scene,camera,lumos,lumos.target]);for(var i=scene.children.length-1;i>=0;i--){var child=scene.children[i];if(ps.has(child))continue;disposeR(child);scene.remove(child)}function disposeR(obj){if(ps.has(obj))return;if(obj.children){for(var i=obj.children.length-1;i>=0;i--){disposeR(obj.children[i]);obj.remove(obj.children[i])}}if(obj.geometry&&!obj.geometry._shared){try{obj.geometry.dispose()}catch(e){}}if(obj.material){var mats=Array.isArray(obj.material)?obj.material:[obj.material];mats.forEach(function(m){if(m&&m.dispose)try{m.dispose()}catch(e){}})}if(obj.dispose&&typeof obj.dispose==="function"&&!obj.geometry){try{obj.dispose()}catch(e){}}}magicShards.length=0;traps.length=0;sphinxes.length=0;gates.length=0;quizBarriers.length=0;fireflies.length=0;shiftingWalls.length=0;shiftingWallSolidCache={};deadEndMarks.length=0;buffs.length=0;exitParticles.length=0;torches.length=0;entranceBraziers.length=0;sentinel.mesh=null;sentinel.light=null;sentinel.path=[];sentinel2.mesh=null;sentinel2.light=null;sentinel2.path=[];goldenSnitch.mesh=null;goldenSnitch.light=null;blastEndedPack.forEach(function(be){be.mesh=null;be.light=null;be.state="patrol";be.hitTimer=0;be.listenTimer=0});patronusTarget=null;modelMixers.length=0;solids.clear();markerCells.clear()}
function setupCeremonyCamera(){var sp=cellToWorld(startCell.r,startCell.c);player.position.set(sp.x,PLAYER_HEIGHT,sp.z);camera.position.copy(player.position);yaw=Math.atan2(sp.x-0,sp.z-0);pitch=0;updateCamera()}
function resetGame(placeAtStart){timeLeft=START_TIME;health=heroHP;wandPower=1;sprintEnergy=1;isSprinting=false;dementorAura=false;snare=null;scrollCharges=0;cupKeyObtained=false;freeSprintUntil=0;guideUntil=0;currentQuiz=null;ceremonyAlpha=0;housePoints=0;mapCharges=0;frenzyActivated=false;dementorSlow=false;heroSpeedBuff=null;_idleSince=0;_dementorDrainAcc=0;shiftWallCountdown=20;if(timeEl)timeEl.classList.remove("frenzy");document.body.style.filter="";velocity.set(0,0,0);yaw=-Math.PI/2;pitch=0;markerCells.clear();sprintToggled=false;keyboardSprint=false;if(btnSprint)btnSprint.classList.remove("active","boosting");if(placeAtStart)setupCeremonyCamera();magicShards.forEach(function(s){s.collected=false;s.mesh.visible=true;s.light.visible=true});traps.forEach(function(t){t.cooldown=0;t.mesh.material.emissive.setHex(0x220600)});sphinxes.forEach(function(s){s.solved=false;s.mesh.visible=true;s.barrier.visible=true});gates.forEach(function(g){g.open=false;g.mesh.visible=true});buffs.forEach(function(b){b.collected=false;b.mesh.visible=true;b.light.visible=true});sentinel.target=0;sentinel.strikeTimer=0;sentinel.forcedChaseTimer=0;sentinel.banished=false;sentinel.banishTimer=0;sentinel._frozen=0;sentinel2.target=0;sentinel2.strikeTimer=0;sentinel2.forcedChaseTimer=0;sentinel2.banished=false;sentinel2.banishTimer=0;sentinel2._frozen=0;clearPatronusBeam();clearGhostPath();guideUntil=0;if(sentinel.path.length>0&&sentinel.mesh){var f=cellToWorld(sentinel.path[0].r,sentinel.path[0].c);sentinel.position.set(f.x,1.02,f.z);sentinel.mesh.position.copy(sentinel.position);if(sentinel.light)sentinel.light.position.set(f.x,1.7,f.z)}if(sentinel2.path.length>0&&sentinel2.mesh){var f2=cellToWorld(sentinel2.path[0].r,sentinel2.path[0].c);sentinel2.position.set(f2.x,1.02,f2.z);sentinel2.mesh.position.copy(sentinel2.position);if(sentinel2.light)sentinel2.light.position.set(f2.x,1.7,f2.z)}blastEndedPack.forEach(function(be){var bh=cellToWorld(be.home.r,be.home.c);be.position.set(bh.x,0,bh.z);be.state="patrol";be.stunTimer=0;be.hitTimer=0;be.listenTimer=0;if(be.mesh){be.mesh.position.copy(be.position);if(be.light)be.light.position.set(bh.x,1,bh.z)}});document.body.classList.remove("snared","dementor","damaged","shake");document.body.classList.add("ceremony");updateHud();setMessage("黑暗笼罩着树篱迷宫。左侧摇杆移动，右侧滑动环顾。",4)}

function startRenderLoop(){if(animationFrameId)return;lastTime=performance.now();animationFrameId=requestAnimationFrame(animate)}
function stopRenderLoop(){if(animationFrameId){cancelAnimationFrame(animationFrameId);animationFrameId=0}}
function animate(now){if(!animationFrameId)return;var dt=Math.min((now-lastTime)/1000,0.05);lastTime=now;var t=now/1000;if(weaponCooldown>0)weaponCooldown=Math.max(0,weaponCooldown-dt);
  if(currentHero&&currentHero._smokeFx){for(var si=currentHero._smokeFx.length-1;si>=0;si--){var s=currentHero._smokeFx[si];s.userData.life-=dt;s.material.opacity=Math.max(0,s.userData.life/3);s.scale.setScalar(1+(3-s.userData.life)*1.5);if(s.userData.life<=0){scene.remove(s);s.geometry.dispose();s.material.dispose();currentHero._smokeFx.splice(si,1)}}}updateSceneMotion(t,dt);updateCreatureAnimations(t,dt);updateExitReveal();if(gameState===GAME_STATES.PLAYING){dementorSlow=false;updatePlayer(dt);updateSentinel(dt,t);updateSentinel2(dt,t);blastEndedPack.forEach(function(be){updateBlastEnded(be,dt,t)});updateGameRules(dt,t);updateInteractionPrompt();updateExitAudio(t);updateStateAudio(t);var minSD=Infinity;[sentinel,sentinel2].forEach(function(s){if(!s.mesh||s.banished)return;var d=Math.hypot(player.position.x-s.position.x,player.position.z-s.position.z);if(d<minSD)minSD=d;});if(minSD<10){var atmI=1-(minSD/10);document.body.style.filter="grayscale("+(atmI*80)+"%) blur("+(atmI*2)+"px) brightness("+(1-atmI*0.4)+")";if(tinnitusGain&&audioCtx){tinnitusGain.gain.setTargetAtTime(atmI*0.06,audioCtx.currentTime,0.1);}if(wailGain&&audioCtx){wailGain.gain.setTargetAtTime(atmI*0.04,audioCtx.currentTime,0.1);}}else{document.body.style.filter="";if(tinnitusGain&&audioCtx){tinnitusGain.gain.setTargetAtTime(0,audioCtx.currentTime,0.3);}if(wailGain&&audioCtx){wailGain.gain.setTargetAtTime(0,audioCtx.currentTime,0.3);}}}else if(gameState===GAME_STATES.CEREMONY){updateCeremony(dt,t);updatePlayer(dt);updateSentinel(dt,t);updateSentinel2(dt,t);updateStateAudio(t)}lumos.intensity=8.0+wandPower*8.0+Math.sin(t*0.012)*0.3;lumos.distance=(14+wandPower*16)*heroLightMult;lumos.angle=Math.PI/(4.5/heroLightMult);updateCamera(t);updateJoystick();renderer.render(scene,camera);animationFrameId=requestAnimationFrame(animate)}
function updateCeremony(dt,t){ceremonyAlpha+=dt;var moved=Math.hypot(velocity.x,velocity.z)>0.4;if(moved||ceremonyAlpha>2.5){setGameState(GAME_STATES.PLAYING);document.body.classList.remove("ceremony");timeLeft=START_TIME;setMessage("你踏入了迷宫。远处传来火龙杯的低吟……",3.5);playChord([392,523,784],0.32,0.055)}}
function updateSceneMotion(t,dt){magicShards.forEach(function(s,i){if(!s.mesh)return;s.mesh.rotation.y+=dt*1.8;s.mesh.position.y=1.1+Math.sin(t*2.6+i)*0.14;if(s.light)s.light.intensity=s.collected?0:1.6+Math.sin(t*4+i)*0.3});var cup=scene.getObjectByName("triwizardCup"),cf=scene.getObjectByName("cupFlame"),cl=scene.getObjectByName("cupLight");if(cup)cup.rotation.y+=dt*0.35;if(cf){cf.scale.setScalar(0.85+Math.sin(t*5.5)*0.15);cf.rotation.y+=dt*1.4}if(cl)cl.intensity=3.0+Math.sin(t*3.8)*0.8;var ew=cellToWorld(exitCell.r,exitCell.c);exitParticles.forEach(function(p){if(!p.mesh)return;var a=t*1.4+p.seed;p.mesh.position.x=ew.x+Math.cos(a)*p.radius;p.mesh.position.z=ew.z+Math.sin(a*0.9)*p.radius;p.mesh.position.y=p.height+Math.sin(a*1.7)*0.8;p.mesh.material.opacity=0.42+Math.sin(a*2.2)*0.28});torches.forEach(function(tc){if(!tc.light)return;var fl=0.82+Math.sin(t*12+tc.seed)*0.14+Math.sin(t*19+tc.seed)*0.08;tc.light.intensity=tc.baseIntensity*fl;if(tc.flame){tc.flame.scale.setScalar(0.85+Math.sin(t*14+tc.seed)*0.18);tc.flame.position.y=2.15+Math.sin(t*16+tc.seed)*0.04}});entranceBraziers.forEach(function(b){if(!b.light)return;b.light.intensity=3.0+Math.sin(t*11+b.seed)*0.8+Math.sin(t*17+b.seed)*0.3});fireflies.forEach(function(f){if(!f.mesh)return;f.mesh.position.y+=Math.sin(t*1.4+f.seed)*0.002;f.mesh.position.x+=Math.sin(t*0.8+f.seed)*0.003});shiftingWalls.forEach(function(w){if(!w.mesh)return;w.active=Math.sin(t*0.72+w.phase)>0.35;var ty=w.active?1.7:-4;w.y=w.y+(ty-w.y)*Math.min(dt*6.5,1);if(Math.abs(w.y-ty)<0.05)w.y=ty;w.mesh.position.y=w.y;w.mesh.visible=w.y>-3.7;w.mesh.material.opacity=Math.max(0.18,Math.min(0.92,(w.y+4)/5.7));var solid=w.active&&w.y>-0.2;shiftingWallSolidCache[keyOf(w.r,w.c)]=solid});deadEndMarks.forEach(function(m,i){if(!m.mesh)return;m.mesh.rotation.y+=dt*2.8;if(m.mat)m.mat.emissiveIntensity=0.9+Math.sin(t*7+i)*0.55});if(goldenSnitch.mesh){goldenSnitch.wanderTimer-=dt;if(goldenSnitch.wanderTimer<=0){goldenSnitch.wanderTimer=1.0+Math.random()*2;goldenSnitch.velocity.set((Math.random()-0.5)*8,Math.sin(t*4)*2,(Math.random()-0.5)*8)}var tp=player.position.clone();tp.y=0;var sp=goldenSnitch.position.clone();sp.y=0;var dtp=sp.distanceTo(tp);if(dtp<7){var away=sp.clone().sub(tp).normalize().multiplyScalar(8);goldenSnitch.velocity.lerp(away,dt*5)}var ns=goldenSnitch.position.clone().addScaledVector(goldenSnitch.velocity,dt);var sc=worldToCell(ns.x,ns.z);if(isWallCell(sc.r,sc.c)){goldenSnitch.velocity.x*=-0.8;goldenSnitch.velocity.z*=-0.8}else{goldenSnitch.position.copy(ns)}goldenSnitch.position.y=1.8+Math.sin(t*4)*0.5;goldenSnitch.mesh.position.copy(goldenSnitch.position);goldenSnitch.mesh.rotation.y+=dt*4;if(goldenSnitch.light)goldenSnitch.light.position.copy(goldenSnitch.position)}if(ghostPathMarkers.length>0){var fp=guideUntil>0?Math.max(0,(guideUntil-performance.now())/6000):0;for(var gi=0;gi<ghostPathMarkers.length;gi++){var gm=ghostPathMarkers[gi];if(gm.mat)gm.mat.opacity=0.15+fp*0.55}if(performance.now()>guideUntil){clearGhostPath();guideUntil=0}}buffs.forEach(function(b,i){if(!b.mesh||b.collected)return;b.mesh.rotation.y+=dt*1.4;b.mesh.position.y=0.85+Math.sin(t*2.2+i)*0.12;if(b.light)b.light.intensity=1.4+Math.sin(t*4.5+i)*0.35});if(patronusBeam.active){var el=(performance.now()-patronusBeam.startTime)/1000,prog=Math.min(el/patronusBeam.duration,1);var pos=new THREE.Vector3().lerpVectors(patronusBeam.origin,patronusBeam.target,prog);if(patronusBeam.mesh){patronusBeam.mesh.position.copy(pos);patronusBeam.mesh.lookAt(patronusBeam.target);patronusBeam.mesh.rotation.x+=Math.PI/2;patronusBeam.mesh.scale.y=Math.min(prog*8,8);patronusBeam.mesh.material.opacity=0.9*(1-prog*0.5)}if(patronusBeam.light)patronusBeam.light.position.copy(pos);if(patronusBeam.particles){for(var pi=0;pi<patronusBeam.particles.length;pi++){var pp=patronusBeam.particles[pi];var pProg=Math.min(prog+pi*0.04,1);pp.position.lerpVectors(patronusBeam.origin,patronusBeam.target,pProg);pp.position.x+=(Math.random()-0.5)*0.4;pp.position.y+=(Math.random()-0.5)*0.4;pp.material.opacity=0.8*(1-pProg)}}if(prog>=1){if(patronusTarget&&!patronusTarget.banished){patronusTarget.banished=true;patronusTarget.banishTimer=(15+Math.random()*10)*0.8;housePoints+=50;setMessage("呼神护卫击中了摄魂怪！+50 分。它暂时消散了。",3);playChord([523,784,1046],0.3,0.08);dementorAura=false;document.body.classList.remove("dementor","shake")}patronusTarget=null;clearPatronusBeam()}}}
function updateExitReveal(){var cup=scene.getObjectByName("triwizardCup"),flame=scene.getObjectByName("cupFlame"),light=scene.getObjectByName("cupLight"),ep=cellToWorld(exitCell.r,exitCell.c),dist=Math.hypot(ep.x-player.position.x,ep.z-player.position.z),near=dist<CELL*3.2,reveal=cupKeyObtained||near||gameState===GAME_STATES.GAMEOVER;if(cup){cup.visible=reveal;cup.scale.setScalar(cupKeyObtained?1:0.86)}if(flame&&flame.material){flame.visible=reveal;flame.material.opacity=cupKeyObtained?0.9:0.42}if(light){light.intensity=cupKeyObtained?3.4:near?0.9:0;light.distance=cupKeyObtained?10:5}exitParticles.forEach(function(p){if(!p.mesh)return;p.mesh.visible=cupKeyObtained||dist<CELL*2.6;if(p.mesh.material)p.mesh.material.opacity=Math.min(p.mesh.material.opacity,cupKeyObtained?0.55:0.22)})}
function updatePlayer(dt){var forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),input=new THREE.Vector3();var mi=getMoveInput();if(mi.z!==0)input.add(forward.clone().multiplyScalar(mi.z));if(mi.x!==0)input.add(right.clone().multiplyScalar(mi.x));if(input.lengthSq()>0)input.normalize();var ws=keys.has("ShiftLeft")||keys.has("ShiftRight")||sprintToggled,fs=performance.now()<freeSprintUntil,cs=ws&&!dementorAura&&input.lengthSq()>0&&(sprintEnergy>0.05||fs);isSprinting=cs;if(btnSprint){if(fs)btnSprint.classList.add("boosting");else btnSprint.classList.remove("boosting")}var sl=snare?0.3:1,sb=cs?SPRINT_SPEED:1;var slowMult=dementorSlow?0.85:1;var buffMult=(heroSpeedBuff&&performance.now()<heroSpeedBuff.until)?heroSpeedBuff.mult:1;if(heroSpeedBuff&&performance.now()>=heroSpeedBuff.until)heroSpeedBuff=null;var target=input.multiplyScalar(WALK_SPEED*sb*sl*slowMult*buffMult);velocity.x=THREE.MathUtils.damp(velocity.x,target.x,12,dt);velocity.z=THREE.MathUtils.damp(velocity.z,target.z,12,dt);if(cs&&!fs&&input.lengthSq()>0.01)sprintEnergy=Math.max(0,sprintEnergy-dt*SPRINT_DRAIN);else if(!cs||input.lengthSq()<0.01)sprintEnergy=Math.min(1,sprintEnergy+dt*SPRINT_RECOVERY);moveWithCollision(velocity.x*dt,velocity.z*dt);player.cell=worldToCell(player.position.x,player.position.z);var moving=Math.hypot(velocity.x,velocity.z)>0.65,fg=isSprinting?260:450;if(moving&&performance.now()-lastFootstep>fg){lastFootstep=performance.now();playFootstep(isSprinting?0.048:0.028)}}
function moveWithCollision(dx,dz){var nx=player.position.x+dx;if(!checkXCollision(nx,player.position.z,dx))player.position.x=nx;else velocity.x=0;var nz=player.position.z+dz;if(!checkZCollision(player.position.x,nz,dz))player.position.z=nz;else velocity.z=0}
function checkXCollision(x,z,dx){var s=dx>0?1:-1;return isSolidSingle(x+s*PLAYER_RADIUS,z)}
function checkZCollision(x,z,dz){var s=dz>0?1:-1;return isSolidSingle(x,z+s*PLAYER_RADIUS)}
function isSolidSingle(px,pz){var cell=worldToCell(px,pz);if(cell.r<0||cell.c<0||cell.r>=mapHeight()||cell.c>=mapWidth())return true;if(solids.has(keyOf(cell.r,cell.c)))return true;if(isGateCell(cell.r,cell.c))return true;if(isQuizBarrierCell(cell.r,cell.c))return true;return!!shiftingWallSolidCache[keyOf(cell.r,cell.c)]}
function updateSentinel(dt,t){if(!sentinel.mesh)return;if(sentinel.banished){var dt2=Math.hypot(player.position.x-cellToWorld(exitCell.r,exitCell.c).x,player.position.z-cellToWorld(exitCell.r,exitCell.c).z);var ne2=dt2<CELL*8;sentinel.banishTimer-=dt*(ne2?1.8:1.0);sentinel.mesh.visible=false;if(sentinel.light)sentinel.light.visible=false;if(sentinel.banishTimer<=0)respawnSentinel();return}if(sentinel._frozen&&performance.now()<sentinel._frozen){sentinel.mesh.visible=true;if(sentinel.light)sentinel.light.visible=true;sentinel.forcedChaseTimer=0;dementorAura=false;return}sentinel.mesh.visible=true;if(sentinel.light)sentinel.light.visible=true;var hidden=currentHero&&currentHero._vanishUntil&&performance.now()<currentHero._vanishUntil;var dtE=Math.hypot(player.position.x-cellToWorld(exitCell.r,exitCell.c).x,player.position.z-cellToWorld(exitCell.r,exitCell.c).z);var ne=dtE<CELL*8,et=ne?1.6:1.0;var pf=new THREE.Vector3(player.position.x,1.02,player.position.z);var dist=sentinel.position.distanceTo(pf);var sees=!hidden&&dist<(ne?13:10)&&hasLineOfSight(sentinel.position,player.position);dementorAura=!hidden&&dist<(ne?6:5)&&sees;sentinel.forcedChaseTimer=Math.max(0,sentinel.forcedChaseTimer-dt);var tp;if(sees||sentinel.forcedChaseTimer>0){tp=pf;if(performance.now()-lastDementorTone>1100){playTone(68,0.2,"sawtooth",dementorAura?0.06:0.03);lastDementorTone=performance.now()}}else{if(sentinel.path.length===0)return;var cell=sentinel.path[sentinel.target];var w=cellToWorld(cell.r,cell.c);tp=new THREE.Vector3(w.x,1.02,w.z);if(sentinel.position.distanceTo(tp)<0.25)sentinel.target=(sentinel.target+1)%sentinel.path.length}if(!hidden&&dist<8&&sees)dementorSlow=true;var fleurSlow=(selectedHeroId==="fleur"&&dist<lumos.distance)?0.8:1;var frenzyMult=frenzyActivated?1.3:1;var dir=tp.clone().sub(sentinel.position);if(dir.lengthSq()>0.001){dir.normalize();sentinel.position.addScaledVector(dir,dt*(sees||sentinel.forcedChaseTimer>0?3.2*et*SENTINEL_SPD*frenzyMult*fleurSlow:1.3*Math.max(0.5,SENTINEL_SPD)*frenzyMult))}sentinel.mesh.position.copy(sentinel.position);sentinel.light.position.set(sentinel.position.x,1.72,sentinel.position.z);sentinel.mesh.rotation.y=Math.atan2(dir.x,dir.z);sentinel.light.intensity=dementorAura?4.4+Math.sin(t*8):2.6;sentinel.strikeTimer=Math.max(0,sentinel.strikeTimer-dt*et);if(dist<(ne?1.5:1.25)&&sentinel.strikeTimer<=0){sentinel.strikeTimer=1.0;damage(DEMENTOR_DMG,"摄魂怪的寒意穿过胸口。","dementor");playTone(46,0.2,"square",0.065);playNoiseBurst(0.18,0.03)}document.body.classList.toggle("dementor",dementorAura);document.body.classList.toggle("shake",dementorAura||isAnyBlastEndedCharging())}
function respawnSentinel(){sentinel.banished=false;sentinel.banishTimer=0;sentinel.forcedChaseTimer=0;sentinel.strikeTimer=0;var h=mapHeight(),w=mapWidth();for(var a=0;a<200;a++){var pr=2+Math.floor(Math.random()*(h-4)),pc=2+Math.floor(Math.random()*(w-4));if(!isWallCell(pr,pc)){var pos=cellToWorld(pr,pc);var dist=Math.hypot(pos.x-player.position.x,pos.z-player.position.z);if(dist>12){sentinel.position.set(pos.x,1.02,pos.z);sentinel.mesh.position.copy(sentinel.position);if(sentinel.light)sentinel.light.position.set(pos.x,1.7,pos.z);sentinel.mesh.visible=true;if(sentinel.light)sentinel.light.visible=true;sentinel.path=[];sentinel.target=0;if(sentinel._crossPath)sentinel.path.push({r:sentinel._crossPath.r,c:sentinel._crossPath.c});for(var i=0;i<5;i++){var rr=2+Math.floor(Math.random()*(h-4)),rc=2+Math.floor(Math.random()*(w-4));if(!isWallCell(rr,rc))sentinel.path.push({r:rr,c:rc})}if(sentinel.path.length===0)sentinel.path.push({r:pr,c:pc});setMessage("远处又响起了摄魂怪的低语……它回来了。",3);playTone(55,0.15,"sawtooth",0.04);return}}}sentinel.mesh.visible=true;if(sentinel.light)sentinel.light.visible=true}
function respawnSentinel2(){if(!sentinel2.mesh)return;sentinel2.banished=false;sentinel2.banishTimer=0;sentinel2.forcedChaseTimer=0;sentinel2.strikeTimer=0;var h=mapHeight(),w=mapWidth();for(var a=0;a<120;a++){var pr=2+Math.floor(Math.random()*(h-4)),pc=2+Math.floor(Math.random()*(w-4));if(!isWallCell(pr,pc)){var pos=cellToWorld(pr,pc);var dist=Math.hypot(pos.x-player.position.x,pos.z-player.position.z);if(dist>12){sentinel2.position.set(pos.x,1.02,pos.z);sentinel2.mesh.position.copy(sentinel2.position);if(sentinel2.light)sentinel2.light.position.set(pos.x,1.7,pos.z);sentinel2.mesh.visible=true;if(sentinel2.light)sentinel2.light.visible=true;sentinel2.path=[];sentinel2.target=0;for(var i=0;i<5;i++){var rr=2+Math.floor(Math.random()*(h-4)),rc=2+Math.floor(Math.random()*(w-4));if(!isWallCell(rr,rc))sentinel2.path.push({r:rr,c:rc})}if(sentinel2.path.length===0)sentinel2.path.push({r:pr,c:pc});return}}}sentinel2.mesh.visible=true;if(sentinel2.light)sentinel2.light.visible=true}
function updateSentinel2(dt,t){if(currentDifficulty!=="hard"||!sentinel2.mesh)return;if(sentinel2.banished){sentinel2.banishTimer-=dt;sentinel2.mesh.visible=false;if(sentinel2.light)sentinel2.light.visible=false;if(sentinel2.banishTimer<=0)respawnSentinel2();return}if(sentinel2._frozen&&performance.now()<sentinel2._frozen){sentinel2.mesh.visible=true;if(sentinel2.light)sentinel2.light.visible=true;sentinel2.forcedChaseTimer=0;document.body.classList.toggle("dementor",dementorAura);document.body.classList.toggle("shake",dementorAura||isAnyBlastEndedCharging());return}sentinel2.mesh.visible=true;if(sentinel2.light)sentinel2.light.visible=true;var hidden=currentHero&&currentHero._vanishUntil&&performance.now()<currentHero._vanishUntil;var pf=new THREE.Vector3(player.position.x,1.02,player.position.z);var dist=sentinel2.position.distanceTo(pf);var sees=!hidden&&dist<10&&hasLineOfSight(sentinel2.position,player.position);if(!hidden&&dist<5&&sees)dementorAura=true;sentinel2.forcedChaseTimer=Math.max(0,sentinel2.forcedChaseTimer-dt);var tp;if(sees||sentinel2.forcedChaseTimer>0){tp=pf}else{if(sentinel2.path.length===0)return;var cell=sentinel2.path[sentinel2.target];var w=cellToWorld(cell.r,cell.c);tp=new THREE.Vector3(w.x,1.02,w.z);if(sentinel2.position.distanceTo(tp)<0.25)sentinel2.target=(sentinel2.target+1)%sentinel2.path.length}if(!hidden&&dist<8&&sees)dementorSlow=true;var fleurSlow2=(selectedHeroId==="fleur"&&dist<lumos.distance)?0.8:1;var frenzyMult2=frenzyActivated?1.3:1;var dir=tp.clone().sub(sentinel2.position);if(dir.lengthSq()>0.001){dir.normalize();sentinel2.position.addScaledVector(dir,dt*(sees||sentinel2.forcedChaseTimer>0?3.2*SENTINEL_SPD*frenzyMult2*fleurSlow2:1.3*frenzyMult2))}sentinel2.mesh.position.copy(sentinel2.position);if(sentinel2.light)sentinel2.light.position.set(sentinel2.position.x,1.72,sentinel2.position.z);sentinel2.strikeTimer=Math.max(0,sentinel2.strikeTimer-dt);if(dist<1.5&&sentinel2.strikeTimer<=0){sentinel2.strikeTimer=1.2;damage(DEMENTOR_DMG,"另一只摄魂怪也抓住了你！","dementor");playTone(40,0.2,"square",0.06)}document.body.classList.toggle("dementor",dementorAura);document.body.classList.toggle("shake",dementorAura||isAnyBlastEndedCharging())}
function isAnyBlastEndedCharging(){return blastEndedPack.some(function(be){return be.mesh&&be.state==="charge"})}
function updateBlastEnded(be,dt,t){if(!be.mesh)return;if(be._frozen&&performance.now()<be._frozen){be.mesh.position.copy(be.position);if(be.light)be.light.position.set(be.position.x,1,be.position.z);return;}var cfg=GAME_BALANCE.blastEnded,pf=new THREE.Vector3(player.position.x,0,player.position.z),dist=be.position.distanceTo(pf);be.hitTimer=Math.max(0,be.hitTimer-dt);be.listenTimer=Math.max(0,be.listenTimer-dt);if(be.state==="stunned"){be.stunTimer-=dt;if(be.stunTimer<=0)be.state="patrol"}else if(be.state==="charge"){var nx=be.position.clone().addScaledVector(be.chargeDir,dt*cfg.chargeSpeed);if(isSolidWorldCollideAll(nx.x,nx.z)||be.position.distanceTo(be.chargeTarget)<0.45){be.state="stunned";be.stunTimer=cfg.stunSeconds;playNoiseBurst(0.12,0.06)}else{be.position.copy(nx)}}else{be.patrolPhase+=dt;var home=cellToWorld(be.home.r,be.home.c);be.position.x=home.x+Math.sin(be.patrolPhase*0.55)*cfg.patrolRadiusX;be.position.z=home.z+Math.cos(be.patrolPhase*0.45)*cfg.patrolRadiusZ;var hidden=currentHero&&currentHero._vanishUntil&&performance.now()<currentHero._vanishUntil;var heard=!hidden&&isSprinting&&dist<cfg.hearingRange&&hasLineOfSight(be.position,player.position),smelled=!hidden&&dist<cfg.smellRange&&!snare;if(heard||smelled){be.state="charge";be.listenTimer=2;be.chargeTarget.copy(pf);be.chargeDir.copy(pf).sub(be.position).normalize();setMessage(heard?"炸尾螺听见了疾跑声，正朝声音暴冲！":"炸尾螺嗅到你靠近，尾刺猛然发亮！",2);playNoiseBurst(0.16,0.1)}}if(dist<cfg.hitRange&&be.hitTimer<=0){be.hitTimer=cfg.hitCooldown;damage(BLAST_DMG,"炸尾螺狠狠撞上你。");be.state="stunned";be.stunTimer=cfg.stunSeconds}be.mesh.position.copy(be.position);if(be.light)be.light.position.set(be.position.x,1,be.position.z);if(be.chargeDir.x!==0||be.chargeDir.z!==0)be.mesh.rotation.y=Math.atan2(be.chargeDir.x,be.chargeDir.z);if(be.light)be.light.intensity=be.state==="charge"?3.2+Math.sin(t*18):be.listenTimer>0?1.8:1.0}
function updateGameRules(dt){timeLeft-=dt;wandPower=Math.max(WAND_MIN,wandPower-dt*WAND_DECAY*heroWandDecay);
// 摄魂怪持续吸取HP
if(dementorAura){_dementorDrainAcc+=dt;while(_dementorDrainAcc>=1){_dementorDrainAcc-=1;var drainAmt=2;if(currentHero&&currentHero.passive)drainAmt=currentHero.passive(drainAmt,"dementor");health=Math.max(0,health-drainAmt);}}
// 塞德里克忠诚之盾：待机回血
if(selectedHeroId==="cedric"){var mi2=getMoveInput();if(mi2.x!==0||mi2.z!==0){_idleSince=0;}else{if(!_idleSince)_idleSince=performance.now();if(performance.now()-_idleSince>1500){health=Math.min(heroHP,health+3*dt);}}}
// 倒计时狂暴化
if(timeLeft<=30&&!frenzyActivated&&gameState===GAME_STATES.PLAYING){frenzyActivated=true;[sentinel,sentinel2].forEach(function(s){if(!s.mesh)return;s.mesh.traverse(function(ch){if(ch.isMesh&&ch.material&&!Array.isArray(ch.material)){ch.material=ch.material.clone();ch.material.emissive=new THREE.Color(0x440000);ch.material.emissiveIntensity=0.8;}});});setMessage("⚠️ 摄魂怪狂暴化！速度大幅提升！",5);if(timeEl)timeEl.classList.add("frenzy");if(ambientDrone){if(ambientDrone.low)ambientDrone.low.detune.setValueAtTime(-300,audioCtx.currentTime);if(ambientDrone.high)ambientDrone.high.detune.setValueAtTime(-300,audioCtx.currentTime);}playChord([200,160,120,90],0.6,0.055);}
// 困难模式移形换影
if(currentDifficulty==="hard"){shiftWallCountdown-=dt;if(shiftWallCountdown<=0){shiftWallCountdown=20;triggerWallShift();}}var tc=traps.find(function(t){return t.r===player.cell.r&&t.c===player.cell.c});if(tc&&!snare){snare={trap:tc,presses:0,damageTimer:0};tc.mesh.material.emissive.setHex(0x3f0d06);document.body.classList.add("snared");setMessage("魔鬼网缠住了你！快速连续点击互动按钮施展火焰熊熊。",4);playTone(118,0.16,"triangle",0.06);playNoiseBurst(0.24,0.045)}if(snare){snare.damageTimer+=dt;if(snare.damageTimer>=1){snare.damageTimer=0;damage(SNARE_DMG,"魔鬼网勒紧了脚踝，点击互动按钮挣脱："+snare.presses+"/5")}}var cr=shiftingWalls.some(function(w){return isShiftingWallSolid(w)&&w.r===player.cell.r&&w.c===player.cell.c});if(cr)damage(WALL_CRUSH_DMG*dt,"位移树篱从地下升起，正在挤压你。");collectNearbyItems();if(timeLeft<=0)endGame(false,"时间耗尽，被迷宫吞噬。");if(health<=0)endGame(false,"你倒在了黑暗的树篱中。");updateHud()}
function interact(){if(gameState===GAME_STATES.QUIZ)return;if(gameState!==GAME_STATES.PLAYING)return;if(snare){snare.presses+=1;playTone(260+snare.presses*55,0.05,"square",0.05);playNoiseBurst(0.05,0.02);if(snare.presses===1)speakSpell("火焰熊熊！");setMessage("火焰熊熊："+snare.presses+"/5",0.8);if(snare.presses>=5){snare.trap.mesh.material.emissive.setHex(0x220600);snare=null;document.body.classList.remove("snared");setMessage("火光烧断藤蔓，你挣脱了魔鬼网。",2.4);playChord([330,494,740],0.16,0.05)}return}if(canCastPatronus()){castPatronus();return}var cd=distanceToCell(exitCell.r,exitCell.c);if(cd<3.5){if(!cupKeyObtained){setMessage("火龙杯被强大的魔法封印保护着。找到守钥的斯芬克斯才能解锁。",3);return}endGame(true,"你握住火龙杯，蓝白色火焰撕开了迷宫的出口。三强争霸赛的冠军诞生了！");return}var sphinx=sphinxes.find(function(s){return!s.solved&&distanceToCell(s.r,s.c)<2.8});if(sphinx){openQuiz(sphinx);return}setMessage("附近没有可互动的魔法痕迹。卷轴 "+scrollCharges+" 个 | 疾跑 "+Math.round(sprintEnergy*100)+"%",1.5)}
function useWeapon(){if(gameState!==GAME_STATES.PLAYING&&gameState!==GAME_STATES.QUIZ){return}if(!currentHero||!currentHero.weapon){setMessage("未选择角色，无法使用武器。",1.5);return}if(weaponCooldown>0){setMessage("武器冷却中: "+Math.ceil(weaponCooldown)+"秒",1);return}if(currentHero.weapon()){weaponCooldown=currentHero.weaponCD;}}
function canCastPatronus(){if(patronusBeam.active)return false;patronusTarget=findPatronusTarget();return!!patronusTarget}
function findPatronusTarget(){if(patronusBeam.active)return null;var cfg=GAME_BALANCE.patronus,candidates=[sentinel,sentinel2],best=null,bestScore=-999;for(var i=0;i<candidates.length;i++){var s=candidates[i];if(!s.mesh||s.banished||s.mesh.visible===false)continue;var pf=new THREE.Vector3(player.position.x,1.02,player.position.z),dist=s.position.distanceTo(pf);if(dist>cfg.aimRange)continue;if(!hasLineOfSight(player.position,s.position))continue;var aimed=isReticleOnTarget(s.position,1.55),close=dist<=cfg.closeRange,assist=dist<=cfg.assistRange&&(isMobile||dementorAura);if(!aimed&&!close&&!assist)continue;var score=(aimed?80:0)+(close?55:0)+(assist?35:0)-dist;if(score>bestScore){best=s;bestScore=score}}return best}
function isReticleOnTarget(tp,rad){var cd=new THREE.Vector3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));cd.normalize();var cp=player.position.clone();cp.y=PLAYER_HEIGHT;var oc=cp.clone().sub(tp);var a=cd.dot(cd),b=2*oc.dot(cd),c=oc.dot(oc)-rad*rad;return b*b-4*a*c>=0}
function castPatronus(){if(!patronusTarget)return;speakSpell("呼神护卫！");var orig=new THREE.Vector3(player.position.x,PLAYER_HEIGHT*0.7,player.position.z);var tgt=patronusTarget.position.clone();tgt.y=1.3;var bg=new THREE.CylinderGeometry(0.08,0.15,1,8),bm=new THREE.MeshBasicMaterial({color:0xffdd66,transparent:true,opacity:0.9});var beam=new THREE.Mesh(bg,bm);beam.position.copy(orig);beam.castShadow=false;scene.add(beam);var glow=new THREE.PointLight(0xffdd66,8,18);glow.position.copy(orig);scene.add(glow);var parts=[],pg=new THREE.SphereGeometry(0.06,6,6);for(var i=0;i<12;i++){var p=new THREE.Mesh(pg,bm.clone());p.position.copy(orig);scene.add(p);parts.push(p)}patronusBeam.active=true;patronusBeam.mesh=beam;patronusBeam.light=glow;patronusBeam.particles=parts;patronusBeam.target.copy(tgt);patronusBeam.origin.copy(orig);patronusBeam.startTime=performance.now();playChord([392,523,659,784],0.35,0.07);playTone(1046,0.25,"sine",0.05,0.1)}
function speakSpell(text){try{if(typeof SpeechSynthesisUtterance!=='undefined'&&'speechSynthesis' in window){window.speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=0.95;u.pitch=1.25;u.volume=1.0;window.speechSynthesis.speak(u)}}catch(e){}}
function openQuiz(s){currentQuiz=s;setGameState(GAME_STATES.QUIZ);try{document.exitPointerLock()}catch(e){}var d=quizData[s.quizIndex%quizData.length];quizQuestionEl.textContent=d.question;quizOptionsEl.innerHTML="";var order=[];for(var oi=0;oi<d.options.length;oi++)order.push(oi);for(var oi=order.length-1;oi>0;oi--){var j=Math.floor(Math.random()*(oi+1));var t=order[oi];order[oi]=order[j];order[j]=t}currentQuiz._order=order;currentQuiz._data=d;order.forEach(function(origIdx){var b=document.createElement("button");b.type="button";b.textContent=d.options[origIdx];b.addEventListener("click",function(){answerQuiz(origIdx)});quizOptionsEl.appendChild(b)});quizPanel.classList.remove("hidden");setMessage("斯芬克斯挡住去路。答题期间迷宫的时间仍在流逝。",3)}
function answerQuiz(i){if(!currentQuiz)return;var d=quizData[currentQuiz.quizIndex%quizData.length];quizPanel.classList.add("hidden");setGameState(GAME_STATES.PLAYING);try{canvas.requestPointerLock()}catch(e){}if(i===d.answer){currentQuiz.solved=true;if(currentQuiz.mesh)currentQuiz.mesh.visible=false;housePoints+=30;openSphinxPassage(currentQuiz);setMessage("斯芬克斯低头让路，前方的魔法屏障消散。一道栅栏门轰然开启！",3);playChord([523,659,988],0.22,0.055);speakSpell("答对了！")}else{damage(SPHINX_DMG,"答案错误。斯芬克斯发出尖啸，摄魂怪立刻追来。","sphinx");sentinel.forcedChaseTimer=9;playNoiseBurst(0.24,0.12)}currentQuiz=null}
function openSphinxPassage(s){s.barrier.visible=false;if(s.linkedGateIdx!==undefined&&s.linkedGateIdx>=0&&s.linkedGateIdx<gates.length){var g=gates[s.linkedGateIdx];g.open=true;if(g.mesh)g.mesh.visible=false}if(s.isKeySphinx){cupKeyObtained=true;setMessage("斯芬克斯消散时掉落了一把古老的钥匙——火龙杯的封印解除了！",4);playChord([440,554,659,880],0.4,0.08)}}
function markDeadEnd(){if(gameState!==GAME_STATES.PLAYING)return;var cell=player.cell,targetCell=null;var range=heroDeadEndR||0;if(range>0){for(var dr=-range;dr<=range&&!targetCell;dr++){for(var dc=-range;dc<=range&&!targetCell;dc++){if(dr===0&&dc===0)continue;var nr=player.cell.r+dr,nc=player.cell.c+dc;if(nr<0||nc<0||nr>=mapHeight()||nc>=mapWidth())continue;if(isWallCell(nr,nc))continue;if(markerCells.has(keyOf(nr,nc)))continue;if(isDeadEndCell(nr,nc))targetCell={r:nr,c:nc}}}}if(!targetCell&&!isDeadEndCell(cell.r,cell.c)){if(range>0)setMessage("附近也没有发现死胡同。",1.4);else setMessage("这里还不是死胡同。把标记留给真正容易迷路的位置。",2);return}var tr=targetCell?targetCell.r:cell.r,tc=targetCell?targetCell.c:cell.c,k=keyOf(tr,tc);if(markerCells.has(k)){setMessage("这里已经留下红色死胡同标记。",1.4);return}var pos=cellToWorld(tr,tc);var mat=new THREE.MeshStandardMaterial({color:0xff2b2b,emissive:0xff1111,emissiveIntensity:1.2,roughness:0.3});var group=new THREE.Group();var a=new THREE.Mesh(new THREE.BoxGeometry(1.45,0.045,0.18),mat);var b=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.045,1.45),mat);group.add(a,b);group.position.set(pos.x,0.06,pos.z);scene.add(group);markerCells.add(k);deadEndMarks.push({r:tr,c:tc,mesh:group,mat:mat});housePoints+=10;setMessage("红色十字星已标记：这是一条死胡同。+10 分",2);playTone(196,0.08,"square",0.04);speakSpell("标记死路！")}
function useScroll(){if(gameState!==GAME_STATES.PLAYING)return;if(scrollCharges<=0){setMessage("没有透视卷轴。在死胡同中寻找道具吧。",1.6);return}scrollCharges-=1;guideUntil=performance.now()+6000;showGhostPath();playChord([294,440,880],0.2,0.045);speakSpell("急急现形！")}
var ghostPathMarkers=[];
function showGhostPath(){clearGhostPath();var path=bfsShortestPath(player.cell.r,player.cell.c,exitCell.r,exitCell.c);if(!path||path.length<2)return;var mg=new THREE.RingGeometry(0.25,0.35,8),mm=new THREE.MeshBasicMaterial({color:0x88ccff,transparent:true,opacity:0.7,side:THREE.DoubleSide});var step=Math.max(1,Math.floor(path.length/15));for(var i=0;i<path.length;i+=step){var cell=path[i],pos=cellToWorld(cell.r,cell.c);var m=new THREE.Mesh(mg,mm.clone());m.rotation.x=-Math.PI/2;m.position.set(pos.x,0.08,pos.z);scene.add(m);ghostPathMarkers.push({mesh:m,mat:m.material})}var ep=cellToWorld(exitCell.r,exitCell.c);var pg=new THREE.CylinderGeometry(0.15,0.15,4,8);var p=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({color:0x66bbff,transparent:true,opacity:0.6}));p.position.set(ep.x,2,ep.z);p.name="ghostPillar";scene.add(p);ghostPathMarkers.push({mesh:p,mat:p.material,isPillar:true})}
function clearGhostPath(){for(var i=0;i<ghostPathMarkers.length;i++){var m=ghostPathMarkers[i];scene.remove(m.mesh);m.mesh.geometry.dispose();m.mat.dispose()}ghostPathMarkers.length=0}
function bfsShortestPath(sr,sc,er,ec){var h=mapHeight(),w=mapWidth(),vis=[],par=[];for(var r=0;r<h;r++){vis[r]=[];par[r]=[];for(var c=0;c<w;c++){vis[r][c]=false;par[r][c]=null}}var q=[{r:sr,c:sc}];vis[sr][sc]=true;var ds=[[-1,0],[1,0],[0,-1],[0,1]];while(q.length>0){var cur=q.shift();if(cur.r===er&&cur.c===ec){var path=[];var node=cur;while(node){path.unshift(node);node=par[node.r][node.c]}return path}for(var d=0;d<4;d++){var nr=cur.r+ds[d][0],nc=cur.c+ds[d][1];if(nr<0||nr>=h||nc<0||nc>=w||vis[nr][nc])continue;if(solids.has(keyOf(nr,nc)))continue;if(isGateCell(nr,nc))continue;if(isQuizBarrierCell(nr,nc))continue;vis[nr][nc]=true;par[nr][nc]=cur;q.push({r:nr,c:nc})}}return null}
function collectNearbyItems(){if(goldenSnitch.mesh&&goldenSnitch.mesh.visible){var sd=new THREE.Vector3(player.position.x,0,player.position.z).distanceTo(new THREE.Vector3(goldenSnitch.position.x,0,goldenSnitch.position.z));if(sd<1.5){goldenSnitch.mesh.visible=false;if(goldenSnitch.light)goldenSnitch.light.visible=false;timeLeft=Math.min(START_TIME,timeLeft+30);housePoints+=100;setMessage("你抓住了金色飞贼！+100 分，+30 秒！",3);playChord([392,523,659,784,1046],0.3,0.06);speakSpell("抓住了金色飞贼！格兰芬多加一百分！");setTimeout(function(){respawnSnitch()},GAME_BALANCE.snitchRespawnMs)}}magicShards.forEach(function(s){if(s.collected||distanceToCell(s.r,s.c)>1.35)return;s.collected=true;s.mesh.visible=false;s.light.visible=false;wandPower=Math.min(1,wandPower+0.4);timeLeft=Math.min(START_TIME,timeLeft+15);housePoints+=20;setMessage("魔力碎片恢复了荧光，+20 分，并争取到一点时间。",2.2);playChord([622,932],0.12,0.05)});buffs.forEach(function(b){if(b.collected||distanceToCell(b.r,b.c)>1.35)return;b.collected=true;b.mesh.visible=false;b.light.visible=false;if(b.type==="time"){timeLeft=Math.min(START_TIME,timeLeft+35);setMessage("时间沙漏倒转，倒计时恢复 35 秒。",2.5)}else if(b.type==="scroll"){scrollCharges+=1;setMessage("获得透视卷轴。使用后地面将短暂显示通往出口的路径。",3)}else if(b.type==="map"){mapCharges+=1;setMessage("获得活点地图！按 M 键（或地图按钮）使用，查看迷宫全貌。",3.5)}else{freeSprintUntil=performance.now()+10000;sprintEnergy=1;setMessage("疾跑鞋生效：10 秒内疾跑不消耗体力。",3)}playChord([392,587,784],0.15,0.045)});if(guideUntil>0&&performance.now()>guideUntil){clearGhostPath();guideUntil=0}}
function updateInteractionPrompt(){var ns=sphinxes.some(function(s){return!s.solved&&distanceToCell(s.r,s.c)<2.8});var nc=distanceToCell(exitCell.r,exitCell.c)<3.5;var cp=canCastPatronus();if(snare)interactionEl.textContent="点击互动 火焰熊熊 "+snare.presses+"/5";else if(nc&&!cupKeyObtained)interactionEl.textContent="需要钥匙 找守钥斯芬克斯";else if(nc)interactionEl.textContent="点击互动 锁定火龙杯";else if(ns)interactionEl.textContent="点击互动 回答斯芬克斯";else if(cp)interactionEl.textContent="点击互动 呼神护卫！";else interactionEl.textContent="";if(messageEl.dataset.temporary==="done"){messageEl.dataset.temporary="";messageEl.textContent="卷轴 "+scrollCharges+" | 疾跑 "+Math.round(sprintEnergy*100)+"% | 标记 "+deadEndMarks.length+" 处"}}
function updateExitAudio(t){if(!audioCtx||t-lastExitChime<3.2)return;var exit=cellToWorld(exitCell.r,exitCell.c);var dx=exit.x-player.position.x,dz=exit.z-player.position.z;var dist=Math.hypot(dx,dz);if(!cupKeyObtained&&dist>CELL*6)return;lastExitChime=t;var vol=Math.max(0.018,Math.min(0.14,0.14-dist/380));var pan=Math.max(-1,Math.min(1,Math.sin(Math.atan2(dx,dz)-yaw)));playDirectionalChord([261.63,392,523.25],0.85,vol,pan)}
function updateStateAudio(t){if(!audioCtx)return;if(t-lastLumosCrackle>5+wandPower*3){lastLumosCrackle=t;playTone(880+Math.random()*140,0.03,"triangle",0.015);playTone(1320+Math.random()*160,0.024,"sine",0.01,0.03)}if(snare&&t-lastSnarePulse>0.72){lastSnarePulse=t;playTone(88,0.1,"sawtooth",0.03);playNoiseBurst(0.07,0.015)}if(t-lastTorchCrackle>3.5+Math.random()*4){lastTorchCrackle=t;playNoiseBurst(0.03,0.012+Math.random()*0.015)}if(ambientDrone&&ambientDrone.gain){var target=dementorAura?0.032:snare?0.024:0.013;ambientDrone.gain.gain.setTargetAtTime(target,audioCtx.currentTime,0.35)}}
function updateCamera(t){camera.position.copy(player.position);camera.rotation.y=yaw;camera.rotation.x=pitch;if(dementorAura){camera.position.x+=Math.sin((t||0)*27)*0.022;camera.position.y+=Math.cos((t||0)*19)*0.015}}
function respawnSnitch(){var h=mapHeight(),w=mapWidth();for(var a=0;a<50;a++){var r=3+Math.floor(Math.random()*(h-6)),c=3+Math.floor(Math.random()*(w-6));if(!isWallCell(r,c)){var pos=cellToWorld(r,c);var dist=Math.hypot(pos.x-player.position.x,pos.z-player.position.z);if(dist>6){goldenSnitch.position.set(pos.x,1.8,pos.z);goldenSnitch.mesh.position.copy(goldenSnitch.position);if(goldenSnitch.light)goldenSnitch.light.position.copy(goldenSnitch.position);goldenSnitch.mesh.visible=true;if(goldenSnitch.light)goldenSnitch.light.visible=true;goldenSnitch.home={r:r,c:c};goldenSnitch.velocity.set((Math.random()-0.5)*5,0,(Math.random()-0.5)*5);setMessage("金色飞贼重新出现了！快抓住它！",2.5);return}}}}
function clearPatronusBeam(){if(patronusBeam.mesh){scene.remove(patronusBeam.mesh);patronusBeam.mesh.geometry.dispose();patronusBeam.mesh.material.dispose()}if(patronusBeam.light)scene.remove(patronusBeam.light);if(patronusBeam.particles){for(var i=0;i<patronusBeam.particles.length;i++){var p=patronusBeam.particles[i];scene.remove(p);p.geometry.dispose();p.material.dispose()}}patronusBeam.active=false;patronusBeam.mesh=null;patronusBeam.light=null;patronusBeam.particles=null}
function updateHud(){timeEl.textContent=formatTime(timeLeft);healthEl.textContent=""+Math.max(0,Math.ceil(health));wandEl.textContent=Math.round(wandPower*100)+"%";var se=document.querySelector("#score");if(se)se.textContent=""+housePoints;if(deadEndCountEl)deadEndCountEl.textContent=""+deadEndMarks.length;var mapHud=document.querySelector("#map-hud");var mapCount=document.querySelector("#map-count");if(mapCount)mapCount.textContent=""+mapCharges;if(mapHud)mapHud.classList.toggle("hidden",mapCharges<=0);var btnMapEl=document.querySelector("#btn-map");if(btnMapEl)btnMapEl.classList.toggle("hidden",mapCharges<=0);var sf=document.querySelector("#stamina-fill");if(sf){var pct=Math.round(sprintEnergy*100);sf.style.width=pct+"%";sf.className=freeSprintUntil>performance.now()?"boosting":pct<25?"low":""}if(btnWeapon&&currentHero){var cdPct=currentHero.weaponCD>0?(weaponCooldown/currentHero.weaponCD)*100:0;btnWeapon.textContent=weaponCooldown>0?Math.ceil(weaponCooldown)+"s":"武器R";btnWeapon.style.setProperty("--cooldown-pct",(100-cdPct)+"%");if(weaponCooldown>0)btnWeapon.classList.add("cooldown");else btnWeapon.classList.remove("cooldown")}}
function damage(amount,text,type){if(gameState!==GAME_STATES.PLAYING&&gameState!==GAME_STATES.QUIZ)return;if(currentHero&&currentHero._vanishUntil&&performance.now()<currentHero._vanishUntil)return;if(currentHero&&currentHero._luckyDodge&&performance.now()<currentHero._luckyDodge&&type==="dementor"){currentHero._luckyDodge=0;setMessage("福灵剂的幸运抵消了摄魂怪的攻击！",2.5);playTone(880,0.2,"sine",0.08);return;}if(currentHero&&currentHero.passive)amount=currentHero.passive(amount,type||"");health=Math.max(0,health-amount);setMessage(text,1.5);document.body.classList.add("damaged");window.clearTimeout(damage._timer);damage._timer=window.setTimeout(function(){document.body.classList.remove("damaged")},140)}
function endGame(won,copy){if(gameState!==GAME_STATES.PLAYING&&gameState!==GAME_STATES.QUIZ)return;setGameState(GAME_STATES.GAMEOVER);try{document.exitPointerLock()}catch(e){}quizPanel.classList.add("hidden");resultTitle.textContent=won?"你夺得了火龙杯":"迷宫吞没了你";var sm=won?" | 学院分: "+housePoints:"";resultCopy.textContent=copy+sm;document.body.classList.remove("snared","dementor","shake","ceremony");stopAmbientDrone();recordGameResult(won,housePoints,health);playChord(won?[392,523,659,1046]:[90,72,55],won?0.45:0.55,won?0.07:0.06);speakSpell(won?"我们赢了！三强争霸赛的冠军！":"你倒在了黑暗的树篱中...")}
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

function ensureAudio(){var E=window.AudioContext||window.webkitAudioContext;if(!E)return;if(!audioCtx)audioCtx=new E();if(audioCtx.state==="suspended")audioCtx.resume();if(!tinnitusOsc&&audioCtx){try{tinnitusOsc=audioCtx.createOscillator();tinnitusGain=audioCtx.createGain();tinnitusOsc.type="sine";tinnitusOsc.frequency.value=3400;tinnitusGain.gain.value=0;tinnitusOsc.connect(tinnitusGain).connect(audioCtx.destination);tinnitusOsc.start();wailOsc=audioCtx.createOscillator();wailGain=audioCtx.createGain();wailOsc.type="sawtooth";wailOsc.frequency.value=180;wailGain.gain.value=0;wailOsc.connect(wailGain).connect(audioCtx.destination);wailOsc.start();}catch(e){tinnitusOsc=null;wailOsc=null;}}}
function startAmbientDrone(){if(!audioCtx||ambientDrone)return;var low=audioCtx.createOscillator(),high=audioCtx.createOscillator(),gain=audioCtx.createGain(),filter=audioCtx.createBiquadFilter();low.type="sine";high.type="triangle";low.frequency.value=54;high.frequency.value=108;filter.type="lowpass";filter.frequency.value=380;gain.gain.value=0.0001;low.connect(filter);high.connect(filter);filter.connect(gain).connect(audioCtx.destination);low.start();high.start();gain.gain.setTargetAtTime(0.012,audioCtx.currentTime,0.8);ambientDrone={low:low,high:high,gain:gain,filter:filter}}
function stopAmbientDrone(){if(!audioCtx||!ambientDrone)return;var d=ambientDrone;d.gain.gain.setTargetAtTime(0.0001,audioCtx.currentTime,0.18);d.low.stop(audioCtx.currentTime+0.35);d.high.stop(audioCtx.currentTime+0.35);ambientDrone=null}
function playFootstep(gain){if(!audioCtx)return;playNoiseBurst(0.04,gain);playTone(90+Math.random()*25,0.03,"triangle",gain*0.4)}
function playTone(freq,dur,type,gain,delay){if(!audioCtx)return;var start=audioCtx.currentTime+(delay||0);var osc=audioCtx.createOscillator(),vol=audioCtx.createGain();osc.type=type||"sine";osc.frequency.setValueAtTime(freq,start);vol.gain.setValueAtTime(0.0001,start);vol.gain.linearRampToValueAtTime(gain,start+0.015);vol.gain.exponentialRampToValueAtTime(0.0001,start+dur);osc.connect(vol).connect(audioCtx.destination);osc.start(start);osc.stop(start+dur+0.03)}
function playChord(freqs,dur,gain){freqs.forEach(function(f,i){playTone(f,dur,"sine",gain,i*0.035)})}
function playDirectionalChord(freqs,dur,gain,pan){if(!audioCtx)return;var start=audioCtx.currentTime;var panner=audioCtx.createStereoPanner?audioCtx.createStereoPanner():null;if(panner)panner.pan.setValueAtTime(pan,start);freqs.forEach(function(f,i){var osc=audioCtx.createOscillator(),vol=audioCtx.createGain();osc.type=i===0?"sine":"triangle";osc.frequency.setValueAtTime(f,start);vol.gain.setValueAtTime(0.0001,start);vol.gain.linearRampToValueAtTime(gain/freqs.length,start+0.05);vol.gain.exponentialRampToValueAtTime(0.0001,start+dur);if(panner)osc.connect(vol).connect(panner).connect(audioCtx.destination);else osc.connect(vol).connect(audioCtx.destination);osc.start(start+i*0.03);osc.stop(start+dur+0.04)})}
function playNoiseBurst(dur,gain){if(!audioCtx)return;var bufSize=Math.max(1,Math.floor(audioCtx.sampleRate*dur));var buffer=audioCtx.createBuffer(1,bufSize,audioCtx.sampleRate);var data=buffer.getChannelData(0);for(var i=0;i<bufSize;i++)data[i]=(Math.random()*2-1)*(1-i/bufSize);var source=audioCtx.createBufferSource(),volume=audioCtx.createGain();volume.gain.value=gain;source.buffer=buffer;source.connect(volume).connect(audioCtx.destination);source.start()}

function useMap(){if(gameState!==GAME_STATES.PLAYING)return;if(mapCharges<=0){setMessage("没有活点地图。在死胡同中寻找道具吧。",1.6);return;}mapCharges-=1;updateHud();var existing=document.getElementById("minimap");if(existing&&existing.parentNode)existing.parentNode.removeChild(existing);var cv=document.createElement("canvas");cv.id="minimap";cv.width=200;cv.height=200;cv.style.cssText="position:fixed;top:12px;right:60px;z-index:50;border:2px solid rgba(255,220,100,0.85);border-radius:4px;background:#0a0a0a;box-shadow:0 0 16px rgba(255,220,100,0.4);";document.body.appendChild(cv);var ctx2=cv.getContext("2d");var h=mapHeight(),w=mapWidth(),cw=200/w,ch=200/h;for(var r=0;r<h;r++)for(var c=0;c<w;c++){ctx2.fillStyle=isWallCell(r,c)?"#1a2a1e":"#3a4a3e";ctx2.fillRect(c*cw,r*ch,Math.ceil(cw),Math.ceil(ch));}ctx2.fillStyle="#ffd700";ctx2.beginPath();ctx2.arc(exitCell.c*cw+cw/2,exitCell.r*ch+ch/2,Math.max(cw*0.8,3),0,Math.PI*2);ctx2.fill();[sentinel,sentinel2].forEach(function(s){if(!s.mesh||s.banished)return;var sc=worldToCell(s.position.x,s.position.z);ctx2.fillStyle="#ff3333";ctx2.beginPath();ctx2.arc(sc.c*cw+cw/2,sc.r*ch+ch/2,Math.max(cw*0.8,3),0,Math.PI*2);ctx2.fill();});ctx2.fillStyle="#44ff44";ctx2.beginPath();ctx2.arc(player.cell.c*cw+cw/2,player.cell.r*ch+ch/2,Math.max(cw*0.9,3.5),0,Math.PI*2);ctx2.fill();playChord([523,659,784],0.25,0.05);speakSpell("地图现形！");setMessage("活点地图：绿点=你，金点=出口，红点=摄魂怪",3.5);setTimeout(function(){if(!cv.parentNode)return;cv.style.transition="opacity 0.8s ease,transform 0.8s ease,filter 0.8s ease";cv.style.opacity="0";cv.style.transform="scale(0.8)";cv.style.filter="sepia(1) blur(3px)";setTimeout(function(){if(cv.parentNode)cv.parentNode.removeChild(cv);},850);},3000);}

function triggerWallShift(){setMessage("迷宫正在变化……",3);playNoiseBurst(0.8,0.06);playTone(60,0.6,"square",0.04,0.1);var toFlip=shiftingWalls.filter(function(w){return Math.abs(w.r-player.cell.r)+Math.abs(w.c-player.cell.c)>3&&Math.abs(w.r-exitCell.r)+Math.abs(w.c-exitCell.c)>2;});toFlip.sort(function(){return Math.random()-0.5});var picks=toFlip.slice(0,Math.min(3,toFlip.length));picks.forEach(function(w){w.phase+=Math.PI;});}

function isInLeftZone(cx){return cx<window.innerWidth*0.35}
canvas.addEventListener("touchstart",function(e){e.preventDefault();for(var i=0;i<e.changedTouches.length;i++){var touch=e.changedTouches[i];if(isInLeftZone(touch.clientX)&&!joystickState.active){joystickState.active=true;joystickState.touchId=touch.identifier;joystickState.baseX=touch.clientX;joystickState.baseY=touch.clientY;joystickState.dx=0;joystickState.dy=0}else if(!isInLeftZone(touch.clientX)&&!cameraTouch.active){cameraTouch.active=true;cameraTouch.touchId=touch.identifier;cameraTouch.lastX=touch.clientX;cameraTouch.lastY=touch.clientY}}},{passive:false});
canvas.addEventListener("touchmove",function(e){e.preventDefault();for(var i=0;i<e.changedTouches.length;i++){var touch=e.changedTouches[i];if(touch.identifier===joystickState.touchId){joystickState.dx=touch.clientX-joystickState.baseX;joystickState.dy=touch.clientY-joystickState.baseY;var dist=Math.hypot(joystickState.dx,joystickState.dy);if(dist>JOYSTICK_MAX_R){joystickState.dx=joystickState.dx/dist*JOYSTICK_MAX_R;joystickState.dy=joystickState.dy/dist*JOYSTICK_MAX_R}}else if(touch.identifier===cameraTouch.touchId){var dx=touch.clientX-cameraTouch.lastX,dy=touch.clientY-cameraTouch.lastY;yaw-=dx*TOUCH_SENSITIVITY;pitch-=dy*TOUCH_SENSITIVITY;pitch=Math.max(-1.2,Math.min(1.2,pitch));cameraTouch.lastX=touch.clientX;cameraTouch.lastY=touch.clientY}}},{passive:false});
canvas.addEventListener("touchend",function(e){for(var i=0;i<e.changedTouches.length;i++){var touch=e.changedTouches[i];if(touch.identifier===joystickState.touchId){joystickState.active=false;joystickState.touchId=null;joystickState.dx=0;joystickState.dy=0}else if(touch.identifier===cameraTouch.touchId){cameraTouch.active=false;cameraTouch.touchId=null}}});
canvas.addEventListener("touchcancel",function(e){for(var i=0;i<e.changedTouches.length;i++){var touch=e.changedTouches[i];if(touch.identifier===joystickState.touchId){joystickState.active=false;joystickState.touchId=null;joystickState.dx=0;joystickState.dy=0}else if(touch.identifier===cameraTouch.touchId){cameraTouch.active=false;cameraTouch.touchId=null}}});
if(btnSprint)btnSprint.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();sprintToggled=!sprintToggled;if(sprintToggled)btnSprint.classList.add("active");else btnSprint.classList.remove("active")});
if(btnInteract)btnInteract.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();interact()});
if(btnMark)btnMark.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();markDeadEnd()});
if(btnScroll)btnScroll.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();useScroll()});var btnMap=document.querySelector("#btn-map");if(btnMap){btnMap.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();useMap()});btnMap.addEventListener("touchstart",function(e){e.preventDefault();e.stopPropagation()});}
var allButtons=document.querySelectorAll(".mobile-btn");for(var bi=0;bi<allButtons.length;bi++){allButtons[bi].addEventListener("touchstart",function(e){e.preventDefault();e.stopPropagation()})}
document.addEventListener("keydown",function(e){keys.add(e.code);if(e.code==="KeyE"){e.preventDefault();interact()}if(e.code==="KeyQ"){e.preventDefault();markDeadEnd()}if(e.code==="KeyF"){e.preventDefault();useScroll()}if(e.code==="KeyR"){e.preventDefault();useWeapon()}if(e.code==="ShiftLeft"||e.code==="ShiftRight"){keyboardSprint=true;if(btnSprint)btnSprint.classList.add("active")}if(e.code==="KeyM"){e.preventDefault();useMap()}});
document.addEventListener("keyup",function(e){keys.delete(e.code);if(e.code==="ShiftLeft"||e.code==="ShiftRight"){keyboardSprint=false;if(btnSprint)btnSprint.classList.remove("active")}});
document.addEventListener("pointerlockchange",function(){if(document.pointerLockElement!==canvas&&gameState===GAME_STATES.PLAYING){setMessage("迷宫仍在低语。点击画面继续探索。",2.5)}});
document.addEventListener("mousemove",function(e){if(document.pointerLockElement!==canvas||(gameState!==GAME_STATES.PLAYING&&gameState!==GAME_STATES.CEREMONY))return;yaw-=e.movementX*0.004;pitch-=e.movementY*0.004;pitch=THREE.MathUtils.clamp(pitch,-1.2,1.2)});
canvas.addEventListener("click",function(){if(gameState===GAME_STATES.PLAYING||gameState===GAME_STATES.CEREMONY){try{canvas.requestPointerLock()}catch(e){}}});
function isPanelOpen(el){return el&&!el.classList.contains("hidden")}
function shouldRequireLandscape(){return !!(currentUser||isAdmin)&&gameState!==GAME_STATES.AUTH&&gameState!==GAME_STATES.RULES}
function checkOrientation(){var isLandscape=window.innerWidth>window.innerHeight,shouldShow=shouldRequireLandscape()&&!isLandscape;var hint=document.querySelector("#rotate-hint");if(hint){hint.classList.toggle("show",shouldShow);hint.classList.toggle("hidden",!shouldShow)}}
window.addEventListener("resize",function(){camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.2));checkOrientation()});
window.addEventListener("orientationchange",function(){setTimeout(checkOrientation,300)});

(function init(){
console.log("[INIT] Starting...");
if(typeof THREE==='undefined'){alert('Three.js库未能加载。请检查网络后刷新。');return}
console.log("[INIT] THREE.js OK, GLTFLoader: "+(typeof THREE.GLTFLoader));
try{
  resetLobby();console.log("[INIT] resetLobby OK");
  initLobby();console.log("[INIT] initLobby OK");
  setGameState(GAME_STATES.AUTH);console.log("[INIT] setGameState OK");
  checkOrientation();
  startRenderLoop();console.log("[INIT] renderLoop started");
  loadAllModels().then(function(){modelsLoaded=true;console.log("[INIT] 3D models loaded OK")}).catch(function(e){modelsLoaded=true;console.warn("[INIT] Model load issue:",e)});
}catch(e){console.error("[INIT] CRASH:",e);alert('初始化失败: '+(e.message||e)+'\n请刷新页面重试。')}
})();

"use strict";
/*
  TRẢM LONG — Game HTML/CSS/JavaScript thuần.
  Bài tập gốc (anhhung.js) được GIỮ NGUYÊN. File này viết thêm giao diện và
  cơ chế chiến đấu theo lượt để hoạt ảnh không bị chặn bởi while/alert/prompt.

  Phép tính gốc được kế thừa:
   level++ ; xp = 150 * (level - 1) + 200 ; skillPoints += xp / 10
   strength = .6 * skillPoints + .1 * xp
   agility  = .2 * skillPoints + .2 * xp
   intel    = .6 * skillPoints + 10 * level
   Sau đó level = 3, xp += 300; chọn lớp; level = 4, xp += 700;
   level = 5, health = level + 100; Rồng: HP 600, STR 100, AGI 15, INT 80.

  CÂN BẰNG GAMEPLAY (được phép giải thích với thầy):
   1. Anh hùng: maxHP = health * 2, tức 210 thay vì 105 để tránh one-shot.
   2. Sát thương lửa = dragonStr * .32; crit vẫn cộng thêm gấp 2 sát thương
      cơ bản (tổng x3, như code gốc) nhưng tỷ lệ crit = dragonInt * .30.
   3. Né đòn của người chơi = clamp(agility * .55, 5, 52),
      chí mạng của người chơi = clamp(intel, 5, 55) (đơn vị %).
   4. Đòn tuyệt kỹ x1.65, hồi 2 lượt. Phòng thủ giảm 65% sát thương.
   5. Rồng giữ nguyên 600 HP và né đòn theo Math.random()*100 > dragonAgi.
   Các chỉ số STR/AGI/INT HIỂN THỊ vẫn là kết quả công thức gốc.
*/

const $ = (id) => document.getElementById(id);
const UI = {
  stage: $("battleStage"), layer: $("fxLayer"), hero: $("heroSprite"), dragon: $("dragonSprite"),
  heroName: $("heroDisplayName"), heroClass: $("heroClassLabel"),
  heroHp: $("heroHpNumber"), dragonHp: $("dragonHpNumber"),
  heroFill: $("heroHpFill"), dragonFill: $("dragonHpFill"),
  heroMeter: $("heroHealthMeter"), dragonMeter: $("dragonHealthMeter"),
  str: $("statStr"), agi: $("statAgi"), intel: $("statInt"),
  turn: $("turnLabel"), status: $("battleStatus"), notice: $("battleAnnouncement"),
  log: $("combatLog"), attack: $("attackBtn"), skill: $("skillBtn"),
  defend: $("defendBtn"), skillHint: $("skillHint"), actionHint: $("actionHint"),
  setup: $("setupModal"), result: $("resultModal"), playerName: $("playerName"),
  resultMedal: $("resultMedal"), resultKicker: $("resultKicker"),
  resultTitle: $("resultTitle"), resultText: $("resultText"), resultRecap: $("resultRecap"),
  mute: $("muteBtn")
};

const SOURCE_NAME = "Vũ Trọng Huy";
let state = null;
let runId = 0; // Dùng để hủy các lượt đang chạy khi người chơi bấm chơi lại.
let noticeTimer = null;
let muted = false;
let audioCtx = null;

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function whole(value) { return Math.round(value).toLocaleString("vi-VN"); }

// ============= KẾ THỪA TÍNH TOÁN TỪ anhhung.js =============
function makeHero(playerName, selectedClass) {
  let level = 1;
  let xp = 0;
  let skillPoints = 5;
  level++;
  xp = 150 * (level - 1) + 200;
  skillPoints = skillPoints + xp / 10;
  let strength = 0.6 * skillPoints + 0.1 * xp;
  let agility = 0.2 * skillPoints + 0.2 * xp;
  let intel = 0.6 * skillPoints + 10 * level;

  level = 3;
  xp = xp + 300;
  // Tương ứng prompt("Hãy nhập tên bạn") trong code gốc:
  // Nhập đúng tên gốc +5 INT; nhập khác -5 INT.
  if (playerName.trim().toLocaleLowerCase("vi-VN") === SOURCE_NAME.toLocaleLowerCase("vi-VN")) {
    intel = intel + 5;
  } else {
    intel = intel - 5;
  }

  let phancap = "";
  switch (selectedClass) {
    case "a":
      phancap = "Chiến Binh";
      strength = strength + 15;
      agility = agility - 10;
      intel = intel - 5;
      break;
    case "b":
      phancap = "Sát Thủ";
      strength = strength - 15;
      agility = agility + 10;
      intel = intel + 5;
      break;
    case "c":
      phancap = "Thợ Săn";
      strength = strength - 15;
      agility = agility + 10;
      intel = intel + 15;
      break;
    default:
      throw new Error("Phân cấp không hợp lệ");
  }
  level = 4;
  xp = xp + 700;
  level = 5;
  const health = level + 100;
  const maxHp = health * 2; // Điều chỉnh cân bằng: tránh chết ngay khi bị đánh.
  return { name: playerName, phancap, level, xp, skillPoints,
    strength, agility, intel, hp: maxHp, maxHp, guarding: false };
}

function makeDragon() {
  // Thông số được giữ nguyên từ bài tập.
  const dragonHealth = 600;
  const dragonStr = 100;
  const dragonAgi = 15;
  const dragonInt = 80;
  return { hp: dragonHealth, maxHp: dragonHealth, strength: dragonStr, agility: dragonAgi, intel: dragonInt };
}

// ============= ÂM THANH TẠO BẰNG WEB AUDIO API =============
function ensureAudio() {
  if (muted) return null;
  try {
    if (!audioCtx) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      audioCtx = new AudioCtor();
    }
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    return audioCtx;
  } catch (error) {
    console.warn("Trình duyệt không hỗ trợ âm thanh:", error);
    return null;
  }
}

function tone(frequency, duration = .13, type = "triangle", volume = .08, endFreq = null, offset = 0) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const t = ctx.currentTime + offset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(1, frequency), t);
  if (endFreq != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t + duration);
  gain.gain.setValueAtTime(.0001, t);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume), t + .009);
  gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + .025);
}

function noise(duration = .17, volume = .085, lowpass = 1300, offset = 0) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const sr = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, Math.ceil(sr * duration), sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(lowpass, ctx.currentTime + offset);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime + offset);
  gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + offset + duration);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(ctx.currentTime + offset);
  src.stop(ctx.currentTime + offset + duration + .01);
}

function sound(kind) {
  if (!ensureAudio()) return;
  switch (kind) {
    case "start": tone(392,.13,"sine",.07); tone(587,.18,"sine",.07,null,.11); tone(784,.3,"triangle",.055,null,.24); break;
    case "swing": tone(1050,.2,"sawtooth",.055,180); noise(.19,.06,2600); break;
    case "hit": noise(.24,.14,840); tone(170,.21,"triangle",.11,55); break;
    case "critical": noise(.31,.17,1500); tone(250,.34,"sawtooth",.09,53); tone(620,.18,"sine",.10,240,.09); break;
    case "fire": noise(.68,.16,850); tone(110,.6,"sawtooth",.08,47); tone(600,.27,"triangle",.045,110,.11); break;
    case "dodge": tone(900,.2,"sine",.07,1450); noise(.13,.032,4000); break;
    case "shield": tone(280,.22,"sine",.1,540); tone(560,.25,"sine",.04,350,.13); break;
    case "win": [392,494,587,784,988].forEach((f,i)=>tone(f,.28,"triangle",.08,null,i*.14)); break;
    case "lose": [415,349,294,208].forEach((f,i)=>tone(f,.37,"sine",.075,null,i*.25)); break;
    default: break;
  }
}

// ============= GIAO DIỆN / NHẬT KÝ =============
function logMessage(message, type = "system", marker = "✦") {
  const li = document.createElement("li");
  li.className = `log-${type}`;
  const bullet = document.createElement("span");
  bullet.textContent = marker;
  li.append(bullet, document.createTextNode(message));
  UI.log.appendChild(li);
  UI.log.scrollTop = UI.log.scrollHeight;
  while (UI.log.children.length > 40) UI.log.removeChild(UI.log.firstElementChild);
}

function announce(message, duration = 1150) {
  clearTimeout(noticeTimer);
  UI.notice.textContent = message;
  UI.notice.classList.remove("is-visible");
  void UI.notice.offsetWidth; // Khởi động lại animation CSS.
  UI.notice.classList.add("is-visible");
  noticeTimer = setTimeout(() => UI.notice.classList.remove("is-visible"), duration);
}

function render() {
  if (!state) return;
  const { hero, dragon } = state;
  UI.heroName.textContent = hero.name.toLocaleUpperCase("vi-VN");
  UI.heroClass.textContent = `${hero.phancap} • LV ${hero.level}`;
  UI.heroHp.innerHTML = `${whole(hero.hp)}<span> / ${whole(hero.maxHp)}</span>`;
  UI.dragonHp.innerHTML = `${whole(dragon.hp)}<span> / ${whole(dragon.maxHp)}</span>`;
  UI.heroFill.style.width = `${clamp((hero.hp / hero.maxHp) * 100,0,100)}%`;
  UI.dragonFill.style.width = `${clamp((dragon.hp / dragon.maxHp) * 100,0,100)}%`;
  UI.heroMeter.setAttribute("aria-valuemax", String(hero.maxHp));
  UI.heroMeter.setAttribute("aria-valuenow", String(hero.hp));
  UI.dragonMeter.setAttribute("aria-valuenow", String(dragon.hp));
  UI.str.textContent = whole(hero.strength);
  UI.agi.textContent = whole(hero.agility);
  UI.intel.textContent = whole(hero.intel);
  UI.turn.innerHTML = `LƯỢT <strong>${String(state.turn).padStart(2,"0")}</strong>`;
  UI.status.textContent = state.phase === "idle" ? "ĐẾN LƯỢT ANH HÙNG" :
    state.phase === "busy" ? "ĐANG GIAO CHIẾN..." : "TRẬN CHIẾN ĐÃ KẾT THÚC";
  UI.actionHint.textContent = state.phase === "busy" ? "Đang thực hiện..." :
    state.phase === "finished" ? "Đã kết thúc" : "Chọn 1 trong 3 kỹ năng";
  UI.skillHint.textContent = state.cooldown === 0 ? "Sát thương x1,65" : `Hồi sau ${state.cooldown} lượt`;
  UI.attack.disabled = state.phase !== "idle";
  UI.defend.disabled = state.phase !== "idle";
  UI.skill.disabled = state.phase !== "idle" || state.cooldown > 0;
}

function actorPoint(actor, y = .49) {
  const stageRect = UI.stage.getBoundingClientRect();
  const actorRect = actor.getBoundingClientRect();
  return { x: actorRect.left - stageRect.left + actorRect.width / 2,
    y: actorRect.top - stageRect.top + actorRect.height * y };
}
function effect(type, target, duration = 550, y = .48) {
  const p = actorPoint(target,y);
  const element = document.createElement("div");
  element.className = type;
  element.style.left = `${p.x}px`;
  element.style.top = `${p.y}px`;
  UI.layer.appendChild(element);
  setTimeout(() => element.remove(),duration);
  return element;
}
function floatNumber(target, text, variation = "") {
  const el = effect(`float-text ${variation}`.trim(),target,1250,.34);
  el.textContent = text;
}
function flash(variation = "") {
  const el = document.createElement("div");
  el.className = `screen-flash ${variation}`;
  UI.layer.appendChild(el);
  setTimeout(() => el.remove(),410);
}
function shakeStage() {
  UI.stage.classList.remove("is-shaking");
  void UI.stage.offsetWidth;
  UI.stage.classList.add("is-shaking");
  setTimeout(() => UI.stage.classList.remove("is-shaking"),450);
}
function actorAnim(actor, className, duration = 720) {
  actor.classList.remove(className);
  void actor.offsetWidth;
  actor.classList.add(className);
  setTimeout(() => actor.classList.remove(className),duration);
}

async function fireballFlight() {
  const from = actorPoint(UI.dragon,.43);
  const to = actorPoint(UI.hero,.45);
  const orb = document.createElement("div");
  orb.className = "fireball-fx";
  orb.style.left = `${from.x - 31}px`;
  orb.style.top = `${from.y - 31}px`;
  UI.layer.appendChild(orb);
  try {
    const animation = orb.animate([
      {transform:"translate(0px,0px) scale(.5)",opacity:.65},
      {transform:`translate(${(to.x-from.x)*.52}px,${(to.y-from.y)*.58-22}px) scale(1.1)`,opacity:1,offset:.52},
      {transform:`translate(${to.x-from.x}px,${to.y-from.y}px) scale(1.35)`,opacity:1}
    ],{duration:680,easing:"ease-in",fill:"forwards"});
    await animation.finished;
  } catch (_) { await wait(680); }
  orb.remove();
}

// ============= HÀNH ĐỘNG THEO LƯỢT =============
async function heroAttack(useSkill, token) {
  const hero = state.hero;
  const dragon = state.dragon;
  const baseDamage = Math.round(hero.strength * (useSkill ? 1.65 : 1));
  // Điều kiện đánh trúng giữ giống code gốc: Math.random() * 100 > dragonAgi.
  const hit = Math.random() * 100 > dragon.agility;
  // Chí mạng theo INT. Ở lớp Thợ săn, INT cao sẽ tăng tỉ lệ chí mạng.
  const critical = hit && Math.random() * 100 < clamp(hero.intel,5,55);
  announce(useSkill ? "✦ TUYỆT KỸ TRẢM LONG!" : "⚔ ANH HÙNG TẤN CÔNG!");
  actorAnim(UI.hero,"is-attacking");
  sound("swing");
  await wait(265);
  if (token !== runId) return;
  effect("slash-fx",UI.dragon,470);
  if (useSkill) {
    // Vệt chém thứ hai cho tuyệt kỹ.
    setTimeout(() => { if (token === runId) effect("slash-fx",UI.dragon,470,.57); },120);
  }
  if (!hit) {
    actorAnim(UI.dragon,"is-dodging");
    floatNumber(UI.dragon,"MISS!","is-miss");
    logMessage("Rồng Già né được đòn tấn công của anh hùng!","system","↗");
    sound("dodge");
  } else {
    // Logic gốc: gây damage cơ bản, nếu critical cộng THÊM strength*2.
    const damage = baseDamage + (critical ? baseDamage * 2 : 0);
    dragon.hp = clamp(dragon.hp - damage,0,dragon.maxHp);
    actorAnim(UI.dragon,"is-hurt");
    effect("hit-burst",UI.dragon,520);
    floatNumber(UI.dragon,critical ? `CRITICAL! −${whole(damage)}` : `−${whole(damage)}`,critical ? "is-crit" : "");
    logMessage(`${useSkill ? "Tuyệt kỹ" : "Trảm Long"}: gây ${whole(damage)} sát thương lên Rồng Già${critical ? " — CHÍ MẠNG!" : "."}`,critical ? "crit" : "hero",critical ? "✹" : "⚔");
    if (critical) { flash("is-critical"); shakeStage(); sound("critical"); }
    else sound("hit");
    render();
  }
  await wait(590);
}

async function dragonAttack(token) {
  if (token !== runId || !state || state.dragon.hp <= 0) return;
  announce("♨ RỒNG GIÀ PHUN HỎA CẦU!");
  actorAnim(UI.dragon,"is-attacking");
  sound("fire");
  const hero = state.hero;
  const dragon = state.dragon;
  // Điều kiện né đòn lấy từ AGI như code gốc; giới hạn để cân bằng.
  const dodgeChance = clamp(hero.agility * .55,5,52);
  const hit = Math.random() * 100 > dodgeChance;
  const critical = hit && Math.random() * 100 < clamp(dragon.intel * .30,0,35);
  await fireballFlight();
  if (token !== runId) return;
  if (!hit) {
    actorAnim(UI.hero,"is-dodging");
    floatNumber(UI.hero,"NÉ TRÁNH!","is-miss");
    logMessage("Anh hùng né được quả hỏa cầu!","hero","↗");
    sound("dodge");
  } else {
    const baseDamage = Math.round(dragon.strength * .32);
    const rawDamage = baseDamage + (critical ? baseDamage * 2 : 0);
    const damage = hero.guarding ? Math.max(1,Math.round(rawDamage * .35)) : rawDamage;
    hero.hp = clamp(hero.hp - damage,0,hero.maxHp);
    actorAnim(UI.hero,"is-hurt");
    effect("hit-burst is-fire",UI.hero,540);
    flash("is-fire");
    floatNumber(UI.hero,critical ? `CHÍ MẠNG! −${whole(damage)}` : `−${whole(damage)}`,critical ? "is-crit" : "");
    logMessage(`Hỏa cầu gây ${whole(damage)} sát thương${critical ? " chí mạng" : ""}${hero.guarding ? " (đã giảm nhờ phòng thủ)" : ""}!`,critical ? "crit" : "dragon","♨");
    if (critical) { shakeStage(); sound("critical"); } else sound("hit");
    render();
  }
  hero.guarding = false;
  UI.hero.classList.remove("is-defending");
  await wait(460);
}

async function takeAction(action) {
  if (!state || state.phase !== "idle") return;
  if (action === "skill" && state.cooldown > 0) return;
  const token = runId;
  state.phase = "busy";
  render();
  if (action === "defend") {
    state.hero.guarding = true;
    UI.hero.classList.add("is-defending");
    effect("shield-fx",UI.hero,1150);
    announce("⬡ KHIÊN PHÒNG THỦ!");
    logMessage("Anh hùng giương khiên, giảm 65% sát thương nhận trong lượt này.","hero","⬡");
    sound("shield");
    await wait(720);
  } else {
    if (action === "skill") state.cooldown = 3; // Sau lượt này còn 2 lượt hồi.
    await heroAttack(action === "skill",token);
  }
  if (token !== runId || !state) return;
  if (state.dragon.hp <= 0) { endBattle(true); return; }
  await wait(330);
  if (token !== runId) return;
  await dragonAttack(token);
  if (token !== runId || !state) return;
  if (state.hero.hp <= 0) { endBattle(false); return; }
  // Hồi kỹ năng sau khi Rồng đã kết thúc phản công.
  state.cooldown = Math.max(0,state.cooldown - 1);
  state.turn++;
  state.phase = "idle";
  announce("ĐẾN LƯỢT CỦA BẠN",800);
  render();
}

function endBattle(won) {
  state.phase = "finished";
  render();
  const loser = won ? UI.dragon : UI.hero;
  loser.classList.add("is-dead");
  UI.resultMedal.textContent = won ? "🏆" : "💀";
  UI.resultKicker.textContent = won ? "RỒNG GIÀ ĐÃ BỊ ĐÁNH BẠI" : "CHIẾN TRƯỜNG THẤT THỦ";
  UI.resultTitle.textContent = won ? "CHIẾN THẮNG!" : "THẤT BẠI!";
  UI.resultText.textContent = won ? `${state.hero.name} đã trảm long thành công!` : "Anh hùng đã gục ngã trước ngọn lửa của Rồng Già. Hãy thử một phân cấp khác!";
  UI.resultRecap.textContent = `Lượt chiến đấu: ${state.turn}  •  Máu còn lại: ${whole(state.hero.hp)}  •  Rồng còn: ${whole(state.dragon.hp)} HP`;
  announce(won ? "🏆 CHIẾN THẮNG!" : "☠ THẤT BẠI!",2200);
  logMessage(won ? "CHÚC MỪNG! Bạn đã hạ gục Rồng Già!" : "Rồng Già đã đánh bại anh hùng.","victory",won ? "🏆" : "☠");
  sound(won ? "win" : "lose");
  const token = runId;
  setTimeout(() => { if (token === runId) { UI.result.classList.remove("is-hidden"); UI.result.setAttribute("aria-hidden","false"); $("playAgainBtn").focus(); } },1350);
}

function startGame() {
  const rawName = UI.playerName.value.trim();
  const name = rawName || "Anh Hùng";
  const chosen = document.querySelector('input[name="heroClass"]:checked')?.value || "a";
  runId++;
  state = { hero: makeHero(name,chosen), dragon: makeDragon(), turn:1, cooldown:0, phase:"idle" };
  UI.setup.classList.add("is-hidden");
  UI.setup.setAttribute("aria-hidden","true");
  UI.result.classList.add("is-hidden");
  UI.result.setAttribute("aria-hidden","true");
  UI.hero.className = "fighter fighter--hero";
  UI.dragon.className = "fighter fighter--dragon";
  UI.layer.replaceChildren();
  UI.log.replaceChildren();
  logMessage(`${name} (${state.hero.phancap}) đã bước vào chiến trường!`,"hero","⚔");
  logMessage("Rồng Già xuất hiện: HP 600 • STR 100 • AGI 15 • INT 80.","dragon","♨");
  logMessage("Hãy chọn TẤN CÔNG, TUYỆT KỸ hoặc PHÒNG THỦ.","system","✦");
  render();
  sound("start");
  announce("⚔ TRẬN CHIẾN BẮT ĐẦU!",1500);
  UI.attack.focus();
}
function openSetup() {
  runId++;
  state = null;
  clearTimeout(noticeTimer);
  UI.layer.replaceChildren();
  UI.hero.className = "fighter fighter--hero";
  UI.dragon.className = "fighter fighter--dragon";
  UI.attack.disabled = true; UI.skill.disabled = true; UI.defend.disabled = true;
  UI.status.textContent = "CHỜ NGƯỜI CHƠI BẮT ĐẦU";
  UI.actionHint.textContent = "Đang chuẩn bị";
  UI.setup.classList.remove("is-hidden");
  UI.setup.setAttribute("aria-hidden","false");
  UI.result.classList.add("is-hidden");
  UI.result.setAttribute("aria-hidden","true");
  UI.playerName.focus();
}

// Sự kiện click / phím tắt.
$("startBtn").addEventListener("click",startGame);
$("restartBtn").addEventListener("click",openSetup);
$("playAgainBtn").addEventListener("click",startGame);
UI.attack.addEventListener("click",()=>takeAction("attack"));
UI.skill.addEventListener("click",()=>takeAction("skill"));
UI.defend.addEventListener("click",()=>takeAction("defend"));
UI.mute.addEventListener("click",()=>{
  muted = !muted;
  UI.mute.textContent = muted ? "🔇" : "🔊";
  UI.mute.setAttribute("aria-label",muted ? "Bật âm thanh" : "Tắt âm thanh");
  UI.mute.title = muted ? "Bật âm thanh" : "Tắt âm thanh";
  if (!muted) sound("shield");
});
document.addEventListener("keydown",event=>{
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  const typing = ["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName);
  if (typing || !state || state.phase !== "idle") return;
  if (event.key === "1") takeAction("attack");
  if (event.key === "2") takeAction("skill");
  if (event.key === "3") takeAction("defend");
});
UI.playerName.focus();

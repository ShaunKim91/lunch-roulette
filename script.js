const DEFAULT_MENUS = ["김치찌개", "돈까스", "쌀국수", "비빔밥", "햄버거", "마라탕", "초밥", "샐러드"];
const COLORS = ["#f35d36", "#f4bd3d", "#24755a", "#e7836b", "#6d9f8d", "#f2d58d", "#d7482c", "#88ad7f", "#eea839", "#397f78"];
const MESSAGES = [
  "오늘 점심은 이 메뉴가 정답일지도 몰라요.",
  "고민 끝! 이제 맛있게 먹으러 갈 시간이에요.",
  "룰렛의 선택을 믿어보세요. 좋은 한 끼가 될 거예요.",
  "팀원에게 공유하고 오늘의 메뉴를 확정해보세요."
];

const state = {
  menus: readJson("lunch-menus", DEFAULT_MENUS, 2),
  rotation: 0,
  selected: null,
  spinning: false,
  room: new URLSearchParams(location.search).get("team")?.trim().slice(0, 24) || "우리 팀",
  votes: [],
  voted: sessionStorage.getItem("lunch-voted") === "true"
};

const elements = {
  wheel: document.querySelector("#wheel"),
  spinButton: document.querySelector("#spinButton"),
  voteButton: document.querySelector("#voteButton"),
  voteStatus: document.querySelector("#voteStatus"),
  resultCard: document.querySelector("#resultCard"),
  resultLead: document.querySelector("#resultLead"),
  resultText: document.querySelector("#resultText"),
  resultMessage: document.querySelector("#resultMessage"),
  rankingList: document.querySelector("#rankingList"),
  voteCount: document.querySelector("#voteCount"),
  dataMode: document.querySelector("#dataMode"),
  roomName: document.querySelector("#roomName"),
  menuEditor: document.querySelector("#menuEditor"),
  editMenusButton: document.querySelector("#editMenusButton"),
  menuForm: document.querySelector("#menuForm"),
  menuInput: document.querySelector("#menuInput"),
  menuList: document.querySelector("#menuList"),
  shareButton: document.querySelector("#shareButton"),
  copyButton: document.querySelector("#copyButton"),
  changeRoomButton: document.querySelector("#changeRoomButton"),
  toast: document.querySelector("#toast"),
  confetti: document.querySelector("#confetti"),
  qrCode: document.querySelector("#qrCode")
};

const ctx = elements.wheel.getContext("2d");
const config = window.APP_CONFIG || {};
const hasContainerApi = config.mode === "container";
const hasCloud = Boolean(config.supabaseUrl && config.supabaseAnonKey);

function readJson(key, fallback, minimumLength = 0) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) && value.length >= minimumLength ? value : fallback;
  } catch {
    return fallback;
  }
}

function drawWheel() {
  const size = elements.wheel.width;
  const center = size / 2;
  const radius = center - 5;
  const slice = (Math.PI * 2) / state.menus.length;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(center, center);
  state.menus.forEach((menu, index) => {
    const start = index * slice - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = COLORS[index % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = "#fffdf7";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.save();
    ctx.rotate(start + slice / 2);
    ctx.translate(radius * 0.63, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = index % 3 === 2 || index % 8 === 6 ? "#fffdf7" : "#20201e";
    ctx.font = `800 ${state.menus.length > 8 ? 22 : 25}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(menu.length > 6 ? `${menu.slice(0, 6)}…` : menu, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

function renderMenuList() {
  elements.menuList.innerHTML = "";
  state.menus.forEach((menu, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${menu} ×`;
    button.setAttribute("aria-label", `${menu} 삭제`);
    button.addEventListener("click", () => removeMenu(index));
    item.append(button);
    elements.menuList.append(item);
  });
}

function removeMenu(index) {
  if (state.menus.length <= 2) return showToast("메뉴는 2개 이상 필요해요.");
  state.menus.splice(index, 1);
  saveMenus();
}

function saveMenus() {
  localStorage.setItem("lunch-menus", JSON.stringify(state.menus));
  state.selected = null;
  resetResult();
  drawWheel();
  renderMenuList();
}

function spin() {
  if (state.spinning) return;
  state.spinning = true;
  state.selected = Math.floor(Math.random() * state.menus.length);
  const sliceDegrees = 360 / state.menus.length;
  const target = 360 - (state.selected * sliceDegrees + sliceDegrees / 2);
  const normalized = ((state.rotation % 360) + 360) % 360;
  state.rotation += 1800 + ((target - normalized + 360) % 360);
  elements.wheel.style.transform = `rotate(${state.rotation}deg)`;
  elements.spinButton.disabled = true;
  elements.spinButton.querySelector("span").textContent = "고르는 중";
  elements.voteButton.disabled = true;
  elements.voteStatus.textContent = "";

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.setTimeout(showResult, reducedMotion ? 50 : 3050);
}

function showResult() {
  const menu = state.menus[state.selected];
  state.spinning = false;
  elements.spinButton.disabled = false;
  elements.spinButton.querySelector("span").textContent = "한 번 더";
  elements.resultCard.classList.remove("is-empty");
  elements.resultLead.textContent = "룰렛이 고른 오늘의 점심은";
  elements.resultText.textContent = menu;
  elements.resultMessage.textContent = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  elements.voteButton.disabled = state.voted;
  elements.voteStatus.textContent = state.voted ? "이 브라우저에서는 이미 한 표를 보냈어요." : "";
  celebrate();
}

function resetResult() {
  elements.resultCard.classList.add("is-empty");
  elements.resultLead.textContent = "아직 룰렛을 돌리지 않았어요";
  elements.resultText.textContent = "무엇을 먹게 될까요?";
  elements.resultMessage.textContent = "원판 가운데의 주황색 버튼을 눌러보세요.";
  elements.voteButton.disabled = true;
}

async function vote() {
  if (state.selected === null || state.voted) return;
  const menu = state.menus[state.selected];
  elements.voteButton.disabled = true;
  elements.voteStatus.textContent = "한 표를 보내는 중…";
  try {
    if (hasContainerApi) {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu, room: state.room })
      });
      if (!response.ok) throw new Error("vote request failed");
    } else if (hasCloud) {
      const response = await fetch(`${config.supabaseUrl}/rest/v1/votes`, {
        method: "POST",
        headers: {
          apikey: config.supabaseAnonKey,
          Authorization: `Bearer ${config.supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({ menu, room: state.room })
      });
      if (!response.ok) throw new Error("vote request failed");
    } else {
      const key = `lunch-votes:${state.room}`;
      const localVotes = readJson(key, []);
      localVotes.push({ menu, room: state.room, created_at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(localVotes));
    }
    state.voted = true;
    sessionStorage.setItem("lunch-voted", "true");
    elements.voteStatus.textContent = `${menu}에 한 표! 선택을 저장했어요.`;
    showToast("투표가 반영됐어요.");
    await loadVotes();
  } catch {
    elements.voteButton.disabled = false;
    elements.voteStatus.textContent = "투표를 저장하지 못했어요. 잠시 후 다시 눌러주세요.";
  }
}

async function loadVotes() {
  try {
    if (hasContainerApi) {
      const room = encodeURIComponent(state.room);
      const response = await fetch(`/api/votes?room=${room}`);
      if (!response.ok) throw new Error("ranking request failed");
      state.votes = await response.json();
    } else if (hasCloud) {
      const room = encodeURIComponent(state.room);
      const response = await fetch(`${config.supabaseUrl}/rest/v1/votes?select=menu&room=eq.${room}`, {
        headers: { apikey: config.supabaseAnonKey, Authorization: `Bearer ${config.supabaseAnonKey}` }
      });
      if (!response.ok) throw new Error("ranking request failed");
      state.votes = await response.json();
    } else {
      state.votes = readJson(`lunch-votes:${state.room}`, []);
    }
    renderRanking();
  } catch {
    elements.rankingList.innerHTML = '<li class="ranking-empty">순위를 불러오지 못했어요. 잠시 후 새로고침해 주세요.</li>';
  }
}

function renderRanking() {
  const counts = state.votes.reduce((acc, voteItem) => {
    acc[voteItem.menu] = (acc[voteItem.menu] || 0) + 1;
    return acc;
  }, {});
  const ranking = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  elements.voteCount.textContent = `${state.votes.length}표`;
  elements.rankingList.innerHTML = "";
  if (!ranking.length) {
    elements.rankingList.innerHTML = '<li class="ranking-empty">첫 번째 한 표를 기다리고 있어요.</li>';
    return;
  }
  const max = ranking[0][1];
  ranking.forEach(([menu, count]) => {
    const item = document.createElement("li");
    item.innerHTML = `<div><span class="rank-name"></span><div class="rank-bar"><span class="rank-fill" style="width:${(count / max) * 100}%"></span></div></div><span class="rank-score">${count}표</span>`;
    item.querySelector(".rank-name").textContent = menu;
    elements.rankingList.append(item);
  });
}

function celebrate() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  elements.confetti.innerHTML = "";
  for (let index = 0; index < 42; index += 1) {
    const piece = document.createElement("i");
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = COLORS[index % COLORS.length];
    piece.style.animationDelay = `${Math.random() * 0.35}s`;
    piece.style.setProperty("--drift", `${Math.random() * 180 - 90}px`);
    elements.confetti.append(piece);
  }
  window.setTimeout(() => { elements.confetti.innerHTML = ""; }, 1800);
}

function shareUrl() {
  const url = new URL(location.href);
  url.searchParams.set("team", state.room);
  url.hash = "";
  return url.toString();
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl());
    showToast("링크를 복사했어요.");
  } catch {
    showToast("주소창의 링크를 복사해 주세요.");
  }
}

async function share() {
  if (navigator.share) {
    try {
      await navigator.share({ title: "오늘 뭐 먹지?", text: `${state.room}의 점심 메뉴를 같이 골라요!`, url: shareUrl() });
    } catch (error) {
      if (error.name !== "AbortError") copyLink();
    }
  } else {
    copyLink();
  }
}

function changeRoom() {
  const value = window.prompt("팀 이름을 입력해 주세요.", state.room);
  if (!value?.trim()) return;
  const url = new URL(location.href);
  url.searchParams.set("team", value.trim().slice(0, 24));
  location.href = url.toString();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2200);
}

function renderQr() {
  if (window.QRCode?.toCanvas) {
    window.QRCode.toCanvas(elements.qrCode, shareUrl(), { width: 152, margin: 1, color: { dark: "#20201e", light: "#fffdf7" } });
  } else {
    const qrContext = elements.qrCode.getContext("2d");
    qrContext.fillStyle = "#fffdf7";
    qrContext.fillRect(0, 0, 152, 152);
    qrContext.fillStyle = "#20201e";
    qrContext.font = "700 13px system-ui";
    qrContext.textAlign = "center";
    qrContext.fillText("링크 복사를 이용해 주세요", 76, 78);
  }
}

elements.spinButton.addEventListener("click", spin);
elements.voteButton.addEventListener("click", vote);
elements.copyButton.addEventListener("click", copyLink);
elements.shareButton.addEventListener("click", share);
elements.changeRoomButton.addEventListener("click", changeRoom);
elements.editMenusButton.addEventListener("click", () => {
  const opening = elements.menuEditor.hidden;
  elements.menuEditor.hidden = !opening;
  elements.editMenusButton.setAttribute("aria-expanded", String(opening));
  elements.editMenusButton.textContent = opening ? "편집 닫기" : "메뉴 편집";
  if (opening) elements.menuInput.focus();
});
elements.menuForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const menu = elements.menuInput.value.trim();
  if (!menu) return;
  if (state.menus.length >= 10) return showToast("메뉴는 최대 10개까지 추가할 수 있어요.");
  if (state.menus.includes(menu)) return showToast("이미 있는 메뉴예요.");
  state.menus.push(menu);
  elements.menuInput.value = "";
  saveMenus();
});

elements.roomName.textContent = state.room;
elements.dataMode.textContent = hasContainerApi || hasCloud ? "실시간 투표 연결됨" : "기기에서 연습 중";
drawWheel();
renderMenuList();
loadVotes();
window.addEventListener("load", renderQr);

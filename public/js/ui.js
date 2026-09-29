const localVideo = document.getElementById("localVideo");
const videoGrid = document.getElementById("videoGrid");
const participantCount = document.getElementById("participantCount");
const roomStatus = document.getElementById("roomStatus");
const cameraButton = document.getElementById("cameraButton");
const micButton = document.getElementById("micButton");
const startScreenButton = document.getElementById("startScreenButton");
const stopScreenButton = document.getElementById("stopScreenButton");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const sendChatButton = document.getElementById("sendChatButton");

// 画面上の参加者カードを、接続相手のIDで管理する
const peerCards = new Map();

const markdown = window.markdownit({ html: false, linkify: true, breaks: true })
    .use(window.texmath, {
        engine: window.katex,
        delimiters: "dollars",
        katexOptions: { throwOnError: false, trust: false, maxExpand: 1000, maxSize: 10 }
    });
markdown.disable("image");

export function showLocalStream(stream, isScreen = false) {
    localVideo.srcObject = stream;
    const card = localVideo.closest(".video-card");
    card.classList.toggle("has-video", Boolean(stream));
    card.classList.toggle("is-screen", isScreen);
}

export function addPeer(peerId) {
    if (peerCards.has(peerId)) return;

    const card = document.createElement("article");
    card.className = "video-card camera-off";
    card.setAttribute("aria-label", `参加者 ${peerId.slice(0, 4)} の映像`);

    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;

    const placeholder = document.createElement("div");
    placeholder.className = "video-placeholder";
    const avatar = document.createElement("span");
    avatar.className = "placeholder-avatar";
    avatar.textContent = "参";
    const placeholderText = document.createElement("span");
    placeholderText.textContent = "カメラはオフ";
    placeholder.append(avatar, placeholderText);

    const footer = document.createElement("div");
    footer.className = "video-footer";
    const name = document.createElement("span");
    name.className = "peer-name";
    name.textContent = `参加者 ${peerId.slice(0, 4)}`;
    const state = document.createElement("span");
    state.className = "peer-state";
    state.textContent = "接続中";
    const micState = document.createElement("span");
    micState.className = "mic-state";
    micState.textContent = "マイクオフ";
    footer.append(name, micState, state);

    card.append(video, placeholder, footer);
    videoGrid.appendChild(card);
    peerCards.set(peerId, card);
    updateParticipantCount();
}

export function showRemoteStream(peerId, stream) {
    addPeer(peerId);
    const card = peerCards.get(peerId);
    const video = card.querySelector("video");
    video.srcObject = stream;
    video.play().catch(() => {});
    card.classList.add("has-video");
}

// 音声の自動再生をブラウザが止めた場合、次のクリックで再試行する。
document.addEventListener("click", () => {
    for (const card of peerCards.values()) {
        const video = card.querySelector("video");
        if (video.srcObject && video.paused) video.play().catch(() => {});
    }
});

export function setPeerMediaState(peerId, { camera, mic, screen }) {
    addPeer(peerId);
    const card = peerCards.get(peerId);
    card.classList.toggle("camera-off", !camera && !screen);
    card.classList.toggle("is-screen", screen);
    const micState = card.querySelector(".mic-state");
    micState.textContent = mic ? "マイクオン" : "マイクオフ";
    micState.classList.toggle("is-on", mic);
}

export function setPeerState(peerId, state) {
    const card = peerCards.get(peerId);
    if (!card) return;
    const labels = {
        new: "準備中",
        connecting: "接続中",
        connected: "接続済み",
        disconnected: "再接続中",
        failed: "接続失敗",
        closed: "切断"
    };
    card.querySelector(".peer-state").textContent = labels[state] ?? state;
}

export function removePeer(peerId) {
    const card = peerCards.get(peerId);
    if (!card) return;
    card.querySelector("video").srcObject = null;
    card.remove();
    peerCards.delete(peerId);
    updateParticipantCount();
}

export function clearPeers() {
    for (const peerId of [...peerCards.keys()]) removePeer(peerId);
}

function updateParticipantCount() {
    participantCount.textContent = `${peerCards.size + 1} / 6 人`;
}

export function setRoomStatus(text) {
    roomStatus.textContent = text;
    roomStatus.closest(".header-status").classList.toggle("is-connected", text === "ルームに参加中");
    localVideo.closest(".video-card").querySelector(".peer-state").textContent =
        text === "ルームに参加中" ? "参加中" : "接続中";
}

export function setCameraEnabled(enabled) {
    cameraButton.setAttribute("aria-pressed", String(enabled));
    cameraButton.querySelector(".button-label").textContent = enabled ? "カメラをオフ" : "カメラをオン";
    localVideo.closest(".video-card").classList.toggle("camera-off", !enabled);
}

export function setMicEnabled(enabled) {
    micButton.setAttribute("aria-pressed", String(enabled));
    micButton.querySelector(".button-label").textContent = enabled ? "マイクをオフ" : "マイクをオン";
    const micState = localVideo.closest(".video-card").querySelector(".mic-state");
    micState.textContent = enabled ? "マイクオン" : "マイクオフ";
    micState.classList.toggle("is-on", enabled);
}

export function onCameraToggle(callback) {
    cameraButton.addEventListener("click", async () => {
        cameraButton.disabled = true;
        try { await callback(); } finally { cameraButton.disabled = false; }
    });
}

export function onMicToggle(callback) {
    micButton.addEventListener("click", async () => {
        micButton.disabled = true;
        try { await callback(); } finally { micButton.disabled = false; }
    });
}

export function setScreenShareButtons(isSharing) {
    startScreenButton.disabled = isSharing;
    stopScreenButton.disabled = !isSharing;
}

export function onStartScreenShare(callback) {
    startScreenButton.addEventListener("click", callback);
}

export function onStopScreenShare(callback) {
    stopScreenButton.addEventListener("click", callback);
}

export function setChatEnabled(enabled) {
    chatInput.disabled = !enabled;
    sendChatButton.disabled = !enabled;
}

export function onChatSubmit(callback) {
    chatForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;
        callback(text);
        chatInput.value = "";
    });

    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
            event.preventDefault();
            chatForm.requestSubmit();
        }
    });
}

export function appendChatMessage({ text, own, senderName }) {
    const item = document.createElement("li");
    item.className = `chat-message ${own ? "own" : "other"}`;

    const sender = document.createElement("strong");
    sender.className = "chat-sender";
    sender.textContent = own ? "あなた" : (senderName ?? "参加者");

    const content = document.createElement("div");
    content.className = "chat-content";
    // 生の HTML は無効にし、数式を含む描画結果も表示前に無害化する
    try {
        content.innerHTML = window.DOMPurify.sanitize(markdown.render(text), {
            ADD_TAGS: ["eq", "eqn"]
        });
    } catch (error) {
        console.error("メッセージの描画に失敗しました:", error);
        content.textContent = text;
    }

    item.append(sender, content);
    chatMessages.appendChild(item);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

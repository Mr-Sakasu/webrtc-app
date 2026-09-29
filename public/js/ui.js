const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startScreenButton = document.getElementById("startScreenButton");
const stopScreenButton = document.getElementById("stopScreenButton");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const sendChatButton = document.getElementById("sendChatButton");

export function showLocalStream(stream) {
    localVideo.srcObject = stream;
}
export function showRemoteStream(stream) {
    remoteVideo.srcObject = stream;
}
export function clearRemoteStream() {
    remoteVideo.srcObject = null;
}
export function setScreenShareButtons(isSharing) {
    startScreenButton.disabled = isSharing;
    stopScreenButton.disabled = !isSharing;
}
export function onStartScreenShare(callback) {
    startScreenButton.addEventListener(
        "click", callback
    );
}
export function onStopScreenShare(callback) {
    stopScreenButton.addEventListener(
        "click", callback
    );
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
}

export function appendChatMessage({ text, own }) {
    const item = document.createElement("li");
    // textContent を使い、メッセージを HTML として解釈させない
    item.textContent = `${own ? "自分" : "相手"}: ${text}`;
    chatMessages.appendChild(item);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

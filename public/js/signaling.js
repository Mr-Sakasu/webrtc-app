const socket = io();

export function joinRoom(){
    socket.emit("join-room");
}

// チャットも映像のシグナリングと同じルームを経由する
export function sendChatMessage(text) {
    socket.emit("chat-message", text);
}

export function sendMediaState(state) {
    socket.emit("media-state", state);
}

export function sendOffer(to, offer) {
    socket.emit("offer", { to, data: offer });
}

export function sendAnswer(to, answer) {
    socket.emit("answer", { to, data: answer });
}

export function sendIceCandidate(to, candidate) {
    socket.emit("ice-candidate", { to, data: candidate });
}

export function onConnected(callback) {
    socket.on("connect", callback);
}

export function onDisconnected(callback) {
    socket.on("disconnect", callback);
}

export function onRoomJoined(callback) {
    socket.on("room-joined", callback);
}

export function onChatMessage(callback) {
    socket.on("chat-message", callback);
}

export function onMediaState(callback) {
    socket.on("media-state", callback);
}


export function onUserConnected(callback) {
    socket.on("user-connected", callback);
}

export function onOffer(callback) {
    socket.on("offer", callback);
}

export function onAnswer(callback) {
    socket.on("answer", callback);
}

export function onIceCandidate(callback) {
    socket.on("ice-candidate", callback);
}

export function onUserDisconnected(callback) {
    socket.on("user-disconnected", callback);
}

export function onRoomFull(callback) {
    socket.on("room-full", callback);
}

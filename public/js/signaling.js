const socket = io();

export function joinRoom(){
    socket.emit("join-room");
}

// チャットも映像のシグナリングと同じルームを経由する
export function sendChatMessage(text) {
    socket.emit("chat-message", text);
}

export function sendOffer(offer) {
    socket.emit("offer", offer);
}

export function sendAnswer(answer) {
    socket.emit("answer", answer);
}

export function sendIceCandidate(candidate) {
    socket.emit("ice-candidate", candidate);
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

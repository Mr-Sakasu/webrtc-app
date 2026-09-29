const socket = io();

export function joinRoom(){
    socket.emit("join-room");
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

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startScreenButton = document.getElementById("startScreenButton");
const stopScreenButton = document.getElementById("stopScreenButton");

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

let cameraStream = null;
let screenStream = null;

export async function startCamera() {
    //もうすでに有効なカメラあり
    if(cameraStream?.active){
        return cameraStream;
    }
    cameraStream =
        await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

    return cameraStream;
}

export async function startScreenCapture() {
    if(screenStream?.active){
        return screenStream;
    }

    //Promise<MediaStream>: 画面を選び終えたら、MediaStreamを渡す
    //画面を選び終えるまでは、その先に進まず待機 (呼び出し元へ制御を返し、全体のプロセスには影響しない)
    screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
            width: {ideal: 1920},
            height: {ideal: 1080},
            frameRate: {ideal: 15, max: 15},
        },
        audio: false
    });

    const screenTrack = screenStream.getVideoTracks()[0];
    // 文字や細部の鮮明さを優先
    screenTrack.contentHint = "detail";
    return screenStream;
}

export function stopScreenCapture() {
    if (!screenStream)  return;
    screenStream.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
    });
    screenStream = null;
}

export function getCameraStream() {
    return cameraStream;
}

export function getScreenStream() {
    return screenStream;
}
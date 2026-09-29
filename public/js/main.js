// main.js: entry point (appを開始する入口)

import {
    startCamera,
    startScreenCapture,
    stopScreenCapture,
    getCameraStream,
    getScreenStream
} from "./media.js";

import {
    onConnected,
    onUserConnected,
    onOffer,
    onAnswer,
    onIceCandidate,
    onUserDisconnected,
    onRoomFull,
    joinRoom,
    sendOffer,
    sendAnswer
} from "./signaling.js";

import {
    createPeerConnection,
    createOffer,
    receiveOffer,
    receiveAnswer,
    receiveIceCandidate,
    getVideoSender,
    closePeerConnection
} from "./peer.js";

import {
    showLocalStream,
    showRemoteStream,
    clearRemoteStream,
    setScreenShareButtons,
    onStartScreenShare,
    onStopScreenShare
} from "./ui.js";


let cameraReadyPromise;

function preparePeerConnection() {
    const localStream = getScreenStream() ?? getCameraStream();
    if (!localStream) {
        throw new Error("利用できる映像がありません");
    }

    return createPeerConnection(
        localStream,

        // 相手の映像を受信したとき
        (remoteStream) => {
            showRemoteStream(remoteStream);
        },

        // 接続状態が変わったとき
        (state) => {
            console.log("接続状態:", state);
        }
    );
}

// Socket.IO接続後、すぐルームへ参加
onConnected(() => {
    joinRoom();
});


// 1人目がOfferを作る
onUserConnected(async () => {
    try {
        await cameraReadyPromise;
        preparePeerConnection();
        const offer = await createOffer();
        sendOffer(offer);
    } catch (error) {
        console.error(
            "Offer作成に失敗しました:",
            error
        );
    }
});

// 2人目がAnswerを作る
onOffer(async (offer) => {
    try {
        await cameraReadyPromise;
        preparePeerConnection();
        const answer = await receiveOffer(offer);
        sendAnswer(answer);
    } catch (error) {
        console.error(
            "Offer処理に失敗しました:", error
        );
    }
});

onAnswer(async (answer) => {
    try {
        await receiveAnswer(answer);
    } catch (error) {
        console.error(
            "Answer処理に失敗しました:", error
        );
    }
});

onIceCandidate(async (candidate) => {
    try {
        await receiveIceCandidate(candidate);
    } catch (error) {
        console.error(
            "ICE Candidate処理に失敗しました:", error
        );
    }
});

onUserDisconnected(() => {
    closePeerConnection();
    clearRemoteStream();
});

onRoomFull(() => {
    alert("このルームにはすでに2人います");
});

// 画面共有開始
onStartScreenShare(async () => {
    try {
        const screenStream = await startScreenCapture();
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = getVideoSender();
        if (sender) await sender.replaceTrack(screenTrack);
        showLocalStream(screenStream);
        setScreenShareButtons(true);
        // ブラウザ標準の「共有を停止」に対応
        screenTrack.onended = stopSharing;
    } catch (error) {
        console.error(
            "画面共有に失敗しました:",
            error
        );
    }
});

// 画面共有終了
async function stopSharing() {
    if (!getScreenStream()) return;
    const sender = getVideoSender();
    const cameraStream = getCameraStream();
    const cameraTrack = cameraStream?.getVideoTracks()[0] ?? null;
    if (sender) await sender.replaceTrack(cameraTrack);
    stopScreenCapture();
    showLocalStream(cameraStream);
    setScreenShareButtons(false);
}

onStopScreenShare(stopSharing);

// カメラ取得開始
cameraReadyPromise = startCamera()
    .then((stream) => {
        if (!getScreenStream()) showLocalStream(stream);
    })
    .catch((error) => {
        console.error(
            "カメラ取得に失敗しました:",
            error
        );
    });

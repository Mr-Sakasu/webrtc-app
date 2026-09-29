// main.js: entry point (appを開始する入口)

import {
    startCamera,
    stopCamera,
    startMicrophone,
    stopMicrophone,
    startScreenCapture,
    stopScreenCapture,
    getCameraStream,
    getMicrophoneStream,
    getScreenStream
} from "./media.js";

import {
    onConnected,
    onDisconnected,
    onRoomJoined,
    onChatMessage,
    onUserConnected,
    onOffer,
    onAnswer,
    onIceCandidate,
    onUserDisconnected,
    onRoomFull,
    onMediaState,
    joinRoom,
    sendChatMessage,
    sendMediaState,
    sendOffer,
    sendAnswer
} from "./signaling.js";

import {
    createPeerConnection,
    createOffer,
    receiveOffer,
    receiveAnswer,
    receiveIceCandidate,
    replaceVideoTrack,
    replaceAudioTrack,
    closePeerConnection,
    closeAllPeerConnections
} from "./peer.js";

import {
    showLocalStream,
    showRemoteStream,
    addPeer,
    removePeer,
    clearPeers,
    setPeerState,
    setRoomStatus,
    setScreenShareButtons,
    setCameraEnabled,
    setMicEnabled,
    setPeerMediaState,
    onCameraToggle,
    onMicToggle,
    onStartScreenShare,
    onStopScreenShare,
    setChatEnabled,
    onChatSubmit,
    appendChatMessage
} from "./ui.js";


function preparePeerConnection(peerId) {
    addPeer(peerId);
    return createPeerConnection(
        peerId,
        getScreenStream() ?? getCameraStream(),
        getMicrophoneStream(),

        // 相手の映像を受信したとき
        (id, remoteStream) => {
            showRemoteStream(id, remoteStream);
        },

        // 接続状態が変わったとき
        (id, state) => {
            console.log("接続状態:", id, state);
            setPeerState(id, state);
        }
    );
}

// 参加者一覧に表示する、現在のカメラ・マイク・共有状態
function announceMediaState() {
    sendMediaState({
        camera: Boolean(getCameraStream()?.active),
        mic: Boolean(getMicrophoneStream()?.active),
        screen: Boolean(getScreenStream()?.active)
    });
}

// Socket.IO接続後、すぐルームへ参加
onConnected(() => {
    joinRoom();
});

// サーバーがルーム参加を認めたら送信できるようにする
onRoomJoined(({ peers }) => {
    setChatEnabled(true);
    setRoomStatus("ルームに参加中");
    for (const { id, state } of peers) setPeerMediaState(id, state);
    announceMediaState();
});
onDisconnected(() => {
    setChatEnabled(false);
    setRoomStatus("再接続中...");
    closeAllPeerConnections();
    clearPeers();
});
onChatMessage(appendChatMessage);
onChatSubmit(sendChatMessage);
onMediaState(({ from, state }) => setPeerMediaState(from, state));


// 既存の参加者が、新しく入った相手へ Offer を送る
onUserConnected(async ({ id, state }) => {
    try {
        setPeerMediaState(id, state);
        preparePeerConnection(id);
        const offer = await createOffer(id);
        sendOffer(id, offer);
    } catch (error) {
        console.error(
            "Offer作成に失敗しました:",
            error
        );
    }
});

// 新しい参加者は、届いた Offer ごとに Answer を返す
onOffer(async ({ from, data: offer }) => {
    try {
        preparePeerConnection(from);
        const answer = await receiveOffer(from, offer);
        sendAnswer(from, answer);
    } catch (error) {
        console.error(
            "Offer処理に失敗しました:", error
        );
    }
});

onAnswer(async ({ from, data: answer }) => {
    try {
        await receiveAnswer(from, answer);
    } catch (error) {
        console.error(
            "Answer処理に失敗しました:", error
        );
    }
});

onIceCandidate(async ({ from, data: candidate }) => {
    try {
        await receiveIceCandidate(from, candidate);
    } catch (error) {
        console.error(
            "ICE Candidate処理に失敗しました:", error
        );
    }
});

onUserDisconnected((peerId) => {
    closePeerConnection(peerId);
    removePeer(peerId);
});

onRoomFull(() => {
    setRoomStatus("満室のため参加できません");
    alert("このルームにはすでに6人います");
});

// ページを開いた時点ではカメラもマイクも取得しない。
// ボタンを押した時だけブラウザに利用許可を求める。
onCameraToggle(async () => {
    try {
        if (getCameraStream()?.active) {
            stopCamera();
            if (!getScreenStream()) await replaceVideoTrack(null);
            showLocalStream(getScreenStream(), Boolean(getScreenStream()));
            setCameraEnabled(false);
        } else {
            const stream = await startCamera();
            if (!getScreenStream()) {
                await replaceVideoTrack(stream.getVideoTracks()[0]);
                showLocalStream(stream, false);
            }
            setCameraEnabled(true);
        }
        announceMediaState();
    } catch (error) {
        console.error("カメラの切り替えに失敗しました:", error);
    }
});

onMicToggle(async () => {
    try {
        if (getMicrophoneStream()?.active) {
            stopMicrophone();
            await replaceAudioTrack(null);
            setMicEnabled(false);
        } else {
            const stream = await startMicrophone();
            await replaceAudioTrack(stream.getAudioTracks()[0]);
            setMicEnabled(true);
        }
        announceMediaState();
    } catch (error) {
        console.error("マイクの切り替えに失敗しました:", error);
    }
});

// 画面共有開始
onStartScreenShare(async () => {
    try {
        const screenStream = await startScreenCapture();
        const screenTrack = screenStream.getVideoTracks()[0];
        await replaceVideoTrack(screenTrack);
        showLocalStream(screenStream, true);
        setScreenShareButtons(true);
        announceMediaState();
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
    const cameraStream = getCameraStream();
    const cameraTrack = cameraStream?.getVideoTracks()[0] ?? null;
    // 先に共有状態を消し、同時に参加した人が古い画面を送らないようにする
    stopScreenCapture();
    await replaceVideoTrack(cameraTrack);
    showLocalStream(cameraStream, false);
    setScreenShareButtons(false);
    announceMediaState();
}

onStopScreenShare(stopSharing);

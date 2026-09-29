import { sendIceCandidate } from "./signaling.js";

// 相手のIDごとに、1本ずつ WebRTC 接続を持つ
const peers = new Map();
const pendingIceCandidates = new Map();

const rtcConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export function createPeerConnection(
    peerId,
    videoStream,
    microphoneStream,
    onRemoteStream,
    onConnectionStateChange
) {
    if (peers.has(peerId)) return peers.get(peerId).connection;

    const connection = new RTCPeerConnection(rtcConfiguration);
    // オフのときも送信枠を作り、後でオンにしたら replaceTrack で切り替える
    const videoTrack = videoStream?.getVideoTracks()[0];
    const videoSender = videoTrack
        ? connection.addTrack(videoTrack, videoStream)
        : connection.addTransceiver("video", { direction: "sendrecv" }).sender;
    const audioTrack = microphoneStream?.getAudioTracks()[0];
    const audioSender = audioTrack
        ? connection.addTrack(audioTrack, microphoneStream)
        : connection.addTransceiver("audio", { direction: "sendrecv" }).sender;

    peers.set(peerId, { connection, videoSender, audioSender });

    const remoteStream = new MediaStream();
    connection.ontrack = (event) => {
        // 映像と音声を1つの MediaStream にまとめて再生する
        remoteStream.addTrack(event.track);
        onRemoteStream(peerId, remoteStream);
    };

    connection.onconnectionstatechange = () => {
        onConnectionStateChange(peerId, connection.connectionState);
    };

    connection.onicecandidate = (event) => {
        if (event.candidate) sendIceCandidate(peerId, event.candidate);
    };

    return connection;
}

export async function createOffer(peerId) {
    const connection = peers.get(peerId).connection;
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    return connection.localDescription;
}

export async function receiveOffer(peerId, offer) {
    const connection = peers.get(peerId).connection;
    await connection.setRemoteDescription(offer);
    await addPendingIceCandidates(peerId);
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);
    return connection.localDescription;
}

export async function receiveAnswer(peerId, answer) {
    const connection = peers.get(peerId)?.connection;
    if (!connection || connection.signalingState !== "have-local-offer") return;
    await connection.setRemoteDescription(answer);
    await addPendingIceCandidates(peerId);
}

export async function receiveIceCandidate(peerId, candidate) {
    const connection = peers.get(peerId)?.connection;
    if (!connection?.remoteDescription) {
        const candidates = pendingIceCandidates.get(peerId) ?? [];
        candidates.push(candidate);
        pendingIceCandidates.set(peerId, candidates);
        return;
    }
    await connection.addIceCandidate(candidate);
}

async function addPendingIceCandidates(peerId) {
    const connection = peers.get(peerId).connection;
    for (const candidate of pendingIceCandidates.get(peerId) ?? []) {
        await connection.addIceCandidate(candidate);
    }
    pendingIceCandidates.delete(peerId);
}

export async function replaceVideoTrack(track) {
    // 画面共有の開始・終了を、接続中の全員へ反映する
    await Promise.all([...peers.values()].map(({ videoSender }) => {
        return videoSender?.replaceTrack(track);
    }));
}

export async function replaceAudioTrack(track) {
    await Promise.all([...peers.values()].map(({ audioSender }) => {
        return audioSender.replaceTrack(track);
    }));
}

export function closePeerConnection(peerId) {
    peers.get(peerId)?.connection.close();
    peers.delete(peerId);
    pendingIceCandidates.delete(peerId);
}

export function closeAllPeerConnections() {
    for (const peerId of peers.keys()) closePeerConnection(peerId);
}

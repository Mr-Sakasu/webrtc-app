import { sendIceCandidate } from "./signaling.js";

let peerConnection = null;
let pendingIceCandidates = [];

const rtcConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export function createPeerConnection(
    localStream,
    onRemoteStream,
    onConnectionStateChange
) {
    if (peerConnection && peerConnection.signalingState !== "closed") {
        return peerConnection;
    }

    peerConnection = new RTCPeerConnection(rtcConfiguration);

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(
            track,
            localStream
        );
    });

    peerConnection.ontrack = (event) => {
        onRemoteStream(event.streams[0]);
    };

    peerConnection.onconnectionstatechange = () => {
        onConnectionStateChange(
            peerConnection.connectionState
        );
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            sendIceCandidate(event.candidate);
        }
    };

    return peerConnection;
}

export async function createOffer() {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return peerConnection.localDescription;
}

export async function receiveOffer(offer) {
    await peerConnection.setRemoteDescription(offer);
    await addPendingIceCandidates();
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return peerConnection.localDescription;
}

export async function receiveAnswer(answer) {
    if ( !peerConnection || peerConnection.signalingState !== "have-local-offer") {
        return;
    }
    await peerConnection.setRemoteDescription(answer);
    await addPendingIceCandidates();
}

export async function receiveIceCandidate(candidate) {
    if ( !peerConnection || !peerConnection.remoteDescription ) {
        pendingIceCandidates.push(candidate);
        return;
    }
    await peerConnection.addIceCandidate(candidate);
}

async function addPendingIceCandidates() {
    for (const candidate of pendingIceCandidates) {
        await peerConnection.addIceCandidate(candidate);
    }
    pendingIceCandidates = [];
}

export function getVideoSender() {
    return peerConnection?.getSenders().find((sender) => {
            return sender.track?.kind === "video";
        });
}

export function closePeerConnection() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    pendingIceCandidates = [];
}

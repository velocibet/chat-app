import { io } from "socket.io-client";

const config = useRuntimeConfig();

export function useWebRTC() {
  const socket = useState<any>('socket', () => {
        return io(config.public.wsBase, {
            query: { userId: 1 },
        })
    });


  let pc: RTCPeerConnection;
  let localStream: MediaStream;

  async function init() {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true
    });

    pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
      ]
    });

    localStream.getTracks().forEach(track =>
      pc.addTrack(track, localStream)
    );

    pc.onicecandidate = e => {
      if (e.candidate) socket.value.emit("ice", e.candidate);
    };

    pc.ontrack = e => {
      const video = document.getElementById("remote") as HTMLVideoElement;
      video.srcObject = e.streams[0] ?? null;
    };

    socket.value.on("offer", onOffer);
    socket.value.on("answer", onAnswer);
    socket.value.on("ice", onIce);
  }

  async function createOffer() {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.value.emit("offer", offer);
  }

  async function onOffer(offer: RTCSessionDescriptionInit) {
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.value.emit("answer", answer);
  }

  async function onAnswer(answer: RTCSessionDescriptionInit) {
    await pc.setRemoteDescription(answer);
  }

  async function onIce(candidate: RTCIceCandidateInit) {
    await pc.addIceCandidate(candidate);
  }

  return {
    init,
    createOffer
  };
}

<template>
  <div>
    <video id="local" autoplay playsinline muted></video>
    <video id="remote" autoplay playsinline></video>

    <button @click="start">통화 시작</button>
  </div>
</template>

<script setup lang="ts">
import { io } from "socket.io-client";
import { useWebRTC } from "~/composables/useWebRTC";

const socket = useState<any>("socket");

const { init, createOffer } = useWebRTC();

async function start() {
  await init();

  const localVideo = document.getElementById("local") as HTMLVideoElement;
  const stream = await navigator.mediaDevices.getUserMedia({
    video: false,
    audio: true
  });

  localVideo.srcObject = stream;

  await createOffer();
}
</script>

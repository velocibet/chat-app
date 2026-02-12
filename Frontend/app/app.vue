<script setup lang="ts">
import 'normalize.css';

const route = useRoute();
const { connect, disconnect, socket } = useSocket();

const manageSocket = async (path: string) => {
  if (path.startsWith('/chat') || path.startsWith('/settings')) {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect socket:', error);
    }
  } else {
    disconnect();
  }
};

onMounted(() => {
  manageSocket(route.path);
});

watch(() => route.path, (newPath) => {
  manageSocket(newPath);
});

onUnmounted(() => {
  disconnect();
});
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
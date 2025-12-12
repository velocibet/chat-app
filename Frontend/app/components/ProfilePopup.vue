<template>
  <div v-if="modelValue" class="popup-overlay" @click.self="closePopup">
    <div class="popup-content">
      <h2>{{ username }}</h2>
      <p>{{ bio }}</p>
      <button @click="editProfile">프로필 수정</button>
      <button @click="closePopup">닫기</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  modelValue: boolean
  username: string
  bio: string
}

const props = defineProps<Props>()
const emits = defineEmits(['update:modelValue', 'edit'])

const closePopup = () => emits('update:modelValue', false)
const editProfile = () => emits('edit')
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  inset: 0;
  color: #ffffff;
  background: rgba(0000000,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.popup-content {
  background: #2f3136;
  padding: 2rem;
  border-radius: 10px;
  width: 300px;
  text-align: center;
}
button {
  margin-top: 1rem;
}
</style>

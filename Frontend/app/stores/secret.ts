import { defineStore } from 'pinia';

interface SecretState {
  privateKey: CryptoKey | null;
  publicKey: string | null;
}

export const useSecretStore = defineStore('secret', {
  state: (): SecretState => ({
    privateKey: null,
    publicKey: null,
  }),

  getters: {
    isKeyReady: (state) => !!state.privateKey,
  },

  actions: {
    setKeys(privateKey: CryptoKey, publicKey: string) {
      this.privateKey = privateKey;
      this.publicKey = publicKey;
      console.log('보안 키를 메모리에 안전하게 불러왔습니다.');
    },

    resetKeys() {
      this.privateKey = null;
      this.publicKey = null;
      console.log('보안 키가 메모리에서 제거되었습니다.');
    },
  },
});
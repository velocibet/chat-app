import { defineStore } from 'pinia';

export const useAlarmStore = defineStore('AlarmStore', () => {
    const alarms = ref<Record<number, number>>({});

    function setAlarms(friendId : number, alarm : number) {
        alarms.value[friendId] = alarm;
    }

    function addAlarm(friendId : number) {
        const prev = alarms.value[friendId] ?? 0;
        alarms.value[friendId] = prev + 1;
    }

    return { alarms, setAlarms, addAlarm };
})
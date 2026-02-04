export const useRoomImage = () => {
    const config = useRuntimeConfig();

    const getUrl = (url: string | number | null | undefined) => {
        if (!url) return '/images/default-avatar.webp';

        return `${config.public.apiBase}/chatroom/room/image/${url}`;
    };

    return {
        getUrl
    };
}
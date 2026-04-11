export const useProfileImage = () => {
    const config = useRuntimeConfig();

    const getUrl = (url: string | number | null | undefined) => {
        if (!url) return '/images/default-avatar.webp';

        return `${config.public.imgBase}/${url}`;
    };

    return {
        getUrl
    };
}
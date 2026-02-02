export const socketOk = (msg: string, data?: any) => {
    return {
        success: true,
        message: msg ? msg : 'ok',
        data: data ? data : {}
    }
}

export const socketFail = (msg: string, data?: any) => {
    return {
        success: false,
        message: msg ? msg : "알수 없는 이유로 오류가 발생했습니다.",
        data: data ? data : {}
    }
}
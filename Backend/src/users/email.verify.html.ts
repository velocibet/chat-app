export const useEmailVerifyHtml = (token: string) => {
    return `
        <p>Velocibet 서비스를 이용해 주셔서 감사합니다.</p>

        <p>아래 버튼을 눌러 이메일 인증을 완료해주세요.</p>
        <a href="https://dev.velocibet.com/verify?token=${token}">
          이메일 인증하기
        </a>

        <p>이 링크는 30분 후 만료됩니다. 요청하지 않으셨다면 이 메일을 무시하셔도 됩니다.</p>
        <p style="font-size:12px;color:#666">
          Velocibet<br />
          문의: support@velocibet.com
        </p>
    `
}
export const useUserApi = () => {
  const api = useApi('/users');

  return {
    /** [POST] 이메일 인증 메일 발송 */
    sendVerifyEmail: (email: string) =>
      api.post('/email/send', { email }),

    /** [POST] 이메일 인증 토큰 검증 */
    verifyEmailToken: (token: string) =>
      api.post<{ message: string }>('/email/verify', { token }),
    
    /** [POST] 회원가입 */
    register: (body: RegisterDto) => api.post('/register', body),

    /** [POST] 로그인 */
    login: (body: LoginDto) => api.post<LoginReponse>('/login', body),

    /** [GET] 내 정보 확인 (세션 기반) */
    getMe: () => api.get<User>('/me'),

    /** [GET] 로그아웃 */
    logout: () => api.get('/logout'),

    /** [PATCH] 프로필 수정 (Multipart/Form-data) */
    updateProfile: (formData: FormData) => api.patch<{message: string, data: User}>('/', formData),

    /** [PATCH] 비밀번호 변경 */
    changePassword: (body: ChangePasswordDto) => api.patch('/password', body),

    /** [DELETE] 회원 탈퇴 */
    deleteAccount: (body: DeleteDto) => api.delete('/', { body }),

    /** [GET] 특정 유저 프로필 조회 */
    getOtherProfile: (userId: number) => api.get<User>(`/${userId}`),
  };
};
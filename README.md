# Velocibet 벨로시벳

Velocibet, 벨로시벳은 **웹 기반 실시간 메신저**입니다.

[서비스 URL](https://www.velocibet.com/) (현재 개발로 인해 배포 일시 중단)

### 왜 메신저?

Velocibet은 "메신저 구현은 쉽지 않을까?"라는 단순한 호기심에서 출발했습니다. 하지만 개발 과정에서 카카오톡, 디스코드와 같은 기존 메신저들의 보안 취약점과 설치형 앱의 번거로움을 목격했고, 이를 해결하기 위해 **설치 없는 웹 환경**과 **강력한 보안**이 결합된 메신저를 목표로 발전시키고 있습니다.

## 기술 스택

### Backend
- **Server**: NestJS
- **Database**: PostgreSQL, Redis
- **Security**: Argon2, Express-session, @nestjs/throttler

### Frontend
- **Framework**: Nuxt, Pinia
- **Language**: TypeScript

### Real-time
- **WebSocket**: Socket.io

### Deployment
- **CI/CD**: GitHub Actions
- **Process Manager**: PM2

### Storage
- **Object Storage**: Cloudflare R2

### Database Management
- **Migration**: pg-diff, pg-migrate

## 아키텍처

### Backend (NestJS Layered Architecture)
- **Controller**: 클라이언트 요청 처리
- **Service**: 비즈니스 로직 처리
- **DTO**: 데이터 검증
- **Security**: Argon2 (비밀번호), Express-session (세션), Throttler (API 요청 제한)

### Frontend (Composable 기반 구조)
- `useApi.ts`: REST API 요청 처리
- `useSocket.ts`: Socket.IO 실시간 이벤트 처리
- 폴더 구조: `composables/api/`, `composables/socket/`
- 장점: 컴포넌트 단순화, 로직 재사용, 서버 주소 변경 대응 용이

## 주요 기능

- **메시지**: 실시간 송수신, 파일 전송
- **채팅방**: DM, Group
- **사용자**: 회원가입 / 로그인, 이메일 기반 사용자 인증, 친구 기능

## 앞으로의 비전

- **WebRTC 기반 통화 기능 신규 구현**
- 이미지 외 파일 전송 기능 지원
- **IndexedDB 기반 메세지 로컬 저장 및 오프라인 캐싱 기능 추가**
- **End-to-End Encryption (E2EE) (서버가 메시지를 복호화할 수 없는 구조 설계)**
- Zero-Knowledge Architecture (서버에 어떠한 개인정보도 평문으로 남기지 않는 설계 지향)

## Social
- [X](https://x.com/velocibet)
- [Blog](https://blog.velocibet.com/)

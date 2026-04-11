<template>
  <section class="document-page">
    <div class="document-container fade-up active">
      <header class="doc-header">
        <h1>개인정보처리방침</h1>
        <p class="last-updated">시행일: 2026년 3월 3일</p>
      </header>

      <div class="doc-content">
        <p class="intro">
          <strong>벨로시벳</strong>('https://www.velocibet.com' 이하 '벨로시벳')은 이용자의 개인정보를 소중히 다루며, 「개인정보보호법」 등 관련 법령을 준수합니다.
        </p>

        <section class="doc-section">
          <h2>1. 개인정보의 처리 목적</h2>
          <ul>
            <li>회원 관리 및 본인 식별, 인증</li>
            <li>서비스 개선 및 신규 서비스 개발</li>
            <li>푸시 알림 및 실시간 채팅 서비스 제공</li>
          </ul>
        </section>

        <section class="doc-section">
          <h2>2. 처리하는 개인정보의 항목</h2>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>구분</th>
                  <th>항목</th>
                  <th>수집 목적</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>필수</td>
                  <td>이메일, 비밀번호, 닉네임</td>
                  <td>회원가입, 로그인, 서비스 제공</td>
                </tr>
                <tr>
                  <td>선택</td>
                  <td>프로필 사진</td>
                  <td>개인화 서비스 제공, 소셜 기능 사용</td>
                </tr>
                <tr>
                  <td>자동 수집</td>
                  <td>IP 주소, User-Agent, 접속 로그, 기기 정보</td>
                  <td>회원 관리 및 이용통계, 보안 및 서비스 개선</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="doc-section">
          <h2>3. 개인정보의 제3자 제공</h2>
          <ul>
            <li>이미지 및 파일 저장: Cloudflare R2</li>
            <li>푸시 알림 전송: FCM (Firebase Cloud Messaging)</li>
            <li>제3자 제공 시 안전한 전송 및 최소한의 정보만 제공</li>
          </ul>
        </section>

        <section class="doc-section">
          <h2>4. 개인정보의 처리 및 보유 기간</h2>
          <p>회원가입 및 서비스 이용을 위해 수집된 개인정보는 서비스 탈퇴 시 지체 없이 파기합니다.</p>
          <p class="note">단, 법령에 따라 아래와 같이 보관합니다.</p>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>보존 근거</th>
                  <th>보존 항목</th>
                  <th>보존 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>통신비밀보호법</td>
                  <td>접속 로그</td>
                  <td>3개월</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="doc-section">
          <h2>5. 개인정보의 파기 절차 및 방법</h2>
          <ul>
            <li>파기 절차: 수집 목적이 달성된 개인정보는 별도의 DB로 옮겨 일정 기간 후 파기합니다.</li>
            <li>파기 방법: 전자적 파일은 복구 불가능하게 삭제합니다.</li>
          </ul>
        </section>

        <section class="doc-section">
          <h2>6. 개인정보 보호책임자 및 연락처</h2>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>구분</th>
                  <th>성명/부서</th>
                  <th>연락처</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>개인정보보호책임자</td>
                  <td>이정연</td>
                  <td>dev.velocibet@gmail.com</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="doc-section">
          <h2>7. 이용자의 권리 및 권익침해 구제</h2>
          <ul>
            <li>회원은 개인정보 열람, 정정, 삭제, 동의 철회 요청 가능</li>
            <li>계정 삭제: 메일 문의 또는 설정 - 보안 메뉴에서 직접 삭제 가능</li>
            <li>개인정보 분쟁조정위원회: 1833-6972 (www.kopico.go.kr)</li>
            <li>개인정보 침해신고센터: 118 (www.118.or.kr)</li>
            <li>대검찰청 사이버범죄수사과: www.spo.go.kr</li>
          </ul>
        </section>

        <section class="doc-section">
          <h2>8. 개인정보의 안전성 확보 조치</h2>
          <ul>
            <li>SSL/TLS 암호화 통신</li>
            <li>비밀번호 해싱 저장</li>
            <li>데이터 접근 권한 제한</li>
            <li>세션 기반 로그인 관리</li>
          </ul>
        </section>

        <section class="doc-section">
          <h2>9. 서비스 이용약관 및 개인정보처리방침 연결</h2>
          <ul>
            <li><a href="/terms">서비스 이용약관</a></li>
            <li><a href="/privacy">개인정보처리방침</a></li>
          </ul>
        </section>
      </div>
    </div>
  </section>
</template>
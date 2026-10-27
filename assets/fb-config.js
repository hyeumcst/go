/*
 * 파이어베이스 설정 — 여기 한 곳만 고치면 모든 화면이 따라갑니다.
 * ════════════════════════════════════════════════════════════
 *
 * USE_FIREBASE
 *   true  면 파이어베이스에서 자료를 가져옵니다 (빠름)
 *   false 면 지금까지 쓰던 앱스스크립트를 씁니다
 *
 *   ★ 문제가 생기면 아래 한 줄만 false 로 바꿔서 올리면 즉시 되돌아갑니다.
 *     (iH 조직문화 진단 때 쓰신 방식과 같습니다)
 *
 * 아래 값들은 공개되어도 괜찮은 값입니다.
 *   수퍼베이스의 anon 키와 같은 성격으로, 「어느 프로젝트인지」를
 *   가리킬 뿐 열쇠가 아닙니다. 자료를 지키는 것은 이 값이 아니라
 *   파이어베이스에 올려 둔 보안 규칙입니다.
 *
 * 메일(세금계산서 발행요청)은 파이어베이스로 옮기지 않습니다.
 *   메일을 보내려면 Cloud Functions 가 필요하고 그건 무료 요금제에
 *   없습니다(카드 등록 필요). 메일은 2초 걸려도 아무도 안 기다리므로
 *   앱스스크립트에 그대로 둡니다. 그래서 이 사이트는 무료로 끝납니다.
 *   (대표님 결정 2026-10-27)
 */
var FB = {
  /** 아직 켜지 않았습니다. 자료를 다 옮기고 맞춰 본 뒤에 켭니다. */
  USE_FIREBASE: false,

  config: {
    apiKey: 'AIzaSyDuxY2bLKtnOPikAJVNi1a1p1h7Gg_uDEQ',
    authDomain: 'hyeum-finance.firebaseapp.com',
    projectId: 'hyeum-finance',
    storageBucket: 'hyeum-finance.firebasestorage.app',
    messagingSenderId: '1016617978568',
    appId: '1:1016617978568:web:d2e59cdb1f290b9a70b3fd'
  }
};

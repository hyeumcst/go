/**
 * HYEUMCST 메인 애플리케이션 로직 (재설계 반영)
 */

document.addEventListener('DOMContentLoaded', () => {
  showScreen();
});

/*
 * 로그인 상태에 맞는 화면을 그린다.
 *
 * ⚠️ 여기서 window.location.reload() 를 쓰면 안 된다.
 *    앱스스크립트는 화면을 iframe 안에서 돌리는데, 그 안에서 새로고침하면
 *    빈 화면이 되어버린다. 그래서 주소를 다시 부르지 않고 화면만 다시 그린다.
 */
function showScreen() {
  try {
    if (API.isLoggedIn()) initApp();
    else initLogin();
  } catch (e) {
    /*
     * 화면을 그리다 멈추면 빈 화면만 남아 무엇이 잘못됐는지 알 수 없다.
     * 그래서 무엇이 잘못됐는지 보여주고, 로그인 창으로라도 되돌아가게 한다.
     */
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML =
        '<div style="max-width:40rem;margin:8vh auto;padding:1.5rem;line-height:1.7">'
        + '<h2 style="font-size:1.15rem;margin:0 0 .6rem">화면을 여는 중 문제가 생겼습니다</h2>'
        + '<pre style="white-space:pre-wrap;word-break:break-all;background:#f6f8fa;'
        + 'border:1px solid #e3e6ea;border-radius:8px;padding:1rem;font-size:.8rem">'
        + esc(String(e && (e.stack || e.message) || e)) + '</pre>'
        + '<button class="btn btn-primary" style="margin-top:1rem" '
        + 'onclick="API.logout(); showScreen();">로그아웃하고 다시 시작</button></div>';
    }
    throw e;        // 위의 오류 표시기도 볼 수 있게 다시 던진다
  }
}

// --- 조직 상수 (인원 변경 시 이 배열만 고치면 됩니다) ---
/*
 * 담당자·영업 명단은 서버의 staff 표에서 받아 온다.
 * (전에는 여기에 이름을 박아 두어서 사람이 바뀌면 코드를 고쳐야 했다)
 * 아래 값은 명단을 아직 못 받았을 때만 쓰는 예비값이다.
 */
/*
 * 사업체 — 혜움컨설팅이 본회사, 그로우인이 자회사.
 * 과정은 어느 회사가 진행하는지, 세금계산서는 어느 회사 이름으로 끊는지를 따로 고른다.
 * (utils/company.js 와 같은 목록이어야 한다)
 */
const COMPANIES = ['혜움컨설팅', '그로우인'];
const DEFAULT_COMPANY = COMPANIES[0];

let HYEUM_MANAGERS = ['김소애', '임영환', '최선화'];
let SALES_REPS = ['김동한', '김성민'];

/** 명단을 한 번 받아 위 두 배열을 채운다 */
async function loadStaffNames() {
  try {
    const r = await API.getStaff();
    if (r.managers && r.managers.length) HYEUM_MANAGERS = r.managers;
    if (r.salesReps && r.salesReps.length) SALES_REPS = r.salesReps;
  } catch (e) { /* 못 받아도 예비값으로 돈다 */ }
}

const QTY_UNITS = ['시간', '일', '월', '회', '명', '개'];

// 부가세 처리 방식
//   별도  입력 금액이 공급가액   → 부가세를 더한다
//   포함  입력 금액이 부가세 포함 → 안에서 공급가액을 뽑는다
//   면세  부가세 없음
const VAT_MODES = ['별도', '포함', '면세'];
const DISCOUNT_BASES = ['공급가액', '총액'];

/**
 * 절사·부가세를 반영한 최종 금액 (utils/amount.js 와 동일한 규칙)
 * @param vatMode      별도(입력=공급가액) | 포함(입력=총액) | 면세
 * @param discountBase 공급가액 | 총액   — 절사금액을 어디서 뺄지
 */
function computeTotals(rawAmount, discount, vatMode, discountBase) {
  const raw = Math.max(0, Math.round(Number(rawAmount) || 0));
  const mode = VAT_MODES.indexOf(vatMode) >= 0 ? vatMode : '별도';
  const base = DISCOUNT_BASES.indexOf(discountBase) >= 0 ? discountBase : '공급가액';
  const d0 = Math.max(0, Math.round(Number(discount) || 0));

  if (mode === '면세') {
    const d = Math.min(d0, raw);
    const supply = raw - d;
    return { raw: raw, discount: d, supply: supply, vat: 0, total: supply };
  }

  let supply0, total0;
  if (mode === '포함') {
    total0 = raw;
    supply0 = Math.round(total0 / 1.1);
  } else {
    supply0 = raw;
    total0 = supply0 + Math.round(supply0 * 0.1);
  }

  if (base === '총액') {
    const d = Math.min(d0, total0);
    const total = total0 - d;
    const supply = Math.round(total / 1.1);
    return { raw: raw, discount: d, supply: supply, vat: total - supply, total: total };
  }

  const d = Math.min(d0, supply0);
  const supply = supply0 - d;
  const vat = Math.round(supply * 0.1);
  return { raw: raw, discount: d, supply: supply, vat: vat, total: supply + vat };
}

// 매입 분류 — 실제 정산 방식에 맞춘 구분
//   강사        : 개인 강사. 원천징수(3.3% / 8.8%)
//   협력사(강의) : 강의료지만 업체가 세금계산서를 발행
//   협력사(교재) : 교보재·워크북 등
//   협력사(기타) : 버스·현수막·간식 등 그 밖의 협력업체
//   영업수수료   : 외부 영업자에게 지급하는 수수료
const EXP_CATEGORIES = [
  { key: '강의',              defaultUnit: '시간', defaultTax: '3.3%',            desc: '강사료 — 개인이든 업체든 세율로 구분' },
  { key: '협력사(운영비)',     defaultUnit: '개',   defaultTax: '세금계산서(과세)', desc: '교보재·버스·현수막·간식 등' },
  { key: '법인카드(교육운영)', defaultUnit: '건',   defaultTax: '카드(과세)',      desc: '교육 진행 중 법인카드 결제 — 식대·주차·소모품 등' },
  { key: '영업수수료',         defaultUnit: '회',   defaultTax: '3.3%',            desc: '외부 영업자 수수료' },
  { key: '기타',              defaultUnit: '회',   defaultTax: '세금계산서(과세)', desc: '그 밖의 지출' }
];

function expDef(key) {
  return EXP_CATEGORIES.find(c => c.key === key) || EXP_CATEGORIES[0];
}

// 매입 세율 처리
//   원천징수(3.3%/8.8%) → 총액에서 세금을 빼고 지급
//   세금계산서 과세      → 총액(공급가액)에 부가세 10%를 더해 지급
//   세금계산서 면세      → 부가세 없이 총액 그대로 지급
const TAX_TYPES = [
  { key: '3.3%',              rate: 0.033, mode: 'withhold', label: '3.3% (원천징수)' },
  { key: '8.8%',              rate: 0.088, mode: 'withhold', label: '8.8% (원천징수)' },
  { key: '세금계산서(과세)',   rate: 0.1,   mode: 'add',      label: '세금계산서 (과세 10%)' },
  { key: '세금계산서(면세)',   rate: 0,     mode: 'none',     label: '세금계산서 (면세)' },
  { key: '카드(과세)',        rate: 0.1,   mode: 'included', label: '카드 결제 (부가세 포함)' },
  // 직원 급여로 나가는 몫 — 원천징수나 계산서가 따로 없다
  { key: '급여처리',          rate: 0,     mode: 'none',     label: '급여처리 (급여로 지급)' }
];

function taxDef(key) {
  // 예전 데이터의 "세금계산서" 는 면세로 본다
  if (key === '세금계산서') key = '세금계산서(면세)';
  return TAX_TYPES.find(t => t.key === key) || TAX_TYPES[0];
}

/** 총액과 세율로 세금·지급액을 구한다 */
function calcTax(total, taxType) {
  const t = parseInt(total) || 0;
  const def = taxDef(taxType);
  if (def.mode === 'withhold') {
    const tax = Math.floor(t * def.rate);
    return { tax, payment: t - tax };
  }
  if (def.mode === 'add') {
    const tax = Math.round(t * def.rate);
    return { tax, payment: t + tax };
  }
  if (def.mode === 'included') {
    // 카드 결제액에는 부가세가 이미 들어 있다 — 총액은 그대로, 부가세만 갈라 본다
    return { tax: Math.round(t / 11), payment: t };
  }
  return { tax: 0, payment: t };
}

// 교육일정 유형 설명
const SCHED_DEFS = {
  당일: {
    tab: '당일',
    desc: '하루 안에 끝나는 교육입니다. 날짜 <b>하나</b>만 고르면 됩니다.<br>예) 8월 22일 하루 진행되는 특강.'
  },
  기간: {
    tab: '기간',
    desc: '<b>여러 날이 연속으로</b> 이어지는 교육입니다. 시작일과 종료일을 고르면 그 사이 날짜가 모두 포함됩니다.<br>예) <code>8/10 ~ 8/12</code> 3일 연속 합숙 교육.'
  },
  차수: {
    tab: '차수',
    desc: '같은 과정을 <b>2차수 이상</b> 나누어 진행할 때 씁니다. <b>차수마다 여러 날에 걸쳐도 됩니다.</b><br>예) 1차수 <code>8/10~8/12</code>, 2차수 <code>9/7~9/9</code> — [차수 추가]로 늘리세요.'
  }
};

// 매출 카테고리 정의 — 화면 구성과 계산식의 기준
// 매출 분류
//   인건비·운영비 : 항목 하나로 자유롭게 추가 (과목·품목별로 관리)
//   연수원비      : 강의장 / 숙소 / 식대 로 계산식이 각각 다름
const SALE_DEFS = {
  인건비: {
    tab: '매출1 · 인건비',
    shape: 'basic',
    subs: [{ key: '항목', label: '항목 추가' }],
    desc: '<b>강의</b>에 대해 청구하는 금액입니다. 과목별로 한 줄씩 적으세요.<br>' +
      '계산 <code>단가 × 수량 × 차수</code> — 수량 단위는 시간·일·월·회·명·개 중에서 고르세요.<br>' +
      '예) 리더십 과정 시간당 30만원 × 8시간 × 2차수 = 480만원'
  },
  운영비: {
    tab: '매출2 · 운영비',
    shape: 'basic',
    subs: [{ key: '항목', label: '항목 추가' }],
    desc: '교육 <b>운영</b>에 드는 금액입니다. 항목명에 <b>교재·버스·현수막·간식</b> 등을 적으세요.<br>' +
      '계산 <code>단가 × 수량 × 차수</code> — 인건비와 같은 방식입니다.<br>' +
      '예) 교재 1인당 1.5만원 × 20명 × 2차수 = 60만원'
  },
  연수원비: {
    tab: '매출3 · 연수원비',
    shape: 'basic',
    subs: [{ key: '항목', label: '항목 추가' }],
    desc: '<b>연수원</b>에 드는 금액입니다. 항목명에 <b>강의장·숙소·식대</b> 등을 적으세요.<br>' +
      '계산 <code>단가 × 수량 × 차수</code> — 인건비·운영비와 같은 방식입니다.<br>' +
      '예) 숙소 1실 15만원 × 10실 × 2박 은 수량에 20을 넣으면 됩니다.'
  }
};

/** 연수원비 하위 항목 정의 */
/*
 * 예전에는 연수원비를 강의장·숙소·식대로 나눠 계산식을 달리했다.
 * 지금은 셋 다 「단가 × 수량 × 차수」로 같아서 나누지 않는다.
 * (옛 자료가 들고 있는 세부값 때문에 모양이 틀어지지 않도록 늘 null 을 준다)
 */
function venueSub() { return null; }

/*
 * 줄 왼쪽에서 고르는 분류 목록.
 * 연수원비는 강의장·숙소·식대마다 계산식이 달라 세부까지 한 번에 고르게 한다.
 * value 는 "분류|세부" 꼴.
 */
const SALE_PICKS = Object.keys(SALE_DEFS).map(function (cat) {
  return { v: cat, label: SALE_DEFS[cat].tab, cat: cat };
});

// --- 전역 상태 ---
const State = {
  currentRoute: 'dashboard',
  projects: [],
  instructors: [],
  pagination: { page: 1, limit: 50, totalPages: 1 },
  expenseItems: [], // 현재 작성 중인 매입 항목 배열
  saleItems: [],    // 현재 작성 중인 매출 항목 배열
  invoices: [],     // 세금계산서 (과정당 1~N장)
  discount: 0,      // 매출 절사금액
  vatMode: '별도',   // 부가세 처리
  discountBase: '공급가액',  // 절사 기준
  contacts: [],     // 현재 고객사의 담당자 목록
  partners: [],     // 협력사 목록
  clientList: [],   // 고객사 관리 화면 목록
  schedMode: {},    // 일정 입력 방식 (calendar | manual)
  // 교육일정은 유형별로 따로 보관한다.
  // 탭을 옮겨도 서로 섞이지 않고, 저장은 "현재 선택된 유형"의 것만 한다.
  schedules: { 당일: [], 기간: [], 차수: [] },
  autocompleteTimer: null
};

// --- Toast 알림 ---
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --- 유틸 ---
function formatNumber(num) {
  return new Intl.NumberFormat('ko-KR').format(num || 0);
}

function parseNumber(str) {
  if (!str) return 0;
  return parseInt(String(str).replace(/,/g, '')) || 0;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/*
 * 어느 사이트로 들어왔는지 — 관리자용인지 직원용인지.
 * 주소 끝에 ?site=staff 가 붙어 있으면 직원 사이트다.
 *
 * ⚠️ 이것은 로그인 화면의 「표시」와 메뉴 구성에만 쓴다.
 *    실제 권한은 로그인한 계정의 role 로 서버가 판단하므로,
 *    주소를 바꿔 들어와도 할 수 있는 일은 달라지지 않는다.
 */
function siteKind() {
  try {
    if (typeof SITE === 'string' && SITE) return SITE === 'staff' ? 'staff' : 'admin';
  } catch (e) {}
  return 'admin';
}

function siteLabel() {
  return siteKind() === 'staff' ? '직원 사이트' : '관리자 사이트';
}

/*
 * 관리자 전용 표시를 그릴지.
 * 관리자 계정이면서 관리자 주소로 들어왔을 때만 참이다.
 * 직원 주소에서는 관리자가 들어와도 거짓 — 직원이 보는 그대로여야 하므로.
 */
/*
 * 지금 로그인한 사람의 이름.
 * 계정에 적힌 이름이 사람 이름이 아닌 경우가 있어(huc → 혜움컨설팅)
 * 아이디로 한 번 바로잡는다. 서버의 personName() 과 같은 표다.
 */
const PERSON_NAME = { huc: '임영환', sakim: '김소애', shchoi: '최선화' };

function myKey() {
  const u = API.getUser() || {};
  return String(u.username || '').split('@')[0].trim().toLowerCase();
}

function myName() {
  const u = API.getUser() || {};
  const key = myKey();
  return PERSON_NAME[key] || u.name || key;
}

function isAdminView() {
  return siteKind() === 'admin' && API.isAdmin();
}

/**
 * 회사 메일 주소의 뒷부분.
 *
 * 아이디가 모두 이 주소라서, 로그인할 때 앞부분만 적으면 되도록
 * 뒤는 회색으로 고정해 보여줍니다. (붙여넣기로 전체를 넣어도 받습니다)
 */
const MAIL_DOMAIN = '@hyeumcst.co.kr';

/** 적어 넣은 것을 온전한 아이디로 만든다 */
function fullUsername(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  return s.indexOf('@') >= 0 ? s : s + MAIL_DOMAIN;
}

/*
 * 비밀번호 칸 — ●●●● 로 가려 보이지만 눈 버튼을 누르면 실제 글자가 보인다.
 * 잘못 친 것을 확인할 수 있어야 하기 때문이다.
 */
function pwField(id, opts) {
  opts = opts || {};
  return '<div class="pw-field">'
    + '<input type="password" id="' + id + '" class="form-input"'
    + (opts.autocomplete ? ' autocomplete="' + opts.autocomplete + '"' : '')
    + (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : '')
    + '>'
    + '<button type="button" class="pw-eye" title="비밀번호 보기"'
    + ' onclick="togglePw(this)" tabindex="-1">👁</button>'
    + '</div>';
}

/** 눈 버튼 — 가렸다 보였다 */
function togglePw(btn) {
  const input = btn.parentNode.querySelector('input');
  if (!input) return;
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.textContent = show ? '🙈' : '👁';
  btn.title = show ? '비밀번호 숨기기' : '비밀번호 보기';
  btn.classList.toggle('on', show);
}

/*
 * 「직원 사이트로 가기」 길 안내.
 * 관리자 주소에서 직원 계정으로 로그인하려 할 때만 나온다.
 */
function showStaffWay() {
  if (document.getElementById('to-staff')) return;
  const form = document.getElementById('login-form');
  if (!form) return;
  const box = document.createElement('div');
  box.id = 'to-staff';
  box.className = 'to-staff';
  box.innerHTML = '여기는 <b>관리자 사이트</b>입니다.'
    + '<a class="btn btn-primary btn-sm" href="../staff/">직원 사이트로 가기 →</a>';
  form.parentNode.insertBefore(box, form.nextSibling);
}

// --- 로그인 ---
function initLogin() {
  const root = document.getElementById('app');
  const staff = siteKind() === 'staff';
  root.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <div class="logo">
          <h1>HYEUMCST</h1>
          <p>매출/매입 관리 시스템</p>
          <div class="login-badge${staff ? ' staff' : ''}">${siteLabel()}</div>
        </div>
        <form id="login-form">
          <div class="form-group">
            <label class="form-label">아이디</label>
            <div class="id-field">
              <input type="text" id="username" class="form-input" required
                     autocomplete="username" autocapitalize="off" spellcheck="false"
                     placeholder="huc">
              <span class="id-domain">${MAIL_DOMAIN}</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">비밀번호</label>
            ${pwField('password', { autocomplete: 'current-password' })}
          </div>
          <button type="submit" class="btn btn-primary btn-block btn-lg" style="margin-top: 1.5rem;">로그인</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.innerHTML = '로그인 중...';

    try {
      const res = await API.login(
        fullUsername(document.getElementById('username').value),
        document.getElementById('password').value);
      API.setToken(res.token);
      API.setUser(res.user);
      showScreen();                     // 새로고침 대신 화면만 다시 그린다
    } catch (err) {
      showToast(err.message, 'error');
      /*
       * 직원 계정으로 관리자 주소에 들어온 경우 —
       * 말만 해 주면 직원 주소를 몰라 헤매신다. 갈 수 있는 길을 함께 둔다.
       */
      if (/직원 사이트/.test(err.message || '')) showStaffWay();
      btn.disabled = false;
      btn.innerHTML = '로그인';
    }
  });
}

/*
 * 직원에게 보여줄 메뉴.
 *
 * 대표님 지시 (2026-10-10):
 *   과정 등록 · 대시보드 · 매출·매입 분석 · 과정(매출/매입) 목록
 *   그리고 설정은 「자기 비밀번호 변경」만
 *
 * ⚠️ 메뉴를 감추는 것은 「보기 편하게」일 뿐이고, 실제 차단은 서버가 한다.
 *    (Auth.gs 의 requireAdmin — 직원은 과정 삭제·명단 등록·입금 체크·
 *     정산자료·계정 관리를 아예 할 수 없다)
 */
const STAFF_ROUTES = ['project-form', 'dashboard', 'analytics', 'visits', 'projects', 'tax', 'password'];

/**
 * 이 사람에게 이 메뉴를 보여줄지.
 *
 * 직원 주소(/staff)로 들어오면 관리자가 들어와도 직원 메뉴만 보인다.
 * 「직원 사이트는 직원이 보는 그대로」여야 확인하기 쉽기 때문이다.
 * 관리자 주소(/admin)에서는 관리자에게 전부 보인다.
 */
function canSeeRoute(user, route) {
  if (siteKind() === 'staff') return STAFF_ROUTES.indexOf(route) >= 0;
  if (user && user.role === 'admin') return true;
  return STAFF_ROUTES.indexOf(route) >= 0;
}

/*
 * 로고 그림.
 *
 * 빌드할 때 아래 두 글자가 그림 자체(data URI, 9KB)로 바뀝니다.
 * 그래서 HTML 안에 직접 쓰지 않고 「화면을 그린 뒤에」 붙입니다.
 * 9KB 짜리 글자를 HTML 속성에 넣으면 브라우저가 그 뒤를 잘라먹는 일이 있었습니다.
 */
const LOGO_LIGHT = '../assets/logo-light.png';
const LOGO_DARK = '../assets/logo-dark.png';

/** 화면을 그린 뒤 로고를 붙인다 */
function attachLogos() {
  const a = document.querySelector('.sidebar-logo.light');
  const b = document.querySelector('.sidebar-logo.dark');
  if (a) a.src = LOGO_LIGHT;
  if (b) b.src = LOGO_DARK;
}

/**
 * id 로 요소를 찾아 이벤트를 단다. 없으면 조용히 넘어간다.
 *
 * 없는 요소에 바로 addEventListener 를 걸면 화면 전체가 멈춰서
 * 빈 화면만 남는다. 버튼 하나 때문에 전부 못 쓰게 되는 것은 과하다.
 */
function onId(id, type, fn) {
  const el = document.getElementById(id);
  if (!el) {
    MISSING_IDS.push(id);
    return false;
  }
  el.addEventListener(type, fn);
  return true;
}

/** 못 찾은 요소들 — 문제가 생겼을 때 무엇이 빠졌는지 알려준다 */
let MISSING_IDS = [];

/** 회사 경비 화면으로 가는 버튼 — 볼 수 없는 사람에게는 내놓지 않는다 */
function ohLink(label) {
  if (!canSeeRoute(API.getUser(), 'overheads')) return '';
  return ' <button class="an-link" onclick="navigate(\'overheads\')">' + label + '</button>';
}

/**
 * 과정을 저장하거나 취소한 뒤 돌아갈 곳.
 * 관리자는 과정 목록으로, 직원은 (목록을 못 보므로) 대시보드로 보낸다.
 */
function afterProjectRoute() {
  return canSeeRoute(API.getUser(), 'projects') ? 'projects' : 'dashboard';
}

/* ═══════════════════════════════════════════════════════════
   미리 받아 두기

   구글에 한 번 다녀오는 데 1.8초쯤 걸린다. 자료를 하나도 안 읽는
   요청을 재 봐도 그렇다 — 앱스스크립트 자체가 느린 것이라 서버를
   아무리 손봐도 줄지 않는다. (2026-10-27 에 다섯 번 재어 확인)

   그래서 「누른 뒤에 받는」 것을 그만둔다.
     · 메뉴에 마우스를 올리면 그때 미리 받아 둔다
       (올리고 누르기까지 보통 0.3~0.8초가 걸리므로 그만큼 번다)
     · 첫 화면을 그린 뒤 한가할 때도 몇 개 받아 둔다

   받아 둔 것은 API 가 기억해 두므로(1분), 누르면 서버에 다시
   묻지 않고 바로 뜬다. 자료가 달라지는 일은 없다 — 평소에 받던
   것과 똑같은 것을 조금 일찍 받아 둘 뿐이다.
   ═══════════════════════════════════════════════════════════ */

const PREFETCH = { busy: {}, timer: null };

/** 그 화면이 쓰는 자료를 미리 받아 둔다 */
function prefetchRoute(route) {
  if (!route || PREFETCH.busy[route]) return;
  if (!canSeeRoute(API.getUser(), route)) return;

  const go = {
    dashboard: function () {
      return API.getDashboard({
        year: DASH.year, month: DASH.month, manager: DASH.manager,
        company: DASH.company, basis: DASH.basis
      });
    },
    analytics: function () { return API.getAnalytics(AN); },
    visits: function () { return API.get('/visits' + API.qs({ q: VISIT.q, done: VISIT.done })); },
    projects: function () {
      return API.getProjects({
        q: LIST.q, month: LIST.month, manager: LIST.manager,
        type: LIST.type, sort: LIST.sort, company: LIST.company,
        missing_expense: LIST.missing_expense
      });
    },
    tax: function () { return API.getInvoices(TAX); }
  }[route];
  if (!go) return;

  PREFETCH.busy[route] = true;
  // 기억이 1분이라, 조금 일찍 풀어 두어 다음 기회에 또 받아 둘 수 있게 한다
  setTimeout(function () { delete PREFETCH.busy[route]; }, 50000);

  try {
    const p = go();
    if (p && p.catch) p.catch(function () { delete PREFETCH.busy[route]; });
  } catch (e) { delete PREFETCH.busy[route]; }
}

/** 마우스를 잠깐 올려 두면 받아 둔다 (스쳐 지나갈 때는 받지 않는다) */
function prefetchOnHover(route) {
  clearTimeout(PREFETCH.timer);
  PREFETCH.timer = setTimeout(function () { prefetchRoute(route); }, 120);
}
function prefetchCancel() { clearTimeout(PREFETCH.timer); }

/** 첫 화면을 그린 뒤 한가할 때 — 하나씩 띄엄띄엄 받아 둔다 */
function prefetchIdle() {
  const order = ['projects', 'tax', 'visits', 'analytics'];
  order.forEach(function (r, i) {
    setTimeout(function () { prefetchRoute(r); }, 2500 + i * 1500);
  });
}

/* ═══════════════════════════════════════════════════════════
   되돌리기 — 실수로 지웠을 때

   매출·매입·계산서 줄은 ✖ 한 번에 사라진다. 물어보지 않는 것이
   빠르고 좋지만, 잘못 누르면 적어 둔 것이 날아간다.
   그래서 지운 뒤 잠깐 「되돌리기」를 띄운다.

   저장 전이라면 되돌리면 그대로 돌아온다 (지웠던 자리에 그대로).
   (대표님 지시 2026-10-27)
   ═══════════════════════════════════════════════════════════ */

const UNDO = { restore: null, timer: null };

/** 지운 것을 되돌릴 기회를 잠깐 준다 */
function offerUndo(what, restore) {
  UNDO.restore = restore;
  clearTimeout(UNDO.timer);

  let bar = document.getElementById('undo-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'undo-bar';
    bar.className = 'undo-bar';
    document.body.appendChild(bar);
  }
  bar.innerHTML = '<span class="t">' + esc(what) + ' 지웠습니다.</span>'
    + '<button type="button" class="go" onclick="doUndo()">↩ 되돌리기</button>'
    + '<button type="button" class="x" title="닫기" onclick="hideUndo()">✕</button>';
  bar.classList.add('on');

  // 너무 오래 두면 무엇을 되돌리는지 잊는다
  UNDO.timer = setTimeout(hideUndo, 12000);
}

function doUndo() {
  const f = UNDO.restore;
  hideUndo();
  if (f) { try { f(); showToast('되돌렸습니다.', 'success'); } catch (e) {} }
}

function hideUndo() {
  clearTimeout(UNDO.timer);
  UNDO.restore = null;
  const bar = document.getElementById('undo-bar');
  if (bar) bar.classList.remove('on');
}

/* ───────── 적어 둔 글을 지웠을 때도 되돌리기 ─────────
 *
 * 줄을 통째로 지우는 것(✖)뿐 아니라, 항목명·비고 같은 칸에 적어 둔
 * 글자를 지웠을 때도 되돌릴 수 있어야 한다. (대표님 지시 2026-10-27)
 *
 * 칸을 누른 순간의 값을 기억해 두었다가, 그 칸이 비면 되돌리기를 띄운다.
 * 한 글자씩 지워서 비운 경우에도 처음 값이 통째로 돌아온다.
 *
 * 다시 적기 시작하면 되돌리기를 거둔다 — 새로 적으신 것을 덮으면 안 된다.
 * ───────────────────────────────────────────────── */

const TEXT_UNDO = { el: null, at: new WeakMap() };

/** 글을 적는 칸인가 (날짜칸·검색칸은 지워도 잃을 것이 없다) */
function isTextBox(el) {
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'textarea') return true;
  if (tag !== 'input') return false;
  if ((el.type || 'text').toLowerCase() !== 'text') return false;
  if (el.readOnly) return false;                       // 날짜칸
  if (/-q$/.test(el.id || '')) return false;           // 검색칸
  return true;
}

/** 글이 길면 줄여서 보여준다 */
function shortText(v) {
  const t = String(v || '').trim().replace(/\s+/g, ' ');
  return t.length > 24 ? t.slice(0, 24) + '…' : t;
}

/** 글자를 지웠는지 지켜본다 — 화면 전체에 한 번만 단다 */
function watchTextClear() {
  const root = document.getElementById('app');
  if (!root || root.__textWatch) return;
  root.__textWatch = true;

  // 칸을 누른 순간의 값을 기억해 둔다
  root.addEventListener('focusin', function (e) {
    if (isTextBox(e.target)) TEXT_UNDO.at.set(e.target, e.target.value);
  });

  root.addEventListener('input', function (e) {
    const el = e.target;
    if (!isTextBox(el)) return;

    if (el.value === '') {
      const old = TEXT_UNDO.at.get(el);
      if (old && String(old).trim()) {
        TEXT_UNDO.el = el;
        offerUndo('적어 두신 글 「' + shortText(old) + '」', function () {
          if (!el.isConnected) return;               // 화면이 다시 그려졌으면 손대지 않는다
          el.value = old;
          // 원래 칸이 하던 일을 그대로 다시 시킨다 (State 까지 돌아가게)
          el.dispatchEvent(new Event('input', { bubbles: true }));
          try { el.focus(); } catch (err) {}
        });
      }
      return;
    }

    // 다시 적기 시작하면 거둔다 — 새로 적으신 것을 덮으면 안 되므로
    if (TEXT_UNDO.el === el) {
      TEXT_UNDO.el = null;
      hideUndo();
    }
  });
}

// --- 앱 초기화 ---
function initApp() {
  const user = API.getUser();
  const root = document.getElementById('app');
  const admin = user && user.role === 'admin';

  /*
   * 「관리자 / 직원」 딱지는 관리자 사이트에서만 보여준다.
   * 직원 사이트(/staff)에서는 보여줄 까닭이 없다. 대표님 지시 (2026-10-26)
   */
  const badge = siteKind() === 'admin';

  // 담당자·영업 명단을 미리 받아 둔다 (선택칸을 채우기 위해)
  loadStaffNames();

  /** 메뉴 한 줄 — 권한이 없으면 아무것도 내놓지 않는다 */
  const item = (route, label, active) =>
    canSeeRoute(user, route)
      ? `<button class="nav-item${active ? ' active' : ''}" data-route="${route}">`
        + `<span class="nav-txt">${label}</span></button>`
      : '';

  /** 묶음 — 안에 보여줄 것이 하나도 없으면 제목까지 숨긴다 */
  const section = (title, rows) => {
    const body = rows.join('');
    return body ? `<div class="nav-section"><div class="nav-section-title">${title}</div>${body}</div>` : '';
  };

  root.innerHTML = `
    <div class="app-layout">
      <button class="sidebar-toggle" id="sidebar-toggle">☰</button>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header" id="brand-home" title="대시보드로 이동">
          <img alt="혜움컨설팅" class="sidebar-logo light">
          <img alt="혜움컨설팅" class="sidebar-logo dark">
          <p class="brand-sub">Finance Management</p>
          ${badge ? `<span class="side-badge${admin ? '' : ' staff'}">${admin ? '관리자' : '직원'}</span>` : ''}
        </div>
        <div class="sidebar-divider"></div>
        <nav class="sidebar-nav">
          <button class="nav-cta" data-route="project-form">
            과정 등록
          </button>

          ${section('메인', [
            item('dashboard', '대시보드', true),
            item('analytics', '매출·매입 분석'),
            item('visits', '교육진행')
          ])}
          ${section('상세매출관리', [
            item('projects', '과정(매출/매입) 목록'),
            item('tax', '세금계산서')
          ])}
          ${section('기타 세부관리', [
            item('ent-client', '고객사'),
            item('ent-instructor', '강사별 매입'),
            item('ent-partner', '협력사별 매입'),
            item('overheads', '회사 경비'),
            item('ent-card', '법인카드'),
            item('staff', '직원 · 외부영업자')
          ])}
          ${section('설정', [
            item('bulk', '엑셀로 한꺼번에 수정'),
            item('password', '내 비밀번호 변경'),
            item('users', '직원 계정 관리')
          ])}
        </nav>
        <div class="sidebar-footer">
          <div class="theme-toggle" id="theme-toggle">
            <button data-theme-set="light">밝게</button>
            <button data-theme-set="dark">어둡게</button>
          </div>
          <div class="user-info">
            <div class="user-avatar">${user.name.charAt(0)}</div>
            <div class="user-meta">
              <div class="user-name">${user.name}</div>
              ${badge ? `<div class="user-role">${admin ? '관리자' : '일반 직원'}</div>` : ''}
            </div>
          </div>
          <button class="btn-logout" id="btn-logout"><span class="icon">🚪</span> 로그아웃</button>
        </div>
      </aside>
      <main class="main-content" id="main-content">
        <!-- 컨텐츠 렌더링 영역 -->
      </main>
    </div>
  `;

  // 과정 등록 큰 버튼도 같은 방식으로 움직인다
  document.querySelectorAll('.nav-item, .nav-cta').forEach(el => {
    /* 마우스를 올려 두면 미리 받아 둔다 — 누를 때 기다리지 않게 */
    el.addEventListener('mouseenter', () => prefetchOnHover(el.dataset.route));
    el.addEventListener('mouseleave', prefetchCancel);

    el.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
      if (e.currentTarget.classList.contains('nav-item')) e.currentTarget.classList.add('active');
      const route = e.currentTarget.dataset.route;
      document.getElementById('sidebar').classList.remove('open');
      navigate(route);
    });
  });

  MISSING_IDS = [];
  attachLogos();                 // 그림은 화면을 그린 뒤에 붙인다
  setupThemeToggle();

  // 로고를 누르면 대시보드로 (직원도 대시보드는 볼 수 있다)
  onId('brand-home', 'click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const d = document.querySelector('.nav-item[data-route="dashboard"]');
    if (d) d.classList.add('active');
    navigate('dashboard');
  });

  onId('sidebar-toggle', 'click', () => {
    const s = document.getElementById('sidebar');
    if (s) s.classList.toggle('open');
  });

  watchBrandSub();

  // 적어 둔 글을 지웠을 때 되돌릴 수 있게 지켜본다
  watchTextClear();

  // 첫 화면을 그린 뒤 한가할 때 다른 메뉴 자료를 미리 받아 둔다
  prefetchIdle();

  onId('btn-logout', 'click', () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      API.logout();
      showScreen();
    }
  });

  // 빠진 것이 있으면 조용히 넘기지 말고 알려준다 (화면은 계속 쓸 수 있다)
  if (MISSING_IDS.length) {
    console.warn('화면에서 찾지 못한 요소: ' + MISSING_IDS.join(', '));
    showToast('화면 일부를 불러오지 못했습니다 (' + MISSING_IDS.join(', ') + ')', 'warning');
  }

  // 초기 라우트
  navigate('dashboard');
}

// --- 테마 (밝게 / 어둡게 / 시스템) ---
function getThemePref() {
  try { return localStorage.getItem("theme") || "light"; } catch (e) { return "light"; }
}

function applyTheme(pref) {
  const root = document.documentElement;
  if (pref === "light" || pref === "dark") {
    root.setAttribute("data-theme", pref);
  } else {
    // 시스템: 속성을 지워 prefers-color-scheme 이 결정하게 한다
    root.removeAttribute("data-theme");
  }
  try {
    if (pref === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", pref);
  } catch (e) {}

  document.querySelectorAll("#theme-toggle button").forEach(b => {
    b.classList.toggle("active", b.dataset.themeSet === pref);
  });

  // 밝게/어둡게를 바꾸면 보이는 로고가 달라져 아래 영어 폭을 다시 맞춘다
  if (typeof fitBrandSub === "function") setTimeout(fitBrandSub, 50);
}

function setupThemeToggle() {
  const box = document.getElementById("theme-toggle");
  if (!box) return;
  box.querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => applyTheme(b.dataset.themeSet));
  });
  applyTheme(getThemePref());
}

// --- 라우팅 ---
/*
 * 로고 아래 영어(Finance Management)를 로고 폭에 딱 맞춘다.
 *
 * 글자를 옆으로 늘이면 모양이 찌그러진다.
 * 그래서 폭이 맞을 때까지 글자 크기 자체를 키우고 줄인다 (자간은 em 이라 함께 따라온다).
 * 글꼴이 늦게 내려올 수 있어 글꼴이 준비된 뒤와 창 크기가 바뀔 때 다시 맞춘다.
 */
function fitBrandSub() {
  const sub = document.querySelector('.brand-sub');
  if (!sub) return;

  // 지금 보이는 로고의 폭 (숨은 쪽은 0 이라 큰 값이 보이는 쪽이다)
  let target = 0;
  document.querySelectorAll('.sidebar-logo').forEach(function (img) {
    const w = img.getBoundingClientRect().width;
    if (w > target) target = w;
  });
  if (target < 20) return;        // 아직 안 떴거나 메뉴가 접혀 있다

  const text = (sub.textContent || '').trim();
  if (!text) return;

  const cs = window.getComputedStyle(sub);
  const clamp = function (v) { return Math.max(8, Math.min(30, v)); };

  /*
   * 글자는 네모 칸보다 실제로 칠해지는 부분(잉크)이 조금 좁다.
   * 끝 글자 t 의 오른쪽, 첫 글자 F 의 왼쪽에 자투리 여백이 붙기 때문이다.
   * 그래서 칸이 아니라 「잉크」를 재서 로고 좌우에 딱 붙인다.
   */
  if (!fitBrandSub._ctx) {
    try { fitBrandSub._ctx = document.createElement('canvas').getContext('2d'); }
    catch (e) { fitBrandSub._ctx = null; }
  }
  const ctx = fitBrandSub._ctx;

  const ink = function (px) {
    if (!ctx) return null;
    ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + px + 'px ' + cs.fontFamily;
    const m = ctx.measureText(text);
    if (m.actualBoundingBoxRight === undefined || m.actualBoundingBoxLeft === undefined) return null;
    return {
      left: m.actualBoundingBoxLeft,                           // 기준점 왼쪽으로 나간 거리
      width: m.actualBoundingBoxLeft + m.actualBoundingBoxRight
    };
  };

  let size = 16;
  let m = ink(size);

  if (m) {
    // 잉크 폭이 로고 폭과 같아질 때까지 크기를 다듬는다
    for (let i = 0; i < 8; i++) {
      if (!m || !m.width) break;
      if (Math.abs(target - m.width) < 0.2) break;
      size = clamp(size * (target / m.width));
      m = ink(size);
    }
    sub.style.fontSize = size.toFixed(3) + 'px';
    sub.style.display = 'block';
    sub.style.whiteSpace = 'nowrap';
    // 잉크 왼쪽 끝을 로고 왼쪽에 붙인다 (보통 살짝 음수)
    sub.style.marginLeft = (m && m.left ? m.left.toFixed(2) : '0') + 'px';
    return;
  }

  /* 캔버스로 못 재는 브라우저 — 칸 폭으로 맞춘다 */
  sub.style.display = 'inline-block';
  sub.style.whiteSpace = 'nowrap';
  sub.style.marginLeft = '0';
  sub.style.fontSize = size + 'px';
  for (let i = 0; i < 8; i++) {
    const w = sub.getBoundingClientRect().width;
    if (!w) return;
    if (Math.abs(target - w) < 0.25) break;
    size = clamp(size * (target / w));
    sub.style.fontSize = size.toFixed(3) + 'px';
  }
}

/** 로고가 다 뜬 뒤·글꼴이 온 뒤·창이 바뀔 때 다시 맞춘다 */
function watchBrandSub() {
  fitBrandSub();
  document.querySelectorAll('.sidebar-logo').forEach(function (img) {
    if (img.complete) return;
    img.addEventListener('load', fitBrandSub, { once: true });
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitBrandSub);
  window.addEventListener('resize', fitBrandSub);
  // 밝게/어둡게를 바꾸면 보이는 로고가 달라진다
  setTimeout(fitBrandSub, 120);
}

function navigate(route, params = null) {
  const content = document.getElementById('main-content');

  /*
   * 메뉴에서 감춘 화면은 주소를 직접 불러도 열지 않는다.
   * (화면 안의 다른 버튼이 가리키고 있을 수 있어서 여기서 한 번 더 막는다)
   */
  if (!canSeeRoute(API.getUser(), route)) {
    content.innerHTML = '<div class="page-header"><div><h2>볼 수 없는 화면입니다</h2>'
      + '<p class="subtitle">이 화면은 관리자만 볼 수 있습니다.</p></div></div>';
    return;
  }

  State.currentRoute = route;
  content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  switch (route) {
    case 'bulk': renderBulk(); break;
    case 'password': renderPassword(); break;
    case 'dashboard': renderDashboard(); break;
    case 'analytics': renderAnalytics(); break;
    case 'visits': renderVisits(); break;
    case 'tax': renderTax(); break;
    case 'overheads': renderOverheads(); break;
    case 'ent-client': renderEntity('client'); break;
    case 'ent-instructor': renderEntity('instructor'); break;
    case 'ent-partner': renderEntity('partner'); break;
    case 'ent-card': renderEntity('card'); break;
    case 'staff': renderStaff(); break;
    case 'projects': renderProjectList(); break;
    case 'project-form': renderProjectForm(params); break;
    case 'clients': renderClients(); break;
    case 'instructors': renderInstructors(); break;
    case 'partners': renderPartners(); break;
    case 'users': renderUsers(); break;
    default: renderDashboard();
  }
}

// --- 대시보드 ---
// ═══════════ 대시보드 ═══════════
const DASH = { year: String(new Date().getFullYear()), month: '', manager: '', company: '', basis: 'start' };

/** 대시보드 월별 추이를 회사별로 나눠 볼지 */
let DASH_SPLIT = true;

// 여러 달에 걸친 과정을 어느 달에 넣을지
const BASIS_OPTS = [
  ['start',   '교육 시작월',   '첫 교육일이 속한 달에만 넣습니다. 중복이 없습니다.'],
  ['invoice', '계산서 발행월', '세금계산서 발행일 기준입니다. 회계 인식 시점과 같습니다.'],
  ['overlap', '교육 진행월',   '그 달에 교육이 하루라도 있으면 포함합니다. 여러 달에 중복 계상됩니다.']
];

/** 선으로 그린 아이콘 (이모지 대신) */
const ICON = {
  projects: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h9A1.5 1.5 0 0 1 16 5.5v13a1.5 1.5 0 0 1-2.3 1.27L10 17.4l-3.7 2.37A1.5 1.5 0 0 1 4 18.5z"/><path d="M8 8h4"/>',
  sales: '<path d="M12 3v18"/><path d="M17 7.5c0-1.93-2.24-3.5-5-3.5s-5 1.57-5 3.5S9.24 11 12 11s5 1.57 5 3.5-2.24 3.5-5 3.5-5-1.57-5-3.5"/>',
  expense: '<path d="M3 7h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 7l2.4-3.2A1 1 0 0 1 6.2 3.4h11.6a1 1 0 0 1 .8.4L21 7"/><path d="M9 12h6"/>',
  profit: '<path d="M3 17.5 9.5 11l4 4L21 7.5"/><path d="M15 7.5h6v6"/>',
  receivable: '<path d="M4 4h16v13a1 1 0 0 1-1.55.83L16 16l-2.45 1.63a1 1 0 0 1-1.1 0L10 16l-2.45 1.63A1 1 0 0 1 6 17V4z"/><path d="M9 8h6M9 11.5h4"/>',
  avg: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/>',
  client: '<path d="M3 20V9l6-4 6 4v11"/><path d="M15 20V12h6v8"/><path d="M3 20h18"/><path d="M7 12h2M7 15.5h2"/>',
  person: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  chart: '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7" y="12" width="3" height="5" rx=".6"/><rect x="12" y="8" width="3" height="9" rx=".6"/><rect x="17" y="14" width="3" height="3" rx=".6"/>',
  alert: '<path d="M12 4.5 21 19H3z"/><path d="M12 10v4"/><circle cx="12" cy="16.6" r=".6" fill="currentColor" stroke="none"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M6.5 14.5h3"/>',
  overhead: '<path d="M5 21V8.5L12 4l7 4.5V21"/><path d="M9.5 21v-5h5v5"/><path d="M3 21h18"/>',
  visit: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/>'
    + '<path d="M8 3v4"/><path d="M16 3v4"/><path d="M8.5 14.5l2 2 4.5-4.5"/>'
};

function icon(name, size) {
  return '<svg class="ic" viewBox="0 0 24 24" width="' + (size || 26) + '" height="' + (size || 26) + '"'
    + ' fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'
    + (ICON[name] || '') + '</svg>';
}

async function renderDashboard() {
  try {
    const data = await API.getDashboard({
      year: DASH.year, month: DASH.month, manager: DASH.manager,
      company: DASH.company, basis: DASH.basis
    });
    const content = document.getElementById('main-content');
    const S = data.summary;
    const f = data.filters || { years: [], managers: [] };

    const opt = function (v, label, cur) {
      return '<option value="' + esc(v) + '"' + (String(cur) === String(v) ? ' selected' : '') + '>' + esc(label) + '</option>';
    };

    // route 를 주면 눌러서 그 화면으로 갈 수 있는 카드가 된다
    const card = function (cls, name, label, value, sub, route) {
      return '<div class="stat-card ' + cls + (route ? ' click' : '') + '"'
        + (route ? ' onclick="navigate(\'' + route + '\')" title="눌러서 자세히 보기"' : '') + '>'
        + '<div class="stat-ic">' + icon(name) + '</div>'
        + '<div class="stat-body">'
        +   '<div class="stat-label">' + label + '</div>'
        +   '<div class="stat-value">' + value + '</div>'
        +   (sub ? '<div class="stat-sub">' + sub + '</div>' : '')
        + '</div></div>';
    };

    // 월별 추이 막대
    const maxSales = Math.max.apply(null, data.monthly.map(function (m) { return m.sales; }).concat([1]));
    const bars = data.monthly.map(function (m) {
      const h = Math.round((m.sales / maxSales) * 100);
      const on = DASH.month === m.month ? ' on' : '';
      return '<button type="button" class="mbar' + on + '" title="' + m.month + '월 · 매출 ' + formatNumber(m.sales) + '원 · ' + m.count + '건"'
        + ' onclick="setDash(\'month\', \'' + (DASH.month === m.month ? '' : m.month) + '\')">'
        + '<span class="bar" style="height:' + Math.max(h, 2) + '%"></span>'
        + '<span class="mm">' + parseInt(m.month) + '</span>'
        + '</button>';
    }).join('');

    const periodLabel = DASH.month
      ? DASH.year + '년 ' + parseInt(DASH.month) + '월'
      : DASH.year + '년 전체';

    content.innerHTML = [
      '<div class="page-header">',
      '  <div><h2>대시보드</h2>',
      '    <div class="subtitle">' + periodLabel + (DASH.manager ? ' · ' + esc(DASH.manager) : '') + ' 요약</div></div>',
      /*
       * 엑셀 다운로드는 관리자 화면에서만 보여준다.
       * 직원 사이트(/staff)에서는 관리자가 들어와도 안 보인다 —
       * 「직원 사이트는 직원이 보는 그대로」여야 하기 때문이다.
       * (서버의 bulkData 도 requireAdmin 으로 한 번 더 막는다)
       */
      canSeeRoute(API.getUser(), 'bulk')
        ? '  <button class="btn btn-primary" onclick="downloadExcel()"><span class="icon">📥</span> 엑셀 다운로드</button>'
        : '',
      '</div>',

      // ── 기간·담당자 필터 ──
      // ── 회사 고르기 — 고른 회사의 숫자만 화면에 나온다 ──
      '<div class="co-switch">',
      ['', '혜움컨설팅', '그로우인'].map(function (nm) {
        const on = DASH.company === nm;
        const m = (data.byCompany || []).find(function (x) { return x.company === nm; });
        const amount = nm === ''
          ? (data.byCompany || []).reduce(function (a, x) { return a + x.sales; }, 0)
          : (m ? m.sales : 0);
        const cnt = nm === ''
          ? (data.byCompany || []).reduce(function (a, x) { return a + x.count; }, 0)
          : (m ? m.count : 0);
        return '<button type="button" class="co-btn' + (on ? ' on' : '')
          + (nm === '그로우인' ? ' sub' : '') + '"'
          + ' onclick="setDash(\'company\', \'' + nm + '\')">'
          + '<span class="nm">' + (nm || '전체') + '</span>'
          + '<span class="vl">' + formatNumber(amount) + '</span>'
          + '<span class="ct">' + cnt + '건</span>'
          + '</button>';
      }).join(''),
      '</div>',

      '<div class="dash-filter">',
      '  <select class="form-select" onchange="setDash(\'year\', this.value)">',
      (f.years.length ? f.years : [DASH.year]).map(function (y) { return opt(y, y + '년', DASH.year); }).join(''),
      '  </select>',
      '  <select class="form-select" onchange="setDash(\'month\', this.value)">',
      opt('', '연간 전체', DASH.month),
      Array.from({ length: 12 }, function (_, i) {
        const mm = String(i + 1).padStart(2, '0');
        return opt(mm, (i + 1) + '월', DASH.month);
      }).join(''),
      '  </select>',
      '  <select class="form-select" onchange="setDash(\'manager\', this.value)">',
      opt('', '담당자 전체', DASH.manager),
      f.managers.map(function (m) { return opt(m, m, DASH.manager); }).join(''),
      '  </select>',
      (DASH.month || DASH.manager || DASH.company
        ? '<button class="btn btn-ghost btn-sm" onclick="resetDash()">✕ 조건 지우기</button>'
        : ''),
      '  <span class="basis-wrap">',
      '    <span class="lb">집계 기준</span>',
      '    <select class="form-select" onchange="setDash(\'basis\', this.value)">',
      BASIS_OPTS.map(function (o) { return opt(o[0], o[1], DASH.basis); }).join(''),
      '    </select>',
      '  </span>',
      '</div>',
      '<div class="basis-hint">' + icon('alert', 15) + '<span>'
        + '<b>' + (BASIS_OPTS.find(function (o) { return o[0] === DASH.basis; }) || BASIS_OPTS[0])[1] + '</b> 기준 — '
        + (BASIS_OPTS.find(function (o) { return o[0] === DASH.basis; }) || BASIS_OPTS[0])[2]
        + '</span></div>',

      // ── 지표 카드 ──
      (DASH.company
        ? '<div class="co-banner' + (DASH.company === '그로우인' ? ' sub' : '') + '">'
          + '<b>' + esc(DASH.company) + '</b> 자료만 보고 있습니다'
          + '<button type="button" onclick="setDash(\'company\', \'\')">전체 보기</button></div>'
        : ''),
      '<div class="stats-grid">',
      card('c-blue', 'projects', '진행 과정', formatNumber(S.project_count) + '<em>건</em>',
        S.project_count ? '건당 평균 ' + formatNumber(S.avg_sales) + '원' : ''),
      card('c-cyan', 'sales', '총 매출 <span>부가세 별도</span>', formatNumber(S.total_sales) + '<em>원</em>',
        // 회사가 둘이라 매출을 회사별로 나눠 함께 보여준다
        (DASH.company
          ? '부가세 포함 ' + formatNumber(S.total_with_vat) + '원'
          : (function () {
              const by = {};
              (data.byCompany || []).forEach(function (m) { by[m.company] = m.sales; });
              return '<span class="co-split">' + COMPANIES.map(function (nm) {
                return '<span class="' + (nm === '그로우인' ? 'sub' : '') + '">'
                  + nm + ' <b>' + formatNumber(by[nm] || 0) + '</b></span>';
              }).join('') + '</span>';
            })())),
      card('c-red', 'expense', '총 매입', formatNumber(S.total_expenses) + '<em>원</em>',
        S.total_sales ? '매출 대비 ' + ((S.total_expenses / S.total_sales) * 100).toFixed(1) + '%' : ''),
      card('c-green', 'profit', '이익', formatNumber(S.profit) + '<em>원</em>',
        S.total_sales ? '이익률 ' + S.margin.toFixed(1) + '%' : ''),
      card('c-purple', 'receivable', '미수금 <span>부가세 별도</span>', formatNumber(data.receivable.supply) + '<em>원</em>',
        '부가세 포함 ' + formatNumber(data.receivable.amount) + '원 · ' + data.receivable.count + '장'),
      /*
       * 교육진행 — 고른 기간에 실제로 현장에 다녀온 것.
       * 누르면 교육진행 화면으로 간다.
       */
      card('c-amber', 'visit', '교육진행',
        formatNumber((data.visits || {}).days || 0) + '<em>일</em>',
        peopleLine((data.visits || {}).byPerson, (data.visits || {}).projects || 0),
        'visits'),
      '</div>',

      // ── 경고 ──
      // 매입 누락 경고는 관리자만 다룬다 (서버도 직원에게는 0 으로 준다)
      (isAdminView() && data.alerts.missingExpense > 0
        ? '<div class="warn-box click" style="margin-bottom:1.25rem"'
          + ' onclick="showMissingExpense()" title="눌러서 해당 과정 보기">'
          + '<span class="ico">' + icon('alert', 18) + '</span>'
          + '<span class="txt">매출은 있는데 <b>매입이 하나도 없는 과정이 ' + data.alerts.missingExpense + '건</b> 있습니다. '
          + '지급 누락이 아닌지 확인해주세요.</span>'
          + '<span class="go">해당 과정 보기 →</span></div>'
        : ''),

      // ── 월별 추이 ──
      '<div class="dash-grid">',
      '  <div class="chart-card wide">',
      '    <h3>' + icon('chart', 18) + ' ' + DASH.year + '년 월별 매출'
      /*
       * 한 달을 고르면 「연간 보기」 버튼이 나온다.
       * 전에는 같은 막대를 다시 눌러야 풀렸는데 그걸 알기 어려웠다.
       */
      + (DASH.month
        ? '<button type="button" class="yr-back" onclick="setDash(\'month\', \'\')">'
          + '↩ 연간 보기</button>'
          + '<span class="hint">지금 ' + parseInt(DASH.month) + '월만 보고 있습니다</span>'
        : '<span class="hint">막대를 누르면 그 달만 봅니다</span>')
      + '</h3>',
      '    <div class="mchart">' + bars + '</div>',
      '  </div>',
      '</div>',

      // ── 담당자별 · 고객사 · 구분 ──
      '<div class="dash-grid three">',
      '  <div class="chart-card">',
      '    <h3>' + icon('person', 18) + ' 담당자별</h3>',
      (DASH.company ? '' : (function () {
        // 실적이 없는 회사도 0으로 보여준다 (자회사가 있는 걸 늘 알 수 있게)
        const have = {};
        (data.byCompany || []).forEach(function (m) { have[m.company] = m; });
        const list = COMPANIES.map(function (nm) {
          return have[nm] || { company: nm, count: 0, sales: 0, expenses: 0, profit: 0, margin: 0 };
        });
        return '<div class="co-cards">' + list.map(function (m) {
          const on = DASH.company === m.company;
          return '<div class="co-card' + (on ? ' on' : '') + '"'
            + ' onclick="setDash(\'company\', \'' + (on ? '' : esc(m.company)) + '\')">'
            + '<div class="co-nm">' + esc(m.company)
            +   (m.company === '혜움컨설팅' ? '<em>본회사</em>' : '<em>자회사</em>') + '</div>'
            + '<div class="co-grid">'
            +   '<span><i>과정</i><b>' + formatNumber(m.count) + '건</b></span>'
            +   '<span><i>매출</i><b class="s">' + formatNumber(m.sales) + '</b></span>'
            +   '<span><i>매입</i><b class="e">' + formatNumber(m.expenses) + '</b></span>'
            +   '<span><i>이익</i><b class="p">' + formatNumber(m.profit) + '</b>'
            +     '<em>' + m.margin.toFixed(1) + '%</em></span>'
            + '</div></div>';
        }).join('') + '</div>';
      })()),

      (data.byManager.length === 0 ? '<div class="empty-state" style="padding:1.5rem"><p>데이터가 없습니다.</p></div>'
        : '<div class="rank">' + data.byManager.map(function (m) {
          const pf = m.sales - m.expenses;
          return '<div class="rank-row" onclick="setDash(\'manager\', \'' + (DASH.manager === m.manager ? '' : m.manager) + '\')">'
            + '<span class="nm' + (DASH.manager === m.manager ? ' on' : '') + '">' + esc(m.manager) + '</span>'
            + '<span class="ct">' + m.count + '건</span>'
            + '<span class="vl">' + formatNumber(m.sales) + '</span>'
            + '<span class="pf">' + formatNumber(pf) + '</span>'
            + '</div>';
        }).join('') + '</div>'),
      '  </div>',

      '  <div class="chart-card">',
      '    <h3>' + icon('client', 18) + ' 고객사 상위 5</h3>',
      (data.topClients.length === 0 ? '<div class="empty-state" style="padding:1.5rem"><p>데이터가 없습니다.</p></div>'
        : '<div class="rank">' + data.topClients.map(function (c, i) {
          return '<div class="rank-row">'
            + '<span class="no">' + (i + 1) + '</span>'
            + '<span class="nm">' + esc(c.name) + '</span>'
            + '<span class="ct">' + c.count + '건</span>'
            + '<span class="vl">' + formatNumber(c.sales) + '</span>'
            + '</div>';
        }).join('') + '</div>'),
      '  </div>',

      '  <div class="chart-card">',
      '    <h3>' + icon('receivable', 18) + ' 미수금 오래된 순</h3>',
      (data.receivable.list.length === 0 ? '<div class="empty-state" style="padding:1.5rem"><p>미수금이 없습니다.</p></div>'
        : '<div class="rank">' + data.receivable.list.map(function (r) {
          return '<div class="rank-row" style="cursor:pointer" onclick="navigate(\'project-form\', ' + r.id + ')">'
            + '<span class="nm">' + esc(r.client_name || '-') + '</span>'
            + '<span class="ct">' + (r.issue_date || '미발행') + '</span>'
            + '<span class="vl unpaid">' + formatNumber(r.supply_amount) + '</span>'
            + '</div>';
        }).join('') + '</div>'),
      '  </div>',
      '</div>',

      // ── 구분별 · 매입 분류 · 최근 등록 ──
      '<div class="dash-grid three">',
      '  <div class="chart-card">',
      '    <h3>' + icon('sales', 18) + ' 구분별 매출</h3>',
      (data.salesByType.length === 0 ? '<div class="empty-state" style="padding:1.5rem"><p>데이터가 없습니다.</p></div>'
        : '<div class="bars">' + data.salesByType.map(function (x) {
          const pct = S.total_sales ? (x.total / S.total_sales) * 100 : 0;
          return '<div class="bar-row"><div class="bl"><span>' + esc(x.type) + '</span>'
            + '<b>' + formatNumber(x.total) + '</b></div>'
            + '<div class="bt"><span style="width:' + pct.toFixed(1) + '%"></span></div></div>';
        }).join('') + '</div>'),
      '  </div>',

      '  <div class="chart-card">',
      '    <h3>' + icon('expense', 18) + ' 매입 분류</h3>',
      (data.expenseByCategory.length === 0 ? '<div class="empty-state" style="padding:1.5rem"><p>데이터가 없습니다.</p></div>'
        : '<div class="bars">' + data.expenseByCategory.map(function (x) {
          const pct = S.total_expenses ? (x.total / S.total_expenses) * 100 : 0;
          return '<div class="bar-row"><div class="bl"><span>' + esc(x.category) + '</span>'
            + '<b>' + formatNumber(x.total) + '</b></div>'
            + '<div class="bt red"><span style="width:' + pct.toFixed(1) + '%"></span></div></div>';
        }).join('') + '</div>'),
      '  </div>',

      '  <div class="chart-card">',
      '    <h3>' + icon('projects', 18) + ' 최근 등록</h3>',
      (data.recentProjects.length === 0 ? '<div class="empty-state" style="padding:1.5rem"><p>데이터가 없습니다.</p></div>'
        : '<div class="rank">' + data.recentProjects.map(function (p) {
          return '<div class="rank-row" style="cursor:pointer" onclick="navigate(\'project-form\', ' + p.id + ')">'
            + '<span class="nm">' + esc(p.course_name) + '</span>'
            + '<span class="ct">' + esc(p.client_name || '-') + '</span>'
            + '<span class="vl">' + formatNumber(p.total_sales) + '</span>'
            + '</div>';
        }).join('') + '</div>'),
      '  </div>',
      '</div>'
    ].join('');
  } catch (err) { showToast(err.message, 'error'); }
}

function setDash(key, value) {
  DASH[key] = value;
  renderDashboard();
}
function resetDash() {
  DASH.company = ''; DASH.month = ''; DASH.manager = ''; renderDashboard(); }
/**
 * 리스트 시트 → 시스템 (불러오기).
 * 내보내기와 방향이 반대라서, 무엇이 달라지는지 먼저 보여주고 확인을 받는다.
 */
async function openListImport() {
  const btn = document.getElementById('btn-list-import');
  const old = btn ? btn.innerHTML : null;
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="icon">⏳</span> 시트 읽는 중...'; }

  let p;
  try {
    p = await API.listPreview();
  } catch (e) {
    showToast(e.message, 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = old; }
    return;
  }
  if (btn) { btn.disabled = false; btn.innerHTML = old; }

  const nSheet = p.onlyInSheet;
  const nSys = p.onlyInSystem;
  const addCount = nSheet.companies.length + nSheet.instructors.length + nSheet.partners.length;

  const listBlock = function (title, arr, color) {
    if (!arr.length) return '';
    const shown = arr.slice(0, 12).map(esc).join(', ');
    const more = arr.length > 12 ? ' 외 ' + (arr.length - 12) + '건' : '';
    return '<div style="margin-top:0.6rem"><b style="color:' + color + '">' + title + ' ' + arr.length + '건</b>'
      + '<div style="font-size:0.84rem; color:var(--text-secondary); margin-top:0.2rem; line-height:1.6">'
      + shown + more + '</div></div>';
  };

  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.innerHTML = [
    '<div class="modal" style="max-width:620px">',
    '  <div class="modal-header">',
    '    <h3>리스트 시트에서 불러오기</h3>',
    '    <button class="modal-close" onclick="this.closest(\'.modal-overlay\').remove()">✖</button>',
    '  </div>',
    '  <div class="modal-body">',
    '    <div class="tab-desc" style="margin:0 0 0.9rem"><span class="ico">💡</span><span>',
    '      <b>시트 → 사이트</b> 방향입니다. (내보내기와 반대)<br>',
    '      시트에서 고친 내용을 시스템으로 가져옵니다.</span></div>',
    '    <div class="inv-sum" style="margin:0">',
    '      <span>시트 <b>고객사 ' + p.sheet.companies + ' · 담당자 ' + p.sheet.contacts + ' · 강사 ' + p.sheet.instructors + ' · 협력사 ' + p.sheet.partners + '</b></span>',
    '      <span class="sep">↔</span>',
    '      <span>시스템 <b>고객사 ' + p.system.companies + ' · 담당자 ' + p.system.contacts + ' · 강사 ' + p.system.instructors + ' · 협력사 ' + p.system.partners + '</b></span>',
    '    </div>',
    listBlock('＋ 시트에만 있음 (추가됩니다) — 고객사', nSheet.companies, 'var(--success)'),
    listBlock('＋ 시트에만 있음 — 강사', nSheet.instructors, 'var(--success)'),
    listBlock('＋ 시트에만 있음 — 협력사', nSheet.partners, 'var(--success)'),
    listBlock('－ 시스템에만 있음 (그대로 남습니다) — 고객사', nSys.companies, 'var(--danger)'),
    listBlock('－ 시스템에만 있음 — 협력사', nSys.partners, 'var(--danger)'),
    (addCount === 0 && !nSys.companies.length && !nSys.partners.length
      ? '<div style="margin-top:0.9rem; color:var(--success); font-weight:700">✅ 시트와 시스템이 완전히 같습니다. 가져올 것이 없습니다.</div>'
      : ''),
    (p.projectCount > 0
      ? '<div class="warn-box" style="margin-top:1rem"><span class="ico">⚠️</span><span class="txt">'
        + '등록된 과정이 <b>' + p.projectCount + '건</b> 있어 <b>전체 교체는 할 수 없습니다.</b><br>'
        + '과정이 고객사·강사를 참조하고 있어서입니다. 이름 변경은 사이트에서 직접 수정해주세요.</span></div>'
      : ''),
    '  </div>',
    '  <div class="modal-footer">',
    '    <button class="btn btn-ghost" onclick="this.closest(\'.modal-overlay\').remove()">닫기</button>',
    (p.projectCount === 0
      ? '<button class="btn btn-danger" onclick="runListImport(\'reset\')">전부 비우고 시트대로</button>'
      : ''),
    '    <button class="btn btn-primary" onclick="runListImport(\'add\')">새로 추가된 것만 가져오기</button>',
    '  </div>',
    '</div>'
  ].join('');
  document.body.appendChild(div);
}

async function runListImport(mode) {
  if (mode === 'reset' &&
      !confirm('고객사·담당자·강사·협력사를 모두 지우고 시트 내용으로 다시 채웁니다.\n계속할까요?')) return;
  try {
    const r = await API.listImport(mode);
    const a = r.added;
    showToast('가져왔습니다. 고객사 +' + a.clients + ' · 담당자 +' + a.contacts
      + ' · 강사 +' + a.instructors + ' · 협력사 +' + a.partners, 'success');
    const o = document.querySelector('.modal-overlay'); if (o) o.remove();
  } catch (e) {
    showToast(e.message, 'error');
  }
}
/** 구글시트로 지금 바로 밀어넣기 */
async function syncGSheet() {
  const btn = document.getElementById('btn-gsync');
  const old = btn ? btn.innerHTML : null;
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="icon">⏳</span> 보내는 중...'; }
  try {
    const r = await API.syncGSheet();
    if (r.skipped) {
      showToast('구글시트 연동이 아직 설정되지 않았습니다.', 'warning');
    } else {
      const n = Object.entries(r.counts || {}).map(([k, v]) => k + ' ' + v + '건').join(', ');
      showToast('구글시트로 내보냈습니다. (' + n + ')', 'success');
    }
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = old; }
  }
}

async function downloadExcel() {
  /*
   * 대시보드의 「엑셀 다운로드」.
   *
   * 전에는 구글 드라이브에 파일을 만들어 받았는데, 받을 때마다 파일이 쌓이고
   * 개인정보가 인터넷에 남았다. 지금은 브라우저가 직접 만들어
   * 다운로드 폴더에 바로 넣는다 (드라이브에 아무것도 안 남는다).
   */
  const keep = confirm([
    '엑셀에 개인정보(강사 이메일 · 계산서 받는사람 연락처)를 넣을까요?',
    '',
    '[확인] 넣어서 받기 — 정산용',
    '[취소] 빼고 받기 — 공유용'
  ].join('\n'));
  try {
    const r = await API.downloadAll({ personal: keep ? '1' : '0' });
    const rows = (r.sheets || []).reduce((a, s) => a + s.rows.length, 0);
    showToast(r.filename + ' 을(를) 받았습니다. (시트 ' + r.sheets.length + '장 · '
      + formatNumber(rows) + '줄)', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// --- 과정 목록 ---
/* ═══════════════════════════════════════════════════════════
   교육진행 — 실제로 현장에 다녀온 날

   과정에 적는 「교육일정」은 하기로 한 날이고,
   여기는 실제로 나간 날이다. 둘은 다를 수 있다.

   날짜를 고르는 칸은 과정 등록의 교육일정과 똑같은 위젯을 그대로 쓴다.
   같은 일을 두 가지 모양으로 익히게 하면 안 되기 때문이다.
   (그 위젯은 #p-schedule-type · #sched-box · #sched-desc · #sched-summary
    와 State.schedules 를 본다 — 여기서도 같은 이름으로 그려 준다)
   ═══════════════════════════════════════════════════════════ */

const VISIT = {
  q: '',
  done: '',          // '1' 이면 다녀온 것만
  editing: null,     // 지금 적고 있는 과정 번호
  rows: [],
  people: []         // 관리자가 고를 수 있는 사람 (직원은 빈 목록)
};

async function renderVisits() {
  const content = document.getElementById('main-content');
  let data;
  try {
    data = await API.get('/visits' + API.qs({ q: VISIT.q, done: VISIT.done }));
  } catch (e) { showToast(e.message, 'error'); return; }

  VISIT.rows = data.visits || [];
  // 관리자만 받는다 (직원에게는 빈 목록이 온다)
  VISIT.people = data.people || [];
  const t = data.totals || {};

  content.innerHTML = [
    '<div class="page-header"><div><h2>교육진행</h2>',
    '  <div class="subtitle">실제로 현장에 다녀온 날을 적어 둡니다. 과정에 적은 교육일정과 달라도 됩니다.</div></div></div>',

    '<div class="list-total">',
    '  <span class="cnt"><b>' + formatNumber(t.done || 0) + '</b>개 과정</span>',
    '  <span class="it"><i>진행일수</i><b class="sales">' + formatNumber(t.days || 0) + '</b>일</span>',
    '  <span class="it"><i>전체 과정</i><b>' + formatNumber(t.projects || 0) + '</b>건</span>',
    '</div>',

    /* 누가 얼마나 다녀왔는지 — 대표님 지시 (2026-10-26) */
    ((t.byPerson || []).length
      ? '<div class="who-bar">' + t.byPerson.map(function (p) {
          return '<span class="who-chip"><b>' + esc(p.name) + '</b>'
            + formatNumber(p.projects) + '개 과정 · 진행일수 ' + formatNumber(p.days) + '일</span>';
        }).join('') + '</div>'
      : ''),

    '<div class="list-filter">',
    '  <div class="f-search">',
    '    <input type="text" id="vs-q" class="form-input" placeholder="과정명 · 고객사 · 담당자 · 메모 검색"'
    + ' value="' + esc(VISIT.q) + '" oninput="onVisitSearch(this.value)">',
    '  </div>',
    '  <select class="form-select" onchange="setVisitFilter(\'done\', this.value)">',
    '    <option value=""' + (VISIT.done ? '' : ' selected') + '>전체 과정</option>',
    '    <option value="1"' + (VISIT.done ? ' selected' : '') + '>다녀온 것만</option>',
    '  </select>',
    '</div>',

    (VISIT.rows.length === 0
      ? '<div class="empty-state" style="padding:3rem"><p>조건에 맞는 과정이 없습니다.</p></div>'
      : [
        '<div class="table-container"><table class="data-table">',
        '<thead><tr>',
        '  <th class="th-mid">회사</th><th>고객사</th><th>과정명</th>',
        '  <th>교육일정 <em class="th-sub">(하기로 한 날)</em></th>',
        '  <th>다녀온 날</th><th class="th-mid">진행일수</th><th class="th-mid">다녀온 사람</th><th>메모</th><th class="th-mid"></th>',
        '</tr></thead><tbody>',
        VISIT.rows.map(visitRow).join(''),
        '</tbody></table></div>'
      ].join(''))
  ].join('');

  // 적던 중이었으면 그 자리를 다시 펴 준다
  if (VISIT.editing) openVisitEditor(VISIT.editing, true);
}

/** 표의 한 줄 */
function visitRow(r) {
  const went = r.visit_days > 0;
  return '<tr id="vrow-' + r.project_id + '" class="' + (went ? 'v-done' : '') + '">'
    + '<td class="c-mid"><span class="co-tag' + ((r.company || '혜움컨설팅') === '그로우인' ? ' sub' : '') + '">'
    +   esc(r.company || '혜움컨설팅') + '</span></td>'
    + '<td>' + esc(r.client_name || '-') + '</td>'
    + '<td style="font-weight:600">' + esc(r.course_name || '-') + '</td>'
    + '<td class="c-mid" style="font-size:0.82rem; color:var(--text-secondary)">'
    +   esc(schedText(r.plan_dates)) + (r.plan_days ? ' <span class="v-days">' + r.plan_days + '일</span>' : '') + '</td>'
    + '<td class="c-mid" style="font-size:0.82rem">'
    +   (went
        ? '<b>' + esc(r.visit_type) + '</b> ' + esc(schedText(r.visit_dates))
        : '<span style="color:var(--text-muted)">아직 안 적음</span>') + '</td>'
    + '<td class="c-mid">' + (went ? '<b class="v-cnt">' + r.visit_days + '일</b>' : '-') + '</td>'
    + '<td class="c-mid" style="font-size:0.82rem">'
    +   (went ? '<span class="who-tag">' + esc(r.person || '-') + '</span>' : '-') + '</td>'
    + '<td style="font-size:0.8rem; color:var(--text-secondary)">' + esc(r.note || '') + '</td>'
    /*
     * 고치기·지우기를 표에서 바로 누를 수 있게 둔다.
     * 전에는 적는 칸을 펴야만 지우기가 보여서, 지울 수 있는 줄 모르셨다.
     */
    + '<td class="c-mid"><div class="v-acts">'
    +   '<button type="button" class="btn btn-outline btn-sm"'
    +   ' onclick="openVisitEditor(' + r.project_id + ')">' + (went ? '✎ 고치기' : '적기') + '</button>'
    +   (went
        ? '<button type="button" class="btn btn-ghost btn-sm v-del"'
          + ' title="적어 둔 교육진행을 지웁니다"'
          + ' onclick="deleteVisit(' + r.project_id + ')">✖ 지우기</button>'
        : '')
    + '</div></td></tr>';
}

/** 일정 배열을 사람이 읽는 글로 */
function schedText(rows) {
  const list = (Array.isArray(rows) ? rows : []).filter(function (r) { return r && r.s; });
  if (!list.length) return '-';
  return list.map(function (r) { return r.s === r.e || !r.e ? r.s : r.s + '~' + r.e; }).join(', ');
}

function setVisitFilter(key, v) { VISIT[key] = v; renderVisits(); }

let visitSearchTimer = null;
function onVisitSearch(v) {
  VISIT.q = v;
  clearTimeout(visitSearchTimer);
  visitSearchTimer = setTimeout(function () {
    renderVisits();
    const el = document.getElementById('vs-q');
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }, 350);
}

/**
 * 한 과정의 교육진행을 적는 칸을 줄 아래에 펴 준다.
 * @param keep 다시 그리면서 열어 둘 때 true (이미 넣어 둔 날짜를 지키려고)
 */
function openVisitEditor(projectId, keep) {
  const r = VISIT.rows.filter(function (x) { return x.project_id === projectId; })[0];
  if (!r) return;

  // 다른 줄을 적고 있었으면 닫는다 (한 번에 하나만)
  closeVisitEditor();
  VISIT.editing = projectId;

  if (!keep) {
    // 교육일정 위젯이 보는 자리를 이 과정의 기록으로 채운다
    const type = r.visit_type || r.plan_type || '당일';
    State.schedules = { 당일: [], 기간: [], 차수: [] };
    const got = (r.visit_dates || []).filter(function (x) { return x && x.s; });
    State.schedules[type] = got.length ? got.map(function (x) { return { s: x.s, e: x.e || x.s }; })
                                       : [{ s: '', e: '' }];
    State.schedMode = {};
    VISIT._type = type;
    VISIT._note = r.note || '';
    // 이미 적힌 사람이 있으면 그 사람, 없으면 나
    VISIT._who = r.visited_by || myKey();
  }

  const type = VISIT._type || '당일';
  const row = document.getElementById('vrow-' + projectId);
  if (!row) return;

  const tr = document.createElement('tr');
  tr.id = 'vedit';
  tr.innerHTML = '<td colspan="9">'
    + '<div class="v-editor">'
    + '  <div class="v-ed-head"><b>' + esc(r.course_name || '') + '</b>'
    +      '<span class="v-ed-sub">' + esc(r.client_name || '') + '</span>'
    // 지금 로그인한 사람 이름으로 적힌다 — 저장하기 전에 알 수 있게
    +      whoPicker() + '</div>'
    + '  <div class="rline sched-line">'
    + '    <div class="rf rf-pick"><span class="cap">일정 유형</span>'
    + '      <select id="p-schedule-type" class="form-select" onchange="updateDateUI()">'
    + ['당일', '기간', '차수'].map(function (x) {
        return '<option value="' + x + '"' + (type === x ? ' selected' : '') + '>' + x + '</option>';
      }).join('')
    + '      </select>'
    + '    </div>'
    + '    <div class="sched-right">'
    + '      <div id="sched-desc"></div>'
    + '      <div id="sched-box" class="sched-box"></div>'
    + '      <div id="sched-summary"></div>'
    + '    </div>'
    + '  </div>'
    + '  <div class="v-ed-note">'
    + '    <span class="cap">메모</span>'
    + '    <input type="text" id="v-note" class="form-input" placeholder="예) 1차수는 담당자 대신 참석"'
    +      ' value="' + esc(VISIT._note || '') + '" oninput="VISIT._note = this.value">'
    + '  </div>'
    + '  <div class="v-ed-act">'
    + '    <button type="button" class="btn btn-ghost" onclick="closeVisitEditor(true)">취소</button>'
    + (r.visit_days
        ? '    <button type="button" class="btn btn-ghost" onclick="deleteVisit(' + projectId + ')">지우기</button>'
        : '')
    + '    <button type="button" class="btn btn-primary" onclick="saveVisit(' + projectId + ')">저장</button>'
    + '  </div>'
    + '</div></td>';
  row.parentNode.insertBefore(tr, row.nextSibling);

  renderSchedule();            // 과정 등록과 똑같은 날짜 고르는 칸
  tr.scrollIntoView({ block: 'nearest' });
}

/*
 * 「다녀온 사람」 칸.
 *
 * 관리자는 고를 수 있다 — 대신 적어 주거나, 잘못 들어간 것을 고쳐야
 * 할 때가 있기 때문이다. (대표님 지시 2026-10-26)
 * 직원은 자기 이름으로만 적힌다. 남의 이름으로 적을 수 있으면
 * 누가 갔는지가 믿을 수 없는 숫자가 된다. 서버에서도 한 번 더 막는다.
 */
function whoPicker() {
  const people = VISIT.people || [];
  if (!people.length) {
    return '<span class="v-ed-who">다녀온 사람 <b>' + esc(myName()) + '</b></span>';
  }
  const cur = VISIT._who || myKey();
  return '<span class="v-ed-who">다녀온 사람'
    + '<select id="v-who" class="form-select" onchange="VISIT._who = this.value">'
    + people.map(function (p) {
        return '<option value="' + esc(p.key) + '"' + (p.key === cur ? ' selected' : '') + '>'
          + esc(p.name) + '</option>';
      }).join('')
    + '</select></span>';
}

function closeVisitEditor(clear) {
  const old = document.getElementById('vedit');
  if (old) old.remove();
  if (clear) VISIT.editing = null;
}

async function saveVisit(projectId) {
  const type = scheduleType();
  const dates = curDates(type).filter(function (r) { return r && r.s; })
    .map(function (r) { return { s: r.s, e: r.e || r.s }; });
  if (!dates.length) return showToast('다녀온 날을 하나 이상 골라주세요.', 'warning');

  try {
    const res = await API.put('/visits/' + projectId, {
      schedule_type: type, schedule_dates: dates, note: VISIT._note || '',
      visited_by: VISIT._who || myKey()
    });
    showToast('교육진행을 저장했습니다. (' + res.days + '일)', 'success');
    VISIT.editing = null;
    renderVisits();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteVisit(projectId) {
  const r = VISIT.rows.filter(function (x) { return x.project_id === projectId; })[0];
  const what = r
    ? '「' + (r.course_name || '') + '」\n' + r.visit_type + ' · ' + r.visit_days + '일\n\n'
    : '';
  if (!confirm(what + '적어 둔 교육진행을 지울까요?\n(과정 자체는 지워지지 않습니다)')) return;
  try {
    await API.delete('/visits/' + projectId);
    showToast('지웠습니다.', 'success');
    VISIT.editing = null;
    renderVisits();
  } catch (e) { showToast(e.message, 'error'); }
}

/**
 * 「임영환 2개 과정 · 5일」 처럼 사람별로 한 줄씩.
 * 아무도 안 다녀왔으면 몇 개 과정인지만 보여준다.
 */
function peopleLine(byPerson, projects) {
  const list = Array.isArray(byPerson) ? byPerson : [];
  if (!list.length) return formatNumber(projects) + '개 과정';
  return list.map(function (p) {
    return '<span class="who-row"><b>' + esc(p.name) + '</b>'
      + '<i>' + formatNumber(p.projects) + '개 과정 · ' + formatNumber(p.days) + '일</i></span>';
  }).join('');
}

// ═══════════ 과정 목록 ═══════════
const LIST = {
  company: '',
  q: '', month: '', manager: '', type: '', sort: 'recent',
  // 매입이 하나도 없는 과정만 보기 (대시보드 경고에서 넘어올 때)
  missing_expense: '',
  months: [], managers: []
};

/**
 * 대시보드의 「매입이 없는 과정」 경고를 눌렀을 때.
 * 과정 목록으로 가서 그 과정들만 보여준다.
 */
function showMissingExpense() {
  LIST.missing_expense = '1';
  // 다른 조건이 걸려 있으면 안 보일 수 있으니 함께 푼다
  LIST.q = '';
  LIST.month = '';
  LIST.manager = '';
  LIST.type = '';

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.querySelector('.nav-item[data-route="projects"]');
  if (el) el.classList.add('active');

  navigate('projects');
}

/** 그 거르개를 푼다 */
function clearMissingExpense() {
  LIST.missing_expense = '';
  renderProjectList();
}

async function renderProjectList() {
  const content = document.getElementById('main-content');

  // 필터 선택지는 처음 한 번만 받아온다
  if (LIST.months.length === 0 && LIST.managers.length === 0) {
    try {
      const f = await API.getProjectFilters();
      LIST.months = f.months || [];
      LIST.managers = f.managers || [];
    } catch (e) {}
  }

  let data;
  try {
    data = await API.getProjects({
      q: LIST.q, month: LIST.month, manager: LIST.manager,
      type: LIST.type, sort: LIST.sort, company: LIST.company,
      missing_expense: LIST.missing_expense
    });
  } catch (e) { showToast(e.message, 'error'); return; }

  const t = data.totals || {};

  /*
   * 「확인」 칸을 보일지.
   * 매입 누락만 걸러 보고 있을 때, 관리자 화면에서만 나온다.
   * 보통 때의 과정 목록에는 상관없는 칸이라 내놓지 않는다.
   */
  const showCheck = !!LIST.missing_expense && isAdminView();

  const opt = function (v, label, cur) {
    return '<option value="' + esc(v) + '"' + (String(cur) === String(v) ? ' selected' : '') + '>' + esc(label) + '</option>';
  };

  content.innerHTML = [
    '<div class="page-header">',
    '  <div><h2>과정 목록</h2>',
    '    <div class="subtitle">매출·매입이 등록된 과정을 조건별로 봅니다.</div></div>',
    '  <button class="btn btn-primary" onclick="navigate(\'project-form\')"><span class="icon">➕</span> 신규 과정 등록</button>',
    '</div>',

    /*
     * 「매입이 없는 과정만」 보고 있을 때 그 사실을 알려준다.
     * 말없이 걸러 두면 과정이 몇 개만 보이는 이유를 알 수 없다.
     */
    (LIST.missing_expense
      ? '<div class="warn-box click" style="margin-bottom:1rem" onclick="clearMissingExpense()">'
        + '<span class="ico">' + icon('alert', 18) + '</span>'
        + '<span class="txt"><b>매입이 하나도 없는 과정</b>만 보고 있습니다.'
        + (isAdminView()
            ? ' 살펴보고 문제가 없으면 오른쪽 <b>확인함</b>을 눌러주세요 — 그 건은 다음부터 경고에 안 나옵니다.'
            : '')
        + '</span>'
        + '<span class="go">✕ 전체 보기</span></div>'
      : ''),

    // ── 필터 바 ──
    '<div class="list-filter">',
    '  <select class="form-select co-pick" onchange="setListFilter(\'company\', this.value)">',
    opt('', '회사 전체', LIST.company),
    COMPANIES.map(function (n) { return opt(n, n, LIST.company); }).join(''),
    '  </select>',
    '  <div class="f-search">',
    '    <input type="text" id="lf-q" class="form-input" placeholder="과정명 · 고객사 · 담당자 · 메모 검색" value="' + esc(LIST.q) + '"'
    + ' oninput="onListSearch(this.value)">',
    '  </div>',
    '  <select class="form-select" onchange="setListFilter(\'month\', this.value)">',
    opt('', '전체 기간', LIST.month),
    LIST.months.map(function (m) { return opt(m, m.replace('-', '년 ') + '월', LIST.month); }).join(''),
    '  </select>',
    '  <select class="form-select" onchange="setListFilter(\'manager\', this.value)">',
    opt('', '담당자 전체', LIST.manager),
    LIST.managers.map(function (m) { return opt(m, m, LIST.manager); }).join(''),
    '  </select>',
    '  <select class="form-select" onchange="setListFilter(\'type\', this.value)">',
    opt('', '구분 전체', LIST.type),
    ['교육', '특강', '기타'].map(function (x) { return opt(x, x, LIST.type); }).join(''),
    '  </select>',
    '  <select class="form-select" onchange="setListFilter(\'sort\', this.value)">',
    [
      ['recent', '최근 등록순'], ['oldest', '오래된 등록순'],
      ['date_desc', '교육일 내림차순'], ['date_asc', '교육일 오름차순'],
      ['sales_desc', '매출 높은순'], ['sales_asc', '매출 낮은순'],
      ['profit_desc', '이익 높은순'], ['profit_asc', '이익 낮은순'],
      ['client', '고객사명순'], ['course', '과정명순']
    ].map(function (o) { return opt(o[0], o[1], LIST.sort); }).join(''),
    '  </select>',
    ((LIST.q || LIST.month || LIST.manager || LIST.type || LIST.company)
      ? '<button class="btn btn-ghost btn-sm" onclick="resetListFilter()">✕ 조건 지우기</button>'
      : ''),
    '</div>',

    // ── 합계 ──
    '<div class="list-total">',
    '  <span class="cnt"><b>' + formatNumber(t.count || 0) + '</b>건</span>',
    '  <span class="it"><i>총 매출</i><b class="sales">' + formatNumber(t.sales || 0) + '</b></span>',
    '  <span class="it"><i>총 매입</i><b class="exp">' + formatNumber(t.expenses || 0) + '</b></span>',
    '  <span class="it"><i>이익</i><b class="profit">' + formatNumber(t.profit || 0) + '</b>'
    + (t.sales ? '<em>(' + ((t.profit / t.sales) * 100).toFixed(1) + '%)</em>' : '') + '</span>',
    '  <span class="it"><i>미수금</i><b class="unpaid">' + formatNumber(t.unpaid || 0) + '</b></span>',
    '</div>',

    // ── 표 ──
    (data.projects.length === 0
      ? '<div class="empty-state" style="padding:3rem"><p>조건에 맞는 과정이 없습니다.</p></div>'
      : [
        '<div class="table-container">',
        '  <table class="data-table">',
        '    <thead><tr>',
        '      <th class="th-mid">회사</th><th>고객사</th><th>구분</th><th>과정명</th><th>교육일정</th><th>담당자</th>',
        '      <th class="th-num">총 매출</th><th class="th-num">총 매입</th><th class="th-num">이익</th>',
        '      <th>발행일</th><th class="th-num">미수금</th>'
      + (showCheck ? '<th class="th-mid">확인</th>' : ''),
        '    </tr></thead><tbody>',
        data.projects.map(function (p) {
          const profit = (p.total_sales || 0) - (p.total_expenses || 0);
          return '<tr style="cursor:pointer" onclick="navigate(\'project-form\', ' + p.id + ')">'
            + '<td class="c-mid"><span class="co-tag' + ((p.company || '혜움컨설팅') === '그로우인' ? ' sub' : '') + '">'
            +   esc(p.company || '혜움컨설팅') + '</span></td>'
            + '<td>' + esc(p.client_name || '-') + '</td>'
            + '<td><span class="badge badge-type">' + esc(p.type) + '</span></td>'
            + '<td style="font-weight:600">' + esc(p.course_name) + '</td>'
            + '<td class="c-mid" style="font-size:0.82rem; color:var(--text-secondary)">' + esc(scheduleLabel(p.schedule_dates)) + '</td>'
            + '<td class="c-mid" style="font-size:0.85rem">' + esc(p.manager || '-') + '</td>'
            + '<td class="amount-cell amount-positive">' + formatNumber(p.total_sales) + '</td>'
            + '<td class="amount-cell amount-negative">' + formatNumber(p.total_expenses) + '</td>'
            + '<td class="amount-cell" style="color:' + (profit < 0 ? 'var(--danger)' : 'var(--pl-accent)') + '">'
            +   formatNumber(profit) + '</td>'
            + '<td class="c-mid" style="font-size:0.8rem; color:var(--text-secondary)">'
            +   (p.issue_date || '-') + (p.invoice_count > 1 ? ' <span style="color:var(--text-muted)">외 ' + (p.invoice_count - 1) + '장</span>' : '') + '</td>'
            + '<td class="amount-cell">'
            +   (p.unpaid_amount > 0
                ? '<span class="unpaid-badge">' + formatNumber(p.unpaid_amount) + '</span>'
                : '<span style="color:var(--success); font-size:0.8rem">완료</span>')
            + '</td>'
            + (showCheck ? '<td class="c-mid">' + expenseCheckCell(p) + '</td>' : '')
            + '</tr>';
        }).join(''),
        '    </tbody></table>',
        '</div>'
      ].join(''))
  ].join('');
}

/*
 * 매입 누락 경고를 「한 건씩」 확인함으로 표시하는 칸.
 *
 * 줄 전체가 과정 열기로 이어져 있으므로 여기서 번짐을 멈춘다(stopPropagation).
 * 그러지 않으면 누르자마자 과정 수정 화면으로 넘어가 버린다.
 */
function expenseCheckCell(p) {
  if (p.expense_checked) {
    const who = [p.expense_checked_by, p.expense_checked_at].filter(Boolean).join(' · ');
    return '<button type="button" class="btn btn-ghost btn-sm chk-on"'
      + ' title="' + esc(who ? who + ' 에 확인했습니다. 눌러서 되돌리기' : '눌러서 되돌리기') + '"'
      + ' onclick="event.stopPropagation(); setExpenseCheck(' + p.id + ', false)">'
      + '✓ 확인함</button>';
  }
  return '<button type="button" class="btn btn-outline btn-sm"'
    + ' title="살펴봤고 문제가 없다는 표시입니다. 이 건은 다음부터 경고에 안 나옵니다."'
    + ' onclick="event.stopPropagation(); setExpenseCheck(' + p.id + ', true)">확인함</button>';
}

/** 한 건을 확인함으로 / 되돌리기 */
async function setExpenseCheck(id, on) {
  try {
    await API.put('/projects/' + id + '/expense-check', { checked: on });
    showToast(on ? '확인함으로 표시했습니다.' : '확인 표시를 되돌렸습니다.', 'success');
    renderProjectList();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function setListFilter(key, value) {
  LIST[key] = value;
  renderProjectList();
}

function resetListFilter() {
  LIST.q = ''; LIST.month = ''; LIST.manager = ''; LIST.type = ''; LIST.sort = 'recent'; LIST.company = '';
  renderProjectList();
}

/** 검색은 입력이 멈춘 뒤에 한 번만 */
let listSearchTimer = null;
function onListSearch(v) {
  LIST.q = v;
  clearTimeout(listSearchTimer);
  listSearchTimer = setTimeout(function () {
    renderProjectList();
    const el = document.getElementById('lf-q');
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }, 350);
}
let currentProject = null;

async function renderProjectForm(projectId = null) {
  loadCardList();
  State.expenseItems = [];
  State.saleItems = [];
  State.invoices = [];
  State.discount = 0;
  State.vatMode = '별도';
  State.discountBase = '공급가액';
  State.schedules = { 당일: [], 기간: [], 차수: [] };
  State.schedMode = {};
  currentProject = null;
  const content = document.getElementById('main-content');
  
  if (projectId) {
    try {
      const res = await API.getProject(projectId);
      currentProject = res.project;
      // 저장된 유형 칸에만 넣는다
      State.schedules = { 당일: [], 기간: [], 차수: [] };
      State.schedules[currentProject.schedule_type || '당일'] = currentProject.schedule_dates || [];
      State.expenseItems = res.expenses.map(e => ({...e, _id: Math.random().toString(36).substr(2, 9)}));
      State.saleItems = (res.sales || []).map(function (x) {
        return Object.assign({}, x, {
          _id: Math.random().toString(36).substr(2, 9),
          is_manual: !!x.is_manual,
          amount: x.amount || 0
        });
      });
      // 저장된 계산서는 supply/total 로 들어오므로 입력값(amount)으로 되돌린다
      State.discount = currentProject.discount || 0;
      State.vatMode = currentProject.vat_mode || '별도';
      State.discountBase = currentProject.discount_base || '공급가액';
      State.invoices = (res.invoices || []).map(function (x) {
        return invoiceFromServer(x, State.vatMode);
      });
    } catch (err) {
      showToast('데이터를 불러오지 못했습니다.', 'error');
      return navigate(afterProjectRoute());
    }
  } else {
    // 신규 작성 기본값
    State.schedules['당일'] = [{ s: '', e: '' }];
  }

  const p = currentProject || {};

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h2>${projectId ? '과정 수정' : '신규 과정 등록'}</h2>
        <div class="subtitle">매출과 매입을 한 화면에서 입력합니다.</div>
      </div>
      <div style="display:flex; gap:0.5rem">
        <button class="btn btn-ghost" onclick="navigate(afterProjectRoute())">취소</button>
        ${projectId && (API.isAdmin() || p.created_by === API.getUser().id) ? `<button class="btn btn-danger" onclick="deleteProject(${projectId})">삭제</button>` : ''}
        <button class="btn btn-primary" onclick="saveProject()"><span class="icon">💾</span> 저장</button>
      </div>
    </div>

    <div class="card form-page">
      <form id="project-form" onsubmit="event.preventDefault();">

        <!-- ── 기본정보 ── -->
        <div class="form-section sec-basic">
          <div class="form-section-title">
            <span class="step">1</span> 과정 기본정보
            <span class="hint">고객사 · 과정명 · 담당자 · 교육일정</span>
          </div>

          <div class="fgrid" style="margin-bottom:0.9rem">
            <div class="form-group f6 autocomplete-wrapper">
              <label class="form-label form-required">고객사명</label>
              <input type="text" id="p-client-name" class="form-input" placeholder="첫 글자만 입력하면 목록이 나옵니다" value="${p.client_name || ''}" autocomplete="off">
              <input type="hidden" id="p-client-id" value="${p.client_id || ''}">
              <div id="autocomplete-clients" class="autocomplete-list"></div>
              <div id="p-client-hint" class="client-hint"></div>
            </div>
            <div class="form-group f6">
              <label class="form-label">고객사 담당자 <span style="font-weight:400; color:var(--text-muted)">(이름이 없으면 ＋신규로 등록)</span></label>
              <div class="contact-picker">
                <select id="p-contact-id" class="form-select" onchange="onContactChange()">
                  <option value="">고객사를 먼저 선택하세요</option>
                </select>
                <button type="button" class="btn btn-outline btn-sm" id="btn-contact-new"
                  onclick="openContactModal(null)" disabled>＋ 신규</button>
                <button type="button" class="btn btn-ghost btn-sm" id="btn-contact-edit"
                  onclick="openContactModal(currentContactId())" disabled>✎ 수정</button>
              </div>
            </div>
          </div>

          <div class="fgrid">
            <div class="form-group f4">
              <label class="form-label form-required">과정명</label>
              <input type="text" id="p-course-name" class="form-input" placeholder="과정명 입력" value="${p.course_name || ''}">
            </div>
            <div class="form-group f2">
              <label class="form-label form-required">구분</label>
              <div class="seg">
                <label><input type="radio" name="p-type" value="교육" ${!p.type || p.type === '교육' ? 'checked' : ''}><span>교육</span></label>
                <label><input type="radio" name="p-type" value="특강" ${p.type === '특강' ? 'checked' : ''}><span>특강</span></label>
                <label><input type="radio" name="p-type" value="기타" ${p.type === '기타' ? 'checked' : ''}><span>기타</span></label>
              </div>
            </div>
            <div class="form-group f2">
              <label class="form-label form-required">회사</label>
              <select id="p-company" class="form-select">
                ${COMPANIES.map(n => `<option value="${n}" ${(p.company || DEFAULT_COMPANY) === n ? "selected" : ""}>${n}</option>`).join("")}
              </select>
            </div>
            <div class="form-group f2">
              <label class="form-label">담당자 <span style="font-weight:400;color:var(--text-muted)">(직원)</span></label>
              <select id="p-manager" class="form-select">
                <option value="">선택</option>
                ${HYEUM_MANAGERS.map(n => `<option value="${n}" ${p.manager === n ? "selected" : ""}>${n}</option>`).join("")}
              </select>
            </div>
            <div class="form-group f2">
              <label class="form-label">영업 <span style="font-weight:400;color:var(--text-muted)">(외부)</span></label>
              <select id="p-sales-rep" class="form-select">
                <option value="">선택</option>
                ${SALES_REPS.map(n => `<option value="${n}" ${p.sales_rep === n ? "selected" : ""}>${n}</option>`).join("")}
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-top:0.9rem; margin-bottom:0">
            <label class="form-label">교육일정</label>
            <div class="rline sched-line">
              <div class="rf rf-pick"><span class="cap">일정 유형</span>
                <select id="p-schedule-type" class="form-select" onchange="updateDateUI()">
                  <option value="당일" ${!p.schedule_type || p.schedule_type === '당일' ? 'selected' : ''}>당일</option>
                  <option value="기간" ${p.schedule_type === '기간' ? 'selected' : ''}>기간</option>
                  <option value="차수" ${p.schedule_type === '차수' ? 'selected' : ''}>차수</option>
                </select>
              </div>
              <div class="sched-right">
                <div id="sched-desc"></div>
                <div id="sched-box" class="sched-box"></div>
                <div id="sched-summary"></div>
              </div>
            </div>
          </div>

          <div class="form-group" style="margin-top:1.1rem; margin-bottom:0">
            <label class="form-label">메모 (선택)</label>
            <textarea id="p-memo" class="form-textarea" placeholder="특이사항이나 참고할 내용을 적어두세요.">${p.memo || ''}</textarea>
          </div>

          <div class="pl-summary">
            <div class="pl-main">
              <div class="pl-cell">
                <span class="k">총 매출 <em>부가세 별도</em></span>
                <span class="v" id="pl-sales">0원</span>
              </div>
              <div class="pl-op">−</div>
              <div class="pl-cell">
                <span class="k">총 매입</span>
                <span class="v neg" id="pl-expenses">0원</span>
              </div>
              <div class="pl-op">=</div>
              <div class="pl-cell result">
                <span class="k">이익 <em id="pl-rate"></em></span>
                <span class="v" id="pl-profit">0원</span>
              </div>
            </div>
            <div class="pl-side">
              <div><span>부가세 (10%)</span><b id="pl-vat">0원</b></div>
              <div><span>부가세 포함 총 매출</span><b id="pl-with-vat">0원</b></div>
            </div>
          </div>
        </div>

        <!-- ── 매출 ── -->
        <div class="form-section sec-sales">
          <div class="form-section-title">
            <span class="step">2</span> 매출 정보
            <span class="hint">고객사에 <b>청구할</b> 금액</span>
          </div>
          <div id="sales-container"></div>
          <div class="calc-panel" style="margin-top:0.9rem">
            <div class="calc-opt">
              <div class="opt-row">
                <span class="lb">부가세 처리</span>
                <div class="seg sm">
                  <label><input type="radio" name="p-vat-mode" value="별도" ${(!p.vat_mode || p.vat_mode === '별도') ? 'checked' : ''} onchange="setVatMode('별도')"><span>별도</span></label>
                  <label><input type="radio" name="p-vat-mode" value="포함" ${p.vat_mode === '포함' ? 'checked' : ''} onchange="setVatMode('포함')"><span>포함</span></label>
                  <label><input type="radio" name="p-vat-mode" value="면세" ${p.vat_mode === '면세' ? 'checked' : ''} onchange="setVatMode('면세')"><span>면세</span></label>
                </div>
              </div>
              <div class="opt-row">
                <span class="lb">절사 기준</span>
                <div class="seg sm">
                  <label><input type="radio" name="p-disc-base" value="공급가액" ${(!p.discount_base || p.discount_base === '공급가액') ? 'checked' : ''} onchange="setDiscountBase('공급가액')"><span>부가세 별도</span></label>
                  <label><input type="radio" name="p-disc-base" value="총액" ${p.discount_base === '총액' ? 'checked' : ''} onchange="setDiscountBase('총액')"><span>부가세 포함</span></label>
                </div>
              </div>
              <div class="opt-row">
                <span class="lb">절사금액</span>
                <div class="money sm">
                  <input type="text" id="p-discount" class="form-input amount-input" placeholder="0"
                    value="${formatNumber(p.discount)}"
                    oninput="setDiscount(parseNumber(this.value))"
                    onblur="this.value=formatNumber(parseNumber(this.value))">
                </div>
              </div>
            </div>
            <div class="line"><span class="k">항목 합계</span><span class="v" id="disp-raw-sales">0원</span></div>
            <div class="line neg" id="line-discount" style="display:none"><span class="k" id="lb-discount">절사</span><span class="v" id="disp-discount">0원</span></div>
            <div class="line"><span class="k">공급가액</span><span class="v" id="disp-total-sales">0원</span></div>
            <div class="line"><span class="k" id="lb-vat">부가세 (10%)</span><span class="v" id="disp-vat">0원</span></div>
            <div class="line sum"><span class="k">총액</span><span class="v" id="disp-total-with-vat">0원</span></div>
          </div>

        </div>

        <!-- ── 매입 ── -->
        <div class="form-section sec-expense">
          <div class="form-section-title">
            <span class="step">3</span> 매입 정보
            <span class="hint">강사·업체에 <b>지급할</b> 금액</span>
          </div>
          <div class="tab-desc"><span class="ico">💡</span><span>
            실제로 <b>지급할 금액</b>을 적습니다. 위 매출에 넣은 항목은 대부분 여기에도 짝이 있어야 합니다.<br>
            줄 왼쪽에서 <b>분류</b>를 고르세요 — <b>강의</b> 강사료 · 
            <b>협력사(운영비)</b> 교보재·버스·간식 · <b>법인카드(교육운영)</b> 교육 중 카드 결제 ·
            <b>영업수수료</b> 외부 영업자<br>
            계산 <code>단가 × 수량(단위) × 차수</code> — 매출과 같은 방식입니다.<br>
            계산이 안 맞으면 줄 오른쪽 <b>[∑ 수기]</b> 로 총액을 직접 넣으세요.<br>
            <b>세율 처리</b> — <code>3.3% · 8.8%</code> 원천징수는 총액에서 <b>빼고</b> 지급, 
            <code>세금계산서(과세 10%)</code> 는 부가세를 <b>더해서</b> 지급, 
            <code>세금계산서(면세)</code> 는 총액 그대로 지급합니다.
          </span></div>
          <div id="exp-gap-warn"></div>
          <div id="expense-container"></div>
          <div class="calc-panel" style="margin-top:0.9rem">
            <div class="line sum neg"><span class="k">매입 총금액</span><span class="v" id="disp-total-expenses">0원</span></div>
          </div>
        </div>

        <div class="form-section sec-invoice">
          <div class="form-section-title">
            <span class="step">4</span> 세금계산서 발행
            <span class="hint">발행 정보 · 받는 사람 · 미리보기</span>
          </div>
          <div class="inv-block">
            <div class="inv-head">
              <span class="t">계산서 목록</span>
              <button type="button" class="btn btn-outline btn-sm" onclick="addInvoice()">➕ 계산서 추가</button>
            </div>
            <div class="tab-desc" style="margin:0.6rem 0">
              <span class="ico">💡</span>
              <span>한 과정을 <b>여러 장으로 나눠 발행</b>할 때 [계산서 추가]로 늘리고 금액을 나눠 담으세요.<br>
              <b>입금 확인은 왼쪽 메뉴 「세금계산서」</b>에서 합니다. 여기서는 발행에 필요한 것만 적으세요.<br>
              <b>[미리보기]</b>를 누르면 홈택스 발행 화면과 같은 모양으로 확인할 수 있습니다.</span>
            </div>
            <div id="invoice-list"></div>
            <div id="invoice-summary"></div>
          </div>
        </div>

      </form>
    </div>

    <div class="form-actions">
      <button class="btn btn-ghost" onclick="navigate(afterProjectRoute())">취소</button>
      ${projectId && (API.isAdmin() || p.created_by === API.getUser().id) ? `<button class="btn btn-danger" onclick="deleteProject(${projectId})">삭제</button>` : ''}
      <button class="btn btn-primary btn-lg" onclick="saveProject()"><span class="icon">💾</span> ${projectId ? '수정 저장' : '과정 저장'}</button>
    </div>
  `;

  // UI 초기화 세팅
  setupAutocomplete();
  setupAmountInputs();
  // 수정 화면이면 기존 고객사의 담당자 목록을 불러와 선택 상태로 만든다
  if (p.client_id) loadContacts(p.client_id, p.contact_id);
  else setContactOptions([]);
  renderSchedule();
  renderSales();
  renderInvoices();
  renderExpenseItems();
}

// --- 교육일정 ---
// 저장 형식: [{ s:'YYYY-MM-DD', e:'YYYY-MM-DD' }, ...]
//   당일 = 구간 1개(s===e) / 기간 = 구간 1개 / 차수 = 구간 N개(각 차수가 여러 날 가능)
const todayStr = () => new Date().toISOString().split('T')[0];

function rangeDays(r) {
  if (!r || !r.s) return 0;
  const d = (Date.parse(r.e || r.s) - Date.parse(r.s)) / 86400000;
  return Number.isFinite(d) ? Math.max(0, Math.round(d)) + 1 : 1;
}
/** 지금 선택된 일정 유형 */
function schedType() { return scheduleType(); }

/** 현재 유형의 일정 배열 (없으면 만들어 준다) */
function curDates(type) {
  const t = type || schedType();
  if (!State.schedules[t]) State.schedules[t] = [];
  return State.schedules[t];
}

function totalDays(type) {
  return curDates(type).reduce(function (a, r) { return a + rangeDays(r); }, 0);
}

/**
 * 일정 유형을 바꿨을 때.
 *
 * 저장되는 건 언제나 "선택한 유형 하나"뿐이다.
 * 그래서 다른 유형에 날짜가 남아 있으면 물어보고 지운다.
 * 어느 탭에 뭐가 들어있는지 헷갈릴 일이 없도록.
 */
function updateDateUI() {
  const type = schedType();

  const others = ['당일', '기간', '차수'].filter(function (t) {
    return t !== type && (State.schedules[t] || []).some(function (r) { return r && r.s; });
  });

  if (others.length) {
    const okToClear = confirm(
      '「' + others.join(' · ') + '」에 입력한 날짜가 지워집니다.\n' +
      '「' + type + '」(으)로 바꿀까요?'
    );
    if (okToClear) {
      others.forEach(function (t) { State.schedules[t] = []; });
    } else {
      // 되돌린다
      const back = document.getElementById('p-schedule-type');
      if (back) back.value = others[0];
      renderSchedule();
      return;
    }
  }

  // 자동으로 오늘 날짜를 넣지 않는다. 비어 있으면 "날짜 선택" 으로 보인다.
  if (!State.schedules[type]) State.schedules[type] = [];
  if (type !== '차수') State.schedules[type] = State.schedules[type].slice(0, 1);
  if (State.schedules[type].length === 0) State.schedules[type] = [{ s: '', e: '' }];

  renderSchedule();
}

// ═══════════ 큰 달력 (브라우저 기본 달력 대신) ═══════════
// 브라우저가 그리는 기본 달력은 크기를 바꿀 수 없어 직접 만든다.

const CAL = {
  el: null,      // 팝업 DOM
  input: null,   // 어느 입력칸에 연결됐는지
  view: null     // 지금 보고 있는 달 (Date)
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function ymd(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
    + '-' + String(d.getDate()).padStart(2, '0');
}

/** 입력칸을 눌렀을 때 큰 달력을 연다 */
function openCalendar(e, input) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  if (CAL.input === input && CAL.el) { closeCalendar(); return; }

  closeCalendar();
  CAL.input = input;

  const cur = parseYmd(input.value);
  CAL.view = cur ? new Date(cur.getFullYear(), cur.getMonth(), 1)
                 : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const box = document.createElement('div');
  box.className = 'bigcal';
  document.body.appendChild(box);
  CAL.el = box;

  renderCalendar();
  positionCalendar(input);
  input.classList.add('cal-open');
}

function parseYmd(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || '').trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

function closeCalendar() {
  if (CAL.el) CAL.el.remove();
  if (CAL.input) CAL.input.classList.remove('cal-open');
  CAL.el = null;
  CAL.input = null;
}

function positionCalendar(input) {
  const r = input.getBoundingClientRect();
  const box = CAL.el;
  const w = box.offsetWidth || 340;
  const h = box.offsetHeight || 380;

  let left = r.left + window.scrollX;
  let top = r.bottom + window.scrollY + 6;

  // 화면 밖으로 나가면 안쪽으로 당긴다
  if (left + w > window.scrollX + document.documentElement.clientWidth - 8) {
    left = window.scrollX + document.documentElement.clientWidth - w - 8;
  }
  if (left < window.scrollX + 8) left = window.scrollX + 8;

  // 아래 공간이 부족하면 위로 띄운다
  if (r.bottom + h + 12 > document.documentElement.clientHeight) {
    top = r.top + window.scrollY - h - 6;
    if (top < window.scrollY + 8) top = window.scrollY + 8;
  }

  box.style.left = left + 'px';
  box.style.top = top + 'px';
}

function moveCalendar(deltaMonth, deltaYear) {
  CAL.view = new Date(
    CAL.view.getFullYear() + (deltaYear || 0),
    CAL.view.getMonth() + (deltaMonth || 0),
    1
  );
  renderCalendar();
}

function renderCalendar() {
  if (!CAL.el) return;

  const view = CAL.view;
  const y = view.getFullYear();
  const m = view.getMonth();
  const today = ymd(new Date());
  const selected = CAL.input ? String(CAL.input.value || "").trim() : "";

  const first = new Date(y, m, 1);
  const startPad = first.getDay();               // 이 달 1일의 요일
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();  // 지난달 마지막 날

  const cells = [];
  // 지난달 꼬리
  for (let i = startPad - 1; i >= 0; i--) {
    cells.push({ d: new Date(y, m - 1, prevDays - i), out: true });
  }
  // 이번달
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ d: new Date(y, m, d), out: false });
  }
  // 다음달 머리 (6줄 채우기)
  while (cells.length % 7 !== 0) {
    cells.push({ d: new Date(y, m + 1, cells.length - startPad - daysInMonth + 1), out: true });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].d;
    cells.push({ d: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), out: true });
  }

  const head = [
    '<div class="cal-head">',
    '  <button type="button" class="nav" title="이전 해" onclick="moveCalendar(0,-1)">«</button>',
    '  <button type="button" class="nav" title="이전 달" onclick="moveCalendar(-1,0)">‹</button>',
    '  <span class="ym">' + y + '년 ' + (m + 1) + '월</span>',
    '  <button type="button" class="nav" title="다음 달" onclick="moveCalendar(1,0)">›</button>',
    '  <button type="button" class="nav" title="다음 해" onclick="moveCalendar(0,1)">»</button>',
    '</div>'
  ].join('');

  const wk = '<div class="cal-week">'
    + WEEKDAYS.map(function (w, i) {
      const cls = i === 0 ? ' sun' : (i === 6 ? ' sat' : '');
      return '<span class="wd' + cls + '">' + w + '</span>';
    }).join('') + '</div>';

  const grid = '<div class="cal-grid">' + cells.map(function (c) {
    const v = ymd(c.d);
    const dow = c.d.getDay();
    let cls = 'cal-day';
    if (c.out) cls += ' out';
    if (dow === 0) cls += ' sun';
    if (dow === 6) cls += ' sat';
    if (v === today) cls += ' today';
    if (v === selected) cls += ' sel';
    return '<button type="button" class="' + cls + '" onclick="pickDate(\'' + v + '\')">'
      + c.d.getDate() + '</button>';
  }).join('') + '</div>';

  const foot = [
    '<div class="cal-foot">',
    '  <button type="button" class="lnk" onclick="pickDate(\'' + today + '\')">오늘</button>',
    '  <button type="button" class="lnk clear" onclick="pickDate(\'\')">지우기</button>',
    '  <button type="button" class="lnk" onclick="closeCalendar()">닫기</button>',
    '</div>'
  ].join('');

  CAL.el.innerHTML = head + wk + grid + foot;
}

/** 날짜를 고르면 입력칸에 넣고 change 를 발생시킨다 */
function pickDate(value) {
  const input = CAL.input;
  if (!input) return;
  input.value = value;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  closeCalendar();
}

// 바깥을 클릭하거나 ESC 를 누르면 닫는다
document.addEventListener('mousedown', function (e) {
  if (!CAL.el) return;
  if (CAL.el.contains(e.target)) return;
  if (CAL.input && CAL.input === e.target) return;
  closeCalendar();
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeCalendar();
});
window.addEventListener('resize', function () { if (CAL.input) positionCalendar(CAL.input); });
window.addEventListener('scroll', function () { if (CAL.input) positionCalendar(CAL.input); }, true);

/** 날짜 입력칸 HTML을 만든다 (모든 화면이 이걸 쓴다) */
function dateInput(value, onChangeJs, extraClass) {
  return '<input type="text" class="form-input date-field ' + (extraClass || '') + '"'
    + ' readonly placeholder="날짜 선택"'
    + ' value="' + (value || '') + '"'
    + ' onmousedown="openCalendar(event, this)"'
    + ' onchange="' + onChangeJs + '">';
}
/** 지금 고른 일정 유형 */
function scheduleType() {
  const el = document.getElementById('p-schedule-type');
  return (el && el.value) || '당일';
}

function schedMode() {
  return State.schedMode[scheduleType()] || 'calendar';
}

function setSchedMode(mode) {
  const type = scheduleType();
  State.schedMode[type] = mode;
  renderSchedule();
}

function renderSchedule() {
  const type = scheduleType();
  const box = document.getElementById('sched-box');
  if (!box) return;

  const dbox = document.getElementById('sched-desc');
  if (dbox && SCHED_DEFS[type]) {
    dbox.innerHTML = '<div class="tab-desc"><span class="ico">💡</span><span>'
      + SCHED_DEFS[type].desc + '</span></div>';
  }
  const rows = curDates(type);
  const mode = schedMode();

  const chips = [
    '<div class="mode-chip">',
    '  <button type="button" class="' + (mode === 'calendar' ? 'active' : '') + '" onclick="setSchedMode(\'calendar\')">📅 달력 선택</button>',
    '  <button type="button" class="' + (mode === 'manual' ? 'active' : '') + '" onclick="setSchedMode(\'manual\')">✏️ 수기 작성</button>',
    '</div>'
  ].join('');

  if (mode === 'manual') {
    box.innerHTML = chips + [
      '<div class="sched-manual">',
      '  <textarea class="form-textarea" id="sched-manual-text" placeholder="예) 2026-08-10 ~ 2026-08-12&#10;2026-09-07 ~ 2026-09-09" oninput="parseManualSchedule(this.value)">'
      + manualText() + '</textarea>',
      '  <div class="sched-hint">한 줄에 하나씩. <b>2026-08-10</b> 또는 <b>2026-08-10 ~ 2026-08-12</b> 형식으로 적어주세요. 점(.)·슬래시(/)도 인식합니다.</div>',
      '</div>',
      schedFoot(type, false)
    ].join('');
    renderSchedSummary();
    return;
  }

  // 달력 아이콘뿐 아니라 입력칸 아무 곳이나 눌러도 달력이 열리게 한다
  const dateCell = (idx, key, val) =>
    dateInput(val, 'setSched(' + idx + ', \'' + key + '\', this.value)');

  let inner = '';
  if (type === '당일') {
    inner = '<div class="sched-row" style="grid-template-columns:62px 1fr"><span class="no">교육일</span>'
      + dateCell(0, 's', rows[0] && rows[0].s) + '</div>';
  } else if (type === '기간') {
    inner = '<div class="sched-row" style="grid-template-columns:62px 1fr auto 1fr auto"><span class="no">기간</span>'
      + dateCell(0, 's', rows[0] && rows[0].s)
      + '<span class="tilde">~</span>'
      + dateCell(0, 'e', rows[0] && rows[0].e)
      + '<span class="days">' + rangeDays(rows[0]) + '일</span></div>';
  } else {
    inner = rows.map(function (r, i) {
      return '<div class="sched-row">'
        + '<span class="no">' + (i + 1) + '차수</span>'
        + dateCell(i, 's', r.s)
        + '<span class="tilde">~</span>'
        + dateCell(i, 'e', r.e)
        + '<span class="days">' + rangeDays(r) + '일</span>'
        + '<button type="button" class="del" title="이 차수 삭제" onclick="removeSched(' + i + ')"'
        + (rows.length <= 1 ? ' disabled style="opacity:.3;cursor:default"' : '') + '>✖</button>'
        + '</div>';
    }).join('');
  }

  box.innerHTML = chips + inner + schedFoot(type, true);
  renderSchedSummary();
}

/**
 * 저장될 일정을 한 줄로 확정 표시한다.
 * 어차피 선택한 유형 하나만 저장되므로 경고는 필요 없다.
 */
function renderSchedSummary() {
  const box = document.getElementById('sched-summary');
  if (!box) return;

  const type = schedType();
  const rows = curDates(type).filter(function (r) { return r && r.s; });
  const days = rows.reduce(function (a, r) { return a + rangeDays(r); }, 0);

  // 어느 탭에 값이 있는지 탭 자체에 표시한다
  markSchedTabs();

  if (rows.length === 0) {
    box.innerHTML = '<div class="sched-final none">날짜를 선택해주세요</div>';
    return;
  }

  const text = rows.map(function (r) { return r.s === r.e ? r.s : r.s + '~' + r.e; }).join(', ');
  const cnt = type === '차수' ? rows.length + '차수 · ' : '';

  box.innerHTML = '<div class="sched-final">'
    + '<span class="tag">✓ ' + type + '</span>'
    + '<span class="body">' + text + '</span>'
    + '<span class="days">' + cnt + days + '일</span>'
    + '</div>';
}

/** 값이 들어있는 탭에 표시를 남긴다 */
function markSchedTabs() {
  const labels = document.querySelectorAll('.tab-radio label');
  labels.forEach(function (lb) {
    const input = lb.querySelector('input');
    if (!input) return;
    const has = (State.schedules[input.value] || []).some(function (r) { return r && r.s; });
    lb.classList.toggle('has-data', has);
  });
}
function schedFoot(type, showAdd) {
  const cnt = type === '차수' ? '총 <b>' + curDates(type).length + '</b>차수 · ' : '';
  return '<div class="sched-foot"><span class="sched-total">' + cnt
    + '교육일수 <b>' + totalDays() + '</b>일</span>'
    + (showAdd && type === '차수'
      ? '<button type="button" class="btn btn-outline btn-sm" onclick="addSched()">➕ 차수 추가</button>'
      : '')
    + '</div>';
}

/** 수기 입력 영역에 보여줄 텍스트 */
function manualText() {
  return curDates()
    .filter(function (r) { return r && r.s; })
    .map(function (r) { return r.s === r.e ? r.s : r.s + ' ~ ' + r.e; })
    .join('\n');
}

/** 수기 입력 파싱: 한 줄에 날짜 1개 또는 "시작 ~ 종료" */
function parseManualSchedule(text) {
  const out = [];
  String(text || '').split(/\r?\n/).forEach(function (line) {
    const found = line.match(/\d{4}\s*[-./]\s*\d{1,2}\s*[-./]\s*\d{1,2}/g);
    if (!found || !found.length) return;
    const norm = found.map(function (d) {
      const parts = d.split(/[-./]/).map(function (x) { return x.trim(); });
      return parts[0] + '-' + String(parts[1]).padStart(2, '0') + '-' + String(parts[2]).padStart(2, '0');
    });
    const a = norm[0];
    const b = norm.length > 1 ? norm[1] : norm[0];
    out.push(b < a ? { s: b, e: a } : { s: a, e: b });
  });

  State.schedules[schedType()] = out;
  const foot = document.querySelector('#sched-box .sched-foot');
  const type = schedType();
  if (foot) foot.outerHTML = schedFoot(type, false);
  renderSchedSummary();
}
function setSched(idx, key, val) {
  const r = curDates()[idx];
  if (!r) return;
  r[key] = val;
  if (key === 's') {
    // 시작일만 넣었거나 종료일이 시작일보다 빠르면 종료일을 맞춰준다
    if (!r.e || r.e < val) r.e = val;
  } else if (val && val < r.s) {
    r.s = val;
  }
  renderSchedule();
}

function addSched() {
  const rows = curDates();
  const last = rows[rows.length - 1];

  // 직전 차수 다음 날을 기본값으로. 직전이 비어 있으면 빈 칸으로 둔다.
  let next = '';
  if (last && last.e) {
    const d = new Date(Date.parse(last.e) + 86400000);
    next = d.toISOString().split('T')[0];
  }
  rows.push({ s: next, e: next });
  renderSchedule();
}

function removeSched(idx) {
  const rows = curDates();
  if (rows.length <= 1) return;
  rows.splice(idx, 1);
  renderSchedule();
}

/** 목록·상세에서 일정을 짧게 표기 */
function scheduleLabel(ranges) {
  if (!ranges || !ranges.length) return '-';
  const one = r => (r.s === r.e ? r.s : `${r.s}~${r.e}`);
  if (ranges.length === 1) return one(ranges[0]);
  return `${one(ranges[0])} 외 ${ranges.length - 1}차수`;
}

// ═══════════ 세금계산서 ═══════════
/** 지금 과정에 고른 회사 */
function currentCompany() {
  const el = document.getElementById('p-company');
  return (el && el.value) || DEFAULT_COMPANY;
}

/**
 * 서버에서 받은 계산서 한 장을 화면이 쓰는 꼴로 바꾼다.
 *
 * ⚠ 불러온 칸을 「그대로」 지켜야 한다.
 *   전에는 일곱 칸만 베껴 쓰고 나머지를 버렸다. 그래서 과정을 다시 열면
 *   항목(품목) · 받는 사람 · 발행회사 · 청구/영수 · 결제금액이 빈칸으로
 *   보였고, 그대로 저장하면 진짜로 지워졌다.
 *   계산서 번호(id)도 잃어서 [발행요청] 단추가 늘 잠겨 있었다.
 *   (대표님이 겪으심 2026-10-27)
 *
 * 바꿔야 하는 것은 금액뿐이다 — 저장될 때 공급가액·합계로 풀려서
 * 들어오므로, 적어 넣었던 입력값(amount)으로 되돌린다.
 */
function invoiceFromServer(x, vatMode) {
  const mode = x.vat_mode || vatMode || '별도';
  const amount = (mode === '포함' ? x.total_amount : x.supply_amount) + (x.discount || 0);

  const o = Object.assign({}, x);
  o._id = Math.random().toString(36).substr(2, 9);
  o.amount = amount;
  o.discount = x.discount || 0;
  o.vat_mode = x.vat_mode || '';
  o.is_manual = true;
  o.issue_date = x.issue_date || '';
  o.paid_date = x.paid_date || '';
  o.note = x.note || '';
  o.items = Array.isArray(x.items) ? x.items : [];
  o.recipients = Array.isArray(x.recipients) ? x.recipients : [];
  return o;
}

function newInvoice(amount, manual) {
  return {
    _id: Math.random().toString(36).substr(2, 9),
    // 발행회사 — 비워두면 과정의 회사를 따른다
    company: '',
    amount: amount || 0,   // 입력 금액
    discount: 0,           // 절사금액
    // 이 줄에 넣은 금액이 공급가액인지 부가세 포함가인지.
    // 비워두면 매출에서 고른 방식을 따른다.
    vat_mode: '',
    is_manual: !!manual,
    issue_date: '', note: '',
    // 입금일은 여기서 안 적는다. 왼쪽 메뉴 「세금계산서」에서 확인한다.
    paid_date: '',
    // 홈택스 발행 화면과 같은 칸들
    write_date: '',
    remark: '',
    pay_type: '청구',
    cash: 0, check_amount: 0, note_amount: 0, credit_amount: '',
    // 받는 사람 — 기본 1명, ＋로 2명까지
    recipients: [{ name: '', email: '', phone: '' }],
    // 항목 — 한 줄은 반드시 있어야 해서 빈 줄로 시작한다
    items: [newInvItem()]
  };
}

/** 이 계산서 줄에 적용할 부가세 처리 */
function invMode(it) {
  return it.vat_mode || State.vatMode;
}

/** 줄마다 부가세 기준 바꾸기 (부가세 포함가로 제안한 건을 별도가로 끊을 때) */
function setInvoiceMode(id, mode) {
  const it = State.invoices.find(function (x) { return x._id === id; });
  if (!it) return;
  it.vat_mode = mode;
  it.is_manual = true;   // 기준을 손댔으면 자동으로 덮어쓰지 않는다
  renderInvoices();
}

/** 계산서 한 줄의 자동 ↔ 수기 전환 */
function toggleInvoiceManual(id) {
  const it = State.invoices.find(function (x) { return x._id === id; });
  if (!it) return;
  it.is_manual = !it.is_manual;
  if (!it.is_manual) it.amount = saleBaseAmount();   // 자동으로 되돌리면 매출 금액으로
  renderInvoices();
}

/** 매출에서 가져올 기준 금액 (별도·면세 → 공급가액, 포함 → 총액) */
function saleBaseAmount() {
  return State.vatMode === '포함'
    ? parseNumber(document.getElementById('disp-total-with-vat')?.innerText)
    : parseNumber(document.getElementById('disp-total-sales')?.innerText);
}

/** 계산서가 1장이고 아직 손대지 않았으면 매출 금액을 그대로 채운다 */
function autoFillInvoice() {
  if (State.invoices.length !== 1) return;
  const it = State.invoices[0];
  if (it.is_manual) return;
  const base = saleBaseAmount();
  if (it.amount !== base) {
    it.amount = base;
    const el = document.getElementById('inva-' + it._id);
    if (el) el.value = base ? formatNumber(base) : '';
  }
}

/** 그 줄만 매출 금액으로 다시 맞춘다 */

/** 계산서 한 장의 계산 결과 */
function invCalc(it) {
  return computeTotals(it.amount, it.discount, invMode(it), State.discountBase);
}

function addInvoice() {
  // 아직 계산서에 안 담긴 잔액을 기본값으로
  const base = State.vatMode === '별도'
    ? parseNumber(document.getElementById('disp-total-sales')?.innerText)
    : parseNumber(document.getElementById('disp-total-with-vat')?.innerText);
  const used = State.invoices.reduce(function (a, x) { return a + (parseInt(x.amount) || 0); }, 0);
  State.invoices.push(newInvoice(Math.max(0, base - used), true));
  renderInvoices();
}

function removeInvoice(id) {
  if (State.invoices.length <= 1) return;
  const at = State.invoices.findIndex(function (x) { return x._id === id; });
  if (at < 0) return;
  const gone = State.invoices[at];
  State.invoices.splice(at, 1);
  offerUndo('세금계산서 ' + (at + 1) + '장째', function () {
    State.invoices.splice(at, 0, gone);
    renderInvoices();
  });
  renderInvoices();
}

function updateInvoice(id, field, value) {
  const it = State.invoices.find(function (x) { return x._id === id; });
  if (!it) return;
  it[field] = value;
  // 금액을 직접 고치면 그 뒤로는 자동으로 안 바꾼다
  if (field === 'amount') it.is_manual = true;
  if (field === 'amount' || field === 'discount' || field === 'paid_date') renderInvoiceTotals();
}

/** 계산서 합계 · 매출과의 차이 · 미수금 */
function renderInvoiceTotals() {
  const box = document.getElementById('invoice-summary');
  if (!box) return;

  let invTotal = 0, invSupply = 0, unpaid = 0;
  State.invoices.forEach(function (it) {
    const c = invCalc(it);
    invTotal += c.total;
    invSupply += c.supply;
    if (!it.paid_date) unpaid += c.total;

    const es = document.getElementById('invs-' + it._id);
    if (es) es.innerText = formatNumber(c.supply);
    const ev = document.getElementById('invv-' + it._id);
    if (ev) ev.innerText = formatNumber(c.vat);
    const et = document.getElementById('invt-' + it._id);
    if (et) et.innerText = formatNumber(c.total);
  });

  const saleTotal = parseNumber(document.getElementById('disp-total-with-vat')?.innerText);
  const diff = saleTotal - invTotal;

  let html = '<div class="inv-sum">'
    + '<span>계산서 합계 <b>' + formatNumber(invTotal) + '원</b></span>'
    + '<span class="sep">/</span>'
    + '<span>매출 총액 <b>' + formatNumber(saleTotal) + '원</b></span>';

  if (diff !== 0) {
    html += '<span class="warn">⚠ ' + (diff > 0
      ? '아직 ' + formatNumber(diff) + '원이 계산서에 안 담겼습니다'
      : formatNumber(-diff) + '원 초과입니다') + '</span>';
  } else {
    html += '<span class="okmark">✅ 일치</span>';
  }

  if (unpaid > 0) {
    html += '<span class="unpaid">미수금 <b>' + formatNumber(unpaid) + '원</b></span>';
  } else {
    html += '<span class="paid">입금 완료</span>';
  }
  html += '</div>';
  box.innerHTML = html;
}
// ═══════════ 매출 상세 ═══════════
// 금액 = 단가 × 수량1 × (수량2 있으면 그 값) × 차수
function saleAmount(it) {
  // 수기작성이면 직접 넣은 금액을 그대로 쓴다
  if (it.is_manual) return Math.max(0, parseInt(it.amount) || 0);
  const p = parseInt(it.unit_price) || 0;
  const q1 = parseFloat(it.qty1) || 0;
  const q2 = parseFloat(it.qty2) || 0;
  const se = parseFloat(it.sessions) || 1;
  return Math.round(p * q1 * (q2 > 0 ? q2 : 1) * se);
}

/** 매출 한 줄의 자동계산 ↔ 수기작성 전환 */
function toggleSaleManual(id) {
  const it = State.saleItems.find(function (x) { return x._id === id; });
  if (!it) return;
  if (!it.is_manual) {
    // 수기로 바꿀 때는 지금까지 계산된 금액을 시작값으로
    it.amount = saleAmount(it);
    it.is_manual = true;
  } else {
    it.is_manual = false;
  }
  renderSales();
}

function newSaleItem(category, subcategory) {
  const sub = venueSub(category, subcategory);
  return {
    _id: Math.random().toString(36).substr(2, 9),
    category, subcategory,
    name: '', unit_price: 0,
    qty1: 1, unit1: sub ? sub.f1 : '시간',
    qty2: sub && sub.f2 ? 1 : 0, unit2: sub && sub.f2 ? sub.f2 : '',
    sessions: 1, note: '',
    is_manual: false, amount: 0
  };
}

function addSaleItem(category, subcategory) {
  // 분류를 안 주면 마지막 줄과 같은 분류로, 그것도 없으면 인건비로 시작한다
  if (!category) {
    const last = State.saleItems[State.saleItems.length - 1];
    category = last ? last.category : '인건비';
    subcategory = last ? last.subcategory : '항목';
  }
  State.saleItems.push(newSaleItem(category, subcategory));
  renderSales();
}

function removeSaleItem(id) {
  const at = State.saleItems.findIndex(x => x._id === id);
  if (at < 0) return;
  const gone = State.saleItems[at];
  State.saleItems.splice(at, 1);
  offerUndo('매출 「' + (gone.name || gone.category || '줄') + '」', function () {
    State.saleItems.splice(at, 0, gone);
    renderSales();
  });
  renderSales();
}

function updateSale(id, field, value) {
  const it = State.saleItems.find(x => x._id === id);
  if (!it) return;
  it[field] = value;
  // 금액/합계만 즉시 갱신 — 전체 재렌더링하면 입력 포커스를 잃는다
  const cell = document.getElementById('sa-' + id);
  if (cell) cell.innerText = formatNumber(saleAmount(it)) + '원';
  refreshSaleTotals();
}

function catTotal(cat) {
  return State.saleItems.filter(x => x.category === cat).reduce((a, x) => a + saleAmount(x), 0);
}

/** 기본정보 하단 손익 요약을 갱신한다 */
function refreshPL() {
  const supply = parseNumber(document.getElementById('disp-total-sales')?.innerText);
  const vat = parseNumber(document.getElementById('disp-vat')?.innerText);
  const exp = parseNumber(document.getElementById('disp-total-expenses')?.innerText);
  const profit = supply - exp;

  const set = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = formatNumber(v) + '원'; };
  set('pl-sales', supply);
  set('pl-expenses', exp);
  set('pl-profit', profit);
  set('pl-vat', vat);
  set('pl-with-vat', supply + vat);

  const el = document.getElementById('pl-profit');
  if (el) el.style.color = profit < 0 ? 'var(--danger)' : 'var(--success)';

  // 이익률 = 이익 ÷ 총 매출(공급가액)
  const rate = document.getElementById('pl-rate');
  if (rate) {
    if (supply > 0) {
      const pct = (profit / supply) * 100;
      rate.innerText = '(' + (pct >= 0 ? '' : '−') + Math.abs(pct).toFixed(1) + '%)';
      rate.style.color = profit < 0 ? 'var(--danger)' : 'var(--pl-accent)';
    } else {
      rate.innerText = '';
    }
  }
}

function setVatMode(mode) {
  State.vatMode = mode;
  refreshSaleTotals();
  renderInvoices();     // 계산서도 같은 방식으로 다시 계산
}

function setDiscount(v) {
  State.discount = Math.max(0, parseInt(v) || 0);
  refreshSaleTotals();
}

function setDiscountBase(base) {
  State.discountBase = base;
  refreshSaleTotals();
  renderInvoices();
}

function refreshSaleTotals() {
  let supply = 0;
  const badges = document.querySelectorAll('#sale-tabs .tab-btn .amt-badge');
  Object.keys(SALE_DEFS).forEach((cat, i) => {
    const t = catTotal(cat);
    supply += t;
    const b = badges[i];
    if (b) {
      b.innerText = formatNumber(t);
      b.classList.toggle('zero', !t);
    }
  });
  const t = computeTotals(supply, State.discount, State.vatMode, State.discountBase);

  const set = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = formatNumber(v) + '원'; };
  set('disp-raw-sales', t.raw);
  set('disp-discount', t.discount);
  set('disp-total-sales', t.supply);
  set('disp-vat', t.vat);
  set('disp-total-with-vat', t.total);

  const dl = document.getElementById('line-discount');
  if (dl) dl.style.display = t.discount > 0 ? '' : 'none';
  const dlb = document.getElementById('lb-discount');
  if (dlb) dlb.innerText = '절사 (' + (State.discountBase === '총액' ? '부가세 포함' : '부가세 별도') + ' 기준)';

  const lb = document.getElementById('lb-vat');
  if (lb) {
    lb.innerText = State.vatMode === '면세' ? '부가세 (면세)'
      : State.vatMode === '포함' ? '부가세 (총액에 포함)' : '부가세 (10%)';
  }

  autoFillInvoice();
  renderInvoiceTotals();
  calcAllExpenses();
  checkExpenseGaps();
}

// 기존 호출부 호환
function calcSales() { refreshSaleTotals(); }

/** 매입과 같은 모양의 빈 상태 안내 */
function emptyBox(text) {
  return '<div class="empty-state" style="padding:1.5rem"><p>' + text + '</p></div>';
}

function renderSales() {
  const box = document.getElementById('sales-container');
  if (!box) return;

  // 분류별 소계 — 탭은 없앴지만 매출1·2·3 금액은 늘 보이게 한다
  const sums = Object.keys(SALE_DEFS).map(function (cat) {
    const t = catTotal(cat);
    return '<span class="sum-chip' + (t ? '' : ' zero') + '">'
      + '<i>' + SALE_DEFS[cat].tab + '</i><b>' + formatNumber(t) + '</b></span>';
  }).join('');

  const items = State.saleItems;
  const body = items.length
    ? items.map(saleRow).join('')
    : emptyBox('항목이 없습니다. 아래 추가 버튼을 눌러주세요.');

  box.innerHTML =
      '<div class="tab-desc"><span class="ico">💡</span><span>'
    + '줄 왼쪽에서 <b>분류</b>를 고르고 내용을 적으세요.<br>'
    + '계산 <code>단가 × 수량 × 차수</code> · 계산이 안 맞으면 줄 오른쪽 <b>[∑ 수기]</b> 로 금액을 직접 넣으세요.'
    + '</span></div>'
    + '<div class="sale-sums">' + sums + '</div>'
    + '<div class="sale-body">' + body + '</div>'
    + '<button type="button" class="btn btn-outline btn-block" style="margin-top:0.85rem"'
    + ' onclick="addSaleItem()">➕ 매출 항목 추가</button>';

  refreshSaleTotals();
}

/** 줄 왼쪽의 분류 선택칸 */
function salePick(it) {
  const cur = it.category + '|' + (it.subcategory || '항목');
  return '<div class="s-pick"><span class="cap">분류</span>'
    + '<select class="form-select" onchange="changeSaleCat(\'' + it._id + '\', this.value)">'
    + SALE_PICKS.map(function (p) {
        return '<option value="' + p.v + '"' + (p.v === cur ? ' selected' : '') + '>' + p.label + '</option>';
      }).join('')
    + '</select></div>';
}

/** 분류를 바꾸면 계산식이 달라져 줄 전체를 다시 그린다 */
function changeSaleCat(id, value) {
  const it = State.saleItems.find(function (x) { return x._id === id; });
  if (!it) return;
  it.category = value;
  it.subcategory = '항목';
  refreshSaleTotals();
}
/**
 * 매출 한 줄.
 *   basic : 항목 | 단가 × 수량+단위 × 차수 = 금액
 *   venue : 항목 | 단가 × f1 [× f2] × 차수 = 금액 | 비고
 */
/**
 * 매출 한 줄.
 *
 * 예전에는 칸 수가 정해진 CSS 그리드였다. 칸을 하나 더하면 뒤가 전부 밀려서
 * 라벨과 입력칸이 어긋났다. 그래서 각 칸이 스스로 제 너비를 갖는 구조로 바꿨다.
 * 칸을 더하거나 빼도 다른 칸은 그대로다.
 */
function saleRow(it) {
  const id = it._id;
  const f = function (cls, cap, inner) {
    return '<div class="rf ' + cls + '"><span class="cap">' + cap + '</span>' + inner + '</div>';
  };
  const text = function (field, val, ph) {
    return '<input type="text" class="form-input" placeholder="' + (ph || '') + '" value="'
      + String(val == null ? '' : val).replace(/"/g, '&quot;') + '"'
      + ' oninput="updateSale(\'' + id + '\',\'' + field + '\', this.value)">';
  };
  /*
   * 수량 칸.
   * step="1" — 화살표는 1씩 움직인다. 전에는 0.5 씩이라 1을 올리려면
   * 두 번 눌러야 했다.
   *
   * 3.5 시간처럼 중간 값은 손으로 적으면 그대로 들어간다.
   * (step 과 안 맞는 값도 브라우저가 지우지 않는다. 이 화면은 form 검사를
   *  쓰지 않고, 잘못된 값이라고 빨갛게 칠하는 규칙도 없다 — 확인했다)
   * (대표님 지시 2026-10-27)
   */
  const num = function (field, val, step) {
    return '<input type="number" step="' + (step || '1') + '" min="0" class="form-input ta-r" value="' + (val || 0) + '"'
      + ' oninput="updateSale(\'' + id + '\',\'' + field + '\', this.value)">';
  };

  const out = ['<div class="rline' + (it.is_manual ? ' manual' : '') + '">'];

  // 분류
  out.push(f('rf-pick', '분류',
    '<select class="form-select" onchange="changeSaleCat(\'' + id + '\', this.value)">'
    + SALE_PICKS.map(function (p) {
        return '<option value="' + p.v + '"' + (p.v === it.category ? ' selected' : '') + '>' + p.label + '</option>';
      }).join('')
    + '</select>'));

  // 항목명
  out.push(f('rf-name', '항목명', text('name', it.name, '예) 리더십 과정, 교재, 숙소')));

  if (it.is_manual) {
    out.push(f('rf-money', '금액 (직접 입력)',
      '<input type="text" class="form-input ta-r strong" value="' + formatNumber(it.amount) + '"'
      + ' oninput="updateSale(\'' + id + '\',\'amount\', parseNumber(this.value))"'
      + ' onblur="this.value=formatNumber(parseNumber(this.value))">'));
  } else {
    out.push(f('rf-money', '단가',
      '<input type="text" class="form-input ta-r" value="' + formatNumber(it.unit_price) + '"'
      + ' oninput="updateSale(\'' + id + '\',\'unit_price\', parseNumber(this.value))"'
      + ' onblur="this.value=formatNumber(parseNumber(this.value))">'));
    out.push('<div class="rop">×</div>');
    out.push(f('rf-qty', '수량', num('qty1', it.qty1)));
    out.push(f('rf-unit', '단위',
      '<select class="form-select" onchange="updateSale(\'' + id + '\',\'unit1\', this.value)">'
      + QTY_UNITS.map(function (u) {
          return '<option value="' + u + '"' + (it.unit1 === u ? ' selected' : '') + '>' + u + '</option>';
        }).join('') + '</select>'));
    out.push('<div class="rop">×</div>');
    out.push(f('rf-qty', '차수', num('sessions', it.sessions, '1')));
    out.push('<div class="rop">=</div>');
  }

  out.push('<div class="rf rf-amt"><span class="cap">금액</span>'
    + '<b id="sa-' + id + '">' + formatNumber(saleAmount(it)) + '원</b></div>');

  out.push(f('rf-note', '비고', text('note', it.note, '')));

  // 도구 — 평소엔 흐리게, 줄에 마우스를 올리면 또렷해진다
  out.push('<div class="rtools">'
    + '<button type="button" class="rtool' + (it.is_manual ? ' on' : '') + '"'
    +   ' title="' + (it.is_manual ? '자동계산으로 되돌리기' : '금액을 직접 넣기 (수기작성)') + '"'
    +   ' onclick="toggleSaleManual(\'' + id + '\')">'
    +   (it.is_manual ? '✎ 수기' : '∑ 수기') + '</button>'
    + '<button type="button" class="rtool del" title="이 줄 삭제"'
    +   ' onclick="removeSaleItem(\'' + id + '\')">✖</button>'
    + '</div>');

  out.push('</div>');
  return out.join('');
}

// ═══════════ 매출 ↔ 매입 대응 점검 ═══════════
// 매출에 잡아둔 항목인데 매입이 비어 있으면 지급 누락 가능성이 있다.
// 매출 분류 → 짝이 되는 매입 분류
// (연수원비는 협력사(운영비)로 지급되기도 해 대조에서 제외)
const GAP_MAP = {
  인건비: { expCat: '강의', msg: '인건비(강의)' },
  운영비: { expCat: '협력사(운영비)', msg: '운영비' }
};

function findExpenseGaps() {
  const gaps = [];
  Object.keys(GAP_MAP).forEach(function (cat) {
    const def = GAP_MAP[cat];
    const saleHas = State.saleItems.some(function (x) { return x.category === cat && saleAmount(x) > 0; });
    const expHas = State.expenseItems.some(function (x) {
      return x.category === def.expCat && (parseInt(x.total_amount) || 0) > 0;
    });
    if (saleHas && !expHas) gaps.push(def);
  });
  return gaps;
}

function checkExpenseGaps() {
  const box = document.getElementById('exp-gap-warn');
  if (!box) return;
  const gaps = findExpenseGaps();

  document.querySelectorAll('#exp-tabs .tab-btn').forEach(b => b.classList.remove('missing'));
  if (!gaps.length) { box.innerHTML = ''; return; }

  gaps.forEach(g => {
    document.querySelectorAll('#exp-tabs .tab-btn').forEach(b => {
      if (b.textContent.trim() === g.expCat) b.classList.add('missing');
    });
  });

  const names = gaps.map(g => '<b>' + g.msg + '</b>').join(', ');
  box.innerHTML = [
    '<div class="warn-box">',
    '  <span class="ico">⚠️</span>',
    '  <span class="txt">매출에 ' + names + ' 항목이 있는데 <b>매입이 비어 있습니다.</b><br>',
    '  지급할 대상이 누락되지 않았는지 확인해주세요. (아래 빨간 탭)</span>',
    '</div>'
  ].join('');
}

function addExpenseItem(category) {
  // 분류를 안 주면 마지막 줄과 같은 분류로, 그것도 없으면 첫 분류로 시작한다
  if (!category) {
    const last = State.expenseItems[State.expenseItems.length - 1];
    category = last ? last.category : EXP_CATEGORIES[0].key;
  }
  const def = expDef(category);
  State.expenseItems.push({
    _id: Math.random().toString(36).substr(2, 9),
    category: category,
    name: '', affiliation: '',
    hours: 0, quantity: 1, unit: def.defaultUnit, sessions: 1, unit_price: 0,
    is_manual: false, total_amount: 0,
    // 분류마다 통상적인 세율을 미리 넣어둔다 (바꿀 수 있음)
    tax_type: def.defaultTax, tax_amount: 0, payment_amount: 0,
    note: '', payment_date: '', card_last4: ''
  });
  renderExpenseItems();
}

function removeExpenseItem(id) {
  const at = State.expenseItems.findIndex(e => e._id === id);
  if (at < 0) return;
  const gone = State.expenseItems[at];
  State.expenseItems.splice(at, 1);
  offerUndo('매입 「' + (gone.name || gone.category || '줄') + '」', function () {
    State.expenseItems.splice(at, 0, gone);
    renderExpenseItems();
    calcAllExpenses();
  });
  renderExpenseItems();
  calcAllExpenses();
}

function updateExp(id, field, value) {
  const item = State.expenseItems.find(e => e._id === id);
  if (!item) return;
  item[field] = value;
  
  // 자동 계산 처리
  if (['quantity', 'unit', 'sessions', 'unit_price', 'tax_type', 'is_manual', 'total_amount'].includes(field)) {
    if (!item.is_manual) {
      // 매출과 같은 방식: 단가 × 수량 × 차수
      const qty = parseFloat(item.quantity) || 0;
      const sess = parseFloat(item.sessions) || 1;
      item.total_amount = Math.round((parseInt(item.unit_price) || 0) * qty * sess);
    }
    
    // 세금 계산 (원천징수는 차감, 세금계산서 과세는 부가세 가산)
    const r = calcTax(item.total_amount, item.tax_type);
    item.tax_amount = r.tax;
    item.payment_amount = r.payment;
  }
  
  // 전체 다시 렌더링하면 입력 포커스 잃음. 여기서는 값만 업데이트하고, blur 이벤트나 별도 트리거로 렌더해야 함.
  // 간단히 DOM 직접 조작
  if (!item.is_manual && ['quantity', 'sessions', 'unit_price'].includes(field)) {
    const el = document.getElementById(`exp-${id}-total`);
    if(el) el.innerText = formatNumber(item.total_amount);
  }
  if (field !== 'total_amount') {
    const taxEl = document.getElementById(`exp-${id}-tax`);
    if(taxEl) taxEl.innerText = formatNumber(item.tax_amount);
    const payEl = document.getElementById(`exp-${id}-pay`);
    if(payEl) payEl.innerText = formatNumber(item.payment_amount);
  }
  
  calcAllExpenses();
}

function renderExpenseItems() {
  const container = document.getElementById('expense-container');
  if (!container) return;

  // 분류별 소계 — 탭은 없앴지만 분류별 금액은 늘 보이게 한다
  const sums = EXP_CATEGORIES.map(function (c) {
    const t = State.expenseItems
      .filter(function (e) { return e.category === c.key; })
      .reduce(function (a, e) { return a + (parseInt(e.total_amount) || 0); }, 0);
    return '<span class="sum-chip' + (t ? '' : ' zero') + '">'
      + '<i>' + c.key + '</i><b>' + formatNumber(t) + '</b></span>';
  }).join('');

  const items = State.expenseItems;

  container.innerHTML =
      '<div class="sale-sums">' + sums + '</div>'
    + (items.length
        ? '<div class="expense-items">' + items.map(expenseCard).join('') + '</div>'
        : '<div class="empty-state" style="padding:1.5rem"><p>매입 항목이 없습니다. 아래 추가 버튼을 눌러주세요.</p></div>')
    + '<button type="button" class="btn btn-outline btn-block" style="margin-top:0.85rem"'
    + ' onclick="addExpenseItem()">➕ 매입 항목 추가</button>'
    + '<datalist id="card-list">'
    + (CARD_LIST || []).map(c => '<option value="' + esc(c) + '">').join('')
    + '</datalist>';
}

/** 매입 줄의 분류를 바꾼다 — 기본 단위·세율도 그 분류에 맞춘다 */
function changeExpCat(id, value) {
  const it = State.expenseItems.find(function (x) { return x._id === id; });
  if (!it) return;
  const def = expDef(value);
  it.category = value;
  if (!it.unit) it.unit = def.defaultUnit;
  it.tax_type = def.defaultTax;
  if (value !== '법인카드(교육운영)') it.card_last4 = '';
  renderExpenseItems();
  calcAllExpenses();
}

/** 전에 쓴 법인카드 뒤 4자리 (입력칸 자동완성용) */
let CARD_LIST = [];
async function loadCardList() {
  try {
    // 등록한 카드 + 전에 쓴 번호를 합쳐 받는다
    const r = await API.getCards();
    CARD_LIST = r.all || [];
  } catch (e) { /* 없으면 자동완성만 비어 있다 */ }
}

/** 매입 한 건. 이름줄 + 계산줄(수량×단가=총액→세율→세금→지급액→입금일) 2줄로 압축 */
/**
 * 매입 한 줄 — 매출과 같은 구조.
 * 칸마다 제 너비를 가지므로 칸을 더하거나 빼도 다른 칸이 밀리지 않는다.
 */
function expenseCard(item) {
  const id = item._id;
  const cat = item.category;
  const tdef = taxDef(item.tax_type);
  const taxLabel = tdef.mode === 'add' ? '부가세 (+)'
    : tdef.mode === 'included' ? '부가세 (포함)'
    : tdef.mode === 'none' ? '세금 없음' : '원천징수 (−)';

  const f = function (cls, cap, inner) {
    return '<div class="rf ' + cls + '"><span class="cap">' + cap + '</span>' + inner + '</div>';
  };

  const out = ['<div class="rline' + (item.is_manual ? ' manual' : '') + '">'];

  // 분류
  out.push(f('rf-pick', '분류',
    '<select class="form-select" onchange="changeExpCat(\'' + id + '\', this.value)">'
    + EXP_CATEGORIES.map(function (c) {
        return '<option value="' + esc(c.key) + '"' + (c.key === cat ? ' selected' : '') + '>'
          + esc(c.key) + '</option>';
      }).join('')
    + '</select>'));

  // 이름 (자동완성)
  out.push('<div class="rf rf-name autocomplete-wrapper"><span class="cap">이름 / 업체명</span>'
    + '<input type="text" class="form-input" placeholder="입력" value="' + esc(item.name || '') + '"'
    + ' oninput="updateExp(\'' + id + '\', \'name\', this.value)"'
    + ' onkeyup="debounceNameSearch(this, \'' + id + '\', \'' + cat + '\')">'
    + '<div id="auto-inst-' + id + '" class="autocomplete-list"></div></div>');

  out.push(f('rf-name', '소속',
    '<input type="text" class="form-input" id="affil-' + id + '" value="' + esc(item.affiliation || '') + '"'
    + ' oninput="updateExp(\'' + id + '\', \'affiliation\', this.value)">'));

  // 법인카드일 때만
  if (cat === '법인카드(교육운영)') {
    out.push(f('rf-card', '카드 뒤 4자리',
      '<input type="text" class="form-input card4" inputmode="numeric" maxlength="4" placeholder="0000"'
      + ' list="card-list" value="' + esc(item.card_last4 || '') + '"'
      + ' oninput="this.value=this.value.replace(/[^0-9]/g,\'\').slice(0,4);'
      + ' updateExp(\'' + id + '\', \'card_last4\', this.value)">'));
  }

  // 금액
  if (item.is_manual) {
    out.push(f('rf-money', '총액 (직접 입력)',
      '<input type="text" class="form-input ta-r strong" value="' + formatNumber(item.total_amount) + '"'
      + ' oninput="updateExp(\'' + id + '\', \'total_amount\', parseNumber(this.value))"'
      + ' onblur="this.value=formatNumber(parseNumber(this.value))">'));
  } else {
    out.push(f('rf-money', '단가',
      '<input type="text" class="form-input ta-r" id="up-' + id + '" value="' + formatNumber(item.unit_price) + '"'
      + ' oninput="updateExp(\'' + id + '\', \'unit_price\', parseNumber(this.value))"'
      + ' onblur="this.value=formatNumber(parseNumber(this.value))">'));
    out.push('<div class="rop">×</div>');
    out.push(f('rf-qty', '수량',
      '<input type="number" step="1" min="0" class="form-input ta-r" value="' + (item.quantity || 0) + '"'
      + ' oninput="updateExp(\'' + id + '\', \'quantity\', this.value)">'));
    out.push(f('rf-unit', '단위',
      '<select class="form-select" onchange="updateExp(\'' + id + '\', \'unit\', this.value)">'
      + QTY_UNITS.map(function (u) {
          return '<option value="' + u + '"' + (item.unit === u ? ' selected' : '') + '>' + u + '</option>';
        }).join('') + '</select>'));
    out.push('<div class="rop">×</div>');
    out.push(f('rf-qty', '차수',
      '<input type="number" step="1" min="1" class="form-input ta-r" value="' + (item.sessions || 1) + '"'
      + ' oninput="updateExp(\'' + id + '\', \'sessions\', this.value)">'));
    out.push('<div class="rop">=</div>');
    out.push('<div class="rf rf-amt"><span class="cap">총액</span>'
      + '<b id="exp-' + id + '-total">' + formatNumber(item.total_amount) + '</b></div>');
  }

  // 세율 → 세금 → 실지급액
  out.push(f('rf-tax', '세율 처리',
    '<select class="form-select" id="tax-' + id + '" onchange="updateExp(\'' + id + '\', \'tax_type\', this.value)">'
    + TAX_TYPES.map(function (t) {
        return '<option value="' + t.key + '"' + (tdef.key === t.key ? ' selected' : '') + '>' + t.label + '</option>';
      }).join('') + '</select>'));

  out.push('<div class="rf rf-amt sub"><span class="cap">' + taxLabel + '</span>'
    + '<b id="exp-' + id + '-tax">' + formatNumber(item.tax_amount) + '</b></div>');
  out.push('<div class="rop">→</div>');
  out.push('<div class="rf rf-amt pay"><span class="cap">실 지급액</span>'
    + '<b id="exp-' + id + '-pay">' + formatNumber(item.payment_amount) + '</b></div>');

  out.push(f('rf-date', '지급 일자',
    dateInput(item.payment_date, 'updateExp(\'' + id + '\', \'payment_date\', this.value)')));

  out.push(f('rf-note', '비고',
    '<input type="text" class="form-input" placeholder="특이사항" value="' + esc(item.note || '') + '"'
    + ' oninput="updateExp(\'' + id + '\', \'note\', this.value)">'));

  out.push('<div class="rtools">'
    + '<button type="button" class="rtool' + (item.is_manual ? ' on' : '') + '"'
    +   ' title="' + (item.is_manual ? '자동계산으로 되돌리기' : '총액을 직접 넣기 (수기작성)') + '"'
    +   ' onclick="updateExp(\'' + id + '\', \'is_manual\', ' + (item.is_manual ? 'false' : 'true')
    +   '); renderExpenseItems();">'
    +   (item.is_manual ? '✎ 수기' : '∑ 수기') + '</button>'
    + '<button type="button" class="rtool del" title="이 줄 삭제"'
    +   ' onclick="removeExpenseItem(\'' + id + '\')">✖</button>'
    + '</div>');

  out.push('</div>');
  return out.join('');
}

function calcAllExpenses() {
  const total = State.expenseItems.reduce((acc, cur) => acc + (parseInt(cur.total_amount) || 0), 0);
  const el = document.getElementById('disp-total-expenses');
  if (el) el.innerText = formatNumber(total) + '원';
  refreshPL();
  checkExpenseGaps();
}

// --- 자동완성 헬퍼 ---
function setupAmountInputs() {
  document.addEventListener('blur', (e) => {
    if(e.target.classList.contains('amount-input')) {
      e.target.value = formatNumber(parseNumber(e.target.value));
    }
  }, true);
}

/**
 * 담당자 등록/수정 창.
 * 과정 등록 화면과 고객사 관리 화면 양쪽에서 쓴다.
 * @param {number} clientId
 * @param {number|null} contactId  null 이면 신규
 * @param {object|null} known      이미 알고 있는 담당자 정보 (없으면 서버에서 가져온다)
 * @param {function|null} after    저장 후 실행 (없으면 고객사 관리 화면을 다시 연다)
 */
async function openContactEditor(clientId, contactId, known, after) {
  if (!clientId) { showToast('고객사를 먼저 선택해주세요.', 'warning'); return; }

  let target = known || null;
  if (contactId && !target) {
    try {
      const list = (await API.getContacts(clientId)).contacts;
      target = list.find(function (c) { return c.id === contactId; }) || null;
    } catch (e) {}
  }

  const clientName = (State.clientList.find(function (c) { return c.id === Number(clientId); }) || {}).name
    || (document.getElementById('p-client-name') || {}).value || '';

  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.dataset.role = 'contact-editor';
  div.innerHTML = [
    '<div class="modal" style="max-width:460px">',
    '  <div class="modal-header">',
    '    <h3>' + (contactId ? '담당자 수정' : '담당자 신규 등록') + '</h3>',
    '    <button class="modal-close" onclick="this.closest(\'.modal-overlay\').remove()">✖</button>',
    '  </div>',
    '  <div class="modal-body">',
    '    <div class="info-box">고객사 <b>' + esc(clientName) + '</b> 의 담당자입니다.<br>',
    '    🔒 이메일·연락처는 개인정보라 저장하지 않습니다.</div>',
    '    <div class="form-group"><label class="form-label form-required">담당자 이름</label>',
    '      <input type="text" id="c-name" class="form-input" placeholder="예) 김민수" value="'
    + esc(target ? target.name : '') + '"></div>',
    '    <div class="fgrid">',
    '      <div class="form-group f6"><label class="form-label">직급 (선택)</label>',
    '        <input type="text" id="c-position" class="form-input" placeholder="예) 과장" value="'
    + esc(target ? target.position : '') + '"></div>',
    '      <div class="form-group f6"><label class="form-label">부서 (선택)</label>',
    '        <input type="text" id="c-department" class="form-input" placeholder="예) 인재개발팀" value="'
    + esc(target ? target.department : '') + '"></div>',
    '    </div>',
    '  </div>',
    '  <div class="modal-footer">',
    '    <button class="btn btn-ghost" onclick="this.closest(\'.modal-overlay\').remove()">취소</button>',
    '    <button class="btn btn-primary" onclick="submitContact(' + clientId + ',' + (contactId || 'null') + ')">저장</button>',
    '  </div>',
    '</div>'
  ].join('');
  document.body.appendChild(div);
  CONTACT_AFTER = after || null;
  setTimeout(function () { const el = document.getElementById('c-name'); if (el) el.focus(); }, 50);
}

let CONTACT_AFTER = null;

async function submitContact(clientId, contactId) {
  const data = {
    name: document.getElementById('c-name').value.trim(),
    position: document.getElementById('c-position').value.trim(),
    department: document.getElementById('c-department').value.trim()
  };
  if (!data.name) { showToast('담당자 이름을 입력해주세요.', 'warning'); return; }

  try {
    let newId = contactId;
    if (contactId) {
      await API.updateContact(contactId, data);
    } else {
      data.client_id = clientId;
      const r = await API.createContact(data);
      newId = r.contact.id;
    }
    showToast('저장되었습니다.', 'success');

    const box = document.querySelector('.modal-overlay[data-role="contact-editor"]');
    if (box) box.remove();

    if (CONTACT_AFTER) { const f = CONTACT_AFTER; CONTACT_AFTER = null; f(newId); }
    else {
      const o = document.querySelector('.modal-overlay'); if (o) o.remove();
      openClientModal(clientId);
    }
  } catch (e) { showToast(e.message, 'error'); }
}
// ═══════════ 고객사 관리 ═══════════
async function renderClients() {
  try {
    const res = await API.getClients();
    State.clientList = res.clients;

    // 목록이 길어 고칠 곳을 찾기 어려우므로 검색을 둔다
    const shown = res.clients.filter(function (c) { return findMatch('clients', [c.name]); });

    document.getElementById('main-content').innerHTML = [
      '<div class="page-header">',
      '  <div><h2>고객사 관리</h2>',
      '    <div class="subtitle">고객사와 담당자를 등록·수정합니다. 과정 등록 시 자동완성됩니다.</div></div>',
      '  <button class="btn btn-primary" onclick="openClientModal()">＋ 고객사 등록</button>',
      '</div>',
      findBar('clients', '고객사명 검색', shown.length, res.clients.length),
      '<div class="table-container">',
      '  <table class="data-table">',
      '    <thead><tr><th>고객사명</th><th>담당자</th><th>과정</th><th>누적 매출</th><th></th></tr></thead>',
      '    <tbody>',
      (shown.length === 0
        ? '<tr><td colspan="5"><div class="empty-state" style="padding:2rem"><p>'
          + (FIND.clients ? '찾는 고객사가 없습니다.' : '등록된 고객사가 없습니다.') + '</p></div></td></tr>'
        : shown.map(function (c) {
          return '<tr>'
            + '<td style="font-weight:600">' + esc(c.name) + '</td>'
            + '<td>' + (c.contact_count > 0
              ? '<span class="badge badge-active">' + c.contact_count + '명</span>'
              : '<span style="color:var(--text-muted); font-size:0.85rem">없음</span>') + '</td>'
            + '<td style="color:var(--text-secondary)">' + c.project_count + '건</td>'
            + '<td class="amount-cell">' + formatNumber(c.total_sales) + '</td>'
            + '<td><button class="btn btn-ghost btn-sm" onclick="openClientModal(' + c.id + ')">✎ 수정 · 담당자</button></td>'
            + '</tr>';
        }).join('')),
      '    </tbody>',
      '  </table>',
      '</div>'
    ].join('');
  } catch (e) { showToast(e.message, 'error'); }
}

/** 고객사 등록/수정 + 담당자 관리 */
async function openClientModal(id) {
  const t = id ? State.clientList.find(function (c) { return c.id === id; }) : null;
  const isNew = !t;

  let contacts = [];
  if (id) {
    try { contacts = (await API.getContacts(id)).contacts; } catch (e) {}
  }

  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.innerHTML = [
    '<div class="modal" style="max-width:560px">',
    '  <div class="modal-header">',
    '    <h3>' + (isNew ? '고객사 등록' : '고객사 수정') + '</h3>',
    '    <button class="modal-close" onclick="this.closest(\'.modal-overlay\').remove()">✖</button>',
    '  </div>',
    '  <div class="modal-body">',
    '    <div class="form-group"><label class="form-label form-required">고객사명</label>',
    '      <input type="text" id="cl-name" class="form-input" placeholder="예) 기아자동차" value="'
    + esc(t ? t.name : '') + '"></div>',
    (isNew
      ? '<div class="tab-desc" style="margin:0"><span class="ico">💡</span><span>먼저 고객사를 저장하면 담당자를 추가할 수 있습니다.</span></div>'
      : [
        '<div class="inv-block" style="margin-top:1.1rem; padding-top:1rem">',
        '  <div class="inv-head"><span class="t">담당자</span>',
        '    <button type="button" class="btn btn-outline btn-sm" onclick="addClientContact(' + id + ')">＋ 담당자 추가</button></div>',
        '  <div style="margin-top:0.7rem">',
        (contacts.length === 0
          ? '<div class="empty-state" style="padding:1.2rem"><p>등록된 담당자가 없습니다.</p></div>'
          : contacts.map(function (ct) {
            return '<div class="ct-row">'
              + '<span class="nm">' + esc(ct.name) + '</span>'
              + '<span class="ps">' + esc(ct.position || '-') + '</span>'
              + '<span class="dp">' + esc(ct.department || '-') + '</span>'
              + '<button type="button" class="btn btn-ghost btn-sm" onclick="editClientContact(' + id + ',' + ct.id + ')">✎</button>'
              + '<button type="button" class="del" onclick="dropClientContact(' + id + ',' + ct.id + ')" title="제외">✖</button>'
              + '</div>';
          }).join('')),
        '  </div>',
        '</div>'
      ].join('')),
    '  </div>',
    '  <div class="modal-footer">',
    '    <button class="btn btn-ghost" onclick="this.closest(\'.modal-overlay\').remove()">닫기</button>',
    '    <button class="btn btn-primary" onclick="saveClient(' + (id || 'null') + ')">저장</button>',
    '  </div>',
    '</div>'
  ].join('');
  document.body.appendChild(div);
  setTimeout(function () { const el = document.getElementById('cl-name'); if (el) el.focus(); }, 50);
}

async function saveClient(id) {
  const name = document.getElementById('cl-name').value.trim();
  if (!name) { showToast('고객사명을 입력해주세요.', 'warning'); return; }
  try {
    let newId = id;
    if (id) {
      await API.updateClient(id, { name: name });
    } else {
      const r = await API.createClient({ name: name });
      newId = r.client.id;
    }
    showToast('저장되었습니다.', 'success');
    const o = document.querySelector('.modal-overlay'); if (o) o.remove();
    await renderClients();
    // 새로 만들었으면 담당자를 바로 넣을 수 있게 다시 연다
    if (!id) openClientModal(newId);
  } catch (e) { showToast(e.message, 'error'); }
}

/** 고객사 관리 화면에서 담당자 추가 */
function addClientContact(clientId) {
  openContactEditor(clientId, null);
}
function editClientContact(clientId, contactId) {
  openContactEditor(clientId, contactId);
}

async function dropClientContact(clientId, contactId) {
  if (!confirm('이 담당자를 목록에서 제외할까요?\n이미 등록된 과정의 기록은 그대로 남습니다.')) return;
  try {
    await API.deleteContact(contactId);
    showToast('제외했습니다.', 'success');
    const o = document.querySelector('.modal-overlay'); if (o) o.remove();
    openClientModal(clientId);
  } catch (e) { showToast(e.message, 'error'); }
}
// ═══════════ 협력사 관리 ═══════════
async function renderPartners() {
  if (!API.isAdmin()) return showToast('권한이 없습니다.', 'error');
  try {
    const res = await API.getPartners();
    State.partners = res.partners;
    const shown = res.partners.filter(function (p) {
      return findMatch('partners', [p.name, p.category, p.note, p.default_tax_type]);
    });

    document.getElementById('main-content').innerHTML = [
      '<div class="page-header">',
      '  <div><h2>협력사 관리</h2>',
      '    <div class="subtitle">교보재·버스·연수원 등 운영 관련 업체 — 매입 입력 시 자동완성됩니다</div></div>',
      '  <button class="btn btn-primary" onclick="openPartnerModal()">＋ 협력사 등록</button>',
      '</div>',
      findBar('partners', '협력사명 · 분류 검색', shown.length, res.partners.length),
      '<div class="table-container">',
      '  <table class="data-table">',
      '    <thead><tr><th>ID</th><th>협력사명</th><th>분류</th><th>기본세율</th><th>비고</th><th></th></tr></thead>',
      '    <tbody>',
      (shown.length === 0
        ? '<tr><td colspan="6"><div class="empty-state" style="padding:2rem"><p>'
          + (FIND.partners ? '찾는 협력사가 없습니다.' : '등록된 협력사가 없습니다.') + '</p></div></td></tr>'
        : shown.map(function (p) {
          return '<tr>'
            + '<td style="color:var(--text-muted)">' + p.id + '</td>'
            + '<td style="font-weight:600">' + esc(p.name) + '</td>'
            + '<td>' + esc(p.category || '-') + '</td>'
            + '<td><span class="badge badge-admin">' + esc(p.default_tax_type || '-') + '</span></td>'
            + '<td style="font-size:0.85rem; color:var(--text-secondary)">' + esc(p.note || '-') + '</td>'
            + '<td><button class="btn btn-ghost btn-sm" onclick="openPartnerModal(' + p.id + ')">✎ 수정</button></td>'
            + '</tr>';
        }).join('')),
      '    </tbody>',
      '  </table>',
      '</div>'
    ].join('');
  } catch (e) { showToast(e.message, 'error'); }
}

/* ═══════════ 개인정보 가리기 ═══════════
 *
 * 인터넷에 열어 두고 쓰기 때문에 이메일·연락처는 기본으로 가려 둡니다.
 *   관리자가 아닌 사람 → 서버가 가린 값만 보내므로 펼칠 수 없습니다
 *   관리자            → 눈 버튼을 누르면 펼쳐집니다 (다시 누르면 가려집니다)
 */
const SHOWN = {};        // 펼쳐 놓은 칸
let REDRAW = null;       // 지금 보고 있는 화면을 다시 그리는 함수

function maskEmail(v) {
  const t = String(v == null ? '' : v).trim();
  if (!t) return '';
  const at = t.lastIndexOf('@');
  if (at < 1) return t.slice(0, 1) + '*'.repeat(Math.max(1, t.length - 1));
  const id = t.slice(0, at);
  const keep = id.length <= 2 ? 1 : 2;
  return id.slice(0, keep) + '*'.repeat(Math.max(3, id.length - keep)) + t.slice(at);
}

function maskPhone(v) {
  const t = String(v == null ? '' : v).trim();
  if (!t) return '';
  const d = t.replace(/[^0-9]/g, '');
  if (d.length < 7) return t.slice(0, 1) + '*'.repeat(Math.max(1, t.length - 1));
  return d.slice(0, 3) + '-****-' + d.slice(-4);
}

/**
 * 가린 값 + 눈 버튼.
 * @param {string} key   칸마다 다른 이름 (펼친 상태를 기억한다)
 * @param {string} value 원본 (관리자가 아니면 이미 가려져서 온다)
 * @param {string} kind  'email' | 'phone'
 */
function privateCell(key, value, kind) {
  const v = String(value == null ? '' : value).trim();
  if (!v) return '<span class="an-sub">-</span>';

  // 서버가 이미 가려서 보낸 값은 그대로 둔다 (펼칠 원본이 없다)
  const alreadyMasked = v.indexOf('*') !== -1;
  if (alreadyMasked || !API.isAdmin()) {
    return '<span class="pv masked">' + esc(v) + '</span>';
  }

  const open = !!SHOWN[key];
  const shown = open ? v : (kind === 'phone' ? maskPhone(v) : maskEmail(v));
  return '<span class="pv">'
    + '<span class="pv-v' + (open ? ' on' : '') + '">' + esc(shown) + '</span>'
    + '<button type="button" class="pv-eye" title="' + (open ? '다시 가리기' : '펼쳐 보기') + '"'
    +   ' onclick="togglePrivate(\'' + esc(key) + '\', this)">' + (open ? '🙈' : '👁') + '</button>'
    + '</span>';
}

/** 눈 버튼 — 그 칸만 펼치고 접는다 */
function togglePrivate(key, btn) {
  SHOWN[key] = !SHOWN[key];
  const wrap = btn.closest('.pv');
  const val = wrap && wrap.querySelector('.pv-v');
  if (!val) return;
  const raw = val.dataset.raw || val.innerText;
  if (!val.dataset.raw) val.dataset.raw = raw;
  // 다시 그리는 게 가장 확실하다 — 지금 화면을 그대로 새로 그린다
  if (typeof REDRAW === 'function') REDRAW();
  else btn.innerText = SHOWN[key] ? '🙈' : '👁';
}

/** HTML 이스케이프 */
function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function openPartnerModal(id) {
  const t = id ? State.partners.find(function (p) { return p.id === id; }) : null;
  const isNew = !t;

  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.innerHTML = [
    '<div class="modal" style="max-width:520px">',
    '  <div class="modal-header">',
    '    <h3>' + (isNew ? '협력사 등록' : '협력사 수정') + '</h3>',
    '    <button class="modal-close" onclick="this.closest(\'.modal-overlay\').remove()">✖</button>',
    '  </div>',
    '  <div class="modal-body">',
    '    <div class="form-group"><label class="form-label form-required">협력사명</label>',
    '      <input type="text" id="pt-name" class="form-input" placeholder="예) 열린길_교재" value="'
    + esc(t ? t.name : '') + '"></div>',
    '    <div class="fgrid">',
    '      <div class="form-group f6"><label class="form-label">분류 (선택)</label>',
    '        <input type="text" id="pt-category" class="form-input" placeholder="예) 교재, 버스, 연수원" value="'
    + esc(t ? t.category : '') + '"></div>',
    '      <div class="form-group f6"><label class="form-label">기본 세율</label>',
    '        <select id="pt-tax" class="form-select">',
    TAX_TYPES.map(function (x) {
      const sel = t && taxDef(t.default_tax_type).key === x.key ? ' selected'
        : (!t && x.key === '세금계산서(과세)' ? ' selected' : '');
      return '<option value="' + x.key + '"' + sel + '>' + x.label + '</option>';
    }).join(''),
    '        </select></div>',
    '    </div>',
    '    <div class="form-group"><label class="form-label">비고 (선택)</label>',
    '      <input type="text" id="pt-note" class="form-input" placeholder="예) 내마음보고서 진단" value="'
    + esc(t ? t.note : '') + '"></div>',
    '  </div>',
    '  <div class="modal-footer">',
    (isNew ? '' : '<button class="btn btn-danger btn-sm" onclick="removePartner(' + id + ')">목록에서 제외</button>'),
    '    <button class="btn btn-ghost" onclick="this.closest(\'.modal-overlay\').remove()">취소</button>',
    '    <button class="btn btn-primary" onclick="savePartner(' + (id || 'null') + ')">저장</button>',
    '  </div>',
    '</div>'
  ].join('');
  document.body.appendChild(div);
  setTimeout(function () { const el = document.getElementById('pt-name'); if (el) el.focus(); }, 50);
}

async function savePartner(id) {
  const data = {
    name: document.getElementById('pt-name').value.trim(),
    category: document.getElementById('pt-category').value.trim(),
    default_tax_type: document.getElementById('pt-tax').value,
    note: document.getElementById('pt-note').value.trim()
  };
  if (!data.name) { showToast('협력사명을 입력해주세요.', 'warning'); return; }
  try {
    if (id) await API.updatePartner(id, data);
    else await API.createPartner(data);
    showToast('저장되었습니다.', 'success');
    const o = document.querySelector('.modal-overlay'); if (o) o.remove();
    renderPartners();
  } catch (e) { showToast(e.message, 'error'); }
}

async function removePartner(id) {
  if (!confirm('이 협력사를 목록에서 제외할까요?\n이미 등록된 매입 기록은 그대로 남습니다.')) return;
  try {
    await API.deletePartner(id);
    showToast('목록에서 제외했습니다.', 'success');
    const o = document.querySelector('.modal-overlay'); if (o) o.remove();
    renderPartners();
  } catch (e) { showToast(e.message, 'error'); }
}
// ═══════════ 고객사 담당자 ═══════════
/** 현재 선택된 담당자 id */
function currentContactId() {
  const el = document.getElementById('p-contact-id');
  return el && el.value ? Number(el.value) : null;
}

/** 담당자 드롭다운을 채운다 */
function setContactOptions(list, selectedId) {
  const sel = document.getElementById('p-contact-id');
  const btnNew = document.getElementById('btn-contact-new');
  const btnEdit = document.getElementById('btn-contact-edit');
  if (!sel) return;

  State.contacts = list || [];
  const clientId = document.getElementById('p-client-id').value;

  if (!clientId) {
    sel.innerHTML = '<option value="">고객사를 먼저 선택하세요</option>';
    if (btnNew) btnNew.disabled = true;
    if (btnEdit) btnEdit.disabled = true;
    return;
  }

  const opts = ['<option value="">(담당자 없음)</option>'];
  State.contacts.forEach(function (c) {
    let label = c.name;
    if (c.position) label += ' ' + c.position;
    if (c.department) label += ' (' + c.department + ')';
    opts.push('<option value="' + c.id + '"'
      + (String(c.id) === String(selectedId) ? ' selected' : '') + '>' + label + '</option>');
  });
  sel.innerHTML = opts.join('');

  if (btnNew) btnNew.disabled = false;
  if (btnEdit) btnEdit.disabled = !sel.value;
}

/** 고객사의 담당자 목록을 서버에서 가져온다 */
async function loadContacts(clientId, selectedId) {
  if (!clientId) { setContactOptions([]); return; }
  try {
    const res = await API.getContacts(clientId);
    setContactOptions(res.contacts, selectedId);
  } catch (e) {
    setContactOptions([]);
    showToast('담당자 목록을 불러오지 못했습니다.', 'error');
  }
}

function onContactChange() {
  const btnEdit = document.getElementById('btn-contact-edit');
  if (btnEdit) btnEdit.disabled = !document.getElementById('p-contact-id').value;
}

/** 과정 등록 화면에서 담당자 신규/수정 */
function openContactModal(contactId) {
  const clientId = document.getElementById('p-client-id').value;
  if (!clientId) {
    showToast('고객사를 먼저 선택해주세요.', 'warning');
    return;
  }
  const known = contactId
    ? State.contacts.find(function (c) { return c.id === contactId; })
    : null;

  openContactEditor(clientId, contactId, known, function (newId) {
    loadContacts(clientId, newId);   // 저장 후 드롭다운 갱신 + 방금 것 선택
  });
}

function setupAutocomplete() {
  // 열자마자 지금 상태를 보여준다 (고치러 들어온 과정은 「이미 등록됨」)
  renderClientHint();

  // 고객사 검색
  const clInput = document.getElementById('p-client-name');
  const clList = document.getElementById('autocomplete-clients');
  if(clInput) {
    clInput.addEventListener('input', (e) => {
      document.getElementById('p-client-id').value = ''; // 타이핑하면 ID 리셋
      setContactOptions([]);
      renderClientHint('checking');      // 아직 모르는 동안은 「신규」라고 단정하지 않는다
      clearTimeout(State.autocompleteTimer);
      State.autocompleteTimer = setTimeout(async () => {
        const q = e.target.value.trim();
        if(q.length < 1) { clList.classList.remove('show'); renderClientHint(); return; }

        let res;
        try { res = await API.searchClients(q); }
        catch (err) { renderClientHint(); return; }

        /*
         * 이름을 끝까지 똑같이 적었으면 목록에서 고르지 않아도 그 고객사로 본다.
         * 그러지 않으면 이미 있는 고객사인데도 「신규」라고 나와 헷갈린다.
         */
        const exact = (res.clients || []).filter(function (c) {
          return sameClientName(c.name, q);
        })[0];
        if (exact) {
          document.getElementById('p-client-id').value = exact.id;
          loadContacts(exact.id);
        }
        renderClientHint();

        renderAutoList(clList, res.clients, q, async (item) => {
          clList.classList.remove('show');

          // 목록에 없는 이름을 고르면(신규 등록) 곧바로 만들어 ID를 받아온다.
          // 그래야 담당자를 바로 추가할 수 있다.
          let id = item.id;
          if (!id) {
            try {
              const r = await API.createClient({ name: item.name });
              id = r.client.id;
              showToast('새 고객사 「' + item.name + '」를 등록했습니다.', 'success');
            } catch (err) {
              showToast(err.message, 'error');
              return;
            }
          }

          clInput.value = item.name;
          document.getElementById('p-client-id').value = id;
          loadContacts(id);
          renderClientHint();
        });
      }, 300);
    });
  }

}

/** 고객사 이름이 같은 것인지 — 앞뒤 공백과 대소문자는 눈감아 준다 */
function sameClientName(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

/*
 * 고객사명 아래 붙박이 안내.
 *
 * 전에는 입력할 때 뜨는 목록 안에서만 「(신규 등록)」이 보였다.
 * 그 목록은 딴 데를 한 번 누르면 닫히고, 다시 보려면 글자를 지웠다
 * 다시 써야 했다. 그래서 등록되지 않은 고객사인데도 그 사실이
 * 화면에서 사라져 버렸다. (대표님 지시 2026-10-26)
 *
 * 이제 안내를 목록 밖으로 꺼내 입력칸 아래에 늘 둔다.
 * 등록될 때까지 사라지지 않는다. 관리자·직원 모두 같다.
 *
 * @param state 'checking' 이면 「확인 중」. 비워 두면 지금 상태로 판단한다.
 */
function renderClientHint(state) {
  const box = document.getElementById('p-client-hint');
  if (!box) return;

  const name = ((document.getElementById('p-client-name') || {}).value || '').trim();
  const id = (document.getElementById('p-client-id') || {}).value || '';

  if (!name) { box.className = 'client-hint'; box.innerHTML = ''; return; }

  if (state === 'checking' && !id) {
    box.className = 'client-hint checking';
    box.innerHTML = '찾아보는 중…';
    return;
  }

  if (id) {
    box.className = 'client-hint known';
    box.innerHTML = '<span class="ic">✓</span> 이미 등록된 고객사입니다.';
    return;
  }

  box.className = 'client-hint isnew';
  box.innerHTML = '<span class="ic">＋</span> 「<b>' + esc(name) + '</b>」는 아직 등록되지 않은 고객사입니다. '
    + '과정을 저장하면 함께 등록됩니다.'
    + ' <button type="button" class="btn btn-outline btn-sm" onclick="createClientNow()">지금 등록</button>';
}

/**
 * 적어 넣은 고객사를 그 자리에서 등록한다.
 * 담당자를 고르려면 고객사 번호가 있어야 해서, 저장까지 기다리지 않아도 되게 둔다.
 */
async function createClientNow() {
  const el = document.getElementById('p-client-name');
  const name = ((el || {}).value || '').trim();
  if (!name) return;
  try {
    const r = await API.createClient({ name: name });
    document.getElementById('p-client-id').value = r.client.id;
    showToast('새 고객사 「' + name + '」를 등록했습니다.', 'success');
    loadContacts(r.client.id);
  } catch (e) {
    showToast(e.message, 'error');
  }
  renderClientHint();
}

function renderAutoList(container, items, query, onClick, showSub = false) {
  container.innerHTML = '';
  if (items.length === 0) {
    const div = document.createElement('div');
    div.className = 'autocomplete-item create-new';
    div.innerText = `"${query}" (신규 등록)`;
    div.onclick = () => { onClick({ name: query }); };
    container.appendChild(div);
  } else {
    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      div.innerHTML = `<div class="main-text">${item.name}</div>${showSub && (item.email || item.phone) ? `<div class="sub-text">${item.email || ''} ${item.phone || ''}</div>` : ''}${item.affiliation ? `<div class="sub-text">${item.affiliation}</div>` : ''}`;
      div.onclick = () => { onClick(item); };
      container.appendChild(div);
    });
  }
  container.classList.add('show');
}

// 전역 닫기
document.addEventListener('click', (e) => {
  if (!e.target.closest('.autocomplete-wrapper')) {
    document.querySelectorAll('.autocomplete-list').forEach(el => el.classList.remove('show'));
  }
});

// 강사 자동완성
/**
 * 매입 이름칸 자동완성.
 *   강의  → 강사 목록
 *   그 외 → 협력사 목록
 */
function debounceNameSearch(inputEl, itemId, category) {
  clearTimeout(State.autocompleteTimer);
  State.autocompleteTimer = setTimeout(async function () {
    const q = inputEl.value.trim();
    const listEl = document.getElementById('auto-inst-' + itemId);
    if (!listEl) return;
    if (q.length < 1) { listEl.classList.remove('show'); return; }

    try {
      if (category === '강의') {
        const res = await API.searchInstructors(q);
        renderAutoList(listEl, res.instructors, q, function (item) {
          const t = State.expenseItems.find(function (x) { return x._id === itemId; });
          if (t) {
            t.instructor_id = item.id;
            t.name = item.name;
            if (item.affiliation) t.affiliation = item.affiliation;
            if (item.default_tax_type) t.tax_type = item.default_tax_type;
            if (item.default_unit_price && !t.is_manual) t.unit_price = item.default_unit_price;
            if (!t.unit) t.unit = '시간';
          }
          listEl.classList.remove('show');
          renderExpenseItems();
        }, true);
      } else {
        const res = await API.searchPartners(q);
        renderAutoList(listEl, res.partners, q, function (item) {
          const t = State.expenseItems.find(function (x) { return x._id === itemId; });
          if (t) {
            t.name = item.name;
            t.instructor_id = null;
            if (item.default_tax_type) t.tax_type = item.default_tax_type;
          }
          listEl.classList.remove('show');
          renderExpenseItems();
        }, true);
      }
    } catch (e) {
      listEl.classList.remove('show');
    }
  }, 300);
}

// --- 과정 저장 ---
async function saveProject() {
  const p = {
    client_name: document.getElementById('p-client-name').value,
    client_id: document.getElementById('p-client-id').value || null,
    contact_id: document.getElementById('p-contact-id').value || null,
    type: document.querySelector('input[name="p-type"]:checked').value,
    course_name: document.getElementById('p-course-name').value,
    schedule_type: scheduleType(),
    schedule_dates: curDates().filter(function (r) { return r && r.s; }),
    manager: document.getElementById('p-manager').value,
    sales_rep: document.getElementById('p-sales-rep').value,
    company: (document.getElementById('p-company') || {}).value || DEFAULT_COMPANY,
    sales: State.saleItems,
    invoices: State.invoices,
    discount: State.discount,
    vat_mode: State.vatMode,
    discount_base: State.discountBase,
    memo: document.getElementById('p-memo').value,
    expenses: State.expenseItems
  };

  if(!p.course_name) return showToast('과정명을 입력해주세요.', 'warning');
  if(!p.client_name) return showToast('고객사명을 입력해주세요.', 'warning');
  if(!p.schedule_dates.length) return showToast('교육일정을 입력해주세요.', 'warning');
  if(p.schedule_type === '차수' && p.schedule_dates.length < 2)
    return showToast('차수는 2차수 이상이어야 합니다. 차수를 추가하거나 \u0027기간\u0027을 선택해주세요.', 'warning');

  try {
    if (currentProject) {
      await API.updateProject(currentProject.id, p);
      showToast('수정되었습니다.', 'success');
    } else {
      await API.createProject(p);
      showToast('등록되었습니다.', 'success');
    }
    navigate(afterProjectRoute());
  } catch(err) {
    showToast(err.message, 'error');
  }
}

async function deleteProject(id) {
  if(!confirm('정말 삭제하시겠습니까? 관련 매입 데이터도 모두 삭제됩니다.')) return;
  try {
    await API.deleteProject(id);
    showToast('삭제되었습니다.', 'success');
    navigate(afterProjectRoute());
  } catch(err) {
    showToast(err.message, 'error');
  }
}

// --- 나머지 관리자 페이지들 (강사, 직원)은 기존과 유사하되 간소화하여 유지 ---
async function renderInstructors() {
  if (!API.isAdmin()) return showToast('권한이 없습니다.', 'error');
  REDRAW = renderInstructors;
  try {
    const { instructors } = await API.getInstructors();
    State.instructors = instructors;
    // 354명이라 검색 없이는 고칠 사람을 찾기 어렵다
    const shown = instructors.filter(function (i) {
      return findMatch('instructors', [i.name, i.title, i.affiliation, i.email, String(i.id)]);
    });
    document.getElementById('main-content').innerHTML = `
      <div class="page-header">
        <div><h2>강사 관리</h2><div class="subtitle">🔒 개인정보 미보관 — 주민번호·연락처·계좌는 오프라인 엑셀에서 강사코드로 관리</div></div>
        <div style="display:flex; gap:0.5rem">
          <button class="btn btn-outline" onclick="downloadRoster()"><span class="icon">📥</span> 엑셀용 명단 내려받기</button>
          <button class="btn btn-primary" onclick="openInstModal()"><span class="icon">➕</span> 강사 등록</button>
        </div>
      </div>

      <div class="info-box" style="margin-bottom:1.5rem">
        <b>신규 강사는 두 곳에 나눠 입력합니다.</b><br>
        ① <b>여기(사이트)</b> — 이름 · 소속 · 이메일 · 단가 · 세율<br>
        ② <b>개인정보 엑셀</b> — 강사코드 + 주민번호 · 연락처 · 계좌번호<br>
        같은 내용을 두 번 치는 게 아니라, 정보를 나눠 담는 것입니다.
        아래 <b>[코드 복사]</b>를 누르면 <code>강사코드 · 이름 · 소속</code>이 복사되어 엑셀에 바로 붙여넣을 수 있습니다.
      </div>
      ${findBar('instructors', '이름 · 직함 · 회사명 · 강사코드 검색', shown.length, instructors.length)}
      ${shown.length === 0
        ? '<div class="empty-state" style="padding:3rem"><p>'
          + (FIND.instructors ? '찾는 강사가 없습니다.' : '등록된 강사가 없습니다.') + '</p></div>'
        : ''}
      <div class="instructor-grid">
        ${shown.map(i => `
          <div class="instructor-card">
            <div class="name">${i.name} <span class="badge badge-admin">${i.default_tax_type}</span></div>
            <div class="detail"><span class="label">강사코드</span> <b>${i.id}</b></div>
            <div class="detail"><span class="label">직함</span> ${i.title || '-'}</div>
            <div class="detail"><span class="label">회사명</span> ${i.affiliation || '-'}</div>
            <div class="detail"><span class="label">이메일</span> ${privateCell('inst-' + i.id, i.email, 'email')}</div>
            <div class="detail"><span class="label">기본단가</span> ${formatNumber(i.default_unit_price)}원</div>
            <div class="actions" style="display:flex; gap:0.4rem">
              <button class="btn btn-outline btn-sm" style="flex:1" onclick="copyInstRow(${i.id}, this)">📋 코드 복사</button>
              <button class="btn btn-ghost btn-sm" style="flex:1" onclick='openInstModal(${JSON.stringify(i).replace(/'/g, "&#39;")})'>정보 수정</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch(e) { showToast(e.message, 'error'); }
}

function openInstModal(inst = null) {
  const isNew = !inst;
  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${isNew ? '강사 등록' : '강사 정보 수정'}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✖</button>
      </div>
      <div class="modal-body">
        <div class="info-box">🔒 <b>주민등록번호·연락처·계좌번호는 이 시스템에 저장하지 않습니다.</b><br>
        해당 정보는 담당자 PC의 개인정보 엑셀에서 아래 <b>강사코드</b>를 연결키로 관리하세요.</div>
        ${inst ? `<div class="form-group"><label class="form-label">강사코드 (엑셀 연결키)</label>
          <input type="text" class="form-input" value="${inst.id}" readonly style="background:var(--bg-secondary); font-weight:700; letter-spacing:0.05em"></div>` : ''}
        <div class="info-box" style="margin-bottom:1rem">
          이름 · 직함 · 회사명을 <b>따로</b> 적어주세요.
          한 칸에 「김영정 강사」처럼 몰아 적으면 같은 분이 여러 명으로 갈라집니다.
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label form-required">강사명</label>
            <input type="text" id="i-name" class="form-input" placeholder="예) 김영정" value="${inst?.name||''}"></div>
          <div class="form-group"><label class="form-label">직함</label>
            <input type="text" id="i-title" class="form-input" placeholder="예) 강사 · 교수 · 대표" value="${inst?.title||''}"></div>
          <div class="form-group"><label class="form-label">회사명</label>
            <input type="text" id="i-affil" class="form-input" placeholder="예) 늘품에듀" value="${inst?.affiliation||''}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">기본 세율</label>
            <select id="i-tax" class="form-select">
              ${TAX_TYPES.map(t => `<option value="${t.key}" ${taxDef(inst?.default_tax_type).key === t.key ? 'selected' : ''}>${t.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">기본 단가(시간당)</label><input type="number" id="i-up" class="form-input" value="${inst?.default_unit_price||0}"></div>
        </div>
        <div class="form-group"><label class="form-label">이메일</label><input type="email" id="i-email" class="form-input" placeholder="선택 입력" value="${inst?.email||''}"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">취소</button>
        <button class="btn btn-primary" onclick="saveInst(${inst?.id || 'null'})">저장</button>
      </div>
    </div>
  `;
  document.body.appendChild(div);
}

async function saveInst(id) {
  const data = {
    name: document.getElementById('i-name').value,
    title: (document.getElementById('i-title') || {}).value || '',
    affiliation: document.getElementById('i-affil').value,
    default_tax_type: document.getElementById('i-tax').value,
    default_unit_price: parseNumber(document.getElementById('i-up').value),
    email: document.getElementById('i-email').value,
  };
  try {
    let newId = null;
    if (id) {
      await API.updateInstructor(id, data);
    } else {
      const r = await API.createInstructor(data);
      newId = r.id;
    }
    showToast('저장되었습니다.', 'success');
    document.querySelector('.modal-overlay').remove();
    await renderInstructors();
    // 신규 등록이면 "엑셀에 옮겨야 한다"는 것을 잊지 않도록 강사코드를 안내한다
    if (newId) showNewInstructorCode(newId, data.name, data.affiliation);
  } catch(e) { showToast(e.message, 'error'); }
}

/** 엑셀「강사정보」시트 A열에 붙여넣을 한 줄(탭 구분)을 만든다 */
function instRowText(id, name, affiliation) {
  return [id, name || '', affiliation || ''].join('	');
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    // 클립보드 권한이 없거나 http 환경일 때의 폴백
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(ta);
    return ok;
  }
}

/** 강사 카드의 [코드 복사] */
async function copyInstRow(id, btn) {
  const inst = State.instructors.find(i => i.id === id);
  if (!inst) return;
  const ok = await copyToClipboard(instRowText(inst.id, inst.name, inst.affiliation));
  if (ok) {
    const old = btn.innerHTML;
    btn.innerHTML = '✅ 복사됨';
    setTimeout(() => { btn.innerHTML = old; }, 1500);
    showToast('엑셀「강사정보」시트에 붙여넣으세요.', 'success');
  } else {
    showToast('복사에 실패했습니다. 강사코드를 직접 입력해주세요.', 'error');
  }
}

/** 신규 등록 직후 강사코드 안내 */
function showNewInstructorCode(id, name, affiliation) {
  const row = instRowText(id, name, affiliation);
  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.innerHTML = `
    <div class="modal" style="max-width:520px">
      <div class="modal-header">
        <h3>✅ 강사 등록 완료 — 다음 단계</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✖</button>
      </div>
      <div class="modal-body">
        <div style="text-align:center; padding:1.25rem 0">
          <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.35rem">부여된 강사코드</div>
          <div style="font-size:3rem; font-weight:800; color:var(--accent); line-height:1">${id}</div>
          <div style="margin-top:0.5rem; font-weight:600">${name}${affiliation ? ' · ' + affiliation : ''}</div>
        </div>
        <div class="info-box">
          이제 <b>개인정보 엑셀「강사정보」시트</b>를 열고 맨 아래 빈 줄에 붙여넣은 뒤,
          <b>주민등록번호 · 연락처 · 은행 · 계좌번호</b>를 채워주세요.<br>
          이 작업을 해야 강사료 지급 시 계좌가 자동으로 조회됩니다.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">나중에 하기</button>
        <button class="btn btn-primary" id="btn-copy-newinst">📋 엑셀에 붙여넣을 내용 복사</button>
      </div>
    </div>
  `;
  document.body.appendChild(div);
  div.querySelector('#btn-copy-newinst').addEventListener('click', async (e) => {
    const ok = await copyToClipboard(row);
    e.currentTarget.innerHTML = ok ? '✅ 복사되었습니다' : '❌ 복사 실패';
    if (ok) showToast('엑셀「강사정보」시트에 붙여넣으세요.', 'success');
  });
}

/** 전체 강사 명단을 엑셀로 (초기 세팅 / 일괄 정리용) */
async function downloadRoster() {
  try {
    await API.downloadInstructorRoster();
    showToast('엑셀「강사정보」시트 A2에 붙여넣으세요.', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

/* ═══════════════════════════════════════════════════════════
   엑셀로 한꺼번에 수정 (관리자 전용)

     ① 내려받기 → ② 엑셀에서 고치기 → ③ 올리기 → ④ 확인 → ⑤ 반영

   ④번이 핵심이다. 바로 반영하지 않고 「이렇게 바뀝니다」를 먼저 보여준다.
   ═══════════════════════════════════════════════════════════ */

const BULK = { preview: null, busy: false };

function renderBulk() {
  if (!API.isAdmin()) return;
  BULK.preview = null;

  document.getElementById('main-content').innerHTML = [
    '<div class="page-header"><div>',
    '  <h2>엑셀로 한꺼번에 수정</h2>',
    '  <p class="subtitle">사이트의 모든 자료를 엑셀로 받아 고친 뒤 다시 올리면 반영됩니다.</p>',
    '</div></div>',

    '<div class="bulk-steps">',

    /* ── 1단계 ── */
    '  <div class="bulk-step">',
    '    <div class="bk-no">1</div>',
    '    <div class="bk-body">',
    '      <h3>엑셀 내려받기</h3>',
    '      <p>지금 자료가 모두 담긴 엑셀 파일이 <b>내 컴퓨터 다운로드 폴더</b>에 저장됩니다.</p>',
    '      <div class="bk-act">',
    '        <button class="btn btn-primary" id="bk-dl" onclick="bulkDownload(true)">',
    '          <span class="icon">📥</span> 개인정보 포함해서 받기</button>',
    '        <button class="btn btn-outline" onclick="bulkDownload(false)">개인정보 빼고 받기</button>',
    '      </div>',
    '      <p class="form-hint">이메일·연락처가 들어갑니다. 정산용이 아니면 「빼고 받기」를 쓰세요.</p>',
    '    </div>',
    '  </div>',

    /* ── 2단계 ── */
    '  <div class="bulk-step">',
    '    <div class="bk-no">2</div>',
    '    <div class="bk-body">',
    '      <h3>엑셀에서 고치기</h3>',
    '      <ul class="bk-rules">',
    '        <li><b>「과정」 시트 한 장</b>에 과정 · 매출 · 매입 · 계산서가 함께 있습니다.',
    '            맨 왼쪽 <b>구분</b>을 보세요. <b>과정</b> 줄 아래에 오는 매출·매입·계산서가 그 과정의 것입니다.</li>',
    '        <li><b>고치기</b> — 그 칸만 바꾸면 됩니다.</li>',
    '        <li><b>고객사 · 고객담당자 · 과정명</b>은 모든 줄에 같이 적혀 있어 어느 과정인지 바로 보입니다.',
    '            다만 <b>고치는 것은 「과정」 줄에서만</b> 하세요 (딸린 줄의 그 칸은 보기용입니다).</li>',
    '        <li><b>줄 추가</b> — 그 과정 안쪽에 줄을 끼워 넣고 <b>구분</b>에 매출/매입/계산서를 적으세요.',
    '            <b>번호는 비워둡니다.</b></li>',
    '        <li><b>새 과정</b> — 맨 아래에 <b>구분=과정</b> 줄을 쓰고, 바로 밑에 매출·매입·계산서를 적으면',
    '            한 번에 만들어집니다. 번호는 모두 비워두세요.</li>',
    '        <li><b>지우기</b> — 그 줄을 통째로 삭제하세요.</li>',
    '        <li><b>금액</b>은 바로 고쳐도 됩니다. <b>단가 · 수량</b>을 적으면 단가 × 수량 × 차수로 다시 계산하고,',
    '            <b>금액만</b> 적으면 적은 금액 그대로 들어갑니다.</li>',
    '        <li class="warn"><b>「번호」 칸은 절대 고치지 마세요.</b> 어느 줄인지 알아보는 표시입니다.</li>',
    '        <li><b>정렬하거나 걸러서 줄이 뒤섞였을 때</b> — 맨 왼쪽 <b>「순서」</b> 칸을',
    '            <b>작은 값부터</b>(오름차순) 정렬하면 받았을 때 모습으로 돌아옵니다.',
    '            필터는 엑셀 <b>데이터 → 지우기</b>로 풀립니다.</li>',
    '        <li class="gray">뒤섞인 채로 올려도 괜찮습니다. <b>「과정번호」</b> 칸을 보고 제 과정을 찾아갑니다.</li>',
    '        <li class="gray"><b>[자동]</b> 이 붙은 칸(과정 총매출·공급가액·부가세·이익)은 적어도 무시됩니다. 서버가 다시 계산합니다.</li>',
    '      </ul>',
    '    </div>',
    '  </div>',

    /* ── 3단계 ── */
    '  <div class="bulk-step">',
    '    <div class="bk-no">3</div>',
    '    <div class="bk-body">',
    '      <h3>고친 엑셀 올리기</h3>',
    '      <p>바로 반영하지 않습니다. <b>무엇이 바뀌는지 먼저 보여드립니다.</b></p>',
    '      <div class="bk-act">',
    '        <input type="file" id="bk-file" accept=".xlsx" style="display:none"',
    '               onchange="bulkUpload(this)">',
    '        <button class="btn btn-primary" onclick="document.getElementById(\'bk-file\').click()">',
    '          <span class="icon">📤</span> 엑셀 파일 고르기</button>',
    '        <span id="bk-name" class="form-hint"></span>',
    '      </div>',
    '    </div>',
    '  </div>',

    '</div>',
    '<div id="bk-result"></div>'
  ].join('');
}

/** 1단계 — 내 PC 로 받는다 */
async function bulkDownload(personal) {
  if (BULK.busy) return;
  BULK.busy = true;
  const btn = document.getElementById('bk-dl');
  const old = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '만드는 중…'; }

  try {
    const r = await API.downloadAll({ personal: personal ? '1' : '0' });
    const rows = (r.sheets || []).reduce((a, s) => a + s.rows, 0);
    showToast(r.filename + ' 을(를) 받았습니다. (' + r.sheets.length + '개 시트 · ' + formatNumber(rows) + '줄)', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    BULK.busy = false;
    if (btn) { btn.disabled = false; btn.innerHTML = old; }
  }
}

/** 3단계 — 올려서 무엇이 바뀌는지 받아본다 */
async function bulkUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  document.getElementById('bk-name').textContent = file.name;

  const box = document.getElementById('bk-result');
  box.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const p = await API.uploadPreview(file);
    BULK.preview = p;
    renderBulkPreview(p);
  } catch (e) {
    box.innerHTML = '<div class="an-empty">' + esc(e.message) + '</div>';
  } finally {
    input.value = '';                       // 같은 파일을 다시 고를 수 있게
  }
}

/*
 * 지워질 줄을 보여줄 때 쓰는 이름.
 * 서버는 표 이름(project_sales …)을 주는데, 그대로 보이면 무엇이
 * 지워지는지 알 수 없다. 사고를 막는 화면이라 한글로 보여준다.
 */
const BULK_LABEL = {
  projects: '과정', project_sales: '매출', project_expenses: '매입',
  project_invoices: '계산서', clients: '고객사', contacts: '고객사 담당자',
  instructors: '강사', partners: '협력사', corp_cards: '법인카드',
  staff: '직원·외부영업', overheads: '회사 경비', users: '사용자'
};

/** 4단계 — 「이렇게 바뀝니다」 */
function renderBulkPreview(p) {
  const rows = (p.summary || []).filter(s => !s.skipped && (s.add || s.edit || s.del));
  const nothing = rows.length === 0;

  const dels = (p.deletes || []);
  const delTotal = dels.reduce((a, d) => a + d.count, 0);

  document.getElementById('bk-result').innerHTML = [
    '<div class="bulk-preview' + (p.problems.length ? ' has-problem' : '') + '">',
    '  <h3>이렇게 바뀝니다</h3>',

    nothing
      ? '<div class="an-empty">바뀐 내용이 없습니다.</div>'
      : [
        '<div class="table-container"><table class="data-table">',
        '<thead><tr><th>시트</th><th class="th-mid">추가</th><th class="th-mid">수정</th><th class="th-mid">삭제</th></tr></thead><tbody>',
        rows.map(s =>
          '<tr><td style="font-weight:600">' + esc(s.name) + '</td>'
          + '<td class="c-mid' + (s.add ? ' bk-add' : '') + '">' + (s.add || '-') + '</td>'
          + '<td class="c-mid' + (s.edit ? ' bk-edit' : '') + '">' + (s.edit || '-') + '</td>'
          + '<td class="c-mid' + (s.del ? ' bk-del' : '') + '">' + (s.del || '-') + '</td></tr>'
        ).join(''),
        '</tbody></table></div>'
      ].join(''),

    /* 지워질 것은 따로 보여준다 — 무심코 지우는 사고를 막는다 */
    delTotal ? [
      '<div class="bk-danger">',
      '  <b>⚠ ' + formatNumber(delTotal) + '줄이 지워집니다.</b>',
      '  <p class="form-hint" style="margin:.4rem 0 .6rem">',
      '  엑셀에서 줄을 지우셨다면 맞습니다. 아니라면 <b>취소</b>하고 엑셀을 다시 받아주세요.</p>',
      dels.map(d =>
        '<div class="bk-dl-row"><b>' + esc(BULK_LABEL[d.key] || d.key) + '</b> ' + d.count + '줄 — '
        + esc(d.sample.join(' · ')) + (d.count > d.sample.length ? ' …' : '') + '</div>'
      ).join(''),
      '</div>'
    ].join('') : '',

    /* 고칠 곳 */
    p.problems.length ? [
      '<div class="bk-danger">',
      '  <b>⚠ 고쳐야 할 곳이 ' + p.problems.length + '개 있습니다.</b>',
      '  <p class="form-hint" style="margin:.4rem 0 .6rem">이대로는 반영할 수 없습니다.</p>',
      p.problems.slice(0, 12).map(x => '<div class="bk-dl-row">' + esc(x) + '</div>').join(''),
      p.problems.length > 12 ? '<div class="bk-dl-row">… 외 ' + (p.problems.length - 12) + '개</div>' : '',
      '</div>'
    ].join('') : '',

    '  <div class="bk-act" style="margin-top:1.2rem">',
    '    <button class="btn btn-ghost" onclick="renderBulk()">취소</button>',
    (nothing || p.problems.length)
      ? ''
      : '<button class="btn btn-primary" id="bk-go" onclick="bulkApply()">반영하기</button>',
    '  </div>',
    '</div>'
  ].join('');
}

/** 5단계 — 반영 */
async function bulkApply() {
  const p = BULK.preview;
  if (!p) return;

  const dels = (p.deletes || []).reduce((a, d) => a + d.count, 0);
  if (dels && !confirm(dels + '줄이 지워집니다.\n\n정말 반영할까요?')) return;

  const btn = document.getElementById('bk-go');
  if (btn) { btn.disabled = true; btn.innerHTML = '반영하는 중…'; }

  try {
    const r = await API.uploadApply(p.ticket);
    document.getElementById('bk-result').innerHTML = [
      '<div class="bulk-preview">',
      '  <h3>반영했습니다</h3>',
      '  <div class="table-container"><table class="data-table"><tbody>',
      '    <tr><td>추가</td><td class="amount-cell">' + formatNumber(r.added) + '줄</td></tr>',
      '    <tr><td>수정</td><td class="amount-cell">' + formatNumber(r.edited) + '줄</td></tr>',
      '    <tr><td>삭제</td><td class="amount-cell">' + formatNumber(r.deleted) + '줄</td></tr>',
      '    <tr><td>금액 다시 계산한 과정</td><td class="amount-cell">' + formatNumber(r.recalculated) + '개</td></tr>',
      '  </tbody></table></div>',
      '  <div class="bk-act" style="margin-top:1rem">',
      '    <button class="btn btn-primary" onclick="navigate(\'dashboard\')">대시보드 보기</button>',
      '    <button class="btn btn-ghost" onclick="renderBulk()">다시 수정하기</button>',
      '  </div>',
      '</div>'
    ].join('');
    showToast('반영했습니다.', 'success');
  } catch (e) {
    showToast(e.message, 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '반영하기'; }
  }
}

/* ═══════════════════════════════════════════════════════════
   비밀번호 변경 — 관리자·직원 모두 자기 비밀번호를 바꿀 수 있다.
   (다른 사람의 비밀번호를 새로 정해주는 것은 [로그인 계정] 화면에서 관리자가 한다)
   ═══════════════════════════════════════════════════════════ */
function renderPassword() {
  const me = API.getUser() || {};
  document.getElementById('main-content').innerHTML = [
    '<div class="page-header"><div>',
    '  <h2>비밀번호 변경</h2>',
    '  <p class="subtitle">' + esc(me.name || '') + ' (' + esc(me.username || '') + ')</p>',
    '</div></div>',
    '<div class="card" style="max-width:26rem">',
    '  <div class="form-group">',
    '    <label class="form-label">지금 비밀번호</label>',
    '    ' + pwField('pw-old', { autocomplete: 'current-password' }),
    '  </div>',
    '  <div class="form-group">',
    '    <label class="form-label">새 비밀번호</label>',
    '    ' + pwField('pw-new', { autocomplete: 'new-password' }),
    '    <p class="form-hint">4자 이상. 길게 하실수록 안전합니다.</p>',
    '  </div>',
    '  <div class="form-group">',
    '    <label class="form-label">새 비밀번호 확인</label>',
    '    ' + pwField('pw-new2', { autocomplete: 'new-password' }),
    '  </div>',
    '  <button class="btn btn-primary btn-block" onclick="submitPassword()">비밀번호 바꾸기</button>',
    '</div>'
  ].join('');

  // 엔터로도 넘어가게
  ['pw-old', 'pw-new', 'pw-new2'].forEach(function (id) {
    document.getElementById(id).addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitPassword();
    });
  });
}

async function submitPassword() {
  const oldPw = document.getElementById('pw-old').value;
  const newPw = document.getElementById('pw-new').value;
  const again = document.getElementById('pw-new2').value;

  if (!oldPw || !newPw) return showToast('비밀번호를 입력해주세요.', 'error');
  if (newPw.length < 4) return showToast('새 비밀번호는 4자 이상으로 해주세요.', 'error');
  if (newPw !== again) return showToast('새 비밀번호가 서로 다릅니다.', 'error');
  if (newPw === oldPw) return showToast('지금 쓰는 비밀번호와 같습니다.', 'error');

  try {
    await API.changePassword({ old_password: oldPw, new_password: newPw });
    showToast('비밀번호를 바꿨습니다. 다시 로그인해주세요.', 'success');
    // 비밀번호가 바뀌었으니 들고 있던 출입증을 버리고 처음부터
    setTimeout(function () { API.logout(); showScreen(); }, 1200);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

/* ═══════════════════════════════════════════════════════════
   로그인 계정 (관리자 전용)
     · 계정 추가
     · 권한(관리자/직원) · 사용 여부 바꾸기
     · 비밀번호 새로 정해주기 (지금 비밀번호를 몰라도 됨)
   ═══════════════════════════════════════════════════════════ */
async function renderUsers() {
  if (!API.isAdmin()) return;

  let res;
  try {
    res = await API.getUsers();
  } catch (e) {
    document.getElementById('main-content').innerHTML =
      '<div class="page-header"><h2>로그인 계정</h2></div>'
      + '<div class="an-empty">' + esc(e.message) + '</div>';
    return;
  }

  const me = API.getUser() || {};

  document.getElementById('main-content').innerHTML = [
    '<div class="page-header"><div>',
    '  <h2>직원 계정 관리</h2>',
    '  <p class="subtitle">직원이 <b>hyeumcst.github.io/go/staff</b> 로 들어갈 때 쓸 아이디와 비밀번호를 만듭니다.</p>',
    '</div>',
    '<button class="btn btn-primary" onclick="userForm()">＋ 계정 추가</button>',
    '</div>',
    '<div class="tab-desc" style="margin:0 0 1rem"><span class="ico">🔒</span><span>',
    '비밀번호는 알아볼 수 없는 형태로만 저장됩니다. 그래서 <b>여기서도 볼 수 없고</b>, ',
    '잊어버렸을 때는 [비밀번호] 버튼으로 <b>새로 정해주시면</b> 됩니다.',
    '</span></div>',
    '<div class="table-container"><table class="data-table">',
    '<thead><tr><th>이름</th><th>아이디</th><th class="th-mid">권한</th>',
    '<th class="th-mid">상태</th><th>최근 로그인</th><th style="width:13rem"></th></tr></thead><tbody>',
    res.users.map(function (u) {
      const mine = u.id === me.id;
      return '<tr>'
        + '<td style="font-weight:600">' + esc(u.name || '') + (mine ? ' <span class="side-badge">나</span>' : '') + '</td>'
        + '<td>' + esc(u.username || '') + '</td>'
        + '<td class="c-mid"><span class="badge ' + (u.role === 'admin' ? 'badge-admin' : 'badge-user') + '">'
        +   (u.role === 'admin' ? '관리자' : '직원') + '</span></td>'
        + '<td class="c-mid"><span class="badge ' + (u.is_active ? 'badge-active' : 'badge-inactive') + '">'
        +   (u.is_active ? '사용중' : '중지') + '</span></td>'
        + '<td style="color:var(--text-muted);font-size:0.8rem">' + esc(u.last_login || '-') + '</td>'
        + '<td style="text-align:right">'
        +   '<button class="btn btn-ghost btn-sm" onclick="userForm(' + u.id + ')">수정</button> '
        +   '<button class="btn btn-ghost btn-sm" onclick="userResetPw(' + u.id + ')">비밀번호</button>'
        + '</td></tr>';
    }).join(''),
    '</tbody></table></div>'
  ].join('');

  USERS_CACHE = res.users;
}

let USERS_CACHE = [];

/** 모달을 닫는다 */
function dropModal() {
  const o = document.querySelector('.modal-overlay');
  if (o) o.remove();
}

/** 계정 추가 · 수정 창 */
function userForm(id) {
  const u = id ? (USERS_CACHE.find(function (x) { return x.id === id; }) || {}) : {};
  const isNew = !id;

  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.innerHTML = [
    '<div class="modal" style="max-width:440px">',
    '  <div class="modal-header">',
    '    <h3>' + (isNew ? '계정 추가' : '계정 수정') + '</h3>',
    '    <button class="modal-close" onclick="this.closest(\'.modal-overlay\').remove()">✖</button>',
    '  </div>',
    '  <div class="modal-body">',
    '    <div class="form-group"><label class="form-label form-required">아이디</label>',
    '      <input type="text" id="u-name" class="form-input" placeholder="예) hong@hyeumcst.co.kr" value="'
    + esc(u.username || '') + '"></div>',
    '    <div class="form-group"><label class="form-label form-required">이름</label>',
    '      <input type="text" id="u-disp" class="form-input" placeholder="예) 홍길동" value="'
    + esc(u.name || '') + '"></div>',
    (isNew
      ? '<div class="form-group"><label class="form-label form-required">비밀번호</label>'
        + pwField('u-pw', { autocomplete: 'new-password' })
        + '<p class="form-hint">4자 이상. 정하신 뒤 본인에게 알려주세요.</p></div>'
      : ''),
    '    <div class="rline">',
    '      <div class="rf" style="flex:1 1 9rem"><label class="form-label">권한</label>',
    '        <select id="u-role" class="form-select">',
    '          <option value="user"' + (u.role === 'admin' ? '' : ' selected') + '>직원</option>',
    '          <option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>관리자</option>',
    '        </select></div>',
    (isNew
      ? ''
      : '<div class="rf" style="flex:1 1 9rem"><label class="form-label">상태</label>'
        + '<select id="u-active" class="form-select">'
        + '<option value="1"' + (u.is_active ? ' selected' : '') + '>사용중</option>'
        + '<option value="0"' + (u.is_active ? '' : ' selected') + '>중지</option>'
        + '</select></div>'),
    '    </div>',
    '    <div class="tab-desc" style="margin:0.9rem 0 0"><span class="ico">💡</span>',
    '      <span><b>직원</b>은 과정 등록 · 대시보드 · 매출·매입 분석 · 과정 목록과',
    '      자기 비밀번호 변경만 볼 수 있습니다.<br><b>관리자</b>는 전부 볼 수 있습니다.</span></div>',
    '  </div>',
    '  <div class="modal-footer">',
    '    <button class="btn btn-ghost" onclick="this.closest(\'.modal-overlay\').remove()">취소</button>',
    '    <button class="btn btn-primary" onclick="userSave(' + (id || 'null') + ')">저장</button>',
    '  </div>',
    '</div>'
  ].join('');
  document.body.appendChild(div);
  setTimeout(function () { const el = document.getElementById('u-name'); if (el) el.focus(); }, 50);
}

async function userSave(id) {
  const body = {
    username: document.getElementById('u-name').value.trim(),
    name: document.getElementById('u-disp').value.trim(),
    role: document.getElementById('u-role').value
  };
  const pwEl = document.getElementById('u-pw');
  const acEl = document.getElementById('u-active');
  if (pwEl) body.password = pwEl.value;
  if (acEl) body.is_active = acEl.value === '1';

  if (!body.username || !body.name) return showToast('아이디와 이름을 입력해주세요.', 'error');
  if (!id && (body.password || '').length < 4) {
    return showToast('비밀번호는 4자 이상으로 해주세요.', 'error');
  }

  try {
    if (id) await API.updateUser(id, body);
    else await API.registerUser(body);
    dropModal();
    showToast(id ? '수정했습니다.' : '계정을 만들었습니다.', 'success');
    renderUsers();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

/** 다른 사람 비밀번호를 새로 정해준다 (지금 비밀번호를 몰라도 됨) */
function userResetPw(id) {
  const u = USERS_CACHE.find(function (x) { return x.id === id; }) || {};

  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.innerHTML = [
    '<div class="modal" style="max-width:400px">',
    '  <div class="modal-header">',
    '    <h3>비밀번호 새로 정하기</h3>',
    '    <button class="modal-close" onclick="this.closest(\'.modal-overlay\').remove()">✖</button>',
    '  </div>',
    '  <div class="modal-body">',
    '    <div class="tab-desc" style="margin:0 0 0.9rem"><span class="ico">🔑</span><span>',
    esc(u.name || '') + ' (' + esc(u.username || '') + ') 의 비밀번호를 새로 정합니다.',
    '    <br>지금 비밀번호는 몰라도 됩니다.</span></div>',
    '    <div class="form-group"><label class="form-label form-required">새 비밀번호</label>',
    '      ' + pwField('u-newpw', { autocomplete: 'new-password' }),
    '      <p class="form-hint">4자 이상. 정하신 뒤 본인에게 알려주세요.</p></div>',
    '  </div>',
    '  <div class="modal-footer">',
    '    <button class="btn btn-ghost" onclick="this.closest(\'.modal-overlay\').remove()">취소</button>',
    '    <button class="btn btn-primary" onclick="userResetPwSave(' + id + ')">저장</button>',
    '  </div>',
    '</div>'
  ].join('');
  document.body.appendChild(div);
  setTimeout(function () { const el = document.getElementById('u-newpw'); if (el) el.focus(); }, 50);
}

async function userResetPwSave(id) {
  const pw = document.getElementById('u-newpw').value;
  if ((pw || '').length < 4) return showToast('비밀번호는 4자 이상으로 해주세요.', 'error');
  try {
    await API.updateUser(id, { password: pw });
    dropModal();
    showToast('비밀번호를 새로 정했습니다.', 'success');
    renderUsers();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

/* ═══════════════════════════════════════════════════════════
   매출·매입 분석  —  한 화면에서 전체를 보고 필터로 좁힌다
   ═══════════════════════════════════════════════════════════ */

const AN = {
  year: '', month: '', manager: '', sales_rep: '', client_id: '', type: '', company: '', basis: 'start'
};
let AN_DATA = null;

/** 이익률 색 */
function anMarginClass(v) {
  if (v >= 40) return 'good';
  if (v >= 20) return 'mid';
  return 'low';
}

/** 표 한 줄 (매출 / 매입 / 이익 / 이익률) */
function anProfitRow(label, r, extra) {
  return '<tr>'
    + '<td class="an-name">' + label + '</td>'
    + '<td class="c-mid">' + formatNumber(r.count || 0) + '</td>'
    + (extra || '')
    + '<td class="amount-cell amount-positive">' + formatNumber(r.sales || 0) + '</td>'
    + '<td class="amount-cell amount-negative">' + formatNumber(r.expenses || 0) + '</td>'
    + '<td class="amount-cell an-profit' + ((r.profit || 0) < 0 ? ' minus' : '') + '">'
    +   formatNumber(r.profit || 0) + '</td>'
    + '<td class="c-mid an-rate ' + anMarginClass(r.margin || 0) + '">'
    +   (r.sales ? (r.margin || 0).toFixed(1) + '%' : '-') + '</td>'
    + '</tr>';
}

/** 합계 줄 */
function anTotalRow(rows, label, colspan) {
  const sum = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
  const sales = sum('sales'), expenses = sum('expenses'), profit = sum('profit');
  return '<tr class="an-sum">'
    + '<td class="an-name">' + (label || '합계') + '</td>'
    + '<td class="c-mid">' + formatNumber(sum('count')) + '</td>'
    + (colspan ? '<td colspan="' + colspan + '"></td>' : '')
    + '<td class="amount-cell">' + formatNumber(sales) + '</td>'
    + '<td class="amount-cell">' + formatNumber(expenses) + '</td>'
    + '<td class="amount-cell">' + formatNumber(profit) + '</td>'
    + '<td class="c-mid">' + (sales ? ((profit / sales) * 100).toFixed(1) + '%' : '-') + '</td>'
    + '</tr>';
}

/** 매출/매입/이익 표 한 덩어리 */
function anProfitTable(title, hint, rows, firstCol) {
  if (!rows || rows.length === 0) {
    return '<div class="an-sec"><h3>' + title + '</h3>'
      + '<div class="an-empty">해당 기간에 자료가 없습니다.</div></div>';
  }
  return '<div class="an-sec">'
    + '<h3>' + title + (hint ? '<em>' + hint + '</em>' : '') + '</h3>'
    + '<div class="table-container"><table class="data-table an-table">'
    + '<thead><tr>'
    +   '<th>' + firstCol + '</th><th class="th-mid">건수</th>'
    +   '<th class="th-num">매출</th><th class="th-num">매입</th>'
    +   '<th class="th-num">이익</th><th class="th-mid">이익률</th>'
    + '</tr></thead><tbody>'
    + rows.map(r => anProfitRow(esc(r.name), r)).join('')
    + anTotalRow(rows)
    + '</tbody></table></div></div>';
}

/** 매입 명단 표 (강사별 · 협력사별) */
function anExpenseTable(title, hint, rows, firstCol, showHours) {
  if (!rows || rows.length === 0) {
    return '<div class="an-sec"><h3>' + title + '</h3>'
      + '<div class="an-empty">해당 기간에 자료가 없습니다.</div></div>';
  }
  const sum = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
  return '<div class="an-sec">'
    + '<h3>' + title + (hint ? '<em>' + hint + '</em>' : '') + '</h3>'
    + '<div class="table-container"><table class="data-table an-table">'
    + '<thead><tr>'
    +   '<th>' + firstCol + '</th><th>소속</th>'
    +   '<th class="th-mid">과정수</th><th class="th-mid">건수</th>'
    +   (showHours ? '<th class="th-mid">시간</th>' : '')
    +   '<th class="th-num">매입 총액</th><th class="th-num">세금</th><th class="th-num">실지급액</th>'
    + '</tr></thead><tbody>'
    + rows.map(r =>
      '<tr>'
      + '<td class="an-name">' + esc(r.name) + '</td>'
      + '<td class="an-sub">' + esc(r.affiliation || '-') + '</td>'
      + '<td class="c-mid">' + formatNumber(r.project_count || 0) + '</td>'
      + '<td class="c-mid">' + formatNumber(r.count || 0) + '</td>'
      + (showHours ? '<td class="c-mid">' + (r.hours || 0) + '</td>' : '')
      + '<td class="amount-cell amount-negative">' + formatNumber(r.amount || 0) + '</td>'
      + '<td class="amount-cell an-sub">' + formatNumber(r.tax || 0) + '</td>'
      + '<td class="amount-cell">' + formatNumber(r.payment || 0) + '</td>'
      + '</tr>'
    ).join('')
    + '<tr class="an-sum">'
    +   '<td class="an-name">합계</td><td></td>'
    +   '<td class="c-mid">-</td><td class="c-mid">' + formatNumber(sum('count')) + '</td>'
    +   (showHours ? '<td class="c-mid">' + sum('hours') + '</td>' : '')
    +   '<td class="amount-cell">' + formatNumber(sum('amount')) + '</td>'
    +   '<td class="amount-cell">' + formatNumber(sum('tax')) + '</td>'
    +   '<td class="amount-cell">' + formatNumber(sum('payment')) + '</td>'
    + '</tr>'
    + '</tbody></table></div></div>';
}

async function renderAnalytics() {
  const content = document.getElementById('main-content');
  content.innerHTML = '<div class="an-loading">불러오는 중...</div>';

  let d;
  try {
    d = await API.getAnalytics(AN);
  } catch (e) { showToast(e.message, 'error'); content.innerHTML = ''; return; }
  AN_DATA = d;
  // 서버가 정한 연도를 그대로 들고 있는다 (선택칸 표시와 실제 자료가 어긋나지 않도록)
  AN.year = d.period.year;

  const f = d.filters || {};
  const anYears = (f.years || []).slice();
  if (anYears.indexOf(String(d.period.year)) === -1) anYears.unshift(String(d.period.year));
  const s = d.summary || {};
  const opt = (v, label, cur) =>
    '<option value="' + esc(v) + '"' + (String(cur) === String(v) ? ' selected' : '') + '>'
    + esc(label) + '</option>';

  const hasFilter = AN.month || AN.manager || AN.sales_rep || AN.client_id || AN.type || AN.company;
  const periodLabel = d.period.year + '년' + (d.period.month ? ' ' + Number(d.period.month) + '월' : ' 전체');

  content.innerHTML = [
    '<div class="page-header">',
    '  <div><h2>매출·매입 분석</h2>',
    '    <div class="subtitle">전체를 펼쳐 놓고, 위 조건으로 좁혀 봅니다. 강사료·협력사 매입도 아래에 함께 있습니다.</div></div>',
    '</div>',

    /* ── 필터 ── */
    '<div class="list-filter an-filter">',
    '  <select class="form-select co-pick" onchange="setAn(\'company\', this.value)">',
    opt('', '회사 전체', AN.company),
    (f.companies || COMPANIES).map(n => opt(n, n, AN.company)).join(''),
    '  </select>',
    '  <select class="form-select" onchange="setAn(\'year\', this.value)">',
    anYears.map(y => opt(y, y + '년', d.period.year)).join(''),
    '  </select>',
    '  <select class="form-select" onchange="setAn(\'month\', this.value)">',
    opt('', '연간 전체', AN.month),
    Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
      .map(m => opt(m, Number(m) + '월', AN.month)).join(''),
    '  </select>',
    '  <select class="form-select" onchange="setAn(\'manager\', this.value)">',
    opt('', '혜움 담당자 전체', AN.manager),
    (f.managers || []).map(m => opt(m, m, AN.manager)).join(''),
    '  </select>',
    '  <select class="form-select" onchange="setAn(\'sales_rep\', this.value)">',
    opt('', '영업(외부) 전체', AN.sales_rep),
    (f.salesReps || []).map(m => opt(m, m, AN.sales_rep)).join(''),
    '  </select>',
    '  <select class="form-select" onchange="setAn(\'client_id\', this.value)">',
    opt('', '고객사 전체', AN.client_id),
    (f.clients || []).map(c => opt(c.id, c.name, AN.client_id)).join(''),
    '  </select>',
    '  <select class="form-select" onchange="setAn(\'type\', this.value)">',
    opt('', '구분 전체', AN.type),
    (f.types || []).map(t => opt(t, t, AN.type)).join(''),
    '  </select>',
    '  <select class="form-select" onchange="setAn(\'basis\', this.value)" title="여러 달에 걸친 교육을 어느 달에 넣을지">',
    opt('start', '기준: 교육 시작월', AN.basis),
    opt('invoice', '기준: 계산서 발행월', AN.basis),
    opt('overlap', '기준: 교육 진행월(중복)', AN.basis),
    '  </select>',
    (hasFilter ? '<button class="btn btn-ghost btn-sm" onclick="resetAn()">✕ 조건 지우기</button>' : ''),
    '</div>',

    /* ── 요약 ── */
    '<div class="an-summary">',
    '  <div class="an-card sales"><div class="an-k">' + icon('sales', 20) + ' 총 매출<i>부가세 별도</i></div>',
    '    <div class="an-v">' + formatNumber(s.sales || 0) + '</div>',
    '    <div class="an-f">' + periodLabel + ' · 과정 ' + formatNumber(s.count || 0) + '건</div></div>',
    '  <div class="an-card expense"><div class="an-k">' + icon('expense', 20) + ' 과정 매입</div>',
    '    <div class="an-v">' + formatNumber(s.expenses || 0) + '</div>',
    '    <div class="an-f">강사료 · 협력사 · 법인카드 등</div></div>',
    '  <div class="an-card profit"><div class="an-k">' + icon('profit', 20) + ' 과정 이익</div>',
    '    <div class="an-v">' + formatNumber(s.profit || 0) + '</div>',
    '    <div class="an-f">이익률 ' + (s.margin || 0).toFixed(1) + '%</div></div>',
    '  <div class="an-card overhead"><div class="an-k">' + icon('overhead', 20) + ' 회사 경비</div>',
    '    <div class="an-v">' + formatNumber(s.overhead || 0) + '</div>',
    '    <div class="an-f">' + formatNumber(s.overhead_count || 0) + '건'
    + ohLink('입력하기') + '</div></div>',
    '  <div class="an-card operating"><div class="an-k">' + icon('chart', 20) + ' 영업이익</div>',
    '    <div class="an-v' + ((s.operating_profit || 0) < 0 ? ' minus' : '') + '">'
    +   formatNumber(s.operating_profit || 0) + '</div>',
    '    <div class="an-f">이익 − 경비 · ' + (s.operating_margin || 0).toFixed(1) + '%</div></div>',
    '</div>',

    /* ── 월별 ── */
    (function () {
      const rows = d.byMonth || [];
      const any = rows.some(r => r.count > 0 || r.overhead > 0);
      if (!any) return '<div class="an-sec"><h3>월별</h3><div class="an-empty">해당 연도에 자료가 없습니다.</div></div>';
      const sum = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
      const sales = sum('sales'), profit = sum('profit');
      return '<div class="an-sec"><h3>월별<em>' + d.period.year + '년 · 회사 경비까지 반영한 이익</em></h3>'
        + '<div class="table-container"><table class="data-table an-table">'
        + '<thead><tr><th>월</th><th class="th-mid">건수</th>'
        +   '<th class="th-num">매출</th><th class="th-num">과정 매입</th>'
        +   '<th class="th-num">회사 경비</th><th class="th-num">이익</th><th class="th-mid">이익률</th>'
        + '</tr></thead><tbody>'
        + rows.map(r =>
          '<tr' + (AN.month === r.month ? ' class="an-hl"' : '') + '>'
          + '<td class="an-name">' + Number(r.month) + '월</td>'
          + '<td class="c-mid">' + (r.count ? formatNumber(r.count) : '-') + '</td>'
          + '<td class="amount-cell amount-positive">' + formatNumber(r.sales) + '</td>'
          + '<td class="amount-cell amount-negative">' + formatNumber(r.expenses) + '</td>'
          + '<td class="amount-cell an-sub">' + formatNumber(r.overhead) + '</td>'
          + '<td class="amount-cell an-profit' + (r.profit < 0 ? ' minus' : '') + '">' + formatNumber(r.profit) + '</td>'
          + '<td class="c-mid an-rate ' + anMarginClass(r.margin) + '">'
          +   (r.sales ? r.margin.toFixed(1) + '%' : '-') + '</td>'
          + '</tr>'
        ).join('')
        + '<tr class="an-sum"><td class="an-name">연간 합계</td>'
        +   '<td class="c-mid">' + formatNumber(sum('count')) + '</td>'
        +   '<td class="amount-cell">' + formatNumber(sales) + '</td>'
        +   '<td class="amount-cell">' + formatNumber(sum('expenses')) + '</td>'
        +   '<td class="amount-cell">' + formatNumber(sum('overhead')) + '</td>'
        +   '<td class="amount-cell">' + formatNumber(profit) + '</td>'
        +   '<td class="c-mid">' + (sales ? ((profit / sales) * 100).toFixed(1) + '%' : '-') + '</td>'
        + '</tr></tbody></table></div></div>';
    })(),

    /* ── 회사별 ── */
    '<div class="an-two">',
    anProfitTable('회사별', '과정을 진행한 회사 기준', d.byCompany, '회사'),
    (function () {
      const rows = d.byInvoiceCompany || [];
      if (rows.length === 0) {
        return '<div class="an-sec"><h3>세금계산서 발행회사별</h3>'
          + '<div class="an-empty">발행된 계산서가 없습니다.</div></div>';
      }
      const sum = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
      return '<div class="an-sec"><h3>세금계산서 발행회사별<em>실제 발행한 회사 기준</em></h3>'
        + '<div class="table-container"><table class="data-table an-table">'
        + '<thead><tr><th>발행회사</th><th class="th-mid">장수</th>'
        +   '<th class="th-num">공급가액</th><th class="th-num">부가세</th>'
        +   '<th class="th-num">합계</th><th class="th-num">미수금</th></tr></thead><tbody>'
        + rows.map(r =>
          '<tr><td class="an-name">' + esc(r.name) + '</td>'
          + '<td class="c-mid">' + formatNumber(r.count) + '</td>'
          + '<td class="amount-cell amount-positive">' + formatNumber(r.supply) + '</td>'
          + '<td class="amount-cell an-sub">' + formatNumber(r.vat) + '</td>'
          + '<td class="amount-cell">' + formatNumber(r.total) + '</td>'
          + '<td class="amount-cell' + (r.unpaid ? ' amount-negative' : '') + '">'
          +   (r.unpaid ? formatNumber(r.unpaid) : '-') + '</td></tr>'
        ).join('')
        + '<tr class="an-sum"><td class="an-name">합계</td>'
        +   '<td class="c-mid">' + formatNumber(sum('count')) + '</td>'
        +   '<td class="amount-cell">' + formatNumber(sum('supply')) + '</td>'
        +   '<td class="amount-cell">' + formatNumber(sum('vat')) + '</td>'
        +   '<td class="amount-cell">' + formatNumber(sum('total')) + '</td>'
        +   '<td class="amount-cell">' + formatNumber(sum('unpaid')) + '</td>'
        + '</tr></tbody></table></div></div>';
    })(),
    '</div>',

    /* ── 고객사별 ── */
    anProfitTable('고객사별', '매출 많은 순', d.byClient, '고객사'),

    /* ── 담당자 · 영업 나란히 ── */
    '<div class="an-two">',
    anProfitTable('혜움 담당자별', '직원', d.byManager, '담당자'),
    (function () {
      const rows = d.bySalesRep || [];
      if (rows.length === 0) {
        return '<div class="an-sec"><h3>영업(외부)별</h3><div class="an-empty">해당 기간에 자료가 없습니다.</div></div>';
      }
      const sum = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
      const sales = sum('sales'), profit = sum('profit');
      return '<div class="an-sec"><h3>영업(외부)별<em>지급 수수료 포함</em></h3>'
        + '<div class="table-container"><table class="data-table an-table">'
        + '<thead><tr><th>영업</th><th class="th-mid">건수</th>'
        +   '<th class="th-num">매출</th><th class="th-num">매입</th>'
        +   '<th class="th-num">수수료</th><th class="th-num">이익</th><th class="th-mid">이익률</th>'
        + '</tr></thead><tbody>'
        + rows.map(r =>
          '<tr><td class="an-name">' + esc(r.name) + '</td>'
          + '<td class="c-mid">' + formatNumber(r.count) + '</td>'
          + '<td class="amount-cell amount-positive">' + formatNumber(r.sales) + '</td>'
          + '<td class="amount-cell amount-negative">' + formatNumber(r.expenses) + '</td>'
          + '<td class="amount-cell an-sub">' + formatNumber(r.fee || 0) + '</td>'
          + '<td class="amount-cell an-profit' + (r.profit < 0 ? ' minus' : '') + '">' + formatNumber(r.profit) + '</td>'
          + '<td class="c-mid an-rate ' + anMarginClass(r.margin) + '">'
          +   (r.sales ? r.margin.toFixed(1) + '%' : '-') + '</td></tr>'
        ).join('')
        + '<tr class="an-sum"><td class="an-name">합계</td>'
        +   '<td class="c-mid">' + formatNumber(sum('count')) + '</td>'
        +   '<td class="amount-cell">' + formatNumber(sales) + '</td>'
        +   '<td class="amount-cell">' + formatNumber(sum('expenses')) + '</td>'
        +   '<td class="amount-cell">' + formatNumber(sum('fee')) + '</td>'
        +   '<td class="amount-cell">' + formatNumber(profit) + '</td>'
        +   '<td class="c-mid">' + (sales ? ((profit / sales) * 100).toFixed(1) + '%' : '-') + '</td>'
        + '</tr></tbody></table></div></div>';
    })(),
    '</div>',

    /* ── 구분별 · 매입 분류별 나란히 ── */
    '<div class="an-two">',
    anProfitTable('구분별', '교육 · 특강 · 기타', d.byType, '구분'),
    (function () {
      const rows = d.byExpenseCategory || [];
      if (rows.length === 0) {
        return '<div class="an-sec"><h3>매입 분류별</h3><div class="an-empty">해당 기간에 자료가 없습니다.</div></div>';
      }
      const total = rows.reduce((a, r) => a + r.amount, 0);
      return '<div class="an-sec"><h3>매입 분류별<em>과정 매입의 구성</em></h3>'
        + '<div class="table-container"><table class="data-table an-table">'
        + '<thead><tr><th>분류</th><th class="th-mid">건수</th>'
        +   '<th class="th-num">총액</th><th class="th-num">세금</th>'
        +   '<th class="th-num">실지급액</th><th class="th-mid">비중</th>'
        + '</tr></thead><tbody>'
        + rows.map(r =>
          '<tr><td class="an-name">' + esc(r.name) + '</td>'
          + '<td class="c-mid">' + formatNumber(r.count) + '</td>'
          + '<td class="amount-cell amount-negative">' + formatNumber(r.amount) + '</td>'
          + '<td class="amount-cell an-sub">' + formatNumber(r.tax) + '</td>'
          + '<td class="amount-cell">' + formatNumber(r.payment) + '</td>'
          + '<td class="c-mid an-sub">' + (total ? ((r.amount / total) * 100).toFixed(1) + '%' : '-') + '</td></tr>'
        ).join('')
        + '<tr class="an-sum"><td class="an-name">합계</td>'
        +   '<td class="c-mid">' + formatNumber(rows.reduce((a, r) => a + r.count, 0)) + '</td>'
        +   '<td class="amount-cell">' + formatNumber(total) + '</td>'
        +   '<td class="amount-cell">' + formatNumber(rows.reduce((a, r) => a + r.tax, 0)) + '</td>'
        +   '<td class="amount-cell">' + formatNumber(rows.reduce((a, r) => a + r.payment, 0)) + '</td>'
        +   '<td class="c-mid">100%</td>'
        + '</tr></tbody></table></div></div>';
    })(),
    '</div>',

    /* ── 항목별 상세로 가는 안내 ──
     * 볼 수 없는 화면으로 가는 버튼은 내놓지 않는다 (직원 사이트).
     */
    (function () {
      const me = API.getUser();
      const jumps = [
        ['ent-instructor', '강사별 매입'],
        ['ent-partner', '협력사별 매입'],
        ['ent-card', '법인카드'],
        ['ent-client', '고객사'],
        ['staff', '직원 · 외부영업자']
      ].filter(function (j) { return canSeeRoute(me, j[0]); });

      if (!jumps.length) return '';
      return '<div class="an-jump"><span>항목 하나를 파고들려면</span>'
        + jumps.map(function (j) {
          return '<button onclick="navigate(\'' + j[0] + '\')">' + j[1] + '</button>';
        }).join('')
        + '</div>';
    })(),

    /* ── 회사 경비 분류별 ── */
    (function () {
      const rows = d.overheadByCategory || [];
      if (rows.length === 0) {
        return '<div class="an-sec"><h3>회사 경비 분류별</h3>'
          + '<div class="an-empty">해당 기간에 등록된 경비가 없습니다.'
          + ohLink('경비 입력하기') + '</div></div>';
      }
      const total = rows.reduce((a, r) => a + r.amount, 0);
      return '<div class="an-sec"><h3>회사 경비 분류별'
        + '<em>급여 · 4대보험 · 퇴직금 · 사무실운영비 등</em></h3>'
        + '<div class="table-container"><table class="data-table an-table">'
        + '<thead><tr><th>분류</th><th class="th-mid">건수</th>'
        +   '<th class="th-num">금액</th><th class="th-mid">비중</th></tr></thead><tbody>'
        + rows.map(r =>
          '<tr><td class="an-name">' + esc(r.name) + '</td>'
          + '<td class="c-mid">' + formatNumber(r.count) + '</td>'
          + '<td class="amount-cell amount-negative">' + formatNumber(r.amount) + '</td>'
          + '<td class="c-mid an-sub">' + (total ? ((r.amount / total) * 100).toFixed(1) + '%' : '-') + '</td></tr>'
        ).join('')
        + '<tr class="an-sum"><td class="an-name">합계</td>'
        +   '<td class="c-mid">' + formatNumber(rows.reduce((a, r) => a + r.count, 0)) + '</td>'
        +   '<td class="amount-cell">' + formatNumber(total) + '</td><td class="c-mid">100%</td>'
        + '</tr></tbody></table></div></div>';
    })()
  ].join('');
}

function setAn(key, value) {
  AN[key] = value;
  renderAnalytics();
}

function resetAn() {
  AN.month = ''; AN.manager = ''; AN.sales_rep = ''; AN.client_id = ''; AN.type = ''; AN.company = '';
  renderAnalytics();
}

/* ═══════════════════════════════════════════════════════════
   회사 경비 (판관비)  —  과정에 붙지 않는 회사 차원의 지출
   ═══════════════════════════════════════════════════════════ */

const OH_CATEGORIES = [
  { key: '급여',              desc: '직원 급여' },
  { key: '4대보험',           desc: '국민연금 · 건강보험 · 고용보험 · 산재보험' },
  { key: '퇴직금',            desc: '퇴직금 지급 · 퇴직연금 적립' },
  { key: '사무실운영비',       desc: '관리비 · 임대료 · 이자 · 공과금 등' },
  { key: '법인카드(직원)',     desc: '교육 물품 외 직원이 쓴 법인카드' },
  { key: '현금출금(경조사)',   desc: '경조사비 등 현금으로 나간 지출' },
  { key: '기타',              desc: '그 밖의 지출' }
];
const OH_TAX = ['해당없음', '세금계산서(과세)', '세금계산서(면세)', '카드(과세)'];

const OH = { year: '', month: '', category: '', q: '' };
let OH_DATA = null;

async function renderOverheads() {
  const content = document.getElementById('main-content');

  let d;
  try {
    d = await API.getOverheads(OH);
  } catch (e) { showToast(e.message, 'error'); return; }
  OH_DATA = d;

  const f = d.filters || {};
  const t = d.totals || {};
  const opt = (v, label, cur) =>
    '<option value="' + esc(v) + '"' + (String(cur) === String(v) ? ' selected' : '') + '>'
    + esc(label) + '</option>';

  const years = (f.years || []).slice();
  const thisYear = String(new Date().getFullYear());
  if (years.indexOf(thisYear) === -1) years.unshift(thisYear);

  content.innerHTML = [
    '<div class="page-header">',
    '  <div><h2>회사 경비</h2>',
    '    <div class="subtitle">과정에 붙지 않는 회사 지출입니다 — 급여 · 4대보험 · 퇴직금 · 사무실운영비 · 법인카드(직원) · 경조사 등.'
    + ' 분석 화면의 영업이익에 반영됩니다.</div></div>',
    '  <button class="btn btn-primary" onclick="openOhModal()">＋ 경비 등록</button>',
    '</div>',

    '<div class="list-filter">',
    '  <div class="f-search">',
    '    <input type="text" id="oh-q" class="form-input" placeholder="내역 · 비고 검색" value="' + esc(OH.q) + '"'
    + ' oninput="onOhSearch(this.value)">',
    '  </div>',
    '  <select class="form-select" onchange="setOh(\'year\', this.value)">',
    opt('', '전체 연도', OH.year),
    years.map(y => opt(y, y + '년', OH.year)).join(''),
    '  </select>',
    '  <select class="form-select" onchange="setOh(\'month\', this.value)"' + (OH.year ? '' : ' disabled title="연도를 먼저 고르세요"') + '>',
    opt('', '전체 월', OH.month),
    Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
      .map(m => opt(m, Number(m) + '월', OH.month)).join(''),
    '  </select>',
    '  <select class="form-select" onchange="setOh(\'category\', this.value)">',
    opt('', '분류 전체', OH.category),
    OH_CATEGORIES.map(c => opt(c.key, c.key, OH.category)).join(''),
    '  </select>',
    ((OH.q || OH.year || OH.month || OH.category)
      ? '<button class="btn btn-ghost btn-sm" onclick="resetOh()">✕ 조건 지우기</button>' : ''),
    '</div>',

    '<div class="list-total">',
    '  <span class="cnt"><b>' + formatNumber(t.count || 0) + '</b>건</span>',
    '  <span class="it"><i>합계</i><b class="exp">' + formatNumber(t.amount || 0) + '</b></span>',
    '  <span class="it"><i>부가세</i><b>' + formatNumber(t.vat || 0) + '</b></span>',
    (d.byCategory || []).map(r =>
      '<span class="it"><i>' + esc(r.category) + '</i><b>' + formatNumber(r.amount) + '</b></span>'
    ).join(''),
    '</div>',

    (d.overheads.length === 0
      ? '<div class="empty-state" style="padding:3rem"><p>등록된 경비가 없습니다.</p>'
        + '<button class="btn btn-primary btn-sm" style="margin-top:1rem" onclick="openOhModal()">＋ 첫 경비 등록</button></div>'
      : [
        '<div class="table-container"><table class="data-table">',
        '<thead><tr><th>지출일</th><th>분류</th><th>내역</th>',
        '  <th class="th-num">금액</th><th class="th-num">부가세</th>',
        '  <th>부가세 처리</th><th class="th-mid">카드</th><th>비고</th><th>등록자</th><th></th></tr></thead><tbody>',
        d.overheads.map(o =>
          '<tr>'
          + '<td class="c-mid" style="white-space:nowrap">' + esc(o.spend_date) + '</td>'
          + '<td><span class="badge badge-admin">' + esc(o.category) + '</span></td>'
          + '<td style="font-weight:600">' + esc(o.name || '-') + '</td>'
          + '<td class="amount-cell amount-negative">' + formatNumber(o.amount) + '</td>'
          + '<td class="amount-cell an-sub">' + (o.vat ? formatNumber(o.vat) : '-') + '</td>'
          + '<td class="an-sub" style="font-size:0.8rem">' + esc(o.tax_type || '-') + '</td>'
          + '<td class="c-mid an-sub" style="font-size:0.8rem">'
          +   (o.card_last4 ? '···' + esc(o.card_last4) : '-') + '</td>'
          + '<td class="an-sub" style="font-size:0.8rem">' + esc(o.note || '-') + '</td>'
          + '<td class="c-mid an-sub" style="font-size:0.8rem">' + esc(o.created_by_name || '-') + '</td>'
          + '<td style="white-space:nowrap">'
          +   '<button class="btn btn-ghost btn-sm" onclick="openOhModal(' + o.id + ')">✎</button> '
          +   '<button class="btn btn-danger btn-sm" onclick="deleteOh(' + o.id + ')">✕</button>'
          + '</td></tr>'
        ).join(''),
        '</tbody></table></div>'
      ].join(''))
  ].join('');
}

function setOh(key, value) {
  OH[key] = value;
  if (key === 'year' && !value) OH.month = '';
  renderOverheads();
}

function resetOh() {
  OH.year = ''; OH.month = ''; OH.category = ''; OH.q = '';
  renderOverheads();
}

let ohSearchTimer = null;
function onOhSearch(v) {
  OH.q = v;
  clearTimeout(ohSearchTimer);
  ohSearchTimer = setTimeout(function () {
    renderOverheads();
    const el = document.getElementById('oh-q');
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }, 350);
}

/** 등록 · 수정 창 */
function openOhModal(id) {
  const o = id && OH_DATA
    ? (OH_DATA.overheads || []).find(x => x.id === id)
    : null;

  const today = new Date();
  const ymd = today.getFullYear() + '-'
    + String(today.getMonth() + 1).padStart(2, '0') + '-'
    + String(today.getDate()).padStart(2, '0');

  const html = [
    '<div class="modal-overlay" onclick="if(event.target===this)this.remove()">',
    '  <div class="modal">',
    '    <div class="modal-header"><h3>' + (o ? '경비 수정' : '경비 등록') + '</h3>',
    '      <button class="modal-close" onclick="this.closest(\'.modal-overlay\').remove()">✕</button></div>',
    '    <div class="modal-body">',
    '      <div class="form-row">',
    '        <div class="form-group"><label class="form-label form-required">지출일</label>',
    '          <input type="date" id="oh-date" class="form-input" value="' + esc(o ? o.spend_date : ymd) + '"></div>',
    '        <div class="form-group"><label class="form-label form-required">분류</label>',
    '          <select id="oh-cat" class="form-select" onchange="ohCatHint()">',
    OH_CATEGORIES.map(c =>
      '<option value="' + esc(c.key) + '"' + (o && o.category === c.key ? ' selected' : '') + '>'
      + esc(c.key) + '</option>').join(''),
    '          </select></div>',
    '      </div>',
    '      <div class="oh-hint" id="oh-hint"></div>',
    '      <div class="form-group"><label class="form-label form-required">내역</label>',
    '        <input type="text" id="oh-name" class="form-input" placeholder="예) 9월 급여 / 사무실 관리비 / 거래처 경조사"'
    + ' value="' + esc(o ? o.name : '') + '"></div>',
    '      <div class="form-row">',
    '        <div class="form-group"><label class="form-label form-required">금액</label>',
    '          <input type="text" id="oh-amount" class="form-input amt" inputmode="numeric"'
    + ' value="' + (o ? formatNumber(o.amount) : '') + '" oninput="ohAmt(this)"></div>',
    '        <div class="form-group"><label class="form-label">부가세 처리</label>',
    '          <select id="oh-tax" class="form-select" onchange="ohCalcVat()">',
    OH_TAX.map(x =>
      '<option value="' + esc(x) + '"' + (o && o.tax_type === x ? ' selected' : '') + '>'
      + esc(x) + '</option>').join(''),
    '          </select></div>',
    '        <div class="form-group"><label class="form-label">부가세</label>',
    '          <input type="text" id="oh-vat" class="form-input amt" inputmode="numeric"'
    + ' value="' + (o ? formatNumber(o.vat) : '0') + '" oninput="ohAmt(this)"></div>',
    '      </div>',
    '      <div class="form-row">',
    '        <div class="form-group"><label class="form-label">카드 뒤 4자리</label>',
    '          <input type="text" id="oh-card" class="form-input card4" inputmode="numeric" maxlength="4"'
    + ' placeholder="법인카드일 때만" list="oh-card-list" value="' + esc(o ? o.card_last4 : '') + '"'
    + ' oninput="this.value=this.value.replace(/[^0-9]/g,\'\').slice(0,4)">',
    '          <datalist id="oh-card-list">'
    + ((OH_DATA && OH_DATA.filters && OH_DATA.filters.cards) || []).map(c => '<option value="' + esc(c) + '">').join('')
    + '</datalist></div>',
    '        <div class="form-group" style="flex:2"><label class="form-label">비고</label>',
    '          <input type="text" id="oh-note" class="form-input" value="' + esc(o ? o.note : '') + '"></div>',
    '      </div>',
    '    </div>',
    '    <div class="modal-footer">',
    (o ? '<button class="btn btn-danger btn-sm" onclick="deleteOh(' + o.id + ')">삭제</button>' : ''),
    '      <button class="btn btn-ghost" onclick="this.closest(\'.modal-overlay\').remove()">취소</button>',
    '      <button class="btn btn-primary" onclick="saveOh(' + (o ? o.id : 'null') + ')">저장</button>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('');

  document.body.insertAdjacentHTML('beforeend', html);
  ohCatHint();
}

/** 금액칸에 콤마 */
function ohAmt(el) {
  const n = parseInt(String(el.value).replace(/[^0-9]/g, '')) || 0;
  el.value = n ? formatNumber(n) : '';
}

function ohNum(id) {
  const el = document.getElementById(id);
  return el ? (parseInt(String(el.value).replace(/[^0-9]/g, '')) || 0) : 0;
}

function ohCatHint() {
  const sel = document.getElementById('oh-cat');
  const box = document.getElementById('oh-hint');
  if (!sel || !box) return;
  const def = OH_CATEGORIES.find(c => c.key === sel.value);
  box.textContent = def ? def.desc : '';
}

/** 과세면 부가세를 자동으로 채운다 */
function ohCalcVat() {
  const tax = document.getElementById('oh-tax');
  const vat = document.getElementById('oh-vat');
  if (!tax || !vat) return;
  const amount = ohNum('oh-amount');
  if (tax.value === '세금계산서(과세)') vat.value = formatNumber(Math.round(amount * 0.1));
  else if (tax.value === '카드(과세)') vat.value = formatNumber(Math.round(amount / 11));
  else vat.value = '0';
}

async function saveOh(id) {
  const data = {
    spend_date: (document.getElementById('oh-date') || {}).value || '',
    category: (document.getElementById('oh-cat') || {}).value || '기타',
    name: ((document.getElementById('oh-name') || {}).value || '').trim(),
    amount: ohNum('oh-amount'),
    vat: ohNum('oh-vat'),
    tax_type: (document.getElementById('oh-tax') || {}).value || '해당없음',
    note: ((document.getElementById('oh-note') || {}).value || '').trim(),
    card_last4: ((document.getElementById('oh-card') || {}).value || '').trim()
  };

  if (!data.spend_date) return showToast('지출일을 고르세요.', 'error');
  if (!data.name) return showToast('내역을 적어주세요.', 'error');
  if (!data.amount) return showToast('금액을 적어주세요.', 'error');

  try {
    if (id) await API.updateOverhead(id, data);
    else await API.createOverhead(data);
    const ov = document.querySelector('.modal-overlay');
    if (ov) ov.remove();
    showToast(id ? '수정했습니다.' : '등록했습니다.', 'success');
    renderOverheads();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteOh(id) {
  if (!confirm('이 경비를 삭제할까요?')) return;
  try {
    await API.deleteOverhead(id);
    const ov = document.querySelector('.modal-overlay');
    if (ov) ov.remove();
    showToast('삭제했습니다.', 'success');
    renderOverheads();
  } catch (e) { showToast(e.message, 'error'); }
}

/* ═══════════════════════════════════════════════════════════
   항목별 상세  —  고객사 · 강사 · 협력사 · 직원·외부영업자

   한 항목을 고르면 그 항목이 들어간 과정을 한 줄씩 펼쳐 본다.
   [실적] 탭 = 기간별 집계 + 펼쳐보기
   [명단] 탭 = 등록 · 수정 (전에 관리자 메뉴에 있던 화면)
   ═══════════════════════════════════════════════════════════ */

const ENT_DEFS = {
  client: {
    title: '고객사', sub: '고객사별 매출·매입·이익을 보고, 한 곳을 펼치면 그 과정 목록이 나옵니다.',
    anKey: 'byClient', first: '고객사', mode: 'profit', manage: 'clients', manageLabel: '고객사 명단'
  },
  instructor: {
    title: '강사', sub: '강사별 매입(강사료)입니다. 한 사람을 펼치면 어느 과정에서 얼마였는지 나옵니다.',
    anKey: 'byInstructor', first: '강사 / 업체', mode: 'expense', hours: true,
    manage: 'instructors', manageLabel: '강사 명단'
  },
  partner: {
    title: '협력사', sub: '협력사(운영)별 매입입니다. 교보재·버스·연수원 등.',
    anKey: 'byPartner', first: '협력사', mode: 'expense',
    manage: 'partners', manageLabel: '협력사 명단'
  },
  card: {
    title: '법인카드', sub: '카드 뒤 4자리별 교육운영 결제액입니다. 카드 등록은 [법인카드 명단]에서 합니다.',
    anKey: 'byCard', first: '카드 뒤 4자리', mode: 'expense',
    manage: 'cards', manageLabel: '법인카드 명단'
  }
};

/** 항목별 화면 상태 */
const ENT = {
  kind: 'client', tab: '실적', year: '', month: '', q: '', tax: '',
  sort: 'amount',          // 기본은 금액 많은 순
  open: null, detail: null
};

/*
 * 정렬 선택지.
 *   profit  고객사처럼 매출·매입·이익이 있는 목록
 *   expense 강사·협력사처럼 매입만 있는 목록
 */
const ENT_SORTS = {
  profit: [
    ['amount', '매출 많은순'],
    ['amount_asc', '매출 적은순'],
    ['expense', '매입 많은순'],
    ['profit', '이익 많은순'],
    ['margin', '이익률 높은순'],
    ['count', '과정수 많은순'],
    ['name', '가나다순']
  ],
  expense: [
    ['amount', '매입 많은순'],
    ['amount_asc', '매입 적은순'],
    ['payment', '실지급 많은순'],
    ['count', '건수 많은순'],
    ['pcount', '과정수 많은순'],
    ['name', '가나다순']
  ]
};

/** 고른 기준으로 줄을 정렬한다 */
function entSort(rows, mode, sort) {
  const num = function (v) { return Number(v) || 0; };
  const by = {
    amount:     function (a, b) { return num(mode === 'profit' ? b.sales : b.amount) - num(mode === 'profit' ? a.sales : a.amount); },
    amount_asc: function (a, b) { return num(mode === 'profit' ? a.sales : a.amount) - num(mode === 'profit' ? b.sales : b.amount); },
    expense:    function (a, b) { return num(b.expenses) - num(a.expenses); },
    profit:     function (a, b) { return num(b.profit) - num(a.profit); },
    margin:     function (a, b) { return num(b.margin) - num(a.margin); },
    payment:    function (a, b) { return num(b.payment) - num(a.payment); },
    count:      function (a, b) { return num(b.count) - num(a.count); },
    pcount:     function (a, b) { return num(b.project_count) - num(a.project_count); },
    name:       function (a, b) { return String(a.name).localeCompare(String(b.name), 'ko'); }
  };
  return rows.slice().sort(by[sort] || by.amount);
}

function entLabel(kind) { return (ENT_DEFS[kind] || {}).title || kind; }

async function renderEntity(kind) {
  if (kind && kind !== ENT.kind) {
    ENT.kind = kind; ENT.open = null; ENT.detail = null;
    ENT.q = ''; ENT.tax = ''; ENT.tab = '실적'; ENT.sort = 'amount';
  }
  const def = ENT_DEFS[ENT.kind];
  const content = document.getElementById('main-content');

  if (ENT.tab === '명단') {
    // 명단 탭은 기존 관리 화면을 그대로 쓴다
    content.innerHTML = '<div class="an-loading">불러오는 중...</div>';
    const head = entHeader(def);
    if (def.manage === 'clients') await renderClients();
    else if (def.manage === 'instructors') await renderInstructors();
    else if (def.manage === 'partners') await renderPartners();
    else if (def.manage === 'cards') await renderCards();
    else content.innerHTML = '';
    content.insertAdjacentHTML('afterbegin', head);
    return;
  }

  let d;
  try {
    d = await API.getAnalytics({
      year: ENT.year, month: ENT.month, basis: 'start',
      // 강사·협력사는 세율로 좁혀 볼 수 있다
      tax: (ENT.kind === 'instructor' || ENT.kind === 'partner') ? ENT.tax : ''
    });
  } catch (e) { showToast(e.message, 'error'); return; }

  ENT.year = d.period.year;
  const years = (d.filters.years || []).slice();
  if (years.indexOf(String(d.period.year)) === -1) years.unshift(String(d.period.year));

  let rows = d[def.anKey] || [];
  if (ENT.q) {
    const q = ENT.q.toLowerCase();
    rows = rows.filter(r => String(r.name).toLowerCase().includes(q)
      || String(r.affiliation || '').toLowerCase().includes(q));
  }
  rows = entSort(rows, def.mode, ENT.sort);

  const opt = (v, label, cur) =>
    '<option value="' + esc(v) + '"' + (String(cur) === String(v) ? ' selected' : '') + '>'
    + esc(label) + '</option>';

  content.innerHTML = [
    entHeader(def),

    '<div class="list-filter">',
    '  <div class="f-search">',
    '    <input type="text" id="ent-q" class="form-input" placeholder="' + esc(def.first) + ' 검색"'
    + ' value="' + esc(ENT.q) + '" oninput="onEntSearch(this.value)">',
    '  </div>',
    '  <select class="form-select" onchange="setEnt(\'year\', this.value)">',
    years.map(y => opt(y, y + '년', d.period.year)).join(''),
    '  </select>',
    '  <select class="form-select" onchange="setEnt(\'month\', this.value)">',
    opt('', '연간 전체', ENT.month),
    Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
      .map(m => opt(m, Number(m) + '월', ENT.month)).join(''),
    '  </select>',
    '  <select class="form-select" onchange="setEnt(\'sort\', this.value)">',
    (ENT_SORTS[def.mode] || ENT_SORTS.expense).map(o => opt(o[0], o[1], ENT.sort)).join(''),
    '  </select>',
    (ENT.q || ENT.month || ENT.tax ? '<button class="btn btn-ghost btn-sm" onclick="resetEnt()">✕ 조건 지우기</button>' : ''),
    '</div>',

    // 강사 매입은 세율(원천징수·계산서·급여 등)로 나눠 본다
    (ENT.kind === 'instructor' ? entTaxBar(d.instructorTax || []) : ''),

    (rows.length === 0
      ? '<div class="empty-state" style="padding:3rem"><p>해당 기간에 자료가 없습니다.</p></div>'
      : (def.mode === 'profit' ? entProfitTable(rows, def) : entExpenseTable(rows, def)))
  ].join('');
}

/** 제목 + 탭 */
function entHeader(def) {
  return [
    '<div class="page-header">',
    '  <div><h2>' + esc(def.title) + '</h2>',
    '    <div class="subtitle">' + esc(def.sub) + '</div></div>',
    '</div>',
    (def.manage
      ? '<div class="ent-tabs">'
        + '<button class="ent-tab' + (ENT.tab === '실적' ? ' active' : '') + '" onclick="setEntTab(\'실적\')">실적</button>'
        + '<button class="ent-tab' + (ENT.tab === '명단' ? ' active' : '') + '" onclick="setEntTab(\'명단\')">'
        + esc(def.manageLabel) + '</button>'
        + '</div>'
      : '')
  ].join('');
}

/** 매출·매입·이익 표 (고객사) */
function entProfitTable(rows, def) {
  const sum = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
  const sales = sum('sales'), profit = sum('profit');
  return '<div class="table-container"><table class="data-table an-table">'
    + '<thead><tr><th style="width:2rem"></th><th>' + esc(def.first) + '</th>'
    +   '<th class="th-mid">과정수</th><th class="th-num">매출</th><th class="th-num">매입</th>'
    +   '<th class="th-num">이익</th><th class="th-mid">이익률</th></tr></thead><tbody>'
    + rows.map(r => entRow(r, def, [
      '<td class="c-mid">' + formatNumber(r.count || 0) + '</td>',
      '<td class="amount-cell amount-positive">' + formatNumber(r.sales || 0) + '</td>',
      '<td class="amount-cell amount-negative">' + formatNumber(r.expenses || 0) + '</td>',
      '<td class="amount-cell an-profit' + ((r.profit || 0) < 0 ? ' minus' : '') + '">'
      + formatNumber(r.profit || 0) + '</td>',
      '<td class="c-mid an-rate ' + anMarginClass(r.margin || 0) + '">'
      + (r.sales ? (r.margin || 0).toFixed(1) + '%' : '-') + '</td>'
    ].join(''), 7)).join('')
    + '<tr class="an-sum"><td></td><td class="an-name">합계</td>'
    +   '<td class="c-mid">' + formatNumber(sum('count')) + '</td>'
    +   '<td class="amount-cell">' + formatNumber(sales) + '</td>'
    +   '<td class="amount-cell">' + formatNumber(sum('expenses')) + '</td>'
    +   '<td class="amount-cell">' + formatNumber(profit) + '</td>'
    +   '<td class="c-mid">' + (sales ? ((profit / sales) * 100).toFixed(1) + '%' : '-') + '</td>'
    + '</tr></tbody></table></div>';
}

/** 매입 표 (강사 · 협력사 · 법인카드) */
function entExpenseTable(rows, def) {
  const sum = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
  const cols = 6 + (def.hours ? 1 : 0) + 1;
  return '<div class="table-container"><table class="data-table an-table">'
    + '<thead><tr><th style="width:2rem"></th><th>' + esc(def.first) + '</th>'
    +   (def.mode === 'expense' && def.anKey !== 'byCard' ? '<th>소속</th>' : '')
    +   '<th class="th-mid">과정수</th><th class="th-mid">건수</th>'
    +   (def.hours ? '<th class="th-mid">시간</th>' : '')
    +   '<th class="th-num">매입 총액</th><th class="th-num">세금</th><th class="th-num">실지급액</th>'
    + '</tr></thead><tbody>'
    + rows.map(r => entRow(r, def, [
      (def.anKey !== 'byCard' ? '<td class="an-sub">' + esc(r.affiliation || '-') + '</td>' : ''),
      '<td class="c-mid">' + formatNumber(r.project_count || 0) + '</td>',
      '<td class="c-mid">' + formatNumber(r.count || 0) + '</td>',
      (def.hours ? '<td class="c-mid">' + (r.hours || 0) + '</td>' : ''),
      '<td class="amount-cell amount-negative">' + formatNumber(r.amount || 0) + '</td>',
      '<td class="amount-cell an-sub">' + formatNumber(r.tax || 0) + '</td>',
      '<td class="amount-cell">' + formatNumber(r.payment || 0) + '</td>'
    ].join(''), cols + (def.anKey !== 'byCard' ? 1 : 0))).join('')
    + '<tr class="an-sum"><td></td><td class="an-name">합계</td>'
    +   (def.anKey !== 'byCard' ? '<td></td>' : '')
    +   '<td class="c-mid">-</td><td class="c-mid">' + formatNumber(sum('count')) + '</td>'
    +   (def.hours ? '<td class="c-mid">' + sum('hours') + '</td>' : '')
    +   '<td class="amount-cell">' + formatNumber(sum('amount')) + '</td>'
    +   '<td class="amount-cell">' + formatNumber(sum('tax')) + '</td>'
    +   '<td class="amount-cell">' + formatNumber(sum('payment')) + '</td>'
    + '</tr></tbody></table></div>';
}

/** 한 줄 + (펼쳤으면) 세부 내역 */
function entRow(r, def, cells, colspan) {
  const open = ENT.open === r.name;
  const key = esc(r.name).replace(/'/g, '&#39;');
  return '<tr class="ent-row' + (open ? ' open' : '') + '" onclick="toggleEnt(\'' + key + '\')">'
    + '<td class="ent-caret">' + (open ? '▾' : '▸') + '</td>'
    + '<td class="an-name">' + esc(r.name) + '</td>'
    + cells
    + '</tr>'
    + (open
      ? '<tr class="ent-detail"><td colspan="' + colspan + '">'
        + (ENT.detail ? entDetailBody(def) : '<div class="an-loading">불러오는 중...</div>')
        + '</td></tr>'
      : '');
}

/** 펼친 내용 */
function entDetailBody(def) {
  const d = ENT.detail;
  if (!d || !d.rows || d.rows.length === 0) {
    return '<div class="an-empty">세부 내역이 없습니다.</div>';
  }

  if (def.mode === 'profit') {
    return '<table class="data-table ent-inner"><thead><tr>'
      + '<th>교육일정</th><th>구분</th><th>과정명</th><th>담당자</th>'
      + '<th class="th-num">매출</th><th class="th-num">매입</th><th class="th-num">이익</th>'
      + '<th class="th-num">미수금</th></tr></thead><tbody>'
      + d.rows.map(r => {
        const profit = (r.total_sales || 0) - (r.total_expenses || 0);
        return '<tr style="cursor:pointer" onclick="event.stopPropagation(); navigate(\'project-form\', ' + r.id + ')">'
          + '<td class="c-mid an-sub">' + esc(scheduleLabel(r.schedule_dates)) + '</td>'
          + '<td><span class="badge badge-type">' + esc(r.type) + '</span></td>'
          + '<td style="font-weight:600">' + esc(r.course_name) + '</td>'
          + '<td class="c-mid an-sub">' + esc(r.manager || '-') + '</td>'
          + '<td class="amount-cell amount-positive">' + formatNumber(r.total_sales) + '</td>'
          + '<td class="amount-cell amount-negative">' + formatNumber(r.total_expenses) + '</td>'
          + '<td class="amount-cell an-profit' + (profit < 0 ? ' minus' : '') + '">' + formatNumber(profit) + '</td>'
          + '<td class="amount-cell">' + (r.unpaid ? formatNumber(r.unpaid) : '-') + '</td></tr>';
      }).join('')
      + '</tbody></table>';
  }

  return '<table class="data-table ent-inner"><thead><tr>'
    + '<th>교육일정</th><th>고객사</th><th>과정명</th>'
    + '<th class="th-mid">수량</th><th class="th-num">단가</th><th class="th-mid">차수</th>'
    + '<th class="th-num">총액</th><th>세율</th><th class="th-num">실지급액</th>'
    + '<th>입금일</th><th>비고</th></tr></thead><tbody>'
    + d.rows.map(r =>
      '<tr style="cursor:pointer" onclick="event.stopPropagation(); navigate(\'project-form\', ' + r.project_id + ')">'
      + '<td class="c-mid an-sub">' + esc(scheduleLabel(r.schedule_dates)) + '</td>'
      + '<td>' + esc(r.client_name || '-') + '</td>'
      + '<td style="font-weight:600">' + esc(r.course_name) + '</td>'
      + '<td class="c-mid">' + (r.quantity || 0) + esc(r.unit || '') + '</td>'
      + '<td class="amount-cell an-sub">' + formatNumber(r.unit_price || 0) + '</td>'
      + '<td class="c-mid an-sub">' + (r.sessions || 1) + '</td>'
      + '<td class="amount-cell amount-negative">' + formatNumber(r.total_amount || 0) + '</td>'
      + '<td class="an-sub" style="font-size:0.78rem">' + esc(r.tax_type || '-') + '</td>'
      + '<td class="amount-cell">' + formatNumber(r.payment_amount || 0) + '</td>'
      + '<td class="c-mid an-sub" style="font-size:0.78rem">' + esc(r.payment_date || '-') + '</td>'
      + '<td class="an-sub" style="font-size:0.78rem">' + esc(r.note || '-') + '</td></tr>'
    ).join('')
    + '</tbody></table>';
}

async function toggleEnt(name) {
  const key = String(name).replace(/&#39;/g, "'");
  if (ENT.open === key) { ENT.open = null; ENT.detail = null; return renderEntity(); }
  ENT.open = key; ENT.detail = null;
  await renderEntity();
  try {
    ENT.detail = await API.getAnalyticsDetail({
      kind: ENT.kind, key: key, year: ENT.year, month: ENT.month, basis: 'start',
      tax: (ENT.kind === 'instructor' || ENT.kind === 'partner') ? ENT.tax : ''
    });
  } catch (e) { showToast(e.message, 'error'); ENT.detail = { rows: [] }; }
  renderEntity();
}

/** 세율별 띠 — 누르면 그 세율만 본다 */
function entTaxBar(rows) {
  const total = rows.reduce(function (a, r) { return a + r.amount; }, 0);
  const chips = [{ name: '', label: '전체', amount: total, count: rows.reduce(function (a, r) { return a + r.count; }, 0) }]
    .concat(TAX_TYPES.map(function (t) {
      const m = rows.find(function (r) { return r.name === t.key; });
      return { name: t.key, label: t.label, amount: m ? m.amount : 0, count: m ? m.count : 0 };
    }))
    // 쓰인 적 없는 세율도 0원으로 보여준다 (어떤 분류가 있는지 한눈에 보이게)
    .concat(rows
      .filter(function (r) { return !TAX_TYPES.some(function (t) { return t.key === r.name; }); })
      .map(function (r) { return { name: r.name, label: r.name, amount: r.amount, count: r.count }; }));

  return '<div class="tax-bar">'
    + '<span class="lb">세율 분류</span>'
    + chips.map(function (x) {
        const on = ENT.tax === x.name;
        return '<button type="button" class="tax-chip' + (on ? ' on' : '') + '"'
          + ' onclick="setEnt(\'tax\', \'' + esc(x.name) + '\')">'
          + '<i>' + esc(x.label) + '</i>'
          + '<b>' + formatNumber(x.amount) + '</b>'
          + '<em>' + x.count + '건</em>'
          + '</button>';
      }).join('')
    + '</div>';
}

function setEnt(k, v) { ENT[k] = v; ENT.open = null; ENT.detail = null; renderEntity(); }
function resetEnt() { ENT.month = ''; ENT.q = ''; ENT.tax = ''; ENT.open = null; ENT.detail = null; renderEntity(); }
function setEntTab(t) { ENT.tab = t; renderEntity(); }

let entSearchTimer = null;
function onEntSearch(v) {
  ENT.q = v;
  clearTimeout(entSearchTimer);
  entSearchTimer = setTimeout(function () {
    renderEntity();
    const el = document.getElementById('ent-q');
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }, 300);
}

/* ═══════════════════════════════════════════════════════════
   직원 · 외부영업자
   ═══════════════════════════════════════════════════════════ */

const ST = { tab: '실적', year: '', month: '', open: null, detail: null, openKind: null };
let ST_LIST = null;

async function renderStaff() {
  const content = document.getElementById('main-content');

  let list;
  try { list = await API.getStaff(); } catch (e) { showToast(e.message, 'error'); return; }
  ST_LIST = list;

  const head = [
    '<div class="page-header">',
    '  <div><h2>직원 · 외부영업자</h2>',
    '    <div class="subtitle">혜움 담당자와 외부 영업자 명단입니다. 여기 등록한 사람이 과정 등록의 선택칸과 분석 필터에 나옵니다.</div></div>',
    (API.isAdmin() ? '  <button class="btn btn-primary" onclick="openStaffModal()">＋ 사람 등록</button>' : ''),
    '</div>',
    '<div class="ent-tabs">',
    '  <button class="ent-tab' + (ST.tab === '실적' ? ' active' : '') + '" onclick="setStTab(\'실적\')">실적</button>',
    '  <button class="ent-tab' + (ST.tab === '명단' ? ' active' : '') + '" onclick="setStTab(\'명단\')">명단</button>',
    '</div>'
  ].join('');

  if (ST.tab === '명단') {
    const shown = list.staff.filter(function (x) {
      return findMatch('staff', [x.name, x.kind, x.position, x.note]);
    });
    content.innerHTML = head + [
      findBar('staff', '이름 · 구분 · 직급 검색', shown.length, list.staff.length),
      '<div class="table-container"><table class="data-table">',
      '<thead><tr><th>구분</th><th>이름</th><th>직급</th>',
      '  <th class="th-mid">담당 과정</th><th class="th-mid">영업 과정</th>',
      '  <th>비고</th><th>상태</th>' + (API.isAdmin() ? '<th></th>' : '') + '</tr></thead><tbody>',
      (shown.length === 0
        ? '<tr><td colspan="8"><div class="empty-state" style="padding:2rem"><p>'
          + (FIND.staff ? '찾는 사람이 없습니다.' : '등록된 사람이 없습니다.') + '</p></div></td></tr>'
        : ''),
      shown.map(s =>
        '<tr' + (s.is_active ? '' : ' style="opacity:0.55"') + '>'
        + '<td><span class="badge ' + (s.kind === '영업' ? 'badge-user' : 'badge-admin') + '">'
        +   esc(s.kind) + '</span></td>'
        + '<td style="font-weight:600">' + esc(s.name) + '</td>'
        + '<td class="an-sub">' + esc(s.position || '-') + '</td>'
        + '<td class="c-mid">' + formatNumber(s.as_manager) + '</td>'
        + '<td class="c-mid">' + formatNumber(s.as_rep) + '</td>'
        + '<td class="an-sub" style="font-size:0.8rem">' + esc(s.note || '-') + '</td>'
        + '<td><span class="badge ' + (s.is_active ? 'badge-active' : 'badge-inactive') + '">'
        +   (s.is_active ? '사용' : '사용안함') + '</span></td>'
        + (API.isAdmin()
          ? '<td style="white-space:nowrap">'
            + '<button class="btn btn-ghost btn-sm" onclick="openStaffModal(' + s.id + ')">✎</button> '
            + '<button class="btn btn-danger btn-sm" onclick="deleteStaff(' + s.id + ')">✕</button></td>'
          : '')
        + '</tr>'
      ).join(''),
      '</tbody></table></div>'
    ].join('');
    return;
  }

  let d;
  try {
    d = await API.getAnalytics({ year: ST.year, month: ST.month, basis: 'start' });
  } catch (e) { showToast(e.message, 'error'); return; }

  ST.year = d.period.year;
  const years = (d.filters.years || []).slice();
  if (years.indexOf(String(d.period.year)) === -1) years.unshift(String(d.period.year));
  const opt = (v, label, cur) =>
    '<option value="' + esc(v) + '"' + (String(cur) === String(v) ? ' selected' : '') + '>'
    + esc(label) + '</option>';

  // 명단에 있지만 그 기간 실적이 없는 사람도 0으로 보여준다
  const fill = (rows, names) => {
    const have = new Set(rows.map(r => r.name));
    const zero = names.filter(n => !have.has(n))
      .map(n => ({ name: n, count: 0, sales: 0, expenses: 0, profit: 0, margin: 0, fee: 0 }));
    return rows.concat(zero);
  };

  content.innerHTML = head + [
    '<div class="list-filter">',
    '  <select class="form-select" onchange="setSt(\'year\', this.value)">',
    years.map(y => opt(y, y + '년', d.period.year)).join(''),
    '  </select>',
    '  <select class="form-select" onchange="setSt(\'month\', this.value)">',
    opt('', '연간 전체', ST.month),
    Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
      .map(m => opt(m, Number(m) + '월', ST.month)).join(''),
    '  </select>',
    '</div>',

    stTable('혜움 담당자별', '직원 — 과정을 맡은 사람', fill(d.byManager || [], list.managers), 'manager', false),
    stTable('외부 영업자별', '영업 — 수수료를 드리는 사람', fill(d.bySalesRep || [], list.salesReps), 'rep', true)
  ].join('');
}

function stTable(title, hint, rows, kind, showFee) {
  if (rows.length === 0) {
    return '<div class="an-sec"><h3>' + title + '</h3><div class="an-empty">자료가 없습니다.</div></div>';
  }
  const sum = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
  const sales = sum('sales'), profit = sum('profit');
  const cols = showFee ? 8 : 7;

  return '<div class="an-sec"><h3>' + title + '<em>' + hint + '</em></h3>'
    + '<div class="table-container"><table class="data-table an-table">'
    + '<thead><tr><th style="width:2rem"></th><th>이름</th><th class="th-mid">과정수</th>'
    +   '<th class="th-num">매출</th><th class="th-num">매입</th>'
    +   (showFee ? '<th class="th-num">수수료</th>' : '')
    +   '<th class="th-num">이익</th><th class="th-mid">이익률</th></tr></thead><tbody>'
    + rows.map(r => {
      const open = ST.open === r.name && ST.openKind === kind;
      const key = esc(r.name).replace(/'/g, '&#39;');
      return '<tr class="ent-row' + (open ? ' open' : '') + '"'
        + ' onclick="toggleSt(\'' + kind + '\', \'' + key + '\')">'
        + '<td class="ent-caret">' + (open ? '▾' : '▸') + '</td>'
        + '<td class="an-name">' + esc(r.name) + '</td>'
        + '<td class="c-mid">' + (r.count ? formatNumber(r.count) : '-') + '</td>'
        + '<td class="amount-cell amount-positive">' + formatNumber(r.sales || 0) + '</td>'
        + '<td class="amount-cell amount-negative">' + formatNumber(r.expenses || 0) + '</td>'
        + (showFee ? '<td class="amount-cell an-sub">' + formatNumber(r.fee || 0) + '</td>' : '')
        + '<td class="amount-cell an-profit' + ((r.profit || 0) < 0 ? ' minus' : '') + '">'
        +   formatNumber(r.profit || 0) + '</td>'
        + '<td class="c-mid an-rate ' + anMarginClass(r.margin || 0) + '">'
        +   (r.sales ? (r.margin || 0).toFixed(1) + '%' : '-') + '</td>'
        + '</tr>'
        + (open
          ? '<tr class="ent-detail"><td colspan="' + cols + '">'
            + (ST.detail ? entDetailBody({ mode: 'profit' }) : '<div class="an-loading">불러오는 중...</div>')
            + '</td></tr>'
          : '');
    }).join('')
    + '<tr class="an-sum"><td></td><td class="an-name">합계</td>'
    +   '<td class="c-mid">' + formatNumber(sum('count')) + '</td>'
    +   '<td class="amount-cell">' + formatNumber(sales) + '</td>'
    +   '<td class="amount-cell">' + formatNumber(sum('expenses')) + '</td>'
    +   (showFee ? '<td class="amount-cell">' + formatNumber(sum('fee')) + '</td>' : '')
    +   '<td class="amount-cell">' + formatNumber(profit) + '</td>'
    +   '<td class="c-mid">' + (sales ? ((profit / sales) * 100).toFixed(1) + '%' : '-') + '</td>'
    + '</tr></tbody></table></div></div>';
}

async function toggleSt(kind, name) {
  const key = String(name).replace(/&#39;/g, "'");
  if (ST.open === key && ST.openKind === kind) {
    ST.open = null; ST.openKind = null; ST.detail = null; return renderStaff();
  }
  ST.open = key; ST.openKind = kind; ST.detail = null;
  await renderStaff();
  try {
    ST.detail = await API.getAnalyticsDetail({
      kind: kind, key: key, year: ST.year, month: ST.month, basis: 'start'
    });
  } catch (e) { showToast(e.message, 'error'); ST.detail = { rows: [] }; }
  renderStaff();
}

function setSt(k, v) { ST[k] = v; ST.open = null; ST.detail = null; renderStaff(); }
function setStTab(t) { ST.tab = t; renderStaff(); }

function openStaffModal(id) {
  const s = id && ST_LIST ? (ST_LIST.staff || []).find(x => x.id === id) : null;
  const html = [
    '<div class="modal-overlay" onclick="if(event.target===this)this.remove()">',
    '  <div class="modal">',
    '    <div class="modal-header"><h3>' + (s ? '수정' : '사람 등록') + '</h3>',
    '      <button class="modal-close" onclick="this.closest(\'.modal-overlay\').remove()">✕</button></div>',
    '    <div class="modal-body">',
    '      <div class="form-row">',
    '        <div class="form-group"><label class="form-label form-required">구분</label>',
    '          <select id="st-kind" class="form-select">',
    '            <option value="직원"' + (s && s.kind === '직원' ? ' selected' : '') + '>직원 (혜움 담당자)</option>',
    '            <option value="영업"' + (s && s.kind === '영업' ? ' selected' : '') + '>영업 (외부 영업자)</option>',
    '          </select></div>',
    '        <div class="form-group"><label class="form-label form-required">이름</label>',
    '          <input type="text" id="st-name" class="form-input" value="' + esc(s ? s.name : '') + '"></div>',
    '        <div class="form-group"><label class="form-label">직급</label>',
    '          <input type="text" id="st-pos" class="form-input" value="' + esc(s ? s.position : '') + '"></div>',
    '      </div>',
    '      <div class="form-group"><label class="form-label">비고</label>',
    '        <input type="text" id="st-note" class="form-input" value="' + esc(s ? s.note : '') + '"></div>',
    (s ? '<div class="form-group"><label class="form-label">상태</label>'
      + '<select id="st-active" class="form-select">'
      + '<option value="1"' + (s.is_active ? ' selected' : '') + '>사용 — 선택칸에 나옵니다</option>'
      + '<option value="0"' + (s.is_active ? '' : ' selected') + '>사용안함 — 선택칸에서 숨깁니다</option>'
      + '</select></div>' : ''),
    '      <div class="oh-hint">이름을 바꾸면 이미 등록된 과정의 담당자 이름도 함께 바뀝니다.</div>',
    '    </div>',
    '    <div class="modal-footer">',
    (s ? '<button class="btn btn-danger btn-sm" onclick="deleteStaff(' + s.id + ')">삭제</button>' : ''),
    '      <button class="btn btn-ghost" onclick="this.closest(\'.modal-overlay\').remove()">취소</button>',
    '      <button class="btn btn-primary" onclick="saveStaff(' + (s ? s.id : 'null') + ')">저장</button>',
    '    </div>',
    '  </div></div>'
  ].join('');
  document.body.insertAdjacentHTML('beforeend', html);
}

async function saveStaff(id) {
  const g = (x) => (document.getElementById(x) || {}).value || '';
  const data = {
    kind: g('st-kind') || '직원',
    name: g('st-name').trim(),
    position: g('st-pos').trim(),
    note: g('st-note').trim()
  };
  const act = document.getElementById('st-active');
  if (act) data.is_active = act.value === '1';

  if (!data.name) return showToast('이름을 적어주세요.', 'error');
  try {
    if (id) await API.updateStaff(id, data);
    else await API.createStaff(data);
    const ov = document.querySelector('.modal-overlay'); if (ov) ov.remove();
    showToast(id ? '수정했습니다.' : '등록했습니다.', 'success');
    renderStaff();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteStaff(id) {
  if (!confirm('이 사람을 명단에서 지울까요?\n과정에 이미 쓰인 사람은 「사용안함」으로만 바뀝니다.')) return;
  try {
    const r = await API.deleteStaff(id);
    const ov = document.querySelector('.modal-overlay'); if (ov) ov.remove();
    showToast(r.deactivated
      ? '과정 ' + r.used + '건에 쓰이고 있어 「사용안함」으로 바꿨습니다.'
      : '지웠습니다.', 'success');
    renderStaff();
  } catch (e) { showToast(e.message, 'error'); }
}

/* ═══════════════════════════════════════════════════════════
   세금계산서  —  발행한 계산서를 모아 보고 입금을 확인한다
   (발행 내용은 과정 등록에서, 입금 확인은 여기에서)
   ═══════════════════════════════════════════════════════════ */

const TAX = { year: '', month: '', company: '', status: 'unpaid', q: '', requester: '' };
let TAX_DATA = null;

/*
 * 세금계산서 목록의 「발행요청」 칸 — 보기만 한다.
 *
 * 요청을 보내는 것은 과정 등록 화면에서 한다 (대표님 지시 2026-10-26).
 * 계산서를 적는 자리에서 바로 보내야 하고, 여기는 「누가 언제 요청했는지」
 * 를 모아 보는 자리이기 때문이다.
 */
function reqCell(v) {
  if (!v.requested) return '<span class="req-no">-</span>';
  const more = v.requested_count > 1 ? '<em>×' + v.requested_count + '</em>' : '';
  return '<span class="req-did" title="' + esc((v.requested_at || '') + ' 에 요청했습니다') + '">'
    + '<b>' + esc(v.requested_by || '-') + '</b>' + more
    + '<i>' + esc(v.requested_at || '') + '</i></span>';
}

async function renderTax() {
  const content = document.getElementById('main-content');
  REDRAW = renderTax;

  let d;
  try { d = await API.getInvoices(TAX); } catch (e) { showToast(e.message, 'error'); return; }
  TAX_DATA = d;

  const f = d.filters || {};
  const t = d.totals || {};
  const opt = (v, label, cur) =>
    '<option value="' + esc(v) + '"' + (String(cur) === String(v) ? ' selected' : '') + '>'
    + esc(label) + '</option>';

  const years = (f.years || []).slice();
  const thisYear = String(new Date().getFullYear());
  if (years.indexOf(thisYear) === -1) years.unshift(thisYear);

  content.innerHTML = [
    '<div class="page-header">',
    '  <div><h2>세금계산서</h2>',
    '    <div class="subtitle">발행한 계산서를 모아 봅니다. 돈이 들어오면 <b>입금일</b>을 눌러 날짜를 고르세요.'
    + ' 비우면 다시 미수로 돌아갑니다.</div></div>',
    '</div>',

    /* 회사 고르기 — 대시보드와 같은 방식 */
    '<div class="co-switch">',
    ['', '혜움컨설팅', '그로우인'].map(function (nm) {
      const on = TAX.company === nm;
      const m = (d.byCompany || []).find(function (x) { return x.company === nm; });
      const all = (d.byCompany || []).reduce(function (a, x) {
        return { count: a.count + x.count, supply: a.supply + x.supply, unpaid: a.unpaid + x.unpaid };
      }, { count: 0, supply: 0, unpaid: 0 });
      const v = nm === '' ? all : (m || { count: 0, supply: 0, unpaid: 0 });
      return '<button type="button" class="co-btn' + (on ? ' on' : '')
        + (nm === '그로우인' ? ' sub' : '') + '"'
        + ' onclick="setTax(\'company\', \'' + nm + '\')">'
        + '<span class="nm">' + (nm || '전체') + '</span>'
        + '<span class="vl">' + formatNumber(v.supply) + '</span>'
        + '<span class="ct">' + v.count + '장 · 미수 ' + formatNumber(v.unpaid) + '</span>'
        + '</button>';
    }).join(''),
    '</div>',
    (TAX.company
      ? '<div class="co-banner' + (TAX.company === '그로우인' ? ' sub' : '') + '">'
        + '<b>' + esc(TAX.company) + '</b> 계산서만 보고 있습니다'
        + '<button type="button" onclick="setTax(\'company\', \'\')">전체 보기</button></div>'
      : ''),

    /* 필터 */
    '<div class="list-filter">',
    '  <div class="f-search">',
    '    <input type="text" id="tax-q" class="form-input" placeholder="고객사 · 과정명 · 받는 사람 검색"'
    + ' value="' + esc(TAX.q) + '" oninput="onTaxSearch(this.value)">',
    '  </div>',
    /* 요청한 사람으로 거르기 — 요청한 적이 있을 때만 나온다 */
    ((f.requesters || []).length
      ? '<select class="form-select" onchange="setTax(\'requester\', this.value)">'
        + opt('', '요청자 전체', TAX.requester)
        + f.requesters.map(function (p) { return opt(p.key, p.name + ' 요청', TAX.requester); }).join('')
        + opt('-', '아직 요청 안 함', TAX.requester)
        + '</select>'
      : ''),
    '  <select class="form-select" onchange="setTax(\'status\', this.value)">',
    opt('unpaid', '미수만', TAX.status),
    opt('paid', '입금완료만', TAX.status),
    opt('', '전체', TAX.status),
    '  </select>',
    '  <select class="form-select" onchange="setTax(\'year\', this.value)">',
    opt('', '전체 연도', TAX.year),
    years.map(y => opt(y, y + '년', TAX.year)).join(''),
    '  </select>',
    '  <select class="form-select" onchange="setTax(\'month\', this.value)"'
    + (TAX.year ? '' : ' disabled title="연도를 먼저 고르세요"') + '>',
    opt('', '전체 월', TAX.month),
    Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
      .map(m => opt(m, Number(m) + '월', TAX.month)).join(''),
    '  </select>',
    ((TAX.q || TAX.year || TAX.month || TAX.company || TAX.status !== 'unpaid')
      ? '<button class="btn btn-ghost btn-sm" onclick="resetTax()">✕ 조건 지우기</button>' : ''),
    '</div>',

    '<div class="list-total">',
    '  <span class="cnt"><b>' + formatNumber(t.count || 0) + '</b>장</span>',
    '  <span class="it"><i>공급가액</i><b class="sales">' + formatNumber(t.supply || 0) + '</b></span>',
    '  <span class="it"><i>부가세</i><b>' + formatNumber(t.vat || 0) + '</b></span>',
    '  <span class="it"><i>합계</i><b>' + formatNumber(t.total || 0) + '</b></span>',
    '  <span class="it"><i>미수금</i><b class="unpaid">' + formatNumber(t.unpaid || 0) + '</b>'
    + '<em>(' + formatNumber(t.unpaidCount || 0) + '장)</em></span>',
    '</div>',

    (d.invoices.length === 0
      ? '<div class="empty-state" style="padding:3rem"><p>조건에 맞는 계산서가 없습니다.</p></div>'
      : [
        '<div class="table-container"><table class="data-table tax-table">',
        '<thead><tr>',
        '  <th class="th-mid">회사</th><th>발행일</th><th>고객사</th><th>과정명</th>',
        '  <th class="th-mid">장</th><th class="th-num">공급가액</th><th class="th-num">부가세</th>',
        '  <th class="th-num">합계</th><th>받는 사람</th><th class="th-mid">입금일</th>',
        '  <th class="th-num">미수금</th><th class="th-mid">발행요청 <em class="th-sub">(누가 · 언제)</em></th>',
        '</tr></thead><tbody>',
        d.invoices.map(function (v) {
          const paid = !!v.paid_date;
          return '<tr class="' + (paid ? 'paid' : 'unpaid') + '">'
            + '<td class="c-mid"><span class="co-tag' + (v.company === '그로우인' ? ' sub' : '') + '">'
            +   esc(v.company) + '</span></td>'
            + '<td class="c-mid" style="white-space:nowrap">' + esc(v.issue_date || '-') + '</td>'
            + '<td>' + esc(v.client_name || '-') + '</td>'
            + '<td style="font-weight:600;cursor:pointer" onclick="navigate(\'project-form\', ' + v.project_id + ')">'
            +   esc(v.course_name) + '</td>'
            + '<td class="c-mid an-sub">' + v.seq + '</td>'
            + '<td class="amount-cell amount-positive">' + formatNumber(v.supply_amount) + '</td>'
            + '<td class="amount-cell an-sub">' + formatNumber(v.vat) + '</td>'
            + '<td class="amount-cell">' + formatNumber(v.total_amount) + '</td>'
            + '<td class="an-sub" style="font-size:0.8rem">'
            +   ((v.recipients || []).map(function (r, ri) {
                  if (!r.name && !r.email && !r.phone) return '';
                  return '<div class="recv-line">' + esc(r.name || '-')
                    + (r.email ? ' · ' + privateCell('inv' + v.id + '-' + ri + '-e', r.email, 'email') : '')
                    + (r.phone ? ' · ' + privateCell('inv' + v.id + '-' + ri + '-p', r.phone, 'phone') : '')
                    + '</div>';
                }).filter(Boolean).join('') || '-') + '</td>'
            + '<td class="c-mid">' + paidCell(v) + '</td>'
            + '<td class="amount-cell">'
            +   (paid ? '<span style="color:var(--success);font-size:0.8rem">완료</span>'
                     : '<span class="unpaid-badge">' + formatNumber(v.total_amount) + '</span>') + '</td>'
            + '<td class="c-mid">' + reqCell(v) + '</td>'
            + '</tr>';
        }).join(''),
        '</tbody></table></div>'
      ].join(''))
  ].join('');
}

/** 입금일 칸 — 관리자만 고칠 수 있다 */
function paidCell(v) {
  if (!API.isAdmin()) {
    return '<span class="an-sub">' + esc(v.paid_date || '미수') + '</span>';
  }
  return '<div class="paid-pick">'
    + dateInput(v.paid_date || '', 'setPaid(' + v.id + ', this.value)')
    + (v.paid_date
      ? '<button type="button" class="paid-clear" title="입금 취소 (다시 미수로)"'
        + ' onclick="setPaid(' + v.id + ', \'\')">✕</button>'
      : '')
    + '</div>';
}

async function setPaid(id, value) {
  try {
    await API.setInvoicePaid(id, value || '');
    showToast(value ? '입금일을 ' + value + ' 로 기록했습니다.' : '미수로 되돌렸습니다.', 'success');
    renderTax();
  } catch (e) { showToast(e.message, 'error'); }
}

function setTax(k, v) {
  TAX[k] = v;
  if (k === 'year' && !v) TAX.month = '';
  renderTax();
}

function resetTax() {
  TAX.year = ''; TAX.month = ''; TAX.company = ''; TAX.status = 'unpaid'; TAX.q = '';
  renderTax();
}

let taxSearchTimer = null;
function onTaxSearch(v) {
  TAX.q = v;
  clearTimeout(taxSearchTimer);
  taxSearchTimer = setTimeout(function () {
    renderTax();
    const el = document.getElementById('tax-q');
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }, 350);
}

/* ═══════════════════════════════════════════════════════════
   세금계산서 발행 (과정 등록 화면 4번 칸)

   흐름
     ① 고객사 · 과정명            — 무엇에 대한 계산서인지
     ② 매출 정보 (읽기 전용)       — 공급가액·세액·합계·부가세·절사기준
     ③ 항목(품목)                 — 추가/삭제, 자동계산 또는 직접 입력
                                   ②와 맞는지 바로 알려준다
     ④ 발행회사 · 발행일 · 청구/영수 · 비고
     ⑤ 받는 사람 (이름 첫 글자로 자동완성)
     ⑥ 결제 (현금·수표·어음·외상미수금)
   ═══════════════════════════════════════════════════════════ */

/** 계산서 한 장의 품목 목록 */
function invItems(it) {
  if (!Array.isArray(it.items)) it.items = [];
  // 계산서에는 항목이 적어도 한 줄은 있어야 한다
  if (it.items.length === 0) it.items.push(newInvItem());
  it.items.forEach(function (r) { if (!r._id) r._id = Math.random().toString(36).substr(2, 9); });
  return it.items;
}

function newInvItem(seed) {
  return Object.assign({
    _id: Math.random().toString(36).substr(2, 9),
    name: '', qty: '', price: '', supply: 0, vat: 0, is_manual: false, note: ''
  }, seed || {});
}

/**
 * 적어 넣은 단가를 「부가세 별도」로 볼지 「포함」으로 볼지.
 *
 *   별도 — 단가가 공급가액이다.        1,000,000 → 공급가 1,000,000 + 세액 100,000
 *   포함 — 단가에 부가세가 들어 있다.  1,100,000 → 공급가 1,000,000 + 세액 100,000
 *
 * 계산서 한 장마다 고를 수 있다. 적지 않았으면 「별도」 (지금까지와 같다).
 *
 * 기준은 「줄마다」 적어 둔다(vat_incl). 계산서 쪽에 새 칸을 만들지 않아도
 * 항목이 통째로 저장되기 때문에, 다시 열어도 고른 기준이 그대로 남는다.
 */
function invItemMode(it) {
  return invItems(it).some(function (r) { return r.vat_incl; }) ? '포함' : '별도';
}

/*
 * 항목을 어떻게 적을지.
 *
 *   자동계산 — 단가 × 수량 으로 공급가액을 낸다
 *   수기작성 — 공급가액을 직접 적는다 (단가·수량은 쓰지 않는다)
 *
 * 매출·매입 줄의 [∑ 수기] 와 같은 뜻이다. 계산서에서는 줄마다가 아니라
 * 한 장 단위로 고르게 했다 — 보통 한 계산서 안에서는 한 가지로 적기 때문이다.
 * 기준은 줄마다 적힌 is_manual 을 그대로 쓴다 (따로 저장할 칸이 필요 없다).
 */
function invWriteMode(it) {
  return invItems(it).some(function (r) { return r.is_manual; }) ? '수기작성' : '자동계산';
}

function setInvWriteMode(id, mode) {
  const it = State.invoices.find(function (x) { return x._id === id; });
  if (!it) return;
  const manual = (mode === '수기작성');
  const vmode = invMode(it);

  invItems(it).forEach(function (r) {
    if (manual) {
      // 수기로 바꿀 때는 지금까지 계산된 금액을 시작값으로 (매출 쪽과 같다)
      const c = invItemCalc(r, vmode);
      r.supply = c.supply || '';
      r.is_manual = true;
    } else {
      r.is_manual = false;
      r.vat_manual = false;
    }
  });
  syncInvAmount(it);
  renderInvoices();
}

/** 품목 줄의 기준을 바꾼다 — 자동계산하던 줄만 다시 낸다 */
function setInvItemMode(id, mode) {
  const it = State.invoices.find(function (x) { return x._id === id; });
  if (!it) return;
  const incl = (mode === '포함');
  invItems(it).forEach(function (r) { r.vat_incl = incl; });
  syncInvAmount(it);
  renderInvoices();
}

/**
 * 품목 한 줄의 공급가액·세액.
 * 공급가액이나 세액을 손으로 고친 줄은 그 값을 그대로 둔다.
 *
 * @param mode  계산서의 부가세 기준 (면세면 세액이 0)
 */
function invItemCalc(r, mode) {
  const q = parseFloat(r.qty) || 0;
  const p = parseNumber(r.price) || 0;
  const free = (mode === '면세');
  const incl = (!free && !!r.vat_incl);
  const auto = (!r.is_manual && q && p);   // 단가·수량으로 자동계산하는 줄인가

  let supply = parseNumber(r.supply) || 0;
  if (auto) {
    const raw = Math.round(q * p);
    // 포함이면 단가 안에 든 부가세를 걷어내 공급가액을 낸다
    supply = incl ? Math.round(raw / 1.1) : raw;
  }

  let vat;
  if (free) {
    vat = 0;
  } else if (r.vat_manual) {
    vat = parseNumber(r.vat) || 0;
  } else if (auto && incl) {
    // 반올림 때문에 공급가액 ÷ 10 과 1원쯤 어긋날 수 있다. 합계가 맞는 쪽을 쓴다.
    vat = Math.round(q * p) - supply;
  } else {
    vat = Math.round(supply / 10);
  }

  return { supply: supply, vat: vat, total: supply + vat };
}

/** 품목 합계 */
function invItemsSum(it) {
  const mode = invMode(it);
  return invItems(it).reduce(function (a, r) {
    const c = invItemCalc(r, mode);
    return { supply: a.supply + c.supply, vat: a.vat + c.vat, total: a.total + c.total };
  }, { supply: 0, vat: 0, total: 0 });
}

function addInvItem(id) {
  const it = State.invoices.find(function (x) { return x._id === id; });
  if (!it) return;
  if (invItems(it).length >= 16) return showToast('항목은 16줄까지입니다.', 'warning');
  // 새 줄도 지금 고른 기준·작성 방식을 따라간다
  it.items.push(newInvItem({
    vat_incl: invItemMode(it) === '포함',
    is_manual: invWriteMode(it) === '수기작성'
  }));
  renderInvoices();
}

/**
 * 항목을 모두 지우고 빈 줄 하나로 되돌린다.
 * 한 줄씩 지우려면 여러 번 눌러야 해서, 다시 쓰려면 번거로웠다.
 */
function resetInvItems(id) {
  const it = State.invoices.find(function (x) { return x._id === id; });
  if (!it) return;
  const written = invItems(it).filter(function (r) {
    return r.name || parseNumber(r.price) || parseNumber(r.supply);
  });
  if (written.length && !confirm('적어 넣은 항목 ' + written.length + '줄을 모두 지우고\n처음부터 다시 적을까요?')) return;
  // 고른 기준과 작성 방식은 그대로 둔다
  const incl = invItemMode(it) === '포함';
  const manual = invWriteMode(it) === '수기작성';
  it.items = [newInvItem({ vat_incl: incl, is_manual: manual })];
  syncInvAmount(it);
  renderInvoices();
  showToast('항목을 비웠습니다.', 'success');
}

function removeInvItem(id, i) {
  const it = State.invoices.find(function (x) { return x._id === id; });
  if (!it) return;
  if (invItems(it).length <= 1) return showToast('항목은 한 줄은 있어야 합니다.', 'warning');
  const gone = it.items[i];
  it.items.splice(i, 1);
  offerUndo('계산서 항목 「' + ((gone && gone.name) || '줄') + '」', function () {
    it.items.splice(i, 0, gone);
    syncInvAmount(it);
    renderInvoices();
  });
  syncInvAmount(it);
  renderInvoices();
}

function updateInvItem(id, i, field, value) {
  const it = State.invoices.find(function (x) { return x._id === id; });
  if (!it) return;
  const row = invItems(it)[i];
  if (!row) return;
  row[field] = value;
  // 공급가액·세액을 직접 고치면 그 뒤로는 자동계산하지 않는다
  if (field === 'supply') row.is_manual = true;
  if (field === 'vat') row.vat_manual = true;
  syncInvAmount(it);
  refreshInvRow(it);
}

/** 품목 금액이 바뀌면 계산서 금액도 그에 맞춘다 */
function syncInvAmount(it) {
  const items = invItems(it);
  if (items.length === 0) return;
  const sum = invItemsSum(it);
  it.amount = invMode(it) === '포함' ? sum.total : sum.supply;
  it.discount = 0;
  it.is_manual = true;
}

/** 줄 전체를 다시 그리지 않고 숫자만 갱신 (입력 포커스를 지키려고) */
function refreshInvRow(it) {
  const mode = invMode(it);
  invItems(it).forEach(function (r, i) {
    const c = invItemCalc(r, mode);
    const sv = document.getElementById('iis-' + it._id + '-' + i);
    if (sv && !r.is_manual) sv.value = c.supply ? formatNumber(c.supply) : '';
    const vv = document.getElementById('iiv-' + it._id + '-' + i);
    if (vv && !r.vat_manual) vv.value = c.vat ? formatNumber(c.vat) : '';
    const tv = document.getElementById('iit-' + it._id + '-' + i);
    if (tv) tv.innerText = formatNumber(c.total);
  });
  renderInvCheck(it);
  renderInvoiceTotals();
}

/** 품목 합계가 매출과 맞는지 */
function renderInvCheck(it) {
  const box = document.getElementById('invchk-' + it._id);
  if (!box) return;
  const items = invItems(it);
  const filled = items.filter(function (r) { return r.name || parseNumber(r.supply); });
  if (filled.length === 0) {
    box.innerHTML = '<span class="muted">항목을 적어주세요. '
      + '[매출에서 가져오기]를 누르면 매출 항목이 그대로 들어옵니다.</span>';
    return;
  }
  const sum = invItemsSum(it);
  const want = saleSummary();
  const gapS = want.supply - sum.supply;

  box.innerHTML = '항목 합계 — 공급가액 <b>' + formatNumber(sum.supply) + '</b>'
    + ' · 세액 <b>' + formatNumber(sum.vat) + '</b>'
    + ' · 합계 <b>' + formatNumber(sum.total) + '</b>'
    + (gapS === 0
      ? ' <span class="okmark">✅ 매출 공급가액과 일치</span>'
      : ' <span class="warn">⚠ 매출보다 ' + formatNumber(Math.abs(gapS)) + '원 '
        + (gapS > 0 ? '모자랍니다' : '많습니다') + '</span>');
}

/** 매출 정보에서 끌어온 값 (계산서에서는 고치지 않는다) */
function saleSummary() {
  const raw = State.saleItems.reduce(function (a, x) { return a + saleAmount(x); }, 0);
  const t = computeTotals(raw, State.discount, State.vatMode, State.discountBase);
  return {
    supply: t.supply, vat: t.vat, total: t.total,
    discount: t.discount,
    vatMode: State.vatMode,
    discountBase: State.discountBase
  };
}

/** 매출 항목을 그대로 품목으로 가져온다 */
function fillInvItems(id) {
  const it = State.invoices.find(function (x) { return x._id === id; });
  if (!it) return;
  const rows = State.saleItems.filter(function (x) { return saleAmount(x) > 0; });
  if (rows.length === 0) return showToast('가져올 매출 항목이 없습니다.', 'warning');

  const want = saleSummary();
  const raw = rows.reduce(function (a, x) { return a + saleAmount(x); }, 0);
  const ratio = raw ? want.supply / raw : 0;   // 절사가 있으면 그만큼 줄여 담는다
  const mode = invMode(it);
  const incl = invItemMode(it) === '포함';     // 고른 기준을 그대로 이어간다

  it.items = rows.slice(0, 16).map(function (x) {
    const supply = Math.round(saleAmount(x) * ratio);
    return newInvItem({
      name: x.name || x.category,
      qty: x.qty1 || '',
      price: x.unit_price || '',
      supply: supply,
      vat: mode === '면세' ? 0 : Math.round(supply / 10),
      is_manual: true, vat_manual: true, vat_incl: incl,
      note: x.note || ''
    });
  });
  // 비율로 나눈 끝수는 첫 줄에서 맞춘다
  const diff = want.supply - it.items.reduce(function (a, r) { return a + r.supply; }, 0);
  if (it.items.length && diff) {
    it.items[0].supply += diff;
    if (mode !== '면세') it.items[0].vat = Math.round(it.items[0].supply / 10);
  }

  syncInvAmount(it);
  renderInvoices();
  showToast('매출 ' + it.items.length + '줄을 항목으로 가져왔습니다.', 'success');
}

/* ───────── 받는 사람 ───────── */

/**
 * 받는 사람 — 늘 두 자리를 보여준다.
 *
 * 두 분께 발행해 달라는 경우가 있는데, 전에는 한 자리만 보이고
 * ＋ 를 눌러야 둘째가 나왔다. 그걸 모르고 지나치기 쉬웠다.
 * 빈 자리는 저장되지 않는다 (서버의 cleanRecipients 가 걸러낸다).
 * (대표님 지시 2026-10-27)
 */
function invRecipients(it) {
  if (!Array.isArray(it.recipients)) it.recipients = [];
  while (it.recipients.length < 2) it.recipients.push({ name: '', email: '', phone: '' });
  return it.recipients;
}

/** 받는 사람 한 자리를 비운다 (자리는 그대로 둔다) */
function clearRecipient(id, i) {
  const it = State.invoices.find(function (x) { return x._id === id; });
  if (!it) return;
  const r = invRecipients(it)[i];
  if (!r) return;
  const gone = { name: r.name, email: r.email, phone: r.phone };
  r.name = ''; r.email = ''; r.phone = '';
  if (gone.name || gone.email || gone.phone) {
    offerUndo('받는 사람 ' + (i + 1) + ' 「' + (gone.name || '이름 없음') + '」', function () {
      const back = invRecipients(it)[i];
      if (back) { back.name = gone.name; back.email = gone.email; back.phone = gone.phone; }
      renderInvoices();
    });
  }
  renderInvoices();
}

function addRecipient(id) {
  const it = State.invoices.find(function (x) { return x._id === id; });
  if (!it) return;
  invRecipients(it).push({ name: '', email: '', phone: '' });
  renderInvoices();
}

function removeRecipient(id, i) {
  const it = State.invoices.find(function (x) { return x._id === id; });
  if (!it) return;
  invRecipients(it).splice(i, 1);
  invRecipients(it);
  renderInvoices();
}

function updateRecipient(id, i, field, value) {
  const it = State.invoices.find(function (x) { return x._id === id; });
  if (!it) return;
  invRecipients(it)[i][field] = value;
}

/** 이름 첫 글자로 전에 받았던 사람을 찾는다 */
let recvSearchTimer = null;
function searchRecipient(el, id, i) {
  const q = el.value.trim();
  const box = document.getElementById('auto-recv-' + id + '-' + i);
  if (!box) return;
  clearTimeout(recvSearchTimer);
  if (q.length === 0) { box.classList.remove('show'); box.innerHTML = ''; return; }

  recvSearchTimer = setTimeout(async function () {
    let list = [];
    try { list = (await API.searchRecipients(q)).recipients || []; } catch (e) { return; }
    if (list.length === 0) { box.classList.remove('show'); box.innerHTML = ''; return; }
    box.innerHTML = list.map(function (p, k) {
      const sub = [p.email, p.phone].filter(Boolean).join(' · ');
      return '<div class="autocomplete-item" onclick="pickRecipient(\'' + id + '\',' + i + ',' + k + ')">'
        + '<div class="main-text">' + esc(p.name) + '</div>'
        + (sub ? '<div class="sub-text">' + esc(sub) + '</div>'
               : '<div class="sub-text muted">이메일·연락처 없음 — 확인해주세요</div>')
        + '</div>';
    }).join('');
    box.classList.add('show');
    RECV_FOUND[id + '-' + i] = list;
  }, 250);
}

const RECV_FOUND = {};

function pickRecipient(id, i, k) {
  const list = RECV_FOUND[id + '-' + i] || [];
  const p = list[k];
  if (!p) return;
  const it = State.invoices.find(function (x) { return x._id === id; });
  if (!it) return;
  invRecipients(it)[i] = { name: p.name, email: p.email || '', phone: p.phone || '' };
  const box = document.getElementById('auto-recv-' + id + '-' + i);
  if (box) { box.classList.remove('show'); box.innerHTML = ''; }
  renderInvoices();
}

/* ───────── 그리기 ───────── */

function renderInvoices() {
  const box = document.getElementById('invoice-list');
  if (!box) return;
  if (State.invoices.length === 0) State.invoices = [newInvoice(0)];

  const client = (document.getElementById('p-client-name') || {}).value || '';
  const course = (document.getElementById('p-course-name') || {}).value || '';
  const want = saleSummary();

  box.innerHTML = State.invoices.map(function (it, i) {
    const single = State.invoices.length <= 1;
    const id = it._id;
    const mode = invMode(it);

    const f = function (cls, cap, inner) {
      return '<div class="rf ' + cls + '"><span class="cap">' + cap + '</span>' + inner + '</div>';
    };
    const money = function (field, val, ph) {
      return '<input type="text" class="form-input ta-r"'
        + ' placeholder="' + (ph || '0') + '" value="' + (val ? formatNumber(val) : '') + '"'
        + ' oninput="updateInvoice(\'' + id + '\',\'' + field + '\', parseNumber(this.value))"'
        + ' onblur="this.value = this.value ? formatNumber(parseNumber(this.value)) : \'\'">';
    };
    const pick = function (field, opts, cur) {
      return '<select class="form-select" onchange="updateInvoice(\'' + id + '\',\'' + field + '\', this.value)">'
        + opts.map(function (o) {
            return '<option value="' + esc(o) + '"' + (cur === o ? ' selected' : '') + '>' + esc(o) + '</option>';
          }).join('') + '</select>';
    };

    const out = ['<div class="inv-card">'];

    /* ① 고객사 · 과정명 */
    out.push('<div class="inv-top">'
      + '<span class="seq">' + (i + 1) + '장</span>'
      + '<span class="who"><i>고객사</i><b>' + esc(client || '-') + '</b></span>'
      + '<span class="who"><i>과정명</i><b>' + esc(course || '-') + '</b></span>'
      + '<button type="button" class="rtool del" title="이 계산서 삭제"'
      +   ' onclick="removeInvoice(\'' + id + '\')"' + (single ? ' disabled' : '') + '>✖</button>'
      + '</div>');

    /* ② 매출 정보 (읽기 전용) */
    out.push('<div class="inv-from-sale">'
      + '<span class="lb">매출 정보</span>'
      + '<span class="it"><i>공급가액</i><b>' + formatNumber(want.supply) + '</b></span>'
      + '<span class="it"><i>세액</i><b>' + formatNumber(want.vat) + '</b></span>'
      + '<span class="it"><i>합계금액</i><b class="big">' + formatNumber(want.total) + '</b></span>'
      + '<span class="tag">부가세 ' + esc(want.vatMode) + '</span>'
      + (want.discount
        ? '<span class="tag">절사 ' + formatNumber(want.discount) + ' (' + esc(want.discountBase) + ' 기준)</span>'
        : '<span class="tag muted">절사 없음</span>')
      + '<span class="note">매출 정보에서 가져온 값입니다 · 여기서는 고치지 않습니다</span>'
      + '</div>');

    /* ③ 항목(품목) */
    const items = invItems(it);
    out.push('<div class="inv-items">');
    const imode = invItemMode(it);
    const wmode = invWriteMode(it);
    const byHand = (wmode === '수기작성');
    const modeBtn = function (m) {
      // 수기작성이면 단가를 안 쓰므로 별도/포함을 고를 까닭이 없다
      return '<button type="button" class="ii-mode' + (imode === m ? ' on' : '') + '"'
        + (byHand ? ' disabled title="수기작성에서는 단가를 쓰지 않습니다"' : '')
        + ' onclick="setInvItemMode(\'' + id + '\', \'' + m + '\')">' + m + '</button>';
    };
    const writeBtn = function (m) {
      return '<button type="button" class="ii-mode' + (wmode === m ? ' on' : '') + '"'
        + ' onclick="setInvWriteMode(\'' + id + '\', \'' + m + '\')">' + m + '</button>';
    };
    out.push('<div class="ii-head">'
      + '<span class="lb">항목(품목)</span>'
      // 단가를 어떻게 볼지 — 고르면 공급가액·세액이 그 자리에서 다시 계산된다
      + '<span class="ii-modes" title="적어 넣은 단가를 부가세 별도로 볼지, 부가세가 들어 있는 금액으로 볼지">'
      +   '<i>단가 기준</i>' + modeBtn('별도') + modeBtn('포함')
      + '</span>'
      + '<button type="button" class="btn btn-outline btn-sm" onclick="addInvItem(\'' + id + '\')">＋ 항목 추가</button>'
      + '<button type="button" class="btn btn-ghost btn-sm" onclick="fillInvItems(\'' + id + '\')">매출에서 가져오기</button>'
      // 자동계산으로 쓸지, 금액을 직접 적을지
      + '<span class="ii-modes" title="자동계산은 단가 × 수량 으로 냅니다. 수기작성은 공급가액을 직접 적습니다.">'
      +   '<i>작성</i>' + writeBtn('자동계산') + writeBtn('수기작성')
      + '</span>'
      + '<button type="button" class="btn btn-ghost btn-sm" onclick="resetInvItems(\'' + id + '\')">↺ 초기화</button>'
      + '</div>');

    {
      out.push('<table class="ii-table"><thead><tr>'
        + '<th>항목</th><th>수량</th><th>단가' + (byHand ? '' : ' <em>(' + imode + ')</em>') + '</th>'
        + '<th>공급가액</th><th>세액</th><th>합계</th><th>비고</th><th></th>'
        + '</tr></thead><tbody>');
      items.forEach(function (r, ri) {
        const c = invItemCalc(r, mode);
        const inp = function (field, val, cls, ph, elid) {
          // 수기작성에서는 수량·단가를 쓰지 않으므로 잠가 둔다
          const off = byHand && (field === 'qty' || field === 'price');
          return '<input type="text" class="form-input ' + (cls || '') + (off ? ' off' : '') + '"'
            + (elid ? ' id="' + elid + '"' : '')
            + (off ? ' disabled title="수기작성에서는 쓰지 않습니다"' : '')
            + ' placeholder="' + (off ? '—' : (ph || '')) + '" value="' + esc(val == null ? '' : val) + '"'
            + ' oninput="updateInvItem(\'' + id + '\',' + ri + ',\'' + field + '\', this.value)">';
        };
        out.push('<tr>'
          + '<td>' + inp('name', r.name, '', '항목명을 적으세요') + '</td>'
          + '<td>' + inp('qty', r.qty, 'ta-c', '0') + '</td>'
          + '<td>' + inp('price', r.price ? formatNumber(r.price) : '', 'ta-r') + '</td>'
          + '<td>' + '<input type="text" class="form-input ta-r" id="iis-' + id + '-' + ri + '"'
          +   ' value="' + (c.supply ? formatNumber(c.supply) : '') + '"'
          +   ' oninput="updateInvItem(\'' + id + '\',' + ri + ',\'supply\', parseNumber(this.value))"'
          +   ' onblur="this.value = this.value ? formatNumber(parseNumber(this.value)) : \'\'"></td>'
          + '<td>' + '<input type="text" class="form-input ta-r" id="iiv-' + id + '-' + ri + '"'
          +   ' value="' + (c.vat ? formatNumber(c.vat) : '') + '"'
          +   ' oninput="updateInvItem(\'' + id + '\',' + ri + ',\'vat\', parseNumber(this.value))"'
          +   ' onblur="this.value = this.value ? formatNumber(parseNumber(this.value)) : \'\'"></td>'
          + '<td class="ii-total" id="iit-' + id + '-' + ri + '">' + formatNumber(c.total) + '</td>'
          + '<td>' + inp('note', r.note, '') + '</td>'
          + '<td><button type="button" class="ii-del" title="이 항목 삭제"'
          +   (items.length <= 1 ? ' disabled title="항목은 한 줄은 있어야 합니다"' : '')
          +   ' onclick="removeInvItem(\'' + id + '\',' + ri + ')">✖</button></td>'
          + '</tr>');
      });
      out.push('</tbody></table>');
    }
    out.push('<div class="ii-sum" id="invchk-' + id + '"></div>');
    out.push('</div>');

    /* ④ 발행 정보 */
    out.push('<div class="rline">');
    out.push(f('rf-co', '발행회사', pick('company', COMPANIES, it.company || currentCompany())));
    out.push(f('rf-date', '발행일',
      dateInput(it.issue_date, 'updateInvoice(\'' + id + '\', \'issue_date\', this.value)')));
    out.push(f('rf-pay', '청구/영수', pick('pay_type', ['청구', '영수'], it.pay_type || '청구')));
    out.push(f('rf-memo', '비고',
      '<input type="text" class="form-input" value="' + esc(it.note || '') + '"'
      + ' oninput="updateInvoice(\'' + id + '\',\'note\', this.value)">'));
    out.push('</div>');

    /* ⑤ 받는 사람 */
    out.push('<div class="rline sub-line">');
    out.push('<div class="rf-lb">받는 사람</div>');
    out.push('<div class="recv-wrap">');
    invRecipients(it).forEach(function (r, ri) {
      const known = !!(r.email || r.phone);
      out.push('<div class="recv-one">'
        + '<div class="recv-no">받는 사람 ' + (ri + 1) + '</div>'
        + '<div class="rf rf-rname autocomplete-wrapper"><span class="cap">이름</span>'
        +   '<input type="text" class="form-input" value="' + esc(r.name || '') + '"'
        +     ' autocomplete="off"'
        +     ' oninput="updateRecipient(\'' + id + '\',' + ri + ',\'name\', this.value)"'
        +     ' onkeyup="searchRecipient(this, \'' + id + '\',' + ri + ')">'
        +   '<div id="auto-recv-' + id + '-' + ri + '" class="autocomplete-list"></div></div>'
        + '<div class="rf rf-remail"><span class="cap">이메일</span>'
        +   '<input type="text" class="form-input' + (known || !r.name ? '' : ' need') + '"'
        +     ' placeholder="' + (r.name && !known ? '확인해주세요' : '') + '"'
        +     ' value="' + esc(r.email || '') + '"'
        +     ' oninput="updateRecipient(\'' + id + '\',' + ri + ',\'email\', this.value)"></div>'
        + '<div class="rf rf-rphone"><span class="cap">연락처</span>'
        +   '<input type="text" class="form-input' + (known || !r.name ? '' : ' need') + '"'
        +     ' placeholder="' + (r.name && !known ? '확인해주세요' : '') + '"'
        +     ' value="' + esc(r.phone || '') + '"'
        +     ' oninput="updateRecipient(\'' + id + '\',' + ri + ',\'phone\', this.value)"></div>'
        /* 늘 두 자리를 보여주므로 ＋ 는 필요 없다.
           비우면 그 사람은 저장되지 않는다 — ✖ 는 「비우기」로 둔다. */
        + '<button type="button" class="recv-btn del" title="이 사람 비우기"'
        +   ' onclick="clearRecipient(\'' + id + '\',' + ri + ')">✖</button>'
        + '</div>');
    });
    out.push('</div></div>');

    /* ⑥ 결제 */
    out.push('<div class="rline sub-line">');
    out.push('<div class="rf-lb">결제</div>');
    [['cash', '현금'], ['check_amount', '수표'], ['note_amount', '어음'], ['credit_amount', '외상미수금']]
      .forEach(function (p) {
        out.push(f('rf-money sm', p[1], money(p[0], it[p[0]], p[0] === 'credit_amount' ? '자동' : '0')));
      });
    out.push('<button type="button" class="btn btn-outline btn-sm inv-prev"'
      + ' onclick="previewInvoice(\'' + id + '\')">🔍 미리보기</button>');
    out.push(formReqBtn(it));
    out.push('</div>');

    out.push('</div>');
    return out.join('');
  }).join('');

  State.invoices.forEach(renderInvCheck);
  renderInvoiceTotals();
}

/*
 * 과정 등록 화면의 [발행요청].
 *
 * 세금계산서 목록에도 같은 단추가 있지만 그 화면은 관리자만 볼 수 있다.
 * 계산서를 적는 자리에 두어야 직원도 적자마자 요청할 수 있다.
 * (대표님 지시 2026-10-26)
 *
 * 아직 저장하지 않은 계산서는 번호가 없어 요청할 수 없다 — 그때는
 * 잠그고 까닭을 알려준다.
 */
function formReqBtn(it) {
  if (!it.id) {
    return '<button type="button" class="btn btn-ghost btn-sm inv-req" disabled'
      + ' title="과정을 먼저 저장해주세요. 저장한 뒤에 요청할 수 있습니다.">발행요청</button>';
  }
  if (it.requested) {
    const more = it.requested_count > 1 ? ' ×' + it.requested_count : '';
    return '<button type="button" class="btn btn-ghost btn-sm inv-req req-on"'
      + ' title="' + esc((it.requested_by || '') + ' · ' + (it.requested_at || '')
        + ' 에 요청했습니다. 눌러서 다시 보내기') + '"'
      + ' onclick="requestFromForm(' + it.id + ', true)">✓ 요청함' + more + '</button>';
  }
  return '<button type="button" class="btn btn-primary btn-sm inv-req"'
    + ' title="김소애 · 임영환 님께 발행요청 메일을 보냅니다"'
    + ' onclick="requestFromForm(' + it.id + ', false)">발행요청</button>';
}

/** 과정 등록 화면에서 발행요청 보내기 */
async function requestFromForm(invoiceId, again) {
  const it = State.invoices.filter(function (x) { return x.id === invoiceId; })[0] || {};
  const ask = again
    ? '이미 ' + (it.requested_at ? it.requested_at + ' 에 ' : '') + '요청했습니다.\n다시 보낼까요?'
    : '김소애 · 임영환 님께 발행요청 메일을 보낼까요?';
  if (!confirm(ask)) return;

  const note = prompt('함께 남길 말이 있으면 적어주세요. (없으면 그냥 확인)', '');
  if (note === null) return;

  try {
    const r = await API.post('/invoices/' + invoiceId + '/request', { note: note });
    showToast(r.message, 'success');
    // 보낸 표시를 바로 반영한다 (화면을 다시 불러오지 않고)
    it.requested = true;
    it.requested_at = r.sent_at;
    it.requested_by = r.sent_by;
    it.requested_count = (it.requested_count || 0) + 1;
    renderInvoices();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

/**
 * 미리보기 — 홈택스 발행 화면.
 * 작성일자와 결제(현금·수표·어음·외상미수금)는 빼고,
 * 「이 금액을 청구/영수 함」과 받는 사람은 남긴다.
 */
function previewInvoice(id) {
  const it = State.invoices.find(function (x) { return x._id === id; });
  if (!it) return;

  const mode = invMode(it);
  const co = it.company || currentCompany();
  const client = (document.getElementById('p-client-name') || {}).value || '';
  const course = (document.getElementById('p-course-name') || {}).value || '';
  const want = saleSummary();

  let rows = invItems(it).map(function (r) {
    const c = invItemCalc(r, mode);
    return {
      name: r.name || '', qty: r.qty || '', price: parseNumber(r.price) || 0,
      supply: c.supply, vat: c.vat, total: c.total, note: r.note || ''
    };
  });
  if (rows.length === 0) {
    rows = [{
      name: course || '교육 용역', qty: '', price: 0,
      supply: want.supply, vat: want.vat, total: want.total, note: ''
    }];
  }

  const sum = rows.reduce(function (a, r) {
    return { supply: a.supply + r.supply, vat: a.vat + r.vat, total: a.total + r.total };
  }, { supply: 0, vat: 0, total: 0 });

  const won = function (v) { return v ? formatNumber(v) : ''; };
  const recv = invRecipients(it).filter(function (r) { return r.name || r.email || r.phone; });

  const SHOW = Math.max(4, rows.length);
  const body = [];
  for (let i = 0; i < SHOW; i++) {
    const r = rows[i];
    body.push('<tr>'
      + '<td class="nm">' + (r ? esc(r.name) : '') + '</td>'
      + '<td class="c">' + (r ? esc(r.qty) : '') + '</td>'
      + '<td class="n">' + (r ? won(r.price) : '') + '</td>'
      + '<td class="n">' + (r ? won(r.supply) : '') + '</td>'
      + '<td class="n">' + (r ? won(r.vat) : '') + '</td>'
      + '<td class="n">' + (r ? won(r.total) : '') + '</td>'
      + '<td>' + (r ? esc(r.note) : '') + '</td>'
      + '</tr>');
  }

  const gap = want.supply - sum.supply;

  const html = [
    '<div class="modal-overlay" onclick="if(event.target===this)this.remove()">',
    '  <div class="modal hometax-modal">',
    '    <div class="modal-header"><h3>세금계산서 미리보기</h3>',
    '      <button class="modal-close" onclick="this.closest(\'.modal-overlay\').remove()">✕</button></div>',
    '    <div class="modal-body">',

    '<div class="ht">',

    '  <div class="ht-top">',
    '    <div class="ht-cell"><label>공급자</label><span class="val box">' + esc(co) + '</span></div>',
    '    <div class="ht-cell grow"><label>공급받는자</label><span class="val box">' + esc(client || '-') + '</span></div>',
    '  </div>',
    '  <div class="ht-top">',
    '    <div class="ht-cell grow"><label>과정명</label><span class="val box">' + esc(course || '-') + '</span></div>',
    '    <div class="ht-cell"><label>부가세</label><span class="val box">' + esc(mode) + '</span></div>',
    '  </div>',
    '  <div class="ht-top">',
    '    <div class="ht-cell"><label>합계금액</label><span class="val box strong">' + formatNumber(sum.total) + '</span></div>',
    '    <div class="ht-cell"><label>공급가액</label><span class="val box">' + formatNumber(sum.supply) + '</span></div>',
    '    <div class="ht-cell"><label>세액</label><span class="val box">' + formatNumber(sum.vat) + '</span></div>',
    '    <div class="ht-cell grow"><label>비고</label><span class="val box">' + esc(it.note || '') + '</span></div>',
    '  </div>',

    '  <table class="ht-table">',
    '    <thead><tr>',
    '      <th>항목</th><th class="w-m">수량</th><th class="w-l">단가</th>',
    '      <th class="w-l">공급가액</th><th class="w-l">세액</th><th class="w-l">합계</th><th class="w-m">비고</th>',
    '    </tr></thead>',
    '    <tbody>' + body.join('') + '</tbody>',
    '    <tfoot><tr><td colspan="3">합계</td>',
    '      <td class="n">' + formatNumber(sum.supply) + '</td>',
    '      <td class="n">' + formatNumber(sum.vat) + '</td>',
    '      <td class="n">' + formatNumber(sum.total) + '</td><td></td>',
    '    </tr></tfoot>',
    '  </table>',
    (gap !== 0
      ? '<div class="ht-warn">⚠ 항목 합계가 매출 공급가액과 ' + formatNumber(Math.abs(gap)) + '원 '
        + (gap > 0 ? '모자랍니다' : '많습니다') + '</div>'
      : ''),

    '  <div class="ht-claim-row">',
    '    <span class="ht-issue"><i>발행일</i><b>' + esc(it.issue_date || '-') + '</b></span>',
    '    <span class="ht-claim">이 금액을',
    '    <span class="ht-radio' + ((it.pay_type || '청구') === '청구' ? ' on' : '') + '">●&nbsp;청구</span>',
    '    <span class="ht-radio' + (it.pay_type === '영수' ? ' on' : '') + '">○&nbsp;영수</span>',
    '    함</span></div>',

    '  <div class="ht-recv"><label>받는 사람</label>',
    (recv.length
      ? recv.map(function (r, ri) {
          return '<span class="one">' + esc(r.name || '-')
            + (r.email ? ' · ' + privateCell('pv-e' + ri, r.email, 'email') : '')
            + (r.phone ? ' · ' + privateCell('pv-p' + ri, r.phone, 'phone') : '') + '</span>';
        }).join('')
      : '<span class="one muted">아직 안 적었습니다</span>'),
    '  </div>',

    '</div>',
    '    </div>',
    '    <div class="modal-footer">',
    '      <button class="btn btn-primary" onclick="this.closest(\'.modal-overlay\').remove()">닫기</button>',
    '    </div>',
    '  </div></div>'
  ].join('');

  document.body.insertAdjacentHTML('beforeend', html);
}

/* ═══════════════════════════════════════════════════════════
   명단 검색 — 고객사 · 강사 · 협력사 · 직원 · 법인카드 공용
   목록이 길어지면 고치려는 것을 찾기 어려워서 둔다.
   ═══════════════════════════════════════════════════════════ */

const FIND = { clients: '', instructors: '', partners: '', staff: '', cards: '' };

/** 검색칸 한 줄 */
function findBar(key, placeholder, count, total) {
  const q = FIND[key] || '';
  return '<div class="list-filter find-bar">'
    + '<div class="f-search">'
    +   '<input type="text" id="find-' + key + '" class="form-input"'
    +     ' placeholder="' + esc(placeholder) + '" value="' + esc(q) + '"'
    +     ' oninput="onFind(\'' + key + '\', this.value)">'
    + '</div>'
    + '<span class="find-count">'
    +   (q ? '<b>' + formatNumber(count) + '</b>건 찾음 <i>(전체 ' + formatNumber(total) + ')</i>'
        : '<b>' + formatNumber(total) + '</b>건')
    + '</span>'
    + (q ? '<button class="btn btn-ghost btn-sm" onclick="clearFind(\'' + key + '\')">✕ 지우기</button>' : '')
    + '</div>';
}

/** 어느 목록을 다시 그릴지 */
const FIND_RENDER = {
  clients: function () { renderClients(); },
  instructors: function () { renderInstructors(); },
  partners: function () { renderPartners(); },
  staff: function () { renderStaff(); },
  cards: function () { renderCards(); }
};

let findTimer = null;
function onFind(key, v) {
  FIND[key] = v;
  clearTimeout(findTimer);
  findTimer = setTimeout(function () {
    FIND_RENDER[key]();
    const el = document.getElementById('find-' + key);
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }, 250);
}

function clearFind(key) {
  FIND[key] = '';
  FIND_RENDER[key]();
}

/** 여러 칸을 묶어 검색어가 들어있는지 본다 */
function findMatch(key, fields) {
  const q = String(FIND[key] || '').trim().toLowerCase();
  if (!q) return true;
  return fields.some(function (f) {
    return String(f == null ? '' : f).toLowerCase().indexOf(q) !== -1;
  });
}


/* ═══════════════════════════════════════════════════════════
   법인카드 명단
   ═══════════════════════════════════════════════════════════ */

let CARD_DATA = null;

async function renderCards() {
  const content = document.getElementById('main-content');

  let d;
  try { d = await API.getCards(); } catch (e) { showToast(e.message, 'error'); return; }
  CARD_DATA = d;

  const all = d.cards || [];
  const rows = all.filter(function (c) {
    return findMatch('cards', [c.last4, c.issuer, c.holder, c.note, c.company]);
  });

  content.innerHTML = [
    '<div class="page-header">',
    '  <div><h2>법인카드 명단</h2>',
    '    <div class="subtitle">카드 뒤 4자리로 매입·경비에 적습니다. 어느 카드인지 알 수 있게 카드사와 소지자를 함께 적어두세요.</div></div>',
    (API.isAdmin() ? '  <button class="btn btn-primary" onclick="openCardModal()">＋ 카드 등록</button>' : ''),
    '</div>',

    findBar('cards', '뒤 4자리 · 카드사 · 소지자 검색', rows.length, all.length),

    ((d.unregistered || []).length
      ? '<div class="warn-box" style="margin-bottom:1rem"><span class="ico">' + icon('alert', 18) + '</span>'
        + '<span class="txt">매입·경비에는 쓰였는데 <b>명단에 없는 카드</b>가 있습니다 — '
        + d.unregistered.map(function (u) {
            return '<button class="an-link" onclick="openCardModal(null, \'' + esc(u.last4) + '\')">···'
              + esc(u.last4) + ' (' + u.cnt + '건)</button>';
          }).join(' ')
        + ' · 눌러서 등록하세요.</span></div>'
      : ''),

    (rows.length === 0
      ? '<div class="empty-state" style="padding:3rem"><p>'
        + (FIND.cards ? '찾는 카드가 없습니다.' : '등록된 법인카드가 없습니다.') + '</p>'
        + (API.isAdmin() && !FIND.cards
          ? '<button class="btn btn-primary btn-sm" style="margin-top:1rem" onclick="openCardModal()">＋ 첫 카드 등록</button>' : '')
        + '</div>'
      : [
        '<div class="table-container"><table class="data-table">',
        '<thead><tr><th class="th-mid">뒤 4자리</th><th>카드사</th><th>소지자</th>',
        '  <th class="th-mid">회사</th><th class="th-mid">과정 매입</th><th class="th-num">금액</th>',
        '  <th class="th-mid">회사 경비</th><th class="th-num">금액</th>',
        '  <th>비고</th><th class="th-mid">상태</th>' + (API.isAdmin() ? '<th></th>' : '') + '</tr></thead><tbody>',
        rows.map(function (c) {
          return '<tr' + (c.is_active ? '' : ' style="opacity:0.55"') + '>'
            + '<td class="c-mid"><span class="card-no">···' + esc(c.last4) + '</span></td>'
            + '<td style="font-weight:600">' + esc(c.issuer || '-') + '</td>'
            + '<td>' + esc(c.holder || '-') + '</td>'
            + '<td class="c-mid"><span class="co-tag' + (c.company === '그로우인' ? ' sub' : '') + '">'
            +   esc(c.company || '혜움컨설팅') + '</span></td>'
            + '<td class="c-mid">' + (c.use_count || 0) + '</td>'
            + '<td class="amount-cell amount-negative">' + formatNumber(c.use_amount || 0) + '</td>'
            + '<td class="c-mid">' + (c.oh_count || 0) + '</td>'
            + '<td class="amount-cell amount-negative">' + formatNumber(c.oh_amount || 0) + '</td>'
            + '<td class="an-sub" style="font-size:0.8rem">' + esc(c.note || '-') + '</td>'
            + '<td class="c-mid"><span class="badge ' + (c.is_active ? 'badge-active' : 'badge-inactive') + '">'
            +   (c.is_active ? '사용' : '사용안함') + '</span></td>'
            + (API.isAdmin()
              ? '<td style="white-space:nowrap">'
                + '<button class="btn btn-ghost btn-sm" onclick="openCardModal(' + c.id + ')">✎</button> '
                + '<button class="btn btn-danger btn-sm" onclick="deleteCard(' + c.id + ')">✖</button></td>'
              : '')
            + '</tr>';
        }).join(''),
        '</tbody></table></div>'
      ].join(''))
  ].join('');
}

/** 등록 · 수정 창 */
function openCardModal(id, presetLast4) {
  const c = id && CARD_DATA ? (CARD_DATA.cards || []).find(function (x) { return x.id === id; }) : null;
  const companies = (CARD_DATA && CARD_DATA.companies) || COMPANIES;

  const html = [
    '<div class="modal-overlay" onclick="if(event.target===this)this.remove()">',
    '  <div class="modal">',
    '    <div class="modal-header"><h3>' + (c ? '법인카드 수정' : '법인카드 등록') + '</h3>',
    '      <button class="modal-close" onclick="this.closest(\'.modal-overlay\').remove()">✕</button></div>',
    '    <div class="modal-body">',
    '      <div class="form-row">',
    '        <div class="form-group"><label class="form-label form-required">카드 뒤 4자리</label>',
    '          <input type="text" id="cd-last4" class="form-input card4" inputmode="numeric" maxlength="4"',
    '            placeholder="0000" value="' + esc(c ? c.last4 : (presetLast4 || '')) + '"',
    '            oninput="this.value=this.value.replace(/[^0-9]/g,\'\').slice(0,4)"></div>',
    '        <div class="form-group"><label class="form-label">카드사</label>',
    '          <input type="text" id="cd-issuer" class="form-input" placeholder="예) 신한 · 국민 · 하나"',
    '            list="card-issuers" value="' + esc(c ? c.issuer : '') + '">',
    '          <datalist id="card-issuers">',
    ['신한', '국민', '하나', '우리', '삼성', '현대', '롯데', 'BC', 'NH농협', '기업']
      .map(function (x) { return '<option value="' + x + '">'; }).join(''),
    '          </datalist></div>',
    '      </div>',
    '      <div class="form-row">',
    '        <div class="form-group"><label class="form-label">소지자 <span style="font-weight:400;color:var(--text-muted)">(발급받은 사람)</span></label>',
    '          <input type="text" id="cd-holder" class="form-input" placeholder="예) 임영환"',
    '            value="' + esc(c ? c.holder : '') + '"></div>',
    '        <div class="form-group"><label class="form-label">회사</label>',
    '          <select id="cd-company" class="form-select">',
    companies.map(function (n) {
      return '<option value="' + esc(n) + '"'
        + ((c ? c.company : companies[0]) === n ? ' selected' : '') + '>' + esc(n) + '</option>';
    }).join(''),
    '          </select></div>',
    '      </div>',
    '      <div class="form-group"><label class="form-label">비고</label>',
    '        <input type="text" id="cd-note" class="form-input" placeholder="용도 등"',
    '          value="' + esc(c ? c.note : '') + '"></div>',
    (c ? '<div class="form-group"><label class="form-label">상태</label>'
      + '<select id="cd-active" class="form-select">'
      + '<option value="1"' + (c.is_active ? ' selected' : '') + '>사용 — 입력칸에 나옵니다</option>'
      + '<option value="0"' + (c.is_active ? '' : ' selected') + '>사용안함 — 숨깁니다</option>'
      + '</select></div>' : ''),
    '      <div class="oh-hint">뒤 4자리를 바꾸면 이미 적어둔 매입·경비의 번호도 함께 바뀝니다.</div>',
    '    </div>',
    '    <div class="modal-footer">',
    (c ? '<button class="btn btn-danger btn-sm" onclick="deleteCard(' + c.id + ')">삭제</button>' : ''),
    '      <button class="btn btn-ghost" onclick="this.closest(\'.modal-overlay\').remove()">취소</button>',
    '      <button class="btn btn-primary" onclick="saveCard(' + (c ? c.id : 'null') + ')">저장</button>',
    '    </div>',
    '  </div></div>'
  ].join('');

  document.body.insertAdjacentHTML('beforeend', html);
}

async function saveCard(id) {
  const g = function (x) { return (document.getElementById(x) || {}).value || ''; };
  const data = {
    last4: g('cd-last4').trim(),
    issuer: g('cd-issuer').trim(),
    holder: g('cd-holder').trim(),
    company: g('cd-company') || COMPANIES[0],
    note: g('cd-note').trim()
  };
  const act = document.getElementById('cd-active');
  if (act) data.is_active = act.value === '1';

  if (data.last4.length !== 4) return showToast('카드 뒤 4자리를 숫자로 적어주세요.', 'error');

  try {
    if (id) await API.updateCard(id, data);
    else await API.createCard(data);
    const ov = document.querySelector('.modal-overlay'); if (ov) ov.remove();
    showToast(id ? '수정했습니다.' : '등록했습니다.', 'success');
    loadCardList();
    renderCards();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteCard(id) {
  if (!confirm('이 카드를 명단에서 지울까요?\n이미 쓰인 카드는 「사용안함」으로만 바뀝니다.')) return;
  try {
    const r = await API.deleteCard(id);
    const ov = document.querySelector('.modal-overlay'); if (ov) ov.remove();
    showToast(r.deactivated
      ? '매입·경비 ' + r.used + '건에 쓰이고 있어 「사용안함」으로 바꿨습니다.'
      : '지웠습니다.', 'success');
    loadCardList();
    renderCards();
  } catch (e) { showToast(e.message, 'error'); }
}

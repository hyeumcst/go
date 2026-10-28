/*
 * 서버 코드 — 브라우저에서 돕니다.
 *
 * build-github.js 가 .gs 파일들을 그대로 묶은 것입니다. 손으로 고치지 마세요.
 * 고칠 곳은 appsscript/*.gs 와 public/js/fb-*.js 입니다.
 *
 * 통째로 울타리 안에 있습니다 — 화면 코드와 이름이 겹치지 않게 하려는 것이고,
 * 밖으로 내보내는 것은 맨 아래 몇 개뿐입니다.
 */
(function () {

/* ═════ Schema.gs ═════ */
/**
 * 표 정의 — SQLite 스키마에서 자동 생성했습니다. 손으로 고치지 마세요.
 * kind: n = 숫자, t = 텍스트(시트 자동변환 방지)
 */
const SCHEMA = {
  clients: [
    { n: 'id', k: 'n' },
    { n: 'name', k: 't' },
    { n: 'is_active', k: 'n' },
    { n: 'created_at', k: 't' },
  ],
  contacts: [
    { n: 'id', k: 'n' },
    { n: 'client_id', k: 'n' },
    { n: 'name', k: 't' },
    { n: 'position', k: 't' },
    { n: 'is_active', k: 'n' },
    { n: 'created_at', k: 't' },
    { n: 'department', k: 't' },
  ],
  corp_cards: [
    { n: 'id', k: 'n' },
    { n: 'last4', k: 't' },
    { n: 'issuer', k: 't' },
    { n: 'holder', k: 't' },
    { n: 'company', k: 't' },
    { n: 'note', k: 't' },
    { n: 'is_active', k: 'n' },
    { n: 'created_at', k: 't' },
    { n: 'updated_at', k: 't' },
  ],
  instructors: [
    { n: 'id', k: 'n' },
    { n: 'name', k: 't' },
    { n: 'affiliation', k: 't' },
    { n: 'email', k: 't' },
    { n: 'default_tax_type', k: 't' },
    { n: 'default_unit_price', k: 'n' },
    { n: 'is_active', k: 'n' },
    { n: 'created_at', k: 't' },
    { n: 'updated_at', k: 't' },
    { n: 'title', k: 't' },
  ],
  overheads: [
    { n: 'id', k: 'n' },
    { n: 'spend_date', k: 't' },
    { n: 'category', k: 't' },
    { n: 'name', k: 't' },
    { n: 'amount', k: 'n' },
    { n: 'vat', k: 'n' },
    { n: 'tax_type', k: 't' },
    { n: 'note', k: 't' },
    { n: 'created_by', k: 't' },
    { n: 'created_at', k: 't' },
    { n: 'updated_at', k: 't' },
    { n: 'card_last4', k: 't' },
  ],
  partners: [
    { n: 'id', k: 'n' },
    { n: 'name', k: 't' },
    { n: 'category', k: 't' },
    { n: 'note', k: 't' },
    { n: 'default_tax_type', k: 't' },
    { n: 'is_active', k: 'n' },
    { n: 'created_at', k: 't' },
    { n: 'updated_at', k: 't' },
  ],
  project_expenses: [
    { n: 'id', k: 'n' },
    { n: 'project_id', k: 'n' },
    { n: 'category', k: 't' },
    { n: 'instructor_id', k: 'n' },
    { n: 'name', k: 't' },
    { n: 'affiliation', k: 't' },
    { n: 'hours', k: 'n' },
    { n: 'quantity', k: 'n' },
    { n: 'unit', k: 't' },
    { n: 'sessions', k: 'n' },
    { n: 'unit_price', k: 'n' },
    { n: 'is_manual', k: 'n' },
    { n: 'total_amount', k: 'n' },
    { n: 'tax_type', k: 't' },
    { n: 'tax_amount', k: 'n' },
    { n: 'payment_amount', k: 'n' },
    { n: 'payment_date', k: 't' },
    { n: 'note', k: 't' },
    { n: 'created_at', k: 't' },
    { n: 'card_last4', k: 't' },
  ],
  project_invoices: [
    { n: 'id', k: 'n' },
    { n: 'project_id', k: 'n' },
    { n: 'seq', k: 'n' },
    { n: 'supply_amount', k: 'n' },
    { n: 'vat', k: 'n' },
    { n: 'total_amount', k: 'n' },
    { n: 'issue_date', k: 't' },
    { n: 'paid_date', k: 't' },
    { n: 'note', k: 't' },
    { n: 'created_at', k: 't' },
    { n: 'discount', k: 'n' },
    { n: 'vat_mode', k: 'n' },
    { n: 'discount_base', k: 'n' },
    { n: 'is_manual', k: 'n' },
    { n: 'company', k: 't' },
    { n: 'write_date', k: 't' },
    { n: 'remark', k: 't' },
    { n: 'pay_type', k: 't' },
    { n: 'cash', k: 'n' },
    { n: 'check_amount', k: 'n' },
    { n: 'note_amount', k: 'n' },
    { n: 'credit_amount', k: 'n' },
    { n: 'recipients', k: 't' },
    { n: 'items', k: 't' },
  ],
  project_sales: [
    { n: 'id', k: 'n' },
    { n: 'project_id', k: 'n' },
    { n: 'category', k: 't' },
    { n: 'subcategory', k: 't' },
    { n: 'name', k: 't' },
    { n: 'unit_price', k: 'n' },
    { n: 'qty1', k: 'n' },
    { n: 'unit1', k: 't' },
    { n: 'qty2', k: 'n' },
    { n: 'unit2', k: 't' },
    { n: 'sessions', k: 'n' },
    { n: 'amount', k: 'n' },
    { n: 'note', k: 't' },
    { n: 'sort_order', k: 'n' },
    { n: 'is_manual', k: 'n' },
  ],
  projects: [
    { n: 'id', k: 'n' },
    { n: 'client_id', k: 'n' },
    { n: 'contact_id', k: 'n' },
    { n: 'type', k: 't' },
    { n: 'course_name', k: 't' },
    { n: 'schedule_type', k: 't' },
    { n: 'schedule_dates', k: 't' },
    { n: 'sale_labor', k: 't' },
    { n: 'sale_operation', k: 't' },
    { n: 'sale_venue', k: 't' },
    { n: 'total_sales', k: 'n' },
    { n: 'vat', k: 'n' },
    { n: 'total_with_vat', k: 'n' },
    { n: 'total_expenses', k: 'n' },
    { n: 'memo', k: 't' },
    { n: 'created_by', k: 't' },
    { n: 'created_at', k: 't' },
    { n: 'updated_at', k: 't' },
    { n: 'manager', k: 't' },
    { n: 'sales_rep', k: 't' },
    { n: 'discount', k: 'n' },
    { n: 'vat_mode', k: 'n' },
    { n: 'discount_base', k: 'n' },
    { n: 'company', k: 't' },
  ],
  staff: [
    { n: 'id', k: 'n' },
    { n: 'name', k: 't' },
    { n: 'kind', k: 't' },
    { n: 'position', k: 't' },
    { n: 'note', k: 't' },
    { n: 'is_active', k: 'n' },
    { n: 'created_at', k: 't' },
    { n: 'updated_at', k: 't' },
  ],
  // 비밀번호는 소금(salt)을 붙인 해시로만 저장합니다 — 평문은 어디에도 없습니다
  users: [
    { n: 'id', k: 'n' },
    { n: 'username', k: 't' },
    { n: 'password_hash', k: 't' },
    { n: 'salt', k: 't' },
    { n: 'name', k: 't' },
    { n: 'role', k: 't' },
    { n: 'is_active', k: 'n' },
    { n: 'created_at', k: 't' },
    { n: 'last_login', k: 't' },
  ],
};

/** 시트 탭 이름 (사람이 읽는 이름) */
const TAB = {
  clients: '고객사',
  contacts: '고객사담당자',
  corp_cards: '법인카드',
  instructors: '강사',
  overheads: '회사경비',
  partners: '협력사',
  project_expenses: '매입상세',
  project_invoices: '세금계산서',
  project_sales: '매출상세',
  projects: '과정',
  staff: '직원외부영업',
  users: '사용자'
};

/*
 * ── 손으로 더한 표 (SQLite 에는 없다) ──
 *
 * 「확인함」 표시. 대시보드 경고를 보고 한 건씩 확인했다고 눌러 두면,
 * 그 건은 다음부터 경고에 안 나온다.
 *
 * 과정 표에 칸을 더하지 않고 따로 뒀다. 과정 시트는 이미 24칸이 차 있어
 * 칸을 하나 더하면 쌓여 있는 줄들과 어긋날 위험이 있기 때문이다.
 * 여기 표는 비어 있어도 되고, 지워도 경고가 다시 보일 뿐 자료는 안 다친다.
 */
SCHEMA.alert_checks = [
  { n: 'id', k: 'n' },
  { n: 'kind', k: 't' },        // 무슨 경고인지 — 지금은 missing_expense 하나
  { n: 'ref_id', k: 'n' },      // 그 경고가 가리키는 것 (과정 번호)
  { n: 'checked_by', k: 't' },  // 누가 확인했는지
  { n: 'checked_at', k: 't' },  // 언제
];
TAB.alert_checks = '확인함';

/*
 * 교육진행 — 실제로 현장에 다녀온 날.
 * 과정에 적는 「교육일정」은 하기로 한 날이고, 이것은 실제로 간 날이다.
 * 과정 하나에 한 벌만 둔다.
 */
SCHEMA.project_visits = [
  { n: 'id', k: 'n' },
  { n: 'project_id', k: 'n' },
  { n: 'schedule_type', k: 't' },    // 당일 · 기간 · 차수
  { n: 'schedule_dates', k: 't' },   // [{s,e}, …] 을 글자로
  { n: 'note', k: 't' },
  { n: 'visited_by', k: 't' },       // 다녀온 사람의 아이디 (huc · sakim · shchoi …)
  { n: 'updated_by', k: 't' },
  { n: 'updated_at', k: 't' },
];
TAB.project_visits = '교육진행';

/*
 * 세금계산서 발행요청을 보낸 기록.
 * 두 번 보냈는지, 누가 언제 보냈는지 알 수 있어야 한다.
 *
 * ⚠ 계산서 번호(project_invoices.id)로 기억하면 안 된다.
 *   과정을 저장할 때마다 계산서를 지우고 다시 만들어서 번호가 바뀐다
 *   (writeInvoices). 그러면 과정을 한 번만 고쳐도 「요청함」이 사라진다.
 *   그래서 바뀌지 않는 「과정번호 + 몇 장째」로 기억한다.
 */
SCHEMA.invoice_requests = [
  { n: 'id', k: 'n' },
  { n: 'project_id', k: 'n' },
  { n: 'seq', k: 'n' },
  { n: 'sent_by', k: 't' },      // 요청한 사람의 아이디
  { n: 'sent_to', k: 't' },      // 받은 메일 주소들
  { n: 'sent_at', k: 't' },
  { n: 'note', k: 't' },
];
TAB.invoice_requests = '발행요청';

const TABLES = Object.keys(SCHEMA);


/* ═════ fb-runtime.js ═════ */
/*
 * 서버 코드를 브라우저 안에서 그대로 돌리기 위한 받침대
 * ════════════════════════════════════════════════════════════
 *
 * 왜 이렇게 하는가
 *   서버 코드(.gs 6,700줄)를 다시 쓰지 않는다. 그 코드는 몇 달 돌았고
 *   407개 시험이 지키고 있다. 다시 쓰면 그 믿음을 처음부터 다시 쌓아야 한다.
 *
 *   대신 그 코드가 딛고 선 바닥만 바꿔 끼운다.
 *     구글시트  →  Firestore (메모리에 통째로 들고 있다가 한 번에 쓴다)
 *     구글 전용 물건(Utilities·CacheService…) → 브라우저에 있는 것으로
 *
 *   이미 _harness.js 가 「가짜 시트」로 똑같은 일을 하고 있다. 그것의
 *   브라우저판이다. app.js 7,400줄은 한 글자도 안 바뀐다.
 *
 * 무엇이 어디서 도는가
 *   목록·저장·검색·대시보드·분석  → 브라우저 (여기)
 *   세금계산서 발행요청 메일        → 앱스스크립트 그대로
 *     (메일은 무료 요금제에 없다. 2초 걸려도 아무도 안 기다린다)
 *   정산 엑셀 만들기               → 앱스스크립트 그대로 (구글시트를 만든다)
 *
 * ⚠ 한 가지 꼭 알아야 할 것
 *   여기서 도는 requireAdmin() 은 이제 「안내」일 뿐이다. 브라우저 안의
 *   검사는 마음먹으면 건너뛸 수 있다. 진짜 자물쇠는 Firestore 보안 규칙
 *   하나뿐이다 (fb/firestore.rules · 28가지 시험으로 지키고 있다).
 *   그래서 규칙은 서버가 막던 것과 하나씩 맞춰 두었다.
 */

/* ═══════════════ 구글 전용 물건 흉내 내기 ═══════════════ */

/** 서울 시각으로 날짜를 적는다 — 서버가 쓰던 여섯 가지 모양만 */
function __fmtSeoul(d, fmt) {
  const t = new Date(d);
  // 브라우저가 어느 나라에 있든 서울 시각으로 읽는다
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).formatToParts(t).reduce(function (a, x) { a[x.type] = x.value; return a; }, {});
  const H = p.hour === '24' ? '00' : p.hour;          // en-CA 는 자정을 24 로 준다
  return String(fmt)
    .replace('yyyyMMdd', p.year + p.month + p.day)
    .replace('yyyy-MM-dd', p.year + '-' + p.month + '-' + p.day)
    .replace('HH:mm:ss', H + ':' + p.minute + ':' + p.second)
    .replace('HH:mm', H + ':' + p.minute);
}

const Utilities = {
  formatDate: function (d, tz, fmt) { return __fmtSeoul(d, fmt); },
  getUuid: function () {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
};

/* 잠깐 들고 있는 기억.
   서버에서는 구글의 짧은 기억이었다. 브라우저에서는 그냥 변수면 된다 —
   한 사람의 한 화면 안에서만 쓰이기 때문이다.
   (엑셀 올리기에서 미리보기와 반영 사이에 내용을 들고 있는 데 쓴다) */
const __cache = {};
const CacheService = {
  getScriptCache: function () {
    return {
      get: function (k) { const v = __cache[k]; return v === undefined ? null : v; },
      put: function (k, v) { __cache[k] = String(v); },
      putAll: function (o) { Object.keys(o).forEach(function (k) { __cache[k] = String(o[k]); }); },
      getAll: function (ks) {
        const o = {};
        ks.forEach(function (k) { if (__cache[k] !== undefined) o[k] = __cache[k]; });
        return o;
      },
      remove: function (k) { delete __cache[k]; },
      removeAll: function (ks) { ks.forEach(function (k) { delete __cache[k]; }); }
    };
  }
};

const PropertiesService = {
  getScriptProperties: function () {
    return {
      getProperty: function (k) { try { return localStorage.getItem('sp.' + k); } catch (e) { return null; } },
      setProperty: function (k, v) { try { localStorage.setItem('sp.' + k, String(v)); } catch (e) {} },
      deleteProperty: function (k) { try { localStorage.removeItem('sp.' + k); } catch (e) {} }
    };
  }
};

/* 잠금은 필요 없다 — 이 브라우저 안에서는 한 번에 하나씩만 돈다.
   여러 사람이 동시에 고치는 것은 Firestore 가 문서 단위로 가려 준다. */
const LockService = {
  getScriptLock: function () {
    return { waitLock: function () {}, releaseLock: function () {}, tryLock: function () { return true; } };
  }
};

const Logger = { log: function () { if (window.FB_DEBUG) console.log.apply(console, arguments); } };

/* 여기 닿으면 안 되는 것들 — 조용히 넘어가지 말고 크게 터뜨린다.
   무엇이 아직 앱스스크립트에 남아야 하는지 바로 알 수 있도록. */
function __notHere(name) {
  return new Proxy({}, {
    get: function () {
      throw new Error(name + ' 은(는) 브라우저에서 쓸 수 없습니다. '
        + '이 길은 앱스스크립트에 남겨야 합니다.');
    }
  });
}
const SpreadsheetApp = __notHere('SpreadsheetApp');
const DriveApp = __notHere('DriveApp');
const HtmlService = __notHere('HtmlService');
const ContentService = __notHere('ContentService');
const MailApp = __notHere('MailApp');

/* ═══════════════ 누구인가 ═══════════════
 *
 * 권한을 누가 갖는지는 Auth.gs 가 정한다 (canSeeOthers · canEditOverhead ·
 * maskEmail · personNameOf …). 그 파일을 그대로 싣는다 — 여기에 베껴 적으면
 * 두 곳이 조용히 어긋난다.
 *
 * 비밀번호를 맞춰 보고 표(token)를 만드는 일만 파이어베이스가 가져간다.
 * 그 몇 개는 Auth.gs 를 실은 **뒤에** fb-auth.js 가 덮어쓴다.
 *
 * 여기서는 「지금 들어와 있는 사람이 누구인가」만 들고 있는다.
 */

let __me = null;
function fbSetUser(u) { __me = u; }
function fbUser() { return __me; }


/* ═════ fb-db.js ═════ */
/*
 * Db — 구글시트 대신 Firestore
 * ════════════════════════════════════════════════════════════
 *
 * 서버의 Db.gs 와 겉모습이 똑같다 (all · get · where · first · insert ·
 * insertMany · update · remove · removeWhere …). 그래서 그 위에 얹힌
 * 6,700줄은 자기가 시트를 쓰는지 Firestore 를 쓰는지 모른다.
 *
 * 어떻게 빠른가
 *   들어올 때 982줄을 통째로 한 번 읽어 메모리에 들고 있는다 (약 40ms).
 *   그 뒤 목록·대시보드·분석·검색은 **아무 데도 안 물어본다**. 0ms 다.
 *   고친 것만 모아 두었다가 한 번에 쓴다.
 *
 *   시트일 때는 한 줄 고칠 때마다 구글에 다녀왔다. 열세 줄짜리 과정을
 *   저장하면 열세 번을 오갔다. 이제는 한 번이다.
 *
 * 한꺼번에 쓰는 것의 덤
 *   Firestore 의 묶음 쓰기는 「다 되거나 다 안 되거나」다. 저장하다
 *   중간에 끊겨도 매출만 지워지고 다시 안 적히는 일이 없다.
 *   시트에서는 그럴 수 있었다.
 *
 * 여러 사람이 같이 쓸 때
 *   번호(id)는 「지금 있는 것 중 가장 큰 번호 + 1」로 짓는다. 세 분이
 *   같은 순간에 새 과정을 만들면 같은 번호가 날 수 있다. 그래서 쓰기
 *   직전에 그 번호가 비어 있는지 확인하고, 차 있으면 다시 읽어 짓는다.
 */

/* 메모리에 들고 있는 것 */
const SNAP = {};            // { 표이름: [줄, …] }
const SNAP_BY_ID = {};      // { 표이름: { 번호: 줄 } }
let SNAP_AT = 0;            // 언제 읽었나

/* 아직 Firestore 에 안 쓴 것 */
let PENDING = [];           // [{ op:'set'|'delete', table, id, data }]

function fbSnapAge() { return Date.now() - SNAP_AT; }
function fbSnapLoaded() { return SNAP_AT > 0; }

/* ───────── 들어올 때 통째로 읽기 ───────── */

/*
 * 직원은 못 읽는 표 — 보안 규칙이 막고 있다 (fb/firestore.rules).
 *
 * 서버 코드도 이 표들은 관리자일 때만 들여다본다. 대시보드의 매입 누락
 * 경고가 그렇다 — Dashboard.gs 가 if (isAdmin(u)) 로 감싸 두었다.
 * 그러니 직원에게는 비어 있어도 아무 일이 없다.
 */
const ADMIN_ONLY_TABLES = ['alert_checks'];

/**
 * 표 전부를 한 번에 읽어 들인다.
 * 15개를 한꺼번에 물어본다 — 차례로 물으면 15배 걸린다.
 *
 * 막히는 표가 있을 때
 *   직원이 관리자 전용 표에서 막히는 것은 당연하다 — 비워 두고 간다.
 *   그 밖의 막힘은 규칙이 잘못됐다는 뜻이므로 **크게 터뜨린다**.
 *   조용히 비워 두면 「자료가 없네」로 보여 숫자가 틀린 줄도 모른다.
 *
 * @param {Object} fs   파이어베이스 손잡이
 * @param {Object} u    지금 들어와 있는 사람 (관리자인지 보려고)
 */
async function fbLoadAll(fs, u) {
  const t0 = Date.now();
  const names = TABLES;
  const admin = !!(u && u.role === 'admin');

  const got = await Promise.allSettled(names.map(function (t) {
    return fs.getDocs(fs.collection(fs.db, t));
  }));

  const blocked = [];
  names.forEach(function (t, i) {
    const r = got[i];
    if (r.status === 'rejected') {
      const denied = /permission|insufficient/i.test(String(r.reason && (r.reason.code || r.reason.message)));
      if (denied && !admin && ADMIN_ONLY_TABLES.indexOf(t) >= 0) {
        SNAP[t] = []; SNAP_BY_ID[t] = {};
        blocked.push(t);
        return;
      }
      throw new Error('「' + (TAB[t] || t) + '」을(를) 읽지 못했습니다. '
        + (denied ? '보안 규칙을 확인해주세요.' : (r.reason && r.reason.message) || ''));
    }
    const rows = r.value.docs.map(function (d) { return d.data(); });
    SNAP[t] = rows;
    const by = {};
    rows.forEach(function (x) { by[Number(x.id)] = x; });
    SNAP_BY_ID[t] = by;
  });
  SNAP_AT = Date.now();

  const n = names.reduce(function (a, t) { return a + SNAP[t].length; }, 0);
  Logger.log('자료 ' + n + '줄을 ' + (Date.now() - t0) + 'ms 에 읽었습니다'
    + (blocked.length ? ' (관리자 전용이라 건너뜀: ' + blocked.join(', ') + ')' : ''));
  return n;
}

/** 한 표만 다시 읽는다 (다른 사람이 고쳤을 수 있을 때) */
async function fbReload(fs, table) {
  const snap = await fs.getDocs(fs.collection(fs.db, table));
  const rows = snap.docs.map(function (d) { return d.data(); });
  SNAP[table] = rows;
  const by = {};
  rows.forEach(function (r) { by[Number(r.id)] = r; });
  SNAP_BY_ID[table] = by;
  return rows.length;
}

/* ───────── 모아 둔 것을 한 번에 쓰기 ───────── */

/**
 * 고친 것을 Firestore 에 한꺼번에 쓴다.
 * 한 묶음에 500개까지라 그보다 많으면 나눈다.
 */
async function fbFlush(fs) {
  if (!PENDING.length) return 0;
  const ops = PENDING;
  PENDING = [];

  for (let i = 0; i < ops.length; i += 450) {
    const batch = fs.writeBatch(fs.db);
    ops.slice(i, i + 450).forEach(function (o) {
      const ref = fs.doc(fs.db, o.table, String(o.id));
      if (o.op === 'delete') batch.delete(ref);
      else batch.set(ref, o.data);
    });
    await batch.commit();
  }
  Logger.log(ops.length + '줄을 저장했습니다');
  return ops.length;
}

/** 저장하다 걸렸을 때 — 모아 둔 것을 버리고 메모리도 되돌린다 */
function fbDropPending() { PENDING = []; }
function fbPendingCount() { return PENDING.length; }

/* ───────── Db — Db.gs 와 같은 겉모습 ───────── */

const Db = (function () {

  function rows(table) {
    if (!SNAP[table]) { SNAP[table] = []; SNAP_BY_ID[table] = {}; }
    return SNAP[table];
  }

  /** 다음 번호 — 지금 있는 것 중 가장 큰 번호 + 1 */
  function nextId(table) {
    let max = 0;
    rows(table).forEach(function (r) {
      const n = Number(r.id);
      if (n > max) max = n;
    });
    return max + 1;
  }

  /** 표에 정해진 칸만 남기고, 빠진 칸은 null 로 채운다 (시트와 같은 규칙) */
  function shape(table, obj) {
    const row = {};
    (SCHEMA[table] || []).forEach(function (c) {
      row[c.n] = obj[c.n] === undefined ? null : obj[c.n];
    });
    return row;
  }

  function queue(op, table, id, data) {
    PENDING.push({ op: op, table: table, id: id, data: data });
  }

  function put(table, row) {
    rows(table).push(row);
    SNAP_BY_ID[table][Number(row.id)] = row;
    queue('set', table, row.id, row);
  }

  return {
    all: function (table) { return rows(table); },

    get: function (table, id) {
      return (SNAP_BY_ID[table] || {})[Number(id)] || null;
    },

    where: function (table, fn) { return rows(table).filter(fn); },

    first: function (table, fn) {
      const r = rows(table).filter(fn);
      return r.length ? r[0] : null;
    },

    insert: function (table, obj) {
      const row = shape(table, obj);
      if (row.id === null) row.id = nextId(table);
      if (row.created_at === null && 'created_at' in row) row.created_at = now();
      put(table, row);
      return row;
    },

    insertMany: function (table, objs) {
      if (!objs || !objs.length) return [];
      let id = nextId(table);
      const out = [];
      objs.forEach(function (obj) {
        const row = shape(table, obj);
        if (row.id === null) row.id = id++;
        if (row.created_at === null && 'created_at' in row) row.created_at = now();
        out.push(row);
        put(table, row);
      });
      return out;
    },

    update: function (table, id, patch) {
      const row = (SNAP_BY_ID[table] || {})[Number(id)];
      if (!row) throw new Error('찾을 수 없습니다 (' + table + ' #' + id + ')');
      Object.keys(patch).forEach(function (k) {
        if (k in row && k !== 'id' && k !== '_r') row[k] = patch[k];
      });
      if ('updated_at' in row) row.updated_at = now();
      queue('set', table, row.id, row);
      return row;
    },

    remove: function (table, id) {
      const n = Number(id);
      const row = (SNAP_BY_ID[table] || {})[n];
      if (!row) return false;
      SNAP[table] = rows(table).filter(function (r) { return Number(r.id) !== n; });
      delete SNAP_BY_ID[table][n];
      queue('delete', table, n, null);
      return true;
    },

    removeWhere: function (table, fn) {
      const hits = rows(table).filter(fn);
      if (!hits.length) return 0;
      const gone = {};
      hits.forEach(function (r) {
        gone[Number(r.id)] = 1;
        delete SNAP_BY_ID[table][Number(r.id)];
        queue('delete', table, Number(r.id), null);
      });
      SNAP[table] = rows(table).filter(function (r) { return !gone[Number(r.id)]; });
      return hits.length;
    },

    /* 시트에만 있던 것들 — 여기서는 할 일이 없다 */
    reformat: function () {},
    resetCache: function () {},
    dropCache: function () {},
    sheetOf: function () { return null; },
    ss: function () {
      throw new Error('구글시트는 더 이상 쓰지 않습니다.');
    }
  };
})();

function now() { return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'); }
function today() { return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd'); }


/* ═════ Calc.gs ═════ */
/**
 * 금액 계산 · 회사 구분 · 교육일정
 *
 * 내 PC 버전의 utils/amount.js · company.js · schedule.js 를 그대로 옮긴 것입니다.
 * 계산 규칙이 한 글자라도 달라지면 기존 82개 과정의 금액이 틀어지므로
 * 일부러 손대지 않고 옮겼습니다.
 */

/* ───────── 회사 구분 ───────── */
var COMPANIES = ['혜움컨설팅', '그로우인'];
var DEFAULT_COMPANY = COMPANIES[0];

function normalizeCompany(v) {
  var s = String(v || '').trim();
  return COMPANIES.indexOf(s) >= 0 ? s : DEFAULT_COMPANY;
}

/* ───────── 부가세 · 절사 ───────── */
var VAT_MODES = ['별도', '포함', '면세'];
var DISCOUNT_BASES = ['공급가액', '총액'];

function normalizeMode(mode) { return VAT_MODES.indexOf(mode) >= 0 ? mode : '별도'; }
function normalizeBase(base) { return DISCOUNT_BASES.indexOf(base) >= 0 ? base : '공급가액'; }

function int_(v) { return Math.round(Number(v) || 0); }

/**
 * 절사와 부가세를 적용해 공급가액 · 세액 · 총액을 구한다.
 *  별도 = 입력값이 공급가액,  포함 = 입력값이 총액,  면세 = 세액 0
 *  절사 기준 = 공급가액 | 총액
 */
function computeTotals(rawAmount, discount, vatMode, discountBase) {
  var raw = Math.max(0, int_(rawAmount));
  var mode = normalizeMode(vatMode);
  var base = normalizeBase(discountBase);
  var d0 = Math.max(0, int_(discount));

  if (mode === '면세') {
    var dm = Math.min(d0, raw);
    var sm = raw - dm;
    return { raw: raw, discount: dm, supply: sm, vat: 0, total: sm };
  }

  var supply0, total0;
  if (mode === '포함') {
    total0 = raw;
    supply0 = Math.round(total0 / 1.1);
  } else {
    supply0 = raw;
    total0 = supply0 + Math.round(supply0 * 0.1);
  }

  if (base === '총액') {
    var dt = Math.min(d0, total0);
    var total = total0 - dt;
    var supply = Math.round(total / 1.1);
    return { raw: raw, discount: dt, supply: supply, vat: total - supply, total: total };
  }

  var d = Math.min(d0, supply0);
  var sup = supply0 - d;
  var vat = Math.round(sup * 0.1);
  return { raw: raw, discount: d, supply: sup, vat: vat, total: sup + vat };
}

/* ───────── 교육일정 ─────────
 * 저장 형식: [{ s:'YYYY-MM-DD', e:'YYYY-MM-DD' }, ...]
 *   당일 = 구간 1개(s===e) · 기간 = 구간 1개(s<e) · 차수 = 구간 N개
 */
var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeSchedule(input, scheduleType) {
  var raw = input;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch (e) { raw = []; }
  }
  if (!Array.isArray(raw)) return [];

  var ranges = [];
  for (var i = 0; i < raw.length; i++) {
    var item = raw[i];
    if (typeof item === 'string') {                 // 예전 형식: 문자열 날짜
      if (DATE_RE.test(item)) ranges.push({ s: item, e: item });
      continue;
    }
    if (!item || typeof item !== 'object') continue;
    var s = item.s || item.start || '';
    var e = item.e || item.end || s;
    if (!DATE_RE.test(s)) continue;
    var end = DATE_RE.test(e) ? e : s;
    ranges.push(end < s ? { s: end, e: s } : { s: s, e: end });
  }

  // 예전 "기간"은 [시작, 종료] 두 개의 단일 날짜였다 → 한 구간으로 합친다
  if (scheduleType === '기간' && ranges.length >= 2) {
    var all = [];
    ranges.forEach(function (r) { all.push(r.s, r.e); });
    all.sort();
    return [{ s: all[0], e: all[all.length - 1] }];
  }
  if (scheduleType === '당일' && ranges.length > 1) return [ranges[0]];
  return ranges;
}

/** 실제 교육 일수 합계 */
function countDays(ranges) {
  var acc = 0;
  (ranges || []).forEach(function (r) {
    var d = (Date.parse(r.e) - Date.parse(r.s)) / 86400000;
    acc += isFinite(d) ? Math.max(0, Math.round(d)) + 1 : 1;
  });
  return acc;
}

/** 행의 schedule_dates 를 배열로 바꿔준다 (여러 번 불러도 안전) */
function parseSchedule(row) {
  var raw = row.schedule_dates, parsed = raw;
  if (typeof raw === 'string') {
    try { parsed = JSON.parse(raw || '[]'); } catch (e) { parsed = []; }
  }
  row.schedule_dates = normalizeSchedule(parsed, row.schedule_type);
  return row;
}

/**
 * 행의 일정을 구간 배열로 돌려준다 — 한 번 푼 결과를 그 행에 붙여 둔다.
 *
 * 월별 집계는 12개월 × 과정수 만큼 일정을 들여다보기 때문에,
 * 매번 JSON 을 다시 푸는 것이 아깝다. Db 가 행을 실행당 한 번만 읽어오므로
 * 여기 붙여 둔 값도 요청이 끝나면 함께 사라진다(오래된 값이 남을 일이 없다).
 */
function schedOf(row) {
  if (!row.__sched) {
    row.__sched = normalizeSchedule(row.schedule_dates, row.schedule_type);
  }
  return row.__sched;
}

/**
 * 일정 구간 중 하나라도 [start, end] 와 겹치는지.
 * PC 버전은 SQL(json_each)로 했지만 여기서는 자바스크립트로 판정한다.
 */
function overlapsPeriod(row, startDate, endDate) {
  if (!startDate && !endDate) return true;
  var rs = schedOf(row);
  for (var i = 0; i < rs.length; i++) {
    if (startDate && !(rs[i].e >= startDate)) continue;
    if (endDate && !(rs[i].s <= endDate)) continue;
    return true;
  }
  return false;
}

/** 과정이 걸쳐 있는 달들 (YYYY-MM) */
function monthsOf(row) {
  var out = {};
  schedOf(row).forEach(function (r) {
    if (r && r.s) out[r.s.slice(0, 7)] = true;
  });
  return Object.keys(out);
}

/** 과정의 대표 월 — 첫 구간 기준 */
function firstMonthOf(row) {
  var rs = schedOf(row);
  return rs.length && rs[0].s ? rs[0].s.slice(0, 7) : '';
}


/* ═════ Auth.gs ═════ */
/**
 * 로그인 · 권한 · 개인정보 가리기
 *
 * 아이디 + 비밀번호로 들어옵니다.
 *
 * 비밀번호를 시트에 그대로 적어 두지 않습니다.
 *   사람마다 다른 소금(salt)을 붙여 해시로 바꿔 저장하고,
 *   로그인할 때 같은 방식으로 바꿔서 맞춰봅니다.
 *   그래서 시트를 들여다봐도 비밀번호 자체는 알 수 없습니다.
 *
 * 로그인에 성공하면 「출입증(token)」을 하나 발급합니다.
 *   그 안에 누구인지와 언제까지 쓸 수 있는지가 적혀 있고,
 *   서버만 아는 열쇠로 봉인해서 고쳐 쓸 수 없게 합니다.
 *   (PC 버전의 JWT 와 같은 방식입니다)
 */

/** 출입증 유효 시간 — 8시간 (PC 버전과 같습니다) */
var TOKEN_HOURS = 8;

/** 해시를 몇 번 돌릴지 — 시트가 새더라도 비밀번호를 바로 알아내지 못하게 */
var HASH_ROUNDS = 1000;

/* ───────────────── 비밀번호 ───────────────── */

/** 바이트 배열을 16진수 글자로 */
function toHex_(bytes) {
  var s = '';
  for (var i = 0; i < bytes.length; i++) {
    var b = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
    s += (b < 16 ? '0' : '') + b.toString(16);
  }
  return s;
}

function sha256_(str) {
  return toHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8));
}

/** 소금을 붙여 여러 번 돌린 해시 */
function hashPassword(password, salt) {
  var h = sha256_(salt + '|' + String(password));
  for (var i = 0; i < HASH_ROUNDS; i++) h = sha256_(h + salt);
  return h;
}

/** 새 소금 */
function newSalt() {
  return Utilities.getUuid().replace(/-/g, '');
}

/**
 * 두 글자가 같은지 — 길이와 무관하게 같은 시간이 걸리게 비교한다.
 * (앞쪽부터 몇 글자가 맞았는지를 응답 시간으로 알아내는 수법을 막는다)
 */
function safeEqual_(a, b) {
  var x = String(a || ''), y = String(b || '');
  var diff = x.length ^ y.length;
  var n = Math.max(x.length, y.length);
  for (var i = 0; i < n; i++) {
    diff |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/* ───────────────── 출입증 ───────────────── */

/** 출입증을 봉인하는 열쇠 — 없으면 만든다 */
function tokenSecret_() {
  var props = PropertiesService.getScriptProperties();
  var s = props.getProperty('TOKEN_SECRET');
  if (!s) {
    s = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('TOKEN_SECRET', s);
  }
  return s;
}

function b64_(s) {
  return Utilities.base64EncodeWebSafe(s).replace(/=+$/, '');
}

function sign_(payload) {
  return toHex_(Utilities.computeHmacSha256Signature(payload, tokenSecret_()));
}

/** 출입증을 만든다 */
function makeToken(user) {
  var body = JSON.stringify({
    u: user.id,
    n: user.username,
    e: Date.now() + TOKEN_HOURS * 3600 * 1000
  });
  var p = b64_(body);
  return p + '.' + sign_(p);
}

/**
 * 출입증을 풀어본다. 봉인이 깨졌거나 시간이 지났으면 null.
 */
function readToken(token) {
  var t = String(token || '');
  var dot = t.lastIndexOf('.');
  if (dot < 1) return null;

  var p = t.slice(0, dot), sig = t.slice(dot + 1);
  if (!safeEqual_(sig, sign_(p))) return null;      // 고쳐 쓴 출입증

  var body;
  try {
    body = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(p)).getDataAsString());
  } catch (e) { return null; }

  if (!body || !body.e || Date.now() > body.e) return null;   // 시간이 지났다
  return body;
}

/* ───────────────── 로그인 ───────────────── */

/** 같은 아이디로 비밀번호를 계속 틀리면 잠시 막는다 */
var LOGIN_MAX_TRY = 10;
var LOGIN_BLOCK_SEC = 600;      // 10분

function loginKey_(username) {
  return 'try:' + sha256_(String(username || '').toLowerCase()).slice(0, 24);
}

function loginTries_(username) {
  var v = CacheService.getScriptCache().get(loginKey_(username));
  return v ? Number(v) : 0;
}

function loginFailed_(username) {
  var k = loginKey_(username);
  var c = CacheService.getScriptCache();
  c.put(k, String(loginTries_(username) + 1), LOGIN_BLOCK_SEC);
}

function loginCleared_(username) {
  CacheService.getScriptCache().remove(loginKey_(username));
}

/** 아이디로 사용자를 찾는다 (대소문자 무시) */
function findUser_(username) {
  var id = String(username || '').trim().toLowerCase();
  if (!id) return null;
  return Db.first('users', function (u) {
    return String(u.username || '').trim().toLowerCase() === id;
  });
}

/**
 * 로그인.
 * 아이디가 없는 경우와 비밀번호가 틀린 경우에 같은 말을 돌려준다
 * (어느 아이디가 있는지 알려주지 않기 위해).
 *
 * @param site 어느 주소로 들어왔는지 ('admin' 또는 'staff')
 *   관리자 사이트에는 관리자 계정만 들어온다. (대표님 지시 2026-10-26)
 *   직원은 직원 사이트에서만 로그인한다 — 화면에서 가리는 것으로는
 *   「내가 관리자 주소에 들어와 있다」는 오해가 남기 때문이다.
 */
function doLogin(username, password, site) {
  var WRONG = '아이디 또는 비밀번호가 올바르지 않습니다.';

  if (!username || !password) throw new Error('아이디와 비밀번호를 입력해주세요.');

  if (loginTries_(username) >= LOGIN_MAX_TRY) {
    throw new Error('비밀번호를 여러 번 틀렸습니다. 10분 뒤에 다시 시도해주세요.');
  }

  var u = findUser_(username);
  if (!u || !u.is_active || !u.password_hash || !u.salt) {
    loginFailed_(username);
    throw new Error(WRONG);
  }

  if (!safeEqual_(hashPassword(password, u.salt), u.password_hash)) {
    loginFailed_(username);
    throw new Error(WRONG);
  }

  var role = u.role || 'user';

  /*
   * 관리자 주소인데 관리자 계정이 아니면 들이지 않는다.
   * 비밀번호는 맞았으므로 「틀렸다」고 하지 않고 어디로 가야 하는지 알려준다.
   */
  if (String(site || '') === 'admin' && role !== 'admin') {
    loginCleared_(username);
    throw new Error('이 계정은 직원 계정입니다. 직원 사이트에서 로그인해주세요.');
  }

  loginCleared_(username);
  Db.update('users', u.id, { last_login: now() });

  var user = { id: u.id, username: u.username, name: u.name || u.username, role: role };
  return { token: makeToken(user), user: user };
}

/**
 * 출입증을 보고 지금 요청한 사람이 누구인지 알아낸다.
 * 모든 요청이 이 문을 지난다.
 */
function userFromToken(token) {
  var body = readToken(token);
  if (!body) throw new Error('로그인이 필요합니다.');

  var u = Db.get('users', body.u);
  if (!u || !u.is_active) throw new Error('사용이 중지된 계정입니다. 관리자에게 문의해주세요.');

  return { id: u.id, username: u.username, name: u.name || u.username, role: u.role || 'user' };
}

/** 비밀번호 바꾸기 — 본인 또는 관리자 */
function changePassword(me, targetId, oldPassword, newPassword) {
  var id = Number(targetId || me.id);
  var u = Db.get('users', id);
  if (!u) throw new Error('사용자를 찾을 수 없습니다.');

  var mine = id === me.id;
  if (!mine && !isAdmin(me)) throw new Error('본인 또는 관리자만 바꿀 수 있습니다.');

  // 본인이 바꿀 때는 지금 비밀번호를 확인한다
  if (mine && !safeEqual_(hashPassword(oldPassword, u.salt), u.password_hash)) {
    throw new Error('지금 쓰는 비밀번호가 올바르지 않습니다.');
  }

  var np = String(newPassword || '');
  if (np.length < 4) throw new Error('비밀번호는 4자 이상으로 해주세요.');

  var salt = newSalt();
  Db.update('users', id, { salt: salt, password_hash: hashPassword(np, salt) });
  return { message: '비밀번호를 바꿨습니다.' };
}

/* ───────────────── 권한 ───────────────── */

function isAdmin(u) { return !!(u && u.role === 'admin'); }

function requireAdmin(u) {
  if (!isAdmin(u)) throw new Error('관리자만 할 수 있는 작업입니다.');
  return u;
}

/* ───────────────── 권한 정책 ─────────────────
 * 누가 무엇을 할 수 있는지를 여기 한 곳에 모읍니다.
 * 나중에 바꾸고 싶으면 아래 함수만 고치면 됩니다.
 *
 * 대표님 결정 (2026-10-10): 직원도 과정 전체를 보고 고칠 수 있다.
 *
 *   직원이 하는 것    과정 조회 · 등록 · 수정 (남이 등록한 것도)
 *                    경비 등록, 자기가 등록한 경비 수정·삭제
 *   관리자만 하는 것  과정 삭제 · 강사/협력사/법인카드/직원 명단 등록·수정
 *                    세금계산서 입금일 체크 · 정산자료 받기 · 개인정보 원본 보기
 */

/** 남이 등록한 과정도 볼 수 있는지 */
function canSeeOthers(u) { return true; }

/** 남이 등록한 과정도 고칠 수 있는지 */
function canEditOthers(u) { return true; }

/**
 * 남이 등록한 회사경비도 고치거나 지울 수 있는지.
 * 경비는 지출 증빙이라 등록한 사람과 관리자만 손대게 둡니다.
 */
function canEditOverhead(u, row) {
  return isAdmin(u) || row.created_by === u.id;
}

/* ───────────────── 개인정보 가리기 ─────────────────
 * 관리자가 아닌 사람에게는 원본을 아예 보내지 않습니다.
 * (가린 값만 건네므로, 화면을 열어두고 자리를 비워도 원본이 새지 않습니다)
 */

/** kim@test.co.kr → ki***@test.co.kr */
function maskEmail(v) {
  var s = String(v == null ? '' : v).trim();
  if (!s) return '';
  var at = s.lastIndexOf('@');
  if (at < 1) return maskText(s);
  var id = s.slice(0, at), domain = s.slice(at);
  var keep = id.length <= 2 ? 1 : 2;
  return id.slice(0, keep) + rep('*', Math.max(3, id.length - keep)) + domain;
}

/** 010-1234-5678 → 010-****-5678 */
function maskPhone(v) {
  var s = String(v == null ? '' : v).trim();
  if (!s) return '';
  var d = s.replace(/[^0-9]/g, '');
  if (d.length < 7) return maskText(s);
  return d.slice(0, 3) + '-****-' + d.slice(-4);
}

/** 그 밖의 글자 — 앞 한 글자만 남긴다 */
function maskText(v) {
  var s = String(v == null ? '' : v).trim();
  if (!s) return '';
  if (s.length === 1) return '*';
  return s.slice(0, 1) + rep('*', s.length - 1);
}

/** 계산서 받는 사람 — 이름은 누구에게 보내는지 알아야 하므로 남긴다 */
function maskRecipients(list) {
  return (Array.isArray(list) ? list : []).map(function (r) {
    return {
      name: (r && r.name) || '',
      email: maskEmail(r && r.email),
      phone: maskPhone(r && r.phone),
      masked: true
    };
  });
}

function rep(c, n) { var s = ''; for (var i = 0; i < n; i++) s += c; return s; }

/* ───────────────── 사람 이름 ─────────────────
 *
 * 교육진행처럼 「누가 갔는지」를 보여줄 때 쓴다.
 *
 * 계정에 적힌 이름이 사람 이름이 아닌 경우가 있다 (huc 가 「혜움컨설팅」).
 * 시트를 고치지 않고도 바르게 보이도록, 아이디로 한 번 바로잡는다.
 * (대표님 알려주심 2026-10-26)
 */
var PERSON_NAME = {
  huc: '임영환',
  sakim: '김소애',
  shchoi: '최선화'
};

/** 아이디의 앞부분 (huc@hyeumcst.co.kr → huc) */
function userKey_(username) {
  return String(username || '').split('@')[0].trim().toLowerCase();
}

/** 지금 로그인한 사람의 이름 */
function personName(u) {
  if (!u) return '';
  return PERSON_NAME[userKey_(u.username)] || u.name || userKey_(u.username);
}

/** 적어 둔 아이디로 이름을 찾는다 (없으면 예전에 적어 둔 이름을 쓴다) */
function personNameOf(username, fallback) {
  var k = userKey_(username);
  return PERSON_NAME[k] || fallback || username || '';
}


/* ═════ fb-auth.js ═════ */
/*
 * 로그인에 관한 것만 파이어베이스 것으로 바꿔 끼운다.
 * ════════════════════════════════════════════════════════════
 *
 * ⚠ 이 파일은 Auth.gs 를 실은 **뒤에** 실어야 한다.
 *   Auth.gs 가 만들어 둔 함수를 여기서 덮어쓰기 때문이다.
 *
 * 덮어쓰지 않는 것 — 권한 정책은 Auth.gs 그대로 쓴다
 *   isAdmin · requireAdmin · canSeeOthers · canEditOthers · canEditOverhead
 *   maskEmail · maskPhone · maskRecipients · userKey_ · personName · personNameOf
 *
 *   이것들을 여기 베껴 적으면 나중에 한쪽만 고쳐져 조용히 어긋난다.
 *   「직원도 남이 등록한 과정을 볼 수 있다」 같은 결정이 두 곳에 있으면 안 된다.
 *
 * 덮어쓰는 것 — 비밀번호를 다루던 것들
 *   파이어베이스가 비밀번호를 받아 자기가 지킨다. 해시도 소금도 표도
 *   이제 우리 쪽에 없다. 그 길로 들어오면 크게 터뜨려서,
 *   아직 안 옮긴 곳이 있으면 바로 알 수 있게 한다.
 */

/** 지금 들어와 있는 사람 (fb-runtime.js 가 들고 있다) */
function userFromToken() {
  const u = fbUser();
  if (!u) throw new Error('로그인이 필요합니다.');
  return u;
}

/* 비밀번호는 파이어베이스가 지킨다 — 여기로 오면 안 된다 */
function hashPassword() { throw new Error('비밀번호는 파이어베이스가 지킵니다.'); }
function newSalt() { throw new Error('비밀번호는 파이어베이스가 지킵니다.'); }
function makeToken() { throw new Error('로그인 표는 파이어베이스가 만듭니다.'); }
function readToken() { throw new Error('로그인 표는 파이어베이스가 만듭니다.'); }

function doLogin() {
  throw new Error('로그인은 파이어베이스로 합니다.');
}

/**
 * 비밀번호 바꾸기 — 파이어베이스에서 한다.
 * 화면(app.js)이 이 길을 부르므로, 여기서 돌려보내지 말고
 * api.js 가 파이어베이스 쪽으로 돌린다. 여기 닿으면 잘못 온 것이다.
 */
function changePassword() {
  throw new Error('비밀번호 바꾸기는 파이어베이스로 합니다.');
}

/**
 * 사람 목록 — 비밀번호 칸이 애초에 없다.
 * Firestore 의 users 표에는 아이디·이름·권한만 있다.
 */
function findUser_(username) {
  const k = String(username || '').trim().toLowerCase();
  return Db.first('users', function (x) {
    return String(x.username || '').trim().toLowerCase() === k;
  });
}


/* ═════ Checks.gs ═════ */
/**
 * 「확인함」 표시.
 *
 * 대시보드에 「매입이 하나도 없는 과정이 3건 있습니다」 같은 경고가 뜬다.
 * 눌러서 들여다보고 「지급 누락이 아니다」라고 판단해도, 지금까지는
 * 그 판단을 적어 둘 곳이 없어서 다음에 또 같은 경고가 떴다.
 *
 * 그래서 한 건씩 「확인함」을 눌러 둘 수 있게 한다.
 *   · 한 건씩 누른다 — 어떤 건은 확인되고 어떤 건은 안 될 수 있으므로
 *     전체를 한 번에 끄는 길은 두지 않는다 (대표님 지시 2026-10-26)
 *   · 확인한 건은 경고 숫자에서 빠진다
 *   · 되돌릴 수 있다 — 잘못 눌렀을 때 손쓸 방법이 없으면 안 된다
 *
 * 관리자만 쓸 수 있다. 직원에게는 경고 자체가 안 보인다.
 */

/** 지금 쓰는 경고 종류 */
var CHECK_KINDS = ['missing_expense'];

function checkKind_(kind) {
  var k = String(kind || '').trim();
  if (CHECK_KINDS.indexOf(k) < 0) throw new Error('알 수 없는 확인 종류입니다. (' + k + ')');
  return k;
}

/**
 * 확인해 둔 것들 — { 과정번호: 확인기록 }
 *
 * 경고를 셀 때마다 쓰이므로 한 번 읽어 표로 만들어 둔다.
 */
function checkedMap_(kind) {
  var k = checkKind_(kind);
  var m = {};
  Db.where('alert_checks', function (r) { return r.kind === k; })
    .forEach(function (r) { m[r.ref_id] = r; });
  return m;
}

/** 이 건을 확인해 뒀는가 */
function isChecked_(kind, refId) {
  return !!checkedMap_(kind)[Number(refId)];
}

/**
 * 한 건을 확인함으로 표시하거나 되돌린다.
 *
 * @param on true 면 확인함, false 면 되돌리기
 * @return { checked, checked_by, checked_at }
 */
function checkSet(u, kind, refId, on) {
  requireAdmin(u);
  var k = checkKind_(kind);
  var id = Number(refId);
  if (!id) throw new Error('어느 것인지 알 수 없습니다.');

  // 가리키는 것이 실제로 있는지 본다 (지워진 과정에 표시가 남지 않도록)
  if (k === 'missing_expense' && !Db.get('projects', id)) {
    throw new Error('과정 ' + id + ' 을(를) 찾지 못했습니다.');
  }

  var had = Db.first('alert_checks', function (r) {
    return r.kind === k && r.ref_id === id;
  });

  if (!on) {
    if (had) Db.remove('alert_checks', had.id);
    return { checked: false, checked_by: null, checked_at: null };
  }

  // 이미 눌러 둔 것을 또 누르면 그대로 둔다 (두 번 쌓이지 않게)
  if (had) {
    return { checked: true, checked_by: had.checked_by, checked_at: had.checked_at };
  }

  var row = Db.insert('alert_checks', {
    kind: k, ref_id: id,
    checked_by: u.name || u.username || '',
    checked_at: nowText_()
  });
  return { checked: true, checked_by: row.checked_by, checked_at: row.checked_at };
}

/**
 * 과정 한 건의 매입 누락 경고를 확인함으로 / 되돌리기.
 *   PUT /projects/<번호>/expense-check   { checked: true | false }
 */
function projectExpenseCheck(u, id, body) {
  var v = body ? body.checked : true;
  var on = !(v === false || v === 'false' || v === 0 || v === '0');
  return checkSet(u, 'missing_expense', id, on);
}

/** 지금 시각 — 시트에 적을 글자로 */
function nowText_() {
  return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
}

/**
 * 확인해 둔 과정이 지워졌으면 그 표시도 치운다.
 * 과정을 지울 때 불린다 — 찌꺼기가 쌓이면 나중에 번호가 겹쳐 엉뚱한 것이 가려진다.
 */
function checkDropFor_(kind, refId) {
  var k = checkKind_(kind);
  var id = Number(refId);
  Db.where('alert_checks', function (r) { return r.kind === k && r.ref_id === id; })
    .forEach(function (r) { Db.remove('alert_checks', r.id); });
}


/* ═════ Mail.gs ═════ */
/**
 * 알림 메일.
 *
 * 왜 메일인가
 *   카톡 알림톡·문자는 업체 계약과 템플릿 사전심사가 필요하고 건당 돈이 든다.
 *   메일은 이미 가진 구글 계정으로 보내므로 더 내는 돈이 없다.
 *   사이트 안에만 띄우면 로그인해야 보여서 「지금 알려주는 것」이 못 된다.
 *   (대표님과 의논 2026-10-26)
 *
 * ⚠ 메일을 보내려면 appsscript.json 에 script.send_mail 권한이 있어야 하고,
 *   권한이 바뀌면 편집기에서 한 번 [허용] 을 눌러 주셔야 한다.
 */

/** 세금계산서 발행 담당 — 여기로 요청이 간다 (대표님 지정 2026-10-26) */
var INVOICE_REQUEST_TO = ['sakim', 'huc'];

/** 회사 메일 주소의 뒷부분 */
var MAIL_DOMAIN = '@hyeumcst.co.kr';

/**
 * 아이디를 메일 주소로.
 * 계정 표에 있으면 그 주소를, 없으면 회사 주소를 붙여 만든다.
 */
function mailOf_(key) {
  var k = userKey_(key);
  if (!k) return '';
  var u = Db.first('users', function (x) { return x.is_active && userKey_(x.username) === k; });
  if (u && String(u.username || '').indexOf('@') > 0) return u.username;
  return k + MAIL_DOMAIN;
}

/** 담당자들의 메일 주소 */
function invoiceRequestTo_() {
  var seen = {}, out = [];
  INVOICE_REQUEST_TO.forEach(function (k) {
    var m = mailOf_(k);
    if (m && !seen[m]) { seen[m] = true; out.push(m); }
  });
  return out;
}

/** 돈을 보기 좋게 */
function won_(v) {
  return Number(v || 0).toLocaleString('ko-KR') + '원';
}

/**
 * 품목 한 줄의 공급가액·세액.
 *
 * 화면의 invItemCalc 와 같은 셈이다. 자동계산 줄은 계산 결과를 굳이
 * 적어 두지 않으므로(화면에서만 보여준다) 여기서 다시 내야 한다.
 * 그러지 않으면 메일에 0 원으로 나간다.
 */
function invItemAmount_(r, vatMode) {
  var q = parseFloat(r.qty) || 0;
  var p = money_(r.price);
  var free = (vatMode === '면세');
  var incl = (!free && !!r.vat_incl);          // 단가에 부가세가 들어 있는가
  var auto = (!r.is_manual && q && p);         // 단가 × 수량으로 내는 줄인가

  var supply = money_(r.supply);
  if (auto) {
    var raw = Math.round(q * p);
    supply = incl ? Math.round(raw / 1.1) : raw;
  }

  var vat;
  if (free) vat = 0;
  else if (r.vat_manual) vat = money_(r.vat);
  else if (auto && incl) vat = Math.round(q * p) - supply;
  else vat = Math.round(supply / 10);

  return { supply: supply, vat: vat, total: supply + vat };
}

/**
 * 메일에 넣을 항목 내역.
 * 항목을 나눠 적었으면 그대로 보여준다 — 전에는 전체 금액만 보내서
 * 받는 분이 무엇을 어떻게 끊어야 할지 알 수 없었다.
 * (대표님 알려주심 2026-10-27)
 */
function invoiceItemLines_(inv) {
  var mode = normalizeMode(inv.vat_mode);
  var rows = unwrap_(inv.items, []).filter(function (r) {
    return r && (String(r.name || '').trim() || money_(r.supply) || money_(r.price));
  });
  if (!rows.length) return null;

  var L = ['항목 ' + rows.length + '개'];
  var sum = { supply: 0, vat: 0 };

  rows.forEach(function (r, i) {
    var c = invItemAmount_(r, mode);
    sum.supply += c.supply;
    sum.vat += c.vat;

    var q = parseFloat(r.qty) || 0;
    var p = money_(r.price);
    var how = (q && p)
      ? '  ' + q + ' × ' + won_(p) + (r.vat_incl ? '(부가세 포함)' : '')
      : '';

    L.push('  ' + (i + 1) + '. ' + (String(r.name || '').trim() || '(이름 없음)') + how);
    L.push('     공급가액 ' + won_(c.supply) + ' · 세액 ' + won_(c.vat) + ' · 합계 ' + won_(c.total)
      + (String(r.note || '').trim() ? '   — ' + String(r.note).trim() : ''));
  });

  /* 항목 합계가 계산서 금액과 다르면 알려준다 (끊을 때 헷갈리지 않게) */
  var gap = money_(inv.supply_amount) - sum.supply;
  if (gap !== 0) {
    L.push('');
    L.push('  ⚠ 항목 합계(공급가액 ' + won_(sum.supply) + ')가 계산서 금액과 '
      + won_(Math.abs(gap)) + ' ' + (gap > 0 ? '모자랍니다' : '많습니다') + '.');
  }
  return L;
}

/* ───────────── 표로 보내기 ─────────────
 *
 * 글자만 보내니 항목을 알아보기 힘들다고 하셨다 (2026-10-27).
 * 그래서 메일을 HTML 로도 함께 보낸다 — 화면에서 보시는 표와 같은 모양.
 *
 * 글자판(body)도 같이 보낸다. HTML 을 안 보여주는 메일앱도 있고,
 * 그럴 때 아무것도 안 보이면 안 되기 때문이다.
 *
 * 꾸밈은 전부 태그 안에 적는다(inline). 메일앱은 <style> 을 지우는 일이 많다.
 */

/** HTML 에 그대로 넣어도 되게 다듬는다 */
function htmlEsc_(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

var MAIL_CSS = {
  wrap: 'font-family:-apple-system,BlinkMacSystemFont,"Malgun Gothic","맑은 고딕",sans-serif;'
    + 'font-size:14px;color:#1f2937;line-height:1.6;max-width:720px',
  h: 'font-size:16px;font-weight:700;margin:0 0 14px',
  dl: 'border-collapse:collapse;margin:0 0 18px',
  dt: 'padding:3px 14px 3px 0;color:#6b7280;white-space:nowrap;vertical-align:top',
  dd: 'padding:3px 0;font-weight:600',
  tb: 'border-collapse:collapse;width:100%;margin:0 0 18px;font-size:13px',
  th: 'background:#f3f4f6;border:1px solid #e5e7eb;padding:7px 9px;'
    + 'font-weight:700;color:#374151;text-align:left',
  thn: 'background:#f3f4f6;border:1px solid #e5e7eb;padding:7px 9px;'
    + 'font-weight:700;color:#374151;text-align:right',
  td: 'border:1px solid #e5e7eb;padding:7px 9px',
  tdn: 'border:1px solid #e5e7eb;padding:7px 9px;text-align:right;'
    + 'font-variant-numeric:tabular-nums',
  tdt: 'border:1px solid #e5e7eb;padding:7px 9px;text-align:right;'
    + 'font-weight:700;color:#5b21b6;font-variant-numeric:tabular-nums',
  sum: 'background:#faf5ff;border:1px solid #e5e7eb;padding:8px 9px;'
    + 'text-align:right;font-weight:700;font-variant-numeric:tabular-nums',
  warn: 'background:#fef3c7;border:1px solid #fde68a;border-radius:6px;'
    + 'padding:9px 12px;margin:0 0 18px;color:#92400e;font-size:13px',
  foot: 'color:#9ca3af;font-size:12px;margin:20px 0 0;'
    + 'border-top:1px solid #e5e7eb;padding-top:12px'
};

/** 숫자 한 칸 */
function tdNum_(v, strong) {
  return '<td style="' + (strong ? MAIL_CSS.tdt : MAIL_CSS.tdn) + '">'
    + (v || v === 0 ? Number(v).toLocaleString('ko-KR') : '') + '</td>';
}

/**
 * 항목(품목) 표.
 * 화면에서 보시는 것과 같은 칸 순서로 둔다.
 */
function invoiceItemTable_(inv) {
  var mode = normalizeMode(inv.vat_mode);
  var rows = unwrap_(inv.items, []).filter(function (r) {
    return r && (String(r.name || '').trim() || money_(r.supply) || money_(r.price));
  });
  if (!rows.length) return '';

  // 줄마다 기준이 같으면 머리글에 적어 둔다 (화면과 같게)
  var allIncl = rows.every(function (r) { return !!r.vat_incl; });
  var allExcl = rows.every(function (r) { return !r.vat_incl; });
  var priceHead = '단가' + (allIncl ? ' (포함)' : (allExcl ? ' (별도)' : ''));

  var sum = { supply: 0, vat: 0, total: 0 };
  var body = rows.map(function (r) {
    var c = invItemAmount_(r, mode);
    sum.supply += c.supply; sum.vat += c.vat; sum.total += c.total;
    var q = parseFloat(r.qty) || 0;
    var p = money_(r.price);
    return '<tr>'
      + '<td style="' + MAIL_CSS.td + '">' + htmlEsc_(String(r.name || '').trim() || '(이름 없음)')
      +   (!allIncl && !allExcl && r.vat_incl ? ' <span style="color:#6b7280">(포함)</span>' : '')
      + '</td>'
      + tdNum_(q || '')
      + tdNum_(p || '')
      + tdNum_(c.supply)
      + tdNum_(c.vat)
      + tdNum_(c.total, true)
      + '<td style="' + MAIL_CSS.td + '">' + htmlEsc_(String(r.note || '').trim()) + '</td>'
      + '</tr>';
  }).join('');

  var head = '<tr>'
    + '<th style="' + MAIL_CSS.th + '">항목</th>'
    + '<th style="' + MAIL_CSS.thn + '">수량</th>'
    + '<th style="' + MAIL_CSS.thn + '">' + priceHead + '</th>'
    + '<th style="' + MAIL_CSS.thn + '">공급가액</th>'
    + '<th style="' + MAIL_CSS.thn + '">세액</th>'
    + '<th style="' + MAIL_CSS.thn + '">합계</th>'
    + '<th style="' + MAIL_CSS.th + '">비고</th>'
    + '</tr>';

  var foot = '<tr>'
    + '<td style="' + MAIL_CSS.sum + '" colspan="3">항목 합계</td>'
    + '<td style="' + MAIL_CSS.sum + '">' + sum.supply.toLocaleString('ko-KR') + '</td>'
    + '<td style="' + MAIL_CSS.sum + '">' + sum.vat.toLocaleString('ko-KR') + '</td>'
    + '<td style="' + MAIL_CSS.sum + '">' + sum.total.toLocaleString('ko-KR') + '</td>'
    + '<td style="' + MAIL_CSS.sum + '"></td>'
    + '</tr>';

  var out = '<table style="' + MAIL_CSS.tb + '">' + head + body + foot + '</table>';

  var gap = money_(inv.supply_amount) - sum.supply;
  if (gap !== 0) {
    out += '<div style="' + MAIL_CSS.warn + '">⚠ 항목 합계가 계산서 금액과 '
      + Math.abs(gap).toLocaleString('ko-KR') + '원 '
      + (gap > 0 ? '모자랍니다' : '많습니다') + '. 끊으실 때 확인해주세요.</div>';
  }
  return out;
}

/**
 * 세금계산서 발행을 요청한다.
 *   POST /invoices/<번호>/request   { note }
 *
 * 관리자·직원 모두 보낼 수 있다 — 계산서를 적은 사람이 바로 요청해야
 * 중간에 빠지지 않기 때문이다.
 */
function invoiceRequestSend(u, invoiceId, b) {
  var id = Number(invoiceId);
  var inv = Db.get('project_invoices', id);
  if (!inv) throw new Error('계산서를 찾을 수 없습니다.');

  var p = Db.get('projects', inv.project_id);
  if (!p) throw new Error('과정을 찾을 수 없습니다.');

  var to = invoiceRequestTo_();
  if (!to.length) throw new Error('받을 담당자를 찾지 못했습니다.');

  var client = p.client_id ? (Db.get('clients', p.client_id) || {}).name : '';
  var who = personName(u);
  var when = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
  var note = String((b && b.note) || '').trim().slice(0, 500);

  var recv = unwrap_(inv.recipients, []);
  var recvText = recv.length
    ? recv.map(function (r) {
        return (r.name || '') + (r.email ? ' <' + r.email + '>' : '');
      }).join(', ')
    : '(적지 않음)';

  var course = String(p.course_name || '').trim();

  var subject = '[발행요청] ' + (client || '고객사 미정') + ' · ' + course
    + ' — ' + won_(inv.total_amount);

  /*
   * 메일은 한 줄에 하나씩, 짧게.
   * 라벨과 값을 줄을 나눠 적었더니 너무 길어져 한눈에 안 들어왔다.
   */
  var L = [];
  var add = function (k, v) { L.push(k + ': ' + v); };

  L.push('세금계산서 발행을 요청합니다.');
  L.push('');
  add('고객사', client || '(없음)');
  add('과정명', course || '(없음)');
  add('발행회사', inv.company || p.company || '');

  // 항목을 나눠 적었으면 그대로 보여준다
  var itemLines = invoiceItemLines_(inv);
  if (itemLines) {
    L.push('');
    itemLines.forEach(function (x) { L.push(x); });
  }

  L.push('');
  add('공급가액', won_(inv.supply_amount));
  add('부가세', won_(inv.vat));
  add('합계', won_(inv.total_amount));
  add('청구/영수', inv.pay_type || '청구');
  add('발행일', inv.issue_date || '(아직 없음)');
  add('받는 사람', recvText);
  if (note) { L.push(''); add('남긴 말', note); }
  L.push('');
  add('요청한 사람', who + ' · ' + when);
  L.push('');
  L.push('자세히 보기  https://hyeumcst.github.io/go/admin/');
  L.push('');
  L.push('— 혜움컨설팅 매출/매입 관리에서 자동으로 보낸 메일입니다.');

  var body = L.join('\n') + '\n';

  /* 같은 내용을 표로도 만든다 */
  var dl = function (k, v) {
    return '<tr><td style="' + MAIL_CSS.dt + '">' + htmlEsc_(k) + '</td>'
      + '<td style="' + MAIL_CSS.dd + '">' + htmlEsc_(v) + '</td></tr>';
  };
  var html = '<div style="' + MAIL_CSS.wrap + '">'
    + '<p style="' + MAIL_CSS.h + '">세금계산서 발행을 요청합니다.</p>'
    + '<table style="' + MAIL_CSS.dl + '">'
    +   dl('고객사', client || '(없음)')
    +   dl('과정명', course || '(없음)')
    +   dl('발행회사', inv.company || p.company || '')
    + '</table>'
    + invoiceItemTable_(inv)
    + '<table style="' + MAIL_CSS.dl + '">'
    +   dl('공급가액', won_(inv.supply_amount))
    +   dl('부가세', won_(inv.vat))
    +   dl('합계', won_(inv.total_amount))
    +   dl('청구/영수', inv.pay_type || '청구')
    +   dl('발행일', inv.issue_date || '(아직 없음)')
    +   dl('받는 사람', recvText)
    +   (note ? dl('남긴 말', note) : '')
    +   dl('요청한 사람', who + ' · ' + when)
    + '</table>'
    + '<p style="margin:0"><a href="https://hyeumcst.github.io/go/admin/"'
    +   ' style="color:#2563eb">자세히 보기 →</a></p>'
    + '<p style="' + MAIL_CSS.foot + '">혜움컨설팅 매출/매입 관리에서 자동으로 보낸 메일입니다.</p>'
    + '</div>';

  MailApp.sendEmail({
    to: to.join(','), subject: subject,
    body: body,              // HTML 을 안 보여주는 메일앱을 위해 글자판도 함께
    htmlBody: html,
    name: '혜움컨설팅 매출/매입 관리'
  });

  var row = Db.insert('invoice_requests', {
    project_id: inv.project_id,
    seq: inv.seq || 1,
    sent_by: userKey_(u.username),
    sent_to: to.join(','),
    sent_at: when,
    note: note
  });

  return {
    message: '발행요청을 보냈습니다. (' + to.join(', ') + ')',
    invoice_id: id, sent_to: to, sent_at: row.sent_at, sent_by: who
  };
}

/** 기억할 때 쓰는 열쇠 — 과정번호와 몇 장째 */
function reqKey_(projectId, seq) {
  return Number(projectId) + ':' + Number(seq || 1);
}

/**
 * 계산서마다 「마지막으로 요청한 것」 — { "과정번호:장" : {…} }
 * 목록에서 「요청함 · 언제」를 보여주고, 두 번 보내기 전에 물어보려고 쓴다.
 */
function invoiceRequestMap_() {
  var m = {};
  Db.all('invoice_requests').forEach(function (r) {
    var k = reqKey_(r.project_id, r.seq);
    if (!m[k]) m[k] = { sent_at: '', sent_by: '', sent_key: '', count: 0, _id: 0 };
    m[k].count += 1;
    /*
     * 시각은 분까지만 적는다. 같은 분에 두 번 보내면 시각이 같아서
     * 「마지막에 보낸 사람」을 가릴 수 없다. 그래서 줄 번호로 한 번 더 가린다
     * (나중에 넣은 줄이 번호가 크다).
     */
    var newer = String(r.sent_at) > String(m[k].sent_at)
      || (String(r.sent_at) === String(m[k].sent_at) && r.id > m[k]._id);
    if (newer) {
      m[k].sent_at = r.sent_at;
      m[k].sent_by = personNameOf(r.sent_by, r.sent_by);
      m[k].sent_key = userKey_(r.sent_by);
      m[k]._id = r.id;
    }
  });
  return m;
}

/** 과정을 지우면 그 과정의 요청 기록도 치운다 */
function invoiceRequestDropFor_(projectId) {
  var id = Number(projectId);
  Db.where('invoice_requests', function (r) { return r.project_id === id; })
    .forEach(function (r) { Db.remove('invoice_requests', r.id); });
}

/**
 * 메일 권한이 열렸는지 확인한다. ← 편집기에서 이것을 실행하세요
 *
 * 메일을 보내지 않는다. 오늘 더 보낼 수 있는 통수만 물어본다.
 * 권한이 아직 없으면 이 줄에서 구글이 [권한 검토] 창을 띄운다.
 *
 * 실행 → 실행 로그에 「메일 권한이 열려 있습니다」가 보이면 끝.
 */
function 권한열기() {
  var left = MailApp.getRemainingDailyQuota();
  var to = invoiceRequestTo_();

  /*
   * 바깥에 물어볼 권한도 여기서 같이 받는다.
   *
   * 자료를 파이어베이스로 옮긴 뒤, 화면은 파이어베이스로 로그인한다.
   * 발행요청 메일은 여기 남으므로, 「이 사람이 진짜 맞나」를 구글에게
   * 물어봐야 한다 (FbAuth.gs). 그러려면 바깥에 물어볼 권한이 필요하다.
   *
   * 권한이 늘면 대표님이 한 번 허용해 주셔야 한다. 두 번 왔다 갔다 하지
   * 않도록 메일 권한과 함께 한 번에 받는다.
   */
  var net = '안 열림';
  try {
    var r = UrlFetchApp.fetch('https://www.googleapis.com/generate_204',
      { muteHttpExceptions: true });
    net = r.getResponseCode() === 204 ? '열림' : '열림 (' + r.getResponseCode() + ')';
  } catch (e) {
    net = '안 열림 — ' + e.message;
  }

  var msg = '권한을 확인했습니다.\n'
    + '  메일 보내기        : 열림 (오늘 ' + left + '통 더 보낼 수 있습니다)\n'
    + '  바깥에 물어보기     : ' + net + '\n'
    + '  발행요청 받을 사람  : ' + to.join(', ') + '\n\n'
    + '둘 다 「열림」이면 다 된 것입니다.';
  Logger.log(msg);
  return msg;
}


/* ═════ Visits.gs ═════ */
/**
 * 교육진행 — 현장에 다녀온 날.
 *
 * 과정에 적는 「교육일정」은 하기로 한 날이다. 실제로 현장에 나간 날은
 * 그것과 다를 수 있다 (하루 줄거나, 차수가 미뤄지거나).
 * 그래서 과정마다 「실제로 다녀온 날」을 따로 적어 둔다.
 *
 * 적는 모양은 교육일정과 똑같다 — 당일 · 기간 · 차수.
 * 화면도 같은 위젯을 그대로 쓴다 (대표님 지시 2026-10-26).
 *
 * 관리자·직원 모두 쓴다.
 */

/** 과정 하나의 교육진행 기록 (없으면 null) */
function visitOf_(projectId) {
  var id = Number(projectId);
  return Db.first('project_visits', function (r) { return r.project_id === id; });
}

/** 일정 한 줄이 며칠인지 — 시작·종료를 모두 센다 */
function visitDays_(rows) {
  var total = 0;
  (Array.isArray(rows) ? rows : []).forEach(function (r) {
    if (!r || !r.s) return;
    var s = new Date(r.s + 'T00:00:00');
    var e = new Date((r.e || r.s) + 'T00:00:00');
    if (isNaN(s) || isNaN(e)) return;
    var n = Math.round((e - s) / 86400000) + 1;
    total += (n > 0 ? n : 1);
  });
  return total;
}

/**
 * 교육진행 목록.
 * 과정을 모두 내려주고, 다녀온 기록이 있으면 함께 붙인다.
 * (아직 안 적은 과정도 보여야 어디를 적어야 할지 안다)
 */
function visitsList(u, q) {
  q = q || {};
  var cName = {};
  Db.all('clients').forEach(function (c) { cName[c.id] = c.name; });

  var byProj = {};
  Db.all('project_visits').forEach(function (v) { byProj[v.project_id] = v; });

  var onlyDone = (q.done === '1' || q.done === 1 || q.done === true);
  var kw = String(q.q || '').trim().toLowerCase();

  var rows = Db.all('projects').map(function (p) {
    var v = byProj[p.id] || null;
    var dates = v ? unwrap_(v.schedule_dates, []) : [];
    return {
      project_id: p.id,
      company: p.company,
      client_name: p.client_id ? (cName[p.client_id] || null) : null,
      course_name: p.course_name,
      manager: p.manager,
      // 하기로 한 날 (과정에 적힌 교육일정)
      plan_type: p.schedule_type || '당일',
      plan_dates: normalizeSchedule(p.schedule_dates, p.schedule_type),
      plan_days: visitDays_(normalizeSchedule(p.schedule_dates, p.schedule_type)),
      // 실제로 다녀온 날
      visit_type: v ? (v.schedule_type || '당일') : null,
      visit_dates: dates,
      visit_days: visitDays_(dates),
      note: v ? (v.note || '') : '',
      // 누가 다녀왔는지 — 예전 기록은 적어 둔 이름을 그대로 쓴다
      person: v ? personNameOf(v.visited_by, v.updated_by) : '',
      visited_by: v ? (v.visited_by || '') : '',
      updated_by: v ? (v.updated_by || '') : '',
      updated_at: v ? (v.updated_at || '') : ''
    };
  }).filter(function (r) {
    if (onlyDone && !r.visit_days) return false;
    if (kw) {
      var hay = [r.course_name, r.client_name, r.manager, r.note]
        .map(function (x) { return String(x || '').toLowerCase(); }).join(' ');
      if (hay.indexOf(kw) < 0) return false;
    }
    return true;
  });

  // 다녀온 과정을 위로, 그 안에서는 최근에 다녀온 순
  rows.sort(function (a, b) {
    if (!!b.visit_days !== !!a.visit_days) return b.visit_days - a.visit_days;
    var la = lastDate_(a.visit_dates) || lastDate_(a.plan_dates) || '';
    var lb = lastDate_(b.visit_dates) || lastDate_(b.plan_dates) || '';
    return cmp_(lb, la) || (b.project_id - a.project_id);
  });

  var done = rows.filter(function (r) { return r.visit_days > 0; });
  return {
    visits: rows,
    // 관리자가 다른 사람 이름으로 적을 수 있게 (화면에서 고를 목록)
    people: isAdmin(u) ? visitPeople_() : [],
    totals: {
      projects: rows.length,
      done: done.length,
      days: done.reduce(function (a, r) { return a + r.visit_days; }, 0),
      byPerson: byPerson_(done, function (r) { return r.visit_days; })
    }
  };
}

/**
 * 사람별로 묶는다 — 「임영환 2개 과정 · 5일」 처럼 보여주려고.
 * 많이 다닌 사람을 앞에 둔다.
 */
function byPerson_(rows, daysOf) {
  var m = {};
  rows.forEach(function (r) {
    var who = r.person || '(적지 않음)';
    if (!m[who]) m[who] = { name: who, projects: 0, days: 0 };
    m[who].projects += 1;
    m[who].days += daysOf(r);
  });
  return Object.keys(m).map(function (k) { return m[k]; })
    .sort(function (a, b) { return b.days - a.days || b.projects - a.projects; });
}

/**
 * 교육진행에 적을 수 있는 사람들.
 *
 * 관리자는 다른 사람 이름으로도 적을 수 있어야 한다 — 대신 적어 주거나,
 * 잘못 들어간 것을 고쳐야 할 때가 있기 때문이다. (대표님 지시 2026-10-26)
 *
 * 계정 표에서 가져오되 아이디와 이름만 내놓는다.
 * (비밀번호 해시 같은 것이 섞여 나가면 안 된다)
 *
 * 대표님이 알려주신 세 사람(PERSON_NAME)은 계정이 아직 없어도 넣는다.
 * 계정을 만들기 전에도 「누가 갔는지」는 적어 둘 수 있어야 하기 때문이다.
 */
function visitPeople_() {
  var seen = {}, out = [];

  Db.where('users', function (x) { return x.is_active; }).forEach(function (x) {
    var k = userKey_(x.username);
    if (!k || seen[k]) return;
    seen[k] = true;
    out.push({ key: k, name: personNameOf(x.username, x.name) });
  });

  Object.keys(PERSON_NAME).forEach(function (k) {
    if (seen[k]) return;
    seen[k] = true;
    out.push({ key: k, name: PERSON_NAME[k] });
  });

  return out.sort(function (a, b) { return cmp_(a.name, b.name); });
}

/** 교육진행에 적을 수 있는 사람인지 */
function knownPerson_(key) {
  if (PERSON_NAME[key]) return true;
  return !!Db.first('users', function (x) {
    return x.is_active && userKey_(x.username) === key;
  });
}

/** 일정 가운데 가장 늦은 날 */
function lastDate_(rows) {
  var last = '';
  (Array.isArray(rows) ? rows : []).forEach(function (r) {
    if (!r) return;
    var d = r.e || r.s;
    if (d && d > last) last = d;
  });
  return last;
}

/**
 * 교육진행을 적거나 고친다. 과정 하나에 한 벌만 둔다.
 *   PUT /visits/<과정번호>   { schedule_type, schedule_dates, note }
 */
function visitsSave(u, projectId, b) {
  var id = Number(projectId);
  var p = Db.get('projects', id);
  if (!p) throw new Error('과정을 찾을 수 없습니다.');

  b = b || {};
  var type = normalizeSchedType_(b.schedule_type);
  var dates = normalizeSchedule(b.schedule_dates, type);
  if (!dates.length) throw new Error('다녀온 날을 하나 이상 골라주세요.');

  var patch = {
    project_id: id,
    schedule_type: type,
    schedule_dates: JSON.stringify(dates),
    note: String(b.note || '').trim().slice(0, 500),
    // 누가 다녀왔는지 — 보통은 로그인한 사람, 관리자는 골라서 적을 수 있다
    visited_by: visitWho_(u, b.visited_by),
    // 실제로 저장 단추를 누른 사람 (대신 적어 준 것을 나중에 알 수 있게)
    updated_by: u.name || u.username || '',
    updated_at: Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm')
  };

  var had = visitOf_(id);
  if (had) Db.update('project_visits', had.id, patch);
  else Db.insert('project_visits', patch);

  return {
    message: '교육진행을 저장했습니다.',
    project_id: id, schedule_type: type,
    schedule_dates: dates, days: visitDays_(dates)
  };
}

/** 적어 둔 교육진행을 지운다 */
function visitsDelete(u, projectId) {
  var id = Number(projectId);
  var had = visitOf_(id);
  if (!had) throw new Error('적어 둔 교육진행이 없습니다.');
  Db.remove('project_visits', had.id);
  return { message: '교육진행을 지웠습니다.', project_id: id };
}

/**
 * 다녀온 사람으로 적을 아이디.
 *
 * 직원은 자기 이름으로만 적는다 — 남의 이름으로 적을 수 있으면
 * 누가 갔는지가 믿을 수 없는 숫자가 된다.
 * 관리자는 고를 수 있다 (대신 적거나 잘못 들어간 것을 고칠 때).
 */
function visitWho_(u, want) {
  var mine = userKey_(u.username);
  var pick = userKey_(want);
  if (!pick || pick === mine) return mine;
  if (!isAdmin(u)) return mine;                    // 직원은 말없이 자기 것으로
  if (!knownPerson_(pick)) throw new Error('그런 사람이 없습니다. (' + pick + ')');
  return pick;
}

/** 일정 유형 — 세 가지 밖은 「당일」로 본다 */
function normalizeSchedType_(v) {
  var t = String(v || '').trim();
  return (t === '기간' || t === '차수') ? t : '당일';
}

/**
 * 과정을 지우면 다녀온 기록도 함께 치운다.
 * 남겨 두면 나중에 같은 번호의 과정이 생겼을 때 엉뚱하게 붙는다.
 */
function visitsDropFor_(projectId) {
  var id = Number(projectId);
  Db.where('project_visits', function (r) { return r.project_id === id; })
    .forEach(function (r) { Db.remove('project_visits', r.id); });
}

/**
 * 고른 기간 안에 든 날만 센다.
 * 대시보드는 연·월을 고를 수 있으므로, 그 기간에 걸친 날만 세어야 한다.
 * 기간에 걸쳐 있으면 겹치는 부분만 센다 (8/28~9/3 을 8월로 보면 4일).
 */
function visitDaysIn_(rows, from, to) {
  var total = 0;
  (Array.isArray(rows) ? rows : []).forEach(function (r) {
    if (!r || !r.s) return;
    var s = r.s < from ? from : r.s;
    var e = (r.e || r.s) > to ? to : (r.e || r.s);
    if (s > e) return;                       // 기간 밖이면 센다고 할 것이 없다
    var d1 = new Date(s + 'T00:00:00'), d2 = new Date(e + 'T00:00:00');
    if (isNaN(d1) || isNaN(d2)) return;
    total += Math.round((d2 - d1) / 86400000) + 1;
  });
  return total;
}

/**
 * 대시보드에 올릴 교육진행 요약.
 * @param ok 이 과정을 셀지 판단하는 함수 (담당자·회사 거르기를 그대로 따른다)
 */
function visitsDigest_(from, to, ok) {
  var projById = {};
  Db.all('projects').forEach(function (p) { projById[p.id] = p; });
  var cName = {};
  Db.all('clients').forEach(function (c) { cName[c.id] = c.name; });

  var list = [];
  var days = 0;
  Db.all('project_visits').forEach(function (v) {
    var p = projById[v.project_id];
    if (!p) return;
    if (ok && !ok(p)) return;
    var dates = unwrap_(v.schedule_dates, []);
    var d = visitDaysIn_(dates, from, to);
    if (!d) return;                          // 고른 기간에 간 적이 없다
    days += d;
    list.push({
      project_id: p.id,
      course_name: p.course_name,
      client_name: p.client_id ? (cName[p.client_id] || null) : null,
      manager: p.manager,
      schedule_type: v.schedule_type || '당일',
      person: personNameOf(v.visited_by, v.updated_by),
      days: d,
      last: lastDate_(dates)
    });
  });

  list.sort(function (a, b) { return cmp_(b.last, a.last); });
  return {
    projects: list.length, days: days,
    byPerson: byPerson_(list, function (r) { return r.days; }),
    recent: list.slice(0, 5)
  };
}


/* ═════ Projects.gs ═════ */
/**
 * 과정(매출·매입·세금계산서) — PC 버전 routes/projects.js 를 옮긴 것
 *
 * PC 버전과 달라진 점은 딱 하나입니다:
 *   구글시트로 "동기화"하는 단계가 없습니다. 시트가 곧 저장소이기 때문입니다.
 */

var SALE_CATEGORIES = ['인건비', '운영비', '연수원비'];

/** 법인카드 뒤 4자리 — 숫자만 4글자까지 */
function cardLast4(e) {
  var v = String(e.card_last4 || '').replace(/[^0-9]/g, '').slice(0, 4);
  return v || null;
}

/** 매입 한 줄의 총액: 단가 × 수량 × 차수 (수기작성이면 입력값 그대로) */
function expenseAmount(e) {
  if (e.is_manual) return parseInt(e.total_amount, 10) || 0;
  var price = parseInt(e.unit_price, 10) || 0;
  var qSrc = (e.quantity !== undefined && e.quantity !== null && e.quantity !== '') ? e.quantity : e.hours;
  var qty = parseFloat(qSrc) || 0;
  var sess = parseFloat(e.sessions) || 1;
  return Math.round(price * qty * sess);
}

/** 매출 상세 한 줄의 금액 */
function saleAmount(item) {
  if (item.is_manual) return Math.max(0, parseInt(item.amount, 10) || 0);
  var price = parseInt(item.unit_price, 10) || 0;
  var q1 = parseFloat(item.qty1) || 0;
  var q2 = parseFloat(item.qty2) || 0;
  var sess = parseFloat(item.sessions) || 1;
  return Math.round(price * q1 * (q2 > 0 ? q2 : 1) * sess);
}

function money_(v) { return Math.max(0, parseInt(v, 10) || 0); }

/** JSON 문자열을 배열로 — 깨져 있으면 기본값 */
function unwrap_(v, fallback) {
  try {
    var x = JSON.parse(v || '');
    return Array.isArray(x) ? x : fallback;
  } catch (e) { return fallback; }
}

/**
 * 세금계산서를 다시 써넣는다.
 * 한 장도 안 넣으면 매출 전액짜리 1장을 자동으로 만든다(발행일·입금일 없음).
 */
function writeInvoices(projectId, invoices, baseAmount, vatMode, discountBase, company) {
  Db.removeWhere('project_invoices', function (r) { return r.project_id === projectId; });

  var list = Array.isArray(invoices) ? invoices.filter(Boolean) : [];
  if (list.length === 0) {
    list = [{ amount: baseAmount, discount: 0, issue_date: null, paid_date: null, note: '', company: company }];
  }

  // 받는 사람은 최대 2명. 아무것도 안 적은 줄은 버린다.
  var cleanRecipients = function (v) {
    return JSON.stringify((Array.isArray(v) ? v : [])
      .map(function (r) {
        return {
          name: String((r && r.name) || '').trim(),
          email: String((r && r.email) || '').trim(),
          phone: String((r && r.phone) || '').trim()
        };
      })
      .filter(function (r) { return r.name || r.email || r.phone; })
      .slice(0, 2));
  };
  // 화면은 늘 한 줄을 보여주므로 빈 줄이 올 수 있다 → 버린다
  var cleanItems = function (v) {
    return JSON.stringify((Array.isArray(v) ? v : [])
      .filter(function (r) { return r && (String(r.name || '').trim() || (parseInt(r.supply, 10) || 0)); })
      .slice(0, 16));
  };

  var rows = list.map(function (it, i) {
    var rawAmt = it.amount !== undefined ? it.amount : it.supply_amount;
    var mode = normalizeMode(it.vat_mode || vatMode);
    var dbase = normalizeBase(it.discount_base || discountBase);
    var t = computeTotals(rawAmt, it.discount, mode, dbase);
    var credit = (it.credit_amount !== undefined && it.credit_amount !== '')
      ? money_(it.credit_amount)
      : Math.max(0, t.total - money_(it.cash) - money_(it.check_amount) - money_(it.note_amount));
    return {
      project_id: projectId, seq: i + 1,
      supply_amount: t.supply, vat: t.vat, total_amount: t.total, discount: t.discount,
      vat_mode: mode, discount_base: dbase,
      issue_date: it.issue_date || null, paid_date: it.paid_date || null,
      note: it.note || '', is_manual: it.is_manual ? 1 : 0,
      // 장마다 발행사를 고를 수 있고, 안 골랐으면 과정의 회사를 따른다
      company: normalizeCompany(it.company || company),
      write_date: it.write_date || it.issue_date || null,
      remark: it.remark || '',
      pay_type: it.pay_type === '영수' ? '영수' : '청구',
      cash: money_(it.cash), check_amount: money_(it.check_amount),
      note_amount: money_(it.note_amount), credit_amount: credit,
      recipients: cleanRecipients(it.recipients),
      items: cleanItems(it.items)
    };
  });

  Db.insertMany('project_invoices', rows);
}

/** 매출 상세를 다시 써넣고 과정의 합계 칸을 갱신한다 */
function writeSales(projectId, sales, discount, vatMode, discountBase) {
  Db.removeWhere('project_sales', function (r) { return r.project_id === projectId; });

  var totals = { '인건비': 0, '운영비': 0, '연수원비': 0 };
  var rows = [];
  if (Array.isArray(sales) && sales.length) {
    sales.forEach(function (it, idx) {
      if (SALE_CATEGORIES.indexOf(it.category) < 0) return;
      var amt = saleAmount(it);
      rows.push({
        project_id: projectId, category: it.category,
        subcategory: it.subcategory || '', name: it.name || '',
        unit_price: parseInt(it.unit_price, 10) || 0,
        qty1: parseFloat(it.qty1) || 0, unit1: it.unit1 || '',
        qty2: parseFloat(it.qty2) || 0, unit2: it.unit2 || '',
        sessions: parseFloat(it.sessions) || 1,
        amount: amt, note: it.note || '', sort_order: idx,
        is_manual: it.is_manual ? 1 : 0
      });
      totals[it.category] += amt;
    });
    Db.insertMany('project_sales', rows);
  }

  var raw = totals['인건비'] + totals['운영비'] + totals['연수원비'];
  var t = computeTotals(raw, discount, vatMode, discountBase);

  Db.update('projects', projectId, {
    sale_labor: totals['인건비'], sale_operation: totals['운영비'], sale_venue: totals['연수원비'],
    total_sales: t.supply, vat: t.vat, total_with_vat: t.total, discount: t.discount,
    vat_mode: normalizeMode(vatMode), discount_base: normalizeBase(discountBase)
  });

  return { totals: totals, raw: raw, supply: t.supply, vat: t.vat, total: t.total, discount: t.discount };
}

/** 매입 항목을 다시 써넣고 과정의 매입합계를 갱신한다 → 합계를 돌려준다 */
function writeExpenses(projectId, expenses) {
  Db.removeWhere('project_expenses', function (r) { return r.project_id === projectId; });
  var totalExp = 0, rows = [];
  (expenses || []).forEach(function (e) {
    var amt = expenseAmount(e);
    rows.push({
      project_id: projectId, category: e.category,
      instructor_id: e.instructor_id || null, name: e.name, affiliation: e.affiliation || '',
      hours: parseFloat(e.hours) || 0, quantity: parseFloat(e.quantity) || 0,
      unit: e.unit || '', sessions: parseFloat(e.sessions) || 1,
      unit_price: parseInt(e.unit_price, 10) || 0,
      is_manual: e.is_manual ? 1 : 0, total_amount: amt,
      tax_type: e.tax_type || '3.3%',
      tax_amount: parseInt(e.tax_amount, 10) || 0,
      payment_amount: parseInt(e.payment_amount, 10) || 0,
      payment_date: e.payment_date || null, note: e.note || '',
      card_last4: cardLast4(e)
    });
    totalExp += amt;
  });
  if (rows.length) Db.insertMany('project_expenses', rows);
  Db.update('projects', projectId, { total_expenses: totalExp });
  return totalExp;
}

/* ═══════════════════════ 엔드포인트 ═══════════════════════ */

/** 과정 목록 — 검색·월·담당자·회사·구분·정렬 */
function projectsList(u, q) {
  q = q || {};
  var cName = {}, ctName = {}, uName = {};
  Db.all('clients').forEach(function (c) { cName[c.id] = c.name; });
  Db.all('contacts').forEach(function (c) { ctName[c.id] = c.name; });
  Db.all('users').forEach(function (x) { uName[x.id] = x.name; });

  var kw = String(q.q || '').trim().toLowerCase();

  /*
   * 「매입이 하나도 없는 과정만」 보기.
   * 대시보드의 경고를 눌렀을 때 어느 과정인지 바로 찾아가기 위한 것이다.
   */
  var noExpense = null;
  if (q.missing_expense) {
    noExpense = {};
    Db.all('projects').forEach(function (p) {
      if ((p.total_sales || 0) > 0 && (p.total_expenses || 0) === 0) noExpense[p.id] = true;
    });
  }

  var rows = Db.all('projects').filter(function (p) {
    if (noExpense && !noExpense[p.id]) return false;
    if (!overlapsPeriod(p, q.start_date, q.end_date)) return false;
    if (q.month && /^\d{4}-\d{2}$/.test(q.month)) {
      if (!overlapsPeriod(p, q.month + '-01', q.month + '-31')) return false;
    }
    if (q.type && p.type !== q.type) return false;
    if (q.company && p.company !== q.company) return false;
    if (q.client_id && p.client_id !== Number(q.client_id)) return false;
    if (q.manager && p.manager !== q.manager) return false;
    if (kw) {
      var hay = [p.course_name, cName[p.client_id], ctName[p.contact_id], p.memo, p.manager]
        .map(function (x) { return String(x || '').toLowerCase(); }).join(' ');
      if (hay.indexOf(kw) < 0) return false;
    }
    // 관리자가 아니면 본인이 입력한 것만
    if (!canSeeOthers(u) && p.created_by !== u.id) return false;
    return true;
  });

  // 걸러낸 전체의 건수 · 합계
  var agg = { total: rows.length, sales: 0, vat: 0, expenses: 0 };
  rows.forEach(function (p) {
    agg.sales += p.total_sales || 0;
    agg.vat += p.vat || 0;
    agg.expenses += p.total_expenses || 0;
  });

  var idSet = {};
  rows.forEach(function (p) { idSet[p.id] = true; });

  var byProj = {}, unpaid = 0;
  Db.all('project_invoices').forEach(function (i) {
    (byProj[i.project_id] = byProj[i.project_id] || []).push(i);
    if (idSet[i.project_id] && !i.paid_date) unpaid += i.total_amount || 0;
  });

  var SORTS = {
    recent:      function (a, b) { return cmp_(b.created_at, a.created_at); },
    oldest:      function (a, b) { return cmp_(a.created_at, b.created_at); },
    /*
     * 교육일 순 — 「첫 교육일」을 기준으로 삼는다.
     *
     * 앱 전체가 그 날을 기준으로 쓰고 있다 (집계 기준 「교육 시작일」,
     * 엑셀의 과정 차례도 같다). 여기만 다르면 같은 자료가 화면마다
     * 다른 차례로 보인다.
     *
     * 전에는 schedule_dates 를 통째로 견주었다. 글자로 견주면 대개
     * 맞지만, 일정이 비어 있거나 모양이 다르면 엉뚱한 자리에 간다.
     * 일정이 없는 과정은 맨 아래로 보낸다.
     */
    date_desc:   function (a, b) {
      var sa = firstStart_(a) || '', sb = firstStart_(b) || '';
      if (sa !== sb) { if (!sa) return 1; if (!sb) return -1; return sa < sb ? 1 : -1; }
      return b.id - a.id;
    },
    date_asc:    function (a, b) {
      var sa = firstStart_(a) || '', sb = firstStart_(b) || '';
      if (sa !== sb) { if (!sa) return 1; if (!sb) return -1; return sa > sb ? 1 : -1; }
      return a.id - b.id;
    },
    sales_desc:  function (a, b) { return (b.total_sales || 0) - (a.total_sales || 0); },
    sales_asc:   function (a, b) { return (a.total_sales || 0) - (b.total_sales || 0); },
    profit_desc: function (a, b) { return ((b.total_sales || 0) - (b.total_expenses || 0)) - ((a.total_sales || 0) - (a.total_expenses || 0)); },
    profit_asc:  function (a, b) { return ((a.total_sales || 0) - (a.total_expenses || 0)) - ((b.total_sales || 0) - (b.total_expenses || 0)); },
    client:      function (a, b) { return cmp_(cName[a.client_id], cName[b.client_id]) || cmp_(b.created_at, a.created_at); },
    course:      function (a, b) { return cmp_(a.course_name, b.course_name); }
  };
  /*
   * 아무것도 고르지 않았으면 교육일 내림차순 — 가장 최근에 한 교육이 맨 위.
   * (대표님 지시 2026-10-28. 전에는 「등록한 날」 순이었는데, 지난달 과정을
   *  오늘 적으면 그것이 맨 위로 올라와 요즘 교육을 찾기 어려웠다)
   */
  rows = rows.slice().sort(SORTS[q.sort] || SORTS.date_desc);

  var page = parseInt(q.page, 10) || 1;
  var limit = parseInt(q.limit, 10) || 100;
  var slice = rows.slice((page - 1) * limit, (page - 1) * limit + limit);

  // 확인해 둔 것들 — 관리자만 쓰는 표시라 관리자일 때만 읽는다
  var checkedOut = isAdmin(u) ? checkedMap_('missing_expense') : {};

  // 미수금·발행일을 붙인다
  var out = slice.map(function (p) {
    var o = shallow_(p);
    o.client_name = cName[p.client_id] || null;
    o.contact_name = ctName[p.contact_id] || null;
    o.created_by_name = uName[p.created_by] || null;
    var inv = byProj[p.id] || [];
    o.invoice_count = inv.length;
    o.unpaid_amount = 0; o.issue_date = null; o.paid_date = null;
    inv.forEach(function (i) {
      if (!i.paid_date) o.unpaid_amount += i.total_amount || 0;
      if (i.issue_date && (!o.issue_date || i.issue_date < o.issue_date)) o.issue_date = i.issue_date;
      if (i.paid_date && (!o.paid_date || i.paid_date > o.paid_date)) o.paid_date = i.paid_date;
    });
    /*
     * 「확인함」 상태 — 매입 누락 경고를 보고 확인해 둔 건인지.
     * 목록에서 한 건씩 누를 수 있어야 하므로 줄마다 함께 보낸다.
     */
    var ck = checkedOut[p.id];
    o.expense_checked = !!ck;
    o.expense_checked_by = ck ? ck.checked_by : null;
    o.expense_checked_at = ck ? ck.checked_at : null;
    parseSchedule(o);
    return o;
  });

  return {
    projects: out,
    totals: {
      count: agg.total, sales: agg.sales, vat: agg.vat, expenses: agg.expenses,
      profit: agg.sales - agg.expenses, unpaid: unpaid
    },
    pagination: {
      total: agg.total, page: page, limit: limit,
      totalPages: Math.ceil(agg.total / limit)
    }
  };
}

/** 필터에 쓸 목록 (월 · 담당자 · 회사) */
function projectsFilters(u) {
  var months = {}, managers = {};
  Db.all('projects').forEach(function (p) {
    monthsOf(p).forEach(function (m) { months[m] = true; });
    if (String(p.manager || '').trim()) managers[p.manager] = true;
  });
  return {
    months: Object.keys(months).sort().reverse(),
    managers: Object.keys(managers).sort(),
    companies: COMPANIES
  };
}

/** 과정 상세 */
function projectsGet(u, id) {
  id = Number(id);
  var p = Db.get('projects', id);
  if (!p) throw new Error('과정을 찾을 수 없습니다.');
  if (!canSeeOthers(u) && p.created_by !== u.id) {
    throw new Error('본인이 입력한 과정만 조회할 수 있습니다.');
  }

  var project = shallow_(p);
  var c = p.client_id ? Db.get('clients', p.client_id) : null;
  var ct = p.contact_id ? Db.get('contacts', p.contact_id) : null;
  var cu = p.created_by ? Db.get('users', p.created_by) : null;
  project.client_name = c ? c.name : null;
  project.contact_name = ct ? ct.name : null;
  project.contact_position = ct ? ct.position : null;
  project.contact_department = ct ? ct.department : null;
  project.created_by_name = cu ? cu.name : null;
  parseSchedule(project);

  var expenses = Db.where('project_expenses', function (r) { return r.project_id === id; })
    .sort(function (a, b) { return cmp_(a.category, b.category) || (a.id - b.id); })
    .map(function (e) {
      var o = shallow_(e);
      var ins = e.instructor_id ? Db.get('instructors', e.instructor_id) : null;
      o.instructor_registered_name = ins ? ins.name : null;
      o.instructor_affiliation = ins ? ins.affiliation : null;
      o.default_tax_type = ins ? ins.default_tax_type : null;
      return o;
    });

  var sales = Db.where('project_sales', function (r) { return r.project_id === id; })
    .sort(function (a, b) {
      return cmp_(a.category, b.category) || ((a.sort_order || 0) - (b.sort_order || 0)) || (a.id - b.id);
    }).map(shallow_);

  var canRaw = isAdmin(u);
  var reqMap = invoiceRequestMap_();
  var invoices = Db.where('project_invoices', function (r) { return r.project_id === id; })
    .sort(function (a, b) { return ((a.seq || 0) - (b.seq || 0)) || (a.id - b.id); })
    .map(function (r) {
      var o = shallow_(r);
      var people = unwrap_(r.recipients, []);
      // 관리자가 아니면 이메일·연락처를 가려서 보낸다
      o.recipients = canRaw ? people : maskRecipients(people);
      o.items = unwrap_(r.items, []);
      // 발행요청을 보냈는지 — 과정 등록 화면에서도 바로 보이게
      var rq = reqMap[reqKey_(r.project_id, r.seq)];
      o.requested = !!rq;
      o.requested_at = rq ? rq.sent_at : null;
      o.requested_by = rq ? rq.sent_by : null;
      o.requested_count = rq ? rq.count : 0;
      return o;
    });

  return { project: project, expenses: expenses, sales: sales, invoices: invoices };
}

/** 고객사를 찾거나 새로 만든다 */
function resolveClient_(clientId, clientName) {
  if (clientId) return Number(clientId);
  var nm = String(clientName || '').trim();
  if (!nm) return null;
  var ex = Db.first('clients', function (c) { return c.name === nm && c.is_active; });
  if (ex) return ex.id;
  return Db.insert('clients', { name: nm, is_active: 1 }).id;
}

/** 담당자를 찾거나 새로 만든다 */
function resolveContact_(contactId, contactName, clientId) {
  if (contactId) return Number(contactId);
  var nm = String(contactName || '').trim();
  if (!nm || !clientId) return null;
  var ex = Db.first('contacts', function (c) {
    return c.client_id === clientId && c.name === nm && c.is_active;
  });
  if (ex) return ex.id;
  return Db.insert('contacts', { client_id: clientId, name: nm, is_active: 1 }).id;
}

/** 과정 등록 */
function projectsCreate(u, b) {
  if (!b.course_name) throw new Error('과정명을 입력해주세요.');
  var company = normalizeCompany(b.company);

  var clientId = resolveClient_(b.client_id, b.client_name);
  var contactId = resolveContact_(b.contact_id, b.contact_name, clientId);

  var p = Db.insert('projects', {
    client_id: clientId, contact_id: contactId,
    type: b.type || '교육', course_name: b.course_name,
    schedule_type: b.schedule_type || '당일',
    schedule_dates: JSON.stringify(normalizeSchedule(b.schedule_dates, b.schedule_type || '당일')),
    manager: b.manager || '', sales_rep: b.sales_rep || '', company: company,
    sale_labor: 0, sale_operation: 0, sale_venue: 0,
    total_sales: 0, vat: 0, total_with_vat: 0, total_expenses: 0,
    memo: b.memo || '', created_by: u.id, updated_at: now()
  });

  writeExpenses(p.id, b.expenses);
  var st = writeSales(p.id, b.sales, b.discount, b.vat_mode, b.discount_base);
  var invBase = normalizeMode(b.vat_mode) === '포함' ? st.total : st.supply;
  writeInvoices(p.id, b.invoices, invBase, b.vat_mode, b.discount_base, company);

  return { message: '과정이 등록되었습니다.', id: p.id };
}

/** 과정 수정 */
function projectsUpdate(u, id, b) {
  id = Number(id);
  var p = Db.get('projects', id);
  if (!p) throw new Error('과정을 찾을 수 없습니다.');
  if (!canEditOthers(u) && p.created_by !== u.id) {
    throw new Error('본인이 입력한 과정만 수정할 수 있습니다.');
  }

  // 회사를 안 보내오면 원래 값을 지킨다
  var company = b.company !== undefined ? normalizeCompany(b.company) : normalizeCompany(p.company);

  var clientId = b.client_id || p.client_id;
  if (!b.client_id && b.client_name) clientId = resolveClient_(null, b.client_name);
  var contactId = b.contact_id || p.contact_id;
  if (!b.contact_id && b.contact_name) contactId = resolveContact_(null, b.contact_name, clientId);

  var schedType = b.schedule_type || p.schedule_type;
  Db.update('projects', id, {
    client_id: clientId, contact_id: contactId,
    type: b.type || p.type, course_name: b.course_name || p.course_name,
    schedule_type: schedType,
    schedule_dates: JSON.stringify(normalizeSchedule(
      b.schedule_dates !== undefined ? b.schedule_dates : p.schedule_dates, schedType)),
    manager: b.manager !== undefined ? b.manager : p.manager,
    sales_rep: b.sales_rep !== undefined ? b.sales_rep : p.sales_rep,
    company: company,
    memo: b.memo !== undefined ? b.memo : p.memo
  });

  var st = null;
  if (b.sales !== undefined) st = writeSales(id, b.sales, b.discount, b.vat_mode, b.discount_base);

  if (b.invoices !== undefined || st) {
    var cur = Db.get('projects', id);
    var mode = normalizeMode(b.vat_mode || cur.vat_mode);
    var dbase = normalizeBase(b.discount_base || cur.discount_base);
    var invBase = mode === '포함' ? cur.total_with_vat : cur.total_sales;
    writeInvoices(id, b.invoices, invBase, mode, dbase, company);
  }

  if (b.expenses !== undefined) writeExpenses(id, b.expenses);

  return { message: '과정이 수정되었습니다.' };
}

/** 과정 삭제 (관리자만) */
function projectsDelete(u, id) {
  requireAdmin(u);
  id = Number(id);
  if (!Db.get('projects', id)) throw new Error('과정을 찾을 수 없습니다.');
  Db.removeWhere('project_expenses', function (r) { return r.project_id === id; });
  Db.removeWhere('project_sales', function (r) { return r.project_id === id; });
  Db.removeWhere('project_invoices', function (r) { return r.project_id === id; });
  Db.remove('projects', id);
  checkDropFor_('missing_expense', id);   // 찌꺼기가 남으면 나중 과정 번호와 겹친다
  visitsDropFor_(id);
  invoiceRequestDropFor_(id);
  return { message: '과정이 삭제되었습니다.' };
}

/* ───────── 도우미 ───────── */

/**
 * 화면으로 보내면 안 되는 내부 칸을 떼고 복사한다.
 *   _r        시트의 실제 행번호
 *   __sched   일정을 한 번 풀어 둔 메모 (schedOf 가 붙인다)
 */
function shallow_(o) {
  var out = {};
  for (var k in o) {
    if (k === '_r' || k === '__sched') continue;
    out[k] = o[k];
  }
  return out;
}

/** null 을 뒤로 보내는 문자열 비교 */
function cmp_(a, b) {
  var x = a === null || a === undefined ? '' : String(a);
  var y = b === null || b === undefined ? '' : String(b);
  return x < y ? -1 : (x > y ? 1 : 0);
}


/* ═════ Entities.gs ═════ */
/**
 * 명단 — 고객사 · 담당자 · 강사 · 협력사 · 직원/외부영업 · 법인카드
 * PC 버전 routes/{clients,contacts,instructors,partners,staff,cards}.js 를 옮긴 것
 *
 * 공통 원칙 (PC 버전과 동일)
 *   · 이미 과정에 쓰인 항목은 지우지 않고 「사용안함」으로 돌린다 (고아 데이터 방지)
 *   · 이름·뒤4자리를 바꾸면 이미 등록된 과정·매입의 값도 함께 바꾼다
 */

function like_(hay, needle) {
  return String(hay || '').toLowerCase().indexOf(String(needle || '').toLowerCase()) >= 0;
}
function trim_(v) { return String(v === null || v === undefined ? '' : v).trim(); }
function byName_(a, b) { return cmp_(a.name, b.name); }

/* ═══════════════ 고객사 ═══════════════ */

function clientsSearch(u, q) {
  if (!q) return { clients: [] };
  return {
    clients: Db.where('clients', function (c) { return c.is_active && like_(c.name, q); })
      .sort(byName_).slice(0, 10).map(shallow_)
  };
}

function clientsList(u) {
  var contactCnt = {}, projCnt = {}, projSales = {};
  Db.all('contacts').forEach(function (ct) {
    if (ct.is_active) contactCnt[ct.client_id] = (contactCnt[ct.client_id] || 0) + 1;
  });
  Db.all('projects').forEach(function (p) {
    projCnt[p.client_id] = (projCnt[p.client_id] || 0) + 1;
    projSales[p.client_id] = (projSales[p.client_id] || 0) + (p.total_sales || 0);
  });

  return {
    clients: Db.where('clients', function (c) { return c.is_active; })
      .sort(byName_).map(function (c) {
        var o = shallow_(c);
        o.contact_count = contactCnt[c.id] || 0;
        o.project_count = projCnt[c.id] || 0;
        o.total_sales = projSales[c.id] || 0;
        return o;
      })
  };
}

function clientsCreate(u, b) {
  var nm = trim_(b.name);
  if (!nm) throw new Error('고객사명을 입력해주세요.');
  var ex = Db.first('clients', function (c) { return c.name === nm && c.is_active; });
  if (ex) return { client: { id: ex.id }, message: '이미 존재하는 고객사입니다.' };
  var r = Db.insert('clients', { name: nm, is_active: 1 });
  return { client: { id: r.id, name: nm } };
}

function clientsUpdate(u, id, b) {
  var patch = {};
  if (b.name !== undefined) patch.name = trim_(b.name);
  if (b.is_active !== undefined) patch.is_active = b.is_active ? 1 : 0;
  if (Object.keys(patch).length) Db.update('clients', id, patch);
  return { message: '고객사 정보가 수정되었습니다.' };
}

/* ═══════════════ 고객사 담당자 ═══════════════
 * ⚠️ 이메일·연락처는 개인정보라 저장하지 않습니다. 이름·직급·부서만 다룹니다.
 */

function contactsSearch(u, q) {
  var rows = Db.where('contacts', function (c) {
    if (!c.is_active) return false;
    if (q.client_id && c.client_id !== Number(q.client_id)) return false;
    if (q.q && !like_(c.name, q.q)) return false;
    return true;
  }).sort(byName_).slice(0, 20).map(shallow_);
  return { contacts: rows };
}

function contactsList(u, q) {
  var rows = Db.where('contacts', function (c) {
    if (!c.is_active) return false;
    if (q && q.client_id && c.client_id !== Number(q.client_id)) return false;
    return true;
  }).sort(byName_).map(shallow_);
  return { contacts: rows };
}

function contactsCreate(u, b) {
  var nm = trim_(b.name);
  if (!b.client_id || !nm) throw new Error('고객사와 담당자 이름을 입력해주세요.');
  var cid = Number(b.client_id);
  var dup = Db.first('contacts', function (c) {
    return c.client_id === cid && c.name === nm && c.is_active;
  });
  if (dup) throw new Error('같은 고객사에 이미 등록된 담당자입니다.');

  var r = Db.insert('contacts', {
    client_id: cid, name: nm,
    position: trim_(b.position), department: trim_(b.department), is_active: 1
  });
  return {
    contact: {
      id: r.id, client_id: cid, name: nm,
      position: trim_(b.position), department: trim_(b.department)
    }
  };
}

function contactsUpdate(u, id, b) {
  var patch = {};
  if (b.name !== undefined) patch.name = trim_(b.name);
  if (b.position !== undefined) patch.position = trim_(b.position);
  if (b.department !== undefined) patch.department = trim_(b.department);
  if (b.is_active !== undefined) patch.is_active = b.is_active ? 1 : 0;
  if (Object.keys(patch).length) Db.update('contacts', id, patch);
  return { message: '담당자 정보가 수정되었습니다.' };
}

/** 과정에 이미 쓰인 담당자는 지우지 않고 감춘다 */
function contactsDelete(u, id) {
  Db.update('contacts', id, { is_active: 0 });
  return { message: '담당자가 목록에서 제외되었습니다.' };
}

/* ═══════════════ 강사 ═══════════════
 * ⚠️ 주민번호·연락처·계좌번호는 저장하지 않습니다.
 *    그 정보는 담당자 PC 의 오프라인 엑셀에서 「강사코드(id)」로 연결합니다.
 */

/** 관리자가 아니면 이메일을 가려서 내보낸다 */
function hideEmail_(u, rows) {
  if (isAdmin(u)) return rows;
  return rows.map(function (r) {
    var o = shallow_(r);
    o.email = maskEmail(r.email);
    o.masked = true;
    return o;
  });
}

function cleanInstructor_(b) {
  return {
    name: trim_(b.name),
    title: trim_(b.title),
    affiliation: trim_(b.affiliation),
    email: trim_(b.email),
    default_tax_type: b.default_tax_type || '3.3%',
    default_unit_price: Math.max(0, parseInt(b.default_unit_price, 10) || 0)
  };
}

var INSTRUCTOR_FIELDS = ['id', 'name', 'title', 'affiliation', 'email',
  'default_tax_type', 'default_unit_price', 'is_active', 'created_at'];

function pick_(o, fields) {
  var out = {};
  fields.forEach(function (f) { out[f] = o[f]; });
  return out;
}

function instructorsSearch(u, q) {
  if (!q) return { instructors: [] };
  var rows = Db.where('instructors', function (i) { return i.is_active && like_(i.name, q); })
    .sort(byName_).slice(0, 10)
    .map(function (i) { return pick_(i, INSTRUCTOR_FIELDS); });
  return { instructors: hideEmail_(u, rows) };
}

function instructorsList(u, q) {
  var rows = Db.where('instructors', function (i) {
    return (q && q.include_inactive) ? true : !!i.is_active;
  }).sort(byName_).map(function (i) { return pick_(i, INSTRUCTOR_FIELDS); });
  return { instructors: hideEmail_(u, rows) };
}

/*
 * 강사를 명부에 올린다.
 *
 * 대표님 지시 (2026-10-27): 직원도 올릴 수 있어야 한다.
 *   과정을 적다가 처음 보는 강사를 만나는 일이 흔한데, 그때마다
 *   관리자를 기다리면 일이 멈춘다.
 *
 * 고치고 지우는 것은 여전히 관리자만 한다 — 이미 쌓인 단가·세율을
 * 누가 바꾸면 지난 과정의 숫자까지 흔들린다.
 */
function instructorsCreate(u, b) {
  var d = cleanInstructor_(b);
  if (!d.name) throw new Error('강사 이름은 필수입니다.');
  d.is_active = 1;
  var r = Db.insert('instructors', d);
  return { message: '강사가 등록되었습니다.', id: r.id };
}

function instructorsUpdate(u, id, b) {
  requireAdmin(u);
  var patch = {};
  if (b.name !== undefined) patch.name = trim_(b.name);
  if (b.title !== undefined) patch.title = trim_(b.title);
  if (b.affiliation !== undefined) patch.affiliation = b.affiliation;
  if (b.email !== undefined) patch.email = b.email;
  if (b.default_tax_type !== undefined) patch.default_tax_type = b.default_tax_type;
  if (b.default_unit_price !== undefined) patch.default_unit_price = parseInt(b.default_unit_price, 10) || 0;
  if (b.is_active !== undefined) patch.is_active = b.is_active ? 1 : 0;
  if (Object.keys(patch).length) Db.update('instructors', id, patch);
  return { message: '강사 정보가 수정되었습니다.' };
}

function instructorsDelete(u, id) {
  requireAdmin(u);
  Db.update('instructors', id, { is_active: 0 });
  return { message: '강사가 비활성화되었습니다.' };
}

/* ═══════════════ 협력사 ═══════════════ */

function partnersSearch(u, q) {
  if (!q) return { partners: [] };
  return {
    partners: Db.where('partners', function (p) { return p.is_active && like_(p.name, q); })
      .sort(byName_).slice(0, 10)
      .map(function (p) { return pick_(p, ['id', 'name', 'category', 'default_tax_type']); })
  };
}

function partnersList(u, q) {
  return {
    partners: Db.where('partners', function (p) {
      return (q && q.include_inactive) ? true : !!p.is_active;
    }).sort(byName_).map(shallow_)
  };
}

/*
 * 협력사를 명부에 올린다.
 * 강사와 같은 까닭으로 직원도 올릴 수 있다 (대표님 지시 2026-10-27).
 * 고치고 지우는 것은 관리자만.
 */
function partnersCreate(u, b) {
  var nm = trim_(b.name);
  if (!nm) throw new Error('협력사명을 입력해주세요.');
  var dup = Db.first('partners', function (p) { return p.name === nm && p.is_active; });
  if (dup) throw new Error('이미 등록된 협력사입니다.');
  var r = Db.insert('partners', {
    name: nm, category: trim_(b.category), note: trim_(b.note),
    default_tax_type: b.default_tax_type || '세금계산서(과세)', is_active: 1
  });
  return { message: '협력사가 등록되었습니다.', id: r.id };
}

function partnersUpdate(u, id, b) {
  requireAdmin(u);
  var patch = {};
  if (b.name !== undefined) patch.name = trim_(b.name);
  if (b.category !== undefined) patch.category = trim_(b.category);
  if (b.note !== undefined) patch.note = trim_(b.note);
  if (b.default_tax_type !== undefined) patch.default_tax_type = b.default_tax_type;
  if (b.is_active !== undefined) patch.is_active = b.is_active ? 1 : 0;
  if (Object.keys(patch).length) Db.update('partners', id, patch);
  return { message: '협력사 정보가 수정되었습니다.' };
}

function partnersDelete(u, id) {
  requireAdmin(u);
  Db.update('partners', id, { is_active: 0 });
  return { message: '협력사가 목록에서 제외되었습니다.' };
}

/* ═══════════════ 직원 · 외부영업자 ═══════════════ */

var STAFF_KINDS = ['직원', '영업'];

function staffList(u) {
  var asManager = {}, asRep = {};
  Db.all('projects').forEach(function (p) {
    if (p.manager) asManager[p.manager] = (asManager[p.manager] || 0) + 1;
    if (p.sales_rep) asRep[p.sales_rep] = (asRep[p.sales_rep] || 0) + 1;
  });

  var rows = Db.all('staff').slice().sort(function (a, b) {
    return cmp_(b.kind, a.kind) || ((b.is_active || 0) - (a.is_active || 0)) || cmp_(a.name, b.name);
  }).map(function (s) {
    var o = shallow_(s);
    o.as_manager = asManager[s.name] || 0;
    o.as_rep = asRep[s.name] || 0;
    return o;
  });

  return {
    staff: rows,
    managers: rows.filter(function (r) { return r.kind === '직원' && r.is_active; })
      .map(function (r) { return r.name; }),
    salesReps: rows.filter(function (r) { return r.kind === '영업' && r.is_active; })
      .map(function (r) { return r.name; }),
    kinds: STAFF_KINDS
  };
}

function cleanStaff_(b) {
  return {
    name: trim_(b.name),
    kind: STAFF_KINDS.indexOf(b.kind) >= 0 ? b.kind : '직원',
    position: trim_(b.position),
    note: trim_(b.note),
    is_active: (b.is_active === false || b.is_active === 0) ? 0 : 1
  };
}

function staffCreate(u, b) {
  requireAdmin(u);
  var d = cleanStaff_(b);
  if (!d.name) throw new Error('이름을 입력하세요.');
  var dup = Db.first('staff', function (s) { return s.name === d.name && s.kind === d.kind; });
  if (dup) throw new Error('이미 있는 이름입니다.');
  var r = Db.insert('staff', d);
  return merge_({ id: r.id }, d);
}

/** 이름을 바꾸면 이미 등록된 과정의 담당자도 함께 바꾼다 */
function staffUpdate(u, id, b) {
  requireAdmin(u);
  id = Number(id);
  var row = Db.get('staff', id);
  if (!row) throw new Error('없는 사람입니다.');

  var d = cleanStaff_(b);
  if (!d.name) throw new Error('이름을 입력하세요.');
  var dup = Db.first('staff', function (s) {
    return s.name === d.name && s.kind === d.kind && s.id !== id;
  });
  if (dup) throw new Error('이미 있는 이름입니다.');

  var oldName = row.name, oldKind = row.kind;
  Db.update('staff', id, d);

  if (oldName !== d.name) {
    var col = oldKind === '영업' ? 'sales_rep' : 'manager';
    Db.where('projects', function (p) { return p[col] === oldName; }).forEach(function (p) {
      var patch = {}; patch[col] = d.name;
      Db.update('projects', p.id, patch);
    });
  }
  return merge_({ id: id }, d);
}

/** 과정에 쓰인 사람은 지우지 않고 「쓰지 않음」으로 돌린다 */
function staffDelete(u, id) {
  requireAdmin(u);
  id = Number(id);
  var row = Db.get('staff', id);
  if (!row) throw new Error('없는 사람입니다.');

  var used = Db.where('projects', function (p) {
    return p.manager === row.name || p.sales_rep === row.name;
  }).length;

  if (used > 0) {
    Db.update('staff', id, { is_active: 0 });
    return { ok: true, deactivated: true, used: used };
  }
  Db.remove('staff', id);
  return { ok: true, deactivated: false };
}

/* ═══════════════ 법인카드 ═══════════════
 * 카드가 여러 장이라 뒤 4자리만으로는 구분이 어렵습니다.
 * 카드사·소지자를 적어두고 매입·경비에서 뒤 4자리로 불러 씁니다.
 */

function cleanCard_(b) {
  return {
    last4: String(b.last4 || '').replace(/[^0-9]/g, '').slice(0, 4),
    issuer: trim_(b.issuer),
    holder: trim_(b.holder),
    company: COMPANIES.indexOf(b.company) >= 0 ? b.company : COMPANIES[0],
    note: trim_(b.note),
    is_active: (b.is_active === false || b.is_active === 0) ? 0 : 1
  };
}

function cardsList(u, q) {
  var kw = trim_(q && q.q);

  // 뒤 4자리별 사용 건수·금액
  var peCnt = {}, peAmt = {}, ohCnt = {}, ohAmt = {};
  Db.all('project_expenses').forEach(function (e) {
    if (!e.card_last4) return;
    peCnt[e.card_last4] = (peCnt[e.card_last4] || 0) + 1;
    peAmt[e.card_last4] = (peAmt[e.card_last4] || 0) + (e.total_amount || 0);
  });
  Db.all('overheads').forEach(function (o) {
    if (!o.card_last4) return;
    ohCnt[o.card_last4] = (ohCnt[o.card_last4] || 0) + 1;
    ohAmt[o.card_last4] = (ohAmt[o.card_last4] || 0) + (o.amount || 0);
  });

  var all = Db.all('corp_cards');
  var cards = all.filter(function (c) {
    if (!kw) return true;
    return like_(c.last4, kw) || like_(c.issuer, kw) || like_(c.holder, kw) || like_(c.note, kw);
  }).sort(function (a, b) {
    return ((b.is_active || 0) - (a.is_active || 0)) || cmp_(a.issuer, b.issuer) || cmp_(a.last4, b.last4);
  }).map(function (c) {
    var o = shallow_(c);
    o.use_count = peCnt[c.last4] || 0;
    o.use_amount = peAmt[c.last4] || 0;
    o.oh_count = ohCnt[c.last4] || 0;
    o.oh_amount = ohAmt[c.last4] || 0;
    return o;
  });

  // 쓴 적 있는 번호 전체 (매입 + 경비)
  var usedCnt = {};
  Object.keys(peCnt).forEach(function (k) { usedCnt[k] = (usedCnt[k] || 0) + peCnt[k]; });
  Object.keys(ohCnt).forEach(function (k) { usedCnt[k] = (usedCnt[k] || 0) + ohCnt[k]; });
  var used = Object.keys(usedCnt).sort().map(function (k) { return { last4: k, cnt: usedCnt[k] }; });

  var known = {};
  all.forEach(function (c) { known[c.last4] = true; });

  // 입력칸 자동완성용 — 등록된 활성 카드 + 쓴 적 있는 번호
  var pool = {};
  all.forEach(function (c) { if (c.is_active) pool[c.last4] = true; });
  used.forEach(function (r) { pool[r.last4] = true; });

  return {
    cards: cards,
    // 카드 명단에는 없는데 매입·경비에 쓰인 번호 (등록을 빠뜨린 것)
    unregistered: used.filter(function (r) { return !known[r.last4]; }),
    all: Object.keys(pool).sort(),
    companies: COMPANIES
  };
}

function cardsCreate(u, b) {
  requireAdmin(u);
  var d = cleanCard_(b);
  if (d.last4.length !== 4) throw new Error('카드 뒤 4자리를 숫자로 적어주세요.');
  var dup = Db.first('corp_cards', function (c) { return c.last4 === d.last4; });
  if (dup) throw new Error('이미 등록된 뒤 4자리입니다.');
  var r = Db.insert('corp_cards', d);
  return merge_({ id: r.id }, d);
}

/** 뒤 4자리를 바꾸면 이미 쓴 매입·경비의 번호도 함께 바꾼다 */
function cardsUpdate(u, id, b) {
  requireAdmin(u);
  id = Number(id);
  var row = Db.get('corp_cards', id);
  if (!row) throw new Error('없는 카드입니다.');

  var d = cleanCard_(b);
  if (d.last4.length !== 4) throw new Error('카드 뒤 4자리를 숫자로 적어주세요.');
  var dup = Db.first('corp_cards', function (c) { return c.last4 === d.last4 && c.id !== id; });
  if (dup) throw new Error('이미 등록된 뒤 4자리입니다.');

  var oldLast4 = row.last4;
  Db.update('corp_cards', id, d);

  if (oldLast4 !== d.last4) {
    Db.where('project_expenses', function (e) { return e.card_last4 === oldLast4; })
      .forEach(function (e) { Db.update('project_expenses', e.id, { card_last4: d.last4 }); });
    Db.where('overheads', function (o) { return o.card_last4 === oldLast4; })
      .forEach(function (o) { Db.update('overheads', o.id, { card_last4: d.last4 }); });
  }
  return merge_({ id: id }, d);
}

/** 쓰인 적 있으면 지우지 않고 「사용안함」으로 돌린다 */
function cardsDelete(u, id) {
  requireAdmin(u);
  id = Number(id);
  var row = Db.get('corp_cards', id);
  if (!row) throw new Error('없는 카드입니다.');

  var used = Db.where('project_expenses', function (e) { return e.card_last4 === row.last4; }).length
    + Db.where('overheads', function (o) { return o.card_last4 === row.last4; }).length;

  if (used > 0) {
    Db.update('corp_cards', id, { is_active: 0 });
    return { ok: true, deactivated: true, used: used };
  }
  Db.remove('corp_cards', id);
  return { ok: true, deactivated: false };
}

/* ───────── 도우미 ───────── */
function merge_(a, b) {
  var out = {};
  for (var k in a) out[k] = a[k];
  for (var k2 in b) out[k2] = b[k2];
  return out;
}


/* ═════ Analytics.gs ═════ */
/**
 * 통합 분석 — PC 버전 routes/analytics.js 를 옮긴 것
 *
 * 한 화면에서 전체를 보고 필터로 좁혀 봅니다.
 *   · 매출 / 매입 / 이익  —  고객사별 · 월별 · 담당자별(혜움) · 영업별(외부)
 *   · 강사별 매입(강사료) · 협력사(운영)별 매입 · 법인카드별
 *   · 회사 경비(판관비)까지 뺀 영업이익
 *
 * 집계 기준(basis)
 *   start   첫 교육일이 속한 달 (기본 — 한 과정이 한 번만 잡힌다)
 *   invoice 세금계산서 발행일
 *   overlap 교육이 하루라도 있는 달 (여러 달에 중복 계상)
 */

/** 과정의 첫 교육일 (basis=start 에서 쓴다) */
function firstStart_(p) {
  var rs = schedOf(p);
  return rs.length && rs[0].s ? rs[0].s : '';
}

/** 이익과 이익률을 붙인다 */
function withProfit_(r) {
  var profit = (r.sales || 0) - (r.expenses || 0) - (r.overhead || 0);
  var o = shallow_(r);
  o.profit = profit;
  o.margin = r.sales ? (profit / r.sales) * 100 : 0;
  return o;
}

/** 빈 값을 기본 이름으로 바꾼다 */
function orElse_(v, fallback) {
  var s = (v === null || v === undefined) ? '' : String(v).trim();
  return s === '' ? fallback : s;
}

/**
 * 이름별로 묶어 합계를 낸다.
 * @param rows    원본 줄
 * @param nameFn  줄 → 묶을 이름
 * @param addFn   (누적칸, 줄) → 칸을 채운다
 * @param initFn  새 칸의 초기값
 */
function groupBy_(rows, nameFn, initFn, addFn) {
  var map = {}, order = [];
  rows.forEach(function (r) {
    var k = nameFn(r);
    if (!map[k]) { map[k] = initFn(k); order.push(k); }
    addFn(map[k], r);
  });
  return order.map(function (k) { return map[k]; });
}

/** 금액 많은 순 */
function descBy_(field) {
  return function (a, b) { return (b[field] || 0) - (a[field] || 0); };
}

/* ═══════════════ 분석 본체 ═══════════════ */

function analyticsGet(u, q) {
  q = q || {};
  var BASIS = ['start', 'invoice', 'overlap'].indexOf(q.basis) >= 0 ? q.basis : 'start';
  var y = String(q.year || new Date().getFullYear());
  var m = q.month ? pad2_(q.month) : '';

  var startDate = m ? y + '-' + m + '-01' : y + '-01-01';
  var endDate = m ? y + '-' + m + '-31' : y + '-12-31';

  // 과정별 세금계산서를 미리 묶어둔다 (basis=invoice 판정과 발행사 집계에 쓴다)
  var invByProj = {};
  Db.all('project_invoices').forEach(function (i) {
    (invByProj[i.project_id] = invByProj[i.project_id] || []).push(i);
  });

  /** 기간 안에 드는 과정인지 */
  var inPeriod = function (p, from, to) {
    if (BASIS === 'start') {
      var s = firstStart_(p);
      return !!s && s >= from && s <= to;
    }
    if (BASIS === 'invoice') {
      var list = invByProj[p.id] || [];
      for (var i = 0; i < list.length; i++) {
        var d = list[i].issue_date || '';
        if (d >= from && d <= to) return true;
      }
      return false;
    }
    return overlapsPeriod(p, from, to);
  };

  /**
   * 기간 + 선택한 필터 + 권한.
   * 회사(company)만 따로 뺀 이유는 아래 byCompany 때문이다.
   */
  var matchesNoCo = function (p, from, to) {
    if (!inPeriod(p, from || startDate, to || endDate)) return false;
    if (q.manager && p.manager !== q.manager) return false;
    if (q.sales_rep && p.sales_rep !== q.sales_rep) return false;
    if (q.client_id && p.client_id !== Number(q.client_id)) return false;
    if (q.type && p.type !== q.type) return false;
    if (!canSeeOthers(u) && p.created_by !== u.id) return false;
    return true;
  };

  var matches = function (p, from, to) {
    return matchesNoCo(p, from, to) && (!q.company || p.company === q.company);
  };

  var projects = Db.all('projects').filter(function (p) { return matches(p); });

  /*
   * 「전체 / 혜움컨설팅 / 그로우인」 칸에 쓸 집계.
   * 회사를 골라도 세 칸은 늘 제 값을 보여줘야 하므로 회사 필터를 빼고 센다.
   */
  var projectsAllCo = Db.all('projects').filter(function (p) { return matchesNoCo(p); });

  var clientName = {};
  Db.all('clients').forEach(function (c) { clientName[c.id] = c.name; });

  /* ── 합계 ── */
  var sales = 0, vat = 0, totalWithVat = 0, expenses = 0;
  projects.forEach(function (p) {
    sales += p.total_sales || 0;
    vat += p.vat || 0;
    totalWithVat += p.total_with_vat || 0;
    expenses += p.total_expenses || 0;
  });
  var profit = sales - expenses;

  /* ── 과정 기준 묶음 ── */
  var initPS = function (name) { return { name: name, count: 0, sales: 0, expenses: 0 }; };
  var addPS = function (o, p) {
    o.count++;
    o.sales += p.total_sales || 0;
    o.expenses += p.total_expenses || 0;
  };

  var byClient = groupBy_(projects,
    function (p) { return p.client_id && clientName[p.client_id] ? clientName[p.client_id] : '(미지정)'; },
    initPS, addPS).map(withProfit_).sort(descBy_('sales'));

  var byManager = groupBy_(projects,
    function (p) { return orElse_(p.manager, '(미지정)'); },
    initPS, addPS).map(withProfit_).sort(descBy_('sales'));

  var byType = groupBy_(projects,
    function (p) { return p.type; },
    initPS, addPS).map(withProfit_).sort(descBy_('sales'));

  // 회사 필터를 걸지 않은 수치 (세 칸이 늘 제 값을 보이도록)
  var byCompany = groupBy_(projectsAllCo,
    function (p) { return orElse_(p.company, '혜움컨설팅'); },
    initPS, addPS).map(withProfit_).sort(descBy_('sales'));

  /* ── 영업별 — 지급한 영업수수료도 함께 ── */
  var feeByProj = {};
  Db.all('project_expenses').forEach(function (e) {
    if (e.category === '영업수수료') {
      feeByProj[e.project_id] = (feeByProj[e.project_id] || 0) + (e.total_amount || 0);
    }
  });
  var bySalesRep = groupBy_(projects,
    function (p) { return orElse_(p.sales_rep, '(없음)'); },
    function (name) { return { name: name, count: 0, sales: 0, expenses: 0, fee: 0 }; },
    function (o, p) {
      addPS(o, p);
      o.fee += feeByProj[p.id] || 0;
    }).map(withProfit_).sort(descBy_('sales'));

  /* ── 세금계산서 발행사별 (실제 발행 기준) ── */
  var projIds = {};
  projects.forEach(function (p) { projIds[p.id] = true; });
  var invoicesIn = Db.all('project_invoices').filter(function (i) { return projIds[i.project_id]; });

  var byInvoiceCompany = groupBy_(invoicesIn,
    function (i) { return orElse_(i.company, '혜움컨설팅'); },
    function (name) { return { name: name, count: 0, supply: 0, vat: 0, total: 0, unpaid: 0 }; },
    function (o, i) {
      o.count++;
      o.supply += i.supply_amount || 0;
      o.vat += i.vat || 0;
      o.total += i.total_amount || 0;
      if (!i.paid_date) o.unpaid += i.total_amount || 0;
    }).sort(descBy_('supply'));

  /* ── 매입 ── */
  var expensesIn = Db.all('project_expenses').filter(function (e) { return projIds[e.project_id]; });

  var byExpenseCategory = groupBy_(expensesIn,
    function (e) { return e.category; },
    function (name) { return { name: name, count: 0, amount: 0, tax: 0, payment: 0 }; },
    function (o, e) {
      o.count++;
      o.amount += e.total_amount || 0;
      o.tax += e.tax_amount || 0;
      o.payment += e.payment_amount || 0;
    }).sort(descBy_('amount'));

  // 매입을 세율로 좁혀 볼 때 쓰는 조건 (강사·협력사 집계에만 건다)
  var taxOf = function (e) { return String(e.tax_type || ''); };
  var taxPass = function (e) { return !q.tax || taxOf(e) === q.tax; };

  var lectures = expensesIn.filter(function (e) { return e.category === '강의'; });

  /** 강의 매입을 세율별로 나눈다 — 원천징수인지 계산서인지 급여인지 */
  var instructorTax = groupBy_(lectures,
    function (e) { return orElse_(e.tax_type, '(미지정)'); },
    function (name) { return { name: name, count: 0, people: 0, amount: 0, tax: 0, payment: 0, _names: {} }; },
    function (o, e) {
      o.count++;
      o.amount += e.total_amount || 0;
      o.tax += e.tax_amount || 0;
      o.payment += e.payment_amount || 0;
      o._names[e.name] = true;
    }).map(function (o) {
      o.people = Object.keys(o._names).length;
      delete o._names;
      return o;
    }).sort(descBy_('amount'));

  /** 사람·업체 단위 매입 집계 (강사 · 협력사 공통) */
  var byPerson = function (rows) {
    return groupBy_(rows,
      function (e) { return orElse_(e.name, '(미지정)'); },
      function (name) {
        return {
          name: name, affiliation: '', code: 0, count: 0, project_count: 0,
          hours: 0, amount: 0, tax: 0, payment: 0, _projs: {}
        };
      },
      function (o, e) {
        o.count++;
        // MAX(...) 를 옮긴 것 — 값이 있는 쪽을 남긴다
        var aff = String(e.affiliation || '');
        if (aff > o.affiliation) o.affiliation = aff;
        if ((e.instructor_id || 0) > o.code) o.code = e.instructor_id || 0;
        o.hours += e.quantity || 0;
        o.amount += e.total_amount || 0;
        o.tax += e.tax_amount || 0;
        o.payment += e.payment_amount || 0;
        o._projs[e.project_id] = true;
      }).map(function (o) {
        o.project_count = Object.keys(o._projs).length;
        delete o._projs;
        return o;
      }).sort(descBy_('amount'));
  };

  var byInstructor = byPerson(lectures.filter(taxPass));
  var byPartner = byPerson(expensesIn.filter(function (e) {
    return e.category === '협력사(운영비)' && taxPass(e);
  }));

  /* ── 법인카드별 (카드 뒤 4자리) ── */
  var byCard = groupBy_(
    expensesIn.filter(function (e) { return e.category === '법인카드(교육운영)'; }),
    function (e) { return orElse_(e.card_last4, '(미지정)'); },
    function (name) {
      return { name: name, count: 0, project_count: 0, amount: 0, tax: 0, payment: 0, _projs: {} };
    },
    function (o, e) {
      o.count++;
      o.amount += e.total_amount || 0;
      o.tax += e.tax_amount || 0;
      o.payment += e.payment_amount || 0;
      o._projs[e.project_id] = true;
    }).map(function (o) {
      o.project_count = Object.keys(o._projs).length;
      delete o._projs;
      return o;
    }).sort(descBy_('amount'));

  /* ── 회사 경비(판관비) — 과정과 무관하므로 기간만 본다 ── */
  var ohPeriod = m ? y + '-' + m : y;
  var ohLen = m ? 7 : 4;
  var ohRows = Db.all('overheads').filter(function (o) {
    return String(o.spend_date || '').slice(0, ohLen) === ohPeriod;
  });
  var overheadTotal = { amount: 0, vat: 0, count: ohRows.length };
  ohRows.forEach(function (o) {
    overheadTotal.amount += o.amount || 0;
    overheadTotal.vat += o.vat || 0;
  });
  var overheadByCategory = groupBy_(ohRows,
    function (o) { return o.category; },
    function (name) { return { name: name, count: 0, amount: 0 }; },
    function (acc, o) { acc.count++; acc.amount += o.amount || 0; }
  ).sort(descBy_('amount'));

  /* ── 월별 (그 해 12개월 — 월 필터와 무관하게 늘 12칸) ── */
  var ohByMonth = {};
  Db.all('overheads').forEach(function (o) {
    var k = String(o.spend_date || '').slice(0, 7);
    ohByMonth[k] = (ohByMonth[k] || 0) + (o.amount || 0);
  });

  var allProjects = Db.all('projects');
  var byMonth = [];
  for (var i = 1; i <= 12; i++) {
    var mm = pad2_(i);
    var from = y + '-' + mm + '-01', to = y + '-' + mm + '-31';
    var r = { month: mm, count: 0, sales: 0, expenses: 0, overhead: ohByMonth[y + '-' + mm] || 0 };
    allProjects.forEach(function (p) {
      if (!matches(p, from, to)) return;
      r.count++;
      r.sales += p.total_sales || 0;
      r.expenses += p.total_expenses || 0;
    });
    byMonth.push(withProfit_(r));
  }

  /* ── 필터 선택지 ── */
  var yearSet = {};
  allProjects.forEach(function (p) {
    var s = firstStart_(p);
    if (s) yearSet[s.slice(0, 4)] = true;
  });

  // 명단에 있는 사람 + 과정에 이미 쓰인 이름을 합친다 (아직 실적이 없어도 고를 수 있도록)
  var mergeNames = function (kind, col) {
    var set = {};
    Db.all('staff').forEach(function (s) {
      if (s.kind === kind && s.is_active) set[s.name] = true;
    });
    allProjects.forEach(function (p) {
      if (String(p[col] || '').trim()) set[p[col]] = true;
    });
    return Object.keys(set).sort(koSort_);
  };

  var typeSet = {};
  allProjects.forEach(function (p) { if (p.type) typeSet[p.type] = true; });

  var usedClients = {};
  allProjects.forEach(function (p) { if (p.client_id) usedClients[p.client_id] = true; });

  var filters = {
    years: Object.keys(yearSet).sort().reverse(),
    managers: mergeNames('직원', 'manager'),
    salesReps: mergeNames('영업', 'sales_rep'),
    types: Object.keys(typeSet).sort(),
    companies: COMPANIES,
    clients: Db.all('clients').filter(function (c) { return usedClients[c.id]; })
      .sort(byName_).map(function (c) { return { id: c.id, name: c.name }; })
  };

  return {
    period: {
      year: y, month: m || null, basis: BASIS,
      manager: q.manager || null, sales_rep: q.sales_rep || null,
      client_id: q.client_id ? Number(q.client_id) : null,
      type: q.type || null, company: q.company || null
    },
    summary: {
      sales: sales, vat: vat, total_with_vat: totalWithVat,
      expenses: expenses, profit: profit,
      margin: sales ? (profit / sales) * 100 : 0,
      count: projects.length,
      overhead: overheadTotal.amount,
      overhead_count: overheadTotal.count,
      operating_profit: profit - overheadTotal.amount,
      operating_margin: sales ? ((profit - overheadTotal.amount) / sales) * 100 : 0
    },
    byClient: byClient, byMonth: byMonth, byManager: byManager, bySalesRep: bySalesRep,
    byType: byType, byCompany: byCompany, byInvoiceCompany: byInvoiceCompany,
    byExpenseCategory: byExpenseCategory, byInstructor: byInstructor,
    instructorTax: instructorTax, byPartner: byPartner, byCard: byCard,
    overheadByCategory: overheadByCategory,
    filters: filters
  };
}

/**
 * 항목 하나의 세부 내역.
 *   kind  instructor | partner | card | client | manager | rep
 *   key   그 항목의 이름
 */
function analyticsDetail(u, q) {
  q = q || {};
  if (!q.kind || !q.key) throw new Error('무엇을 볼지 알려주세요.');

  var BASIS = ['start', 'invoice', 'overlap'].indexOf(q.basis) >= 0 ? q.basis : 'start';
  var y = String(q.year || new Date().getFullYear());
  var m = q.month ? pad2_(q.month) : '';
  var from = m ? y + '-' + m + '-01' : y + '-01-01';
  var to = m ? y + '-' + m + '-31' : y + '-12-31';

  var invByProj = {};
  Db.all('project_invoices').forEach(function (i) {
    (invByProj[i.project_id] = invByProj[i.project_id] || []).push(i);
  });

  var inPeriod = function (p) {
    if (BASIS === 'start') {
      var s = firstStart_(p);
      return !!s && s >= from && s <= to;
    }
    if (BASIS === 'invoice') {
      var list = invByProj[p.id] || [];
      for (var i = 0; i < list.length; i++) {
        var d = list[i].issue_date || '';
        if (d >= from && d <= to) return true;
      }
      return false;
    }
    return overlapsPeriod(p, from, to);
  };

  var projOk = {};
  var clientName = {};
  Db.all('clients').forEach(function (c) { clientName[c.id] = c.name; });

  var projById = {};
  Db.all('projects').forEach(function (p) {
    projById[p.id] = p;
    if (!inPeriod(p)) return;
    if (!canSeeOthers(u) && p.created_by !== u.id) return;
    projOk[p.id] = true;
  });

  /* 매입에서 뽑는 항목 (강사 · 협력사 · 법인카드) */
  var EXP_KIND = {
    instructor: '강의',
    partner: '협력사(운영비)',
    card: '법인카드(교육운영)'
  };

  if (EXP_KIND[q.kind]) {
    var nameOf = q.kind === 'card'
      ? function (e) { return orElse_(e.card_last4, '(미지정)'); }
      : function (e) { return orElse_(e.name, '(미지정)'); };

    var rows = Db.all('project_expenses').filter(function (e) {
      if (e.category !== EXP_KIND[q.kind]) return false;
      if (!projOk[e.project_id]) return false;
      if (nameOf(e) !== q.key) return false;
      if (q.tax && String(e.tax_type || '') !== q.tax) return false;
      return true;
    }).map(function (e) {
      var p = projById[e.project_id] || {};
      return {
        id: e.id, project_id: e.project_id, name: e.name, affiliation: e.affiliation,
        card_last4: e.card_last4, quantity: e.quantity, unit: e.unit,
        unit_price: e.unit_price, sessions: e.sessions,
        total_amount: e.total_amount, tax_type: e.tax_type, tax_amount: e.tax_amount,
        payment_amount: e.payment_amount, payment_date: e.payment_date, note: e.note,
        course_name: p.course_name, type: p.type, manager: p.manager, sales_rep: p.sales_rep,
        schedule_dates: normalizeSchedule(p.schedule_dates, p.schedule_type),
        client_name: p.client_id ? (clientName[p.client_id] || null) : null,
        _sort: firstStart_(p)
      };
    }).sort(function (a, b) { return cmp_(b._sort, a._sort) || (b.id - a.id); });

    rows.forEach(function (r) { delete r._sort; });

    var t = { count: rows.length, amount: 0, tax: 0, payment: 0, hours: 0 };
    rows.forEach(function (r) {
      t.amount += r.total_amount || 0;
      t.tax += r.tax_amount || 0;
      t.payment += r.payment_amount || 0;
      t.hours += r.quantity || 0;
    });
    return { kind: q.kind, key: q.key, rows: rows, totals: t };
  }

  /* 과정에서 뽑는 항목 (고객사 · 담당자 · 영업) */
  var KEYOF = {
    client:  function (p) { return p.client_id && clientName[p.client_id] ? clientName[p.client_id] : '(미지정)'; },
    manager: function (p) { return orElse_(p.manager, '(미지정)'); },
    rep:     function (p) { return orElse_(p.sales_rep, '(없음)'); }
  };
  if (!KEYOF[q.kind]) throw new Error('알 수 없는 항목입니다.');

  var invCnt = {}, unpaidSum = {};
  Db.all('project_invoices').forEach(function (i) {
    invCnt[i.project_id] = (invCnt[i.project_id] || 0) + 1;
    if (!i.paid_date) unpaidSum[i.project_id] = (unpaidSum[i.project_id] || 0) + (i.total_amount || 0);
  });

  var prows = Db.all('projects').filter(function (p) {
    return projOk[p.id] && KEYOF[q.kind](p) === q.key;
  }).map(function (p) {
    return {
      id: p.id, course_name: p.course_name, type: p.type,
      manager: p.manager, sales_rep: p.sales_rep,
      schedule_dates: normalizeSchedule(p.schedule_dates, p.schedule_type),
      total_sales: p.total_sales, vat: p.vat, total_with_vat: p.total_with_vat,
      total_expenses: p.total_expenses,
      client_name: p.client_id ? (clientName[p.client_id] || null) : null,
      invoice_count: invCnt[p.id] || 0,
      unpaid: unpaidSum[p.id] || 0,
      _sort: firstStart_(p)
    };
  }).sort(function (a, b) { return cmp_(b._sort, a._sort) || (b.id - a.id); });

  prows.forEach(function (r) { delete r._sort; });

  var pt = { count: prows.length, sales: 0, expenses: 0, profit: 0, unpaid: 0 };
  prows.forEach(function (r) {
    pt.sales += r.total_sales || 0;
    pt.expenses += r.total_expenses || 0;
    pt.profit += (r.total_sales || 0) - (r.total_expenses || 0);
    pt.unpaid += r.unpaid || 0;
  });

  return { kind: q.kind, key: q.key, rows: prows, totals: pt };
}

/* ───────── 도우미 ───────── */

function pad2_(v) {
  var s = String(v);
  return s.length >= 2 ? s : '0' + s;
}

/** 한글 가나다순 */
function koSort_(a, b) {
  return String(a).localeCompare(String(b), 'ko');
}


/* ═════ Dashboard.gs ═════ */
/**
 * 대시보드 — PC 버전 routes/export.js 의 /dashboard/summary 를 옮긴 것
 *
 * 집계 기준
 *   start   교육 시작월  — 첫 교육일이 속한 달에만 넣는다 (중복 없음, 기본)
 *   invoice 계산서 발행월 — 세금계산서 발행일 기준 (회계 인식 시점)
 *   overlap 교육 진행월  — 그 달에 교육이 하루라도 있으면 포함 (여러 달에 중복 계상)
 */
function dashboardSummary(u, q) {
  q = q || {};
  var BASIS = ['start', 'invoice', 'overlap'].indexOf(q.basis) >= 0 ? q.basis : 'start';
  var y = String(q.year || new Date().getFullYear());
  var m = q.month ? pad2_(q.month) : '';

  var startDate = m ? y + '-' + m + '-01' : y + '-01-01';
  var endDate = m ? y + '-' + m + '-31' : y + '-12-31';

  var invByProj = {};
  Db.all('project_invoices').forEach(function (i) {
    (invByProj[i.project_id] = invByProj[i.project_id] || []).push(i);
  });

  var inPeriod = function (p, from, to) {
    if (BASIS === 'start') {
      var s = firstStart_(p);
      return !!s && s >= from && s <= to;
    }
    if (BASIS === 'invoice') {
      var list = invByProj[p.id] || [];
      for (var i = 0; i < list.length; i++) {
        var d = list[i].issue_date || '';
        if (d >= from && d <= to) return true;
      }
      return false;
    }
    return overlapsPeriod(p, from, to);
  };

  /**
   * 기간·회사와 무관한 조건 (담당자 · 권한).
   * 회사를 여기서 빼둔 이유는 아래 byCompany 때문이다.
   */
  var baseOk = function (p) {
    if (q.manager && p.manager !== q.manager) return false;
    if (!canSeeOthers(u) && p.created_by !== u.id) return false;
    return true;
  };

  /** 고른 회사인지 */
  var companyOk = function (p) {
    return !q.company || p.company === q.company;
  };

  var matches = function (p, from, to) {
    return baseOk(p) && companyOk(p) && inPeriod(p, from || startDate, to || endDate);
  };

  var allProjects = Db.all('projects');
  var projects = allProjects.filter(function (p) { return matches(p); });

  /*
   * 화면 맨 위의 「전체 / 혜움컨설팅 / 그로우인」 칸에 쓸 집계.
   *
   * 이것만은 회사 필터를 걸지 않는다. 그로우인을 골랐다고 해서
   * 전체와 혜움컨설팅 칸까지 0 이 되면 안 되기 때문이다.
   */
  var projectsAllCo = allProjects.filter(function (p) {
    return baseOk(p) && inPeriod(p, startDate, endDate);
  });

  var clientName = {}, uName = {};
  Db.all('clients').forEach(function (c) { clientName[c.id] = c.name; });
  Db.all('users').forEach(function (x) { uName[x.id] = x.name; });

  /* ── 합계 ── */
  var totalSales = 0, totalVat = 0, totalWithVat = 0, totalExpenses = 0;
  projects.forEach(function (p) {
    totalSales += p.total_sales || 0;
    totalVat += p.vat || 0;
    totalWithVat += p.total_with_vat || 0;
    totalExpenses += p.total_expenses || 0;
  });
  var profit = totalSales - totalExpenses;

  /* ── 구분별 ── */
  var salesByType = groupBy_(projects,
    function (p) { return p.type; },
    function (name) { return { type: name, total: 0, count: 0 }; },
    function (o, p) { o.total += p.total_sales || 0; o.count++; }
  ).sort(descBy_('total'));

  /* ── 매입 분류별 ── */
  var projIds = {};
  projects.forEach(function (p) { projIds[p.id] = true; });
  var expenseByCategory = groupBy_(
    Db.all('project_expenses').filter(function (e) { return projIds[e.project_id]; }),
    function (e) { return e.category; },
    function (name) { return { category: name, total: 0 }; },
    function (o, e) { o.total += e.total_amount || 0; }
  ).sort(descBy_('total'));

  /* ── 회사별 (혜움컨설팅 / 그로우인) — 회사 필터를 걸지 않은 수치 ── */
  var byCompany = groupBy_(projectsAllCo,
    function (p) { return orElse_(p.company, '혜움컨설팅'); },
    function (name) { return { company: name, count: 0, sales: 0, expenses: 0 }; },
    function (o, p) {
      o.count++;
      o.sales += p.total_sales || 0;
      o.expenses += p.total_expenses || 0;
    }
  ).map(function (r) {
    r.profit = r.sales - r.expenses;
    r.margin = r.sales ? (r.profit / r.sales) * 100 : 0;
    return r;
  }).sort(descBy_('sales'));

  /* ── 담당자별 ── */
  var byManager = groupBy_(projects,
    function (p) { return orElse_(p.manager, '(미지정)'); },
    function (name) { return { manager: name, count: 0, sales: 0, expenses: 0 }; },
    function (o, p) {
      o.count++;
      o.sales += p.total_sales || 0;
      o.expenses += p.total_expenses || 0;
    }
  ).sort(descBy_('sales'));

  /* ── 고객사 상위 5 ── */
  var topClients = groupBy_(projects,
    function (p) { return p.client_id && clientName[p.client_id] ? clientName[p.client_id] : '(미지정)'; },
    function (name) { return { name: name, count: 0, sales: 0 }; },
    function (o, p) { o.count++; o.sales += p.total_sales || 0; }
  ).sort(descBy_('sales')).slice(0, 5);

  /* ── 월별 추이 (그 해 12개월) ── */
  var monthly = [];
  for (var i = 1; i <= 12; i++) {
    var mm = pad2_(i);
    var from = y + '-' + mm + '-01', to = y + '-' + mm + '-31';
    var r = { month: mm, count: 0, sales: 0, expenses: 0 };
    allProjects.forEach(function (p) {
      if (!matches(p, from, to)) return;
      r.count++;
      r.sales += p.total_sales || 0;
      r.expenses += p.total_expenses || 0;
    });
    r.profit = r.sales - r.expenses;
    monthly.push(r);
  }

  /* ── 미수금 (기간과 무관한 전체 잔액) ── */
  var projById = {};
  allProjects.forEach(function (p) { projById[p.id] = p; });

  var unpaidRows = Db.all('project_invoices').filter(function (i) {
    if (i.paid_date) return false;
    var p = projById[i.project_id];
    return !!p && baseOk(p);
  });

  var receivable = { supply: 0, amount: 0, count: unpaidRows.length, list: [] };
  unpaidRows.forEach(function (i) {
    receivable.supply += i.supply_amount || 0;
    receivable.amount += i.total_amount || 0;
  });

  /* ── 미수금 상위 (오래된 순) ── */
  receivable.list = unpaidRows.slice().sort(function (a, b) {
    return cmp_(a.issue_date || '9999', b.issue_date || '9999');
  }).slice(0, 5).map(function (i) {
    var p = projById[i.project_id];
    return {
      id: p.id, course_name: p.course_name,
      client_name: p.client_id ? (clientName[p.client_id] || null) : null,
      seq: i.seq, supply_amount: i.supply_amount,
      total_amount: i.total_amount, issue_date: i.issue_date
    };
  });

  /*
   * 매입 누락 (매출은 있는데 매입이 하나도 없는 과정).
   *
   * 기간을 따지지 않는다. 지급을 빠뜨린 것은 언제 것이든 찾아야 하고,
   * 이 경고를 눌렀을 때 보여주는 목록도 기간을 안 따지기 때문이다.
   * (숫자가 서로 다르면 눌러보고 헷갈린다)
   */
  /*
   * 「확인함」을 눌러 둔 과정은 세지 않는다.
   * 들여다보고 괜찮다고 판단한 건까지 계속 떠 있으면 경고를 아예 안 보게 된다.
   *
   * 직원에게는 아예 0 으로 준다 — 이 경고는 관리자만 다룬다.
   */
  var missingExpense = 0;
  if (isAdmin(u)) {
    var checked = checkedMap_('missing_expense');
    missingExpense = allProjects.filter(function (p) {
      if (checked[p.id]) return false;
      return baseOk(p) && (p.total_sales || 0) > 0 && (p.total_expenses || 0) === 0;
    }).length;
  }

  /* ── 최근 등록 ── */
  var recentProjects = allProjects.filter(baseOk).slice()
    .sort(function (a, b) { return cmp_(b.created_at, a.created_at); })
    .slice(0, 5).map(function (p) {
      var o = shallow_(p);
      o.client_name = p.client_id ? (clientName[p.client_id] || null) : null;
      o.created_by_name = uName[p.created_by] || null;
      parseSchedule(o);
      return o;
    });

  /* ── 필터 선택지 ── */
  var yearSet = {}, mgrSet = {};
  allProjects.forEach(function (p) {
    if (p.created_at) yearSet[String(p.created_at).slice(0, 4)] = true;
    if (String(p.manager || '').trim()) mgrSet[p.manager] = true;
  });

  return {
    period: { year: y, month: m, manager: q.manager || null, company: q.company || null, basis: BASIS },
    summary: {
      total_sales: totalSales, total_vat: totalVat, total_with_vat: totalWithVat,
      total_expenses: totalExpenses, profit: profit,
      margin: totalSales ? (profit / totalSales) * 100 : 0,
      project_count: projects.length,
      avg_sales: projects.length ? Math.round(totalSales / projects.length) : 0
    },
    receivable: receivable,
    alerts: { missingExpense: missingExpense },
    /*
     * 교육진행 — 고른 기간에 실제로 현장에 다녀온 것.
     * 기간에 걸친 날만 센다 (8/28~9/3 을 8월로 보면 4일).
     * 과정을 거르는 잣대는 위와 같게 baseOk 를 그대로 쓴다.
     */
    visits: visitsDigest_(startDate, endDate, baseOk),
    salesByType: salesByType, expenseByCategory: expenseByCategory,
    byManager: byManager, byCompany: byCompany, topClients: topClients,
    monthly: monthly, recentProjects: recentProjects,
    filters: {
      years: Object.keys(yearSet).sort().reverse(),
      managers: Object.keys(mgrSet).sort(),
      companies: COMPANIES
    }
  };
}


/* ═════ Invoices.gs ═════ */
/**
 * 세금계산서 · 회사 경비(판관비) · 사용자
 * PC 버전 routes/{invoices,overheads,auth}.js 를 옮긴 것
 */

/* ═══════════════ 세금계산서 ═══════════════
 * 과정 등록 화면에서는 「발행」에 필요한 것만 적습니다.
 * 입금 확인은 돈이 들어온 뒤에 하는 별개의 일이라 여기에서 처리합니다.
 */

/**
 * 목록
 *   year / month   발행일 기준
 *   company        발행회사
 *   status         unpaid(미수) | paid(입금완료) | 빈값(전체)
 *   q              고객사 · 과정명 · 받는사람 검색
 */
function invoicesList(u, q) {
  q = q || {};
  var clientName = {}, projById = {};
  Db.all('clients').forEach(function (c) { clientName[c.id] = c.name; });
  Db.all('projects').forEach(function (p) { projById[p.id] = p; });

  var raw = isAdmin(u);
  var kw = String(q.q || '').toLowerCase();
  var reqMap = invoiceRequestMap_();

  var rows = Db.all('project_invoices').filter(function (i) {
    var p = projById[i.project_id];
    if (!p) return false;                                  // 과정이 없으면 뺀다 (JOIN 과 같다)

    if (q.year) {
      var d = String(i.issue_date || '');
      if (q.month) {
        if (d.slice(0, 7) !== q.year + '-' + pad2_(q.month)) return false;
      } else {
        if (d.slice(0, 4) !== String(q.year)) return false;
      }
    }
    if (q.company && (i.company || COMPANIES[0]) !== q.company) return false;

    /*
     * 요청한 사람으로 거르기. (대표님 지시 2026-10-26)
     *   '-' 는 「아직 요청 안 한 것」을 뜻한다.
     */
    if (q.requester) {
      var rq0 = reqMap[reqKey_(i.project_id, i.seq)];
      if (q.requester === '-') { if (rq0) return false; }
      else if (!rq0 || rq0.sent_key !== q.requester) return false;
    }
    if (q.status === 'unpaid' && i.paid_date) return false;
    if (q.status === 'paid' && !i.paid_date) return false;
    if (kw) {
      var hay = [clientName[p.client_id], p.course_name, i.recipients]
        .map(function (x) { return String(x || '').toLowerCase(); }).join(' ');
      if (hay.indexOf(kw) < 0) return false;
    }
    if (!canSeeOthers(u) && p.created_by !== u.id) return false;
    return true;
  }).map(function (i) {
    var p = projById[i.project_id];
    var o = shallow_(i);
    o.course_name = p.course_name;
    o.manager = p.manager;
    o.schedule_dates = normalizeSchedule(p.schedule_dates, p.schedule_type);
    o.project_company = p.company;
    o.client_name = p.client_id ? (clientName[p.client_id] || null) : null;
    o.company = i.company || COMPANIES[0];
    var people = unwrap_(i.recipients, []);
    // 관리자가 아니면 이메일·연락처를 가려서 보낸다
    o.recipients = raw ? people : maskRecipients(people);
    o.items = unwrap_(i.items, []);
    // 발행요청을 보냈는지 (언제 · 누가 · 몇 번)
    var rq = reqMap[reqKey_(i.project_id, i.seq)];
    o.requested = !!rq;
    o.requested_at = rq ? rq.sent_at : null;
    o.requested_by = rq ? rq.sent_by : null;
    o.requested_count = rq ? rq.count : 0;
    o.requested_key = rq ? rq.sent_key : null;
    return o;
  }).sort(function (a, b) {
    // 미수를 먼저, 그 안에서 오래된 발행 순 — 챙겨야 할 것이 위로 오게
    var pa = a.paid_date ? 1 : 0, pb = b.paid_date ? 1 : 0;
    if (pa !== pb) return pa - pb;
    return cmp_(a.issue_date || '9999', b.issue_date || '9999') || (a.id - b.id);
  });

  var sum = function (f, filter) {
    var t = 0;
    rows.forEach(function (r) { if (!filter || filter(r)) t += r[f] || 0; });
    return t;
  };
  var unpaid = function (r) { return !r.paid_date; };

  var yearSet = {};
  Db.all('project_invoices').forEach(function (i) {
    if (i.issue_date) yearSet[String(i.issue_date).slice(0, 4)] = true;
  });

  return {
    invoices: rows,
    totals: {
      count: rows.length,
      supply: sum('supply_amount'),
      vat: sum('vat'),
      total: sum('total_amount'),
      unpaidCount: rows.filter(unpaid).length,
      unpaid: sum('total_amount', unpaid)
    },
    byCompany: COMPANIES.map(function (c) {
      var l = rows.filter(function (r) { return r.company === c; });
      var t = function (arr, f) {
        var s = 0; arr.forEach(function (r) { s += r[f] || 0; }); return s;
      };
      return {
        company: c, count: l.length,
        supply: t(l, 'supply_amount'),
        total: t(l, 'total_amount'),
        unpaid: t(l.filter(unpaid), 'total_amount')
      };
    }),
    filters: {
      years: Object.keys(yearSet).sort().reverse(),
      companies: COMPANIES,
      // 실제로 요청한 적이 있는 사람만 고를 수 있게 한다
      requesters: invoiceRequesters_()
    }
  };
}

/**
 * 발행요청을 보낸 적이 있는 사람들 — 거르개에 쓴다.
 * 아무도 안 보냈으면 빈 목록이라 거르개도 안 나온다.
 */
function invoiceRequesters_() {
  var seen = {}, out = [];
  Db.all('invoice_requests').forEach(function (r) {
    var k = userKey_(r.sent_by);
    if (!k || seen[k]) return;
    seen[k] = true;
    out.push({ key: k, name: personNameOf(r.sent_by, r.sent_by) });
  });
  return out.sort(function (a, b) { return cmp_(a.name, b.name); });
}

/**
 * 전에 계산서를 받았던 사람 찾기 (이름 첫 글자로)
 * 같은 이름이 여러 번 나오면 가장 최근에 쓴 이메일·연락처를 준다.
 */
/*
 * 계산서 받는 사람 찾기.
 *
 * 두 군데서 모아 온다 (대표님 지시 2026-10-28)
 *   ① 그 고객사의 담당자  — 대개 이분들께 보낸다
 *   ② 지난 계산서의 받는 사람 — 이메일·연락처가 거기 적혀 있다
 *
 * 담당자 표에는 이메일·연락처 칸이 없다. 그래서 같은 이름이 지난
 * 계산서에도 있으면 거기 적힌 이메일·연락처를 끌어다 채워 준다.
 * 처음 보내는 분이면 비워서 보내고, 화면에서 적으시면 된다.
 *
 * 세금계산서 담당자가 따로 있는 경우가 있어, 목록에 없는 이름도
 * 그대로 적어 쓸 수 있다 (화면이 적은 글자를 그냥 쓴다).
 *
 * @param q  { q: 찾는 글자, client_id: 그 과정의 고객사 }
 */
function invoiceRecipients(u, q) {
  q = q || {};
  var kw = String(q.q || '').trim().toLowerCase();
  var clientId = Number(q.client_id) || 0;

  /* ── ② 지난 계산서에 적힌 분들 — 이름으로 찾아 쓸 수 있게 ──
   *
   * 고객사를 고르셨으면 **그 고객사에 보낸 계산서만** 본다.
   * 안 그러면 다라물산 계산서를 쓰는데 가나상사 담당자가 섞여 나온다.
   * 엉뚱한 분께 보낼 위험이고, 고객사끼리 정보가 새는 길이기도 하다.
   * (시험이 잡아냈다 2026-10-28)
   */
  var mineProj = null;
  if (clientId) {
    mineProj = {};
    Db.where('projects', function (p) {
      return Number(p.client_id) === clientId;
    }).forEach(function (p) { mineProj[p.id] = true; });
  }

  var past = {};
  Db.all('project_invoices').slice()
    .sort(function (a, b) { return b.id - a.id; })   // 최근 것부터 (같은 이름은 최근 것을 쓴다)
    .forEach(function (r) {
      if (mineProj && !mineProj[r.project_id]) return;
      unwrap_(r.recipients, []).forEach(function (p) {
        var name = String((p && p.name) || '').trim();
        if (!name) return;
        var key = name.toLowerCase();
        if (past[key]) return;
        past[key] = {
          name: name,
          email: String((p && p.email) || '').trim(),
          phone: String((p && p.phone) || '').trim()
        };
      });
    });

  var seen = {}, list = [];
  var add = function (o) {
    var key = String(o.name || '').toLowerCase();
    if (!key || seen[key]) return;
    seen[key] = true;
    list.push(o);
  };

  /* ── ① 그 고객사의 담당자를 먼저 ── */
  if (clientId) {
    Db.where('contacts', function (c) {
      return c.is_active && Number(c.client_id) === clientId;
    }).sort(byName_).forEach(function (c) {
      var hit = past[String(c.name || '').trim().toLowerCase()] || {};
      add({
        name: String(c.name || '').trim(),
        email: hit.email || '',
        phone: hit.phone || '',
        /* 직급·부서는 동명이인을 가리는 데 쓴다 */
        affiliation: [c.position, c.department].filter(Boolean).join(' · '),
        _from: '담당자'
      });
    });
  }

  /* ── ② 그 뒤에 지난 계산서에서 ── */
  Object.keys(past).forEach(function (k) {
    add(Object.assign({}, past[k], { _from: '지난 계산서' }));
  });

  if (kw) {
    list = list.filter(function (p) {
      return String(p.name).toLowerCase().indexOf(kw) === 0;
    });
  }
  list = list.slice(0, 12);

  // 관리자가 아니면 가린 값만 내보낸다
  if (isAdmin(u)) return { recipients: list };
  var masked = maskRecipients(list);
  /* 가려도 「어디서 왔는지」와 직급은 남긴다 — 누구인지 가리는 데 필요하다 */
  masked.forEach(function (m, i) {
    m._from = list[i]._from;
    m.affiliation = list[i].affiliation || '';
  });
  return { recipients: masked };
}

/** 입금일만 바꾼다 — 비우면 다시 미수가 된다 */
function invoiceSetPaid(u, id, b) {
  requireAdmin(u);
  id = Number(id);
  if (!Db.get('project_invoices', id)) throw new Error('없는 계산서입니다.');

  var d = String((b && b.paid_date) || '').slice(0, 10);
  if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error('입금일 형식이 올바르지 않습니다.');

  Db.update('project_invoices', id, { paid_date: d || null });
  return { id: id, paid_date: d || null };
}

/* ═══════════════ 회사 경비(판관비) ═══════════════
 * 과정에 붙지 않는 회사 차원의 지출입니다.
 * 과정 이익은 매출 − 과정매입으로 보고, 여기 담긴 경비는 그 뒤에 빼서 영업이익을 봅니다.
 */

/** 경비 분류 — 화면의 선택지와 같은 순서 */
var OVERHEAD_CATEGORIES = [
  '급여', '4대보험', '퇴직금',
  '사무실운영비', '법인카드(직원)', '현금출금(경조사)', '기타'
];

/** 부가세 처리 */
var OVERHEAD_TAX = ['해당없음', '세금계산서(과세)', '세금계산서(면세)', '카드(과세)'];

function cleanOverhead_(b) {
  var amount = Math.max(0, parseInt(b.amount, 10) || 0);
  var taxType = OVERHEAD_TAX.indexOf(b.tax_type) >= 0 ? b.tax_type : '해당없음';
  // 과세면 부가세를 따로 적어둔다 (직접 입력값이 있으면 그것을 존중)
  var vat = parseInt(b.vat, 10);
  if (isNaN(vat)) vat = taxType.indexOf('과세') >= 0 ? Math.round(amount * 0.1) : 0;

  return {
    spend_date: String(b.spend_date || '').slice(0, 10),
    card_last4: (String(b.card_last4 || '').replace(/[^0-9]/g, '').slice(0, 4)) || null,
    category: OVERHEAD_CATEGORIES.indexOf(b.category) >= 0 ? b.category : '기타',
    name: trim_(b.name),
    amount: amount,
    vat: Math.max(0, vat),
    tax_type: taxType,
    note: trim_(b.note)
  };
}

function overheadsList(u, q) {
  q = q || {};
  var uName = {};
  Db.all('users').forEach(function (x) { uName[x.id] = x.name; });
  var kw = String(q.q || '').toLowerCase();

  var rows = Db.all('overheads').filter(function (o) {
    var d = String(o.spend_date || '');
    if (q.year) {
      if (q.month) {
        if (d.slice(0, 7) !== q.year + '-' + pad2_(q.month)) return false;
      } else {
        if (d.slice(0, 4) !== String(q.year)) return false;
      }
    }
    if (q.category && o.category !== q.category) return false;
    if (kw && !like_(o.name, kw) && !like_(o.note, kw)) return false;
    return true;
  }).map(function (o) {
    var x = shallow_(o);
    x.created_by_name = uName[o.created_by] || null;
    return x;
  }).sort(function (a, b) {
    return cmp_(b.spend_date, a.spend_date) || (b.id - a.id);
  });

  var total = 0, totalVat = 0;
  rows.forEach(function (r) { total += r.amount || 0; totalVat += r.vat || 0; });

  var byCategory = OVERHEAD_CATEGORIES.map(function (c) {
    var list = rows.filter(function (r) { return r.category === c; });
    var amt = 0; list.forEach(function (r) { amt += r.amount || 0; });
    return { category: c, count: list.length, amount: amt };
  }).filter(function (r) { return r.count > 0; });

  var yearSet = {};
  Db.all('overheads').forEach(function (o) {
    if (o.spend_date) yearSet[String(o.spend_date).slice(0, 4)] = true;
  });

  // 전에 쓴 법인카드 뒤 4자리 (입력칸 자동완성용) — 과정 매입에 쓴 것까지 모은다
  var cardSet = {};
  Db.all('overheads').forEach(function (o) { if (o.card_last4) cardSet[o.card_last4] = true; });
  Db.all('project_expenses').forEach(function (e) { if (e.card_last4) cardSet[e.card_last4] = true; });

  return {
    overheads: rows,
    totals: { count: rows.length, amount: total, vat: totalVat },
    byCategory: byCategory,
    filters: {
      years: Object.keys(yearSet).sort().reverse(),
      categories: OVERHEAD_CATEGORIES,
      taxTypes: OVERHEAD_TAX,
      cards: Object.keys(cardSet).sort()
    }
  };
}

function overheadsCreate(u, b) {
  var d = cleanOverhead_(b);
  if (!d.spend_date) throw new Error('지출일을 입력하세요.');
  if (!d.name) throw new Error('내역을 입력하세요.');
  d.created_by = u.id;
  var r = Db.insert('overheads', d);
  return merge_({ id: r.id }, d);
}

function overheadsUpdate(u, id, b) {
  id = Number(id);
  var row = Db.get('overheads', id);
  if (!row) throw new Error('없는 항목입니다.');
  if (!canEditOverhead(u, row)) {
    throw new Error('본인이 등록한 항목만 수정할 수 있습니다.');
  }
  var d = cleanOverhead_(b);
  if (!d.spend_date) throw new Error('지출일을 입력하세요.');
  if (!d.name) throw new Error('내역을 입력하세요.');
  Db.update('overheads', id, d);
  return merge_({ id: id }, d);
}

function overheadsDelete(u, id) {
  id = Number(id);
  var row = Db.get('overheads', id);
  if (!row) throw new Error('없는 항목입니다.');
  if (!canEditOverhead(u, row)) {
    throw new Error('본인이 등록한 항목만 삭제할 수 있습니다.');
  }
  Db.remove('overheads', id);
  return { ok: true };
}

/* ═══════════════ 사용자 ═══════════════
 * 아이디 + 비밀번호로 들어옵니다.
 * 비밀번호는 소금을 붙인 해시로만 저장하므로 시트를 봐도 알 수 없습니다.
 */

/** 화면으로 내보낼 때 비밀번호 관련 칸은 절대 붙이지 않는다 */
function safeUser_(x) {
  return {
    id: x.id, username: x.username, name: x.name,
    role: x.role, is_active: x.is_active,
    created_at: x.created_at, last_login: x.last_login
  };
}

function usersList(u) {
  requireAdmin(u);
  return {
    users: Db.all('users').slice().sort(function (a, b) {
      return cmp_(a.id - b.id);
    }).map(safeUser_)
  };
}

/** 사용자 추가 */
function usersCreate(u, b) {
  requireAdmin(u);
  var username = String(b.username || '').trim();
  var password = String(b.password || '');
  var name = trim_(b.name);

  if (!username || !password || !name) {
    throw new Error('아이디, 비밀번호, 이름을 모두 입력해주세요.');
  }
  if (password.length < 4) throw new Error('비밀번호는 4자 이상으로 해주세요.');

  if (findUser_(username)) throw new Error('이미 존재하는 아이디입니다.');

  var role = b.role === 'admin' ? 'admin' : 'user';
  var salt = newSalt();
  var r = Db.insert('users', {
    username: username, salt: salt, password_hash: hashPassword(password, salt),
    name: name, role: role, is_active: 1
  });

  return {
    message: '사용자가 등록되었습니다.',
    user: { id: r.id, username: username, name: name, role: role }
  };
}

function usersUpdate(u, id, b) {
  requireAdmin(u);
  id = Number(id);
  var row = Db.get('users', id);
  if (!row) throw new Error('사용자를 찾을 수 없습니다.');

  var patch = {};
  if (b.name !== undefined) patch.name = trim_(b.name);
  if (b.role !== undefined) patch.role = b.role === 'admin' ? 'admin' : 'user';
  if (b.is_active !== undefined) patch.is_active = b.is_active ? 1 : 0;

  if (b.username !== undefined) {
    var nm = String(b.username).trim();
    if (!nm) throw new Error('아이디를 입력해주세요.');
    var dup = findUser_(nm);
    if (dup && dup.id !== id) throw new Error('이미 존재하는 아이디입니다.');
    patch.username = nm;
  }

  // 관리자가 다른 사람 비밀번호를 새로 정해 줄 수 있다 (지금 비번을 몰라도)
  if (b.password) {
    if (String(b.password).length < 4) throw new Error('비밀번호는 4자 이상으로 해주세요.');
    patch.salt = newSalt();
    patch.password_hash = hashPassword(b.password, patch.salt);
  }

  // 마지막 관리자를 내려버리면 아무도 관리할 수 없게 된다
  if ((patch.role === 'user' || patch.is_active === 0) && row.role === 'admin') {
    var others = Db.where('users', function (x) {
      return x.role === 'admin' && x.is_active && x.id !== id;
    }).length;
    if (others === 0) throw new Error('마지막 관리자입니다. 다른 관리자를 먼저 지정해주세요.');
  }

  if (Object.keys(patch).length) Db.update('users', id, patch);
  return { message: '사용자 정보가 수정되었습니다.' };
}


/* ═════ BulkGroup.gs ═════ */
/**
 * 「과정」 시트 — 과정 하나와 그에 딸린 매출·매입·계산서를 한 자리에 모은다.
 *
 * 전에는 과정 / 매출 상세 / 매입 상세 / 세금계산서가 시트 4장으로 흩어져 있었다.
 * 과정명이나 고객사를 고치려면 여러 시트를 오가야 해서 불편했다.
 *
 * 이렇게 생겼다.
 *
 *   구분    번호  회사       고객사  과정명·항목   단가      수량
 *   ─────────────────────────────────────────────────
 *   과정    12   혜움컨설팅  신협    리더십 과정
 *   매출    34                      강사료       800,000   2
 *   매출    35                      교보재        15,000   30
 *   매입    56                      김강사       500,000   1
 *   계산서  78
 *   ─────────────────────────────────────────────────
 *   과정    13   그로우인    기아    소통 워크숍
 *   ...
 *
 * 「구분」이 과정인 줄 아래에 오는 매출·매입·계산서는 모두 그 과정의 것이다.
 * 과정명을 고치려면 그 한 칸만 고치면 된다.
 */

var GROUP_SHEET = '과정';

/** 한 과정이 끝나고 다음이 시작되는 것을 눈으로 알아보기 쉽게 */
var GROUP_KINDS = ['과정', '매출', '매입', '계산서'];

/**
 * 시트의 칸들.
 *   [머리글, 종류, 돈?]
 *   종류 n=숫자 · t=글자 · d=날짜 · ref=번호 · ro=자동계산(적어도 무시)
 */
/**
 * 칸 순서는 「자주 보는 것부터」 둔다.
 *
 *   ① 어느 과정인지   구분 · 번호 · 고객사 · 고객담당자 · 과정명
 *   ② 매출 · 매입     분류 · 항목 · 단가 · 수량 … (매입만 쓰는 칸은 그 뒤에)
 *   ③ 계산서
 *   ④ 과정 자체의 정보 (일정 · 담당자 · 부가세처리 …)
 *
 * 전에는 ④가 ②ʼ 사이에 끼어 있어서, 매출 한 줄을 보려면
 * 빈 칸을 여러 개 건너뛰어야 했다.
 */
function groupCols() {
  return [
    /* ── ① 어느 과정인지 ── */
    /*
     * 「순서」는 내려받았을 때의 줄 번호다.
     * 엑셀에서 정렬해서 뒤섞였을 때, 이 칸으로 오름차순 정렬하면 원래대로 돌아온다.
     */
    ['순서', 'ro'],
    ['구분', 't'],
    ['번호', 'ref'],
    /*
     * 「과정번호」는 이 줄이 어느 과정의 것인지 말해 준다.
     *
     * 이것이 없으면 「바로 위 과정 줄」로 찾을 수밖에 없는데,
     * 엑셀에서 정렬하면 줄 순서가 바뀌어 엉뚱한 과정에 붙어 버린다.
     * 이 칸이 있으면 순서가 뒤바뀌어도 제 과정을 찾아간다.
     */
    ['과정번호', 'ref'],
    /*
     * 고객사 · 담당자 · 과정명은 「딸린 줄에도 똑같이」 적어 둔다.
     * 그래야 매출·매입 줄만 봐도 어느 과정의 것인지 바로 안다
     * (엑셀에서 걸러보거나 정렬할 때도 필요하다).
     *
     * 고치는 것은 「과정」 줄에서만 한다. 딸린 줄에서 고치면 그대로 둔 채
     * 미리보기에서 알려준다.
     */
    ['고객사', 't'],
    ['고객담당자', 't'],
    ['과정명', 't'],
    ['교육일정', 't'],

    /*
     * 과정 한 건의 전체 금액 — 「과정」 줄에만 채운다.
     *
     * 항목별로만 적혀 있으면 그 과정이 통틀어 얼마인지 알려고
     * 아래 줄들을 눈으로 더해야 한다. 그래서 과정명 바로 옆에 둔다.
     */
    ['[자동] 과정 총매출', 'ro', 1],
    ['[자동] 과정 총매입', 'ro', 1],
    ['[자동] 과정 이익', 'ro', 1],

    /* ── ② 매출 · 매입 (둘이 함께 쓰는 칸) ──
     *
     * 「분류」는 매출인지 매입인지만 보여준다 (구분 칸을 따라간다).
     * 「세부분류」가 실제로 고르는 칸이다 — 인건비 · 운영비 · 강의 · 협력사(운영비) …
     * 매입에도 「협력사(운영비)」가 있어서, 둘을 나눠 놓지 않으면
     * 운영비가 매출인지 매입인지 헷갈린다.
     *
     * 금액은 단가·수량보다 앞에 둔다. 먼저 보는 숫자이기 때문이다.
     *
     * 금액은 고칠 수 있다. 매출 88줄 가운데 81줄이 단가·수량 없이
     * 금액만 적어 넣은 줄이기 때문이다 (수기작성). 읽기 전용으로 두면
     * 그 81줄의 금액은 엑셀에서 손도 못 댄다.
     *   · 금액을 고치면   → 적어 넣은 금액 그대로 쓴다 (수기작성)
     *   · 단가·수량을 고치면 → 단가 × 수량 × 차수 로 다시 낸다
     */
    ['분류', 'ro'],
    ['세부분류', 't'],
    ['항목·이름', 't'],
    ['금액', 'n', 1],
    ['단가', 'n', 1],
    ['수량', 'n'],
    ['단위', 't'],
    ['차수', 'n'],

    /* ── 매입만 쓰는 칸 ── */
    ['소속', 't'],
    ['세율', 't'],
    ['세금', 'n', 1],
    ['실지급액', 'n', 1],
    ['지급일', 'd'],
    ['카드번호', 't'],

    /* ── ③ 계산서 ── */
    ['발행회사', 't'],
    ['계산서금액', 'n', 1],
    ['청구/영수', 't'],
    ['발행일', 'd'],
    ['입금일', 'd'],
    ['받는사람', 't'],
    ['이메일', 't'],
    ['연락처', 't'],
    ['[자동] 계산서 공급가액', 'ro', 1],
    ['[자동] 계산서 부가세', 'ro', 1],
    ['[자동] 계산서 합계', 'ro', 1],

    /* ── ④ 과정 자체의 정보 ── */
    ['회사', 't'],
    ['교육구분', 't'],
    ['일정유형', 't'],
    ['혜움담당자', 't'],
    ['영업(외부)', 't'],
    ['부가세처리', 't'],
    ['절사기준', 't'],
    ['절사금액', 'n', 1],
    ['[자동] 과정 부가세', 'ro', 1],
    ['[자동] 과정 합계', 'ro', 1],

    /* ── 공통 ── */
    ['비고', 't']
  ];
}

/**
 * 줄의 종류마다 어느 칸이 어느 자료인지.
 *   머리글 → 표의 칸 이름
 * 여기 없는 칸은 그 종류에서 쓰지 않는다 (비워 둔다).
 */
function groupMap() {
  return {
    '과정': {
      table: 'projects',
      f: {
        '회사': 'company', '고객사': '_client', '고객담당자': '_contact',
        '교육구분': 'type', '과정명': 'course_name',
        '일정유형': 'schedule_type', '교육일정': '_dates',
        '혜움담당자': 'manager', '영업(외부)': 'sales_rep',
        '부가세처리': 'vat_mode', '절사기준': 'discount_base', '절사금액': 'discount',
        '비고': 'memo',
        '[자동] 과정 총매출': 'total_sales', '[자동] 과정 총매입': 'total_expenses',
        '[자동] 과정 이익': '_profit',
        '[자동] 과정 부가세': 'vat', '[자동] 과정 합계': 'total_with_vat'
      }
    },
    '매출': {
      table: 'project_sales',
      f: {
        '세부분류': 'category', '항목·이름': 'name',
        '단가': 'unit_price', '수량': 'qty1', '단위': 'unit1', '차수': 'sessions',
        '비고': 'note',
        '금액': 'amount'
      }
    },
    '매입': {
      table: 'project_expenses',
      f: {
        '세부분류': 'category', '항목·이름': 'name', '소속': 'affiliation',
        '단가': 'unit_price', '수량': 'quantity', '단위': 'unit', '차수': 'sessions',
        '세율': 'tax_type', '세금': 'tax_amount', '실지급액': 'payment_amount',
        '지급일': 'payment_date', '카드번호': 'card_last4',
        '비고': 'note',
        '금액': 'total_amount'
      }
    },
    '계산서': {
      table: 'project_invoices',
      f: {
        '발행회사': 'company',
        '부가세처리': 'vat_mode', '절사기준': 'discount_base', '절사금액': 'discount',
        '계산서금액': '_amount', '청구/영수': 'pay_type',
        '발행일': 'issue_date', '입금일': 'paid_date',
        '받는사람': '_recv_name', '이메일': '_recv_email', '연락처': '_recv_phone',
        '비고': 'note',
        '[자동] 계산서 공급가액': 'supply_amount', '[자동] 계산서 부가세': 'vat',
        '[자동] 계산서 합계': 'total_amount'
      }
    }
  };
}

/* ═══════════════ 내려받기 ═══════════════ */

/** 딸린 줄에도 보여줄 칸 — 어느 과정의 것인지 한눈에 보이도록 */
var GROUP_ECHO = ['고객사', '고객담당자', '과정명'];

/**
 * 한 줄을 만든다.
 * @param parent 딸린 줄일 때 그 과정 (고객사·담당자·과정명을 함께 보여주려고)
 */
function groupRow_(kind, rec, ctx, headers, parent) {
  var map = groupMap()[kind];
  var row = headers.map(function () { return ''; });

  var at = function (h) { return headers.indexOf(h); };
  var put = function (h, v) { var i = at(h); if (i >= 0) row[i] = v; };

  put('구분', kind);
  put('번호', rec.id);
  // 어느 과정의 것인지 — 정렬해도 제 과정을 찾아가도록
  put('과정번호', parent ? parent.id : (kind === '과정' ? rec.id : ''));

  // 「분류」 칸에는 매출인지 매입인지를 적어 둔다 (보기용)
  if (kind === '매출' || kind === '매입') {
    var ci = headers.indexOf('분류');
    if (ci >= 0) row[ci] = kind;
  }

  // 딸린 줄이면 과정 정보를 그대로 옮겨 적는다
  if (parent) {
    GROUP_ECHO.forEach(function (h) {
      var i = headers.indexOf(h);
      if (i < 0) return;
      if (h === '고객사') row[i] = parent.client_id ? (ctx.clientName[parent.client_id] || '') : '';
      else if (h === '고객담당자') row[i] = parent.contact_id ? (ctx.contactName[parent.contact_id] || '') : '';
      else row[i] = parent.course_name || '';
    });
  }

  headers.forEach(function (h, i) {
    var k = map.f[h];
    if (!k) return;

    if (k === '_client') { row[i] = rec.client_id ? (ctx.clientName[rec.client_id] || '') : ''; return; }
    if (k === '_contact') { row[i] = rec.contact_id ? (ctx.contactName[rec.contact_id] || '') : ''; return; }
    if (k === '_dates') { row[i] = datesToText_(rec); return; }
    if (k === '_profit') { row[i] = (rec.total_sales || 0) - (rec.total_expenses || 0); return; }
    if (k === '_amount') {
      row[i] = (rec.vat_mode === '포함') ? (rec.total_amount || 0) : (rec.supply_amount || 0);
      return;
    }
    if (k === '_recv_name') { row[i] = recvField_(rec.recipients, 'name'); return; }
    if (k === '_recv_email') { row[i] = ctx.personal ? recvField_(rec.recipients, 'email') : ''; return; }
    if (k === '_recv_phone') { row[i] = ctx.personal ? recvField_(rec.recipients, 'phone') : ''; return; }

    var v = rec[k];
    row[i] = (v === null || v === undefined) ? '' : v;
  });

  return row;
}

/** 「과정」 시트 전체를 만든다 */
function groupSheetData(ctx) {
  var headers = groupCols().map(function (c) { return c[0]; });

  var sales = {}, exps = {}, invs = {};
  Db.all('project_sales').forEach(function (r) { (sales[r.project_id] = sales[r.project_id] || []).push(r); });
  Db.all('project_expenses').forEach(function (r) { (exps[r.project_id] = exps[r.project_id] || []).push(r); });
  Db.all('project_invoices').forEach(function (r) { (invs[r.project_id] = invs[r.project_id] || []).push(r); });

  var byOrder = function (a, b) {
    return ((a.sort_order || a.seq || 0) - (b.sort_order || b.seq || 0)) || (a.id - b.id);
  };

  /*
   * 최근 교육일정이 위로 오게 한다.
   * 번호순으로 두면 옛날 과정부터 나와서, 요즘 것을 보려고 한참 내려가야 한다.
   * 일정이 비어 있는 과정은 맨 아래로 보낸다.
   */
  var byRecent = function (a, b) {
    var sa = firstStart_(a) || '', sb = firstStart_(b) || '';
    if (sa !== sb) {
      if (!sa) return 1;
      if (!sb) return -1;
      return sa < sb ? 1 : -1;        // 늦은 날짜가 먼저
    }
    return b.id - a.id;
  };

  var rows = [];
  Db.all('projects').slice().sort(byRecent).forEach(function (p) {
    rows.push(groupRow_('과정', p, ctx, headers));
    (sales[p.id] || []).sort(byOrder).forEach(function (r) { rows.push(groupRow_('매출', r, ctx, headers, p)); });
    (exps[p.id] || []).sort(byOrder).forEach(function (r) { rows.push(groupRow_('매입', r, ctx, headers, p)); });
    (invs[p.id] || []).sort(byOrder).forEach(function (r) { rows.push(groupRow_('계산서', r, ctx, headers, p)); });
  });

  // 「순서」에 1부터 번호를 매긴다 — 정렬이 꼬였을 때 되돌리는 열쇠다
  var seqAt = headers.indexOf('순서');
  if (seqAt >= 0) rows.forEach(function (r, i) { r[seqAt] = i + 1; });

  return { header: headers, rows: rows };
}

/* ═══════════════ 과정 요약 (보기 전용) ═══════════════
 *
 * 과정 하나당 한 줄. 전체를 훑어보거나, 엑셀에서 정렬·합계를 낼 때 쓴다.
 * 「과정」 시트는 항목까지 다 펼쳐져 있어 414줄이라 한눈에 보기 어렵다.
 */

function summaryCols() {
  return [
    ['번호', 'ro'],
    ['교육일정', 'ro'],
    ['회사', 'ro'],
    ['고객사', 'ro'],
    ['고객담당자', 'ro'],
    ['교육구분', 'ro'],
    ['과정명', 'ro'],
    ['교육일수', 'ro'],
    ['혜움담당자', 'ro'],
    ['영업(외부)', 'ro'],
    ['총매출', 'ro', 1],
    ['부가세', 'ro', 1],
    ['매출 합계', 'ro', 1],
    ['총매입', 'ro', 1],
    ['이익', 'ro', 1],
    ['이익률(%)', 'ro'],
    ['인건비', 'ro', 1],
    ['운영비', 'ro', 1],
    ['연수원비', 'ro', 1],
    ['매출 줄수', 'ro'],
    ['매입 줄수', 'ro'],
    ['계산서 수', 'ro'],
    ['미수금', 'ro', 1]
  ];
}

function summarySheetData(ctx) {
  var headers = summaryCols().map(function (c) { return c[0]; });

  var nSales = {}, nExp = {}, nInv = {}, unpaid = {};
  Db.all('project_sales').forEach(function (r) { nSales[r.project_id] = (nSales[r.project_id] || 0) + 1; });
  Db.all('project_expenses').forEach(function (r) { nExp[r.project_id] = (nExp[r.project_id] || 0) + 1; });
  Db.all('project_invoices').forEach(function (r) {
    nInv[r.project_id] = (nInv[r.project_id] || 0) + 1;
    if (!r.paid_date) unpaid[r.project_id] = (unpaid[r.project_id] || 0) + (r.total_amount || 0);
  });

  var rows = Db.all('projects').slice().sort(function (a, b) {
    var sa = firstStart_(a) || '', sb = firstStart_(b) || '';
    if (sa !== sb) { if (!sa) return 1; if (!sb) return -1; return sa < sb ? 1 : -1; }
    return b.id - a.id;
  }).map(function (p) {
    var profit = (p.total_sales || 0) - (p.total_expenses || 0);
    return [
      p.id,
      datesToText_(p),
      p.company || '',
      p.client_id ? (ctx.clientName[p.client_id] || '') : '',
      p.contact_id ? (ctx.contactName[p.contact_id] || '') : '',
      p.type || '',
      p.course_name || '',
      countDays(normalizeSchedule(p.schedule_dates, p.schedule_type)),
      p.manager || '',
      p.sales_rep || '',
      p.total_sales || 0,
      p.vat || 0,
      p.total_with_vat || 0,
      p.total_expenses || 0,
      profit,
      p.total_sales ? Math.round((profit / p.total_sales) * 1000) / 10 : 0,
      p.sale_labor || 0,
      p.sale_operation || 0,
      p.sale_venue || 0,
      nSales[p.id] || 0,
      nExp[p.id] || 0,
      nInv[p.id] || 0,
      unpaid[p.id] || 0
    ];
  });

  return { header: headers, rows: rows };
}

/* ═══════════════ 올린 것 읽기 ═══════════════ */

/**
 * 올라온 「과정」 시트를 보고 무엇이 바뀌는지 알아낸다.
 * 저장하지는 않는다.
 *
 * @return {{ plan: Object, problems: string[], summary: Object }}
 */
function groupDiff_(grid, ctx) {
  var cols = groupCols();
  var headers = cols.map(function (c) { return c[0]; });
  var kindOf = {};
  cols.forEach(function (c) { kindOf[c[0]] = c[1]; });

  var map = groupMap();
  var problems = [];

  var plan = {
    projects: { add: [], edit: [], del: [] },
    project_sales: { add: [], edit: [], del: [] },
    project_expenses: { add: [], edit: [], del: [] },
    project_invoices: { add: [], edit: [], del: [] }
  };

  /* 지금 자료를 「내려받은 모습」으로 만들어 두고 견준다 */
  var mine = groupSheetData(ctx);
  var mineById = {};
  /*
   * 칸 위치를 숫자로 박아두면 칸을 하나 끼워 넣는 순간 전부 어긋난다.
   * (한 번 그래서 멀쩡한 줄 163개가 「고쳐짐」으로 나왔다)
   * 그래서 머리글 이름으로 찾는다.
   */
  var mKind = mine.header.indexOf('구분');
  var mNo = mine.header.indexOf('번호');
  mine.rows.forEach(function (r) {
    var no = r[mNo];
    if (no !== '' && no !== null && no !== undefined) mineById[r[mKind] + ':' + no] = r;
  });

  /* 엑셀의 머리글 위치 (칸 순서를 바꿔도 되도록) */
  var top = (grid[0] || []).map(function (h) { return String(h || '').trim(); });
  var at = {};
  headers.forEach(function (h) {
    var i = top.indexOf(h);
    if (i >= 0) at[h] = i;
  });
  if (at['구분'] === undefined || at['번호'] === undefined) {
    problems.push('「과정」 시트에 「구분」 또는 「번호」 칸이 없습니다. 양식을 다시 받아주세요.');
    return { plan: plan, problems: problems, summary: {} };
  }

  var curPid = null;        // 지금 줄들이 붙을 과정 (숫자 또는 「새1」)
  var seen = { projects: {}, project_sales: {}, project_expenses: {}, project_invoices: {} };
  var tempCount = 0;

  for (var r = 1; r < grid.length; r++) {
    var line = grid[r];

    var empty = true;
    for (var c = 0; c < line.length; c++) {
      if (line[c] !== '' && line[c] !== null && line[c] !== undefined) { empty = false; break; }
    }
    if (empty) continue;

    var kind = String(line[at['구분']] || '').trim();
    if (!kind) {
      /*
       * 적은 것은 있는데 「구분」이 비었다.
       *
       * 전에는 조용히 건너뛰었다. 그래서 줄을 끼워 넣고 구분을 빠뜨리면
       * 아무 말 없이 그 줄이 사라졌다 — 올린 사람은 들어간 줄 안다.
       * 적어 넣은 것이 소리 없이 없어지는 것이 가장 나쁘다.
       * (2026-10-28)
       *
       * 무엇을 적은 줄인지 함께 보여줘서 엑셀에서 찾기 쉽게 한다.
       */
      /* 이름을 조심한다 — 이 함수에는 이미 seen 이 있다 (var 는 함수 전체에 걸린다) */
      var typed = [];
      headers.forEach(function (h, i) {
        if (h === '순서' || typed.length >= 3) return;
        var v = line[i];
        if (v !== '' && v !== null && v !== undefined) typed.push(h + ' ' + v);
      });
      problems.push((r + 1) + '번째 줄: 「구분」이 비어 있습니다. '
        + '과정 · 매출 · 매입 · 계산서 중 하나를 적어주세요.'
        + (typed.length ? ' (적으신 것: ' + typed.join(' · ') + ')' : ''));
      continue;
    }
    if (GROUP_KINDS.indexOf(kind) < 0) {
      problems.push((r + 1) + '번째 줄: 「구분」은 과정 · 매출 · 매입 · 계산서 중 하나여야 합니다. (' + kind + ')');
      continue;
    }

    var def = map[kind];
    var table = def.table;

    /* 칸을 읽는다 */
    var obj = {};
    headers.forEach(function (h) {
      if (at[h] === undefined) return;
      var field = def.f[h];
      if (!field) return;
      if (kindOf[h] === 'ro') return;                 // 자동 계산 칸은 무시
      obj[field] = cellValue_(line[at[h]], kindOf[h]);
    });

    var idCell = cellValue_(line[at['번호']], 'ref');

    /* ── 과정 줄 ── */
    if (kind === '과정') {
      if (idCell === null || idCell === '') {
        // 번호가 비었으면 새 과정 — 임시 이름을 붙여 아래 줄들이 찾아오게 한다
        tempCount++;
        var tmp = '__new' + tempCount;
        curPid = tmp;
        plan.projects.add.push({ row: r + 1, data: obj, tempId: tmp });
      } else if (typeof idCell === 'string') {
        curPid = idCell;                               // 「새1」 처럼 직접 적은 임시 이름
        plan.projects.add.push({ row: r + 1, data: obj, tempId: idCell });
      } else {
        var old = Db.get('projects', idCell);
        if (!old) {
          problems.push((r + 1) + '번째 줄: 과정 번호 ' + idCell + ' 인 자료가 없습니다.');
          curPid = null;
          continue;
        }
        curPid = idCell;
        if (seen.projects[idCell]) {
          problems.push((r + 1) + '번째 줄: 과정 번호 ' + idCell
            + ' 이 앞에서 이미 나왔습니다. 한 줄만 남겨주세요.');
          continue;
        }
        seen.projects[idCell] = true;
        var patch = groupPatch_(headers, at, kindOf, def, obj, mineById['과정:' + idCell], old);
        if (patch) plan.projects.edit.push({ id: idCell, row: r + 1, patch: patch, before: old });
      }
      continue;
    }

    /* ── 딸린 줄 (매출 · 매입 · 계산서) ──
     *
     * 어느 과정에 붙일지는 「과정번호」 칸을 먼저 본다.
     * 엑셀에서 정렬해 줄 순서가 바뀌어도 제 과정을 찾아가야 하기 때문이다.
     * 과정번호가 비어 있을 때만 바로 위 과정 줄을 따른다.
     */
    var pidCell = (at['과정번호'] !== undefined)
      ? cellValue_(line[at['과정번호']], 'ref') : null;
    var hasPid = (pidCell !== null && pidCell !== '');

    if (!hasPid && curPid === null) {
      problems.push((r + 1) + '번째 줄: 어느 과정의 것인지 알 수 없습니다. '
        + '「과정번호」를 적거나, 과정 줄 아래에 두세요.');
      continue;
    }

    /*
     * 고객사·담당자·과정명을 「딸린 줄에서」 고쳤는지 본다.
     * 그 칸들은 보기 좋으라고 옮겨 적어 둔 것이라 여기서 고쳐도 반영되지 않는다.
     * 조용히 넘기면 고친 줄 알고 계실 테니 알려 드린다.
     *
     * ⚠ 위의 과정 줄과 비교하면 안 된다. 과정 줄의 고객사를 고치면
     *   아래 줄들은 아직 옛 값이라 전부 틀린 것처럼 보이기 때문이다.
     *   내려줬던 그 줄의 값과 견주어야 한다.
     */
    if (typeof idCell === 'number') {
      var wasEcho = mineById[kind + ':' + idCell];
      if (wasEcho) {
        GROUP_ECHO.forEach(function (h) {
          if (at[h] === undefined) return;
          var i = headers.indexOf(h);
          if (!sameValue_(line[at[h]], wasEcho[i])) {
            problems.push((r + 1) + '번째 줄: 「' + h + '」 는 위의 과정 줄에서 고쳐주세요. '
              + '(' + kind + ' 줄의 이 칸은 보기용입니다)');
          }
        });
      }
    }

    if (hasPid) {
      if (typeof pidCell === 'number') {
        if (!Db.get('projects', pidCell)) {
          problems.push((r + 1) + '번째 줄: 과정번호 ' + pidCell + ' 인 과정이 없습니다.');
          continue;
        }
        obj.project_id = pidCell;
      } else {
        obj.project_id = pidCell;       // 「새1」 같은 임시 이름
      }
    } else {
      obj.project_id = curPid;
    }

    if (idCell === null || idCell === '') {
      groupAddManual_(table, obj);
      plan[table].add.push({ row: r + 1, data: obj });
    } else if (typeof idCell === 'string') {
      problems.push((r + 1) + '번째 줄: ' + kind + ' 의 번호에는 숫자만 적어주세요. (' + idCell + ')');
    } else {
      var old2 = Db.get(table, idCell);
      if (!old2) {
        problems.push((r + 1) + '번째 줄: ' + kind + ' 번호 ' + idCell + ' 인 자료가 없습니다.');
        continue;
      }
      // 같은 번호가 두 번 나오면 뒤엣것이 앞엣것을 덮어쓴다 — 알려 드린다
      if (seen[table][idCell]) {
        problems.push((r + 1) + '번째 줄: ' + kind + ' 번호 ' + idCell
          + ' 이 앞에서 이미 나왔습니다. 한 줄만 남겨주세요.');
        continue;
      }
      seen[table][idCell] = true;
      var patch2 = groupPatch_(headers, at, kindOf, def, obj, mineById[kind + ':' + idCell], old2);
      if (patch2) plan[table].edit.push({ id: idCell, row: r + 1, patch: patch2, before: old2 });
    }
  }

  /* 엑셀에서 사라진 줄 = 삭제 */
  ['projects', 'project_sales', 'project_expenses', 'project_invoices'].forEach(function (t) {
    plan[t].del = Db.all(t).filter(function (x) { return !seen[t][x.id]; })
      .map(function (x) { return { id: x.id, label: bulkLabel_(t, x) }; });
  });

  var summary = {};
  ['projects', 'project_sales', 'project_expenses', 'project_invoices'].forEach(function (t) {
    summary[t] = { add: plan[t].add.length, edit: plan[t].edit.length, del: plan[t].del.length };
  });

  return { plan: plan, problems: problems, summary: summary };
}

/**
 * 내려줬던 값과 견주어 실제로 달라진 칸만 모은다.
 * 달라진 것이 없으면 null.
 */
/*
 * 엑셀로 「새로 넣는」 매출·매입 줄의 수기작성 여부를 정한다.
 *
 * 금액만 적고 단가·수량을 비워 둔 줄을 그냥 두면,
 * 저장한 뒤 단가(0) × 수량(0) 으로 다시 계산되어 0 원이 된다.
 * 매출 88줄 가운데 81줄이 금액만 있는 줄이라 그냥 둘 수 없다.
 *
 * 고칠 때는 groupPatch_ 가 같은 일을 하지만, 새로 넣는 줄에는
 * 견줄 예전 값이 없어 그쪽 길을 타지 않는다.
 */
function groupAddManual_(table, obj) {
  var amountField = (table === 'project_sales') ? 'amount'
    : (table === 'project_expenses') ? 'total_amount' : null;
  if (!amountField) return;

  var has = function (v) {
    return v !== null && v !== undefined && v !== '' && (Number(v) || 0) !== 0;
  };

  // 단가와 수량이 있으면 곱셈으로 낸다 (지금까지와 같다)
  if (has(obj.unit_price) && (has(obj.qty1) || has(obj.quantity))) {
    obj.is_manual = 0;
    return;
  }
  // 금액만 적었으면 그 금액을 그대로 쓴다
  if (has(obj[amountField])) obj.is_manual = 1;
}

function groupPatch_(headers, at, kindOf, def, obj, wasRow, old) {
  var patch = {}, n = 0;
  old = old || {};

  headers.forEach(function (h) {
    if (at[h] === undefined) return;
    var field = def.f[h];
    if (!field || kindOf[h] === 'ro') return;
    if (!(field in obj)) return;

    var i = headers.indexOf(h);
    var before = wasRow ? wasRow[i] : old[field];
    if (!sameValue_(obj[field], before)) { patch[field] = obj[field]; n++; }
  });

  /*
   * 금액을 직접 고쳤는지, 단가·수량을 고쳤는지에 따라
   * 「수기작성」 여부를 알아서 바꿔 준다.
   *
   * 이렇게 하지 않으면 수기작성 줄에서 단가를 적어도 금액이 안 바뀌고,
   * 계산하던 줄에서 금액을 적어도 곧바로 되돌아간다.
   */
  var amountField = (def.table === 'project_sales') ? 'amount'
    : (def.table === 'project_expenses') ? 'total_amount' : null;
  if (amountField && n) {
    var byHand = ['unit_price', 'qty1', 'quantity', 'sessions'].some(function (f) {
      return f in patch;
    });
    if (amountField in patch) {
      if (old.is_manual !== 1) patch.is_manual = 1;
    } else if (byHand && old.is_manual) {
      patch.is_manual = 0;
    }
  }

  return n ? patch : null;
}


/* ═════ BulkNew.gs ═════ */
/**
 * 「신규 과정 추가」 시트 — 꼭 필요한 것만 적어 올리면 알아서 정리한다.
 * ════════════════════════════════════════════════════════════
 *
 * 왜 따로 두는가 (대표님 지시 2026-10-28)
 *   「과정」 시트는 칸이 47개다. 고치기에는 좋지만, 새 과정 하나를
 *   넣으려고 그 넓은 시트에서 네 줄(과정·매출·매출·매입)을 만들고
 *   임시 번호까지 맞춰 적는 것은 번거롭다.
 *
 *   여기서는 **한 줄에 한 과정**이다. 고객사·과정명·날짜만 적으면 된다.
 *   매출과 매입은 적은 만큼만 만들어진다.
 *
 * 어떻게 도는가
 *   새로 짜지 않는다. 이 시트의 한 줄을 「과정 시트에 네 줄 적은 것」으로
 *   바꿔서, 지금까지 쓰던 추가 기계에 그대로 넘긴다.
 *   그래야 고객사 만들기·합계 다시 계산·미리보기가 공짜로 따라온다.
 *
 * 내려받을 때는 늘 비어 있다
 *   보기용 줄을 넣어 두면 그대로 올라와 가짜 과정이 생긴다.
 *   그래서 머리글만 보내고, 안내는 머리글 안에 적는다.
 */

var NEW_SHEET = '신규 과정 추가';

/**
 * 칸 — [머리글, 쓸 곳, 종류, 돈?]
 * 적는 칸만 둔다. 자동으로 계산되는 것은 아예 없다.
 */
function newProjCols() {
  return [
    ['고객사 *', '_client', 't'],
    ['과정명 *', 'course_name', 't'],
    ['교육일정 * (예: 2026-11-03 또는 2026-11-03~2026-11-05)', '_dates', 't'],
    ['교육구분 (비우면 교육)', 'type', 't'],
    ['회사 (비우면 혜움컨설팅)', 'company', 't'],
    ['혜움담당자', 'manager', 't'],
    ['매출 인건비', '_s_labor', 'n', 1],
    ['매출 운영비', '_s_oper', 'n', 1],
    ['매출 연수원비', '_s_venue', 'n', 1],
    ['매입 이름 (강사·협력사)', '_e_name', 't'],
    ['매입 금액', '_e_amount', 'n', 1],
    ['매입 세율 (비우면 3.3%)', '_e_tax', 't'],
    ['메모', 'memo', 't']
  ];
}

/** 내려받을 때 — 머리글만, 줄은 없다 */
function newProjSheetData() {
  return { header: newProjCols().map(function (c) { return c[0]; }), rows: [] };
}

/* ───────── 올라온 것을 읽는다 ───────── */

function newProjBlank_(v) {
  return v === null || v === undefined || String(v).trim() === '';
}

/**
 * 「신규 과정 추가」 시트를 읽어, 과정 시트와 같은 모양의 계획으로 바꾼다.
 *
 * @return {Object} { plan, problems, count }
 */
function newProjDiff_(grid) {
  var plan = {
    projects: { add: [], edit: [], del: [] },
    project_sales: { add: [], edit: [], del: [] },
    project_expenses: { add: [], edit: [], del: [] }
  };
  var problems = [];
  var count = 0;

  if (!grid || grid.length < 2) return { plan: plan, problems: problems, count: 0 };

  var cols = newProjCols();
  var headers = grid[0].map(function (h) { return String(h === null || h === undefined ? '' : h).trim(); });
  var at = {};
  cols.forEach(function (c) {
    var i = headers.indexOf(c[0]);
    if (i >= 0) at[c[0]] = i;
  });

  var need = ['고객사 *', '과정명 *'];
  for (var k = 0; k < need.length; k++) {
    if (at[need[k]] === undefined) {
      problems.push(NEW_SHEET + ' 시트의 머리글이 다릅니다. '
        + '「' + need[k] + '」 칸을 찾지 못했습니다. 새로 내려받아 쓰세요.');
      return { plan: plan, problems: problems, count: 0 };
    }
  }

  var get = function (line, name, kind) {
    if (at[name] === undefined) return null;
    return cellValue_(line[at[name]], kind || 't');
  };
  var num = function (line, name) {
    var v = get(line, name, 'n');
    return (typeof v === 'number' && !isNaN(v)) ? v : 0;
  };

  for (var r = 1; r < grid.length; r++) {
    var line = grid[r] || [];

    /* 아무것도 안 적힌 줄은 건너뛴다 — 빈 줄을 남겨 두어도 아무 일이 없게 */
    var any = false;
    for (var c2 = 0; c2 < headers.length; c2++) {
      if (!newProjBlank_(line[c2])) { any = true; break; }
    }
    if (!any) continue;

    var client = get(line, '고객사 *');
    var course = get(line, '과정명 *');
    var dates = get(line, '교육일정 * (예: 2026-11-03 또는 2026-11-03~2026-11-05)');

    if (newProjBlank_(client) || newProjBlank_(course)) {
      problems.push(NEW_SHEET + ' ' + (r + 1) + '번째 줄: 고객사와 과정명은 꼭 적어야 합니다.');
      continue;
    }
    if (newProjBlank_(dates)) {
      problems.push(NEW_SHEET + ' ' + (r + 1) + '번째 줄: 교육일정을 적어주세요. '
        + '(예: 2026-11-03 또는 2026-11-03~2026-11-05)');
      continue;
    }
    /* 날짜를 못 알아들으면 일정 없는 과정이 조용히 생긴다 — 먼저 걸러낸다 */
    var parsed = textToDates_(String(dates));
    if (!parsed.length || !parsed[0].s) {
      problems.push(NEW_SHEET + ' ' + (r + 1) + '번째 줄: 교육일정 「' + dates
        + '」 을 알아듣지 못했습니다. 2026-11-03 또는 2026-11-03~2026-11-05 처럼 적어주세요.');
      continue;
    }

    /*
     * 매입은 이름과 금액이 짝이다.
     *
     * 이름만 적고 금액을 빠뜨렸을 때 과정만 만들어 버리면, 적으려던
     * 매입이 조용히 사라진다. 그러면 「매입이 비어 있다」는 경고만
     * 나중에 뜨고, 왜 빠졌는지는 알 길이 없다.
     * 그래서 그 줄은 통째로 건너뛰고 고쳐서 다시 올리시게 한다.
     */
    var eAmt = num(line, '매입 금액');
    var eName = get(line, '매입 이름 (강사·협력사)');
    if (!eAmt && !newProjBlank_(eName)) {
      problems.push(NEW_SHEET + ' ' + (r + 1) + '번째 줄: 매입 이름 「' + eName
        + '」 만 적고 금액이 비어 있습니다. 금액을 적거나 이름을 지워주세요. '
        + '(이 줄은 만들지 않았습니다)');
      continue;
    }

    count++;
    var tmp = '__new_np' + count;

    var type = get(line, '교육구분 (비우면 교육)');
    var company = get(line, '회사 (비우면 혜움컨설팅)');

    plan.projects.add.push({
      row: r + 1,
      tempId: tmp,
      data: {
        _client: client,
        course_name: course,
        _dates: String(dates),
        /* 날짜를 여러 개 적었으면 「차수」, 범위면 「기간」, 하나면 「당일」 */
        schedule_type: parsed.length > 1 ? '차수'
          : (parsed[0].e && parsed[0].e !== parsed[0].s ? '기간' : '당일'),
        type: newProjBlank_(type) ? '교육' : type,
        company: newProjBlank_(company) ? DEFAULT_COMPANY : company,
        manager: get(line, '혜움담당자') || '',
        memo: get(line, '메모') || '',
        vat_mode: '별도'
      }
    });

    /* 매출 — 적은 분류만 만든다 */
    [['_s_labor', '매출 인건비', '인건비'],
     ['_s_oper', '매출 운영비', '운영비'],
     ['_s_venue', '매출 연수원비', '연수원비']].forEach(function (s) {
      var amt = num(line, s[1]);
      if (!amt) return;
      plan.project_sales.add.push({
        row: r + 1,
        data: {
          project_id: tmp, category: s[2], name: s[2],
          amount: amt,
          /* 금액만 적었으므로 수기작성 — 안 그러면 단가(0)×수량(0)=0 이 된다 */
          is_manual: 1
        }
      });
    });

    /* 매입 — 금액을 적었을 때만 (짝이 안 맞는 줄은 위에서 걸렀다) */
    if (eAmt) {
      var tax = get(line, '매입 세율 (비우면 3.3%)');
      plan.project_expenses.add.push({
        row: r + 1,
        data: {
          project_id: tmp, category: '강의',
          name: newProjBlank_(eName) ? '' : eName,
          total_amount: eAmt,
          tax_type: newProjBlank_(tax) ? '3.3%' : tax,
          is_manual: 1
        }
      });
    }
  }

  return { plan: plan, problems: problems, count: count };
}


/* ═════ Bulk.gs ═════ */
/**
 * 엑셀로 한꺼번에 고치기
 *
 *   ① 엑셀 내려받기  → 사이트의 모든 자료가 시트 12장에 담긴다
 *   ② 엑셀에서 고치기 → 줄 수정 · 추가 · 삭제
 *   ③ 올리기          → 무엇이 어떻게 바뀌는지 먼저 보여준다
 *   ④ 반영하기        → 합계·부가세를 다시 계산해서 저장한다
 *
 * 중요한 약속
 *   · 맨 앞의 「번호」 칸으로 어느 줄인지 알아본다. 지우거나 바꾸면 안 된다.
 *   · 번호를 비워두면 「새 줄」로 본다.
 *   · 엑셀에서 줄을 통째로 지우면 「삭제」로 본다.
 *   · 회색으로 표시된 칸(합계·부가세 등)은 적어도 무시한다. 서버가 다시 계산한다.
 */

/* ═══════════════ 큰 자료를 잠깐 보관하기 ═══════════════
 *
 * 구글의 짧은 기억은 한 칸에 100KB 까지만 담긴다.
 * 올린 엑셀의 내용은 그보다 크므로 토막 내서 담는다.
 * (미리보기에서 본 그대로를 반영하기 위해 잠깐 들고 있어야 한다)
 */
var BIG_CHUNK = 30000;      // 한글은 글자당 3바이트라 넉넉히 잡는다
var BIG_MAX = 300;          // 이보다 크면 포기한다
var BIG_SEC = 1800;         // 30분

function bigPut_(key, text) {
  var n = Math.ceil(text.length / BIG_CHUNK) || 1;
  if (n > BIG_MAX) throw new Error('엑셀이 너무 큽니다. 시트를 나눠서 올려주세요.');

  var c = CacheService.getScriptCache();
  var obj = {};
  for (var i = 0; i < n; i++) obj[key + '.' + i] = text.substr(i * BIG_CHUNK, BIG_CHUNK);
  c.putAll(obj, BIG_SEC);
  c.put(key, String(n), BIG_SEC);        // 토막 수를 마지막에 적는다
  return n;
}

function bigGet_(key) {
  var c = CacheService.getScriptCache();
  var head = c.get(key);
  if (!head) return null;
  var n = Number(head);
  if (!(n >= 1)) return null;

  var keys = [];
  for (var i = 0; i < n; i++) keys.push(key + '.' + i);
  var got = c.getAll(keys);

  var s = '';
  for (var j = 0; j < n; j++) {
    var part = got[key + '.' + j];
    if (part === null || part === undefined) return null;    // 토막이 빠졌으면 버린다
    s += part;
  }
  return s;
}

function bigDrop_(key) {
  var c = CacheService.getScriptCache();
  var head = c.get(key);
  var n = head ? Number(head) : 0;
  var keys = [key];
  for (var i = 0; i < n; i++) keys.push(key + '.' + i);
  try { c.removeAll(keys); } catch (e) {}
}

/* ═══════════════ 시트 정의 ═══════════════ */

/**
 * 엑셀에 담을 시트들.
 *
 *   key    표 이름
 *   name   시트 이름
 *   edit   고쳐서 올릴 수 있는 시트인지 (false 면 보기 전용)
 *   cols   [엑셀 머리글, 표의 칸 이름, 종류, 돈?]
 *            종류 n=숫자 · t=글자 · d=날짜 · ro=읽기전용(서버가 계산)
 *            돈   1 이면 엑셀에서 천 단위마다 쉼표를 찍는다
 */
function bulkSheets() {
  return [
    /*
     * 과정과 그에 딸린 매출·매입·계산서를 한 시트에 모은다.
     * 자세한 모양은 BulkGroup.gs 에 있다.
     */
    /*
     * 차례는 「자주 쓰는 것부터」 — 엑셀을 열면 맨 왼쪽 시트가 먼저 보인다.
     * (대표님 지시 2026-10-28)
     *
     *   ① 신규 과정 추가 — 새로 넣을 때. 늘 비어 있고 칸이 13개뿐이다.
     *   ② 과정          — 고칠 때. 칸이 47개로 자세하다.
     *   ③ 과정 요약      — 훑어볼 때 (보기 전용)
     */
    { key: '_newproj', name: NEW_SHEET, edit: true, newproj: true, cols: newProjCols() },
    { key: '_group', name: GROUP_SHEET, edit: true, group: true, cols: groupCols() },
    { key: '_summary', name: '과정 요약', edit: false, summary: true, cols: summaryCols() },
    {
      key: 'clients', name: '고객사', edit: true,
      cols: [['번호', 'id', 'ref'], ['고객사명', 'name', 't'], ['사용', 'is_active', 'n']]
    },
    {
      key: 'contacts', name: '고객사 담당자', edit: true,
      cols: [
        ['번호', 'id', 'ref'], ['고객사번호', 'client_id', 'n'], ['고객사명', '_client', 'ro'],
        ['담당자명', 'name', 't'], ['직급', 'position', 't'], ['부서', 'department', 't'],
        ['사용', 'is_active', 'n']
      ]
    },
    {
      key: 'instructors', name: '강사', edit: true,
      cols: [
        ['번호', 'id', 'ref'], ['이름', 'name', 't'], ['직함', 'title', 't'],
        ['회사명', 'affiliation', 't'], ['이메일', 'email', 't'],
        ['기본세율', 'default_tax_type', 't'], ['기본단가', 'default_unit_price', 'n', 1],
        ['사용', 'is_active', 'n']
      ]
    },
    {
      key: 'partners', name: '협력사', edit: true,
      cols: [
        ['번호', 'id', 'ref'], ['협력사명', 'name', 't'], ['분류', 'category', 't'],
        ['기본세율', 'default_tax_type', 't'], ['비고', 'note', 't'], ['사용', 'is_active', 'n']
      ]
    },
    {
      key: 'corp_cards', name: '법인카드', edit: true,
      cols: [
        ['번호', 'id', 'ref'], ['뒤 4자리', 'last4', 't'], ['카드사', 'issuer', 't'],
        ['소지자', 'holder', 't'], ['회사', 'company', 't'], ['비고', 'note', 't'],
        ['사용', 'is_active', 'n']
      ]
    },
    {
      key: 'staff', name: '직원·외부영업', edit: true,
      cols: [
        ['번호', 'id', 'ref'], ['이름', 'name', 't'], ['구분', 'kind', 't'],
        ['직급', 'position', 't'], ['비고', 'note', 't'], ['사용', 'is_active', 'n']
      ]
    },
    {
      key: 'overheads', name: '회사 경비', edit: true,
      cols: [
        ['번호', 'id', 'ref'], ['지출일', 'spend_date', 'd'], ['분류', 'category', 't'],
        ['내역', 'name', 't'], ['금액', 'amount', 'n', 1], ['부가세', 'vat', 'n', 1],
        ['부가세처리', 'tax_type', 't'], ['카드번호', 'card_last4', 't'], ['비고', 'note', 't']
      ]
    },
    {
      key: 'users', name: '사용자', edit: true,
      cols: [
        ['번호', 'id', 'ref'], ['아이디', 'username', 't'], ['이름', 'name', 't'],
        ['권한', 'role', 't'], ['사용', 'is_active', 'n']
      ]
    },
    /*
     * 계산서 품목 — 보기 전용.
     * 세금계산서 한 장 안에 여러 품목이 들어가므로 표 한 줄로 담을 수 없다.
     * 고치려면 사이트의 세금계산서 화면에서 해야 한다.
     */
    {
      key: 'project_invoices', name: '계산서 품목', edit: false, items: true,
      cols: [
        ['과정번호', 'project_id', 'ro'], ['과정명', '_course', 'ro'],
        ['장', 'seq', 'ro'], ['항목', '_name', 'ro'],
        ['수량', '_qty', 'ro'], ['단가', '_price', 'ro', 1],
        ['공급가액', '_supply', 'ro', 1], ['세액', '_vat', 'ro', 1],
        ['합계', '_total', 'ro', 1], ['비고', '_note', 'ro']
      ]
    }
  ];
}

/* ═══════════════ 내려받기 ═══════════════ */

/** 일정을 사람이 읽는 글자로 (2026-03-02 ~ 2026-03-04, 2026-04-01) */
function datesToText_(p) {
  return normalizeSchedule(p.schedule_dates, p.schedule_type).map(function (r) {
    return r.s === r.e ? r.s : r.s + '~' + r.e;
  }).join(', ');
}

/** 그 글자를 다시 일정으로 */
/*
 * 적어 주신 교육일정을 날짜로 읽는다.
 *
 * 사람이 적는 대로 읽어야 한다. 대표님은 이렇게 적으신다
 *   2026-10-6,10-8,10-13 / 11-3,11-5
 * 앞에 한 번 연도를 적고 그 뒤로는 월·일만, 묶음은 「/」로 가른다.
 * 전에는 2026-10-06 처럼 적은 것만 읽어서, 위 글은 통째로 못 알아들었다.
 * (대표님이 겪으심 2026-10-28)
 *
 * 읽는 규칙
 *   나누는 글자   ,  ;  줄바꿈  그리고 「/」
 *   날짜          2026-10-6 · 2026.10.6 · 2026/10/6 · 20261006
 *   연도 생략     10-8 → 바로 앞에 나온 연도를 따른다
 *   기간          2026-11-03~2026-11-05  (~ 뒤도 연도 생략 가능)
 *
 * 「/」가 날짜 안에 쓰인 경우(2026/10/06)와 헷갈리지 않게,
 * 글 안에 「-」로 적은 날짜가 하나라도 있으면 「/」를 나누는 글자로 본다.
 */
function textToDates_(v) {
  var raw = String(v === null || v === undefined ? '' : v).trim();
  if (!raw) return [];

  /* 「/」를 나누는 글자로 볼 것인가 */
  var dashDate = /\d{1,4}\s*-\s*\d{1,2}/.test(raw);
  var splitter = dashDate ? /[,;\n\/]/ : /[,;\n]/;

  var year = '';
  var out = [];

  /** 날짜 한 조각을 YYYY-MM-DD 로. 못 읽으면 null */
  var one = function (t) {
    var s = String(t || '').trim().replace(/[.\/]/g, '-').replace(/\s+/g, '');
    if (!s) return null;

    var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) { year = m[1]; return m[1] + '-' + pad2_(m[2]) + '-' + pad2_(m[3]); }

    m = s.match(/^(\d{4})(\d{2})(\d{2})$/);          // 20261006
    if (m) { year = m[1]; return m[1] + '-' + m[2] + '-' + m[3]; }

    m = s.match(/^(\d{1,2})-(\d{1,2})$/);            // 10-8  (연도 생략)
    if (m && year) return year + '-' + pad2_(m[1]) + '-' + pad2_(m[2]);

    return null;
  };

  raw.split(splitter).forEach(function (chunk) {
    var t = String(chunk).trim();
    if (!t) return;

    var two = t.split('~');
    var s = one(two[0]);
    if (!s) return;                                   // 못 읽은 조각은 버린다
    var e = (two.length > 1) ? one(two[1]) : null;
    out.push({ s: s, e: e || s });
  });

  return out;
}

/* 한 자리를 두 자리로 만드는 pad2_ 는 Analytics.gs 에 이미 있다.
   같은 이름을 또 만들면 나중 것이 앞의 것을 조용히 덮어쓴다. */

/** 받는사람 목록에서 한 칸만 뽑아 쉼표로 잇는다 */
function recvField_(raw, field) {
  return unwrap_(raw, []).map(function (r) {
    return String((r && r[field]) || '').trim();
  }).filter(Boolean).join(', ');
}

/** 쉼표로 이은 세 글자를 받는사람 목록으로 되돌린다 */
function toRecipients_(names, emails, phones) {
  var sp = function (v) {
    return String(v || '').split(',').map(function (x) { return x.trim(); });
  };
  var n = sp(names), e = sp(emails), p = sp(phones);
  var out = [];
  for (var i = 0; i < n.length; i++) {
    if (!n[i] && !e[i] && !p[i]) continue;
    out.push({ name: n[i] || '', email: e[i] || '', phone: p[i] || '' });
  }
  return out.slice(0, 2);
}

/** 계산서 품목 — 계산서 한 장에 여러 줄이 나온다 */
function invoiceItemRows_(ctx) {
  var out = [];
  Db.all('project_invoices').slice()
    .sort(function (a, b) { return (a.project_id - b.project_id) || ((a.seq || 0) - (b.seq || 0)); })
    .forEach(function (i) {
      unwrap_(i.items, []).forEach(function (it) {
        var supply = parseInt(it.supply, 10) || 0;
        var vat = parseInt(it.vat, 10) || 0;
        out.push([
          i.project_id, ctx.courseName[i.project_id] || '', i.seq,
          it.name || '', it.qty || '', parseInt(it.price, 10) || 0,
          supply, vat, supply + vat, it.note || ''
        ]);
      });
    });
  return out;
}

/** 한 시트의 내용을 만든다 (머리글 + 줄들) */
function bulkSheetData(def, ctx) {
  if (def.summary) return summarySheetData(ctx);
  if (def.group) return groupSheetData(ctx);
  if (def.newproj) return newProjSheetData();
  if (def.items) {
    return { header: def.cols.map(function (c) { return c[0]; }), rows: invoiceItemRows_(ctx) };
  }

  var rows = Db.all(def.key).slice().sort(function (a, b) { return a.id - b.id; });

  var body = rows.map(function (r) {
    return def.cols.map(function (c) {
      var k = c[1];

      /* 보기 편하라고 넣는 칸들 (고칠 수 없다) */
      if (k === '_client') {
        var cid = def.key === 'projects' ? r.client_id : r.client_id;
        return cid ? (ctx.clientName[cid] || '') : '';
      }
      if (k === '_contact') return r.contact_id ? (ctx.contactName[r.contact_id] || '') : '';
      if (k === '_course') return ctx.courseName[r.project_id] || '';
      if (k === '_dates') return datesToText_(r);
      if (k === '_days') return countDays(normalizeSchedule(r.schedule_dates, r.schedule_type));
      if (k === '_profit') return (r.total_sales || 0) - (r.total_expenses || 0);
      if (k === '_margin') {
        return r.total_sales
          ? Math.round(((r.total_sales - (r.total_expenses || 0)) / r.total_sales) * 1000) / 10
          : 0;
      }
      if (k === '_amount') {
        // 계산서의 「금액」 — 부가세 포함이면 합계, 아니면 공급가액
        return (r.vat_mode === '포함') ? (r.total_amount || 0) : (r.supply_amount || 0);
      }
      if (k === '_recv_name') return recvField_(r.recipients, 'name');
      if (k === '_recv_email') return ctx.personal ? recvField_(r.recipients, 'email') : '';
      if (k === '_recv_phone') return ctx.personal ? recvField_(r.recipients, 'phone') : '';

      if (k === 'email' && !ctx.personal) return '';

      var v = r[k];
      return (v === null || v === undefined) ? '' : v;
    });
  });

  return { header: def.cols.map(function (c) { return c[0]; }), rows: body };
}

/** 내려받을 자료 전체를 만든다 */
function bulkBuild(u, opts) {
  requireAdmin(u);
  opts = opts || {};
  var personal = !(opts.personal === false || opts.personal === '0' || opts.personal === 'false');

  var ctx = { personal: personal, clientName: {}, contactName: {}, courseName: {} };
  Db.all('clients').forEach(function (c) { ctx.clientName[c.id] = c.name; });
  Db.all('contacts').forEach(function (c) { ctx.contactName[c.id] = c.name; });
  Db.all('projects').forEach(function (p) { ctx.courseName[p.id] = p.course_name; });

  return bulkSheets().map(function (def) {
    var d = bulkSheetData(def, ctx);
    return { key: def.key, name: def.name, header: d.header, rows: d.rows };
  });
}

/* ═══════════════ 내려받을 자료 ═══════════════ */

/**
 * 내려받을 자료를 그대로 돌려준다. 엑셀 파일은 브라우저가 만든다.
 *
 * 전에는 구글 드라이브에 스프레드시트를 잠깐 만들어 엑셀로 바꿨는데,
 * 그 과정이 30초 가까이 걸리고 자주 실패했다.
 * 자료만 보내고 파일은 브라우저에서 만들면 몇 초면 끝나고,
 * 드라이브에 아무것도 남지 않는다.
 */
function bulkData(u, opts) {
  requireAdmin(u);
  opts = opts || {};
  var personal = !(opts.personal === false || opts.personal === '0' || opts.personal === 'false');

  var sheets = bulkBuild(u, opts);

  /*
   * 칸마다 성질을 함께 보낸다.
   *   readonly  서버가 계산하는 칸 (엑셀에서 적어도 무시된다)
   *   money     돈이라서 천 단위마다 쉼표를 찍을 칸
   *   edit      이 시트를 고쳐서 올릴 수 있는지
   */
  var defs = bulkSheets();
  sheets.forEach(function (s, i) {
    var cols = defs[i].cols;
    // 합친 「과정」 시트는 [머리글, 종류, 돈?] 이라 자리가 하나씩 앞이다
    var g = !!(defs[i].group || defs[i].summary);
    s.readonly = cols.map(function (c) { return (g ? c[1] : c[2]) === 'ro'; });
    s.money = cols.map(function (c) { return !!(g ? c[2] : c[3]); });
    s.edit = defs[i].edit !== false;
  });

  return {
    filename: '혜움_자료' + (personal ? '' : '_개인정보제외') + '_' + today() + '.xlsx',
    personal: personal,
    sheets: sheets
  };
}


/* ═════ BulkApply.gs ═════ */
/**
 * 올린 엑셀을 읽어서 「무엇이 바뀌는지」 알아내고, 확인받은 뒤에 반영한다.
 *
 * 두 단계로 나눈 이유
 *   바로 반영해 버리면 잘못 올렸을 때 되돌릴 수 없다.
 *   그래서 ① 먼저 읽어서 보여주고 ② 사람이 확인한 뒤에 저장한다.
 */

/* ═══════════════ 올라온 자료 ═══════════════
 *
 * 엑셀 파일을 읽는 일은 브라우저가 한다.
 * 여기로는 「시트이름 → 표」 꼴로 이미 풀린 자료가 온다.
 *
 * 전에는 엑셀을 구글 드라이브에 올려 시트로 바꿔서 읽었는데,
 * 느리고 자주 실패해서 그만뒀다.
 */

/** 엑셀 칸 하나를 표의 값으로 */
function cellValue_(v, kind) {
  if (v === '' || v === null || v === undefined) return null;
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Seoul', 'yyyy-MM-dd');
  if (kind === 'n') {
    if (typeof v === 'number') return v;
    var n = Number(String(v).replace(/,/g, '').trim());
    return isNaN(n) ? null : n;
  }
  /*
   * 번호를 가리키는 칸.
   * 숫자면 숫자로, 숫자가 아니면 글자 그대로 둔다.
   * 새 과정을 엑셀로 넣을 때 「새1」 같은 임시 이름을 쓰기 때문이다.
   */
  if (kind === 'ref') {
    if (typeof v === 'number') return v;
    var t = String(v).replace(/,/g, '').trim();
    if (t === '') return null;
    var rn = Number(t);
    return isNaN(rn) ? t : rn;
  }
  if (kind === 'd') {
    var s = String(v).trim();
    return DATE_RE.test(s) ? s : (s || null);
  }
  return String(v).trim();
}

/* ═══════════════ 무엇이 바뀌는지 ═══════════════ */

/**
 * 올린 자료와 지금 자료를 맞춰본다.
 * 저장은 하지 않는다. 무엇이 바뀔지만 알아낸다.
 *
 * @return {Object} { plan, summary, problems }
 */
/**
 * 두 값이 같은 뜻인지.
 * 앞뒤 공백과 「빈 값의 여러 모습」(null · undefined · '')을 같게 본다.
 * 그래야 「받아서 그대로 올리면 바뀐 것 없음」이 된다.
 */
function sameValue_(a, b) {
  var sa = (a === null || a === undefined) ? '' : String(a).trim();
  var sb = (b === null || b === undefined) ? '' : String(b).trim();
  if (sa === sb) return true;
  // 숫자는 1 과 '1', 1.0 과 1 을 같게 본다
  var na = Number(sa), nb = Number(sb);
  if (sa !== '' && sb !== '' && !isNaN(na) && !isNaN(nb)) return na === nb;
  return false;
}

function bulkDiff_(sheetsIn) {
  var defs = bulkSheets();
  var plan = {};        // { 표이름: { add:[], edit:[], del:[] } }
  var problems = [];
  var summary = [];

  /*
   * 지금 자료를 「내려받을 때와 똑같은 모습」으로 한 번 만들어 둔다.
   *
   * 원본 칸과 바로 비교하면 안 된다. 고객사·교육일정·금액처럼
   * 보기 좋게 바꿔서 내보내는 칸들이 늘 「바뀌었다」로 잡히기 때문이다.
   * 내보낸 것과 올라온 것을 견주어야 「그대로 올리면 변경 없음」이 된다.
   */
  var ctx = { personal: true, clientName: {}, contactName: {}, courseName: {} };
  Db.all('clients').forEach(function (c) { ctx.clientName[c.id] = c.name; });
  Db.all('contacts').forEach(function (c) { ctx.contactName[c.id] = c.name; });
  Db.all('projects').forEach(function (p) { ctx.courseName[p.id] = p.course_name; });

  defs.forEach(function (def) {
    // 보기 전용 시트는 올려도 무시한다
    if (def.edit === false) return;

    /* 합친 「과정」 시트는 따로 읽는다 (한 시트 안에 네 가지가 섞여 있다) */
    if (def.group) {
      var g = sheetsIn[def.name];
      if (!g) {
        summary.push({ name: def.name, skipped: true, add: 0, edit: 0, del: 0 });
        return;
      }
      var gd = groupDiff_(g, ctx);
      /*
       * 덮어쓰지 말고 더한다.
       *
       * 「신규 과정 추가」 시트도 같은 표(projects·project_sales·
       * project_expenses)에 줄을 넣는다. 덮어쓰면 시트 차례에 따라
       * 한쪽이 통째로 사라진다 — 차례를 바꾸는 순간 조용히 깨진다.
       * (2026-10-28, 시트 차례를 바꾸다 드러났다)
       */
      Object.keys(gd.plan).forEach(function (t) {
        if (!plan[t]) plan[t] = { add: [], edit: [], del: [] };
        ['add', 'edit', 'del'].forEach(function (k) {
          (gd.plan[t][k] || []).forEach(function (x) { plan[t][k].push(x); });
        });
      });
      gd.problems.forEach(function (x) { problems.push(x); });

      var LABEL = {
        projects: '과정', project_sales: '매출',
        project_expenses: '매입', project_invoices: '계산서'
      };
      Object.keys(gd.summary).forEach(function (t) {
        var x = gd.summary[t];
        summary.push({
          name: LABEL[t], key: t, skipped: false,
          add: x.add, edit: x.edit, del: x.del
        });
      });
      return;
    }

    /*
     * 「신규 과정 추가」 시트 — 한 줄을 과정+매출+매입 여러 줄로 푼다.
     *
     * 푼 것을 「과정」 시트가 만든 계획에 **더한다** (덮어쓰지 않는다).
     * 두 시트를 같이 고쳐 올릴 수 있어야 하기 때문이다.
     * 임시 번호를 붙여 두면 저장할 때 realPid 가 진짜 번호로 이어 준다.
     */
    if (def.newproj) {
      var ng = sheetsIn[def.name];
      if (!ng) {
        summary.push({ name: def.name, skipped: true, add: 0, edit: 0, del: 0 });
        return;
      }
      var nd = newProjDiff_(ng);
      nd.problems.forEach(function (x) { problems.push(x); });
      Object.keys(nd.plan).forEach(function (t) {
        if (!plan[t]) plan[t] = { add: [], edit: [], del: [] };
        nd.plan[t].add.forEach(function (a) { plan[t].add.push(a); });
      });
      summary.push({
        name: def.name, key: '_newproj', skipped: false,
        add: nd.count, edit: 0, del: 0
      });
      return;
    }

    var grid = sheetsIn[def.name];
    var cur = Db.all(def.key);
    var curById = {};
    cur.forEach(function (r) { curById[r.id] = r; });

    /* 지금 자료를 내보낸 모습 — 번호별로 찾아 쓸 수 있게 */
    var mine = bulkSheetData(def, ctx);
    var mineById = {};
    mine.rows.forEach(function (row) { mineById[row[0]] = row; });
    var mineAt = {};
    def.cols.forEach(function (c, i) { mineAt[c[1]] = i; });

    // 그 시트를 아예 안 올렸으면 건드리지 않는다
    if (!grid) {
      summary.push({ name: def.name, skipped: true, add: 0, edit: 0, del: 0 });
      return;
    }

    var header = (grid[0] || []).map(function (h) { return String(h || '').trim(); });
    // 엑셀의 머리글 위치를 찾아둔다 (칸 순서를 바꿔도 되도록)
    var at = {};
    def.cols.forEach(function (c) {
      var i = header.indexOf(c[0]);
      if (i >= 0) at[c[1]] = i;
    });

    if (at.id === undefined) {
      problems.push(def.name + ' 시트에 「번호」 칸이 없습니다. 양식을 다시 받아주세요.');
      summary.push({ name: def.name, skipped: true, add: 0, edit: 0, del: 0 });
      return;
    }

    var add = [], edit = [], seen = {};

    for (var r = 1; r < grid.length; r++) {
      var line = grid[r];
      // 통째로 빈 줄은 건너뛴다
      var empty = true;
      for (var i = 0; i < line.length; i++) {
        if (line[i] !== '' && line[i] !== null && line[i] !== undefined) { empty = false; break; }
      }
      if (empty) continue;

      var obj = {};
      def.cols.forEach(function (c) {
        if (c[2] === 'ro') return;                       // 서버가 계산하는 칸은 무시
        if (at[c[1]] === undefined) return;
        obj[c[1]] = cellValue_(line[at[c[1]]], c[2]);
      });

      var id = obj.id;

      /* 번호가 비어 있으면 새 줄 */
      if (id === null || id === undefined || id === '') {
        delete obj.id;
        add.push({ row: r + 1, data: obj });
        continue;
      }

      /*
       * 번호가 숫자가 아니면 「새 과정에 붙일 임시 이름」으로 본다.
       *
       * 새 과정을 엑셀로 넣을 때는 아직 번호가 없다.
       * 그래서 과정 시트의 번호 칸에 「새1」 처럼 아무 이름이나 적고,
       * 매출·매입·계산서의 과정번호에도 같은 「새1」 을 적으면
       * 저장할 때 서버가 진짜 번호로 바꿔 이어준다.
       */
      if (isNaN(Number(id))) {
        var tmp = String(id).trim();
        if (def.key === 'projects') {
          delete obj.id;
          add.push({ row: r + 1, data: obj, tempId: tmp });
        } else {
          problems.push(def.name + ' ' + (r + 1) + '번째 줄: 번호 칸에는 숫자만 적어주세요. ('
            + tmp + ')');
        }
        continue;
      }

      id = Number(id);
      var old = curById[id];
      if (!old) {
        problems.push(def.name + ' ' + (r + 1) + '번째 줄: 번호 ' + id + ' 인 자료가 없습니다.');
        continue;
      }
      if (seen[id]) {
        problems.push(def.name + ' ' + (r + 1) + '번째 줄: 번호 ' + id
          + ' 이 앞에서 이미 나왔습니다. 한 줄만 남겨주세요.');
        continue;
      }
      seen[id] = true;

      // 내보냈던 값과 견주어, 실제로 달라진 칸만 모은다
      var was = mineById[id] || [];
      var patch = {}, n = 0;
      Object.keys(obj).forEach(function (k) {
        if (k === 'id') return;
        var i = mineAt[k];
        var before = (i === undefined) ? old[k] : was[i];
        if (!sameValue_(obj[k], before)) { patch[k] = obj[k]; n++; }
      });
      if (n) edit.push({ id: id, row: r + 1, patch: patch, before: old });
    }

    // 엑셀에서 사라진 줄 = 삭제
    var del = cur.filter(function (x) { return !seen[x.id]; })
      .map(function (x) { return { id: x.id, label: bulkLabel_(def.key, x) }; });

    plan[def.key] = { add: add, edit: edit, del: del };
    summary.push({
      name: def.name, key: def.key, skipped: false,
      add: add.length, edit: edit.length, del: del.length
    });
  });

  return { plan: plan, summary: summary, problems: problems };
}

/** 삭제될 줄이 무엇인지 사람이 알아볼 수 있게 */
function bulkLabel_(key, r) {
  if (key === 'projects') return r.course_name || ('#' + r.id);
  if (key === 'project_sales' || key === 'project_expenses') {
    return (r.name || '') + ' (과정 ' + r.project_id + ')';
  }
  if (key === 'project_invoices') return '과정 ' + r.project_id + ' / ' + r.seq + '장';
  if (key === 'overheads') return (r.spend_date || '') + ' ' + (r.name || '');
  if (key === 'corp_cards') return r.last4 || ('#' + r.id);
  return r.name || r.username || ('#' + r.id);
}

/* ═══════════════ 미리보기 ═══════════════ */

/**
 * 엑셀을 읽어 「이렇게 바뀝니다」를 돌려준다. 저장하지 않는다.
 * 확인한 내용 그대로 반영하도록, 읽은 자료를 잠깐 보관해 두고 열쇠를 함께 준다.
 */
function bulkPreview(u, body) {
  requireAdmin(u);
  var sheetsIn = body && body.sheets;
  if (!sheetsIn || typeof sheetsIn !== 'object') throw new Error('엑셀 파일을 올려주세요.');
  if (!Object.keys(sheetsIn).length) throw new Error('엑셀에서 시트를 찾지 못했습니다.');

  var d = bulkDiff_(sheetsIn);

  // 바뀐 뒤의 금액이 얼마가 될지 미리 알려준다
  var before = bulkTotals_();

  // 확인 버튼을 눌렀을 때 「방금 본 그대로」 반영하도록 보관해 둔다
  // 미리보기에서 본 그대로 반영하도록 잠깐 보관해 둔다 (토막 내서)
  var ticket = Utilities.getUuid();
  bigPut_('bulk.' + ticket, JSON.stringify(sheetsIn));

  return {
    ticket: ticket,
    summary: d.summary,
    problems: d.problems,
    before: before,
    deletes: bulkDeletePreview_(d.plan),
    edits: bulkEditPreview_(d.plan),
    sheetsFound: Object.keys(sheetsIn)
  };
}

/** 지워질 줄 몇 개를 보여준다 (무심코 지우는 사고를 막는다) */
function bulkDeletePreview_(plan) {
  var out = [];
  Object.keys(plan).forEach(function (k) {
    var del = plan[k].del || [];
    if (!del.length) return;
    out.push({
      key: k,
      count: del.length,
      sample: del.slice(0, 8).map(function (x) { return x.label; })
    });
  });
  return out;
}

/*
 * 무엇이 어떻게 바뀌는지 보여준다.
 *
 * 전에는 「수정 1건」 이라고 숫자만 알려줬다. 고친 기억이 없는데
 * 그렇게 나오면, 반영해도 되는지 알 길이 없어 그냥 취소하게 된다.
 * 실제로 대표님이 그런 일을 겪으셨다. (2026-10-28)
 *
 * 그래서 「어느 줄의 어느 칸이 무엇에서 무엇으로」 를 적어 보낸다.
 * 보시고 맞으면 반영, 아니면 엑셀을 다시 받으시면 된다.
 */
function bulkEditPreview_(plan) {
  var LABEL = {
    projects: '과정', project_sales: '매출',
    project_expenses: '매입', project_invoices: '계산서'
  };
  /* 칸 이름을 엑셀 머리글과 같게 보여준다 — 「schedule_dates」 로는 못 알아본다 */
  var FIELD = {
    course_name: '과정명', _client: '고객사', _contact: '고객담당자',
    _dates: '교육일정', schedule_dates: '교육일정', schedule_type: '일정유형',
    type: '교육구분', company: '회사', manager: '혜움담당자', sales_rep: '영업(외부)',
    memo: '메모', vat_mode: '부가세처리', discount: '절사', discount_base: '절사기준',
    category: '세부분류', name: '항목·이름', amount: '금액', total_amount: '금액',
    unit_price: '단가', qty1: '수량', unit1: '단위', sessions: '차수',
    quantity: '수량', unit: '단위', tax_type: '세율', payment_date: '지급일',
    affiliation: '소속', card_last4: '카드번호', note: '비고',
    is_manual: '수기작성', supply_amount: '공급가액', vat: '부가세',
    issue_date: '발행일', paid_date: '입금일', seq: '장수', pay_type: '청구/영수'
  };
  var show = function (v) {
    if (v === null || v === undefined || v === '') return '(비어 있음)';
    var s = String(v);
    return s.length > 40 ? s.slice(0, 40) + '…' : s;
  };

  var out = [];
  Object.keys(plan).forEach(function (k) {
    (plan[k].edit || []).slice(0, 10).forEach(function (e) {
      var fields = [];
      Object.keys(e.patch).forEach(function (fld) {
        if (fld === 'updated_at') return;            // 저절로 바뀌는 칸은 보여줄 것이 없다
        fields.push({
          name: FIELD[fld] || fld,
          from: show(e.before ? e.before[fld] : null),
          to: show(e.patch[fld])
        });
      });
      if (!fields.length) return;
      out.push({
        key: k,
        label: (LABEL[k] || k) + ' #' + e.id,
        row: e.row,
        fields: fields.slice(0, 6)
      });
    });
  });
  return out;
}

/** 지금 금액 */
function bulkTotals_() {
  var s = 0, e = 0;
  Db.all('projects').forEach(function (p) {
    s += p.total_sales || 0;
    e += p.total_expenses || 0;
  });
  return {
    projects: Db.all('projects').length,
    sales: s, expenses: e,
    instructors: Db.all('instructors').length,
    clients: Db.all('clients').length
  };
}

/* ═══════════════ 반영하기 ═══════════════ */

/**
 * 미리보기에서 본 그대로 저장한다.
 *
 * 과정에 딸린 것(매출·매입·계산서)을 고치면
 * 그 과정의 합계·부가세를 다시 계산한다.
 */
function bulkApply(u, body) {
  requireAdmin(u);
  if (!body || !body.ticket) throw new Error('먼저 미리보기를 해주세요.');

  var raw = bigGet_('bulk.' + body.ticket);
  if (!raw) throw new Error('확인 시간이 지났습니다. 엑셀을 다시 올려주세요.');

  var sheetsIn = JSON.parse(raw);
  var d = bulkDiff_(sheetsIn);

  if (d.problems.length && !body.force) {
    throw new Error('고칠 곳이 있습니다:\n' + d.problems.slice(0, 10).join('\n'));
  }

  var defs = bulkSheets();
  var touchedProjects = {};
  var done = { add: 0, edit: 0, del: 0 };

  /*
   * 엑셀에서 「새1」 처럼 적은 임시 이름 → 실제로 만들어진 과정 번호.
   * 과정을 먼저 만들고, 그 뒤에 매출·매입·계산서가 이것을 보고 이어 붙는다.
   */
  var tempMap = {};

  /** 과정번호가 임시 이름이면 진짜 번호로 바꾼다 */
  var realPid = function (v) {
    if (v === null || v === undefined || v === '') return v;
    if (!isNaN(Number(v))) return Number(v);
    var hit = tempMap[String(v).trim()];
    return hit === undefined ? null : hit;
  };

  /*
   * 어느 표를 어떤 순서로 저장할지.
   *
   * 합친 「과정」 시트 하나가 네 개의 표를 담고 있으므로 시트 목록 그대로 돌면 안 된다.
   * 과정을 먼저 만들어야 매출·매입·계산서가 그 번호를 찾아 붙을 수 있다.
   */
  var saveOrder = [];
  defs.forEach(function (def) {
    if (def.edit === false) return;
    if (def.group) {
      ['projects', 'project_sales', 'project_expenses', 'project_invoices']
        .forEach(function (t) { if (saveOrder.indexOf(t) < 0) saveOrder.push(t); });
      return;
    }
    if (saveOrder.indexOf(def.key) < 0) saveOrder.push(def.key);
  });
  // 고객사·담당자를 먼저 만들어 둬야 과정이 이름으로 찾아 쓸 수 있다
  ['contacts', 'clients'].forEach(function (t) {
    var i = saveOrder.indexOf(t);
    if (i > 0) { saveOrder.splice(i, 1); saveOrder.unshift(t); }
  });

  var TABLE_LABEL = {
    projects: '과정', project_sales: '매출',
    project_expenses: '매입', project_invoices: '계산서'
  };

  saveOrder.forEach(function (key) {
    var def = { key: key, name: TABLE_LABEL[key] || key };
    var p = d.plan[key];
    if (!p) return;

    /* 지우기 — 과정을 지우면 딸린 것도 함께 지운다 */
    p.del.forEach(function (x) {
      if (def.key === 'projects') {
        Db.removeWhere('project_sales', function (r) { return r.project_id === x.id; });
        Db.removeWhere('project_expenses', function (r) { return r.project_id === x.id; });
        Db.removeWhere('project_invoices', function (r) { return r.project_id === x.id; });
      }
      Db.remove(def.key, x.id);
      if (def.key !== 'projects') {
        var row = x.project_id;
        if (row) touchedProjects[row] = true;
      }
      done.del++;
    });

    /* 고치기 */
    p.edit.forEach(function (x) {
      var patch = bulkNormalize_(def.key, x.patch, x.before);
      if (Object.keys(patch).length) Db.update(def.key, x.id, patch);
      var pid = patch.project_id || x.before.project_id;
      if (pid) touchedProjects[pid] = true;
      if (def.key === 'projects') touchedProjects[x.id] = true;
      done.edit++;
    });

    /* 새로 넣기 */
    p.add.forEach(function (x) {
      var data = bulkNormalize_(def.key, x.data, {});

      // 과정에 딸린 줄이면 과정번호를 진짜 번호로 바꾼다
      if ('project_id' in data) {
        var pid0 = realPid(data.project_id);
        if (pid0 === null) {
          throw new Error(def.name + ' ' + x.row + '번째 줄: 과정번호 「'
            + data.project_id + '」 를 찾지 못했습니다.\n'
            + '과정 시트에도 같은 번호를 적으셨는지 확인해주세요.');
        }
        data.project_id = pid0;
      }

      var r = Db.insert(def.key, data);

      // 새 과정이면 임시 이름과 진짜 번호를 이어 둔다
      if (def.key === 'projects') {
        if (x.tempId) tempMap[x.tempId] = r.id;
        touchedProjects[r.id] = true;
      }
      if (data.project_id) touchedProjects[data.project_id] = true;
      done.add++;
    });
  });

  /* 건드린 과정의 합계를 다시 계산한다 */
  var recalced = 0;
  Object.keys(touchedProjects).forEach(function (pid) {
    if (bulkRecalc_(Number(pid))) recalced++;
  });

  bigDrop_('bulk.' + body.ticket);

  return {
    message: '반영했습니다.',
    added: done.add, edited: done.edit, deleted: done.del,
    recalculated: recalced,
    after: bulkTotals_()
  };
}

/** 엑셀에서 온 값을 표에 맞게 다듬는다 */
function bulkNormalize_(key, obj, before) {
  var out = {};
  Object.keys(obj).forEach(function (k) { out[k] = obj[k]; });

  // 보기용 칸은 저장하지 않는다
  Object.keys(out).forEach(function (k) {
    if (k.charAt(0) === '_') delete out[k];
  });

  if (key === 'projects') {
    // 고객사·담당자는 이름으로 찾아 번호로 바꾼다 (없으면 만든다)
    if (obj._client !== undefined) {
      out.client_id = resolveClient_(null, obj._client);
    }
    if (obj._contact !== undefined) {
      var cid = out.client_id || (before && before.client_id);
      out.contact_id = resolveContact_(null, obj._contact, cid);
    }
    if (obj._dates !== undefined) {
      var st = out.schedule_type || (before && before.schedule_type) || '당일';
      out.schedule_dates = JSON.stringify(normalizeSchedule(textToDates_(obj._dates), st));
    }
    if (out.company !== undefined) out.company = normalizeCompany(out.company);
    if (out.vat_mode !== undefined) out.vat_mode = normalizeMode(out.vat_mode);
    if (out.discount_base !== undefined) out.discount_base = normalizeBase(out.discount_base);
  }

  if (key === 'project_invoices') {
    /*
     * 「계산서금액」 칸을 공급가액·부가세·합계로 풀어 준다.
     *
     * 부가세 별도면 적은 값이 공급가액이고, 포함이면 합계다.
     * (뒤에서 bulkRecalc_ 가 다시 한 번 맞춰 준다)
     */
    if (obj._amount !== undefined && obj._amount !== null) {
      var b0 = before || {};
      var mode0 = normalizeMode(out.vat_mode !== undefined ? out.vat_mode : b0.vat_mode);
      var base0 = normalizeBase(out.discount_base !== undefined ? out.discount_base : b0.discount_base);
      var disc0 = out.discount !== undefined ? out.discount : (b0.discount || 0);
      var t0 = computeTotals(obj._amount, disc0, mode0, base0);
      out.supply_amount = t0.supply;
      out.vat = t0.vat;
      out.total_amount = t0.total;
      out.vat_mode = mode0;
      out.discount_base = base0;
      out.discount = t0.discount;
    }

    if (obj._recv_name !== undefined || obj._recv_email !== undefined || obj._recv_phone !== undefined) {
      var b = before || {};
      out.recipients = JSON.stringify(toRecipients_(
        obj._recv_name !== undefined ? obj._recv_name : recvField_(b.recipients, 'name'),
        obj._recv_email !== undefined ? obj._recv_email : recvField_(b.recipients, 'email'),
        obj._recv_phone !== undefined ? obj._recv_phone : recvField_(b.recipients, 'phone')
      ));
    }
    if (out.company !== undefined) out.company = normalizeCompany(out.company);
    if (out.pay_type !== undefined) out.pay_type = (out.pay_type === '영수' ? '영수' : '청구');
  }

  if (key === 'corp_cards' && out.last4 !== undefined) {
    out.last4 = String(out.last4 || '').replace(/[^0-9]/g, '').slice(0, 4);
  }
  if (key === 'project_expenses' && out.card_last4 !== undefined) {
    out.card_last4 = String(out.card_last4 || '').replace(/[^0-9]/g, '').slice(0, 4) || null;
  }
  if (key === 'users' && out.role !== undefined) {
    out.role = out.role === 'admin' ? 'admin' : 'user';
  }

  // 「사용」 칸은 1/0 으로
  if (out.is_active !== undefined) {
    var v = out.is_active;
    out.is_active = (v === 0 || v === '0' || v === false || v === 'N' || v === 'n') ? 0 : 1;
  }

  return out;
}

/**
 * 한 과정의 금액을 다시 계산한다.
 * 매출상세 → 인건비·운영비·연수원비·공급가액·부가세·합계
 * 매입상세 → 총매입
 * 계산서   → 공급가액·부가세·합계
 */
function bulkRecalc_(projectId) {
  var p = Db.get('projects', projectId);
  if (!p) return false;

  /* 매출 */
  var totals = { '인건비': 0, '운영비': 0, '연수원비': 0 };
  Db.where('project_sales', function (r) { return r.project_id === projectId; })
    .forEach(function (s) {
      var amt = saleAmount(s);
      if (amt !== s.amount) Db.update('project_sales', s.id, { amount: amt });
      if (totals[s.category] !== undefined) totals[s.category] += amt;
    });

  var raw = totals['인건비'] + totals['운영비'] + totals['연수원비'];
  var t = computeTotals(raw, p.discount, p.vat_mode, p.discount_base);

  /* 매입 */
  var exp = 0;
  Db.where('project_expenses', function (r) { return r.project_id === projectId; })
    .forEach(function (e) {
      var amt = expenseAmount(e);
      if (amt !== e.total_amount) Db.update('project_expenses', e.id, { total_amount: amt });
      exp += amt;
    });

  Db.update('projects', projectId, {
    sale_labor: totals['인건비'], sale_operation: totals['운영비'], sale_venue: totals['연수원비'],
    total_sales: t.supply, vat: t.vat, total_with_vat: t.total,
    total_expenses: exp
  });

  /* 계산서 — 적어 넣은 「금액」으로 공급가액·부가세·합계를 다시 낸다 */
  Db.where('project_invoices', function (r) { return r.project_id === projectId; })
    .forEach(function (i) {
      var mode = normalizeMode(i.vat_mode);
      var base = normalizeBase(i.discount_base);
      var amount = (mode === '포함') ? i.total_amount : i.supply_amount;
      var c = computeTotals(amount, i.discount, mode, base);
      if (c.supply !== i.supply_amount || c.vat !== i.vat || c.total !== i.total_amount) {
        Db.update('project_invoices', i.id, {
          supply_amount: c.supply, vat: c.vat, total_amount: c.total
        });
      }
    });

  return true;
}


/* ═════ Code.gs ═════ */
/**
 * 입구 — 화면을 내려주고, 화면이 부르는 모든 요청을 받는다.
 *
 * PC 버전은 Express 가 59개 주소를 나눠 받았습니다.
 * Apps Script 에는 주소가 하나뿐이라, 화면이 보내온 method + path 를 보고
 * 여기서 갈라줍니다. 화면 코드(app.js 5,649줄)는 그대로 씁니다.
 */

/**
 * 이 주소를 브라우저로 그냥 열었을 때.
 *
 * 화면은 깃허브(hyeumcst.github.io/go)가 내려줍니다.
 * 여기는 자료만 주고받는 창구라서, 열어봐야 보여줄 화면이 없습니다.
 *
 * ⚠️ 여기에 로그인 창을 두지 않습니다.
 *    누구나 열 수 있는 주소에 「아이디·비밀번호」 입력창이 있으면
 *    구글의 자동 점검이 남을 속이려는 페이지로 오해할 수 있습니다.
 */
function doGet(e) {
  return HtmlService.createHtmlOutput(
    '<!DOCTYPE html><meta charset="utf-8">'
    + '<title>HYEUMCST</title>'
    + '<div style="font-family:system-ui,sans-serif;padding:3rem;text-align:center;color:#5f6368">'
    + '<p>이 주소는 자료를 주고받는 창구입니다.</p>'
    + '<p>관리 화면은 <b>hyeumcst.github.io/go</b> 에서 여세요.</p>'
    + '</div>'
  ).setTitle('HYEUMCST');
}

/** Index.html 안에서 css/js 를 끌어오기 위한 도우미 */
function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

/**
 * 깃허브에 올린 화면이 자료를 가져갈 때 쓰는 창구.
 *
 * 화면(HTML·CSS·JS)은 깃허브가 내려주고, 여기서는 자료만 주고받습니다.
 *   · 주소가 hyeumcst.github.io 로 고정됩니다
 *   · 구글 안내 문구가 나오지 않습니다 (구글 페이지를 열지 않으니까요)
 *   · 화면 파일은 브라우저가 기억해 두므로 두 번째부터 훨씬 빠릅니다
 *
 * 보내는 쪽은 글(text/plain)로 보냅니다. 그래야 브라우저가
 * 미리 물어보는 절차(preflight) 없이 바로 보낼 수 있습니다.
 */
function doPost(e) {
  var out = { ok: false, error: '요청을 읽을 수 없습니다.' };
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    out = apiCall(body.method, body.path, body.data, body.query, body.token);
  } catch (err) {
    out = { ok: false, error: String((err && err.message) || err) };
  }
  return ContentService
    .createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 화면이 부르는 단 하나의 창구.
 *
 * @param {string} method  GET | POST | PUT | DELETE
 * @param {string} path    /projects/12 처럼 PC 버전과 똑같은 주소
 * @param {Object} body    POST · PUT 의 본문
 * @param {Object} query   쿼리스트링을 풀어낸 객체
 * @param {string} token   로그인할 때 받은 출입증
 * @return {Object} { ok:true, data } 또는 { ok:false, error }
 */
function apiCall(method, path, body, query, token) {
  var M = String(method || 'GET').toUpperCase();
  var P = String(path || '');
  body = body || {};
  query = query || {};

  try {
    // 로그인만 출입증 없이 지날 수 있다
    if (M === 'POST' && seg_(P).join('/') === 'auth/login') {
      return { ok: true, data: doLogin(body.username, body.password, body.site) };
    }

    /*
     * 표가 두 가지다.
     *   파이어베이스 표 — 자료를 옮긴 뒤로 화면이 이것을 보낸다.
     *                    진짜인지는 구글에게 물어본다 (FbAuth.gs)
     *   예전 표        — 되돌리기(USE_FIREBASE: false) 했을 때를 위해 남겨 둔다
     *
     * 둘 다 받아야 한다. 어느 쪽으로 돌려도 발행요청 메일과 정산자료가
     * 되어야 하기 때문이다.
     */
    var u = isFirebaseToken_(token) ? userFromFirebase_(token) : userFromToken(token);
    return { ok: true, data: route_(u, M, P, body, query) };
  } catch (err) {
    var msg = String((err && err.message) || err);
    // 화면이 그대로 띄울 수 있게 사람이 읽을 수 있는 말로 돌려준다.
    // 로그인이 풀렸으면 화면이 로그인 창으로 되돌아가야 하므로 표시를 함께 보낸다.
    return { ok: false, error: msg, unauthorized: /로그인이 필요합니다|사용이 중지된/.test(msg) };
  }
}

/** 주소를 조각으로 나눈다: '/projects/12' → ['projects','12'] */
function seg_(path) {
  return String(path || '').replace(/^\/+|\/+$/g, '').split('/').filter(function (s) { return s !== ''; });
}

function route_(u, method, path, b, q) {
  var s = seg_(path);
  var head = s[0] || '';
  var a = s[1] || '';      // 두 번째 조각 (id 이거나 search/filters 같은 낱말)
  var c = s[2] || '';      // 세 번째 조각 (paid 등)
  var GET = method === 'GET', POST = method === 'POST',
      PUT = method === 'PUT', DEL = method === 'DELETE';

  /* ───── 분석 ───── */
  if (head === 'analytics') {
    if (GET && a === 'detail') return analyticsDetail(u, q);
    if (GET && !a) return analyticsGet(u, q);
  }

  /* ───── 대시보드 ───── */
  if (head === 'dashboard' && GET && a === 'summary') return dashboardSummary(u, q);

  /* ───── 과정 ─────
   * 'filters' 를 ':id' 보다 먼저 봐야 한다 (안 그러면 id 로 읽힌다)
   */
  if (head === 'projects') {
    if (GET && a === 'filters') return projectsFilters(u);
    if (GET && !a) return projectsList(u, q);
    if (GET && a) return projectsGet(u, a);
    if (POST && !a) return projectsCreate(u, b);
    if (PUT && a) return projectsUpdate(u, a, b);
    if (DEL && a) return projectsDelete(u, a);
    // 매입 누락 경고를 한 건씩 「확인함」으로 — 관리자만
    if (PUT && a && c === 'expense-check') return projectExpenseCheck(u, a, b);
  }

  /* ───── 교육진행 (실제로 현장에 다녀온 날) ───── */
  if (head === 'visits') {
    if (GET && !a) return visitsList(u, q);
    if (PUT && a) return visitsSave(u, a, b);
    if (DEL && a) return visitsDelete(u, a);
  }

  /* ───── 세금계산서 ───── */
  if (head === 'invoices') {
    if (GET && a === 'recipients') return invoiceRecipients(u, q);
    if (GET && !a) return invoicesList(u, q);
    if (PUT && a && c === 'paid') return invoiceSetPaid(u, a, b);
    // 발행 담당자에게 메일로 요청을 보낸다
    if (POST && a && c === 'request') return invoiceRequestSend(u, a, b);
  }

  /* ───── 고객사 ───── */
  if (head === 'clients') {
    if (GET && a === 'search') return clientsSearch(u, q.q);
    if (GET && !a) return clientsList(u);
    if (POST && !a) return clientsCreate(u, b);
    if (PUT && a) return clientsUpdate(u, a, b);
  }

  /* ───── 고객사 담당자 ───── */
  if (head === 'contacts') {
    if (GET && a === 'search') return contactsSearch(u, q);
    if (GET && !a) return contactsList(u, q);
    if (POST && !a) return contactsCreate(u, b);
    if (PUT && a) return contactsUpdate(u, a, b);
    if (DEL && a) return contactsDelete(u, a);
  }

  /* ───── 강사 ───── */
  if (head === 'instructors') {
    if (GET && a === 'search') return instructorsSearch(u, q.q);
    if (GET && !a) return instructorsList(u, q);
    if (POST && !a) return instructorsCreate(u, b);
    if (PUT && a) return instructorsUpdate(u, a, b);
    if (DEL && a) return instructorsDelete(u, a);
  }

  /* ───── 협력사 ───── */
  if (head === 'partners') {
    if (GET && a === 'search') return partnersSearch(u, q.q);
    if (GET && !a) return partnersList(u, q);
    if (POST && !a) return partnersCreate(u, b);
    if (PUT && a) return partnersUpdate(u, a, b);
    if (DEL && a) return partnersDelete(u, a);
  }

  /* ───── 직원 · 외부영업자 ───── */
  if (head === 'staff') {
    if (GET && !a) return staffList(u);
    if (POST && !a) return staffCreate(u, b);
    if (PUT && a) return staffUpdate(u, a, b);
    if (DEL && a) return staffDelete(u, a);
  }

  /* ───── 법인카드 ───── */
  if (head === 'cards') {
    if (GET && !a) return cardsList(u, q);
    if (POST && !a) return cardsCreate(u, b);
    if (PUT && a) return cardsUpdate(u, a, b);
    if (DEL && a) return cardsDelete(u, a);
  }

  /* ───── 회사 경비(판관비) ───── */
  if (head === 'overheads') {
    if (GET && !a) return overheadsList(u, q);
    if (POST && !a) return overheadsCreate(u, b);
    if (PUT && a) return overheadsUpdate(u, a, b);
    if (DEL && a) return overheadsDelete(u, a);
  }

  /* ───── 사용자 ─────
   * /auth/login 은 출입증 없이 지나므로 apiCall 에서 먼저 처리합니다.
   */
  if (head === 'auth') {
    if (GET && a === 'me') return { user: u };
    if (GET && a === 'users') return usersList(u);
    if (POST && a === 'register') return usersCreate(u, b);
    if (PUT && a === 'users' && c) return usersUpdate(u, c, b);
    if (POST && a === 'password') {
      return changePassword(u, b.id, b.old_password, b.new_password);
    }
  }

  /* ───── 정산자료 ───── */
  if (head === 'export') {
    if (GET && a === 'excel') return settlementBuild(u, q);
    if (GET && a === 'instructors') return instructorRoster(u);
  }

  /* ───── 엑셀로 한꺼번에 고치기 ───── */
  /* ───── 통째로 내보내기 (파이어베이스 이전용) ───── */
  if (head === 'export' && GET && a === 'all') return exportAll(u);

  if (head === 'bulk') {
    if (GET && a === 'data') return bulkData(u, q);         // 내려받을 자료 (파일은 브라우저가 만든다)
    if (POST && a === 'preview') return bulkPreview(u, b);   // 무엇이 바뀌는지
    if (POST && a === 'apply') return bulkApply(u, b);       // 반영하기
  }

  /* ───── 예전 「구글시트 동기화」 ─────
   * 시트가 곧 저장소이므로 더 이상 옮길 것이 없습니다.
   * 화면에 남아 있는 버튼이 눌려도 조용히 넘어가게 둡니다.
   */
  if (head === 'sync') {
    if (a === 'status') {
      return {
        enabled: true, mode: 'native',
        message: '구글시트가 곧 저장소입니다. 따로 동기화할 필요가 없습니다.',
        url: Db.ss().getUrl()
      };
    }
    if (a === 'gsheet') {
      return { ok: true, message: '이미 구글시트에 바로 저장되고 있습니다.' };
    }
    if (a === 'list-preview') return { sheets: [], message: '동기화가 필요 없습니다.' };
    if (a === 'list-import') return { ok: true, imported: 0, message: '동기화가 필요 없습니다.' };
  }

  throw new Error('알 수 없는 요청입니다: ' + method + ' ' + path);
}

/* ═══════════════════════ 설치 · 점검 ═══════════════════════ */

/**
 * ★ 처음 설치할 때 이것 하나만 실행하세요. ★
 *
 * 아래 네 가지를 차례로 합니다.
 *   1) 자료를 담을 구글시트 만들기
 *   2) 계정 2개 만들기 (huc / sakim)
 *   3) 내 PC 자료 949행 옮기기
 *   4) 숫자가 맞는지 확인
 *
 * 여러 번 실행해도 안전합니다 (시트와 계정은 이미 있으면 그대로 둡니다).
 */
function installAll() {
  var out = [];

  out.push('[1/4] 데이터 시트');
  out.push('  ' + setup());

  out.push('');
  out.push('[2/4] 계정');
  out.push(setupUsers());

  out.push('');
  out.push('[3/4] 자료 옮기기');
  // 이미 자료가 있으면 덮어쓰지 않는다 (스크립트만 다시 만든 경우)
  var have = 0;
  try { have = Db.all('projects').length; } catch (e) {}
  if (have > 0) {
    out.push('  과정 ' + have + '개가 이미 있습니다 — 그대로 둡니다.');
  } else if (typeof seedImport === 'function') {
    out.push(seedImport());
  } else {
    out.push('  Seed.gs 가 없습니다 — 자료 옮기기를 건너뜁니다.');
  }

  out.push('');
  out.push('[4/4] 확인');
  if (typeof seedVerify === 'function') {
    out.push(seedVerify());
  } else {
    out.push('  Seed.gs 가 없어 건너뜁니다.');
  }

  out.push('');
  out.push('─────────────────────────────────');
  out.push('설치가 끝났습니다.');
  out.push('이제 [배포 → 새 배포 → 웹 앱] 으로 주소를 만드세요.');
  out.push('  · 다음 사용자로 실행 : 나');
  out.push('  · 액세스 권한        : 모든 사용자');

  var msg = out.join('\n');
  Logger.log(msg);
  return msg;
}

/**
 * 맨 처음 한 번만 실행합니다.
 * 데이터를 담을 구글시트를 만들고, 그 주소를 스크립트에 기억시킵니다.
 */
var SHEET_NAME = '혜움컨설팅 매출매입 데이터';

/**
 * 이미 있는 자료 시트를 찾는다.
 *
 * 스크립트를 다시 만들더라도 자료는 그대로 이어 써야 한다.
 * (스크립트와 자료 시트는 별개의 파일이다)
 */
function findDataSheet_() {
  try {
    var it = DriveApp.getFilesByName(SHEET_NAME);
    while (it.hasNext()) {
      var f = it.next();
      if (f.getMimeType() === MimeType.GOOGLE_SHEETS && !f.isTrashed()) return f.getId();
    }
  } catch (e) {}
  return null;
}

function setup() {
  var props = PropertiesService.getScriptProperties();
  var existing = props.getProperty('SHEET_ID');
  if (existing) {
    var ss0 = SpreadsheetApp.openById(existing);
    Logger.log('이미 설치되어 있습니다.\n' + ss0.getUrl());
    return ss0.getUrl();
  }

  // 전에 쓰던 자료 시트가 있으면 그것을 이어 쓴다 (자료를 잃지 않도록)
  var found = findDataSheet_();
  if (found) {
    props.setProperty('SHEET_ID', found);
    var ss1 = SpreadsheetApp.openById(found);
    var n = 0;
    TABLES.forEach(function (t) {
      try { n += Db.all(t).length; } catch (e) {}
    });
    Logger.log('전에 쓰던 자료 시트를 찾아서 이어 씁니다 (' + n + '줄).\n' + ss1.getUrl());
    return ss1.getUrl();
  }

  var ss = SpreadsheetApp.create(SHEET_NAME);
  props.setProperty('SHEET_ID', ss.getId());

  // 표 12개를 미리 만들어 둔다
  TABLES.forEach(function (t) { Db.sheetOf(t); });

  // create 가 만들어 둔 빈 기본 시트는 치운다
  var first = ss.getSheetByName('시트1') || ss.getSheetByName('Sheet1');
  if (first && ss.getSheets().length > 1) ss.deleteSheet(first);

  Logger.log('설치했습니다.\n' + ss.getUrl());
  return ss.getUrl();
}

/**
 * 처음 쓸 계정을 만듭니다. setup() 다음에 한 번 실행하세요.
 *
 * 비밀번호는 시트에 평문으로 남지 않습니다 (소금 + 해시로만 저장).
 * 이미 있는 아이디는 건드리지 않으므로 여러 번 실행해도 안전합니다.
 *
 * ⚠️ 여기 적힌 비밀번호는 짧습니다. 쓰기 시작하신 뒤
 *    화면에서 각자 바꾸시는 것을 권합니다.
 */
function setupUsers() {
  var want = [
    { username: 'huc@hyeumcst.co.kr',    password: 'hyeum1234', name: '혜움컨설팅', role: 'admin' },
    { username: 'sakim@hyeumcst.co.kr',  password: 'hyeum1234', name: '김소애',     role: 'admin' }
  ];

  var made = [], kept = [];
  want.forEach(function (w) {
    if (findUser_(w.username)) { kept.push(w.username); return; }
    var salt = newSalt();
    Db.insert('users', {
      username: w.username, salt: salt, password_hash: hashPassword(w.password, salt),
      name: w.name, role: w.role, is_active: 1
    });
    made.push(w.username + '  (' + w.role + ')');
  });

  var msg = '계정을 만들었습니다.\n'
    + (made.length ? made.map(function (s) { return '  + ' + s; }).join('\n') : '  (새로 만든 것 없음)')
    + (kept.length ? '\n이미 있어서 그대로 둔 것:\n' + kept.map(function (s) { return '  · ' + s; }).join('\n') : '')
    + '\n\n직원 계정은 화면의 [사용자 관리] 에서 추가하거나,'
    + '\naddUser("아이디", "비밀번호", "이름", "user") 를 실행하면 됩니다.';
  Logger.log(msg);
  return msg;
}

/**
 * 계정 하나를 더 만든다 — 편집기에서 바로 쓰기 위한 것.
 *
 *   addUser('shchoi@hyeumcst.co.kr', 'hyeum', '최선화', 'user')
 *
 * @param {string} role 'admin' 또는 'user' (안 적으면 user)
 */
function addUser(username, password, name, role) {
  if (!username || !password) throw new Error('아이디와 비밀번호를 적어주세요.');
  if (findUser_(username)) throw new Error('이미 있는 아이디입니다: ' + username);

  var salt = newSalt();
  var r = Db.insert('users', {
    username: String(username).trim(), salt: salt,
    password_hash: hashPassword(password, salt),
    name: name || String(username).split('@')[0],
    role: role === 'admin' ? 'admin' : 'user',
    is_active: 1
  });

  var msg = '만들었습니다: ' + r.username + '  (' + r.role + ')';
  Logger.log(msg);
  return msg;
}

/**
 * 비밀번호를 다시 정한다 — 잊어버렸을 때 편집기에서 씁니다.
 *
 *   resetPassword('sakim@hyeumcst.co.kr', '새비밀번호')
 */
function resetPassword(username, newPassword) {
  var u = findUser_(username);
  if (!u) throw new Error('없는 아이디입니다: ' + username);
  if (String(newPassword || '').length < 4) throw new Error('비밀번호는 4자 이상으로 해주세요.');

  var salt = newSalt();
  Db.update('users', u.id, { salt: salt, password_hash: hashPassword(newPassword, salt) });

  var msg = u.username + ' 의 비밀번호를 바꿨습니다.';
  Logger.log(msg);
  return msg;
}

/**
 * 강사 명단의 「기본세율」을 실제 쓰인 값으로 채워 넣는다.
 *
 * 2026년 자료를 옮길 때 강사 354명이 전부 '3.3%' 로 들어갔다.
 * 그런데 실제 강의 매입을 보면 세금계산서(과세)·면세·8.8% 도 쓰이고 있다.
 * 그 사람이 가장 자주 쓴 세율로 기본값을 바로잡는다.
 *
 * 실제 쓴 적이 없는 강사는 건드리지 않는다 (추측하지 않는다).
 */
function fixInstructorTaxTypes() {
  var byId = {}, byName = {};

  Db.where('project_expenses', function (e) { return e.category === '강의'; })
    .forEach(function (e) {
      var tt = String(e.tax_type || '').trim();
      if (!tt) return;
      if (e.instructor_id) {
        (byId[e.instructor_id] = byId[e.instructor_id] || {})[tt] =
          ((byId[e.instructor_id] || {})[tt] || 0) + 1;
      }
      var nm = String(e.name || '').trim();
      if (nm) {
        (byName[nm] = byName[nm] || {})[tt] = ((byName[nm] || {})[tt] || 0) + 1;
      }
    });

  /** 가장 많이 쓴 세율 */
  var top = function (counts) {
    if (!counts) return null;
    var best = null, n = 0;
    Object.keys(counts).forEach(function (k) {
      if (counts[k] > n) { n = counts[k]; best = k; }
    });
    return best;
  };

  var changed = [], kept = 0, untouched = 0;

  Db.all('instructors').forEach(function (i) {
    // 번호로 먼저 찾고, 없으면 이름으로 찾는다
    var want = top(byId[i.id]) || top(byName[String(i.name || '').trim()]);
    if (!want) { untouched++; return; }            // 쓴 적이 없으면 그대로 둔다
    if (want === i.default_tax_type) { kept++; return; }
    Db.update('instructors', i.id, { default_tax_type: want });
    changed.push(i.name + ' : ' + i.default_tax_type + ' → ' + want);
  });

  var msg = ['강사 기본세율을 바로잡았습니다.',
    '  바꾼 사람   : ' + changed.length + '명',
    '  이미 맞음   : ' + kept + '명',
    '  실적 없음   : ' + untouched + '명 (그대로 둠)',
    ''].concat(changed.slice(0, 40).map(function (s) { return '  · ' + s; }));
  if (changed.length > 40) msg.push('  … 외 ' + (changed.length - 40) + '명');

  var out = msg.join('\n');
  Logger.log(out);
  return out;
}

/** 지금 상태를 한눈에 — 문제가 있을 때 여기부터 봅니다 */
function health() {
  var out = [];
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  out.push('SHEET_ID : ' + (id || '(없음 — setup() 을 먼저 실행하세요)'));
  if (id) {
    out.push('시트     : ' + SpreadsheetApp.openById(id).getUrl());
    TABLES.forEach(function (t) {
      try {
        out.push('  ' + (TAB[t] || t) + ' : ' + Db.all(t).length + '행');
      } catch (e) {
        out.push('  ' + (TAB[t] || t) + ' : 읽기 실패 — ' + e.message);
      }
    });
  }
  out.push('');
  out.push('계정:');
  try {
    var us = Db.all('users');
    if (!us.length) out.push('  (없음 — setupUsers() 를 실행하세요)');
    us.forEach(function (x) {
      out.push('  ' + String(x.username || '?').padEnd(26)
        + String(x.role || 'user').padEnd(7)
        + (x.is_active ? '사용중' : '중지  ')
        + (x.password_hash ? '' : '  ⚠ 비밀번호 없음')
        + (x.last_login ? '   최근 로그인 ' + x.last_login : ''));
    });
  } catch (e) {
    out.push('  확인 실패 — ' + e.message);
  }
  var s = out.join('\n');
  Logger.log(s);
  return s;
}

/** 모든 시트에 지정 서식(Noto Sans JP · 10 · 중간 정렬)을 다시 입힌다 */
function reformatAll() {
  TABLES.forEach(function (t) {
    try { Db.reformat(t); } catch (e) {}
  });
  return '서식을 다시 입혔습니다.';
}


/* ═════ fb-boot.js ═════ */
/*
 * 파이어베이스에 붙고, 자료를 들고 오고, 요청을 받아 넘긴다.
 * ════════════════════════════════════════════════════════════
 *
 * 화면(app.js)은 전과 똑같이 API.get('/projects') 같은 식으로 부른다.
 * 그 부름이 여기로 들어와, 인터넷에 나가지 않고 이 안에서 처리된다.
 *
 * 한 번의 부름에서 일어나는 일
 *   ① 자료가 아직 없으면 982줄을 한 번에 읽어 온다 (약 40ms, 처음 한 번만)
 *   ② 서버 코드(route_)를 그대로 돌린다 — 아무 데도 안 물어본다 (0ms)
 *   ③ 고친 것이 있으면 한 묶음으로 저장한다 (약 20ms)
 *
 * 앱스스크립트에 남는 것 — 여기서 처리하지 않고 넘긴다
 *   · 세금계산서 발행요청 메일 (무료 요금제에 메일 기능이 없다)
 *   · 정산자료 · 강사명단 내려받기 (구글시트를 만들어 준다)
 */

/* ───────── 파이어베이스 붙기 ───────── */

let FBAPP = null, FBAUTH = null, FBDB = null;

function fbReady() {
  if (FBDB) return true;
  if (typeof firebase === 'undefined' || !FB || !FB.USE_FIREBASE) return false;
  FBAPP = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(FB.config);
  FBAUTH = firebase.auth();
  FBDB = firebase.firestore();
  return true;
}

/* ───────── 들어가기 ───────── */

/**
 * 로그인.
 * 비밀번호는 파이어베이스가 받아서 맞춰 본다 — 우리 쪽을 거치지 않는다.
 *
 * 관리자 사이트(/admin)에 직원이 들어오는 것은 여기서 막는다.
 * 보안 규칙도 직원이 관리자 자료를 못 보게 따로 막고 있다 —
 * 여기 하나만 믿지 않는다.
 */
async function fbLogin(username, password, site) {
  if (!fbReady()) throw new Error('파이어베이스에 연결할 수 없습니다.');

  try {
    await FBAUTH.signInWithEmailAndPassword(String(username || '').trim(), password);
  } catch (e) {
    // 아이디가 없는지 비번이 틀렸는지 알려주지 않는다 (있는 아이디를 캐내지 못하게)
    throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
  }
  return fbAfterSignIn(site);
}

/**
 * 들어온 뒤에 할 일 — 권한을 확인하고 「누구인가」를 세운다.
 *
 * 로그인 바로 뒤에도 쓰고, 화면을 새로고침했을 때도 쓴다.
 * 파이어베이스는 로그인을 기억하고 있지만 우리 쪽 기억은 날아가므로,
 * 새로고침하면 여기로 다시 와서 세워야 한다.
 */
async function fbAfterSignIn(site) {
  const cur = FBAUTH.currentUser;
  if (!cur) throw new Error('로그인이 필요합니다.');

  const email = cur.email;
  let role;
  try {
    const snap = await FBDB.collection('roles').doc(email).get();
    role = snap.exists ? snap.data() : null;
  } catch (e) {
    await FBAUTH.signOut();
    throw new Error('권한을 확인할 수 없습니다. 관리자에게 문의해주세요.');
  }

  if (!role || role.is_active === false) {
    await FBAUTH.signOut();
    throw new Error('사용이 중지된 계정입니다.');
  }
  if (site === 'admin' && role.role !== 'admin') {
    await FBAUTH.signOut();
    throw new Error('관리자 계정만 사용할 수 있습니다.');
  }

  /* 서버가 쓰던 모양 그대로 만들어 준다 — route_ 가 그대로 받아 쓴다 */
  const row = await fbFindUserRow(email);
  const u = {
    id: row ? row.id : 0,
    username: email,
    name: (row && row.name) || role.name || email,
    role: role.role === 'admin' ? 'admin' : 'user'
  };
  fbSetUser(u);
  return u;
}

/**
 * 화면을 새로고침했을 때 — 파이어베이스가 기억하고 있는 로그인을 되살린다.
 *
 * 이것이 없으면 새로고침할 때마다 다시 로그인해야 한다. 파이어베이스는
 * 알고 있는데 우리 쪽만 잊은 것이기 때문이다.
 *
 * @returns {Promise<Object|null>} 되살렸으면 그 사람, 아니면 null
 */
function fbRestore(site) {
  if (!fbReady()) return Promise.resolve(null);
  return new Promise(function (ok) {
    // 파이어베이스가 저장해 둔 로그인을 읽어 올 때까지 기다린다
    const stop = FBAUTH.onAuthStateChanged(function (user) {
      stop();
      if (!user) return ok(null);
      fbAfterSignIn(site).then(ok).catch(function () {
        try { FBAUTH.signOut(); } catch (e) {}
        ok(null);
      });
    });
  });
}

/** users 표에서 그 사람 줄을 찾는다 (id 가 과정의 created_by 에 쓰인다) */
async function fbFindUserRow(email) {
  const snap = await FBDB.collection('users').get();
  const hit = snap.docs.map(function (d) { return d.data(); })
    .filter(function (x) {
      return String(x.username || '').trim().toLowerCase() === String(email).trim().toLowerCase();
    })[0];
  return hit || null;
}

async function fbLogout() {
  fbUnwatch();                 // 구독을 끊지 않으면 나간 뒤에도 자료가 계속 들어온다
  if (FBAUTH) { try { await FBAUTH.signOut(); } catch (e) {} }
  fbSetUser(null);
  fbForget();
}

/** 들고 있던 자료를 버린다 (다른 사람으로 들어갈 때) */
function fbForget() {
  fbUnwatch();
  TABLES.forEach(function (t) { SNAP[t] = []; SNAP_BY_ID[t] = {}; });
  SNAP_AT = 0;
  fbDropPending();
}

/* ───────── 자료 들고 오기 ───────── */

/*
 * ───────── 왜 「구독」으로 바꿨는가 ─────────
 *
 * 전에는 저장하기 직전마다 957줄을 통째로 다시 읽었다.
 * 남이 고친 것을 못 보고 덮어쓰지 않으려는 뜻이었지만, 값이 너무 컸다.
 *
 *   화면 한 번 열 때        957건
 *   저장 한 번 할 때마다     957건   ← 이것
 *   세 분이 하루 20번 저장   약 58,000건
 *   파이어베이스 하루 한도    50,000건
 *
 * 2026-10-28 에 실제로 한도를 넘겨 사이트가 자료를 못 읽었다.
 *
 * 이제는 들어올 때 한 번만 전부 읽고, 그 뒤로는 파이어베이스가
 * **바뀐 문서만** 보내준다 (onSnapshot). 저장 전에 다시 읽지 않는다.
 *
 *   화면 한 번 열 때        957건 (처음 한 번)
 *   저장 한 번 할 때마다     0건
 *   하루                  약 3,000건
 *
 * 덤으로 더 좋아진다 — 김소애 님이 고친 것이 임영환 님 화면에
 * 곧바로 들어온다. 전에는 최대 1분 늦게 보였다.
 */

let __loading = null;
let __watchers = [];            // 구독을 끊을 때 쓸 손잡이들

/** 지금 자료를 받아 두고 있는가 */
function fbWatching() { return __watchers.length > 0; }

/** 구독을 모두 끊는다 (나갈 때 · 다른 사람으로 들어올 때) */
function fbUnwatch() {
  __watchers.forEach(function (stop) { try { stop(); } catch (e) {} });
  __watchers = [];
}

/**
 * 표마다 구독을 건다.
 *
 * 첫 번째 응답이 그 표의 전부다 (= 처음 한 번 읽기).
 * 그 뒤로는 바뀐 문서만 온다.
 *
 * @returns {Promise} 모든 표의 첫 응답이 올 때까지
 */
function fbWatchAll(u) {
  const admin = !!(u && u.role === 'admin');
  const t0 = Date.now();

  return Promise.all(TABLES.map(function (t) {
    return new Promise(function (ok, no) {
      let first = true;
      const stop = FBDB.collection(t).onSnapshot(
        function (snap) {
          /*
           * 요청을 처리하는 동안에는 메모리를 건드리지 않는다.
           * route_ 가 SNAP 을 읽고 고치는 중에 바뀌면 숫자가 어긋난다.
           * 끝난 뒤 다시 받으면 되므로, 그때는 그냥 흘려보낸다.
           */
          if (__busy) { __missed = true; return; }
          fbApplySnap(t, snap);
          if (first) { first = false; ok(); }
        },
        function (err) {
          if (!first) return;                 // 돌다가 끊긴 것은 아래에서 다시 건다
          first = false;
          const denied = /permission|insufficient/i.test(String(err && (err.code || err.message)));
          if (denied && !admin && ADMIN_ONLY_TABLES.indexOf(t) >= 0) {
            SNAP[t] = []; SNAP_BY_ID[t] = {};
            return ok();                      // 직원이 관리자 전용 표에서 막히는 것은 당연하다
          }
          no(new Error('「' + (TAB[t] || t) + '」을(를) 읽지 못했습니다. '
            + (denied ? '보안 규칙을 확인해주세요.' : (err && err.message) || '')));
        }
      );
      __watchers.push(stop);
    });
  })).then(function () {
    SNAP_AT = Date.now();
    Logger.log('자료를 받아 두기 시작했습니다 (' + (Date.now() - t0) + 'ms)');
  });
}

/** 받은 것을 메모리에 얹는다 */
function fbApplySnap(table, snap) {
  const rows = snap.docs.map(function (d) { return d.data(); });
  SNAP[table] = rows;
  const by = {};
  rows.forEach(function (r) { by[Number(r.id)] = r; });
  SNAP_BY_ID[table] = by;
}

/* 요청을 처리하는 동안에는 메모리를 바꾸지 않는다 */
let __busy = false;
let __missed = false;

async function fbEnsureData() {
  if (fbWatching() && fbSnapLoaded()) return;     // 이미 받아 두고 있다
  if (__loading) return __loading;                // 동시에 여러 번 불러도 한 번만

  __loading = fbWatchAll(fbUser()).finally(function () { __loading = null; });
  return __loading;
}

/* ───────── 요청 받아 넘기기 ───────── */

/*
 * 아직 앱스스크립트가 해야 하는 길.
 *   메일 — 무료 요금제에 메일 기능이 없다
 *   정산·강사명단 — 구글시트 파일을 만들어 준다
 */
function fbStaysOnAppsScript(method, path) {
  return /^\/invoices\/[^/]+\/request$/.test(path)
    || path.indexOf('/export/instructors') === 0
    || path.indexOf('/export/excel') === 0
    || path.indexOf('/sync/') === 0;
}

/* ───────── 비밀번호 ─────────
 *
 * 비밀번호는 파이어베이스가 받아서 자기가 지킨다. 우리 쪽을 거치지
 * 않으므로, 서버 코드로 보내지 않고 여기서 바로 파이어베이스에 시킨다.
 */
async function fbChangePassword(oldPassword, newPassword) {
  if (!fbReady()) throw new Error('파이어베이스에 연결할 수 없습니다.');
  const cur = FBAUTH.currentUser;
  if (!cur) throw new Error('로그인이 필요합니다.');
  if (!newPassword || String(newPassword).length < 6) {
    throw new Error('새 비밀번호는 6자 이상이어야 합니다.');
  }

  /*
   * 바꾸기 전에 지금 비밀번호를 한 번 더 맞춰 본다.
   * 자리를 비운 사이 남이 와서 바꿔 버리는 일을 막는다.
   */
  try {
    const cred = firebase.auth.EmailAuthProvider.credential(cur.email, oldPassword);
    await cur.reauthenticateWithCredential(cred);
  } catch (e) {
    throw new Error('지금 비밀번호가 올바르지 않습니다.');
  }

  try {
    await cur.updatePassword(newPassword);
  } catch (e) {
    throw new Error('비밀번호를 바꾸지 못했습니다. (' + (e.message || e) + ')');
  }
  return { message: '비밀번호를 바꿨습니다.' };
}

/**
 * 화면이 부른 것을 이 안에서 처리한다.
 * @returns {Promise<Object>} 서버가 주던 것과 같은 모양
 */
async function fbHandle(method, path, data, query) {
  if (!fbReady()) throw new Error('파이어베이스에 연결할 수 없습니다.');
  if (!fbUser()) throw new Error('로그인이 필요합니다.');

  /* 비밀번호는 서버 코드로 보내지 않는다 — 파이어베이스가 받아서 지킨다 */
  if (method === 'POST' && path === '/auth/password') {
    return fbChangePassword(data && data.old_password, data && data.new_password);
  }

  /*
   * 계정 만들기·지우기는 아직 못 한다.
   * 파이어베이스에서 계정을 만들려면 관리자 열쇠가 있어야 하는데,
   * 그 열쇠를 브라우저에 두면 누구나 쓸 수 있게 된다.
   * 세 분뿐이라 드문 일이므로, 콘솔에서 하시도록 안내한다.
   */
  if (path === '/auth/register' || (method === 'PUT' && path.indexOf('/auth/users/') === 0)) {
    throw new Error(
      '계정 추가·변경은 파이어베이스 콘솔에서 합니다.\n'
      + 'console.firebase.google.com → 보안 → Authentication → Users\n'
      + '만드신 뒤 알려주시면 권한(관리자/직원)을 맞춰 드리겠습니다.');
  }

  /*
   * 자료는 구독해 두고 있다 — 다시 읽지 않는다.
   * 처음 한 번만 전부 받고, 그 뒤로는 바뀐 것이 저절로 들어온다.
   */
  await fbEnsureData();

  /*
   * 여기서부터 저장까지는 메모리를 남이 못 건드리게 잠근다.
   * route_ 가 SNAP 을 읽고 고치는 중에 구독이 끼어들면 숫자가 어긋난다.
   */
  __busy = true;
  let out;
  try {
    out = route_(fbUser(), method, path, data, query || {});
  } catch (e) {
    fbDropPending();                 // 하다 말았으면 모아 둔 것을 버린다
    __busy = false;
    fbResync();                      // 메모리가 반쯤 고쳐진 채 남지 않게
    throw e;
  }

  if (fbPendingCount()) {
    const fs = {
      db: FBDB,
      doc: function (db, t, id) { return db.collection(t).doc(id); },
      writeBatch: function (db) { return db.batch(); }
    };
    try {
      await fbFlush(fs);
    } catch (e) {
      fbDropPending();
      __busy = false;
      fbResync();                    // 저장이 안 됐으니 메모리도 못 믿는다
      throw new Error('저장하지 못했습니다. 다시 시도해주세요. (' + (e.message || e) + ')');
    }
  }

  __busy = false;
  /* 일하는 동안 들어온 것이 있으면 이제 받는다 */
  if (__missed) { __missed = false; fbResync(); }
  return out;
}

/**
 * 메모리를 못 믿게 됐을 때 — 구독을 다시 건다.
 *
 * 구독을 끊었다 다시 걸면 첫 응답으로 전부가 다시 온다.
 * 흔한 일이 아니라서(오류가 났을 때뿐) 읽기 수에는 영향이 없다.
 */
function fbResync() {
  fbUnwatch();
  SNAP_AT = 0;
  fbDropPending();
  /* 다음 요청 때 fbEnsureData 가 알아서 다시 건다 */
}

/**
 * 앱스스크립트에 보낼 「진짜 표」를 받아 온다.
 *
 * 파이어베이스가 만들어 주는 표로, 한 시간 뒤 저절로 쓸모없어진다.
 * 앱스스크립트는 이 표가 진짜인지 구글에게 물어본다 (FbAuth.gs).
 *
 * 발행요청 메일과 정산자료를 받을 때만 쓰인다. 나머지는 인터넷에 안 나간다.
 */
async function fbIdToken() {
  if (!fbReady()) throw new Error('파이어베이스에 연결할 수 없습니다.');
  const cur = FBAUTH.currentUser;
  if (!cur) throw new Error('로그인이 필요합니다.');
  return cur.getIdToken();
}


/* ═════ 밖으로 내보내는 것 ═════ */
window.fbLogin = fbLogin;
window.fbLogout = fbLogout;
window.fbRestore = fbRestore;
window.fbAfterSignIn = fbAfterSignIn;
window.fbHandle = fbHandle;
window.fbStaysOnAppsScript = fbStaysOnAppsScript;
window.fbReady = fbReady;
window.fbUser = fbUser;
window.fbForget = fbForget;
window.fbIdToken = fbIdToken;
window.fbUnwatch = fbUnwatch;
window.fbWatching = fbWatching;

/* 시험할 때 쓰는 손잡이 */
window.fbAuth = function () { return FBAUTH; };
window.fbRoute = function (m, p, b, q) { return route_(fbUser(), m, p, b, q || {}); };

})();

/**
 * API 통신 — 깃허브 페이지판
 *
 * 화면은 깃허브가 내려주고, 자료만 구글(앱스스크립트)에 요청합니다.
 *
 * 보낼 때 Content-Type 을 따로 적지 않습니다.
 * 그래야 브라우저가 「미리 물어보는 절차」 없이 바로 보내서 빨라집니다.
 */
const API = {
  /* ───── 신원 ───── */
  _mem: { token: null, user: null },

  getToken() {
    if (this._mem.token) return this._mem.token;
    try { return localStorage.getItem('token'); } catch (e) { return null; }
  },
  setToken(t) {
    this._mem.token = t;
    try { localStorage.setItem('token', t); } catch (e) {}
  },
  getUser() {
    if (this._mem.user) return this._mem.user;
    try { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
    catch (e) { return null; }
  },
  setUser(u) {
    this._mem.user = u;
    try { localStorage.setItem('user', JSON.stringify(u)); } catch (e) {}
  },
  isLoggedIn() { return !!this.getToken(); },
  isAdmin() { const u = this.getUser(); return !!(u && u.role === 'admin'); },
  logout() {
    if (typeof FB !== 'undefined' && FB.USE_FIREBASE && typeof fbLogout === 'function') {
      try { fbLogout(); } catch (e) {}
    }
    this._mem.token = null;
    this._mem.user = null;
    this._cache = {};
    try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch (e) {}
  },

  /* ───── 잠깐 기억해 두기 ─────
   * 같은 화면을 다시 열 때 서버에 또 묻지 않습니다.
   * 자료를 고치면(POST·PUT·DELETE) 기억을 모두 버립니다.
   *
   * 20초로 두었더니 메뉴를 오갈 때마다 다시 물어서 느렸습니다.
   * 1분으로 늘립니다 — 내가 고치면 바로 버리므로 내 화면은 늘 최신이고,
   * 다른 사람이 고친 것만 최대 1분 늦게 보입니다. (대표님 지시 2026-10-27)
   */
  _cache: {},
  _CACHE_MS: 60000,

  /** 주소에서 쿼리스트링을 떼어 객체로 바꾼다 */
  _split(path) {
    const i = String(path).indexOf('?');
    if (i < 0) return { path: path, query: {} };
    const query = {};
    String(path).slice(i + 1).split('&').forEach(function (kv) {
      if (!kv) return;
      const j = kv.indexOf('=');
      const k = j < 0 ? kv : kv.slice(0, j);
      const v = j < 0 ? '' : kv.slice(j + 1);
      query[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
    });
    return { path: String(path).slice(0, i), query: query };
  },

  async request(method, path, data = null) {
    const s = this._split(path);
    const key = method + ' ' + path;

    // 읽기만 하는 요청은 잠깐 기억해 둔 것을 쓴다
    if (method === 'GET') {
      const hit = this._cache[key];
      if (hit && Date.now() - hit.at < this._CACHE_MS) return hit.v;
    } else {
      this._cache = {};        // 자료가 바뀌면 기억을 모두 버린다
    }

    /*
     * 파이어베이스를 켰으면 인터넷에 안 나간다.
     * 같은 서버 코드를 이 브라우저 안에서 그대로 돌린다 (fb-boot.js).
     * 메일과 정산 파일 만들기만 앱스스크립트로 넘긴다.
     */
    if (typeof FB !== 'undefined' && FB.USE_FIREBASE
        && typeof fbHandle === 'function' && !fbStaysOnAppsScript(method, s.path)) {
      const v = await fbHandle(method, s.path, data, s.query);
      /*
       * 서버 코드가 보낼 메일을 적어 뒀으면 앱스스크립트에 넘겨 보낸다.
       * 메일만은 구글 계정으로 나가야 해서 브라우저가 못 보낸다.
       */
      if (typeof fbTakeMails === 'function') {
        const mails = fbTakeMails();
        for (let i = 0; i < mails.length; i++) {
          await this.sendMail(mails[i]);
        }
      }
      if (method === 'GET') this._cache[key] = { at: Date.now(), v: v };
      return v;
    }

    /*
     * 여기까지 왔다는 것은 앱스스크립트가 해야 하는 일이라는 뜻이다
     * (발행요청 메일 · 정산자료 · 강사명단).
     *
     * 파이어베이스로 로그인했으면 들고 있는 표가 'firebase' 라는 글자뿐이라
     * 앱스스크립트가 알아보지 못한다. 그래서 여기서 진짜 표를 받아 보낸다.
     * 앱스스크립트는 그 표가 진짜인지 구글에게 물어본다 (FbAuth.gs).
     */
    let token = this.getToken();
    if (typeof FB !== 'undefined' && FB.USE_FIREBASE && typeof fbIdToken === 'function') {
      try { token = await fbIdToken(); }
      catch (e) { throw new Error('로그인이 풀렸습니다. 다시 로그인해주세요.'); }
    }

    let res;
    try {
      res = await fetch(APP_URL, {
        method: 'POST',
        body: JSON.stringify({
          method: method, path: s.path, data: data, query: s.query, token: token
        })
      });
    } catch (e) {
      throw new Error('서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.');
    }

    let out;
    try { out = await res.json(); }
    catch (e) { throw new Error('서버가 올바른 답을 보내지 않았습니다.'); }

    if (out && out.ok) {
      if (method === 'GET') this._cache[key] = { at: Date.now(), v: out.data };
      return out.data;
    }

    // 출입증이 풀렸으면 로그인 창으로 되돌린다
    if (out && out.unauthorized) {
      this.logout();
      if (typeof showScreen === 'function') showScreen();
    }
    throw new Error((out && out.error) || '요청 처리 중 오류가 발생했습니다.');
  },

  /**
   * 다 지은 메일 한 통을 앱스스크립트에 넘겨 보낸다.
   *
   * 적힌 것(발행요청 기록)은 이미 파이어베이스에 저장된 뒤다.
   * 그래서 메일이 안 나가면 「적히긴 했는데 메일이 안 갔다」고 알려 드린다 —
   * 조용히 넘어가면 보낸 줄 아시게 된다.
   */
  async sendMail(mail) {
    try {
      await this.request('POST', '/mail/send', {
        to: (mail && mail.to) || '',
        subject: (mail && mail.subject) || '',
        body: (mail && mail.body) || '',
        htmlBody: (mail && mail.htmlBody) || ''
      });
    } catch (e) {
      throw new Error('발행요청은 적혔지만 메일이 나가지 못했습니다. '
        + '다시 보내기를 눌러주세요. (' + (e.message || e) + ')');
    }
  },

  qs(params) {
    const parts = [];
    Object.keys(params || {}).forEach(k => {
      const v = params[k];
      if (v !== '' && v !== null && v !== undefined) {
        parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
      }
    });
    return parts.length ? '?' + parts.join('&') : '';
  },

  get(path) { return this.request('GET', path); },
  post(path, data) { return this.request('POST', path, data); },
  put(path, data) { return this.request('PUT', path, data); },
  delete(path) { return this.request('DELETE', path); },

  // 분석
  getAnalytics(params) { return this.get('/analytics' + this.qs(params)); },
  getAnalyticsDetail(params) { return this.get('/analytics/detail' + this.qs(params)); },
  getAnalyticsByTax(params) { return this.get('/analytics' + this.qs(params)); },

  // 세금계산서
  getInvoices(params) { return this.get('/invoices' + this.qs(params)); },
  setInvoicePaid(id, date) { return this.put('/invoices/' + id + '/paid', { paid_date: date }); },
  /* 받는 사람 — 그 고객사의 담당자부터 찾는다 (client_id 를 함께 보낸다) */
  searchRecipients(q, clientId) {
    return this.get('/invoices/recipients' + this.qs({ q: q, client_id: clientId }));
  },

  // 법인카드
  getCards(params) { return this.get('/cards' + this.qs(params)); },
  createCard(data) { return this.post('/cards', data); },
  updateCard(id, data) { return this.put('/cards/' + id, data); },
  deleteCard(id) { return this.delete('/cards/' + id); },

  // 직원 · 외부영업자
  getStaff() { return this.get('/staff'); },
  createStaff(data) { return this.post('/staff', data); },
  updateStaff(id, data) { return this.put('/staff/' + id, data); },
  deleteStaff(id) { return this.delete('/staff/' + id); },

  // 회사 경비
  getOverheads(params) { return this.get('/overheads' + this.qs(params)); },
  createOverhead(data) { return this.post('/overheads', data); },
  updateOverhead(id, data) { return this.put('/overheads/' + id, data); },
  deleteOverhead(id) { return this.delete('/overheads/' + id); },

  // 사용자
  /* 어느 주소(관리자/직원)로 들어왔는지 함께 보낸다 — 서버가 들일지 가린다 */
  /**
   * 로그인.
   * 파이어베이스를 켰으면 거기로 간다 — 비밀번호가 우리 쪽을 거치지 않는다.
   */
  async login(username, password) {
    if (typeof FB !== 'undefined' && FB.USE_FIREBASE && typeof fbLogin === 'function') {
      const user = await fbLogin(username, password, typeof SITE === 'undefined' ? 'staff' : SITE);
      this.setToken('firebase');          // 화면은 「표가 있나」만 본다
      this.setUser(user);
      this._cache = {};
      return { user: user, token: 'firebase' };
    }
    return this._loginAppsScript(username, password);
  },

  _loginAppsScript(username, password) {
    var site = (typeof SITE === 'string' && SITE === 'staff') ? 'staff' : 'admin';
    return this.post('/auth/login', { username, password, site });
  },
  changePassword(data) { return this.post('/auth/password', data); },
  getUsers() { return this.get('/auth/users'); },
  registerUser(data) { return this.post('/auth/register', data); },
  updateUser(id, data) { return this.put('/auth/users/' + id, data); },

  // 고객사
  searchClients(q) { return this.get('/clients/search' + this.qs({ q: q })); },
  getClients() { return this.get('/clients'); },
  createClient(data) { return this.post('/clients', data); },
  updateClient(id, data) { return this.put('/clients/' + id, data); },

  // 고객사 담당자
  getContacts(clientId) { return this.get('/contacts' + this.qs({ client_id: clientId })); },
  createContact(data) { return this.post('/contacts', data); },
  updateContact(id, data) { return this.put('/contacts/' + id, data); },
  deleteContact(id) { return this.delete('/contacts/' + id); },

  // 강사
  searchInstructors(q) { return this.get('/instructors/search' + this.qs({ q: q })); },
  getInstructors(params = {}) { return this.get('/instructors' + this.qs(params)); },
  createInstructor(data) { return this.post('/instructors', data); },
  updateInstructor(id, data) { return this.put('/instructors/' + id, data); },
  deleteInstructor(id) { return this.delete('/instructors/' + id); },

  // 협력사
  searchPartners(q) { return this.get('/partners/search' + this.qs({ q: q })); },
  getPartners(params = {}) { return this.get('/partners' + this.qs(params)); },
  createPartner(data) { return this.post('/partners', data); },
  updatePartner(id, data) { return this.put('/partners/' + id, data); },
  deletePartner(id) { return this.delete('/partners/' + id); },

  // 과정
  getProjects(params = {}) { return this.get('/projects' + this.qs(params)); },
  getProject(id) { return this.get('/projects/' + id); },
  getProjectFilters() { return this.get('/projects/filters'); },
  createProject(data) { return this.post('/projects', data); },
  updateProject(id, data) { return this.put('/projects/' + id, data); },
  deleteProject(id) { return this.delete('/projects/' + id); },

  // 구글시트 — 시트가 곧 저장소라 옮길 것이 없습니다
  syncGSheet() { return this.post('/sync/gsheet', {}); },
  syncStatus() { return this.get('/sync/status'); },
  listPreview() { return this.get('/sync/list-preview'); },
  listImport(mode) { return this.post('/sync/list-import', { mode: mode }); },

  // 대시보드
  getDashboard(params = {}) { return this.get('/dashboard/summary' + this.qs(params)); },

  /**
   * 정산자료 — 「정산자료」 구글시트를 만들어 새 창으로 열어 드립니다.
   */
  async _settle(path, label) {
    const r = await this.get(path);
    const rows = (r.sheets || []).map(s => s.name + ' ' + s.rows + '행').join(' · ');
    const msg = label + '을(를) 만들었습니다.\n\n'
      + (rows ? rows + '\n\n' : '')
      + '[확인]  엑셀 파일(.xlsx)로 바로 받기\n'
      + '[취소]  구글시트로 열어서 보기';
    window.open(confirm(msg) ? r.xlsx_url : r.url, '_blank', 'noopener');
    return r;
  },
  downloadInstructorRoster() { return this._settle('/export/instructors', '강사명단'); },
  downloadExcel(params = {}) { return this._settle('/export/excel' + this.qs(params), '정산자료'); },

  /* ───── 운영비 관리 (관리자만) ───── */
  getOpCosts(params = {}) { return this.get('/op-costs' + this.qs(params)); },
  getOpItems(projectId) { return this.get('/op-costs/items/' + projectId); },
  saveOpItem(projectId, item) { return this.put('/op-costs/items/' + projectId, item); },
  deleteOpItem(expenseId) { return this.delete('/op-costs/item/' + expenseId); },

  /* ───── 엑셀로 한꺼번에 고치기 ───── */

  /**
   * 사이트의 모든 자료를 엑셀 파일로 내 PC 에 받는다.
   *
   * 서버는 자료만 보내고, 엑셀 파일은 이 브라우저가 만든다.
   * 구글 드라이브를 전혀 거치지 않아서 빠르고 남는 파일도 없다.
   */
  async downloadAll(params = {}) {
    const r = await this.get('/bulk/data' + this.qs(params));
    makeExcel(r.sheets, r.filename);
    return r;
  },

  /**
   * 사이트의 모든 자료를 JSON 파일 하나로 내 PC 에 받는다 (관리자만).
   *
   * 파이어베이스로 옮기기 위한 것. 엑셀과 달리 자료를 다듬지 않고
   * 시트에 적힌 그대로 담는다. 나중에 더한 표(확인함·교육진행·발행요청)도
   * 함께 담기고, 줄 수와 금액 합계를 대조표로 같이 담아 원 단위까지
   * 맞춰 볼 수 있게 한다. 비밀번호는 담지 않는다.
   */
  async exportAll() {
    const r = await this.get('/export/all');
    saveJson(r, r.파일이름 || 'hyeumcst-export.json');
    return r;
  },

  /** 고친 엑셀을 읽어 「무엇이 바뀌는지」 먼저 받아본다 (저장하지 않음) */
  async uploadPreview(file) {
    const sheets = await readExcel(file);
    return this.post('/bulk/preview', { sheets: sheets });
  },

  /** 미리보기에서 본 그대로 반영한다 */
  uploadApply(ticket, force) {
    return this.post('/bulk/apply', { ticket: ticket, force: !!force });
  }
};

/**
 * 자료를 JSON 파일로 만들어 내 PC 에 저장한다.
 * 다운로드 폴더에 바로 떨어진다 — 구글 드라이브를 거치지 않는다.
 */
function saveJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 바로 거두면 받다가 끊기는 브라우저가 있어 잠깐 둔다
  setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
}

/* ───────── 엑셀 만들기 · 읽기 (브라우저에서) ───────── */

/**
 * 자료를 엑셀 파일로 만들어 내 PC 에 저장한다.
 * 다운로드 폴더에 바로 떨어진다.
 */
function makeExcel(sheets, filename) {
  /*
   * 색 (대표님이 정하신 것)
   *   머리글 1행 — 연두  #D8E4BC
   *   「과정」 줄  — 베이지 #DDD9C4
   *
   * 과정 줄에 색이 있어야 어디서 다음 과정이 시작되는지 한눈에 보인다.
   */
  const HEAD_BG = 'D8E4BC';
  const PROJ_BG = 'DDD9C4';
  const LINE = 'BFBFBF';

  /*
   * 서버가 알아서 채우는 칸은 분홍색으로 칠한다. (대표님 지시 2026-10-28)
   *
   * 「[자동]」 이라고 적어 두기는 했지만 글자는 눈에 안 들어온다.
   * 색이 있으면 「여기는 내가 적을 데가 아니구나」가 한눈에 보인다.
   * 적어 넣어도 올릴 때 무시되고 서버가 다시 계산한다.
   *
   * 머리글은 진하게, 아래 칸들은 연하게 — 과정 줄의 베이지보다 색을
   * 우선한다. 그래야 과정 줄에서도 자동 칸인 줄 안다.
   */
  const RO_HEAD = 'F4AEAE';
  const RO_BG = 'FCE3E3';

  const wb = XLSX.utils.book_new();

  sheets.forEach(function (s) {
    const grid = [s.header].concat(s.rows);
    const ws = XLSX.utils.aoa_to_sheet(grid);

    const edge = { style: 'thin', color: { rgb: LINE } };

    // 「과정」 줄을 알아보려면 구분 칸이 몇 번째인지 알아야 한다.
    // 칸 순서가 바뀔 수 있으니 이름으로 찾는다.
    const kindAt = s.header.indexOf('구분');

    for (let r = 0; r < grid.length; r++) {
      const head = r === 0;
      // 구분이 「과정」인 줄 (합친 과정 시트에서만 나온다)
      const proj = !head && kindAt >= 0
        && String(grid[r][kindAt] || '').trim() === '과정';

      for (let c = 0; c < s.header.length; c++) {
        const ref = XLSX.utils.encode_cell({ r: r, c: c });
        if (!ws[ref]) ws[ref] = { t: 's', v: '' };

        const st = {};
        const ro = !!(s.readonly || [])[c];     // 서버가 알아서 채우는 칸

        if (head) {
          st.fill = { patternType: 'solid', fgColor: { rgb: ro ? RO_HEAD : HEAD_BG } };
          st.font = { bold: true, sz: 10 };
          st.alignment = { vertical: 'center', horizontal: 'center', wrapText: true };
          st.border = { top: edge, bottom: edge, left: edge, right: edge };
        } else if (proj) {
          // 자동 칸은 과정 줄에서도 분홍 — 적을 데가 아니라는 표시가 먼저다
          st.fill = { patternType: 'solid', fgColor: { rgb: ro ? RO_BG : PROJ_BG } };
          st.font = { bold: true, sz: 10 };
          st.alignment = { vertical: 'center' };
          st.border = { top: edge, bottom: edge };
        } else {
          if (ro) st.fill = { patternType: 'solid', fgColor: { rgb: RO_BG } };
          st.font = { sz: 10 };
          st.alignment = { vertical: 'center' };
        }

        // 돈 칸은 천 단위마다 쉼표
        if ((s.money || [])[c] && ws[ref].t === 'n') st.numFmt = '#,##0';

        ws[ref].s = st;
      }
    }

    // 칸 너비를 글자 수에 맞춰 잡아준다
    ws['!cols'] = s.header.map(function (h, i) {
      let w = String(h).length + 2;
      for (let r = 0; r < Math.min(s.rows.length, 300); r++) {
        const v = s.rows[r][i];
        if (v !== null && v !== undefined) w = Math.max(w, String(v).length + 2);
      }
      return { wch: Math.min(Math.max(w, 6), 34) };
    });
    /*
     * 틀 고정(1행 얼리기)은 이 라이브러리가 파일에 담지 못한다.
     * 대신 자동 필터를 걸어 둔다 — 머리글을 눌러 거르거나 정렬할 수 있다.
     * (틀 고정이 필요하면 엑셀에서 [보기 → 틀 고정 → 첫 행 고정])
     */
    ws['!autofilter'] = { ref: XLSX.utils.encode_range(
      { s: { r: 0, c: 0 }, e: { r: Math.max(grid.length - 1, 0), c: s.header.length - 1 } }) };

    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  });

  XLSX.writeFile(wb, filename, { bookType: 'xlsx', compression: true });
}

/**
 * 고른 엑셀 파일을 읽어 「시트이름 → 표」 꼴로 바꾼다.
 * 이것을 서버에 보내면 서버가 무엇이 바뀌는지 알아낸다.
 */
function readExcel(file) {
  return new Promise(function (resolve, reject) {
    const fr = new FileReader();
    fr.onload = function () {
      try {
        const wb = XLSX.read(new Uint8Array(fr.result), { type: 'array' });
        const out = {};
        wb.SheetNames.forEach(function (name) {
          out[String(name).trim()] = XLSX.utils.sheet_to_json(wb.Sheets[name], {
            header: 1, raw: true, defval: '', blankrows: false
          });
        });
        resolve(out);
      } catch (e) {
        reject(new Error('엑셀 파일을 읽지 못했습니다. (' + e.message + ')'));
      }
    };
    fr.onerror = function () { reject(new Error('파일을 읽지 못했습니다.')); };
    fr.readAsArrayBuffer(file);
  });
}

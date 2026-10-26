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
    this._mem.token = null;
    this._mem.user = null;
    this._cache = {};
    try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch (e) {}
  },

  /* ───── 잠깐 기억해 두기 ─────
   * 같은 화면을 다시 열 때 서버에 또 묻지 않습니다.
   * 자료를 고치면(POST·PUT·DELETE) 기억을 모두 버립니다.
   */
  _cache: {},
  _CACHE_MS: 20000,

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

    let res;
    try {
      res = await fetch(APP_URL, {
        method: 'POST',
        body: JSON.stringify({
          method: method, path: s.path, data: data, query: s.query, token: this.getToken()
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
  searchRecipients(q) { return this.get('/invoices/recipients' + this.qs({ q: q })); },

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
  login(username, password) {
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

        if (head) {
          st.fill = { patternType: 'solid', fgColor: { rgb: HEAD_BG } };
          st.font = { bold: true, sz: 10 };
          st.alignment = { vertical: 'center', horizontal: 'center', wrapText: true };
          st.border = { top: edge, bottom: edge, left: edge, right: edge };
        } else if (proj) {
          st.fill = { patternType: 'solid', fgColor: { rgb: PROJ_BG } };
          st.font = { bold: true, sz: 10 };
          st.alignment = { vertical: 'center' };
          st.border = { top: edge, bottom: edge };
        } else {
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

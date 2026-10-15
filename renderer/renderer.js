'use strict'

function el(id) {
  const node = document.getElementById(id)
  if (!node) console.warn('[shell] missing element #' + id)
  return node
}

function on(node, event, fn) {
  if (node && node.addEventListener) node.addEventListener(event, fn)
}

function boot(label, fn) {
  try {
    fn()
  } catch (err) {
    console.error('[shell] init failed: ' + label, err)
  }
}

let wv = el('mdc')
const pcv = el('penal')
const penalBackupView = el('penal-backup')
const lssdView = el('lssd')
const lssdForumView = el('lssd-forum')
const pcBar = el('pc-bar')
const pcSearch = el('pc-search')
const tabNav = el('tab-nav')
const quickBar = el('quick-bar')
const hdrCtl = el('hdr-ctl')
let activeTab = 'mdc'
let penalBackupReady = false
let penalBackupFilterActive = false

function activeView() {
  if (activeTab === 'penal' && pcv) return pcv
  if (activeTab === 'penal-backup' && penalBackupView) return penalBackupView
  if (activeTab === 'lssd' && lssdView) return lssdView
  if (activeTab === 'forum' && lssdForumView) return lssdForumView
  return wv
}

const PAGE_PARTITION = 'persist:gtaw-mdc'
let pages = []
let pageSeq = 0
let activePageId = ''

const AUX_TABS = {
  lssd: 'LSSD Intranet',
  forum: 'LSSD Forum',
  penal: 'Ceza Kanunu',
  'penal-backup': 'Ceza Kanunu (Yedek)'
}
let auxOpen = []

function allPageViews() {
  return pages.map((p) => p.el).filter((v) => !!v)
}

function findPage(id) {
  return pages.filter((p) => p.id === id)[0] || null
}

function clipLabel(text) {
  const s = String(text || '').trim() || 'Yeni sayfa'
  return s.length > 22 ? s.slice(0, 21) + '\u2026' : s
}

function pathLabel(url) {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean)
    if (!parts.length) return 'Ana Sayfa'
    const last = parts[parts.length - 1]
    if (/^\d+$/.test(last)) {
      const kind = parts.length > 1 ? parts[parts.length - 2] : 'Kayıt'
      return kind.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) + ' #' + last
    }
    return last.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  } catch (_) {
    return ''
  }
}

function pageLabel(page) {
  const url = String((page && page.url) || '')
  const hit = navItems.filter((n) => n.url && n.url === url)[0]
  if (hit) return clipLabel(hit.label)
  let raw = String((page && page.title) || '')
    .replace(/\s*[-|]\s*GTA\s*World\s*$/i, '')
    .replace(/^\s*(MDC|Mobile Data Computer)\s*[-|:]\s*/i, '')
    .replace(/\s*[-|]\s*(MDC|Mobile Data Computer)\s*$/i, '')
    .trim()
  if (!raw || /^(mdc|mobile data computer|mobil veri bilgisayarı)$/i.test(raw)) raw = pathLabel(url) || 'MDC'
  return clipLabel(raw)
}

function makePage(url) {
  const content = document.querySelector('.content')
  if (!content) return null
  pageSeq += 1
  const v = document.createElement('webview')
  v.setAttribute('id', 'mdc-p' + pageSeq)
  v.setAttribute('partition', PAGE_PARTITION)
  v.setAttribute('preload', '../webview-preload.js')
  v.setAttribute('allowpopups', '')
  v.setAttribute('src', url || HOME)
  v.className = 'wv-off'
  content.appendChild(v)
  const page = { id: 'page-' + pageSeq, el: v, title: 'Yeni sayfa', url: url || HOME }
  pages.push(page)
  wirePage(v, page)
  return page
}

function openPage(url) {
  const page = makePage(url || HOME)
  if (!page) return
  showTab('mdc')
  showPage(page.id)
  playSound('click')
}

function showPage(id) {
  const page = findPage(id)
  if (!page || !page.el) return
  activePageId = page.id
  wv = page.el
  allPageViews().forEach((v) => {
    v.classList.toggle('wv-off', activeTab !== 'mdc' || v !== page.el)
  })
  renderPageBar()
  try {
    if (address) address.value = page.el.getURL()
  } catch (_) {
  }
  updateNav()
  document.dispatchEvent(new Event('mdc:chrome-changed'))
}

function closePage(id) {
  if (pages.length < 2) return
  const idx = pages.map((p) => p.id).indexOf(id)
  if (idx < 0) return
  const page = pages[idx]
  pages.splice(idx, 1)
  try {
    if (page.el && page.el.parentNode) page.el.parentNode.removeChild(page.el)
  } catch (_) {
  }
  const next = pages[Math.max(0, idx - 1)]
  if (next) showPage(next.id)
  playSound('close')
}

function barItems() {
  const items = []
  pages.forEach((p) => items.push({ seq: Number(String(p.id).split('-')[1]) || 0, page: p }))
  auxOpen.forEach((a) => items.push({ seq: a.seq, aux: a }))
  items.sort((a, b) => a.seq - b.seq)
  return items
}

function openAux(tab) {
  if (!AUX_TABS[tab] || auxOpen.some((a) => a.tab === tab)) return
  pageSeq += 1
  auxOpen.push({ tab, seq: pageSeq, title: '' })
}

function resetAuxView(tab) {
  const v = { lssd: lssdView, forum: lssdForumView, penal: pcv }[tab]
  if (!v) return
  v.setAttribute('data-loaded', '0')
  try {
    v.loadURL('about:blank')
  } catch (_) {
  }
}

function closeAux(tab) {
  const items = barItems()
  const idx = items.findIndex((it) => it.aux && it.aux.tab === tab)
  if (idx < 0) return
  const wasActive = activeTab === tab
  auxOpen = auxOpen.filter((a) => a.tab !== tab)
  resetAuxView(tab)
  if (wasActive) {
    const prev = items[idx - 1] || items[idx + 1]
    if (prev && prev.aux) {
      showTab(prev.aux.tab)
    } else {
      showTab('mdc')
      if (prev && prev.page) showPage(prev.page.id)
    }
  } else {
    renderPageBar()
  }
  playSound('close')
}

function auxLabel(a) {
  const base = AUX_TABS[a.tab]
  const first = String(a.title || '').split(/\s+[-|\u2013\u2014]\s+/)[0].trim()
  if (!first || /^(ls|los santos) county sheriff.s (intranet|department)\b/i.test(first)) return base
  return first.length > 36 ? first.slice(0, 35).trimEnd() + '\u2026' : first
}

function setAuxTitle(tab, title) {
  const a = auxOpen.find((x) => x.tab === tab)
  const next = String(title || '').trim()
  if (!a || /^about:/i.test(next) || a.title === next) return
  a.title = next
  renderPageBar()
}

function auxButton(a) {
  const btn = document.createElement('button')
  btn.className = 'pagetab' + (activeTab === a.tab ? ' active' : '')
  btn.title = a.title || AUX_TABS[a.tab]

  const label = document.createElement('span')
  label.className = 'pagelabel'
  label.textContent = auxLabel(a)
  btn.appendChild(label)

  const x = document.createElement('span')
  x.className = 'pageclose'
  x.textContent = '\u2716'
  x.title = 'Bu sayfayı kapat'
  on(x, 'click', (ev) => {
    if (ev && ev.stopPropagation) ev.stopPropagation()
    closeAux(a.tab)
  })
  btn.appendChild(x)

  on(btn, 'click', () => showTab(a.tab))
  return btn
}

function renderPageBar() {
  const bar = el('page-bar')
  if (!bar) return
  bar.innerHTML = ''

  const cap = document.createElement('span')
  cap.className = 'pagecap'
  cap.textContent = 'Sayfalar'
  bar.appendChild(cap)
  const row = document.createElement('div')
  row.className = 'pagerow'
  bar.appendChild(row)

  barItems().forEach((item) => {
    if (item.aux) {
      row.appendChild(auxButton(item.aux))
      return
    }
    const p = item.page
    const btn = document.createElement('button')
    btn.className = 'pagetab' + (p.id === activePageId && activeTab === 'mdc' ? ' active' : '')
    btn.title = p.title || 'Sayfa'

    const label = document.createElement('span')
    label.className = 'pagelabel'
    label.textContent = pageLabel(p)
    btn.appendChild(label)

    if (pages.length > 1) {
      const x = document.createElement('span')
      x.className = 'pageclose'
      x.textContent = '\u2716'
      x.title = 'Bu sayfayı kapat'
      on(x, 'click', (ev) => {
        if (ev && ev.stopPropagation) ev.stopPropagation()
        closePage(p.id)
      })
      btn.appendChild(x)
    }

    on(btn, 'click', () => {
      if (activeTab !== 'mdc') showTab('mdc')
      showPage(p.id)
    })
    row.appendChild(btn)
  })

  const add = document.createElement('button')
  add.className = 'pageadd'
  add.textContent = '+'
  add.title = 'Yeni sayfa aç (Ctrl+T)'
  on(add, 'click', () => openPage(HOME))
  row.appendChild(add)

  bar.classList.remove('hidden')
}

const address = el('address')
const addrGroup = el('addr-group')
const lookupGroup = el('lookup-group')
const toolbar = el('toolbar')
const statusbar = el('statusbar')
const sbStatus = el('sb-status')
const sbTheme = el('sb-theme')
const sbClock = el('sb-clock')
const qName = el('q-name')
const qPlate = el('q-plate')
const findbar = el('findbar')
const findInput = el('find-input')
const findCase = el('find-case')
const findCount = el('find-count')

const HOME = 'https://mdc-tr.gta.world/'
const RECORD_URL = 'https://mdc-tr.gta.world/record/'
const DMV_URL = 'https://mdc-tr.gta.world/dmv/'
const PENAL_URL = 'https://forum-tr.gta.world/index.php?/topic/77-san-andreas-ceza-kanunu/'
const LSSD_URL = 'https://lssdportal.online/login'
const LSSD_FORUM_URL = 'https://lssd-tr.gta.world/index.php'

const APP_NAME = 'Mobile Data Computer Client'
const REPO_URL = 'https://github.com/wolfaeger/GTA-World-Turkey-MDC'

const SKIN_CLASSES = ['dark', 'lapd', 'lssd', 'aero', 'aerolapd', 'aerodark', 'off']

const THEMES = {
  light: 'Klasik Açık',
  dark: 'Klasik Koyu',
  lapd: 'LSPD Mobil',
  lssd: 'LSSD Mobil',
  aero: 'Windows 7 Aero',
  aerolapd: 'Windows 7 Aero LSPD',
  aerodark: 'Windows 7 Aero Koyu',
  off: 'Özgün MDC'
}

let appInfo = {}
let zoom = 0

function prefBool(key, dflt) {
  try {
    const v = localStorage.getItem('mdc.' + key)
    return v === null ? dflt : v === '1'
  } catch (_) {
    return dflt
  }
}

function prefStr(key, dflt) {
  try {
    const v = localStorage.getItem('mdc.' + key)
    return v === null ? dflt : v
  } catch (_) {
    return dflt
  }
}

function savePref(key, val) {
  try {
    localStorage.setItem('mdc.' + key, typeof val === 'boolean' ? (val ? '1' : '0') : String(val))
  } catch (_) {
  }
}

const view = {
  theme: (function () {
    const t = prefStr('theme', 'light')
    return THEMES[t] ? t : 'light'
  })(),
  toolbar: prefBool('toolbar', true),

  lookupFields: prefBool('lookupFields', false),
  addressBar: prefBool('addressBar', false),
  statusBar: prefBool('statusBar', true),
  sidebar: prefBool('sidebar', false),
  navBar: prefBool('navBar', true),
  searchBoxes: prefBool('searchBoxes', true),
  quickLinks: prefBool('quickLinks', true),
  sounds: prefBool('sounds', false),
  historyLog: prefBool('historyLog', true),
  historyOnlySubjects: prefBool('historyOnlySubjects', false),
  updateCheck: prefBool('updateCheck', false),
  alertBadge: prefBool('alertBadge', true),
  alertReminder: prefBool('alertReminder', true),
  dragWindows: prefBool('dragWindows', true),
  discordPresence: prefBool('discordPresence', false),
  discordShowName: prefBool('discordShowName', false),
  minimizeToTray: prefBool('minimizeToTray', false)
}

if (prefStr('navChips', '') !== '1') {
  view.navBar = true
  view.sidebar = false
  savePref('navBar', true)
  savePref('sidebar', false)
  savePref('navChips', '1')
}

if (view.navBar && view.sidebar) {
  view.sidebar = false
  savePref('sidebar', false)
}

const SOUND_FILES = {
  click: 'sounds/click.mp3',
  close: 'sounds/close.mp3',
  error: 'sounds/error.mp3',
  nav: 'sounds/nav.mp3',
  open: 'sounds/open.mp3',
  notify: 'sounds/notify.mp3',
  alert: 'sounds/alert.mp3',
  save: 'sounds/save.mp3',
  startup: 'sounds/startup.mp3'
}

const CLOSE_ACTIONS = {
  back: true,
  stop: true,
  exit: true,
  signout: true
}

const SOUND_GAP = {
  click: 320,
  close: 260,
  error: 700,
  nav: 180,
  open: 220,
  notify: 400,
  alert: 900,
  save: 300,
  startup: 5000
}

const soundCache = {}
const soundLast = {}
let soundAny = 0

function playSound(name) {
  if (!view.sounds) return
  const file = SOUND_FILES[name]
  if (!file || typeof Audio !== 'function') return
  const now = Date.now()
  if (now - (soundLast[name] || 0) < (SOUND_GAP[name] || 300)) return
  if (now - soundAny < 90) return
  soundLast[name] = now
  soundAny = now
  try {
    let audio = soundCache[name]
    if (!audio) {
      audio = new Audio(file)
      audio.volume = 0.5
      soundCache[name] = audio
    }
    if (!audio.paused && !audio.ended && audio.currentTime > 0) return
    audio.currentTime = 0
    const played = audio.play()
    if (played && played.catch) played.catch(() => {})
  } catch (_) {}
}

const CHECKABLE = [
  { id: 'mi-toolbar', key: 'toolbar', label: 'Araç Çubuğu', accel: '' },
  { id: 'mi-lookup', key: 'lookupFields', label: 'Sorgu Alanları', accel: '' },
  { id: 'mi-addr', key: 'addressBar', label: 'Adres Çubuğu', accel: 'F9' },
  { id: 'mi-status', key: 'statusBar', label: 'Durum Çubuğu', accel: '' },
  { id: 'mi-sidebar', key: 'sidebar', label: 'MDC Yan Paneli', accel: 'F10' }
]

const THEME_ITEMS = [
  { id: 'mi-theme-light', theme: 'light', label: 'Klasik Açık Tema', accel: 'F8' },
  { id: 'mi-theme-dark', theme: 'dark', label: 'Klasik Koyu Tema', accel: '' },
  { id: 'mi-theme-lapd', theme: 'lapd', label: 'LSPD Mobil Tema', accel: '' },
  { id: 'mi-theme-lssd', theme: 'lssd', label: 'LSSD Mobil Tema', accel: '' },
  { id: 'mi-theme-aero', theme: 'aero', label: 'Windows 7 Aero Teması', accel: '' },
  { id: 'mi-theme-aerolapd', theme: 'aerolapd', label: 'Windows 7 Aero LSPD Teması', accel: '' },
  { id: 'mi-theme-aerodark', theme: 'aerodark', label: 'Windows 7 Aero Koyu Tema', accel: '' },
  { id: 'mi-theme-off', theme: 'off', label: 'Özgün MDC Teması', accel: '' }
]

function markItem(node, marked, label, accel) {
  if (!node) return
  node.textContent = ''
  node.appendChild(document.createTextNode((marked ? '\u2713 ' : '\u2007\u2007 ') + label))
  if (accel) {
    const a = document.createElement('span')
    a.className = 'accel'
    a.textContent = accel
    node.appendChild(a)
  }
}

function renderChecks() {
  CHECKABLE.forEach((item) => {
    markItem(document.getElementById(item.id), view[item.key], item.label, item.accel)
  })
  THEME_ITEMS.forEach((item) => {
    markItem(document.getElementById(item.id), view.theme === item.theme, item.label, item.accel)
  })
}

let officerName = ''
let lastPresenceKey = ''

const PRESENCE_BY_KIND = {
  'Kayıt': 'Sorgulama yapıyor',
  'Araç': 'Sorgulama yapıyor',
  'Sorgu': 'Sorgulama yapıyor',
  'Motorlu Taşıtlar Dairesi': 'Sorgulama yapıyor',
  'Harita': 'Haritaya bakıyor',
  'Arama emri': 'Arama emirlerine bakıyor',
  'Arama emirleri listesi': 'Arama emirlerine bakıyor',
  'Olay': 'Olaylara bakıyor',
  'Olay listesi': 'Olaylara bakıyor',
  'APB': 'APB’lere bakıyor',
  'APB listesi': 'APB’lere bakıyor'
}

function presenceDetails() {
  if (activeTab === 'penal' || activeTab === 'penal-backup') return 'Ceza kanununa bakıyor'
  if (activeTab === 'lssd') return 'LSSD Intranet kullanıyor'
  if (activeTab === 'forum') return 'LSSD Forumunu kullanıyor'
  const page = findPage(activePageId)
  const kind = page ? histKind(page.url) : ''
  return PRESENCE_BY_KIND[kind] || 'MDC kullanıyor'
}

function pushPresence() {
  if (!window.mdt || typeof window.mdt.setPresence !== 'function') return
  const payload = {
    enabled: !!view.discordPresence,
    details: presenceDetails(),
    state: view.discordShowName && officerName ? officerName : ''
  }
  const key = JSON.stringify(payload)
  if (key === lastPresenceKey) return
  lastPresenceKey = key
  try {
    window.mdt.setPresence(payload)
  } catch (_) {
  }
}

function applyView() {
  if (view.navBar && view.sidebar) {
    view.sidebar = false
    savePref('sidebar', false)
  }
  const sidebarBtn = document.getElementById('btn-sidebar')
  if (sidebarBtn) {
    sidebarBtn.disabled = !!view.navBar
    sidebarBtn.title = view.navBar
      ? 'Gezinme çubuğu açıkken kullanılamaz (Araçlar > Ayarlar)'
      : 'MDC yan panelini göster/gizle (F10)'
  }
  renderNav()
  renderQuickBar()
  if (hdrCtl) hdrCtl.classList.toggle('hidden', view.theme === 'off')
  if (view.theme === 'off') closeHeaderMenu()
  if (toolbar) toolbar.classList.toggle('hidden', !view.toolbar)
  if (statusbar) statusbar.classList.toggle('hidden', !view.statusBar)
  if (addrGroup) addrGroup.classList.toggle('hidden', !view.addressBar)
  if (lookupGroup) lookupGroup.classList.toggle('hidden', !view.lookupFields)
  SKIN_CLASSES.forEach((name) => {
    document.body.classList.toggle('theme-' + name, view.theme === name)
  })
  if (sbTheme) sbTheme.textContent = 'Tema: ' + THEMES[view.theme]
  applySidebar()
  applyDrag()
  renderAlerts()
  pushPresence()
  applyTray()
  renderChecks()

  try {
    document.dispatchEvent(new Event('mdc:chrome-changed'))
  } catch (_) {
  }
}

function toggle(key) {
  if (key === 'sidebar' && view.navBar) {
    setStatus('Gezinme çubuğu açıkken yan panel kullanılamaz. Araçlar > Ayarlar bölümünden kapatın.')
    playSound('alert')
    return
  }
  view[key] = !view[key]
  savePref(key, view[key])
  if (key === 'navBar' && view.navBar && view.sidebar) {
    view.sidebar = false
    savePref('sidebar', false)
  }
  applyView()
}

function setTheme(next) {
  view.theme = THEMES[next] ? next : 'light'
  savePref('theme', view.theme)
  applyView()
  applySkin()
}

function cycleTheme() {
  const order = ['light', 'dark', 'lapd', 'lssd', 'aero', 'aerolapd', 'aerodark', 'off']
  setTheme(order[(order.indexOf(view.theme) + 1) % order.length])
}

function applySkin() {
  allPageViews().forEach((v) => {
    try {
      v.send('mdt:set-skin', view.theme)
    } catch (_) {
    }
  })
  try {
    if (pcv) pcv.send('mdt:set-skin', view.theme)
  } catch (_) {
  }
}

function applySidebar() {
  allPageViews().forEach((v) => {
    try {
      v.send('mdt:set-sidebar', !view.sidebar)
    } catch (_) {
    }
    try {
      v.send('mdt:set-search-boxes', !view.searchBoxes)
    } catch (_) {
    }
  })
}

function applyTray() {
  try {
    if (window.mdt && window.mdt.setTray) window.mdt.setTray(view.minimizeToTray)
  } catch (_) {
  }
}

function pad(n) { return String(n).padStart(2, '0') }

function tick() {
  if (!sbClock) return
  const d = new Date()
  sbClock.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
}

function setStatus(t) { if (sbStatus) sbStatus.textContent = t }

function runName() {
  if (!qName) return
  const q = qName.value.trim()
  if (!q) { qName.focus(); return }
  setStatus('İsim sorgusu: ' + q)
  histAdd({ url: RECORD_URL + encodeURIComponent(q), label: q, kind: 'İsim sorgusu', query: q })
  wv.loadURL(RECORD_URL + encodeURIComponent(q))
}

function runPlate() {
  if (!qPlate) return
  const q = qPlate.value.trim().replace(/[\s-]/g, '').toUpperCase()
  if (!q) { qPlate.focus(); return }
  setStatus('Plaka sorgusu: ' + q)
  histAdd({ url: DMV_URL + encodeURIComponent(q), label: q, kind: 'Plaka sorgusu', query: q })
  wv.loadURL(DMV_URL + encodeURIComponent(q))
}

function nativeSearch(which) {
  try {
    wv.send('mdt:search', { which, value: '' })
    setStatus(which === 'vehicle' ? 'Araç Sorgula' : 'Kişi Sorgula')
  } catch (_) {
    setStatus('Sayfa henüz hazır değil')
  }
}

let findActive = false
let lastFindTerm = ''

function openFind() {
  if (!findbar) return
  findbar.classList.remove('hidden')
  if (findInput) { findInput.focus(); findInput.select() }
}

function clearMatches() {
  if (findCount) {
    findCount.textContent = ''
    findCount.classList.remove('nomatch')
  }
  if (findActive) {
    try { activeView().stopFindInPage('clearSelection') } catch (_) {  }
    findActive = false
  }
}

function closeFind() {
  if (findbar) findbar.classList.add('hidden')
  clearMatches()
  lastFindTerm = ''
}

function doFind(forward) {
  if (!findInput) return
  const term = findInput.value
  if (!term) { clearMatches(); return }
  const opts = { forward: forward !== false, matchCase: !!(findCase && findCase.checked) }
  if (findActive && term === lastFindTerm) opts.findNext = true
  else {
    if (findActive) { try { activeView().stopFindInPage('clearSelection') } catch (_) {  } }
    lastFindTerm = term
  }
  try {
    activeView().findInPage(term, opts)
    findActive = true
  } catch (_) {
    if (findCount) findCount.textContent = 'Sayfa henüz hazır değil'
  }
}

function findOpen() { return !!(findbar && !findbar.classList.contains('hidden')) }

const backdrop = el('modal-backdrop')
const dialogTitle = el('dialog-title-text')
const dialogBody = el('dialog-body')


let dragPos = null

function dialogEl() {
  return backdrop ? backdrop.querySelector('.dialog') : null
}

function resetDialogPos() {
  const box = dialogEl()
  if (!box) return
  box.style.left = ''
  box.style.top = ''
  box.style.position = ''
  box.classList.remove('dragged')
}

function startDialogDrag(e) {
  if (!view.dragWindows || !e || e.button !== 0) return
  const box = dialogEl()
  if (!box) return
  if (e.target && e.target.closest && e.target.closest('button')) return
  const rect = box.getBoundingClientRect()
  box.classList.add('dragged')
  box.style.position = 'fixed'
  box.style.left = rect.left + 'px'
  box.style.top = rect.top + 'px'
  dragPos = { dx: e.clientX - rect.left, dy: e.clientY - rect.top, box: box }
  e.preventDefault()
}

function moveDialogDrag(e) {
  if (!dragPos) return
  const box = dragPos.box
  const x = Math.min(Math.max(e.clientX - dragPos.dx, 60 - box.offsetWidth), window.innerWidth - 60)
  const y = Math.min(Math.max(e.clientY - dragPos.dy, 0), window.innerHeight - 28)
  box.style.left = x + 'px'
  box.style.top = y + 'px'
}

function endDialogDrag() {
  dragPos = null
}

function applyDrag() {
  allPageViews().forEach((v) => {
    try {
      v.send('mdt:set-drag', !!view.dragWindows)
    } catch (_) {
    }
  })
  try {
    if (pcv) pcv.send('mdt:set-drag', !!view.dragWindows)
  } catch (_) {
  }
}

function openDialog(title, html) {
  if (!backdrop) return
  if (dialogTitle) dialogTitle.textContent = title
  if (dialogBody) dialogBody.innerHTML = html
  resetDialogPos()
  backdrop.classList.remove('hidden')
}

function closeDialog() {
  if (backdrop) backdrop.classList.add('hidden')
}

function row(label, value) {
  return '<tr><td class="field-label">' + label + '</td><td>' + value + '</td></tr>'
}

function showLayoutReport(r) {
  if (r.error) {
    openDialog('Yerleşim Raporu', '<p>Sayfa ölçülemedi: ' + r.error + '</p>')
    return
  }

  const host = wv ? wv.clientWidth + ' x ' + wv.clientHeight : 'n/a'
  const win = window.innerWidth + ' x ' + window.innerHeight

  let html = '<table>' +
    row('Pencere:', win) +
    row('Gömülü görünüm:', host) +
    row('Sayfa görüntü alanı:', r.viewport || '?') +
    row('Sayfa belgesi:', r.document || '?') +
    row('Sayfa gövdesi:', r.body || '?') +
    row('Belge yüksekliği:', r.ratio || '?') +
    row('Tema:', THEMES[r.skin] || r.skin || '?') +
    '</table>'

  if (r.tall && r.tall.length) {
    html += '<p>Görüntü alanından yüksek öğeler:</p><table>'
    r.tall.forEach((t) => { html += row(t.name + ':', t.height + 'px (' + t.css + ')') })
    html += '</table>'
  } else {
    html += '<p>Görüntü alanından yüksek öğe yok.</p>'
  }

  html += '<p>Gömülü görünüm ile sayfanın görüntü alanı pencere boyutuyla eşleşmelidir. ' +
    'Eşleşmiyorsa uygulama görünümü yanlış boyutlandırıyor olabilir; eşleşiyor ancak ' +
    'belge görüntü alanından çok daha uzunsa sayfadaki bir öğe gereğinden uzundur.</p>'

  openDialog('Yerleşim Raporu', html)
}

function wakeViews() {
  const v = activeView()
  try {
    document.dispatchEvent(new Event('mdc:chrome-changed'))
  } catch (_) {
  }
  if (!v || !v.classList) return
  v.classList.add('wv-off')
  const back = () => {
    v.classList.remove('wv-off')
    try {
      document.dispatchEvent(new Event('mdc:chrome-changed'))
      v.focus()
    } catch (_) {
    }
  }
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(back)
  else setTimeout(back, 16)
}

const HISTORY_KEY = 'mdtHistory'
const HISTORY_MAX = 800
let histList = []

function histLoad() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const list = raw ? JSON.parse(raw) : []
    histList = Array.isArray(list) ? list : []
  } catch (_) {
    histList = []
  }
}

function histSave() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(histList.slice(0, HISTORY_MAX)))
  } catch (_) {
  }
}

function histKind(url) {
  const u = String(url || '')
  if (/\/map(\/|$|\?|#)/.test(u)) return 'Harita'
  if (/\/record\/[^/?#]+/.test(u) || /\/person\/[^/?#]+/.test(u)) return 'Kayıt'
  if (/\/dmv\/[^/?#]+/.test(u)) return 'Araç'
  if (/\/dmv/.test(u)) return 'Motorlu Taşıtlar Dairesi'
  if (/\/warrants?\/[0-9][^/?#]*/.test(u)) return 'Arama emri'
  if (/warrant/.test(u)) return 'Arama emirleri listesi'
  if (/\/emergency\/[0-9]/.test(u) || /incident\/[0-9]/.test(u)) return 'Olay'
  if (/\/emergency/.test(u) || /incident/.test(u)) return 'Olay listesi'
  if (/\/apb\/[0-9]/.test(u)) return 'APB'
  if (/\/apb/.test(u)) return 'APB listesi'
  if (/\/lookup/.test(u)) return 'Sorgu'
  if (/forum-tr\.gta\.world/i.test(u)) return 'Ceza kanunu'
  return 'Sayfa'
}

const HIST_SUBJECT_KINDS = {
  Record: true,
  Vehicle: true,
  'Name check': true,
  'Plate check': true,
  Warrant: true,
  'Kayıt': true,
  'Araç': true,
  'İsim sorgusu': true,
  'Plaka sorgusu': true,
  'Arama emri': true
}

function histKindLabel(kind) {
  const labels = {
    'Name check': 'İsim sorgusu',
    'Plate check': 'Plaka sorgusu',
    Record: 'Kayıt',
    Vehicle: 'Araç',
    Warrant: 'Arama emri',
    'Warrants list': 'Arama emirleri listesi',
    'DMV database': 'Motorlu Taşıtlar Dairesi',
    Incident: 'Olay',
    'Incident list': 'Olay listesi',
    'APB list': 'APB listesi',
    Lookup: 'Sorgu',
    'Penal code': 'Ceza kanunu',
    Page: 'Sayfa'
  }
  return labels[kind] || kind || 'Sayfa'
}

function histAdd(entry) {
  if (!view.historyLog) return
  if (view.historyOnlySubjects) {
    const k = (entry && entry.kind) || histKind(String((entry && entry.url) || ''))
    if (!HIST_SUBJECT_KINDS[k]) return
  }
  const url = String((entry && entry.url) || '')
  if (!/^https?:/i.test(url)) return
  const label = String((entry && entry.label) || '')
  const now = Date.now()
  const top = histList[0]
  if (top && top.url === url && now - top.at < 5000) {
    if (label) top.label = label
    histSave()
    return
  }
  histList.unshift({
    url,
    label,
    kind: (entry && entry.kind) || histKind(url),
    query: (entry && entry.query) || '',
    at: now
  })
  if (histList.length > HISTORY_MAX) histList.length = HISTORY_MAX
  histSave()
}

function histLabel(url, label) {
  if (!view.historyLog) return
  const u = String(url || '')
  const text = String(label || '')
  if (!u || !text) return
  for (let i = 0; i < 12 && i < histList.length; i++) {
    if (histList[i].url === u) {
      if (!histList[i].label || histList[i].label.length < text.length) histList[i].label = text
      histSave()
      return
    }
  }
}

function histWhen(at) {
  const d = new Date(at || 0)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => (n < 10 ? '0' + n : String(n))
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  const time = pad(d.getHours()) + ':' + pad(d.getMinutes())
  if (sameDay) return 'Bugün ' + time
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + time
}

function esc(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function histMatch(entry, q) {
  if (!q) return true
  const hay = (entry.label + ' ' + entry.kind + ' ' + entry.query + ' ' + entry.url + ' ' + histWhen(entry.at)).toLowerCase()
  return q.split(/\s+/).filter(Boolean).every((word) => hay.indexOf(word) !== -1)
}

function showHistory() {
  openDialog('Geçmiş',
    '<div class="hist-tools">' +
    '<label class="fld-label" for="hist-q">Geçmişte ara:</label>' +
    '<input type="text" id="hist-q" class="fld" size="30" placeholder="İsim, plaka, kayıt numarası, sayfa veya tarih">' +
    '<span class="tspacer"></span>' +
    '<button class="btn-sm" id="hist-clear">Geçmişi Temizle</button>' +
    '</div>' +
    '<div class="hist-count" id="hist-count"></div>' +
    '<div class="hist-list" id="hist-list"></div>' +
    '<div class="hist-pager" id="hist-pager">' +
    '<button class="btn-sm" id="hist-first" title="First page">&#171;</button>' +
    '<button class="btn-sm" id="hist-prev" title="Previous page">&#8249;</button>' +
    '<span class="hist-page" id="hist-page"></span>' +
    '<button class="btn-sm" id="hist-next" title="Next page">&#8250;</button>' +
    '<button class="btn-sm" id="hist-last" title="Last page">&#187;</button>' +
    '<span class="tspacer"></span>' +
    '<label class="fld-label" for="hist-size">Sayfa başına:</label>' +
    '<select class="fld" id="hist-size">' +
    '<option value="25">25</option>' +
    '<option value="50" selected>50</option>' +
    '<option value="100">100</option>' +
    '<option value="200">200</option>' +
    '</select>' +
    '</div>' +
    '<p class="opt-note">Bu istemcide açtığınız sayfa ve kayıtlar, açılış saatleriyle birlikte yalnızca bu bilgisayarda tutulur. ' +
    'Bir kaydı sol tıklayarak geçerli sayfada, sağ tıklayarak yeni sayfada açabilirsiniz. ' +
    'Kayıt tutmayı Araçlar &gt; Ayarlar bölümünden kapatabilirsiniz.</p>')

  const input = el('hist-q')
  const list = el('hist-list')
  const count = el('hist-count')
  const pager = el('hist-pager')
  const pageLabel = el('hist-page')
  const sizeSel = el('hist-size')
  let page = 1
  let perPage = 50

  function histRows() {
    const q = (input && input.value ? input.value : '').trim().toLowerCase()
    return histList.filter((entry) => histMatch(entry, q))
  }

  function paint() {
    const rows = histRows()
    const pages = Math.max(1, Math.ceil(rows.length / perPage))
    if (page > pages) page = pages
    if (page < 1) page = 1
    const from = (page - 1) * perPage
    const shown = rows.slice(from, from + perPage)
    if (count) {
      count.textContent = histList.length
        ? (rows.length
          ? rows.length + ' kayıttan ' + (from + 1) + '-' + (from + shown.length) +
            ' arası gösteriliyor (toplam ' + histList.length + ' kayıt)'
          : 'Toplam ' + histList.length + ' kaydın 0 tanesi gösteriliyor')
        : 'Henüz kayıt yok.'
    }
    if (pageLabel) pageLabel.textContent = 'Sayfa ' + page + ' / ' + pages
    if (pager) pager.style.display = rows.length ? '' : 'none'
    const firstB = el('hist-first')
    const prevB = el('hist-prev')
    const nextB = el('hist-next')
    const lastB = el('hist-last')
    if (firstB) firstB.disabled = page <= 1
    if (prevB) prevB.disabled = page <= 1
    if (nextB) nextB.disabled = page >= pages
    if (lastB) lastB.disabled = page >= pages
    if (!list) return
    if (!rows.length) {
      list.innerHTML = '<div class="hist-empty">Eşleşen kayıt yok.</div>'
      return
    }
    list.scrollTop = 0
    list.innerHTML = shown.map((entry) =>
      '<div class="hist-row" data-url="' + esc(entry.url) + '" title="' + esc(entry.url) + '">' +
      '<span class="hist-when">' + esc(histWhen(entry.at)) + '</span>' +
      '<span class="hist-kind">' + esc(histKindLabel(entry.kind)) + '</span>' +
      '<span class="hist-what">' + esc(entry.label || entry.query || entry.url) + '</span>' +
      '</div>').join('')
  }

  if (input) {
    input.addEventListener('input', () => {
      page = 1
      paint()
    })
    setTimeout(() => input.focus(), 0)
  }

  function gotoPage(target) {
    page = target
    paint()
    playSound('click')
  }

  const firstBtn = el('hist-first')
  const prevBtn = el('hist-prev')
  const nextBtn = el('hist-next')
  const lastBtn = el('hist-last')
  if (firstBtn) firstBtn.addEventListener('click', () => gotoPage(1))
  if (prevBtn) prevBtn.addEventListener('click', () => gotoPage(page - 1))
  if (nextBtn) nextBtn.addEventListener('click', () => gotoPage(page + 1))
  if (lastBtn) lastBtn.addEventListener('click', () => gotoPage(Math.max(1, Math.ceil(histRows().length / perPage))))
  if (sizeSel) {
    sizeSel.addEventListener('change', () => {
      const n = parseInt(sizeSel.value, 10)
      perPage = n > 0 ? n : 50
      page = 1
      paint()
    })
  }

  if (list) {
    list.addEventListener('click', (ev) => {
      const row = ev.target && ev.target.closest ? ev.target.closest('.hist-row') : null
      if (!row) return
      const url = row.getAttribute('data-url')
      if (!url) return
      closeDialog()
      if (/forum-tr\.gta\.world/i.test(url)) {
        showTab('penal')
      } else {
        showTab('mdc')
        try {
          activeView().loadURL(url)
        } catch (_) {
        }
      }
      playSound('nav')
    })
    list.addEventListener('contextmenu', (ev) => {
      const row = ev.target && ev.target.closest ? ev.target.closest('.hist-row') : null
      if (!row) return
      ev.preventDefault()
      const url = row.getAttribute('data-url')
      if (!url) return
      closeDialog()
      openPage(url)
      playSound('open')
    })
  }

  const clear = el('hist-clear')
  if (clear) {
    clear.addEventListener('click', () => {
      histList = []
      histSave()
      paint()
      setStatus('Geçmiş temizlendi')
      playSound('close')
    })
  }

  paint()
  playSound('open')
}

function promptLookup(which) {
  const plate = which === 'plate'
  openDialog(plate ? 'Plaka Sorgusu' : 'İsim Sorgusu',
    '<p class="opt-note">' + (plate
      ? 'Motorlu Taşıtlar Dairesi kayıtlarında sorgulanacak plakayı girin.'
      : 'Kayıtlarda sorgulanacak kişinin adını ve soyadını girin.') + '</p>' +
    '<div class="hist-tools">' +
    '<input type="text" class="fld" id="ask-q" size="26" placeholder="' +
    (plate ? 'ULX103' : 'Firstname Lastname') + '">' +
    '<button class="btn-sm" id="ask-go">Sorgula</button>' +
    '</div>')
  const input = el('ask-q')
  const submit = () => {
    if (!input) return
    const q = input.value.trim()
    if (!q) { input.focus(); return }
    closeDialog()
    if (plate) {
      if (qPlate) qPlate.value = q
      runPlate()
    } else {
      if (qName) qName.value = q
      runName()
    }
  }
  on(el('ask-go'), 'click', submit)
  on(input, 'keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit() } })
  if (input) { input.focus(); input.select() }
}

const KEY_ACTIONS = [
  { action: 'keyhelp', label: 'Klavye kısayolları', combo: 'F1' },
  { action: 'findnext', label: 'Sonrakini bul', combo: 'F3' },
  { action: 'reload', label: 'Sayfayı yenile', combo: 'F5' },
  { action: 'cycletheme', label: 'Sonraki tema', combo: 'F8' },
  { action: 'toggleaddr', label: 'Adres çubuğunu göster/gizle', combo: 'F9' },
  { action: 'togglesidebar', label: 'MDC yan panelini göster/gizle', combo: 'F10' },
  { action: 'find', label: 'Sayfada bul', combo: 'Ctrl+F' },
  { action: 'namecheck', label: 'İsim sorgulama penceresi', combo: 'Ctrl+N' },
  { action: 'platecheck', label: 'Plaka sorgulama penceresi', combo: 'Ctrl+L' },
  { action: 'history', label: 'Geçmiş', combo: 'Ctrl+H' },
  { action: 'newpage', label: 'Yeni sayfa aç', combo: 'Ctrl+T' },
  { action: 'closepage', label: 'Geçerli sayfayı kapat', combo: 'Ctrl+W' },
  { action: 'back', label: 'Geri', combo: 'Alt+Left' },
  { action: 'forward', label: 'İleri', combo: 'Alt+Right' },
  { action: 'zoomin', label: 'Yakınlaştır', combo: 'Ctrl++' },
  { action: 'zoomout', label: 'Uzaklaştır', combo: 'Ctrl+-' },
  { action: 'zoomreset', label: 'Gerçek boyut', combo: 'Ctrl+0' },
  { action: 'options', label: 'Ayarlar', combo: 'Ctrl+,' }
]

const KEYMAP_KEY = 'mdtKeymap'
let keymap = {}

function keysLoad() {
  try {
    const raw = window.localStorage.getItem(KEYMAP_KEY)
    keymap = raw ? (JSON.parse(raw) || {}) : {}
  } catch (_) {
    keymap = {}
  }
}

function keysSave() {
  try {
    window.localStorage.setItem(KEYMAP_KEY, JSON.stringify(keymap))
  } catch (_) {
  }
}

function keyItem(action) {
  for (let i = 0; i < KEY_ACTIONS.length; i++) {
    if (KEY_ACTIONS[i].action === action) return KEY_ACTIONS[i]
  }
  return null
}

function comboFor(action) {
  const item = keyItem(action)
  return keymap[action] || (item ? item.combo : '')
}

function comboOf(e) {
  const raw = e.key || ''
  if (!raw || ['Control', 'Alt', 'Shift', 'Meta', 'OS'].indexOf(raw) >= 0) return ''
  let name = raw.length === 1 ? raw.toUpperCase() : raw
  name = name.replace(/^Arrow/, '')
  if (name === ' ') name = 'Space'
  let out = ''
  if (e.ctrlKey) out += 'Ctrl+'
  if (e.altKey) out += 'Alt+'
  if (e.shiftKey && (name.length > 1 || e.ctrlKey || e.altKey)) out += 'Shift+'
  return out + name
}

function actionForCombo(combo) {
  if (!combo) return ''
  const want = combo.toLowerCase()
  for (let i = 0; i < KEY_ACTIONS.length; i++) {
    if (comboFor(KEY_ACTIONS[i].action).toLowerCase() === want) return KEY_ACTIONS[i].action
  }
  return ''
}

function comboOfMouse(e) {
  if (!e || typeof e.button !== 'number') return ''
  const n = e.button + 1
  if (n !== 2 && n !== 4 && n !== 5) return ''
  return 'Mouse' + n
}

function mouseLabel(combo) {
  if (combo === 'Mouse2') return 'Orta fare tuşu'
  if (combo === 'Mouse4') return 'Fare tuşu 4 (geri)'
  if (combo === 'Mouse5') return 'Fare tuşu 5 (ileri)'
  return combo
}

function keysForViews() {
  const plain = {}
  const ctrl = {}
  const mouse = {}
  KEY_ACTIONS.forEach((item) => {
    const combo = comboFor(item.action)
    const single = /^Ctrl\+(.)$/i.exec(combo)
    if (/^Mouse[245]$/i.test(combo)) mouse[combo] = item.action
    else if (/^F\d+$/i.test(combo)) plain[combo.toUpperCase()] = item.action
    else if (single) ctrl[single[1].toLowerCase()] = item.action
  })
  return { plain, ctrl, mouse }
}

function sendKeys() {
  const payload = keysForViews()
  allPageViews().forEach((v) => {
    try {
      v.send('mdt:set-keys', payload)
    } catch (_) {
    }
  })
  try {
    if (pcv) pcv.send('mdt:set-keys', payload)
  } catch (_) {
  }
}

function showKeys() {
  const rows = KEY_ACTIONS.map((item) =>
    '<tr><td>' + esc(item.label) + '</td>' +
    '<td class="key-combo">' + esc(/^Mouse[245]$/.test(comboFor(item.action)) ? mouseLabel(comboFor(item.action)) : comboFor(item.action)) + '</td>' +
    '<td><button class="btn-sm key-set" data-key="' + item.action + '">Değiştir</button></td></tr>'
  ).join('')

  openDialog('Klavye Kısayolları',
    '<p class="opt-note">Bu kısayollar istemcide ve MDC sayfalarında çalışır. ' +
    'Değiştir düğmesine basıp kullanmak istediğiniz tuş birleşimine basın; Escape iptal eder. ' +
    'Tuş yerine orta veya yan fare tuşlarını da atayabilirsiniz. Escape her zaman arama çubuğunu, ' +
    'bir iletişim penceresini veya yüklenen sayfayı kapatır ve yeniden atanamaz.</p>' +
    '<table class="key-table">' + rows + '</table>' +
    '<div class="hist-tools">' +
    '<button class="btn-sm" id="key-reset">Varsayılanları geri yükle</button>' +
    '<span class="hist-count" id="key-status"></span>' +
    '</div>')

  if (!dialogBody) return
  const status = el('key-status')
  const arm = (action, btn) => {
    if (status) status.textContent = 'Yeni tuş birleşimine basın...'
    btn.textContent = 'Tuşa basın'
    const stop = () => {
      document.removeEventListener('keydown', handler, true)
      document.removeEventListener('mousedown', mouseHandler, true)
      document.removeEventListener('auxclick', swallow, true)
    }
    const assign = (combo) => {
      stop()
      const clash = actionForCombo(combo)
      if (clash && clash !== action) delete keymap[clash]
      const item = keyItem(action)
      if (item && item.combo.toLowerCase() === combo.toLowerCase()) delete keymap[action]
      else keymap[action] = combo
      keysSave()
      sendKeys()
      showKeys()
      const after = el('key-status')
      if (after) {
        after.textContent = (/^Mouse[245]$/.test(combo) ? mouseLabel(combo) : combo) +
          ' atandı' + (clash && clash !== action ? ', ' + clash + ' eyleminden alındı' : '') + '.'
      }
    }
    const handler = (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      if (ev.key === 'Escape') {
        stop()
        showKeys()
        return
      }
      const combo = comboOf(ev)
      if (!combo) return
      assign(combo)
    }
    const mouseHandler = (ev) => {
      const combo = comboOfMouse(ev)
      if (!combo) return
      ev.preventDefault()
      ev.stopPropagation()
      assign(combo)
    }
    const swallow = (ev) => {
      if (!comboOfMouse(ev)) return
      ev.preventDefault()
      ev.stopPropagation()
    }
    document.addEventListener('keydown', handler, true)
    document.addEventListener('mousedown', mouseHandler, true)
    document.addEventListener('auxclick', swallow, true)
  }
  dialogBody.querySelectorAll('.key-set').forEach((btn) => {
    on(btn, 'click', () => arm(btn.getAttribute('data-key'), btn))
  })
  on(el('key-reset'), 'click', () => {
    keymap = {}
    keysSave()
    sendKeys()
    showKeys()
    const after = el('key-status')
    if (after) after.textContent = 'Varsayılanlar geri yüklendi.'
  })
}

let lastUpdate = null

function renderUpdate(res) {
  const panel = el('upd-panel')
  if (!panel) return
  if (!res || !res.ok || !res.newer) { panel.innerHTML = ''; return }
  const size = res.asset && res.asset.size
    ? ' (' + Math.round(res.asset.size / 104857.6) / 10 + ' MB)'
    : ''
  panel.innerHTML =
    '<p class="opt-note"><b>' + esc(res.latest) + ' sürümü kullanıma hazır.</b>' +
    (res.notes ? '<br>' + esc(res.notes.slice(0, 300)) : '') + '</p>' +
    '<div class="hist-tools">' +
    '<button class="btn-sm" id="upd-go">Şimdi Güncelle' + size + '</button>' +
    '<button class="btn-sm" id="upd-page">Sürüm Sayfasını Aç</button>' +
    '<span class="hist-count" id="upd-note"></span>' +
    '</div>'
  on(el('upd-page'), 'click', () => window.mdt.openExternal(res.page))
  on(el('upd-go'), 'click', () => installUpdate(res))
}

async function installUpdate(res) {
  const note = el('upd-note')
  if (!res.asset || !res.asset.url) {
    window.mdt.openExternal(res.page)
    return
  }
  if (note) note.textContent = 'İndiriliyor: ' + res.asset.name + '...'
  let out = null
  try {
    out = await window.mdt.installUpdate(res.asset)
  } catch (err) {
    out = { ok: false, error: String(err) }
  }
  if (out && out.ok) {
    if (note) note.textContent = 'Kurulum başlatıldı. İstemci kapatılacak.'
    playSound('save')
    return
  }
  if (note) note.textContent = 'İndirme başarısız: ' + ((out && out.error) || 'bilinmeyen hata')
  playSound('error')
}

async function runUpdateCheck(quiet) {
  const status = el('upd-status')
  if (status) status.textContent = 'Denetleniyor...'
  let res = null
  try {
    res = await window.mdt.checkUpdates()
  } catch (err) {
    res = { ok: false, error: String(err) }
  }
  lastUpdate = res
  if (!res || !res.ok) {
    if (status) status.textContent = 'Denetlenemedi: ' + ((res && res.error) || 'yanıt alınamadı')
    if (!quiet) playSound('error')
    return res
  }
  if (status) {
    status.textContent = res.newer
      ? res.latest + ' sürümü kullanıma hazır.'
      : 'Güncel (' + res.latest + ').'
  }
  if (res.newer) {
    setStatus('Güncelleme mevcut: ' + res.latest)
    playSound('notify')
    if (quiet) showAbout()
    renderUpdate(res)
  }
  return res
}

function showAbout() {
  openDialog('Hakkında: ' + APP_NAME,
    '<table>' +
    row('Ürün:', APP_NAME) +
    row('Sürüm:', appInfo.version || '1.0.1') +
    row('Çalışma ortamı:', 'Electron ' + (appInfo.electron || '') + ' / Chromium ' + (appInfo.chrome || '')) +
    row('Adres:', HOME) +
    '</table>' +
    '<p>GTA World Web MDC için masaüstü istemcisi. Oturum açma işlemi MDC sitesinde yapılır; ' +
    'bu uygulama hiçbir giriş bilgisini saklamaz.</p>' +
    '<div class="hist-tools">' +
    '<button class="btn-sm" id="upd-check">Güncellemeleri Denetle</button>' +
    '<button class="btn-sm" id="upd-repo">Proje Sayfası</button>' +
    '<span class="hist-count" id="upd-status"></span>' +
    '</div>' +
    '<div id="upd-panel"></div>')
  on(el('upd-check'), 'click', () => runUpdateCheck(false))
  on(el('upd-repo'), 'click', () => window.mdt.openExternal(REPO_URL))
  if (lastUpdate && lastUpdate.ok && lastUpdate.newer) renderUpdate(lastUpdate)
}

function showOptions() {
  const radio = (t) =>
    '<label class="opt-row"><input type="radio" name="opt-theme" value="' + t + '"' +
    (view.theme === t ? ' checked' : '') + '> ' + THEMES[t] + '</label>'

  const check = (key, label, locked) =>
    '<label class="opt-row' + (locked ? ' opt-off' : '') + '"><input type="checkbox" data-opt="' + key + '"' +
    (view[key] ? ' checked' : '') + (locked ? ' disabled' : '') + '> ' + label + '</label>'

  openDialog('Ayarlar',
    '<fieldset class="opt-group"><legend>Görünüm</legend>' +
    radio('light') + radio('dark') + radio('lapd') + radio('lssd') + radio('aero') +
    radio('aerolapd') + radio('aerodark') + radio('off') +
    '<p class="opt-note">F8 temalar arasında geçiş yapar. Üç Windows 7 Aero teması istemciye, ' +
    'MDC’ye ve açılır pencerelere Windows 7 döneminin cam efektlerini ve mavi vurgularını uygular. ' +
    'LSPD Mobil, MDC’yi, ceza kanunu sekmesini ve istemci arayüzünü devriye renklerine dönüştürür; ' +
    'LSSD Mobil aynısını koyu yeşil ve altın tonlarıyla yapar.</p>' +
    '</fieldset>' +
    '<fieldset class="opt-group"><legend>Hızlı Kısayollar</legend>' +
    check('quickLinks', 'Hızlı kısayol çubuğu (sekmelerin altındaki simgeler)') +
    '<p class="opt-note">Ana Sayfa, Sorgu, Trafik, C6 ve Çağrılar için büyük simgeler özel temalarda sekmelerin altında gösterilir.</p>' +
    '</fieldset>' +
    '<fieldset class="opt-group"><legend>Yerleşim</legend>' +
    check('toolbar', 'Araç çubuğu') +
    check('lookupFields', 'Sorgu alanları (MDC arama kutularının kopyası)') +
    check('addressBar', 'Adres çubuğu') +
    check('statusBar', 'Durum çubuğu') +
    check('navBar', 'MDC gezinme çubuğu (yan panel bağlantıları sekme olarak)') +
    check('sidebar', 'MDC yan paneli (F10)', view.navBar) +
    '<p class="opt-note">' + (view.navBar
      ? 'Gezinme çubuğu açık olduğu için yan panel gizli ve kilitli. Yan paneli yeniden kullanmak için gezinme çubuğunu kapatın.'
      : 'Gezinme çubuğu, yan panel bağlantılarını Ceza Kanunu sekmesinin yanına taşır. Açıldığında yan panel gizlenir ve kilitlenir.') +
    '</p>' +
    check('searchBoxes', 'MDC arama kutuları (Kişi Sorgula ve Araç Sorgula)') +
    '</fieldset>' +
    '<fieldset class="opt-group"><legend>Sesler</legend>' +
    check('sounds', 'Arayüz sesleri') +
    '<p class="opt-note">Varsayılan olarak kapalıdır. Tıklama, gezinme, sayfa açma, pencere kapatma veya geri gitme, kopyalama onayı, bildirim, kısıtlı işlem uyarısı, hata ve başlangıç sesleri.</p>' +
    '</fieldset>' +
    '<fieldset class="opt-group"><legend>Geçmiş</legend>' +
    check('historyLog', 'Açılan sayfa ve kayıtları geçmişe ekle') +
    check('historyOnlySubjects', 'Yalnızca kişi ve araç sorgularını kaydet', !view.historyLog) +
    '<p class="opt-note">' + (view.historyLog
      ? (view.historyOnlySubjects
        ? 'Yalnızca kayıtlar, isim ve plaka sorguları, araçlar ve arama emirleri kaydedilir. Ana sayfalar, listeler, haritalar ve ceza kanunu kaydedilmez.'
        : 'Açtığınız her şey kaydedilir. Yalnızca kayıtları, isim ve plaka sorgularını, araçları ve arama emirlerini tutmak için ikinci seçeneği açın.')
      : 'Geçmiş kapalı; daraltılacak bir kayıt yok.') +
    '</p>' +
    '<p class="opt-note">Araçlar &gt; Geçmiş (Ctrl+H), açtığınız öğeleri saatleriyle listeler; isim, plaka, kayıt numarası veya adrese göre arayabilirsiniz. Veriler yalnızca bu bilgisayarda tutulur. Oturumu temizlemek geçmişi silmez; geçmiş penceresindeki Geçmişi Temizle düğmesini kullanın.</p>' +
    '</fieldset>' +
    '<fieldset class="opt-group"><legend>Bildirimler</legend>' +
    check('alertBadge', 'Uyarılar düğmesinde okunmamış sayısını göster') +
    '<p class="opt-note">Okunmamış bildirim sayısını MDC’den alır ve Uyarılar düğmesinde gösterir. Uyarılar açıldığında sayaç temizlenir.</p>' +
    check('alertReminder', 'Bekleyen bildirimler için oturum açarken hatırlat') +
    '<p class="opt-note">İstemci başladıktan sonra okunmamış bildirim algılandığında sesli bir pencere gösterir.</p>' +
    '</fieldset>' +
    '<fieldset class="opt-group"><legend>Pencere</legend>' +
    check('dragWindows', 'Açılır pencereleri başlık çubuğundan sürükleyebil') +
    '<p class="opt-note">İstemcinin Geçmiş, Ayarlar, Klavye Kısayolları, İsim Sorgusu ve Plaka Sorgusu pencerelerine ve MDC’nin kendi açılır pencerelerine uygulanır.</p>' +
    check('discordPresence', 'Discord’da ne yaptığımı göster') +
    check('discordShowName', 'Discord’da karakter adımı da göster', !view.discordPresence) +
    '<p class="opt-note">İlk seçenek açıkken Discord’da “Mobile Data Computer” altında yaptığınız işlem (örneğin “Sorgulama yapıyor”) görünür. Karakter adınız Discord hesabınızla eşleştirilebileceği için varsayılan olarak gizlidir; görünmesini istiyorsanız ikinci seçeneği de açın.</p>' +
    check('minimizeToTray', 'Bildirim alanına küçült (sistem tepsisi)') +
    check('updateCheck', 'İstemci başladığında güncellemeleri denetle') +
    '<p class="opt-note">Güncelleme denetimi yalnızca proje sayfasındaki herkese açık sürüm listesini okur. Güncelle düğmesine basılana kadar hiçbir şey indirilmez veya kurulmaz. Varsayılan olarak kapalıdır; Yardım &gt; Hakkında bölümünden elle denetlenebilir.</p>' +
    '<p class="opt-note">Açıkken pencereyi küçültmek veya kapatmak uygulamayı bildirim alanında çalışır durumda tutar. Yeniden açmak için tepsi simgesini, kapatmak için Çıkış komutunu kullanın.</p>' +
    '</fieldset>' +
    '<fieldset class="opt-group"><legend>Oturum</legend>' +
    '<table>' +
    row('Ana sayfa adresi:', HOME) +
    row('Oturum deposu:', appInfo.partition || 'persist:gtaw-mdc') +
    row('Çerezler:', 'Yeniden başlatmalar arasında saklanır') +
    row('Giriş bilgileri:', 'Bu uygulama tarafından saklanmaz') +
    '</table></fieldset>')

  if (!dialogBody) return
  dialogBody.querySelectorAll('input[name="opt-theme"]').forEach((input) => {
    input.addEventListener('change', () => { if (input.checked) setTheme(input.value) })
  })
  dialogBody.querySelectorAll('input[data-opt]').forEach((input) => {
    input.addEventListener('change', () => {
      const key = input.getAttribute('data-opt')
      toggle(key)
      if (key === 'historyLog' || key === 'navBar' || key === 'discordPresence') showOptions()
    })
  })
}

function penalFilter() {
  const query = pcSearch ? String(pcSearch.value || '') : ''
  if (activeTab === 'penal' && pcv && pcv.send) {
    try {
      pcv.send('mdt:penal-filter', query)
    } catch (_) {
    }
  }
  if (activeTab === 'penal-backup') filterBackupPenal(query)
}

function filterBackupPenal(query) {
  const term = String(query || '').trim()
  if (!penalBackupReady || !penalBackupView || !penalBackupView.executeJavaScript) return
  if (!term && !penalBackupFilterActive) return

  const script = '(' + function (search) {
    if (typeof window.mdtFilterLaw !== 'function') return { ready: false, shown: 0, total: 0 }
    return window.mdtFilterLaw(search)
  }.toString() + ')(' + JSON.stringify(query) + ')'

  if (term) penalBackupFilterActive = true
  penalBackupView.executeJavaScript(script).then((result) => {
    if (activeTab !== 'penal-backup' || !pcSearch || pcSearch.value !== query) return
    if (!result || !result.ready) {
      setStatus('Yedek Ceza Kanunu metni aranamadı')
    } else if (!term) {
      penalBackupFilterActive = false
      setStatus('Yedek Ceza Kanunu')
    } else {
      setStatus('Ceza kanunu: ' + result.total + ' maddeden ' + result.shown + ' tanesi "' + query + '" ile eşleşti')
    }
  }).catch((err) => {
    console.error('[shell] failed to search backup penal page', err)
    if (activeTab === 'penal-backup') setStatus('Yedek Ceza Kanunu aranamadı')
  })
}

const NAV_ICONS = [
  [/sign\s*out|log\s*out|logout|çıkış/i, 'fa-right-from-bracket', '\u23FB'],
  [/dashboard|^home$|ana sayfa|gösterge/i, 'fa-gauge-high', '\u25A6'],
  [/person\s*lookup|persons?|people|citizen|kişi|şahıs|vatandaş/i, 'fa-id-card', '\u263A'],
  [/apb|bolo|broadcast/i, 'fa-bullhorn', '\u2762'],
  [/paperwork|generator/i, 'fa-file-pen', '\u270D'],
  [/post\s*arrest|arrest|booking|tutuklama|gözaltı/i, 'fa-handcuffs', '\u26D3'],
  [/active\s*warrant|aktif arama/i, 'fa-triangle-exclamation', '\u26A0'],
  [/wanted|warrant|aranan|arama emri/i, 'fa-scroll', '\u2691'],
  [/emergency|incident|call\s*log|acil|olay|çağrı/i, 'fa-tower-broadcast', '\u2637'],
  [/dmv|vehicle|plate|araç|plaka/i, 'fa-car', '\u26D0'],
  [/map|location|harita|konum/i, 'fa-map-location-dot', '\u2316'],
  [/database|records?|veritabanı|kayıt/i, 'fa-database', '\u2338'],
  [/report/i, 'fa-file-lines', '\u2637'],
  [/changelog|version/i, 'fa-clock-rotate-left', '\u2261'],
  [/law|penal|code|kanun|hukuk/i, 'fa-scale-balanced', '\u2696'],
  [/mail|email|message/i, 'fa-envelope', '\u2709'],
  [/dispatch|phone/i, 'fa-phone', '\u260E'],
  [/citation|ticket|fine/i, 'fa-receipt', '\u270E'],
  [/profile|account|officer/i, 'fa-user', '\u263A'],
  [/note|memo/i, 'fa-note-sticky', '\u2338'],
  [/misc|other|menu/i, 'fa-bars', '\u2630'],
  [/search|lookup|quer|ara|sorgu/i, 'fa-magnifying-glass', '\u2315'],
  [/web|site|portal/i, 'fa-globe', '\u2295']
]

function navIcon(label) {
  for (let i = 0; i < NAV_ICONS.length; i++) {
    if (NAV_ICONS[i][0].test(label)) return NAV_ICONS[i]
  }
  return [null, 'fa-circle-dot', '\u25AB']
}

function faLoaded(probe) {
  let fam = ''
  try {
    fam = window.getComputedStyle(probe, '::before').fontFamily || ''
  } catch (e) {
    fam = ''
  }
  return /font\s*awesome/i.test(fam)
}

function checkFontAwesome() {
  if (!document.body) return
  const probe = document.createElement('i')
  probe.className = 'fas fa-user'
  probe.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden'
  document.body.appendChild(probe)
  let tries = 0
  const test = () => {
    const ok = faLoaded(probe)
    document.body.classList.toggle('no-fa', !ok)
    return ok
  }
  if (test()) {
    probe.remove()
    return
  }
  const timer = setInterval(() => {
    tries++
    if (test() || tries > 24) {
      clearInterval(timer)
      probe.remove()
    }
  }, 250)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkFontAwesome)
} else {
  checkFontAwesome()
}

let navItems = []
let navCurrent = ''

const QUICK_BUTTONS = [
  { icon: 'home.png', label: 'Ana Sayfa', match: /dashboard|^home$|ana sayfa|gösterge/i, url: HOME },
  { icon: 'query.png', label: 'Sorgu', match: /person lookup|kişi sorgu|şahıs sorgu/i, url: HOME },
  { icon: 'traffic.png', label: 'Trafik', match: /dmv database|motorlu taşıt|plaka/i, url: DMV_URL },
  { icon: 'c6.png', label: 'Code 6', match: /vehicle map|araç haritası/i, url: HOME + 'map/vehicles' },
  { icon: 'calls.png', label: 'Çağrılar', match: /incident database|olay veritabanı|olay listesi/i, url: HOME + 'emergency/list' }
]

function wirePenalView(webview) {
  const isActive = () => activeTab === 'penal'
  const label = 'San Andreas Ceza Kanunu'

  on(webview, 'did-start-loading', () => {
    if (isActive()) setStatus(label + ' açılıyor...')
  })

  on(webview, 'did-stop-loading', () => {
    try {
      webview.send('mdt:set-skin', view.theme)
    } catch (_) {
    }
    if (isActive()) {
      setStatus(label)
      penalFilter()
    }
  })

  on(webview, 'did-fail-load', (e) => {
    if (e.errorCode === -3) return
    if (isActive()) setStatus(label + ' hatası ' + e.errorCode + ': ' + e.errorDescription)
    playSound('error')
  })

  on(webview, 'ipc-message', (e) => {
    if (e.channel === 'mdt:sound') {
      playSound(String((e.args && e.args[0]) || ''))
      return
    }
    if (e.channel === 'mdt:hotkey') {
      run(String((e.args && e.args[0]) || ''))
      return
    }
    if (!isActive()) return
    if (e.channel === 'mdt:penal-info') {
      const info = (e.args && e.args[0]) || {}
      setStatus(info.signedIn ? 'San Andreas Ceza Kanunu' : 'Forumda oturum açmanız gerekiyor')
      return
    }
    if (e.channel === 'mdt:penal-result') {
      const r = (e.args && e.args[0]) || {}
      if (!r.query) setStatus('San Andreas Ceza Kanunu')
      else setStatus('Ceza kanunu: ' + r.total + ' maddeden ' + r.shown + ' tanesi "' + r.query + '" ile eşleşti')
    }
  })

  on(webview, 'found-in-page', (e) => {
    const r = e.result || {}
    if (!findCount) return
    findCount.textContent = r.matches ? (r.activeMatchOrdinal || 0) + ' / ' + r.matches : 'Eşleşme yok'
  })
}

function wireBackupPenalView() {
  if (!penalBackupView) return

  on(penalBackupView, 'did-start-loading', () => {
    penalBackupReady = false
    penalBackupFilterActive = false
    if (activeTab === 'penal-backup') setStatus('Yedek Ceza Kanunu açılıyor...')
  })

  on(penalBackupView, 'did-stop-loading', () => {
    penalBackupReady = true
    if (activeTab === 'penal-backup') {
      setStatus('Yedek Ceza Kanunu')
      penalFilter()
    }
    updateNav()
  })

  on(penalBackupView, 'did-fail-load', (e) => {
    if (e.errorCode === -3) return
    if (activeTab === 'penal-backup') {
      setStatus('Yedek Ceza Kanunu hatası ' + e.errorCode + ': ' + e.errorDescription)
    }
    playSound('error')
  })

  on(penalBackupView, 'did-navigate', updateNav)
  on(penalBackupView, 'did-navigate-in-page', updateNav)
  on(penalBackupView, 'page-title-updated', (e) => {
    if (activeTab !== 'penal-backup') return
    document.title = APP_NAME
    setStatus(e.title || 'Yedek Ceza Kanunu')
  })
  on(penalBackupView, 'new-window', (e) => {
    if (e && e.url) openPage(e.url)
  })
}

function quickTarget(btn) {
  const hit = navItems.find((item) => btn.match.test(item.label))
  return hit ? hit.url : btn.url
}

function renderQuickBar() {
  if (!quickBar) return
  const on = view.quickLinks && view.theme !== 'off'
  quickBar.classList.toggle('hidden', !on)
  quickBar.textContent = ''
  if (!on) return
  const caption = document.createElement('span')
  caption.className = 'quickcap'
  caption.textContent = 'Hızlı Kısayollar'
  quickBar.appendChild(caption)
  const row = document.createElement('div')
  row.className = 'quickrow'
  quickBar.appendChild(row)
  QUICK_BUTTONS.forEach((btn) => {
    const node = document.createElement('button')
    node.className = 'quickbtn'
    node.title = btn.label
    const img = document.createElement('img')
    img.className = 'quickicon'
    img.src = 'icons/' + btn.icon
    img.alt = ''
    node.appendChild(img)
    const text = document.createElement('span')
    text.className = 'quicklabel'
    text.textContent = btn.label
    node.appendChild(text)
    node.addEventListener('click', () => {
      const url = quickTarget(btn)
      navCurrent = url
      showTab('mdc')
      try {
        wv.send('mdt:nav-go', url)
      } catch (_) {
      }
      setStatus(btn.label)
      playSound('click')
      renderNav()
    })
    node.addEventListener('contextmenu', (ev) => {
      ev.preventDefault()
      openPage(quickTarget(btn))
      setStatus(btn.label + ' (yeni sayfa)')
    })
    row.appendChild(node)
  })
}

const hdrPop = el('hdr-popup')
let hdrOpen = ''

function closeHeaderMenu() {
  hdrOpen = ''
  if (hdrPop) {
    hdrPop.classList.remove('open')
    hdrPop.textContent = ''
  }
  document.querySelectorAll('.hbtn.active').forEach((b) => b.classList.remove('active'))
}


let alertCount = 0
let alertGreeted = false

function alertBadgeEl() {
  const btn = el('hb-bell')
  if (!btn) return null
  let badge = btn.querySelector('.hbadge')
  if (!badge) {
    badge = document.createElement('span')
    badge.className = 'hbadge hidden'
    btn.appendChild(badge)
  }
  return badge
}

function renderAlerts() {
  const badge = alertBadgeEl()
  if (!badge) return
  badge.textContent = alertCount > 99 ? '99+' : String(alertCount)
  badge.classList.toggle('hidden', !(view.alertBadge && alertCount > 0))
  const btn = el('hb-bell')
  if (btn) {
    btn.title = alertCount > 0
      ? alertCount + ' okunmamış bildirim'
      : 'Bildirimler'
  }
}

function remindAlerts(n) {
  playSound('notify')
  openDialog(
    'Bildirimler',
    '<p>MDC’de <b>' + n + '</b> okunmamış bildiriminiz var.</p>' +
    '<p class="opt-note">Bildirimleri sağ üstteki Uyarılar düğmesinden açın. ' +
    'Bu hatırlatmayı Araçlar &gt; Ayarlar bölümünden kapatabilirsiniz.</p>'
  )
}

function alertAck() {
  const raw = parseInt(localStorage.getItem('mdc.alertAck') || '0', 10)
  return isNaN(raw) ? 0 : Math.max(0, raw)
}

function setAlertAck(n) {
  try {
    localStorage.setItem('mdc.alertAck', String(Math.max(0, Number(n) || 0)))
  } catch (_) {
  }
}

function setAlerts(value) {
  const next = Math.max(0, Number(value) || 0)
  const grew = next > alertCount
  alertCount = next
  renderAlerts()
  if (next === 0) {
    setAlertAck(0)
    alertGreeted = true
    return
  }
  if (next <= alertAck()) {
    alertGreeted = true
    return
  }
  setAlertAck(next)
  if (!alertGreeted) {
    alertGreeted = true
    if (view.alertReminder) remindAlerts(next)
    return
  }
  if (grew && view.alertBadge) playSound('notify')
}

function clearAlerts() {
  alertCount = 0
  setAlertAck(0)
  renderAlerts()
}

function headerCtlClick(kind) {
  if (hdrOpen === kind) {
    closeHeaderMenu()
    return
  }
  closeHeaderMenu()
  hdrOpen = kind
  const btn = el('hb-' + (kind === 'bell' ? 'bell' : kind === 'menu' ? 'menu' : 'history'))
  if (btn) btn.classList.add('active')
  showTab('mdc')
  playSound('click')
  try {
    wv.send('mdt:header-menu-request', kind)
  } catch (_) {
  }
}

function renderHeaderMenu(kind, items) {
  if (!hdrPop || hdrOpen !== kind) return
  hdrPop.textContent = ''
  const list = Array.isArray(items) ? items : []
  if (!list.length) {
    const empty = document.createElement('div')
    empty.className = 'hdrpop-empty'
    empty.textContent = 'Gösterilecek öğe yok.'
    hdrPop.appendChild(empty)
  }
  list.forEach((item) => {
    const row = document.createElement('button')
    row.className = 'hdrpop-item'
    const label = document.createElement('span')
    label.className = 'hdrpop-label'
    label.textContent = item.label || item.sub || ''
    row.appendChild(label)
    if (item.sub) {
      const sub = document.createElement('span')
      sub.className = 'hdrpop-sub'
      sub.textContent = item.sub
      row.appendChild(sub)
    }
    row.addEventListener('click', () => {
      try {
        wv.send('mdt:header-item', { kind: kind, index: item.index })
      } catch (_) {
      }
      playSound('click')
      closeHeaderMenu()
    })
    hdrPop.appendChild(row)
  })
  hdrPop.classList.add('open')
}

function wireHeaderCtl() {
  on(el('hb-history'), 'click', (e) => { e.stopPropagation(); headerCtlClick('history') })
  on(el('hb-bell'), 'click', (e) => { e.stopPropagation(); clearAlerts(); headerCtlClick('bell') })
  on(el('hb-menu'), 'click', (e) => { e.stopPropagation(); headerCtlClick('menu') })
  on(document, 'click', (e) => {
    if (!hdrOpen) return
    if (hdrPop && hdrPop.contains(e.target)) return
    closeHeaderMenu()
  })
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape' && hdrOpen) closeHeaderMenu()
  })
}

function renderNav() {
  if (!tabNav) return
  tabNav.textContent = ''
  navItems.forEach((item) => {
    const chip = document.createElement('button')
    chip.className = 'navchip' + (item.url === navCurrent ? ' active' : '')
    chip.title = item.label + '\n' + item.url
    const spec = navIcon(item.label)
    const icon = document.createElement('i')
    icon.className = 'navicon fas ' + spec[1]
    icon.setAttribute('data-glyph', spec[2])
    icon.setAttribute('aria-hidden', 'true')
    chip.appendChild(icon)
    if (/sign\s*out|log\s*out|logout/i.test(item.label)) chip.classList.add('navchip-out')
    const text = document.createElement('span')
    if (item.depth > 1) text.className = 'navsub'
    text.textContent = item.label
    chip.appendChild(text)
    chip.addEventListener('click', () => {
      navCurrent = item.url
      showTab('mdc')
      try {
        wv.send('mdt:nav-go', item.url)
      } catch (_) {
      }
      setStatus(item.label)
      playSound('nav')
      renderNav()
    })
    chip.addEventListener('contextmenu', (ev) => {
      ev.preventDefault()
      openPage(item.url)
      setStatus(item.label + ' (yeni sayfa)')
    })
    tabNav.appendChild(chip)
  })
  tabNav.classList.toggle('hidden', !navItems.length || !view.navBar)
}

function setNav(items) {
  const list = []
  if (items && typeof items.length === 'number') {
    for (let i = 0; i < items.length && list.length < 40; i++) {
      const item = items[i]
      if (!item || !item.label || !item.url) continue
      list.push({ label: String(item.label), url: String(item.url), depth: Number(item.depth) || 0 })
    }
  }
  navItems = list
  renderNav()
}

function showTab(name) {
  activeTab = ['penal', 'penal-backup', 'lssd', 'forum'].includes(name) ? name : 'mdc'
  if (AUX_TABS[activeTab]) openAux(activeTab)
  const penal = activeTab === 'penal'
  const penalBackup = activeTab === 'penal-backup'
  const lssd = activeTab === 'lssd'
  const forum = activeTab === 'forum'
  if (pcv) {
    pcv.classList.toggle('wv-off', !penal)
    if (penal && pcv.getAttribute('data-loaded') !== '1') {
      pcv.setAttribute('data-loaded', '1')
      try {
        pcv.loadURL(PENAL_URL)
      } catch (_) {
      }
    }
  }
  if (penalBackupView) {
    penalBackupView.classList.toggle('wv-off', !penalBackup)
    if (penalBackup) penalBackupView.setAttribute('data-loaded', '1')
  }
  if (lssdView) {
    lssdView.classList.toggle('wv-off', !lssd)
    if (lssd && lssdView.getAttribute('data-loaded') !== '1') {
      lssdView.setAttribute('data-loaded', '1')
      try {
        lssdView.loadURL(LSSD_URL)
      } catch (err) {
        console.error('[shell] failed to load LSSD Intranet', err)
        setStatus('LSSD Intranet açılamadı')
      }
    }
  }
  if (lssdForumView) {
    lssdForumView.classList.toggle('wv-off', !forum)
    if (forum && lssdForumView.getAttribute('data-loaded') !== '1') {
      lssdForumView.setAttribute('data-loaded', '1')
      try {
        lssdForumView.loadURL(LSSD_FORUM_URL)
      } catch (err) {
        console.error('[shell] failed to load LSSD Forum', err)
        setStatus('LSSD Forum açılamadı')
      }
    }
  }
  allPageViews().forEach((v) => {
    if (v) v.classList.toggle('wv-off', activeTab !== 'mdc' || v !== wv)
  })
  renderPageBar()
  if (pcBar) pcBar.classList.toggle('hidden', !penal && !penalBackup)
  const pcSignout = el('pc-signout')
  if (pcSignout) pcSignout.classList.toggle('hidden', penalBackup)
  const tabMdc = document.getElementById('tab-mdc')
  const tabLssd = document.getElementById('tab-lssd')
  const tabForum = document.getElementById('tab-forum')
  const tabPenal = document.getElementById('tab-penal')
  const tabPenalBackup = document.getElementById('tab-penal-backup')
  if (tabMdc) tabMdc.classList.toggle('active', activeTab === 'mdc')
  if (tabLssd) tabLssd.classList.toggle('active', lssd)
  if (tabForum) tabForum.classList.toggle('active', forum)
  if (tabPenal) tabPenal.classList.toggle('active', penal)
  if (tabPenalBackup) tabPenalBackup.classList.toggle('active', penalBackup)
  if (address) {
    try {
      address.value = activeView().getURL()
    } catch (_) {
      address.value = ''
    }
  }
  updateNav()
  document.dispatchEvent(new Event('mdc:chrome-changed'))
  setStatus(penal || penalBackup ? 'San Andreas Ceza Kanunu' : lssd ? 'LSSD Intranet' : forum ? 'LSSD Forum' : 'Hazır')
  if ((penal || penalBackup) && pcSearch) {
    pcSearch.focus()
    if (penalBackup) penalFilter()
  }
}

const actions = {
  home: () => { showTab('mdc'); wv.loadURL(HOME) },
  newpage: () => openPage(HOME),
  closepage: () => {
    if (AUX_TABS[activeTab]) closeAux(activeTab)
    else closePage(activePageId)
  },
  reload: () => activeView().reload(),
  stop: () => activeView().stop(),
  back: () => { const v = activeView(); if (v.canGoBack()) v.goBack() },
  forward: () => { const v = activeView(); if (v.canGoForward()) v.goForward() },
  zoomin: () => { zoom = Math.min(zoom + 0.5, 3); activeView().setZoomLevel(zoom) },
  zoomout: () => { zoom = Math.max(zoom - 0.5, -3); activeView().setZoomLevel(zoom) },
  zoomreset: () => { zoom = 0; activeView().setZoomLevel(0) },
  tabmdc: () => showTab('mdc'),
  tablssd: () => showTab('lssd'),
  tabforum: () => showTab('forum'),
  tabpenal: () => showTab('penal'),
  tabpenalbackup: () => showTab('penal-backup'),
  penalsignout: async () => {
    const r = await window.mdt.messageBox({
      type: 'warning',
      buttons: ['Çıkış Yap', 'İptal'],
      defaultId: 1,
      cancelId: 1,
      title: 'Forum Oturumunu Kapat',
      message: 'Bu istemcide GTA World forum oturumunu kapatmak istiyor musunuz?',
      detail: 'Yalnızca forum çerezleri temizlenir. MDC oturumunuz açık kalır.'
    })
    if (r === 0) {
      await window.mdt.clearForumSession()
      setStatus('Forum oturumu temizlendi')
      if (pcv && pcv.getAttribute('data-loaded') === '1') {
        try {
          pcv.loadURL(PENAL_URL)
        } catch (_) {
        }
      }
    }
  },
  themelight: () => setTheme('light'),
  themedark: () => setTheme('dark'),
  themelapd: () => setTheme('lapd'),
  themelssd: () => setTheme('lssd'),
  themeaero: () => setTheme('aero'),
  themeaerolapd: () => setTheme('aerolapd'),
  themeaerodark: () => setTheme('aerodark'),
  namecheck: () => promptLookup('name'),
  platecheck: () => promptLookup('plate'),
  keyhelp: () => showKeys(),
  checkupdates: () => { showAbout(); runUpdateCheck() },
  openrepo: () => window.mdt.openExternal(REPO_URL),
  themeoff: () => setTheme('off'),
  cycletheme: () => cycleTheme(),
  toggletoolbar: () => toggle('toolbar'),
  toggleaddr: () => toggle('addressBar'),
  togglelookup: () => toggle('lookupFields'),
  togglestatus: () => toggle('statusBar'),
  togglesidebar: () => toggle('sidebar'),
  togglenavbar: () => toggle('navBar'),
  find: () => openFind(),
  findnext: () => { if (findOpen()) doFind(true) },
  focusname: () => {
    if (view.lookupFields && qName) { qName.focus(); qName.select() } else promptLookup('name')
  },
  focusplate: () => {
    if (view.lookupFields && qPlate) { qPlate.focus(); qPlate.select() } else promptLookup('plate')
  },
  devtools: () => activeView().openDevTools(),
  layoutreport: () => {
    setStatus('Sayfa yerleşimi ölçülüyor...')
    wv.send('mdt:layout-report')
  },
  copyurl: () => navigator.clipboard.writeText(activeView().getURL()).then(() => {
    setStatus('Adres kopyalandı')
    playSound('save')
  }),
  opensite: () => window.mdt.openExternal('https://forum-tr.gta.world/'),
  history: () => showHistory(),
  options: () => showOptions(),
  about: () => showAbout(),
  exit: () => window.mdt.quit(),
  signout: async () => {
    const r = await window.mdt.messageBox({
      type: 'warning',
      buttons: ['Oturumu Temizle', 'İptal'],
      defaultId: 1,
      cancelId: 1,
      title: 'Oturumu Temizle',
      message: 'Saklanan MDC oturum verileri temizlensin mi?',
      detail: 'Bu istemcide GTA World UCP’ye yeniden giriş yapmanız gerekir. ' +
        'Bu uygulama parolanızı saklamaz.'
    })
    if (r === 0) {
      await window.mdt.clearSession()
      setStatus('Oturum temizlendi')
      wv.loadURL(HOME)
    }
  }
}

function run(action) {
  const fn = actions[action]
  if (!fn) return
  playSound(CLOSE_ACTIONS[action] ? 'close' : 'click')
  try {
    fn()
  } catch (err) {
    console.error('[shell] action failed: ' + action, err)
    setStatus('İşlem kullanılamıyor')
    playSound('error')
  }
}

const menus = Array.from(document.querySelectorAll('.menu'))
let menuArmed = false

function closeMenus() {
  menus.forEach((m) => m.classList.remove('open'))
  menuArmed = false
}

boot('menubar', () => {
  menus.forEach((menu) => {
    const label = menu.querySelector('.menu-label')
    on(label, 'click', (e) => {
      e.stopPropagation()
      const wasOpen = menu.classList.contains('open')
      closeMenus()
      if (!wasOpen) {
        menu.classList.add('open')
        menuArmed = true
      }
    })
    on(menu, 'mouseenter', () => {
      if (menuArmed) {
        menus.forEach((m) => m.classList.remove('open'))
        menu.classList.add('open')
      }
    })
  })

  const bar = el('menubar')
  let closeTimer = null
  const cancelClose = () => {
    if (closeTimer) {
      clearTimeout(closeTimer)
      closeTimer = null
    }
  }
  on(bar, 'mouseleave', () => {
    cancelClose()
    closeTimer = setTimeout(() => {
      closeTimer = null
      closeMenus()
    }, 320)
  })
  on(bar, 'mouseenter', cancelClose)

  document.querySelectorAll('.menu-item').forEach((item) => {
    on(item, 'click', () => {
      if (item.classList.contains('disabled')) return
      const action = item.getAttribute('data-action')
      closeMenus()
      if (action) run(action)
    })
  })

  document.addEventListener('click', closeMenus)
})

boot('toolbar', () => {
  const map = {
    'btn-back': 'back',
    'btn-forward': 'forward',
    'btn-refresh': 'reload',
    'btn-stop': 'stop',
    'btn-home': 'home',
    'btn-namecheck': 'namecheck',
    'btn-platecheck': 'platecheck',
    'btn-history': 'history',
    'btn-newpage': 'newpage',
    'btn-settings': 'options'
  }
  Object.keys(map).forEach((id) => {
    on(document.getElementById(id), 'click', () => run(map[id]))
  })

  on(el('go-name'), 'click', runName)
  on(el('go-plate'), 'click', runPlate)
  on(qName, 'keydown', (e) => { if (e.key === 'Enter') runName() })
  on(qPlate, 'keydown', (e) => { if (e.key === 'Enter') runPlate() })
})

boot('header-controls', () => {
  wireHeaderCtl()
})

boot('findbar', () => {
  on(findInput, 'keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); doFind(!e.shiftKey) }
    else if (e.key === 'Escape') { e.preventDefault(); closeFind() }
  })
  on(findInput, 'input', () => { if (findInput && !findInput.value) clearMatches() })
  on(findCase, 'change', () => { lastFindTerm = ''; doFind(true) })
  on(el('find-next'), 'click', () => doFind(true))
  on(el('find-prev'), 'click', () => doFind(false))
  on(el('find-close'), 'click', closeFind)
})

boot('dialog', () => {
  on(el('dialog-ok'), 'click', closeDialog)
  on(el('dialog-close'), 'click', closeDialog)

  const title = backdrop ? backdrop.querySelector('.dialog-title') : null
  on(title, 'mousedown', startDialogDrag)
  on(window, 'mousemove', moveDialogDrag)
  on(window, 'mouseup', endDialogDrag)
})

function wirePage(wv, page) {
  const isActive = () => activeTab === 'mdc' && !!page && page.id === activePageId

  on(wv, 'did-start-loading', () => {
    if (isActive()) setStatus('MDC açılıyor...')
  })

  on(wv, 'dom-ready', () => {
    try {
      wv.send('mdt:set-skin', view.theme)
      wv.send('mdt:set-drag', !!view.dragWindows)
      wv.send('mdt:set-sidebar', !!view.sidebar)
      wv.send('mdt:set-search-boxes', !!view.searchBoxes)
    } catch (_) {
    }
  })

  on(wv, 'did-stop-loading', () => {
    if (isActive()) setStatus('Tamamlandı')
    try {
      wv.send('mdt:set-skin', view.theme)
    } catch (_) {
    }
    try {
      wv.send('mdt:set-sidebar', !view.sidebar)
      wv.send('mdt:set-search-boxes', !view.searchBoxes)
      wv.send('mdt:set-drag', !!view.dragWindows)
    } catch (_) {
    }
    if (isActive()) updateNav()
  })

  on(wv, 'new-window', (e) => {
    if (!e || !e.url) return
    openPage(e.url)
  })

  on(wv, 'did-fail-load', (e) => {
    if (e.errorCode === -3) return
    setStatus('Hata ' + e.errorCode + ': ' + e.errorDescription)
    playSound('error')
  })

  on(wv, 'did-navigate', (e) => {
    if (page) page.url = e.url
    histAdd({ url: e.url, label: page ? pageLabel(page) : '' })
    if (!isActive()) return
    if (address) address.value = e.url
    updateNav()
    pushPresence()
  })

  on(wv, 'did-navigate-in-page', (e) => {
    if (page) page.url = e.url
    if (!isActive()) return
    if (address) address.value = e.url
    updateNav()
    pushPresence()
  })

  on(wv, 'page-title-updated', (e) => {
    if (page) page.title = e.title || 'Sayfa'
    if (page) histLabel(page.url, pageLabel(page))
    renderPageBar()
    if (!isActive()) return
    document.title = APP_NAME
    setStatus(e.title || 'Hazır')
  })

  on(wv, 'ipc-message', (e) => {
    if (!isActive()) return
    if (e.channel === 'mdt:page-info') {
      const info = (e.args && e.args[0]) || {}

      if (sbTheme) {
        sbTheme.textContent = info.skinnable === false
          ? 'Tema: uygulanmadı (oturum açma)'
          : 'Tema: ' + THEMES[view.theme]
      }
      if (info.officer) {
        const name = String(info.officer).replace(/\s*#\d+\s*$/, '').trim()
        if (name && name !== officerName) {
          officerName = name
          pushPresence()
        }
      }
      if (info.subject && page) histLabel(page.url, info.subject)
      if (info.subject) setStatus('Kayıt: ' + info.subject)
      else if (info.officer) setStatus('Oturum açıldı: ' + info.officer)
      return
    }
    if (e.channel === 'mdt:header-menu') {
      const payload = (e.args && e.args[0]) || {}
      renderHeaderMenu(String(payload.kind || ''), payload.items)
      return
    }
    if (e.channel === 'mdt:alerts') {
      setAlerts((e.args && e.args[0]) || 0)
      return
    }
    if (e.channel === 'mdt:nav') {
      setNav((e.args && e.args[0]) || [])
      return
    }
    if (e.channel === 'mdt:sound') {
      playSound(String((e.args && e.args[0]) || ''))
      return
    }
    if (e.channel === 'mdt:open-new-page') {
      const url = String((e.args && e.args[0]) || '')
      if (url) openPage(url)
      return
    }
    if (e.channel === 'mdt:open-penal') {
      showTab('penal')
      return
    }
    if (e.channel === 'mdt:hotkey') {
      run(String((e.args && e.args[0]) || ''))
      return
    }
    if (e.channel === 'mdt:layout-report-result') {
      showLayoutReport((e.args && e.args[0]) || {})
    }
  })

  on(wv, 'found-in-page', (e) => {
    const r = e.result || {}
    if (!findCount) return
    if (!r.matches) {
      findCount.textContent = 'Eşleşme yok'
      findCount.classList.add('nomatch')
      return
    }
    findCount.classList.remove('nomatch')
    findCount.textContent = (r.activeMatchOrdinal || 0) + ' / ' + r.matches
  })
}

boot('webview', () => {
  pageSeq = 1
  const first = { id: 'page-1', el: wv, title: 'Mobil Veri Bilgisayarı', url: HOME }
  pages = [first]
  activePageId = first.id
  wirePage(wv, first)
  renderPageBar()
})

function updateNav() {
  try {
    const v = activeView()
    const back = document.getElementById('btn-back')
    const fwd = document.getElementById('btn-forward')
    if (back) back.disabled = !v.canGoBack()
    if (fwd) fwd.disabled = !v.canGoForward()
  } catch (_) {
  }
}

function syncAddress(tab) {
  if (activeTab !== tab || !address) return
  try {
    address.value = activeView().getURL()
  } catch (_) {
  }
}

function trackNavigation(view, tab) {
  const refresh = () => {
    syncAddress(tab)
    updateNav()
  }
  on(view, 'did-navigate', refresh)
  on(view, 'did-navigate-in-page', refresh)
  on(view, 'did-stop-loading', () => syncAddress(tab))
}

boot('open-page-ipc', () => {
  if (!window.mdt || typeof window.mdt.onOpenPage !== 'function') return
  window.mdt.onOpenPage((url) => {
    if (/^https?:\/\//i.test(url)) openPage(url)
  })
})

boot('sidebar-button', () => {
  on(el('btn-sidebar'), 'click', () => run('togglesidebar'))
})

boot('sizing', () => {
  const content = document.querySelector('.content')

  function sizeWebview() {
    if (!content) return
    const w = content.clientWidth
    const h = content.clientHeight
    if (w <= 0 || h <= 0) return
    ;allPageViews().concat([pcv, penalBackupView]).forEach((v) => {
      if (!v || !v.style) return
      v.style.width = w + 'px'
      v.style.height = h + 'px'
    })
  }

  sizeWebview()
  if (window.addEventListener) window.addEventListener('resize', sizeWebview)

  document.addEventListener('mdc:chrome-changed', sizeWebview)
  document.addEventListener('visibilitychange', sizeWebview)
  if (window.addEventListener) window.addEventListener('focus', sizeWebview)
  setTimeout(sizeWebview, 0)
  setTimeout(sizeWebview, 300)
})

boot('sounds', () => {
  document.addEventListener('click', (e) => {
    const t = e && e.target
    if (!t || !t.closest) return
    if (t.closest('.dialog-close, .find-close, #btn-stop')) {
      playSound('close')
      return
    }
    if (t.closest('.menu-label, .fld-check, .btn')) playSound('click')
  }, true)
})

boot('keyboard', () => {
  document.addEventListener('keydown', (e) => {
    const typing = ['INPUT', 'TEXTAREA'].includes((e.target && e.target.tagName) || '')

    if (e.key === 'Escape') {
      closeMenus()
      if (findOpen()) closeFind()
      else if (backdrop && !backdrop.classList.contains('hidden')) closeDialog()
      else if (!typing) run('stop')
      return
    }

    let combo = comboOf(e)
    if (e.ctrlKey && combo === 'Ctrl+=') combo = 'Ctrl++'
    const action = actionForCombo(combo)
    if (!action) return
    if (typing && !e.ctrlKey && !e.altKey && !/^F\d+$/.test(e.key)) return
    e.preventDefault()
    run(action)
  })

  document.addEventListener('mousedown', (e) => {
    if (backdrop && !backdrop.classList.contains('hidden')) return
    const combo = comboOfMouse(e)
    if (!combo) return
    const action = actionForCombo(combo)
    if (!action) return
    e.preventDefault()
    e.stopPropagation()
    run(action)
  }, true)

  document.addEventListener('auxclick', (e) => {
    const combo = comboOfMouse(e)
    if (!combo || !actionForCombo(combo)) return
    e.preventDefault()
    e.stopPropagation()
  }, true)
})

boot('init', () => {
  setInterval(tick, 1000)
  tick()
  histLoad()
  keysLoad()
  sendKeys()
  setInterval(sendKeys, 4000)
  if (view.updateCheck) setTimeout(() => runUpdateCheck(true), 4000)
  document.addEventListener('mdc:chrome-changed', pushPresence)
  applyView()
  if (window.mdt && window.mdt.onWake) window.mdt.onWake(wakeViews)
  let played = false
  try {
    played = sessionStorage.getItem('mdtStartupPlayed') === '1'
    sessionStorage.setItem('mdtStartupPlayed', '1')
  } catch (_) {
  }
  if (window.mdt && window.mdt.startupOnce) {
    window.mdt.startupOnce().then((first) => {
      if (first) setTimeout(() => playSound('startup'), 500)
    }).catch(() => {
      if (!played) setTimeout(() => playSound('startup'), 500)
    })
  } else if (!played) {
    setTimeout(() => playSound('startup'), 500)
  }
  if (window.mdt && window.mdt.getInfo) {
    window.mdt.getInfo().then((info) => { appInfo = info })
  }
})

boot('penal', () => {
  if (!pcv) return

  wirePenalView(pcv)
  trackNavigation(pcv, 'penal')
})

boot('penal-backup', () => {
  wireBackupPenalView()
})

boot('lssd', () => {
  if (!lssdView) return

  on(lssdView, 'did-start-loading', () => {
    if (activeTab === 'lssd') setStatus('LSSD Intranet açılıyor...')
  })

  on(lssdView, 'did-stop-loading', () => {
    if (activeTab === 'lssd') setStatus('LSSD Intranet')
    updateNav()
  })

  on(lssdView, 'did-fail-load', (e) => {
    if (e.errorCode === -3) return
    if (activeTab === 'lssd') setStatus('LSSD Intranet hatası ' + e.errorCode + ': ' + e.errorDescription)
    playSound('error')
  })

  trackNavigation(lssdView, 'lssd')
  on(lssdView, 'page-title-updated', (e) => {
    setAuxTitle('lssd', e && e.title)
    if (activeTab !== 'lssd') return
    document.title = APP_NAME
    setStatus(e.title || 'LSSD Intranet')
  })
  on(lssdView, 'new-window', (e) => {
    if (e && e.url) openPage(e.url)
  })
})

boot('lssd-forum', () => {
  if (!lssdForumView) return

  on(lssdForumView, 'did-start-loading', () => {
    if (activeTab === 'forum') setStatus('LSSD Forum açılıyor...')
  })

  on(lssdForumView, 'did-stop-loading', () => {
    if (activeTab === 'forum') setStatus('LSSD Forum')
    updateNav()
  })

  on(lssdForumView, 'did-fail-load', (e) => {
    if (e.errorCode === -3) return
    if (activeTab === 'forum') setStatus('LSSD Forum hatası ' + e.errorCode + ': ' + e.errorDescription)
    playSound('error')
  })

  trackNavigation(lssdForumView, 'forum')
  on(lssdForumView, 'page-title-updated', (e) => {
    setAuxTitle('forum', e && e.title)
    if (activeTab !== 'forum') return
    document.title = APP_NAME
    setStatus(e.title || 'LSSD Forum')
  })
  on(lssdForumView, 'new-window', (e) => {
    if (e && e.url) openPage(e.url)
  })
})

boot('tabs', () => {
  on(document.getElementById('tab-mdc'), 'click', () => run('tabmdc'))
  on(document.getElementById('tab-lssd'), 'click', () => run('tablssd'))
  on(document.getElementById('tab-forum'), 'click', () => run('tabforum'))
  on(document.getElementById('tab-penal'), 'click', () => run('tabpenal'))
  on(document.getElementById('tab-penal-backup'), 'click', () => run('tabpenalbackup'))
  on(pcSearch, 'input', penalFilter)
  on(el('pc-clear'), 'click', () => {
    if (pcSearch) pcSearch.value = ''
    penalFilter()
  })
  on(el('pc-signout'), 'click', () => run('penalsignout'))

  document.addEventListener('keydown', (e) => {
    if (!e.ctrlKey || e.altKey || e.shiftKey) return
    if (e.key === '1') {
      e.preventDefault()
      run('tabmdc')
    } else if (e.key === '2') {
      e.preventDefault()
      run('tablssd')
    } else if (e.key === '3') {
      e.preventDefault()
      run('tabforum')
    } else if (e.key === '4') {
      e.preventDefault()
      run('tabpenal')
    } else if (e.key === '5') {
      e.preventDefault()
      run('tabpenalbackup')
    }
  })
})

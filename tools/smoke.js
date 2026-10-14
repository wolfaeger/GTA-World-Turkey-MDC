#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const vm = require('vm')

const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'renderer', 'index.html'), 'utf8')
const code = fs.readFileSync(path.join(root, 'renderer', 'renderer.js'), 'utf8')
const webviewPreload = fs.readFileSync(path.join(root, 'webview-preload.js'), 'utf8')
const forumPreload = fs.readFileSync(path.join(root, 'forum-preload.js'), 'utf8')

const ids = new Set()
for (const m of html.matchAll(/\sid="([^"]+)"/g)) ids.add(m[1])

const countClass = (cls) => {
  const re = new RegExp('class="[^"]*\\b' + cls + '\\b[^"]*"', 'g')
  return (html.match(re) || []).length
}

const MENU_COUNT = countClass('menu')
const MENU_ITEM_COUNT = countClass('menu-item')

const WEBVIEW_METHODS = [
  'send', 'loadURL', 'reload', 'stop', 'goBack', 'goForward', 'print',
  'setZoomLevel', 'findInPage', 'stopFindInPage', 'openDevTools', 'getURL',
  'focus', 'select', 'scrollIntoView', 'appendChild', 'removeChild',
  'setAttribute', 'insertBefore'
]

function classList(node) {
  const set = new Set()
  return {
    _set: set,
    add: (c) => set.add(c),
    remove: (c) => set.delete(c),
    contains: (c) => set.has(c),
    toggle: (c, force) => {
      const want = force === undefined ? !set.has(c) : !!force
      if (want) set.add(c)
      else set.delete(c)
      return want
    }
  }
}

function makeNode(desc) {
  const node = {
    id: typeof desc === 'string' ? desc : '',
    tagName: 'DIV',
    style: { setProperty() {}, getPropertyValue: () => '' },
    dataset: {},
    textContent: '',
    innerHTML: '',
    value: '',
    checked: false,
    disabled: false,
    listeners: {},
    children: [],
    appendChild(child) {
      this.children.push(child)
      return child
    },
    addEventListener(ev, fn) {
      ;(this.listeners[ev] = this.listeners[ev] || []).push(fn)
    },
    removeEventListener() {},
    dispatch(ev, payload) {
      ;(this.listeners[ev] || []).forEach((fn) => fn(Object.assign({ stopPropagation() {}, preventDefault() {} }, payload)))
    },
    getAttribute(name) { return this.attrs && this.attrs[name] !== undefined ? this.attrs[name] : null },
    setAttribute(name, v) { this.attrs = this.attrs || {}; this.attrs[name] = v },
    querySelector() { return makeNode('') },
    querySelectorAll() { return [] },
    canGoBack: () => false,
    canGoForward: () => false
  }
  node.classList = classList(node)
  WEBVIEW_METHODS.forEach((m) => { if (!node[m]) node[m] = () => {} })
  return node
}

const nodes = new Map()
const missing = []

const menuNodes = []
for (let i = 0; i < MENU_COUNT; i++) {
  const menu = makeNode('menu-' + i)
  const label = makeNode('menu-label-' + i)
  menu.querySelector = (sel) => (sel === '.menu-label' ? label : null)
  menu._label = label
  menuNodes.push(menu)
}

const menuItems = []
for (let i = 0; i < MENU_ITEM_COUNT; i++) {
  const item = makeNode('menu-item-' + i)
  item.attrs = { 'data-action': 'about' }
  menuItems.push(item)
}

const documentListeners = {}
const createdNodes = []
const contentNode = makeNode('content')

const document = {
  title: '',
  body: makeNode('body'),
  listeners: documentListeners,
  getElementById(id) {
    if (!ids.has(id)) { missing.push(id); return null }
    if (!nodes.has(id)) nodes.set(id, makeNode(id))
    return nodes.get(id)
  },
  querySelector(sel) {
    if (sel === '.menu') return menuNodes[0] || null
    if (sel === '.content') return contentNode
    return null
  },
  querySelectorAll(sel) {
    if (sel === '.menu') return menuNodes
    if (sel === '.menu-item') return menuItems
    return []
  },
  addEventListener(ev, fn) { (documentListeners[ev] = documentListeners[ev] || []).push(fn) },
  createElement: () => {
    const created = makeNode('')
    createdNodes.push(created)
    return created
  },
  createTextNode: () => ({}),
  dispatchEvent: () => true
}

const store = {}
const sandbox = {
  console,
  document,
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: (k) => { delete store[k] }
  },
  setInterval: () => 0,
  dispatchEvent: () => true,
  clearInterval: () => {},
  setTimeout: () => 0,
  Promise,
  Date,
  Math,
  JSON,
  String,
  Number,
  Object,
  Array
}
sandbox.window = sandbox
sandbox.addEventListener = () => {}
sandbox.removeEventListener = () => {}
sandbox.Event = function Event(type) { this.type = type }
sandbox.innerWidth = 1280
sandbox.innerHeight = 860
sandbox.mdt = {
  getInfo: () => Promise.resolve({ version: '1.0.0', electron: '31.0.0', chrome: '126' }),
  clearSession: () => Promise.resolve(),
  openExternal: () => {},
  quit: () => {},
  messageBox: () => Promise.resolve(1)
}

const failures = []
const warnings = []
const realWarn = console.warn
console.warn = (...a) => warnings.push(a.join(' '))

try {
  vm.runInNewContext(code, sandbox, { filename: 'renderer.js' })
} catch (err) {
  failures.push('renderer.js threw at load: ' + (err && err.stack ? err.stack : err))
}

console.warn = realWarn

if (missing.length) {
  failures.push('renderer.js looked up ids absent from index.html: ' + [...new Set(missing)].join(', '))
}

if (MENU_COUNT === 0) failures.push('index.html has no .menu elements')

if (!html.includes('src="https://mdc-tr.gta.world/"')) failures.push('MDC webview does not point to the Turkish site')
if (!code.includes("const HOME = 'https://mdc-tr.gta.world/'")) failures.push('MDC home route is not Turkish')
if (!code.includes('https://forum-tr.gta.world/index.php?/topic/77-san-andreas-ceza-kanunu/')) {
  failures.push('penal code route is not the Turkish forum topic')
}
if (!webviewPreload.includes('mdc-tr\\.gta\\.world')) failures.push('MDC skin does not recognize the Turkish host')
if (!forumPreload.includes('forum-tr\\.gta\\.world')) failures.push('forum preload does not recognize the Turkish host')

const unwiredLabels = menuNodes.filter((m) => !(m._label.listeners.click || []).length).length
if (unwiredLabels) failures.push(unwiredLabels + ' of ' + MENU_COUNT + ' menu labels have no click handler')

const unwiredItems = menuItems.filter((i) => !(i.listeners.click || []).length).length
if (unwiredItems) failures.push(unwiredItems + ' of ' + MENU_ITEM_COUNT + ' menu items have no click handler')

if (!(documentListeners.keydown || []).length) failures.push('no global keydown handler (shortcuts dead)')
if (!(documentListeners.click || []).length) failures.push('no global click handler (menus would never close)')

if (menuNodes.length) {
  menuNodes[0]._label.dispatch('click')
  if (!menuNodes[0].classList.contains('open')) failures.push('clicking a menu label did not open the menu')
  ;(documentListeners.click || []).forEach((fn) => fn({}))
  if (menuNodes[0].classList.contains('open')) failures.push('clicking elsewhere did not close the menu')
}

if (typeof sandbox.showTab !== 'function') {
  failures.push('showTab is not reachable, cannot check address bar syncing')
} else {
  const addressNode = nodes.get('address')
  const checks = [['lssd', 'lssd'], ['forum', 'lssd-forum'], ['penal', 'penal']]
  for (const [tab, id] of checks) {
    const viewNode = nodes.get(id)
    if (!viewNode || !addressNode) {
      failures.push('address check could not find the ' + id + ' view or the address box')
      continue
    }
    sandbox.showTab(tab)
    let current = 'https://example.test/' + tab + '/reports/incident/new'
    viewNode.getURL = () => current
    viewNode.dispatch('did-navigate-in-page', {})
    if (addressNode.value !== current) failures.push(tab + ': address box did not follow an in-page navigation')
    current = 'https://example.test/' + tab + '/home'
    viewNode.dispatch('did-navigate', {})
    if (addressNode.value !== current) failures.push(tab + ': address box did not follow a page navigation')
    current = 'https://example.test/' + tab + '/after-redirect'
    viewNode.dispatch('did-stop-loading', {})
    if (addressNode.value !== current) failures.push(tab + ': address box did not refresh when loading stopped')
  }
  sandbox.showTab('mdc')
}

if (typeof sandbox.showTab === 'function') {
  const AUX = { lssd: 'LSSD Intranet', forum: 'LSSD Forum', penal: 'Ceza Kanunu', 'penal-backup': 'Ceza Kanunu (Yedek)' }
  const auxLabels = Object.values(AUX)
  const pageBar = nodes.get('page-bar')
  const isSelected = (n) => /\bactive\b/.test(n.className || '')
  const labelOf = (n) => (n.children[0] && n.children[0].textContent) || ''
  const buttonsSince = (mark) => {
    const row = createdNodes.slice(mark).filter((n) => n.className === 'pagerow').pop()
    return row ? row.children.filter((n) => /\bpagetab\b/.test(n.className || '')) : []
  }

  for (const [tab, label] of Object.entries(AUX)) {
    const tabNode = nodes.get('tab-' + tab)
    if (!tabNode || !pageBar) {
      failures.push(tab + ': tab button or page bar element is missing')
      continue
    }
    let mark = createdNodes.length
    sandbox.showTab(tab)
    sandbox.showTab(tab)
    if (pageBar.classList.contains('hidden')) failures.push(tab + ': the page bar is hidden outside the MDC tab')
    let buttons = buttonsSince(mark)
    const mine = buttons.filter((b) => labelOf(b) === label)
    if (mine.length !== 1) {
      failures.push(tab + ': expected one "' + label + '" button in the page bar, found ' + mine.length)
      continue
    }
    if (!isSelected(mine[0])) failures.push(tab + ': its own page button is not selected while the tab is open')
    if (buttons.filter(isSelected).length !== 1) failures.push(tab + ': more than one page button is selected')

    const pageButton = buttons.find((b) => !auxLabels.includes(labelOf(b)))
    if (!pageButton) {
      failures.push(tab + ': no MDC page button next to the tab button')
    } else {
      mark = createdNodes.length
      nodes.get('tab-mdc').classList.remove('active')
      pageButton.dispatch('click')
      if (!nodes.get('tab-mdc').classList.contains('active')) failures.push(tab + ': clicking an MDC page did not return to the MDC tab')
      const again = buttonsSince(mark).filter((b) => labelOf(b) === label)
      if (again.length !== 1) {
        failures.push(tab + ': its page button disappeared after switching to an MDC page')
      } else {
        tabNode.classList.remove('active')
        again[0].dispatch('click')
        if (!tabNode.classList.contains('active')) failures.push(tab + ': clicking its page button did not open the tab')
      }
    }

    mark = createdNodes.length
    const closeButton = mine[0].children[1]
    if (!closeButton) {
      failures.push(tab + ': its page button has no close control')
      continue
    }
    closeButton.dispatch('click')
    if (tabNode.classList.contains('active')) failures.push(tab + ': the tab stayed selected after its page was closed')
    if (buttonsSince(mark).some((b) => labelOf(b) === label)) failures.push(tab + ': closed page still listed in the page bar')

    mark = createdNodes.length
    sandbox.showTab(tab)
    if (buttonsSince(mark).filter((b) => labelOf(b) === label).length !== 1) failures.push(tab + ': reopening the tab did not list it again')
    const reopened = buttonsSince(mark).filter((b) => labelOf(b) === label)[0]
    if (reopened && reopened.children[1]) reopened.children[1].dispatch('click')
  }

  const titleCases = [
    ['lssd', 'lssd', "Olay Raporu - LS County Sheriff's Intranet (v1) - LSSD", 'Olay Raporu'],
    ['lssd', 'lssd', "LS County Sheriff's Intranet (v1) - LSSD", 'LSSD Intranet'],
    ['forum', 'lssd-forum', "SR-20353-12/10/2026-Leon Vellucci - İfade Raporları - Los Santos County Sheriff's Department", 'SR-20353-12/10/2026-Leon Vellucci'],
    ['forum', 'lssd-forum', "Los Santos County Sheriff's Department", 'LSSD Forum'],
    ['forum', 'lssd-forum', 'Bu çok uzun bir konu başlığıdır ve şeritte kısaltılmalıdır - İfade Raporları - Site', 'Bu çok uzun bir konu başlığıdır ve…']
  ]
  for (const [tab, viewId, title, expected] of titleCases) {
    const viewNode = nodes.get(viewId)
    sandbox.showTab(tab)
    const mark = createdNodes.length
    viewNode.dispatch('page-title-updated', { title })
    const base = AUX[tab]
    const shown = buttonsSince(mark).map(labelOf)
    if (!shown.includes(expected)) {
      failures.push(tab + ': title "' + title + '" should show as "' + expected + '" in the page bar, got: ' + shown.join(' | '))
    }
    if (expected !== base && shown.includes(base)) failures.push(tab + ': the page bar still shows the plain tab name next to the title')
  }
  {
    const viewNode = nodes.get('lssd')
    sandbox.showTab('mdc')
    const mark = createdNodes.length
    viewNode.dispatch('page-title-updated', { title: 'Genel Raporlar - LS County Sheriff\'s Intranet (v1) - LSSD' })
    if (!buttonsSince(mark).map(labelOf).includes('Genel Raporlar')) failures.push('lssd: the title was not updated while another tab was in front')
  }
  sandbox.closeAux('lssd')
  sandbox.closeAux('forum')
  {
    const mark = createdNodes.length
    sandbox.showTab('forum')
    if (!buttonsSince(mark).map(labelOf).includes('LSSD Forum')) failures.push('forum: a reopened page kept the title of the page that was closed')
    sandbox.closeAux('forum')
  }

  const orderMark = createdNodes.length
  sandbox.showTab('lssd')
  sandbox.openPage('https://mdc-tr.gta.world/order-check')
  const order = buttonsSince(orderMark).map(labelOf)
  if (order.length !== 3 || order.indexOf('LSSD Intranet') !== 1) {
    failures.push('page order: expected the first MDC page, then Intranet, then the newer MDC page, got: ' + order.join(' | '))
  }
  sandbox.showTab('mdc')
}

const pkgJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const mainSource = fs.readFileSync(path.join(root, 'main.js'), 'utf8')
for (const m of mainSource.matchAll(/require\('\.\/([\w-]+)'\)/g)) {
  const file = m[1] + '.js'
  if (!pkgJson.build.files.includes(file)) {
    failures.push(file + ' is required by main.js but missing from build.files (the installed app would crash on start)')
  }
}

if (warnings.length) {
  console.log('warnings from renderer.js:')
  warnings.forEach((w) => console.log('  ' + w))
}

if (failures.length) {
  console.error('SMOKE TEST FAILED')
  failures.forEach((f) => console.error('  - ' + f))
  process.exit(1)
}

console.log('SMOKE TEST PASSED')
console.log('  menus wired:      ' + MENU_COUNT)
console.log('  menu items wired: ' + MENU_ITEM_COUNT)
console.log('  ids resolved:     ' + nodes.size)

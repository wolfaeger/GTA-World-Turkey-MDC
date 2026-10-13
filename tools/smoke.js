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
  const pageBar = nodes.get('page-bar')
  const tabMdc = nodes.get('tab-mdc')
  for (const tab of ['lssd', 'forum', 'penal', 'penal-backup']) {
    const mark = createdNodes.length
    sandbox.showTab(tab)
    if (!pageBar) {
      failures.push('page bar element was never looked up')
      break
    }
    if (pageBar.classList.contains('hidden')) failures.push(tab + ': the page bar is hidden outside the MDC tab')
    const pageTabs = createdNodes.slice(mark).filter((n) => /\bpagetab\b/.test(n.className || ''))
    if (!pageTabs.length) {
      failures.push(tab + ': the page bar was drawn without any page buttons')
      continue
    }
    if (pageTabs.some((n) => /\bactive\b/.test(n.className))) failures.push(tab + ': a page button looks selected while another tab is open')
    tabMdc.classList.remove('active')
    pageTabs[0].dispatch('click')
    if (!tabMdc.classList.contains('active')) failures.push(tab + ': clicking a page button did not return to the MDC tab')
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

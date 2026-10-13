'use strict'

const path = require('path')
const fs = require('fs')
const os = require('os')

const MDC_HOST = 'mdc-tr.gta.world'
const TRACKING_PARAM = /^(utm_[a-z0-9_]+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|igshid|yclid|_hsenc|_hsmi|ref_src)$/i

function isHttp(url) {
  return /^https?:\/\//i.test(String(url || ''))
}

function hostOf(url) {
  try {
    return new URL(String(url || '')).host.toLowerCase()
  } catch (_) {
    return ''
  }
}

function cleanLink(raw) {
  try {
    const u = new URL(String(raw || ''))
    if (u.search.length > 1) {
      const kept = u.search.slice(1).split('&').filter((part) => {
        let key = part.split('=')[0]
        try {
          key = decodeURIComponent(key)
        } catch (_) {
        }
        return !TRACKING_PARAM.test(key)
      })
      u.search = kept.length ? '?' + kept.join('&') : ''
    }
    return u.toString()
  } catch (_) {
    return String(raw || '')
  }
}

function safeFileName(text) {
  const name = String(text || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim()
  return (name || 'sayfa').slice(0, 80)
}

function createGuestMenu(deps) {
  const { Menu, BrowserWindow, clipboard, dialog, shell, getMainWindow, openInApp } = deps

  function history(contents) {
    return contents.navigationHistory || null
  }

  function canGoBack(contents) {
    try {
      const nh = history(contents)
      return !!(nh && typeof nh.canGoBack === 'function' ? nh.canGoBack() : contents.canGoBack())
    } catch (_) {
      return false
    }
  }

  function canGoForward(contents) {
    try {
      const nh = history(contents)
      return !!(nh && typeof nh.canGoForward === 'function' ? nh.canGoForward() : contents.canGoForward())
    } catch (_) {
      return false
    }
  }

  function goBack(contents) {
    const nh = history(contents)
    if (nh && typeof nh.goBack === 'function') nh.goBack()
    else contents.goBack()
  }

  function goForward(contents) {
    const nh = history(contents)
    if (nh && typeof nh.goForward === 'function') nh.goForward()
    else contents.goForward()
  }

  function hostWindow(contents) {
    try {
      const win = BrowserWindow.fromWebContents(contents.hostWebContents)
      if (win) return win
    } catch (_) {
    }
    return typeof getMainWindow === 'function' ? getMainWindow() : null
  }

  async function savePageAs(contents) {
    const win = hostWindow(contents)
    const options = {
      defaultPath: safeFileName(contents.getTitle()) + '.html',
      filters: [{ name: 'Web Sayfası, Tamamı', extensions: ['html'] }]
    }
    const result = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options)
    if (result.canceled || !result.filePath) return
    await contents.savePage(result.filePath, 'HTMLComplete')
  }

  async function showSource(contents) {
    const url = contents.getURL()
    const html = await contents.executeJavaScript('document.documentElement.outerHTML')
    const file = path.join(os.tmpdir(), 'mdc-kaynak-' + Date.now() + '.txt')
    fs.writeFileSync(file, '<!-- ' + url + ' -->\n' + String(html || ''), 'utf8')
    const win = new BrowserWindow({
      width: 1100,
      height: 760,
      autoHideMenuBar: true,
      title: 'Sayfa kaynağı: ' + url,
      webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
    })
    win.on('closed', () => {
      try {
        fs.unlinkSync(file)
      } catch (_) {
      }
    })
    await win.loadFile(file)
  }

  function openInBrowser(url) {
    if (isHttp(url)) shell.openExternal(url)
  }

  function buildTemplate(contents, params) {
    const p = params || {}
    const flags = p.editFlags || {}
    const link = String(p.linkURL || '')
    const linkOk = isHttp(link)
    const selection = String(p.selectionText || '').trim()
    const editable = !!p.isEditable
    const imageUrl = String(p.srcURL || '')
    const image = p.mediaType === 'image' && isHttp(imageUrl)
    const pageUrl = String(contents.getURL() || '')
    const groups = []

    if (editable) {
      groups.push([
        { label: 'Geri Al', enabled: !!flags.canUndo, click: () => contents.undo() },
        { label: 'Yinele', enabled: !!flags.canRedo, click: () => contents.redo() }
      ])
      groups.push([
        { label: 'Kes', enabled: !!flags.canCut, click: () => contents.cut() },
        { label: 'Kopyala', enabled: !!flags.canCopy, click: () => contents.copy() },
        { label: 'Yapıştır', enabled: !!flags.canPaste, click: () => contents.paste() },
        { label: 'Tümünü Seç', enabled: !!flags.canSelectAll, click: () => contents.selectAll() }
      ])
    }

    if (linkOk) {
      const open = []
      if (hostOf(link).endsWith('gta.world') && typeof openInApp === 'function') {
        open.push({ label: 'Bağlantıyı Yeni Sayfada Aç', click: () => openInApp(link) })
      }
      open.push({ label: 'Bağlantıyı Tarayıcıda Aç', click: () => openInBrowser(link) })
      groups.push(open)
      groups.push([
        { label: 'Bağlantıyı İndir', click: () => contents.downloadURL(link) },
        { label: 'Bağlantı Adresini Kopyala', click: () => clipboard.writeText(link) },
        { label: 'Temiz Bağlantıyı Kopyala', click: () => clipboard.writeText(cleanLink(link)) }
      ])
    }

    if (image) {
      groups.push([
        { label: 'Resmi Kopyala', click: () => contents.copyImageAt(p.x || 0, p.y || 0) },
        { label: 'Resmi İndir', click: () => contents.downloadURL(imageUrl) },
        { label: 'Resim Adresini Kopyala', click: () => clipboard.writeText(imageUrl) },
        { label: 'Resmi Tarayıcıda Aç', click: () => openInBrowser(imageUrl) }
      ])
    }

    if (!editable && selection) {
      groups.push([
        { label: 'Kopyala', click: () => contents.copy() },
        { label: 'Tümünü Seç', click: () => contents.selectAll() }
      ])
    }

    if (!editable && !linkOk && !image && !selection) {
      groups.push([
        { label: 'Geri', enabled: canGoBack(contents), click: () => goBack(contents) },
        { label: 'İleri', enabled: canGoForward(contents), click: () => goForward(contents) },
        { label: 'Yeniden Yükle', click: () => contents.reload() }
      ])
      const page = [
        { label: 'Farklı Kaydet...', click: () => savePageAs(contents).catch((err) => console.warn('[menu] save page', err)) },
        { label: 'Yazdır...', click: () => contents.print() }
      ]
      groups.push(page)
      if (isHttp(pageUrl) || /^file:/i.test(pageUrl)) {
        groups.push([
          { label: 'Sayfa Kaynağını Görüntüle', click: () => showSource(contents).catch((err) => console.warn('[menu] view source', err)) }
        ])
      }
    }

    groups.push([
      { label: 'İncele', click: () => contents.inspectElement(p.x || 0, p.y || 0) }
    ])

    const template = []
    groups.forEach((group, i) => {
      if (i > 0) template.push({ type: 'separator' })
      group.forEach((item) => template.push(item))
    })
    return template
  }

  function show(contents, params) {
    const menu = Menu.buildFromTemplate(buildTemplate(contents, params))
    const win = hostWindow(contents)
    menu.popup(win ? { window: win } : {})
  }

  function attach(contents) {
    contents.on('context-menu', (_event, params) => {
      if (hostOf(contents.getURL()) === MDC_HOST) return
      try {
        show(contents, params)
      } catch (err) {
        console.warn('[menu] context menu failed', err)
      }
    })
  }

  return { attach, buildTemplate, cleanLink }
}

module.exports = { createGuestMenu, cleanLink }

'use strict'

const fs = require('fs')
const path = require('path')

const version = String(process.argv[2] || '').replace(/^v/i, '')
const out = process.argv[3]

if (!version || !out) {
  console.error('usage: node tools/release-notes.js <version> <output-file>')
  process.exit(1)
}

const changelog = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8').replace(/\r\n/g, '\n')
const lines = changelog.split('\n')
const heading = '## ' + version
const from = lines.findIndex((line) => line.trim() === heading)

let body = ''
if (from >= 0) {
  let to = lines.length
  for (let i = from + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      to = i
      break
    }
  }
  body = lines.slice(from + 1, to).join('\n').trim()
}

if (!body) body = 'Mobile Data Computer - GTA World TR ' + version

fs.writeFileSync(out, body + '\n', 'utf8')
console.log('release notes written for ' + version + ' (' + body.length + ' chars)')

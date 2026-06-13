#!/usr/bin/env node
'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')

// The skills ship inside this package, so `npx pvgloria/skills` already has them
// on disk next to this script — no separate clone needed. Install just copies
// them into ~/.claude/skills; running it again copies the latest = update.
// Buckets are flattened: skills/<bucket>/<name>/ lands as ~/.claude/skills/<name>/.
const INSTALL_BUCKETS = ['engineering', 'productivity', 'misc', 'personal']
const SOURCE = path.join(__dirname, '..', 'skills')
const DEST = path.join(os.homedir(), '.claude', 'skills')

function isSymlink(p) {
  try {
    return fs.lstatSync(p).isSymbolicLink()
  } catch {
    return false
  }
}

function listSkills() {
  const out = []
  for (const bucket of INSTALL_BUCKETS) {
    const dir = path.join(SOURCE, bucket)
    if (!fs.existsSync(dir)) continue

    for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
      if (d.isDirectory() && fs.existsSync(path.join(dir, d.name, 'SKILL.md'))) {
        out.push({ name: d.name, src: path.join(dir, d.name) })
      }
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

function install() {
  fs.mkdirSync(DEST, { recursive: true })

  const installed = []
  const skipped = []
  for (const { name, src } of listSkills()) {
    const dest = path.join(DEST, name)

    // Never clobber a symlink — it points at a skill we don't own.
    if (isSymlink(dest)) {
      skipped.push(name)
      continue
    }

    fs.rmSync(dest, { recursive: true, force: true })
    fs.cpSync(src, dest, { recursive: true })
    installed.push(name)
  }

  console.log(`✓ Installed ${installed.length} skill(s) into ${DEST}`)
  installed.forEach((s) => console.log('  + ' + s))
  skipped.forEach((s) => console.log('  ! ' + s + ' (skipped: symlink)'))
}

const cmd = process.argv[2]
if (cmd === undefined || cmd === 'install') {
  install()
} else if (cmd === '-h' || cmd === '--help' || cmd === 'help') {
  console.log('Usage: npx pvgloria/skills install   # install or update skills in ~/.claude/skills')
} else {
  console.error(`Unknown command: ${cmd}`)
  console.log('Usage: npx pvgloria/skills install')
  process.exitCode = 1
}

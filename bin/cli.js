#!/usr/bin/env node
'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFileSync } = require('child_process')

// The skills ship inside this package, so `npx pvgloria/skills` already has them
// on disk next to this script — no separate clone needed. Install just copies
// them into ~/.claude/skills; running it again copies the latest = update.
// Buckets are flattened: skills/<bucket>/<name>/ lands as ~/.claude/skills/<name>/.
const INSTALL_BUCKETS = ['engineering', 'productivity', 'misc', 'personal']
const SOURCE = path.join(__dirname, '..', 'skills')
const DEST = path.join(os.homedir(), '.claude', 'skills')

// Third-party skills I use, installed via the skills.sh CLI (npx skills) from
// their original repos. Value "*" = every skill in the repo; an array = a subset.
const EXTERNAL = path.join(__dirname, '..', 'external-skills.json')

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

  console.log(`✓ Installed ${installed.length} personal skill(s) into ${DEST}`)
  installed.forEach((s) => console.log('  + ' + s))
  skipped.forEach((s) => console.log('  ! ' + s + ' (skipped: symlink)'))

  installExternal()
}

function installExternal() {
  if (!fs.existsSync(EXTERNAL)) return

  const repos = JSON.parse(fs.readFileSync(EXTERNAL, 'utf8'))
  const names = Object.keys(repos)
  if (names.length === 0) return

  console.log('\nInstalling external skills via skills.sh…')
  for (const repo of names) {
    const sel = repos[repo]
    const skill = sel === '*' || (Array.isArray(sel) && sel.includes('*')) ? '*' : sel.join(',')
    console.log(`  → ${repo} (${skill === '*' ? 'all' : skill})`)

    try {
      execFileSync('npx', ['--yes', 'skills', 'add', repo, '--global', '--skill', skill, '--agent', 'claude-code', '-y'], {
        stdio: 'inherit',
      })
    } catch {
      console.error(`  ! failed to install ${repo} — run it by hand: npx skills add ${repo}`)
    }
  }
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

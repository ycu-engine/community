import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import MarkdownIt from 'markdown-it'
import MarkdownItContainer from 'markdown-it-container'
import { compileStringAsync } from 'sass'
import { chromium } from 'playwright-core'
import termMarkdown from '../term.md'
import style from './style/term.scss'

const notoSerifJpFont = import.meta.resolve(
  '@fontsource/noto-serif-jp/index.css'
)

const md = new MarkdownIt({
  html: true,
})

const dateOption: Parameters<typeof MarkdownItContainer>['2'] = {
  validate: function (params) {
    return !!params.trim().match(/^date$/)
  },

  render: function (tokens, idx) {
    const m = tokens[idx]?.info.trim().match(/^date$/)
    if (m) {
      const jstString = new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
        era: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date())
      return `<p>制定 ${jstString}</p>`
    }
    return ''
  },
}

md.use(MarkdownItContainer, 'right').use(
  MarkdownItContainer,
  'date',
  dateOption
)

const termHTML = md.render(termMarkdown)

const scss = (await compileStringAsync(style)).css

const html = `
<body>
  <link rel="stylesheet" href="${notoSerifJpFont}">
  <style>${scss}</style>
  ${termHTML}
</body>
`

await writeFile('./term.html', html)

// file:///Users/yuta/work/github.com/ycu-engine/community/term.pdf
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(`file://${resolve(import.meta.dirname, '../term.html')}`, {
  waitUntil: 'networkidle',
})
await page.pdf({
  path: './term.pdf',
  margin: { top: 80, left: 60, bottom: 80, right: 60 },
})
await page.close()
await browser.close()

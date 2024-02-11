import { writeFileSync } from 'fs'
import MarkdownIt from 'markdown-it'
import MarkdownItContainer from 'markdown-it-container'
import { compileStringAsync } from 'sass'
import { chromium } from 'playwright-core'
import termMarkdown from '../term.md'
import notoSerifJpFont from '@fontsource/noto-serif-jp/index.css'
import style from './style/term.scss'

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
  <style>${notoSerifJpFont}</style>
  <style>${scss}</style>
  ${termHTML}
</body>
`

writeFileSync('./term.html', html)

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setContent(html)
await page.pdf({
  path: './term.pdf',
  margin: { top: 80, left: 60, bottom: 80, right: 60 },
})
await page.close()
await browser.close()

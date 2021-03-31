import { readFileSync, writeFileSync } from 'fs'
import pdf from 'html-pdf'
import MarkdownIt from 'markdown-it'
import MarkdownItContainer from 'markdown-it-container'
import { join, resolve } from 'path'
import { renderSync } from 'sass'

const md = new MarkdownIt({
  html: true,
})

const dateOption: Parameters<typeof MarkdownItContainer>['2'] = {
  validate: function (params) {
    return !!params.trim().match(/^date$/)
  },

  render: function (tokens, idx) {
    const m = tokens[idx].info.trim().match(/^date$/)
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

const content = readFileSync('./term.md').toString()
const res = md.render(content)

const scss = renderSync({
  file: join(__dirname, 'style', 'term.scss'),
}).css.toString()

const font = `
@font-face {
    font-family: 'Noto Serif JP';
    src: ${[
      'ExtraLight',
      'Light',
      'Medium',
      'Regular',
      'SemiBold',
      'Bold',
      'Black',
    ]
      .map(
        (weight) =>
          `url(file://${resolve(
            join(
              __dirname,
              'style',
              'Noto_Serif_JP',
              `NotoSerifJP-${weight}.otf`
            )
          )}) format('opentype')`
      )
      .join(',\n')};
  }
`

const html = `<body>
<style>${font}</style>
<style>${scss}</style>
${res}
</body>`

writeFileSync('./term.html', html)

pdf.create(html).toFile('./term.pdf')

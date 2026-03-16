// ** React Import
import { Children } from 'react'

// ** Next Import
import Document, { Html, Head, Main, NextScript } from 'next/document'

// ** Emotion Imports
import createEmotionServer from '@emotion/server/create-instance'

// ** Utils Imports
import { createEmotionCache } from 'src/@core/utils/create-emotion-cache'

class CustomDocument extends Document {
  render() {
    return (
      <Html lang='en'>
        <Head>
          {/* Aman dari error mark unknown (Next.js performance.measure saat redirect/login: "beforeRender" belum di-set) */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
(function() {
  if (typeof performance === 'undefined' || !performance.measure) return;
  var orig = performance.measure.bind(performance);
  performance.measure = function(name, startMark, endMark) {
    try {
      return orig(name, startMark, endMark);
    } catch (e) {
      var msg = (e && e.message) || '';
      if (e.name === 'SyntaxError' && (msg.indexOf('does not exist') !== -1 || msg.indexOf('is unknown') !== -1)) return;
      throw e;
    }
  };
})();
              `.trim()
            }}
          />
          {/* Font Public Sans di-load offline via @fontsource-variable/public-sans di _app.js */}
          <link rel='apple-touch-icon' sizes='180x180' href='/images/apple-touch-icon.png' />
          <link rel='icon' type='image/svg+xml' href='/images/favicon.svg' />
          <link rel='shortcut icon' href='/images/favicon.svg' />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
CustomDocument.getInitialProps = async ctx => {
  const originalRenderPage = ctx.renderPage
  const cache = createEmotionCache()
  const { extractCriticalToChunks } = createEmotionServer(cache)
  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: App => props =>
        (
          <App
            {...props} // @ts-ignore
            emotionCache={cache}
          />
        )
    })
  const initialProps = await Document.getInitialProps(ctx)
  const emotionStyles = extractCriticalToChunks(initialProps.html)

  const emotionStyleTags = emotionStyles.styles.map(style => {
    return (
      <style
        key={style.key}
        dangerouslySetInnerHTML={{ __html: style.css }}
        data-emotion={`${style.key} ${style.ids.join(' ')}`}
      />
    )
  })

  return {
    ...initialProps,
    styles: [...Children.toArray(initialProps.styles), ...emotionStyleTags]
  }
}

export default CustomDocument

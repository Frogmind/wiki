require('../core/worker')

const _ = require('lodash')
const cheerio = require('cheerio')

/* global WIKI */

WIKI.models = require('../core/db').init()

module.exports = async (job) => {
  WIKI.logger.info(`Rendering page ${job.data.page.path}...`)

  try {
    let output = job.data.page.content
    for (let core of job.data.pipeline) {
      const renderer = require(`../modules/rendering/${_.kebabCase(core.key)}/renderer.js`)
      output = await renderer.render.call({
        config: core.config,
        children: core.children,
        page: job.data.page,
        input: output
      })
    }

    // Parse TOC
    const $ = cheerio.load(output)
    let isStrict = $('h1').length > 0 // <- Allows for documents using H2 as top level
    let toc = { root: [] }

    $('h1,h2,h3,h4,h5,h6').each((idx, el) => {
      const depth = _.toSafeInteger(el.name.substring(1)) - (isStrict ? 1 : 2)
      const leafPath = _.reduce(_.times(depth), (curPath, curIdx) => {
        if (_.has(toc, curPath)) {
          const lastLeafIdx = _.get(toc, curPath).length - 1
          curPath = `${curPath}[${lastLeafIdx}].children`
        }
        return curPath
      }, 'root')

      const leafSlug = $('.toc-anchor', el).first().attr('href')
      $('.toc-anchor', el).remove()
      _.get(toc, leafPath).push({
        title: _.trim($(el).text()),
        anchor: leafSlug,
        children: []
      })
    })

    // Save to DB
    await WIKI.models.pages.query()
      .patch({
        render: output,
        toc: JSON.stringify(toc.root)
      })
      .where('id', job.data.page.id)

    // Save to cache
    await WIKI.models.pages.savePageToCache({
      ...job.data.page,
      render: output,
      toc: JSON.stringify(toc.root)
    })

    WIKI.logger.info(`Rendering page ${job.data.page.path}: [ COMPLETED ]`)
  } catch (err) {
    WIKI.logger.error(`Rendering page ${job.data.page.path}: [ FAILED ]`)
    WIKI.logger.error(err.message)
  }
}

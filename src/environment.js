/**
 * Provides constants on initialization for managing the environment
 *
 * @module /environment
 */
const os = require("os")
/**
 * Maximum concurrency allowed for Puppeteer Cluster
 * Defaults to the number of available CPUs through os.cpus()
 * When the number of cpus is not available, defaults to 1
 *
 * @static
 * @constant
 * @type {number}
 * */
const concurrency = parseInt(
    process.env.CONCURRENCY || os.cpus().length || 1,
    10,
)
/**
 * Maximum number of retries per cluster task
 * Defaults to 3
 *
 * @static
 * @constant
 * @type {number}
 */
const retries = parseInt(process.env.RETRIES || 3, 10)

const defaultMeta = {
    service: "scraper",
    host: os.hostname(),
    arch: os.arch(),
    cpus: os.cpus().length,
    platform: os.platform(),
    totalmem: parseInt(os.totalmem() / 1000.0 ** 2) + "MB",
    category: "no-category",
}

module.exports = {
    concurrency,
    defaultMeta,
    retries,

}
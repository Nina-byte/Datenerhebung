/**
 * Provides utility methods to interact
 * and manage the puppeteer cluster
 *
 * @module /cluster
 */

//source: https://github.com/Emethium/aliexpress-parallel-crawler/blob/master/src/util/cluster.js
const { Cluster } = require("puppeteer-cluster")
const puppeteerExtra = require("puppeteer-extra")
const pluginStealth = require("puppeteer-extra-plugin-stealth")
const fs = require('fs').promises;
const os = require('os');
const path = require('path');

const env = require("./environment")
const logger = require("./logger")
/**
 *
 * @param {Cluster} cluster
 */
function extractClusterMetadata(cluster) {
    if (!cluster) return {}

    const { errorCount, isClosed, startTime, workersAvail, workersBusy } = cluster

    return {
        errorCount,
        isClosed,
        startTime,
        uptime: Date.now() - startTime,
        workersBusy: workersBusy.length,
        workersAvail: workersAvail.length,
    }
}

/**
 * Initializes a puppeteer cluster
 *
 * @returns {Cluster} The initialized cluster
 */
async function initializeCluster() {
    var tempDir = null;
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'browser-cache-disk-'), (err, folder) => {
        if (err) throw err;
        logger.debug(`Created temp folder: ${folder}`);
        tempDir = folder;
        // Prints: /tmp/foo-itXde2
    });
    logger.debug(tempDir)

    const args = [
        // Required for Docker version of Puppeteer
        "--no-sandbox",
        "--disable-setuid-sandbox",
        // Disable GPU
        "--disable-gpu",
        // This will write shared memory files into /tmp instead of /dev/shm,
        // because Docker’s default for /dev/shm is 64MB
        "--disable-dev-shm-usage",
        // Setting the same cache dir to (try to, at least) benefit caching for the entire cluster
        `--disk-cache-dir=${tempDir}`,
        '-wait-for-browser'

    ]

    puppeteerExtra.use(pluginStealth())

    const osPlatform = os.platform(); // possible values are: 'darwin', 'freebsd', 'linux', 'sunos' or 'win32'
    logger.info('Scraper running on platform: ', osPlatform);
    let executablePath;
    if (/^win/i.test(osPlatform)) {
        executablePath = "./node_modules/puppeteer/.local-chromium/win64-818858/chrome-win/chrome.exe";
        //make dire Default in tempdir
        fs.mkdir(path.join(tempDir, 'Default'), { recursive: true }, (err) => {
            if (err) throw err;
            logger.debug(`Created temp folder: ${path.join(tempDir, 'Default')}`);
        });
    } else if (/^linux/i.test(osPlatform)) {
        //get environment variable PUPPETEER_EXECUTABLE_PATH
        if (process.env.PUPPETEER_EXECUTABLE_PATH !== null) {
            executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        } else {
            executablePath = '/usr/bin/google-chrome';
        }
    }

    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_BROWSER,
        maxConcurrency: env.concurrency,
        puppeteer: puppeteerExtra,
        retryLimit: env.retries,
        timeout: 480000,
        workerCreationDelay: 1500,
        sameDomainDelay: 100,
        puppeteerOptions: {
            executablePath: executablePath,
            ignoreDefaultArgs: ["--enable-automation"],
            ignoreHTTPSErrors: true,
            defaultViewport: {
                width: 1024,
                height: 768,
            },
            args,
            userDataDir: tempDir,
            timeout: 0,
            // headless: false,
        },
        userDataDir: tempDir,
        retryDelay: 3000,
        monitor: true,
    })

    logger.warn(`Cluster started with ${env.concurrency} nodes!`, {
        category: "cluster",
        concurrency: env.concurrency,
        retries: env.retries,
    })

    return cluster
}

// Exports
module.exports = {
    extractClusterMetadata,
    initializeCluster,
}
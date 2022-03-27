const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
const AWS = require('aws-sdk');
const {
    extractClusterMetadata,
    initializeCluster,
} = require("./cluster")
const logger = require('./logger');




AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});
var rdsdataservice = new AWS.RDSDataService();


var cluster = null;
var browser = null;
async function loadCategoriesTable() {
    await initCluster();
    await queueBaseCategories();
    logger.info("queueBaseCategories exit")
    await insertChildren();
    await cluster.idle();
    await cluster.close();
    return;
}


async function readBaseCategories() {

    let baseCategories = [];
    //load csv file
    let csvFile = await fs.readFile('./data/base_categories.csv', 'utf8');
    let csvLines = csvFile.split('\n');
    for (let i = 0; i < csvLines.length; i++) {
        let line = csvLines[i];
        let lineSplit = line.split(';');
        if (lineSplit.length == 3) {
            baseCategories.push({
                id: lineSplit[0],
                categoryUrlPart: lineSplit[1],
                level: lineSplit[2]
            });

        }
        logger.info(`Loaded base category ${lineSplit[0]}`);
    }
    return baseCategories;
}
const parseDataServiceResponse = res => {
    let columns = res.columnMetadata.map(c => c.name);
    let data = res.records.map(r => {
        let obj = {};
        r.map((v, i) => {
            obj[columns[i]] = Object.values(v)[0]
        });
        return obj
    })
    return data
}


async function queueBaseCategories() {
    let baseCategories = await readBaseCategories();

    for (let i = 0; i < baseCategories.length; i++) {
        let baseCategory = baseCategories[i];
        cluster.queue({ categoryid: baseCategory.id, categoryUrlPart: baseCategory.categoryUrlPart, level: baseCategory.level });
        //logger log baseCatergory
        logger.debug(`Queued base category ${baseCategory.id}, ${baseCategory.categoryUrlPart}, ${baseCategory.level}`);

    }
    await cluster.idle();
    logger.info("queueBaseCategories complete");

}

async function insertChildren() {
    //loop trough all category rows for each level
    logger.info("insertChildren start");
    level = 1;
    do {

        var sql = `SELECT * FROM category WHERE level = :level AND has_children = true`;
        await rdsdataservice.executeStatement({
            database: process.env.RDS_DATABASE, resourceArn: process.env.RDS_ARN
            , secretArn: process.env.RDS_SECRET_ARN
            , sql, continueAfterTimeout: true, includeResultMetadata: true, parameters: [
                {
                    name: 'level', value: { longValue: level }
                }

            ]
        }).promise().then(async (data) => {
            parseDataServiceResponse(data).forEach(async (category) => {
                let categoryid = category.id;
                let level = category.level;

                logger.info(`insertChildren level ${level} category ${categoryid}`);

                let categoryurl = category.url;
                cluster.queue({ categoryid: categoryid, categoryurl: categoryurl, level: level });
            });

            level++;
        }).catch(async (err) => {
            logger.error(err);
        });
        await cluster.idle();

    } while
        (level <= 4);
    logger.info("insertChildren complete");
    return;
}








async function initCluster() {
    cluster = await initializeCluster();
    cluster.on('taskerror', (err, data) => {
        logger.error(`Error crawling ${data}: ${err.message}`);
    })
    cluster.on('taskcomplete', (data) => {
        logger.info(`Crawling ${data} completed`);
    })
    cluster.on('taskfailed', (err, data) => {
        logger.error(`Error crawling ${data}: ${err.message}`);
    })
    cluster.on('taskprogress', (data) => {
        logger.info(`Crawling ${data}`);
    })
    cluster.on('taskstart', (data) => {
        logger.info(`Crawling ${data} started`);
    })
    cluster.on('taskstop', (data) => {
        logger.info(`Crawling ${data} stopped`);
    })
    logger.info(`Cluster initialized`);


    await initTask();
    logger.info(`Task initialized`);
}


async function initTask() {
    await cluster.task(async ({ page, data }) => {
        const { categoryid, categoryurl, categoryUrlPart, level } = data
        logger.debug(`Crawling ${categoryid}, ${categoryurl}, ${categoryUrlPart}, ${level}`);
        var url;
        if (categoryurl == null || categoryurl == "") {
            url = `https://www.aliexpress.com/category/${categoryid}${categoryUrlPart}`
            logger.debug(categoryurl);
        }
        else {
            url = "https://" + categoryurl;
        }
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        const aliExpressData = await page.evaluate(() => runParams);


        if (aliExpressData.resultType != 'normal_result') {
            logger.warn(`Invalid category ${categoryid}`);
            return;
        }


        //insert into db category
        if (!(aliExpressData.refineCategory?.length > 0)) {
            logger.info(`No refine category found for ${categoryid}`);
            return;
        }

        let sql = `INSERT INTO category (id, name, url, has_children, level) VALUES (:id, :name, :url, :has_children, :level) 
              ON CONFLICT (id) DO UPDATE SET name = excluded.name,
        url = excluded.url, has_children = excluded.has_children, level = excluded.level`;
        let params = {
            resourceArn: process.env.RDS_ARN
            , secretArn: process.env.RDS_SECRET_ARN
            , database: process.env.RDS_DATABASE, sql, continueAfterTimeout: true, includeResultMetadata: false
            , parameters: [
                {
                    name: 'id', value: { longValue: categoryid }
                },
                {
                    name: 'name', value: { stringValue: aliExpressData.refineCategory[0].categoryEnName }
                },
                {
                    name: 'url', value: { stringValue: aliExpressData.refineCategory[0].categoryUrl.substring(2) }
                },
                {
                    name: 'has_children', value: { booleanValue: aliExpressData.refineCategory[0].childCategories?.length > 0 }
                },
                {
                    name: 'level', value: { longValue: Number.parseInt(level) }
                }

            ]

        };
        await rdsdataservice.executeStatement(params).promise().then(async (data) => {
            logger.debug(`Inserted category ${categoryid}`);
        }).catch(async (err) => {
            logger.error(err);
        });


        //insert row in category foreach aliExpressData.refineCategory[0].childCategories
        if (aliExpressData.refineCategory[0].childCategories?.length > 0) {
            aliExpressData.refineCategory[0].childCategories.forEach((childcategory) => {
                var params = {
                    resourceArn: process.env.RDS_ARN,
                    database: process.env.RDS_DATABASE,
                    secretArn: process.env.RDS_SECRET_ARN,
                    sql: `INSERT INTO category (id, name, url, has_children, level, parent_id) VALUES (:id, :name, :url, :has_children, :level, :parent_id) ON CONFLICT (id) DO UPDATE SET name = excluded.name,
                    url = excluded.url, has_children = excluded.has_children, level = excluded.level, parent_id = excluded.parent_id`,
                    continueAfterTimeout: true,
                    includeResultMetadata: false,
                    parameters: [
                        {
                            name: 'id', value: { longValue: childcategory.categoryId }
                        },
                        {
                            name: 'name', value: { stringValue: childcategory.categoryEnName }
                        },
                        {
                            name: 'url', value: { stringValue: childcategory.categoryUrl.substring(2) }
                        },
                        {
                            name: 'has_children', value: { booleanValue: !(childcategory.leafCategory) }
                        },
                        {
                            name: 'level', value: { longValue: Number.parseInt(level) + 1 }
                        },
                        {
                            name: 'parent_id', value: { longValue: categoryid }
                        }
                    ]
                };
                rdsdataservice.executeStatement(params).promise().then(async (data) => {
                    logger.debug(`Inserted child category ${childcategory.categoryId}`);
                }).catch(async (err) => {
                    logger.error(err);
                });
            });
        }




        logger.debug(`Crawling ${categoryid} completed`);
    });

}


module.exports = { loadCategoriesTable };
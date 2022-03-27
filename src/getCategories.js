const {
    extractClusterMetadata,
    initializeCluster,
} = require("./cluster")
const logger = require('./logger');

const AWS = require('aws-sdk');
process.setMaxListeners(Infinity);

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

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'eu-central-1'
});
var rdsdataservice = new AWS.RDSDataService();

var cluster = null;

async function getProductsOfAllCategorys() {
    // exceute the pragma integrity_check;

    await initCluster();
    await initTask();
    await queueAllproducts();
    await cluster.idle();
    await cluster.close();
    return;
}





async function queueAllproducts() {
    let sql = `SELECT c.id, c.url, COALESCE(SUM(pc.categoryid),0) as fetchCount FROM category c LEFT JOIN productCategory pc ON c.id =pc.categoryid GROUP BY c.id,c.url,c.level  ORDER BY fetchCount asc, c.level`;
    let params = {
        database: process.env.RDS_DATABASE, resourceArn: process.env.RDS_ARN
        , secretArn: process.env.RDS_SECRET_ARN,
        sql: sql,
        includeResultMetadata: true
    };


    await rdsdataservice.executeStatement(params).promise().then(function (data) {
        parseDataServiceResponse(data).forEach(async (category) => {
            let categoryid = category.id;
            let url = category.url;
            cluster.queue({ categoryid: categoryid, url: url });
        });
    }).catch(function (err) {
        logger.error(err, err.stack);
    });
    await cluster.idle();
    return;
}


async function initTask() {
    await cluster.task(async ({ page, data }) => {
        let { categoryid, url } = data


        await page.goto("https://" + url, { waitUntil: 'domcontentloaded', timeout: 0 });
        var urlURL = new URL(await page.url());


        var i = 1;

        urlURL.searchParams.append('page', i);
        logger.info(urlURL.toString());
        let totalrank = 1;
        let aliExpressData = await page.evaluate(() => runParams);


        while (aliExpressData.resultType != 'zero_result') {

            if (aliExpressData.resultType != 'normal_result') {
                logger.warn(`${aliExpressData.resultType}`);
            }


            let pagerank = 1;
            aliExpressData.mods.itemList.content.forEach(async (product) => {
                //query if product is already in the database

                let sql = `INSERT INTO product (id, name) VALUES (:id, :name )  
                ON CONFLICT (id) DO UPDATE SET name = excluded.name`;

                let params = {
                    resourceArn: process.env.RDS_ARN
                    , secretArn: process.env.RDS_SECRET_ARN
                    , database: process.env.RDS_DATABASE, sql, continueAfterTimeout: true, includeResultMetadata: false
                    , parameters: [
                        {
                            name: 'id', value: { longValue: product.productId }
                        },
                        {
                            name: 'name', value: { stringValue: product.title.displayTitle }
                        }
                    ]

                };
                await rdsdataservice.executeStatement(params).promise().then(async (data) => {
                    logger.debug(`Inserted product ${product.productId}`);
                }).catch(async (err) => {
                    logger.error(err + " " + sql);
                });
                if (product?.store?.storeId) {
                    sql = `INSERT INTO store (id, name, url, aliMemberId) VALUES (:id, :name, :url, :aliMemberId) ON CONFLICT (id) DO UPDATE SET name = excluded.name, url = excluded.url, aliMemberId = excluded.aliMemberId`;
                    params = {
                        resourceArn: process.env.RDS_ARN
                        , secretArn: process.env.RDS_SECRET_ARN
                        , database: process.env.RDS_DATABASE, sql, continueAfterTimeout: true, includeResultMetadata: false
                        , parameters: [
                            {
                                name: 'id', value: { longValue: product.store.storeId }
                            },
                            {
                                name: 'name', value: { stringValue: product.store.storeName }
                            },
                            {
                                name: 'url', value: { stringValue: product.store.storeUrl }
                            },
                            {
                                name: 'aliMemberId', value: { longValue: product.store.aliMemberId }
                            }
                        ]
                    };



                    await rdsdataservice.executeStatement(params).promise().then(async (data) => {
                        logger.debug(`Inserted store ${product?.store?.storeId}`);
                    }).catch(async (err) => {
                        logger.error(err + " " + sql);
                    });
                }

                sql = `INSERT INTO image (url, imgWidth, imgHeight, imgType) VALUES (:url, :imgWidth, :imgHeight, :imgType) ON CONFLICT (url) DO UPDATE SET imgWidth = excluded.imgWidth, imgHeight = excluded.imgHeight, imgType = excluded.imgType`;
                params = {
                    resourceArn: process.env.RDS_ARN
                    , secretArn: process.env.RDS_SECRET_ARN
                    , database: process.env.RDS_DATABASE, sql, continueAfterTimeout: true, includeResultMetadata: false
                    , parameters: [
                        {
                            name: 'url', value: { stringValue: product.image.imgUrl }
                        },
                        {
                            name: 'imgWidth', value: { longValue: product.image.imgWidth }
                        },
                        {
                            name: 'imgHeight', value: { longValue: product.image.imgHeight }
                        },
                        {
                            name: 'imgType', value: { stringValue: product.image.imgType }
                        }
                    ]
                };
                await rdsdataservice.executeStatement(params).promise().then(async (data) => {
                    logger.debug(`Inserted image ${product.image.imgUrl}`);
                }).catch(async (err) => {
                    logger.error(err + " " + sql);
                });

                //check if product.video exists
                if (product.video) {
                    sql = `INSERT INTO video (id, url, duration, ratio) VALUES (:id, :url, :duration, :ratio) ON CONFLICT (id) DO UPDATE SET url = excluded.url, duration = excluded.duration, ratio = excluded.ratio`;
                    params = {
                        resourceArn: process.env.RDS_ARN
                        , secretArn: process.env.RDS_SECRET_ARN
                        , database: process.env.RDS_DATABASE, sql, continueAfterTimeout: true, includeResultMetadata: false
                        , parameters: [
                            {
                                name: 'id', value: { longValue: product.video.videoId }
                            },
                            {
                                name: 'url', value: { stringValue: product.video.videoUrl }
                            },
                            {
                                name: 'duration', value: { longValue: product.video.videoDuration }
                            },
                            {
                                name: 'ratio', value: { stringValue: product.video.videoRatio }
                            }
                        ]
                    };
                    await rdsdataservice.executeStatement(params).promise().then(async (data) => {
                        logger.debug(`Inserted video ${product.video.videoId}`);
                    }).catch(async (err) => {
                        logger.error(err + " " + sql);
                    });
                }
                //Create unique index productCategory_productid_categoryid_page_pagerank_index on productCategory(productid,categoryid,page,pagerank);
                sql = `INSERT INTO productCategory (productid, categoryid, page, pagerank, totalrank, currency, productUrl, pageUrl, salePrice, previewImageUrl, saleMode, storeid, originalPrice, starRating, singlePieceSaleSingularUnit, pieceSaleComplexUnit, packagingSaleUnit, leastPackagingNum, videoid, lunchtime, postCategoryid, soldAmount)
                VALUES (:productid, :categoryid, :page, :pagerank, :totalrank, :currency, :productUrl, :pageUrl, :salePrice, :previewImageUrl, :saleMode, :storeid, :originalPrice, :starRating, :singlePieceSaleSingularUnit, :pieceSaleComplexUnit, :packagingSaleUnit, :leastPackagingNum, :videoid, :lunchtime, :postCategoryid, :soldAmount) 
                RETURNING id`;
                var buildparams = [
                    {
                        name: 'productid', value: { longValue: product.productId }
                    },
                    {
                        name: 'categoryid', value: { longValue: categoryid }
                    },
                    {
                        name: 'page', value: { longValue: i }
                    },
                    {
                        name: 'pagerank', value: { longValue: pagerank }
                    },
                    {
                        name: 'totalrank', value: { longValue: totalrank }
                    },
                    {
                        name: 'currency', value: { stringValue: product.prices.salePrice?.currencyCode }
                    },
                    {
                        name: 'productUrl', value: { stringValue: product.productDetailUrl }
                    },
                    {
                        name: 'pageUrl', value: { stringValue: urlURL.toString() }
                    },
                    {
                        name: 'salePrice', value: { doubleValue: product.prices.salePrice?.minPrice }
                    },

                    {
                        name: 'previewImageUrl', value: { stringValue: product.image.imgUrl }
                    },
                    {
                        name: 'saleMode', value: { stringValue: product.saleMode.saleMode }
                    },

                ]
                if (product?.store?.storeId) {
                    buildparams.push({
                        name: 'storeid', value: { longValue: product?.store?.storeId }
                    });
                }
                else {
                    buildparams.push({
                        name: 'storeid', value: { 'isNull': true }
                    });
                }
                if (product.prices.originalPrice?.minPrice) {
                    buildparams.push({
                        name: 'originalPrice', value: { doubleValue: product.prices.originalPrice?.minPrice }
                    });
                } else {
                    buildparams.push({
                        name: 'originalPrice', value: { 'isNull': true }
                    });
                }
                if (product.evaluation?.starRating) {
                    buildparams.push({
                        name: 'starRating', value: { doubleValue: product.evaluation.starRating }
                    });
                } else {
                    buildparams.push({
                        name: 'starRating', value: { 'isNull': true }
                    });
                }
                if (product.saleMode?.singlePieceSaleSingularUnit) {
                    buildparams.push({
                        name: 'singlePieceSaleSingularUnit', value: { stringValue: product.saleMode.singlePieceSaleSingularUnit }
                    });
                } else {
                    buildparams.push({
                        name: 'singlePieceSaleSingularUnit', value: { 'isNull': true }
                    });
                }
                if (product.saleMode?.pieceSaleComplexUnit) {
                    buildparams.push({
                        name: 'pieceSaleComplexUnit', value: { stringValue: product.saleMode.pieceSaleComplexUnit }
                    });
                } else {
                    buildparams.push({
                        name: 'pieceSaleComplexUnit', value: { 'isNull': true }
                    });
                }
                if (product.saleMode?.packagingSaleUnit) {
                    buildparams.push({
                        name: 'packagingSaleUnit', value: { stringValue: product.saleMode.packagingSaleUnit }
                    });
                } else {
                    buildparams.push({
                        name: 'packagingSaleUnit', value: { 'isNull': true }
                    });
                }
                if (product.saleMode?.leastPackagingNum) {
                    buildparams.push({
                        name: 'leastPackagingNum', value: { longValue: product.saleMode.leastPackagingNum }
                    });
                } else {
                    buildparams.push({
                        name: 'leastPackagingNum', value: { 'isNull': true }
                    });
                }
                if (product.video) {
                    buildparams.push({
                        name: 'videoid', value: { longValue: product.video.videoId }
                    });
                } else {
                    buildparams.push({
                        name: 'videoid', value: { 'isNull': true }
                    });
                }

                if (product.lunchTime) {
                    buildparams.push({
                        name: 'lunchtime', typeHint: "TIMESTAMP", value: { stringValue: product.lunchTime }
                    });
                } else {
                    buildparams.push({
                        name: 'lunchtime', value: { 'isNull': true }
                    });
                }
                if (product.trace?.exposure?.postCategoryId) {
                    buildparams.push({
                        name: 'postCategoryid', value: { longValue: Number.parseInt(product.trace.exposure.postCategoryId) }
                    });
                } else {
                    buildparams.push({
                        name: 'postCategoryid', value: { 'isNull': true }
                    });
                }
                if (product.trade?.tradeDesc) {
                    buildparams.push({
                        name: 'soldAmount', value: { longValue: product.trade.tradeDesc.split(" ")[0] }
                    });
                } else {
                    buildparams.push({
                        name: 'soldAmount', value: { 'isNull': true }
                    });
                }

                params = {
                    resourceArn: process.env.RDS_ARN
                    , secretArn: process.env.RDS_SECRET_ARN
                    , database: process.env.RDS_DATABASE, sql, continueAfterTimeout: true, includeResultMetadata: true
                    , parameters: buildparams

                };


                await rdsdataservice.executeStatement(params).promise().then(function (data) {
                    parseDataServiceResponse(data).forEach(async (productCategory) => {
                        logger.debug(`Inserted productCategory ${productCategory.id}`);
                        var productCategoryId = productCategory.id;

                        if (product.sellingPoints) {
                            for (var j = 0; j < product.sellingPoints.length; j++) {
                                var sellingPoint = product.sellingPoints[j];

                                sql = `INSERT INTO sellingPoint (id,  displayTagType, tagStyle, tagText, tagImgWidth, tagImgHeight,tagImgUrl) VALUES (:id, :displayTagType, :tagStyle, :tagText, :tagImgWidth, :tagImgHeight, :tagImgUrl) ON CONFLICT (id) DO UPDATE SET displayTagType = excluded.displayTagType, tagStyle = excluded.tagStyle, tagText = excluded.tagText, tagImgWidth = excluded.tagImgWidth, tagImgHeight = excluded.tagImgHeight, tagImgUrl = excluded.tagImgUrl`;
                                buildparams = [
                                    {
                                        name: 'id', value: { longValue: sellingPoint.sellingPointTagId }
                                    },
                                    {
                                        name: 'displayTagType', value: { stringValue: sellingPoint.tagContent.displayTagType }
                                    }
                                ];
                                if (sellingPoint.tagContent.tagStyle) {
                                    buildparams.push({
                                        name: 'tagStyle', typeHint: "JSON", value: { stringValue: JSON.stringify(sellingPoint.tagContent.tagStyle) }
                                    });
                                }
                                else {
                                    buildparams.push({
                                        name: 'tagStyle', value: { 'isNull': true }
                                    });
                                }
                                if (sellingPoint.tagContent.tagText) {
                                    buildparams.push({
                                        name: 'tagText', value: { stringValue: sellingPoint.tagContent.tagText }
                                    }
                                    );
                                }
                                else {
                                    buildparams.push({
                                        name: 'tagText', value: { 'isNull': true }
                                    });
                                }
                                if (sellingPoint.tagContent.tagImgWidth) {
                                    buildparams.push({
                                        name: 'tagImgWidth', value: { longValue: sellingPoint.tagContent.tagImgWidth }
                                    });
                                }
                                else {
                                    buildparams.push({
                                        name: 'tagImgWidth', value: { 'isNull': true }
                                    });
                                }
                                if (sellingPoint.tagContent.tagImgHeight) {
                                    buildparams.push({
                                        name: 'tagImgHeight', value: { longValue: sellingPoint.tagContent.tagImgHeight }
                                    });
                                }
                                else {
                                    buildparams.push({
                                        name: 'tagImgHeight', value: { 'isNull': true }
                                    });
                                }
                                if (sellingPoint.tagContent.tagImgUrl) {
                                    buildparams.push({
                                        name: 'tagImgUrl', value: { stringValue: sellingPoint.tagContent.tagImgUrl }
                                    });
                                }
                                else {
                                    buildparams.push({
                                        name: 'tagImgUrl', value: { 'isNull': true }
                                    });
                                }


                                params = {
                                    resourceArn: process.env.RDS_ARN
                                    , secretArn: process.env.RDS_SECRET_ARN
                                    , database: process.env.RDS_DATABASE, sql, continueAfterTimeout: true, includeResultMetadata: false
                                    , parameters: buildparams
                                };

                                await rdsdataservice.executeStatement(params).promise().then(async (data) => {
                                    logger.debug(`Inserted selling points ${sellingPoint.sellingPointTagId}`);
                                }).catch(async (err) => {
                                    logger.error(err + " " + sql);
                                });
                                sql = `INSERT INTO productCategorySellingPoints (productCategoryId, sellingPointId, position, group_no) VALUES (:productCategoryId, :sellingPointId, :position, :group_no) ON CONFLICT (productCategoryId, sellingPointId, position, group_no) DO NOTHING`;
                                buildparams = [
                                    {
                                        name: 'productCategoryId', value: { longValue: productCategoryId }
                                    },
                                    {
                                        name: 'sellingPointId', value: { longValue: sellingPoint.sellingPointTagId }

                                    },
                                    {
                                        name: 'position', value: { longValue: sellingPoint.position }
                                    },
                                    {
                                        name: 'group_no', value: { longValue: sellingPoint.group }
                                    }
                                ];
                                params = {
                                    resourceArn: process.env.RDS_ARN
                                    , secretArn: process.env.RDS_SECRET_ARN
                                    , database: process.env.RDS_DATABASE, sql, continueAfterTimeout: true, includeResultMetadata: false
                                    , parameters: buildparams
                                };
                                rdsdataservice.executeStatement(params).promise().then(async (data) => {
                                    logger.debug(`Inserted selling productCategorySellingPoints ${sellingPoint.sellingPointTagId} - ${productCategoryId}`);
                                }
                                ).catch(async (err) => {
                                    logger.error(err + " " + sql);
                                }
                                );



                            }
                        }

                    });
                }).catch(async (err) => {
                    logger.error(err + " " + sql);
                });



                pagerank++;
                totalrank++;
            });
            i++;
            urlURL.searchParams.set('page', i);
            await page.goto(urlURL, { waitUntil: 'domcontentloaded' });
            aliExpressData = await page.evaluate(() => runParams);
        }




    });
}

async function initCluster() {
    cluster = await initializeCluster();
    cluster.on('taskerror', (err, data) => {
        logger.error(`Error crawling ${data}: ${err.message} `);
    })



    await initTask();
    logger.info(`Task initialized`);
}

module.exports = { getProductsOfAllCategorys };
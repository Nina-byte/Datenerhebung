const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
require('dotenv').config()
const logger = require('./logger');
const AWS = require('aws-sdk');
process.setMaxListeners(Infinity);
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.region
});
var rdsdataservice = new AWS.RDSDataService();

const {
    extractClusterMetadata,
    initializeCluster,
} = require("./cluster")


var cluster = null;

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



//execute getProductDetails for result of loadAllJsonFiles
async function getAllProductDetails() {

    cluster = await initializeCluster();
    cluster.on('taskerror', (err, data) => {
        logger.error(`Error crawling ${data}: ${err.message}`);
    });
    await AliexpressProductScraper(10000);

    var count = 0;
    do {
        let sql = `SELECT p.id FROM product p LEFT JOIN productDetails pd ON p.id=pd.productid WHERE pd.id is null ORDER BY RANDOM() LIMIT 5000`;
        logger.debug(process.env.RDS_ARN)
        let params = {
            resourceArn: process.env.RDS_ARN,
            secretArn: process.env.RDS_SECRET_ARN,
            database: process.env.RDS_DATABASE,
            sql: sql,
            includeResultMetadata: true,
        };
        await rdsdataservice.executeStatement(params).promise().then(function (data) {
            parseDataServiceResponse(data).forEach(async (product) => {
                let productId = product.id;
                logger.debug(productId);
                cluster.queue({ productId: productId });
            });
        }).catch(function (err) {
            logger.error(err, err.stack);
        });


        sql = `SELECT COUNT(p.id) as remCount FROM product p LEFT JOIN productDetails pd ON p.id=pd.productid WHERE pd.id is null`;
        params = {
            resourceArn: process.env.RDS_ARN,
            secretArn: process.env.RDS_SECRET_ARN,
            database: process.env.RDS_DATABASE,
            sql: sql,
            includeResultMetadata: true
        };

        await rdsdataservice.executeStatement(params).promise().then(function (data) {
            parseDataServiceResponse(data).forEach(async (counter) => {
                count = counter.remCount;
                logger.debug(count);
            });
        }).catch(function (err) {
            logger.error(err, err.stack);
        });
    } while (count > 0)


    let sql = `SELECT c.id, c.url, COALESCE(SUM(pc.categoryid), 0) as fetchCount FROM category c LEFT JOIN productCategory pc ON c.id = pc.categoryid GROUP BY c.id, c.url, c.level  ORDER BY fetchCount asc, c.level`;
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
    await cluster.close();
    return;
}







const Variants = require('./variants');
const Feedback = require('./feedback.js');



async function AliexpressProductScraper(feedbackLimit) {
    const FEEDBACK_LIMIT = feedbackLimit || 10;


    await cluster.task(async ({ page, data }) => {
        let { productId } = data
        await page.goto(`https://www.aliexpress.com/item/${productId}.html`, { waitUntil: 'domcontentloaded' });
        //Check if page html title =Page Not Found - Aliexpress.com


        // eslint-disable-next-line no-undef
        const aliExpressData = await page.evaluate(() => runParams);

        data = aliExpressData.data;

        if (!data) {
            logger.error(`${productId} not found`);
            return;
        }

        if (!data.descriptionModule?.descriptionUrl) {
            logger.error(`${productId} has no description`);
            return;
        }
        /** Scrape the description page for the product using the description url */
        const descriptionUrl = data.descriptionModule?.descriptionUrl;


        await page.goto(descriptionUrl, { waitUntil: 'domcontentloaded' });
        const descriptionPageHtml = await page.content();

        /** Build the AST for the description page html content using cheerio */
        const $ = cheerio.load(descriptionPageHtml);
        const descriptionData = $('body').html();

        var adminAccountId = await page.evaluate(() => adminAccountId);

        let feedbackData = [];

        if (data.titleModule.feedbackRating.totalValidNum > 0) {
            feedbackData = await Feedback.get(
                data.actionModule.productId,
                adminAccountId,
                data.titleModule.feedbackRating.totalValidNum,
                FEEDBACK_LIMIT
            );
        }


        /** Build the JSON response with aliexpress product details */
        const json = {
            title: data.titleModule.subject,
            categoryId: data.actionModule.categoryId,
            productId: data.actionModule.productId,
            totalAvailableQuantity: data.quantityModule.totalAvailQuantity,
            description: descriptionData,
            orders: data.titleModule.tradeCount,
            itemWishedCount: data.actionModule.itemWishedCount,
            storeInfo: {
                storeNumber: data.storeModule.storeNum,
                name: data.storeModule.storeName,
                url: data.storeModule.storeURL,
                aliMemberId: data.storeModule.sellerAdminSeq,
                companyId: data.storeModule.companyId,
                followers: data.storeModule.followingNumber,
                rating: parseFloat(data.storeModule.positiveRate.replace(/[^0-9.]/g, '')) / 100.0,
                ratingCount: data.storeModule.positiveNum,

                openTime: new Date(Date.parse(data.storeModule.openTime)).toISOString().split('T')[0],
                openedYear: data.storeModule.openedYear,
                topRatedSeller: data.storeModule.topRatedSeller,
            },
            ratings: {
                averageStar: parseFloat(data.titleModule.feedbackRating.averageStar),
                averageStarPercent: parseFloat(data.titleModule.feedbackRating.averageStarRage) / 100.0,
                totalStartCount: data.titleModule.feedbackRating.totalValidNum,
                fiveStarCount: data.titleModule.feedbackRating.fiveStarNum,
                fiveStarPercent: parseFloat(data.titleModule.feedbackRating.fiveStarRate) / 100.0,
                fourStarCount: data.titleModule.feedbackRating.fourStarNum,
                fourStarPercent: parseFloat(data.titleModule.feedbackRating.fourStarRate) / 100.0,
                threeStarCount: data.titleModule.feedbackRating.threeStarNum,
                threeStarPercent: parseFloat(data.titleModule.feedbackRating.threeStarRate) / 100.0,
                twoStarCount: data.titleModule.feedbackRating.twoStarNum,
                twoStarPercent: parseFloat(data.titleModule.feedbackRating.twoStarRate) / 100.0,
                oneStarCount: data.titleModule.feedbackRating.oneStarNum,
                oneStarPercent: parseFloat(data.titleModule.feedbackRating.oneStarRate) / 100.0,
                ratingDisplayed: data.titleModule.feedbackRating.display,
            },
            images:
                (data.imageModule &&
                    data.imageModule.imagePathList) ||
                [],
            feedback: feedbackData,
            variants: Variants.get(data.skuModule),
            specs: data.specsModule.props,
            currency: data.webEnv.currency,
            originalPrice: {
                min: data.priceModule.minAmount.value,
                max: data.priceModule.maxAmount.value
            },
            salePrice: {
                min: data.priceModule.minActivityAmount
                    ? data.priceModule.minActivityAmount.value
                    : data.priceModule.minAmount.value,
                max: data.priceModule.maxActivityAmount
                    ? data.priceModule.maxActivityAmount.value
                    : data.priceModule.maxAmount.value,
            }
        };
        //logger.info(JSON.stringify(json));
        if (data.commonModule.crawler == true) {
            logger.warn('crawler has been detected for product ' + json.productId);
        }
        let sqlstore = `INSERT INTO store (id, name, url, aliMemberId, companyId, followerCount, rating, ratingCount, openTime, openedYear, topRatedSeller) VALUES (:id, :name, :url, :aliMemberId, :companyId, :followerCount, :rating, :ratingCount, :openTime, :openedYear, :topRatedSeller
            ) ON CONFLICT (id) DO UPDATE SET name = excluded.name, url = excluded.url, aliMemberId = excluded.aliMemberId, companyId = excluded.companyId, followerCount = excluded.followerCount, rating = excluded.rating, ratingCount = excluded.ratingCount, openTime = excluded.openTime, openedYear = excluded.openedYear, topRatedSeller = excluded.topRatedSeller`;
        let parameters = [
            {
                name: 'id', value: { longValue: json.storeInfo.storeNumber }
            },
            {
                name: 'name', value: { stringValue: json.storeInfo.name }
            },
            {
                name: 'url', value: { stringValue: json.storeInfo.url }
            },
            {
                name: 'aliMemberId', value: { longValue: json.storeInfo.aliMemberId }
            },
            {
                name: 'companyId', value: { longValue: json.storeInfo.companyId }
            },
            {
                name: 'followerCount', value: { longValue: json.storeInfo.followers }
            },
            {
                name: 'rating', value: { doubleValue: json.storeInfo.rating }
            },
            {
                name: 'ratingCount', value: { longValue: json.storeInfo.ratingCount }
            },
            {
                name: 'openTime', typeHint: 'DATE', value: { stringValue: json.storeInfo.openTime }
            },
            {
                name: 'openedYear', value: { longValue: json.storeInfo.openedYear }
            },
            {
                name: 'topRatedSeller', value: { booleanValue: json.storeInfo.topRatedSeller }
            }
        ];
        logger.debug(JSON.stringify(parameters));
        let params = {
            resourceArn: process.env.RDS_ARN
            , secretArn: process.env.RDS_SECRET_ARN
            , database: process.env.RDS_DATABASE, sql: sqlstore, continueAfterTimeout: true, includeResultMetadata: false
            , parameters: parameters
        };
        let resstore = await rdsdataservice.executeStatement(params).promise().catch(err => {
            logger.error(err);
        });
        logger.debug(JSON.stringify(resstore));



        let sqlproduct = `INSERT INTO product (id, name , categoryid) VALUES (:id, :name, :categoryid) ON CONFLICT (id) DO UPDATE SET name = excluded.name, categoryid = excluded.categoryid`;
        parameters =
            [
                {
                    name: 'id', value: { longValue: json.productId }
                },
                {
                    name: 'name', value: { stringValue: json.title }
                },
                {
                    name: 'categoryid', value: { longValue: json.categoryId }
                }
            ];
        params = {
            resourceArn: process.env.RDS_ARN
            , secretArn: process.env.RDS_SECRET_ARN
            , database: process.env.RDS_DATABASE, sql: sqlproduct, continueAfterTimeout: true, includeResultMetadata: false
            , parameters: parameters
        };
        await rdsdataservice.executeStatement(params).promise().then(function (data) {
            logger.debug(data);
        }).catch(function (err) {
            logger.error(err);
        });

        let sqlproductdetails = `INSERT INTO productdetails (productid, totalAvailableQuantity, description, orders, storeid, itemWishedCount) VALUES (:productid, :totalAvailableQuantity, :description, :orders, :storeid, :itemWishedCount)`;
        parameters = [
            {
                name: 'productid', value: { longValue: json.productId }
            },
            {
                name: 'totalAvailableQuantity', value: { longValue: json.totalAvailableQuantity }
            },
            {
                name: 'description', value: { stringValue: json.description }
            },
            {
                name: 'orders', value: { longValue: json.orders }
            },
            {
                name: 'storeid', value: { longValue: json.storeInfo.storeNumber }
            },
            {
                name: 'itemWishedCount', value: { longValue: json.itemWishedCount }
            }
        ];
        params = {
            resourceArn: process.env.RDS_ARN
            , secretArn: process.env.RDS_SECRET_ARN
            , database: process.env.RDS_DATABASE, sql: sqlproductdetails, continueAfterTimeout: true, includeResultMetadata: false
            , parameters: parameters
        };
        await rdsdataservice.executeStatement(params).promise().then(result => {
            logger.debug(result);
        }).catch(err => {
            logger.error(err);
        })

        let sqlproductratings = `INSERT INTO productratings (productid, averageStar, totalStartCount, fiveStarCount, fourStarCount, threeStarCount
            , twoStarCount, oneStarCount, averageStarPercent, fiveStarPercent, fourStarPercent, threeStarPercent, twoStarPercent
            , oneStarPercent, ratingDisplayed) VALUES (:productid, :averageStar, :totalStartCount, :fiveStarCount, :fourStarCount, :threeStarCount
            , :twoStarCount, :oneStarCount, :averageStarPercent, :fiveStarPercent, :fourStarPercent, :threeStarPercent, :twoStarPercent, :oneStarPercent, :ratingDisplayed)
        ON CONFLICT (productid, totalStartCount) DO UPDATE SET averageStar = excluded.averageStar, totalStartCount = excluded.totalStartCount, fiveStarCount = excluded.fiveStarCount, fourStarCount = excluded.fourStarCount, threeStarCount = excluded.threeStarCount, twoStarCount = excluded.twoStarCount, oneStarCount = excluded.oneStarCount, averageStarPercent = excluded.averageStarPercent, fiveStarPercent = excluded.fiveStarPercent, fourStarPercent = excluded.fourStarPercent, threeStarPercent = excluded.threeStarPercent, twoStarPercent = excluded.twoStarPercent, oneStarPercent = excluded.oneStarPercent, ratingDisplayed = excluded.ratingDisplayed`;
        parameters = [
            {
                name: 'productid', value: { longValue: json.productId }
            }, {
                name: 'averageStar', value: { doubleValue: json.ratings.averageStar }
            }, {
                name: 'totalStartCount', value: { longValue: json.ratings.totalStartCount }
            }, {
                name: 'fiveStarCount', value: { longValue: json.ratings.fiveStarCount }
            }, {
                name: 'fourStarCount', value: { longValue: json.ratings.fourStarCount }
            }, {
                name: 'threeStarCount', value: { longValue: json.ratings.threeStarCount }
            }, {
                name: 'twoStarCount', value: { longValue: json.ratings.twoStarCount }
            }, {
                name: 'oneStarCount', value: { longValue: json.ratings.oneStarCount }
            }, {
                name: 'averageStarPercent', value: { doubleValue: json.ratings.averageStarPercent }
            }, {
                name: 'fiveStarPercent', value: { doubleValue: json.ratings.fiveStarPercent }
            }, {
                name: 'fourStarPercent', value: { doubleValue: json.ratings.fourStarPercent }
            }, {
                name: 'threeStarPercent', value: { doubleValue: json.ratings.threeStarPercent }
            }, {
                name: 'twoStarPercent', value: { doubleValue: json.ratings.twoStarPercent }
            }, {
                name: 'oneStarPercent', value: { doubleValue: json.ratings.oneStarPercent }
            }, {
                name: 'ratingDisplayed', value: { booleanValue: json.ratings.ratingDisplayed }
            }
        ];
        logger.debug(JSON.stringify(parameters));


        params = {
            resourceArn: process.env.RDS_ARN
            , secretArn: process.env.RDS_SECRET_ARN
            , database: process.env.RDS_DATABASE, sql: sqlproductratings, continueAfterTimeout: true, includeResultMetadata: false
            , parameters: parameters
        };
        await rdsdataservice.executeStatement(params).promise().then(function (data) {
            logger.debug(data);
        }).catch(function (err) {
            logger.error(err);
        });


        let sqlimage = `INSERT INTO image (url) values (:url) ON CONFLICT (url) DO NOTHING`;

        for (let i = 0; i < json.images.length; i++) {
            parameters = [
                {
                    name: 'url', value: { stringValue: json.images[i] }
                }
            ];

            params = {
                resourceArn: process.env.RDS_ARN
                , secretArn: process.env.RDS_SECRET_ARN
                , database: process.env.RDS_DATABASE, sql: sqlimage
                , parameters: parameters
                , continueAfterTimeout: true
                , includeResultMetadata: false
            };
            await rdsdataservice.executeStatement(params).promise().then(function (data) {
                logger.debug(data);
            }).catch(function (err) {
                logger.error(err);
            });
        }


        let sqlproductimages = `INSERT INTO productimages (productid, url, imageNo) VALUES (:productid, :imageurl, :imageNo) 
        ON CONFLICT (productid, url, imageNo) DO UPDATE SET url = excluded.url, imageNo = excluded.imageNo`;
        for (let i = 0; i < json.images.length; i++) {
            parameters = [{
                name: 'productid', value: { longValue: json.productId }
            }, {
                name: 'imageurl', value: { stringValue: json.images[i] }
            }
                , {
                name: 'imageNo', value: { longValue: i }
            }];

            params = {
                resourceArn: process.env.RDS_ARN
                , secretArn: process.env.RDS_SECRET_ARN
                , database: process.env.RDS_DATABASE, sql: sqlproductimages
                , parameters: parameters
                , includeResultMetadata: false
                , continueAfterTimeout: true
            };
            await rdsdataservice.executeStatement(params).promise().then(function (data) {
                logger.debug(data);
            }).catch(function (err) {
                logger.error(err);
            });
        }

        let sqlproductreviews = `INSERT INTO productreviews (productid, name, displayName, country, rating, date
            , review, usefullCount, uselessCount, additionalFeedback, feedbackId, url, additionalFeedbackDate) 
            VALUES (:productid, :name, :displayName, :country, :rating, :date, :review, :usefullCount, :uselessCount
                , :additionalFeedback, :feedbackId, :url, :additionalFeedbackDate) ON CONFLICT (productid, feedbackId) DO UPDATE SET name = excluded.name, displayName = excluded.displayName, country = excluded.country, rating = excluded.rating, date = excluded.date, review = excluded.review, usefullCount = excluded.usefullCount, uselessCount = excluded.uselessCount, additionalFeedback = excluded.additionalFeedback, url = excluded.url, additionalFeedbackDate = excluded.additionalFeedbackDate
        RETURNING id`;

        for (let i = 0; i < json.feedback.length; i++) {
            let review = json.feedback[i];
            parameters = [{
                name: 'productid', value: { longValue: json.productId }
            }, {
                name: 'name', value: { stringValue: review.name }
            }, {
                name: 'displayName', value: { stringValue: review.displayName }
            }, {
                name: 'country', value: { stringValue: review.country }
            }, {
                name: 'rating', value: { longValue: review.rating }
            }, {
                name: 'date', typeHint: 'TIMESTAMP', value: { stringValue: review.date }
            }, {
                name: 'review', value: { stringValue: review.content }
            }, {
                name: 'usefullCount', value: { longValue: review.usefullCount }
            }, {
                name: 'uselessCount', value: { longValue: review.uselessCount }
            }, {
                name: 'additionalFeedback', value: { stringValue: review.additionalFeedback }
            }, {
                name: 'feedbackId', value: { longValue: review.feedbackId }
            }, {
                name: 'url', value: { stringValue: review.feedbackUrl }
            }
            ];
            if (review.additionalFeedbackDate) {
                parameters.push({
                    name: 'additionalFeedbackDate', typeHint: 'TIMESTAMP', value: { stringValue: review.additionalFeedbackDate }
                });
            }
            else
                parameters.push({
                    name: 'additionalFeedbackDate', value: { 'isNull': true }
                });
            params = {
                resourceArn: process.env.RDS_ARN
                , secretArn: process.env.RDS_SECRET_ARN
                , database: process.env.RDS_DATABASE, sql: sqlproductreviews
                , parameters: parameters
                , continueAfterTimeout: true, includeResultMetadata: false
            };
            await rdsdataservice.executeStatement(params).promise().then(function (data) {
                logger.debug(JSON.stringify(data));
            }
            ).catch(function (err) {
                logger.error(err);
            });

        }

        let sqlproductPrices = `INSERT INTO productPrices (productid, availableQuantity, minOriginalPrice, maxOriginalPrice, minSalePrice, maxSalePrice, currency) VALUES (:productid, :availableQuantity, :minOriginalPrice, :maxOriginalPrice, :minSalePrice, :maxSalePrice, :currency)`;
        parameters = [{
            name: 'productid', value: { longValue: json.productId }
        }, {
            name: 'availableQuantity', value: { longValue: json.totalAvailableQuantity }
        }, {
            name: 'minOriginalPrice', value: { doubleValue: json.originalPrice.min }
        }, {
            name: 'maxOriginalPrice', value: { doubleValue: json.originalPrice.max }
        }, {
            name: 'minSalePrice', value: { doubleValue: json.salePrice.min }
        }, {
            name: 'maxSalePrice', value: { doubleValue: json.salePrice.max }
        }, {
            name: 'currency', value: { stringValue: json.currency }
        }
        ];
        params = {
            resourceArn: process.env.RDS_ARN
            , secretArn: process.env.RDS_SECRET_ARN
            , database: process.env.RDS_DATABASE, sql: sqlproductPrices
            , parameters: parameters
            , continueAfterTimeout: true, includeResultMetadata: false
        };
        await rdsdataservice.executeStatement(params).promise().then(function (data) {
            logger.debug(JSON.stringify(data));
        }
        ).catch(function (err) {
            logger.error(err);
        }
        );





    });

}





module.exports = { AliexpressProductScraper, getAllProductDetails };


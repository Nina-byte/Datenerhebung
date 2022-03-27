const logger = require("./logger")
const getCategoryOverview = require('./getCategoryOverview');
const getCategories = require('./getCategories')
const getDetails = require('./getDetails');

/*
getCategoryOverview.loadCategoriesTable(false).then(() => {
    getCategories.getProductsOfAllCategorys().then(() => {
        getDetails.getDetailsOfAllProducts().then(() => {
            logger.log("Finished");
        })
    })
})
*/

getDetails.getAllProductDetails();


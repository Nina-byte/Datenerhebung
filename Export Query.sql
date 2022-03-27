SELECT p.id AS p_id,
    coalesce(p.categoryid, pc.postCategoryid) AS "categoryid",
    AVG(coalesce(pc.page, 0)) AS "page",
    AVG(coalesce(pc.pagerank, 0)) AS "pagerank",
    AVG(coalesce(pc.totalrank, 0)) AS "totalrank",
    SUM(
        CASE
            WHEN pc.currency = 'EUR' THEN pc.originalPrice * 1.1857
            WHEN pc.currency = 'BRL' THEN pc.originalPrice * 0.186
            WHEN pc.currency = 'CNY' THEN pc.originalPrice * 0.1549
            ELSE pc.originalPrice
        END
    ) AS "pc_originalPrice",
    SUM(
        CASE
            WHEN pc.currency = 'EUR' THEN pc.salePrice * 1.1857
            WHEN pc.currency = 'BRL' THEN pc.salePrice * 0.186
            WHEN pc.currency = 'CNY' THEN pc.salePrice * 0.1549
            ELSE pc.salePrice
        END
    ) AS "pc_salePrice",
    SUM(
        CASE
            WHEN pp.currency = 'EUR' THEN pp.minOriginalPrice * 1.1857
            WHEN pp.currency = 'BRL' THEN pp.minOriginalPrice * 0.186
            WHEN pp.currency = 'CNY' THEN pp.minOriginalPrice * 0.1549
            ELSE pp.minOriginalPrice
        END
    ) AS "pp_minOriginalPrice",
    SUM(
        CASE
            WHEN pp.currency = 'EUR' THEN pp.minSalePrice * 1.1857
            WHEN pp.currency = 'BRL' THEN pp.minSalePrice * 0.186
            WHEN pp.currency = 'CNY' THEN pp.minSalePrice * 0.1549
            ELSE pp.minSalePrice
        END
    ) AS "pp_minSalePrice",
    SUM(
        CASE
            WHEN pp.currency = 'EUR' THEN pp.maxOriginalPrice * 1.1857
            WHEN pp.currency = 'BRL' THEN pp.maxOriginalPrice * 0.186
            WHEN pp.currency = 'CNY' THEN pp.maxOriginalPrice * 0.1549
            ELSE pp.maxOriginalPrice
        END
    ) AS "pp_maxOriginalPrice",
    SUM(
        CASE
            WHEN pp.currency = 'EUR' THEN pp.maxSalePrice * 1.1857
            WHEN pp.currency = 'BRL' THEN pp.maxSalePrice * 0.186
            WHEN pp.currency = 'CNY' THEN pp.maxSalePrice * 0.1549
            ELSE pp.maxSalePrice
        END
    ) AS "pp_maxSalePrice",
    AVG(pr.fiveStarCount) AS "pr_fiveStarCount",
    AVG(pr.fourStarCount) AS "pr_fourStarCount",
    AVG(pr.threeStarCount) AS "pr_threeStarCount",
    AVG(pr.twoStarCount) AS "pr_twoStarCount",
    AVG(pr.oneStarCount) AS "pr_oneStarCount",
    AVG(
        datediff(
            'days',
            pc.lunchtime::date,
            coalesce(pc.fetchTime::date, current_date::date)
        )
    ) AS "time since lunch",
    AVG(pd.itemWishedCount) AS "itemWishedCount",
    AVG(
        CASE
            WHEN pc.previewImageUrl IS NULL THEN 0
            ELSE 1
        END
    ) AS "has image preview",
    AVG(
        CASE
            WHEN pc.videoid IS NULL THEN 0
            ELSE 1
        END
    ) AS "has video preview",
    (
        select avg(x)
        from unnest(array [AVG(pc.starRating),AVG(pr.averageStar)]) as x
    ) as avg_star,
    COUNT(DISTINCT pcs.sellingPointId) AS "Amount of selling points",
    COUNT(DISTINCT pi.url) AS "Amount of images",
    AVG(c.level) AS "Level",
    AVG(c.headCategory) as "Head",
    AVG(
        coalesce(pd.totalAvailableQuantity, pp.availablequantity)
    ) AS "Available quantity",
    --COunt(DISTINCT prr.feedbackId) AS "Store Amount of feedbacks",
    AVG(pr.averagestarpercent) AS "Average star percentage",
    AVG(s.followerCount) AS "Follower count",
    AVG(s.rating) AS "Rating",
    AVG(s.ratingCount) AS "Rating count",
    AVG(
        datediff(
            'days',
            s.openTime::date,
            coalesce(s.openTime::date, current_date::date)
        )
    ) AS "store time since lunch",
    AVG(Length(pd.description)) AS "Description length"
FROM product p
    INNER JOIN productCategory pc ON p.id = pc.productid
    INNER JOIN category c ON pc.categoryid = c.id
    INNER JOIN productdetails pd ON pd.productId = p.id
    LEFT JOIN productPrices pp ON pp.productid = p.id
    LEFT JOIN productratings pr ON pr.productid = p.id
    LEFT JOIN productimages pi ON pi.productid = p.id
    LEFT JOIN productCategorySellingPoints pcs ON pcs.productCategoryId = pc.id
    LEFT JOIN store s ON s.id = coalesce(pd.storeid, pc.storeid) --LEFT JOIN productreviews prr ON prr.productid = p.id
GROUP BY p.id,
    coalesce(p.categoryid, pc.postCategoryid)
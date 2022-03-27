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
    CASE
        WHEN (
            AVG(pr.fiveStarCount) + AVG(pr.fourStarCount) + AVG(pr.threeStarCount) + AVG(pr.twoStarCount) + AVG(pr.oneStarCount)
        ) > 0 THEN 1
        else 0
    end as "has reviews",
    CASE
        WHEN AVG(pd.orders) = 0 THEN 0
        ELSE (
            AVG(pr.fiveStarCount) + AVG(pr.fourStarCount) + AVG(pr.threeStarCount) + AVG(pr.twoStarCount) + AVG(pr.oneStarCount)
        ) / AVG(pd.orders)
    END as "reviewed_percent",
    COUNT(DISTINCT pcs.sellingPointId) AS "Amount of selling points",
    COUNT(DISTINCT pi.url) AS "Amount of images",
    AVG(c.level) AS "Level",
    MIN(c.headCategory) as "Head",
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
            current_date::date
        )
    ) AS "store time since lunch",
    AVG(Length(pd.description)) AS "Description length",
    AVG(pc.soldAmount) as soldamount_pc,
    AVG(pd.orders) as soldamount_pd,
    AVG(rml.fivestar_main) as fivestar_main,
    AVG(rml.fourstar_main) as fourstar_main,
    AVG(rml.threestar_main) as threestar_main,
    AVG(rml.twostar_main) as twostar_main,
    AVG(rml.onestar_main) as onestar_main,
    AVG(rml.sadness_main) as sadness_main,
    AVG(rml.joy_main) as joy_main,
    avg(rml.love_main) as love_main,
    avg(rml.anger_main) as anger_main,
    avg(rml.fear_main) as fear_main,
    avg(rml.surprise_main) as surprise_main,
    AVG(rml.fivestar_add_info) as fivestar_add_info,
    AVG(rml.fourstar_add_info) as fourstar_add_info,
    AVG(rml.threestar_add_info) as threestar_add_info,
    AVG(rml.twostar_add_info) as twostar_add_info,
    AVG(rml.onestar_add_info) as onestar_add_info,
    AVG(rml.sadness_add_info) as sadness_add_info,
    AVG(rml.joy_add_info) as joy_add_info,
    avg(rml.love_add_info) as love_add_info,
    avg(rml.anger_add_info) as anger_add_info,
    avg(rml.fear_add_info) as fear_add_info,
    avg(rml.surprise_add_info) as surprise_add_info
FROM product p
    INNER JOIN productCategory pc ON p.id = pc.productid
    INNER JOIN category c ON pc.categoryid = c.id
    INNER JOIN productdetails pd ON pd.productId = p.id
    LEFT JOIN productPrices pp ON pp.productid = p.id
    LEFT JOIN productratings pr ON pr.productid = p.id
    LEFT JOIN productimages pi ON pi.productid = p.id
    LEFT JOIN productCategorySellingPoints pcs ON pcs.productCategoryId = pc.id
    LEFT JOIN store s ON s.id = coalesce(pd.storeid, pc.storeid)
    LEFT JOIN (
        SELECT c.productid,
            AVG(a.fivestar) as fivestar_main,
            AVG(a.fourstar) as fourstar_main,
            AVG(a.threestar) as threestar_main,
            AVG(a.twostar) as twostar_main,
            AVG(a.onestar) as onestar_main,
            AVG(a.sadness) as sadness_main,
            AVG(a.joy) as joy_main,
            AVG(a.love) as love_main,
            AVG(a.anger) as anger_main,
            AVG(a.fear) as fear_main,
            AVG(a.surprise) as surprise_main,
            AVG(b.fivestar) as fivestar_add_info,
            AVG(b.fourstar) as fourstar_add_info,
            AVG(b.threestar) as threestar_add_info,
            AVG(b.twostar) as twostar_add_info,
            AVG(b.onestar) as onestar_add_info,
            AVG(b.sadness) as sadness_add_info,
            AVG(b.joy) as joy_add_info,
            AVG(b.love) as love_add_info,
            AVG(b.anger) as anger_add_info,
            AVG(b.fear) as fear_add_info,
            AVG(b.surprise) as surprise_add_info
        FROM productreviews c
            LEFT JOIN productreviewsmainml a on a.reviewid = c.id
            LEFT join productreviewsaddinfoml b on a.reviewid = b.reviewid
        GROUP BY c.productid
    ) rml on p.id = rml.productid
GROUP BY p.id,
    coalesce(p.categoryid, pc.postCategoryid)
HAVING (
        AVG(pr.fiveStarCount) + AVG(pr.fourStarCount) + AVG(pr.threeStarCount) + AVG(pr.twoStarCount) + AVG(pr.oneStarCount)
    ) > 0;
SELECT COUNT(*)
FROM (
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
            CASE
                WHEN (
                    AVG(pr.fiveStarCount) + AVG(pr.fourStarCount) + AVG(pr.threeStarCount) + AVG(pr.twoStarCount) + AVG(pr.oneStarCount)
                ) > 0 THEN 1
                else 0
            end as "has reviews",
            (
                AVG(pr.fiveStarCount) + AVG(pr.fourStarCount) + AVG(pr.threeStarCount) + AVG(pr.twoStarCount) + AVG(pr.oneStarCount)
            ) / AVG(pd.orders) as "reviewed_percent",
            COUNT(DISTINCT pcs.sellingPointId) AS "Amount of selling points",
            COUNT(DISTINCT pi.url) AS "Amount of images",
            AVG(c.level) AS "Level",
            MIN(c.headCategory) as "Head",
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
                    current_date::date
                )
            ) AS "store time since lunch",
            AVG(Length(pd.description)) AS "Description length",
            AVG(pc.soldAmount) as soldamount_pc,
            AVG(pd.orders) as soldamount_pd
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
        HAVING (
                AVG(pr.fiveStarCount) + AVG(pr.fourStarCount) + AVG(pr.threeStarCount) + AVG(pr.twoStarCount) + AVG(pr.oneStarCount)
            ) > 0
    ) AS a;
SELECT DISTINCT id,
    coalesce(review, '') as "review",
    coalesce(additionalfeedback, '') as "additionalfeedback"
FROM productreviews
    LEFT JOIN productreviewsmainml ON productreviews.id = productreviewsmainml.reviewid
    LEFT JOIN productreviewsaddinfoml ON productreviews.id = productreviewsaddinfoml.reviewid
WHERE (
        coalesce(review, '') <> ''
        or coalesce(additionalfeedback, '') <> ''
    )
    and productreviewsmainml.reviewid is null
    and productreviewsaddinfoml is null;
;
SELECT COUNT(*)
FROM productdetails;
SELECT COUNT(*)
FROM productreviews
    LEFT JOIN productreviewsmainml ON productreviews.id = productreviewsmainml.reviewid
    LEFT JOIN productreviewsaddinfoml ON productreviews.id = productreviewsaddinfoml.reviewid
WHERE (
        coalesce(review, '') <> ''
        or coalesce(additionalfeedback, '') <> ''
    )
    and productreviewsmainml.reviewid is null
    and productreviewsaddinfoml is null;
SELECT COUNT(review),
    COUNT(additionalfeedback)
FROM productreviews
    LEFT JOIN productreviewsmainml ON productreviews.id = productreviewsmainml.reviewid
    LEFT JOIN productreviewsaddinfoml ON productreviews.id = productreviewsaddinfoml.reviewid
WHERE (
        coalesce(review, '') <> ''
        or coalesce(additionalfeedback, '') <> ''
    )
    and productreviewsmainml.reviewid is null
    and productreviewsaddinfoml is null;
SELECT *
FROM productreviewsmainml
ORDER BY random()
LIMIT 100;
SELECT *
FROM productreviewsaddinfoml
WHERE reviewid = 761562;
SELECT *
FROM productreviews
WHERE id = 761562;
SELECT COUNT(a.reviewid),
    count(b.reviewid)
FROM productreviewsmainml a
    full join productreviewsaddinfoml b on a.reviewid = b.reviewid;
DELETE FROM productreviewsmainml USING productreviewsaddinfoml
WHERE productreviewsmainml.reviewid NOT IN (
        SELECT productreviewsaddinfoml.reviewid
        FROM productreviewsaddinfoml
    );
DELETE FROM productreviewsaddinfoml USING productreviewsmainml
WHERE productreviewsaddinfoml.reviewid NOT IN (
        SELECT productreviewsmainml.reviewid
        FROM productreviewsmainml
    );
SELECT c.productid,
    /*
     case when coalesce(trim(c.review), '') = '' then 0 else AVG(a.fivestar) END              as fivestar_main,
     case when coalesce(trim(c.review), '') = '' then 0 else AVG(a.fourstar) END              as fourstar_main,
     case when coalesce(trim(c.review), '') = '' then 0 else AVG(a.threestar) END             as threestar_main,
     case when coalesce(trim(c.review), '') = '' then 0 else AVG(a.twostar) END               as twostar_main,
     case when coalesce(trim(c.review), '') = '' then 0 else AVG(a.onestar) END               as onestar_main,
     case when coalesce(trim(c.review), '') = '' then 0 else AVG(a.sadness) END               as sadness_main,
     case when coalesce(trim(c.review), '') = '' then 0 else AVG(a.joy) END                   as joy_main,
     case when coalesce(trim(c.review), '') = '' then 0 else AVG(a.love) END                  as love_main,
     case when coalesce(trim(c.review), '') = '' then 0 else AVG(a.anger) END                 as anger_main,
     case when coalesce(trim(c.review), '') = '' then 0 else AVG(a.fear) END                  as fear_main,
     case when coalesce(trim(c.review), '') = '' then 0 else AVG(a.surprise) END              as surprise_main,
     case when coalesce(trim(c.additionalfeedback), '') = '' then 0 else AVG(b.fivestar) end  as fivestar_add_info,
     case when coalesce(trim(c.additionalfeedback), '') = '' then 0 else AVG(b.fourstar) end  as fourstar_add_info,
     case when coalesce(trim(c.additionalfeedback), '') = '' then 0 else AVG(b.threestar) end as threestar_add_info,
     case when coalesce(trim(c.additionalfeedback), '') = '' then 0 else AVG(b.twostar) end   as twostar_add_info,
     case when coalesce(trim(c.additionalfeedback), '') = '' then 0 else AVG(b.onestar) end   as onestar_add_info,
     case when coalesce(trim(c.additionalfeedback), '') = '' then 0 else AVG(b.sadness) end   as sadness_add_info,
     case when coalesce(trim(c.additionalfeedback), '') = '' then 0 else AVG(b.joy) end       as joy_add_info,
     case when coalesce(trim(c.additionalfeedback), '') = '' then 0 else AVG(b.love) end      as love_add_info,
     case when coalesce(trim(c.additionalfeedback), '') = '' then 0 else AVG(b.anger) end     as anger_add_info,
     case when coalesce(trim(c.additionalfeedback), '') = '' then 0 else AVG(b.fear) end      as fear_add_info,
     case when coalesce(trim(c.additionalfeedback), '') = '' then 0 else AVG(b.surprise) end  as surprise_add_info
     
     */
    AVG(a.fivestar) as fivestar_main,
    AVG(a.fourstar) as fourstar_main,
    AVG(a.threestar) as threestar_main,
    AVG(a.twostar) as twostar_main,
    AVG(a.onestar) as onestar_main,
    AVG(a.sadness) as sadness_main,
    AVG(a.joy) as joy_main,
    AVG(a.love) as love_main,
    AVG(a.anger) as anger_main,
    AVG(a.fear) as fear_main,
    AVG(a.surprise) as surprise_main,
    AVG(b.fivestar) as fivestar_add_info,
    AVG(b.fourstar) as fourstar_add_info,
    AVG(b.threestar) as threestar_add_info,
    AVG(b.twostar) as twostar_add_info,
    AVG(b.onestar) as onestar_add_info,
    AVG(b.sadness) as sadness_add_info,
    AVG(b.joy) as joy_add_info,
    AVG(b.love) as love_add_info,
    AVG(b.anger) as anger_add_info,
    AVG(b.fear) as fear_add_info,
    AVG(b.surprise) as surprise_add_info
FROM productreviews c
    LEFT JOIN productreviewsmainml a on a.reviewid = c.id
    LEFT join productreviewsaddinfoml b on a.reviewid = b.reviewid
GROUP BY c.productid;
SELECT COUNT(*)
FROM productreviews pr;
SELECT *
FROM category;
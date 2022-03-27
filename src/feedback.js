const fetch = require('node-fetch');
const cheerio = require('cheerio');
const faker = require('faker');
const moment = require('moment');

const getFeedbackData = feedbackHtml => {
  const $ = cheerio.load(feedbackHtml);
  const feedbackData = [];

  /*
  <!DOCTYPE html>
<html>
  <head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
    <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
    <meta http-equiv="X-UA-Compatible" content="IE=7"/>
    <meta name="keywords" content="solid surface sink, wholesale quartz sink lots, cheap acrylic sink wholesalers, solid surface sink lots, cheap quartz sink dropship"/>
    <meta name="description" content="Wholesale solid surface sink, buy solid surface sink directly:we have&amp;nbsp;superiority and experience in producing solid surface sink, acrylic sink,please no hesitate to contact us for more details.&amp;nbsp;We are able to make mold for our customers and our"/>

    <link rel="shortcut icon" href="//ae01.alicdn.com/images/eng/wholesale/icon/aliexpress.ico" type="image/x-icon"/>
    <title/>
    <!-- 下面data-locale属性可以传java应用本身已有的locale的值 -->
    <script src="//i.alicdn.com/ae-global/atom/??atom.75738738.js" data-locale=""/>
    <!-- 下面 ae-xxx-ui 写上自己对接的前端应用名，index.css则表示该页面需要引用的入口css文件 -->
    <script src="//i.alicdn.com/ae-feedback-ui/??hashmap.8d57bfed.js"/>
    <link rel="stylesheet" type="text/css" href="//i.alicdn.com/ae-feedback-ui/display/productEvaluation/??index-new.7f4815d0.css"/>
    <script type="text/javascript" data-version="ae-lego-ui=1.0.0;ae-global=2.0.0;ae-feedback-ui=2.0.8;" src="//i.alicdn.com/ae-feedback-ui/display/productEvaluation/??index.dfb9ec3d.js" async defer>< script>



  </head>

  <body><script>
with(document)with(body)with(insertBefore(createElement("script"),firstChild))setAttribute("exparams","userid=&aplus&ali_beacon_id=&ali_apache_id=&ali_apache_track=&ali_apache_tracktmp=&dmtrack_c={}&pageid=5085e93c211b42bf1639325364&hn=ae%2devaluation15bfabd0d4ccf8c1e90f8a7014021046%2djd529&asid=AQAAAAC0HrZhp7fPQwAAAAAJtxGhriISFQ==&sidx=0&ckx=|",id="beacon-aplus",src="//assets.alicdn.com/g/alilog/??aplus_plugin_aefront/index.js,mlog/aplus_v2.js")
    </script>
    
    <input type="hidden" id="diggFrom" value="detail">
      <input type="hidden" id="feedbackServer" value="//feedback.aliexpress.com/">
        <form id="l-refresh-form" name="refreshForm" action="/display/productEvaluation.htm#feedback-list" method="post">
          <input type="hidden" id="ownerMemberId" name="ownerMemberId" value="245406914"/>
          <input type="hidden" id="memberType" name="memberType" value="seller"/>
          <input type="hidden" id="productId" name="productId" value="1005002885094351"/>
          <input type="hidden" id="companyId" name="companyId" value=""/>
          <input type="hidden" id="evaStarFilterValue" name="evaStarFilterValue" value="all Stars"/>
          <input type="hidden" id="evaSortValue" name="evaSortValue" value="sortdefault@feedback"/>
          <input type="hidden" id="pagea" name="page" value=""/>
          <input type="hidden" id="currentPage" name="currentPage" value="1"/>*/
  //Get ownerMemberId, productId, currentPage
  const ownerMemberId = $('#ownerMemberId').val();
  const productId = $('#productId').val();
  const currentPage = $('#currentPage').val();


  $('.feedback-list-wrap .feedback-item').each((index, element) => {
    const $elm = $(element);
    let name = $elm
      .find('.user-name')
      .text()
      .trim();
    let country = $elm
      .find('.user-country')
      .text()
      .trim();

    let ratingStyle = $elm.find('.star-view > span').attr('style');

    let rating = ratingStyle.split('width:')[1];
    rating = parseInt(rating) / 20;

    let info = {};

    $elm.find('.user-order-info > span').each((index, infoKey) => {
      const key = $(infoKey)
        .find('strong')
        .text()
        .trim();

      $(infoKey)
        .find('strong')
        .remove();

      info[key] = $(infoKey)
        .text()
        .trim();
    });

    /*
<div class="feedback-item clearfix">
                  <div class="fb-user-info">
                  <span class="user-name">
                            <a href="//feedback.aliexpress.com/display/detail.htm?ownerMemberId=HPp53vGE7VvXVUpEw11B1w==&amp;memberType=buyer" target="_blank" rel="nofollow" name="member_detail">J***z</a>
                          </span>
                <div class="user-country"><b class="css_flag css_us">US</b></div>            </div>
                  <div class="fb-main">
                        <div class="f-rate-info">
          <span class="star-view"><span style="width:100%"></span></span>
                  </div>
                        <div class="user-order-info">
                                                                           <span class="first">
                  <strong>Color:</strong>
                                      36m
                                  </span>
                                                                                           <span>
                  <strong>Ships From:</strong>
                                      SPAIN
                                  </span>
                                                                                                                        <span>
              <strong>Logistics:</strong>
                          Seller's Shipping Method - ES
                        </span>
                                                                </div>
                                                                                                                <div class="f-content">
                              <dl class="buyer-review">
                        <dt class="buyer-feedback">
                              <span>I haven't tried them yet but sometimes well and stable</span>
                            <span class="r-time-new">05 Jul 2021 23:56</span>
            </dt>
                        <div class="j-digg-info-new util-right">
                <span class="thf-digg-text">Helpful?</span>
                <span class="thf-digg-useful thf-digg-btn-new">
                  <span>Yes</span>
                  (<span class="thf-digg-num"> 0 </span>)
                </span>
                <span class="thf-digg-useless thf-digg-btn-new">
                  <span>No</span>
                  (<span class="thf-digg-num"> 0 </span>)
                </span>
                <span class="digg-loading"></span>
                                        </div>
                          <input type="hidden" class="digg-token" value="">
              <input id="feedback-new-60026768541073184" class="feedback-id" type="hidden" value="60026768541073184">
                                </dl>
                                                                            </div>
            </div>
        </div>
<div class="feedback-item clearfix">
                  <div class="fb-user-info">
                  <span class="user-name">
                            <a href="//feedback.aliexpress.com/display/detail.htm?ownerMemberId=tm9fV0EbjoBhqWiF5QsmVg==&amp;memberType=buyer" target="_blank" rel="nofollow" name="member_detail">G***i</a>
                          </span>
                <div class="user-country"><b class="css_flag css_it">IT</b></div>            </div>
                  <div class="fb-main">
                        <div class="f-rate-info">
          <span class="star-view"><span style="width:100%"></span></span>
                  </div>
                        <div class="user-order-info">
                                                                           <span class="first">
                  <strong>Color:</strong>
                                      13m
                                  </span>
                                                                                           <span>
                  <strong>Ships From:</strong>
                                      SPAIN
                                  </span>
                                                                                                                        <span>
              <strong>Logistics:</strong>
                          DHL_ES
                        </span>
                                                                </div>
                                                                                                                <div class="f-content">
                              <dl class="buyer-review">
                        <dt class="buyer-feedback">
                              <span>I have not received the order, ask refund total amount paid. Thank you.</span>
                            <span class="r-time-new">09 Aug 2021 21:37</span>
            </dt>
                        <div class="j-digg-info-new util-right">
                <span class="thf-digg-text">Helpful?</span>
                <span class="thf-digg-useful thf-digg-btn-new">
                  <span>Yes</span>
                  (<span class="thf-digg-num"> 0 </span>)
                </span>
                <span class="thf-digg-useless thf-digg-btn-new">
                  <span>No</span>
                  (<span class="thf-digg-num"> 0 </span>)
                </span>
                <span class="digg-loading"></span>
                                        </div>
                          <input type="hidden" class="digg-token" value="">
              <input id="feedback-new-60029352691626283" class="feedback-id" type="hidden" value="60029352691626283">
                                </dl>
                                                                                          <div class="f-additional-title">Additional Feedback </div>
                    <dl class="buyer-additional-review">
                                                  <dt class="buyer-addition-feedback">I have not received the item. Ask the full refund.								<span class="r-time">09 Aug 2021 21:38</span>
              </dt>
                                                        </dl>
                                                                      </div>
            </div>
        </div>
    */

    //get (<span class="thf-digg-num"> 0 </span>


    let usefullCountStr = $elm.find('.thf-digg-num').eq(0).text().trim();
    let uselessCountStr = $elm.find('.thf-digg-num').eq(1).text().trim();
    let usefullCount = parseInt(usefullCountStr);
    let uselessCount = parseInt(uselessCountStr);

    //get value="20032601679403125">
    let feedbackIdStr = $elm.find('.feedback-id').val();
    let feedbackId = parseInt(feedbackIdStr);

    //get '<dt class="buyer-addition-feedback">I have not received the item. Ask the full refund.' (text) without '<span class="r-time">09 Aug 2021 21:38</span>'
    let additionalFeedbackStr = $elm.find('.buyer-addition-feedback');
    let additionalFeedbackDate = additionalFeedbackStr.find('.r-time').text();
    let additionalFeedback = additionalFeedbackStr.find('.r-time').remove().end().text();
    //get 	<span class="r-time">09 Aug 2021 21:38</span>

    //check if date is valid
    if (additionalFeedbackDate == '') {
      additionalFeedbackDate = null;
    }
    else {
      //parse to YYYY-MM-DD HH:MM:SS[.FFF]
      additionalFeedbackDate = moment(additionalFeedbackDate, 'DD MMM YYYY HH:mm').format('YYYY-MM-DD HH:mm:ss');
    }

    const feedbackContent = $elm
      .find('.buyer-feedback span:first-child')
      .text()
      .trim();

    let feedbackTime = $elm
      .find('.buyer-feedback span:last-child')
      .text()
      .trim();

    //parse "15 Nov 2021 04:32" to YYYY-MM-DD HH:MM:SS[.FFF]
    feedbackTime = moment(feedbackTime, 'DD MMM YYYY HH:mm').format('YYYY-MM-DD HH:mm:ss');


    let photos = [];

    $elm.find('.r-photo-list > ul > li').each((index, photo) => {
      const url = $(photo)
        .find('img')
        .attr('src');
      photos.push(url);
    });

    const data = {
      name: name,
      displayName: faker.name.findName(),
      country: country,
      rating: rating,
      info: info,
      date: feedbackTime,
      content: feedbackContent,
      photos: photos,
      usefullCount: usefullCount,
      uselessCount: uselessCount,
      additionalFeedback: additionalFeedback,
      additionalFeedbackDate: additionalFeedbackDate,
      feedbackId: feedbackId,
      feedbackUrl: `https://feedback.aliexpress.com/display/productEvaluation.htm?v=2&page=${currentPage}&currentPage=${currentPage}&productId=${productId}&ownerMemberId=${ownerMemberId}`
    };

    feedbackData.push(data);
  });

  return feedbackData;
};
async function get(productId, ownerMemberId, count, limit) {
  let allFeedbacks = [];
  let totalPages = Math.ceil(Math.min(count, limit) / 10.0);


  for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
    const feedbackUrl = `https://feedback.aliexpress.com/display/productEvaluation.htm?v=2&page=${currentPage}&currentPage=${currentPage}&productId=${productId}&ownerMemberId=${ownerMemberId}`;
    const feedbackResponse = await fetch(feedbackUrl);
    const feedbackHtml = await feedbackResponse.text();

    const data = getFeedbackData(feedbackHtml);
    allFeedbacks = [...allFeedbacks, ...data];
  }

  return allFeedbacks;
}

module.exports = {
  get
};

--drop table if exists category;
Create table IF NOT EXISTS category (
id int primary key
, url varchar(255)
, name varchar(255)
, has_children boolean
, parent_id int 
, level int
, FOREIGN KEY(parent_id) REFERENCES category(id)
);

CREATE TABLE IF NOT EXISTS product(
id bigint Primary key,
name text,
categoryid int
);

CREATE TABLE IF NOT EXISTS productdetails(
id SERIAL PRIMARY KEY,
productid bigint,
totalAvailableQuantity int,
description text,
orders int,
storeid bigint,
itemWishedCount int,
fetchTime timestamp without time zone default now(),
FOREIGN KEY(productid) REFERENCES product(id),
FOREIGN KEY(storeid) REFERENCES store(id)
);

CREATE TABLE IF NOT EXISTS productratings(
id SERIAL PRIMARY KEY,
productid bigint,
averageStar double precision,
totalStartCount int,
fiveStarCount int,
fourStarCount int,
threeStarCount int,
twoStarCount int,
oneStarCount int,
averageStarPercent double precision,
fiveStarPercent double precision,
fourStarPercent double precision,
threeStarPercent double precision,
twoStarPercent double precision,
oneStarPercent double precision,
ratingDisplayed boolean,
fetchTime timestamp without time zone default now(),
FOREIGN KEY(productid) REFERENCES product(id)
);
create unique index IF NOT EXISTS productratings_productid_totalStartCount on productratings(productid, totalStartCount);


CREATE TABLE IF NOT EXISTS productreviews(
id SERIAL PRIMARY KEY,
productid bigint,
name text,
displayName text,
country varchar(2),
rating int,
date timestamp without time zone,
review text,
usefullCount int,
uselessCount int,
additionalFeedback text,
additionalFeedbackDate timestamp without time zone,
feedbackId bigint,
url text,
fetchTime timestamp without time zone default now(),
FOREIGN KEY(productid) REFERENCES product(id),
FOREIGN KEY(country) REFERENCES country(iso)
);
Create unique index IF NOT EXISTS productreviews_productid_feedbackId on productreviews(productid, feedbackId);

CREATE TABLE IF NOT EXISTS reviewimages(
id SERIAL PRIMARY KEY,
reviewid int,
imageurl text,
fetchTime timestamp without time zone default now(),
FOREIGN KEY(reviewid) REFERENCES productreviews(id),
FOREIGN KEY(imageurl) REFERENCES image(url)
);
Create unique index IF NOT EXISTS reviewimages_reviewid_imageurl on reviewimages(reviewid, imageurl);

CREATE TABLE IF NOT EXISTS reviewInformationTypes(
informationTypeId int PRIMARY KEY,
inforationType VARCHAR(255)
);
Create unique index IF NOT EXISTS reviewInformationTypes_informationTypeId_inforationType on reviewInformationTypes(informationTypeId, inforationType);



CREATE TABLE IF NOT EXISTS reviewInformation(
reviewid int,
informationTypeId int,
informationValue text,
fetchTime timestamp without time zone default now(),
FOREIGN KEY(reviewid) REFERENCES productreviews(id),
FOREIGN KEY(informationTypeId) REFERENCES reviewInformationTypes(informationTypeId)
);
Create unique index reviewInformation_reviewid_information_type_information_value on reviewInformation(reviewid, informationTypeId, informationValue);


CREATE TABLE IF NOT EXISTS country (
  iso char(2) NOT NULL,
  name varchar(80) NOT NULL,
  nicename varchar(80) NOT NULL,
  iso3 char(3) DEFAULT NULL,
  numcode smallint DEFAULT NULL,
  phonecode int NOT NULL,
  PRIMARY KEY (iso)
);




CREATE TABLE IF NOT EXISTS productimages(
id SERIAL PRIMARY KEY,
productid bigint,
url text,
imageNo int,
fetchTime timestamp without time zone default now(),
FOREIGN KEY(url) REFERENCES image(url)
);
Create unique index IF NOT EXISTS productimages_productid_url_imageNo on productimages(productid, url, imageNo);

CREATE TABLE IF NOT EXISTS productoptionTypes(
id bigint PRIMARY KEY,
name varchar(255)
);

CREATE TABLE IF NOT EXISTS productoptionTypesOptions(
id serial PRIMARY KEY,
typesOptionsId bigint,
optionTypeId bigint,
name varchar(255),
FOREIGN KEY(optionTypeId) REFERENCES productoptionTypes(id)
);
create index IF NOT EXISTS productoptionTypesOptions_typesOptionsId_optionTypeId_name on productoptionTypesOptions(typesOptionsId, optionTypeId, name);



CREATE TABLE IF NOT EXISTS productOptions(
id Serial PRIMARY KEY,
skuId bigint,
productid bigint,
optionTypeId bigint,
optionTypeIdOption bigint,
imageUrl text,
fetchTime timestamp without time zone default now(),
FOREIGN KEY(productid) REFERENCES product(id),
FOREIGN KEY(optionTypeId) REFERENCES productoptionTypes(id),
FOREIGN KEY(optionTypeIdOption) REFERENCES productoptionTypesOptions(id),
FOREIGN KEY(imageUrl) REFERENCES image(url)
);
Create unique index IF NOT EXISTS productOptions_productid_optionTypeId_optionTypeIdOption on productOptions(productid, optionTypeId, optionTypeIdOption);

CREATE TABLE IF NOT EXISTS productoptionprices(
productoptionsid bigint,
availableQuantity int,
originalPrice double precision,
salePrice double precision,
fetchTime timestamp without time zone default now(),
FOREIGN KEY(productoptionsid) REFERENCES productOptions(id)
);

CREATE TABLE IF NOT EXISTS attributeTypes(
id bigint PRIMARY KEY,
name text
);

CREATE TABLE IF NOT EXISTS attributeValues(
id SERIAL PRIMARY KEY,
attributeValueId bigint,
attributeTypeId bigint,
value text,
FOREIGN KEY(attributeTypeId) REFERENCES attributeTypes(id)
);
CREATE unique index IF NOT EXISTS attributeValues_attributeValueId_attributeTypeId_value on attributeValues(attributeValueId, attributeTypeId, value);

CREATE TABLE IF NOT EXISTS productAttributes(
id bigint PRIMARY KEY,
productid bigint,
attributeTypeId bigint,
isPredefinedAttribute boolean,
attrName text,
attributeValueId bigint,
isPredefinedAttributeValue boolean,
attrvalue text,
fetchTime timestamp without time zone default now(),
FOREIGN KEY(productid) REFERENCES product(id),
FOREIGN KEY(attributeTypeId) REFERENCES attributeTypes(id),
FOREIGN KEY(attributeValueId) REFERENCES attributeValues(id)
);

CREATE TABLE IF NOT EXISTS productPrices(
id SERIAL PRIMARY KEY,
productid bigint,
availableQuantity int,
minOriginalPrice double precision,
maxOriginalPrice double precision,
minSalePrice double precision,
maxSalePrice double precision,
currency varchar(3),
fetchTime timestamp without time zone default now(),
FOREIGN KEY(productid) REFERENCES product(id)
);


CREATE TABLE store(
            id bigint Primary key,
            name text,
            url text,
            aliMemberId bigint,
            companyId bigint,
            followerCount bigint,
            rating double precision,
            ratingCount int,
            openTime date,
            openedYear int,
            topRatedSeller boolean,
            fetchTime timestamp without time zone default now()
            );

CREATE TABLE image(
            url Varchar(999) Primary key,
            imgWidth int,
            imgHeight int,
            imgType Varchar(255)
            );
CREATE TABLE video(
            id bigint Primary key,
            url Text,
            duration Text,
            ratio Text
            );
CREATE TABLE sellingPoint(
            id bigint Primary key,
            tagStyle json,
            displayTagType text,
            tagText text,
            tagImgWidth int,
            tagImgHeight int,
            tagImgUrl text
            );
CREATE TABLE productCategory(
            id SERIAL PRIMARY KEY,
            productid bigint,
            categoryid int,
            page int,
            pagerank int,
            totalrank int,
            originalPrice double precision,
            salePrice double precision,
            currency Varchar(255),
            starRating double precision,
            productUrl text,
            pageUrl text,
            previewImageUrl Varchar(999),
            saleMode text,
            singlePieceSaleSingularUnit text,
            pieceSaleComplexUnit text,
            packagingSaleUnit text,
            leastPackagingNum int,
            storeid bigint,
            videoid bigint,
            lunchtime timestamp without time zone,
            postCategoryid int,
            soldAmount bigint,
            fetchTime timestamp without time zone default now(),
            FOREIGN KEY(productid) REFERENCES product(id),
            FOREIGN KEY(categoryid) REFERENCES category(id),
            FOREIGN KEY(previewImageUrl) REFERENCES image(url),
            FOREIGN KEY(storeid) REFERENCES store(id),
            FOREIGN KEY(videoid) REFERENCES video(id),
            );
CREATE TABLE productCategorySellingPoints(
            
            productCategoryId bigint,
            sellingPointId bigint,
            position int,
            group_no int,
            FOREIGN KEY(productCategoryId) REFERENCES productCategory(id),
            FOREIGN KEY(sellingPointId) REFERENCES sellingPoint(id)
            );
           

            Create unique index productCategorySellingPoints_productCategoryId_sellingPointId_position_group_no_index on productCategorySellingPoints(productCategoryId,sellingPointId,position,group_no);



INSERT INTO country (iso, name, nicename, iso3, numcode, phonecode) VALUES
('AF', 'AFGHANISTAN', 'Afghanistan', 'AFG', 4, 93),
('AL', 'ALBANIA', 'Albania', 'ALB', 8, 355),
('DZ', 'ALGERIA', 'Algeria', 'DZA', 12, 213),
('AS', 'AMERICAN SAMOA', 'American Samoa', 'ASM', 16, 1684),
('AD', 'ANDORRA', 'Andorra', 'AND', 20, 376),
('AO', 'ANGOLA', 'Angola', 'AGO', 24, 244),
('AI', 'ANGUILLA', 'Anguilla', 'AIA', 660, 1264),
('AQ', 'ANTARCTICA', 'Antarctica', 'ATA', 10, 0),
('AG', 'ANTIGUA AND BARBUDA', 'Antigua and Barbuda', 'ATG', 28, 1268),
('AR', 'ARGENTINA', 'Argentina', 'ARG', 32, 54),
('AM', 'ARMENIA', 'Armenia', 'ARM', 51, 374),
('AW', 'ARUBA', 'Aruba', 'ABW', 533, 297),
('AU', 'AUSTRALIA', 'Australia', 'AUS', 36, 61),
('AT', 'AUSTRIA', 'Austria', 'AUT', 40, 43),
('AZ', 'AZERBAIJAN', 'Azerbaijan', 'AZE', 31, 994),
('BS', 'BAHAMAS', 'Bahamas', 'BHS', 44, 1242),
('BH', 'BAHRAIN', 'Bahrain', 'BHR', 48, 973),
('BD', 'BANGLADESH', 'Bangladesh', 'BGD', 50, 880),
('BB', 'BARBADOS', 'Barbados', 'BRB', 52, 1246),
('BY', 'BELARUS', 'Belarus', 'BLR', 112, 375),
('BE', 'BELGIUM', 'Belgium', 'BEL', 56, 32),
('BZ', 'BELIZE', 'Belize', 'BLZ', 84, 501),
('BJ', 'BENIN', 'Benin', 'BEN', 204, 229),
('BM', 'BERMUDA', 'Bermuda', 'BMU', 60, 1441),
('BT', 'BHUTAN', 'Bhutan', 'BTN', 64, 975),
('BO', 'BOLIVIA', 'Bolivia', 'BOL', 68, 591),
('BA', 'BOSNIA AND HERZEGOVINA', 'Bosnia and Herzegovina', 'BIH', 70, 387),
('BW', 'BOTSWANA', 'Botswana', 'BWA', 72, 267),
('BV', 'BOUVET ISLAND', 'Bouvet Island', 'BVT', 74, 0),
('BR', 'BRAZIL', 'Brazil', 'BRA', 76, 55),
('IO', 'BRITISH INDIAN OCEAN TERRITORY', 'British Indian Ocean Territory', 'IOT', 86, 246),
('BN', 'BRUNEI DARUSSALAM', 'Brunei Darussalam', 'BRN', 96, 673),
('BG', 'BULGARIA', 'Bulgaria', 'BGR', 100, 359),
('BF', 'BURKINA FASO', 'Burkina Faso', 'BFA', 854, 226),
('BI', 'BURUNDI', 'Burundi', 'BDI', 108, 257),
('KH', 'CAMBODIA', 'Cambodia', 'KHM', 116, 855),
('CM', 'CAMEROON', 'Cameroon', 'CMR', 120, 237),
('CA', 'CANADA', 'Canada', 'CAN', 124, 1),
('CV', 'CAPE VERDE', 'Cape Verde', 'CPV', 132, 238),
('KY', 'CAYMAN ISLANDS', 'Cayman Islands', 'CYM', 136, 1345),
('CF', 'CENTRAL AFRICAN REPUBLIC', 'Central African Republic', 'CAF', 140, 236),
('TD', 'CHAD', 'Chad', 'TCD', 148, 235),
('CL', 'CHILE', 'Chile', 'CHL', 152, 56),
('CN', 'CHINA', 'China', 'CHN', 156, 86),
('CX', 'CHRISTMAS ISLAND', 'Christmas Island', 'CXR', 162, 61),
('CC', 'COCOS (KEELING) ISLANDS', 'Cocos (Keeling) Islands', NULL, NULL, 672),
('CO', 'COLOMBIA', 'Colombia', 'COL', 170, 57),
('KM', 'COMOROS', 'Comoros', 'COM', 174, 269),
('CG', 'CONGO', 'Congo', 'COG', 178, 242),
('CD', 'CONGO, THE DEMOCRATIC REPUBLIC OF THE', 'Congo, the Democratic Republic of the', 'COD', 180, 242),
('CK', 'COOK ISLANDS', 'Cook Islands', 'COK', 184, 682),
('CR', 'COSTA RICA', 'Costa Rica', 'CRI', 188, 506),
('CI', 'COTE D''IVOIRE', 'Cote D''Ivoire', 'CIV', 384, 225),
('HR', 'CROATIA', 'Croatia', 'HRV', 191, 385),
('CU', 'CUBA', 'Cuba', 'CUB', 192, 53),
('CY', 'CYPRUS', 'Cyprus', 'CYP', 196, 357),
('CZ', 'CZECHIA', 'Czech Republic', 'CZE', 203, 420),
('DK', 'DENMARK', 'Denmark', 'DNK', 208, 45),
('DJ', 'DJIBOUTI', 'Djibouti', 'DJI', 262, 253),
('DM', 'DOMINICA', 'Dominica', 'DMA', 212, 1767),
('DO', 'DOMINICAN REPUBLIC', 'Dominican Republic', 'DOM', 214, 1),
('EC', 'ECUADOR', 'Ecuador', 'ECU', 218, 593),
('EG', 'EGYPT', 'Egypt', 'EGY', 818, 20),
('SV', 'EL SALVADOR', 'El Salvador', 'SLV', 222, 503),
('GQ', 'EQUATORIAL GUINEA', 'Equatorial Guinea', 'GNQ', 226, 240),
('ER', 'ERITREA', 'Eritrea', 'ERI', 232, 291),
('EE', 'ESTONIA', 'Estonia', 'EST', 233, 372),
('ET', 'ETHIOPIA', 'Ethiopia', 'ETH', 231, 251),
('FK', 'FALKLAND ISLANDS (MALVINAS)', 'Falkland Islands (Malvinas)', 'FLK', 238, 500),
('FO', 'FAROE ISLANDS', 'Faroe Islands', 'FRO', 234, 298),
('FJ', 'FIJI', 'Fiji', 'FJI', 242, 679),
('FI', 'FINLAND', 'Finland', 'FIN', 246, 358),
('FR', 'FRANCE', 'France', 'FRA', 250, 33),
('GF', 'FRENCH GUIANA', 'French Guiana', 'GUF', 254, 594),
('PF', 'FRENCH POLYNESIA', 'French Polynesia', 'PYF', 258, 689),
('TF', 'FRENCH SOUTHERN TERRITORIES', 'French Southern Territories', 'ATF', 260, 0),
('GA', 'GABON', 'Gabon', 'GAB', 266, 241),
('GM', 'GAMBIA', 'Gambia', 'GMB', 270, 220),
('GE', 'GEORGIA', 'Georgia', 'GEO', 268, 995),
('DE', 'GERMANY', 'Germany', 'DEU', 276, 49),
('GH', 'GHANA', 'Ghana', 'GHA', 288, 233),
('GI', 'GIBRALTAR', 'Gibraltar', 'GIB', 292, 350),
('GR', 'GREECE', 'Greece', 'GRC', 300, 30),
('GL', 'GREENLAND', 'Greenland', 'GRL', 304, 299),
('GD', 'GRENADA', 'Grenada', 'GRD', 308, 1473),
('GP', 'GUADELOUPE', 'Guadeloupe', 'GLP', 312, 590),
('GU', 'GUAM', 'Guam', 'GUM', 316, 1671),
('GT', 'GUATEMALA', 'Guatemala', 'GTM', 320, 502),
('GN', 'GUINEA', 'Guinea', 'GIN', 324, 224),
('GW', 'GUINEA-BISSAU', 'Guinea-Bissau', 'GNB', 624, 245),
('GY', 'GUYANA', 'Guyana', 'GUY', 328, 592),
('HT', 'HAITI', 'Haiti', 'HTI', 332, 509),
('HM', 'HEARD ISLAND AND MCDONALD ISLANDS', 'Heard Island and Mcdonald Islands', 'HMD', 334, 0),
('VA', 'HOLY SEE (VATICAN CITY STATE)', 'Holy See (Vatican City State)', 'VAT', 336, 39),
('HN', 'HONDURAS', 'Honduras', 'HND', 340, 504),
('HK', 'HONG KONG', 'Hong Kong', 'HKG', 344, 852),
('HU', 'HUNGARY', 'Hungary', 'HUN', 348, 36),
('IS', 'ICELAND', 'Iceland', 'ISL', 352, 354),
('IN', 'INDIA', 'India', 'IND', 356, 91),
('ID', 'INDONESIA', 'Indonesia', 'IDN', 360, 62),
('IR', 'IRAN, ISLAMIC REPUBLIC OF', 'Iran, Islamic Republic of', 'IRN', 364, 98),
('IQ', 'IRAQ', 'Iraq', 'IRQ', 368, 964),
('IE', 'IRELAND', 'Ireland', 'IRL', 372, 353),
('IL', 'ISRAEL', 'Israel', 'ISR', 376, 972),
('IT', 'ITALY', 'Italy', 'ITA', 380, 39),
('JM', 'JAMAICA', 'Jamaica', 'JAM', 388, 1876),
('JP', 'JAPAN', 'Japan', 'JPN', 392, 81),
('JO', 'JORDAN', 'Jordan', 'JOR', 400, 962),
('KZ', 'KAZAKHSTAN', 'Kazakhstan', 'KAZ', 398, 7),
('KE', 'KENYA', 'Kenya', 'KEN', 404, 254),
('KI', 'KIRIBATI', 'Kiribati', 'KIR', 296, 686),
('KP', 'KOREA, DEMOCRATIC PEOPLE''S REPUBLIC OF', 'Korea, Democratic People''s Republic of', 'PRK', 408, 850),
('KR', 'KOREA, REPUBLIC OF', 'Korea, Republic of', 'KOR', 410, 82),
('KW', 'KUWAIT', 'Kuwait', 'KWT', 414, 965),
('KG', 'KYRGYZSTAN', 'Kyrgyzstan', 'KGZ', 417, 996),
('LA', 'LAO PEOPLE''S DEMOCRATIC REPUBLIC', 'Lao People''s Democratic Republic', 'LAO', 418, 856),
('LV', 'LATVIA', 'Latvia', 'LVA', 428, 371),
('LB', 'LEBANON', 'Lebanon', 'LBN', 422, 961),
('LS', 'LESOTHO', 'Lesotho', 'LSO', 426, 266),
('LR', 'LIBERIA', 'Liberia', 'LBR', 430, 231),
('LY', 'LIBYAN ARAB JAMAHIRIYA', 'Libyan Arab Jamahiriya', 'LBY', 434, 218),
('LI', 'LIECHTENSTEIN', 'Liechtenstein', 'LIE', 438, 423),
('LT', 'LITHUANIA', 'Lithuania', 'LTU', 440, 370),
('LU', 'LUXEMBOURG', 'Luxembourg', 'LUX', 442, 352),
('MO', 'MACAO', 'Macao', 'MAC', 446, 853),
('MK', 'NORTH MACEDONIA', 'North Macedonia', 'MKD', 807, 389),
('MG', 'MADAGASCAR', 'Madagascar', 'MDG', 450, 261),
('MW', 'MALAWI', 'Malawi', 'MWI', 454, 265),
('MY', 'MALAYSIA', 'Malaysia', 'MYS', 458, 60),
('MV', 'MALDIVES', 'Maldives', 'MDV', 462, 960),
('ML', 'MALI', 'Mali', 'MLI', 466, 223),
('MT', 'MALTA', 'Malta', 'MLT', 470, 356),
('MH', 'MARSHALL ISLANDS', 'Marshall Islands', 'MHL', 584, 692),
('MQ', 'MARTINIQUE', 'Martinique', 'MTQ', 474, 596),
('MR', 'MAURITANIA', 'Mauritania', 'MRT', 478, 222),
('MU', 'MAURITIUS', 'Mauritius', 'MUS', 480, 230),
('YT', 'MAYOTTE', 'Mayotte', 'MYT', 175, 269),
('MX', 'MEXICO', 'Mexico', 'MEX', 484, 52),
('FM', 'MICRONESIA, FEDERATED STATES OF', 'Micronesia, Federated States of', 'FSM', 583, 691),
('MD', 'MOLDOVA, REPUBLIC OF', 'Moldova, Republic of', 'MDA', 498, 373),
('MC', 'MONACO', 'Monaco', 'MCO', 492, 377),
('MN', 'MONGOLIA', 'Mongolia', 'MNG', 496, 976),
('MS', 'MONTSERRAT', 'Montserrat', 'MSR', 500, 1664),
('MA', 'MOROCCO', 'Morocco', 'MAR', 504, 212),
('MZ', 'MOZAMBIQUE', 'Mozambique', 'MOZ', 508, 258),
('MM', 'MYANMAR', 'Myanmar', 'MMR', 104, 95),
('NA', 'NAMIBIA', 'Namibia', 'NAM', 516, 264),
('NR', 'NAURU', 'Nauru', 'NRU', 520, 674),
('NP', 'NEPAL', 'Nepal', 'NPL', 524, 977),
('NL', 'NETHERLANDS', 'Netherlands', 'NLD', 528, 31),
('AN', 'NETHERLANDS ANTILLES', 'Netherlands Antilles', 'ANT', 530, 599),
('NC', 'NEW CALEDONIA', 'New Caledonia', 'NCL', 540, 687),
('NZ', 'NEW ZEALAND', 'New Zealand', 'NZL', 554, 64),
('NI', 'NICARAGUA', 'Nicaragua', 'NIC', 558, 505),
('NE', 'NIGER', 'Niger', 'NER', 562, 227),
('NG', 'NIGERIA', 'Nigeria', 'NGA', 566, 234),
('NU', 'NIUE', 'Niue', 'NIU', 570, 683),
('NF', 'NORFOLK ISLAND', 'Norfolk Island', 'NFK', 574, 672),
('MP', 'NORTHERN MARIANA ISLANDS', 'Northern Mariana Islands', 'MNP', 580, 1670),
('NO', 'NORWAY', 'Norway', 'NOR', 578, 47),
('OM', 'OMAN', 'Oman', 'OMN', 512, 968),
('PK', 'PAKISTAN', 'Pakistan', 'PAK', 586, 92),
('PW', 'PALAU', 'Palau', 'PLW', 585, 680),
('PS', 'PALESTINIAN TERRITORY, OCCUPIED', 'Palestinian Territory, Occupied', NULL, NULL, 970),
('PA', 'PANAMA', 'Panama', 'PAN', 591, 507),
('PG', 'PAPUA NEW GUINEA', 'Papua New Guinea', 'PNG', 598, 675),
('PY', 'PARAGUAY', 'Paraguay', 'PRY', 600, 595),
('PE', 'PERU', 'Peru', 'PER', 604, 51),
('PH', 'PHILIPPINES', 'Philippines', 'PHL', 608, 63),
('PN', 'PITCAIRN', 'Pitcairn', 'PCN', 612, 0),
('PL', 'POLAND', 'Poland', 'POL', 616, 48),
('PT', 'PORTUGAL', 'Portugal', 'PRT', 620, 351),
('PR', 'PUERTO RICO', 'Puerto Rico', 'PRI', 630, 1787),
('QA', 'QATAR', 'Qatar', 'QAT', 634, 974),
('RE', 'REUNION', 'Reunion', 'REU', 638, 262),
('RO', 'ROMANIA', 'Romania', 'ROU', 642, 40),
('RU', 'RUSSIAN FEDERATION', 'Russian Federation', 'RUS', 643, 7),
('RW', 'RWANDA', 'Rwanda', 'RWA', 646, 250),
('SH', 'SAINT HELENA', 'Saint Helena', 'SHN', 654, 290),
('KN', 'SAINT KITTS AND NEVIS', 'Saint Kitts and Nevis', 'KNA', 659, 1869),
('LC', 'SAINT LUCIA', 'Saint Lucia', 'LCA', 662, 1758),
('PM', 'SAINT PIERRE AND MIQUELON', 'Saint Pierre and Miquelon', 'SPM', 666, 508),
('VC', 'SAINT VINCENT AND THE GRENADINES', 'Saint Vincent and the Grenadines', 'VCT', 670, 1784),
('WS', 'SAMOA', 'Samoa', 'WSM', 882, 684),
('SM', 'SAN MARINO', 'San Marino', 'SMR', 674, 378),
('ST', 'SAO TOME AND PRINCIPE', 'Sao Tome and Principe', 'STP', 678, 239),
('SA', 'SAUDI ARABIA', 'Saudi Arabia', 'SAU', 682, 966),
('SN', 'SENEGAL', 'Senegal', 'SEN', 686, 221),
('RS', 'SERBIA', 'Serbia', 'SRB', 688, 381),
('SC', 'SEYCHELLES', 'Seychelles', 'SYC', 690, 248),
('SL', 'SIERRA LEONE', 'Sierra Leone', 'SLE', 694, 232),
('SG', 'SINGAPORE', 'Singapore', 'SGP', 702, 65),
('SK', 'SLOVAKIA', 'Slovakia', 'SVK', 703, 421),
('SI', 'SLOVENIA', 'Slovenia', 'SVN', 705, 386),
('SB', 'SOLOMON ISLANDS', 'Solomon Islands', 'SLB', 90, 677),
('SO', 'SOMALIA', 'Somalia', 'SOM', 706, 252),
('ZA', 'SOUTH AFRICA', 'South Africa', 'ZAF', 710, 27),
('GS', 'SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS', 'South Georgia and the South Sandwich Islands', 'SGS', 239, 0),
('ES', 'SPAIN', 'Spain', 'ESP', 724, 34),
('LK', 'SRI LANKA', 'Sri Lanka', 'LKA', 144, 94),
('SD', 'SUDAN', 'Sudan', 'SDN', 736, 249),
('SR', 'SURINAME', 'Suriname', 'SUR', 740, 597),
('SJ', 'SVALBARD AND JAN MAYEN', 'Svalbard and Jan Mayen', 'SJM', 744, 47),
('SZ', 'SWAZILAND', 'Swaziland', 'SWZ', 748, 268),
('SE', 'SWEDEN', 'Sweden', 'SWE', 752, 46),
('CH', 'SWITZERLAND', 'Switzerland', 'CHE', 756, 41),
('SY', 'SYRIAN ARAB REPUBLIC', 'Syrian Arab Republic', 'SYR', 760, 963),
('TW', 'TAIWAN, PROVINCE OF CHINA', 'Taiwan, Province of China', 'TWN', 158, 886),
('TJ', 'TAJIKISTAN', 'Tajikistan', 'TJK', 762, 992),
('TZ', 'TANZANIA, UNITED REPUBLIC OF', 'Tanzania, United Republic of', 'TZA', 834, 255),
('TH', 'THAILAND', 'Thailand', 'THA', 764, 66),
('TL', 'TIMOR-LESTE', 'Timor-Leste', 'TLS', 626, 670),
('TG', 'TOGO', 'Togo', 'TGO', 768, 228),
('TK', 'TOKELAU', 'Tokelau', 'TKL', 772, 690),
('TO', 'TONGA', 'Tonga', 'TON', 776, 676),
('TT', 'TRINIDAD AND TOBAGO', 'Trinidad and Tobago', 'TTO', 780, 1868),
('TN', 'TUNISIA', 'Tunisia', 'TUN', 788, 216),
('TR', 'TURKEY', 'Turkey', 'TUR', 792, 90),
('TM', 'TURKMENISTAN', 'Turkmenistan', 'TKM', 795, 993),
('TC', 'TURKS AND CAICOS ISLANDS', 'Turks and Caicos Islands', 'TCA', 796, 1649),
('TV', 'TUVALU', 'Tuvalu', 'TUV', 798, 688),
('UG', 'UGANDA', 'Uganda', 'UGA', 800, 256),
('UA', 'UKRAINE', 'Ukraine', 'UKR', 804, 380),
('AE', 'UNITED ARAB EMIRATES', 'United Arab Emirates', 'ARE', 784, 971),
('GB', 'UNITED KINGDOM', 'United Kingdom', 'GBR', 826, 44),
('UK', 'UNITED KINGDOM', 'United Kingdom', 'GBR', 826, 44),
('US', 'UNITED STATES', 'United States', 'USA', 840, 1),
('UM', 'UNITED STATES MINOR OUTLYING ISLANDS', 'United States Minor Outlying Islands', 'UMI', 581, 1),
('UY', 'URUGUAY', 'Uruguay', 'URY', 858, 598),
('UZ', 'UZBEKISTAN', 'Uzbekistan', 'UZB', 860, 998),
('VU', 'VANUATU', 'Vanuatu', 'VUT', 548, 678),
('VE', 'VENEZUELA', 'Venezuela', 'VEN', 862, 58),
('VN', 'VIET NAM', 'Viet Nam', 'VNM', 704, 84),
('VG', 'VIRGIN ISLANDS, BRITISH', 'Virgin Islands, British', 'VGB', 92, 1284),
('VI', 'VIRGIN ISLANDS, U.S.', 'Virgin Islands, U.s.', 'VIR', 850, 1340),
('WF', 'WALLIS AND FUTUNA', 'Wallis and Futuna', 'WLF', 876, 681),
('EH', 'WESTERN SAHARA', 'Western Sahara', 'ESH', 732, 212),
('YE', 'YEMEN', 'Yemen', 'YEM', 887, 967),
('ZM', 'ZAMBIA', 'Zambia', 'ZMB', 894, 260),
('ZW', 'ZIMBABWE', 'Zimbabwe', 'ZWE', 716, 263),
('ME', 'MONTENEGRO', 'Montenegro', 'MNE', 499, 382),
('XK', 'KOSOVO', 'Kosovo', 'XKX', 0, 383),
('AX', 'ALAND ISLANDS', 'Aland Islands', 'ALA', '248', '358'),
('BQ', 'BONAIRE, SINT EUSTATIUS AND SABA', 'Bonaire, Sint Eustatius and Saba', 'BES', '535', '599'),
('CW', 'CURACAO', 'Curacao', 'CUW', '531', '599'),
('GG', 'GUERNSEY', 'Guernsey', 'GGY', '831', '44'),
('IM', 'ISLE OF MAN', 'Isle of Man', 'IMN', '833', '44'),
('JE', 'JERSEY', 'Jersey', 'JEY', '832', '44'),
('BL', 'SAINT BARTHELEMY', 'Saint Barthelemy', 'BLM', '652', '590'),
('MF', 'SAINT MARTIN', 'Saint Martin', 'MAF', '663', '590'),
('SX', 'SINT MAARTEN', 'Sint Maarten', 'SXM', '534', '1'),
('SS', 'SOUTH SUDAN', 'South Sudan', 'SSD', '728', '211');
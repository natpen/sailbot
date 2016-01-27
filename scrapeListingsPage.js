var request  = require('request');
var cheerio  = require('cheerio');
var fs       = require('fs');
var _        = require('lodash');
var moment   = require('moment');

module.exports = function($) {
	
	var listings = [];

	$('tr').each(function(i, element) {
		var linkElement = $('a', element);
		if (linkElement.length === 0) return;
		var linkUrl = $(linkElement).attr('href');

		linkUrl = linkUrl.replace(/\t/g, '').replace(/\r?\n/g, '');

		if (!linkUrl || !_.startsWith(linkUrl, 'http://www.sailboatlistings.com/view') || _.findIndex(listings, { url: linkUrl }) !== -1) return;

		var lengthText = $($('span.sailvk', element)[0]).text().replace('\'', '');
		var length = parseFloat(lengthText);

		var priceText = $($('span.sailvk', element)[8]).text().replace(/\$|,/g, '');
		var price = parseInt(priceText);

		var yearText = $($('span.sailvk', element)[3]).text();
		var year = parseInt(yearText);
		
		var detailsText = $('span.details', element).text();
		var dateAddedMatch = detailsText.match(/\d{1,2}-\w{3}-\d{4}/);
		
		var listing = {
			url: linkUrl,
			dateAdded: dateAddedMatch ? moment(new Date(dateAddedMatch[0])).format() : '',
			title: $(linkElement).first().text(),
			length: length,
			price: price,
			year: year
		};
		
		return listings.push(listing);
	});

	return listings;
}
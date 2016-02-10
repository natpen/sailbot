var request            = require('request');
var cheerio            = require('cheerio');
var fs                 = require('fs');
var moment             = require('moment');
var scrapeListingsPage = require('./scrapeListingsPage');
var nodemailer         = require('nodemailer');
var dotenv             = require('dotenv');
var prettyjson         = require('prettyjson');

dotenv.load();

var searchUrl = 'http://www.sailboatlistings.com/cgi-bin/saildata/db.cgi?db=default&uid=default&view_records=1&ID=*&sb=date&so=descend&nh={{page}}';

var lastSearchDate = moment().subtract(1, 'month'); // if no lastSearchDate found, default to a month ago

return setTimeout(function() { return main(); }, 30000);

function main() {
	return fs.access('.lastSearchDate', fs.F_OK | fs.R_OK, function(err) {
		if (!err) lastSearchDate = moment(new Date(fs.readFileSync('.lastSearchDate')));

		console.log('\n[' + moment().format(), '] Starting new run...');
		console.log('Last search date:', lastSearchDate.format());
		console.log('Accepting matches posted on or after:', lastSearchDate.format('D MMM YYYY'));
		
		// sailboatlistings.com reports added dates without times, so when parsed, they'll all end up
		// at midnight. let's subtract a day from lastSearchDate so that we don't miss anything.
		// e.g., we search at 8AM yesterday, then 8AM today. something that got added at 9AM yesterday
		// would get parsed as midnight yesterday, so today's search would think we've already processed
		// it, when in fact we haven't. this strategy adds risk of duping anything between midnight and
		// runtime, so you should try and run this as early in the day as possible to minimize that
		// risk.
		lastSearchDate.subtract(1, 'day');

		return getListings(1, [], function(err, listings) {
			if (err) throw err;

			// update lastSearchDate after a success
			fs.writeFileSync('.lastSearchDate', moment().format());

			var filteredListings = listings.filter(function(listing) {
				return listingMatchesCriteria(listing);
			});

			console.log(filteredListings.length + ' new matches.')

			if (filteredListings.length === 0) return;

			// TODO: send email digest if necessary
			return sendEmailDigest(filteredListings, function(err) {
				if (err) return console.log('Error sending email digest:', err);

				return console.log('Email digest sent.')
			});
		});
	});
}

function getListings(page, listings, cb) {

	var url = searchUrl.replace('{{page}}', page);

	// let's be nice and identify ourselves with a unique user agent
	var requestOptions = {
		url: url,
		headers: {
			'User-Agent': 'sailbot'
		}
	};
	return request(requestOptions, function(err, resp, body) {
		if (err) { return cb(err); }
		$ = cheerio.load(body);

		var currentPageListings = scrapeListingsPage($);
		var currentPageOldestListingDate = currentPageListings.reduce(function(prev, curr) {
			var currDate = moment(curr.dateAdded);
			return currDate < prev ? currDate : prev; 
		}, moment().add(1, 'month'));
		// if oldest on page > lastSearchDate, don't keep going
		if (currentPageOldestListingDate < lastSearchDate) {
			var filteredCurrentPageListings = currentPageListings.filter(function(listing) {
				return moment(listing.dateAdded) > lastSearchDate;
			});
			console.log('Page ' + page + ' (' + filteredCurrentPageListings.length + '/' + currentPageListings.length + ' listings processed) [last page searched]');
			return cb(null, listings.concat(filteredCurrentPageListings));
		} else {
			console.log('Page ' + page + ' (' + currentPageListings.length + '/' + currentPageListings.length + ' listings processed)');

			// let's be nice and wait 30 seconds between pages. I manually checked their robots.txt, and this
			// was the longest Crawl-delay they had set for anyone. Given the number of daily additions, we're
			// generally only going to be looking at one page, so it's a bit of a non-issue.
			return setTimeout(function() {
				return getListings(page + 1, listings.concat(currentPageListings), cb);
			}, 30000);
		}
	});
}

function listingMatchesCriteria(listing) {

	// title (manufacturer)
	if (!listing.title.match(/alberg|amel|bristol|cape dory|cheoy lee|hallberg rassy|hans christian|pacific seacraft|pearson|slocum|tayana|westsail/i)) return false;

	// length
	if (listing.length < 20 || listing.length > 50) return false;

	// price
	if (!listing.price || listing.price > 80000) return false;

	// year
	// no filter on year
	
	return true;
}

function sendEmailDigest(listings, cb) {

	var transporter = nodemailer.createTransport('smtps://' + process.env.FROM_GMAIL_ADDRESS.replace('@', '%40') + ':' + process.env.FROM_GMAIL_PW + '@smtp.gmail.com');

	var mailOptions = {
		from: process.env.FROM_GMAIL_ADDRESS,
		to: process.env.TO_GMAIL_ADDRESS,
		subject: 'New Sailboat Matches!',
		text: prettyjson.render(listings, { noColor: true }),
		html: ''
	};

	return transporter.sendMail(mailOptions, function(err, info){
		if(err) return cb(err);
		return cb();
	});
}

import fs from 'fs';
import got from 'got';
import cheerio from 'cheerio';
import { argv } from 'node:process';
import figlet from 'figlet';
import chalk from 'chalk';


function main() {

	const scraper = {

		localPathName: 'images/',

		URLs: [],

		maxNumOfImgs: 0,

		downloadImg: function(url, fileName) {

			//make a request to the image article page
				got(url).then(res2 => {
					const a = cheerio.load(res2.body);
					let fullImgLink = a('a img')[0].attribs['src'];

					//make a new directory with the name informed if it doesn't exist
					if (!fs.existsSync(this.localPathName)){
					    fs.mkdirSync(this.localPathName);
					}

					//make a request to the full image page and download it
					got.stream(fullImgLink).pipe(fs.createWriteStream(this.localPathName + fileName));
					console.log(`image downloaded! file name: ${fileName}`);
					return;
				});
			
		},


		findImagesOnPage: function(url) {

			got(url).then(res => {
				const $ = cheerio.load(res.body);
				const imageList = $('.sdms-image-result');

				
				let keyword = url.split('search=')[1].split('&title')[0].replace('+', ' ');
				//check if there are images available
				try {

					let firstImage = imageList[0].attribs;
					console.log(chalk.green(`page for ${keyword} found!`));

				} catch(err) {

						console.log(chalk.red(`error. there's nothing for ${keyword} :/`));
						return;	
								
				}

				
				//if there's an image on the page, continue

				//making sure we don't exceed the maximum number of images found	
				if (this.maxNumOfImgs > imageList.length) this.maxNumOfImgs = imageList.length;

				//iterate over the links and call the download method
				for (let i = 0; i < this.maxNumOfImgs; i++) {

					let imageLink = imageList[i].attribs.href;
					let imageName = imageList[i].attribs.title.replace('File:', '');
					if (imageLink) this.downloadImg(imageLink, imageName);
					else this.maxNumOfImgs++;

				}


			});

	},


		downloadFromCategories: async function(terms) {

			await this.constructURLs(terms).then(() => {
	
				this.URLs.forEach(url => {
					this.findImagesOnPage(url);
				});
				
			});


		},

		constructURLs: async function(string){
			let keywords = string.replaceAll('-', '+').split(',');
			let urlBase1 = 'https://commons.wikimedia.org/w/index.php?search=';
			let urlBase2 = '&title=Special:MediaSearch&go=Go&type=image';
			let fullUrl;

			//iterate over each url and check if it exists
			for (let keyword of keywords) {

				fullUrl = (urlBase1 + keyword + urlBase2);
		
				try{
					await got(fullUrl).then((res) => {

						//if the page exists, add the url to the URLs array
						this.URLs.push(fullUrl);
						
					});
				} catch (error) {
					console.log(`so um.. there's an error. ${error}`);
				}
				
			}

		}

	}

	//end of object

	const commandLine = {

		//get args from the command line
		handleArgs: function() {
			let keywords = argv[2];
			let numberOfImages = argv[3];
			let pathName = argv[4];

			if (numberOfImages) scraper.maxNumOfImgs = numberOfImages;
			if (pathName) scraper.localPathName += `${pathName}/`;

			this.showBanner();
			return scraper.downloadFromCategories(keywords);


		},

		showBanner: function() {
			figlet('WIKIMEDIASCRAPER', (err, res) => {
				if (err) {
					console.log('oops, found an error :/');
					console.log(err);
					return;
				}
				console.log(chalk.green(res));
			});
		}

	}


	commandLine.handleArgs();

}


main();

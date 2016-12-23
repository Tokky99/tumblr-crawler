const request = require('request');
const rq = require("request-promise");
const jsonfile = require('jsonfile');
const chalk = require('chalk');
const fs = require("fs");
const formatData = require("./formatData");
const {cookie,headers,limit,skip} = require("../config");
const name = "follow";// store json name

fs.writeFile("./Crawler/data/video.json","",(error)=>{
	if(!error){
		console.log(chalk.blue("Clear video.json file."))
	}
})

// Get data from a single page
let errorNumber = 0;//error number
let rootID = 0;//data id
let ItemNumber = 0;//already download item number
// tumblr_[\da-z]{17}
// http://qiao815.tumblr.com/page/2
/**
 * UseUrlGetData
 * @param  {[type]} item  [description]
 * @param  {Number} page  [description]
 * @param  {Number} index [description]
 * @return {[type]}       [description]
 */
let UseUrlGetData = (item,page=1,index=skip)=>{
	return new Promise((resolve,reject)=>{
		if(item.length===index){
			// No data.
			console.log(chalk.green("complete! All gain:"+rootID));
			formatData("./Crawler/data/video.json","video");
			return null;
		}
		if(limit!==0 && ItemNumber>=limit){
			console.log(chalk.green("complete limit index:"+limit+", All gain:"+rootID));
			formatData("./Crawler/data/video.json","video");
			return null;
		}
		else{
			request({
				url:item[index].url+"page/"+page,
				headers:headers,
				gzip:true
			},(error,httpResponse,body)=>{
				if(error){
					errorNumber++;
					if(errorNumber>10){
						// Error number greater than 10 on the next
						errorNumber = 0;
						ItemNumber++;
						UseUrlGetData(item,0,++index);
						return;
					}
					UseUrlGetData(item,page,index);// continue this page
					console.log(chalk.red("In follow index:",index,"page:",page,"errorNumber:",errorNumber));
					return;
				}
				let trimData = JSON.stringify(body).replace(/\s/g,"");//Remove spaces
				let AllData = trimData.match(/tumblr_[\da-z]{17}/gi);// All video on page code
				if(!AllData){
					errorNumber = 0;
					ItemNumber++;
					UseUrlGetData(item,0,++index);
					return;
				}

				let StoreArray = [];
				for(let i=0;i<AllData.length;i++){
					jsonfile.writeFileSync("./Crawler/data/video.json", {
						id:++rootID,
						mp4Code:AllData[i],
						fullUrl:"https://vtt.tumblr.com/"+AllData[i]+".mp4#_=_",
					}, {spaces: 2,flag: 'a'})
				}
				
				console.log(chalk.green("In follow index:",index,"page:",page,",ready next page."))
				UseUrlGetData(item,++page,index);
			});
		}
	})
}

function getData(name="follow"){
	try{
		const followData = require("./data/"+name+".js");
		console.log(chalk.blue("This step will get a lot of data,So it takes a lot of time,You can open the data folder to view the video.json file."));
		return UseUrlGetData(followData);
	}
	catch(e){
		console.log(chalk.red("No this file:"+name+".js"));
		return null;
	}
}

getData();
// module.exports = getData;
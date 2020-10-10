const puppeteer = require('puppeteer');
const http = require('http');//change to https later
const fs = require('fs');
const path = require('path');
const url = require('url');
const { hostname } = require('os');

var PORT = process.env.PORT || 3000;
var HOST = hostname();


// const body = document.querySelector('.btn');
// const textarea = document.querySelector('textarea');

/**
 * scrape function is used to find the translation of parameter msg to another language
 * for now, only translating to mandarin
 * @param {string} msg 
 */
async function scrape(msg="hello"){
    var URL = 'https://translate.google.com/#view=home&op=translate&sl=en&tl=zh-CN&text=';
    let browser = await puppeteer.launch({'headless':true});
    let page = await browser.newPage();
    URL+=encodeURIComponent(msg);//add message to the URL to be scraped

    await page.goto(URL,{waitUntil:'networkidle2'});
    /*networkidle2 waits until there are no more than 2 network connections for
    at least half a second*/

    //translate to chinese characters and pinyin
    let result = await page.evaluate(()=>{
        return {mandarin: document.querySelector('.result-shield-container span').innerHTML,
                pinyin: document.querySelector('.tlid-result-transliteration-container .tlid-transliteration-content').innerText
                .split('\n').join('<br>')
        };
    });

    await browser.close();//close headless browser

    //add the original messsage to result and return the result.
    result['msg']=msg;
    return result;

};


/**
 * create the server
 */
let server = http.createServer(async (req,resp)=>{
    var URL = req.url.split('?')[0];//get url not including query

    //get the input value from the URL
    let inputValue=url.parse(req.url,true).query;
    inputValueGiven=Object.keys(inputValue).indexOf('input')>=0;
    inputValue = inputValueGiven?inputValue['input']:"";
    
    //get the complete path and the file extension
    let filepath = path.join(__dirname,URL=='/'?'index.html':URL);
    let extname = path.extname(filepath);

    //initial content type
    let contentType = 'text/html; charset=UTF-8';

    //check ext and set content type
    switch(extname){
        case '.js':
            contentType='text/javascript';
            break;
        case '.css':
            contentType='text/css';
            break;
        case '.json':
            contentType='application/json';
            break;
        case '.png':
            contentType='image/png';
            break;
        case '.jpg':
            contentType='image/jpg';
            break;
    }

    if (extname=='.ico'){
        return;//ignore icons for now
    }
    
    //update header
    await resp.writeHead(200,{'Content-Type':contentType});

    //scrape google translate to get the results if input value given
    var result="";
    if (inputValueGiven){
        result = await scrape(inputValue);//message goes here!
    }

    //save results to json file (will be blank if no input value was given)
    await fs.writeFile('./translate.json',JSON.stringify(result),err=>console.log(err));

    //respond with the file requested by client
    await fs.readFile(filepath,'utf8',(err,data)=>{
        if(err){
            console.log("error: ",err);
            return "error";
        }
        //return data;
        resp.write(data,'utf8');
        resp.end();
    });
    
    
});




server.listen(PORT);
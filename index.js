const puppeteer = require('puppeteer');
const http = require('http');//change to https later
const fs = require('fs');
const path = require('path');
const { hostname } = require('os');

var PORT = process.env.PORT || 3000;
var HOST = hostname();


// const body = document.querySelector('.btn');
// const textarea = document.querySelector('textarea');

async function scrape(msg="hello"){
    var URL = 'https://translate.google.com/#view=home&op=translate&sl=en&tl=zh-CN&text=';
    let browser = await puppeteer.launch({'headless':true});
    let page = await browser.newPage();
    //URL+=textarea.innerText;
    console.log(msg);
    URL+=msg;

    await page.goto(URL,{waitUntil:'networkidle2'});
    /*networkidle2 waits until there are no more than 2 network connections for
    at least half a second*/

    //translate to chinese characters
    let result = await page.evaluate(()=>{
        return {mandarin: document.querySelector('.result-shield-container span span').innerText,
                pinyin: document.querySelector('.tlid-result-transliteration-container .tlid-transliteration-content').innerText
        };
    });

    //get the pinion
    await browser.close();

    //console.log("mandarin: ",result.mandarin,", pinyin: ",result.pinyin);
    result['msg']=msg;
    return result;

};


let server = http.createServer(async (req,resp)=>{
    var URL = req.url;



    
    await resp.writeHead(200,{'Content-Type':'text/html; charset=UTF-8'});
    var result = await scrape("hello");
    await fs.writeFile('./translate.json',JSON.stringify(result),err=>console.log(err));
    //await resp.write([result.msg,result.pinyin,result.mandarin].join(", "));
    await fs.readFile(path.join(__dirname,'index.html'),'utf8',(err,data)=>{
        if(err){
            console.log(err);
            return "error";
        }
        //return data;
        resp.write(data,'utf8');
        resp.end();
    });
    //console.log("index: ",await index, path.join(__dirname,'index.html'));
    // await resp.write(index,'utf8',err=>console.log(err));
    // //console.log(await result.mandarin);
    // await resp.end();
    
    
});



// //usage of scrape (testing)
// let runscrape = async ()=>{
//     console.log(await scrape());
// }

server.listen(PORT);
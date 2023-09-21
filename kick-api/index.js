import puppeteerExtra from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import chromium from "@sparticuz/chromium";

export function kickChannelInfo(channels) {
    return new Promise(async (resolve, reject) => {
        try {
            puppeteerExtra.use(stealthPlugin());
            
            // for lambda
            const browser = await puppeteerExtra.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            });

            // for local
            /*
            const browser = await puppeteerExtra.launch({
                headless: "new",
                executablePath: "/Program Files/Google/Chrome/Application/chrome.exe"
            });
            */

            const page = await browser.newPage() 
            
            async function getStats(channelName) {
                await page.goto(`https://kick.com/api/v2/channels/${channelName}`);

                // checks if channel exists
                let extractedText = await page.$eval('*', (el) => el.innerText);

                if (extractedText.length == 13) return false;
                try {
                    extractedText = JSON.parse(extractedText)
                } catch(err) {
                    return false;
                }
                

                let infoObject = {
                    name: extractedText.slug,
                    displayName: extractedText.user.username,
                    profileImageURL: extractedText.user.profile_pic,
                    streamURL: `https://kick.com/${channelName}`,
                    verified: extractedText.verified,
                    followers: extractedText.followers_count,
                    live: extractedText.livestream != null,
                    viewers: extractedText.livestream != null ? extractedText.livestream.viewer_count : 0,
                    streamTitle: extractedText.livestream != null ? extractedText.livestream.session_title : '',
                    catagory: extractedText.livestream != null ? extractedText.livestream.categories[0].name : '',
                    tags: extractedText.livestream != null ? extractedText.livestream.tags : [],
                    streamThumbnail: extractedText.livestream != null ? extractedText.livestream.thumbnail.url : '',
                }

                return infoObject;
            }

            let newInfoArray = [];
            for (let i = 0; i < channels.length; i++) {
                let newInfoObject = await getStats(channels[i], i)
                if (newInfoObject) newInfoArray.push(newInfoObject);   
            }

            const pages = await browser.pages();
            await Promise.all(pages.map(async (page) => page.close()));
            
            await browser.close()
            resolve(newInfoArray);
        } catch(err) {
            console.log(err);
            reject();
        }
    })
}

export const handler = async(event) => {
    let data = await kickChannelInfo(event.body);
    const response = {
        statusCode: 200,
        body: data
    };
    return response;
}

// for local
//console.log(await handler({"body": ["xqc"]}));
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin()) 
 
function kickChannelInfo(channels) {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch({headless: "new"});
            const page = await browser.newPage() 
            await page.setViewport({width: 1920, height: 919});
            
            async function getStats(channelName, index) {
                await page.goto(`https://kick.com/${channelName}`);
                if (await page.waitForSelector('.owner-avatar > div:nth-child(1) > img:nth-child(2)')) {

                    const channelStats = await page.evaluate(() => {
                        let infoObject = {
                            name: '',
                            displayName: '',
                            profileImageURL: '',
                            streamURL: '',
                            verified: false,
                            followers: 0,
                            live: false,
                            viewers: 0,
                            streamTitle: '',
                            catagory: '',
                            tags: [],
                        }

                        // getting followers
                        let followerCount = Array.from(document.querySelector('.shadow > div:nth-child(1) > div:nth-child(1) > div:nth-child(2)').textContent);
                        let followerNumArray = [];
                        for (let i = 0; i < followerCount.length; i++) {
                            if (!isNaN(followerCount[i])) {
                                followerNumArray.push(followerCount[i]);
                            }
                        }

                        infoObject.followers = parseInt(followerNumArray.join(''));

                        // getting displayName
                        let channelDisplayName = document.querySelector('.stream-username').textContent;
                        infoObject.displayName = channelDisplayName;

                        // getting verified
                        let isVerified = document.querySelector('div.w-4:nth-child(2) > div:nth-child(1) > svg:nth-child(1) > path:nth-child(1)') != undefined;
                        infoObject.verified = isVerified;

                        let profileImageURL = document.querySelector('.owner-avatar > div:nth-child(1) > img:nth-child(2)').getAttribute("src");
                        infoObject.profileImageURL = profileImageURL;

                        // if live
                        if (document.querySelector('.mt-0') != undefined) {
                            infoObject.live = true;

                            // getting catagory
                            let channelCatagories = document.querySelector('div.category-tags-holder:nth-child(3) > div:nth-child(1) > a:nth-child(1)').textContent;
                            infoObject.catagory = channelCatagories;

                            // getting tags
                            let channelTags = Array.from(document.querySelector('div.category-tags-holder').children).map(x => x.textContent);
                            channelTags.splice(0,1);
                            infoObject.tags = channelTags;

                            // getting title
                            let streamTitle = document.querySelector('.stream-title').textContent;
                            infoObject.streamTitle = streamTitle;

                            // getting viewers
                            let viewerArray = Array.from(document.querySelectorAll('.odometer-digit-inner')).map(x => x.textContent);
                            let viewers = parseInt(viewerArray.join(''));
                            infoObject.viewers = viewers;
                        }

                        return infoObject;
                    })
                    return channelStats;
                }
                return false
            }

            let newInfoArray = [];
            for (let i = 0; i < channels.length; i++) {
                let newInfoObject = await getStats(channels[i], i)
                if (newInfoObject != false) {
                    newInfoObject.name = channels[i];
                    newInfoObject.streamURL = `https://kick.com/${channels[i]}`;
                    newInfoArray.push(newInfoObject);
                }
            }
            
            await browser.close()
            resolve(newInfoArray);
        } catch(err) {
            console.log(err);
            reject();
        }
    })
}

export const handler = async(event) => {
    let data = await kickChannelInfo(event.channels);
    const response = {
        statusCode: 200,
        body: data
    };
    return response;
}
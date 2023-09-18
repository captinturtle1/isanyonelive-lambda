import pretty from 'pretty';
import fetch from 'node-fetch';

// takes a string of numbers with commas, and returns only a number
function parseViewers(viewerString) {
    let numArray = Array.from(viewerString);
    let followerNumArray = [];

    for (let i = 0; i < numArray.length; i++) {
        if (!isNaN(numArray[i])) {
            followerNumArray.push(numArray[i]);
        }
    }

    let viewersNum = parseInt(followerNumArray.join(''));

    return viewersNum;
}

async function getInfo(channelName) {

    // getting the "html" to parse thru and formatting it a bit
    let response = await fetch(`https://youtube.com/@${channelName}`);
    let html = await response.text();
    let prettied = pretty(html); 

    // defining the channel info object
    let infoObject = {
        name: channelName,
        displayName: '',
        profileImageURL: '',
        streamURL: `https://youtube.com/@${channelName}`,
        verified: false,
        live: false,
        viewers: 0,
        streamTitle: ''
    }

    // setting if the channel is verified
    if (prettied.match(/"style": "BADGE_STYLE_TYPE_VERIFIED"/)) infoObject.verified = true;

    // getting and setting the profile image url
    if (prettied.match(/<link rel="image_src" href="([^"]*)"[^>]*>/)) {
        infoObject.profileImageURL = prettied.match(/<link rel="image_src" href="([^"]*)"[^>]*>/)[1];
    };

    // getting and setting the display name
    if (prettied.match(/<meta property="og:title" content="([^"]*)"[^>]*>/)) {
        infoObject.displayName = prettied.match(/<meta property="og:title" content="([^"]*)"[^>]*>/)[1];
    };
    
    // stuff to do if the channel is live
    if (prettied.match(/"text": "LIVE"/)) {
        // setting live to true
        infoObject.live = true

        // getting and setting viewers
        let matchedViewers = prettied.match(/"viewCountText"\s*:\s*{\s*"runs"\s*:\s*\[\s*{\s*"text"\s*:\s*"([^"]+)"/);
        infoObject.viewers = parseViewers(matchedViewers[1]);

        let matchedTitle = prettied.match(/"title"\s*:\s*{\s*"runs"\s*:\s*\[\s*{\s*"text"\s*:\s*"([^"]+)"/);
        infoObject.streamTitle = matchedTitle[1];

        let matchedURL = prettied.match(/"videoId"\s*:\s*"([^"]+)"/)
        infoObject.streamURL = `https://www.youtube.com/watch?v=${matchedURL[1]}`;
    };

    return infoObject;
}

function youtubeChannelInfo(channels) {
    return new Promise(async (resolve, reject) => {
        try {
            let newDataArray = [];
            for (let i = 0; i < channels.length; i++) {
                let newInfoObject = await getInfo(channels[i]);
                newDataArray.push(newInfoObject);
            }

            resolve(newDataArray);
        } catch(err) {
            reject(err)
        } 
    });
}

export const handler = async(event) => {
    let data = await youtubeChannelInfo(event.body);
    const response = {
        statusCode: 200,
        body: data
    };
    return response;
}
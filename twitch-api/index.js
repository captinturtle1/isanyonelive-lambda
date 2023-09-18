import fetch from 'node-fetch';
import 'dotenv/config'

function getAccessToken() {
    return new Promise(async (resolve, reject) => {
        try {
            let options = {
                method: 'POST',
                headers:{
                    'Content-Type': 'application/x-www-form-urlencoded'
                },    
                body: new URLSearchParams({
                    'client_id': process.env.TWITCH_CLIENT_ID,
                    'client_secret': process.env.TWITCH_CLIENT_SECRET,
                    'grant_type': 'client_credentials'
                })
            };
            
            let response = await fetch('https://id.twitch.tv/oauth2/token', options);
            response = await response.json();
            resolve(response.access_token);
        } catch(err) {
            reject(err);
        }
    });
}

function fetchTwitch(urlParems, accessToken) {
    return new Promise(async (resolve, reject) => {
        try {
            let options = {
                method: "GET",
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Client-Id': process.env.TWITCH_CLIENT_ID
                }
            };

            let response = await fetch(`https://api.twitch.tv/helix/streams?${urlParems}`, options);
            response = await response.json();

            resolve(response);
        } catch(err) {
            reject(err);
        }
    });
}

function getTwitchUser(loginUrlParams, accessToken) {
    return new Promise(async (resolve, reject) => {
        try {
            let options = {
                method: "GET",
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Client-Id': process.env.TWITCH_CLIENT_ID
                }
            };
            
            let response = await fetch(`https://api.twitch.tv/helix/users?${loginUrlParams}`, options);
            response = await response.json();
            resolve (response)
        } catch(err) {
            reject(err);
        }
    })
}

function twitchChannelInfo(channels) {
    return new Promise(async (resolve, reject) => {
            try {
                
                let accessToken = await getAccessToken();
                // constructing api url for streams endpoint
                let urlParems = '';
                for (let i = 0; i < channels.length; i++) {
                    if (i == 0) {
                        urlParems = urlParems.concat('user_login=', channels[i]);
                    } else {
                        urlParems = urlParems.concat('&user_login=', channels[i]);
                    }
                }

                // constructing api url for users endpoint
                let loginUrlParems = '';
                for (let i = 0; i < channels.length; i++) {
                    if (i == 0) {
                        loginUrlParems = loginUrlParems.concat('login=', channels[i]);
                    } else {
                        loginUrlParems = loginUrlParems.concat('&login=', channels[i]);
                    }
                }

                let response = await fetchTwitch(urlParems, accessToken);
                if (response.error) {
                    reject(response);
                }

                let usersResponse = await getTwitchUser(loginUrlParems, accessToken);
                if (usersResponse.error) {
                    reject(usersResponse);
                }
                
                response = response.data;
                usersResponse = usersResponse.data;
                
                let newDataArray = [];
                for (let i = 0; i < usersResponse.length; i++) {
                    let infoObject = {
                        name: usersResponse[i].login,
                        displayName: usersResponse[i].display_name,
                        profileImageURL: usersResponse[i].profile_image_url,
                        streamURL: `https://twitch.tv/${usersResponse[i].login}`,
                        verified: usersResponse[i].broadcaster_type == 'partner',
                        live: false,
                        viewers: 0,
                        streamTitle: '',
                        catagory: '',
                        tags: [],
                    }

                    // loop thru stream endpoint responses to find matching name for current users endpoint
                    for (let j = 0; j < response.length; j++) {
                        if (response[j].user_login == usersResponse[i].login) {
                            infoObject.live = true;
                            infoObject.viewers = response[j].viewer_count;
                            infoObject.streamTitle = response[j].title;
                            infoObject.catagory = response[j].game_name;
                            infoObject.tags = response[j].tags;
                        }
                    }
                    newDataArray.push(infoObject);
                }

                resolve(newDataArray)
            } catch(err) {
                console.log(err);
                reject(err);
            }
    });
}

export const handler = async(event) => {
    let daResponse = await twitchChannelInfo(event.channels);
    const response = {
        statusCode: 200,
        body: daResponse
    };
    return response;
}
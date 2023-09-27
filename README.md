# isanyonelive-lambda

isanyonelive-lambda contains the functions for each endpoint needed to service the isanyone.live webpage, and mobile app.

Each directory contains (almost) everything needed to deploy endpoints to AWS Lambda Functions.

The Kick and Youtube endpoints require more memory allocated on GCP to work properly

Twitch data is retrieved using the Twitch API.

Youtube data retrieved using fetch and parsing the HTML.

Kick data is retrieved using Puppeteer to gather information channel pages.

For the Kick endpoint to work with Lambda, a Lambda layer must be setup with [@sparticuz/chromium](https://www.npmjs.com/package/@sparticuz/chromium?activeTab=readme);

This api is no longer being actively used. Check out the [Current API](https://github.com/captinturtle1/isanyonelive-gcp-api)
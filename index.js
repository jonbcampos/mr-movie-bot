const functions = require('firebase-functions');
const { WebhookClient, Card, Suggestion } = require('dialogflow-fulfillment');
const crypto = require('crypto');
const http = require('http');
const baseUri = 'http://api.fandango.com';
const apiVersion = '1';

process.env.DEBUG = 'mr-movie-bot:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    function welcome(agent) {
        agent.add(`Welcome to my agent!`);
    }

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }

    // // Uncomment and edit to make your own intent handler
    // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
    // // below to get this function to be run when a Dialogflow intent is matched
    // function yourFunctionHandler(agent) {
    //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
    //   agent.add(new Card({
    //       title: `Title: this is a card title`,
    //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
    //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
    //       buttonText: 'This is a button',
    //       buttonUrl: 'https://assistant.google.com/'
    //     })
    //   );
    //   agent.add(new Suggestion(`Quick Reply`));
    //   agent.add(new Suggestion(`Suggestion`));
    //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
    // }

    // // Uncomment and edit to make your own Google Assistant intent handler
    // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
    // // below to get this function to be run when a Dialogflow intent is matched
    // function googleAssistantHandler(agent) {
    //   let conv = agent.conv(); // Get Actions on Google library conv instance
    //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
    //   agent.add(conv); // Add Actions on Google library responses to your agent's response
    // }
    // // See https://github.com/dialogflow/dialogflow-fulfillment-nodejs/tree/master/samples/actions-on-google
    // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample
    const parameters = request.body.queryResult.parameters;

    String.prototype.format = String.prototype.f = function () {
        let s = this;
        let i = arguments.length;

        while (i--) {
            s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
        }
        return s;
    };

    function sha256Encode(stringToEncode) {
        return crypto.createHash('sha256').update(stringToEncode).digest('hex');
    }

    function buildAuthorizationParameters(apiKey, sharedSecret) {
        const seconds = Math.floor(new Date() / 1000);
        const paramsToEncode = apiKey + sharedSecret + seconds;
        const encodedParams = sha256Encode(paramsToEncode);
        return 'apikey={0}&sig={1}'.format(apiKey, encodedParams);
    }

    function eventSearchHandler(agent) {
        console.log('start eventSearchHandler');
        console.log(`params: ${JSON.stringify(parameters)}`);
        const dateTime = new Date(parameters['data-time']);
        const location = parameters['location'];
        const city = location['city'];
        const state = location['admin-area'];
        const amount = parameters['amount'];
        const title = parameters['event-title'];
        const sort = parameters['sort'];
        const genre = parameters['music-genre'];
        const actor = parameters['actor'];

        const authorizationParameters = buildAuthorizationParameters(
            process.env.API_KEY,
            process.env.API_SECRET
        );
        const requestUri = '{0}/v{1}/?{2}&{3}'.format(
            baseUri, apiVersion, parameters, authorizationParameters
        );

        http.get(requestUri, function(apiRes) {
            let response = '';
            apiRes.on('data', function(data) {
                response += data;
            });

            apiRes.on('end', function() {
                agent.add(`not complete`);
            });
        });
    }

    function eventSearchImplicitHandler(agent) {
        console.log('start eventSearchImplicitHandler');
        console.log(`params: ${JSON.stringify(parameters)}`);
        agent.add(`not complete`);
    }

    function eventTicketsBookHandler(agent) {
        console.log('start eventTicketsBookHandler');
        console.log(`params: ${JSON.stringify(parameters)}`);
        agent.add(`not complete`);
    }

    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('events.search', eventSearchHandler);
    intentMap.set('events.search.implicit', eventSearchImplicitHandler);
    intentMap.set('events.tickets.book', eventTicketsBookHandler);
    agent.handleRequest(intentMap);
});

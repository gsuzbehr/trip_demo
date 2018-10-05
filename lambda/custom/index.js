const Alexa = require('ask-sdk-core');

// 1. Text strings ================================================================================
//    Modify these strings and messages to change the behavior of your Lambda function

const welcomeOutput = "Welcome to Paint Cast by Behr.  I can help you with your project.  Where city do you live in?";
const welcomeReprompt = "Let me know where you'd like to go or when you'd like to go on your trip";
const helpOutput = 'You can demonstrate the delegate directive by saying "plan a trip".';
const helpReprompt = 'Try saying "plan a trip".';
const tripIntro = [
  'This sounds like a cool trip. ',
  'This will be fun. ',
  'Oh, I like this trip. ',
];

// 1. Intent Handlers =============================================

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;
    return responseBuilder
      .speak(welcomeOutput)
      .reprompt(welcomeReprompt)
      .getResponse();
  },
};

const InProgressPlanMyTripHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'PlanMyTripIntent' &&
      request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  },
};

const CompletedPlanMyTripHandler = {
  canHandle(handlerInput) {
    console.log("CompletedPlanMyTripHandler 1");
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'PlanMyTripIntent';
  },
  async handle(handlerInput) {
    console.log('Plan My Trip - handle');

    const responseBuilder = handlerInput.responseBuilder;
    const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
    const slotValues = getSlotValues(filledSlots);
    console.log("CompletedPlanMyTripHandler 2");


    const cityName = slotValues.toCity.synonym;
    const startDate = slotValues.travelDate.synonym;
    const selectedProject = slotValues.projectType.synonym;

    let weatherAPIUrl = `http://api.openweathermap.org/data/2.5/forecast?appid=c5c5f37bd77009ef9dd19707a10277f1&units=imperial&CNT=5&q=${cityName},us`;
    let currentTemperature = '';
    let outputSpeech = '';
  

    console.log("cityName: " + cityName);
    console.log("startDate: " + startDate);
    console.log("selectedProject: " + selectedProject);
    console.log("weatherAPIUrl: " + weatherAPIUrl);








    await getRemoteData(weatherAPIUrl).then((response) => {
      const data = JSON.parse(response);

      let cityName = data.city.name;
      let day1 = '';
      let day2 = '';
      let day3 = '';
      let day4 = '';
      let day5 = '';

      currentTemperature = data.list[0].main.temp;


      //outputSpeech = "Today is : " + currentDay + ".  Your city is " + cityName;
      console.log("CompletedPlanMyTripHandler 3");
      console.log("data: " + data);
      console.log("data.list[0].main.temp: " + data.list[0].main.temp);

      if ((data.list[0].main.temp > 50) || (data.list[0].main.temp > 90)) {
        console.log("CompletedPlanMyTripHandler 4");
        outputSpeech = `You live in ${cityName} and the current temperature is ${currentTemperature} degrees fahrenheit.  Congratulations, you can paint today!`;
      } else {
        console.log("CompletedPlanMyTripHandler 5");
        outputSpeech = `Sorry.  It is ${currentTemperature} degrees fahrenheit and it is not a great time to paint.`
      }

    })
    .catch((err) => {
      //set an optional error message here
      //outputSpeech = err.message;
    });












    // compose speechOutput that simply reads all the collected slot values
    let speechOutput = getRandomPhrase(tripIntro);
    console.log("CompletedPlanMyTripHandler 6");







    // Now let's recap the trip
    speechOutput = `${speechOutput} from ${slotValues.toCity.synonym} on ${slotValues.travelDate.synonym}`;

    return responseBuilder
      .speak(outputSpeech)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;
    return responseBuilder
      .speak(helpOutput)
      .reprompt(helpReprompt)
      .getResponse();
  },
};

const CancelStopHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      (request.intent.name === 'AMAZON.CancelIntent' || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;
    const speechOutput = 'Okay, talk to you later! ';

    return responseBuilder
      .speak(speechOutput)
      .withShouldEndSession(true)
      .getResponse();
  },
};

const SessionEndedHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    const request = handlerInput.requestEnvelope.request;

    console.log(`Original Request was: ${JSON.stringify(request, null, 2)}`);
    console.log(`Error handled: ${error}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can not understand the command.  Please say again.')
      .reprompt('Sorry, I can not understand the command.  Please say again.')
      .getResponse();
  },
};

// 2. Helper Functions ============================================================================

function getSlotValues(filledSlots) {
  const slotValues = {};

  console.log(`The filled slots: ${JSON.stringify(filledSlots)}`);
  Object.keys(filledSlots).forEach((item) => {
    const name = filledSlots[item].name;

    if (filledSlots[item] &&
      filledSlots[item].resolutions &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
      switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
        case 'ER_SUCCESS_MATCH':
          slotValues[name] = {
            synonym: filledSlots[item].value,
            resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
            isValidated: true,
          };
          break;
        case 'ER_SUCCESS_NO_MATCH':
          slotValues[name] = {
            synonym: filledSlots[item].value,
            resolved: filledSlots[item].value,
            isValidated: false,
          };
          break;
        default:
          break;
      }
    } else {
      slotValues[name] = {
        synonym: filledSlots[item].value,
        resolved: filledSlots[item].value,
        isValidated: false,
      };
    }
  }, this);

  return slotValues;
}

function getRandomPhrase(array) {
  // the argument is an array [] of words or phrases
  const i = Math.floor(Math.random() * array.length);
  return (array[i]);
}

const getRemoteData = function (url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? require('https') : require('http');
    const request = client.get(url, (response) => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(new Error('Failed with status code: ' + response.statusCode));
      }
      const body = [];
      response.on('data', (chunk) => body.push(chunk));
      response.on('end', () => resolve(body.join('')));
    });
    request.on('error', (err) => reject(err))
  })
};

// 4. Exports handler function and setup ===================================================
const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    InProgressPlanMyTripHandler,
    CompletedPlanMyTripHandler,
    CancelStopHandler,
    HelpHandler,
    SessionEndedHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();

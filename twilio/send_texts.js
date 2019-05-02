// Twilio Credentials
const accountSid = 'ACb1cec2a95d58592153ec1493ceecafd5';
const authToken = '8049ddfba17736252a21d6f5d4b6f69c';

// Require the Twilio module and create a REST client
const client = require('twilio')(accountSid, authToken);

//Creates phone-to-Twilio client data.
client.messages.create({
    to: '+14076660630',
    from: '+14073262064',
    body: 'TEXT MESSAGE SENT WHOOOOOOOOOHOOOOO',
  },
  (err, message) => {
    console.log(message.sid);
  }
);
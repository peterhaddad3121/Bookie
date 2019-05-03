var http = require('http');
var express = require('express');
var path = require('path');
var twilio = require('twilio');
var firebase = require('firebase');
var fs = require("fs");
const bookingUtils = require('./public/js/BookingRooms.js');

const app = express();
const port = 8080;

//RoomList:
//Dynamically load all rooms of bush.
console.log("\n *Loading Rooms List* \n");
var roomsList = JSON.parse(fs.readFileSync("./public/BushRooms.json"));
console.log("Output RoomsList : \n" + roomsList);
console.log("*Finished Loading Rooms List*");

// Body parser provides support for reading JSON bodies of POST requests
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '/index.html')));
// Return application page
app.get('/home.html', (req, res) => res.sendFile(path.join(__dirname, '/home.html')));
app.get('/booked.html', (req, res) => res.sendFile(path.join(__dirname, '/booked.html')));
app.use("/public", express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/public"));

// Increment total rooms by 1 (this feature is for hardware XMLHTTP request from PI to Server).
app.post('/post', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.json();
});


// ****** Text Messages & Call Backs *******
var list_of_commands = 'C = List of Commands\nBook {Room_Number} {Start_Time} or Book {Room_Number} {Start_Time} {Date Formatted: dd/mm/yyyy} = Book a Room for 1 hour\nBookM {Room_Number}\n unbook {Date Formated dd/mm/yyyy}\n' +
  "S = status (all rooms you currently have booked with date)";
app.post('/sms', function(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  console.log('Received message');

  const MessagingResponse = require('twilio').twiml.MessagingResponse;
  const response = new MessagingResponse();

  var msg = req.body.Body;
  msg = msg.toLowerCase();

  if (msg === 'c') {
    console.log("Sending List of Commands.");
    response.message(list_of_commands);

    res.end(response.toString());

    return true;
  }

  else if (msg === 'status') {
    console.log("Get all ROOMS");

    var lead = firebase.database().ref('Floors/');
    console.log("GETTING ROOM STATUS");
    var allRooms = "";
    var userDataHash = 'ps9OelV51nSIpgORn5QwnpyrRva2';

    //Loop through all dates in datebase.
    lead.on('value', function(snapshot) {
      snapshot.forEach(function(childSnapshot) {
        var childDate = childSnapshot.key;
        //log(childDate);
        var childLead = firebase.database().ref('Floors/' + childDate);

        childLead.on('value', function(childSnapshot) {
          childSnapshot.forEach(function(childSnapshotOfDate) {

            var childData = childSnapshotOfDate.val();
            var childUser = childData.user;
            if (userDataHash === childUser) {
              allRooms += "Room " + childData.bookingInfo[0] + ": From: " + childData.bookingInfo[1].startTime + " To " + childData.bookingInfo[1].endTime + " on " + childDate + "\n";
              console.log(allRooms + "HOLA");
            } //End of if-statement.

          }); //End of for each for each of the dates.
        }); //End of childSnapshot.
      }); //End of snapshot.

      console.log("Room status are: " + allRooms);
      if (allRooms === '')
        allRooms = "You currently do not have any rooms booked.";

      response.message(allRooms);

      res.end(response.toString());

      return true;
    });

    return false;
  }

  else if (msg.includes('unbook')) {
    console.log("Running Unbooking Functions");
    var roomNumber = msg.split(" ");
    roomNumber[1] = roomNumber[1].replace(/\//g, '');
    console.log("Formatted date: " + roomNumber[1])

    if (msg.includes('-f')) {
      response.message("unbook {date : enter in dd/mm/yyyy or n/a for today}");
    }
    else {
      var lead = firebase.database().ref('Floors/' + roomNumber[1]);

      var _isSuccessful = false;

      lead.on('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          var childData = childSnapshot.val();
          var toremove = childData.key
          var childUser = childData.user;
          if ('ps9OelV51nSIpgORn5QwnpyrRva2' === childUser) {
            console.log("Child data:\t" + childData);
            var toremove = firebase.database().ref('Floors/' + roomNumber[1] + '/' + childSnapshot.key)
            _isSuccessful = true;
            toremove.remove()
          }

        });

        if (_isSuccessful) {
          console.log("Room successfull unbooked!");
          response.message("Room successfull unbooked!");
        }
        else {
          console.log("Error unbooking room... Room is not booked by you!");
          response.message("Error unbooking room... Room is not booked by you!");
        }

        res.end(response.toString());

        return true;
      }) //End of unbook
    } //End of info


  }
  else if (msg.includes('book')) {
    console.log("Running Booking Functions");
    var roomNumber = msg.split(" ");
    var time = parseInt(roomNumber[2]);
    var date = "06232019";

    //Book Info
    if (msg.includes('-i')) {
      console.log("WORKED");
      response.message("book {time in MT} {room number} {date : enter in dd/mm/yyyy or n/a for today}");
      res.end(response.toString());
      return true;
    }
    else {
      //Must parse int because roomNumbers from BushRooms.js are integers.
      if (!bookingUtils.doesRoomExist(parseInt(roomNumber[1]), JSON.stringify(roomsList))) {
        response.message("***ERROR*** Room does not Exist in Bush ***ERROR***");
        res.end(response.toString());
        console.log("*ERROR Booking Room* Room does not exist");
        return false;
      }

      //Message contains a date.
      if (msg.includes('/')) {
        date = roomNumber[3].replace(/\//g, '');
      }

      //Check if room is available by quarying the db.
      firebase.database().ref('Floors/' + date + "/").once('value').then(function(snapshot) {
        var roomData = [roomNumber[1], { startTime: time, endTime: time + 1 }, 'ps9OelV51nSIpgORn5QwnpyrRva2']; //Start time declared in text + 1 hour is allocated time booked.
        msg = bookingUtils.isTimeCorrectExported(roomData, snapshot).errorMessage
        console.log("Callback Message: " + msg);

        response.message(msg);
        res.end(response.toString());

      });
      bookingUtils.bookRooms(date, time, time + 1, roomNumber[1], true); //Actually book the room.
      return true;
    }


  }
  console.log("send message");
  response.message("Thank you for texting the Bookie By Bush.\nType C for a list of commands.");
  res.end(response.toString());

  return false;

});

http.createServer(app).listen(8080, function() {
  console.log("Express server listening on port 8080");
});

//Error Handling Code:
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

//Run with node app.js
//https://bush-application-hindelang.c9users.io:8080/
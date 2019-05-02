// Initialize Firebase
var firebase = require("firebase");
var config = {
    apiKey: "AIzaSyDu9MqaR51uv0e2KoBbhm-P7sWRRKrpem4",
    authDomain: "bush-application.firebaseapp.com",
    databaseURL: "https://bush-application.firebaseio.com",
    projectId: "bush-application",
    storageBucket: "bush-application.appspot.com",
    messagingSenderId: "968692493293"
};

firebase.initializeApp(config);

//Room Functions callback.
firebase.database().ref('Floors/').on('value', function(snapshot) {
    var list = [];

    snapshot.forEach(function(childSnapshot) {
        var item = childSnapshot.val();
        item.key = childSnapshot.key;

        list.push(item);
    });

    // updateDates(list, 109);
});


//Checks that the room data does not already exist for the specifc time-slot.
//Takes roomData as input which is the username, start/end times, roomNumber.
function isTimeCorrect(roomData, snapshot) {
    var _isAvailable = true;
    var error = 'You booked room ' + roomData[0] + " from " + roomData[1].startTime + " to " + roomData[1].endTime;
    var errorCode = 0;

    snapshot.forEach(function(childSnapshot) {
        var item = childSnapshot.val();
        item.key = childSnapshot.key;

        var wantedStartTime = roomData[1].startTime;
        var itemStartTime = item.bookingInfo[1].startTime;
        var itemEndTime = item.bookingInfo[1].endTime;

        if (item.user == roomData[2]) {
            error = "You can only book one room per day!";
            errorCode = 1;
            _isAvailable = false;
        }
        else if (wantedStartTime > itemStartTime && wantedStartTime < itemEndTime && roomData[0] == item.bookingInfo[0]) {
            _isAvailable = false;
            errorCode = 2;
            error = "Time slot is unavailable: " + itemStartTime + " - " + itemEndTime;
        }
    });

    return { _available: _isAvailable, errorMessage: error, errorCode: errorCode };
};

//Updates the dates
//Takes database list and list of rooms as integers wanted.
function updateDates(listOf, room) {
    var availableTimes = [];

    var tmp = [];

    var i;
    for (i = 0; i < listOf.length; i++) {
        if (listOf[i].key === selectedDay) {
            tmp.push(listOf[i].bookingInfo[2]);
        }
    }

    console.log(tmp);
};

/**
 * Returns list of rooms booked by the user as A LIST.
 **/
function roomStatus(_isSMS) {
    var lead = firebase.database().ref('Floors/');
    console.log("GETTING ROOM STATUS");
    var allRooms = "";
    var userDataHash = undefined;

    if (_isSMS) {
        userDataHash = 'ps9OelV51nSIpgORn5QwnpyrRva2';
    }
    else {
        userDataHash = userUID;
    }

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
                        if (!_isSMS)
                            allRooms += "<p>";

                        allRooms += "Room " + childData.bookingInfo[0] + ": From: " + childData.bookingInfo[1].startTime + " To " + childData.bookingInfo[1].endTime + " on " + childDate + "\n";

                        if (!_isSMS)
                            allRooms += "</p>";
                    } //End of if-statement.

                }); //End of for each for each of the dates.
            }); //End of childSnapshot.
        }); //End of snapshot.

        console.log("Room status are: " + allRooms);
        if (!_isSMS) {
            document.getElementById("fillWithUnavailableRooms").innerHTML = allRooms;
        }

        if (allRooms === "") {
            return "You do not have any rooms at all booked.";
        }
        else {

            return allRooms;
        }


    });
    //End
};

/**
 * Method to unbook a room, checks the user logged in and will remove the booking for the room linked to them
 * if the input passes the constraints.
 * */
function unbookRoom(selectedDay) {

    var lead = firebase.database().ref('Floors/' + selectedDay);

    var _isSuccessful = false;

    lead.on('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var childData = childSnapshot.val();
            var toremove = childData.key
            var childUser = childData.user;
            if (userUID === childUser) {
                var toremove = firebase.database().ref('Floors/' + selectedDay + '/' + childSnapshot.key)
                _isSuccessful = true;
                toremove.remove()
            }

        });

        if (_isSuccessful) {
            document.getElementById("alertMessage").innerHTML = "<p>" + "<strong>Warning: </strong>" + "You have canceled your room reservation for " + selectedDay + "</p";
        }
        else {
            document.getElementById("alertMessage").innerHTML = "<p>" + "<strong>Warning: </strong>" + "There is no room reservation to be cancelled on  " + selectedDay + "</p";
        }

        fillFields();

    })
};
/**
 * Takes a day, time, and room number and registers that room as booked
 * 
 **/
//Book Room (day, startTime, roomNumber)
//If room does is booked, then throw error. If not, then add book to database (firebase).
function bookRoom(day, startTime, endTime, roomNumber, _isSMS) {

    // (isBooked(day, startTime, roomNumber)) {
    //Insert Element Booked TimeW
    var floor = "One"; //TEST
    console.log("FLOOR IS: " + floor); //DEBUGGING
    var error = undefined;
    var userDataHash = undefined;

    if (_isSMS)
        userDataHash = 'ps9OelV51nSIpgORn5QwnpyrRva2';
    else
        userDataHash = userUID;

    var roomData = [roomNumber, { startTime: startTime, endTime: endTime }, userDataHash];

    firebase.database().ref('Floors/' + day + "/").once('value').then(function(snapshot) { //Must be 'Floors/' because snapshotToArray takes the whole element.
        //Verify parameters are not already in database in correlation to new time.
        var isTimeCorrectAsArray = isTimeCorrect(roomData, snapshot);
        error = isTimeCorrectAsArray.errorCode;
        var canBook = true
        //check if booking a room is valid based on other times that room is booked on the same day.
        snapshot.forEach(function(childSnapshot) {
            var childData = childSnapshot.val();

            var childBookInfo = childData.bookingInfo[1];

            if ((startTime >= childBookInfo.startTime && startTime <= childBookInfo.endTime) ||
                (endTime <= childBookInfo.endTime && endTime >= childBookInfo.startTime) || (startTime <= childBookInfo.startTime && endTime >= childBookInfo.endTime)) {


                canBook = false
            }

        })

        if (canBook === false) {
            document.getElementById("alertMessage").innerHTML = "<p>" + "<strong>Warning: </strong>" + "The room is unavailable at some time  in this time slot, please try another time slot " + "</p";
            return;
        }


        if (isTimeCorrectAsArray._available) {

            var newPostKey = firebase.database().ref().child('Floors/').push().key; //Create new key to establish new element.
            snapshot.key = newPostKey;

            firebase.database().ref('Floors/' + day + "/" + newPostKey).set({
                bookingInfo: roomData,
                key: newPostKey,
                user: userDataHash
            });

            if (!_isSMS)
                fillFields();



        }

        //Update Alerts -> Notifying the user if a room is booked, unavilable, or if the user has booked too many rooms.
        if (!_isSMS) {
            if (error === 1) {
                document.getElementById("alertMessage").innerHTML = "<p>" + "<strong>Error: </strong>" + isTimeCorrectAsArray.errorMessage + "</p";
                document.getElementById("alertBooking").className = "alert alert-danger";
            }
            else if (error === 2) {
                document.getElementById("alertMessage").innerHTML = "<p>" + "<strong>Warning: </strong>" + isTimeCorrectAsArray.errorMessage + "</p";
                document.getElementById("alertBooking").className = "alert alert-warning";
            }
            else {
                document.getElementById("alertMessage").innerHTML = "<p>" + "<strong>Success: </strong>" + isTimeCorrectAsArray.errorMessage + "</p";
                document.getElementById("alertBooking").className = "alert alert-success";
            }
        }

    });

};

/**
 * Fils all of the appropiate fields based on the tab selected on home.html
 * Only for home.html
 **/
function fillFields() {
    /**Global**/
    if (tabSelection === 'unavailable') { //Shows warning because tabSelection is instantiated in home.html
        getUnavailableRoomsByDay(selectedDay, startTime, endTime, selectedFloor);
    }
    else if (tabSelection === 'available') {
        getAvailableRoomsByDay(selectedDay, startTime, endTime, selectedFloor, roomList);
    }
    else {
        roomStatus(false);
    }

}

//Return all unavailable room numbers in sorted order by day.
function getUnavailableRoomsByDay(day, start_time, end_time, floor) {
    var tmpHTML = "<p>";
    var lead = firebase.database().ref('Floors/' + day);
    var _checkTimes = false;
    var rooms = [];
    var allRooms = new Map;

    if (start_time != -1 && end_time != -1)
        _checkTimes = true;

    lead.on('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var childData = childSnapshot.val();
            var childRoomNum = childData.bookingInfo[0];
            var childBookInfo = childData.bookingInfo[1];

            if (allRooms.get(childRoomNum) === undefined) {
                allRooms.set(childRoomNum, { times: [childBookInfo] });
            }
            else {
                allRooms.get(childRoomNum).times.push(childBookInfo);
            }

        });
        //SORT TIMES
        var tmpTimes = [];
        allRooms.forEach(function(value, key) {
            var i;
            for (i = 0; i < value.times.length; i++) {
                if ((start_time >= value.times[i].startTime && start_time <= value.times[i].endTime) ||
                    (end_time <= value.times[i].endTime && end_time >= value.times[i].startTime) || (start_time <= value.times[i].startTime && end_time >= value.times[i].endTime) || !_checkTimes) {
                    console.log(parseInt(key.charAt(0) - 1));
                    if (floor === parseInt(key.charAt(0) - 1)) {
                        tmpHTML += "<tr><th scope='row'>" + key + "</th>"
                        tmpHTML += "<td>" + value.times[i].startTime + "</td><td>" + value.times[i].endTime + "</td></tr>";
                        rooms.push(parseInt(key));
                    }

                }
            }
            console.log(key + '= ' + JSON.stringify(value));
            console.log(tmpHTML);
        });
    });
    console.log("DISPLAYING TIMES: " + JSON.stringify(rooms));
    document.getElementById("fillWithUnavailableRooms").innerHTML = tmpHTML + "</p>";
    return rooms; //Return Map not-sorted.
};

/**
 * Returns the available rooms as a JSON object based on the date entered.
 **/
function getAvailableRoomsByDay(day, start_time, end_time, floor, roomList) {
    var unavailable = getUnavailableRoomsByDay(day, start_time, end_time);
    var rooms = roomList[floor];
    console.log("Rooms to Contrast: " + rooms);
    console.log("Rooms UNAVAILABLE: " + unavailable);

    var i;
    var u_i;
    for (u_i = 0; u_i < unavailable.length; u_i++) {
        for (i = 0; i < rooms.length; i++) {
            if (unavailable[u_i] === rooms[i]) {
                rooms[i] = undefined;
            }
        }
    }

    //Print to HTML
    var tmpHTML = "<p>";

    for (i = 0; i < rooms.length; i++) {
        if (rooms[i] != undefined) {
            tmpHTML += "<tr><th scope='row'>" + rooms[i] + "</th>"
            tmpHTML += "<td>" + start_time + "</td><td>" + end_time + "</td></tr>";
        }
    }
    document.getElementById("fillWithUnavailableRooms").innerHTML = tmpHTML + "</p>";

};

//Checks that the room data does not already exist for the specifc time-slot.
//Takes roomData as input which is the username, start/end times, roomNumber.
function isTimeCorrect(roomData, snapshot) {
    var _isAvailable = true;
    var error = 'You booked room ' + roomData[0] + " from " + roomData[1].startTime + " to " + roomData[1].endTime;
    var errorCode = 0;

    snapshot.forEach(function(childSnapshot) {
        var item = childSnapshot.val();
        item.key = childSnapshot.key;

        var wantedStartTime = roomData[1].startTime;
        var itemStartTime = item.bookingInfo[1].startTime;
        var itemEndTime = item.bookingInfo[1].endTime;

        if (item.user == roomData[2]) {
            error = "You can only book one at a time!";
            errorCode = 1;
            _isAvailable = false;
        }
        else if (wantedStartTime > itemStartTime && wantedStartTime < itemEndTime && roomData[0] == item.bookingInfo[0]) {
            _isAvailable = false;
            errorCode = 2;
            error = "Time slot is unavailable: " + itemStartTime + " - " + itemEndTime;
        }
    });

    return { _available: _isAvailable, errorMessage: error, errorCode: errorCode };
};

/**
 * Checks and sees if room taken even exists in all rooms.
 **/
function _doesRoomExist(e, roomList) {
    console.log("EADASD");
    roomList = JSON.parse(roomList);
    for (var floor in roomList) {
        console.log(floor);
        for (var r in roomList[floor]) {
            console.log(roomList[floor][r]);
            if (e === roomList[floor][r]) {
                return true;
            }
        }
    }

    return false;
};

//Moduler exports so that app.js can access these functions.
module.exports = {
    bookRooms: function(day, startTime, endTime, roomNumber, _isSMS) {
        return bookRoom(day, startTime, endTime, roomNumber, _isSMS);
    },

    signin: function(email, password) {
        firebase.auth().signInWithEmailAndPassword(email, password);
    },

    getStatus: function(_isSMS) {
        return roomStatus(_isSMS);
    },

    //e = element (singular roomList), roomList = list of all rooms
    //Room list in format: {{1,2}, ..., {3,4}}.
    doesRoomExist: function(e, roomList) {
        return _doesRoomExist(e, roomList);
    },

    isTimeCorrectExported: function(roomdata, snapshot) {
        return isTimeCorrect(roomdata, snapshot);
    }

};
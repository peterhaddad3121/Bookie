/**
 * FirebaseUtilities will be used more when physical hardware of the application is implemented.
 **/

//Get corrent rooms with current day selected:
function getRoomsByDay(date, snapshot) {
    snapshot.forEach(function(childSnapshot) {
        var item = childSnapshot.val();
        item.key = childSnapshot.key;
    });
};

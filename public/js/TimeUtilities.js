      //<--------------Time Functions------------------>

      function convertTo24Hours(time) {
        var tmpTime = time.split(" ");
        tmpTime[0] = parseInt(tmpTime[0].replace("00:", ''));
        console.log("TMPSDS: " + tmpTime[1]);
        //selectedDay = document.getElementById("datePickerVal").value.replace(/\//g, ''); //Regex replace all / with ''
        //
        if (tmpTime[1] == "PM" && tmpTime[0] != 12) {
          tmpTime[0] += parseFloat(12.0);
          console.log("HOLAA");
        }
        if (tmpTime[1] == "AM" && tmpTime[0] == 12) {
          tmpTime[0] = 0
        }

        console.log("Tmp Time: " + tmpTime[0]);
        return tmpTime[0];
      }

      function getDisplayTime() {
        var displayTime = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
        displayTime = displayTime.substring(10);
        console.log(displayTime.substring(0, 1));
        return displayTime;
      }

      function get24Time() {
        var twentyFourTime = getDisplayTime()

        var timeSplit = twentyFourTime.split(/[\s:]+/)
        if (timeSplit[4] == 'PM' && timeSplit[1] < 10) {
          timeSplit[1] = Number(timeSplit[1]) + 12;
        }

        var time = timeSplit[1] + '' + timeSplit[2]
        twentyFourTime = time;
        return twentyFourTime

      }


      function getDate() {
        var displayTime = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
        var currentDate = displayTime.substring(0, 10);
        currentDate = currentDate.replace(",", "")
        if (currentDate[0] < 10) {
          currentDate[0] = '0' + currentDate[0]
        }


        console.log(currentDate);
        return currentDate;
      }
      
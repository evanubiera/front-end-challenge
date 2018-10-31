export default class WeatherForecast {
  
  constructor() {
    this.cityId = ''; //current city ID
    this.forecast = []; //to hold 5 day forecast
    this.forecastByDay = {};
    this.weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.monthNames = ["Jan", "Feb", "March", "April", "May", "June",
                      "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

    //use .bind because native promises change the "this" context
    this.getWeather()
    .then(this.setWeather.bind(this))
    .then(this.buildForecastByDay.bind(this))
    .then(this.getElements.bind(this)) 
    .then(this.renderForecast.bind(this));
  
    console.log('Widget Instance Created');
  } 

//test 1: handle promise and return error message
  getWeather(cityId) {
    
    this.cityId = (cityId==null) ? 5128638 : cityId;
    
    return fetch('http://api.openweathermap.org/data/2.5/forecast?id=' 
      + this.cityId + '&appid=0a0a546da66dd748d27435df631ce2c1')
    .then(function(response) {
      return response.json();
    })
    .catch(error => console.error('Error:', error));

  }

  setWeather(data) {
    //all cureent data in provided JSON
    this.forecast = data.list;
  }

  convertTemperature(temperature) {
    //formula for converting Kelvins
    //(K − 273.15) × 9/5 + 32
    return Math.round(((temperature - 273.15) * 9/5 + 32));
  }

  //test 2: check that an array of forecasts
  //build array grouping daily forecasts
  buildForecastByDay() {
    var dayForecast = [];

    //tracking temperature changes throughout a single day
    var dayTempDeltas = [];

    //to track number of days
    var dayCount = 0;

    //for grouping forecasts by day
    var forecastByDay = [];
    
    //used for detecting whena  new day appears
    var isNewDay = false;

    for(var i=0; i < this.forecast.length; i++) {

      //save these into variables
      let weatherNode = this.forecast[i].weather[0];
      var forecast = this.forecast[i];
      let dateText = forecast.dt_txt;

      let currDate = new Date(dateText);
      currDate.setHours(0,0,0,0);
      let currDay = currDate.getDate();
      let currMonth = currDate.getMonth();  
      let currYear = currDate.getYear();  

      if (i>0) {
        var prevForecast = this.forecast[i-1];
        var prevDate = new Date(prevForecast.dt_txt);
        prevDate.setHours(0,0,0,0);
        var prevDay = prevDate.getDate();
        var prevMonth = prevDate.getMonth(); 
        var prevYear = prevDate.getYear();   
      }  

      //check if a new day has been added
      //currently the API delivers the results sorted by day, sequentially
      //all of these checks indicate that the one day is more recent than the other, and that they're different days
      
      if(i> 0) {
        if(((Date.parse(prevDate) < Date.parse(currDate)) ||
          currDay > prevDay || 
          currMonth > prevMonth || 
          currYear > prevYear)) {
            isNewDay = true;
        }
      }

      //check for a new day
      if (isNewDay) {
        let config = {};
        let maxDayTemp = Math.max(...dayTempDeltas);
        let minDayTemp = Math.min(...dayTempDeltas);

        //retrieve the maximum temperature
        config.hiTemp = this.convertTemperature(maxDayTemp); 
        //retrieve the minimum temperature
        config.loTemp = this.convertTemperature(minDayTemp);
        //set the date
        config.date = prevDate.toDateString();

        let objParams = { "forecast": dayForecast, "config": config};
        forecastByDay[dayCount] = objParams;

        //reset these variables
        dayForecast = [];
        dayTempDeltas = [];
        //keep track of the number of days
        dayCount++;
        //keep track of new days
        isNewDay = false;
      } else {
        dayForecast.push(forecast);
        dayTempDeltas.push(forecast.main.temp_max, forecast.main.temp_min);   
      }

    }
    console.log("forecast by day: ", forecastByDay);
    this.forecastByDay = forecastByDay;
  }

  //get weather deltas realted to one day
  getWeatherDeltas(id) {
    let currDayForecast = this.forecastByDay[id] ? this.forecastByDay[id] : 0 ;
    if(currDayForecast.forecast !==null) {
      this.renderWeatherDeltas(currDayForecast.forecast);
    }
  }

  getElements() {
    //find and store other elements you need
    this.element = document.getElementById('weather-forecast')
    this.forecastNode = this.element.querySelectorAll('#five-day-forecast')[0];
    this.temparatureDeltas = this.element.querySelectorAll('#temperature-deltas')[0];
    //this.clear = this.config.element.querySelectorAll("#clear")[0];
  }

  dayClickHandle(event) {
    //get the ID from the element itself or from its parent
    var dayForecastId = event.target.getAttribute("id") ? event.target.getAttribute("id") : event.target.parentElement.id;
    this.getWeatherDeltas(dayForecastId);
  }

  convertToProperCase(str) {
    return str.replace(/\w\S*/g, 
      function(txt){return txt.charAt(0).toUpperCase() 
      + txt.substr(1).toLowerCase();});
  }

  //DOM manipulation for rendering a day's forecast
  renderForecast() { 
    var forecastNode = this.forecastNode;

   //go over each day and create nodes to be added side by side
   for(var i = 0; i < this.forecastByDay.length; i++) {
      //create LI node
      let forecast = this.forecastByDay[i];
      let dayForecastNode = document.createElement('a');
      let ul = document.createElement('ul');
      dayForecastNode.appendChild(ul);

      dayForecastNode.setAttribute('id', i);

      dayForecastNode.className = "is-one-fifth column day-forecast-wrapper";

      let dayNameBlock = document.createElement('li');
      let dateStr = document.createElement('li');
      let tempBlock = document.createElement('li');

      var d = new Date(forecast.config.date);
      var dayName = this.weekDays[d.getDay()];
      
      dayNameBlock.innerHTML = dayName;
      dateStr.innerHTML = this.monthNames[d.getMonth()] + " " + d.getDate() + " " + d.getFullYear();
      tempBlock.innerHTML = "HI:" + forecast.config.hiTemp + "/ LO:" + forecast.config.loTemp;

      dayNameBlock.className = "forecast-day-name";
      dateStr.className = "forecast-date";
      tempBlock.className = "hi-lo-day-temp";

      dayForecastNode.appendChild(dayNameBlock); 
      dayForecastNode.appendChild(dateStr); 
      dayForecastNode.appendChild(tempBlock);

      dayForecastNode.addEventListener('click', this.dayClickHandle.bind(this));
      forecastNode.appendChild(dayForecastNode);
     }
  }

  //make sure: deltas is no null or formatted correctly, DOM nodes get created, etc
  //DOM manipulation for rendering the hourly breakdown of a day's forecast
  renderWeatherDeltas(deltas) {
    //console.log("changes in temp:", deltas);
    var deltas = deltas;

    //handle for weather deltas DOM node
    var temparatureDeltas = this.temparatureDeltas;

    temparatureDeltas.innerHTML = '';

      //go over each day and create nodes to be added side by side
     for(var i = 0; i < deltas.length; i++) {
        //create LI node
        let delta = deltas[i];
        let hourForecastNode = document.createElement('ul');

        hourForecastNode.setAttribute('id', i);

        hourForecastNode.className = "is-one-fifth column hour-forecast-wrapper";

        //elements containing block level UI 
        let hourNameBlock = document.createElement('li');
        let weatherIcon = document.createElement('li');
        let tempBlock = document.createElement('li');
        let description = document.createElement('li');

        //get max and min temperatures and convert from Kelvins
        let minTemp = this.convertTemperature(delta.main.temp_max);
        let maxTemp = this.convertTemperature(delta.main.temp_min);

        var d = new Date(delta.dt_txt);
        
        hourNameBlock.innerHTML = d.toLocaleString('en-US', { hour: 'numeric', hour12: true });
        weatherIcon.innerHTML = "<img src='http://openweathermap.org/img/w/" + delta.weather[0].icon + ".png' />";
        tempBlock.innerHTML = "HI:" + maxTemp + "/ LO:" + minTemp;
        description.innerHTML = this.convertToProperCase(delta.weather[0].description);


        hourNameBlock.className = "forecast-day-name";
        weatherIcon.className = "forecast-date";
        tempBlock.className = "hi-lo-day-temp";
        description.className = "description";

        hourForecastNode.appendChild(hourNameBlock); 
        hourForecastNode.appendChild(weatherIcon); 
        hourForecastNode.appendChild(tempBlock);
        hourForecastNode.appendChild(description);

        temparatureDeltas.appendChild(hourForecastNode);
     }
  }

}

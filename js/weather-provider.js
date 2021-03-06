class WeatherProvider {
	constructor() {
		this._storeName = "weather-dataset";
		this.data = {};
		this.read();
	}

	searchLocationByName(name, renderCallback, errorCallback) {
		let address = "https://nominatim.openstreetmap.org/search?city=" + name + "&format=json";
		console.log(address);

		fetch(address).then((response) => {
			return response.json();
		}).then((data) => {
			console.log(data);

			if (!data.length) {
				errorCallback("No result", "warning");
				renderCallback([]);
				return;
			}

			let outArr = [];
			data.forEach(e => {
				let o = {};
				let nameSplit = e.display_name.split(",");
				o.name = nameSplit[0];
				o.description = String(nameSplit.slice(1));
				o.lat = Number(e.lat).toFixed(3);
				o.lon = Number(e.lon).toFixed(3);
				o.type = e.type;
				outArr.push(o);
			})
			renderCallback(outArr);
		}).catch(err => {
			console.log("Network error!!! " + err);
			errorCallback("Data loading error", "error");
		});
	}

	getForecast(statusCallback, renderCallback, force) {
		statusCallback("Loading...");

		let lat, lon;

		if (this.locationTmp) {
			// New location
			lat = this.locationTmp.lat;
			lon = this.locationTmp.lon;
		} else if (this.data.location) {
			// Laoded from local storage
			lat = this.data.location.lat;
			lon = this.data.location.lon;
		} else {
			return;
		}

		let address = "https://api.met.no/weatherapi/locationforecast/2.0/compact.json?lat=" + lat + "&lon=" + lon;

		if (this.timeIsValid() && this.locationIsValid(lat, lon) && !force) {
			console.log("storage:");
			renderCallback(this.data.forecast);
			statusCallback(this.getUpdTimeString());
			console.log("from storage")
		} else {
			fetch(address).then((response) => {
				return response.json();
			}).then((data) => {
				let out = this.parseWeather(data);
				this.saveForecast(out);
				renderCallback(out);
				statusCallback(this.getUpdTimeString());
			}).catch((err) => {
				console.log("Network error!!!  " + err);
				if (this.locationIsValid(lat, lon)) {
					renderCallback(this.data.forecast);
					statusCallback(this.getUpdTimeString(), "warning");
					console.log("Loaded from storage");
				} else {
					renderCallback(null);
					statusCallback("Data loading error", "error");
					console.log("Network error. Stored data is not valid.");
				}
			});
		}
	}

	getUpdTimeString() {
		let updTime = new Date(this.data.timestamp);
		return "Last update: " + updTime.toLocaleString("uk-UA");
	}

	read() {
		let data = localStorage.getItem(this._storeName);

		if (!data)
			this.data = {};
		else
			this.data = JSON.parse(data);
	}

	write() {
		localStorage.setItem(this._storeName, JSON.stringify(this.data));
	}

	setLocation(lat, lon, name, description) {
		this.locationTmp = { lat, lon, name, description };
	}

	saveForecast(data) {
		if (data.length == 0)
			return;

		this.data.forecast = data;
		this.data.timestamp = Date.now();

		if (this.locationTmp)
			this.data.location = this.locationTmp;

		this.write();
	}

	locationIsValid(lat, lon) {
		if (!this.data.location)
			return false;

		if (this.data.location.lat != lat || this.data.location.lon != lon)
			return false;

		console.log("Stored data is valid");
		return true;
	}

	timeIsValid() {
		if (this.data.timestamp < Date.now() - 1000 * 60 * 25)
			return false;

		console.log("Stored data is actual");
		return true;
	}


	parseWeather(data, segmentSize) {
		const _segmentSize = segmentSize ? segmentSize : 6

		let outData = [];

		let arr = data.properties.timeseries;

		let blockDate = "";
		let currentBlock;
		let currentSegment;

		let startHour = 0;
		let w_symbol = "";

		for (let i = 0; i < arr.length; i++) {
			let e = arr[i];

			let utime = Date.parse(e.time);
			let date = new Date(utime);

			let air_temperature = e.data.instant.details.air_temperature;
			let wind_from_direction = e.data.instant.details.wind_from_direction;
			let wind_speed = e.data.instant.details.wind_speed;

			if (e.data.next_6_hours)
				w_symbol = e.data.next_6_hours.summary.symbol_code;

			let dateString = date.toLocaleString("uk-UA").split(",")[0];

			if (blockDate != dateString) {
				console.log(dateString);
				blockDate = dateString;
				startHour = date.getHours();

				currentBlock = {};
				currentBlock.dateString = dateString;
				currentBlock.utime = utime;
				currentBlock.segments = [];
				outData.push(currentBlock);
			}

			//console.log(date.getHours());
			if ((date.getHours() == startHour) || ((date.getHours() - startHour) / _segmentSize >= 1)) {

				startHour = date.getHours();

				currentSegment = {};
				currentSegment.startHour = startHour;
				currentSegment.airTemp = air_temperature;
				currentSegment.windSpeed = wind_speed;
				currentSegment.windDirection = wind_from_direction;
				currentSegment.symbol = w_symbol;
				currentSegment.precipitations = 0;
				currentSegment.sumAirTemp = 0;
				currentSegment.countAirTemp = 0;
				currentBlock.segments.push(currentSegment);

			}

			currentSegment.sumAirTemp += air_temperature;
			currentSegment.countAirTemp++;

			// Assuming periods never overlap
			if (e.data.next_1_hours) {
				currentSegment.precipitations += e.data.next_1_hours.details.precipitation_amount;
			} else if (e.data.next_6_hours) {
				currentSegment.precipitations += e.data.next_6_hours.details.precipitation_amount;
			}

		}

		return outData;
	}
}
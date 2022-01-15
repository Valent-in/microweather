let weather = new WeatherProvider();

window.onload = () => {
	console.log(weather.data);

	if (weather.data.location) {
		weather.getForecast(weather.data.location.lat, weather.data.location.lon, showStatus, renderForecast);
		document.getElementById("cityname").value = weather.data.location.name;
	}
}

function createCard(time, temp, symbol, rain, wind, avgTemp) {
	let cont = document.createElement("DIV");

	let timed = document.createElement("DIV");
	let times = document.createElement("SPAN");
	times.appendChild(document.createTextNode(time));
	timed.appendChild(times);

	let timesm = document.createElement("SPAN");
	timesm.appendChild(document.createTextNode(":00"));
	timesm.classList.add("smaller-minutes");
	timed.appendChild(timesm);

	let timedb = document.createElement("DIV");
	timedb.appendChild(timed);
	timedb.classList.add("hour-card__box");

	let tempd = document.createElement("DIV");
	let temps = document.createElement("SPAN");
	temps.appendChild(document.createTextNode(temp + "°"));
	tempd.appendChild(temps);

	if (temp > 0)
		temps.classList.add("temp_warm");
	else
		temps.classList.add("temp_cold");

	let tempas = document.createElement("SPAN");
	tempas.appendChild(document.createTextNode(avgTemp));
	tempas.classList.add("additional");
	tempd.appendChild(tempas);
	tempd.classList.add("hour-card__box");

	let imaged = document.createElement("DIV");
	let imagei = buildIcon(symbol, "bg_day.svg");
	imaged.appendChild(imagei);
	imaged.classList.add("hour-card__box");

	let raind = createTextBox(rain);
	raind.classList.add("smaller-text");

	let windd = createTextBox(wind);
	windd.classList.add("smaller-text");

	cont.appendChild(timedb);
	cont.appendChild(tempd);
	cont.appendChild(imaged);
	cont.appendChild(raind);
	cont.appendChild(windd);

	cont.classList.add("hour-card");

	return cont;
}

function createTextBox(text) {
	let textd = document.createElement("DIV");
	let textp = document.createElement("P");
	textp.appendChild(document.createTextNode(text));
	textd.appendChild(textp);
	textd.classList.add("hour-card__box");

	return textd;
}

function createBlock(title) {
	let d = document.createElement("DIV");
	let p = document.createElement("P");
	p.appendChild(document.createTextNode(title));
	d.appendChild(p);

	d.classList.add("day-block");

	return d;
}

function truncateToOne(num) {
	if (num % 1 == 0) {
		//console.log("int " + num);
		return num;
	} else {
		//console.log("float " + num);
		return num.toFixed(1);
	}
}


function buildIcon(filename, bg) {
	let imgDiv = document.createElement("DIV");
	imgDiv.classList.add("imgdiv");

	_addImg(bg);

	if (filename.includes("night"))
		_addImg("moon.svg");

	if (filename.includes("day"))
		_addImg("sun.svg");

	if (filename.includes("polartwilight"))
		_addImg("twilight.svg");


	if (filename.includes("clearsky"))
		console.log("clearsky"); // do nothing
	else if (filename.includes("fair"))
		_addImg("cloud_fair.svg");
	else if (filename.includes("cloudy") || filename.indexOf("light") == 0)
		_addImg("cloud.svg");
	else
		_addImg("cloud_heavy.svg");


	if (filename.includes("rain")) {
		if (filename.includes("heavy"))
			_addImg("rain3.svg")
		else if (filename.indexOf("light") == 0)
			_addImg("rain1.svg")
		else
			_addImg("rain2.svg")
	}

	if (filename.includes("snow")) {
		if (filename.includes("heavy"))
			_addImg("snow3.svg")
		else if (filename.indexOf("light") == 0)
			_addImg("snow1.svg")
		else
			_addImg("snow2.svg")
	}

	if (filename.includes("sleet")) {
		if (filename.includes("heavy"))
			_addImg("sleet3.svg")
		else if (filename.indexOf("light") == 0)
			_addImg("sleet1.svg")
		else
			_addImg("sleet2.svg")
	}


	if (filename.includes("fog"))
		_addImg("fog.svg");

	if (filename.includes("thunder"))
		_addImg("lightning.svg");

	return imgDiv;

	function _addImg(file) {
		let img = document.createElement("IMG");
		img.src = "svg/" + file;
		imgDiv.appendChild(img);
	}
}

function clearForecastView() {
	const forecastDiv = document.getElementById("forecast");
	forecastDiv.innerHTML = "";
	console.log("clear view");
}

function renderForecast(out) {
	//console.log(data);
	//let out = parseWeather(data);

	console.log(out);

	const forecastDiv = document.getElementById("forecast");
	forecastDiv.innerHTML = "";

	const arrows = "↓↙←↖↑↗→↘↓";
	const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	const monthNames = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];


	for (let e of out) {
		let date = new Date(e.utime);
		let dateString = monthNames[date.getMonth()] + " " + date.getDate() + ", " + dayNames[date.getDay()]
		let blockDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
		block = createBlock(dateString);
		let lastCard;

		let currentDate = new Date(Date.now());
		if (compareDateDays(date, currentDate) > 0)
			block.style.opacity = "0.2";

		for (let s of e.segments) {
			let windArrow = arrows[Math.ceil((s.windDirection - 22.5) / 45)];
			let timeString = ("0" + s.startHour).substr(-2, 2);

			let airTemp = Math.round(s.airTemp);

			let avg = Math.round(s.sumAirTemp / s.countAirTemp);
			let avgAirTemp = avg == airTemp ? "" : avg;

			if (compareDateDays(date, currentDate) == 0) {
				//console.log("current date + hours " + s.startHour);
				//console.log(currentDate.getHours());
				//console.log((currentDate.getTime() - blockDate.getTime()) / 1000 / 3600)
				if (currentDate.getTime() - blockDate.getTime() > (s.startHour * 1000 * 3600))
					if (lastCard) {
						lastCard.style.opacity = "0.2";
						//console.log("remove " + s.startHour, Date.now() - blockDate.getTime())
					}
			}

			lastCard = createCard(timeString, airTemp, s.symbol, truncateToOne(Number(s.precipitations)) + " mm", windArrow + " " + Math.round(s.windSpeed) + " m/s", avgAirTemp);
			block.appendChild(lastCard);
		}

		forecastDiv.appendChild(block);
	}
}

// TODO FIX!
function compareDateDays(smaller, bigger) {
	if (smaller.getFullYear() < bigger.getFullYear())
		return 1;

	if (smaller.getMonth() < bigger.getMonth())
		return 1;

	if (smaller.getDate() < bigger.getDate())
		return 1;

	if (smaller.getFullYear() == bigger.getFullYear() &&
		smaller.getMonth() == bigger.getMonth() &&
		smaller.getDate() == bigger.getDate())
		return 0;

	return -1;
}

function searchCity() {
	let cityname = document.getElementById("cityname");
	let name = cityname.value;

	const forecastDiv = document.getElementById("forecast");
	forecastDiv.innerHTML = "";

	showStatus("Location select");

	weather.searchLocationByName(name, (res) => {
		let holder = document.getElementById("searchresult");
		holder.style.display = "block";
		holder.innerHTML = "";

		res.forEach(e => {
			console.log(e.display_name + "  >>  " + e.type);

			let nameSplit = e.display_name.split(",");
			let name = nameSplit[0];
			let desc = String(nameSplit.slice(1));

			let n = document.createElement("P");
			n.appendChild(document.createTextNode(name));

			let d = document.createElement("P");
			d.appendChild(document.createTextNode(desc));
			d.classList.add("listdescription");

			let t = document.createElement("P");

			let lat = Number(e.lat).toFixed(3);
			let lon = Number(e.lon).toFixed(3);

			t.appendChild(document.createTextNode(e.type + " - lat:" + lat + " lon:" + lon));
			t.classList.add("listinfo");

			let block = document.createElement("DIV");
			block.classList.add("search-block");
			block.appendChild(n);
			block.appendChild(t);
			block.appendChild(d);
			holder.appendChild(block);

			block.addEventListener("click", () => {
				console.log(lat, lon);
				holder.style.display = "none";
				weather.prepareLocation(name, desc, lat, lon);
				cityname.value = name;
				weather.getForecast(lat, lon, showStatus, renderForecast);
			})
		})
	});
}

function showStatus(statusMsg) {
	let statusView = document.getElementById("status-view");
	statusView.innerHTML = statusMsg;
}
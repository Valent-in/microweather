let weather = new WeatherProvider();
let interval;
let updInterval = 1000 * 60 * 33;

window.onload = () => {
	console.log(weather.data);
	refreshForecast(true)
	if (!interval)
		interval = setInterval(() => { refreshForecast(false) }, updInterval);
}

window.onfocus = () => {
	refreshForecast(false);
	if (!interval)
		interval = setInterval(() => { refreshForecast(false) }, updInterval);
}

window.onblur = () => {
	clearInterval(interval);
	interval = null;
}

const div = () => document.createElement("DIV");
const par = () => document.createElement("P");
const span = () => document.createElement("SPAN");
const textNode = (text) => document.createTextNode(text);

function refreshForecast(force) {
	if (weather.data.location) {
		weather.getForecast(showStatus, renderForecast, force);
		document.getElementById("cityname").value = weather.data.location.name;
	}
}

function createCard(time, temp, symbol, rain, wind, avgTemp) {
	let card = div();
	card.classList.add("hour-card");

	let hours = span();
	hours.appendChild(textNode(time));

	let minutes = span();
	minutes.appendChild(textNode(":00"));
	minutes.classList.add("smaller-minutes");

	let timeDiv = div();
	timeDiv.appendChild(hours);
	timeDiv.appendChild(minutes);

	let timeBox = div();
	timeBox.classList.add("hour-card__box");
	timeBox.appendChild(timeDiv);

	let tempBox = div();
	tempBox.classList.add("hour-card__box");
	let tempSapan = span();
	tempSapan.appendChild(textNode(temp + "°"));
	tempBox.appendChild(tempSapan);

	if (temp > 0)
		tempSapan.classList.add("temp_warm");
	else
		tempSapan.classList.add("temp_cold");

	let avgTempSpan = span();
	avgTempSpan.appendChild(textNode(avgTemp));
	avgTempSpan.classList.add("additional");
	tempBox.appendChild(avgTempSpan);

	let iconBox = div();
	iconBox.classList.add("hour-card__box");
	let icon = buildIcon(symbol);
	iconBox.appendChild(icon);

	let rainBox = createTextBox(rain);
	rainBox.classList.add("smaller-text");

	let windBox = createTextBox(wind);
	windBox.classList.add("smaller-text");

	card.appendChild(timeBox);
	card.appendChild(tempBox);
	card.appendChild(iconBox);
	card.appendChild(rainBox);
	card.appendChild(windBox);

	return card;
}

function createTextBox(text) {
	let d = div();
	let p = par();
	p.appendChild(textNode(text));
	d.appendChild(p);
	d.classList.add("hour-card__box");

	return d;
}

function createBlock(title) {
	let d = div();
	let p = par();
	p.appendChild(textNode(title));
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


function buildIcon(symbol) {
	let imgDiv = div();
	imgDiv.classList.add("imgdiv");

	_addImg("bg.svg");

	if (symbol.includes("night"))
		_addImg("moon.svg");

	if (symbol.includes("day"))
		_addImg("sun.svg");

	if (symbol.includes("polartwilight"))
		_addImg("twilight.svg");


	if (symbol.includes("clearsky"))
		console.log("clearsky"); // do nothing
	else if (symbol.includes("fair"))
		_addImg("cloud_small.svg");
	else if (symbol.includes("cloudy") || symbol.indexOf("light") == 0)
		_addImg("cloud.svg");
	else
		_addImg("cloud_heavy.svg");

	if (symbol.includes("rain"))
		_precipitations("rain");

	if (symbol.includes("snow"))
		_precipitations("snow");

	if (symbol.includes("sleet"))
		_precipitations("sleet");

	if (symbol.includes("fog"))
		_addImg("fog.svg");

	if (symbol.includes("thunder"))
		_addImg("lightning.svg");

	return imgDiv;

	function _precipitations(type) {
		if (symbol.includes("heavy"))
			_addImg(type + "3.svg")
		else if (symbol.indexOf("light") == 0)
			_addImg(type + "1.svg")
		else
			_addImg(type + "2.svg")
	}

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

function renderForecast(data) {
	const forecastDiv = document.getElementById("forecast");
	forecastDiv.innerHTML = "";

	console.log(data);
	if (!data)
		return;

	const arrows = "↓↙←↖↑↗→↘↓";
	const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	const monthNames = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];


	for (let e of data) {
		let date = new Date(e.utime);
		let dateString = monthNames[date.getMonth()] + " " + date.getDate() + ", " + dayNames[date.getDay()]
		let blockDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
		let block = createBlock(dateString);
		let lastCard;

		let currentDate = new Date(Date.now());
		if (compareDateDays(date, currentDate) < 0)
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

function compareDateDays(smaller, bigger) {
	if (smaller.getFullYear() < bigger.getFullYear())
		return -1;

	if (smaller.getFullYear() > bigger.getFullYear())
		return 1;

	if (smaller.getMonth() < bigger.getMonth())
		return -1;

	if (smaller.getMonth() > bigger.getMonth())
		return 1;

	if (smaller.getDate() < bigger.getDate())
		return -1;

	if (smaller.getDate() > bigger.getDate())
		return 1;

	return 0;
}

function searchCity() {
	let cityname = document.getElementById("cityname");
	let name = cityname.value;

	const forecastDiv = document.getElementById("forecast");
	forecastDiv.innerHTML = "";

	showStatus("Location select");

	weather.searchLocationByName(name, (result) => {
		let holder = document.getElementById("searchresult");
		holder.style.display = "block";
		holder.innerHTML = "";

		result.forEach(e => {
			let nameP = par();
			nameP.appendChild(textNode(e.name));

			let descP = par();
			descP.appendChild(textNode(e.description));
			descP.classList.add("listdescription");

			let typeP = par();

			typeP.appendChild(textNode(e.type + " - lat:" + e.lat + " lon:" + e.lon));
			typeP.classList.add("listinfo");

			let block = div();
			block.classList.add("search-block");
			block.appendChild(nameP);
			block.appendChild(typeP);
			block.appendChild(descP);

			holder.appendChild(block);

			block.addEventListener("click", () => {
				console.log(e.lat, e.lon);
				holder.style.display = "none";
				cityname.value = e.name;
				weather.setLocation(e.lat, e.lon, e.name, e.description);
				weather.getForecast(showStatus, renderForecast);
			})
		})
	}, showStatus);
}

function showStatus(statusMsg, type) {
	let statusView = document.getElementById("status-view");
	statusView.innerHTML = statusMsg;

	statusView.classList.remove("status_normal");
	statusView.classList.remove("status_warning");
	statusView.classList.remove("status_error");

	if (type == "warning")
		statusView.classList.add("status_warning");
	else if (type == "error")
		statusView.classList.add("status_error");
	else
		statusView.classList.add("status_normal");
}
// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	try {
		const [tracks, racers] = await Promise.all([getTracks(), 	getRacers()]); // so both getTracks and getRacers will render at the same time		
		const htmlForTracks = renderTrackCards(tracks);
		renderAt('#tracks', htmlForTracks);
		
		const htmlForRacers = renderRacerCars(racers);		
		renderAt('#racers', htmlForRacers);

	} catch(error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		const { target } = event

		// Race track form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target)
		}

		// Podracer form field
		if (target.matches('.card.podracer')) {
			handleSelectPodRacer(target)
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()
	
			// start race
			handleCreateRace()
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate()
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	try {
		const { player_id, track_id } = store; // get data from store
		// Checking if the player_id or track_id = undefined
		console.log(player_id, track_id);
		if (player_id == undefined || track_id == undefined) {
			alert('Please chose player and track'); // notifying the user
			throw new Error ("player_id or track_id is undefined") // to stop the functoin
		};
		// create Race 
		const newRace = await createRace(player_id, track_id);
		
		// For the API to work properly, the race id should be race id - 1
		store.race_id = newRace.ID;

		renderAt('#race', renderRaceStartView(newRace.Track))

		// console.log(store);

		await runCountdown();

		await startRace(store.race_id);
		
		await runRace(store.race_id);

	} catch (error) {
		console.log("Problem with createRace request:: ", error)
	}
}

function runRace(raceID) {
	return new Promise(resolve => {
		const raceInterval = setInterval(async () => { // we used async await as we will fetch race
			try {
				const res = await getRace(raceID);
				console.log(res);
				if (res.status === 'in-progress') {
					renderAt('#leaderBoard', raceProgress(res.positions));
				} else if (res.status === 'finished') {
					clearInterval(raceInterval);
					renderAt('#race', resultsView(res.positions));
					resolve(res);
				} else {
					throw new Error(`You can't reach here`)
				}

			} catch (error) {
				console.log("Problem with getRace request::", error)			
			}
		}, 500)
	})
}

async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(1000)
		let timer = 3

		return new Promise(resolve => {
			const runCountdownInterval = setInterval(() => {
				if (timer === 0) {
					clearInterval(runCountdownInterval);
					resolve();
					return;
				}
				document.getElementById('big-numbers').innerHTML = --timer
			}, 1000) // 1000 milisecs = 1sec
		})
	} catch(error) {
		console.log(error);
	}
}

function handleSelectPodRacer(target) {
	console.log("selected a pod", target.id)

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	store.player_id = target.id;
}

function handleSelectTrack(target) {
	console.log("selected a track", target.id)

	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	store.track_id = target.id;
	
}

function handleAccelerate() {
	console.log("accelerate button clicked")
	accelerate(store.race_id)
		.then(() => {
			console.log('accelerated');
		})
		.catch(err => {
			console.warn('Problem with handleAccelerate request::' , err);
		});
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('')

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer

	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>Top Speed: ${top_speed}</p>
			<p>Acceleration: ${acceleration}</p>
			<p>handling: ${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}

	const results = tracks.map(renderTrackCard).join('')

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
	const { id, name } = track

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track, racers) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
	let userPlayer = positions.find(e => e.id === parseInt(store.player_id))
	userPlayer.driver_name += " (you)"

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results.join('')}
			</section>
		</main>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:3001'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	}
}

function getTracks() {
	return (
		fetch (`${SERVER}/api/tracks`, {
			...defaultFetchOpts(), // default fetch options
			method: 'GET',  //  by default request is GET 
		})
		.then(res => res.json())
		.catch(err =>	console.log(`Problem with getTracks request:: ${err}`))
	)
}

function getRacers() {
	return (
		fetch (`${SERVER}/api/cars`, {
			...defaultFetchOpts(), // default fetch options
			method: 'GET',  //  by default request is GET 
		})
		.then(res => res.json())
		.catch(err =>	console.log(`Problem with getRacers request:: ${err}`))
	)
}

function createRace(player_id, track_id) {
	player_id = parseInt(player_id)
	track_id = parseInt(track_id)
	const body = { player_id, track_id }
	
	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
	.then(res => res.json())
	.catch(err => console.log("Problem with createRace request::", err))
}

function getRace(id) {
	const newRaceId = parseInt(id) - 1; // to convert it to num 
	return (
		fetch(`${SERVER}/api/races/${newRaceId}`, {
			...defaultFetchOpts(),
			method: "GET"
		})
		.then(res => res.json())
		.catch(err => console.warn("Problem with getRace request::", err))
	)
}

function startRace(id) {
	const newRaceId = parseInt(id) - 1; // to convert it to num 
	return fetch(`${SERVER}/api/races/${newRaceId}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	// .then(res => res.json()) as it post method
	.catch(err => console.warn("Problem with startRace request::", err))
}

function accelerate(id) {
	const newRaceId = parseInt(id) - 1; // to convert it to num 
	return (
		fetch(`${SERVER}/api/races/${newRaceId}/accelerate`, {
			...defaultFetchOpts(),
			method: 'POST'
		})
		// .then(res => console.log(res))
		.catch(err => console.warn("Problem with accelerate request::", err))
	)
}

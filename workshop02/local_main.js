const range = require('express-range')
const compression = require('compression')
const cors = require('cors')

const express = require('express')

const data = require('./zips')
const CitiesDB = require('./zipsdb')

//Load application keys
const db = CitiesDB(data);

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Start of workshop

// Mandatory workshop
// TODO GET /api/states
app.get('/api/states',
	(req, resp) => { //handler
		const result = db.findAllStates();
		//status code 
		resp.status(200)
		//set content-Type 
		resp.type('application/json')
		resp.set('X-generated-on', (new Date()).toDateString())
		resp.set('Access-control-Allow-Origin', '*')
		resp.json(result)
	}
)
// TODO GET /api/state/:state
app.get('/api/state/:state',
	(req, resp) => {//handler
		const state = req.params.state;
		const limit = parseInt(req.query.limit) || 10;
		const offset = parseInt(req.querry.offset) || 0;
		const result = db.findCitiesBystate(state, { offset: offset, limit: limit })
		resp.status(200)
		resp.type('application/json')
		resp.json(result)
	}
)

// TODO GET /api/city/:cityId
app.get('/api/city/:city/cityId',
	(req, resp) => {//handler
		const city = req.params.cityId;
		const result = db.findCityById(cityId)

		resp.status(200)
		resp.type('application/json')
		resp.json(result)
	}
)


// TODO POST /api/city
app.post('/api/city',
	(req, resp) => {
		const body = req.body;
		if (!db.validateForm(body)) {
			resp.status(400)
			resp.type('application/json')
			resp.json({ 'message': 'incomplete form' })
			return
		}

		db.insertCity(body)
		resp.status(201)
		resp.type('application/json')
		resp.json({ message: 'created.' })
	}
)

// Optional workshop
// TODO HEAD /api/state/:state
// IMPORTANT: HEAD must be place before GET for the
// same resource. Otherwise the GET handler will be invoked


// TODO GET /state/:state/count
app.get('/api/state/:state/count',
	(req, resp) => {//handler
		const state = req.params.state;
		const count = db.countCitiesInState(state)
		const result = {
			state: state,
			numofcities: count,
			timestamp: (new Date()).toDateString()
		}
		resp.status(200)
		resp.type('application/json')
		resp.json(result)
	}
)
// TODO GET /api/city/:name




// End of workshop

const PORT = parseInt(process.argv[2] || process.env.APP_PORT) || 3000;
app.listen(PORT, () => {
	console.info(`Application started on port ${PORT} at ${new Date()}`);
});


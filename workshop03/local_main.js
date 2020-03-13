const { join } = require('path');
const fs = require('fs');
const preconditions = require('express-preconditions')
const cors = require('cors');
const range = require('express-range')
const compression = require('compression')

const { Validator, ValidationError } = require('express-json-validator-middleware')
const OpenAPIValidator = require('express-openapi-validator').OpenApiValidator;

const schemaValidator = new Validator({ allErrors: true, verbose: true });

const express = require('express')

const data = require('./zips')
const CitiesDB = require('./zipsdb')

//Load application keys
const db = CitiesDB(data);

const app = express();

 //disable expree etag
app.set('etag',false)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Start of workshop
var count=0

// TODO 1/2 Load schemans
new OpenAPIValidator({
    apiSpec: join(__dirname, 'schema', 'zips.yaml')
}).install(app)
.then(() => {

    // Start of workshop
    // TODO 2/2 Copy your routes from workshop02 here
    // ===vvv=== Start of workshop02 ===vvv===

    // Mandatory workshop
    // TODO GET /api/states
    app.get('/api/states',
        (req, resp) => { //handler
                count++
            console.info('in Get /spi/states')
            const result = db.findAllStates();
            //status code 
            resp.status(200);
            //set cache,public,age =5min
            resp.set('cache-control',"public, max-age=300")
            //set content-Type 
            resp.type('application/json')
            resp.set('X-generated-on', (new Date()).toDateString())
            resp.set('Access-control-Allow-Origin', '*')
            resp.json(result)
        }
    )

    const options= {
        stateAsync: (req) => {
            const state = req.params.state 
            const limit = parseInt(req.query.offset) || 10;
            const offset = parseInt(req.query.offset) ||0;
            return Promise.resolve({
                //"CA_0_10"
                etag: `"${state}_${offset}_${limit}"`
            })
        }
    }

    // TODO GET /api/state/:state
    app.get('/api/state/:state',
        preconditions(options),
        (req, resp) => {//handler
            console.info(">>>>> state: ")
            const state = req.params.state;
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            const result = db.findCitiesByState(state, { offset: offset, limit: limit })
            resp.status(200)
            resp.type('application/json')
            resp.set("Etag", `"${state}_${offset}_${limit}"`)
            resp.json(result)
        }
    )

    // TODO GET /api/city/:cityId
    app.get('/api/city/:city/cityId',
        (req, resp) => {//handler
            const city = req.params.cityId;
            const result = db.findCityById(cityId)

            resp.status(200)
            //set content-type
            resp.type('application/json')
            //Etag
            resp.set("Etag:`${state}_${offset}_${limit}")
            resp.json(result)
        }
    )


    // TODO POST /api/city
    app.post('/api/city',
        (req, resp) => {
            const body = req.body;
            // if (!db.validateForm(body)) {
            //     resp.status(400)
            //     resp.type('application/json')
            //     resp.json({ 'message': 'incomplete form' })
            //     return
            // }

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

    app.use('/schema', express.static(join(__dirname, 'schema')));

    app.use((error, req, resp, next) => {
        if (error instanceof ValidationError) {
            console.error('Schema validation error: ', error)
            return resp.status(400).type('application/json').json({ error: error });
        }

        else if (error.status) {
            console.error('OpenAPI specification error: ', error)
            return resp.status(400).type('application/json').json({ error: error });
        }

        console.error('Error: ', error);
        resp.status(400).type('application/json').json({ error: error });

    });

    const PORT = parseInt(process.argv[2] || process.env.APP_PORT) || 3000;
    app.listen(PORT, () => {
        console.info(`Application started on port ${PORT} at ${new Date()}`);
    });
})
.catch(error => {
    console.error("error ", error)
})
// TODO GET /api/city/:name

// ===^^^=== End of workshop02 ===^^^===

// End of workshop


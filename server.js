'use strict'

// Modules
const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const api = require('routes/api')
const service = require('routes/service')
const redis = require('redis')

// Constants
const app = express()
const server = http.createServer(app)
const client = redis.createClient()

// Set sequence if it does not exist
client.setnx('sequence', 0)
client.quit()

// Middleware
app.use(bodyParser.urlencoded({ extended: true }))

// Routes
app.use('/', express.static('public'))
app.use('/api', api)
app.use('/service', service)

// Start server
server.listen(3000, function() {
	console.log('Server is fully armed and operational on port: 3000')
})
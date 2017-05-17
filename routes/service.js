'use strict'

// Modules
const router = require('express').Router()
const redis = require('redis')

// Open event stream
router.use((req, res, next) => {

	// Set header information
	res.set({
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
	})

	// Retry in 10 seconds if disconnected
	res.write('retry: 10000\n')
	
	// Prevent timeout
	res.connection.setTimeout(0)
	next()
})

// Check if event id matches the current sequence
router.use((req, res, next) => {

	// Last event ID
	let eventid = req.get('Last-Event-ID')

	// Proceed if no event ID is sent
	if (!eventid) {
		return next()
	}

	// Initialize redis client
	req.store = redis.createClient()

	// Get sequence
	req.store.get('sequence', (err, seq) => {

		// If latest ID does not match the sequence
		if (eventid === seq) {

			// Close connection
			req.store.quit()

			return next()
		}

		// Generate array of missed notifications
		let missed = []
		for( let i = eventid; i <= seq; i++) {
			missed.push('notification:' + i)
		}

		// Get missed notifications from redis
		req.store.mget(missed, (err, results) => {

			// Close connection
			req.store.quit()

			// Send sequence update
			res.write(`id: ${seq}\n`)

			// Send missed notifications
			results.forEach(result => {
				res.write(`data: ${result}\n\n`)
			})
		})
	})
})

// Route to service
router.get('/', function(req, res) {

	// Subscribe to notification channel
	req.subscriber = redis.createClient()
	req.subscriber.subscribe('notification')

	req.subscriber.on('message', (err, message) => {
		// Parse the message
		message = JSON.parse(message)

		// Write id
		res.write(`id: ${message.id}\n`)		

		// Write data
		res.write(`data: ${message.data}\n\n`)
	})

	// Close connection
	req.subscriber.on('close', () => {
		return req.subscriber.quit()
	})

})

// Export
module.exports = router
'use strict'

// Modules
const router = require('express').Router()
const redis = require('redis')

// Constants
const ttl = 60 * 60	// Time to live for expiring key value pairs

// API routes
router.post('/push', function(req, res, next) {

	// If notification does not exist, abort
	if ( !req.body.notification ) {
		return res.status(404).json({ error: 'Request invalid' })
	}
	
	// Initialize redis
	req.store = redis.createClient()

	// Increase the sequence
	req.store.incr('sequence')

	// Get sequence
	req.store.get('sequence', (err, seq) => {
		let key = 'notification:' + seq
		let value = req.body.notification

		// Return response
		res.json({ key, value })

		// Store key value pair (ttl 60)
		req.store.setex(key, ttl, value)

		// Create payload
		let payload = JSON.stringify({
			id: seq,
			data: value
		})

		// Publish to channel
		req.store.publish('notification', payload)

		// Close connection
		req.store.quit()
		})
})

// Export
module.exports = router
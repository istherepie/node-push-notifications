import Vue from 'vue'
import axios from 'axios'

new Vue({
  el: '#root',
  data: {
  	connection: null,
  	title: 'PUSH NOTIFICATIONS',
  	placeholder: 'Send a new notification',
    message: null,
  	notifications: []
  },
  methods: {
  	sendNotification: function() {
  		axios.put('/api/push', {
		    notification: this.message
		  })
  		.then(response => {
  			this.message = null
		    console.log(response)
		  })
		  .catch(error => {
		    console.log(error)
		  })
  	},
    trimmer: function() {
      this.notifications.splice(-1, 1)
    }
  },
  mounted() {
  	let service = new EventSource('/service')

		service.addEventListener('open', message => {
 			this.connection = true
		}, false)

		service.addEventListener('message', message => {
      message = {
        time: Date.now(),
        data: message.data
      }
			this.notifications.unshift(message)
      setTimeout(this.trimmer, 8000)
		}, false)
  	
		service.addEventListener('error', error => {
			this.connection = false
		}, false)
  }
})
import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/App'

// styles
import 'assets/css/bootstrap.min.css'
import 'assets/css/paper-dashboard.min.css'
import 'assets/demo/demo.css'

ReactDOM.render(<App network='localhost' />, document.getElementById('root'))

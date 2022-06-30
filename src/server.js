import app from './index.js'

const port = process.env.APP_PORT || 4000

app.listen(port, () => console.log('APP listening on port:', port))

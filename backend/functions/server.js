import express from 'express'
import cors from 'cors'
import { onRequest } from 'firebase-functions/v2/https'
import adminRouter from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'

// app config
const app = express()

// middleware
app.use(express.json())
app.use(cors({ origin: true }))

// API end points
app.use('/api/admin', adminRouter)
app.use('/api/doctor', doctorRouter)
app.use('/api/user', userRouter)

app.get('/', (req, res) => {
    res.send('API working')
})

// Returns JSON for upload errors (file too large, not an image) instead of an HTML error page
app.use((err, req, res, next) => {
    console.log(err)
    res.json({ success: false, message: err.message })
})

// No app.listen(): Firebase runs the app through this exported function.
// Deployed as the function "api". Secrets are read as process.env.<NAME>.
export const api = onRequest(
    {
        region: 'europe-west1',
        invoker: 'public',
        maxInstances: 10,
        secrets: ['JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD']
    },
    app
)
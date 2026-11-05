import express from 'express'
import { addDoctor,allDoctors,appointmentsAdmin,loginAdmin,appointmentCancel, adminDashboard, deleteDoctor } from '../controllers/adminController.js'

import authAdmin from '../middlewares/authAdmin.js'
import { changeAvailability } from '../controllers/doctorController.js'

const adminRouter= express.Router()

adminRouter.post('/add-doctor',authAdmin,addDoctor)
adminRouter.post('/login',loginAdmin)
adminRouter.post('/all-doctors',authAdmin,allDoctors)
adminRouter.post('/change-availability',authAdmin,changeAvailability)
adminRouter.post('/appointments',authAdmin,appointmentsAdmin)
adminRouter.post('/cancel-appointment',authAdmin,appointmentCancel)
adminRouter.get('/dashboard',authAdmin,adminDashboard )
adminRouter.post('/delete-doctor', authAdmin, deleteDoctor)

export default adminRouter
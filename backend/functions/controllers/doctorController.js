import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {
    findDoctorById, findDoctorByEmail, getAvailableDoctors,
    toggleDoctorAvailability, updateDoctorProfile as updateDocProfile, removeBookedSlot
} from '../models/doctorModel.js'
import {
    getAppointmentsByDoctor, findAppointmentById,
    cancelAppointment, completeAppointment, attachCurrentPatientData
} from '../models/appointmentModel.js'

// replaces: doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
const changeAvailability = async (req, res) => {
    try {
        const { docId } = req.body
        await toggleDoctorAvailability(docId)
        res.json({ success: true, message: 'Availability Changed' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// replaces: doctorModel.find({}).select(['-password','-email'])
const doctorList = async (req, res) => {
    try {
        const doctors = await getAvailableDoctors()
        res.json({ success: true, doctors })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// replaces: doctorModel.findOne({ email })
const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body
        const doctor = await findDoctorByEmail(email)

        if (!doctor) {
            return res.json({ success: false, message: 'Invalid Credentials' })
        }

        const isMatch = await bcrypt.compare(password, doctor.password)
        if (isMatch) {
            const token = jwt.sign({ id: doctor.id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: 'Invalid Credentials' })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// the doctor's appointments, with each patient's current profile data
const appointmentsDoctor = async (req, res) => {
    try {
        const appointments = await getAppointmentsByDoctor(req.docId)
        const withCurrentPatients = await attachCurrentPatientData(appointments)
        res.json({ success: true, appointments: withCurrentPatients })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// replaces: appointmentModel.findByIdAndUpdate(id, { isCompleted: true })
const appointmentComplete = async (req, res) => {
    try {
        const { appointmentId } = req.body
        const appointmentData = await findAppointmentById(appointmentId)

        if (appointmentData && String(appointmentData.docId) === String(req.docId)) {
            await completeAppointment(appointmentId)
            return res.json({ success: true, message: 'Appointment Completed' })
        } else {
            return res.json({ success: false, message: 'Mark Failed' })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// replaces: appointmentModel.findByIdAndUpdate(id, { cancelled: true })
const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body
        const appointmentData = await findAppointmentById(appointmentId)

        if (appointmentData && String(appointmentData.docId) === String(req.docId)) {
            if (appointmentData.cancelled) {
                return res.json({ success: false, message: 'Appointment already cancelled' })
            }

            // Marks it cancelled and frees the booking lock (slots collection) in one transaction
            await cancelAppointment(appointmentId)

            // Also free the slot in the list the frontend reads (atomic, no read-modify-write)
            const { docId, slotDate, slotTime } = appointmentData
            await removeBookedSlot(docId, slotDate, slotTime)

            return res.json({ success: true, message: 'Appointment Cancelled' })
        } else {
            return res.json({ success: false, message: 'Cancellation Failed' })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// dashboard numbers; the latest appointments carry current patient data
const doctorDashboard = async (req, res) => {
    try {
        const appointments = await getAppointmentsByDoctor(req.docId)

        let earnings = 0
        appointments.forEach(item => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount
            }
        })

        const patients = [...new Set(appointments.map(a => a.userId))]

        // only the 5 latest need fresh patient data
        const latestAppointments = await attachCurrentPatientData(appointments.slice(0, 5))

        const dashData = {
            earnings,
            appointments: appointments.length,
            patients:     patients.length,
            latestAppointments
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// replaces: doctorModel.findById(docId).select('-password')
const doctorProfile = async (req, res) => {
    try {
        const doctor = await findDoctorById(req.docId)
        if (!doctor) return res.json({ success: false, message: 'Doctor not found' })

        const { password, ...profileData } = doctor
        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// replaces: doctorModel.findByIdAndUpdate(docId, { fees, address, available })
const updateDoctorProfile = async (req, res) => {
    try {
        const { fees, address, available } = req.body
        await updateDocProfile(req.docId, { fees, address, available })
        res.json({ success: true, message: 'Profile Updated' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    changeAvailability, doctorList, loginDoctor,
    appointmentsDoctor, appointmentCancel, appointmentComplete,
    doctorDashboard, doctorProfile, updateDoctorProfile
}
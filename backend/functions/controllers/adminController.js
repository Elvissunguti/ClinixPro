import validator from 'validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createDoctor, getAllDoctors, findDoctorById, findDoctorByEmail, removeBookedSlot, deleteDoctor as removeDoctorFromDB } from '../models/doctorModel.js'
import { getAllAppointments, findAppointmentById, cancelAppointment, updatePaymentStatus } from '../models/appointmentModel.js'
import { getAllUsers, getUsersByIds } from '../models/userModel.js'


// Appointments store a snapshot of the patient taken at booking time.
// This replaces that snapshot with the patient's current profile data
// (name, image, dob, gender, phone). If the user no longer exists, the snapshot is kept.
const attachCurrentPatientData = async (appointments) => {
    const usersById = await getUsersByIds(appointments.map(a => a.userId))

    return appointments.map(a => {
        const u = usersById[a.userId]
        if (!u) return a
        return {
            ...a,
            userData: {
                ...a.userData,
                name: u.name,
                image: u.image || '',
                dob: u.dob,
                gender: u.gender,
                phone: u.phone
            }
        }
    })
}


// API for adding Doctor
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address, image } = req.body

        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.json({ success: false, message: 'Missing Details' })
        }
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: 'Please Enter a valid Email' })
        }
        if (password.length < 5) {
            return res.json({ success: false, message: 'Please enter a strong password' })
        }
        if (!image) {
            return res.json({ success: false, message: 'Doctor image is required' })
        }
        // Only accept image URLs that came from Firebase Storage
        if (!image.startsWith('https://firebasestorage.googleapis.com/')) {
            return res.json({ success: false, message: 'Invalid image URL' })
        }

        // (createDoctor re-checks inside a transaction.)
        if (await findDoctorByEmail(email)) {
            return res.json({ success: false, message: 'Doctor already exists' })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // the frontend sends an object; also accept a JSON string just in case
        const parsedAddress = typeof address === 'string' ? JSON.parse(address) : address

        await createDoctor({
            name,
            email,
            password: hashedPassword,
            image,
            speciality,
            degree,
            experience,
            about,
            fees,
            address: parsedAddress
        })

        res.json({ success: true, message: 'Doctor added' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for admin login
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' })
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: 'Invalid credentials' })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
    try {
        const doctors = await getAllDoctors()   // already strips password
        res.json({ success: true, doctors })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all appointments, with each patient's current profile data
const appointmentsAdmin = async (req, res) => {
    try {
        const appointments = await getAllAppointments()
        const withCurrentPatients = await attachCurrentPatientData(appointments)
        res.json({ success: true, appointments: withCurrentPatients })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for appointment cancellation by admin
const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body

        const appointmentData = await findAppointmentById(appointmentId)
        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' })
        }
        if (appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment already cancelled' })
        }

        // Marks it cancelled and frees the booking lock (slots collection) in one transaction
        await cancelAppointment(appointmentId)

        if (appointmentData.paymentStatus === 'paid') {
            await updatePaymentStatus(appointmentId, 'REFUNDED')
        }

        // Update the slot list the frontend reads (atomic, no read-modify-write)
        const { docId, slotDate, slotTime } = appointmentData
        if (await findDoctorById(docId)) {
            await removeBookedSlot(docId, slotDate, slotTime)
        }

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
    try {
        const doctors      = await getAllDoctors()
        const users        = await getAllUsers()
        const appointments = await getAllAppointments()

        // only the 5 latest need fresh patient data
        const latestAppointments = await attachCurrentPatientData(appointments.slice(0, 5))

        const dashData = {
            doctors:      doctors.length,
            appointments: appointments.length,
            patients:     users.length,
            latestAppointments
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to delete a doctor
const deleteDoctor = async (req, res) => {
    try {
        const { docId } = req.body

        if (!docId)
            return res.json({ success: false, message: 'Doctor ID is required' })

        const doctor = await findDoctorById(docId)
        if (!doctor)
            return res.json({ success: false, message: 'Doctor not found' })

        await removeDoctorFromDB(docId)

        res.json({ success: true, message: 'Doctor deleted successfully' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { addDoctor, loginAdmin, allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard, deleteDoctor }
import validator from 'validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createUser, findUserByEmail, findUserById, updateUser, updateUserImage } from '../models/userModel.js'
import { findDoctorById, addBookedSlot, removeBookedSlot } from '../models/doctorModel.js'
import {
    createAppointment,
    getAppointmentsByUser,
    findAppointmentById,
    cancelAppointment as cancelAppointmentDB,
    markAppointmentPaid,
    updatePaymentStatus
} from '../models/appointmentModel.js'


// API to register user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password)
            return res.json({ success: false, message: 'Missing Details' })
        if (!validator.isEmail(email))
            return res.json({ success: false, message: 'Enter a valid email' })
        if (password.length < 5)
            return res.json({ success: false, message: 'Enter a strong password' })

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const user = await createUser({ name, email, password: hashedPassword })
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error)
        // createUser throws 'User already exists' (replaces the SQLite UNIQUE error)
        if (error.message?.includes('already exists'))
            return res.json({ success: false, message: 'Email already registered' })
        res.json({ success: false, message: error.message })
    }
}

// API for user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await findUserByEmail(email)

        if (!user)
            return res.json({ success: false, message: 'User does not exist' })

        const isMatch = await bcrypt.compare(password, user.password)
        if (isMatch) {
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: 'Invalid Credentials' })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {
    try {
        const user = await findUserById(req.userId)
        if (!user) return res.json({ success: false, message: 'User not found' })

        const { password, ...userData } = user
        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update user profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.userId
        const { name, phone, address, dob, gender, image } = req.body
        

        if (!name || !phone || !dob || !gender)
            return res.json({ success: false, message: 'Data Missing' })

        const parsedAddress = typeof address === 'string' ? JSON.parse(address) : address
        await updateUser(userId, {
            name, phone, gender, dob, image,
            address: { line1: parsedAddress?.line1 ?? '', line2: parsedAddress?.line2 ?? '' }
        })

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to book appointment
const bookAppointment = async (req, res) => {
    try {
        const userId = req.userId
        const { docId, slotDate, slotTime } = req.body

        if (!docId || !slotDate || !slotTime)
            return res.json({ success: false, message: 'Missing Details' })

        const docData = await findDoctorById(docId)
        if (!docData)
            return res.json({ success: false, message: 'Doctor not found' })
        if (!docData.available)
            return res.json({ success: false, message: 'Doctor is not available' })

        const userData = await findUserById(userId)
        const { password: _dp, slots_booked: _sb, ...cleanDocData } = docData

        // Transaction inside createAppointment locks the slot, so two patients
        // can't book the same doctor/date/time. It throws 'Slot not available'.
        await createAppointment({
            userId, docId, userData,
            docData: cleanDocData,
            amount: docData.fees,
            slotTime, slotDate
        })

        // Keep the list the frontend reads in sync (atomic, no read-modify-write)
        await addBookedSlot(docId, slotDate, slotTime)

        res.json({ success: true, message: 'Appointment Booked' })

    } catch (error) {
        console.log(error)
        if (error.message === 'Slot not available')
            return res.json({ success: false, message: 'Slot is not available' })
        res.json({ success: false, message: error.message })
    }
}

// API to get user appointments
const listAppointment = async (req, res) => {
    try {
        const appointments = await getAppointmentsByUser(req.userId)
        res.json({ success: true, appointments })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {
        const userId = req.userId
        const { appointmentId } = req.body

        const appointmentData = await findAppointmentById(appointmentId)
        if (!appointmentData)
            return res.json({ success: false, message: 'Appointment not found' })

        if (String(appointmentData.userId) !== String(userId))
            return res.json({ success: false, message: 'Unauthorized Action' })

        if (appointmentData.cancelled)
            return res.json({ success: false, message: 'Appointment already cancelled' })

        // Marks it cancelled and frees the booking lock (slots collection) in one transaction
        await cancelAppointmentDB(appointmentId)

        if (appointmentData.paymentStatus === 'paid')
            await updatePaymentStatus(appointmentId, 'REFUNDED')

        // Free the slot in the list the frontend reads
        const { docId, slotDate, slotTime } = appointmentData
        if (await findDoctorById(docId))
            await removeBookedSlot(docId, slotDate, slotTime)

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Mock payment (replaces Razorpay)
const paymentMock = async (req, res) => {
    try {
        const { appointmentId } = req.body
        const appointment = await findAppointmentById(appointmentId)

        if (!appointment || appointment.cancelled)
            return res.json({ success: false, message: 'Invalid appointment' })
        if (String(appointment.userId) !== String(req.userId))
            return res.json({ success: false, message: 'Unauthorized Action' })
        if (appointment.paymentStatus === 'paid')
            return res.json({ success: false, message: 'Already paid' })

        await markAppointmentPaid(appointmentId)
        res.json({ success: true, message: 'Payment successful' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export {
    registerUser, loginUser, getProfile, updateProfile,
    bookAppointment, listAppointment, cancelAppointment,
    paymentMock
}
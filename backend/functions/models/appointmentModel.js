import { db, appointments, slots, slotId } from '../database/firestore.js'
import { getUsersByIds } from './userModel.js'

// Only these fields are copied into the appointment, so password hashes
// or other private fields never get stored by accident.
const pickUser = (u = {}) => ({
    name:    u.name    ?? '',
    email:   u.email   ?? '',
    phone:   u.phone   ?? '',
    image:   u.image   ?? '',
    dob:     u.dob     ?? '',
    gender:  u.gender  ?? '',
    address: u.address ?? { line1: '', line2: '' }   // stored as a real object, no JSON.stringify
})

const pickDoctor = (d = {}, amount) => ({
    name:       d.name       ?? '',
    speciality: d.speciality ?? '',
    image:      d.image      ?? '',
    degree:     d.degree     ?? '',
    address:    d.address    ?? { line1: '', line2: '' },
    fees:       amount
})

// replaces: new appointmentModel({...}).save()
export async function createAppointment({ userId, docId, userData, docData, amount, slotTime, slotDate }) {
    const apptRef = appointments.doc()
    const slotRef = slots.doc(slotId(docId, slotDate, slotTime))

    // Transaction: check the slot and write both documents atomically.
    await db.runTransaction(async (t) => {
        const slot = await t.get(slotRef)
        if (slot.exists) throw new Error('Slot not available')

        t.set(slotRef, { appointmentId: apptRef.id })
        t.set(apptRef, {
            userId,
            docId,
            slotDate,
            slotTime,
            amount,
            userData: pickUser(userData),
            docData:  pickDoctor(docData, amount),
            date:          Date.now(),
            cancelled:     false,
            isCompleted:   false,
            payment:       false,
            paymentStatus: 'pending'
        })
    })

    return { _id: apptRef.id, id: apptRef.id }
}

// replaces: appointmentModel.find({})
export async function getAllAppointments() {
    const snap = await appointments.get()
    return snap.docs.map(formatAppointment).sort(newestFirst)
}

// replaces: appointmentModel.find({ userId })
export async function getAppointmentsByUser(userId) {
    const snap = await appointments.where('userId', '==', userId).get()
    return snap.docs.map(formatAppointment).sort(newestFirst)
}

// replaces: appointmentModel.find({ docId })
export async function getAppointmentsByDoctor(docId) {
    const snap = await appointments.where('docId', '==', docId).get()
    return snap.docs.map(formatAppointment).sort(newestFirst)
}

export async function attachCurrentPatientData(list) {
    const usersById = await getUsersByIds(list.map(a => a.userId))

    return list.map(a => {
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

// replaces: appointmentModel.findById(id)
export async function findAppointmentById(id) {
    if (!id) return null
    const snap = await appointments.doc(String(id)).get()
    return snap.exists ? formatAppointment(snap) : null
}

// replaces: appointmentModel.findByIdAndUpdate(id, { cancelled: true })
// Also frees the slot so someone else can book it.
export async function cancelAppointment(id) {
    const ref = appointments.doc(String(id))
    await db.runTransaction(async (t) => {
        const snap = await t.get(ref)
        if (!snap.exists) return
        const a = snap.data()
        t.update(ref, { cancelled: true })
        t.delete(slots.doc(slotId(a.docId, a.slotDate, a.slotTime)))
    })
}

// replaces: appointmentModel.findByIdAndUpdate(id, { isCompleted: true })
export async function completeAppointment(id) {
    await appointments.doc(String(id)).update({ isCompleted: true })
}

// replaces: appointmentModel.findByIdAndUpdate(id, { payment: true, paymentStatus: 'paid' })
export async function markAppointmentPaid(id) {
    await appointments.doc(String(id)).update({ payment: true, paymentStatus: 'paid' })
}

export async function updatePaymentStatus(id, status) {
    await appointments.doc(String(id)).update({ paymentStatus: status })
}

const newestFirst = (a, b) => b.date - a.date

// Firestore already stores the nested shape the frontend reads
// (userData / docData / booleans), so this only adds the id fields.
function formatAppointment(snap) {
    return { _id: snap.id, id: snap.id, ...snap.data() }
}
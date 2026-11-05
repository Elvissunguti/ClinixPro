import { FieldValue } from 'firebase-admin/firestore'
import { db, doctors } from '../database/firestore.js'

// replaces: new doctorModel({...}).save()
export async function createDoctor({ name, email, password, image, speciality, degree, experience, about, fees, address }) {
    const cleanEmail = email.toLowerCase()
    const ref = doctors.doc()

    // Firestore has no UNIQUE constraint, so check inside a transaction.
    await db.runTransaction(async (t) => {
        const existing = await t.get(doctors.where('email', '==', cleanEmail).limit(1))
        if (!existing.empty) throw new Error('Doctor already exists')

        t.set(ref, {
            name,
            email: cleanEmail,
            password,
            image: image ?? '',
            speciality,
            degree,
            experience,
            about,
            fees: Number(fees),
            address: { line1: address?.line1 ?? '', line2: address?.line2 ?? '' },
            available: true,
            slots_booked: {},
            createdAt: Date.now()
        })
    })

    return { _id: ref.id, id: ref.id }
}

// replaces: doctorModel.find({}).select('-password')
export async function getAllDoctors() {
    const snap = await doctors.get()
    return snap.docs
        .map(formatDoctor)
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
        .map(({ password, ...rest }) => rest)
}

// replaces: doctorModel.find({}).select(['-password','-email'])
export async function getAvailableDoctors() {
    const snap = await doctors.get()
    return snap.docs
        .map(formatDoctor)
        .map(({ password, email, reset_token, reset_token_expiry, ...rest }) => rest)
}

// replaces: doctorModel.findById(id)
export async function findDoctorById(id) {
    if (!id) return null
    const snap = await doctors.doc(String(id)).get()
    return snap.exists ? formatDoctor(snap) : null
}

// replaces: doctorModel.findOne({ email })
export async function findDoctorByEmail(email) {
    if (!email) return null
    const snap = await doctors.where('email', '==', email.toLowerCase()).limit(1).get()
    return snap.empty ? null : formatDoctor(snap.docs[0])
}

// replaces: doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
export async function toggleDoctorAvailability(id) {
    const ref = doctors.doc(String(id))
    await db.runTransaction(async (t) => {
        const snap = await t.get(ref)
        if (!snap.exists) return
        t.update(ref, { available: !snap.data().available })
    })
}

// replaces: doctorModel.findByIdAndUpdate(docId, { fees, address, available })
export async function updateDoctorProfile(id, { fees, address, available }) {
    const changes = {
        fees: fees === undefined ? undefined : Number(fees),
        address: address ? { line1: address.line1 ?? '', line2: address.line2 ?? '' } : undefined,
        available: available === undefined ? undefined : Boolean(available)
    }
    // Firestore rejects undefined values, so drop anything not supplied.
    Object.keys(changes).forEach(k => changes[k] === undefined && delete changes[k])
    if (!Object.keys(changes).length) return
    await doctors.doc(String(id)).update(changes)
}

// replaces: doctorModel.findByIdAndUpdate(docId, { slots_booked })
// Stored as a real object, e.g. { "4_11_2026": ["10:00 AM", "11:30 AM"] }.
export async function updateDoctorSlots(id, slotsBooked) {
    await doctors.doc(String(id)).update({ slots_booked: slotsBooked ?? {} })
}

// Optional atomic helpers: safer than read -> edit -> updateDoctorSlots, because
// two patients booking at the same moment can't overwrite each other's change.
export async function addBookedSlot(id, slotDate, slotTime) {
    await doctors.doc(String(id)).update({
        [`slots_booked.${slotDate}`]: FieldValue.arrayUnion(slotTime)
    })
}

export async function removeBookedSlot(id, slotDate, slotTime) {
    await doctors.doc(String(id)).update({
        [`slots_booked.${slotDate}`]: FieldValue.arrayRemove(slotTime)
    })
}

export async function updateDoctorPassword(id, hashedPassword) {
    await doctors.doc(String(id)).update({ password: hashedPassword })
}

export async function deleteDoctor(id) {
    await doctors.doc(String(id)).delete()
}

// Firestore already stores the nested shape your controllers read,
// so this only adds the id fields and safe defaults.
function formatDoctor(snap) {
    const data = snap.data()
    return {
        _id: snap.id,
        id: snap.id,
        ...data,
        available: data.available === true,
        slots_booked: data.slots_booked ?? {},
        address: { line1: '', line2: '', ...(data.address ?? {}) }
    }
}
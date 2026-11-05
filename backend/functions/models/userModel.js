import { db, users } from '../database/firestore.js'

// replaces: new userModel({...}).save()
export async function createUser({ name, email, password }) {
    const cleanEmail = email.toLowerCase()
    const ref = users.doc()

    // Firestore has no UNIQUE constraint, so check inside a transaction.
    await db.runTransaction(async (t) => {
        const existing = await t.get(users.where('email', '==', cleanEmail).limit(1))
        if (!existing.empty) throw new Error('User already exists')

        t.set(ref, {
            name,
            email: cleanEmail,
            password,
            image: '',
            phone: '',
            gender: 'Not Selected',
            dob: 'Not Selected',
            address: { line1: '', line2: '' },
            createdAt: Date.now()
        })
    })

    return { _id: ref.id, id: ref.id }
}

// replaces: userModel.findOne({ email })
export async function findUserByEmail(email) {
    if (!email) return null
    const snap = await users.where('email', '==', email.toLowerCase()).limit(1).get()
    return snap.empty ? null : formatUser(snap.docs[0])
}

// replaces: userModel.findById(id)
export async function findUserById(id) {
    if (!id) return null
    const snap = await users.doc(String(id)).get()
    return snap.exists ? formatUser(snap) : null
}

// Fetch several users in one round trip. Returns { [userId]: user }.
// Used to attach the patients' current profile data to appointments.
export async function getUsersByIds(ids = []) {
    const unique = [...new Set(ids.filter(Boolean).map(String))]
    if (!unique.length) return {}

    const snaps = await db.getAll(...unique.map(id => users.doc(id)))
    const map = {}
    snaps.forEach(s => {
        if (s.exists) map[s.id] = formatUser(s)
    })
    return map
}

// replaces: userModel.find({})
export async function getAllUsers() {
    const snap = await users.get()
    return snap.docs
        .map(formatUser)
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
}

// replaces: userModel.findByIdAndUpdate(id, { name, phone, address, dob, gender })
// Accepts the old flat address_line1 / address_line2 arguments or a nested `address` object.
export async function updateUser(id, { name, phone, gender, dob, image, address, address_line1, address_line2 }) {
    const hasAddress = address || address_line1 !== undefined || address_line2 !== undefined
    const changes = {
        name,
        phone,
        gender,
        dob,
        image,
        address: hasAddress
            ? {
                line1: address?.line1 ?? address_line1 ?? '',
                line2: address?.line2 ?? address_line2 ?? ''
            }
            : undefined
    }
    // Firestore rejects undefined values, so drop anything not supplied.
    Object.keys(changes).forEach(k => changes[k] === undefined && delete changes[k])
    if (!Object.keys(changes).length) return
    await users.doc(String(id)).update(changes)
}

// replaces: userModel.findByIdAndUpdate(id, { image })
export async function updateUserImage(id, image) {
    await users.doc(String(id)).update({ image })
}

export async function updateUserPassword(id, hashedPassword) {
    await users.doc(String(id)).update({ password: hashedPassword })
}

// Firestore already stores the nested shape your controllers read,
// so this only adds the id fields and a safe address default.
function formatUser(snap) {
    const data = snap.data()
    return {
        _id: snap.id,
        id: snap.id,
        ...data,
        address: { line1: '', line2: '', ...(data.address ?? {}) }
    }
}
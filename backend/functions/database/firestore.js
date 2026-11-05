import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

if (!getApps().length) initializeApp()

export const db = getFirestore()

// collection references used by the models
export const doctors = db.collection('doctors')
export const users = db.collection('users')
export const appointments = db.collection('appointments')
export const slots = db.collection('slots')

export const slotId = (docId, slotDate, slotTime) =>
    `${docId}_${slotDate}_${slotTime}`.replace(/[\/\s:]/g, '-')
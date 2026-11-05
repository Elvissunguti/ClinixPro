import React, { createContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

export const AppContext = createContext()

// Safe read: a corrupted value in localStorage won't crash the app
const readStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem('currentUser')) || null
    } catch {
        return null
    }
}

const AppContextProvider = (props) => {

    const currencySymbol = '$'
    const backendUrl = "https://europe-west1-clinic-admin-80aa4.cloudfunctions.net/api"

    const [doctors, setDoctors] = useState([])
    const [token, setToken] = useState(localStorage.getItem('token') || null)
    const [user, setUser] = useState(readStoredUser())

    // -------------------------
    // SYNC TO LOCALSTORAGE
    // -------------------------
    useEffect(() => {
        if (token) localStorage.setItem('token', token)
        else localStorage.removeItem('token')
    }, [token])

    useEffect(() => {
        if (user) localStorage.setItem('currentUser', JSON.stringify(user))
        else localStorage.removeItem('currentUser')
    }, [user])

    // -------------------------
    // LOAD USER PROFILE
    // -------------------------
    const loadUserProfile = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/get-profile', { headers: { token } })
            if (data.success) {
                setUser(data.userData)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
        }
    }

    // Runs after signup/login (token set, no user yet) and after a refresh
    useEffect(() => {
        if (token && !user) loadUserProfile()
        if (!token) setUser(null)
    }, [token])

    // -------------------------
    // GET DOCTORS
    // -------------------------
    const getDoctorsData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/doctor/list')
            if (data.success) setDoctors(data.doctors)
            else toast.error(data.message)
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    useEffect(() => {
        getDoctorsData()
    }, [])

    const value = {
        doctors,
        getDoctorsData,
        currencySymbol,
        backendUrl,
        token,
        setToken,
        user,
        setUser,
        loadUserProfile
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider
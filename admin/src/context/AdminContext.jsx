import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Navigate } from "react-router-dom";

export const AdminContext = createContext();

const AdminContextProvider = (props) => {
    const [aToken, setAToken] = useState(
        localStorage.getItem("aToken")
            ? localStorage.getItem("aToken")
            : ""
    );

    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [dashData, setDashData] = useState(false);

    const backendUrl = "https://api-dv76dhbkva-ew.a.run.app";

    // =======================
    // Admin Login
    // =======================
    const loginAdmin = async (email, password) => {
        try {
            const { data } = await axios.post(
                backendUrl + "/api/admin/login",
                { email, password }
            );

            if (data.success) {
                setAToken(data.token);
                localStorage.setItem("aToken", data.token);
                Navigate("/admin-dashboard")
                toast.success("Login Successful");
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    // =======================
    // Admin Logout
    // =======================
    const logoutAdmin = () => {
        localStorage.removeItem("aToken");
        setAToken("");
        setDoctors([]);
        setAppointments([]);
        setDashData(false);
        toast.success("Logged out");
    };

    // =======================
    // Get All Doctors
    // =======================
    const getAllDoctors = async () => {
        try {
            const { data } = await axios.post(
                backendUrl + "/api/admin/all-doctors",
                {},
                {
                    headers: { aToken },
                }
            );

            if (data.success) {
                setDoctors(data.doctors);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // =======================
    // Change Doctor Availability
    // =======================
    const changeAvailability = async (docId) => {
        try {
            const { data } = await axios.post(
                backendUrl + "/api/admin/change-availability",
                { docId },
                {
                    headers: { aToken },
                }
            );

            if (data.success) {
                toast.success(data.message);
                getAllDoctors();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // =======================
    // Get All Appointments
    // =======================
    const getAllAppointments = async () => {
        try {
            const { data } = await axios.post(
                backendUrl + "/api/admin/appointments",
                {},
                {
                    headers: { aToken },
                }
            );

            if (data.success) {
                setAppointments(data.appointments);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // =======================
    // Cancel Appointment
    // =======================
    const cancelAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(
                backendUrl + "/api/admin/cancel-appointment",
                { appointmentId },
                {
                    headers: { aToken },
                }
            );

            if (data.success) {
                toast.success(data.message);
                getAllAppointments();
                getDashData();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // =======================
    // Dashboard Data
    // =======================
    const getDashData = async () => {
        try {
            const { data } = await axios.get(
                backendUrl + "/api/admin/dashboard",
                {
                    headers: { aToken },
                }
            );

            if (data.success) {
                setDashData(data.dashData);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // =======================
    // Auto-load data after login
    // =======================
    useEffect(() => {
        if (aToken) {
            getDashData();
            getAllDoctors();
            getAllAppointments();
        }
    }, [aToken]);

    const value = {
        backendUrl,

        aToken,
        setAToken,
        loginAdmin,
        logoutAdmin,

        doctors,
        getAllDoctors,
        changeAvailability,

        appointments,
        setAppointments,
        getAllAppointments,
        cancelAppointment,

        dashData,
        getDashData,
    };

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    );
};

export default AdminContextProvider;
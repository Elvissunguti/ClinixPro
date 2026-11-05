import React from 'react'
import Login from './pages/Login'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useContext } from 'react';
import { AdminContext } from './context/AdminContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dasboard from './pages/Admin/Dasboard';
import AllAppointments from './pages/Admin/AllAppointments';
import AddDoctor from './pages/Admin/AddDoctor';
import DeleteDoctor from './pages/Admin/DeleteDoctor';
import DoctorsList from './pages/Admin/DoctorsList';
import { Route , Routes } from 'react-router-dom';
import { DoctorContext } from './context/DoctorContext';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorAppointment from './pages/Doctor/DoctorAppointment';
import DoctorProfile from './pages/Doctor/DoctorProfile';


const App = () => {
   
   const {aToken}=useContext(AdminContext)
   console.log('aToken:', aToken) 
   const {dtoken} = useContext(DoctorContext)

  return aToken || dtoken ?(
    <div className='bg-[#f4f6fb]'>
      <ToastContainer />
      <Navbar />
      <div className='flex items-start'>
        <Sidebar />
        <Routes>
          {/*Admin Routes */}
          <Route path='/' element={<></>} />
          <Route path='/admin-dashboard' element={<Dasboard/>} />
          <Route path='/all-appointments' element={<AllAppointments />} />
          <Route path='/admin-doctor' element={<AddDoctor />} />
          <Route path='/doctor-list' element={<DoctorsList/>} />
          <Route path='/delete-doctor' element={<DeleteDoctor />} />
          {/*Doctor Routes */}
          <Route path='/doctor-dashboard' element={<DoctorDashboard/>} />
          <Route path='/doctor-appointments' element={<DoctorAppointment/>} />
          <Route path='/doctor-profile' element={<DoctorProfile/>} />
        
        </Routes>
      </div>
    </div>
  ):
  (
    <>
     <Login />
     <ToastContainer />
    </>
  )
}

export default App
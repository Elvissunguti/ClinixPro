import React, { useContext ,useEffect,useState} from 'react'
import { AppContext } from '../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'
function MyAppointments() {
  const {backendUrl,token , getDoctorsData}=useContext(AppContext)

  const [appointments,setAppointments]=useState([])
  const months=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const slotDateFormat = (slotDate)=>{
    const dateArray = slotDate.split('_')
    return dateArray[0] + " "+ months[Number(dateArray[1])]+" "+dateArray[2]
  }

  const getUserAppointments = async()=>{
    try{
      const {data} = await axios.get(backendUrl+'/api/user/appointments',{headers:{token}})
      if(data.success){
        setAppointments(data.appointments.reverse())
        console.log(data.appointments)
      }
    } catch(error){
      console.log(error)
      toast.error(error.message)
    }
  }
  const cancelAppointment = async(appointmentId)=>{
    try{

      const {data} = await axios.post(backendUrl+'/api/user/cancel-appointment', {appointmentId},{headers:{token}})
      if(data.success){
         const cancelledAppt = appointments.find(a => a._id === appointmentId)
        if (cancelledAppt?.paymentStatus === "PAID") {
          toast.info("Refund initiated 💸")
        } else {
        toast.success("Appointment cancelled")
        }

        getUserAppointments()
        getDoctorsData()
      } else{
        toast.error(data.message)
      }

    } catch(error){
      console.log(error)
      toast.error(error.message)
    }
  }

  const appointmentPayment = async (appointmentId) => {
  try {
    const { data } = await axios.post(
      backendUrl + '/api/user/payment-mock',
      { appointmentId },
      { headers: { token } }
    )

    if (data.success) {
      toast.success(data.message)
      getUserAppointments()
    } else {
      toast.error(data.message)
    }
  } catch (error) {
    toast.error("Payment failed")
  }
}


  useEffect(()=>{
    if(token){
      getUserAppointments()
    }
  },[token])

  return (
    <div>
        <p className='pb-3 mt-12 font-medium text-zinc-700 border-b'>My appointments</p>
        <div>
           {appointments.map((item,index) =>(
             <div className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b' key={index}>
                <div>
                  <img className='w-32 bg-indigo-50' src={item.docData.image} alt="" />
                </div> 
                <div className='flex-1 text-sm text-zinc-600'>
                  <p className='text-neutral-800 font-semibold'>{item.docData.name}</p>
                  <p>{item.docData.speciality}</p>
                  <p className='text-zinc-700 font-medium mt-1'>Address:</p>
                  <p className='text-xs'>{item.docData.address?.line1 || 'Address not available'}</p>
                  <p className='text-xs'>{item.docData.address?.line2 || ''}</p>
                  <p className='text-xs mt-1'><span className='text-sm text-neutral-700 font-medium'>Date & Time:</span> {slotDateFormat(item.slotDate)} | {item.slotTime}</p>
                  <p className="text-xs mt-1"><span className="font-medium">Amount:</span> ${item.amount}</p>
                  <p className="text-xs mt-1"><span className="font-medium">Payment:</span> {item.paymentStatus}</p>
                </div>   
                <div></div>
                <div className='flex flex-col gap-2 justify-end'>{/* PAID */}
                   {item.paymentStatus?.toUpperCase() === "PAID" && (<button disabled className='sm:min-w-48 py-2 border border-green-500 rounded text-green-600 cursor-not-allowed'>Paid</button>)}
                    {/* PAY ONLINE */}
                   {item.paymentStatus?.toUpperCase() === "PENDING" && !item.cancelled && (<button onClick={() => appointmentPayment(item._id)} className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-100'>Pay Online</button>)}
                    {/* CANCEL */}
                   {!item.cancelled  && (<button onClick={() => cancelAppointment(item._id)} className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-100'>Cancel Appointment</button>)}
                    {/* CANCELLED */}
                   {item.cancelled && (<button className={`sm:min-w-48 py-2 border rounded ${item.paymentStatus === "REFUNDED"? "border-purple-500 text-purple-600": "border-red-500 text-red-500"}`}>{item.paymentStatus === "REFUNDED"? "Cancelled (Refunded)": "Appointment cancelled"}</button>)}
                </div>  
             </div> 
           ))}
        </div>
    </div>
  )
}

export default MyAppointments
import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { uploadImage } from '../utils/firebase'

function MyProfile() {

  const { user, setUser, token, backendUrl, loadUserProfile } = useContext(AppContext)

  const [isEdit, setIsEdit] = useState(false)
  const [image, setImage] = useState(false)
  const [loading, setLoading] = useState(false)

  const updateUserProfileData = async () => {


    setLoading(true)
    try {
      // 1. upload the new picture (if any) and get its download URL
      let imageUrl = user.image || ''
      if (image) {
        imageUrl = await uploadImage(image, 'users')
      }

      // 2. send everything to the backend as JSON
      const payload = {
        name: user.name,
        phone: user.phone,
        address: user.address || { line1: '', line2: '' },
        gender: user.gender,
        dob: user.dob,
        image: imageUrl
      }

      const { data } = await axios.post(backendUrl + '/api/user/update-profile', payload, { headers: { token } })

      if (data.success) {
        toast.success(data.message)
        await loadUserProfile()
        setIsEdit(false)
        setImage(false)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return user && (
    <div className='max-w-lg flex flex-col gap-2 text-sm'>

      {
        isEdit
          ? <label htmlFor="image">
              <div className="inline-block relative cursor-pointer">

                <img
                  className="w-36 h-36 rounded object-cover opacity-75"
                  src={
                    image
                      ? URL.createObjectURL(image)
                      : user.image
                        ? user.image
                        : assets.profile_icon
                  }
                  alt=""
                />

                <img
                  className="w-10 absolute bottom-2 right-2"
                  src={assets.upload_icon}
                  alt=""
                />

              </div>

              <input
                hidden
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
              />
            </label>
          : (
            <img
              className="w-36 h-36 rounded object-cover"
              src={user.image ? user.image : assets.profile_icon}
              alt=""
            />
          )
      }

      {
        isEdit
          ? <input className='bg-gray-50 text-3xl font-medium max-w-60 mt-4' type="text" value={user.name || ''} onChange={e => setUser(prev => ({ ...prev, name: e.target.value }))} />
          : <p className='font-medium text-3xl text-neutral-800 mt-4'>{user.name}</p>
      }

      <hr className='bg-zinc-400 h-[-1px] border-none' />
      <div>
        <p className='text-neutral-500 underline mt-3'>CONTACT INFORMATION</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700'>
          <p className='font-medium'>Email id:</p>
          <p className='text-blue-500'>{user.email}</p>
          <p className='font-medium'>Phone:</p>

          {
            isEdit
              ? <input className='bg-gray-100 max-w-52' type="text" value={user.phone || ''} onChange={e => setUser(prev => ({ ...prev, phone: e.target.value }))} />
              : <p className='text-blue-400'>{user.phone}</p>
          }
          <p className='font-medium'>Address:</p>
          {
            isEdit
              ? <p>
                  <input className='bg-gray-50' onChange={(e) => setUser(prev => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))} value={user.address?.line1 || ''} type="text" />
                  <br />
                  <input className='bg-gray-50' onChange={(e) => setUser(prev => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))} value={user.address?.line2 || ''} type="text" />
                </p>
              : <p className='text-gray-500'>
                  {user.address?.line1}
                  <br />
                  {user.address?.line2}
                </p>
          }
        </div>
      </div>
      <div>
        <p className='text-neutral-500 underline mt-3'>BASIC INFORMATION</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700'>
          <p className='font-medium'>Gender:</p>
          {
            isEdit
              ? <select className='max-w-20 bg-gray-100' onChange={(e) => setUser(prev => ({ ...prev, gender: e.target.value }))} value={user.gender || 'Not Selected'}>
                  <option value="Not Selected" disabled>Not Selected</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              : <p className='text-gray-400'>{user.gender}</p>
          }
          <p className='font-medium'>Birthday:</p>
          {
            isEdit
              ? <input className='max-w-28 bg-gray-100' type="date" onChange={(e) => setUser(prev => ({ ...prev, dob: e.target.value }))} value={user.dob || ''} />
              : <p className='text-gray-400'>{user.dob}</p>
          }
        </div>
      </div>
      <div className='mt-10'>
        {
          isEdit
            ? <button disabled={loading} className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all disabled:opacity-60' onClick={updateUserProfileData}>
                {loading ? 'Saving...' : 'Save information'}
              </button>
            : <button className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all' onClick={() => setIsEdit(true)}>Edit</button>
        }
      </div>
    </div>
  )
}

export default MyProfile
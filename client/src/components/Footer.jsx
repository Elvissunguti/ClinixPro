import React from 'react'
import { assets } from '../assets/assets'
import { NavLink } from 'react-router-dom'

function Footer() {
  return (
    <div className='md:mx-10'>
        <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>

            {/*Left*/}
            <div>
                <img className='mb-5 w-40' src={assets.logo} alt=""/>
                <p className='w-full md:w-2/3 text-gray-600 leading-6'>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p>
            </div>
            {/*Middle*/}
            <div>
                <p className='text-xl font-medium mb-5'>COMPANY</p>
                <ul className='flex flex-col gap-2 text-gray-600'>
                    <li>Home</li>
                    <li>About</li>
                    <li>Contact Us</li>
                    <li>Privacy Policy</li>
                    <li><NavLink to="/admin-login">Admin</NavLink></li>
                </ul>
            </div>
            {/*Right*/}
            <div>
                <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
                <ul className='flex flex-col gap-2 text-gray-600'>
                    <li>+254 740537477</li>
                    <li>priscripto@gmail.com</li>
                </ul>
            </div>
        </div>
        <div>
            <hr />
            {/*Copy right*/}
            <p className='py-5 text-sm text-center '>Copy Right &priscripto; 2026 All rights reserved.</p>
        </div>
    </div>
  )
}

export default Footer
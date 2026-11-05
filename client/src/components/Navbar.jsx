import React, { useState, useContext } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

function Navbar() {

    const navigate = useNavigate()
    const { token, setToken, user, setUser } = useContext(AppContext)

    const [showMenu, setShowMenu] = useState(false)

    // Logged in as soon as a token exists, even before the profile has loaded
    const isLoggedIn = Boolean(token || user)

    // Image URLs from Firebase Storage are used as they are; empty falls back to the default icon
    const avatar = user?.image ? user.image : assets.profile_icon

    // ---------------------------
    // LOGOUT
    // ---------------------------
    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('currentUser')

        setToken(null)
        setUser(null)

        navigate('/login')
    }

    return (
        <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400'>

            {/* LOGO */}
            <img
                onClick={() => navigate('/')}
                className='w-44 cursor-pointer'
                src={assets.logo}
                alt=""
            />

            {/* NAV LINKS */}
            <ul className='hidden md:flex items-start gap-5 font-medium'>
                <NavLink to='/'><li className='py-1'>HOME</li></NavLink>
                <NavLink to='/doctors'><li className='py-1'>ALL DOCTORS</li></NavLink>
                <NavLink to='/about'><li className='py-1'>ABOUT</li></NavLink>
                <NavLink to='/contact'><li className='py-1'>CONTACT</li></NavLink>
            </ul>

            {/* RIGHT SIDE */}
            <div className='flex items-center gap-4'>

                {/* USER DROPDOWN */}
                {isLoggedIn ? (
                    <div className='flex items-center gap-2 cursor-pointer group relative'>

                        <img
                            className='w-6 h-6 rounded-full object-cover'
                            src={avatar}
                            onError={(e) => { e.currentTarget.src = assets.profile_icon }}
                            alt=""
                        />

                        <img className='w-2.5' src={assets.dropdown_icon} alt="" />

                        {/* DROPDOWN */}
                        <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
                            <div className='min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4'>

                                <p
                                    onClick={() => navigate('/my-profile')}
                                    className='hover:text-black cursor-pointer'
                                >
                                    My Profile
                                </p>

                                <p
                                    onClick={() => navigate('/my-appointments')}
                                    className='hover:text-black cursor-pointer'
                                >
                                    My Appointments
                                </p>

                                <p
                                    onClick={logout}
                                    className='hover:text-black cursor-pointer'
                                >
                                    Logout
                                </p>

                            </div>
                        </div>
                    </div>

                ) : (
                    <button
                        onClick={() => navigate('/login')}
                        className='bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block'
                    >
                        Create account
                    </button>
                )}

                {/* MOBILE MENU ICON */}
                <img
                    onClick={() => setShowMenu(true)}
                    className='w-6 md:hidden'
                    src={assets.menu_icon}
                    alt=""
                />
            </div>

            {/* MOBILE MENU */}
            <div className={`${showMenu ? 'fixed inset-0 w-full' : 'h-0 w-0'} md:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>

                <div className='flex items-center justify-between px-5 py-6'>
                    <img className='w-36' src={assets.logo} alt="" />
                    <img
                        className='w-7'
                        onClick={() => setShowMenu(false)}
                        src={assets.cross_icon}
                        alt=""
                    />
                </div>

                <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
                    <NavLink onClick={() => setShowMenu(false)} to='/'><p className='px-4 py-2'>Home</p></NavLink>
                    <NavLink onClick={() => setShowMenu(false)} to='/doctors'><p className='px-4 py-2'>ALL DOCTORS</p></NavLink>
                    <NavLink onClick={() => setShowMenu(false)} to='/about'><p className='px-4 py-2'>ABOUT</p></NavLink>
                    <NavLink onClick={() => setShowMenu(false)} to='/contact'><p className='px-4 py-2'>CONTACT</p></NavLink>
                </ul>

            </div>
        </div>
    )
}

export default Navbar
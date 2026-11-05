import React, { useEffect, useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {

    const {
        backendUrl,
        setToken,
        setUser
    } = useContext(AppContext);

    const navigate = useNavigate();

    const [state, setState] = useState("Sign Up");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // =============================
    // Register User
    // =============================
    const handleSignUp = async () => {
        try {

            const { data } = await axios.post(
                backendUrl + "/api/user/register",
                {
                    name,
                    email,
                    password
                }
            );

            if (data.success) {

                localStorage.setItem("token", data.token);
                setToken(data.token);

                toast.success("Account created successfully");

                navigate("/");

            } else {
                toast.error(data.message);
            }

        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // =============================
    // Login User
    // =============================
    const handleLogin = async () => {
        try {

            const { data } = await axios.post(
                backendUrl + "/api/user/login",
                {
                    email,
                    password
                }
            );

            if (data.success) {

                localStorage.setItem("token", data.token);

                setToken(data.token);

                // Fetch profile after login
                const profile = await axios.get(
                    backendUrl + "/api/user/get-profile",
                    {
                        headers: {
                            token: data.token
                        }
                    }
                );

                if (profile.data.success) {
                    setUser(profile.data.userData);
                    localStorage.setItem(
                        "currentUser",
                        JSON.stringify(profile.data.userData)
                    );
                }

                toast.success("Login successful");

                navigate("/");

            } else {
                toast.error(data.message);
            }

        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // =============================
    // Form Submit
    // =============================
    const onSubmitHandler = (e) => {
        e.preventDefault();

        if (state === "Sign Up") {
            handleSignUp();
        } else {
            handleLogin();
        }
    };

    useEffect(() => {

        if (localStorage.getItem("token")) {
            navigate("/");
        }

    }, []);

    return (
        <form
            onSubmit={onSubmitHandler}
            className="min-h-[80vh] flex items-center"
        >
            <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg">

                <p className="text-2xl font-semibold">
                    {state === "Sign Up"
                        ? "Create Account"
                        : "Login"}
                </p>

                <p>
                    Please{" "}
                    {state === "Sign Up"
                        ? "sign up"
                        : "login"}{" "}
                    to book appointment
                </p>

                {state === "Sign Up" && (
                    <div className="w-full">
                        <p>Full Name</p>

                        <input
                            className="border border-zinc-300 rounded w-full p-2 mt-1"
                            type="text"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            required
                        />
                    </div>
                )}

                <div className="w-full">
                    <p>Email</p>

                    <input
                        className="border border-zinc-300 rounded w-full p-2 mt-1"
                        type="email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        required
                    />
                </div>

                <div className="w-full">
                    <p>Password</p>

                    <input
                        className="border border-zinc-300 rounded w-full p-2 mt-1"
                        type="password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="bg-primary text-white w-full py-2 rounded-md text-base"
                >
                    {state === "Sign Up"
                        ? "Create Account"
                        : "Login"}
                </button>

                {state === "Sign Up" ? (
                    <p>
                        Already have an account?
                        <span
                            onClick={() =>
                                setState("Login")
                            }
                            className="text-primary underline cursor-pointer"
                        >
                            {" "}
                            Login here
                        </span>
                    </p>
                ) : (
                    <p>
                        Create a new account?
                        <span
                            onClick={() =>
                                setState("Sign Up")
                            }
                            className="text-primary underline cursor-pointer"
                        >
                            {" "}
                            Click here
                        </span>
                    </p>
                )}

            </div>
        </form>
    );
}

export default Login;
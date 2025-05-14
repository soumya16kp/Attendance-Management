
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as authlogin } from "../store/authSlice";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import "./login.css";
import authService from "../appwrite/auth";

function Login() { 
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {register, handleSubmit} = useForm();
    const [error, setError] = useState("");

    const handleLogin = async (data) => {
        setError("");
        try {
            const session = await authService.login(data);
            if (session) {
                const userData = await authService.getCurrentUser();
                if (userData) dispatch(authlogin(userData));
                navigate("/");
            }
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="login-container">
            <h2>Log in to your account</h2>
            <p>
              Don&apos;t have an account? <Link to="/signup">Sign up here</Link>
            </p>

            {error && <p className="error-message">{error}</p>}

            <form onSubmit={handleSubmit(handleLogin)} className="login-form"> 
                <div className="input-group">
                    <label>Email:</label>
                    <input
                        placeholder="Enter your email"
                        type="email"
                        {...register("email", {
                            required: "Email is required",
                            pattern: {
                                value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
                                message: "Invalid email format",
                            },
                        })}
                    />
                </div>

                <div className="input-group">
                    <label>Password:</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        {...register("password", {
                            required: "Password is required",
                        })}
                    />
                </div>
                
                <button type="submit" className="login-button">Log in</button> 
            </form>
        </div>
    );
}

export default Login; 

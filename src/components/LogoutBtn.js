import React from "react";
import { useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import authService from "../appwrite/auth";
import "./LogoutBtn.css"; 

function LogoutBtn() {
  const dispatch = useDispatch();

  const LogoutHandler = () => {
    authService.logout().then(() => {
      dispatch(logout());
    });
  };

  return (
    <button className="logout-btn" onClick={LogoutHandler}>
      Logout
    </button>
  );
}

export default LogoutBtn;

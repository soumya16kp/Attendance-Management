import "./Header.css";
import React, { useState} from "react";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {UseChecker} from "../../context/CheckerContext.js"
import LogoutBtn from "../LogoutBtn.js";

function Header() {
  const authStatus = useSelector((state) => state.auth.status);
  const {AddSubject}=UseChecker();
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const location=useLocation(); 
  const currpath=location.pathname;

  const addSubject =async()=>{
    if(subject.trim()){
      await AddSubject(subject);
      setSubject("");
    }
    else{
      console.log("String is empty ");
    }
};

  const navItems = [
    { name: "Home", slug: "/", active: authStatus && currpath!=="/" },
    { name: "Login", slug: "/login", active: !authStatus },
    { name: "Signup", slug: "/signup", active: !authStatus },
  ];

  return (
    <header className="header">
      {/* Brand */}
      <div className="brand">Roll Call</div>

      <nav>
        <ul className="nav-links">
            {currpath === "/" && (
              <li className="nav-item add-item">
                <div className="add-container">
                  <input
                    className="add-input"
                    type="text"
                    placeholder="Add a Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                  <button className="add-btn" onClick={addSubject}>
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
              </li>
            )}



          {navItems.map(
            (item) =>
              item.active && (
                <li key={item.name} className="nav-item">
                  <button onClick={() => navigate(item.slug)} className="nav-button">
                    {item.name}
                  </button>
                </li>
              )
          )}

          {/* Logout Button */}
          {authStatus && (
            <li className="nav-item">
              <LogoutBtn />
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header;

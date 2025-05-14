import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import './App.css'; 
import authService from "./appwrite/auth";
import { Checkprovider } from './context/CheckerContext';
import { login,logout} from "./store/authSlice";
import  {Header}  from './components';
import { Outlet } from 'react-router-dom';

function App() {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    authService.getCurrentUser()
      .then((userData) => {
        if (userData) {
          dispatch(login({ userData }));
        } else {
          dispatch(logout());
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return !loading ? (
    <Checkprovider>
    <div className="app-container">
      <div className="content-wrapper">
        <Header />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
    </Checkprovider>
  ) : null;
}

export default App;

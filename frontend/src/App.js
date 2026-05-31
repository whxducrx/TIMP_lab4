import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Form from './pages/Form';
import Profile from './pages/Profile';
import Users from './pages/Users';
import Vessels from './pages/Vessels';
import Crew from './pages/Crew';
import Navbar from './components/Navbar';
import ToastContainer from './components/ToastContainer';
import {isAuth, getCurrentUser} from './services/api';

function ProtectedRoute({children}){
  if(isAuth()){
    return children;
  }else{
    return <Navigate to="/login" />
  }
}

function AdminRoute({children}){
  const user = getCurrentUser();
  if(isAuth() && user && user.role === 'admin'){
    return children;
  }else{
    return <Navigate to="/" />
  }
}

function App() {
  return (
      <Router>
        <ToastContainer />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" 
            element={
              <ProtectedRoute>
                <Navbar />
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route path="/detail/:id" 
            element={
              <ProtectedRoute>
                <Navbar />
                <Detail />
              </ProtectedRoute>
            } 
          />
          <Route path="/add" 
            element={
              <ProtectedRoute>
                <Navbar />
                <Form />
              </ProtectedRoute>
            } 
          />
          <Route path="/profile"
            element={
              <ProtectedRoute>
                <Navbar />
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/users"
            element={
              <AdminRoute>
                <Navbar />
                <Users />
              </AdminRoute>
            }
          />

          <Route path="/vessels"
            element={
              <AdminRoute>
                <Navbar />
                <Vessels />
              </AdminRoute>
            }
          />

          <Route path="/crew"
            element={
              <AdminRoute>
                <Navbar />
                <Crew />
              </AdminRoute>
            }
          />
        </Routes>
      </Router>
  );
}

export default App;

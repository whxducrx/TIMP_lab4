import React, { useState, useEffect } from 'react';
import {useNavigate} from 'react-router-dom';
import {logout, getCurrentUser} from '../services/api';

function Navbar(){
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        setUser(currentUser);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return(
        <nav className="navbar navbar-expand-lg navbar-dark" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
            <div className="container-fluid">
                <span 
                    className="navbar-brand mb-0 h5 text-white" 
                    style={{cursor: 'pointer'}}
                    onClick={() => navigate('/')}
                    title="Вернуться на главную"
                >
                    <i className="bi bi-ship me-2"></i>Система мониторинга инцидентов
                </span>
                
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        {user && (
                            <li className="nav-item me-2">
                                <span className="text-white d-flex align-items-center">
                                    <i className="bi me-2"></i>
                                    {user.username} {user.role === 'admin' && <span className="badge bg-warning text-dark ms-2">Администратор</span>}
                                </span>
                            </li>
                        )}
                        {user && user.role === 'admin' && (
                            <>
                                <li className="nav-item">
                                    <button 
                                        className="btn btn-outline-light btn-sm me-2"
                                        onClick={() => navigate('/users')}
                                        title="Управление пользователями"
                                    >
                                        <i className="bi me-1"></i>Пользователи
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className="btn btn-outline-light btn-sm me-2"
                                        onClick={() => navigate('/vessels')}
                                        title="Управление судами"
                                    >
                                        <i className="bi bi-ship me-1"></i>Суда
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className="btn btn-outline-light btn-sm me-2"
                                        onClick={() => navigate('/crew')}
                                        title="Управление экипажем"
                                    >
                                        <i className="bi me-1"></i>Экипаж
                                    </button>
                                </li>
                            </>
                        )}
                        <li className="nav-item">
                            <button 
                                className="btn btn-outline-light btn-sm me-2"
                                onClick={() => navigate('/')}
                                title="Главная страница"
                            >
                                <i className="bi me-1"></i>Инциденты
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className="btn btn-outline-light btn-sm me-2"
                                onClick={() => navigate('/profile')}
                                title="Профиль"
                            >
                                <i className="bi bi-person-gear me-1"></i>Профиль
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className="btn btn-outline-light btn-sm"
                                onClick={handleLogout}
                            >
                                <i className="bi bi-box-arrow-right me-1"></i>Выход
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;

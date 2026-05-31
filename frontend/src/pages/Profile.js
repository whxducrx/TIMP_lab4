import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, changePassword, logout, getCurrentUser } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorAlert from '../components/ErrorAlert';

function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('profile');
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [patronymic, setPatronymic] = useState('');
    const [email, setEmail] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const profileData = await getProfile();
            setUser(profileData);
            setFirstName(profileData.first_name || '');
            setLastName(profileData.last_name || '');
            setPatronymic(profileData.patronymic || '');
            setEmail(profileData.email || '');
        } catch (err) {
            console.error(err);
            setError('Ошибка при загрузке профиля');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email) {
            setError('Email обязателен');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Неверный формат email');
            return;
        }

        try {
            setProfileLoading(true);
            const response = await updateProfile(firstName, lastName, patronymic, email);
            setSuccess('Профиль обновлён успешно');
            setUser(response.user);

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error(err);
            const errorMessage = err.error || err.message || 'Ошибка при обновлении профиля';
            setError(errorMessage);
        } finally {
            setProfileLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!oldPassword || !newPassword || !confirmPassword) {
            setError('Все поля обязательны');
            return;
        }

        if (newPassword.length < 6) {
            setError('Новый пароль должен содержать минимум 6 символов');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Новые пароли не совпадают');
            return;
        }

        if (oldPassword === newPassword) {
            setError('Новый пароль должен отличаться от старого');
            return;
        }

        try {
            setPasswordLoading(true);
            await changePassword(oldPassword, newPassword);
            setSuccess('Пароль изменён успешно');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error(err);
            const errorMessage = err.error || err.message || 'Ошибка при изменении пароля';
            setError(errorMessage);
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return <Spinner />;
    }

    return (
        <div className="min-vh-100 bg-light py-4">
            <div className="container">
                <div className="row">
                    <div className="col-lg-8 offset-lg-2">
                        <div className="card shadow">
                            {/* Header */}
                            <div className="card-header text-white" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <button 
                                            className="btn btn-sm btn-outline-light me-2"
                                            onClick={() => navigate('/')}
                                            title="Вернуться на главную"
                                        >
                                            <i className="bi bi-arrow-left me-1"></i>Назад
                                        </button>
                                        <h4 className="mb-0 d-inline">
                                            <i className="bi bi-person-circle me-2"></i>
                                            Мой профиль
                                        </h4>
                                    </div>
                                    <button
                                        className="btn btn-outline-light btn-sm"
                                        onClick={handleLogout}
                                    >
                                        <i className="bi bi-box-arrow-right me-1"></i>
                                        Выход
                                    </button>
                                </div>
                            </div>

                            <div className="card-body">
                                <ErrorAlert error={error} />
                                
                                {success && (
                                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                                        <i className="bi bi-check-circle me-2"></i>
                                        {success}
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() => setSuccess('')}
                                        ></button>
                                    </div>
                                )}

                                {/* User Info */}
                                <div className="mb-4">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <p className="mb-1"><strong>Логин:</strong></p>
                                            <p className="text-muted">{user?.username}</p>
                                        </div>
                                        <div className="col-md-6">
                                            <p className="mb-1"><strong>Роль:</strong></p>
                                            <p>
                                                <span className={`badge ${user?.role === 'admin' ? 'bg-danger' : 'bg-info'}`}>
                                                    {user?.role === 'admin' ? 'Администратор' : 'Пользователь'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="row mt-3">
                                        <div className="col-md-6">
                                            <p className="mb-1"><strong>Дата регистрации:</strong></p>
                                            <p className="text-muted">
                                                {new Date(user?.created_at).toLocaleDateString('ru-RU')}
                                            </p>
                                        </div>
                                        <div className="col-md-6">
                                            <p className="mb-1"><strong>Последний вход:</strong></p>
                                            <p className="text-muted">
                                                {user?.last_login 
                                                    ? new Date(user.last_login).toLocaleString('ru-RU')
                                                    : 'Первый вход'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <hr />

                                {/* Tabs */}
                                <ul className="nav nav-tabs mb-4" role="tablist">
                                    <li className="nav-item" role="presentation">
                                        <button
                                            className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('profile')}
                                            type="button"
                                        >
                                            <i className="bi bi-person me-1"></i>
                                            Редактировать профиль
                                        </button>
                                    </li>
                                    <li className="nav-item" role="presentation">
                                        <button
                                            className={`nav-link ${activeTab === 'password' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('password')}
                                            type="button"
                                        >
                                            <i className="bi bi-lock me-1"></i>
                                            Изменить пароль
                                        </button>
                                    </li>
                                </ul>

                                {/* Profile Tab */}
                                {activeTab === 'profile' && (
                                    <form onSubmit={handleUpdateProfile}>
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label htmlFor="firstName" className="form-label">
                                                    Имя <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="firstName"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    maxLength={50}
                                                    required
                                                />
                                            </div>

                                            <div className="col-md-6 mb-3">
                                                <label htmlFor="lastName" className="form-label">
                                                    Фамилия <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="lastName"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    maxLength={50}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label htmlFor="patronymic" className="form-label">
                                                Отчество
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="patronymic"
                                                value={patronymic}
                                                onChange={(e) => setPatronymic(e.target.value)}
                                                maxLength={50}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label htmlFor="email" className="form-label">
                                                Email <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                id="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="btn"
                                            style={{backgroundColor: '#7c3aed', color: 'white', borderColor: '#7c3aed'}}
                                            disabled={profileLoading}
                                        >
                                            {profileLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Сохранение...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-circle me-1"></i>
                                                    Сохранить изменения
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}

                                {/* Password Tab */}
                                {activeTab === 'password' && (
                                    <form onSubmit={handleChangePassword}>
                                        <div className="mb-3">
                                            <label htmlFor="oldPassword" className="form-label">
                                                Текущий пароль <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                id="oldPassword"
                                                value={oldPassword}
                                                onChange={(e) => setOldPassword(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label htmlFor="newPassword" className="form-label">
                                                Новый пароль <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                id="newPassword"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Минимум 6 символов"
                                                required
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label htmlFor="confirmPassword" className="form-label">
                                                Подтверждение пароля <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                id="confirmPassword"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Повторите пароль"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="btn"
                                            style={{backgroundColor: '#7c3aed', color: 'white', borderColor: '#7c3aed'}}
                                            disabled={passwordLoading}
                                        >
                                            {passwordLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Изменение...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-lock me-1"></i>
                                                    Изменить пароль
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;

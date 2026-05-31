import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, changeUserRole, deactivateUser, activateUser, getCurrentUser } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorAlert from '../components/ErrorAlert';

function Users() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [roleFilter, setRoleFilter] = useState('');
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });

    useEffect(() => {
        const user = getCurrentUser();
        if (!user || user.role !== 'admin') {
            navigate('/');
        }
    }, [navigate]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        loadUsers();
    }, [currentPage, roleFilter]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getAllUsers(currentPage, 10, roleFilter || null);
            setUsers(data.users || []);
            setPagination(data.pagination || { total: 0, pages: 1 });
        } catch (err) {
            setError('Ошибка при загрузке пользователей');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            setActionError('');
            setSuccessMessage('');
            await changeUserRole(userId, newRole);
            setSuccessMessage(`Роль пользователя изменена на "${newRole}"`);
            loadUsers();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setActionError(`Ошибка при изменении роли: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleDeactivateUser = async (userId) => {
        if (window.confirm('Вы уверены, что хотите деактивировать пользователя?')) {
            try {
                setActionError('');
                setSuccessMessage('');
                await deactivateUser(userId);
                setSuccessMessage('Пользователь деактивирован');
                loadUsers();
                setTimeout(() => setSuccessMessage(''), 3000);
            } catch (err) {
                setActionError(`Ошибка при деактивации: ${err.response?.data?.error || err.message}`);
            }
        }
    };

    const handleActivateUser = async (userId) => {
        try {
            setActionError('');
            setSuccessMessage('');
            await activateUser(userId);
            setSuccessMessage('Пользователь активирован');
            loadUsers();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setActionError(`Ошибка при активации: ${err.response?.data?.error || err.message}`);
        }
    };

    if (loading && users.length === 0) {
        return <Spinner />;
    }

    return (
        <div className="min-vh-100 bg-light">
            <div className="container py-4">
                <div className="mb-4">
                    <h2 style={{ color: '#667eea' }}>Управление пользователями</h2>
                </div>

                {error && <ErrorAlert error={error} />}
                {actionError && <ErrorAlert error={actionError} />}
                {successMessage && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                        {successMessage}
                        <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
                    </div>
                )}

                <div className="card shadow-sm mb-4">
                    <div className="card-header" style={{ backgroundColor: '#667eea', color: 'white' }}>
                        <h5 className="mb-0">Фильтры</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6">
                                <label className="form-label">Фильтр по роли</label>
                                <select
                                    className="form-select"
                                    value={roleFilter}
                                    onChange={(e) => {
                                        setRoleFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="">Все</option>
                                    <option value="admin">Администратор</option>
                                    <option value="user">Пользователь</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card shadow-sm">
                    <div className="card-header" style={{ backgroundColor: '#667eea', color: 'white' }}>
                        <h5 className="mb-0">Список пользователей ({pagination.total})</h5>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead style={{ backgroundColor: '#f5f5f5' }}>
                                <tr>
                                    <th>Имя пользователя</th>
                                    <th>Email</th>
                                    <th>ФИО</th>
                                    <th>Роль</th>
                                    <th>Статус</th>
                                    <th>Последний вход</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <strong>{user.username}</strong>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            {user.first_name} {user.last_name}
                                            {user.patronymic && ` ${user.patronymic}`}
                                        </td>
                                        <td>
                                            <select
                                                className="form-select form-select-sm"
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                disabled={user.id === getCurrentUser()?.id}
                                            >
                                                <option value="user">Пользователь</option>
                                                <option value="admin">Администратор</option>
                                            </select>
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${user.is_active ? 'bg-success' : 'bg-secondary'}`}
                                            >
                                                {user.is_active ? 'Активен' : 'Неактивен'}
                                            </span>
                                        </td>
                                        <td>
                                            {user.last_login
                                                ? new Date(user.last_login).toLocaleString('ru-RU')
                                                : 'Не заходил'}
                                        </td>
                                        <td>
                                            {user.is_active ? (
                                                <button
                                                    className="btn btn-sm btn-warning"
                                                    onClick={() => handleDeactivateUser(user.id)}
                                                    disabled={user.id === getCurrentUser()?.id}
                                                >
                                                    Деактивировать
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleActivateUser(user.id)}
                                                >
                                                    Активировать
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {users.length === 0 && (
                        <div className="text-center py-5">
                            <p className="text-muted">Пользователи не найдены</p>
                        </div>
                    )}
                </div>

                {pagination.pages > 1 && (
                    <nav className="mt-4" aria-label="Pagination">
                        <ul className="pagination justify-content-center">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                >
                                    Первая
                                </button>
                            </li>
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    &laquo; Предыдущая
                                </button>
                            </li>
                            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                </li>
                            ))}
                            <li className={`page-item ${currentPage === pagination.pages ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === pagination.pages}
                                >
                                    Следующая &raquo;
                                </button>
                            </li>
                            <li className={`page-item ${currentPage === pagination.pages ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(pagination.pages)}
                                    disabled={currentPage === pagination.pages}
                                >
                                    Последняя
                                </button>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>
        </div>
    );
}

export default Users;

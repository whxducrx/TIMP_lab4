import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {getAllIncidents} from '../services/api';
import Spinner from '../components/Spinner';
import ErrorAlert from '../components/ErrorAlert';

function Home(){
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);

    const [statusFilter, setStatusFilter] = useState('');
    const [criticalityFilter, setCriticalityFilter] = useState('');
    const [shipFilter, setShipFilter] = useState('');

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        getIncidents();
    }, [page, limit, statusFilter, criticalityFilter, shipFilter]);

    const getIncidents = async () => {
        try{
            setLoading(true);
            setError('');
            
            const filters = {};
            if (statusFilter) filters.status = statusFilter;
            if (criticalityFilter) filters.criticality = criticalityFilter;
            if (shipFilter) filters.ship = shipFilter;

            const data = await getAllIncidents(page, limit, filters);
            setIncidents(data.incidents);
            setTotal(data.pagination.total);
            setPages(data.pagination.pages);
            setPage(data.pagination.page);
        }catch(err){
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Ошибка загрузки инцидентов';
            setError(errorMsg);
            setIncidents([]);
        }finally{
            setLoading(false);
        }
    };

    const handleResetFilters = () => {
        setPage(1);
        setStatusFilter('');
        setCriticalityFilter('');
        setShipFilter('');
    };

    const getStatusClass = (status) => {
        switch(status){
            case 'Открыт':
                return 'bg-success';
            case 'В работе':
                return 'bg-warning';
            case 'Закрыт':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    };

    const getSeverityColor = (criticality) => {
        switch(criticality){
            case 'Высокая':
                return '#dc3545';
            case 'Средняя':
                return '#ffc107';
            case 'Низкая':
                return '#28a745';
            default:
                return '#6c757d';
        }
    };

    return(
        <div className="min-vh-100 bg-light">
            <div className="container py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="mb-0">Инциденты ({total})</h2>
                    <button 
                        className="btn btn-sm"
                        onClick={() => navigate('/add')}
                        style={{backgroundColor: '#7c3aed', color: 'white', borderColor: '#7c3aed'}}
                    >
                        <i className="bi bi-plus-lg me-1"></i>Добавить инцидент
                    </button>
                </div>

                <ErrorAlert error={error} />

                {/* Фильтры */}
                <div className="card mb-4 shadow-sm">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label small text-muted">Статус</label>
                                <select 
                                    className="form-select form-select-sm"
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <option value="">Все</option>
                                    <option value="Открыт">Открыт</option>
                                    <option value="В работе">В работе</option>
                                    <option value="Закрыт">Закрыт</option>
                                </select>
                            </div>
                            
                            <div className="col-md-3">
                                <label className="form-label small text-muted">Критичность</label>
                                <select 
                                    className="form-select form-select-sm"
                                    value={criticalityFilter}
                                    onChange={(e) => {
                                        setCriticalityFilter(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <option value="">Все</option>
                                    <option value="Высокая">Высокая</option>
                                    <option value="Средняя">Средняя</option>
                                    <option value="Низкая">Низкая</option>
                                </select>
                            </div>
                            
                            <div className="col-md-4">
                                <label className="form-label small text-muted">Поиск по судну</label>
                                <input 
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Название судна"
                                    value={shipFilter}
                                    onChange={(e) => {
                                        setShipFilter(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>

                            <div className="col-md-2 d-flex align-items-end">
                                <button 
                                    className="btn btn-outline-secondary btn-sm w-100"
                                    onClick={handleResetFilters}
                                >
                                    <i className="bi bi-arrow-clockwise me-1"></i>Сброс
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <Spinner />
                ) : incidents.length === 0 ? (
                    <div className="alert alert-info text-center mt-4">
                        <i className="bi me-2"></i>
                        Нет инцидентов, соответствующих фильтрам
                    </div>
                ) : (
                    <>
                        <div className="row g-3">
                            {incidents.map(incident => (
                                <div key={incident.id} className="col-md-6 col-lg-4">
                                    <div 
                                        className="card h-100 shadow-sm cursor-pointer transition"
                                        onClick={() => navigate(`/detail/${incident.id}`)}
                                        style={{cursor: 'pointer', transition: 'transform 0.2s'}}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h5 className="card-title mb-0" style={{fontSize: '1rem'}}>
                                                    {incident.title}
                                                </h5>
                                                <span className={`badge ${getStatusClass(incident.status)}`}>
                                                    {incident.status}
                                                </span>
                                            </div>
                                            
                                            <div className="mb-3">
                                                <small className="text-muted">
                                                    <i className="bi bi-ship me-1"></i>
                                                    {incident.vessel_name || 'Судно не указано'}
                                                </small>
                                            </div>

                                            <p className="card-text text-muted small mb-3">
                                                {incident.type}
                                            </p>

                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <span className="badge" style={{backgroundColor: getSeverityColor(incident.criticality)}}>
                                                        {incident.criticality}
                                                    </span>
                                                </div>
                                                <small className="text-muted">
                                                    {incident.created_at}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {pages > 1 && (
                            <nav className="mt-4" aria-label="Page navigation">
                                <ul className="pagination justify-content-center">
                                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                        <button 
                                            className="page-link"
                                            onClick={() => setPage(1)}
                                            disabled={page === 1}
                                        >
                                            Первая
                                        </button>
                                    </li>
                                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                        <button 
                                            className="page-link"
                                            onClick={() => setPage(page - 1)}
                                            disabled={page === 1}
                                        >
                                            Предыдущая
                                        </button>
                                    </li>

                                    {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                                        let pageNum;
                                        if (pages <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= pages - 2) {
                                            pageNum = pages - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }
                                        return (
                                            <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}>
                                                <button 
                                                    className="page-link"
                                                    onClick={() => setPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            </li>
                                        );
                                    })}

                                    <li className={`page-item ${page === pages ? 'disabled' : ''}`}>
                                        <button 
                                            className="page-link"
                                            onClick={() => setPage(page + 1)}
                                            disabled={page === pages}
                                        >
                                            Следующая
                                        </button>
                                    </li>
                                    <li className={`page-item ${page === pages ? 'disabled' : ''}`}>
                                        <button 
                                            className="page-link"
                                            onClick={() => setPage(pages)}
                                            disabled={page === pages}
                                        >
                                            Последняя
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        )}

                        <div className="text-center mt-3 text-muted small">
                            Страница {page} из {pages} | Показано {incidents.length} из {total}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Home;
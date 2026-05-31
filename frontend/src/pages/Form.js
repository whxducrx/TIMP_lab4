import React, {useState, useEffect} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {addIncident, putIncident, getIncidentById, getAllVessels} from '../services/api';
import Spinner from '../components/Spinner';
import ErrorAlert from '../components/ErrorAlert';

function Form(){
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const navigate = useNavigate();
    const [vessels, setVessels] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        vessel_id: '',
        type: '',
        placement: '',
        description: '',
        criticality: 'Средняя',
        status: 'Открыт'
    });
    const [loading, setLoading] = useState(!!editId);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [validation, setValidation] = useState({});

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        loadVessels();
        if(editId){
            fetchIncident();
        }
    }, [editId]);

    const loadVessels = async () => {
        try {
            const data = await getAllVessels();
            setVessels(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Ошибка при загрузке судов:', err);
            setError('Не удалось загрузить список судов');
        }
    };

    const calculateCriticality = (data) => {
        let score = 0;
        const placementLower = data.placement.toLowerCase();
        
        if(placementLower.includes('машин') || placementLower.includes('котел') || placementLower.includes('трюм')){
            score += 5;
        }else if(placementLower.includes('море') || placementLower.includes('океан') || placementLower.includes('река')){
            score += 5;
        }else if(placementLower.includes('палуба') || placementLower.includes('каюта') || placementLower.includes('капитанск')){
            score += 4;
        }else if(placementLower.includes('город') || placementLower.includes('порт')){
            score += 3;
        }else if(placementLower.includes('село') || placementLower.includes('деревня')){
            score += 1;
        }else if(data.placement.trim().length > 0){
            score += 2;
        }

        const typeLower = data.type.toLowerCase();
        if(typeLower.includes('пожар') || typeLower.includes('взрыв')){
            score += 5;
        }else if(typeLower.includes('утечка') || typeLower.includes('затопление')){
            score += 4;
        }else if(typeLower.includes('столкнове') || typeLower.includes('повреждение')){
            score += 3;
        }else if(typeLower.includes('мелк') || typeLower.includes('небольш')){
            score += 1;
        }else if(data.type.trim().length > 0){
            score += 2;
        }

        if(data.title.length > 50){
            score += 2;
        }else if(data.title.length > 25){
            score += 1;
        }

        if(data.description.length > 150){
            score += 2;
        }else if(data.description.length > 50){
            score += 1;
        }

        if(data.vessel_id){
            score += 1;
        }

        if(score >= 11){
            return 'Высокая';
        }
        if(score >= 6){
            return 'Средняя';
        }
        return 'Низкая';
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const newCriticality = calculateCriticality(formData);
        if(newCriticality !== formData.criticality){
            setFormData(prev => ({
                ...prev,
                criticality: newCriticality
            }));
        }
    }, [formData.title, formData.vessel_id, formData.type, formData.placement, formData.description]);

    const fetchIncident = async () => {
        try{
            setLoading(true);
            setError('');
            const data = await getIncidentById(parseInt(editId));
            setFormData({
                title: data.title,
                vessel_id: data.vessel_id || '',
                type: data.type,
                placement: data.placement,
                description: data.description,
                criticality: data.criticality,
                status: data.status
            });
        }catch(err){
            setError('Ошибка при загрузке данных инцидента');
        }finally{
            setLoading(false);
        }
    };

    const validateForm = () => {
        const errors = {};

        if(!formData.title.trim()){
            errors.title = 'Название обязательно';
        }
        if(!formData.vessel_id){
            errors.vessel_id = 'Судно обязательно';
        }
        if(!formData.type.trim()){
            errors.type = 'Тип инцидента обязателен';
        }
        if(!formData.placement.trim()){
            errors.placement = 'Место обязательно';
        }

        setValidation(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'vessel_id' ? (value ? parseInt(value) : '') : value
        }));
        if(validation[name]){
            setValidation(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if(!validateForm()){
            return;
        }

        try{
            setSubmitting(true);
            setError('');

            const submitData = {
                ...formData,
                vessel_id: formData.vessel_id ? parseInt(formData.vessel_id) : null
            };

            if(editId){
                await putIncident(parseInt(editId), submitData);
            }else{
                await addIncident(submitData);
            }
            
            navigate('/');
        }catch(err){
            const status = err.response?.status;
            let errorMsg = `Ошибка при сохранении данных (${status})`;
            if(status === 400){
                errorMsg = `Некорректные данные (400)`;
            }else if(status === 404){
                errorMsg = `Инцидент не найден (404)`;
            }else if(status === 500){
                errorMsg = `Ошибка сервера (500)`;
            }
            setError(errorMsg);
            setSubmitting(false);
        }
    };

    if(loading){
        return <Spinner />;
    }

    return(
        <div className="min-vh-100 bg-light">
            <div className="container py-4">
                <ErrorAlert error={error} />
                <div className="row">
                    <div className="col-md-8 mx-auto">
                        <div className="card shadow-sm">
                            <div className="card-header" style={{backgroundColor: '#7c3aed', color: 'white'}}>
                                <h5 className="mb-0">
                                    {editId ? 'Редактирование инцидента' : 'Новый инцидент'}
                                </h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="title" className="form-label">
                                            Название инцидента <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${validation.title ? 'is-invalid' : ''}`}
                                            id="title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            maxLength={100}
                                            placeholder="Введите название"
                                        />
                                        {validation.title && (
                                            <div className="invalid-feedback d-block">
                                                {validation.title}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="vessel_id" className="form-label">
                                            Судно <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className={`form-select ${validation.vessel_id ? 'is-invalid' : ''}`}
                                            id="vessel_id"
                                            name="vessel_id"
                                            value={formData.vessel_id}
                                            onChange={handleChange}
                                        >
                                            <option value="">Выберите судно</option>
                                            {vessels.map(vessel => (
                                                <option key={vessel.id} value={vessel.id}>
                                                    {vessel.name} {vessel.imo_number ? `(IMO: ${vessel.imo_number})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {validation.vessel_id && (
                                            <div className="invalid-feedback d-block">
                                                {validation.vessel_id}
                                            </div>
                                        )}
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="type" className="form-label">
                                                Тип инцидента <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className={`form-select ${validation.type ? 'is-invalid' : ''}`}
                                                id="type"
                                                name="type"
                                                value={formData.type}
                                                onChange={handleChange}
                                            >
                                                <option value="">Выберите тип</option>
                                                <option value="Пожар">Пожар</option>
                                                <option value="Взрыв">Взрыв</option>
                                                <option value="Утечка">Утечка</option>
                                                <option value="Затопление">Затопление</option>
                                                <option value="Столкновение">Столкновение</option>
                                                <option value="Повреждение">Повреждение</option>
                                                <option value="Техническое нарушение">Техническое нарушение</option>
                                                <option value="Мелкий инцидент">Мелкий инцидент</option>
                                                <option value="Другое">Другое</option>
                                            </select>
                                            {validation.type && (
                                                <div className="invalid-feedback d-block">
                                                    {validation.type}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="placement" className="form-label">
                                                Место происшествия <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${validation.placement ? 'is-invalid' : ''}`}
                                                id="placement"
                                                name="placement"
                                                value={formData.placement}
                                                onChange={handleChange}
                                                maxLength={100}
                                                placeholder="Введите место происшествия"
                                            />
                                            {validation.placement && (
                                                <div className="invalid-feedback d-block">
                                                    {validation.placement}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="criticality" className="form-label">
                                            Критичность 
                                        </label>
                                        <select
                                            className="form-select"
                                            id="criticality"
                                            name="criticality"
                                            value={formData.criticality}
                                            disabled
                                        >
                                            <option value="Высокая">Высокая</option>
                                            <option value="Средняя">Средняя</option>
                                            <option value="Низкая">Низкая</option>
                                        </select>
                                    </div>

                                    {editId && (
                                        <div className="mb-3">
                                            <label htmlFor="status" className="form-label">
                                                Статус
                                            </label>
                                            <select
                                                className="form-select"
                                                id="status"
                                                name="status"
                                                value={formData.status}
                                                onChange={handleChange}
                                            >
                                                <option value="Открыт">Открыт</option>
                                                <option value="В работе">В работе</option>
                                                <option value="Закрыт">Закрыт</option>
                                            </select>
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <label htmlFor="description" className="form-label">
                                            Описание
                                        </label>
                                        <textarea
                                            className="form-control"
                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={6}
                                            maxLength={500}
                                            placeholder="Подробное описание инцидента"
                                        ></textarea>
                                        <small className="text-muted">
                                            {formData.description.length}/500
                                        </small>
                                    </div>

                                    <div className="d-flex gap-2">
                                        <button
                                            type="submit"
                                            className="btn btn-sm"
                                            disabled={submitting}
                                            style={{backgroundColor: '#7c3aed', color: 'white', borderColor: '#7c3aed'}}
                                        >
                                            {submitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Сохранение...
                                                </>
                                            ) : (
                                                <>
                                                    {editId ? 'Обновить' : 'Добавить'}
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => navigate('/')}
                                            disabled={submitting}
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Form;
import React from 'react';

function Spinner(){
    return(
        <div className="d-flex justify-content-center align-items-center" style={{height: '400px'}}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Загрузка...</span>
            </div>
        </div>
    );
}

export default Spinner;

import React from 'react';

function ErrorAlert({error}){
    if(!error){
        return null;
    }

    return(
        <div className="alert alert-danger" role="alert">
            <strong>Ошибка:</strong> {error}
        </div>
    );
}

export default ErrorAlert;

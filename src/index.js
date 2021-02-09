import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import PageRenderer from './components/PageRenderer';
import firestore, { firebase, auth, useDocumentData, useAuthState } from './firestore';
import './index.scss';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
    <React.StrictMode>
        <PageRenderer />
    </React.StrictMode>,
    document.getElementById('root')
);

// reportWebVitals(console.log) || https://bit.ly/CRA-vitals
reportWebVitals();

import React from 'react';
import { firebase, auth } from '../firestore';
// Icons
import FacebookLogo from '../icons/facebook_logo.png';
import GoogleLogo from '../icons/google_logo.png';

export default function SignIn() {
    return (
        <div className='sign-in-panel'>
            <div className='background'>
                <img src='./nadeko.png' alt='' />
            </div>
            <h2>Sign in with</h2>

            <button className='sign-in google' onClick={() => {
                const provider = new firebase.auth.GoogleAuthProvider();
                auth.signInWithRedirect(provider);
            }}>
                <img alt='Google Logo' className='google-logo' src={GoogleLogo} width={50} height={50} />
                Google
            </button>

            <button className='sign-in facebook' onClick={() => {
                const provider = new firebase.auth.FacebookAuthProvider();
                auth.signInWithRedirect(provider);
            }}>
                <img alt='Facebook Logo' className='facebook-logo' src={FacebookLogo} width={50} height={50} />
                Facebook
            </button>
        </div>
    );
};

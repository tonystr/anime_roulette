import React from 'react';
import { firebase, auth } from '../firestore';
// Icons
import FacebookLogo from '../icons/facebook_logo.png';
import GoogleLogo from '../icons/google_logo.png';

export default function SignIn() {
    return (
        <div className='sign-in-page'>
            <div className='background'>
                <img src='./nadeko.png' alt='' />
            </div>
            <div className='middle-center'>
                <div className='info'>
                    <h2>ようこそ！</h2>
                    <p>
                        Anime Roulette is a web app for making anime-focused roulette wheels.
                        Add series you want to watch to the wheel, and click the wheel to pick a series randomly!
                    </p>
                </div>
                <div className='vertical-seperator' />
                <div className='sign-in-panel'>
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
            </div>
        </div>
    );
};

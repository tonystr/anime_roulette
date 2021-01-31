import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

firebase.initializeApp({
    apiKey: 'AIzaSyCKEr3NLxFL9SXJuONJONhQAZct6Yqt2AY',
    authDomain: 'anime-roulette.firebaseapp.com',
    projectId: 'anime-roulette',
    storageBucket: 'anime-roulette.appspot.com',
    messagingSenderId: '5143254771',
    appId: '1:5143254771:web:bc9f978bb85bff4cdb8986'
});
const auth = firebase.auth();
const firestore = firebase.firestore();

export { auth, firebase };
export default firestore;

import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import './App.css';
import Dropzone from 'react-dropzone';

// Initialize Firebase with your configuration values
firebase.initializeApp({
  apiKey: "AIzaSyAnQHTDMUvE4NOVQsNCezxcINYZNpiFVKY",
  authDomain: "file-uploader-6dfc5.firebaseapp.com",
  projectId: "file-uploader-6dfc5",
  storageBucket: "file-uploader-6dfc5.appspot.com",
  messagingSenderId: "445171202164",
  appId: "1:445171202164:web:9290b7b5f42831523ab921",
  measurementId: "G-PBCFCVSP2W"
});

const db = firebase.firestore();
const storage = firebase.storage();

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        fetchDisplayName(user.uid);
        fetchFiles(user.uid);
      } else {
        setUser(null);
        setDisplayName('');
        setFiles([]);
      }
    });
  }, []);

  const fetchFiles = async (userId) => {
    try {
      const filesRef = db.collection('users').doc(userId).collection('files');
      const snapshot = await filesRef.get();
      const filesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFiles(filesData);
    } catch (error) {
      console.log('Error fetching files:', error);
    }
  };

  const fetchDisplayName = async (userId) => {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const { email: userEmail } = userDoc.data();
        const username = userEmail.substring(0, userEmail.indexOf('@'));
        setDisplayName(username);
      }
    } catch (error) {
      console.log('Error fetching display name:', error);
    }
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      setError(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFileDrop = async (acceptedFiles) => {
    try {
      const file = acceptedFiles[0];
      const storageRef = storage.ref();
      const fileRef = storageRef.child(`files/${user.uid}/${file.name}`);
      await fileRef.put(file);
      
      const downloadURL = await fileRef.getDownloadURL();

      await db
        .collection('users')
        .doc(user.uid)
        .collection('files')
        .add({
          name: file.name,
          url: downloadURL,
        });

      setFiles((prevFiles) => [
        ...prevFiles,
        { id: file.name, name: file.name, url: downloadURL },
      ]);
    } catch (error) {
      console.log('Error uploading file:', error);
    }
  };

  const handleFileDelete = async (fileId) => {
    try {
      await db
        .collection('users')
        .doc(user.uid)
        .collection('files')
        .doc(fileId)
        .delete();

      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
    } catch (error) {
      console.log('Error deleting file:', error);
    }
  };

  return (
    <div className="container">
      <h2 className="title">File Uploader App</h2>
      {user ? (
        <div className="loggedIn">
          <p className="welcome">Welcome, {displayName || user.email}!</p>
          <Dropzone onDrop={handleFileDrop} className="dropzone">
            {({ getRootProps, getInputProps }) => (
              <div {...getRootProps()} className="dropzone-container">
                <input {...getInputProps()} />
                <p className="dropzone-text">Drag and drop files here, or click to select files</p>
              </div>
            )}
          </Dropzone>
          <div className="file-list">
            {files.map((file) => (
              <div key={file.id} className="file-item">
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  {file.name}
                </a>
                <button className="delete-button" onClick={() => handleFileDelete(file.id)}>Delete</button>
              </div>
            ))}
          </div>
          <button className="logout-button" onClick={() => firebase.auth().signOut()}>Logout</button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
            <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>
          <button type="submit" className="login-button">Login</button>
          {error && <p className="error-message">{error}</p>}
        </form>
      )}
    </div>
  );
}

export default App;







  
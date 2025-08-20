import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/userContext';
import toast from 'react-hot-toast';

// --- ICONS ---
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const LogoutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const CameraIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-3.2-5c0 1.77 1.43 3.2 3.2 3.2s3.2-1.43 3.2-3.2-1.43-3.2-3.2-3.2-3.2 1.43-3.2 3.2z"></path></svg>;
const DEFAULT_AVATAR = "https://ssl.gstatic.com/accounts/ui/avatar_2x.png"; // A generic placeholder

const ProfileSidebar = ({ isOpen, onClose }) => {
    const { user, updateUser, logoutUser } = useUserContext();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [name, setName] = useState('');
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [previewPhoto, setPreviewPhoto] = useState(DEFAULT_AVATAR);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            // Only update preview if user.photo is valid, otherwise keep the default
            setPreviewPhoto(user.photo || DEFAULT_AVATAR);
        }
    }, [user, isOpen]);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePhoto(file);
            setPreviewPhoto(URL.createObjectURL(file)); // Show local preview
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', name);
        if (profilePhoto) {
            formData.append('photo', profilePhoto);
        }
        await updateUser(e, formData);
        onClose();
    };

    const handleLogout = () => {
        logoutUser();
        onClose();
    };

    const goToChangePassword = () => {
        navigate('/change-password');
        onClose();
    };

    return (
        <>
            <style>{`
                .profile-sidebar-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.4); z-index: 1000; opacity: ${isOpen ? 1 : 0}; visibility: ${isOpen ? 'visible' : 'hidden'}; transition: opacity 0.3s, visibility 0.3s; }
                .profile-sidebar { position: fixed; top: 0; right: 0; width: 360px; max-width: 90vw; height: 100%; background-color: #fff; box-shadow: -2px 0 8px rgba(0,0,0,0.15); z-index: 1001; transform: ${isOpen ? 'translateX(0)' : 'translateX(100%)'}; transition: transform 0.3s ease-in-out; display: flex; flex-direction: column; }
                .sidebar-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #dadce0; }
                .sidebar-header h2 { margin: 0; font-size: 20px; font-weight: 500; }
                .close-btn { background: none; border: none; cursor: pointer; padding: 4px; }
                .sidebar-content { padding: 32px 24px; text-align: center; }
                .profile-picture-container { position: relative; width: 96px; height: 96px; margin: 0 auto 16px; }
                .profile-picture { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
                .profile-picture-edit-btn { position: absolute; bottom: 0; right: 0; background-color: #1a73e8; color: white; border-radius: 50%; width: 32px; height: 32px; border: 2px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; }
                .profile-name { font-size: 18px; font-weight: 500; margin-top: 8px; }
                .profile-email { font-size: 14px; color: #5f6368; margin-top: 4px; }
                .sidebar-actions { margin-top: 32px; display: flex; flex-direction: column; gap: 12px; border-top: 1px solid #dadce0; padding-top: 24px; }
                .sidebar-btn { width: 100%; padding: 10px; font-size: 14px; border: 1px solid #dadce0; border-radius: 4px; background: transparent; cursor: pointer; text-align: center; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s; }
                .sidebar-btn:hover { background-color: #f1f3f4; }
                .update-form { margin-top: 24px; text-align: left; }
                .update-form label { font-size: 14px; font-weight: 500; }
                .update-form input { width: 100%; padding: 8px; margin-top: 4px; border-radius: 4px; border: 1px solid #dadce0; }
                .save-btn { width: 100%; padding: 10px; font-size: 14px; border: none; border-radius: 4px; background-color: #1a73e8; color: white; cursor: pointer; margin-top: 16px; }
            `}</style>
            <div className="profile-sidebar-overlay" onClick={onClose}></div>
            <aside className="profile-sidebar">
                <div className="sidebar-header">
                    <h2>Account</h2>
                    <button onClick={onClose} className="close-btn"><CloseIcon /></button>
                </div>
                <div className="sidebar-content">
                    <div className="profile-picture-container">
                        <img src={previewPhoto} alt="Profile" className="profile-picture" />
                        <div className="profile-picture-edit-btn" onClick={() => fileInputRef.current.click()} title="Change profile photo">
                            <CameraIcon />
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/png, image/jpeg" style={{ display: 'none' }} />
                    </div>
                    
                    <p className="profile-email">{user?.email}</p>

                    <form onSubmit={handleUpdateProfile} className="update-form">
                        <label htmlFor="name">Name</label>
                        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        <button type="submit" className="save-btn">Save Changes</button>
                    </form>

                    <div className="sidebar-actions">
                        <button className="sidebar-btn" onClick={goToChangePassword}>Change Password</button>
                        <button className="sidebar-btn" onClick={handleLogout}>
                            <LogoutIcon /> Sign Out
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default ProfileSidebar;
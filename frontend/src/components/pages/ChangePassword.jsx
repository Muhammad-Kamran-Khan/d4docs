import React from 'react';
import ChangePasswordForm from '../auth/ChangePassword'; // Adjust path if needed

const ChangePasswordPage = () => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#f8f9fa'
        }}>
            <ChangePasswordForm />
        </div>
    );
};

export default ChangePasswordPage;
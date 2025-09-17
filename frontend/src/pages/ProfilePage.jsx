/**
 * 마이페이지 컴포넌트
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ProfilePage() {
    const { user, updateUser, changePassword, logout } = useAuth();
    const navigate = useNavigate();
    
    // 프로필 수정 상태
    const [profileData, setProfileData] = useState({
        name: user?.name || ''
    });
    const [profileErrors, setProfileErrors] = useState({});
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState('');
    
    // 비밀번호 변경 상태
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirm: ''
    });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState('');

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (profileErrors[name]) {
            setProfileErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        setProfileMessage('');
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (passwordErrors[name]) {
            setPasswordErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        setPasswordMessage('');
        
        // 비밀번호 확인 실시간 검증
        if (name === 'new_password_confirm' || (name === 'new_password' && passwordData.new_password_confirm)) {
            const newPassword = name === 'new_password' ? value : passwordData.new_password;
            const confirmPassword = name === 'new_password_confirm' ? value : passwordData.new_password_confirm;
            
            if (newPassword && confirmPassword && newPassword !== confirmPassword) {
                setPasswordErrors(prev => ({
                    ...prev,
                    new_password_confirm: '새 비밀번호가 일치하지 않습니다'
                }));
            } else if (passwordErrors.new_password_confirm) {
                setPasswordErrors(prev => ({
                    ...prev,
                    new_password_confirm: ''
                }));
            }
        }
    };

    const validateProfileForm = () => {
        const errors = {};
        
        if (!profileData.name) {
            errors.name = '이름을 입력해주세요';
        } else if (profileData.name.length < 2) {
            errors.name = '이름은 2자 이상이어야 합니다';
        } else if (profileData.name.length > 50) {
            errors.name = '이름은 50자 이하여야 합니다';
        }
        
        return errors;
    };

    const validatePasswordForm = () => {
        const errors = {};
        
        if (!passwordData.current_password) {
            errors.current_password = '현재 비밀번호를 입력해주세요';
        }
        
        if (!passwordData.new_password) {
            errors.new_password = '새 비밀번호를 입력해주세요';
        } else if (passwordData.new_password.length < 8) {
            errors.new_password = '비밀번호는 8자 이상이어야 합니다';
        }
        
        if (!passwordData.new_password_confirm) {
            errors.new_password_confirm = '새 비밀번호 확인을 입력해주세요';
        } else if (passwordData.new_password !== passwordData.new_password_confirm) {
            errors.new_password_confirm = '새 비밀번호가 일치하지 않습니다';
        }
        
        if (passwordData.current_password === passwordData.new_password) {
            errors.new_password = '새 비밀번호는 현재 비밀번호와 달라야 합니다';
        }
        
        return errors;
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        
        const errors = validateProfileForm();
        if (Object.keys(errors).length > 0) {
            setProfileErrors(errors);
            return;
        }
        
        setIsUpdatingProfile(true);
        setProfileErrors({});
        
        const result = await updateUser(profileData);
        
        if (result.success) {
            setProfileMessage('프로필이 성공적으로 업데이트되었습니다.');
        } else {
            setProfileErrors({ submit: result.error });
        }
        
        setIsUpdatingProfile(false);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        const errors = validatePasswordForm();
        if (Object.keys(errors).length > 0) {
            setPasswordErrors(errors);
            return;
        }
        
        setIsChangingPassword(true);
        setPasswordErrors({});
        
        const result = await changePassword(passwordData);
        
        if (result.success) {
            setPasswordMessage(result.message);
            setPasswordData({
                current_password: '',
                new_password: '',
                new_password_confirm: ''
            });
            
            // 비밀번호 변경 후 자동 로그아웃 (보안상 이유)
            setTimeout(async () => {
                await logout();
                navigate('/login', { 
                    state: { 
                        message: '비밀번호가 변경되었습니다. 다시 로그인해주세요.' 
                    } 
                });
            }, 2000);
        } else {
            setPasswordErrors({ submit: result.error });
        }
        
        setIsChangingPassword(false);
    };

    if (!user) {
        return <div>로딩 중...</div>;
    }

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh' 
        }}>
            <Header />
            
            <main style={{ 
                flex: 1, 
                backgroundColor: '#f8f9fa',
                padding: '40px 20px'
            }}>
                <div style={{
                    maxWidth: '800px',
                    margin: '0 auto'
                }}>
                    <h1 style={{ 
                        textAlign: 'center', 
                        marginBottom: '40px',
                        color: '#2c3e50',
                        fontSize: '32px'
                    }}>
                        마이페이지
                    </h1>
                    
                    <div style={{
                        display: 'grid',
                        gap: '30px',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))'
                    }}>
                        {/* 프로필 정보 섹션 */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '30px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}>
                            <h2 style={{ 
                                marginBottom: '20px',
                                color: '#2c3e50',
                                fontSize: '24px'
                            }}>
                                프로필 정보
                            </h2>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <strong>이메일:</strong> {user.email}
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <strong>가입일:</strong> {new Date(user.created_at).toLocaleDateString('ko-KR')}
                            </div>
                            
                            <form onSubmit={handleProfileSubmit}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ 
                                        display: 'block', 
                                        marginBottom: '8px',
                                        fontWeight: '500',
                                        color: '#555'
                                    }}>
                                        이름
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={profileData.name}
                                        onChange={handleProfileChange}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: profileErrors.name ? '2px solid #e74c3c' : '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '16px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    {profileErrors.name && (
                                        <div style={{ 
                                            color: '#e74c3c', 
                                            fontSize: '14px', 
                                            marginTop: '5px' 
                                        }}>
                                            {profileErrors.name}
                                        </div>
                                    )}
                                </div>
                                
                                {profileErrors.submit && (
                                    <div style={{ 
                                        color: '#e74c3c', 
                                        fontSize: '14px', 
                                        marginBottom: '15px',
                                        padding: '10px',
                                        backgroundColor: '#fdf2f2',
                                        borderRadius: '6px',
                                        border: '1px solid #fecaca'
                                    }}>
                                        {profileErrors.submit}
                                    </div>
                                )}
                                
                                {profileMessage && (
                                    <div style={{ 
                                        color: '#27ae60', 
                                        fontSize: '14px', 
                                        marginBottom: '15px',
                                        padding: '10px',
                                        backgroundColor: '#f0f9f0',
                                        borderRadius: '6px',
                                        border: '1px solid #c3e6c3'
                                    }}>
                                        {profileMessage}
                                    </div>
                                )}
                                
                                <button
                                    type="submit"
                                    disabled={isUpdatingProfile}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: isUpdatingProfile ? '#95a5a6' : '#3498db',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        cursor: isUpdatingProfile ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isUpdatingProfile ? '업데이트 중...' : '프로필 업데이트'}
                                </button>
                            </form>
                        </div>
                        
                        {/* 비밀번호 변경 섹션 */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '30px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}>
                            <h2 style={{ 
                                marginBottom: '20px',
                                color: '#2c3e50',
                                fontSize: '24px'
                            }}>
                                비밀번호 변경
                            </h2>
                            
                            <form onSubmit={handlePasswordSubmit}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ 
                                        display: 'block', 
                                        marginBottom: '8px',
                                        fontWeight: '500',
                                        color: '#555'
                                    }}>
                                        현재 비밀번호
                                    </label>
                                    <input
                                        type="password"
                                        name="current_password"
                                        value={passwordData.current_password}
                                        onChange={handlePasswordChange}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: passwordErrors.current_password ? '2px solid #e74c3c' : '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '16px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    {passwordErrors.current_password && (
                                        <div style={{ 
                                            color: '#e74c3c', 
                                            fontSize: '14px', 
                                            marginTop: '5px' 
                                        }}>
                                            {passwordErrors.current_password}
                                        </div>
                                    )}
                                </div>
                                
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ 
                                        display: 'block', 
                                        marginBottom: '8px',
                                        fontWeight: '500',
                                        color: '#555'
                                    }}>
                                        새 비밀번호
                                    </label>
                                    <input
                                        type="password"
                                        name="new_password"
                                        value={passwordData.new_password}
                                        onChange={handlePasswordChange}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: passwordErrors.new_password ? '2px solid #e74c3c' : '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '16px',
                                            boxSizing: 'border-box'
                                        }}
                                        placeholder="8자 이상"
                                    />
                                    {passwordErrors.new_password && (
                                        <div style={{ 
                                            color: '#e74c3c', 
                                            fontSize: '14px', 
                                            marginTop: '5px' 
                                        }}>
                                            {passwordErrors.new_password}
                                        </div>
                                    )}
                                </div>
                                
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ 
                                        display: 'block', 
                                        marginBottom: '8px',
                                        fontWeight: '500',
                                        color: '#555'
                                    }}>
                                        새 비밀번호 확인
                                    </label>
                                    <input
                                        type="password"
                                        name="new_password_confirm"
                                        value={passwordData.new_password_confirm}
                                        onChange={handlePasswordChange}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: passwordErrors.new_password_confirm ? '2px solid #e74c3c' : '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '16px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    {passwordErrors.new_password_confirm && (
                                        <div style={{ 
                                            color: '#e74c3c', 
                                            fontSize: '14px', 
                                            marginTop: '5px' 
                                        }}>
                                            {passwordErrors.new_password_confirm}
                                        </div>
                                    )}
                                </div>
                                
                                {passwordErrors.submit && (
                                    <div style={{ 
                                        color: '#e74c3c', 
                                        fontSize: '14px', 
                                        marginBottom: '15px',
                                        padding: '10px',
                                        backgroundColor: '#fdf2f2',
                                        borderRadius: '6px',
                                        border: '1px solid #fecaca'
                                    }}>
                                        {passwordErrors.submit}
                                    </div>
                                )}
                                
                                {passwordMessage && (
                                    <div style={{ 
                                        color: '#27ae60', 
                                        fontSize: '14px', 
                                        marginBottom: '15px',
                                        padding: '10px',
                                        backgroundColor: '#f0f9f0',
                                        borderRadius: '6px',
                                        border: '1px solid #c3e6c3'
                                    }}>
                                        {passwordMessage}
                                    </div>
                                )}
                                
                                <button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: isChangingPassword ? '#95a5a6' : '#e74c3c',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        cursor: isChangingPassword ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isChangingPassword ? '변경 중...' : '비밀번호 변경'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
}
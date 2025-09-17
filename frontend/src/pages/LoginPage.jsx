/**
 * 로그인 페이지 컴포넌트
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function LoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // 로그인 후 이동할 경로 (이전 페이지 또는 홈)
    const from = location.state?.from?.pathname || '/';

    // 이미 로그인된 경우 리다이렉트
    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // 입력 시 해당 필드 에러 제거
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.email) {
            newErrors.email = '이메일을 입력해주세요';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = '올바른 이메일 형식을 입력해주세요';
        }
        
        if (!formData.password) {
            newErrors.password = '비밀번호를 입력해주세요';
        }
        
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        setIsSubmitting(true);
        setErrors({});
        
        const result = await login(formData.email, formData.password);
        
        if (result.success) {
            navigate(from, { replace: true });
        } else {
            setErrors({ submit: result.error });
        }
        
        setIsSubmitting(false);
    };

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh' 
        }}>
            <Header />
            
            <main style={{ 
                flex: 1, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                backgroundColor: '#f8f9fa',
                padding: '20px'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '40px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    width: '100%',
                    maxWidth: '400px'
                }}>
                    <h2 style={{ 
                        textAlign: 'center', 
                        marginBottom: '30px',
                        color: '#2c3e50',
                        fontSize: '28px'
                    }}>
                        로그인
                    </h2>
                    
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '8px',
                                fontWeight: '500',
                                color: '#555'
                            }}>
                                이메일
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: errors.email ? '2px solid #e74c3c' : '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '16px',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="이메일을 입력하세요"
                            />
                            {errors.email && (
                                <div style={{ 
                                    color: '#e74c3c', 
                                    fontSize: '14px', 
                                    marginTop: '5px' 
                                }}>
                                    {errors.email}
                                </div>
                            )}
                        </div>
                        
                        <div style={{ marginBottom: '30px' }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '8px',
                                fontWeight: '500',
                                color: '#555'
                            }}>
                                비밀번호
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: errors.password ? '2px solid #e74c3c' : '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '16px',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="비밀번호를 입력하세요"
                            />
                            {errors.password && (
                                <div style={{ 
                                    color: '#e74c3c', 
                                    fontSize: '14px', 
                                    marginTop: '5px' 
                                }}>
                                    {errors.password}
                                </div>
                            )}
                        </div>
                        
                        {errors.submit && (
                            <div style={{ 
                                color: '#e74c3c', 
                                fontSize: '14px', 
                                marginBottom: '20px',
                                textAlign: 'center',
                                padding: '10px',
                                backgroundColor: '#fdf2f2',
                                borderRadius: '6px',
                                border: '1px solid #fecaca'
                            }}>
                                {errors.submit}
                            </div>
                        )}
                        
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                width: '100%',
                                padding: '14px',
                                backgroundColor: isSubmitting ? '#95a5a6' : '#3498db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '16px',
                                fontWeight: '500',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            {isSubmitting ? '로그인 중...' : '로그인'}
                        </button>
                    </form>
                    
                    <div style={{ 
                        textAlign: 'center', 
                        marginTop: '20px',
                        fontSize: '14px',
                        color: '#666'
                    }}>
                        계정이 없으신가요?{' '}
                        <Link 
                            to="/register" 
                            style={{ 
                                color: '#3498db', 
                                textDecoration: 'none',
                                fontWeight: '500'
                            }}
                        >
                            회원가입
                        </Link>
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
}
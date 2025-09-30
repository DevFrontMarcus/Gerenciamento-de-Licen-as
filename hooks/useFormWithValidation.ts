
import { useState, useCallback } from 'react';

const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const useFormWithValidation = (initialState: Record<string, any> = {}) => {
    const [values, setValues] = useState<Record<string, any>>(initialState);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | string[]) => {
        if (Array.isArray(e)) {
            // Manual validation of all fields
            const newErrors: Record<string, string> = {};
            let isValid = true;
            e.forEach(name => {
                const value = values[name];
                if (!value) {
                    newErrors[name] = 'Este campo é obrigatório.';
                    isValid = false;
                } else if (name === 'email' && !isEmail(value)) {
                    newErrors[name] = 'Formato de email inválido.';
                    isValid = false;
                }
            });
            setErrors(newErrors);
            return isValid;
        } else {
            // OnChange validation
            const { name, value, type } = e.target;
            
            setValues(prev => ({...prev, [name]: value}));

            if ((type === 'text' || type === 'email' || type === 'number') && value.trim() === '') {
                setErrors(prev => ({ ...prev, [name]: 'Este campo é obrigatório.' }));
            } else if (type === 'email' && !isEmail(value)) {
                setErrors(prev => ({ ...prev, [name]: 'Formato de email inválido.' }));
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[name];
                    return newErrors;
                });
            }
        }
    }, [values]);

    const clearErrors = () => setErrors({});

    return { values, setValues, errors, validate, clearErrors };
};

import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("userToken");
        setUserToken(token);
    }, []);

    // LOGIN
    const login = (token) => {
        localStorage.setItem("userToken", token);
        setUserToken(token);
    };

    // LOGOUT
    const logout = () => {
        localStorage.removeItem("userToken");
        setUserToken(null);
    };

    return (
        <AuthContext.Provider value={{ userToken, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
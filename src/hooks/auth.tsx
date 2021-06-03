import React, {
    useState,
    createContext,
    useContext,
    ReactNode
} from 'react';

import * as Google from 'expo-google-app-auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthProviderProps {
    children: ReactNode;
}

interface User {
    id: string;
    name: string;
    email: string;
    photo?:string;
}

interface IAuthContextData {
    user: User;
    signInWithGoogle(): Promise<void>;
    signInWithApple(): Promise<void>;
}

const AuthContext = createContext({} as IAuthContextData);

function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User>({} as User);

    async function signInWithGoogle(){
        try {
            const result = await Google.logInAsync({
                iosClientId: '840522074959-t5aj1d6h9acrkn5q15im63tk63iundft.apps.googleusercontent.com',
                androidClientId: '840522074959-tg84mi523bu07s78gglo3tbpg48at4db.apps.googleusercontent.com',
                scopes: ['profile', 'email']
            });

            if(result.type === 'success') {
                const userLogged = {
                    id: String(result.user.id),
                    name: result.user.name!,
                    email: result.user.email!,
                    photo: result.user.photoUrl!
                };

                setUser(userLogged);
                await AsyncStorage.setItem('@gofinances:user', JSON.stringify(userLogged));
            }
        } catch (error) {
            throw new Error(error);
        }
    }

    async function signInWithApple(){
        try {
            const result = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL
                ]
            });

            if(result) {
                const userLogged = {
                    id: String(result.user),
                    name: result.fullName!.givenName!,
                    email: result.email!,
                    photo: undefined
                };

                setUser(userLogged);
                await AsyncStorage.setItem('@gofinances:user', JSON.stringify(userLogged));
            }
        } catch (error) {
            throw new Error(error);
        }
    }

    return(
        <AuthContext.Provider value={{
            user,
            signInWithGoogle,
            signInWithApple
        }}>
          { children }
        </AuthContext.Provider>
    )
}

function useAuth(){
    const context = useContext(AuthContext);

    return context;
}

export { AuthProvider, useAuth };
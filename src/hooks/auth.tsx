import React, {
    useState,
    createContext,
    useContext,
    ReactNode,
    useEffect
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
    signOut(): Promise<void>;
    userStoragedLoading: boolean;
}

const AuthContext = createContext({} as IAuthContextData);

function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User>({} as User);
    const [userStoragedLoading, setUserStoragedLoading] = useState(true);

    const userStoragedKey = '@gofinances:user';

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
                    name: result.user.givenName!,
                    email: result.user.email!,
                    photo: result.user.photoUrl!
                };

                setUser(userLogged);
                await AsyncStorage.setItem(userStoragedKey, JSON.stringify(userLogged));
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
                const name = result.fullName!.givenName!;
                const photo = `https://ui-avatars.com/api/?name=${name}&length=1`;
                const userLogged = {
                    id: String(result.user),
                    name,
                    email: result.email!,
                    photo
                };

                setUser(userLogged);
                await AsyncStorage.setItem(userStoragedKey, JSON.stringify(userLogged));
            }
        } catch (error) {
            throw new Error(error);
        }
    }

    async function signOut(){
        setUser({} as User);
        await AsyncStorage.removeItem(userStoragedKey);
    }

    useEffect(() => {
        async function loadUserStorageDate(){
            const userStoraged = await AsyncStorage.getItem(userStoragedKey);

            if(userStoraged){
                const userLogged = JSON.parse(userStoraged) as User;
                setUser(userLogged);
            }
            setUserStoragedLoading(false);
        }

        loadUserStorageDate();
    },[]);

    return(
        <AuthContext.Provider value={{
            user,
            signInWithGoogle,
            signInWithApple,
            signOut,
            userStoragedLoading
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
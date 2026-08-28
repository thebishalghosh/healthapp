import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'healthapp.access_token';

const tokenStorage = {
  get: () => SecureStore.getItemAsync(TOKEN_KEY),
  set: (token) => SecureStore.setItemAsync(TOKEN_KEY, token),
  remove: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};

export default tokenStorage;
// Switch to local by setting REACT_APP_USE_LOCAL=true in .env.local
const useLocal = process.env.REACT_APP_USE_LOCAL === 'true';

const API_URL = useLocal
  ? process.env.REACT_APP_API_LOCAL_URL
  : process.env.REACT_APP_API_URL;

export default API_URL;

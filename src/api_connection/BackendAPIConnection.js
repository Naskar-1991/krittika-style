const API_URL =
  window.location.hostname.includes('dev.krittikastyle.com')
    ? 'https://api.krittikastyle.com'
    : 'http://localhost:5500';

export default API_URL;
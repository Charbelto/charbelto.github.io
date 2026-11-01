import './fonts.js';
import './style.css';
import './legal.css';

document.getElementById('year')?.replaceChildren(String(new Date().getFullYear()));

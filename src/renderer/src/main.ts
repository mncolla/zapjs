import { mount } from 'svelte'

import './assets/main.css'
import App from './app.svelte'


const app = mount(App, {
  target: document.getElementById('app')!
})

export default app
